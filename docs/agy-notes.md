# Nestora Architectural Audit & Codebase Reality Report
**File:** `docs/agy-notes.md`  
**Date:** November 21, 2026  
**Auditor:** Antigravity (AGY)  
**Target Audience:** Engineering Leads, Claude Code, and Incoming Developers  

---

## Executive Summary
This document provides an unvarnished, fact-based audit of the **Nestora** codebase as of commit `7909f0b`. Every finding below is cited directly against the repository source code and build specification (`Nestora-Coding-Agent-Brief.md`). Where data is absent from the repository, it is explicitly declared as **unknown** rather than guessed.

---

## 1. Intent vs. Code: Generator, SLM, and Orchestrator Pipeline

### Findings in Code:
- **`backend/app/services/orchestrator.py` (lines 65–175, 197–209, 231–240):**  
  The orchestration pipeline is a synchronous, sequential Python script. For **every single brief**, it instantiates the exact same hardcoded 30×40 G+1 room layout:
  - Ground Floor: Living (`16'×12'`, 192 sqft), Ground Bedroom (`12'×11'`, 132 sqft), Kitchen (`10'×8'`, 80 sqft), Toilet (`7'×6'`, 42 sqft).
  - First Floor: Master Bedroom (`14'×12'`, 168 sqft), Kids Bedroom (`12'×10'`, 120 sqft), Upper Toilet (`7'×6'`, 42 sqft).
  - Structure: Exact same 6 columns C1–C6 placed at coordinates `(0,0)`, `(16,0)`, `(0,12)`, `(16,12)`, `(28,0)`, `(28,12)`.
  - MEP: Fixed at 52 electrical points, 14.0m pump head, and two 1.5-ton AC units.
  - BOQ: Fixed at 720 cement bags, 6,300 kg steel, 45 tons sand, 60 tons aggregate, 18,000 bricks, and ₹20,00,000 total cost.
  - The only variables dynamically modified by user input are:
    1. Room naming: `bedroom_elder` vs. `bedroom_ground` (line 78).
    2. Door width: `door_w = max(900, cg.min_door_width_mm)` (line 64).
    3. Floor material: `epoxy_flooring` if elder present, else `vitrified_tiles` (line 85).
    4. Style tags: `cg.preferred_styles[0]` (line 216).
- **`backend/app/services/slm.py` (lines 13–100):**  
  There is **no Small Language Model (SLM)**. It is a 138-line regex and keyword parser checking for substrings like `"elder"`, `"knee pain"`, `"wfh"`, `"japanese"`, and `"vaastu"`.
- **Branches & External Code:**  
  Running `git branch -a` shows only `master` and `remotes/origin/master`. There are no feature branches, stash entries, or external repositories containing an alternate generator.

### Was a real generator, SLM, or LangGraph pipeline ever built or planned?
- **Planned:** Yes. `Nestora-Coding-Agent-Brief.md` Section 3 (lines 86–87) and Section 6 envisioned an *"API Gateway / Orchestrator Service [FastAPI + LangGraph]"* and a *"fine-tuned SLM (e.g. Phi-3/Gemma)"*.
- **Built:** No. The brief explicitly instructed in Step 3 & Step 5 (lines 41–43, 523) to build a scaffold first: *"Use deterministic rules + thumb rules from Section 8 for Phase 1. No LLM for these APIs... Rule-based for scaffold, mark MOCK_SLM. Must never return structure."* LangGraph was never added to `requirements.txt` or imported anywhere in the backend.

---

## 2. Judge Thresholds & Code Standard Sources

### Citations:
- `backend/app/services/judge.py` (lines 46–318)
- `backend/app/data/packs/mumbai.json` (lines 5–55)
- `Nestora-Coding-Agent-Brief.md` Section 7 (lines 243–277)

### Origin of Thresholds:
The thresholds in `judge.py` and `mumbai.json` were transcribed verbatim from Section 7 of the brief. Their real-world standard origins are:
1. **Setbacks & FSI (Judge B / `mumbai.json` lines 6–11):**  
   Front 3.0m, Side 1.5m, Rear 3.0m, FSI $\le 1.50$. These are simplified approximations of **Mumbai DCPR 2034** (Development Control and Promotion Regulations for Greater Mumbai, Regulation 41 / Table 15 for residential plots $\le 1,200\text{ sqft}$).
2. **Room Minimum Sizes & Ventilation (Judge B lines 130–147):**  
   Living $\ge 150\text{ sqft}$, Bedroom $\ge 100\text{ sqft}$, Kitchen $\ge 60\text{ sqft}$, Toilet $\ge 35\text{ sqft}$, Window area $\ge 10\%$ of room area. Derived from **NBC 2016 (National Building Code of India) Part 3, Clause 4.5 & 4.6** and **DCPR 2034 Reg 37**.
