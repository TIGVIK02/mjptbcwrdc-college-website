# MJPTBCWRDC(W), Station Ghanpur

Website for **Mahatma Jyothiba Phule Telangana Backward Classes Welfare Residential Degree College for Women**, Station Ghanpur (Pembarthy, Jangaon, 506201).

- Short name: **MJPTBCWRDC(W)**
- Affiliated to **Kakatiya University**
- Society: **MJPTBCWREIS** (Secretary: B. Saidulu, IFS, Masab Tank, Hyderabad)
- Principal: **Dr. K. Bhagyalaxmi**
- Phone: **7013310928**
- Email: **mjptbcwrdcstationghanpurwomen@gmail.com**

## Local preview

Serve the folder over HTTP because the shared header, footer, notices, and student data use `fetch()`:

```bash
npx serve .
```

Then open the local URL printed by the command.

## Before publishing

- Replace the image, faculty, and document placeholders with material approved by the college.
- Add quick notices to `assets/notice_files/quick-notices.txt` and document notices to `assets/notice_files/pdf-notices.txt`.
- Replace the placeholder URLs in `sitemap.xml` and `robots.txt` with the final HTTPS domain.
- Test the contact email draft, navigation, notices, and downloads on a phone before deployment.

## Development input pipeline

The site is intentionally static: there is no server, database, or filesystem API. The complete development workflow is available at `pages/development-data-lab.html` and uses explicit browser file selection, validation, parsing, IndexedDB storage, administrator edit/approval, and a public-preview renderer. This is a development harness, not a production admin panel.

Development fixtures live separately in `dev-samples/` and are clearly fictional. The sample inputs cover CSV faculty records, TXT student/result/PYQ records, JSON notice metadata, a PDF notice, and an SVG image. Invalid rows, missing fields, duplicate faculty IDs, malformed JSON, empty files, wrong file types, invalid dates, and unreadable PDFs are rejected before storage. Approved records are previewed only in the browser and never overwrite public data files.

Input contracts:

- Public notices read `assets/notice_files/quick-notices.txt` and `assets/notice_files/pdf-notices.txt`; document PDFs remain in `assets/notice_files/`.
- Public student, faculty, and result views read lightweight files under `data/`. The PYQ page reads the HTML directory listing at `assets/pyq/` and filters it to direct PDF files.
- The contact form validates the enquiry, records a development-only audit entry in IndexedDB, and opens the user's email client for final review and sending.
- When a backend is introduced, replace the IndexedDB adapter in `js/development-data-lab.js` with authenticated upload/API calls and server-side validation; keep the same parsed record contracts and review states.

## JavaScript architecture

Every standalone HTML page loads `js/script.js` first. That global file owns shared component loading, configuration, breadcrumbs, navigation, accessibility behavior, and back-to-top behavior. Pages with custom interactions then load one page-specific module:

- `home.js`: leadership, student-strength data, and the homepage carousel.
- `notices.js`: quick-notice ticker/list and document-notice rendering.
- `departments.js`: department tabs, faculty filtering, and profiles.
- `contact.js`: enquiry validation, development audit capture, and email draft preparation.
- `gallery.js`: gallery lightbox.
- `result-analysis.js`: result-analysis data rendering.
- `previous-year-question-papers.js`: PYQ directory-listing parsing and PDF actions.
- `development-data-lab.js`: development-only file import, validation, review, and preview.

Content-only pages use the global file without an unnecessary page module. Page modules guard their own mount elements and wait for `Site.onReady()`, so one page's custom behavior does not run on another page.

The notice page requests the two TXT files through the local/static hosting layer. It displays direct PDF titles from `pdf-notices.txt` and marks an individual document unavailable when a normal ranged request cannot load it. No JSON notice index or archive database is required.

### PYQ V1 hosting limitation

The current V1 project is static-only. Browsers cannot enumerate a hosting server's filesystem, and GitHub Pages does not provide a directory listing API. Local preview with `npx serve .` exposes an HTML listing for `assets/pyq/`, which this page parses without hardcoded filenames. On a static host that disables directory listings, the page shows the unavailable state; adding a PDF alone cannot be auto-discovered there without a generated manifest or server/API support.
