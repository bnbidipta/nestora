# NESTORA - Coding Agent Brief
**Version:** 3.1 - Integrated + SLM Locked
**Date:** Nov 2026
**Product:** Nestora - Your Home, Designed Around You. From Plot to Keys.
**For:** Coding Agents (Cursor / Claude Code / Copilot / Any AI Coder) + Human Owner
**Source of Truth:** This MD is the build spec. The DOCX is the business plan. If they conflict, this MD wins for code.

---

## HOW TO USE THIS FILE

**If you are a human:** Copy the MASTER PROMPT below and paste it into your coding agent along with this file.

**If you are a coding agent:** Read this whole file first. Do not start coding until you have read Sections 1-5 and 13. Then follow the MASTER PROMPT steps in order. Do not skip Judge. Do not let SLM draw structure.

---

## MASTER PROMPT - COPY PASTE THIS INTO YOUR CODING AGENT

> You are a Senior Full-Stack + ML Engineer building NESTORA.
>
> CONTEXT: Nestora is a global AI architect website. Single-stop solution from plot to keys. User answers questionnaire + swipes taste -> sees blueprint -> sees 3D structure with columns/foundation -> sees MEP, paints, materials, decor -> gets BOQ + loan help. There is no architect and no ML team. You are the team. Website must be architect-level. Pitch perfect from starting. If an architect finds one fault, we lose.
>
> YOUR INPUT: You have been given Nestora_Coding_Agent_Brief.md. That is your spec. Read it fully before coding.
>
> GOAL FOR THIS RUN: Build Phase 1 - Mumbai Pilot - as defined in Section 14 of the brief. One plot family only: 30x40 G+1 + 3BHK 1500 sqft apartment shell. Do NOT build Phase 2 yet.
>
> LOCKED RULES - VIOLATION = FAIL:
> 1. SLM IS ORCHESTRATOR ONLY. SLM understands language, builds Constraint Graph, creates DAG, explains decisions. SLM NEVER draws structure. SLM NEVER outputs a dimension, load, slope, or cost directly. SLM must always call a Task Model API. Task Model outputs number. Judge validates number. SLM explains number. If you let SLM output a column size directly, you have failed.
> 2. JUDGE IS PURE PYTHON, NOT ML, NOT SLM. Judge checks area, law, structure, MEP, ergonomics. If Judge FAILs, regenerate. Max 3 retries. No failed plan moves to next stage. Stage Gates are enforced in Orchestrator.
> 3. HOUSE TWIN IS SINGLE SOURCE OF TRUTH. All models read/write to House Twin JSON in Section 4. No model talks directly to another model. No duplicate state in frontend.
> 4. CUSTOM, NOT TEMPLATE. No fixed floor size. Every floor can have different height and area.
> 5. EVERY OUTPUT HAS REASON + NUMBER. Example: Column here because load 12 tons, soil 120 kN/m2, wind 44 m/s - never Column here because AI says so.
> 6. NO INVENTED CODES. Only use codes from Section 5 Packs. If code not found, mark MISSING, do not invent.
> 7. PYTHON FOR BACKEND, TYPESCRIPT FOR FRONTEND. Backend: FastAPI. Frontend: Next.js + Three.js + Tailwind.
>
> HOW TO WORK - FOLLOW THIS ORDER:
> Step 0 - Scaffold: Create file structure exactly as in Section 12. Create empty README with how to run.
> Step 1 - House Twin: Implement House Twin schema in Section 4 as Pydantic models in backend/app/models/twin.py. Add CRUD API: POST /house, GET /house/{id}.
> Step 2 - Judge: Implement Judge in backend/app/services/judge.py with all 5 Judge checks in Section 7. Write unit tests for each check. Judge must pass on 10 known good houses and FAIL on 10 known bad houses (beam span >6m without column, drainage slope wrong, door <900mm for elder, etc). Do not proceed until Judge tests are green.
> Step 3 - Plot + Layout + Structure APIs: Implement as FastAPI routers in backend/app/api/. Use deterministic rules + thumb rules from Section 8 for Phase 1. No LLM for these APIs. Return JSON as per Section 5 contracts.
> Step 4 - Orchestrator: Implement DAG in backend/app/services/orchestrator.py using LangGraph or simple Python DAG. Order: Plot -> Layout + Structure in parallel -> Judge -> MEP -> Color + Material + Style in parallel -> Climate + Sound -> Render -> Budget. If Judge FAIL, loop back max 3 times, then fallback to safe template.
> Step 5 - SLM Orchestrator Wrapper: Implement backend/app/services/slm.py. Use a fine-tuned SLM (or mock with rule-based translator for Phase 1 scaffold) that converts user sentence -> Constraint Graph JSON. SLM function signature: translate_to_constraints(user_text) -> ConstraintGraph. It must NOT return structure. Write tests for 20 examples in Section 16.
> Step 6 - Frontend: Build pages in Section 9 in order: Landing -> Questionnaire -> Swipe -> Blueprint Viewer -> Structure Viewer -> MEP / Paint / Decor toggles -> BOQ. Use Three.js for 3D, SVG for blueprint. All modes read from same Twin, no re-generation on toggle.
> Step 7 - Questionnaire + Swipe: Implement questionnaire as 4 stages in Section 10. Implement swipe as 3 decks, 30 cards, taste vector 512 floats. Store swipe_history in Twin.
> Step 8 - MEP + Color + Material + Budget: Implement APIs for these in same pattern as Step 3. Material DB must have 25 materials with Benefits/Loss from Section 8. Color must return exact RGB/CMYK/LAB.
> Step 9 - Tests + Scorecard: Run 20 test briefs in Section 16. Generate scorecard.md with pass/fail per brief, per Judge. Target: 18/20 pass. Fix failures, do not lower Judge thresholds.
> Step 10 - Deliver: Return file list, how to run (npm run dev, uvicorn), demo flow video steps, scorecard, and list of MISSING codes you marked.
>
> OUTPUT FORMAT - WHAT YOU MUST RETURN:
> - List of files created / changed
> - How to run: backend + frontend commands
> - Demo steps: Questionnaire -> Swipe -> Generate -> View modes
> - scorecard.md content
> - Known gaps: What is mocked, what is MISSING
>
> CONSTRAINTS:
> - Do not use external paid APIs for core generation. Mock external APIs in backend/app/services/external.py with fallback values.
> - Do not add new features not in spec. No login system beyond mock, no payment beyond mock 999 review button.
> - Keep code simple, typed, commented. No AI slop comments. Use real function names.
> - Every API must have Pydantic validation + error handling + /health endpoint.
>
> START NOW. Read the brief, then start Step 0.

