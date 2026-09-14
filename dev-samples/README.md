# Development input samples

These files are fictional development fixtures. They are intentionally separate from production content.

- `sample-faculty.csv`: CSV import with one valid row and one invalid row for validation testing.
- `sample-faculty-duplicate.csv`: CSV import that demonstrates duplicate detection.
- `sample-student-strength.txt`: key-value blocks for student-strength import.
- `sample-result-analysis.txt`: fictional result-analysis records.
- `sample-empty.txt`: empty-file rejection case.
- `sample-examination-notice.pdf`: fictional PDF fixture with a simple text layer.
- `sample-academic-calendar.svg`: fictional image fixture for gallery/image validation.

Use the Development Data Lab at `pages/development-data-lab.html` to select each file and inspect the full import flow. Public PYQ files are discovered by `tools/build_content.py` and published through the committed `data/pyq.json` manifest.
