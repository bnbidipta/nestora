# agy task 06: Starter plan-template sketches

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `backend/app/data/templates/draft/` (one JSON per template) and `docs/templates-research.md`

## Goal
The layout generator fits **templates** to each user's buildable area with a constraint solver. A template is **topology and proportions, not fixed dimensions**: which rooms there are, which floor each is on, which rooms touch, and their rough relative sizes and positions. The solver computes the real dimensions. Claude Code encodes the solver; you research and sketch common Indian independent-house typologies.

## Coverage: 12 templates
- **Plot buckets (ft):** 20×30, 30×40, 30×50, 40×60.
- **Floors:** G, G+1 and G+2. Not every combination is needed; choose the 12 that are most common in Mumbai/Maharashtra independent houses.
- **Variety:** include
  - ≥ 2 with a ground-floor elder bedroom
  - ≥ 2 with an internal staircase and ≥ 1 external staircase (for a future rental floor)
  - ≥ 2 with car parking on the ground floor (stilt or front)
  - ≥ 1 with a central courtyard/light well

## Schema
```json
{
  "id": "t_30x40_g1_3bhk_elder",
  "plot_bucket_ft": [30, 40], "floors": 2, "bhk": 3, "verified": false,
  "tags": ["elder_ground_bedroom","internal_stair","car_parking"],
  "entrance_side": "front",
  "rooms": [
    {"id": "living", "type": "living", "floor": 0, "rel_area": 0.22, "min_aspect": 0.6,
     "zone": "front|middle|rear", "side": "left|centre|right", "needs_exterior_wall": true}
  ],
  "adjacency": [["living","dining"],["dining","kitchen"]],
  "must_not_touch": [["kitchen","toilet_g"]],
  "wet_core_stack": ["toilet_g","toilet_1"],
  "stair": {"type": "internal|external", "zone": "middle", "side": "right"},
  "notes": "Why this typology is common; who it suits",
  "source": "Where you found the typology (book, govt scheme plan, architecture site) or null"
}
```
- `rel_area` is the share of that floor's buildable area. The shares on each floor sum to ≤ 0.90; the rest is circulation and walls.
- Use the room vocabulary from task 02.

## `docs/templates-research.md`
- The typologies found.
- Why you picked these 12.
- What an architect should review.

## Done when
- 12 files parse.
- The `rel_area` sums are valid.
- Every adjacency references an existing room id.

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered files:**
  - 12 JSON templates in `backend/app/data/templates/draft/`
  - `docs/templates-research.md`
- **Validation:** Automated test script confirmed 0 errors:
  - All 12 templates parse cleanly.
  - Every floor has `rel_area` sum $\le 0.90$ (leaving 10–17% for walls and circulation).
  - All adjacencies, `must_not_touch`, and `wet_core_stack` references resolve to existing room IDs.
  - Variety requirements fulfilled: 5 elder ground bedrooms ($\ge 2$), 8 internal stairs ($\ge 2$), 2 external stairs ($\ge 1$), 9 car parking configurations ($\ge 2$), and 2 central courtyards ($\ge 1$).
- **Caveats for Solver Engineer:**
  - Middle-zone bathrooms require the solver to allocate a mechanical shaft / vertical duct to the roof terrace.
  - All templates tagged `"verified": false` pending licensed architect review.

