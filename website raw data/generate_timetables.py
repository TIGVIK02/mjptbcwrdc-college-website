#!/usr/bin/env python3
"""
MJPTBCW Consolidated Timetable -> Department/Year Timetable Generator

Usage:
    python generate_timetables.py "CONSOLIDATE TT (1) (3)-Latest Modified TT.xlsx"

Output:
    timetable_output/
        index.html
        data_quality_report.txt
        ba/
            year_1.html
            year_2.html
            year_3.html
        bcom_ca/
            year_1/
                section_a.html
                section_b.html
            year_2.html
            year_3.html
        bcom_ba/
            year_3.html
        bzc/
            year_1.html
            year_2.html
            year_3.html
        mpcs/
            year_1.html
            year_2.html
            year_3.html
        mscs/
            year_1.html
            year_2.html
            year_3.html

The parser is deliberately tolerant of:
- repeated title/header rows
- blank cells
- leading/trailing spaces
- different spellings such as "I MPCs- A"
- blank periods in the source Excel
- duplicate (programme, year, section, day) records

IMPORTANT:
The supplied workbook contains duplicate-looking Saturday records for some groups.
The script reports these in data_quality_report.txt and, by default, keeps the LAST
occurrence because it is the last value present in the workbook. Change
DUPLICATE_POLICY below to "first" if required.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from collections import defaultdict
from pathlib import Path

import openpyxl


# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------

PERIODS = [
    ("I",   "8:15 AM",  "9:15 AM"),
    ("II",  "9:15 AM", "10:15 AM"),
    ("III", "10:15 AM", "11:15 AM"),
    ("IV",  "11:30 AM", "12:30 PM"),
    ("V",   "12:30 PM", "1:30 PM"),
    ("VI",  "2:30 PM",  "3:30 PM"),
    ("VII", "3:30 PM",  "4:30 PM"),
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

# How duplicate (programme, year, section, day) records are handled:
#   "last"  = last row wins
#   "first" = first row wins
DUPLICATE_POLICY = "last"

# Department definitions.
DEPARTMENTS = {
    "BA": {
        "folder": "ba",
        "title": "B.A.",
        "match": lambda s: bool(re.fullmatch(r"[I1]\s+BA", s, re.I)
                                or re.fullmatch(r"II\s+BA", s, re.I)
                                or re.fullmatch(r"III\s+BA", s, re.I)),
    },
    "BCOM_CA": {
        "folder": "bcom_ca",
        "title": "B.Com. (Computer Applications)",
        "match": lambda s: bool(re.fullmatch(r"(?:I|II|III|1|2|3)\s+BCOM-CA(?:-[A-Z0-9]+)?", s, re.I)),
    },
    "BCOM_BA": {
        "folder": "bcom_ba",
        "title": "B.Com. (Business Administration)",
        "match": lambda s: bool(re.fullmatch(r"III\s+BCOM-BA", s, re.I)),
    },
    "BZC": {
        "folder": "bzc",
        "title": "B.Z.C.",
        "match": lambda s: bool(re.fullmatch(r"[I1]\s+BZC(?:-A)?", s, re.I)
                                or re.fullmatch(r"II\s+BZC(?:-A)?", s, re.I)
                                or re.fullmatch(r"III\s+BZC(?:-A)?", s, re.I)),
    },
    "MPCS": {
        "folder": "mpcs",
        "title": "M.P.Cs.",
        "match": lambda s: bool(re.fullmatch(r"[I1]\s+MPCs?\s*-?\s*A?", s, re.I)
                                or re.fullmatch(r"II\s+MPCs?", s, re.I)
                                or re.fullmatch(r"III\s+MPCs?", s, re.I)),
    },
    "MSCS": {
        "folder": "mscs",
        "title": "M.Sc.s",
        "match": lambda s: bool(re.fullmatch(r"[I1]\s+MSCs?", s, re.I)
                                or re.fullmatch(r"II\s+MSCs?", s, re.I)
                                or re.fullmatch(r"III\s+MSCs?", s, re.I)),
    },
}


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def clean(value) -> str:
    """Convert an Excel cell to clean text."""
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip()


def group_label(group_text: str) -> str:
    """Return a useful group label for the generated timetable."""
    s = clean(group_text)
    match = re.search(r"-([A-Z0-9]+)$", s, re.I)
    if match:
        return f"Section {match.group(1).upper()}"
    return ""


def parse_group_identity(group_text: str):
    """Extract year, programme, and an explicit section from YEAR/GROUP."""
    compact = re.sub(r"\s*[-]\s*", "-", clean(group_text).upper())
    match = re.fullmatch(r"(III|II|I|3|2|1)\s+(.+)", compact)
    if not match:
        return None

    year_token, programme_text = match.groups()
    year = {"I": 1, "1": 1, "II": 2, "2": 2, "III": 3, "3": 3}[year_token]
    programme_text = re.sub(r"\s+", "", programme_text)
    programme_patterns = (
        ("BCOM_CA", r"BCOM-CA(?:-([A-Z0-9]+))?"),
        ("BCOM_BA", r"BCOM-BA(?:-([A-Z0-9]+))?"),
        ("BA", r"BA(?:-([A-Z0-9]+))?"),
        ("BZC", r"BZC(?:-([A-Z0-9]+))?"),
        ("MPCS", r"MPCS?(?:-([A-Z0-9]+))?"),
        ("MSCS", r"MSCS?(?:-([A-Z0-9]+))?"),
    )
    for programme, pattern in programme_patterns:
        match = re.fullmatch(pattern, programme_text, re.I)
        if match:
            section = match.group(1).upper() if match.group(1) else None
            return year, programme, section
    return None


def find_department(group_text: str):
    s = clean(group_text)
    for key, info in DEPARTMENTS.items():
        if info["match"](s):
            return key, info
    return None, None


def is_header_row(values) -> bool:
    """Detect the actual timetable header row."""
    vals = [clean(v).upper() for v in values]
    return len(vals) >= 9 and vals[0] == "DAY/TIME" and vals[1] == "YEAR/GROUP"


def is_day(value) -> bool:
    return clean(value).title() in DAYS


def safe_filename(text: str) -> str:
    return re.sub(r"[^a-z0-9_-]+", "_", text.lower()).strip("_")


# ---------------------------------------------------------------------------
# PARSING
# ---------------------------------------------------------------------------

def parse_workbook(xlsx_path: Path):
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb[wb.sheetnames[0]]

    # records[programme][year][section][day] = list of records
    # Each record is {group, section, subjects}
    records = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(list))))
    warnings = []

    current_day = None
    header_seen = False
    source_rows = 0

    for row_no in range(1, ws.max_row + 1):
        values = [ws.cell(row_no, col).value for col in range(1, 10)]

        if is_header_row(values):
            header_seen = True
            current_day = None
            continue

        first = clean(values[0])
        second = clean(values[1])

        if is_day(first):
            current_day = first.title()
            # A day header can also contain the first group's row.
            if not second:
                continue

        if not header_seen or not current_day or not second:
            continue

        identity = parse_group_identity(second)
        if not identity:
            warnings.append(
                f"Row {row_no}: unrecognized YEAR/GROUP: {second!r}"
            )
            continue

        yr, dept_key, section = identity
        if dept_key not in DEPARTMENTS:
            warnings.append(f"Row {row_no}: unrecognized YEAR/GROUP: {second!r}")
            continue

        subjects = [clean(v) for v in values[2:9]]
        record = {
            "row": row_no,
            "group": second,
            "section": section,
            "group_label": group_label(second),
            "subjects": subjects,
        }

        records[dept_key][yr][section][current_day].append(record)
        source_rows += 1

    return records, warnings, ws.max_row, source_rows


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------

CSS = r"""
:root {
    --border: #222;
    --header: #eeeeee;
    --break: #f7f7f7;
    --text: #111;
}

