# Starter Plan Templates Research & Architectural Typologies
**Document:** `docs/templates-research.md`  
**Target:** Algorithmic Constraint Solver & Layout Synthesizer  
**Templates Delivered:** 12 JSON templates in `backend/app/data/templates/draft/`  
**Plot Buckets:** 20×30 ft, 30×40 ft, 30×50 ft, 40×60 ft  
**Floors:** Ground (G), G+1, G+2  

---

## 1. Architectural Typologies Identified

Across urban and suburban Maharashtra (Greater Mumbai, Thane, Navi Mumbai, and Pune), plotted residential construction follows distinct architectural typologies governed by plot frontage, multi-generational family structures, vehicular parking constraints, and passive climatic response:

1. **Narrow-Lot Linear Row House (20×30 ft):**  
   Frontage is strictly constrained (~6m). Layouts must organize circulation along a single longitudinal spine. Services (kitchen/toilet) occupy intermediate or rear setback nodes.
2. **Dual-Unit Stacked Rental Typology (External Stair):**  
   Common among middle-class Indian self-builders seeking rental yields to service home construction loans. The external staircase (usually located in the front or side marginal setback) gives the tenant private access without entering the ground-floor owner residence.
3. **Multi-Generational Core with Ground Elder Suite:**  
   The hallmark of Indian suburban family homes. Ground floor incorporates a step-free master or elder bedroom with an ensuite bathroom, while upper floors provide children's bedrooms and private family lounges.
4. **Stilt Parking + Duplex / Triplex (G+2):**  
   In dense suburban Mumbai wards where municipal bylaws ban on-street parking, the ground floor is elevated on stilts to accommodate 2 cars and a home office/clinic, while living quarters occupy Floors 1 and 2.
5. **Courtyard / Light Well Infill (Stack Effect Cooling):**  
   For deep plots (e.g. 50–60 ft depth) abutting adjoining structures, natural light cannot reach the central core. A central courtyard (or open-to-sky cut-out) acts as a microclimatic light well and vertical thermal siphon, purging hot air while illuminating interior dining and puja spaces.
6. **Modern Contemporary Open-Plan Duplex:**  
   Eliminates internal partition walls on the ground floor to combine Living, Dining, and Open Kitchen into a singular expansive "Great Room", making compact 30×40 plots feel twice as large.
7. **Vaastu-Compliant Courtyard Haveli / Wada Typology:**  
   Synthesizes the traditional Maharashtrian *Wada* layout with strict Vaastu Shastra: Central *Brahma-sthana* courtyard kept void/light, *Agni* (South-East) kitchen, *Nairutya* (South-West) master bedroom, and *Ishanya* (North-East) entrance/puja.

---

## 2. Selection Rationale for the 12 Templates

The 12 templates were curated to represent the exact distribution of self-build requests in western India:

| Template ID | Plot (ft) | Floors | BHK | Primary Tag Focus | Target Persona |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `t_20x30_g_1bhk_compact` | 20×30 | 1 (G) | 1 | `compact`, `starter_home` | Single occupant, newly married couple, retirement starter |
| `t_20x30_g1_2bhk_rental` | 20×30 | 2 (G+1) | 2 | `external_stair`, `rental_income` | Plotted self-builder seeking tenant income to offset mortgage |
| `t_30x40_g_2bhk_bungalow` | 30×40 | 1 (G) | 2 | `single_floor`, `elder_friendly` | Senior citizens avoiding stairs entirely on 1,200 sqft plot |
| `t_30x40_g1_3bhk_elder` | 30×40 | 2 (G+1) | 3 | `elder_ground_bedroom`, `family_core` | The foundational 3BHK Indian family home (Mumbai Pilot benchmark) |
| `t_30x40_g1_3bhk_duplex_open` | 30×40 | 2 (G+1) | 3 | `open_plan`, `contemporary` | Modern urban professionals wanting spacious entertaining areas |
| `t_30x40_g2_4bhk_stilt` | 30×40 | 3 (G+2) | 4 | `stilt_parking`, `multi_gen` | High-density urban plot requiring 2-car covered parking |
| `t_30x50_g1_3bhk_courtyard` | 30×50 | 2 (G+1) | 3 | `central_courtyard`, `biophilic` | Deep plot needing passive light and cross-ventilation |
| `t_30x50_g1_4bhk_joint_family` | 30×50 | 2 (G+1) | 4 | `elder_ground_bedroom`, `joint_family` | 6–8 member joint family needing storage, study, and elder suite |
| `t_30x50_g2_independent_floors`| 30×50 | 3 (G+2) | 5 | `external_stair`, `multi_unit` | Investor/builder floors: 1BHK ground unit + two 2BHK rental units |
| `t_40x60_g1_4bhk_luxury` | 40×60 | 2 (G+1) | 4 | `car_parking`, `double_height_living`| High-net-worth suburban villa with garage & wet/dry kitchen |
| `t_40x60_g2_5bhk_multigen_lift` | 40×60 | 3 (G+2) | 5 | `elder_ground_bedroom`, `terrace_garden`| 3-generation estate with penthouse lounge and terrace garden |
| `t_40x60_g1_courtyard_vaastu` | 40×60 | 2 (G+1) | 4 | `central_courtyard`, `vaastu_compliant`| Heritage-conscious family requiring strict cardinal zoning |

---

## 3. Solver Constraints & Circulation Budget

* **Circulation & Wall Factor:** Every template strictly limits the sum of `rel_area` on each floor to **$\le 0.90$** (averaging between $0.83$ and $0.88$). The remaining $10\%\text{–}17\%$ of buildable floorplate is reserved by the solver for:
  - External and internal load-bearing/partition walls ($230\text{mm}$ and $115\text{mm}$).
  - Corridors, passages, door swing clearances, and staircase landing landings.
* **Vertical Wet Core Stacking:** Every multi-storey template includes explicit `wet_core_stack` arrays aligning upper and lower toilets to ensure plumbing drainage stacks (soil/waste pipes) drop vertically through designated service shafts without crossing living room ceilings.
* **Prohibited Adjacencies:** Strict `must_not_touch` constraints enforce Indian hygiene and cultural sensitivities:
  - Kitchen walls must never abut toilet / water closet walls.
  - Puja rooms must never share walls or plumbing stacks with toilets.

---

## 4. Architect Review Checklist

Prior to activating these templates in the automated constraint solver, a licensed architect should review:

1. **Shaft & Duct Allocations for Middle-Zone Toilets:**  
   Where powder rooms or common toilets are placed in middle zones (e.g. `toilet_guest` or `toilet_common`), verify that the solver reserves a $0.6\text{m} \times 0.6\text{m}$ vertical ventilation shaft (duct) to the roof.
2. **Staircase Headroom Clearances:**  
   Verify that dog-leg and U-shaped stair configurations meet the $2.20\text{m}$ clear headroom requirement over floor 0 passages.
3. **Car Porch Structural Span:**  
   Ensure that ground-floor car porches spanning $> 4.5\text{m}$ incorporate reinforced cantilever beams or twin-column bents that do not interfere with driveway vehicular turning radii ($R \ge 4.5\text{m}$).
4. **Courtyard Drainage & Monsoon Rain Protection:**  
   Confirm that central courtyard models specify subterranean rainwater collection sumps with dual-motor sump pumps to prevent monsoon inundation during Mumbai high-intensity downpours.
