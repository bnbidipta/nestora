# agy task 09: Questionnaire v2 design (content, not code)

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `docs/questionnaire-v2.md` and `backend/app/data/questionnaire_v2.json`

## Why
The current form asks only 4 stages of basic questions, and many answers are never used. v2 must ask **12-15 questions**, and every answer must change the design. Claude Code builds the UI and logic; you design the questions.

## Must cover
1. Build type: new house on plot / flat interior / renovation. Flat and renovation lead to a waitlist.
2. Location: city plus locality/ward, or a map pin. Road width, plot facing, corner plot.
3. Plot size; floors wanted; parking.
4. Budget: whether it includes land, whether finance is needed, timeline.
5. Who lives there: adults, elders (and their mobility), kids, pets, work-from-home.
6. 5-10 year intent: rental floor, parents moving in, future lift.
7. Kitchen and diet (veg / non-veg / Jain separation), puja or prayer space, festivals and hosting guests.
8. Tradition preferences, each set to off / soft / strict, using the packs in `backend/app/data/traditions/`.
9. A free-text "anything else" field.
10. Confirming the site assumptions (soil, wind, rain) with an "I don't know" option.

## Schema for `questionnaire_v2.json`
```json
{"questions":[{"id":"build_type","step":1,"type":"single|multi|number|text|map|scale",
  "label":"What are you building?","help":"One line of plain-English help",
  "options":[{"value":"new_plot","label":"A new house on my plot"}],
  "required":true,"show_if":null,
  "affects":["pipeline_branch"],
  "clarify_if":"Condition under which the app asks a follow-up, e.g. free text mentions an elder but elders=0"}]}
```
- `affects` must name the design decisions the answer changes, e.g. `setbacks`, `room_program`, `kitchen_layout`, `boq_tier`.
- **If an answer affects nothing, drop the question.**

## Also write in `docs/questionnaire-v2.md`
- The step order and why.
- An estimate of completion time (target under 4 minutes).
- Wording guidance: plain English, no jargon. Use "floor area allowed" rather than "FSI", but show FSI in help text.

## Done when
- The JSON parses.
- Every question has a non-empty `affects` list.
- There are 12-15 questions, excluding follow-ups.

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered files:**
  - `backend/app/data/questionnaire_v2.json`: 14 comprehensive, progressive questions. Validated JSON where every single question has a specific, non-empty `affects` array, options, step assignment, and clarification logic.
  - `docs/questionnaire-v2.md`: 4-step progressive disclosure architecture, plain-English wording guidelines, sub-4-minute completion benchmark, and an architectural accountability matrix detailing how each response impacts the layout solver.
- **Validation:** Automated test script verified:
  - Valid JSON parsing.
  - Exactly 14 core questions (within the 12–15 range).
  - Every single question has a non-empty `affects` list.
  - No orphaned or purely decorative questions.

