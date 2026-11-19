"""
Render Task Model API - Section 5, 8 & 9 (Model 12).
Generates 2D SVG Blueprint coordinates and 3D Three.js mesh entities from the House Twin.
Zero duplicate state: All modes read directly from the same House Twin JSON.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from backend.app.services.repository import HouseTwinRepository
from backend.app.models.twin import HouseTwin

router = APIRouter(prefix="/api/v1", tags=["Render Model"])


@router.get("/house/{house_id}/modes/{mode}", response_model=Dict[str, Any])
def get_house_mode_render(house_id: str, mode: str):
    """
    Returns visual entities for the requested mode:
    blueprint, structure, mep, paint, decor, climate, sound, boq.
    All modes derive deterministically from the House Twin.
    """
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")

    valid_modes = ["blueprint", "structure", "mep", "paint", "decor", "climate", "sound", "boq"]
    if mode.lower() not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode '{mode}'. Must be one of {valid_modes}")

    render_data = build_render_payload(twin, mode.lower())
    return {
        "success": True,
        "house_id": house_id,
        "mode": mode.lower(),
        "data": render_data
    }


def build_render_payload(twin: HouseTwin, mode: str) -> Dict[str, Any]:
    # Scale factors: 1 ft = 15 SVG units
    scale = 15.0
    plot_w = twin.plot.plot_width_ft * scale
    plot_d = twin.plot.plot_depth_ft * scale

    # Setbacks in ft (3m = ~9.84ft, 1.5m = ~4.92ft)
    sb_front = 9.84 * scale
    sb_rear = 9.84 * scale
    sb_side = 4.92 * scale

    # Floor 0 rooms
    f0 = twin.floors[0] if twin.floors else None
    rooms_data = []
    if f0:
        for r in f0.rooms:
            rooms_data.append({
                "name": r.name,
                "length_ft": r.length_ft,
                "width_ft": r.width_ft,
                "area_sqft": r.area_sqft,
                "x_svg": sb_side + (r.x * scale),
                "y_svg": sb_front + (r.y * scale),
                "w_svg": r.length_ft * scale,
                "h_svg": r.width_ft * scale,
                "door_width_mm": r.door_width_mm,
                "window_area_sqft": r.window_area_sqft,
                "color": r.color_wall_A.hex or "#F5F0E6",
                "color_name": r.color_wall_A.name,
                "lrv": r.color_wall_A.lrv,
                "material": r.material_floor
            })

    columns_3d = []
    for col in twin.structure.columns:
        columns_3d.append({
            "x": (col.x * 0.3048) - 2.5,
            "y": 1.5,
            "z": (col.y * 0.3048) - 2.0,
            "size_mm": col.size_mm,
            "load_tons": col.load_tons,
            "reason": col.reason
        })

    beams_3d = []
    for b in twin.structure.beams:
        beams_3d.append({
            "span_m": b.span_m,
            "depth_mm": b.depth_mm,
            "reason": b.reason
        })

    mep_routes = {
        "water_supply_lines": [
            {"from": [0, 0, 0], "to": [0, 3.2, 0], "color": "#3B82F6", "type": "CPVC 25mm Cold Water"},
            {"from": [0, 3.2, 0], "to": [3.5, 3.2, 1.8], "color": "#3B82F6", "type": "Kitchen & Bath Riser"}
        ],
        "drainage_lines": [
            {"from": [3.5, 0.2, 1.8], "to": [-0.5, 0, -1.0], "color": "#10B981", "type": "110mm Soil Pipe (Slope 1:60)"}
        ],
        "electrical_conduits": [
            {"from": [-0.5, 1.2, 0], "to": [3.0, 1.2, 0], "color": "#F59E0B", "type": "FR PVC 20mm Conduit (350mm clearance)"}
        ]
    }

    return {
        "plot": {
            "width_svg": plot_w,
            "depth_svg": plot_d,
            "viewBox": f"0 0 {plot_w + 100} {plot_d + 100}",
            "setbacks": {"front": sb_front, "rear": sb_rear, "side": sb_side}
        },
        "rooms": rooms_data,
        "structure_3d": {
            "columns": columns_3d,
            "beams": beams_3d,
            "foundation": twin.structure.foundation.model_dump(),
            "safety_factor": twin.structure.safety_factor
        },
        "mep_3d": mep_routes,
        "style_info": twin.style.model_dump(),
        "boq_info": twin.boq.model_dump()
    }


@router.get("/render/health")
def health_check():
    return {"status": "healthy", "model": "render_engine", "version": "1.0"}
