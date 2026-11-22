"""Judge on real generated houses: they pass, and each injected fault is caught by the right rule."""
import copy

import pytest

from backend.app.models.brief import Brief
from backend.app.models.twin import Beam, HouseTwin
from backend.app.services import derive, generator
from backend.app.services.judge import JudgeService

BRIEFS = [
    Brief(),
    Brief(plot_width_ft=30, plot_depth_ft=50, road_width_m=12, elders=1, elder_mobility_issue=True, kids=1),
    Brief(plot_width_ft=40, plot_depth_ft=60, road_width_m=12, floors_wanted=3, parking="car", adults=4, kids=2, wfh_people=1, puja="room"),
    Brief(plot_width_ft=25, plot_depth_ft=40, floors_wanted=1, parking="none"),
]


def _house(brief: Brief) -> HouseTwin:
    cands = generator.candidates(brief, n=6)
    assert cands, f"no layout for {brief}"
    for c in cands:
        t = HouseTwin(house_id="t")
        derive.apply(t, brief, c)
        if JudgeService.validate_house(t).passed:
            return t
    pytest.fail(f"no candidate passed the Judge for {brief}")


@pytest.mark.parametrize("brief", BRIEFS)
def test_generated_houses_pass(brief):
    t = _house(brief)
    r = JudgeService.validate_house(t)
    assert r.passed, r.failures


@pytest.fixture(scope="module")
def good():
    return _house(BRIEFS[1])


def _fails(t, rule):
    r = JudgeService.validate_house(t)
    assert not r.passed and any(f["rule_id"] == rule for f in r.failures), r.failures


def test_beam_span(good):
    t = copy.deepcopy(good); t.structure.beams.append(Beam(span_m=7.2, depth_mm=500)); _fails(t, "C_BEAM_SPAN_EXCEEDED")


def test_drainage(good):
    t = copy.deepcopy(good); t.mep.waste_pipes[0].slope = "1:30"; _fails(t, "D_DRAINAGE_SLOPE")


def test_elder_door(good):
    t = copy.deepcopy(good)
    for r in t.floors[0].rooms:
        if "elder" in r.name and r.type == "bedroom_elder":
            r.door_width_mm = 750
    _fails(t, "B_ELDER_DOOR_WIDTH")


def test_elder_upstairs(good):
    t = copy.deepcopy(good)
    room = next(r for r in t.floors[0].rooms if r.type == "bedroom_elder")
    t.floors[0].rooms.remove(room); room.is_ground_floor = False; t.floors[1].rooms.append(room)
    _fails(t, "B_ELDER_GROUND_FLOOR")


def test_setback(good):
    t = copy.deepcopy(good); t.metadata["setback_front_m"] = 1.0; _fails(t, "B_SETBACK_FRONT")


def test_fsi(good):
    t = copy.deepcopy(good); t.metadata["fsi_built_up_sqft"] = t.plot.plot_area_sqft * 5; _fails(t, "B_FSI_VIOLATION")


def test_overlap(good):
    t = copy.deepcopy(good); a, b = t.floors[0].rooms[:2]; b.x, b.y = a.x, a.y; _fails(t, "A_ROOMS_OVERLAP")


def test_outside_envelope(good):
    t = copy.deepcopy(good); t.floors[0].rooms[0].x += 50; _fails(t, "A_OUTSIDE_ENVELOPE")


def test_small_bedroom(good):
    t = copy.deepcopy(good)
    r = next(r for f in t.floors for r in f.rooms if (r.type or "").startswith("bedroom"))
    r.length_ft, r.width_ft, r.area_sqft = 7.0, 9.0, 63.0
    _fails(t, "B_MIN_HABITABLE_AREA")


def test_interior_bedroom(good):
    t = copy.deepcopy(good)
    next(r for f in t.floors for r in f.rooms if (r.type or "").startswith("bedroom")).exterior = False
    _fails(t, "B_NO_OUTSIDE_WALL")


def test_safety_factor(good):
    t = copy.deepcopy(good); t.structure.safety_factor = 1.2; _fails(t, "C_SAFETY_FACTOR")


def test_pump(good):
    t = copy.deepcopy(good); t.mep.pump_head_m = 4.0; _fails(t, "D_PUMP_HEAD_INSUFFICIENT")


def test_stair_not_stacked(good):
    t = copy.deepcopy(good)
    next(r for r in t.floors[1].rooms if r.type == "stair").x += 3
    _fails(t, "B_STAIR_NOT_STACKED")


def test_flags(good):
    for flag, rule in (("toilet_under_stair", "B_TOILET_UNDER_STAIR"), ("electrical_crosses_water", "D_ELEC_CROSS_WATER"),
                       ("floating_column_detected", "C_COLUMN_LOAD_PATH")):
        t = copy.deepcopy(good); t.metadata[flag] = True; _fails(t, rule)


def test_input_sensitivity():
    """Changing the brief must change the house: plot size, elder, floors all move the output."""
    a, b = _house(BRIEFS[0]), _house(BRIEFS[2])
    assert a.metadata["envelope_width_ft"] != b.metadata["envelope_width_ft"]
    assert len(a.structure.columns) != len(b.structure.columns)
    assert a.boq.total_cost_inr != b.boq.total_cost_inr
    assert {r.name for f in a.floors for r in f.rooms} != {r.name for f in b.floors for r in f.rooms}
    assert len(a.floors) != len(b.floors)
