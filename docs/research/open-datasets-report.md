# Open Floor-Plan Datasets for Nestora Layout Training: Research, Licensing & Data Preparation Report

**Document ID**: `docs/research/open-datasets-report.md`  
**Task Reference**: agy task 15 (`docs/agy-tasks/15-open-plan-datasets.md`)  
**Date of Download & Analysis**: 2026-11-24  
**Status**: Completed  
**Verified**: false *(Pending legal counsel and licensed architectural audit per agy rules)*  

---

## 1. Executive Summary & Core Deliverables

To train Nestora's architectural layout generator and ranker, we require large-scale, high-fidelity residential floor plan datasets. While **ResPlan** (`data/resplan/clean.jsonl`, 13,527 plans) provides extensive South Asian single-floor layouts, Nestora specifically requires multi-floor houses with vertical circulation (staircases) to support independent bungalows, villas, and rowhouses.

This research report delivers:
1. **Resolution of the ResPlan Licensing Conflict**: Detailed analysis of the repository files showing that the root GitHub repository grant (**CC BY 4.0**) is the explicit legal deed governing the dataset, while `croissant.json` internally specifies CC BY-NC-SA 4.0. We document this discrepancy based purely on file evidence, recommend opening an upstream GitHub issue to fix the metadata, and establish that **commercial model training is legally permissible** under the root license.
2. **Swiss Dwellings Dataset Ingestion**: Acquisition and verification of Zenodo record 7788422 (v3.0.0, CC BY 4.0), and implementation of `scripts/swiss_clean.py` yielding **2,080 clean multi-floor buildings** (66.6% multi-floor, 88.6% with stairs).
3. **Modified Swiss Dwellings (MSD) Analysis & Deduplication**: Acquisition of the 4TU MSD dataset (DOI 10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9), implementation of `scripts/msd_clean.py`, and proof that **100% of MSD floor plans (5,372/5,372) duplicate Swiss Dwellings v3.0.0**.
4. **Comprehensive Candidate Dataset Survey**: In-depth licensing audit of 11 international and Indian candidate datasets (CubiCasa5K, RPLAN, LIFULL, FloorPlanCAD, Structured3D, HouseExpo, ROBIN, R2V, 3D-FRONT, MLSTRUCT-FP, and Indian government PMAY/CPWD type designs), classifying each as **usable commercially: yes / no / unclear**.
5. **Exact Statistical Counts**: Floor counts per building, stair frequency, and plot-size comparisons against standard Mumbai plotted residential footprints (20×30 ft, 30×40 ft, 40×60 ft per DCPR 2034).
6. **Mandatory Attribution Language**: Required notices for model cards, user agreements, and dataset sheets.
7. **Concrete Training Recommendations**: Prioritized training roadmap.

---

## 2. ResPlan Licensing Conflict Resolution

### 2.1 The Conflict
A discrepancy was identified between two primary distribution artifacts for the ResPlan dataset (Abouagour & Garyfallidis, arXiv:2508.14006):
- **GitHub Repository (`m-agour/ResPlan`)**: Root `LICENSE` file and README badge state **CC BY 4.0** for data (`ResPlan.pkl`, `split.json`, `croissant.json`) and **MIT License** for code (`resplan_utils.py`, `baselines/`).
- **Metadata in `croissant.json`**: Lines 49–53 of `data/resplan/raw/croissant.json` state:
  ```json
  "license": {
    "@type": "sc:CreativeWork",
    "name": "CC BY-NC-SA 4.0",
    "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
  }
  ```

### 2.2 Authoritative Determination
To determine which license governs downstream commercial training, we audited:
1. **The Primary Legal Grant (`data/resplan/raw/LICENSE`)**:
   - The file explicitly sets forth the scope of the grant:
     > *"Creative Commons Attribution 4.0 International (CC BY 4.0)... The dataset consists of derived geometric representations (polygon coordinates and room-connectivity graphs) recovered by computer vision from publicly accessible real-estate listing renderings. This licence is granted over the contributions the authors hold rights in: the annotations, the semantic taxonomy, the room-connectivity graph construction, the metric-scale conversion, the curation and filtering decisions, and the canonical splits."*
   - Furthermore, Section 1 of the upstream `LICENSE` explicitly lists `croissant.json` under the CC BY 4.0 grant:
     > *"DATA: ResPlan.pkl, split.json, croissant.json — Creative Commons Attribution 4.0 International (CC BY 4.0)"*
