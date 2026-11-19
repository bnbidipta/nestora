"""
Unit Tests for Pure Python Judge (Section 7).
Verifies 10 known good houses PASS and 10 known bad houses FAIL.
"""
import pytest
from backend.app.models.twin import (
    HouseTwin, PlotInfo, FamilyInfo, Floor, Room, Structure, Column, Beam, Foundation,
    MEP, WastePipe, ACUnit, StyleInfo, BOQ, ColorWall
)
from backend.app.services.judge import JudgeService


def create_baseline_valid_house(house_id: str = "valid_baseline") -> HouseTwin:
    """Creates a fully compliant 30x40 G+1 Mumbai house twin."""
    return HouseTwin(
        house_id=house_id,
        version="1.0",
        plot=PlotInfo(
            address="Mumbai, 19.07, 72.87",
            plot_width_ft=30.0,
            plot_depth_ft=40.0,
            plot_area_sqft=1200.0,
            orientation="East",
            road_width_ft=30.0,
            soil_type="black_cotton",
            water_table_m=4.5
        ),
        family=FamilyInfo(
            adults=3,
            elders=1,
            toddlers=1,
            wfh_members=1,
            joint_family=True,
            disabilities=["elder_knee_pain"],
            faith="vaastu_soft"
        ),
        floors=[
            Floor(
                floor_no=0,
                floor_height_ft=10.5,
                clear_height_ft=9.2,
                area_sqft=850.0,
                rooms=[
                    Room(
                        name="living",
                        length_ft=16.0,
                        width_ft=12.0,
                        area_sqft=192.0,
                        window_area_sqft=25.0,
                        door_width_mm=1000,
                        color_wall_A=ColorWall(name="Warm White", rgb="245,240,230", cmyk="0,2,6,4", lrv=85),
                        material_floor="vitrified_tiles",
                        is_ground_floor=True
                    ),
                    Room(
                        name="bedroom_elder",
                        length_ft=12.0,
                        width_ft=11.0,
                        area_sqft=132.0,
                        window_area_sqft=16.0,
                        door_width_mm=900,
                        color_wall_A=ColorWall(name="Soft Beige", rgb="240,235,225", cmyk="2,3,8,3", lrv=80),
                        material_floor="teak_wood",
                        is_ground_floor=True
                    ),
                    Room(
                        name="kitchen",
                        length_ft=10.0,
                        width_ft=8.0,
                        area_sqft=80.0,
                        window_area_sqft=10.0,
                        door_width_mm=900,
                        color_wall_A=ColorWall(name="Cool White", rgb="248,248,250", cmyk="1,1,1,0", lrv=90),
                        material_floor="granite",
                        is_ground_floor=True
                    ),
                    Room(
                        name="toilet_elder",
                        length_ft=7.0,
                        width_ft=6.0,
                        area_sqft=42.0,
                        window_area_sqft=5.0,
                        door_width_mm=800,
                        color_wall_A=ColorWall(name="Aqua Mist", rgb="230,245,245", cmyk="8,0,3,1", lrv=82),
                        material_floor="ceramic_tiles",
                        is_ground_floor=True
                    )
                ]
            ),
            Floor(
                floor_no=1,
                floor_height_ft=10.0,
                clear_height_ft=9.0,
                area_sqft=650.0,
                rooms=[
                    Room(
                        name="bedroom_master",
                        length_ft=14.0,
                        width_ft=12.0,
                        area_sqft=168.0,
                        window_area_sqft=20.0,
                        door_width_mm=900,
                        color_wall_A=ColorWall(name="Sage Green", rgb="215,230,215", cmyk="12,0,15,4", lrv=75),
                        material_floor="engineered_wood",
                        is_ground_floor=False
                    ),
                    Room(
                        name="bedroom_guest",
                        length_ft=12.0,
                        width_ft=10.0,
                        area_sqft=120.0,
                        window_area_sqft=15.0,
                        door_width_mm=900,
                        color_wall_A=ColorWall(name="Warm White", rgb="245,240,230", cmyk="0,2,6,4", lrv=85),
                        material_floor="vitrified_tiles",
                        is_ground_floor=False
                    ),
                    Room(
                        name="toilet_master",
                        length_ft=7.0,
                        width_ft=6.0,
                        area_sqft=42.0,
                        window_area_sqft=5.0,
                        door_width_mm=750,
                        color_wall_A=ColorWall(name="Cool Grey", rgb="235,235,238", cmyk="3,2,2,2", lrv=80),
                        material_floor="ceramic_tiles",
                        is_ground_floor=False
                    )
                ]
            )
        ],
        structure=Structure(
            columns=[
                Column(x=0, y=0, size_mm=230, load_tons=12.0, reason="Tributary load 12t"),
                Column(x=15, y=0, size_mm=230, load_tons=14.0, reason="Tributary load 14t"),
                Column(x=0, y=20, size_mm=230, load_tons=11.0, reason="Tributary load 11t"),
                Column(x=15, y=20, size_mm=230, load_tons=15.0, reason="Tributary load 15t")
            ],
            beams=[
                Beam(span_m=4.5, depth_mm=290, reason="Span 4.5m / 16 = 281mm min, using 290mm"),
                Beam(span_m=5.0, depth_mm=320, reason="Span 5.0m / 16 = 312mm min, using 320mm")
            ],
            foundation=Foundation(type="raft", depth_ft=4.5, bearing_capacity_kn_m2=120.0),
            safety_factor=1.5,
            wall_load_bearing_mm=230,
            wall_partition_mm=115
        ),
        mep=MEP(
            electrical_points=50,
            waste_pipes=[WastePipe(type="soil", dia_mm=110, slope="1:60")],
            pump_head_m=14.0,  # building height = (10.5+10)*0.3048 = 6.25m + 5m = 11.25m min
            electrical_water_separation_mm=350,
            ac_units=[ACUnit(type="split", tonnage=1.5, room="living")]
        ),
        style=StyleInfo(
            primary_style="japanese",
            secondary_style="forest",
            mix_pct="70/30",
            taste_vector=[0.12, -0.03]
        ),
        boq=BOQ(
            cement_bags=720,
            steel_kg=6300,
            total_cost_inr=2000000.0
        ),
        metadata={
            "setback_front_m": 3.0,
            "setback_side_m": 1.5,
            "setback_rear_m": 3.0,
            "stair_width_mm": 1000,
            "circulation_width_mm": 1000,
            "toilet_under_stair": False,
            "toilet_shares_puja_wall": False,
            "electrical_crosses_water": False,
            "furniture_blocks_door": False,
            "kitchen_triangle_perimeter_ft": 18.0
        }
    )


