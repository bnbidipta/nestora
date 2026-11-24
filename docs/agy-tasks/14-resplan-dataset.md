# agy task 14: Get ResPlan ready for training (data research and cleaning)

Follow the rules in `docs/agy-tasks/README.md`. Research and data preparation only: no app UI or design work.

**Write only to:**
- `data/resplan/` — the raw download (gitignored; do not commit)
- `scripts/resplan_clean.py`
- `docs/research/resplan-report.md`

## Why
Nestora's layout ranker, and later a learned layout generator, need real plans to learn from. ResPlan (https://github.com/m-agour/ResPlan, Kaggle `resplan/resplan`) is 17,000 South Asian residential plans. Its data is CC BY 4.0 and its code MIT. A later paper, "ModRes" (arXiv 2610.17178), reports errors and duplicate plans in it.

## Do
1. Download the dataset from the official GitHub or Kaggle source, into `data/resplan/raw/`. Record the exact version or commit, and the date.
2. Read the LICENSE and TAKEDOWN.md files. Summarise the attribution wording we must show, and how takedowns work.
3. Document the schema: room types, geometry format, units, graph format, and per-plan metadata such as plot size or BHK.
4. Write `scripts/resplan_clean.py`. It should:
   - load the plans
   - drop duplicates (same geometry after normalising)
   - drop broken plans: self-intersecting or overlapping rooms, zero-area rooms, missing rooms
   - map room types to Nestora's types: living, kitchen, dining, bedroom, bedroom_master, toilet, stair, passage, balcony, puja, study, store, utility, porch
   - write `data/resplan/clean.jsonl`, one plan per line: `{id, width_m, depth_m, floors, rooms:[{type, x, y, w, d} or polygon], source_id}`

   Where the paper's cleaning rules are public, follow ModRes.
5. Report counts:
   - raw count, number of duplicates, number broken, final count
   - distribution of plot sizes, BHK counts and room types
   - how many plans are rectangular-room-only vs have polygons

## Output
`docs/research/resplan-report.md`: the findings, the counts, and how plans compare with Mumbai plot sizes (20×30 to 40×60 ft). Also note anything that would block commercial use.

## Done when
`python scripts/resplan_clean.py` runs and produces `clean.jsonl`, and the report has every count above.
