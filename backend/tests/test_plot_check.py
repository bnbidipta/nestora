from backend.app.services import orchestrator


def test_plot_threshold():
    assert not orchestrator.plot_check(20, 30, 9)["ok"]  # 4.1 x 5.6 m buildable: no room for even a compact home
    assert orchestrator.plot_check(30, 40, 9)["ok"]