---

## 1. PROJECT IN 1 PARAGRAPH

Nestora is a single-stop website that acts as an architect. User enters city + plot + budget + family + style. User swipes taste cards. Nestora returns: blueprint with dimensions, 3D structure with columns/beams/foundation, MEP flows (electrical, water, waste), paint palettes with exact codes, materials with Benefits/Loss, decor with furniture, BOQ with exact cement bags / steel kg, phased budget, EMI. Every decision shows calculation. Global by packs: one core engine, many city packs, style packs, material packs.

## 2. NON-NEGOTIABLES - LOCKED RULES

| # | Rule | Why |
|---|------|-----|
| 1 | SLM is orchestrator only, never draws structure | SLM hallucinates numbers |
| 2 | Judge is pure Python, not ML, not SLM | Safety must be deterministic |
| 3 | House Twin is single source of truth | No duplicate state |
| 4 | Custom floors, no fixed size | Every family is different |
| 5 | Every output has reason + number | Trust = calculation |
| 6 | No invented codes | If not found, mark MISSING |
| 7 | Stage Gates: No failed plan moves forward | Pitch perfect from start |
| 8 | Mobile-first, works on 15k Rs phone | India pilot |

## 3. ARCHITECTURE - MICROSERVICES + ORCHESTRATOR + EVENT DRIVEN

