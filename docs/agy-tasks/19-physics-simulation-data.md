# agy task 19: Physics and simulation data for climate, light, sound and structure

Follow `docs/agy-tasks/README.md`. This task is research only.

**Write only to:**
- `docs/research/data/physics-simulation.md`
- `data/weather/` (gitignored; for downloads)

## Goal
Nestora's engines use first-principles physics: sun position, heat gain through walls, room echo time (Sabine RT60), sound insulation (STC) and column sizing. They need real input data, and validated open tools to calibrate and check them against.

## Search and download
1. **Weather**
   - EPW/TMY weather files for Mumbai and other Indian cities. Sources: climate.onebuilding.org (ISHRAE-based), EnergyPlus weather, NREL NSRDB India.
   - Download Mumbai (Santacruz) into `data/weather/` and quote its licence.
   - ERA5 and NASA POWER (open) for weather at any plot worldwide.
2. **Open simulation engines.** For each, give its licence, whether it can be used commercially inside a server, and a minimal example call.
   - Energy: EnergyPlus, OpenStudio, Ladybug Tools / honeybee
   - Daylight: Radiance, DAYSIM
   - CFD and ventilation: OpenFOAM, CONTAM
   - Acoustics: pyroomacoustics, I-Simpa
   - Structure: OpenSees, PyNite
   - Thermal comfort: pythermalcomfort
3. **Validation data**
   - Measured indoor temperatures in Indian homes, such as the IMAC study and ECBC-R / Eco Niwas Samhita.
   - Open sound absorption coefficient tables.
   - STC/Rw values for Indian wall types: brick, AAC and block.
   - Mumbai noise maps: MPCB/CPCB monitoring data.
   - Mumbai flood-prone wards (MCGM/BMC).
   - Soil and safe bearing capacity (SBC) maps.
   - Seismic zone data (IS 1893) and wind zone data (IS 875 Part 3).
4. **Benchmarks:** ASHRAE 140 / BESTEST cases for checking our solar and heat calculations.

## Output
In `physics-simulation.md`:
- A table of every source and tool, with its licence quote, which Nestora engine it feeds, and the effort to use it.
- A recommended plan: which engine to calibrate against which data.

Quote licences only from pages you actually opened; write "unconfirmed" otherwise. Append a done note to this file.

---

## Done + Caveats (2026-11-24)

- **Completed**:
  - Downloaded Mumbai Santacruz (WMO 430030) weather datasets (both TMYx 2007–2021 and ISHRAE 2014) into `data/weather/` along with associated `.ddy`, `.stat`, `.rain`, and `.wea` files.
  - Audited 12 open-source simulation engines across energy, daylight, CFD, acoustics, structure, and thermal comfort, quoting licenses directly from primary repository and documentation pages opened and verified during research.
  - Provided minimal functional example calls and evaluated server/SaaS permissibility for each engine.
  - Documented empirical validation data and Indian statutory standards (IMAC adaptive thermal comfort, Eco-Niwas Samhita RETV equations, ISO 354 absorption coefficients, NBC 2016 Part 8 wall $R_w$/STC ratings, CPCB/MPCB Mumbai ambient noise monitoring data, BMC Disaster Management flood-prone wards, Mumbai geotechnical SBC strata, IS 1893: 2016 seismic Zone III, IS 875 Part 3: 2015 wind speed $44\text{ m/s}$, and ASHRAE 140 / BESTEST test cases).
  - Authored comprehensive report in `docs/research/data/physics-simulation.md` with master source inventory table, engine-by-engine calibration roadmap, and JSON data definitions.
- **Caveats & Licensing Alerts**:
  - `verified: false`: All empirical formulas, regulatory figures, soil bearing capacities, and acoustic ratings are unverified and must be audited and stamped by a licensed structural engineer and registered architect before construction.
  - **OpenSees Commercial Restriction**: OpenSees contains an explicit non-commercial / internal-use restriction prohibiting incorporation into commercial distribution or SaaS without an agreement with UC Berkeley OTL. **PyNite (MIT)** must be used for production structural analysis.
  - **ISHRAE 2014 Single-Machine Restriction**: The ISHRAE weather dataset license forbids redistribution or multi-machine copying. It cannot be hosted on multi-tenant SaaS servers. The **TMYx (Lawrie & Crawley / OpenBuilding)** weather dataset is the approved production dataset for Mumbai.
  - **Ladybug / Honeybee AGPLv3 Contamination Risk**: Honeybee-core and Ladybug-core are licensed under GNU AGPLv3. Network interaction triggers copyleft provisions; they must never be imported directly into Nestora's proprietary monolith and must be isolated behind an independent CLI microservice boundary if used.
  - **CONTAM Public Domain**: NIST CONTAM is in the US Public Domain (17 U.S.C. § 105), permitting unrestricted backend server execution.

