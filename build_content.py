#!/usr/bin/env python3
"""Build and audit the static website's generated content manifests."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
ASSETS = ROOT / "assets"
REPORT_PATH = ROOT / "content_build_report.txt"
SUPPORTED_MEDIA = {".jpg", ".jpeg", ".png", ".pdf"}
HOME_EXTENSIONS = SUPPORTED_MEDIA | {".svg", ".webp"}
IGNORED_DIRS = {".git", ".github", ".venv", "node_modules", "__pycache__"}


@dataclass
class BuildState:
    check_only: bool = False
    generated: dict[str, str] = field(default_factory=dict)
    generated_outputs: set[str] = field(default_factory=set)
    updated: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    unsupported: list[str] = field(default_factory=list)
    json_audit: list[dict[str, str]] = field(default_factory=list)


def web_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def relative_key(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def direct_files(folder: Path, extensions: set[str]) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        (item for item in folder.iterdir() if item.is_file() and item.suffix.lower() in extensions),
        key=lambda item: item.name.casefold(),
    )


def recursive_files(folder: Path, extensions: set[str]) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        (item for item in folder.rglob("*") if item.is_file() and item.suffix.lower() in extensions),
        key=lambda item: relative_key(item).casefold(),
    )


def build_media_manifest() -> dict[str, Any]:
    gallery_root = ASSETS / "images" / "gallery"
    gallery = []
    if gallery_root.is_dir():
        folders = sorted((item for item in gallery_root.iterdir() if item.is_dir()), key=lambda item: item.name.casefold())
        for folder in folders:
            gallery.append({
                "category": folder.name,
                "files": [web_path(item) for item in direct_files(folder, SUPPORTED_MEDIA)],
            })
    return {
        "collegeLife": [web_path(item) for item in direct_files(ASSETS / "images" / "college_life_in_focus", HOME_EXTENSIONS)],
        "campusLife": [web_path(item) for item in direct_files(ASSETS / "images" / "campus_life", HOME_EXTENSIONS)],
        "gallery": gallery,
    }


def year_from_name(name: str) -> int | None:
    match = re.search(r"(?:^|[^0-9])((?:19|20)\d{2})(?!\d)", name)
    return int(match.group(1)) if match else None


def display_name(path: Path) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[_-]+", " ", path.stem)).strip()


def build_pdf_manifest(folder_name: str) -> list[dict[str, Any]]:
    folder = ASSETS / folder_name
    records = []
    for path in recursive_files(folder, {".pdf"}):
        records.append({
            "title": display_name(path),
            "year": year_from_name(path.name),
            "pdf": web_path(path),
        })
    return sorted(
        records,
        key=lambda record: (
            record["year"] is None,
            -(record["year"] or 0),
            record["title"].casefold(),
            record["pdf"].casefold(),
        ),
    )


def build_notice_metadata() -> str:
    records = []
    for path in direct_files(ASSETS / "notice_files", {".pdf"}):
        records.append(f"TITLE={path.stem}\nPDF={path.name}\n")
    return "\n".join(records)


GENERATORS: dict[str, Callable[[], Any]] = {
    "data/media-manifest.json": build_media_manifest,
    "data/pyq.json": lambda: build_pdf_manifest("pyq"),
    "data/magazine.json": lambda: build_pdf_manifest("magazine"),
}

GENERATED_TEXT = {"assets/notice_files/pdf-notices.txt": build_notice_metadata}


def json_text(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def atomic_write(path: Path, content: str) -> None:
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(content, encoding="utf-8", newline="\n")
    temporary.replace(path)


def file_hash(path: Path) -> bytes:
    return path.read_bytes() if path.is_file() else b""


def discover_json_files() -> list[Path]:
    files = []
    for path in ROOT.rglob("*.json"):
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        files.append(path)
    return sorted(files, key=lambda path: relative_key(path).casefold())


def classify_json(path: Path) -> tuple[str, str]:
    key = relative_key(path)
    if key in GENERATORS:
        return "GENERATED", "known source-to-manifest generator"
    if key == "website raw data/timetable_output/timetable_manifest.json":
        return "GENERATED", "website raw data/generate_timetables.py"
    if key.startswith("dev-samples/"):
        return "DEVELOPMENT", "development fixture"
    if key.startswith(".vscode/"):
        return "EXTERNAL", "editor configuration"
    return "UNKNOWN", "no safe generator/source mapping identified"


def parse_json(path: Path, state: BuildState) -> Any | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        state.errors.append(f"INVALID JSON: {relative_key(path)}: {error}")
        return None


def case_mismatch(path_text: str) -> bool:
    path = Path(path_text.replace("/", "\\"))
    if path.is_absolute() or not path.parts:
        return False
    current = ROOT
    for part in path.parts:
        if not current.is_dir():
            return False
        matches = [child.name for child in current.iterdir() if child.name.casefold() == part.casefold()]
        if not matches:
            return False
        if part not in matches:
            return True
        current = current / part
    return False


def looks_like_reference(value: str, key: str) -> bool:
    lower = value.lower()
    return key.lower() in {"pdf", "path", "file", "files", "image", "src"} or lower.startswith(("assets/", "website raw data/"))


def validate_references(value: Any, state: BuildState, owner: str, key: str = "") -> None:
    if isinstance(value, dict):
        for child_key, child_value in value.items():
            validate_references(child_value, state, owner, str(child_key))
        return
    if isinstance(value, list):
        for child_value in value:
            validate_references(child_value, state, owner, key)
        return
    if not isinstance(value, str) or not looks_like_reference(value, key):
        return
    if re.match(r"^(?:[A-Za-z]:[\\/]|/|https?://|data:)", value):
        if re.match(r"^[A-Za-z]:[\\/]", value):
            state.errors.append(f"ABSOLUTE PATH: {owner}: {value}")
        return
    normalized = value.replace("\\", "/")
    base = ROOT / "website raw data" / "timetable_output" if owner == "website raw data/timetable_output/timetable_manifest.json" else ROOT
    target = base / Path(normalized)
    if not target.is_file():
        if case_mismatch(normalized):
            state.errors.append(f"CASE MISMATCH: {owner}: {value}")
        else:
            state.errors.append(f"MISSING REFERENCE: {owner}: {value}")
    elif "\\" in value:
        state.errors.append(f"WINDOWS PATH SEPARATOR: {owner}: {value}")


def duplicate_paths(value: Any, state: BuildState, owner: str) -> None:
    paths: list[str] = []

    def collect(item: Any) -> None:
        if isinstance(item, dict):
            for key, child in item.items():
                if key in {"pdf", "path", "file", "src"} and isinstance(child, str):
                    paths.append(child)
                else:
                    collect(child)
        elif isinstance(item, list):
            for child in item:
                collect(child)

    collect(value)
    seen: set[str] = set()
    for path in paths:
        normalized = path.casefold()
        if normalized in seen:
            state.errors.append(f"DUPLICATE REFERENCE: {owner}: {path}")
        seen.add(normalized)


def validate_shape(path: Path, value: Any, state: BuildState) -> None:
    key = relative_key(path)
    if key == "data/media-manifest.json":
        if not isinstance(value, dict) or not all(isinstance(value.get(name), list) for name in ("collegeLife", "campusLife", "gallery")):
            state.errors.append(f"INVALID STRUCTURE: {key}: expected collegeLife, campusLife, and gallery lists")
    elif key in {"data/pyq.json", "data/magazine.json"}:
        if not isinstance(value, list):
            state.errors.append(f"INVALID STRUCTURE: {key}: expected a list")
        else:
            for index, record in enumerate(value):
                if not isinstance(record, dict) or not isinstance(record.get("pdf"), str) or not isinstance(record.get("title"), str):
                    state.errors.append(f"INVALID RECORD: {key}[{index}]: expected title and pdf")
    elif key == "website raw data/timetable_output/timetable_manifest.json" and not isinstance(value, list):
        state.errors.append(f"INVALID STRUCTURE: {key}: expected a list")


def audit_json_files(state: BuildState) -> None:
    for path in discover_json_files():
        key = relative_key(path)
        classification, reason = classify_json(path)
        value = parse_json(path, state)
        status = "INVALID" if value is None else "VALID"
        action = "NOT MODIFIED"
        if classification == "GENERATED" and key in state.updated:
            action = "REBUILT"
        elif classification == "GENERATED" and key in state.unchanged:
            action = "UNCHANGED"
        state.json_audit.append({"path": key, "classification": classification, "status": status, "action": action, "reason": reason})
        if value is not None:
            validate_shape(path, value, state)
            validate_references(value, state, key)
            duplicate_paths(value, state, key)


def audit_source_folders(state: BuildState) -> None:
    folder_specs = {
        "assets/pyq": {".pdf"},
        "assets/magazine": {".pdf"},
        "assets/images/college_life_in_focus": HOME_EXTENSIONS,
        "assets/images/campus_life": HOME_EXTENSIONS,
    }
    for folder_name, supported in folder_specs.items():
        folder = ROOT / Path(folder_name)
        if not folder.is_dir():
            state.warnings.append(f"SOURCE FOLDER MISSING: {folder_name}")
            continue
        for path in folder.rglob("*"):
            if path.is_file() and path.name != ".gitkeep" and path.suffix.lower() not in supported:
                state.unsupported.append(f"{relative_key(path)} (supported: {', '.join(sorted(supported))})")
    gallery = ROOT / "assets/images/gallery"
    if gallery.is_dir():
        for path in gallery.rglob("*"):
            if path.is_file() and path.name != ".gitkeep" and path.suffix.lower() not in SUPPORTED_MEDIA:
                state.unsupported.append(f"{relative_key(path)} (supported: {', '.join(sorted(SUPPORTED_MEDIA))})")


def run_timetables(state: BuildState) -> None:
    source = ROOT / "website raw data" / "consol_tt.xlsx"
    generator = ROOT / "website raw data" / "generate_timetables.py"
    if not source.is_file() or not generator.is_file():
        state.warnings.append("TIMETABLES: skipped because consol_tt.xlsx or generate_timetables.py is missing")
        return
    if state.check_only:
        state.warnings.append("TIMETABLES: skipped in --check mode")
        return
    try:
        result = subprocess.run(
            [sys.executable, str(generator), source.name, "--output", "timetable_output"],
            cwd=source.parent,
            check=True,
            capture_output=True,
            text=True,
        )
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        warning_match = re.search(r"Warnings\s*:\s*(\d+)", result.stdout or "")
        if warning_match and int(warning_match.group(1)):
            state.warnings.append(f"TIMETABLES: delegated generator reported {warning_match.group(1)} warning(s)")
    except (OSError, subprocess.CalledProcessError) as error:
        state.errors.append(f"TIMETABLE BUILD FAILED: {error}")


def write_generated(path: Path, content: str, state: BuildState) -> None:
    key = relative_key(path)
    state.generated_outputs.add(key)
    state.generated[key] = content
    if path.is_file() and file_hash(path) == content.encode("utf-8"):
        state.unchanged.append(key)
        return
    state.updated.append(key)
    if not state.check_only:
        atomic_write(path, content)


def build_generated_content(state: BuildState) -> None:
    for key, generator in GENERATORS.items():
        output = ROOT / Path(key)
        try:
            value = generator()
            candidate_state = BuildState(check_only=True)
            validate_shape(output, value, candidate_state)
            validate_references(value, candidate_state, key)
            duplicate_paths(value, candidate_state, key)
            if candidate_state.errors:
                state.errors.extend(candidate_state.errors)
                continue
            write_generated(output, json_text(value), state)
        except Exception as error:
            state.errors.append(f"GENERATOR FAILED: {key}: {error}")
    for key, generator in GENERATED_TEXT.items():
        output = ROOT / Path(key)
        try:
            value = generator()
            write_generated(output, value + ("\n" if value else ""), state)
        except Exception as error:
            state.errors.append(f"GENERATOR FAILED: {key}: {error}")
    run_timetables(state)


def create_report(state: BuildState, started: datetime) -> str:
    completed = datetime.now(timezone.utc)
    lines = [
        "STATIC CONTENT BUILD REPORT",
        "=" * 72,
        f"Build started:   {started.isoformat()}",
        f"Build completed: {completed.isoformat()}",
        f"Mode: {'CHECK ONLY' if state.check_only else 'BUILD'}",
        "",
        "BUILD SUMMARY",
        "-" * 72,
        f"Files scanned: {len(discover_json_files())}",
        f"JSON files found: {len(state.json_audit)}",
        f"JSON files generated: {len([item for item in state.generated_outputs if item.endswith('.json')])}",
        f"JSON files updated: {len([item for item in state.updated if item.endswith('.json')])}",
        f"JSON files unchanged: {len([item for item in state.unchanged if item.endswith('.json')])}",
        f"Warnings: {len(state.warnings) + len(state.unsupported)}",
        f"Errors: {len(state.errors)}",
        "",
        "GENERATED OUTPUTS",
        "-" * 72,
    ]
    lines.extend(f"{'UPDATED' if key in state.updated else 'UNCHANGED'}: {key}" for key in sorted(state.generated))
    lines.extend([
        "",
        "JSON FILE AUDIT",
        "-" * 72,
    ])
    for item in state.json_audit:
        lines.append(f"{item['path']} | {item['classification']} | {item['status']} | {item['action']} | {item['reason']}")
    lines.extend(["", "UNSUPPORTED FILES", "-" * 72])
    lines.extend(state.unsupported or ["None detected."])
    lines.extend(["", "WARNINGS", "-" * 72])
    lines.extend(state.warnings or ["None."])
    lines.extend(["", "ERRORS / BROKEN REFERENCES", "-" * 72])
    lines.extend(state.errors or ["None."])
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build and audit generated static website content.")
    parser.add_argument("--check", action="store_true", help="Validate and audit without modifying generated files.")
    parser.add_argument("--verbose", action="store_true", help="Print each generated output and warning.")
    args = parser.parse_args()
    started = datetime.now(timezone.utc)
    state = BuildState(check_only=args.check)

    try:
        build_generated_content(state)
        audit_source_folders(state)
        audit_json_files(state)
    except Exception as error:
        state.errors.append(f"BUILD FAILED: {error}")

    report = create_report(state, started)
    if not args.check:
        atomic_write(REPORT_PATH, report)
    else:
        print(report, end="")
    if args.verbose:
        for line in state.updated + state.unchanged + state.warnings + state.unsupported:
            print(line)
    if state.errors:
        print(f"BUILD FAILED: {len(state.errors)} error(s). See {REPORT_PATH}", file=sys.stderr)
        return 1
    print(f"BUILD {'CHECK PASSED' if args.check else 'COMPLETED'}. Report: {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
