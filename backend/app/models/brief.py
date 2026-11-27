"""The design brief: everything the generator reads. Questionnaire v2 and the eval briefs both produce this."""
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

LIFT_FROM_FLOORS = 3  # storeys (incl. ground) from which a lift is mandatory
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
    floors_wanted: int = Field(default=2, ge=1, le=5)  # capped later by what the plot's rules allow
    parking: Literal["none", "two_wheeler", "car"] = "two_wheeler"
    cars: int = Field(default=1, ge=0, le=4)
    two_wheelers: int = Field(default=0, ge=0, le=6)
    flood_prone: bool = False  # street waterlogs in monsoon -> higher plinth
    future_extra_floor: bool = False  # size columns/footings for one more storey later
    lift: Literal["none", "shaft", "lift"] = "none"  # shaft = space reserved now, lift fitted later
    low_maintenance: bool = False
    budget_inr: float = Field(default=4_000_000, ge=100_000, le=1_000_000_000)
    tier: Literal["economy", "standard", "premium"] = "standard"
    adults: int = Field(default=2, ge=1, le=12)
    elders: int = Field(default=0, ge=0, le=6)
    elder_mobility_issue: bool = False
    # Household as people describe it (questionnaire v3). When given, adults/elders are derived from these.
    couples: Optional[int] = Field(default=None, ge=0, le=6)
    singles: Optional[int] = Field(default=None, ge=0, le=12)
    elder_couples: Optional[int] = Field(default=None, ge=0, le=3)
    elder_singles: Optional[int] = Field(default=None, ge=0, le=6)
    bedrooms: Optional[int] = Field(default=None, ge=1, le=8)  # the user's own count overrides the suggestion
    kids: int = Field(default=0, ge=0, le=8)
    pets: bool = False
    wfh_people: int = Field(default=0, ge=0, le=8)
    joint_family: bool = False
    rental_floor: bool = False
    puja: Literal["none", "nook", "room"] = "nook"
    # private: bedrooms and the study open off a passage or lounge; open: they may also open off living/dining (less corridor)
    bedroom_privacy: Literal["private", "open"] = "private"
    kitchen: Literal["closed", "open"] = "closed"  # open: kitchen + dining flow into living, no separate dining room
    guest_room: bool = False
    help_room: bool = False  # live-in domestic help
    laundry: bool = False  # separate wash/utility area
    store_room: bool = False
    master_dressing: bool = False  # walk-in dressing in the master bedroom
    terrace_garden: bool = False  # prefers keeping an open terrace on the top floor
    traditions: Dict[str, Strictness] = Field(default_factory=lambda: {"vaastu": "soft"})
    styles: List[str] = Field(default_factory=list, max_length=60)  # no cap: pick as many as you like
    styles_locked: bool = False  # true when the user picked styles by hand; swipes then don't override them
    free_text: str = Field(default="", max_length=2000)
    # the user's own exterior choices (element -> option id, or a hex colour for "wall_colour"/"accent_colour");
    # they win over the style's defaults. Validated against exterior_vocab.json.
    exterior: Dict[str, object] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _derive(self):
        if self.exterior:
            from backend.app.services import look  # lazy: look imports models
            self.exterior = look.valid_overrides(self.exterior)
        if self.couples is not None or self.singles is not None:
            self.adults = min(12, max(1, 2 * (self.couples or 0) + (self.singles or 0)))
        if self.elder_couples is not None or self.elder_singles is not None:
            self.elders = min(6, 2 * (self.elder_couples or 0) + (self.elder_singles or 0))
        if self.floors_wanted >= LIFT_FROM_FLOORS and self.lift == "none":
            self.lift = "lift"  # a lift is mandatory from 3 storeys
        if self.parking == "car" and self.cars == 0:
            self.cars = 1
        return self

    @property
    def dining_seats(self) -> int:
        """Dining table seats, from the household (4, 6 or 8); no longer asked."""
        n = self.adults + self.elders + self.kids
        return min(8, max(4, n + n % 2))

    @property
    def bedrooms_needed(self) -> int:
        """Bedrooms incl. the elders' (guest room is separate). 1 per couple, single adult, elder couple or single elder,
        1 per 2 children; the user's own count wins."""
        if self.bedrooms:
            return self.bedrooms
        if self.couples is not None or self.singles is not None:
            n = max(1, (self.couples or 0) + (self.singles or 0)) + (self.elder_couples or 0) + (self.elder_singles or 0)
            return min(8, n + -(-self.kids // 2))
        n = max(1, -(-self.adults // 2))  # couples share
        if self.elders:
            n += 1
        if self.kids:
            n += 1 if self.kids <= 2 else 2
        return min(n, 6)


def brief_from_dict(d: dict) -> Brief:
    """Accepts eval-brief rows (extra keys like id/expect are ignored)."""
    return Brief(**{k: v for k, v in d.items() if k in Brief.model_fields})
