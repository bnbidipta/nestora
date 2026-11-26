"""
Phase F: builds the 50-design set for licensed architects to rate (see docs/architect-review-packet.md).
python -m backend.eval.review_set  ->  backend/eval/out/review/{brief_id}.dxf + ratings.csv (one row per design)
Picks briefs spread across plot sizes, floors, elders, parking and traditions. Writes nothing to house storage.
"""
import csv
import os

from fastapi.testclient import TestClient

from backend.app.models.brief import brief_from_dict

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "out", "review")


def main(n: int = 50):
    os.environ["NESTORA_STORAGE_DIR"] = os.path.join(HERE, "out", "review_store")
    os.environ["NESTORA_RATE_LIMIT"] = "off"
    os.makedirs(os.environ["NESTORA_STORAGE_DIR"], exist_ok=True)
    from backend.app.services import repository
    repository.STORAGE_DIR, repository.USE_SUPABASE = os.environ["NESTORA_STORAGE_DIR"], False
    from backend.app.main import app
    client = TestClient(app)
    import json
    rows = json.load(open(os.path.join(HERE, "briefs.json"), encoding="utf-8"))
    seen, picked = set(), []
    for r in rows:  # one brief per (plot, floors, elder, parking, tradition) combination, for spread
        key = (r["plot_width_ft"], r["plot_depth_ft"], r["floors_wanted"], r["elders"] > 0, r["parking"], tuple(sorted(r["traditions"])))
        if key not in seen:
            seen.add(key)
            picked.append(r)
    os.makedirs(OUT, exist_ok=True)
    out_rows = []
    for r in picked:
        if len(out_rows) >= n:
            break
        b = brief_from_dict(r)
        c = client.post("/api/v1/house", json={}).json()
        hid, auth = c["house_id"], {"X-Edit-Token": c["edit_token"]}
        client.post(f"/api/v1/house/{hid}/brief", json=b.model_dump(), headers=auth)
        opts = client.post(f"/api/v1/house/{hid}/options", headers=auth).json().get("options") or []
        if not opts:
            continue
        res = client.post(f"/api/v1/house/{hid}/options/choose", json={"id": opts[0]["id"]}, headers=auth).json()
        if res.get("status") != "ready":
            continue
        open(os.path.join(OUT, f"{r['id']}.dxf"), "w", encoding="utf-8").write(client.get(f"/api/v1/house/{hid}/export/dxf").text)
        t = client.get(f"/api/v1/house/{hid}").json()["data"]
        md = t["metadata"]
        out_rows.append({
            "brief_id": r["id"], "plot_ft": f"{r['plot_width_ft']}x{r['plot_depth_ft']}", "road_m": r["road_width_m"],
            "floors": len(t["floors"]), "family": f"{r['adults']}A {r['elders']}E {r['kids']}K", "parking": md["strategy"]["parking"],
            "traditions": ";".join(f"{k}:{v}" for k, v in r["traditions"].items()), "built_up_sqft": md["fsi_built_up_sqft"],
            "cost_expected_inr": md["boq"]["tiers"][b.tier]["expected"]["total"], "dropped": ";".join(md["dropped_rooms"]),
            "dxf": f"{r['id']}.dxf", "rating_1_to_5": "", "would_stamp_after_edits_y_n": "", "main_problem": "", "reviewer": "",
        })
    with open(os.path.join(OUT, "ratings.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0]))
        w.writeheader()
        w.writerows(out_rows)
    print(f"{len(out_rows)} designs written to {OUT}")


if __name__ == "__main__":
    main()
