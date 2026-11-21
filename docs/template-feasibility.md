# Mumbai Template Feasibility Audit (DCPR 2034 & NBC 2016)

> **Document Status**: Draft (Pre-Solver Audit)  
> **Authority**: Municipal Corporation of Greater Mumbai (MCGM)  
> **Governing Regulations**: Development Control and Promotion Regulations for Greater Mumbai, 2034 (DCPR 2034) & National Building Code of India 2016 (NBC 2016)  
> **Verified**: false (Requires review by a licensed architect registered with COA and MCGM)  
> **Road Width Evaluated**: 9.0 m (Standard suburban residential access road)  

---

## 1. Executive Summary

This study audits the **12 starter plan-template drafts** in `backend/app/data/templates/draft/` against the statutory planning and building code parameters established in `backend/app/data/packs/mumbai.draft.json`. The purpose is to verify whether each template can fit its assigned plot bucket in principle *before* building the automated constraint layout solver.

### Verdict Overview
- **`fits` (1 template)**:
  - `t_30x50_g1_3bhk_courtyard` (Base FSI 0.95; requires minor 0.01 rel_area rebalance for elder bedroom).
- **`fits_with_premium_fsi` (4 templates)**:
  - `t_30x50_g2_independent_floors` (Built FSI 1.42 $\le$ 1.50 Premium FSI; parking compliant; needs minor 0.01 rel_area adjustment on secondary bedrooms).
  - `t_40x60_g1_4bhk_luxury` (Built FSI 1.14 $\le$ 1.50 Premium FSI; 100% compliant room sizes, garage, and setbacks).
  - `t_40x60_g1_courtyard_vaastu` (Built FSI 1.14 $\le$ 1.50 Premium FSI; 100% compliant rooms, parking, and central light well).
  - `t_40x60_g2_5bhk_multigen_lift` (Net chargeable FSI 1.506 with terrace exemption, fitting within Premium FSI 1.50 + minor TDR; 100% compliant room sizes, parking, and lift core).
- **`does_not_fit` (7 templates)**:
  - `t_20x30_g_1bhk_compact` (Footprint 23.12 m² cannot fit 27.10 m² minimum statutory room areas; 100% of rooms fail).
  - `t_20x30_g1_2bhk_rental` (23.12 m² per floor cannot house 1BHK; all 8 rooms fail; external stair cannot fit in 2.0 m front setback).
  - `t_30x40_g_2bhk_bungalow` (Single-floor 2BHK+porch in 47.26 m² footprint severely fails room minimums across 7 rooms).
  - `t_30x40_g1_3bhk_elder` (Over-subdivided; elder bed, kids bed, family lounge, 3 toilets, and car porch fail statutory minimums).
  - `t_30x40_g1_3bhk_duplex_open` (Guest bed and Bed-2 fail 9.5 m²; car porch fails 12.5 m²; fixable as 2BHK duplex).
  - `t_30x40_g2_4bhk_stilt` (Requires Premium FSI 1.27; elder bed, kids bed, and guest bed fail 9.5 m²; fixable as 3BHK stilt).
  - `t_30x50_g1_4bhk_joint_family` (Elder bed 8.58 m² and upper guest bed 9.24 m² fail 9.5 m²; car porch undersized; fixable as 3BHK).

---

## 2. Mumbai Statutory Baseline & Calculation Rules

### 2.1 Plot Buckets & Buildable Footprint Envelopes (9.0 m Road)
*Conversion factor: $1\text{ ft} = 0.3048\text{ m}$. Metric plot dimensions are exact conversions.*

Setbacks are derived from `mumbai.draft.json` (`setbacks.by_plot_and_road`):
1. **Plots $\le 100\text{ m}^2$ on 9 m Road** (Row 1; DCPR 2034 Reg. 41(4), Table 15):
   - Front: 2.0 m | Side: 1.0 m (each side, total 2.0 m) | Rear: 1.5 m
   - *Clause 41(5) Note:* Side dead-wall may be built to boundary subject to NOC / CFO; standard detached assumes two 1.0 m side setbacks.
2. **Plots $\le 250\text{ m}^2$ on 9 m Road** (Row 2; DCPR 2034 Reg. 41(1), Table 15 & Reg. 41(4)):
   - Front: 3.0 m | Side: 1.5 m (each side, total 3.0 m) | Rear: 1.5 m

| Plot Bucket (ft) | Plot Dim. (m) | Plot Area | Setback Row | Mandatory Setbacks (F / S / R) | Buildable Dim. (W × D) | Buildable Footprint | Effective Coverage | Max Allowed Coverage |
|---|---|---|---|---|---|---|---|---|
| **20×30** | 6.096 × 9.144 m | 55.74 m² | Row 1 (≤100 m²) | 2.0 m / 1.0 m / 1.5 m | 4.096 × 5.644 m | **23.12 m²** | 41.47% | 55% (30.66 m²) |
| **30×40** | 9.144 × 12.192 m | 111.48 m² | Row 2 (≤250 m²) | 3.0 m / 1.5 m / 1.5 m | 6.144 × 7.692 m | **47.26 m²** | 42.39% | 55% (61.32 m²) |
| **30×50** | 9.144 × 15.240 m | 139.35 m² | Row 2 (≤250 m²) | 3.0 m / 1.5 m / 1.5 m | 6.144 × 10.740 m | **65.99 m²** | 47.35% | 55% (76.65 m²) |
| **40×60** | 12.192 × 18.288 m | 222.97 m² | Row 2 (≤250 m²) | 3.0 m / 1.5 m / 1.5 m | 9.192 × 13.788 m | **126.74 m²** | 56.84%* | 55% (122.63 m²)* |

*\*Note on 40×60 Coverage:* DCPR 2034 does not prescribe a rigid ground coverage percentage for small residential plots; coverage is governed by marginal setbacks. If a 55% guideline cap is enforced, footprint is capped at 122.63 m².

---

### 2.2 FSI & Permissible Floor Area (DCPR 2034 Reg. 30 & 32, Table 12)
On an access road width of 9.0 m in Mumbai Suburbs / Extended Suburbs:
- **Base Zonal FSI**: **1.00** (DCPR 2034 Reg. 30(1), Table 12).
- **Premium FSI**: Additional **0.50** permissible upon payment of premium at 50% of Ready Reckoner Rate (RRR) (DCPR 2034 Reg. 30(2)). Total FSI with premium = **1.50**.
- **Transferable Development Rights (TDR)**: Additional **0.50** permissible on roads $\ge 9.0\text{ m}$ (DCPR 2034 Reg. 32, Table 12). Maximum potential FSI = **2.00**.

