# TNGPTC Madurai – redesigned website (static)

## Run
Open `index.html` in a browser, or serve the folder: `python3 -m http.server 8000` then visit http://localhost:8000. No install needed.

## Update content
1. Edit `data/site.json` (departments, study modes, syllabus links, faculty, notices, fees, projects, gallery).
2. Run `node build.js` to regenerate all 16 HTML pages.
3. Optional: `node tools/gen-art.js` regenerates the illustrations in `assets/img/`.
4. Check: `python3 -I tools/test.py` (needs Playwright + Chromium) tests local links, mobile menu, department cards, lightbox and overflow.

## Add real photos
Put optimised JPG/WebP files in `assets/img/` and point `heroPhoto` or a department's `art` at them in `site.json` (adjust `build.js` if you want photo captions). Keep the label "Illustration" only on artwork.

## Verified vs placeholder
Verified from tngptcmadurai.com on 13 Oct 2026: course catalogue and study modes, N-20 / C23 syllabus PDF links, faculty names and roles, notices (titles only), contact, first-year fees, history.
Placeholders (not published officially): course descriptions, labs/facilities, student projects, admission dates, eligibility, seat counts, notice PDF links, statistics with a year.