# ============================================================================
# 10 KNOWN GOOD HOUSES - ALL MUST PASS
# ============================================================================
def test_10_known_good_houses():
    # House 1: Baseline 30x40 Mumbai Pilot
    h1 = create_baseline_valid_house("good_01_baseline")
    res1 = JudgeService.validate_house(h1)
    assert res1.passed is True, f"Good House 1 failed: {res1.failures}"

    # House 2: Japanese Minimalist
    h2 = create_baseline_valid_house("good_02_japanese")
    h2.style.primary_style = "japanese"
    res2 = JudgeService.validate_house(h2)
    assert res2.passed is True

    # House 3: Brutalist with Polished Concrete
    h3 = create_baseline_valid_house("good_03_brutalist")
    h3.style.primary_style = "brutalist"
    h3.floors[0].rooms[0].material_floor = "polished_concrete"
    res3 = JudgeService.validate_house(h3)
    assert res3.passed is True

    # House 4: Biophilic Forest Retreat
    h4 = create_baseline_valid_house("good_04_forest")
    h4.style.primary_style = "forest"
    res4 = JudgeService.validate_house(h4)
    assert res4.passed is True

    # House 5: Vaastu Soft with East orientation
    h5 = create_baseline_valid_house("good_05_vaastu")
    h5.family.faith = "vaastu_soft"
    h5.plot.orientation = "East"
    res5 = JudgeService.validate_house(h5)
    assert res5.passed is True

    # House 6: WFH Oriented with quiet study
    h6 = create_baseline_valid_house("good_06_wfh")
    h6.family.wfh_members = 2
    res6 = JudgeService.validate_house(h6)
    assert res6.passed is True

    # House 7: Single floor luxury ground villa (1100 sqft built-up)
    h7 = create_baseline_valid_house("good_07_ground_villa")
    h7.floors = [h7.floors[0]]  # only floor 0
    h7.mep.pump_head_m = 10.0
    res7 = JudgeService.validate_house(h7)
    assert res7.passed is True

    # House 8: High slope drainage (1:80 gradient)
    h8 = create_baseline_valid_house("good_08_drainage_80")
    h8.mep.waste_pipes[0].slope = "1:80"
    res8 = JudgeService.validate_house(h8)
    assert res8.passed is True

    # House 9: Deep raft foundation with 140 kN/m2 bearing capacity
    h9 = create_baseline_valid_house("good_09_raft_140")
    h9.structure.foundation.bearing_capacity_kn_m2 = 140.0
    res9 = JudgeService.validate_house(h9)
    assert res9.passed is True

    # House 10: High safety factor 1.65 for coastal seismic zone III
    h10 = create_baseline_valid_house("good_10_coastal")
    h10.structure.safety_factor = 1.65
    res10 = JudgeService.validate_house(h10)
    assert res10.passed is True


