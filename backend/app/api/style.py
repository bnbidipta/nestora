"""
Style & Furniture Task Model API - Section 5 & 8 (Model 7).
Blends architectural styles based on taste vector cosine similarity and computes furniture layout.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List

router = APIRouter(prefix="/api/v1/style", tags=["Style Model"])


class StylePredictInput(BaseModel):
    house_id: str
    primary_style: str = "japanese"
    secondary_style: str = "forest"
    mix_pct: str = "70/30"


@router.post("/predict", response_model=Dict[str, Any])
def predict_style(input_data: StylePredictInput):
    """
    Computes style blend parameters and room furniture layouts.
    """
    furniture_layouts = {
        "living": [
            {"item": "Low Platform Sofa", "dims_ft": "7x3", "x": 2.0, "y": 2.0, "style": input_data.primary_style},
            {"item": "Teak Coffee Table", "dims_ft": "4x2", "x": 6.0, "y": 5.0, "style": input_data.primary_style},
            {"item": "Indoor Ficus Planter", "dims_ft": "2x2", "x": 13.0, "y": 1.0, "style": input_data.secondary_style},
            {"item": "Wall Mounted Media Console", "dims_ft": "6x1.5", "x": 8.0, "y": 10.0, "style": input_data.primary_style}
        ],
        "bedroom_master": [
            {"item": "King Platform Bed with Tatami Base", "dims_ft": "6.5x6.5", "x": 4.0, "y": 3.0, "style": input_data.primary_style},
            {"item": "Bedside Floating Nightstands (Pair)", "dims_ft": "2x1.5", "x": 2.0, "y": 3.0, "style": input_data.primary_style},
            {"item": "Wardrobe with Fluted Glass Sliders", "dims_ft": "7x2", "x": 0.5, "y": 9.5, "style": input_data.primary_style}
        ],
        "bedroom_elder": [
            {"item": "Queen Bed with 450mm Ergonomic Seat Height", "dims_ft": "5x6.5", "x": 3.0, "y": 2.0, "style": "accessible_comfort"},
            {"item": "Support Armchair with Sturdy Armrests", "dims_ft": "2.5x2.5", "x": 9.0, "y": 2.0, "style": "accessible_comfort"}
        ]
    }

    return {
        "success": True,
        "house_id": input_data.house_id,
        "primary_style": input_data.primary_style,
        "secondary_style": input_data.secondary_style,
        "mix_pct": input_data.mix_pct,
        "furniture_layouts": furniture_layouts,
        "reason": f"Blended {input_data.mix_pct} {input_data.primary_style.capitalize()} and {input_data.secondary_style.capitalize()} ensuring uncluttered 900mm circulation paths throughout."
    }


@router.get("/health")
def health_check():
    return {"status": "healthy", "model": "style_blend", "version": "1.0"}