* { box-sizing: border-box; }

body {
    margin: 0;
    padding: 28px;
    font-family: Arial, Helvetica, sans-serif;
    color: var(--text);
    background: #fff;
}

.page {
    max-width: 1800px;
    margin: 0 auto;
}

h1 {
    margin: 0 0 6px;
    text-align: center;
    font-size: 28px;
}

h2 {
    margin: 0 0 22px;
    text-align: center;
    font-size: 22px;
    font-weight: 600;
}

.meta {
    text-align: center;
    margin-bottom: 18px;
    font-size: 14px;
}

.table-wrap {
    width: 100%;
    overflow-x: auto;
}

table {
    width: 100%;
    min-width: 1100px;
    border-collapse: collapse;
    table-layout: fixed;
}

th, td {
    border: 1px solid var(--border);
    text-align: center;
    vertical-align: middle;
    padding: 12px 8px;
    overflow-wrap: anywhere;
}

thead th {
    background: var(--header);
    font-weight: 700;
}

.day {
    width: 10%;
    font-weight: 700;
}

.period {
    width: 10.5%;
}

.break-col {
    width: 3.2%;
    min-width: 42px;
    padding: 4px 2px;
    background: var(--break);
}

.break-col > div {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin: auto;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .3px;
}

.subject {
    min-height: 58px;
    font-size: 15px;
    font-weight: 600;
}

