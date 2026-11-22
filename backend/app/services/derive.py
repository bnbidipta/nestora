"""
Everything downstream of the chosen layout, computed (never hardcoded): rooms in the twin, structure,
MEP, finishes and a tiered BOQ with low/expected/high ranges from the rates pack.
Structural sizing is IS 456 thumb-rule *preliminary* sizing and must be checked by a structural engineer.
"""
import json
import math
import os
from functools import cache
from typing import Any, Dict, List

from backend.app.models.brief import Brief
from backend.app.models.twin import (
    ACUnit, BOQ, Beam, ColorWall, Column, Floor, Foundation, HouseTwin, MEP, Room, Structure, StyleInfo, WastePipe,
)
from backend.app.services import generator, pack
from backend.app.services.judge import required_pump_head_m

FT = pack.FT
SQFT = FT * FT
MAX_GRID_M = 4.5          # target column spacing
LOAD_KN_M2 = 12.0         # dead + live + walls per floor, preliminary
CONC_N_MM2 = 10.7         # 0.4 fck(20) x 0.99 + 0.67 fy(415) x 1% steel, IS 456 cl. 39.3
TIERS = ("economy", "standard", "premium")


@cache
def styles() -> Dict[str, Dict[str, Any]]:
    with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "styles.json"), encoding="utf-8") as f:
        return {s["id"]: s for s in json.load(f)["styles"]}


def colour(name: str, hexv: str) -> ColorWall:
    """RGB/CMYK and an approximate LRV (relative luminance x 100) from a hex colour."""
    rgb = [int(hexv[i:i + 2], 16) for i in (1, 3, 5)]
    lin = [((c / 255) / 12.92) if c / 255 <= 0.04045 else (((c / 255) + 0.055) / 1.055) ** 2.4 for c in rgb]
    lrv = round(100 * (0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]))
    k = 1 - max(rgb) / 255
    cmy = [0, 0, 0] if k >= 1 else [round(100 * (1 - c / 255 - k) / (1 - k)) for c in rgb]
    return ColorWall(name=name, rgb=",".join(map(str, rgb)), cmyk=",".join(map(str, cmy + [round(100 * k)])), lrv=lrv, hex=hexv)


def _floor_material(t: str, style: Dict[str, Any], brief: Brief) -> str:
    if t in ("toilet", "kitchen", "balcony", "porch"):
        return "anti_skid_ceramic" if t != "porch" else "paver_blocks"
    if t == "stair":
        return "granite"
    if brief.elder_mobility_issue and t in ("bedroom_elder", "living", "passage"):
        return "anti_skid_vitrified"
    if brief.pets and style["materials"]["floor"] in ("wood_flooring", "oak_flooring", "teak_wood"):
        return "wood_look_tiles"  # scratch resistant
    return style["materials"]["floor"]


def _door_mm(rm: Dict[str, Any], brief: Brief, r: Dict[str, Any]) -> int:
    t = rm["type"]
    wide = brief.elder_mobility_issue and ("elder" in rm["id"] or t in ("living", "entrance"))
    if t in ("entrance", "living") and rm["floor"] == (1 if rm.get("stilt") else 0):
        return max(r["door_main_mm"], 1050 if wide else 0)
    if t == "toilet":
        return 900 if "elder" in rm["id"] and brief.elders else r["door_toilet_mm"]
    if t in ("bedroom", "bedroom_master", "bedroom_elder", "study", "lounge", "kitchen"):
        return 1000 if wide else r["door_habitable_mm"]
    return r["door_habitable_mm"]


