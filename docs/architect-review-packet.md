# Architect review packet (Phase F gate)

Nestora generates **concept designs and estimates, not construction drawings**. Before a public pilot, licensed professionals need to check four things. Each one is listed below with the files to review and what "pass" means.

Who is needed: 2–3 architects registered with the Council of Architecture, and 1 structural engineer. Mumbai (MCGM) practice is preferred.

## 1. Mumbai rule pack: `backend/app/data/packs/mumbai.draft.json`
Every threshold the Judge and generator use, each with a clause citation. All are `"verified": false`.
- Check setbacks by plot area and road width, FSI by road width (base vs premium/TDR), height, minimum room areas and widths, ventilation, doors, stair risers and treads, and parking stall size.
- Known simplifications to accept or correct:
  - Open/stilt parking is treated as non-FSI (Reg. 31(1)).
  - The stair is a dog-leg with 175 mm risers and 250 mm treads.
  - Floor-to-floor height is 3.0 m.
  - Rainwater harvesting is required from 300 m².
- **Pass:** a reviewer signs off each row, or corrects it. Then flip `verified` to true per value.

## 2. Rates: `backend/app/data/packs/mumbai.rates.draft.json`
- Dated 2026-02, but escalated from 2024-11 by index. They need re-quoting from current Mumbai suppliers and contractors.
- The BOQ uses thumb-rule quantities per sqft (cement 0.4 bags, steel 4 kg, and so on) and a rough wall-area factor of 2.5× built-up.
- **Pass:** a quantity surveyor's estimate for 5 of the 50 designs below falls within the app's low–high range.

## 3. Structure (engineer): `backend/app/services/derive.py`
Preliminary sizing only:
- column grid at most 4.5 m apart, placed on room edges
- 12 kN/m² per floor
- IS 456 cl. 39.3 short columns at 1% steel, 230 mm wide
- beam depth = span/16 + 50 mm
- isolated footings unless they would cover more than half the footprint, otherwise a raft
- soil bearing 120 kN/m² by default

There is no seismic (IS 1893) or wind (IS 875-3) analysis.
- **Pass:** the engineer confirms these are safe as *preliminary* numbers for G to G+2, or gives better defaults.

## 4. Design quality: 50 generated designs
Generate them with `python -m backend.eval.review_set`. Output goes to `backend/eval/out/review/`: one DXF per design (metres; floors side by side) plus `ratings.csv`.

For each design, fill in:
- `rating_1_to_5`: 1 = unusable, 3 = workable starting point, 5 = would present to a client as is.
- `would_stamp_after_edits_y_n`: could this become a sanctionable plan with normal design development?
- `main_problem`: the single biggest issue. For example: circulation, room proportions, privacy, stair position, daylight, Vaastu.

**Pilot gate:**
- average ≥ 4.0
- ≥ 90% first-pass Judge (already measured at 97.6%; see `docs/eval-results.md`)
- ≥ 30 review requests from pilot users

## Tradition packs: `backend/app/data/traditions/*.json`
Seven packs (Vaastu, Sthapatya Veda, Mayamatam, Feng Shui, Islamic, Jain, Biophilic), researched with sources and all unverified. Review Vaastu and Biophilic first. Rules about fixtures (bed headboards, stair turning direction) aren't checked at concept stage; the app says so on screen.

## Known limitations to tell reviewers up front
- Layouts are rectangles in up to three full-width bands (front, middle with stair, rear). There are no L-shaped rooms, courtyards or split levels yet.
- Passages are allocated but not routed. A room may be reached through another room; the Judge warns when a floor has no passage or living space.
- Door and window positions are not drawn. The Judge checks widths and window areas only.
- Only Mumbai is loaded. 20×30 ft plots under standard detached setbacks are reported as infeasible rather than squeezed.
