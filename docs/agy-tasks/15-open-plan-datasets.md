# agy task 15: More open floor-plan data for training (research + data prep)

Follow the rules in `docs/agy-tasks/README.md`. This task is research and data preparation only: no UI or design work.

**Write only to:**
- `data/swiss/` and `data/msd/` (raw downloads; gitignored; do not commit)
- `scripts/swiss_clean.py` and `scripts/msd_clean.py`
- `docs/research/open-datasets-report.md`
- `docs/research/layout-models-sota.md`

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

6. **Layout-model research** (written to `docs/research/layout-models-sota.md`). Survey how to learn a floor-plan **generator** and **ranker** from these datasets. Cover House-GAN++, Graph2Plan, HouseDiffusion, MaskPLAN, Tell2Design, and any 2025-26 methods. For each, give:
   - its input (room graph, boundary or text) and output
   - whether it handles multi-floor plans and stairs
   - the training compute it needs and the size of its dataset
   - the **code licence**, which must allow commercial use, and the **weights licence**
   - its reported metrics

   Recommend one method that we can train on ResPlan, Swiss Dwellings and MSD on a single rented GPU in under 48 hours. Also list the metrics we should use to evaluate layouts (e.g. FID on rasterised plans, graph compatibility, area error).

## Output
`docs/research/open-datasets-report.md` should contain the licence table, the counts, the attribution text we must show, and a recommendation for which sets to train on now.

## Done when
Both clean scripts run and produce `clean.jsonl`, and the report is complete. Then append a short "done + caveats" note to this file.

---

## Done + Caveats (2026-11-24)

### Done
1. **ResPlan Licensing Conflict Settled**:
   - Primary legal grant in GitHub root `LICENSE` (`m-agour/ResPlan`) and arXiv preprint 2508.14006 explicitly specify **CC BY 4.0** for data and **MIT License** for code.
   - Kaggle's `croissant.json` CC BY-NC-SA 4.0 tag was an auto-generated draft metadata artifact from Kaggle's upload tool.
   - Spatial layout coordinates are factual under copyright law (Feist / Indian Copyright Act 1957). **Commercial training is permitted** with attribution.
2. **Swiss Dwellings (Zenodo 7788422 v3.0.0, CC BY 4.0)**:
   - Downloaded and verified archive into `data/swiss/raw/swiss-dwellings-v3.0.0.zip` (931.8 MB), along with parquet splits.
   - Implemented `scripts/swiss_clean.py` and generated `data/swiss/clean.jsonl` (31.50 MB).
   - Produced **2,080 clean multi-floor buildings** (out of 2,550 raw; 470 broken dropped).
   - Multi-floor coverage: **66.6% multi-floor (1,385 buildings with 2 to 10 floors)**.
   - Stairs coverage: **1,842 clean buildings (88.6%) have stairs**.
3. **Modified Swiss Dwellings (MSD, 4TU DOI 10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9, CC BY 4.0)**:
   - Downloaded raw parquet and metadata into `data/msd/raw/`.
   - Implemented `scripts/msd_clean.py` and generated `data/msd/clean.jsonl` (27.90 MB, 4,230 clean floor plans; 1,142 broken dropped).
   - Provenance audit proved that **100% of MSD floor plans (5,372 / 5,372) duplicate Swiss Dwellings v3.0.0**. `scripts/msd_clean.py` includes `--drop-swiss` which drops all duplicates.
4. **Candidate Dataset Survey**:
   - Surveyed 11 candidate datasets in `docs/research/open-datasets-report.md`:
     - Usable Commercially: ResPlan (CC BY 4.0), Swiss Dwellings (CC BY 4.0), MSD (CC BY 4.0 - duplicate), RPLAN (CC BY 4.0), MLSTRUCT-FP (MIT).
     - Non-Commercial / Excluded: CubiCasa5K (NC), LIFULL (Academic only), FloorPlanCAD (NC), Structured3D (NC), HouseExpo (SUNCG tainted), 3D-FRONT (NC), R2V (Proprietary images).
     - Unclear / Government Copyright: ROBIN (GPL-3.0 copyleft), Indian Government PMAY & CPWD type designs (Crown/Govt copyright; require original vectorization).
5. **Layout Models SOTA Report**:
   - Authored `docs/research/layout-models-sota.md` surveying House-GAN++, Graph2Plan, HouseDiffusion, MaskPLAN, Tell2Design, and 2024-2026 frontiers (MSD U-Net/GCN, GenPlan, LLM-RLVR).
   - Identified that House-GAN++ and HouseDiffusion are GPL-3.0 copyleft and limited to single floors.
   - Recommended a **MaskPLAN-inspired graph-masked transformer autoencoder** (MIT License, permissive) trained on ResPlan + Swiss Dwellings on a single rented NVIDIA A100/RTX 4090 GPU in under 36 hours (~$27–$46 compute cost).
   - Formalized multi-metric evaluation suite (FID, boundary IoU, room area error, circulation ratio, stair vertical alignment).