def build_floors(brief: Brief, cand: Dict[str, Any]) -> List[Floor]:
    r, env = cand["rules"], cand["envelope"]
    st = styles().get((brief.styles or ["indian_contemporary"])[0], styles()["indian_contemporary"])
    pal = st["palette"]
    floors = []
    for f in sorted({rm["floor"] for rm in cand["layout"]["rooms"]}):
        rooms = []
        for rm in sorted((x for x in cand["layout"]["rooms"] if x["floor"] == f), key=lambda x: (x["y"], x["x"])):
            l, w = round(rm["w"] / FT, 2), round(rm["d"] / FT, 2)
            area = round(l * w, 1)
            needs_window = rm["hab"] or rm["type"] == "kitchen"
            window = round(area * r["window_ratio"] * 1.2, 1) if rm["exterior"] and needs_window else (4.0 if rm["exterior"] and rm["wet"] else 0.0)
            wall = pal["wall"] if rm["type"] not in ("toilet", "kitchen") else "#F4F6F6"
            rooms.append(Room(
                name=rm["id"], type=rm["type"], length_ft=l, width_ft=w, area_sqft=area, window_area_sqft=window,
                door_width_mm=_door_mm(dict(rm, stilt=cand["layout"].get("stilt")), brief, r),
                color_wall_A=colour(f"{st['name']} wall", wall),
                color_accent=colour(f"{st['name']} accent", pal["accent"]) if rm["hab"] else None,
                material_floor=_floor_material(rm["type"], st, brief),
                x=round(rm["x"] / FT, 2), y=round(rm["y"] / FT, 2), is_ground_floor=f == 0,
                has_attached_bath=rm["type"] in ("bedroom_master", "bedroom_elder"),
                exterior=rm["exterior"], compass=generator.compass(rm, env, brief.facing),
            ))
        h = pack.FLOOR_HEIGHT_M / FT
        floors.append(Floor(floor_no=f, floor_height_ft=round(h, 2), clear_height_ft=round(2.75 / FT, 2),
                            area_sqft=round(sum(x.area_sqft for x in rooms), 1), rooms=rooms))
    return floors


def _grid(edges: List[float], total: float) -> List[float]:
    """Column lines: start at 0, end at total, prefer room edges, never further apart than MAX_GRID_M."""
    lines, pos = [0.0], 0.0
    cands = sorted({round(e, 3) for e in edges if 0.5 < e < total - 0.5})
    while total - pos > MAX_GRID_M + 1e-6:
        ok = [e for e in cands if pos + 1.5 <= e <= pos + MAX_GRID_M]
        pos = max(ok) if ok else pos + min(MAX_GRID_M, (total - pos) / 2)
        lines.append(round(pos, 3))
    lines.append(round(total, 3))
    return lines