3. **Door & Stair Minimums (Judge B lines 148–170):**  
   Main door $\ge 1000\text{mm}$, Bedroom $\ge 900\text{mm}$, Toilet $\ge 750\text{mm}$, Stair width $\ge 900\text{mm}$. Complies with **NBC 2016 Part 4 / Part 3 Clause 4.12**.
4. **Structural Rules (Judge C lines 184–237):**  
   - Maximum unsupported beam span $6.0\text{m}$ without column: Practical residential framing limit.
   - Beam depth $\ge \text{span}/16$: Thumb rule for deflection control derived from **IS 456:2000 Clause 23.2.1** (basic span/depth ratio).
   - Column minimum size $230\text{mm}$ ($9''$) for G+1: Minimum RCC column dimension per **IS 456:2000 Clause 26.5.3.1**.
   - Safety factor $\ge 1.5$: Partial safety factor for limit state of collapse per **IS 456:2000 Clause 36.4.2**.
5. **MEP Flow (Judge D lines 242–292):**  
   - Drainage slope $1:60$ to $1:100$: Standard self-cleansing hydraulic gradient per **IS 1742:1992 Clause 4.3**.
   - Electrical separation from water $\ge 300\text{mm}$: Standard practice per **NBC 2016 Part 8 / Part 9**.
   - Wind speed $44\text{ m/s}$ & Seismic Zone III ($Z=0.16$): **IS 875 (Part 3):2015** (basic wind speed for Mumbai) and **IS 1893 (Part 1):2016** (seismic map of India).

### Were any checked by an architect or structural engineer?
- **Unknown.** There is no record, signature, calculation sheet, or git commit from a registered architect or structural engineer verifying these implementations.
- **Evidence of unverified compilation:** In `Nestora-Coding-Agent-Brief.md` line 361, under the header **"Mumbai Pack - Phase 1 only"**, the brief text literally reads: *"approvals checklist BBMP"*. BBMP (*Bruhat Bengaluru Mahanagara Palike*) is the municipal corporation of **Bangalore**, not Mumbai (which is *MCGM / BMC*). This copy-paste artifact proves the requirements were compiled as a product outline without professional architectural editorial review.

---

## 3. Rates in `budget.py` and `mumbai.json`: Source & Date

### Citations:
- `backend/app/api/budget.py` (lines 4–7, 32–64)
- `backend/app/data/packs/mumbai.json` (lines 26–35)
- `Nestora-Coding-Agent-Brief.md` (lines 3, 291, 362)

### Findings:
- **Date:** **November 2026** (stated in `budget.py` line 4 and Brief line 3).
- **Source:** Hardcoded directly by the author of `Nestora-Coding-Agent-Brief.md` in Sections 8 & 11:
  - Cement: ₹400 / 50kg bag
  - Steel (Fe500D TMT): ₹70 / kg
  - River Sand / M-Sand: ₹2,200 / ton
  - Aggregate (20mm/10mm): ₹1,400 / ton
  - Clay Bricks: ₹9 / unit
  - Tiles: ₹60–₹120 / sqft
  - Paint: ₹25–₹45 / sqft
  - RCC Labour & Shuttering: ₹330 / sqft
- **Assessment:** These figures are informal contractor ballpark figures from late 2024–2026 for western India. They are **not** sourced from an official published index such as the *Maharashtra PWD Common Schedule of Rates (CSR)* or the *CPWD Delhi Schedule of Rates (DSR)*.

---

## 4. Frontend Hardcoding in `Viewer.tsx`, `BOQTable.tsx`, and `TrustSheet.tsx`

### Findings in Code:
1. **`frontend/components/TrustSheet.tsx` (lines 41–52):**  
   The `auditChecks` state is an entirely static JavaScript array of 10 items. Every single item has `result: "PASS"` hardcoded as a string literal. It does **not** read `twin.metadata["final_judge"]`. If a house twin is generated with structural failures, `TrustSheet.tsx` still renders 10 green "PASS" badges.
2. **`frontend/components/BOQTable.tsx` (lines 39–49):**  
   Line 39 hardcodes `const area = 1500;`. Even if the house is a 600 sqft compact house, the table multiplies cement, sand, brick, flooring, and labour by 1,500 sqft.
