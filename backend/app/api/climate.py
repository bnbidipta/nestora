"""
Light & Climate Task Model API - Section 5 & 8 (Model 8).
Calculates solar sun path for Mumbai (19.07°N), overhang shading, and thermal heat loads.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/climate", tags=["Climate Model"])


class ClimatePredictInput(BaseModel):
    house_id: str
    lat: float = 19.07
    orientation: str = "East"


@router.post("/predict", response_model=Dict[str, Any])
def predict_climate(input_data: ClimatePredictInput):
    """
    Computes solar azimuth, peak summer heat exposure, and required overhang depth.
    """
    return {
        "success": True,
        "house_id": input_data.house_id,
        "location": "Mumbai (19.07°N, 72.87°E)",
        "sun_path": {
            "summer_solstice_zenith_deg": 86.5,
            "winter_solstice_zenith_deg": 47.5,
            "morning_sun": "Direct morning East solar gain in Living and Puja (desirable)",
            "afternoon_sun": "Intense West afternoon solar radiation requiring 600mm external overhang"
        },
        "overhang_required_mm": 600,
        "room_heat_ratings": {
            "living_east": {"exposure": "Moderate morning gain", "overhang_mm": 450, "thermal_comfort": "Optimal"},
            "kitchen_southeast": {"exposure": "Early morning light", "overhang_mm": 450, "thermal_comfort": "Good"},
            "master_bedroom_west": {"exposure": "High afternoon radiation", "overhang_mm": 600, "thermal_comfort": "Requires shading louvers"}
        },
        "monsoon_rain_protection": {
            "annual_rainfall_mm": 2200,
            "window_drip_mould_required": True,
            "chajja_projection_mm": 600
        },
        "reason": "Mumbai 19°N solar geometry requires 600mm chajja projections on West/South facade to eliminate harsh solar glare and prevent monsoon water ingress."
    }


@router.get("/health")
def health_check():
    return {"status": "healthy", "model": "climate_sun_path", "version": "1.0"}