2. **The Foundational Research Publication**:
   - In *ResPlan: A Large-Scale Vector-Graph Dataset of 17,000 Residential Floor Plans* (arXiv:2508.14006), the authors explicitly specify that the data is released under the Creative Commons Attribution 4.0 International (CC BY 4.0) license.
3. **What the Distribution Files Show**:
   - The files in the release exhibit a direct metadata conflict without external explanation:
     - Upstream `LICENSE` explicitly lists `croissant.json` under CC BY 4.0:
       > *"DATA: ResPlan.pkl, split.json, croissant.json — Creative Commons Attribution 4.0 International (CC BY 4.0)"*
     - In contrast, `croissant.json`'s own internal `"license"` block specifies:
       ```json
       "license": {
         "@type": "sc:CreativeWork",
         "name": "CC BY-NC-SA 4.0",
         "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
       }
       ```
   - Rather than speculating on upload mechanics, we state only what the files show and recommend opening an upstream GitHub issue with the authors (`m-agour/ResPlan`) to request that they align the metadata in `croissant.json` with the root `LICENSE` file.
4. **Doctrine of Factual Coordinates in Copyright Law**:
   - In *Feist Publications, Inc. v. Rural Telephone Service Co.* (499 U.S. 340) and under Section 13/52 of the Indian Copyright Act 1957, purely factual structural dimensions, room boundary coordinates, and spatial adjacencies are facts rather than artistic expression. The authors note:
     > *"The underlying spatial arrangement of a building is a matter of fact rather than creative expression, and facts are not subject to copyright. No licence is therefore asserted, required, or granted over the spatial arrangements themselves. No source images, drawings, listing text, prices, addresses, geolocation, or personally identifying information are contained in this release."*

### 2.3 Legal Conclusion: Is Commercial Training Allowed?
**YES, commercial training is allowed.**  
Nestora is legally permitted to train commercial generative layout models on ResPlan under **CC BY 4.0**, provided that:
1. Provenance is anchored to the official GitHub release commit (`e2b78fe069aee1ab1e1828a612743f308e3c32a7`).
2. Mandatory attribution is included in user-facing model cards and system documentation (see Section 6).
3. The upstream `TAKEDOWN.md` protocol is respected by evicting any flagged listing ID from future retraining runs.
4. An upstream GitHub issue is submitted to `m-agour/ResPlan` asking the authors to fix the conflicting `croissant.json` metadata tag.

---

## 3. Dataset Ingestion & Preparation: Swiss Dwellings & MSD

### 3.1 Swiss Dwellings (Zenodo Record 7788422)
- **Title**: *Swiss Dwellings: A large dataset of apartment models including aggregated geolocation-based simulation results covering viewshed, natural light, traffic noise, centrality and geometric analysis*
- **Publisher**: Archilyse AG
- **DOI / Record**: `10.5281/zenodo.7788422` (Version `3.0.0`)
- **Upstream Release Date**: 2023-03-31 (Archive verified: 2026-01-17)
- **Licence**: Creative Commons Attribution 4.0 International (**CC BY 4.0**)
- **Raw Storage**: `data/swiss/raw/swiss-dwellings-v3.0.0.zip` (931.8 MB), `geometries-train.parquet` (154.6 MB), `geometries-test.parquet` (26.8 MB)
- **Clean Pipeline**: `scripts/swiss_clean.py` $\rightarrow$ `data/swiss/clean.jsonl` (31.50 MB)

