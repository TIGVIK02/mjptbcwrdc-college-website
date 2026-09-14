#!/usr/bin/env python3
"""Generate committed manifests for folder-backed website content."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
ASSETS = ROOT / "assets"
SUPPORTED_MEDIA = {".jpg", ".jpeg", ".png", ".pdf"}
HOME_EXTENSIONS = SUPPORTED_MEDIA | {".svg", ".webp"}


def web_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def direct_files(folder: Path, extensions: set[str]) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        (item for item in folder.iterdir() if item.is_file() and item.suffix.lower() in extensions),
        key=lambda item: item.name.casefold(),
    )


def build_media_manifest() -> dict:
    gallery_root = ASSETS / "images" / "gallery"
    gallery = []
    if gallery_root.is_dir():
        for folder in sorted((item for item in gallery_root.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
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


def build_pdf_manifest(folder_name: str) -> list[dict]:
    folder = ASSETS / folder_name
    records = []
    for path in direct_files(folder, {".pdf"}):
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
        ),
    )


def write_json(name: str, value: object) -> None:
    (DATA / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def update_pdf_notices() -> None:
    notice_folder = ASSETS / "notice_files"
    records = []
    for path in direct_files(notice_folder, {".pdf"}):
        records.append(f"TITLE={path.stem}\nPDF={path.name}\n")
    (notice_folder / "pdf-notices.txt").write_text("\n".join(records), encoding="utf-8")


def update_timetables() -> None:
    source = ROOT / "website raw data" / "consol_tt.xlsx"
    generator = ROOT / "website raw data" / "generate_timetables.py"
    if not source.is_file() or not generator.is_file():
        return
    subprocess.run(
        ["python", str(generator), source.name, "--output", "timetable_output"],
        cwd=source.parent,
        check=True,
    )


def main() -> None:
    write_json("media-manifest.json", build_media_manifest())
    write_json("pyq.json", build_pdf_manifest("pyq"))
    write_json("magazine.json", build_pdf_manifest("magazine"))
    update_pdf_notices()
    update_timetables()
    print("Generated data/media-manifest.json, data/pyq.json, and data/magazine.json")


if __name__ == "__main__":
    main()