Frontend [Next.js + Three.js] -> API Gateway / Orchestrator Service [FastAPI + LangGraph] -> House Twin Service [PostgreSQL + S3] + 14 Model Services + Judge Service + External Wrappers.

**Phase 1 Implementation:** One FastAPI app, 14 routers inside same code. Modular monolith. Design so each router can become its own service in Phase 2.

**Phase 2 Implementation:** Break into 14 separate containers. Deploy with Docker + Kubernetes.

**Communication:**
- Sync: REST for CRUD + predict
- Async: Celery + Redis or Temporal for long jobs (Blender render, training)
- Real-time: WebSocket ws://api/ws/{house_id} for progress: Blueprint done... Structure done...

## 4. HOUSE TWIN JSON - SINGLE SOURCE OF TRUTH

All models read/write this. Store in PostgreSQL as JSONB + S3 for renders.

```json
{
  "house_id": "nest_123",
  "version": "1.0",
  "plot": {
    "address": "Mumbai, 19.07, 72.87",
    "plot_width_ft": 30,
    "plot_depth_ft": 40,
    "plot_area_sqft": 1200,
    "orientation": "East",
    "road_width_ft": 30,
    "soil_type": "black_cotton",
    "water_table_m": 4.5
  },
  "family": {
    "adults": 3,
    "elders": 1,
    "toddlers": 1,
    "pets": [{"type": "dog", "breed": "Labrador"}],
    "wfh_members": 1,
    "joint_family": true,
    "disabilities": ["elder_knee_pain"],
    "faith": "vaastu_soft"
  },
  "budget": {
    "total_budget_inr": 2000000,
    "contingency_pct": 10
  },
  "floors": [
    {
      "floor_no": 0,
      "floor_height_ft": 10.5,
      "clear_height_ft": 9.2,
      "area_sqft": 950,
      "rooms": [
        {
          "name": "living",
          "length_ft": 14,
          "width_ft": 12,
          "area_sqft": 168,
          "window_area_sqft": 20,
          "door_width_mm": 900,
          "color_wall_A": {"name": "Warm White", "rgb": "245,240,230", "cmyk": "0,2,6,4", "lrv": 85},
          "material_floor": "epoxy"
        }
      ]
    }
  ],
  "structure": {
    "columns": [{"x": 0, "y": 0, "size_mm": 230, "load_tons": 12}],
    "beams": [{"span_m": 4.5, "depth_mm": 280}],
    "foundation": {"type": "raft", "depth_ft": 4.5},
    "safety_factor": 1.5
  },
  "mep": {
    "electrical_points": 45,
    "waste_pipes": [{"type": "soil", "dia_mm": 110, "slope": "1:60"}],
    "pump_head_m": 12,
    "ac_units": [{"type": "split", "tonnage": 1.5, "room": "living"}]
  },
  "style": {
    "primary_style": "japanese",
    "secondary_style": "forest",
    "mix_pct": "70/30",
    "taste_vector": [0.12, -0.03]
  },
  "boq": {
    "cement_bags": 720,
    "steel_kg": 6300,
    "cost_breakdown": {"foundation": 400000, "structure": 700000, "finishing": 900000}
  }
}
```

**Constraint Graph - Derived from Questionnaire + SLM:**

```json
{
  "elder_present": true,
  "constraints": [
    "ground_floor_bedroom = true",
    "door_width_mm >= 900",
    "no_steps = true",
    "grab_bars = true"
  ]
}
```

## 5. API CONTRACTS - WHAT AGENT MUST BUILD

