"""End-to-end API flow: create -> brief -> swipe -> 4 options -> keep/replace -> choose -> edit -> export."""
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)
BRIEF = {"plot_width_ft": 30, "plot_depth_ft": 50, "road_width_m": 12, "floors_wanted": 2, "parking": "two_wheeler",
         "adults": 2, "elders": 1, "elder_mobility_issue": True, "kids": 1, "puja": "nook", "traditions": {"vaastu": "soft"},
         "styles": ["konkan"], "budget_inr": 6_000_000}


def _new():
    res = client.post("/api/v1/house", json={})
    assert res.status_code == 200
    return res.json()["house_id"], {"X-Edit-Token": res.json()["edit_token"]}


def test_health():
    assert client.get("/health").json()["status"] == "healthy"


def test_full_flow():
    hid, auth = _new()
    r = client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    assert r.status_code == 200 and r.json()["waitlist"] is None
    assert any("ground floor" in s for s in r.json()["understood"])

    cards = client.get("/api/v1/swipe/cards", params={"seed": 1}).json()["cards"]
    for c in cards[:3]:
        assert client.post(f"/api/v1/house/{hid}/swipe", json={"card_id": c["id"], "direction": "right", "dwell_ms": 3500}, headers=auth).status_code == 200

    r = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()
    assert r["success"] and len(r["options"]) == 2 and r["pending"] > 0  # first designs at once
    r = client.get(f"/api/v1/house/{hid}/options", headers=auth).json()  # solver designs joined in the background
    assert r["pending"] == 0 and len(r["options"]) == 4 and len({o["id"] for o in r["options"]}) == 4
    assert all(o["judge"]["pass"] for o in r["options"])
    ids = [o["id"] for o in r["options"]]

    r = client.post(f"/api/v1/house/{hid}/options/select", json={"keep": ids[:1], "discard": ids[1:]}, headers=auth).json()
    assert r["options"][0]["id"] == ids[0] and len(r["options"]) >= 2
    assert any(v != 0 for v in r["prefs"].values())

    r = client.post(f"/api/v1/house/{hid}/options/choose", json={"id": ids[0]}, headers=auth).json()
    assert r["status"] == "ready", r["judge_summary"]
    twin = client.get(f"/api/v1/house/{hid}").json()["data"]
    elder = [x for f in twin["floors"] for x in f["rooms"] if x["name"] == "bedroom_elder"]
    assert elder and twin["floors"][0]["rooms"] and any(x["name"] == "bedroom_elder" for x in twin["floors"][0]["rooms"])
    assert twin["metadata"]["boq"]["tiers"]["standard"]["expected"]["total"] > 0

    r = client.post(f"/api/v1/house/{hid}/edit", json={"action": "mirror"}, headers=auth)
    assert r.status_code == 200 and r.json()["status"] == "ready"

    dxf = client.get(f"/api/v1/house/{hid}/export/dxf")
    assert dxf.status_code == 200 and "ENTITIES" in dxf.text and "bedroom_elder" in dxf.text


def test_writes_need_the_edit_token():
    hid, _ = _new()
    assert client.post(f"/api/v1/house/{hid}/brief", json=BRIEF).status_code == 403
    assert client.post(f"/api/v1/house/{hid}/options").status_code == 403


def test_waitlist_for_flats_and_other_cities():
    hid, auth = _new()
    assert client.post(f"/api/v1/house/{hid}/brief", json={**BRIEF, "build_type": "flat_interior"}, headers=auth).json()["waitlist"] == "flat_interior"
    assert client.post(f"/api/v1/house/{hid}/brief", json={**BRIEF, "city": "pune"}, headers=auth).json()["waitlist"] == "city"


def test_tiny_plot_is_reported_infeasible_not_faked():
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json={**BRIEF, "plot_width_ft": 18, "plot_depth_ft": 25, "road_width_m": 6}, headers=auth)
    r = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()
    assert r["status"] == "infeasible" and "setbacks" in r["reason"]


def test_catalogues_and_extract():
    assert len(client.get("/api/v1/styles").json()["styles"]) >= 40
    assert len(client.get("/api/v1/traditions").json()["traditions"]) == 7
    f = client.post("/api/v1/brief/extract", json={"text": "My mother has knee pain and we have a dog"}).json()["fields"]
    assert f.get("elder_mobility_issue") is True and f.get("pets") is True


def test_style_deck_is_filtered_and_has_no_duplicate_photos():
    allc = client.get("/api/v1/swipe/cards", params={"seed": 1}).json()["cards"]
    assert allc and len({c["file"] for c in allc}) == len(allc)
    from backend.app.api.swipe import photos
    shas = [p["sha1"] for v in photos().values() for p in v]
    assert len(shas) == len(set(shas))  # no image used twice, across styles
    two = client.get("/api/v1/swipe/cards", params={"styles": "goan_portuguese,georgian"}).json()["cards"]
    assert two and {c["style"] for c in two} == {"goan_portuguese", "georgian"}


