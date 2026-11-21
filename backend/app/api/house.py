"""
House Twin Public API Router - Section 5 public contracts.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import uuid
from datetime import datetime, timezone

from backend.app.models.twin import HouseTwin, PlotInfo, FamilyInfo, BudgetInfo
from backend.app.services.repository import HouseTwinRepository

router = APIRouter(prefix="/api/v1/house", tags=["House Twin"])


@router.post("", response_model=Dict[str, Any])
def create_house(initial_data: Optional[Dict[str, Any]] = None):
    """
    Creates a new draft House Twin.
    """
    house_id = f"nest_{uuid.uuid4().hex[:10]}"
    plot = PlotInfo()
    family = FamilyInfo()
    budget = BudgetInfo()
    
    if initial_data:
        if "plot" in initial_data:
            plot = PlotInfo(**initial_data["plot"])
        if "family" in initial_data:
            family = FamilyInfo(**initial_data["family"])
        if "budget" in initial_data:
            budget = BudgetInfo(**initial_data["budget"])
            
    twin = HouseTwin(
        house_id=house_id,
        version="1.0",
        status="draft",
        plot=plot,
        family=family,
        budget=budget
    )
    HouseTwinRepository.save(twin)
    return {"success": True, "house_id": house_id, "data": twin.model_dump()}


@router.get("/{house_id}", response_model=Dict[str, Any])
def get_house(house_id: str):
    """
    Retrieves the Single Source of Truth House Twin.
    """
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")
    return {"success": True, "data": twin.model_dump()}


@router.delete("/{house_id}", response_model=Dict[str, Any])
def delete_house(house_id: str):
    """
    Deletes a House Twin (Data Privacy Purge).
    """
    deleted = HouseTwinRepository.delete(house_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")
    return {"success": True, "message": f"House '{house_id}' purged successfully."}


@router.post("/{house_id}/review", response_model=Dict[str, Any])
def request_architect_review(house_id: str):
    """
    Records a request for a licensed-architect review (lead capture).
    No payment is taken and no architect is assigned yet: the pilot has no partners onboarded.
    """
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")

    request_id = f"rev_{uuid.uuid4().hex[:8]}"
    twin.metadata.setdefault("review_requests", []).append(
        {"request_id": request_id, "requested_at": datetime.now(timezone.utc).isoformat()}
    )
    HouseTwinRepository.save(twin)
    return {
        "success": True,
        "data": {
            "request_id": request_id,
            "house_id": house_id,
            "status": "requested",
            "message": "Review request recorded. We'll contact you when a licensed architect is available.",
        },
    }


@router.post("/{house_id}/export/dwg", response_model=Dict[str, Any])
def export_dwg(house_id: str):
    """
    Mock CAD DXF/DWG file export.
    """
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")
        
    return {
        "success": True,
        "data": {
            "house_id": house_id,
            "filename": f"{house_id}_mumbai_sanction.dxf",
            "download_url": f"/api/v1/house/{house_id}/download/cad",
            "format": "AutoCAD 2018 DXF",
            "layers": ["WALLS_230MM", "COLUMNS_230X230", "BEAMS_IS456", "PLUMBING_1_60", "ELECTRICAL_CONDUITS"]
        }
    }