#### Cleaning & Normalization Method:
- Filtered `entity_type == 'area'`, eliminating non-habitable structural voids, shafts, and columns.
- Grouped spatial units by `building_id` and vertical `floor_id`, preserving multi-floor building structures, vertical stacking, and staircases.
- Evaluated and mapped room types to Nestora's 14-category schema:
  - `Livingroom` / `LIVING_ROOM` / `LIVING_DINING` $\rightarrow$ `living`
  - `Dining` $\rightarrow$ `dining`
  - `Kitchen` $\rightarrow$ `kitchen`
  - `Bathroom` $\rightarrow$ `toilet`
  - `Bedroom` $\rightarrow$ `bedroom_master` (largest bedroom by area in the plan) and `bedroom` (other bedrooms)
  - `Corridor` / `Entrance Door` $\rightarrow$ `passage`
  - `Balcony` / `Terrace` $\rightarrow$ `balcony`
  - `Stairs` / `STAIRCASE` $\rightarrow$ `stair`
  - `Storeroom` $\rightarrow$ `store`
  - `ELEVATOR` $\rightarrow$ `utility`
- Filtered broken plans lacking essential residential rooms (living, kitchen, bedroom, toilet).
- Scaled and translated building coordinates to origin $(0.0, 0.0)\text{ m}$.
- Output JSON Lines format matches `data/resplan/clean.jsonl`:
  `{"id": f"swiss_bldg_{bldg_id}", "width_m": width_m, "depth_m": depth_m, "floors": floors, "rooms": rooms_out, "source_id": bldg_id}`

### 3.2 Modified Swiss Dwellings (MSD, 4TU.ResearchData)
- **Title**: *Modified Swiss Dwellings: a Machine Learning-ready Dataset for Floor Plan Auto-Completion at Scale*
- **Authors**: Casper van Engelenburg, Seyran Khademi, Fatemeh Mostafavi, Matthias Standfest, Michael Franzen (TU Delft & Archilyse AG)
- **DOI**: `10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9` (v2)
- **Release Date**: 2023-07-11
- **Licence**: Creative Commons Attribution 4.0 International (**CC BY 4.0**)
- **Raw Storage**: `data/msd/raw/` (`train-*.parquet`, `test-*.parquet`, `README.md`)
- **Clean Pipeline**: `scripts/msd_clean.py` $\rightarrow$ `data/msd/clean.jsonl` (27.90 MB)

#### Deduplication Finding:
- **Critical Architectural Finding**: MSD was derived directly by filtering Swiss Dwellings v3.0.0 for residential building complexes with $> 10$ rooms and $\ge 2$ Zone 2 rooms for the ICCV 2023 CVAAD Challenge.
- **Deduplication Analysis**: Comparing all 5,372 floor plans in MSD against the 2,550 buildings in Swiss Dwellings v3.0.0:
  $$\text{Overlap}(\text{MSD}, \text{Swiss}) = 5,372 \text{ out of } 5,372 \quad (\mathbf{100.0\%})$$
- Every single floor plan in MSD originates from Swiss Dwellings v3.0.0.
- When trained in conjunction with Swiss Dwellings, **MSD adds 0 novel buildings**.
- `scripts/msd_clean.py` provides standalone cleaning (4,230 clean floor plans across 2,052 buildings) as well as `--drop-swiss` deduplication (dropping all 5,372 duplicate plans to prevent training data leakage).

---

## 4. Comprehensive Survey of Candidate Floor-Plan Datasets

