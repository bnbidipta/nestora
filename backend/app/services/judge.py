"""
Judge: pure-Python rule engine. No ML. Every threshold comes from the city code pack (services/pack.py),
and every geometric check reads the actual room rectangles in the House Twin.
Rule ids: A_ area/geometry, B_ law, C_ structure, D_ MEP, E_ ergonomics.
"""
from typing import Any, Dict, List

from backend.app.models.twin import HouseTwin
from backend.app.services import pack

FT = pack.FT
SQFT = FT * FT
TOL = 0.02  # 2% numeric tolerance on areas


class JudgeResult:
    def __init__(self):
        self.passed: bool = True
        self.failures: List[Dict[str, str]] = []
        self.warnings: List[Dict[str, str]] = []

    def add_failure(self, rule_id: str, message: str):
        self.passed = False
        self.failures.append({"rule_id": rule_id, "message": message})

    def add_warning(self, rule_id: str, message: str):
        self.warnings.append({"rule_id": rule_id, "message": message})

    def to_dict(self) -> Dict[str, Any]:
        return {"pass": self.passed, "failures": self.failures, "warnings": self.warnings}


def _rules(twin: HouseTwin) -> Dict[str, Any]:
    p = twin.plot
    road_m = twin.metadata.get("road_width_m", p.road_width_ft * FT)
    return pack.rules(p.plot_width_ft * FT, p.plot_depth_ft * FT, road_m, twin.metadata.get("city", "mumbai"))


def _kind(name: str, rtype: str = None) -> str:
    n = (rtype or name).lower()
    for k in ("lift", "bedroom", "living", "lounge", "study", "kitchen", "toilet", "stair", "passage", "porch", "puja", "dining", "balcony", "help", "laundry"):
        if k in n:
            return k
    if "bath" in n:
        return "toilet"
    return "other"


HABITABLE = ("bedroom", "living", "lounge", "study", "help")