.timing {
    display: block;
    margin-top: 5px;
    font-size: 11px;
    font-weight: 400;
}

.group-heading {
    margin: 28px 0 10px;
    font-size: 18px;
}

.notice {
    padding: 10px 12px;
    border: 1px solid #999;
    margin: 12px 0;
    font-size: 13px;
}

.footer {
    margin-top: 18px;
    font-size: 12px;
    text-align: right;
}

@media print {
    body { padding: 8px; }
    .table-wrap { overflow: visible; }
    table { min-width: 0; }
    .subject { font-size: 12px; }
    th, td { padding: 7px 5px; }
}
"""


def render_table(day_data: dict[str, list[dict]]) -> str:
    parts = [
        '<div class="table-wrap"><table>',
        '<colgroup>',
        '<col class="day">',
    ]
    for _ in range(3):
        parts.append('<col class="period">')
    parts.append('<col class="break-col">')
    for _ in range(2):
        parts.append('<col class="period">')
    parts.append('<col class="break-col">')
    for _ in range(2):
        parts.append('<col class="period">')
    parts.append('</colgroup>')

    parts.append("<thead><tr>")
    parts.append("<th>DAY</th>")

    for code, start, end in PERIODS[:3]:
        parts.append(
            f'<th>{html.escape(code)}'
            f'<span class="timing">{start} – {end}</span></th>'
        )

    parts.append('<th class="break-col"><div>SHORT BREAK<br>11:15–11:30</div></th>')

    for code, start, end in PERIODS[3:5]:
        parts.append(
            f'<th>{html.escape(code)}'
            f'<span class="timing">{start} – {end}</span></th>'
        )

    parts.append('<th class="break-col"><div>LUNCH<br>1:30–2:30</div></th>')

    for code, start, end in PERIODS[5:]:
        parts.append(
            f'<th>{html.escape(code)}'
            f'<span class="timing">{start} – {end}</span></th>'
        )

    parts.append("</tr></thead><tbody>")

    for day in DAYS:
        rows = day_data.get(day, [])
        if not rows:
            rows = [{
                "group": "",
                "group_label": "",
                "subjects": [""] * 7,
                "row": None,
            }]

        # A section timetable normally has one row per day.
        for idx, rec in enumerate(rows):
            day_cell = day if idx == 0 else ""
            group_suffix = f' <small>({html.escape(rec["group_label"])})</small>' \
                if rec["group_label"] else ""

            parts.append("<tr>")
            parts.append(f"<td class='day'>{html.escape(day)}{group_suffix}</td>")

            for subject in rec["subjects"][:3]:
                value = html.escape(subject) if subject else "—"
                parts.append(f"<td class='subject'>{value}</td>")

            parts.append('<td class="break-col"></td>')

            for subject in rec["subjects"][3:5]:
                value = html.escape(subject) if subject else "—"
                parts.append(f"<td class='subject'>{value}</td>")

            parts.append('<td class="break-col"></td>')

            for subject in rec["subjects"][5:7]:
                value = html.escape(subject) if subject else "—"
                parts.append(f"<td class='subject'>{value}</td>")

            parts.append("</tr>")

    parts.append("</tbody></table></div>")
    return "\n".join(parts)


def render_page(dept_info, year, section, day_data, notes=None) -> str:
    notes = notes or []
    title = dept_info["title"]
    section_suffix = f" — Section {section}" if section else ""

    notice = ""
    if notes:
        notice = (
            '<div class="notice"><strong>Data-quality notice:</strong> '
            "This timetable has source-data warnings. See "
            "<code>data_quality_report.txt</code> for details.</div>"
        )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} — Year {year}{html.escape(section_suffix)} Timetable</title>
<style>{CSS}</style>
</head>
<body>
<div class="page">
    <h1>MJPTBCW RESIDENTIAL DEGREE COLLEGE FOR WOMEN</h1>
    <h2>STATION GHANPUR<br>{html.escape(title)} — Year {year}{html.escape(section_suffix)}</h2>
    <div class="meta">Time Table 2026–2027 (I, III, V Sem)</div>
    {notice}
    {render_table(day_data)}
    <div class="footer">Generated automatically from the consolidated Excel timetable.</div>
</div>
</body>
</html>
"""