3. **`frontend/components/Viewer.tsx` (lines 454–480):**  
   The default sidebar (when no room is clicked) renders static strings:
   `Plot Dimensions: 30ft x 40ft (1,200 sqft)`, `Total Built-up: 1,500 sqft (G+1)`, `Mumbai FSI Used: 1.25 / 1.50`, `Foundation: 4.5ft Raft (Black Cotton)`.

### Was that a demo shortcut? Any reason not to bind them to real data?
- **Yes, it was a demo shortcut** taken to get the initial Phase 1 mock MVP rendering quickly.
- **Reason not to bind to real data:** **None.** The backend `HouseTwin` model (`backend/app/models/twin.py`) already returns the exact calculated fields (`twin.plot`, `twin.floors`, `twin.structure`, `twin.boq`, `twin.metadata.final_judge`). Binding them to dynamic properties is straightforward and should be prioritized immediately.

---

## 5. Swipe Taste Vector (`backend/app/api/swipe.py`)

### Findings in Code:
- **`backend/app/api/swipe.py` (lines 101–125):**  
  The taste vector is an array of 512 floating point numbers. The code defines 5 style offsets:
  ```python
  style_offsets = {
      "japanese": 0,
      "forest": 100,
      "brutalist": 200,
      "minimalist": 300,
      "old_is_gold": 400
  }
  ```
  When a card is swiped, only a 50-float slice starting at `base_idx` is modified (`vector[base_idx : base_idx + 50] += signal * 0.1`).  
  - Total dimensions touched across all 5 styles: $5 \times 50 = 250$ dimensions.  
  - The remaining **262 dimensions** (`50..99`, `150..199`, `250..299`, `350..399`, `450..511`) remain permanently zero.
  - The vector is saved to `twin.style.taste_vector`, but **no model or layout engine ever reads it**.
- **What was it meant to become?**  
  In `Nestora-Coding-Agent-Brief.md` line 294, it was envisioned as a **CLIP visual embedding vector** (512 dimensions, matching OpenAI CLIP ViT-B/32). Swiping on visual cards was meant to construct a user aesthetic centroid for image retrieval and diffusion styling.
- **Are there card images somewhere?**  
  **No.** `CARDS_CATALOG` in `swipe.py` (lines 16–52) contains only text: `id`, `deck`, `title`, `style`, `desc`. There are no image files or URLs. In `frontend/components/SwipeDeck.tsx`, cards render as CSS gradient cards with text.

---

## 6. Questionnaire Inputs: Brief §10 vs. Code Implementation

### Citations:
- `backend/app/api/questionnaire.py` (lines 16–31)
- `frontend/components/Questionnaire.tsx` (lines 20–120)
- `Nestora-Coding-Agent-Brief.md` Section 10 (lines 346–350)

### Why these fields were chosen & what was dropped:
| Brief §10 Field | Status in Code | Reason Dropped / Retained |
| :--- | :--- | :--- |
| **Plot dimensions & Budget** | **Retained** | Fundamental to house envelope and BOQ. |
| **Adults, Elders, Toddlers, Pets** | **Retained** | Drives Stage Gate 1 rules (elder bedroom, door widths, floor material). |
| **WFH Hours, Cooking, Vaastu, Styles** | **Retained** | Feeds SLM constraint graph parser. |
| **Geolocation & Address** | **Dropped** | Dropped because Phase 1 was strictly locked to the Mumbai pilot (lat 19.07, lon 72.87 hardcoded). |
| **Plot vs. Flat / Renovation** | **Dropped** | Dropped by mandate: Brief line 26 & line 465 explicitly deferred renovation and multi-plot mode to Phase 2A. |
| **5/10-Year Intent & Investment** | **Dropped** | No financial appreciation or structural expansion simulation exists in the backend. |
| **Diet (Veg / Non-veg separation)** | **Dropped** | The layout generator cannot synthesize dual wet/dry or dual-prep kitchens. |
| **Festival Day Count & Hosting** | **Dropped** | No parking space or guest room capacity scaling engine exists. |
| **Feng Shui** | **Dropped** | Dropped in favor of Indian Vaastu Shastra, which directly aligns with the Mumbai pilot. |
| **Disabilities & Allergies** | **Simplified** | Consolidated into `elder_knee_pain`, which triggers the ground-floor bedroom and 900mm door threshold. |
| **Stage 4 Auto-pulled Site Physics** | **Hardcoded** | Ground physics are loaded from `mumbai.json` rather than querying live NASA POWER or soil APIs. |

---

## 7. Deployment, Hosting, and Credentials

### Findings in Code:
1. **Frontend Hosting:**  
   - Hosted on **Vercel** (`frontend/.vercel/project.json`, Project ID: `prj_U9n0VqHhL1sYj3yvjJq1Z0lM`).  
   - Production URL: `https://frontend-pi-rouge-j4nx8pbjzh.vercel.app`.