### Public APIs - Frontend calls these

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| POST | /api/v1/house | plot, family, budget | house_id |
| GET | /api/v1/house/{id} | - | Full Twin JSON |
| POST | /api/v1/house/{id}/questionnaire | stage1-4 answers | Constraint Graph |
| POST | /api/v1/house/{id}/swipe | card_id, direction, dwell_ms | Updated taste_vector |
| POST | /api/v1/house/{id}/generate | house_id | job_id - async |
| GET | /api/v1/house/{id}/modes/{mode} | mode = blueprint / paint / decor / mep / structure / climate / sound / boq | Mode JSON + render URL |
| POST | /api/v1/house/{id}/export/dwg | - | DWG/DXF URL |
| POST | /api/v1/house/{id}/review | - | Mock 999 review order |

### Internal APIs - Only Orchestrator calls these

Every model has same contract:

| Method | Endpoint | Example |
|--------|----------|---------|
| POST | /api/v1/{model}/predict | /api/v1/structure/predict |
| GET | /api/v1/{model}/health | /api/v1/structure/health |
| GET | /api/v1/{model}/versions | /api/v1/structure/versions |

**Example - Structure Predict:**
Input: house_id, layout, soil_type, wind_speed, seismic_zone, model_version
Output: columns, beams, foundation, safety_factor, reason

**Example - Judge Validate:**
Input: house_id, twin
Output: pass true/false, failures [{ rule_id, message }], warnings []

## 6. SLM RULE - LOCKED - READ BEFORE CODING SLM

**What SLM DOES:**
- Translates user sentence -> Constraint Graph: Mom moves in, knee pain -> elder=true, ground bedroom, door 900mm
- Creates DAG: Plot -> Layout -> Judge -> MEP -> Color -> Render -> Budget
- Explains decisions: Column here because load 12 tons, soil black cotton
- Handles languages: Hindi, Tamil, Spanish, Hinglish, voice input in Phase 2
- Handles proactive tasks: Climate says living hits 38C -> auto-add overhang task

**What SLM NEVER DOES:**
- Never outputs column size, beam depth, pipe slope, paint code, cost directly
- Never draws floor plan
- Never invents code or price
- Never bypasses Judge

**How to build SLM in Phase 1:**
- Do NOT train from scratch. Fine tune existing SLM (Llama 3 8B / Mistral 7B class) with LoRA on Nestora rulebook + 20 briefs + 1000 examples.
- For scaffold, use rule-based translator in slm.py that passes 20 test examples. Mark as MOCK_SLM, replace with fine-tuned model in Week 8.
- Function signature: translate_to_constraints(user_text) -> ConstraintGraph
- Test: 95 percent+ on 20 examples. SLM direct dimension output must be 0 percent.

## 7. JUDGE RULES - PURE PYTHON - MUST PASS

Implement in backend/app/services/judge.py. Each rule is a function returning PASS/FAIL.

**Judge A - Area:**
- Sum rooms + walls + circulation = plot +/- 2 percent
- If FAIL, return: area_mismatch

**Judge B - Law:**
- Setbacks per Mumbai pack: Front 3m, Side 1.5m, Rear 3m for 30x40
- FSI <= 1.5 for Mumbai pilot
- Min room: Bedroom >= 100 sqft, Living >= 150 sqft, Kitchen >= 60 sqft, Toilet >= 35 sqft
- Ventilation: Window area >= 10 percent of room area
- Stair width >= 900mm, Door: Main >= 1000mm, Bedroom >= 900mm, Toilet >= 750mm
- No toilet under stair, No toilet sharing puja wall

**Judge C - Structure:**
- Beam span > 6m without column = FAIL
- Column not on load path = FAIL
- Safety factor < 1.5 = FAIL
- Wall thickness: Load-bearing 200-230mm, Partition 100-115mm

**Judge D - MEP:**
- Drainage slope must be 1:60 to 1:100
- Electrical crossing water = FAIL
- Pump head insufficient for floor height = FAIL
- Electrical separation from water >= 300mm

