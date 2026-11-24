# agy task 15: More open floor-plan data for training (research + data prep)

Follow the rules in `docs/agy-tasks/README.md`. This task is research and data preparation only: no UI or design work.

**Write only to:**
- `data/swiss/` and `data/msd/` (raw downloads; gitignored; do not commit)
- `scripts/swiss_clean.py` and `scripts/msd_clean.py`
- `docs/research/open-datasets-report.md`

## Why
Nestora trains its layout models on open data. ResPlan is finished: `data/resplan/clean.jsonl` holds 13,527 plans, but they are mostly single-floor apartments. We need more plans, and especially multi-floor houses with stairs.

## Do
1. **Settle the ResPlan licence conflict.** GitHub says CC BY 4.0, but Kaggle's `croissant.json` says CC BY-NC-SA 4.0.
   - Work out which is authoritative. Check the paper, statements from the authors, Zenodo/HF mirrors and the repo's issues.
   - Quote your sources, and say whether commercial training is allowed.
2. **Swiss Dwellings** (Zenodo record 7788422, CC BY 4.0).
   - Download it into `data/swiss/raw/` and record the version and the date.
   - Write `scripts/swiss_clean.py`. Its output must match the format of `data/resplan/clean.jsonl`: `{id, width_m, depth_m, floors, rooms:[{type,x,y,w,d,polygon?}], source_id}`.
   - Map room types to Nestora's: living, kitchen, dining, bedroom, bedroom_master, toilet, stair, passage, balcony, puja, study, store, utility, porch.
   - Group units by building and floor where you can, so the multi-floor information survives.
3. **MSD** (Modified Swiss Dwellings, 4TU, CC BY 4.0): do the same into `data/msd/`, and drop any plans that duplicate Swiss Dwellings.
4. **Survey other candidates.** Give each one's licence with a quote and a link, and mark it **usable commercially: yes / no / unclear**. Don't download anything that is non-commercial.
   - Datasets: CubiCasa5K, RPLAN, LIFULL, FloorPlanCAD, Structured3D, HouseExpo, ROBIN, R2V, 3D-FRONT, MLSTRUCT-FP, and any Indian plan datasets.
   - Indian government open data, e.g. PMAY type designs and CPWD type plans.
5. **Counts for each cleaned set:**
   - raw count, number dropped, final count
   - floors per building
   - number of plans with a stair
   - plot-size distribution compared with Mumbai plots (20×30 to 40×60 ft)

## Output
`docs/research/open-datasets-report.md` should contain the licence table, the counts, the attribution text we must show, and a recommendation for which sets to train on now.

## Done when
Both clean scripts run and produce `clean.jsonl`, and the report is complete. Then append a short "done + caveats" note to this file.
