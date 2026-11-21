# agy task 11: Check every template fits its plot under the Mumbai rules

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `docs/template-feasibility.md`

## Why
The layout solver will fit the 12 templates in `backend/app/data/templates/draft/` into the buildable area left after setbacks in `backend/app/data/packs/mumbai.draft.json`. If a template can't fit its own plot bucket even in principle, we need to know before writing the solver.

## Do
For each template, and its plot bucket:
1. Compute the buildable footprint. Use plot size minus front, side and rear setbacks from `mumbai.draft.json`, picking the row for that plot area and a 9 m road. State which row you used.
2. Compute the floor area allowed. Use plot area × base FSI. Note what changes with premium FSI.
3. Check the template against both: the footprint per floor × floors ≤ the floor area allowed. Check each room's minimum size, using the `min_room` values in the pack, against `rel_area` × the footprint. Check that the stair and parking fit.
4. Give each template a verdict: `fits`, `fits_with_premium_fsi`, or `does_not_fit`, with the numbers that justify it.

## Output
`docs/template-feasibility.md` contains:
- one table row per template, showing each number used
- a short list of the templates to fix or drop, and why

## Done when
All 12 templates have a verdict backed by the numbers.

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered files:**
  - `docs/template-feasibility.md`
- **Validation:** Full numeric audit performed across all 12 templates against DCPR 2034 and NBC 2016 parameters from `backend/app/data/packs/mumbai.draft.json` for a 9.0 m road.
  - Setbacks evaluated: Row 1 (plots $\le 100\text{ m}^2$) gives $23.12\text{ m}^2$ footprint; Row 2 (plots $\le 250\text{ m}^2$) gives $47.26\text{ m}^2$ (30×40), $65.99\text{ m}^2$ (30×50), and $126.74\text{ m}^2$ (40×60).
  - All 12 templates have an explicit verdict backed by exact numerical calculations for footprint, FSI, room dimensions, stairs, and parking.
  - Verdict summary: 1 `fits` (`t_30x50_g1_3bhk_courtyard`), 4 `fits_with_premium_fsi` (`t_30x50_g2_independent_floors`, `t_40x60_g1_4bhk_luxury`, `t_40x60_g1_courtyard_vaastu`, `t_40x60_g2_5bhk_multigen_lift`), and 7 `does_not_fit` (due to statutory room carpet area violations or setback stair/parking deficits).
- **Key Caveats for Layout Solver Engineer & Reviewing Architect:**
  1. **20×30 Plot Limitation:** Standard detached setbacks leave only $23.12\text{ m}^2$, making detached 1BHKs physically impossible under statutory room minimums ($27.10\text{ m}^2$ room carpet required). Both 20×30 templates should be dropped unless zero-setback gaothan/row-house rules apply.
  2. **Car Porch Deficit:** On 30 ft frontage plots, 3.0 m front setbacks cannot fit a standard 5.0 m car without recessing an open portico $2.5\text{ m}$ into the building footprint.
  3. **Non-FSI Deductions:** Ground stilt parking, central open courtyards, and open terrace gardens are non-chargeable under DCPR 2034 Reg. 31(1) and must be factored into solver FSI budgeting.
  4. All findings are unverified (`"verified": false`) pending review by a licensed architect registered with COA and MCGM.