**Judge E - Ergonomics:**
- Circulation < 900mm = FAIL
- Furniture blocks door = FAIL
- Kitchen triangle > 22ft = WARN

**Stage Gates:** Stage 1 Blueprint must pass Judge before Stage 2 Structure starts. Enforce in Orchestrator.

## 8. 14 MODELS - WHAT EACH DOES

| # | Model | Input | Output | Phase 1 Rule |
|---|-------|-------|--------|--------------|
| 1 | Plot + Code | lat/long, plot size | Jurisdiction pack JSON | Mumbai pack hardcoded |
| 2 | Layout | Constraint Graph + Taste Vector | 3 layouts: Efficient / Creative / Balanced | Deterministic + diversity penalty |
| 3 | Structure | Layout + soil + wind + seismic | Columns, beams, foundation | Thumb rules: Beam depth = span/16, Column 230x230 min G+1 |
| 4 | MEP Flow | Layout + Structure | Wire routes, pipe routes, slope, pump head | Rules in Section 7 |
| 5 | Color Brain | Room size, light, style, taste | Palette per wall with RGB/CMYK/LAB | LRV >70 for low light |
| 6 | Material Brain | Persona + climate + room + budget | Material per room + Benefits/Loss | 25 materials, see below |
| 7 | Style + Furniture | Taste Vector + room | Furniture layout, style mix | 70 percent Japanese + 30 percent Forest = blend param |
| 8 | Light + Climate | lat/long, orientation, windows | Sun path, heat map, weather modes | NASA Power mock |
| 9 | Sound | Outside noise, materials, volume | Wall STC, echo risk | STC tables |
| 10 | Budget + Loan | City, sqft, style, material | BOQ + phased budget + EMI | Mumbai prices: Cement 400/bag, Steel 70/kg |
| 11 | Land + City | Budget + family + intent | Plot recommendation + checklist | Mumbai only Phase 1 |
| 12 | Render | Twin | Blueprint, Paint, Decor, MEP, Structure modes | Three.js + SVG, Blender for hero |
| 13 | Swipe Taste | Swipes + dwell | Taste Vector 512 floats | CLIP mock, average right minus left |
| 14 | Orchestrator SLM | User request + Twin | DAG + proactive tasks | SLM rule in Section 6 |

### Material DB - 25 Materials - Must Have Benefits/Loss

| Material | Best Room | Benefits | Loss | Cost Rs/sqft Mumbai |
|----------|-----------|----------|------|---------------------|
| Marble | Living, Puja | Luxurious, Cool | Stains turmeric, Slippery | 350-600 |
| Granite | Kitchen, Bath | Heat+Scratch proof | Heavy, Cold, Echo | 180-300 |
| Epoxy Flooring | Living, WFH, Pet | Pet proof, Easy clean | Yellows in sun | 120-200 |
| Teak Wood | Bedroom, Japanese | Warm, Quiet | Scratches pet | 400-700 |
| Engineered Wood | Bedroom, Living | Warm, Stable | Termite if untreated | 250-400 |
| Polished Concrete | Brutalist, Minimal | Cheap, Durable | Cold, Cracks | 90-150 |
| Vitrified Tiles | Budget, Toddler | Cheap, Kid proof | Cold | 60-120 |
| Ceramic Tiles | Bath, Kitchen | Cheap, Anti-skid | Chips | 50-90 |
| Kota Stone | Outdoor, Budget | Cheap, Durable | Dull look | 70-110 |
| Laterite | Wall, Outdoor | Breathable, Local | Needs plaster | 80-130 |

Full 25 in DOCX. Implement all 25 in backend/app/data/materials.json.

### Color Science - Must Implement