2. **Backend Hosting:**  
   - **Nowhere in the cloud.** The backend has only ever run locally via Uvicorn on `http://127.0.0.1:8000`.
   - There are **no Dockerfiles**, no container registries, no AWS/GCP configs, and no deployment manifests (e.g., Render, Railway, Fly.io).
3. **Database / Supabase:**  
   - **No Supabase, No PostgreSQL.**  
   - `backend/app/services/repository.py` stores house twins as plain JSON files in `backend/app/data/storage/houses/` with an in-memory Python dictionary cache.
   - If the backend were deployed to an ephemeral/serverless container, all saved house data would be wiped on every container sleep/restart.
4. **Environment Variables:**  
   - In `frontend/lib/api.ts` line 4:
     ```ts
     const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
     ```
   - On the Vercel production deployment, `NEXT_PUBLIC_API_URL` is unset, meaning client-side browser requests attempt to call `http://localhost:8000` on the visitor's local machine, failing immediately.

---

## 8. Landing Page Claims vs. Institutional Reality

### Citations:
- `frontend/components/landing/UnifiedHorizontalStack.tsx`
- `frontend/components/TrustSheet.tsx` (lines 75–83)
- `backend/app/api/house.py` (lines 66–86)

### Analysis of Claims:
1. **"Council of Architecture (CoA) ₹999 Seal & Sanction Review":**  
   - **Reality: Completely unbacked.** There is no partnership, agreement, API integration, or relationship with the *Council of Architecture (CoA)* or any licensed architect firm.  
   - In `backend/app/api/house.py` lines 81–83, the review endpoint returns:
     ```json
     { "status": "confirmed_mock", "message": "Architect Review Order placed..." }
     ```
   - It is a mock UI button specified by Brief line 59 (*"No payment beyond mock 999 review button"*).
2. **"0% Hidden Costs" & "Guaranteed BOQ":**  
   - **Reality: Marketing copy.** There is no pricing guarantee, insurance policy, or contractor commitment. It is calculated via fixed multiplier heuristics.
3. **"Milestone Escrow":**  
   - **Reality: Conceptual only.** No escrow account provider (e.g. Razorpay Escrow, ICICI Bank, or smart contracts) is integrated.
4. **"60s Synthesis":**  
   - **Reality:** Literally true because the Python backend script executes in ~50ms, but deceptive because it returns a static template rather than solving real parametric engineering physics.

---

## 9. The Missing Business-Plan DOCX

### Citations:
- `Nestora-Coding-Agent-Brief.md` (lines 6, 312, 378, 400, 456–461)

### Status:
- **Where is it?**  
  **Unknown / Not in repo.** A global file system search and git commit history audit (`git log --all --full-history -- "**.docx"`) confirms that no `.docx` file has ever been added, committed, or pushed to this repository. It was an external document possessed by the product author.
- **Summary of Target Users, Pricing, and Pilot Metrics preserved in the brief:**
  - **Target Users:** Indian self-builders and urban families in Mumbai building on 30×40 plots or fitting out 3BHK 1,500 sqft apartments who want architect-grade validation without paying ₹2L–₹5L in private architect fees.
  - **Pricing Structure:**
    - Free Tier: Instant 2D blueprint, 3D structure, and preliminary BOQ (Platform compute cost: ₹15–₹30 per free plan).
    - Paid Tier: ₹999 for licensed architect review and municipal sanction stamp (Target ARPU: ₹1,500+).
    - Monetization: Material affiliate commissions, lender home loan lead generation, and contractor transaction fees.
  - **Pilot Metrics (Phase 1 Mumbai Pilot):**
    - Initial cohort: First 50 users generating 100 designs.
    - Scale gate: 1,000 designs with 100 paid reviews (10% free-to-paid conversion).
    - KPIs: Completion rate $>40\%$, Time-to-wow $<3\text{ minutes}$, Share rate $>30\%$, Render cost $<\text{₹}100$.

---

## 10. Known Bugs, Shortcuts, and Engineering Warnings

Here is what the next engineer taking over this repository must be warned about:

1. **Static House Generation:**  
   `orchestrator.py` does not generate buildings dynamically. Every user brief gets the identical 1,480–1,500 sqft floor plan and column layout. A real parametric floor-plan generator must replace lines 65–175.
2. **Ephemeral Storage Risk:**  
   `HouseTwinRepository` writes to local JSON files. On container restarts or serverless platforms, all user houses will disappear. A PostgreSQL database with a JSONB column (or Supabase/Prisma) is urgently required.