| Plot Bucket | Plot Area | Base FSI (1.00) Area Allowed | Premium FSI (1.50) Area Allowed | Max FSI w/ TDR (2.00) Area Allowed |
|---|---|---|---|---|
| **20×30** | 55.74 m² | **55.74 m²** | **83.61 m²** | **111.48 m²** |
| **30×40** | 111.48 m² | **111.48 m²** | **167.23 m²** | **222.97 m²** |
| **30×50** | 139.35 m² | **139.35 m²** | **209.03 m²** | **278.71 m²** |
| **40×60** | 222.97 m² | **222.97 m²** | **334.45 m²** | **445.93 m²** |

---

### 2.3 Statutory Space & Dimension Minimums
1. **Habitable Rooms** (Living, Bedroom, Study, Lounge):
   - Carpet area: $\ge \mathbf{9.5\text{ m}^2}$ (DCPR 2034 Reg. 37(1)(a) & NBC 2016 Part 3 Clause 4.5.1).
   - Clear width: $\ge \mathbf{2.4\text{ m}}$ (DCPR 2034 Reg. 37(1)(b) & NBC 2016 Part 3 Clause 4.5.2).
   - Clear height: $\ge \mathbf{2.75\text{ m}}$ (DCPR 2034 Reg. 37(1)(c)).
2. **Kitchen**:
   - Area: $\ge \mathbf{5.5\text{ m}^2}$ where separate dining provided (DCPR 2034 Reg. 37(2)(a) & NBC 2016 Part 3 Clause 4.6.1).
   - Clear width: $\ge \mathbf{1.8\text{ m}}$.
3. **Bathrooms & Water Closets (Toilets)**:
   - Combined Bath + WC: $\ge \mathbf{2.6\text{ m}^2}$, width $\ge 1.2\text{ m}$ (DCPR 2034 Reg. 37(3)(a) & NBC 2016 Part 3 Clause 4.8.1).
   - Independent WC (Powder Room): $\ge \mathbf{1.1\text{ m}^2}$, width $\ge 0.9\text{ m}$.
   - Independent Bathroom: $\ge \mathbf{1.5\text{ m}^2}$, width $\ge 1.2\text{ m}$.
4. **Staircase**:
   - Minimum clear flight width: $\ge \mathbf{0.9\text{ m}}$ (DCPR 2034 Reg. 37(18)(b) & NBC 2016 Part 4 Table 7).
   - Maximum riser: $\le \mathbf{175\text{ mm}}$ (DCPR 2034 Reg. 37(18)(c)).
   - Minimum tread: $\ge \mathbf{250\text{ mm}}$ (DCPR 2034 Reg. 37(18)(d)).
   - Standard dog-leg residential stair footprint: $\sim \mathbf{5.50\text{ m}^2\text{ to }6.50\text{ m}^2}$ ($1.9\text{ m width}\times 2.9\text{ m length}$).
5. **Car Parking**:
   - Mandate: 1 car space for residential tenement carpet area $> 100\text{ m}^2$; 1 two-wheeler space for tenements $\le 100\text{ m}^2$ (DCPR 2034 Reg. 44, Table 21).
   - Car stall clear dimensions: $\mathbf{2.5\text{ m}\times 5.0\text{ m} = 12.50\text{ m}^2}$ (DCPR 2034 Reg. 44(1)).
   - Driveway / maneuvering space: $\ge 3.0\text{ m}$.

---

## 3. Master Feasibility Table

*Calculations based on 9.0 m road width and standard setback envelopes from `mumbai.draft.json`.*

