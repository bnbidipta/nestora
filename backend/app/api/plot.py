"""
Plot & Code Pack API - Section 5 & 8 (Model 1).
Returns Mumbai jurisdiction building pack: Setbacks, FSI 1.5, soil properties.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any
import json
import os

router = APIRouter(prefix="/api/v1/plot", tags=["Plot Model"])

PACK_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "packs", "mumbai.json")


class PlotPredictInput(BaseModel):
    house_id: str
    lat: float = Field(default=19.07, description="Latitude (Mumbai ~19.07)")
    long: float = Field(default=72.87, description="Longitude (Mumbai ~72.87)")
    plot_width_ft: float = Field(default=30.0)
    plot_depth_ft: float = Field(default=40.0)
    orientation: str = Field(default="East")


@router.post("/predict", response_model=Dict[str, Any])
def predict_plot_code(input_data: PlotPredictInput):
    with open(PACK_PATH, "r", encoding="utf-8") as f:
        mumbai_pack = json.load(f)

    plot_area_sqft = input_data.plot_width_ft * input_data.plot_depth_ft
    fsi_max_builtup = plot_area_sqft * mumbai_pack["dcr"]["fsi_limit"]
    
    # Calculate buildable footprint after front 3m, side 1.5m each, rear 3m
    # 3m = ~9.84 ft, 1.5m = ~4.92 ft
    net_width_ft = max(10.0, input_data.plot_width_ft - (2 * 4.92))
    net_depth_ft = max(10.0, input_data.plot_depth_ft - (9.84 + 9.84))
    buildable_footprint_sqft = round(net_width_ft * net_depth_ft, 1)

    return {
        "success": True,
        "house_id": input_data.house_id,
        "jurisdiction": "Mumbai Municipal Corporation (MCGM DCR 2034)",
        "plot_area_sqft": plot_area_sqft,
        "fsi_allowed": mumbai_pack["dcr"]["fsi_limit"],
        "max_builtup_sqft": fsi_max_builtup,
        "setbacks_m": mumbai_pack["dcr"]["setbacks"],
        "net_buildable_footprint_sqft": buildable_footprint_sqft,
        "soil_type": mumbai_pack["environmental_physics"]["soil_default"],
        "soil_bearing_capacity_kn_m2": mumbai_pack["environmental_physics"]["soil_bearing_capacity_kn_m2"],
        "basic_wind_speed_ms": mumbai_pack["environmental_physics"]["basic_wind_speed_ms"],
        "seismic_zone": mumbai_pack["environmental_physics"]["seismic_zone"],
        "reason": "Mumbai MCGM DCR 2034 requires 3.0m front, 1.5m side, 3.0m rear setbacks on 30x40 plots with FSI cap 1.5."
    }


@router.get("/health")
def health_check():
    return {"status": "healthy", "model": "plot_mumbai_pack", "version": "1.0"}
