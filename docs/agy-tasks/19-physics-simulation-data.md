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
