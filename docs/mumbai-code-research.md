# Mumbai Building Code Research & Citation Report
**Document:** `docs/mumbai-code-research.md`  
**Target Authority:** Municipal Corporation of Greater Mumbai (MCGM / BMC)  
**Applicable Codes:** DCPR 2034, NBC 2016, IS 456:2000, IS 875:2015, IS 1893:2016, IS 1742:1992  
**Scope:** Small residential plots (20×30 ft to 40×60 ft, ~55 to 223 m²), Low-rise (G to G+2, height $\le 10\text{ m}$).

---

## 1. Statutory Context & Legal Hierarchy

Building permissions in Greater Mumbai are strictly governed by the **Development Control and Promotion Regulations for Greater Mumbai, 2034 (DCPR 2034)**, sanctioned under Section 31(1) of the Maharashtra Regional and Town Planning Act, 1966 (MRTP Act), administered digitally via the **MCGM AutoDCR / BPAMS (Building Plan Approval Management System)**.

Where local regulations are silent, the **National Building Code of India (NBC 2016)** and relevant Bureau of Indian Standards (**BIS Codes**) apply.

---

## 2. Findings & Clause Citations

### A. Floor Space Index (FSI) & Road Width Dependencies
* **Suburban Base Zonal FSI:** In Suburban and Extended Suburban Mumbai (where virtually all independent plotted self-builds occur), the base Zonal FSI is **1.00** (**DCPR 2034, Regulation 30(1), Table 12**).
* **Road Width Constraint:**
  * For road width $< 9.0\text{ m}$: Only **Base FSI (1.00)** is permissible. No additional premium FSI or Transferable Development Rights (TDR) are permitted (**Reg. 30(1)**).
  * For road width $9.0\text{ m} \le W < 12.0\text{ m}$: Base FSI $1.00$ + Premium FSI $0.50$ + TDR $0.50 = \text{Max FSI } 2.00$ (**Reg. 30(2) & Reg. 32**).
  * For road width $12.0\text{ m} \le W < 18.0\text{ m}$: Base FSI $1.00$ + Premium FSI $0.50$ + TDR $0.70 = \text{Max FSI } 2.20$.
* **Premium Payment:** Premium FSI is granted upon payment of premium at 50% of the Annual Statement of Rates (Ready Reckoner Rate - RRR) for open land (**Reg. 30(2)**).

### B. Marginal Open Spaces (Setbacks)
* Governed by **DCPR 2034, Regulation 41 & Table 15** for residential buildings with height up to $10\text{ m}$ (G+2):
  * **Plots up to $100\text{ m}^2$ (e.g. 20×30 ft = 55.7 m²):** Front setback $2.0\text{ m}$; Side setback $1.0\text{ m}$ (or zero-setback dead wall on one side subject to approval); Rear setback $1.5\text{ m}$.
  * **Plots between $100\text{ m}^2$ and $250\text{ m}^2$ (e.g. 30×40 ft = 111.5 m², 30×50 ft = 139.4 m², 40×60 ft = 223 m²):**
    * Front setback: $3.0\text{ m}$ from street line.
    * Side setback: $1.5\text{ m}$.
    * Rear setback: $1.5\text{ m}$.
  * **Plots $> 250\text{ m}^2$ to $500\text{ m}^2$:** Front $4.5\text{ m}$; Side $2.25\text{ m}$; Rear $2.25\text{ m}$.

