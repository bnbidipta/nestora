# agy task 16: More floor-plan data, especially Indian independent houses with internal stairs

Follow the rules in `docs/agy-tasks/README.md`. Research and data preparation only.

**Write only to:**
- `data/mlstruct/` and `data/extra/` (raw downloads, gitignored, never commit)
- `scripts/mlstruct_clean.py` and `scripts/extra_clean.py`
- `docs/research/more-data-report.md`

## Why
Nestora's realism model is trained on ResPlan (South Asian flats) and Swiss Dwellings (European apartment blocks). Neither has **independent houses with an internal staircase**, which is what Nestora designs for Mumbai plots (20×30 to 40×60 ft, G+1/G+2). So we currently can't learn where a house stair should sit.

## Do
1. **MLSTRUCT-FP** (MIT): download it and write `scripts/mlstruct_clean.py`.
   - Output must use the same format as `data/resplan/clean.jsonl`: `{id,width_m,depth_m,floors,rooms:[{type,x,y,w,d,floor?,polygon?}],source_id}`.
   - If it has walls but no room labels, say so and measure how many rooms can be recovered.
2. **Search for more data we're allowed to use commercially** (CC0, CC BY, ODbL, MIT, Apache, public domain) containing house or villa plans, ideally Indian or South Asian, ideally multi-floor with stairs. Places to search:
   - Zenodo, Hugging Face, Kaggle (check each dataset's own licence, not just the site default)
   - Mendeley Data, Figshare, OpenAlex
   - Wikimedia Commons floor-plan categories
   - Indian open-data portals (data.gov.in, under the GODL-India licence)
   - papers from 2024–26 that release house-plan data

   For each candidate, record: link, licence with an exact quote from a page you actually opened, size, whether it has multi-floor plans or stairs, and the format. **Never cite a page you did not open.** If you can't confirm the licence, write "unconfirmed".
3. Download and clean the **top one or two** candidates that are confirmed commercially usable, into `data/extra/<name>/` using the same format.
4. **Is it useful to build a data-collection process?** Two ideas:
   - an architect partner uploads DXF plans under a data licence
   - a consent flow where users donate their final plans

   For each, list what it needs: consent wording, PII removal, licence terms. Keep this to one page.

## Output
`docs/research/more-data-report.md`: candidate table, counts for each cleaned set (plans, floors, stairs, plot sizes compared with Mumbai), the attribution text needed, and a recommendation.

## Done when
The clean scripts run, the report is complete, and a "done + caveats" note is appended to this file.