def build_structure(brief: Brief, cand: Dict[str, Any]) -> Structure:
    r, env = cand["rules"], cand["envelope"]
    rooms = cand["layout"]["rooms"]
    xs = _grid([e for rm in rooms for e in (rm["x"], rm["x"] + rm["w"])], env["width_m"])
    ys = _grid([e for rm in rooms for e in (rm["y"], rm["y"] + rm["d"])], env["depth_m"])
    n_floors = cand["floors"]
    cols: List[Column] = []
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            tx = ((x - xs[i - 1]) if i else 0) / 2 + ((xs[i + 1] - x) if i + 1 < len(xs) else 0) / 2
            ty = ((y - ys[j - 1]) if j else 0) / 2 + ((ys[j + 1] - y) if j + 1 < len(ys) else 0) / 2
            p_kn = tx * ty * LOAD_KN_M2 * n_floors
            ac = 1.5 * p_kn * 1000 / CONC_N_MM2
            depth = max(r["min_column_mm"], int(math.ceil(ac / 230 / 25) * 25))
            cols.append(Column(
                x=round(x / FT, 2), y=round(y / FT, 2), size_mm=230, size_y_mm=depth, load_tons=round(p_kn / 9.81, 1),
                reason=f"Tributary {tx * ty:.1f} m² × {LOAD_KN_M2:.0f} kN/m² × {n_floors} floor(s) = {p_kn:.0f} kN; factored 1.5×, "
                       f"IS 456 cl. 39.3 short column at 1% steel → 230×{depth} mm (preliminary)."))
    beams: List[Beam] = []
    for line, others in ((xs, ys), (ys, xs)):
        for a, b in zip(others, others[1:]):
            span = round(b - a, 2)
            depth = max(230, int(math.ceil(span * 1000 / r["span_depth_ratio"] / 25) * 25) + 50)
            for _ in line:
                beams.append(Beam(span_m=span, depth_mm=depth, width_mm=230,
                                  reason=f"Span {span} m ÷ {r['span_depth_ratio']:.0f} = {span * 1000 / r['span_depth_ratio']:.0f} mm + 50 mm cover margin → {depth} mm."))
    sbc = {"hard_rock": 300.0, "red_soil": 180.0}.get(twin_soil(brief), r["soil_bearing_kn_m2"])
    max_load = max(c.load_tons for c in cols) * 9.81
    footing_side = math.sqrt(max_load * 1.1 / sbc)
    footing_total = sum(c.load_tons * 9.81 * 1.1 / sbc for c in cols)
    raft = footing_total > 0.5 * env["area_m2"] or footing_side > 2.5
    depth_m = 1.8 if twin_soil(brief) == "black_cotton" else 1.5
    found = Foundation(
        type="raft" if raft else "isolated", depth_ft=round(depth_m / FT, 1), bearing_capacity_kn_m2=sbc,
        reason=(f"Largest column {max_load:.0f} kN on {sbc:.0f} kN/m² soil needs a {footing_side:.1f} m footing; "
                f"footings would cover {footing_total / env['area_m2']:.0%} of the footprint → {'raft' if raft else 'isolated footings'}. "
                f"Depth {depth_m} m for {twin_soil(brief).replace('_', ' ')} soil. Needs a soil test."))
    return Structure(columns=cols, beams=beams, foundation=found, safety_factor=1.5, wall_load_bearing_mm=230, wall_partition_mm=115)


def twin_soil(brief: Brief) -> str:
    return brief.soil


def build_mep(twin: HouseTwin, brief: Brief) -> MEP:
    pts = {"bedroom": 8, "bedroom_master": 10, "bedroom_elder": 9, "living": 12, "lounge": 8, "kitchen": 10, "toilet": 4,
           "study": 8, "dining": 5, "puja": 2, "passage": 2, "stair": 3, "balcony": 2, "porch": 3, "entrance": 2}
    rooms = [x for f in twin.floors for x in f.rooms]
    acs = []
    if brief.tier != "economy":
        for x in rooms:
            if x.type in ("bedroom", "bedroom_master", "bedroom_elder", "living"):
                m2 = x.area_sqft * SQFT
                acs.append(ACUnit(type="split", tonnage=1.0 if m2 <= 12 else 1.5 if m2 <= 20 else 2.0, room=x.name))
    return MEP(
        electrical_points=sum(pts.get(x.type or "", 3) for x in rooms),
        waste_pipes=[WastePipe(type="soil", dia_mm=110, slope="1:60"), WastePipe(type="waste", dia_mm=75, slope="1:80")],
        pump_head_m=required_pump_head_m(twin), electrical_water_separation_mm=350, ac_units=acs)


def _rate(node: Dict[str, Any], k: str) -> float:
    return float(node[k])