| # | Template ID | Plot (ft) | Plot Area | Footprint / Fl | Fl. | Total Built | FSI Req. | Base FSI Cap | Prem. FSI Cap | FSI Status | Room Min. Size Violations | Stair Check | Parking Check | Final Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `t_20x30_g_1bhk_compact` | 20×30 | 55.74 m² | 23.12 m² | 1 | 23.12 m² | 0.41 | 55.74 m² | 83.61 m² | Fits Base | **4/4 fail**: Living 6.47 m² (<9.5), Bed 5.55 m² (<9.5), Kitchen 3.70 m² (<5.5), Toilet 2.31 m² (<2.6) | N/A (1 Fl) | 2-wheeler fits | **`does_not_fit`** |
| 2 | `t_20x30_g1_2bhk_rental` | 20×30 | 55.74 m² | 23.12 m² | 2 | 46.24 m² | 0.83 | 55.74 m² | 83.61 m² | Fits Base | **8/8 fail**: Both floors have Living 6.47 m² (<9.5), Bed 6.01 m² (<9.5), Kit 3.70 m² (<5.5), Toilet 2.31 m² (<2.6) | **Fails**: External stair cannot fit in 2.0 m front setback | 2-wheeler fits | **`does_not_fit`** |
| 3 | `t_30x40_g_2bhk_bungalow` | 30×40 | 111.48 m² | 47.26 m² | 1 | 47.26 m² | 0.42 | 111.48 m² | 167.23 m² | Fits Base | **7/8 fail**: Bed-Master 6.62 m² (<9.5), Bed-2 4.73 m² (<9.5), Kit 4.73 m² (<5.5), Living 9.45 m² (<9.5), Porch 5.67 m² (<12.5), 2 Toilets (<2.6) | N/A (1 Fl) | **Fails**: Porch 5.67 m² < 12.5 m²; setback is 3.0 m | **`does_not_fit`** |
| 4 | `t_30x40_g1_3bhk_elder` | 30×40 | 111.48 m² | 47.26 m² | 2 | 94.52 m² | 0.85 | 111.48 m² | 167.23 m² | Fits Base | **6/11 fail**: Elder Bed 7.56 m² (<9.5), Kids Bed 8.51 m² (<9.5), Lounge 8.51 m² (<9.5), Porch 6.62 m² (<12.5), 3 Toilets (<2.6) | Choked: Stair 5.5 m² leaves 0 m² for walls/passages | **Fails**: Porch 6.62 m² < 12.5 m² | **`does_not_fit`** |
| 5 | `t_30x40_g1_3bhk_duplex_open` | 30×40 | 111.48 m² | 47.26 m² | 2 | 94.52 m² | 0.85 | 111.48 m² | 167.23 m² | Fits Base | **4/9 fail**: Guest Bed 8.51 m² (<9.5), Bed-2 8.51 m² (<9.5), Lounge 9.45 m² (<9.5), Porch 6.62 m² (<12.5) | Fits (~6.6 m² core) | **Fails**: Porch 6.62 m² < 12.5 m² | **`does_not_fit`** |
| 6 | `t_30x40_g2_4bhk_stilt` | 30×40 | 111.48 m² | 47.26 m² | 3 | 141.78 m² | 1.27 | 111.48 m² | 167.23 m² | Needs Prem. | **3/9 hab. fail**: Elder Bed 8.51 m² (<9.5), Guest Bed 8.51 m² (<9.5), Kids Bed 9.45 m² (<9.5) | Fits vertical core | **Passes**: Stilt parking 23.63 m² $\ge$ 12.5 m² | **`does_not_fit`** |
| 7 | `t_30x50_g1_3bhk_courtyard` | 30×50 | 139.35 m² | 65.99 m² | 2 | 131.97 m² | 0.95 | 139.35 m² | 209.03 m² | **Fits Base** | **Borderline 1 room**: Elder Bed 9.24 m² (needs 9.50 m²; deficit 0.26 m²). Porch 6.60 m² (recessed carport) | Fits (7.5 m² core) | Fits via recessed carport + setback | **`fits`** *(with minor 0.01 tuning)* |
| 8 | `t_30x50_g1_4bhk_joint_family` | 30×50 | 139.35 m² | 65.99 m² | 2 | 131.97 m² | 0.95 | 139.35 m² | 209.03 m² | Fits Base | **2 hab. fail**: Elder Bed 8.58 m² (<9.5), Upper Guest Bed 9.24 m² (<9.5). Porch 6.60 m² (<12.5) | Fits | **Fails**: Porch 6.60 m² < 12.5 m² | **`does_not_fit`** |
| 9 | `t_30x50_g2_independent_floors` | 30×50 | 139.35 m² | 65.99 m² | 3 | 197.96 m² | 1.42 | 139.35 m² | 209.03 m² | **Fits Prem.** | **Borderline 2 rooms**: Bed-1b 9.24 m² & Bed-2b 9.24 m² (deficit 0.26 m²). All other rooms pass | Fits side core | **Passes**: Covered parking 21.12 m² $\ge$ 12.5 m² | **`fits_with_premium_fsi`** *(with minor 0.01 tuning)* |
| 10 | `t_40x60_g1_4bhk_luxury` | 40×60 | 222.97 m² | 126.74 m² | 2 | 253.48 m² | 1.14 | 222.97 m² | 334.45 m² | **Fits Prem.** | **0 violations**: All rooms exceed code. Master 27.88 m², Living 27.88 m², Kit 17.74 m², Powder 2.53 m² | Fits easily | **Passes**: Garage 20.28 m² $\ge$ 12.5 m² | **`fits_with_premium_fsi`** |
| 11 | `t_40x60_g1_courtyard_vaastu` | 40×60 | 222.97 m² | 126.74 m² | 2 | 253.48 m² | 1.14 | 222.97 m² | 334.45 m² | **Fits Prem.** | **0 violations**: All rooms exceed code. Master 26.62 m², Living 22.81 m², Kit 13.94 m², Courtyard 12.67 m² | Fits easily | **Passes**: Porch 15.21 m² $\ge$ 12.5 m² | **`fits_with_premium_fsi`** |
| 12 | `t_40x60_g2_5bhk_multigen_lift` | 40×60 | 222.97 m² | 126.74 m² | 3 | 380.22 m²* | 1.71* | 222.97 m² | 334.45 m² | **Fits Prem. / TDR** | **0 violations**: All rooms exceed code. Master 30.42 m², Guest 30.42 m², Terrace Garden 44.36 m² | Fits lift + stair | **Passes**: Porch 20.28 m² $\ge$ 12.5 m² | **`fits_with_premium_fsi`** |

*\*Note on Template 12 FSI:* Gross built-up area is 380.22 m² (FSI 1.71), but Floor 2 contains 44.36 m² of open terrace garden exempt from FSI under DCPR 2034 Reg. 31(1). Net chargeable FSI area is 335.86 m² (FSI 1.506), fitting Base + Premium FSI with negligible 1.41 m² TDR.

---

## 4. Comprehensive Template-by-Template Feasibility Analysis

### 4.1 Template `t_20x30_g_1bhk_compact`
- **Bucket & Area**: 20×30 ft | Plot Area: 55.74 m² (6.096 m × 9.144 m)
- **Setbacks Applied**: Row 1 (plots $\le 100\text{ m}^2$, road 9 m; DCPR Table 15): Front 2.0 m, Rear 1.5 m, Sides 2 × 1.0 m = 2.0 m.
- **Buildable Envelope**: $4.096\text{ m (width)}\times 5.644\text{ m (depth)} = \mathbf{23.12\text{ m}^2}$ (Coverage: 41.47%).
- **Floor Area Allowed**: Base FSI 1.0 = 55.74 m² | Premium FSI 1.5 = 83.61 m².
- **Template Built Area**: 1 Floor × 23.12 m² = 23.12 m² (FSI 0.41 $\le$ 1.00; FSI check passes).
- **Room Dimension Audit**:
  - `living`: rel_area 0.28 $\rightarrow 6.47\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$ min habitable, deficit $3.03\text{ m}^2$).
  - `bedroom`: rel_area 0.24 $\rightarrow 5.55\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$ min habitable, deficit $3.95\text{ m}^2$).
  - `kitchen`: rel_area 0.16 $\rightarrow 3.70\text{ m}^2$ (**FAIL**: $< 5.50\text{ m}^2$ min kitchen, deficit $1.80\text{ m}^2$).
  - `toilet`: rel_area 0.10 $\rightarrow 2.31\text{ m}^2$ (**FAIL**: $< 2.60\text{ m}^2$ min toilet, deficit $0.29\text{ m}^2$).
  - `entrance_verandah`: rel_area 0.08 $\rightarrow 1.85\text{ m}^2$.
- **The Mathematical Impossibility**:
  $$\text{Required Minimum Carpet Area} = 9.5\text{ (Living)} + 9.5\text{ (Bed)} + 5.5\text{ (Kitchen)} + 2.6\text{ (Toilet)} = \mathbf{27.10\text{ m}^2}$$
  The statutory minimum room carpet area ($27.10\text{ m}^2$) exceeds the entire gross buildable footprint ($23.12\text{ m}^2$) by $3.98\text{ m}^2$, even before adding walls or circulation.
