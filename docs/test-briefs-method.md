# Test Briefs Methodology & Distribution Report
**Document:** `docs/test-briefs-method.md`  
**Target:** Generator Evaluation Harness & Benchmarking Suite  
**Dataset:** 500 Realistic User Briefs in `backend/eval/briefs.json`  
**Target Geography:** Greater Mumbai Metropolitan Region (MMR / Thane / Navi Mumbai)  

---

## 1. Objectives of the Evaluation Harness
Before public deployment, the parametric layout generator and constraint solver must be rigorously measured against a large, diverse cohort of realistic self-builder briefs. The 500 test briefs in `backend/eval/briefs.json` are generated to test:
1. **Pass Rate on First Attempt:** How often the solver generates a valid layout complying with MCGM DCPR 2034 setbacks, room minimums, and structural rules without manual intervention.
2. **Budget Fidelity:** Whether the solver flags underfunded requests and accurately assigns cost tiers.
3. **Accessibility Compliance:** Whether requests specifying elderly mobility constraints successfully mandate step-free ground-floor suites.
4. **Natural Language Robustness:** How effectively the Small Language Model (SLM) parses noisy user text, colloquial Hinglish, and typos.

---

## 2. Statistical Distributions & Justifications

### A. Plot Sizes & Geometry
* **Standard Plotted Buckets (90.2%):**
  - **20×30 ft (600 sqft / 55.7 m²):** 20% — Typical urban gaothan, row house, or starter home.
  - **25×40 ft (1,000 sqft / 92.9 m²):** 20% — Standard suburban MHADA/CIDCO plotted layouts.
  - **30×40 ft (1,200 sqft / 111.5 m²):** 35% — The foundational Mumbai pilot benchmark.
  - **30×50 ft (1,500 sqft / 139.4 m²):** 15% — Spacious suburban duplex with rear garden.
  - **40×60 ft (2,400 sqft / 223.0 m²):** 10% — Substantial luxury villa plot.
* **Odd & Non-Standard Plots (9.8%):**
  - Includes narrow lots (15×50 ft), irregular depths (27×43 ft, 22×35 ft, 33×45 ft, 18×40 ft, 24×48 ft).
  - Tests whether the solver can adapt templates dynamically rather than failing on non-standard aspect ratios.
* **Corner Plots (15.0%):**
  - Features dual road frontage, altering setback calculations on two sides under DCPR 2034 Reg. 41.
* **Street Access Width:**
  - 6m (~25% narrow gaothan road), 9m (~50% standard residential), 12m (~20%), 15m (~5%).

### B. Vertical Massing (Floors Wanted)
* **Single Floor (G only):** ~15% — Retirement bungalows and starter plots.
* **Ground + 1 (G+1):** ~60% — Dominant middle-class residential duplex typology.
* **Ground + 2 (G+2):** ~25% — Multi-generational family compounds and rental-income stilt homes.

### C. Budget Reality & Deliberate Underfunding Stress-Testing
* **Budget Range:** ₹12,00,000 to ₹1,50,00,000.
* **Realistic Construction Baseline:** Calculated at $\approx ₹2,300\text{/sqft}$ of built-up area for standard Mumbai RCC frame and finishes.
* **Deliberately Underfunded Cases (16.4%):**
  - Synthesized with budgets set to $40\%\text{ to }65\%$ of realistic construction cost (e.g., requesting a G+2 3,000 sqft house with ₹25 Lakhs).
  - Explicitly tagged with `"expect": {"over_budget_likely": true}`.
  - **Purpose:** Verifies that the budget engine gracefully informs the user of financial infeasibility rather than silently generating an impossible specification.

### D. Family Demographics & Accessibility
* **Adults:** 1 to 3 occupants (mode: 2 adults, 65%).
* **Elders:** 0 to 2 occupants (~50% contain $\ge 1$ senior citizen).
* **Elder Mobility Constraint (17.2%):**
  - Explicitly tagged with `"elder_mobility_issue": true` and `"expect": {"elder_ground_floor_bedroom": true}`.
  - **Benchmark Gate:** The generator must place a full master bedroom with ensuite toilet on the ground floor.
* **Kids:** 0 to 3 children (~65% contain children).
* **Pets:** ~25% have domestic pets (dogs/cats), triggering scratch-resistant tile requirements.
* **Work-From-Home (WFH):** ~45% have 1 or 2 remote workers, triggering quiet study room allocation.
* **Rental Floor Intent:** ~22% of multi-storey homes request a separate rental floor, triggering an external staircase.

### E. Tradition & Cultural Demographics
Reflects metropolitan Mumbai multi-cultural demographics:
* **No Tradition (Modernist/Functional):** 25%
* **Vaastu Shastra:** 48% (70% soft, 30% strict)
* **Islamic Principles (Qibla/Privacy):** 12% (70% soft, 30% strict)
* **Jain Principles (Chauvihar/Purity):** 8% (70% soft, 30% strict)
* **Feng Shui:** 4%
* **Biophilic Design:** 3%

### F. Natural Language & Hinglish Simulation
* **Hinglish Voice (20.0%):** Exactly 100 briefs contain natural colloquial Indian phrasing, Romanized Hindi, and everyday vocabulary (e.g. *"ghutne mein dard"*, *"bhai 2 car parking chahiye"*, *"kitchen SE mein hona mangta"*, *"chauvihar follow karte hain"*).
* **Typos & Informal Structure:** Text contains realistic conversational contractions, missing punctuation, and mixed English-Hindi syntax to validate the SLM keyword extractor.

---

## 3. The `expect` Ground-Truth Dictionary

The `expect` dictionary specifies strict ground-truth assertions that any competent human architect would demand:
1. `"elder_ground_floor_bedroom": true`: Enforced whenever elderly mobility issues are flagged.
2. `"over_budget_likely": true / false`: Objectively determined by comparing requested built-up floor area against regional PWD SSR baseline costs.
