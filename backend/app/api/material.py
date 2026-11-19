"""
Material Brain Task Model API - Section 5 & 8 (Model 6).
Allocates materials per room from the authoritative 25-item database with explicit Benefits & Loss.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import json
import os

router = APIRouter(prefix="/api/v1/material", tags=["Material Brain"])

MATERIALS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "materials.json")


class MaterialPredictInput(BaseModel):
    house_id: str
    has_elder: bool = True
    has_toddler: bool = True
    has_pets: bool = True
    primary_style: str = "japanese"


@router.get("/materials", response_model=Dict[str, Any])
def list_all_materials():
    """Lists all 25 materials in database with benefits and loss."""
    with open(MATERIALS_PATH, "r", encoding="utf-8") as f:
        materials = json.load(f)
    return {"success": True, "count": len(materials), "materials": materials}


@router.post("/predict", response_model=Dict[str, Any])
def predict_materials(input_data: MaterialPredictInput):
    with open(MATERIALS_PATH, "r", encoding="utf-8") as f:
        materials = json.load(f)
    mat_map = {m["id"]: m for m in materials}

    # Material assignments tailored to persona and style
    # If pet is present: Epoxy or Vitrified in living/dining; avoid marble in kitchen (stains) and avoid teak where pet walks.
    allocations = {
        "living": mat_map.get("epoxy_flooring" if input_data.has_pets else "vitrified_tiles"),
        "bedroom_elder": mat_map.get("cork_flooring" if input_data.has_elder else "engineered_wood"),
        "bedroom_master": mat_map.get("teak_wood" if input_data.primary_style == "japanese" else "engineered_wood"),
        "kitchen": mat_map.get("granite"),
        "toilets": mat_map.get("ceramic_tiles"),
        "study": mat_map.get("acoustic_wood_slats"),
        "balcony": mat_map.get("clay_terracotta_tiles")
    }

    return {
        "success": True,
        "house_id": input_data.house_id,
        "room_allocations": allocations,
        "reasons": {
            "living": "Epoxy Flooring allocated because pets reside in home; impervious to scratches and seamless to sanitize." if input_data.has_pets else "Vitrified Tiles allocated for budget durability.",
            "kitchen": "Granite selected over marble to prevent turmeric staining and provide heat resistance for Indian cooking.",
            "bedroom_elder": "Cork / resilient flooring allocated to provide impact cushioning for senior joints and anti-slip safety." if input_data.has_elder else "Engineered Wood allocated for warm ambiance."
        }
    }


@router.get("/health")
def health_check():
    return {"status": "healthy", "model": "material_brain", "version": "1.0"}