- **Stair & Parking**: No stair required (single floor). Tenement $\le 100\text{ m}^2$ requires 1 scooter space, which fits on site.
- **Verdict**: **`does_not_fit`** (Fundamental physical impossibility under standard setbacks).

---

### 4.2 Template `t_20x30_g1_2bhk_rental`
- **Bucket & Area**: 20×30 ft | Plot Area: 55.74 m²
- **Setbacks Applied**: Row 1: Front 2.0 m, Rear 1.5 m, Sides 2 × 1.0 m. Footprint = **23.12 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 55.74 m² | Premium FSI 1.5 = 83.61 m².
- **Template Built Area**: 2 Floors × 23.12 m² = 46.24 m² (FSI 0.83 $\le$ 1.00; FSI check passes).
- **Room Dimension Audit**:
  - Floor 0 (Unit 1) & Floor 1 (Unit 2) are identical:
    - `living_g` / `living_1`: rel_area 0.28 $\rightarrow 6.47\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $3.03\text{ m}^2$).
    - `bedroom_g` / `bedroom_1`: rel_area 0.26 $\rightarrow 6.01\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $3.49\text{ m}^2$).
    - `kitchen_g` / `kitchen_1`: rel_area 0.16 $\rightarrow 3.70\text{ m}^2$ (**FAIL**: $< 5.50\text{ m}^2$, deficit $1.80\text{ m}^2$).
    - `toilet_g` / `toilet_1`: rel_area 0.10 $\rightarrow 2.31\text{ m}^2$ (**FAIL**: $< 2.60\text{ m}^2$, deficit $0.29\text{ m}^2$).
  - **100% of rooms (8 of 8) fail statutory minimums.**
- **Stair & Circulation Audit**:
  - `stair`: `{"type": "external", "zone": "front", "side": "right"}`.
  - Per DCPR 2034 Reg. 37(18) & NBC Part 4 Table 7, residential stairs require flight width $\ge 0.9\text{ m}$, riser $\le 175\text{ mm}$, tread $\ge 250\text{ mm}$. A straight flight to reach 2.9 m upper level requires 17 risers = 16 treads $\times 0.25\text{ m} = 4.0\text{ m}$ plus $0.9\text{ m}$ landing = $4.9\text{ m}$ run.
  - The front setback is only **2.0 m**. An external staircase cannot physically fit inside a 2.0 m front setback without encroaching into the road reservation.
- **Verdict**: **`does_not_fit`** (All rooms fail and external stair cannot fit).

---

### 4.3 Template `t_30x40_g_2bhk_bungalow`
- **Bucket & Area**: 30×40 ft | Plot Area: 111.48 m² (9.144 m × 12.192 m)
- **Setbacks Applied**: Row 2 (plots $\le 250\text{ m}^2$, road 9 m; DCPR Table 15): Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m = 3.0 m.
- **Buildable Envelope**: $6.144\text{ m}\times 7.692\text{ m} = \mathbf{47.26\text{ m}^2}$ (Coverage: 42.39%).
- **Floor Area Allowed**: Base FSI 1.0 = 111.48 m² | Premium FSI 1.5 = 167.23 m².
- **Template Built Area**: 1 Floor × 47.26 m² = 47.26 m² (FSI 0.42 $\le$ 1.00; FSI check passes).
- **Room Dimension Audit**:
  - `car_porch`: rel_area 0.12 $\rightarrow 5.67\text{ m}^2$ (**FAIL**: $< 12.50\text{ m}^2$ car stall, deficit $6.83\text{ m}^2$).
  - `living`: rel_area 0.20 $\rightarrow 9.45\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$ min habitable, deficit $0.05\text{ m}^2$).
  - `dining`: rel_area 0.10 $\rightarrow 4.73\text{ m}^2$.
  - `kitchen`: rel_area 0.10 $\rightarrow 4.73\text{ m}^2$ (**FAIL**: $< 5.50\text{ m}^2$ min kitchen, deficit $0.77\text{ m}^2$).
  - `bedroom_master`: rel_area 0.14 $\rightarrow 6.62\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$ min habitable, deficit $2.88\text{ m}^2$).
  - `bedroom_2`: rel_area 0.10 $\rightarrow 4.73\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$ min habitable, deficit $4.77\text{ m}^2$).
  - `toilet_master`: rel_area 0.05 $\rightarrow 2.36\text{ m}^2$ (**FAIL**: $< 2.60\text{ m}^2$ min toilet, deficit $0.24\text{ m}^2$).
  - `toilet_common`: rel_area 0.03 $\rightarrow 1.42\text{ m}^2$ (**FAIL**: $< 2.60\text{ m}^2$ min toilet, deficit $1.18\text{ m}^2$).
- **Parking Audit**: Front setback is 3.0 m; a standard car stall is 5.0 m long. Perpendicular parking in the setback is prohibited. The built-in car porch of 5.67 m² is less than half the size of a standard car stall (12.50 m²).
- **Verdict**: **`does_not_fit`** (Severe overcrowding on a single floor; 7 of 8 functional spaces fail statutory minimums).

---

