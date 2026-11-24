# agy task 18: Data on styles, materials and build quality

Follow the rules in `docs/agy-tasks/README.md`. This task is research only.

**Write only to:**
- `docs/research/data/styles-materials-quality.md`
- `docs/research/data/materials-properties.draft.json`

## Goal
Find data that helps Nestora choose the right style, materials and quality level for each family.

## Search
1. **Style data**
   - Labelled image datasets of architectural and interior styles, with their licences. Candidates include the Architectural Style dataset (Xu et al.), Wikimedia "Architecture by style", Places365, the LSUN room categories, the House Rooms Image Dataset, and sets derived from IKEA or Houzz.
   - Style taxonomies: Getty AAT (open licence) and Wikidata architectural-style items.
   - Cover Indian regional styles (Chettinad, Konkan, Kerala nalukettu, Rajasthani haveli, Bengali, Goan-Portuguese and others) as well as global styles.
2. **Material data**
   - Open databases of building-material properties: thermal conductivity, density, specific heat, embodied carbon (ICE database, ÖKOBAUDAT, EC3 and other EPD databases), durability, water absorption, slip rating (DIN 51130 or pendulum test), scratch hardness and VOC.
   - Indian standards for tiles, stone and cement (IS 15622, IS 1124 and others), plus BIS and CPWD specifications.
   - Cost data: the CPWD DSR, state Schedules of Rates, and market price feeds such as IndiaMART category pages. Quote each source's terms of use.
3. **Build-quality data**
   - Common construction defects in Indian homes and their causes (seepage, cracks, damp), from published studies.
   - Quality checklists: CPWD and RERA quality norms, and NBC 2016 Part 7.
   - Defect photo datasets whose licences allow commercial use.
4. **Paint and colour**
   - Open colour databases that give LRV values: NCS, RAL Classic LRV tables, and Asian Paints or Berger LRVs where they are published.
   - Evidence from colour-psychology studies.

## Output
- `styles-materials-quality.md`: a table of sources with, for each, a quote of its licence, its size, and how we would use it.
- `materials-properties.draft.json`: properties for the materials already listed in `backend/app/data/materials.json`, keyed by their ids.
  - Fields: conductivity_w_mk, density_kg_m3, specific_heat_j_kgk, embodied_carbon_kgco2e_kg, water_absorption_pct, slip_rating.
  - Give each entry a `source` and set `verified: false`.

Quote licences only from pages you actually opened; otherwise write "unconfirmed". When finished, append a done note to this file.

---

## Done + Caveats (2026-11-24)

### Status
Task completed. Output files generated:
1. `docs/research/data/styles-materials-quality.md`
2. `docs/research/data/materials-properties.draft.json`

### Summary of Completed Work
1. **Source Licensing & Terms Audit**:
   - Master comparison table created covering 20 sources across architectural styles, material property databases, build-quality specifications, and paint/colour standards.
   - Exact verbatim licence and terms quotes provided for all URLs successfully fetched and verified (Getty AAT ODC-By 1.0, Wikidata CC0, Wikimedia Commons CC0/CC BY-SA, Places2 MIT academic terms, LSUN GitHub citation terms, Circular Ecology ICE Educational v5.0 vs IC+ commercial terms, Building Transparency EC3 API terms, IndiaMART Section VI anti-scraping clause, SDNET2018 CC BY 4.0, Mendeley Concrete Crack Images CC BY 4.0, CPWD Government of India copyright, Houzz anti-scraping terms).
   - Sites blocked by automated bot-protection (Kaggle Cloudflare/reCAPTCHA) marked strictly as `"unconfirmed"`.
2. **Taxonomies & Indian Regional Architectural Styles**:
   - Integrated Getty AAT and Wikidata P149 open taxonomies.
   - Comprehensive analysis of 6 core Indian regional styles (Chettinad, Konkan, Kerala Nalukettu, Rajasthani Haveli, Bengali Chala/Dalan, Goan-Portuguese) detailing spatial layout, courtyards, climatic design features, traditional materials, and family brief compatibility.
3. **Materials Properties Database (`materials-properties.draft.json`)**:
   - Compiled physical, thermal, and embodied carbon properties for all 29 materials in `backend/app/data/materials.json` (15 floors, 4 walls, 10 finishes).
   - Keyed by material ID with fields: `conductivity_w_mk`, `density_kg_m3`, `specific_heat_j_kgk`, `embodied_carbon_kgco2e_kg`, `water_absorption_pct`, `slip_rating`, `source`, and `"verified": false`.
   - Mapped to Indian Standards (IS 15622, IS 1124, IS 1237, IS 1077, IS 12894, IS 2185-3, IS 3620, IS 710, IS 14900, IS 1786), CPWD Specifications 2019, DIN 51130 slip classes, and ICE Database v3.0 benchmarks.
4. **Build-Quality Defect Mitigation & Computer Vision Datasets**:
   - Documented top residential defect modes in India (rising damp, flat roof/sunken slab seepage, RCC-masonry junction cracking, debonded plaster) based on CSIR-CBRI Roorkee findings.
   - Documented statutory quality frameworks: NBC 2016 Part 7 QA checklists and RERA Act 2016 Section 14(3) 5-year defect liability warranty.
   - Audited open defect vision datasets (SDNET2018 CC BY 4.0 and Mendeley Concrete Crack CC BY 4.0) for automated visual inspection.
5. **Paint, Colour & Environmental Psychology**:
   - Mapped Light Reflectance Values (LRV) across RAL Classic, NCS, and Asian Paints Color Spectra.
   - Synthesized peer-reviewed color psychology evidence (Valdez & Mehrabian 1994, Elliot & Maier 2014, Stone 2001) for interior residential design.

### Caveats & Verification Notes
1. **All Outputs Unverified (`"verified": false`)**: In accordance with agy guidelines, all material engineering values, thermal conductivities, carbon intensities, and legal interpretations remain unverified until reviewed and signed off by a licensed architect and structural engineer.
2. **Commercial API / Scraping Boundaries**: Automated scraping of IndiaMART and Houzz is explicitly prohibited by their legal terms. Nestora must use statutory schedule of rates (CPWD DSR, Maharashtra PWD SSR) or negotiated commercial partner APIs.
3. **Embodied Carbon Licensing**: The ICE Database educational tier is restricted to non-commercial evaluation; commercial use in production software tools requires licensing Circular Ecology's IC+ database or connecting directly to verified EPD repositories (ÖKOBAUDAT / EC3).
4. **Git Status**: In accordance with README rule #2, no `git commit` or `git push` was performed.