3. **Decoupled Frontend Trust Sheet & BOQ:**  
   `TrustSheet.tsx` and `BOQTable.tsx` do not read the generated twin data; they display hardcoded values. Any custom house generated will still show 1,500 sqft and ₹20 Lakhs in the BOQ.
4. **Vercel API URL Disconnect:**  
   In production, Vercel cannot reach the FastAPI backend because `NEXT_PUBLIC_API_URL` is unset, defaulting to `http://localhost:8000`. The backend must be deployed (e.g. on Fly.io, Render, or Railway) and the environment variable configured in Vercel.
5. **Three.js Static Positions in `Viewer.tsx`:**  
   In `Viewer.tsx`, beams (`line 115`) and MEP pipe cylinders (`lines 126, 130`) are positioned at hardcoded arbitrary coordinates rather than derived from column coordinates and fixture locations.
6. **CORS Restricted to Localhost:**  
   `backend/app/main.py` lines 28–34 sets `allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]`. When the frontend is accessed from Vercel, CORS will block all requests unless the Vercel domain is added.
7. **Negative Test Benchmark Shortcut:**  
   In `backend/app/services/orchestrator.py` lines 295–320 (`run_benchmark_20_briefs`), negative test cases do not test if the generator self-corrects; they manually inject faults (e.g. `saved_twin.structure.beams.append(Beam(span_m=7.2...))`) directly into the twin before passing it to the Judge.

---

## 11. Unused Code Audit & Cleanup Recommendations

### A. Frontend Landing Components (`frontend/components/landing/`)
The landing page (`frontend/app/page.tsx`) was refactored in commit `7909f0b` into a **Unified Right-to-Left 3D Scroll-World Stack**.  
- **Currently Active & Required:**
  - `UnifiedHorizontalStack.tsx` (Mounted directly in `page.tsx`)
  - `ProgressiveStageCanvas.tsx` (Rendered inside `UnifiedHorizontalStack`)
  - `StageComparisonCard.tsx` (Rendered inside `UnifiedHorizontalStack`)
  - `BespokeIcons.tsx` (Shared architectural SVG iconography)
- **Superseded & Unused (Safe to Delete):**
  - `ArchitecturalPavilion3D.tsx` (Previous 3D canvas attempt)
  - `BenefitComparisonCard.tsx` (Replaced by `StageComparisonCard.tsx`)
  - `BlueprintGateway.tsx` (Old vertical chapter section)
  - `ChapterDock.tsx` (Old vertical navigation dock)
  - `EditorialHero.tsx` (Merged into Spread 0 of `UnifiedHorizontalStack.tsx`)
  - `FamilyAdaptationShowcase.tsx` (Old vertical chapter section)
  - `FamilyComparisonSlider.tsx` (Old prototype slider)
  - `LayeredCarousel3D.tsx` (Replaced by `UnifiedHorizontalStack.tsx`)
  - `TactileMaterialFlatlay.tsx` (Old vertical chapter section)

### B. Frontend Motion Components (`frontend/components/motion/`)
- **Currently Active & Required:**
  - `SmoothScrollProvider.tsx` (Wraps `page.tsx` with Lenis smooth scrolling)
- **Superseded & Unused (Safe to Delete):**
  - `DraftingCrosshair.tsx` (The cursor XY coordinate follower; **deliberately removed** per user request in turn 8)
  - `KineticText.tsx` (Unused text animator)
  - `ThreeDCard.tsx` (Replaced by direct Framer Motion mouse tilt in `ProgressiveStageCanvas.tsx`)
  - `TracingBeam.tsx` (Unused vertical scroll line)

### C. Backend `/{model}/predict` Routers (`backend/app/api/*.py`)
- **Status:**  
  `backend/app/main.py` mounts 14 model routers:
  `plot.py`, `layout.py`, `structure.py`, `mep.py`, `color.py`, `material.py`, `style.py`, `climate.py`, `sound.py`, `budget.py`, `land.py`, `render.py`, `orchestrator_api.py`.
- **Are they safe to delete or kept for a reason?**  
  **Kept for a reason, but currently bypassed:**
  - They were written to fulfill the Section 5 & 8 contract specifications in `Nestora-Coding-Agent-Brief.md` so each model has a distinct REST endpoint for Phase 2 microservices containerization.
  - However, `orchestrator.py` does **not** call them; it executes its own inlined logic.
  - **Recommendation:** Do not delete if you plan to implement the modular Phase 2 microservices architecture; delete or consolidate if you intend to maintain a single streamlined monolith.