def build_day_data(year_records):
    """
    Resolve duplicate programme/year/section/day records according to DUPLICATE_POLICY.
    Returns day -> selected records and duplicate warning strings.
    """
    output = {}
    warnings = []

    for day in DAYS:
        records = year_records.get(day, [])
        if not records:
            output[day] = []
            continue

        by_group = defaultdict(list)
        for rec in records:
            by_group[rec["section"]].append(rec)

        selected = []
        for _, items in by_group.items():
            if len(items) == 1:
                selected.append(items[0])
                continue

            rows = [x["row"] for x in items]
            group = items[0]["group"]
            warnings.append(
                f"Duplicate schedule for {group!r} on {day}: "
                f"source rows {rows}. Policy={DUPLICATE_POLICY!r}."
            )

            chosen = items[0] if DUPLICATE_POLICY == "first" else items[-1]
            selected.append(chosen)

        # Stable order matching the source workbook.
        selected.sort(key=lambda x: x["row"])
        output[day] = selected

    return output, warnings


def generate(records, warnings, output_dir: Path, source_name: str):
    output_dir.mkdir(parents=True, exist_ok=True)
    for old_file in output_dir.rglob("*.html"):
        old_file.unlink()

    all_warnings = list(warnings)
    generated_pages = []

    manifest = []

    for dept_key, dept_info in DEPARTMENTS.items():
        if dept_key not in records:
            continue

        dept_dir = output_dir / dept_info["folder"]
        dept_dir.mkdir(parents=True, exist_ok=True)

        for year in sorted(records[dept_key]):
            for section in sorted(records[dept_key][year], key=lambda value: value or ""):
                day_data, dup_warnings = build_day_data(records[dept_key][year][section])
                identity_label = f"{dept_info['title']} Year {year}"
                if section:
                    identity_label += f" Section {section}"
                for warning in dup_warnings:
                    all_warnings.append(f"[{identity_label}] {warning}")

                if section:
                    filename = dept_dir / f"year_{year}" / f"section_{safe_filename(section)}.html"
                else:
                    filename = dept_dir / f"year_{year}.html"
                filename.parent.mkdir(parents=True, exist_ok=True)
                filename.write_text(
                    render_page(dept_info, year, section, day_data, dup_warnings),
                    encoding="utf-8",
                )
                generated_pages.append((dept_key, year, section, dept_info, filename))
                manifest.append({
                    "programme": dept_key,
                    "title": dept_info["title"],
                    "year": year,
                    "section": section,
                    "path": filename.relative_to(output_dir).as_posix(),
                })

    # Index page
    links_by_dept = defaultdict(list)
    for dept_key, year, section, dept_info, filename in generated_pages:
        rel = filename.relative_to(output_dir).as_posix()
        label = f"Year {year}" + (f" — Section {section}" if section else "")
        links_by_dept[dept_key].append((label, rel, dept_info["title"]))

    cards = []
    for dept_key in DEPARTMENTS:
        items = links_by_dept.get(dept_key, [])
        if not items:
            continue

        dept_title = DEPARTMENTS[dept_key]["title"]
        links = " ".join(
            f'<a href="{html.escape(rel)}">{html.escape(label)}</a>'
            for label, rel, _ in items
        )
        cards.append(
            f"<section><h2>{html.escape(dept_title)}</h2>{links}</section>"
        )

    index_html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MJPTBCW Department-wise Timetables</title>
