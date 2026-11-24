from backend.app.services import rank
from backend.ml.train_plan_prior import realism


def test_prior_prefers_real_proportions():
    p = rank._prior()
    assert all(h["real_beats_shuffled"] > 0.95 for h in p["meta"]["heldout"].values())
    good = [{"type": "bedroom", "x": 0, "y": 0, "w": 3.6, "d": 4.2}, {"type": "toilet", "x": 3.6, "y": 0, "w": 1.8, "d": 2.2}]
    bad = [{"type": "bedroom", "x": 0, "y": 0, "w": 1.2, "d": 9.0}, {"type": "toilet", "x": 1.2, "y": 0, "w": 4.0, "d": 5.0}]
    assert realism(good, p)["score"] > realism(bad, p)["score"]