def build_boq(twin: HouseTwin, brief: Brief, cand: Dict[str, Any]) -> Dict[str, Any]:
    """Quantities from thumb rules; costs as low/expected/high for each finish tier. Rates exclude GST."""
    rp = pack.rates(brief.city)
    sqft = sum(f.area_sqft for f in twin.floors)
    c = {k: v["value"] for k, v in rp["consumption_thumb_rules_per_sqft"].items()}
    qty = {"cement_bags": sqft * c["cement_bags"], "steel_kg": sqft * c["steel_kg"],
           "sand_tons": sqft * c["sand_cft"] * 0.0283 * 1.6, "aggregate_tons": sqft * c["aggregate_cft"] * 0.0283 * 1.5,
           "bricks": sqft * c["bricks"]}
    m, lab, mep = rp["materials"], rp["labour"], rp["mep_per_sqft"]
    wall_sqft = 2.5 * sqft  # both faces of walls, rough
    found = twin.structure.foundation
    fp_m2 = cand["envelope"]["area_m2"]
    found_m3 = fp_m2 * 0.3 if found.type == "raft" else sum(col.load_tons * 9.81 * 1.1 / found.bearing_capacity_kn_m2 for col in twin.structure.columns) * 0.45
    out: Dict[str, Any] = {"tiers": {}, "rates_as_of": rp["rates_as_of"], "rates_verified": rp.get("verified", False),
                           "gst_note": rp.get("gst_note"), "built_up_sqft": round(sqft)}
    for tier in TIERS:
        fin = rp["finishes_per_sqft"][tier]
        rng = {}
        for k in ("low", "expected", "high"):
            structure = (qty["cement_bags"] * _rate(m["cement_opc53_bag_50kg"], k) + qty["steel_kg"] * _rate(m["steel_fe500d_kg"], k)
                         + qty["sand_tons"] * _rate(m["m_sand_ton"], k) + qty["aggregate_tons"] * _rate(m["aggregate_20mm_ton"], k)
                         + sqft * _rate(lab["rcc_frame_per_sqft_builtup"], k))
            masonry = qty["bricks"] * _rate(m["red_brick_each"], k) + 1.2 * sqft * _rate(lab["masonry_per_sqft"], k) + wall_sqft * _rate(lab["plaster_per_sqft"], k)
            foundation = found_m3 * (_rate(m["rmc_m25_m3"], k) + 80 * _rate(m["steel_fe500d_kg"], k))
            finishing = 0.8 * sqft * _rate(fin["flooring"], k) + wall_sqft * _rate(fin["paint"], k) + sqft * _rate(fin["doors_windows_lumpsum_per_sqft"], k)
            services = sqft * (_rate(mep["electrical"], k) + _rate(mep["plumbing"], k))
            sub = foundation + structure + masonry + finishing + services
            rng[k] = {"foundation": foundation, "structure": structure, "masonry_plaster": masonry, "finishing": finishing,
                      "mep": services, "contingency": 0.10 * sub, "total": 1.10 * sub}
        out["tiers"][tier] = {k: {a: round(b) for a, b in v.items()} for k, v in rng.items()}
    out["quantities"] = {k: round(v, 1) for k, v in qty.items()}
    return out


def emi(principal: float, annual_rate_pct: float = 8.5, years: int = 20) -> float:
    i = annual_rate_pct / 1200
    n = years * 12
    return principal / n if i == 0 else principal * i * (1 + i) ** n / ((1 + i) ** n - 1)