class JudgeService:
    @staticmethod
    def validate_house(twin: HouseTwin) -> JudgeResult:
        result = JudgeResult()
        r = _rules(twin)
        JudgeService.check_area(twin, result, r)
        JudgeService.check_law(twin, result, r)
        JudgeService.check_structure(twin, result, r)
        JudgeService.check_mep(twin, result, r)
        JudgeService.check_ergonomics(twin, result, r)
        return result

    # ---------------------------------------------------------------- A: area & geometry
    @staticmethod
    def check_area(twin: HouseTwin, result: JudgeResult, r: Dict[str, Any] = None):
        if not twin.floors:
            result.add_failure("A_NO_FLOORS", "House has no floors defined.")
            return
        env_w = twin.metadata.get("envelope_width_ft")
        env_d = twin.metadata.get("envelope_depth_ft")
        for floor in twin.floors:
            rooms = floor.rooms
            for room in rooms:
                exp = room.length_ft * room.width_ft
                if abs(exp - room.area_sqft) > TOL * exp + 0.5:
                    result.add_failure("A_ROOM_DIM_MISMATCH", f"{room.name}: area {room.area_sqft} sqft ≠ {room.length_ft} × {room.width_ft} ft.")
                if env_w and env_d:
                    if room.x < -0.05 or room.y < -0.05 or room.x + room.length_ft > env_w + 0.05 or room.y + room.width_ft > env_d + 0.05:
                        result.add_failure("A_OUTSIDE_ENVELOPE", f"Floor {floor.floor_no} {room.name} extends outside the buildable area left by the setbacks.")
            for i, a in enumerate(rooms):
                for b in rooms[i + 1:]:
                    ox = min(a.x + a.length_ft, b.x + b.length_ft) - max(a.x, b.x)
                    oy = min(a.y + a.width_ft, b.y + b.width_ft) - max(a.y, b.y)
                    if ox > 0.1 and oy > 0.1:
                        result.add_failure("A_ROOMS_OVERLAP", f"Floor {floor.floor_no}: {a.name} and {b.name} overlap by {ox * oy:.0f} sqft.")
            room_sum = sum(x.area_sqft for x in rooms)
            if floor.area_sqft <= 0:
                result.add_failure("A_INVALID_FLOOR_AREA", f"Floor {floor.floor_no} area must be positive.")
            elif room_sum > floor.area_sqft * (1 + TOL):
                result.add_failure("A_AREA_OVERFLOW", f"Floor {floor.floor_no}: rooms total {room_sum:.0f} sqft, more than the floor's {floor.area_sqft:.0f} sqft.")

    # ---------------------------------------------------------------- B: law
    @staticmethod
    def check_law(twin: HouseTwin, result: JudgeResult, r: Dict[str, Any] = None):
        r = r or _rules(twin)
        md = twin.metadata
        src = f" ({r['setback_source']}, unverified)"
        for side, key in (("FRONT", "front"), ("SIDE", "side"), ("REAR", "rear")):
            have = md.get(f"setback_{key}_m", r[f"setback_{key}_m"])
            need = r[f"setback_{key}_m"]
            if have < need - 1e-6:
                result.add_failure(f"B_SETBACK_{side}", f"{key.title()} setback {have} m is less than the required {need} m{src}.")

        plot_sqft = twin.plot.plot_width_ft * twin.plot.plot_depth_ft
        built = md.get("fsi_built_up_sqft", sum(f.area_sqft for f in twin.floors))
        if built > plot_sqft * r["fsi_max"] * (1 + TOL):
            result.add_failure("B_FSI_VIOLATION", f"Built-up {built:.0f} sqft exceeds FSI {r['fsi_max']} ({plot_sqft * r['fsi_max']:.0f} sqft) — {r['fsi_source']}.")
        elif built > plot_sqft * r["fsi_base"] * (1 + TOL):
            result.add_warning("B_FSI_PREMIUM", f"Built-up {built:.0f} sqft uses more than base FSI {r['fsi_base']}; premium FSI/TDR must be purchased.")

        height_m = sum(f.floor_height_ft for f in twin.floors) * FT
        if height_m > r["max_height_m"] + 0.01:
            result.add_failure("B_HEIGHT", f"Building height {height_m:.1f} m exceeds {r['max_height_m']} m.")

        hab_min = r["habitable_min_m2"] / SQFT
        hab_w = r["habitable_min_width_m"] / FT
        has_elder = twin.family.elders > 0
        for floor in twin.floors:
            for room in floor.rooms:
                k = _kind(room.name, room.type)
                short = min(room.length_ft, room.width_ft)
                if k in HABITABLE and k not in ("study", "help"):
                    if room.area_sqft < hab_min * (1 - TOL):
                        result.add_failure("B_MIN_HABITABLE_AREA", f"{room.name} is {room.area_sqft:.0f} sqft; habitable rooms need {hab_min:.0f} sqft.")
                    if short < hab_w * (1 - TOL):
                        result.add_failure("B_MIN_HABITABLE_WIDTH", f"{room.name} is {short:.1f} ft wide; habitable rooms need {hab_w:.1f} ft.")
                if k == "kitchen" and room.area_sqft < r["kitchen_min_m2"] / SQFT * (1 - TOL):
                    result.add_failure("B_MIN_KITCHEN_SIZE", f"{room.name} is {room.area_sqft:.0f} sqft; kitchens need {r['kitchen_min_m2'] / SQFT:.0f} sqft.")
                if k == "toilet" and room.area_sqft < r["toilet_min_m2"] / SQFT * (1 - TOL):
                    result.add_failure("B_MIN_TOILET_SIZE", f"{room.name} is {room.area_sqft:.0f} sqft; toilets need {r['toilet_min_m2'] / SQFT:.0f} sqft.")
                if k in HABITABLE or k == "kitchen":
                    if room.exterior is False:
                        result.add_failure("B_NO_OUTSIDE_WALL", f"{room.name} has no outside wall, so it can't have the required window.")
                    need = room.area_sqft * r["window_ratio"]
                    if room.window_area_sqft < need - 0.05:
                        result.add_failure("B_VENTILATION", f"{room.name} window {room.window_area_sqft:.1f} sqft is under {need:.1f} sqft ({r['window_ratio']:.0%} of floor area).")
                if k == "toilet" and room.exterior is False:
                    result.add_warning("B_TOILET_DUCT", f"{room.name} is internal; it needs a ventilation shaft or mechanical exhaust.")
                main = "main" in room.name.lower() or "entrance" in room.name.lower()
                if main and room.door_width_mm < r["door_main_mm"]:
                    result.add_failure("B_DOOR_MAIN", f"Main door {room.door_width_mm} mm is under {r['door_main_mm']} mm.")
                elif k == "bedroom" and room.door_width_mm < r["door_habitable_mm"]:
                    result.add_failure("B_DOOR_BEDROOM", f"{room.name} door {room.door_width_mm} mm is under {r['door_habitable_mm']} mm.")
                elif k == "toilet" and room.door_width_mm < r["door_toilet_mm"]:
                    result.add_failure("B_DOOR_TOILET", f"{room.name} door {room.door_width_mm} mm is under {r['door_toilet_mm']} mm.")
                if has_elder and "elder" in room.name.lower() and k == "bedroom":
                    if floor.floor_no != 0 or room.is_ground_floor is False:
                        result.add_failure("B_ELDER_GROUND_FLOOR", "The elder's bedroom must be on the ground floor.")
                    if room.door_width_mm < 900:
                        result.add_failure("B_ELDER_DOOR_WIDTH", f"Elder bedroom door {room.door_width_mm} mm must be at least 900 mm.")
                if k == "porch":
                    sw, sl = r["car_stall_m"][0] / FT, r["car_stall_m"][1] / FT
                    if short < sw * (1 - TOL) or max(room.length_ft, room.width_ft) < sl * (1 - TOL):
                        result.add_failure("B_PARKING_STALL", f"Car porch {room.length_ft:.1f}×{room.width_ft:.1f} ft is smaller than a {sw:.1f}×{sl:.1f} ft stall.")

        stairs = [(f.floor_no, x) for f in twin.floors for x in f.rooms if _kind(x.name, x.type) == "stair"]
        if len(twin.floors) > 1 and len({fn for fn, _ in stairs}) < len(twin.floors):
            result.add_failure("B_STAIR_MISSING", "A multi-storey house needs a stair on every floor.")
        if stairs:
            x0, y0 = stairs[0][1].x, stairs[0][1].y
            if any(abs(s.x - x0) > 0.1 or abs(s.y - y0) > 0.1 for _, s in stairs):
                result.add_failure("B_STAIR_NOT_STACKED", "Stairs on different floors don't line up.")
        lifts = [x for f in twin.floors for x in f.rooms if _kind(x.name, x.type) == "lift"]
        if lifts and any(abs(l.x - lifts[0].x) > 0.1 or abs(l.y - lifts[0].y) > 0.1 for l in lifts):
            result.add_failure("B_LIFT_NOT_STACKED", "Lift shafts on different floors don't line up.")
        stair_w = md.get("stair_width_mm", r["stair_min_width_m"] * 1000)
        if stair_w < r["stair_min_width_m"] * 1000:
            result.add_failure("B_STAIR_WIDTH", f"Stair width {stair_w} mm is under {r['stair_min_width_m'] * 1000:.0f} mm.")
        if md.get("toilet_under_stair", False):
            result.add_failure("B_TOILET_UNDER_STAIR", "A toilet under the stair is not allowed (NBC 2016 headroom/ventilation).")
        if md.get("toilet_shares_puja_wall", False):
            result.add_warning("B_TOILET_PUJA_WALL", "A toilet shares a wall with the puja room (tradition, not law).")

    # ---------------------------------------------------------------- C: structure
    @staticmethod
    def check_structure(twin: HouseTwin, result: JudgeResult, r: Dict[str, Any] = None):
        r = r or _rules(twin)
        s = twin.structure
        if s.safety_factor < r["min_safety_factor"] - 0.01:
            result.add_failure("C_SAFETY_FACTOR", f"Safety factor {s.safety_factor} is below {r['min_safety_factor']}.")
        for i, beam in enumerate(s.beams):
            if beam.span_m > r["max_beam_span_m"]:
                result.add_failure("C_BEAM_SPAN_EXCEEDED", f"Beam {i + 1} spans {beam.span_m} m; maximum without an extra column is {r['max_beam_span_m']} m.")
            need = int(beam.span_m * 1000 / r["span_depth_ratio"])
            if beam.depth_mm < need - 10:
                result.add_failure("C_BEAM_DEPTH_DEFICIENT", f"Beam {i + 1} depth {beam.depth_mm} mm is under span/{r['span_depth_ratio']:.0f} = {need} mm.")
        if not s.columns:
            result.add_failure("C_NO_COLUMNS", "No structural columns defined.")
        for i, c in enumerate(s.columns):
            if c.size_mm < r["min_column_mm"]:
                result.add_failure("C_COLUMN_MIN_SIZE", f"Column {i + 1} is {c.size_mm} mm; minimum is {r['min_column_mm']} mm.")
            if c.load_tons <= 0:
                result.add_failure("C_COLUMN_LOAD_INVALID", f"Column {i + 1} has no load assigned.")
        env_w, env_d = twin.metadata.get("envelope_width_ft"), twin.metadata.get("envelope_depth_ft")
        if env_w and env_d and s.columns:
            for cx, cy in ((0, 0), (env_w, 0), (0, env_d), (env_w, env_d)):
                if not any(abs(c.x - cx) < 0.5 and abs(c.y - cy) < 0.5 for c in s.columns):
                    result.add_failure("C_CORNER_COLUMN", f"No column at building corner ({cx:.0f}, {cy:.0f}) ft.")
        if twin.metadata.get("floating_column_detected", False):
            result.add_failure("C_COLUMN_LOAD_PATH", "Floating column with no direct load path to the foundation.")
        if s.wall_load_bearing_mm < 200:
            result.add_failure("C_WALL_LOAD_BEARING", f"External wall {s.wall_load_bearing_mm} mm is under 200 mm.")
        if s.wall_partition_mm < 100:
            result.add_failure("C_WALL_PARTITION", f"Partition wall {s.wall_partition_mm} mm is under 100 mm.")

    # ---------------------------------------------------------------- D: MEP
    @staticmethod
    def check_mep(twin: HouseTwin, result: JudgeResult, r: Dict[str, Any] = None):
        mep = twin.mep
        for i, pipe in enumerate(mep.waste_pipes):
            ok = False
            try:
                a, b = pipe.slope.strip().split(":")
                ok = 59.9 <= float(b) / float(a) <= 100.1
            except (ValueError, ZeroDivisionError):
                pass
            if not ok:
                result.add_failure("D_DRAINAGE_SLOPE", f"Pipe {i + 1} slope '{pipe.slope}' must be between 1:60 and 1:100 (IS 1742).")
        if twin.metadata.get("electrical_crosses_water", False):
            result.add_failure("D_ELEC_CROSS_WATER", "Electrical conduit crosses an unshielded water line.")
        if mep.electrical_water_separation_mm < 300:
            result.add_failure("D_ELEC_WATER_SEPARATION", f"Electrical–water separation {mep.electrical_water_separation_mm} mm is under 300 mm.")
        need = required_pump_head_m(twin)
        if mep.pump_head_m < need - 0.05:
            result.add_failure("D_PUMP_HEAD_INSUFFICIENT", f"Pump head {mep.pump_head_m} m is under the {need:.1f} m needed for this height.")
        wet_x = {}
        for f in twin.floors:
            for x in f.rooms:
                if _kind(x.name, x.type) in ("toilet", "kitchen"):
                    wet_x.setdefault(f.floor_no, []).append(x)
        for fn, wets in wet_x.items():
            if fn == 0:
                continue
            below = wet_x.get(fn - 1, [])
            for w in wets:
                if below and not any(abs((w.x + w.length_ft / 2) - (b.x + b.length_ft / 2)) < 6 and abs((w.y + w.width_ft / 2) - (b.y + b.width_ft / 2)) < 6 for b in below):
                    result.add_warning("D_WET_NOT_STACKED", f"{w.name} isn't above a wet room; its drain runs through a ceiling below.")

    # ---------------------------------------------------------------- E: ergonomics
    @staticmethod
    def check_ergonomics(twin: HouseTwin, result: JudgeResult, r: Dict[str, Any] = None):
        widths = [min(x.length_ft, x.width_ft) * FT * 1000 for f in twin.floors for x in f.rooms if _kind(x.name, x.type) == "passage"]
        circ = twin.metadata.get("circulation_width_mm", min(widths) if widths else 1000)
        if circ < 900:
            result.add_failure("E_CIRCULATION_TOO_NARROW", f"Passage width {circ:.0f} mm is under 900 mm.")
        if twin.metadata.get("furniture_blocks_door", False):
            result.add_failure("E_FURNITURE_BLOCKS_DOOR", "Furniture blocks a door swing.")
        for f in twin.floors:
            for x in f.rooms:
                if _kind(x.name, x.type) == "kitchen":
                    run = max(x.length_ft, x.width_ft)
                    if run > 15:  # sink-stove-fridge spread along a run this long exceeds the ~22-26 ft triangle guideline
                        result.add_warning("E_KITCHEN_TRIANGLE_HIGH", f"{x.name} is {run:.0f} ft long; keep sink, stove and fridge within a 22–26 ft triangle.")
                    if min(x.length_ft, x.width_ft) < 6:
                        result.add_warning("E_KITCHEN_NARROW", f"{x.name} is under 6 ft wide: single-counter galley only.")


def required_pump_head_m(twin: HouseTwin) -> float:
    """Static lift to the overhead tank plus losses. Shared by the MEP stage and the Judge."""
    return round(sum(f.floor_height_ft for f in twin.floors) * FT + 1.5 + 5.0, 1)