### 4.4 Template `t_30x40_g1_3bhk_elder`
- **Bucket & Area**: 30×40 ft | Plot Area: 111.48 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **47.26 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 111.48 m² | Premium FSI 1.5 = 167.23 m².
- **Template Built Area**: 2 Floors × 47.26 m² = 94.52 m² (FSI 0.85 $\le$ 1.00; FSI check passes).
- **Room Dimension Audit**:
  - Floor 0 (rel_area sum 0.89):
    - `car_porch`: rel_area 0.14 $\rightarrow 6.62\text{ m}^2$ (**FAIL**: $< 12.50\text{ m}^2$).
    - `living`: rel_area 0.22 $\rightarrow 10.40\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen`: rel_area 0.12 $\rightarrow 5.67\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_elder`: rel_area 0.16 $\rightarrow 7.56\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $1.94\text{ m}^2$).
    - `toilet_elder`: rel_area 0.05 $\rightarrow 2.36\text{ m}^2$ (**FAIL**: $< 2.60\text{ m}^2$).
    - `toilet_guest`: rel_area 0.04 $\rightarrow 1.89\text{ m}^2$ (PASS if powder room WC $\ge 1.1\text{ m}^2$; FAIL if full bath $< 2.60\text{ m}^2$).
  - Floor 1 (rel_area sum 0.87):
    - `family_lounge_1`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.99\text{ m}^2$).
    - `bedroom_master`: rel_area 0.22 $\rightarrow 10.40\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_kids`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.99\text{ m}^2$).
    - `toilet_kids`: rel_area 0.05 $\rightarrow 2.36\text{ m}^2$ (**FAIL**: $< 2.60\text{ m}^2$).
- **Staircase & Circulation Audit**:
  - Unallocated footprint on Floor 0 is $(1.0 - 0.89)\times 47.26\text{ m}^2 = \mathbf{5.20\text{ m}^2}$.
  - A statutory dog-leg staircase requires at least $5.50\text{ m}^2$. Squeezing the stair consumes the entire unallocated margin, leaving literally $0.00\text{ m}^2$ for internal walls and hallways.
- **Verdict**: **`does_not_fit`** (Elder bedroom, kids bedroom, lounge, and car porch fail; vertical core chokes circulation).

---

### 4.5 Template `t_30x40_g1_3bhk_duplex_open`
- **Bucket & Area**: 30×40 ft | Plot Area: 111.48 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **47.26 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 111.48 m² | Premium FSI 1.5 = 167.23 m².
- **Template Built Area**: 2 Floors × 47.26 m² = 94.52 m² (FSI 0.85 $\le$ 1.00; FSI check passes).
- **Room Dimension Audit**:
  - Floor 0:
    - `living_dining_greatroom`: rel_area 0.34 $\rightarrow 16.07\text{ m}^2$ (PASS $\ge 9.5\text{ m}^2$).
    - `open_kitchen`: rel_area 0.14 $\rightarrow 6.62\text{ m}^2$ (PASS $\ge 5.5\text{ m}^2$).
    - `bedroom_guest`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.99\text{ m}^2$).
    - `toilet_g`: rel_area 0.06 $\rightarrow 2.84\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
    - `car_porch`: rel_area 0.14 $\rightarrow 6.62\text{ m}^2$ (**FAIL**: $< 12.50\text{ m}^2$).
  - Floor 1:
    - `bedroom_master`: rel_area 0.24 $\rightarrow 11.34\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_2`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.99\text{ m}^2$).
    - `family_lounge_1`: rel_area 0.20 $\rightarrow 9.45\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.05\text{ m}^2$).
    - `toilet_master`: rel_area 0.08 $\rightarrow 3.78\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
- **Stair & Parking**: Stair fits within unallocated $6.62\text{ m}^2$ core. Car porch ($6.62\text{ m}^2$) is undersized.
- **Verdict**: **`does_not_fit`** (Highly fixable candidate; dropping ground bedroom turns this into an exemplary, fully compliant 2BHK duplex).

---

### 4.6 Template `t_30x40_g2_4bhk_stilt`
- **Bucket & Area**: 30×40 ft | Plot Area: 111.48 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **47.26 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 111.48 m² | Premium FSI 1.5 = 167.23 m² | Max TDR FSI 2.0 = 222.97 m².
- **Template Built Area**: 3 Floors × 47.26 m² = **141.78 m²** (FSI 1.27).
  - *FSI Check:* Exceeds Base FSI (111.48 m²) by $30.30\text{ m}^2$. Fits comfortably within Premium FSI 1.5 (167.23 m²).
  - *FSI Exemption Note:* Under DCPR 2034 Reg. 31(1), stilt parking is free of FSI. If ground stilt is excluded, chargeable FSI is $94.52\text{ m}^2$ (FSI 0.85), which fits even Base FSI.
- **Room Dimension Audit**:
  - Floor 0 (Stilt):
    - `stilt_car_parking`: rel_area 0.50 $\rightarrow \mathbf{23.63\text{ m}^2}$ (PASS: $\ge 12.50\text{ m}^2$; accommodates 1 car + 2 bikes).
    - `home_office`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (Borderline: $< 9.50\text{ m}^2$ if classified as habitable).
  - Floor 1:
    - `living`: rel_area 0.28 $\rightarrow 13.23\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen`: rel_area 0.14 $\rightarrow 6.62\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_elder`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.99\text{ m}^2$).
  - Floor 2:
    - `bedroom_master`: rel_area 0.26 $\rightarrow 12.29\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_kids`: rel_area 0.20 $\rightarrow 9.45\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.05\text{ m}^2$).
    - `bedroom_guest_2`: rel_area 0.18 $\rightarrow 8.51\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.99\text{ m}^2$).
- **Stair & Parking**: Stilt parking is excellent ($23.63\text{ m}^2$). Vertical staircase core aligns across all 3 levels.
- **Verdict**: **`does_not_fit`** (Requires Premium FSI 1.27, and 4BHK program over-subdivides upper floors; fixable to `fits_with_premium_fsi` by re-scoping to 3BHK).

---

### 4.7 Template `t_30x50_g1_3bhk_courtyard`
- **Bucket & Area**: 30×50 ft | Plot Area: 139.35 m² (9.144 m × 15.240 m)
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m.
- **Buildable Envelope**: $6.144\text{ m}\times 10.740\text{ m} = \mathbf{65.99\text{ m}^2}$ (Coverage: 47.35%).
- **Floor Area Allowed**: Base FSI 1.0 = 139.35 m² | Premium FSI 1.5 = 209.03 m².
- **Template Built Area**: 2 Floors × 65.99 m² = **131.97 m²** (FSI 0.95 $\le$ 1.00; **FSI check passes under Base FSI**).
- **Room Dimension Audit**:
  - Floor 0:
    - `living`: rel_area 0.18 $\rightarrow 11.88\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `central_courtyard`: rel_area 0.10 $\rightarrow 6.60\text{ m}^2$ (Open light well; compliant).
    - `kitchen`: rel_area 0.11 $\rightarrow 7.26\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_elder`: rel_area 0.14 $\rightarrow \mathbf{9.24\text{ m}^2}$ (**Borderline FAIL**: $0.26\text{ m}^2$ below $9.50\text{ m}^2$).
    - `toilet_elder`: rel_area 0.05 $\rightarrow 3.30\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
    - `car_porch`: rel_area 0.10 $\rightarrow 6.60\text{ m}^2$ (Designed as recessed carport portico).
  - Floor 1:
    - `courtyard_cutout_void`: rel_area 0.10 $\rightarrow 6.60\text{ m}^2$ (Compliant void).
    - `family_lounge`: rel_area 0.18 $\rightarrow 11.88\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_master`: rel_area 0.22 $\rightarrow 14.52\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_kids`: rel_area 0.18 $\rightarrow 11.88\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `toilet_master`: rel_area 0.06 $\rightarrow 3.96\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
    - `toilet_kids`: rel_area 0.05 $\rightarrow 3.30\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
