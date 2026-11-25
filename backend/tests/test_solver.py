"""Floor-plan solver: the guarantees hold on varied briefs (every room reachable, store/puja kept, stair stacked)."""
import random

import pytest

from backend.app.models.brief import Brief
from backend.app.services import generator, pack, solver

BRIEFS = [
    dict(plot_width_ft=40, plot_depth_ft=60, floors_wanted=2, couples=1, elder_couples=1, kids=2, store_room=True, puja="nook"),
    dict(plot_width_ft=25, plot_depth_ft=50, floors_wanted=2, couples=1, kids=2, puja="nook"),
    dict(plot_width_ft=30, plot_depth_ft=50, floors_wanted=3, couples=2, elder_singles=1, kids=2, store_room=True, puja="room", parking="car", cars=1),
]


@pytest.mark.parametrize("kw", BRIEFS)
def test_guarantees(kw):
    b = Brief(styles=["indian_contemporary"], **kw)
    r = pack.rules(b.plot_width_ft * pack.FT, b.plot_depth_ft * pack.FT, b.road_width_m, b.city)
    c = solver.solve(b, generator.strategies(b, r)[0], random.Random(1))
    assert c, "no plan"
    rooms = c["layout"]["rooms"]
    assert not solver.reachable(c["layout"])
    assert {"store", "puja"} & {x["id"] for x in rooms} == {"store", "puja"} & {x["id"] for x in generator.program(b, r, c["floors"], c["strategy"]["parking"], c["strategy"]["stilt"])}
    stairs = {(x["x"], x["y"]) for x in rooms if x["type"] == "stair"}
    assert len(stairs) == 1  # one stair position on every floor
    for f in {x["floor"] for x in rooms}:  # no overlaps
        fr = [x for x in rooms if x["floor"] == f]
        for i, a in enumerate(fr):
            for o in fr[i + 1:]:
                assert min(a["x"] + a["w"], o["x"] + o["w"]) - max(a["x"], o["x"]) < 1e-6 or min(a["y"] + a["d"], o["y"] + o["d"]) - max(a["y"], o["y"]) < 1e-6


def test_mirror_keeps_guarantees():
    b = Brief(styles=["indian_contemporary"], **BRIEFS[0])
    r = pack.rules(b.plot_width_ft * pack.FT, b.plot_depth_ft * pack.FT, b.road_width_m, b.city)
    c = solver.solve(b, generator.strategies(b, r)[0], random.Random(2))
    solver.mirror(c)
    assert not solver.reachable(c["layout"])