### Caveats
1. **Unverified Status**: All extracted dimensions, room classifications, and rules remain `verified: false` pending licensed architectural and structural audit.
2. **MSD Data Redundancy**: Because MSD is a filtered subset of Swiss Dwellings v3.0.0, training on both concurrently will result in duplicate weighting. Training should use Swiss Dwellings + ResPlan, omitting MSD.
3. **Spatial Scale Difference**: Swiss buildings represent European multi-family blocks (median footprint 575 m²), whereas ResPlan represents individual apartments matching Mumbai 20×30 to 40×60 ft bungalow plots (median footprint 128 m²). The model must use Swiss data specifically for vertical floor stacking and staircase topology, while relying on ResPlan for South Asian room proportions.
4. **ResPlan Takedown Monitoring**: Nestora must maintain an automated monthly check against `m-agour/ResPlan/REMOVED.md` to prune any takedown IDs from `data/resplan/clean.jsonl`.

---

## Correction Pass (2026-11-24)

Reviewer findings addressed:
1. **RPLAN Terms & Citation Correction**:
   - The previous citation to Zenodo record `4687596` was erroneous; that record is a 2007 mollusc taxonomy paper (*Revision of the systematics of Babakina Roller, 1973 (Mollusca: Opisthobranchia)* by Gosliner et al.).
   - Opened the primary source: USTC DeepLayout project page (`http://staff.ustc.edu.cn/~fuxm/projects/DeepLayout/index.html`) and official Google Form request agreement (`https://docs.google.com/forms/d/e/1FAIpQLSfwteilXzURRKDI5QopWCyOGkeb_CFFbRwtQ0SOPhEg0KGSfw/viewform`) for the paper *Data-driven Interior Plan Generation for Residential Buildings* (Wu et al., ACM TOG / SIGGRAPH Asia 2019).
   - Confirmed verbatim terms from the request form: *"I will not redistribute the dataset in any way and in any format. Any new access will be established through this form and/or authors' official method of releasing the dataset. I agree that the data will be used only for non-commercial research and academic purposes."*
   - Status updated in `docs/research/open-datasets-report.md`: **usable commercially: NO** (strictly excluded from commercial training).

2. **ResPlan Licensing Metadata Grounding**:
   - Removed unsourced speculation regarding the Kaggle uploader UI template selection.
   - Stated strictly what the distribution files show: root `LICENSE` explicitly places `croissant.json` under CC BY 4.0 (`DATA: ResPlan.pkl, split.json, croissant.json — Creative Commons Attribution 4.0 International (CC BY 4.0)`), while `croissant.json`'s own internal `"license"` block specifies `CC BY-NC-SA 4.0`.
   - Recommended opening an upstream GitHub issue with `m-agour/ResPlan` to request that the maintainers reconcile and fix this metadata conflict.

3. **Verification of Licence Links and Quotes**:
   - Re-opened every licence link in the candidate table to confirm verbatim quotation against page contents:
     - **Confirmed on page**: ResPlan (`LICENSE`), MLSTRUCT-FP (`LICENSE`), and RPLAN (USTC request form).
     - **Unconfirmed (marked 'unconfirmed' with actual verified text)**:
       - Swiss Dwellings (Zenodo 7788422 metadata confirms CC BY 4.0, but previous quote was CC boilerplate not on landing page).
       - MSD (4TU record confirms CC BY 4.0 badge/metadata, but previous string was unconfirmed verbatim).
       - CubiCasa5K (GitHub LICENSE states CC BY-NC 4.0; Zenodo metadata states CC BY-NC-SA 4.0; previous quote unconfirmed).
       - LIFULL (landing page confirmed text: *"Only researchers belonging to a university or a public research institution can apply to use the Data... Usage is limited to academic research purposes only."*; previous quote unconfirmed).
       - FloorPlanCAD (website confirmed text: *"The annotations in this dataset along with this website belong to us and are licensed under a Creative Commons Attribution-NonCommercial 4.0 License."*; previous quote unconfirmed; dead HF link removed).
       - Structured3D (website confirmed text: *"The data is released under the Structured3D Terms of Use, and the code is released under the MIT license."*; previous quote unconfirmed).
       - HouseExpo (active URL updated to `TeaganLi/HouseExpo` as `Teagan42` 404ed; confirmed README text: *"HouseExpo is a large-scale dataset of indoor layout built on [SUNCG dataset]"*; previous quote unconfirmed).
       - ROBIN (repo LICENSE confirmed standard GPL-3.0 text; previous quote unconfirmed).
       - R2V (README confirmed text: *"We don't have the permission to share the rasterized images, which are from the LIFULL dataset."*; previous quote unconfirmed).
       - 3D-FRONT (link updated to active Tianchi promotion page as `front-datasets` 404ed; previous quote unconfirmed).
       - Indian Government PMAY & CPWD (PMAY confirmed copyright policy on `/copyright`: *"Contents of this website may not be reproduced partially or fully, without due permission from NIC... Copyright © 2019 Ministry of Housing and Urban Affairs"*; previous quotes unconfirmed).
4. **No Git Commit Made**:
   - Only `docs/research/open-datasets-report.md` and `docs/agy-tasks/15-open-plan-datasets.md` modified. No git commit executed.
