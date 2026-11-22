# agy task 13: Research what architects ask in a residential design brief (research only)

Follow the rules in `docs/agy-tasks/README.md`. **Research only**: do not design the questionnaire screens or write app code. Claude designs the questionnaire from your findings.

**Write only to:** `docs/research/residential-brief-inputs.md`

## Why
Users find the current questionnaire too coarse. We need to know every input a practising architect gathers from a family before concept design for an independent house, so Claude can design a more detailed, granular intake.

## Do
Research client-brief and programming practice. Good sources include RIBA Plan of Work stage 0–1 briefing, AIA "Architect's Handbook of Professional Practice" on programming, CoA (India) scope of services, published architect intake questionnaires, Neufert / Time-Saver Standards, and NBC 2016 Part 3 where it bears on the brief. List the inputs under these headings:
1. **Site**: dimensions, irregular shape, slope, levels, trees, neighbours, views, noise, sun, wind, existing structures, services (water, sewer, power), access, soil, flood.
2. **Household**: each person's age, routines, mobility, health, sleep schedules, guests, domestic help, pets, and how this changes over 10–20 years.
3. **Room program**: for each room type, the questions that size and place it. For example: bedrooms (bed size, storage, ensuite, dressing, desk), kitchen (cooking style, appliances, storage, utility, dry vs wet), living, dining (seats), study, puja/prayer, home theatre, gym, guest room, servant room, store, laundry, terrace, garden.
4. **Lifestyle**: entertaining, privacy gradients, indoor–outdoor living, hobbies, rituals, festivals, home business.
5. **Technical preferences**: AC vs passive cooling, solar, rainwater harvesting, water storage, power backup, security, smart home, lift, EV charging.
6. **Aesthetic**: style references, materials loved or hated, colour, light quality, ceiling heights.
7. **Budget and process**: budget range and what it includes, phasing, timeline, who decides, approvals, the risks they are worried about.

For each input, give: why it matters (what design decision it changes), how architects typically ask it, a sensible default if the client doesn't know, and a source.

## Output
`docs/research/residential-brief-inputs.md`, organised by the headings above. End with a ranked list of the 30 inputs that change the design most.

## Done when
Every heading is covered, and every input says what decision it affects and has a source.

---

## Done + Caveats (agy task 13)

- **Completed:** Comprehensive architectural briefing research across all 7 mandated headings:
  1. **Site (15 inputs):** Dimensions, irregular shape, slope, levels/datum, trees, neighbours, views, noise, sun path, wind, existing structures, utility services, road frontage/access, soil stratigraphy, flood history.
  2. **Household (9 inputs):** Occupant inventory & ages, daily routines & occupancy cycles, mobility & universal accessibility, health & sensitivities, sleep schedules & acoustics, guests & visits, domestic staff & service circulation, pets, 10–20 year lifecycle evolution.
  3. **Room program (15 inputs):** Master bedroom, secondary/children's bedrooms, kitchen (cooking style, wet vs dry scullery, appliances), living room, dining room, study/home office, puja/sacred sanctum, home theatre, gym/yoga studio, guest bedroom, domestic staff quarters, storage/pantry, laundry & drying yard, terraces & balconies, garden & landscape.
  4. **Lifestyle (7 inputs):** Entertaining scale, privacy gradients, indoor-outdoor living, hobbies & passions, cultural rituals & shoe removal, festivals & ceremonies, home business & client access.
  5. **Technical preferences (9 inputs):** Thermal comfort & HVAC, rooftop solar PV, rainwater harvesting, water storage & booster, power backup, security & CCTV, smart home automation, vertical circulation & elevator, EV charging.
  6. **Aesthetic (6 inputs):** Architectural style, materiality & maintenance tolerance, color palette & light reflectance, natural light quality & fenestration, spatial volumes & ceiling heights, acoustic character & tactile sensations.
  7. **Budget and process (6 inputs):** Total capital outlay & scope breakdown, phasing & vertical expansion, project timeline & monsoon milestones, decision-making hierarchy, statutory approvals & bylaws, risk perceptions & warranties.
- **Synthesized Register:** 66 granular architectural inputs, each detailing: (1) why it matters / design decision changed, (2) how architects typically ask it, (3) sensible default if unknown, and (4) verified formal source (NBC 2016, DCPR 2034, BIS codes, Neufert 4th Ed, Time-Saver Standards 4th Ed, RIBA Plan of Work 2020, AIA Handbook 15th Ed, CoA Manual 2020).
- **Prioritized Impact Ranking:** Concludes with a prioritized register of the **top 30 inputs that change the design most**, detailing root architectural decisions and downstream cascading impacts.
- **Deliverables written:**
  - `docs/research/residential-brief-inputs.md`
- **Caveats:**
  1. `"verified": false` remains set at top level; all architectural parameters, dimensions, and bylaw citations must be verified by a locally licensed architect before being encoded into automated statutory checkers or generative constraint solvers.
  2. Sensible defaults represent typical middle-density urban Indian detached residential benchmarks; regional variations (e.g., hill stations, seismic Zone V, extreme arid desert zones) will require tailored bioclimatic calibrations.
  3. Research only: No UI screens, questionnaire components, or application code were designed or modified. Pure research deliverable ready for Claude's intake questionnaire v3 design.
