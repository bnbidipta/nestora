# agy task 08: 500 realistic test briefs for the generator

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `backend/eval/briefs.json` and `docs/test-briefs-method.md`

## Why
Before the pilot we have to measure the new layout generator on many realistic requests: how often it passes the checks first time, stays within budget, and respects family needs. The old 20 briefs are all the same 30×40 house.

## Distribution
Make it realistic for **independent-house self-builders in Mumbai/MMR**, and describe your assumptions in `docs/test-briefs-method.md`:
- **Plots (ft):** mostly 20×30, 25×40, 30×40, 30×50, 40×60, plus ~10% odd sizes (e.g. 27×43, corner plots, narrow 15×50).
- **Floors wanted:** G / G+1 / G+2.
- **Budget:** ₹12L to ₹1.5Cr. Include ~15% that are deliberately too low for what is asked.
- **Family:** 1-3 adults, 0-3 elders (some with mobility needs), 0-3 kids, pets, work-from-home, joint families, a rental-floor intent.
- **Tradition preference:** none, or Vaastu, Feng Shui, Islamic or Jain at off/soft/strict, roughly matching Mumbai demographics.
- **Style:** one or two of `japanese, biophilic, brutalist, minimalist, indian_heritage, scandinavian, mediterranean, industrial`.
- **Free text:** 1-3 sentences in the user's own voice. Include Hinglish in ~20% of them, plus typos and vague phrasing.

## Schema (array of 500)
```json
{"id":"b0001","plot_width_ft":30,"plot_depth_ft":40,"corner_plot":false,"road_width_m":9,"facing":"E",
 "floors_wanted":2,"budget_inr":3500000,"adults":2,"elders":1,"elder_mobility_issue":true,"kids":1,"pets":true,
 "wfh_people":1,"joint_family":false,"rental_floor":false,"parking":"car|two_wheeler|none",
 "traditions":{"vaastu":"soft"},"styles":["minimalist"],
 "free_text":"Mummy ko ghutne mein dard hai, ground floor pe room chahiye. Ek dog bhi hai.",
 "expect":{"elder_ground_floor_bedroom":true,"over_budget_likely":false}}
```
`expect` holds only what a human architect would clearly agree with. Leave it empty when unsure.

## Done when
- The file has 500 valid entries with unique ids.
- The method doc explains each distribution.

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered files:**
  - `backend/eval/briefs.json`: Exactly 500 valid, diverse test briefs with unique sequential IDs (`b0001` through `b0500`).
  - `docs/test-briefs-method.md`: Comprehensive methodological documentation detailing statistical distributions, plot buckets, floor massing, budget baselines, Hinglish language modeling, and ground-truth validation rules.
- **Validation:** Automated test script confirmed:
  - Valid JSON parsing with 500 unique entries.
  - 451 standard plots (90.2%) and 49 odd plots (9.8% ~ 10%).
  - Exactly 100 Hinglish free-text prompts (20.0%).
  - 82 deliberately underfunded edge-case briefs (16.4% ~ 15%) flagged with `over_budget_likely: true`.
  - 86 briefs with elder mobility constraints (17.2%) flagged with `elder_ground_floor_bedroom: true`.

