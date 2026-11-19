# NESTORA - Your Home, Designed Around You. From Plot to Keys.

**Version:** 3.1 - Phase 1 Mumbai Pilot  
**Pilot Target:** 30x40 G+1 + 3BHK 1500 sqft apartment shell in Mumbai.

---

## Architecture Overview
- **House Twin JSON**: Single Source of Truth for all 14 task models and frontend modes.
- **SLM Orchestrator Wrapper**: Translates user sentence to Constraint Graph JSON. SLM never draws structure and never outputs dimensions directly.
- **Pure Python Judge**: 5 deterministic checks (Area, Law, Structure, MEP, Ergonomics) enforcing stage gates.
- **14 Deterministic Model APIs**: Real calculations based on IS 456 (Concrete), NBC 2016, and Mumbai Municipal Corporation DCR.
- **Unified Frontend**: Next.js + Three.js + Tailwind CSS with real-time toggling across Blueprint (2D SVG), Structure (3D Three.js), MEP, Paint, Decor, and BOQ modes from the same House Twin.

---

## How to Run

### Backend (FastAPI)
```bash
# In project root:
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### Frontend (Next.js)
```bash
# In project root:
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Automated Tests
```bash
# Run Judge unit tests (10 good pass, 10 bad fail):
pytest backend/tests/test_judge.py -v

# Run SLM invariant tests:
pytest backend/tests/test_slm.py -v

# Run API test suite:
pytest backend/tests/test_api.py -v

# Run 20 Test Briefs Benchmark & Generate scorecard.md:
python -m backend.app.services.orchestrator --benchmark
```
