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
