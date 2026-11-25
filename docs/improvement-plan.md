# Nestora improvement plan: models + UI (2026-11-25)

Based on a code audit of the current generator, rule checks, brief extraction and 3D, plus web research on floor-plan generation, browser 3D realism, UI direction and Google Stitch. Nothing here is built yet.

## Why the product feels weak today (audit findings)

| Area | What's wrong | Where |
|---|---|---|
| Floor plans | Rooms are packed into 3 full-width rows, so plans look like strips; leftover width becomes anonymous "utility" bays | `generator.py:227-275` |
| Floor plans | No circulation model: nothing guarantees every room is reachable; doors are added afterwards, so bedrooms can open off the kitchen; master toilet isn't forced next to the master bedroom | `furniture.py:44-59`, `derive.py:91` |
| Floor plans | Store and puja get dropped because area/aspect caps can't fit in deep rows | `generator.py:306-345` |
| Rule checks | Several checks pass by construction (windows generated as 1.2× the rule then checked against the rule; beam depth +50 mm); 5 judge flags are never set by any code | `derive.py:80,134`, `judge.py:173-260` |
| Rule checks | Only one unverified Mumbai rules pack; no seismic/wind, fire/egress, ground coverage, stair headroom | `data/packs/mumbai.draft.json` |
| Cost | Per-sq-ft thumb rules, not quantities; rates ~9 months old and unverified | `derive.py:176-209` |
| Brief AI | Drops correct inferences that aren't word-for-word quotes ("my parents live with us" → elders); LLM path untested | `llm.py:96-117` |
| 3D | Flat-colour boxes, no textures, glass, frames or door leaves, no tone mapping; no stair opening in slabs; whole scene rebuilt on every slider move (laggy) | `house3d.ts`, `House3D.tsx:261` |
| UI | Two themes (dark studio, ivory landing), inconsistent components, no shared design system | `app/(studio)/layout.tsx`, `form.tsx` |

## Research conclusions

- **Floor plans:** no free, CPU-friendly, commercially licensed AI floor-plan model exists (House-GAN, HouseDiffusion etc. need GPUs and research-only data). The proven route for our constraints is **"AI reads the brief → constraint solver places rooms → independent rule judge → scorer picks the best"**. The solver is Google OR-Tools CP-SAT (free, CPU, Apache-2.0), which handles non-overlap, adjacency, minimum sizes and setbacks as hard constraints. Recent papers (Co-Layout 2025, GPT-4 + solver 2024) use exactly this shape.
- **3D:** stay on plain three.js (no rewrite to react-three-fiber). Biggest wins are tone mapping, an environment map, free CC0 textures (Poly Haven, ambientCG), window/door detail, merged geometry, and rendering only when something changes.
- **UI:** one light, warm theme everywhere (the dark studio look suits pro tools, not families on phones). Photo-led, a serif display font with a clean sans, terracotta accent, shadcn/ui components.
- **Google Stitch:** free Google tool that generates screen designs from prompts and can export a DESIGN.md rule file; has an MCP connector for Claude Code. Use it to **explore 2–3 visual directions quickly**, not as production code (its code export is a scaffold at best).

## Decisions (2026-11-25)
- **Floor plans:** rework (Phase 2), top priority.
- **Rule checks:** fix the checks that pass by construction (Phase 3, items 1 only).
- **Cost:** keep the rough per-sq-ft estimate. Phase 3 item 4 (quantity take-off) is dropped; only refresh the rate table and show a range.
- **3D:** rework (Phase 5).
- **UI:** light theme only, no dark mode. Lock the visual direction first (Stitch exploration in progress: warm paper + terracotta, one-fold horizontal layouts, minimal content, 3D/motion), then apply it consistently everywhere.
- **Kaggle free GPU:** use it now in Phase 2 (see 2.7).

## Why some rule checks are "rigged"
The design engine creates something and the rule judge then checks it against the same number it was built from, so the check can never fail:
- **Windows:** the engine makes each window 1.2× the minimum window area the rule asks for (`derive.py:80`), then the judge checks "is the window at least the minimum?" (`judge.py:136`). Always yes.
- **Beams:** the engine sizes each beam to the rule's depth plus 50 mm (`derive.py:134`), then checks it against the rule. Always passes.
- **Door widths and structural safety factor:** copied from the same rule values, or hard-coded to exactly the minimum.
- **Five checks never run:** toilet under the stair, floating column, wiring crossing water pipes, furniture blocking a door, and toilet sharing a wall with the puja. Nothing ever sets them, so they always show "pass".

These aren't wrong houses; it's that "passes all rules" proves little. The fix is to compute each check from the actual drawn geometry, independently of how it was generated, and to either implement or remove the five dead checks.

## Phased roadmap

Each phase ends with something you can see on the live site. Effort is rough, for me working in this repo.

### Phase 1: Look and feel (UI foundation). ~1 week
You'll see: every screen in one consistent, premium light design.
1. Stitch exploration: generate the questionnaire, options and house screens in 2–3 directions; you pick one. (Needs you to sign in to Stitch once.)
2. Design tokens in one file: colours, fonts (Fraunces display + Inter body), spacing, radius, shadows. Remove the dark studio theme.
   - Proposed palette: background `#FAF7F2`, surface `#FFFFFF`, text `#1F1B16`, muted `#6B6358`, primary terracotta `#B4532A`, trust green `#1F4D45`, gold `#C9962B`.
