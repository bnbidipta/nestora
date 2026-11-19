from typing import List, Optional
from pydantic import BaseModel, Field


class ConstraintGraph(BaseModel):
    """
    Constraint Graph derived strictly from Questionnaire + User Sentence via SLM.
    Never outputs structural geometry directly.
    """
    elder_present: bool = Field(default=False, description="Whether elderly family members reside in home")
    toddler_present: bool = Field(default=False, description="Whether toddlers reside in home")
    pet_present: bool = Field(default=False, description="Whether pets reside in home")
    wfh_present: bool = Field(default=False, description="Whether work-from-home members are present")
    joint_family: bool = Field(default=False, description="Joint family setup")
    vaastu_mode: str = Field(default="soft", description="strict, soft, or off")
    ground_floor_bedroom_required: bool = Field(default=False, description="Ground floor bedroom requirement")
    min_door_width_mm: int = Field(default=900, description="Minimum clearance door width in mm")
    no_steps: bool = Field(default=False, description="Barrier-free zero step thresholds")
    grab_bars: bool = Field(default=False, description="Grab bars in elder bathrooms")
    kitchen_orientation: Optional[str] = Field(default="SouthEast", description="Desired kitchen corner (Vaastu)")
    puja_orientation: Optional[str] = Field(default="East", description="Desired puja corner (Vaastu)")
    preferred_styles: List[str] = Field(default_factory=lambda: ["japanese", "forest"])
    constraints: List[str] = Field(default_factory=list, description="Textual constraint rules for DAG")