- Know RGB, CMYK, HSL, LAB. Tints = color + white, Shades = color + black.
- Harmony: Complementary = opposite wheel, Analogous = neighbours.
- Perception: 3 walls light + 1 dark accent = wider. Dark ceiling = shorter. Light ceiling = taller.
- Wall logic: Longest wall gets light, shortest wall gets accent to shorten depth. Wall opposite window gets light to reflect.
- Example: Warm White RGB 245,240,230 CMYK 0,2,6,4 LRV 85 goes with teak, not grey concrete for brutalism.

## 9. FRONTEND - PAGES + DISPLAY MODES

**Pages in order:**
1. / Landing - 3 walkthroughs: This Family, This House
2. /questionnaire - 4 stages, 12-15 questions max, progress bar
3. /swipe - 3 decks, 30 cards, Tinder style
4. /house/[id] - Main viewer with mode toggles
5. /house/[id]/boq - BOQ + Budget + EMI
6. /house/[id]/review - Trust sheet + 999 review mock

**Display Modes - One House, Many Views - Same Twin:**
- Blueprint Mode: SVG 2D plan, dimensions, north arrow, area math
- Paint Mode: Walls with exact color codes, LRV
- Decor Mode: Furnished, furniture, textures
- MEP Mode: Pipes, wires, AC, pump overlay
- Structure Mode: Columns, beams, foundation wireframe
- Climate Mode: Sun path, heat map, weather: rain/summer/winter/night
- Sound Mode: Noise map, STC, echo
- BOQ Mode: Cement bags, steel kg, cost table

**Tech:** Next.js + TypeScript + Tailwind + Three.js + Framer Motion for swipe. Mobile-first.

## 10. QUESTIONNAIRE + SWIPE SPEC

**Questionnaire - 4 Stages, 12-15 Q max:**
- Stage 1 Where + What: Geolocation + address, Plot or flat, Dimensions, New build or renovation, Budget, Intent 5yr/10yr/investment
- Stage 2 Who Lives: Elders, Toddler, Kids age, Pets breed/size, WFH hours, Joint family, Hosting, Disabilities, Allergies, Who cooks, Festival day count
- Stage 3 How You Live: Cooking wet/dry, veg/non-veg separation, Prayer Vaastu strict/soft/off, Feng Shui, Style Light/Jazzy/Old is Gold + Brutalism/Minimalist/Japanese/Forest
- Stage 4 Site Physics - Auto pulled, not asked: Soil, wind, seismic, sun, rainfall, water table, noise, AQI - user confirms

**Swipe - 3 Decks, 30 Cards:**
- Deck 1 Structure - 10 cards: courtyard, boxy, L-shape, duplex, flat roof, sloped roof, split level, double height
- Deck 2 Color + Material - 12 cards: brutalist concrete, Japanese wood, forest green, all-white, jazzy tiles, palettes with codes
- Deck 3 Decor - 8 cards: low Japanese, Scandinavian, old-is-gold, biophilic, brutalist furniture
- Logic: Right = +1, Left = -1, Dwell 3 sec + Right = strong signal. Taste Vector = average right minus left. Family mode: 3-4 members swipe separately, consensus vector.

## 11. DATA + PACKS

**Mumbai Pack - Phase 1 only:**
- DCR: Setbacks, FSI 1.5, min room sizes, approvals checklist BBMP
- Prices: Cement 400/bag, Steel 70/kg, Tiles 60-120/sqft, Paint 25-45/sqft
- Climate: Rainfall 2200mm, Wind 44 m/s, Seismic Zone 3, Sun path 19N
- Soil: Black cotton in many areas, Good soil in others

**File:** backend/app/data/packs/mumbai.json

**Privacy:** Designs private by default. Swipe anonymized for training. User can delete design.

## 12. FILE STRUCTURE - MUST FOLLOW

