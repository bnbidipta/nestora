"""Questionnaire v3: household as couples/singles, lift rule, parking counts."""
from backend.app.models.brief import Brief
from backend.app.services import generator, orchestrator


def test_bedrooms_from_household():
    b = Brief(couples=1, singles=1, elder_couples=1, elder_singles=0, kids=3)
    assert b.adults == 3 and b.elders == 2
    assert b.bedrooms_needed == 1 + 1 + 1 + 2  # couple, single, elder couple, 3 kids -> 2 rooms
    assert Brief(couples=1, bedrooms=5).bedrooms_needed == 5  # the user's own count wins
    assert Brief(adults=2).bedrooms_needed == 1  # legacy briefs unchanged


def test_lift_mandatory_from_three_storeys():
    assert Brief(floors_wanted=3, lift="none").lift == "lift"
    assert Brief(floors_wanted=2, lift="none").lift == "none"


def test_lift_room_on_every_floor_at_three_storeys():
    b = Brief(plot_width_ft=40, plot_depth_ft=60, road_width_m=12, floors_wanted=3)
    r = generator.pack.rules(b.plot_width_ft * generator.pack.FT, b.plot_depth_ft * generator.pack.FT, b.road_width_m)
    rooms = generator.program(b, r, 3, "two_wheeler", False)
    assert {x["floor"] for x in rooms if x["type"] == "lift"} == {0, 1, 2}


def test_two_wheelers_do_not_shrink_the_house():
    """Scooters park in the open front setback, so asking for them never makes a plot infeasible."""
    from backend.app.services import orchestrator
    assert orchestrator._pool(Brief(plot_width_ft=30, plot_depth_ft=40, two_wheelers=2), {}, 0)