- **Stair & Parking**: Unallocated $7.26\text{ m}^2$ comfortably accommodates a dog-leg stair. On a 30 ft plot with 3.0 m front setback, the $6.60\text{ m}^2$ built-in porch recesses the vehicle bay by 2.5 m, creating a total $2.5\text{ m}\times 5.5\text{ m}$ parking stall combined with the setback.
- **Verdict**: **`fits`** *(Fits under Base FSI; requires a trivial 0.01 rel_area transfer to make elder bedroom 9.90 m²).*

---

### 4.8 Template `t_30x50_g1_4bhk_joint_family`
- **Bucket & Area**: 30×50 ft | Plot Area: 139.35 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **65.99 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 139.35 m² | Premium FSI 1.5 = 209.03 m².
- **Template Built Area**: 2 Floors × 65.99 m² = 131.97 m² (FSI 0.95 $\le$ 1.00; fits Base FSI).
- **Room Dimension Audit**:
  - Floor 0:
    - `living`: rel_area 0.20 $\rightarrow 13.20\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen`: rel_area 0.11 $\rightarrow 7.26\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_elder`: rel_area 0.13 $\rightarrow 8.58\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.92\text{ m}^2$).
    - `car_porch`: rel_area 0.10 $\rightarrow 6.60\text{ m}^2$ ($< 12.50\text{ m}^2$).
  - Floor 1:
    - `bedroom_master`: rel_area 0.20 $\rightarrow 13.20\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_kids`: rel_area 0.15 $\rightarrow 9.90\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_guest_upper`: rel_area 0.14 $\rightarrow 9.24\text{ m}^2$ (**FAIL**: $< 9.50\text{ m}^2$, deficit $0.26\text{ m}^2$).
    - `study`: rel_area 0.08 $\rightarrow 5.28\text{ m}^2$.
- **Verdict**: **`does_not_fit`** (Fails 2 bedrooms and car porch; fixable by merging study into upper guest bedroom to yield a compliant 3BHK+Puja+Store).

---

### 4.9 Template `t_30x50_g2_independent_floors`
- **Bucket & Area**: 30×50 ft | Plot Area: 139.35 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **65.99 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 139.35 m² | Premium FSI 1.5 = 209.03 m² | Max TDR FSI 2.0 = 278.71 m².
- **Template Built Area**: 3 Floors × 65.99 m² = **197.96 m²** (FSI 1.42).
  - *FSI Check:* Exceeds Base FSI (139.35 m²), but **fits within Premium FSI 1.50 (209.03 m²)**.
- **Room Dimension Audit**:
  - Floor 0 (Ground 1BHK + Parking):
    - `covered_parking_g`: rel_area 0.32 $\rightarrow \mathbf{21.12\text{ m}^2}$ (PASS: $\ge 12.50\text{ m}^2$; fits 1 car + 2 scooters).
    - `living_g`: rel_area 0.22 $\rightarrow 14.52\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen_g`: rel_area 0.12 $\rightarrow 7.92\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_g`: rel_area 0.16 $\rightarrow 10.56\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `toilet_g`: rel_area 0.06 $\rightarrow 3.96\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
  - Floors 1 and 2 (Independent 2BHK per floor):
    - `living_1` / `living_2`: rel_area 0.24 $\rightarrow 15.84\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen_1` / `kitchen_2`: rel_area 0.12 $\rightarrow 7.92\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_1a` / `bedroom_2a`: rel_area 0.18 $\rightarrow 11.88\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_1b` / `bedroom_2b`: rel_area 0.14 $\rightarrow \mathbf{9.24\text{ m}^2}$ (**Borderline FAIL**: $0.26\text{ m}^2$ deficit).
    - `toilet_1` / `toilet_2`: rel_area 0.06 $\rightarrow 3.96\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
- **Stair & Parking**: External staircase located in front/side zone. Ground covered parking is fully compliant at $21.12\text{ m}^2$.
- **Verdict**: **`fits_with_premium_fsi`** *(Requires Premium FSI 1.42 and a minor 0.01 rel_area shift from dining to bedroom-b on upper floors).*

---

### 4.10 Template `t_40x60_g1_4bhk_luxury`
- **Bucket & Area**: 40×60 ft | Plot Area: 222.97 m² (12.192 m × 18.288 m)
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m.
- **Buildable Envelope**: $9.192\text{ m}\times 13.788\text{ m} = \mathbf{126.74\text{ m}^2}$ (Coverage: 56.84%; or 122.63 m² at 55% cap).
- **Floor Area Allowed**: Base FSI 1.0 = 222.97 m² | Premium FSI 1.5 = 334.45 m².
- **Template Built Area**: 2 Floors × 126.74 m² = **253.48 m²** (FSI 1.14).
  - *FSI Check:* Exceeds Base FSI (222.97 m²) by $30.51\text{ m}^2$. **Fits comfortably within Premium FSI 1.50 (334.45 m²)**.
- **Room Dimension Audit**:
  - Floor 0:
    - `two_car_garage`: rel_area 0.16 $\rightarrow \mathbf{20.28\text{ m}^2}$ (PASS: $\ge 12.50\text{ m}^2$; fits 1 large car + 1 compact).
    - `formal_living`: rel_area 0.22 $\rightarrow 27.88\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `family_dining`: rel_area 0.14 $\rightarrow 17.74\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen_wet_dry`: rel_area 0.14 $\rightarrow 17.74\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_elder`: rel_area 0.14 $\rightarrow 17.74\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `toilet_elder`: rel_area 0.04 $\rightarrow 5.07\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
    - `powder_room_g`: rel_area 0.02 $\rightarrow 2.53\text{ m}^2$ (PASS: $\ge 1.10\text{ m}^2$ independent WC norm).
  - Floor 1:
    - `upper_family_lounge`: rel_area 0.18 $\rightarrow 22.81\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_master`: rel_area 0.22 $\rightarrow 27.88\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_kids_1`: rel_area 0.16 $\rightarrow 20.28\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_kids_2`: rel_area 0.14 $\rightarrow 17.74\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `toilet_master`: rel_area 0.06 $\rightarrow 7.60\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