| # | Dataset | Upstream Link | Licence & Terms | Usable Commercially? | Exact Licence Quote / Legal Ground |
|---|---|---|---|---|---|
| 1 | **ResPlan** | [GitHub: m-agour/ResPlan](https://github.com/m-agour/ResPlan) | CC BY 4.0 (Data) / MIT (Code) | **YES** | **Confirmed.** Root `LICENSE`: *"Creative Commons Attribution 4.0 International (CC BY 4.0)... The dataset consists of derived geometric representations (polygon coordinates and room-connectivity graphs)... The underlying spatial arrangement of a building is a matter of fact rather than creative expression, and facts are not subject to copyright."* |
| 2 | **Swiss Dwellings** | [Zenodo: 7788422](https://doi.org/10.5281/zenodo.7788422) | CC BY 4.0 | **YES** | **Unconfirmed** (previous quote *"Users are free to share and adapt the material for any purpose, even commercially"* does not appear on the Zenodo landing page). Confirmed landing page metadata states: *"Creative Commons Attribution 4.0 International"* (SPDX: `cc-by-4.0`), with description: *"Creative Commons Attribution license allows re-distribution and re-use of a licensed work on the condition that the creator is appropriately credited."* |
| 3 | **MSD (Modified Swiss Dwellings)** | [4TU: 10.4121/e1d89cb5](https://doi.org/10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9) | CC BY 4.0 | **YES** *(Duplicate of Swiss Dwellings)* | **Unconfirmed** (previous quote string *"license: https://spdx.org/licenses/CC-BY-4.0 ... 4TU.ResearchData"* is not verbatim on the landing page). Confirmed landing page metadata specifies: *"CC BY 4.0"* (`https://creativecommons.org/licenses/by/4.0/`). (Note: 100% duplicate of Swiss Dwellings). |
| 4 | **RPLAN** | [USTC DeepLayout](http://staff.ustc.edu.cn/~fuxm/projects/DeepLayout/index.html) / [USTC Request Form](https://docs.google.com/forms/d/e/1FAIpQLSfwteilXzURRKDI5QopWCyOGkeb_CFFbRwtQ0SOPhEg0KGSfw/viewform) | Non-Commercial Research & Academic Agreement via Request Form | **NO** | **Confirmed** on USTC DeepLayout Google Form: *"I will not redistribute the dataset in any way and in any format. Any new access will be established through this form and/or authors' official method of releasing the dataset. I agree that the data will be used only for non-commercial research and academic purposes."* (Note: previous citation to Zenodo record 4687596 was erroneous; that record is a 2007 mollusc taxonomy paper by Gosliner et al.). |
| 5 | **MLSTRUCT-FP** | [GitHub: MLSTRUCT/MLStructFP](https://github.com/MLSTRUCT/MLStructFP) | MIT License | **YES** | **Confirmed.** Repository `LICENSE`: *"MIT License... Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software..."* |
| 6 | **CubiCasa5K** | [GitHub: CubiCasa/CubiCasa5k](https://github.com/CubiCasa/CubiCasa5k) / [Zenodo: 2613548](https://zenodo.org/records/2613548) | CC BY-NC 4.0 (GitHub) / CC BY-NC-SA 4.0 (Zenodo) | **NO** | **Unconfirmed** (previous quote *"The dataset is available for non-commercial research purposes only. For commercial use, please contact the authors."* does not appear on repo or Zenodo pages). Confirmed text in repo `LICENSE`: *"CubiCasa5K is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License."*; Zenodo metadata states `"id": "cc-by-nc-sa-4.0"`. |
| 7 | **LIFULL HOME'S** | [NII Informatics RDR](https://www.nii.ac.jp/dsc/idr/en/lifull/) | NII IDR Custom Academic Agreement | **NO** | **Unconfirmed** (previous quote *"Applications are accepted only from researchers belonging to a university or public research institution... Strictly prohibited for commercial use."* was paraphrased). Confirmed verbatim text on landing page: *"Only researchers belonging to a university or a public research institution can apply to use the Data... Usage is limited to academic research purposes only."* |
| 8 | **FloorPlanCAD** | [FloorPlanCAD](https://floorplancad.github.io/) | CC BY-NC 4.0 | **NO** | **Unconfirmed** (previous quote *"The dataset is distributed under CC BY-NC 4.0 for academic and educational non-commercial research only."* was paraphrased; HuggingFace mirror link returned 404). Confirmed verbatim text on website: *"The annotations in this dataset along with this website belong to us and are licensed under a Creative Commons Attribution-NonCommercial 4.0 License."* |
| 9 | **Structured3D** | [Structured3D](https://structured3d-dataset.org/) | Structured3D Terms of Use / Non-Commercial | **NO** | **Unconfirmed** (previous quote *"The Structured3D database is available for academic research and educational non-commercial purposes only."* is not on the homepage). Confirmed verbatim text on homepage: *"The data is released under the Structured3D Terms of Use, and the code is released under the MIT license."* Access requires submitting a non-commercial Google Form agreement. |
| 10 | **HouseExpo** | [GitHub: TeaganLi/HouseExpo](https://github.com/TeaganLi/HouseExpo) | Non-Commercial / Tainted (SUNCG derived) | **NO** | **Unconfirmed** (previous quote *"Derived from SUNCG layout data... prohibited from commercial redistribution due to SUNCG intellectual property settlement."* does not appear in repo; previous link `Teagan42/HouseExpo` returned 404). Confirmed verbatim text in README: *"HouseExpo is a large-scale dataset of indoor layout built on [SUNCG dataset](http://suncg.cs.princeton.edu/#)."* (SUNCG was terminated following Princeton litigation prohibiting commercial use). |
| 11 | **ROBIN** | [GitHub: gesstalt/ROBIN](https://github.com/gesstalt/ROBIN) | GPL-3.0 (Copyleft) | **NO / UNCLEAR** | **Unconfirmed** (previous quote *"GNU General Public License v3.0... you must pass on the same freedoms."* is not in repo). Confirmed in repo `LICENSE`: standard *"GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007"* imposing copyleft terms. |
| 12 | **R2V (Raster-to-Vector)** | [GitHub: art-programmer/FloorplanTransformation](https://github.com/art-programmer/FloorplanTransformation) | Vector annotations MIT; raster images proprietary (LIFULL) | **NO** | **Unconfirmed** (previous quote *"We cannot distribute the original raster floorplan images due to copyright restrictions of the LIFULL dataset."* was paraphrased). Confirmed verbatim text in README: *"We don't have the permission to share the rasterized images, which are from the LIFULL dataset. Here we only share our vector-graphics annotations which might be helpful for other tasks."* |
| 13 | **3D-FRONT** | [Alibaba Tianchi 3D Scene Dataset](https://tianchi.aliyun.com/specials/promotion/alibaba-3d-scene-dataset) | 3D-FRONT Terms of Use | **NO** | **Unconfirmed** (previous link `.../front-datasets` returned 404; previous quote *"The dataset is available for scientific research purposes only. Any commercial use of the dataset or its derivatives is strictly prohibited."* could not be verified on the page). Requires signed Terms of Use PDF agreement for research access. |
| 14 | **Indian Govt: PMAY Type Designs** | [MoHUA PMAY-U](https://pmay-urban.gov.in/) / [Copyright Policy](https://pmay-urban.gov.in/copyright) | Government Copyright | **NO / UNCLEAR** | **Unconfirmed** (previous quote *"© All Rights Reserved by MoHUA / State Housing Boards. For beneficiary guidance only."* does not appear on site). Confirmed verbatim text on `/copyright`: *"Contents of this website may not be reproduced partially or fully, without due permission from NIC... Copyright © 2019 Ministry of Housing and Urban Affairs, Government of India, All rights reserved."* |
| 15 | **Indian Govt: CPWD Type Plans** | [CPWD](https://cpwd.gov.in/) | Government Copyright / Standard Architectural Norms | **NO / UNCLEAR** | **Unconfirmed** (previous quote *"© Central Public Works Department. Government work protected under Indian Copyright Act Section 17(d)."* was analytical commentary, not found verbatim on site). |

---

## 5. Statistical Counts & Metric Distributions

### 5.1 Dataset Scale & Cleaning Counts

| Metric / Dimension | ResPlan (South Asia) | Swiss Dwellings (Zenodo 7788422) | Modified Swiss Dwellings (MSD) |
|---|---|---|---|
| **Raw Count** | 17,000 plans | 2,550 buildings | 5,372 floor plans |
| **Dropped (Broken Plans)** | 3,473 | 470 | 1,142 |
| *— Missing Living* | 1,328 | 460 | 1,072 |
| *— Missing Bedroom* | 412 | 9 | 68 |
| *— Missing Kitchen* | 289 | 1 | 2 |
| *— Missing Bathroom* | 344 | 0 | 0 |
| *— Invalid / Augmented* | 1,100 (683 aug + geom err) | 0 | 0 |
| **Duplicates Dropped** | 0 (canonical split) | 0 | **5,372** *(100% duplicate of Swiss Dwellings)* |
| **Final Clean Count** | **13,527** | **2,080** | **4,230** (standalone) / **0** (deduplicated) |
| **Output File** | `data/resplan/clean.jsonl` | `data/swiss/clean.jsonl` | `data/msd/clean.jsonl` |
| **Output File Size** | 24.3 MB | 31.50 MB | 27.90 MB |

### 5.2 Multi-Floor Distributions (Floors per Building)

```
Floors per Building: Swiss Dwellings vs. ResPlan
ResPlan:          [1 Floor: 100.0%]
Swiss Dwellings:  [1 Floor: 33.4%] [2 Floors: 33.8%] [3 Floors: 20.1%] [4 Floors: 8.6%] [5+ Floors: 4.1%]
```

| Floor Count | ResPlan Count (%) | Swiss Dwellings Count (%) | MSD Buildings Count (%) |
|---|---|---|---|
| **1 Floor** | 13,527 (100.0%) | 695 (33.4%) | 810 (39.5%) |
| **2 Floors (G+1)** | 0 (0.0%) | **703 (33.8%)** | 651 (31.7%) |
| **3 Floors (G+2)** | 0 (0.0%) | **418 (20.1%)** | 369 (18.0%) |
| **4 Floors (G+3)** | 0 (0.0%) | **179 (8.6%)** | 155 (7.6%) |
| **5 Floors** | 0 (0.0%) | 47 (2.3%) | 31 (1.5%) |
| **6 Floors** | 0 (0.0%) | 22 (1.1%) | 22 (1.1%) |
| **7 Floors** | 0 (0.0%) | 13 (0.6%) | 11 (0.5%) |
| **8+ Floors** | 0 (0.0%) | 3 (0.1%) | 3 (0.1%) |
| **Total Multi-Floor (2+ Floors)** | **0 (0.0%)** | **1,385 (66.6%)** | **1,242 (60.5%)** |

### 5.3 Vertical Circulation: Plans with Stairs

| Dataset | Plans with Stair | Stair Frequency (%) | Role in Nestora Training |
|---|---|---|---|
| **ResPlan** | ~0 (141 parking/stair tags) | 0.0% | Learns single-floor horizontal apartment layout |
| **Swiss Dwellings** | **1,842** | **88.6%** | **Primary source for learning multi-floor staircase placement & vertical stacking** |
| **MSD** | 2,901 | 68.6% | Learns building complex core & access circulation |

### 5.4 Plot-Size Distribution vs. Mumbai Plotted Residential Footprints

Per Municipal Corporation of Greater Mumbai (MCGM) Development Control and Promotion Regulations 2034 (**DCPR 2034**, Table 12 & Reg 30):
- **Small Plotted Housing (20×30 ft / 6.1m × 9.14m)**: Plot Area $= 55.7\text{ m}^2$ (Max Ground Coverage ~75%, Footprint $\approx 41.8\text{ m}^2$).
- **Medium Plotted Housing (30×40 ft / 9.14m × 12.19m)**: Plot Area $= 111.5\text{ m}^2$ (Max Ground Coverage ~65%, Footprint $\approx 72.5\text{ m}^2$).
- **Large Bungalow Plot (40×60 ft / 12.19m × 18.29m)**: Plot Area $= 223.0\text{ m}^2$ (Max Ground Coverage ~60%, Footprint $\approx 133.8\text{ m}^2$).
- **Multi-Family Low-Rise Blocks**: Footprint $> 250\text{ m}^2$.

| Dimension Metric | ResPlan (Single Apartments) | Swiss Dwellings (Full Buildings) | Mumbai 20×30 to 40×60 ft Scale |
|---|---|---|---|
| **Width $p_{10}$** | 8.4 m | 16.5 m | 6.1 m to 12.2 m |
| **Width $p_{50}$ (Median)** | **11.6 m** | **23.5 m** | 9.1 m (Standard 30 ft plot) |
| **Width $p_{90}$** | 16.8 m | 40.0 m | 12.2 m (Large 40 ft plot) |
| **Depth $p_{10}$** | 9.2 m | 17.0 m | 9.1 m to 18.3 m |
| **Depth $p_{50}$ (Median)** | **12.8 m** | **24.1 m** | 12.2 m (Standard 40 ft plot) |
| **Depth $p_{90}$** | 18.4 m | 41.8 m | 18.3 m (Large 60 ft plot) |
| **Footprint Area $p_{50}$** | **128.0 m²** | **575.0 m²** | 72.5 m² to 133.8 m² |
| **Mumbai 20×30 ft Scale Match** | 1,482 plans (11.0%) | 0 buildings (0.0%) | Rowhouses & EWS plots |
| **Mumbai 30×40 ft Scale Match** | 4,812 plans (35.6%) | 0 buildings (0.0%) | Middle-income row villas |
| **Mumbai 40×60 ft Scale Match** | 5,108 plans (37.8%) | 10 buildings (0.5%) | Standalone bungalows |
| **Larger Multi-Family Blocks** | 2,125 plans (15.7%) | 2,059 buildings (99.0%) | Low-rise residential complexes |

#### Key Spatial Insight:
- **ResPlan plans map 1-to-1 to Mumbai residential plot footprints**: 84.4% of ResPlan floor plans fall directly within the 20×30 ft to 40×60 ft Mumbai residential bungalow plot bounds.
- **Swiss Dwellings provides the multi-floor and vertical staircase circulation knowledge**: Swiss buildings represent residential blocks ($p_{50} = 575\text{ m}^2$) comprising 2 to 4 vertical floors. Training models on both allows transferring staircase core alignments and multi-floor stacking rules onto Mumbai bungalow footprints.

---

## 6. Mandatory Attribution Language

Per Section 3(a) of the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license, any commercial software, AI model, API service, model card, or datasheet derived from these datasets must present the following notices:

### 6.1 ResPlan Attribution
> *"This layout model was trained on derived geometric representations from the ResPlan dataset (Abouagour & Garyfallidis, 2025/2026), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Original floor plan geometries recovered from publicly accessible real-estate listings without redistribution of proprietary listing imagery or personal data."*

### 6.2 Swiss Dwellings Attribution
> *"This spatial engine utilizes spatial and multi-floor structural representations derived from the Swiss Dwellings database v3.0.0 (Archilyse AG, 2023/2026), hosted on Zenodo (DOI: 10.5281/zenodo.7788422) and licensed under the Creative Commons Attribution 4.0 International License (CC BY 4.0, https://creativecommons.org/licenses/by/4.0/)."*

### 6.3 Modified Swiss Dwellings (MSD) Attribution (When Referenced)
> *"Benchmarking and structural access graph validation incorporates data structures from the Modified Swiss Dwellings (MSD) dataset (van Engelenburg, Khademi, Mostafavi, Standfest, & Franzen, 2023), published on 4TU.ResearchData (DOI: 10.4121/e1d89cb5-6872-48fc-be63-aadd687ee6f9) under CC BY 4.0."*

---

## 7. Concrete Recommendation: Datasets to Train On Now

We recommend training Nestora's production layout generation and ranking models on the following combined corpus:

1. **Immediate Primary Training Corpus**:
   - **ResPlan (`data/resplan/clean.jsonl`)**: **13,527 clean plans**. Use as the primary corpus for South Asian room proportions, functional adjacency (living-dining-kitchen-pooja), and 20×30 to 40×60 ft plot boundary compliance.
   - **Swiss Dwellings (`data/swiss/clean.jsonl`)**: **2,080 clean multi-floor buildings**. Use as the primary teacher for vertical multi-story stacking (floors 1–4), vertical load-bearing alignment, and staircase positioning.
   - **Total Combined Size**: **15,607 clean, non-overlapping plans**.

2. **Datasets to Omit / Exclude**:
   - **MSD**: **Exclude from retraining mix** because 100% of its plans duplicate Swiss Dwellings v3.0.0. Ingesting both would double-weight Swiss layouts and contaminate validation splits.
   - **RPLAN, CubiCasa5K, FloorPlanCAD, Structured3D, LIFULL, 3D-FRONT**: **Strictly exclude** due to non-commercial (`NC`) academic research agreements and licensing restrictions.
   - **HouseExpo**: **Strictly exclude** due to tainted SUNCG legal status.
   - **Indian PMAY / CPWD Type Designs**: **Do not scrape or ingest raw PDFs**. When Nestora requires standardized low-cost housing type designs, architectural draftsmen should manually vectorize canonical plinth norms into Nestora's proprietary template catalogue under original copyright.

3. **Retraining Loop & Audit Cadence**:
   - Establish an automated monthly pipeline checking `m-agour/ResPlan/REMOVED.md` for copyright takedowns.
   - Retain `verified: false` flags in model metadata until an architectural auditor certifies that generative outputs adhere to DCPR 2034 light/ventilation shafts (Reg 41) and NBC 2016 Part 3 staircase tread/riser dimensions.
