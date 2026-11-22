"""
House Twin Public API Router - Section 5 public contracts.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import Depends
from backend.app.services.access import rate_limit, require_edit
from backend.app.models.twin import HouseTwin, PlotInfo, FamilyInfo, BudgetInfo
from backend.app.services.repository import HouseTwinRepository

router = APIRouter(prefix="/api/v1/house", tags=["House Twin"])


@router.post("", response_model=Dict[str, Any], dependencies=[Depends(rate_limit("create", 20))])
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
    # The edit token is shown once; the browser keeps it so the anonymous creator can keep editing.
    edit_token = secrets.token_urlsafe(24)
    HouseTwinRepository.create(twin, edit_token=edit_token)
    return {"success": True, "house_id": house_id, "edit_token": edit_token, "data": twin.model_dump()}


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
def delete_house(house_id: str, _user: Optional[str] = Depends(require_edit)):
    """
    Deletes a House Twin (Data Privacy Purge).
    """
    deleted = HouseTwinRepository.delete(house_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")
    return {"success": True, "message": f"House '{house_id}' purged successfully."}


@router.post("/{house_id}/review", response_model=Dict[str, Any])
def request_architect_review(house_id: str, user_id: Optional[str] = Depends(require_edit)):
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
    HouseTwinRepository.add_waitlist("architect_review", house_id=house_id, user_id=user_id)
    return {
        "success": True,
        "data": {
            "request_id": request_id,
            "house_id": house_id,
            "status": "requested",
            "message": "Review request recorded. We'll contact you when a licensed architect is available.",
        },
    }


@router.post("/{house_id}/claim", response_model=Dict[str, Any])
def claim_house(house_id: str, user_id: Optional[str] = Depends(require_edit)):
    """Saves an anonymous house to the signed-in user's account (it stops expiring)."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in to save this house.")
    HouseTwinRepository.claim(house_id, user_id)
    return {"success": True, "house_id": house_id}