<style>
body {{ font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 0 20px; }}
h1 {{ text-align:center; }}
section {{ border:1px solid #ccc; padding:18px; margin:16px 0; border-radius:8px; }}
a {{ display:inline-block; margin:6px 8px 6px 0; padding:9px 13px; border:1px solid #555; text-decoration:none; color:#111; border-radius:5px; }}
</style>
</head>
<body>
<h1>MJPTBCW Department-wise Timetables</h1>
<p style="text-align:center">Generated from: {html.escape(source_name)}</p>
{''.join(cards)}
<p><a href="data_quality_report.txt">Open data-quality report</a></p>
</body>
</html>
"""
    (output_dir / "index.html").write_text(index_html, encoding="utf-8")
    (output_dir / "timetable_manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    report = [
        "MJPTBCW TIMETABLE DATA-QUALITY REPORT",
        "=" * 50,
        f"Source: {source_name}",
        f"Duplicate policy: {DUPLICATE_POLICY}",
        "",
    ]

    if all_warnings:
        report.append("WARNINGS:")
        report.extend(f"- {w}" for w in all_warnings)
    else:
        report.append("No parser warnings were detected.")

    report += [
        "",
        "Detected sections:",
    ]
    for dept_key in DEPARTMENTS:
        sections = sorted({
            entry["section"] for entry in manifest
            if entry["programme"] == dept_key and entry["section"]
        })
        if sections:
            report.append(
                f"- {DEPARTMENTS[dept_key]['title']}: "
                + ", ".join(f"Section {section}" for section in sections)
            )
    report += [
        "",
        "Generated files:",
    ]
    report.extend(
        f"- {dept_info['title']} — Year {year}"
        f"{f' — Section {section}' if section else ''}: "
        f"{filename.relative_to(output_dir)}"
        for _, year, section, dept_info, filename in generated_pages
    )

    (output_dir / "data_quality_report.txt").write_text(
        "\n".join(report) + "\n", encoding="utf-8"
    )

    return generated_pages, all_warnings


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate department/year-wise HTML timetables from the consolidated Excel timetable."
    )
    parser.add_argument("excel", type=Path, help="Path to the consolidated timetable .xlsx file")
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=Path("timetable_output"),
        help="Output directory (default: timetable_output)",
    )
    args = parser.parse_args()

    if not args.excel.exists():
        raise SystemExit(f"Excel file not found: {args.excel}")

    records, warnings, max_row, source_rows = parse_workbook(args.excel)

    generated, all_warnings = generate(
        records, warnings, args.output, args.excel.name
    )

    print("\nMJPTBCW TIMETABLE GENERATOR")
    print("=" * 45)
    print(f"Source rows scanned : {max_row}")
    print(f"Schedule rows read  : {source_rows}")
    print(f"HTML files generated: {len(generated)}")
    print(f"Output directory    : {args.output.resolve()}")
    print(f"Warnings            : {len(all_warnings)}")

    print("\nGenerated:")
    for _, year, section, info, filename in generated:
        section_label = f" - Section {section}" if section else ""
        print(f"  {info['title']} - Year {year}{section_label}: {filename}")

    if all_warnings:
        print("\nIMPORTANT: inspect data_quality_report.txt")
        print("The source workbook contains duplicate/ambiguous timetable records.")


if __name__ == "__main__":
    main()
