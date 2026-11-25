"""House looks: options get different archetypes; every look fits the height limit and setbacks; the judge checks it."""
from backend.app.models.brief import Brief
from backend.app.models.twin import HouseTwin
from backend.app.services import look, orchestrator
from backend.app.services.judge import JudgeService
from backend.app.services.repository import HouseTwinRepository


def _house(styles):
    twin = HouseTwinRepository.create(HouseTwin(house_id=f"nest_look{len(styles)}{abs(hash(tuple(styles))) % 10**6}"))
    twin.metadata["brief"] = Brief(plot_width_ft=40, plot_depth_ft=60, floors_wanted=2, couples=1, kids=2, styles=styles).model_dump()
    HouseTwinRepository.save(twin)
    return twin.house_id


def test_options_look_different_and_fit_rules():
    r = orchestrator.start_options(_house(["kerala_nalukettu"]), seed=1)
    archs = [o["look"]["archetype"] for o in r["options"]]
    assert len(set(archs)) == len(archs), archs
    assert archs[0] == "sloped"  # Kerala leads with a pitched tiled roof
    for o in r["options"]:
        assert o["pass"], o["judge"]


def test_judge_catches_too_tall_roof():
    hid = _house(["kerala_nalukettu"])
    opts = orchestrator.start_options(hid, seed=2)["options"]
    sloped = next(o for o in opts if o["look"]["roof"]["pitch_deg"])
    orchestrator.choose(hid, sloped["id"])
    twin = HouseTwinRepository.get(hid)
    assert JudgeService.validate_house(twin).passed
    twin.metadata["look"]["roof"]["pitch_deg"] = 70  # a roof far too steep for the height limit
    twin.metadata["look"]["shading"]["chhajja_m"] = 9
    codes = {f["rule_id"] for f in JudgeService.validate_house(twin).to_dict()["failures"]}
    assert {"B_HEIGHT", "B_PROJECTION"} <= codes


def test_flat_styles_lead_with_terraces():
    assert look.order(["minimalist"])[0] in ("terrace", "stepped")
