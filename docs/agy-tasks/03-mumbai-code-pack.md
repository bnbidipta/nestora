# agy task 03: Mumbai building-code pack (research draft)

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `backend/app/data/packs/mumbai.draft.json` and `docs/mumbai-code-research.md`

## Goal
The Judge checks every generated house against city rules. Today's `backend/app/data/packs/mumbai.json` was copied from a product brief that even names the wrong city (BBMP is Bengaluru). We need a cited draft that an architect can verify quickly.

## Scope: small residential plots in Greater Mumbai (MCGM), new build, G to G+2, plots from 20×30 ft to 40×60 ft
Primary sources:
- **DCPR 2034** (Development Control and Promotion Regulations for Greater Mumbai, 2034)
- **NBC 2016**
- **IS 456:2000**, **IS 875 (Part 3)**, **IS 1893 (Part 1):2016**, **IS 1742**

If a rule varies by zone, road width or plot size, encode the variation as a table, not a single number.

## Schema
Every value is an object, not a bare number:
```json
{"value": 1.0, "unit": "m", "source": "DCPR 2034, Reg. 41(x), Table N", "verified": false, "confidence": "high|medium|low", "notes": "applies when road width < 9 m"}
```

The file must contain:
```json
{
  "city": "Mumbai", "authority": "MCGM", "pack_version": "0.2-draft", "verified": false,
  "units": "metric",
  "fsi": {"base_by_road_width": [{"road_width_max_m": 9, "fsi": {"value":..., "...":"..."}}], "premium_fsi_note": "..."},
  "setbacks": {"by_plot_and_road": [{"plot_area_max_m2": ..., "road_width_max_m": ..., "front": {...}, "side": {...}, "rear": {...}}]},
  "max_height": {...}, "max_floors_note": "...",
  "ground_coverage": {...},
  "min_room": {"habitable_area_m2": {...}, "habitable_min_width_m": {...}, "kitchen_area_m2": {...}, "toilet_area_m2": {...}, "ceiling_height_m": {...}},
  "ventilation": {"window_to_floor_ratio": {...}},
  "doors_mm": {"main": {...}, "habitable": {...}, "toilet": {...}},
  "stair": {"min_width_m": {...}, "max_riser_mm": {...}, "min_tread_mm": {...}},
  "parking": {...},
  "structural": {"min_column_mm": {...}, "span_depth_ratio": {...}, "seismic_zone_factor": {...}, "basic_wind_speed_ms": {...}},
  "site_defaults": {"soil_bearing_kn_m2": {...}, "annual_rainfall_mm": {...}},
  "crz_and_special_zones_note": "When coastal (CRZ) / heritage / airport-height zones change the rules",
  "approval_checklist": ["Documents MCGM requires for a building permission application"],
  "open_questions": ["Things you could not resolve that an architect must answer"]
}
```

## `docs/mumbai-code-research.md`
- What you found and where.
- Where the old `mumbai.json` values were wrong.
- A list of what an architect must confirm, ordered by impact.

## Done when
- The JSON parses.
- Every numeric value has a `source` (or `null` + `confidence: low`).
- `open_questions` is honest.
