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
