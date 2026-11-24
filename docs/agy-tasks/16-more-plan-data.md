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

---

## Done + Caveats (2026-11-24 — Post-Review Correction Pass)

### Done
1. **MLSTRUCT-FP Dataset Ingestion & Room Recovery**:
   - Downloaded and verified upstream release under **MIT License** (`fp.json`, 42.8 MB, extracted from Google Drive `MLSTRUCT-FP_v1.zip` ID: `1-38lW9PtzJP4YhQ3aq73FH6pnUn-l60x`).
   - Implemented `scripts/mlstruct_clean.py` and generated `data/mlstruct/clean.jsonl` (23.57 MB).
   - Cleaned **954 clean plans (100.0% yield)** containing 70,873 structural wall sections and 954 outer floor slab boundaries.
   - Handled room label absence: Upstream contains structural walls and perimeters only with unclosed door openings and no semantic room labels (confirmed by upstream author in GitHub Issue #1). Implemented morphological closing ($d = 0.75\text{ m}$) over door openings, successfully recovering **6,153 discrete room cavities** (mean 6.4 rooms/plan, median 6; min 1, max 27).
   - **Crucial limitation**: Because all recovered rooms are unlabelled generic `'room'`, **MLSTRUCT-FP cannot teach room types or functional semantics** (bedroom, kitchen, puja, bath). It serves purely for wall physics, boundary geometry, and structural load alignment.
2. **Comprehensive Commercial Licensing Audit**:
   - Surveyed 10 candidate datasets across Zenodo, Hugging Face, Kaggle, Figshare, OpenAlex, Wikimedia Commons, and data.gov.in.
   - Audited every license with exact quotes transcribed from pages opened during this session.
   - Identified and excluded legally restricted sets:
     - **MansionWorld / MANSION** (`superbigsaw/MansionWorld`, `AgibotGeneral/MANSION`): Despite a `license: cc-by-4.0` tag in card metadata, Hugging Face API `extra_gated_fields` enforces a mandatory non-commercial clickthrough checkbox (*"I agree to use this dataset for non-commercial research purposes only"*). Excluded from commercial training.
     - **HouseLayout3D** (`HouseLayout3D/houselayout3d`): Code tagged MIT, but underlying 3D multi-floor scans derive from Matterport3D, requiring signed non-commercial agreement (`MP_TOS.pdf`). Excluded.
     - **HouseExpo++** (`VahidAz/Floorplan_dataset`): SUNCG-derived without license. Excluded.
     - **Floorplan Isovist Dataset** (Zenodo 13871782): CubiCasa5K-derived (CC BY-NC-SA 4.0). Excluded.
     - **JoaoMigSilva / floorplans** (MIT): Raster images only without vector boundaries or room annotations.
     - **Plan Book of American Dwellings 1914** (Public Domain): Scanned historical plates without vector annotations.
     - **data.gov.in**: Macro housing and census tables only under GODL-India; no CAD drawings or blueprints published.
3. **Indian House Plans: Program Extraction & Synthetic Geometry Purge**:
   - Sourced `umesh16071973/Floorplan_Dataset_20022024` on Hugging Face (**MIT License** confirmed from `README.md`: `"license: mit"`).
   - **Correction Pass**: Deleted deprecated `data/extra/indian_houses/clean.jsonl` which contained invented synthetic grid geometry (5.91 × 6.38 m room cells).
   - Refactored `scripts/extra_clean.py` to output strictly what the architectural captions contain: `data/extra/indian_houses/programs.jsonl` (163.4 KB, 213 architectural programs) with schema `{id, plot_w_ft, plot_d_ft, facing, corner, floors, room_counts:{type:n}, features:[...], caption}`.
   - Key program distributions:
     - **165 briefs (77.5%)** specify exact plot dimensions in feet (median 40.0 ft width × 75.0 ft depth).
     - **193 briefs (90.6%)** specify 2-story (G+1) independent houses with stairs.
     - **46 briefs (21.6%)** specify corner plots.
     - **96 briefs (45.1%)** feature dedicated Puja rooms.
     - **163 briefs (76.5%)** feature car porches / parking.
     - **177 briefs (83.1%)** specify lawns / landscape.
     - **193 briefs (90.6%)** include dressing areas attached to bedrooms.
4. **Real CAD Floor-Plan Images Download & Vectorization Evaluation**:
   - Verified Hugging Face repo tree: exactly **215 image files** (99.03 MB total, ~483 KB average).
   - Inspected image dimensions: high-resolution 2D CAD drawings (3200 × 1800 for 214 images, 3200 × 1425 for 1 image).
   - Verified image nature: CAD-style line drawings with black/colored wall lines, dimension lines, English room text labels, and furniture blocks on white canvas (mean pixel value ~247), all Ground Floor (`_GF_`).
   - Quoted MIT License on upstream repo:
     ```yaml
     ---
     license: mit
     ---
     ```
   - Downloaded all **215 images** into `data/extra/indian_houses/images/`.
   - Evaluated 3 commercial-friendly raster-to-vector tools (Raster-to-Vector / FloorplanTransformation, Classical OpenCV+OCR Pipeline, OpenBIM-FloorPlan-AI) to convert CAD raster images into room polygons with semantic labels without heavy training.
5. **Data-Collection Operational Framework (One-Page Design)**:
   - **Stream A (Architect Partner DXF Program)**: Drafted partner consent deed under **CDLA-Permissive-2.0**, automated DXF sanitization protocol (stripping `$LASTSAVEDBY`, GUIDs, `TITLE_BLOCK`, COA reg numbers, CTS survey numbers, client PII, and UTM coordinate offsets).
   - **Stream B (User Donation Flow)**: In-app export modal consent under **CC BY 4.0**, client account disassociation, spatial de-identification, and Gaussian coordinate micro-jitter ($\sigma = 0.02\text{ m}$) ensuring full compliance with Section 3 of India's Digital Personal Data Protection (DPDP) Act 2023.

### Caveats
1. **Unverified Status**: All extracted spatial dimensions, floor counts, and room allocations remain `"verified": false` pending audit by a licensed architect and legal counsel per agy rules.
2. **MLSTRUCT-FP Cannot Teach Room Types**: Rooms in `data/mlstruct/clean.jsonl` are geometrically recovered via morphological gap closing ($d = 0.75\text{ m}$) and assigned generic type `"room"` because upstream MLSTRUCT-FP does not annotate functional room semantics (living, bed, bath). It cannot train semantic room placement.
3. **Indian House Data Modality**: `data/extra/indian_houses/programs.jsonl` contains text architectural programs and requirements, NOT geometric plan polygons. Geometric training on Indian houses requires running the evaluated raster-to-vector pipeline against `data/extra/indian_houses/images/` (215 high-res CAD drawings).
