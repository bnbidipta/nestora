"""The design brief: everything the generator reads. Questionnaire v2 and the eval briefs both produce this."""
from typing import Dict, List, Literal

from pydantic import BaseModel, Field

Strictness = Literal["off", "soft", "strict"]
TRADITIONS = ("vaastu", "sthapatya_veda", "mayamatam", "feng_shui", "islamic", "jain", "biophilic")


class Brief(BaseModel):
    build_type: Literal["new_plot", "renovation", "flat_interior"] = "new_plot"
    city: str = Field(default="mumbai", max_length=40)
    plot_width_ft: float = Field(default=30, ge=15, le=200)
    plot_depth_ft: float = Field(default=40, ge=15, le=300)
    road_width_m: float = Field(default=9, ge=3, le=60)
    facing: Literal["N", "E", "S", "W"] = "E"
    corner_plot: bool = False
    soil: Literal["black_cotton", "red_soil", "hard_rock", "coastal"] = "black_cotton"
    floors_wanted: int = Field(default=2, ge=1, le=3)
    parking: Literal["none", "two_wheeler", "car"] = "two_wheeler"
    budget_inr: float = Field(default=4_000_000, ge=100_000, le=1_000_000_000)
    tier: Literal["economy", "standard", "premium"] = "standard"
    adults: int = Field(default=2, ge=1, le=12)
    elders: int = Field(default=0, ge=0, le=6)
    elder_mobility_issue: bool = False
    kids: int = Field(default=0, ge=0, le=8)
    pets: bool = False
    wfh_people: int = Field(default=0, ge=0, le=8)
    joint_family: bool = False
    rental_floor: bool = False
    puja: Literal["none", "nook", "room"] = "nook"
    traditions: Dict[str, Strictness] = Field(default_factory=lambda: {"vaastu": "soft"})
    styles: List[str] = Field(default_factory=list, max_length=5)
    styles_locked: bool = False  # true when the user picked styles by hand; swipes then don't override them
    free_text: str = Field(default="", max_length=2000)

    @property
    def bedrooms_needed(self) -> int:
        n = max(1, -(-self.adults // 2))  # couples share
        if self.elders:
            n += 1
        if self.kids:
            n += 1 if self.kids <= 2 else 2
        return min(n, 6)


def brief_from_dict(d: dict) -> Brief:
    """Accepts eval-brief rows (extra keys like id/expect are ignored)."""
    return Brief(**{k: v for k, v in d.items() if k in Brief.model_fields})
