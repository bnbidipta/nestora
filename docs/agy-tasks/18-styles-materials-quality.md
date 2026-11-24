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