```
nestora/
  frontend/
    app/
      page.tsx - landing
      questionnaire/page.tsx
      swipe/page.tsx
      house/[id]/page.tsx
      house/[id]/boq/page.tsx
    components/
      Questionnaire.tsx
      SwipeDeck.tsx
      Viewer.tsx - Three.js + SVG modes
      BOQTable.tsx
      TrustSheet.tsx
    lib/
      api.ts - calls backend
      twin.ts - types
  backend/
    app/
      main.py - FastAPI entry
      models/
        twin.py - Pydantic Twin
        constraints.py
      api/
        house.py
        questionnaire.py
        swipe.py
        plot.py
        layout.py
        structure.py
        mep.py
        color.py
        material.py
        style.py
        climate.py
        sound.py
        budget.py
        land.py
        render.py
        orchestrator_api.py
      services/
        judge.py - PURE PYTHON, NO ML
        orchestrator.py - DAG
        slm.py - Orchestrator wrapper, MOCK allowed Phase 1
        external.py - Mock maps, soil, weather
      data/
        materials.json - 25 materials
        packs/mumbai.json
        styles.json - 5 styles + mix logic
        test_briefs.json - 20 briefs
    tests/
      test_judge.py
      test_structure.py
      test_slm.py
      test_api.py
  scorecard.md
  README.md
```

## 13. CODING STANDARDS

- Backend: Python 3.11+, FastAPI, Pydantic v2, typed functions, docstrings for every API.
- Frontend: TypeScript strict, Next.js 14+, Tailwind, no any without reason.
- Naming: snake_case for Python, camelCase for TS, kebab-case for files.
- Errors: Every API returns { success, data, error }. No bare 500.
- Tests: Pytest for backend, Vitest for frontend. Every Judge rule has a test.
- No hardcoded secrets. Use .env.example.
- No AI slop comments. Use real comments: Beam depth = span/16 per IS 456.
- Every model API must have /health endpoint.

## 14. PHASE 1 BUILD ORDER - WEEK 1-13 - DO IN THIS ORDER

| Week | Task | Deliverable | Gate |
|------|------|-------------|------|
| 1 | Landing + questionnaire v1 + Mumbai pack crawl | Landing live, 50 signups mock | 50 signups |
| 2 | Rulebook + 20 test briefs JSON | rulebook.json, test_briefs.json | Rulebook complete |
| 3 | Layout + Structure + Judge v1 | Layout passes 10/20 briefs | Scorecard |
| 4 | Judge v2 + Three.js viewer + Blueprint mode | Viewer live, passes 15/20 | Viewer |
| 5 | MEP + Color + Material 25 | MEP + Color + Material live | MEP passes |
| 6 | Style 5 + Sound + Thermal v1 + Swipe backend | Swipe live, style mix | Swipe |
| 7 | BOQ + Budget 3BHK 1500 = 20L + 2L maintenance + EMI | BOQ live | BOQ accuracy |
| 8 | Blender render pipeline + 999 review + Trust sheet | Render + review live | Render cost <100 |
| 9 | QA 2000 synthetic briefs, fix failures, family swipe | Scorecard 95 percent+ | QA |
| 10 | Pilot launch Mumbai, first 50 users | 100 designs | 100 designs |
| 11 | Iterate on feedback, price check | Feedback loop | Feedback |
| 12 | Scale to 1000 designs, 100 paid | Gate | Gate |
| 13 | Dashboard + Phase 2 go/no-go | Decision | Go/No-go |

**Phase 1 Metrics:** Completion >40 percent, Time to wow <3 min, Share >30 percent, Free to paid 6-10 percent, ARPU 1500+, Sanction pass 100 percent, Render cost <100 Rs, Free design cost 15-30 Rs.

## 15. PHASE 2 BUILD ORDER - DO NOT BUILD YET, ONLY READ

- 2A Global Packs: Delhi, Bangalore, Pune, Hyderabad, Dubai, London, New York, Singapore, Sydney, Toronto. Languages Hindi, Tamil, Spanish, Arabic + voice. Renovation mode.
- 2B Execution: BOQ live prices, contractor matching, site photo AI, sanction DWG, land title check, loan tie-ups.
- 2C Post-Build Twin: Maintenance, IoT feedback, actual vs predicted.
- 2D Advanced Simulation: Full climate modes, AR on plot, solar, rainwater, EV, carbon.
- 2E Marketplace + B2B: Material marketplace, lender leads, developer licensing.