# ============================================================================
# 10 KNOWN BAD HOUSES - ALL MUST FAIL WITH SPECIFIC VIOLATION CODES
# ============================================================================
def test_bad_01_beam_span_exceeded():
    """Beam span > 6.0m without column must fail C_BEAM_SPAN_EXCEEDED."""
    h = create_baseline_valid_house("bad_01")
    h.structure.beams.append(Beam(span_m=7.2, depth_mm=450, reason="Excessive span"))
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "C_BEAM_SPAN_EXCEEDED" for f in res.failures)


def test_bad_02_drainage_slope_invalid():
    """Drainage slope outside 1:60 to 1:100 (e.g. 1:30) must fail D_DRAINAGE_SLOPE."""
    h = create_baseline_valid_house("bad_02")
    h.mep.waste_pipes[0].slope = "1:30"
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "D_DRAINAGE_SLOPE" for f in res.failures)


def test_bad_03_elder_door_too_narrow():
    """Elder bedroom door width < 900mm must fail B_ELDER_DOOR_WIDTH."""
    h = create_baseline_valid_house("bad_03")
    for r in h.floors[0].rooms:
        if "elder" in r.name:
            r.door_width_mm = 750
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "B_ELDER_DOOR_WIDTH" for f in res.failures)


def test_bad_04_setback_violation():
    """Front setback < 3.0m must fail B_SETBACK_FRONT."""
    h = create_baseline_valid_house("bad_04")
    h.metadata["setback_front_m"] = 2.0
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "B_SETBACK_FRONT" for f in res.failures)


def test_bad_05_fsi_violation():
    """Total built-up exceeding FSI 1.5 (1800 sqft on 1200 sqft plot) must fail B_FSI_VIOLATION."""
    h = create_baseline_valid_house("bad_05")
    h.floors[0].area_sqft = 1100.0
    h.floors[1].area_sqft = 900.0  # Total = 2000 > 1800
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "B_FSI_VIOLATION" for f in res.failures)


def test_bad_06_safety_factor_low():
    """Structural safety factor < 1.5 must fail C_SAFETY_FACTOR."""
    h = create_baseline_valid_house("bad_06")
    h.structure.safety_factor = 1.3
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "C_SAFETY_FACTOR" for f in res.failures)


def test_bad_07_toilet_under_stair():
    """Toilet under stair must fail B_TOILET_UNDER_STAIR."""
    h = create_baseline_valid_house("bad_07")
    h.metadata["toilet_under_stair"] = True
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "B_TOILET_UNDER_STAIR" for f in res.failures)


def test_bad_08_electrical_crosses_water():
    """Electrical crossing water must fail D_ELEC_CROSS_WATER."""
    h = create_baseline_valid_house("bad_08")
    h.metadata["electrical_crosses_water"] = True
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "D_ELEC_CROSS_WATER" for f in res.failures)


def test_bad_09_pump_head_insufficient():
    """Pump head insufficient for building height must fail D_PUMP_HEAD_INSUFFICIENT."""
    h = create_baseline_valid_house("bad_09")
    h.mep.pump_head_m = 5.0  # Required is > 11.2m
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "D_PUMP_HEAD_INSUFFICIENT" for f in res.failures)


def test_bad_10_narrow_circulation():
    """Circulation width < 900mm must fail E_CIRCULATION_TOO_NARROW."""
    h = create_baseline_valid_house("bad_10")
    h.metadata["circulation_width_mm"] = 750
    res = JudgeService.validate_house(h)
    assert res.passed is False
    assert any(f["rule_id"] == "E_CIRCULATION_TOO_NARROW" for f in res.failures)