- **Stair & Parking**: Internal monumental stair fits in $12.67\text{ m}^2$ core. Parking is fully enclosed in $20.28\text{ m}^2$ garage.
- **Verdict**: **`fits_with_premium_fsi`** (Flawless compliance; all spaces generous).

---

### 4.11 Template `t_40x60_g1_courtyard_vaastu`
- **Bucket & Area**: 40×60 ft | Plot Area: 222.97 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **126.74 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 222.97 m² | Premium FSI 1.5 = 334.45 m².
- **Template Built Area**: 2 Floors × 126.74 m² = **253.48 m²** (FSI 1.14).
  - *FSI Check:* Exceeds Base FSI (222.97 m²); **fits within Premium FSI 1.50 (334.45 m²)**.
  - *Courtyard Exemption:* Central courtyard void ($12.67\text{ m}^2$ per floor) is open to sky and non-chargeable to FSI under DCPR Reg. 31(1). Net chargeable floor area is $228.14\text{ m}^2$, nearly fitting Base FSI.
- **Room Dimension Audit**:
  - Floor 0:
    - `car_porch`: rel_area 0.12 $\rightarrow \mathbf{15.21\text{ m}^2}$ (PASS: $\ge 12.50\text{ m}^2$).
    - `living_ne`: rel_area 0.18 $\rightarrow 22.81\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `central_courtyard`: rel_area 0.10 $\rightarrow 12.67\text{ m}^2$ (Open light well; compliant).
    - `dining`: rel_area 0.11 $\rightarrow 13.94\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `kitchen_se`: rel_area 0.11 $\rightarrow 13.94\text{ m}^2$ (PASS $\ge 5.50\text{ m}^2$).
    - `bedroom_sw`: rel_area 0.11 $\rightarrow 13.94\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
  - Floor 1:
    - `bedroom_master_sw`: rel_area 0.21 $\rightarrow 26.62\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_2`: rel_area 0.17 $\rightarrow 21.55\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `bedroom_3`: rel_area 0.15 $\rightarrow 19.01\text{ m}^2$ (PASS $\ge 9.50\text{ m}^2$).
    - `toilet_master`: rel_area 0.06 $\rightarrow 7.60\text{ m}^2$ (PASS $\ge 2.60\text{ m}^2$).
- **Stair & Parking**: All elements pass with high margins.
- **Verdict**: **`fits_with_premium_fsi`** (100% compliant).

---

### 4.12 Template `t_40x60_g2_5bhk_multigen_lift`
- **Bucket & Area**: 40×60 ft | Plot Area: 222.97 m²
- **Setbacks Applied**: Row 2: Front 3.0 m, Rear 1.5 m, Sides 2 × 1.5 m. Footprint = **126.74 m²**.
- **Floor Area Allowed**: Base FSI 1.0 = 222.97 m² | Premium FSI 1.5 = 334.45 m² | Max TDR FSI 2.0 = 445.93 m².
- **Template Built Area & FSI Audit**:
  - Gross Envelope Built Area = 3 Floors × 126.74 m² = **380.22 m²** (Gross FSI 1.71).
  - *Crucial FSI Deduction:* On Floor 2, `open_terrace_garden` occupies 0.35 rel_area ($\mathbf{44.36\text{ m}^2}$). Under DCPR 2034 Reg. 31(1), open terraces are entirely free of FSI.
  - Net chargeable covered area on Floor 2: $(0.24 + 0.22 + 0.06 + 0.13\text{ core})\times 126.74\text{ m}^2 \approx \mathbf{82.38\text{ m}^2}$.
  - Net chargeable FSI = $126.74 + 126.74 + 82.38 = \mathbf{335.86\text{ m}^2}$ (Net FSI = **1.506**).
  - Permissible area with Base (1.0) + Premium FSI (0.50) is $334.45\text{ m}^2$. The remaining $1.41\text{ m}^2$ (or the full gross area if terrace is covered with pergola) is covered by standard suburban TDR (up to 0.50 allowed on 9m road, cap 2.00 FSI = 445.93 m²).
- **Room Dimension Audit**:
  - Floor 0: `car_porch` $20.28\text{ m}^2$ (PASS), `living` $27.88\text{ m}^2$ (PASS), `kitchen` $15.21\text{ m}^2$ (PASS), `bedroom_elder` $12.67\text{ m}^2$ (PASS).
  - Floor 1: `bedroom_master` $30.42\text{ m}^2$ (PASS), `bedroom_kids_1` $22.81\text{ m}^2$ (PASS), `bedroom_kids_2` $20.28\text{ m}^2$ (PASS).
  - Floor 2: `guest_suite` $30.42\text{ m}^2$ (PASS), `multipurpose_lounge` $27.88\text{ m}^2$ (PASS), `open_terrace_garden` $44.36\text{ m}^2$ (PASS).
- **Stair, Lift & Parking**: Combined vertical core ($12.67\text{ m}^2\text{ to }16.48\text{ m}^2$) accommodates dog-leg stair plus 4-passenger residential hydraulic/traction lift. Car porch ($20.28\text{ m}^2$) fits car + two-wheelers.
- **Verdict**: **`fits_with_premium_fsi`** (Fits with Premium FSI + negligible TDR / open terrace exemption).

---

## 5. Short List of Templates to Fix or Drop

### 5.1 Templates to DROP (3 Templates)
These templates cannot fit their assigned plot bucket under standard Mumbai building regulations even in principle:

1. **`t_20x30_g_1bhk_compact` (DROP)**
   - *Why:* Standard setbacks (Row 1) leave a buildable envelope of only $23.12\text{ m}^2$. The legal minimum carpet area for a 1BHK unit (Living 9.5 m² + Bedroom 9.5 m² + Kitchen 5.5 m² + Toilet 2.6 m²) is $27.10\text{ m}^2$—which exceeds the entire buildable footprint by $3.98\text{ m}^2$ before walls or corridors. Every room fails statutory minimums.
   - *Exception Note:* Only feasible if the Mumbai code pack is updated to include gaothan / congested area zero-setback row-housing rules under DCPR Reg. 41(5).
2. **`t_20x30_g1_2bhk_rental` (DROP)**
   - *Why:* Stacks two non-compliant $23.12\text{ m}^2$ units; 100% of rooms (8 of 8) fail statutory minimums. Additionally, an external staircase cannot fit in the $2.0\text{ m}$ front setback without illegal encroachment into the street line.
   - *Replacement:* Replace with a single-family G+1 duplex home (e.g. Ground floor living/kitchen, First floor bedroom/bath).
3. **`t_30x40_g_2bhk_bungalow` (DROP)**
   - *Why:* Squeezing a 2BHK, 2 bathrooms, dining, puja, and car porch onto a single $47.26\text{ m}^2$ footprint causes catastrophic room shrinkage. Both bedrooms (6.62 m² and 4.73 m²), kitchen (4.73 m²), both toilets (2.36 m² and 1.42 m²), and car porch (5.67 m²) fail statutory minimums. Independent house plots in Mumbai are too valuable to build single-story bungalows that violate room standards.

---

### 5.2 Templates to FIX (6 Templates)
These templates possess sound architectural typologies but require structural rebalancing of the room program or proportions before feeding into the layout solver:

1. **`t_30x40_g1_3bhk_elder` $\rightarrow$ Redesign as 2BHK Elder + Study**
   - *Issue:* Over-subdivided; elder bed (7.56 m²), kids bed (8.51 m²), lounge (8.51 m²), and car porch (6.62 m²) fail. Staircase chokes all circulation.
   - *Fix:* Drop upper kids bedroom. Allocate rel_area 0.22 to elder bedroom ($10.40\text{ m}^2$), 0.28 to upper master ($13.23\text{ m}^2$), and 0.20 to study/guest room ($9.45\text{ m}^2$). Re-designate car porch as an open-to-sky front parking bay.
2. **`t_30x40_g1_3bhk_duplex_open` $\rightarrow$ Redesign as 2BHK Duplex**
   - *Issue:* Guest bedroom (8.51 m²) and Bedroom-2 (8.51 m²) fall $0.99\text{ m}^2$ short of $9.50\text{ m}^2$. Car porch is only $6.62\text{ m}^2$.
   - *Fix:* Remove the ground-floor guest bedroom. Expand the great room and kitchen on Ground. On Floor 1, create 2 generous suites: Master ($16.0\text{ m}^2$) and Bedroom-2 ($12.5\text{ m}^2$).
3. **`t_30x40_g2_4bhk_stilt` $\rightarrow$ Redesign as 3BHK Stilt**
   - *Issue:* Requires Premium FSI 1.27. The 4BHK program causes elder bed (8.51 m²), guest bed (8.51 m²), and kids bed (9.45 m²) to fail.
   - *Fix:* Retain the excellent ground stilt parking ($23.63\text{ m}^2$). On Floor 2, drop `bedroom_guest_2` and provide two spacious bedrooms ($14\text{ m}^2\text{ to }16\text{ m}^2$ each).
4. **`t_30x50_g1_3bhk_courtyard` $\rightarrow$ Minor rel_area tuning**
   - *Issue:* Elder bedroom is $9.24\text{ m}^2$ ($0.26\text{ m}^2$ below $9.50\text{ m}^2$).
   - *Fix:* Increase `bedroom_elder` rel_area from 0.14 to 0.15 ($9.90\text{ m}^2$) by deducting 0.01 from living or dining. Clarify car porch as an open carport recessed into the front wall.
5. **`t_30x50_g1_4bhk_joint_family` $\rightarrow$ Redesign as 3BHK + Study/Puja**
   - *Issue:* Elder bed ($8.58\text{ m}^2$) and upper guest bed ($9.24\text{ m}^2$) fail. Car porch is $6.60\text{ m}^2$.
   - *Fix:* Merge upper study into `bedroom_guest_upper` to make it $14.52\text{ m}^2$. Increase ground elder bedroom to rel_area 0.16 ($10.56\text{ m}^2$).
6. **`t_30x50_g2_independent_floors` $\rightarrow$ Minor rel_area tuning**
   - *Issue:* Upper secondary bedrooms (`bedroom_1b` and `bedroom_2b`) are $9.24\text{ m}^2$ ($0.26\text{ m}^2$ short).
   - *Fix:* Increase rel_area from 0.14 to 0.15 ($9.90\text{ m}^2$) by deducting 0.01 from dining. Ground parking ($21.12\text{ m}^2$) and external stair work well.

---

### 5.3 Templates Ready for Solver (3 Templates)
These templates are fully viable as written and should be passed directly to the solver engineer:
- **`t_40x60_g1_4bhk_luxury`** (`fits_with_premium_fsi`)
- **`t_40x60_g1_courtyard_vaastu`** (`fits_with_premium_fsi`)
- **`t_40x60_g2_5bhk_multigen_lift`** (`fits_with_premium_fsi`)

---

## 6. Key Advice for Layout Solver Architecture

1. **The "Car Porch Deficit" on 30 ft Frontage Plots:**
   - In 30×40 and 30×50 templates, the front setback is $3.0\text{ m}$. A standard car stall is $5.0\text{ m}$ long. An enclosed garage of $2.5\text{ m}\times 5.0\text{ m}$ requires $12.5\text{ m}^2$ inside the buildable footprint.
   - When a template assigns rel_area 0.10–0.14 ($5.6\text{ m}^2\text{ to }6.6\text{ m}^2$) to a `car_porch`, the solver must treat this not as an enclosed garage, but as a **recessed portico**: a covered alcove recessed $2.5\text{ m}$ into the building footprint that combines with $2.5\text{ m}$ of the front setback to provide the full $5.0\text{ m}$ car parking bay.
2. **Staircase Footprint Reservation:**
   - On 30×40 plots ($47.26\text{ m}^2$ footprint), a statutory dog-leg stair consumes $5.50\text{ m}^2$ ($\approx 12\%$ of the floor). If rooms consume 86–89%, only 11–14% remains. The solver must reserve the vertical stair core *first* before assigning room dimensions.
3. **Open Spaces Non-FSI Accounting:**
   - The solver must exclude central courtyard light wells (`t_30x50_g1_3bhk_courtyard`, `t_40x60_g1_courtyard_vaastu`), ground stilt parking bays (`t_30x40_g2_4bhk_stilt`), and open terrace gardens (`t_40x60_g2_5bhk_multigen_lift`) from chargeable FSI calculations per DCPR 2034 Regulation 31(1).
