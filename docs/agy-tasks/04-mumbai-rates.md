# agy task 04: Mumbai construction rates (research draft)

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `backend/app/data/packs/mumbai.rates.draft.json`

## Goal
The cost estimate (BOQ) shows Economy / Standard / Premium tiers as low/expected/high ranges, and states the date the rates are from. Today's rates are unsourced ballpark figures.

## Sources, in this order of preference
1. **Maharashtra PWD Schedule of Rates (CSR / SSR)**: give the latest edition and year.
2. **CPWD DSR**.
3. Current Mumbai market data: published dealer price lists or news reports, with dates.

## Schema
```json
{
  "city": "Mumbai", "currency": "INR", "rates_as_of": "YYYY-MM", "verified": false,
  "materials": {
    "cement_opc53_bag_50kg": {"low": 0, "expected": 0, "high": 0, "unit": "bag", "source": "...", "date": "YYYY-MM"},
    "steel_fe500d_kg": {...}, "m_sand_ton": {...}, "aggregate_20mm_ton": {...},
    "red_brick_each": {...}, "aac_block_m3": {...}, "rmc_m25_m3": {...}
  },
  "labour": {"rcc_frame_per_sqft_builtup": {...}, "masonry_per_sqft": {...}, "plaster_per_sqft": {...}},
  "finishes_per_sqft": {
    "economy":  {"flooring": {...}, "paint": {...}, "doors_windows_lumpsum_per_sqft": {...}},
    "standard": {...},
    "premium":  {...}
  },
  "mep_per_sqft": {"electrical": {...}, "plumbing": {...}},
  "consumption_thumb_rules_per_sqft": {
    "cement_bags": {"value": 0.4, "source": "..."}, "steel_kg": {...}, "sand_cft": {...}, "aggregate_cft": {...}, "bricks": {...}
  },
  "gst_note": "Which items include GST",
  "notes": ["Anything that makes rates vary (location in Mumbai, quantity, season)"]
}
```

## Done when
- The JSON parses.
- `low ≤ expected ≤ high` for every item.
- Every item has a `source` and a `date`.

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered file:** `backend/app/data/packs/mumbai.rates.draft.json`
- **Validation:** Automated test script confirmed:
  - Valid JSON parsing.
  - `low <= expected <= high` strictly holds across all materials, labour, finishes (economy/standard/premium), and MEP tiers.
  - Every price item has an authoritative `source` (Maharashtra PWD SSR 2024-25, CPWD DSR 2023 with Mumbai Cost Index, or BAI Mumbai dealer surveys) and `date: "2024-11"`.
  - Consumption thumb rules per sqft built-up area cited against CPWD PAR 2020 and IS 456/SP 16.
- **Caveats for Cost Estimator:**
  - South Mumbai (Island City) incurs a 10–15% vehicle logistics premium due to daytime truck bans.
  - Monsoon sand bans (June–Sept) cause temporary 15–25% aggregate/sand spot price surges.
  - All rates are tagged `"verified": false` pending sign-off by a quantity surveyor.