### C. Habitable Spaces & Interior Room Minimums
* **Habitable Rooms (Living / Bedroom):** Minimum carpet area **$9.5\text{ m}^2$** (~102.25 sqft) with minimum clear width **$2.4\text{ m}$** (~7'10'') (**DCPR 2034, Reg. 37(1)(a)-(b)**; **NBC 2016 Part 3 Clause 4.5**). Clear ceiling height must be $\ge 2.75\text{ m}$.
* **Kitchen:** Minimum carpet area **$5.5\text{ m}^2$** (~59.2 sqft) with minimum width **$1.8\text{ m}$** (**Reg. 37(2)**). Where a separate dining area is provided, kitchen area may be reduced to $4.5\text{ m}^2$. Clear height $\ge 2.75\text{ m}$.
* **Bathrooms & Toilets:** Combined bath and WC minimum area **$2.6\text{ m}^2$** with minimum width $1.2\text{ m}$ (**Reg. 37(3)**). Independent WC: minimum $1.1\text{ m}^2$ ($1.1\text{m} \times 0.9\text{m}$). Independent Bath: minimum $1.5\text{ m}^2$ ($1.5\text{m} \times 1.2\text{m}$). Clear height $\ge 2.2\text{ m}$.
* **Natural Light & Air:** Aggregate unobstructed window area directly opening to exterior open space must not be less than **$10\%$ (1/10th)** of floor area (**DCPR 2034, Reg. 37(19)**).

### D. Vertical Circulation (Staircases) & Doorways
* **Residential Staircases:** Clear width $\ge 0.90\text{ m}$ for low-rise single-family dwellings (**DCPR 2034, Reg. 37(18)(b)**). Maximum riser height **$175\text{ mm}$**, minimum tread depth **$250\text{ mm}$** (**NBC 2016 Part 4 Table 7**). Clear headroom $\ge 2.20\text{ m}$.
* **Door Openings:** Main entrance clear width $\ge 1000\text{ mm}$; Habitable bedrooms $\ge 900\text{ mm}$; Bathrooms/WC $\ge 750\text{ mm}$ (**NBC 2016 Part 3 Clause 4.12**). Clear height $\ge 2000\text{ mm}$.

### E. Structural & Environmental Engineering
* **IS 456:2000 (RCC Design):** Minimum column dimension $230\text{ mm}$ ($9''$) for earthquake-resistant ductile detailing (**IS 13920:2016 Clause 7.1.1**). Basic span-to-effective-depth ratio for simply supported beams is 20; ratio of 16 provides conservative deflection control for residential layouts (**IS 456 Clause 23.2.1**).
* **IS 1893 (Part 1):2016 (Seismic Resistance):** Mumbai is categorized under **Zone III** (Moderate Seismic Intensity); Zone Factor $Z = 0.16$ (**Table 3 & Annex E**).
* **IS 875 (Part 3):2015 (Wind Loading):** Basic design wind speed $V_b = 44\text{ m/s}$ (~158 km/h) (**Appendix A**).
* **IS 1742:1992 (Drainage):** Self-cleansing gradients for 100mm underground sanitary sewer pipes: $1:60$ to $1:100$ (**Clause 4.3**).
* **Environmental Defaults:** Normal annual rainfall in Mumbai is **$2,422\text{ mm}$** (IMD long-term station data). Presumptive safe bearing capacity for shallow foundations ranges from $120\text{ to }150\text{ kN/m}^2$ in weathered murrum/basalt, requiring site-specific borehole tests.

---

## 3. Discrepancies in the Old `mumbai.json`

The old `backend/app/data/packs/mumbai.json` contained severe conceptual and numerical errors:

| Parameter | Old Value in `mumbai.json` | Accurate Mumbai Standard | Discrepancy & Practical Impact |
| :--- | :--- | :--- | :--- |
| **FSI Limit** | Fixed at `1.50` | `1.00` base on road $< 9\text{m}$; up to `2.00` on road $\ge 9\text{m}$ | A flat 1.5 FSI ignores road width constraints. On narrow roads ($< 9\text{m}$), building 1.5 FSI is illegal in Mumbai suburbs. |
| **Rear Setback** | Fixed at `3.0 m` | `1.5 m` for height $\le 10\text{m}$ on plots $\le 250\text{ m}^2$ | A 3.0m rear setback on a 40 ft (12.2m) plot with a 3.0m front setback leaves only 6.2m buildable depth! DCPR Table 15 permits 1.5m rear setbacks for low-rise. |
| **Toilet Min Area** | `35.0 sqft` (~3.25 m²) | `2.6 m²` (~28.0 sqft) | Over-specified minimum by 25%, penalizing compact G+1 layouts. |
| **Rainfall** | `2200.0 mm` | `2422.0 mm` (IMD) | Underestimated Mumbai monsoon intensity by ~10%. |
| **Approval Checklist** | Named "BBMP" checklist | MCGM AutoDCR / BPAMS | BBMP is the municipal corporation of Bangalore, not Mumbai. |
| **Format** | Bare flat numbers | Object with units, sources, confidence | Old file had no citations, confidence tiers, or road width/plot size variations. |

---

## 4. Architect Review Priority List (Ordered by Impact)

The following items must be verified and signed off by an MCGM-licensed Architect and Structural Engineer prior to production deployment:

1. **[HIGH IMPACT] FSI & TDR Viability on Specific Road Widths:**  
   Confirm whether client plots on municipal gaothan roads or narrow suburban lanes ($< 9\text{m}$) can purchase additional FSI or if they are strictly capped at 1.00 Zonal FSI.
2. **[HIGH IMPACT] Marginal Open Space Concessions for Small Plots ($< 100\text{ m}^2$):**  
   Confirm the exact ward-level policy for building up to the side/rear boundary wall (dead wall) on narrow 20×30 ft plots under DCPR 2034 Reg. 41(5) and Reg. 6(b).
3. **[HIGH IMPACT] Fungible Compensatory Area (FCA) Application:**  
   Confirm whether 35% residential FCA (DCPR Reg. 31(3)) can be availed on small individual plots without triggering disproportionate scrutiny fees.
4. **[MEDIUM IMPACT] Car Parking Exemption for Plots $< 250\text{ m}^2$:**  
   Confirm whether open car parking spaces inside the front marginal setback (porch/driveway) comply with ward fire clearance guidelines for single-family residences.
5. **[MEDIUM IMPACT] Rainwater Harvesting Mandate:**  
   Confirm plot area thresholds where MCGM mandates an underground rainwater collection tank and recharge borewell for issuing the Completion Certificate.
6. **[LOW IMPACT] Balcony & Flower Bed Projections:**  
   Confirm permissible cantilever projections (up to 1.2m) into marginal open spaces under DCPR Reg. 37(23) for low-rise residential houses.
