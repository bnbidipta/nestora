"""
Integration Tests for FastAPI Endpoints (Section 5 & 13).
Validates all routes, Pydantic serialization, and health endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Mumbai 30x40" in data["pilot"]


def test_house_crud_and_generate_flow():
    # 1. Create House
    res = client.post("/api/v1/house", json={})
    assert res.status_code == 200
    house_id = res.json()["house_id"]
    assert house_id.startswith("nest_")

    # 2. Get House
    res = client.get(f"/api/v1/house/{house_id}")
    assert res.status_code == 200
    assert res.json()["data"]["house_id"] == house_id

    # 3. Submit Questionnaire
    q_payload = {
        "user_prompt": "Designing a home for my mother who has knee pain, 2 year old toddler, and Labrador dog.",
        "plot_width_ft": 30.0,
        "plot_depth_ft": 40.0,
        "target_budget_inr": 2000000.0,
        "adults": 3,
        "elders": 1,
        "toddlers": 1,
        "has_pets": True,
        "pet_breed": "Labrador",
        "elder_knee_pain": True,
        "wfh_hours_per_day": 8,
        "cooking_style": "wet_and_dry",
        "vaastu_faith": "vaastu_soft",
        "preferred_styles": ["japanese", "forest"]
    }
    res = client.post(f"/api/v1/house/{house_id}/questionnaire", json=q_payload)
    assert res.status_code == 200
    cg = res.json()["constraint_graph"]
    assert cg["elder_present"] is True
    assert cg["ground_floor_bedroom_required"] is True

    # 4. Swipe cards
    res = client.get("/api/v1/swipe/decks")
    assert res.status_code == 200
    decks = res.json()["decks"]
    assert len(decks["structure"]) == 10

    swipe_payload = {
        "card_id": "s_01",
        "deck": "structure",
        "direction": "right",
        "dwell_ms": 3500
    }
    res = client.post(f"/api/v1/house/{house_id}/swipe", json=swipe_payload)
    assert res.status_code == 200
    assert res.json()["total_swipes"] == 1

    # 5. Generate DAG
    res = client.post(f"/api/v1/house/{house_id}/generate")
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert res.json()["status"] == "ready"

    # 6. Mode Renders
    res = client.get(f"/api/v1/house/{house_id}/modes/blueprint")
    assert res.status_code == 200
    assert "rooms" in res.json()["data"]

    res = client.get(f"/api/v1/house/{house_id}/modes/structure")
    assert res.status_code == 200
    assert "columns" in res.json()["data"]["structure_3d"]

    # 7. Mock Review & Export
    res = client.post(f"/api/v1/house/{house_id}/review")
    assert res.status_code == 200
    assert res.json()["data"]["amount_inr"] == 999

    res = client.post(f"/api/v1/house/{house_id}/export/dwg")
    assert res.status_code == 200
    assert "dxf" in res.json()["data"]["filename"]


def test_all_model_health_endpoints():
    endpoints = [
        "/api/v1/plot/health",
        "/api/v1/layout/health",
        "/api/v1/structure/health",
        "/api/v1/mep/health",
        "/api/v1/color/health",
        "/api/v1/material/health",
        "/api/v1/style/health",
        "/api/v1/climate/health",
        "/api/v1/sound/health",
        "/api/v1/budget/health",
        "/api/v1/land/health",
        "/api/v1/render/health",
        "/api/v1/orchestrator/health"
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200, f"Health check failed on {ep}"
        assert res.json()["status"] == "healthy"