def apply(twin: HouseTwin, brief: Brief, cand: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Writes the candidate into the twin. Returns explainability records."""
    r, env = cand["rules"], cand["envelope"]
    twin.plot.plot_width_ft, twin.plot.plot_depth_ft = brief.plot_width_ft, brief.plot_depth_ft
    twin.plot.plot_area_sqft = brief.plot_width_ft * brief.plot_depth_ft
    twin.plot.road_width_ft = round(brief.road_width_m / FT, 1)
    twin.plot.orientation = {"N": "North", "E": "East", "S": "South", "W": "West"}[brief.facing]
    twin.family.adults, twin.family.elders, twin.family.toddlers = brief.adults, brief.elders, brief.kids
    twin.family.pets = [] if not brief.pets else twin.family.pets
    twin.family.wfh_members, twin.family.joint_family = brief.wfh_people, brief.joint_family
    twin.family.disabilities = ["mobility"] if brief.elder_mobility_issue else []
    twin.family.faith = ",".join(f"{k}:{v}" for k, v in brief.traditions.items())
    twin.budget.total_budget_inr = brief.budget_inr
    twin.floors = build_floors(brief, cand)
    twin.structure = build_structure(brief, cand)
    twin.mep = build_mep(twin, brief)
    boq = build_boq(twin, brief, cand)
    exp = boq["tiers"][brief.tier]["expected"]
    q = boq["quantities"]
    twin.boq = BOQ(cement_bags=round(q["cement_bags"]), steel_kg=round(q["steel_kg"]), sand_tons=q["sand_tons"],
                   aggregate_tons=q["aggregate_tons"], bricks_count=round(q["bricks"]),
                   cost_breakdown={k: float(v) for k, v in exp.items() if k != "total"},
                   total_cost_inr=float(exp["total"]), monthly_emi_inr=round(emi(0.8 * exp["total"])))
    st = styles().get((brief.styles or ["indian_contemporary"])[0], styles()["indian_contemporary"])
    twin.style = StyleInfo(primary_style=st["id"], secondary_style=(brief.styles[1] if len(brief.styles) > 1 else st["compatible"][0]),
                           mix_pct="70/30", taste_vector=twin.style.taste_vector)
    built = generator.built_up_m2(cand["layout"]) / SQFT
    twin.metadata.update({
        "city": brief.city, "road_width_m": brief.road_width_m,
        "setback_front_m": r["setback_front_m"], "setback_side_m": r["setback_side_m"], "setback_rear_m": r["setback_rear_m"],
        "envelope_width_ft": round(env["width_m"] / FT, 2), "envelope_depth_ft": round(env["depth_m"] / FT, 2),
        "fsi_built_up_sqft": round(built, 1), "fsi_used": round(built / twin.plot.plot_area_sqft, 2),
        "fsi_base": r["fsi_base"], "fsi_max": r["fsi_max"], "stair_width_mm": int(r["stair_min_width_m"] * 1000),
        "pack_verified": r["verified"], "boq": boq, "candidate_id": cand["id"], "strategy": cand["strategy"],
        "dropped_rooms": cand["layout"]["dropped"], "brief": brief.model_dump(),
    })
    decisions = [
        {"field": "setbacks", "value": f"{r['setback_front_m']}/{r['setback_side_m']}/{r['setback_rear_m']} m", "source": "pack", "rule": r["setback_source"],
         "reason": f"Plot {twin.plot.plot_area_sqft * SQFT:.0f} m² → buildable {env['width_m']:.2f} × {env['depth_m']:.2f} m."},
        {"field": "fsi", "value": f"{built:.0f} sqft ({built / twin.plot.plot_area_sqft:.2f})", "source": "pack", "rule": r["fsi_source"],
         "reason": f"Cap {r['fsi_max']} for a {brief.road_width_m:.0f} m road; base {r['fsi_base']}."},
        {"field": "floors", "value": cand["floors"], "source": "user" if cand["floors"] == brief.floors_wanted else "generator",
         "reason": "As requested." if cand["floors"] == brief.floors_wanted else f"You asked for {brief.floors_wanted}; this option uses {cand['floors']} so the rooms fit."},
        {"field": "parking", "value": cand["strategy"]["parking"] + (" (stilt)" if cand["strategy"]["stilt"] else ""),
         "source": "user" if cand["strategy"]["parking"] == brief.parking else "generator",
         "reason": "As requested." if cand["strategy"]["parking"] == brief.parking else "A car stall (2.5 × 5 m) doesn't fit beside the essential rooms on this plot."},
        {"field": "style", "value": st["name"], "source": "taste" if brief.styles else "default", "reason": st["mumbai"]},
        {"field": "foundation", "value": twin.structure.foundation.type, "source": "derived", "reason": twin.structure.foundation.reason},
        {"field": "budget", "value": f"₹{exp['total']:,.0f} ({brief.tier})", "source": "rates",
         "reason": f"Rates as of {boq['rates_as_of']}, unverified, excl. GST. Your budget ₹{brief.budget_inr:,.0f}."},
    ]
    if cand["layout"]["dropped"]:
        decisions.append({"field": "dropped_rooms", "value": ", ".join(cand["layout"]["dropped"]), "source": "generator",
                          "reason": "These optional rooms didn't fit at code-minimum sizes."})
    twin.metadata["decisions"] = decisions
    return decisions
