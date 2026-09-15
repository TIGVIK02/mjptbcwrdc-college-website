#!/usr/bin/env python3
"""Compatibility entry point for the project-wide content build."""

from pathlib import Path
import runpy


ROOT_BUILD = Path(__file__).resolve().parent.parent / "build_content.py"


if __name__ == "__main__":
    runpy.run_path(str(ROOT_BUILD), run_name="__main__")
