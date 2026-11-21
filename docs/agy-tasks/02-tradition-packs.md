# agy task 02: Tradition rule packs (research draft)

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `backend/app/data/traditions/` (one JSON file per tradition) and `docs/traditions-research.md`

## Goal
Users choose how strictly to follow home-planning traditions (off / soft / strict). The layout solver needs those traditions as **machine-checkable placement rules**. Building codes always override tradition rules.

## Traditions (one file each)
1. `vaastu.json` (Vaastu Shastra)
2. `sthapatya_veda.json` (Maharishi Sthapatya Veda)
3. `mayamatam.json` (Mayamatam / Manasara, South Indian)
4. `feng_shui.json` (Form School + Bagua)
5. `islamic.json` (qibla orientation, privacy and mahram zoning, ablution/toilet orientation)
6. `jain.json` (kitchen purity, food storage, water tanks)
7. `biophilic.json` (evidence-based: daylight, cross-ventilation, views, greenery). Cite research, not tradition.

## Schema for each file
```json
{
  "tradition": "vaastu",
  "display_name": "Vaastu Shastra",
  "description": "One paragraph, neutral tone",
  "verified": false,
  "schools_note": "Where schools disagree, say so",
  "rules": [
    {
      "id": "vaastu.kitchen.zone",
      "applies_to": "kitchen",
      "kind": "zone|avoid_zone|facing|adjacency|avoid_adjacency|entrance|centre_open|orientation_of_fixture",
      "value": {"preferred": ["SE"], "acceptable": ["NW"], "avoid": ["NE","SW"]},
      "strength": "core|common|minor",
      "rationale": "Why practitioners follow it (one line)",
      "source": "Text/author/edition and page or section, or null",
      "confidence": "high|medium|low"
    }
  ]
}
```
- **Directions** use the 8 compass zones (`N, NE, E, SE, S, SW, W, NW`) plus `CENTRE`, relative to true north.
- **Rooms** use the vocabulary `living, bedroom_master, bedroom, kitchen, toilet, puja, staircase, entrance, store, dining, study, balcony, water_tank_underground, water_tank_overhead, septic`. Add to it only if necessary.
- **Rules per tradition:** 10-25 of the most commonly followed. Prefer rules many practitioners agree on over obscure ones.

## `docs/traditions-research.md`
For each tradition:
- 3-5 bullet summary
- which rules conflict with typical Indian building codes or small plots, and how to resolve them
- the sources you used

## Done when
- All 7 files validate against the schema.
- Every rule has `source` and `confidence`.
- No clause or page numbers are invented.

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered files:**
  - 7 JSON files in `backend/app/data/traditions/`: `vaastu.json`, `sthapatya_veda.json`, `mayamatam.json`, `feng_shui.json`, `islamic.json`, `jain.json`, `biophilic.json`.
  - `docs/traditions-research.md`: Summaries, code/small-plot conflict resolutions, and academic/classical source citations.
- **Validation:** Automated test script verified:
  - All 7 files validate against the schema.
  - Every rule contains `id`, `applies_to`, `kind`, `value`, `strength`, `rationale`, `source`, and `confidence`.
  - Cardinal directions use standard 8 compass zones + `CENTRE`.
  - Building codes explicitly override tradition rules. All tagged `"verified": false` pending licensed professional verification.