def test_what_if_preview_then_keep():
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json={**BRIEF, "plot_width_ft": 40, "plot_depth_ft": 60}, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth)
    assert client.post(f"/api/v1/house/{hid}/whatif", json={"change": "study", "apply": True}, headers=auth).status_code == 409  # preview first
    r = client.post(f"/api/v1/house/{hid}/whatif", json={"change": "study"}, headers=auth)
    assert r.status_code == 200, r.text
    assert any(p["t"] == "study" for p in r.json()["preview"])
    r = client.post(f"/api/v1/house/{hid}/whatif", json={"change": "study", "apply": True}, headers=auth)
    assert r.status_code == 200 and r.json()["status"] in ("ready", "needs_review")
    twin = client.get(f"/api/v1/house/{hid}").json()["data"]
    assert any(rm["type"] == "study" for f in twin["floors"] for rm in f["rooms"])


def test_family_vote_and_versions():
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    tok = client.post(f"/api/v1/house/{hid}/vote-link", headers=auth).json()["token"]
    assert client.get(f"/api/v1/house/{hid}/vote", params={"t": "wrong"}).status_code == 403
    board = client.get(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    assert len(client.get(f"/api/v1/house/{hid}/vote", params={"t": tok}).json()["options"]) == len(board)
    r = client.post(f"/api/v1/house/{hid}/vote", json={"token": tok, "voter": "browser-aaaa1", "name": "Amma", "likes": [opts[1]["id"], "bogus"]})
    assert r.json()["tally"] == {opts[1]["id"]: ["Amma"]}
    assert client.get(f"/api/v1/house/{hid}/votes", headers=auth).json()["people"] == 1
    client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth)
    assert client.post(f"/api/v1/house/{hid}/edit", json={"action": "mirror"}, headers=auth).status_code == 200
    vs = client.get(f"/api/v1/house/{hid}/versions").json()["versions"]
    assert len(vs) == 1
    assert client.post(f"/api/v1/house/{hid}/versions/0/restore", headers=auth).status_code == 200


def test_vote_state_not_public():
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    tok = client.post(f"/api/v1/house/{hid}/vote-link", headers=auth).json()["token"]
    client.post(f"/api/v1/house/{hid}/vote", json={"token": tok, "voter": "browser-secret1", "name": "Amma", "likes": [opts[0]["id"]]})
    body = client.get(f"/api/v1/house/{hid}").text
    assert "vote" not in client.get(f"/api/v1/house/{hid}").json()["data"]["metadata"] and "browser-secret1" not in body


def test_exterior_choices_and_text():
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth)
    r = client.post(f"/api/v1/house/{hid}/exterior", json={"choices": {"railing": "glass", "window": "nope"}, "text": "exposed brick walls"}, headers=auth)
    assert r.status_code == 200, r.text
    ex = client.get(f"/api/v1/house/{hid}").json()["data"]["metadata"]["look"]["exterior"]
    assert ex["railing"] == "glass" and ex["wall"][0] == "exposed_brick" and ex["window"] != "nope"


def test_render_queued_and_requeued_on_change():
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth)
    r1 = client.get(f"/api/v1/house/{hid}").json()["data"]["metadata"]["render"]
    assert r1["status"] == "queued" and r1["key"]
    client.post(f"/api/v1/house/{hid}/exterior", json={"choices": {"railing": "glass"}}, headers=auth)
    r2 = client.get(f"/api/v1/house/{hid}").json()["data"]["metadata"]["render"]
    assert r2["status"] == "queued" and r2["key"] != r1["key"]  # a changed look needs a new photo


def test_photo_request_falls_back_to_queue_without_gpu():
    import base64, io
    from PIL import Image
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    buf = io.BytesIO(); Image.new("RGB", (64, 36), "white").save(buf, "PNG")
    img = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    assert client.post(f"/api/v1/house/{hid}/photo", json={"image": img}, headers=auth).status_code == 409  # no design chosen yet
    client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth)
    assert client.post(f"/api/v1/house/{hid}/photo", json={"image": "data:image/png;base64,bm90IGEgcG5n"}, headers=auth).status_code == 422
    r = client.post(f"/api/v1/house/{hid}/photo", json={"image": img}, headers=auth)
    assert r.status_code == 200
    render = client.get(f"/api/v1/house/{hid}").json()["data"]["metadata"]["render"]
    assert render["status"] == "queued" and render.get("fallback")  # no GPU configured in tests -> Kaggle queue


def test_photo_rejects_huge_png_header_and_repeat_requests():
    import base64, io, struct, zlib
    from PIL import Image
    hid, auth = _new()
    client.post(f"/api/v1/house/{hid}/brief", json=BRIEF, headers=auth)
    opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json()["options"]
    client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth)
    ihdr = struct.pack(">IIBBBBB", 30000, 30000, 8, 2, 0, 0, 0)  # claims 30000 x 30000: refused before decoding
    bomb = b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + ihdr + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr))
    assert client.post(f"/api/v1/house/{hid}/photo", json={"image": "data:image/png;base64," + base64.b64encode(bomb).decode()}, headers=auth).status_code == 422
    buf = io.BytesIO(); Image.new("RGB", (64, 36), "white").save(buf, "PNG")
    img = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    first = client.post(f"/api/v1/house/{hid}/photo", json={"image": img}, headers=auth).json()["render"]
    again = client.post(f"/api/v1/house/{hid}/photo", json={"image": img}, headers=auth).json()["render"]
    assert again.get("fallback") and again["key"] == first["key"]  # already queued: no second job