3. shadcn/ui component set: button, input/number field, photo choice card, stepper, tabs, sheet (mobile drawer), tooltip, toast, skeleton.
4. Questionnaire redesign: 6–8 grouped screens, big photo choice cards for style/facing/floors, live plot preview, sticky Continue on mobile, autosave.
5. "Designing your home" screen: staged progress instead of a spinner.
6. Options board: photo-style thumbnails, 3 headline numbers, one-line "why it fits you", compare up to 3 side by side (swipe + compare sheet on phones).
7. House page: floor switcher, 2D/3D segmented control, layer toggles, cost tab with ₹ lakh ranges, "why this design" tied to the user's own answers, compliance checklist with honest badges.
8. Landing restyled to the same tokens: hero, how it works, sample home, style gallery, trust band, FAQ (Vaastu, bylaws), final CTA.
9. Visual QA at 375 px and 1440 px.

### Phase 2: Better floor plans (the core). ~2–3 weeks
You'll see: realistic plans with proper corridors, every room reachable, store and puja kept, wet areas stacked.
1. Topology archetypes: a curated library of Indian layouts (2/3/4 BHK, G, G+1, G+2, east/west/north/south facing), each an adjacency graph (living → dining → kitchen, bedroom ↔ its toilet, puja in north-east, etc.).
2. CP-SAT solver on a 1-ft grid replaces row slicing: hard constraints for non-overlap, setbacks, minimum sizes (NBC 2016: habitable 9.5 m² / 2.4 m wide, kitchen 5.0 m², etc.), adjacency, every room touching the circulation spine, toilets over toilets. Soft objectives for proportions, daylight, Vaastu zones, structural grid regularity. Allows L-shapes and courtyards later.
3. Doors placed by the solver on shared walls with the circulation spine, never through bedrooms.
4. Scorer: circulation share (target 8–12%), aspect ratios, privacy gradient (public → private), wet stacking, grid regularity, Vaastu; returns top options with plain-language reasons.
5. Keep the current generator as a fallback until the solver passes all tests.
6. Tests: drop rate, reachability, wet stacking, solver time under 5 s per option on CPU.
7. **Kaggle free GPU (now):** no usable pretrained floor-plan model exists (licences, GPU needs), so we train our own small models on data we generate:
   - Run the CP-SAT solver across thousands of plot/family/style combinations offline (CPU, or Kaggle's CPU/GPU sessions) to build a clean, commercially safe dataset of good plans with their scores.
   - On Kaggle GPU, train (a) a small graph model that proposes room adjacency (topology) for a brief, so the solver starts from better layouts and finishes faster, and (b) a ranker that predicts which plans an architect would prefer, using the scores plus users' likes and picks.
   - Export both to ONNX/numpy and run them on CPU in the backend, as the current critic already does. No paid GPU.
   - Gate: ship only if they measurably improve drop rate, solver time or option quality on a held-out test set.

### Phase 3: Honest rule checks and better estimates. ~1–2 weeks
You'll see: compliance badges that mean something, and a cost range with a real breakdown.
1. Remove checks that pass by construction; make every judge flag computed from geometry; delete or implement the 5 dead flags.
2. Rules packs per city as versioned data (start: Mumbai, Bengaluru, Pune, Delhi, Kolkata, Hyderabad) with source and date; fall back to NBC 2016 defaults with a clear "general rules, check your local authority" note.
3. Add: ground coverage %, stair headroom and riser/tread, fire egress for G+2, ceiling height, projections/balconies.
4. Cost: keep the rough per-sq-ft estimate (decided). Only refresh the dated rate table and show it as a range (e.g. ₹62–70 lakh).

### Phase 4: Smarter brief understanding. ~3–5 days
1. Keep structured JSON output, but accept clear inferences (with the source sentence shown to the user to confirm) instead of only word-for-word quotes.
2. Ask follow-up questions when something important is missing or conflicting, rather than guessing.
3. A small evaluation set of real-sounding briefs with expected outputs; run it on every change.

### Phase 5: 3D that looks like a render. ~1–2 weeks
You'll see: textured walls and floors, glass windows, door leaves, proper stairs, smooth on phones.
1. Fix lag first: build the scene once, update only lights/colours on slider changes, render only when something changes, cap pixel ratio at 1.5.
2. Tone mapping (Neutral for paint accuracy), a soft environment light, tightly fitted sun shadows.
3. CC0 textures for plaster, kota stone, teak, terracotta, brick, mapped at real-world scale; compressed.
4. Detail: skirting, window frames, sills and glass, door leaves, stair openings in slabs, a dog-leg stair that matches the plan, parapet coping.
5. Merge geometry per material (under 150 draw calls on phones).
6. Furniture: 10–15 free CC0 models (Poly Haven, Kenney) instead of boxes.
7. Desktop-only extras: anti-aliasing and soft ambient occlusion; later a "render a beautiful still" button.

### Later (optional)
- Learn from users' likes and edits to train a small ranking model on free Kaggle GPU.
- "Upload your own plan" feature.

## Order
1. Phase 2 (floor plans, including the Kaggle training) and Phase 3 item 1 (honest checks), together, since the new engine needs an independent judge.
2. Phase 5 (3D rework), starting with the lag fix.
3. Phase 1 (UI) as soon as the Stitch direction is locked; light theme only.
4. Phase 4 (brief reading), rest of Phase 3.

## Open decisions for you
1. Approve the light "warm paper + terracotta" direction, or explore in Stitch first?
2. Which cities' rules first?
3. Is any architect available to review plans before we claim "architect reviewed"? (We won't claim it otherwise.)
