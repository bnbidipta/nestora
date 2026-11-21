# Questionnaire v2 Architecture & Behavioral Design
**Document:** `docs/questionnaire-v2.md`  
**Target:** Client Intake UI, SLM Constraint Extractor, and Layout Solver  
**Status:** Design Draft (`verified: false`)  
**Specification:** `backend/app/data/questionnaire_v2.json`  
**Total Core Questions:** 14 (Target completion time: 3.5 minutes / 210 seconds)  

---

## 1. Step Order & Behavioral Logic

The questionnaire is organized into 4 logical progressive steps designed to maximize user completion rate and prevent cognitive drop-off:

```
Step 1: The Site & Envelope (Plot & Bylaws)
   │   • Build Type (Plot vs Flat vs Renovation)
   │   • Location & Road Frontage Width
   │   • Plot Dimensions & Cardinal Orientation
   │   • Ground Conditions & Environmental Confirmation
   ▼
Step 2: The Family & Daily Life (Program Sizing)
   │   • Floors Wanted & Parking Configuration
   │   • Household Occupants (Adults, Kids, Pets)
   │   • Mobility & Senior Accessibility (Step-free ground suite)
   │   • Work-from-Home & Quiet Study Needs
   ▼
Step 3: Cultural & Culinary Rituals (Spatial Zoning)
   │   • Kitchen Prep & Dietary Philosophy (Veg / Non-Veg / Jain)
   │   • Sacred Spaces & Festive Social Hosting
   │   • Traditional Rule Compliance (Vaastu / Biophilic / Modernist)
   ▼
Step 4: Investment, Future & Aspirations (BOQ & Free Text)
       • 5-to-10 Year Expansion (Future rental floor / lift shaft)
       • Target Construction Budget Tier (Economy / Standard / Premium)
       • Open Free-Text Voice (Hinglish/English personal wishes)
```

### Why This Order?
1. **Low Friction First:** Step 1 begins with objective, factual site dimensions that every landowner knows by heart.
2. **Emotional Investment in Step 2:** Family members, children, and parents create emotional momentum.
3. **Sensitive Cultural Needs in Step 3:** Once the user sees their home taking shape, they willingly share personal diet, prayer, and cultural practices.
4. **Financial Realism in Step 4:** Asking for budget *after* establishing family needs grounds the cost estimate in reality rather than premature cost-cutting.

---

## 2. Plain-English Wording & Anti-Jargon Guidelines

To keep the form accessible to non-architects across India:
- **Never use "FSI" or "FAR" without plain explanation:** Say *"Permissible floor area allowed on your plot"* in the primary label, placing *"Governed by municipal FSI bylaws"* in subtle help text.
- **Avoid technical terms like "Setbacks" or "Marginal Open Spaces":** Use *"Distance between your building and the street / boundary walls"*.
- **Avoid "RCC ductile moment frame":** Use *"Concrete pillar and beam structure"*.
- **Avoid "Circulation ratio":** Use *"Efficient hallway design with zero wasted corridors"*.

---

## 3. Strict Design Accountability (Every Answer Must Affect the Blueprint)

Every question in v2 directly alters specific algorithmic solver constraints, material schedules, or template filters:

| Question ID | What User Answers | How It Changes the Generated Design |
| :--- | :--- | :--- |
| `build_type` | Plot vs Flat vs Renovation | Routes directly to independent house synthesis; non-plot options trigger waitlist routing. |
| `location_and_access` | Street width (<9m, 9-12m, >12m) | Enforces municipal setback depths (Table 15) and caps permissible FSI (1.0 vs 2.0). |
| `plot_geometry` | Width ft, Depth ft, Facing | Determines building footprint aspect ratio, template filter bucket, and main entry orientation. |
| `site_environmental_confirm` | Basalt vs Clay vs CRZ default | Sizes foundation depth, determines raft vs isolated footing, and flags coastal buffer compliance. |
| `floors_and_parking` | G, G+1, G+2 with stilt or porch | Dictates total structural storeys, column sizing (230×230 vs 230×380mm), and car parking driveway turning clear radii. |
| `household_occupants` | Adults, Elders, Kids, Pets | Computes total bedroom count, bathroom counts, dining table seats, and overhead water tank capacity (135 LPCD). |
| `elder_accessibility` | Mobility / Knee pain | Enforces mandatory ground-floor master suite, 900mm clear door openings, and eliminates bathroom sunken thresholds. |
| `work_from_home` | Dedicated office vs nook | Allocates an acoustically isolated 100 sqft study room on the quiet upper floor with dedicated electrical circuits. |
| `kitchen_and_diet` | Veg vs Non-Veg vs Jain Chauvihar | Configures open vs closed wet/dry utility scullery, window morning daylight ratio, and orientation (East/South-East). |
| `sacred_space_and_hosting`| Mandir / Qibla / Large feasts | Allocates dedicated Puja room in North-East, aligns WC commodes perpendicular to Qibla (North-South), or expands living-dining. |
| `traditions_strictness` | Strict vs Practical vs Biophilic | Sets constraint penalties in solver: forces central open courtyard (Brahmasthana) and cardinal room swaps. |
| `future_horizon_10yr` | Rental floor / Home elevator | Switches internal stair to external tenant stair, stubs column rebars for vertical loading, and voids lift core slab. |
| `budget_and_finance` | Economy vs Standard vs Premium | Toggles material specification (AAC blocks vs bricks, vitrified tiles vs Italian marble, UPVC vs teak joinery). |
| `free_text_aspirations` | Hinglish personal notes | Natural language parser extracts non-standard lifestyle wishes (piano space, dog bath, terrace garden). |

---

## 4. Completion Time & Cognitive Load Benchmark

* **Expected completion time:** **3 minutes 30 seconds (210 seconds)**.
* **Smart Defaults:** Environmental physics and structural defaults pre-populate to safe regional Mumbai values, allowing users without engineering backgrounds to proceed with single-click confidence.