## 16. TESTING + QA - 20 TEST BRIEFS

Agent must implement backend/app/data/test_briefs.json with 20 briefs. Each brief has: plot, family, style, expected Judge pass/fail, expected constraints.

**Examples:**
1. Mumbai 30x40 G+1, Japanese + Forest, elder + toddler + Labrador, budget 20L -> Must pass, ground bedroom, door 900mm, epoxy floor, not marble in kitchen.
2. Mumbai 30x40 G+1, Brutalist, WFH, budget 15L -> Must pass, polished concrete, not marble.
3. Mumbai 30x40 G+1, Vaastu strict, puja east, kitchen south-east -> Must pass, puja not sharing toilet wall.
4. Bad brief: Beam span 7m without column -> Judge must FAIL.
5. Bad brief: Drainage slope 1:30 -> Judge must FAIL.
6. Bad brief: Door 750mm for elder -> Judge must FAIL.

**Nightly QA:** 2000 synthetic briefs = soil x wind x persona x culture x budget x city. Scorecard must be 95 percent+.

**Scorecard Format - scorecard.md:**
Brief 1: PASS - Layout OK, Structure OK, Judge OK
Brief 4: FAIL - Expected FAIL, Got FAIL - Correct, Judge caught beam span
Total: 18/20 PASS

## 17. DEFINITION OF DONE

- [ ] House Twin CRUD works
- [ ] Judge tests green: 10 good pass, 10 bad fail
- [ ] Orchestrator DAG works end-to-end: Questionnaire -> Swipe -> Generate -> All modes
- [ ] SLM never outputs dimension directly - test proves it
- [ ] All 25 materials in DB with Benefits/Loss
- [ ] All 5 display modes toggle from same Twin
- [ ] 20 test briefs run, scorecard 18/20+
- [ ] README with how to run
- [ ] No invented codes - MISSING list provided

## 18. WHAT NOT TO DO

- Do NOT let SLM draw structure
- Do NOT invent building codes, prices, or material specs
- Do NOT build Phase 2 before Phase 1 gate passes
- Do NOT build login/payment real system - mock only Phase 1
- Do NOT use LLM for Judge, Layout, Structure - use rules + task models
- Do NOT create SLM from scratch - fine tune existing
- Do NOT add features not in spec - no chat bot, no social feed
- Do NOT hardcode one floor height - custom per floor

## 19. EXAMPLE TASKS FOR AGENTS - COPY PASTE THESE TO SUB-AGENTS

**Agent 1 - Judge:** Implement backend/app/services/judge.py per Section 7. Write tests for all 5 Judge checks. Must FAIL on beam span >6m, drainage slope wrong, door <900mm for elder.

**Agent 2 - Structure API:** Implement backend/app/api/structure.py per Section 5 and 8. Input Layout + soil + wind + seismic. Output columns, beams, foundation, safety_factor, reason. Use thumb rules. No LLM.

**Agent 3 - Frontend Viewer:** Build frontend/components/Viewer.tsx per Section 9. Must toggle Blueprint / Paint / Decor / MEP / Structure modes from same Twin JSON. Use Three.js for 3D, SVG for blueprint.

**Agent 4 - Swipe:** Build frontend/components/SwipeDeck.tsx + backend/app/api/swipe.py per Section 10. 30 cards, 3 decks, taste vector 512 floats, family mode.

**Agent 5 - SLM Wrapper:** Implement backend/app/services/slm.py per Section 6. Function translate_to_constraints(user_text) -> ConstraintGraph. Rule-based for scaffold, mark MOCK_SLM. Must never return structure.

---

**End of Brief. If you are a coding agent, start with MASTER PROMPT Step 0.**
