"""
Questionnaire API Router - Section 5 & 10.
Ingests 4 stages of intake and produces Constraint Graph JSON via SLM.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from typing import Optional
from fastapi import Depends
from backend.app.services.access import require_edit
from backend.app.services.repository import HouseTwinRepository
from backend.app.services.slm import SLMService
from backend.app.models.constraints import ConstraintGraph

router = APIRouter(prefix="/api/v1/house", tags=["Questionnaire"])


class StageAnswers(BaseModel):
    user_prompt: str = Field(default="", description="Freeform user lifestyle sentence")
    plot_width_ft: float = Field(default=30.0)
    plot_depth_ft: float = Field(default=40.0)
    target_budget_inr: float = Field(default=2000000.0)
    adults: int = Field(default=3)
    elders: int = Field(default=1)
    toddlers: int = Field(default=1)
    has_pets: bool = Field(default=True)
    pet_breed: str = Field(default="Labrador")
    elder_knee_pain: bool = Field(default=True)
    wfh_hours_per_day: int = Field(default=8)
    cooking_style: str = Field(default="wet_and_dry")
    vaastu_faith: str = Field(default="vaastu_soft")
    preferred_styles: List[str] = Field(default_factory=lambda: ["japanese", "forest"])


@router.post("/{house_id}/questionnaire", response_model=Dict[str, Any])
def submit_questionnaire(house_id: str, answers: StageAnswers, _user: Optional[str] = Depends(require_edit)):
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")
        
    # Construct combined prompt for SLM service
    combined_text = f"{answers.user_prompt}. Elders: {answers.elders}, Toddlers: {answers.toddlers}, WFH: {answers.wfh_hours_per_day}h. "
    if answers.elder_knee_pain:
        combined_text += "Elder has acute knee pain. "
    if answers.has_pets:
        combined_text += f"Living with pet {answers.pet_breed}. "
    combined_text += f"Vaastu: {answers.vaastu_faith}. Styles: {', '.join(answers.preferred_styles)}."

    # SLM translates to constraints (0% dimension output invariant)
    constraint_graph = SLMService.translate_to_constraints(combined_text)
    
    # Update House Twin properties
    twin.plot.plot_width_ft = answers.plot_width_ft
    twin.plot.plot_depth_ft = answers.plot_depth_ft
    twin.plot.plot_area_sqft = answers.plot_width_ft * answers.plot_depth_ft
    twin.budget.total_budget_inr = answers.target_budget_inr
    twin.family.adults = answers.adults
    twin.family.elders = answers.elders
    twin.family.toddlers = answers.toddlers
    twin.family.wfh_members = 1 if answers.wfh_hours_per_day > 4 else 0
    twin.family.faith = answers.vaastu_faith
    twin.style.primary_style = answers.preferred_styles[0] if answers.preferred_styles else "japanese"
    if len(answers.preferred_styles) > 1:
        twin.style.secondary_style = answers.preferred_styles[1]
    
    twin.metadata["constraint_graph"] = constraint_graph.model_dump()
    HouseTwinRepository.save(twin)

    return {
        "success": True,
        "house_id": house_id,
        "constraint_graph": constraint_graph.model_dump(),
        "summary": {
            "ground_floor_bedroom": constraint_graph.ground_floor_bedroom_required,
            "min_door_width_mm": constraint_graph.min_door_width_mm,
            "no_steps": constraint_graph.no_steps,
            "grab_bars": constraint_graph.grab_bars,
            "vaastu_mode": constraint_graph.vaastu_mode,
            "constraints_count": len(constraint_graph.constraints)
        }
    }
