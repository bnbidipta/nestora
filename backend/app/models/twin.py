from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PlotInfo(BaseModel):
    address: str = Field(default="Mumbai, 19.07, 72.87")
    plot_width_ft: float = Field(default=30.0, description="Plot width along road frontage")
    plot_depth_ft: float = Field(default=40.0, description="Plot depth")
    plot_area_sqft: float = Field(default=1200.0, description="Gross plot area in sqft")
    orientation: str = Field(default="East", description="Plot front orientation: North, South, East, West")
    road_width_ft: float = Field(default=30.0, description="Abutting road width in ft")
    soil_type: str = Field(default="black_cotton", description="Soil type: black_cotton, red_soil, rocky")
    water_table_m: float = Field(default=4.5, description="Depth of water table in meters")


class PetInfo(BaseModel):
    type: str = Field(default="dog")
    breed: str = Field(default="Labrador")


class FamilyInfo(BaseModel):
    adults: int = Field(default=3)
    elders: int = Field(default=1)
    toddlers: int = Field(default=1)
    pets: List[PetInfo] = Field(default_factory=lambda: [PetInfo()])
    wfh_members: int = Field(default=1)
    joint_family: bool = Field(default=True)
    disabilities: List[str] = Field(default_factory=lambda: ["elder_knee_pain"])
    faith: str = Field(default="vaastu_soft")


class BudgetInfo(BaseModel):
    total_budget_inr: float = Field(default=2000000.0)
    contingency_pct: float = Field(default=10.0)
    construction_cost_sqft_inr: Optional[float] = Field(default=1800.0)


class ColorWall(BaseModel):
    name: str = Field(default="Warm White")
    rgb: str = Field(default="245,240,230")
    cmyk: str = Field(default="0,2,6,4")
    lrv: int = Field(default=85, description="Light Reflectance Value 0-100")
    hex: Optional[str] = Field(default="#F5F0E6")


class Room(BaseModel):
    name: str = Field(description="Room identifier: living, bedroom_master, bedroom_elder, kitchen, toilet_1, etc.")
    length_ft: float
    width_ft: float
    area_sqft: float
    window_area_sqft: float = Field(default=15.0)
    door_width_mm: int = Field(default=900)
    color_wall_A: ColorWall = Field(default_factory=ColorWall)
    color_accent: Optional[ColorWall] = None
    material_floor: str = Field(default="vitrified_tiles")
    x: Optional[float] = Field(default=0.0, description="Offset x in ft on floor plan")
    y: Optional[float] = Field(default=0.0, description="Offset y in ft on floor plan")
    has_attached_bath: Optional[bool] = False
    is_ground_floor: Optional[bool] = True


class Floor(BaseModel):
    floor_no: int = Field(default=0, description="0 = Ground Floor, 1 = First Floor")
    floor_height_ft: float = Field(default=10.5, description="Floor-to-floor height in ft")
    clear_height_ft: float = Field(default=9.2, description="Finished floor to ceiling clear height")
    area_sqft: float = Field(default=950.0, description="Built-up area on this floor")
    rooms: List[Room] = Field(default_factory=list)


class Column(BaseModel):
    x: float = Field(description="Coordinate x in feet from bottom-left corner of building")
    y: float = Field(description="Coordinate y in feet from bottom-left corner of building")
    size_mm: int = Field(default=230, description="Column square dimension in mm (e.g. 230x230 or 230x300)")
    size_y_mm: Optional[int] = Field(default=230)
    load_tons: float = Field(default=12.0, description="Axial load in metric tons")
    reason: Optional[str] = Field(default="Load 12 tons, soil bearing capacity 120 kN/m2 per IS 456")


class Beam(BaseModel):
    span_m: float = Field(description="Clear beam span in meters")
    depth_mm: int = Field(description="Effective beam depth in mm (e.g. span/16)")
    width_mm: int = Field(default=230)
    start_col_idx: Optional[int] = None
    end_col_idx: Optional[int] = None
    reason: Optional[str] = Field(default="Span/16 thumb rule per IS 456:2000 deflection criteria")


class Foundation(BaseModel):
    type: str = Field(default="raft", description="raft, isolated, strip, pile")
    depth_ft: float = Field(default=4.5)
    bearing_capacity_kn_m2: float = Field(default=120.0)
    reason: Optional[str] = Field(default="Black cotton expansive soil requires 4.5ft deep raft foundation")


class Structure(BaseModel):
    columns: List[Column] = Field(default_factory=list)
    beams: List[Beam] = Field(default_factory=list)
    foundation: Foundation = Field(default_factory=Foundation)
    safety_factor: float = Field(default=1.5, description="Partial safety factor for concrete/steel limit state")
    wall_load_bearing_mm: int = Field(default=230)
    wall_partition_mm: int = Field(default=115)


class WastePipe(BaseModel):
    type: str = Field(default="soil", description="soil (black) or waste (grey)")
    dia_mm: int = Field(default=110)
    slope: str = Field(default="1:60", description="Hydraulic gradient 1:60 to 1:100 per IS 1742")


class ACUnit(BaseModel):
    type: str = Field(default="split")
    tonnage: float = Field(default=1.5)
    room: str = Field(default="living")


class MEP(BaseModel):
    electrical_points: int = Field(default=45)
    waste_pipes: List[WastePipe] = Field(default_factory=lambda: [WastePipe()])
    pump_head_m: float = Field(default=12.0, description="Pump head required in meters")
    electrical_water_separation_mm: int = Field(default=350, description="Minimum distance between conduit and plumbing")
    ac_units: List[ACUnit] = Field(default_factory=list)


class StyleInfo(BaseModel):
    primary_style: str = Field(default="japanese")
    secondary_style: str = Field(default="forest")
    mix_pct: str = Field(default="70/30")
    taste_vector: List[float] = Field(default_factory=lambda: [0.12, -0.03])


class BOQ(BaseModel):
    cement_bags: int = Field(default=720, description="Total 50kg bags of OPC 43/53 or PPC")
    steel_kg: int = Field(default=6300, description="Total Fe500 TMT reinforcement rebar in kg")
    sand_tons: Optional[float] = Field(default=45.0)
    aggregate_tons: Optional[float] = Field(default=60.0)
    bricks_count: Optional[int] = Field(default=18000)
    cost_breakdown: Dict[str, float] = Field(
        default_factory=lambda: {
            "foundation": 400000.0,
            "structure": 700000.0,
            "mep": 250000.0,
            "finishing": 650000.0
        }
    )
    total_cost_inr: float = Field(default=2000000.0)
    monthly_emi_inr: Optional[float] = Field(default=17500.0)


class SwipeRecord(BaseModel):
    card_id: str
    deck: str
    direction: str  # "right" or "left"
    dwell_ms: int


class HouseTwin(BaseModel):
    """
    House Twin JSON - Single Source of Truth for Nestora.
    """
    house_id: str = Field(default="nest_pilot_001")
    version: str = Field(default="1.0")
    status: str = Field(default="draft", description="draft, generating, ready, failed")
    created_at: Optional[str] = None
    plot: PlotInfo = Field(default_factory=PlotInfo)
    family: FamilyInfo = Field(default_factory=FamilyInfo)
    budget: BudgetInfo = Field(default_factory=BudgetInfo)
    floors: List[Floor] = Field(default_factory=list)
    structure: Structure = Field(default_factory=Structure)
    mep: MEP = Field(default_factory=MEP)
    style: StyleInfo = Field(default_factory=StyleInfo)
    boq: BOQ = Field(default_factory=BOQ)
    swipe_history: List[SwipeRecord] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
