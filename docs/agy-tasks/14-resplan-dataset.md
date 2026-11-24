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

---

## Done + Caveats (agy task 14)

### Done
1. **Downloaded raw dataset** into `data/resplan/raw/` from official GitHub repository (`m-agour/ResPlan`, commit `e2b78fe069aee1ab1e1828a612743f308e3c32a7`, commit date `2026-07-28T08:19:11Z`, release tag `1.0.0`), downloaded on `2026-11-24`. Contains `ResPlan.pkl`, `split.json`, `croissant.json`, `LICENSE`, `TAKEDOWN.md`, `resplan_utils.py`.
2. **Analyzed licensing and takedowns**:
   - Primary data license is CC BY 4.0; code is MIT.
   - Identified critical discrepancy: Kaggle mirror metadata (`croissant.json`) states CC BY-NC-SA 4.0, which would bar commercial use if enforceable. Model training must cite the GitHub CC BY 4.0 release.
   - Mandatory attribution string and takedown policy (`TAKEDOWN.md`) documented.
3. **Documented dataset schema & units**: Scaled from canvas coordinates ($0-256$) to meters ($m$) via $\text{px\_per\_m} = \sqrt{\text{calc\_area} / \text{reported\_area}}$. Mapped raw spaces to Nestora's 14-type architectural taxonomy.
4. **Authored cleaner script** `scripts/resplan_clean.py`:
   - Enforces ModRes cleaning rules and strict geometric integrity.
   - Filters 2,885 broken plans (2,755 overlapping rooms, 126 missing kitchen, 3 missing bedroom, 1 zero-area room).
   - Deduplicates 588 plans (567 synthetic augmentations from `split.json` + 21 normalized geometric duplicates).
   - Produces `data/resplan/clean.jsonl` (13,527 verified clean plans, 15.70 MB).
5. **Authored comprehensive research report** `docs/research/resplan-report.md` with every required count, distribution metric, and Mumbai DCPR 2034 plot size comparison.

### Caveats
- `"verified": false` across all processed numbers and regulatory rules until reviewed by licensed architectural and legal professionals.
- **Commercial use risk**: Kaggle `croissant.json` specifies CC BY-NC-SA 4.0 while GitHub root specifies CC BY 4.0. Legal counsel must formally verify the non-commercial term is invalid before commercial API release.
- **Apartment vs Plotted layout divergence**: 99.7% of clean plans are single-floor apartment units with wider frontages (median $42.5\text{ ft}$ width vs $32.0\text{ ft}$ depth). Independent Mumbai plots ($20\times30$ to $40\times60\text{ ft}$) require mandatory setbacks (DCPR 2034 Reg 41) and multi-floor vertical stacking (G+1/G+2 duplexes) with stair cores.
- **Absent room types**: ResPlan conflates dining with living rooms and lacks separate labels for `puja`, `study`, `passage`, and `utility`. Generative models must infer or prompt for these specialized zones separately.

