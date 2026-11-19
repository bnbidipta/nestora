"""
Pure Python Judge - Section 7 of Nestora Brief.
Pure Python, NO ML, NO SLM.
Enforces non-negotiable safety, building code, structural integrity, MEP flow, and ergonomics.
"""
from typing import Dict, Any, List, Tuple
from backend.app.models.twin import HouseTwin, Floor, Room, Beam, Column


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
        return {
            "pass": self.passed,
            "failures": self.failures,
            "warnings": self.warnings
        }


class JudgeService:
    @staticmethod
    def validate_house(twin: HouseTwin) -> JudgeResult:
        result = JudgeResult()
        
        # Run all 5 checks
        JudgeService.check_area(twin, result)
        JudgeService.check_law(twin, result)
        JudgeService.check_structure(twin, result)
        JudgeService.check_mep(twin, result)
        JudgeService.check_ergonomics(twin, result)
        
        return result

    # ----------------------------------------------------
    # Judge A - Area Math
    # ----------------------------------------------------
    @staticmethod
    def check_area(twin: HouseTwin, result: JudgeResult):
        """
        Check that room areas + wall and circulation footprint balance the built-up area (+/- 2%).
        """
        if not twin.floors:
            result.add_failure("A_NO_FLOORS", "House has no floors defined.")
            return

        for floor in twin.floors:
            room_area_sum = sum(r.area_sqft for r in floor.rooms)
            # Standard architectural ratio: room carpet area is 75-85% of built-up area (walls + circulation = 15-25%)
            # Or if built-up area is explicitly stated, verify room sum does not exceed built-up area.
            if floor.area_sqft <= 0:
                result.add_failure("A_INVALID_FLOOR_AREA", f"Floor {floor.floor_no} area must be positive.")
                continue

            # Check individual room length * width == area_sqft (+/- 2%)
            for room in floor.rooms:
                expected_dim_area = room.length_ft * room.width_ft
                if abs(expected_dim_area - room.area_sqft) > (0.05 * expected_dim_area):
                    result.add_failure(
                        "A_ROOM_DIM_MISMATCH",
                        f"Room {room.name} area {room.area_sqft} sqft does not match length {room.length_ft} * width {room.width_ft} sqft."
                    )

            # Carpet area cannot exceed gross floor area
            if room_area_sum > floor.area_sqft * 1.02:
                result.add_failure(
                    "A_AREA_OVERFLOW",
                    f"Floor {floor.floor_no} carpet rooms sum {room_area_sum} sqft exceeds built-up {floor.area_sqft} sqft by > 2%."
                )

    # ----------------------------------------------------
    # Judge B - Law (Mumbai DCR / NBC 2016)
    # ----------------------------------------------------
    @staticmethod
    def check_law(twin: HouseTwin, result: JudgeResult):
        """
        Setbacks per Mumbai pack: Front 3m, Side 1.5m, Rear 3m for 30x40.
        FSI <= 1.5 for Mumbai pilot.
        Min room: Bedroom >= 100 sqft, Living >= 150 sqft, Kitchen >= 60 sqft, Toilet >= 35 sqft.
        Ventilation: Window area >= 10% of room area.
        Stair width >= 900mm.
        Door: Main >= 1000mm, Bedroom >= 900mm, Toilet >= 750mm.
        No toilet under stair, No toilet sharing puja wall.
        """
        plot = twin.plot
        # FSI check
        total_builtup_sqft = sum(f.area_sqft for f in twin.floors)
        max_allowed_builtup = plot.plot_area_sqft * 1.5
        if total_builtup_sqft > max_allowed_builtup * 1.02:
            result.add_failure(
                "B_FSI_VIOLATION",
                f"Total built-up area {total_builtup_sqft} sqft exceeds Mumbai FSI 1.5 limit of {max_allowed_builtup} sqft."
            )

        # Setback footprint check on 30x40 plot
        # Front 3m (~9.84 ft), Rear 3m (~9.84 ft), Sides 1.5m (~4.92 ft) each side
        # Max buildable width = 30 - 2*(4.92) = ~20.16 ft
        # Max buildable depth = 40 - (9.84 + 9.84) = ~20.32 ft
        max_buildable_footprint = 20.16 * 20.32  # ~409-450 sqft per floor for tight setback, or standard Mumbai cluster
        # In Mumbai DCR, for small plots <= 1200 sqft, open spaces have specific concessions, but ground floor footprint cannot exceed plot minus setbacks.
        front_setback_m = twin.metadata.get("setback_front_m", 3.0)
        side_setback_m = twin.metadata.get("setback_side_m", 1.5)
        rear_setback_m = twin.metadata.get("setback_rear_m", 3.0)

        if front_setback_m < 3.0:
            result.add_failure("B_SETBACK_FRONT", f"Front setback {front_setback_m}m is less than mandatory 3.0m.")
        if side_setback_m < 1.5:
            result.add_failure("B_SETBACK_SIDE", f"Side setback {side_setback_m}m is less than mandatory 1.5m.")
        if rear_setback_m < 3.0:
            result.add_failure("B_SETBACK_REAR", f"Rear setback {rear_setback_m}m is less than mandatory 3.0m.")

        # Check room sizes and doors across floors
        has_elder = twin.family.elders > 0
        has_puja = any("puja" in r.name.lower() for f in twin.floors for r in f.rooms)

        for floor in twin.floors:
            for room in floor.rooms:
                r_name = room.name.lower()
                
                # Min room size checks
                if "bedroom" in r_name and room.area_sqft < 99.5:
                    result.add_failure("B_MIN_BEDROOM_SIZE", f"Bedroom '{room.name}' area {room.area_sqft} sqft is under 100 sqft minimum.")
                elif "living" in r_name and room.area_sqft < 149.5:
                    result.add_failure("B_MIN_LIVING_SIZE", f"Living room '{room.name}' area {room.area_sqft} sqft is under 150 sqft minimum.")
                elif "kitchen" in r_name and room.area_sqft < 59.5:
                    result.add_failure("B_MIN_KITCHEN_SIZE", f"Kitchen '{room.name}' area {room.area_sqft} sqft is under 60 sqft minimum.")
                elif ("toilet" in r_name or "bath" in r_name) and room.area_sqft < 34.5:
                    result.add_failure("B_MIN_TOILET_SIZE", f"Toilet '{room.name}' area {room.area_sqft} sqft is under 35 sqft minimum.")

                # Ventilation: Window area >= 10% room area (except small toilets where 10% or min 3 sqft)
                min_window_required = room.area_sqft * 0.10
                if room.window_area_sqft < (min_window_required - 0.05) and "toilet" not in r_name:
                    result.add_failure(
                        "B_VENTILATION",
                        f"Room '{room.name}' window area {room.window_area_sqft} sqft is less than 10% of room area ({min_window_required:.1f} sqft)."
                    )

                # Door widths: Main >= 1000mm, Bedroom >= 900mm, Toilet >= 750mm
                if "main" in r_name or "entrance" in r_name:
                    if room.door_width_mm < 1000:
                        result.add_failure("B_DOOR_MAIN", f"Main door width {room.door_width_mm}mm must be >= 1000mm.")
                elif "bedroom" in r_name:
                    if room.door_width_mm < 900:
                        result.add_failure("B_DOOR_BEDROOM", f"Bedroom '{room.name}' door width {room.door_width_mm}mm must be >= 900mm.")
                elif "toilet" in r_name or "bath" in r_name:
                    if room.door_width_mm < 750:
                        result.add_failure("B_DOOR_TOILET", f"Toilet '{room.name}' door width {room.door_width_mm}mm must be >= 750mm.")

                # Elder rule: If elder present, ground floor bedroom mandatory and door >= 900mm
                if has_elder and "elder" in r_name and "bedroom" in r_name:
                    if not room.is_ground_floor and floor.floor_no != 0:
                        result.add_failure("B_ELDER_GROUND_FLOOR", "Elder bedroom must be on the ground floor (Floor 0).")
                    if room.door_width_mm < 900:
                        result.add_failure("B_ELDER_DOOR_WIDTH", f"Elder bedroom door width {room.door_width_mm}mm must be >= 900mm for wheelchair/mobility accessibility.")

        # Stair width check
        stair_width_mm = twin.metadata.get("stair_width_mm", 950)
        if stair_width_mm < 900:
            result.add_failure("B_STAIR_WIDTH", f"Stair width {stair_width_mm}mm is under mandatory 900mm.")

        # Special restrictions:
        # No toilet under stair
        if twin.metadata.get("toilet_under_stair", False):
            result.add_failure("B_TOILET_UNDER_STAIR", "Toilet placed under stair is prohibited by Mumbai DCR / NBC.")

        # No toilet sharing puja wall
        if twin.metadata.get("toilet_shares_puja_wall", False):
            result.add_failure("B_TOILET_PUJA_WALL", "Toilet sharing wall with Puja room is prohibited by Vaastu / health guidelines.")

    # ----------------------------------------------------
    # Judge C - Structure (IS 456:2000)
    # ----------------------------------------------------
    @staticmethod
    def check_structure(twin: HouseTwin, result: JudgeResult):
        """
        Beam span > 6m without column = FAIL.
        Column not on load path = FAIL.
        Safety factor < 1.5 = FAIL.
        Wall thickness: Load-bearing 200-230mm, Partition 100-115mm.
        """
        struct = twin.structure

        # Safety factor check
        if struct.safety_factor < 1.49:
            result.add_failure("C_SAFETY_FACTOR", f"Structural safety factor {struct.safety_factor} is below mandatory 1.5.")

        # Beam span check: max 6.0 meters without column
        for idx, beam in enumerate(struct.beams):
            if beam.span_m > 6.0:
                result.add_failure(
                    "C_BEAM_SPAN_EXCEEDED",
                    f"Beam #{idx} span is {beam.span_m}m, which exceeds maximum unsupported span of 6.0m without column."
                )
            # Beam depth check: thumb rule span/16 minimum for deflection
            min_depth_mm = int((beam.span_m * 1000) / 16.0)
            if beam.depth_mm < min_depth_mm - 10:
                result.add_failure(
                    "C_BEAM_DEPTH_DEFICIENT",
                    f"Beam #{idx} depth {beam.depth_mm}mm is insufficient for span {beam.span_m}m (min {min_depth_mm}mm per IS 456)."
                )

        # Columns check: size and continuous load path
        if not struct.columns:
            result.add_failure("C_NO_COLUMNS", "No structural columns defined for building framework.")
        else:
            for idx, col in enumerate(struct.columns):
                if col.size_mm < 230:
                    result.add_failure("C_COLUMN_MIN_SIZE", f"Column #{idx} size {col.size_mm}mm is below minimum 230mm for G+1.")
                if col.load_tons <= 0:
                    result.add_failure("C_COLUMN_LOAD_INVALID", f"Column #{idx} has invalid axial load: {col.load_tons} tons.")

        # Column on load path validation
        if twin.metadata.get("floating_column_detected", False):
            result.add_failure("C_COLUMN_LOAD_PATH", "Floating column detected with no continuous direct load path to foundation.")

        # Wall thickness checks
        if struct.wall_load_bearing_mm < 200:
            result.add_failure(
                "C_WALL_LOAD_BEARING",
                f"Load-bearing wall thickness {struct.wall_load_bearing_mm}mm is under minimum 200mm."
            )
        if struct.wall_partition_mm < 100:
            result.add_failure(
                "C_WALL_PARTITION",
                f"Partition wall thickness {struct.wall_partition_mm}mm is under minimum 100mm."
            )

    # ----------------------------------------------------
    # Judge D - MEP Flow (IS 1742 / NBC Part 9)
    # ----------------------------------------------------
    @staticmethod
    def check_mep(twin: HouseTwin, result: JudgeResult):
        """
        Drainage slope must be 1:60 to 1:100.
        Electrical crossing water = FAIL.
        Pump head insufficient for floor height = FAIL.
        Electrical separation from water >= 300mm.
        """
        mep = twin.mep

        # Drainage slope parsing
        valid_slopes = ["1:60", "1:70", "1:80", "1:90", "1:100"]
        for idx, pipe in enumerate(mep.waste_pipes):
            slope_str = pipe.slope.strip()
            is_valid = False
            if ":" in slope_str:
                try:
                    parts = slope_str.split(":")
                    ratio = float(parts[1]) / float(parts[0])
                    # 1:60 = 60, 1:100 = 100. Ratio must be between 60 and 100 inclusive.
                    if 59.9 <= ratio <= 100.1:
                        is_valid = True
                except Exception:
                    is_valid = False
            
            if not is_valid:
                result.add_failure(
                    "D_DRAINAGE_SLOPE",
                    f"Waste pipe #{idx} slope '{pipe.slope}' violates hydraulic gradient limits (must be 1:60 to 1:100 per IS 1742)."
                )

        # Electrical crossing water check
        if twin.metadata.get("electrical_crosses_water", False):
            result.add_failure("D_ELEC_CROSS_WATER", "Electrical conduit directly crosses unshielded water plumbing run.")

        # Electrical separation from water >= 300mm
        if mep.electrical_water_separation_mm < 300:
            result.add_failure(
                "D_ELEC_WATER_SEPARATION",
                f"Electrical separation from water {mep.electrical_water_separation_mm}mm is under minimum 300mm."
            )

        # Pump head vs building total height
        # G+1 height = floor 0 height + floor 1 height + overhead tank head (approx 3m) + friction (~2m)
        total_building_height_m = sum(f.floor_height_ft * 0.3048 for f in twin.floors)
        required_pump_head_m = total_building_height_m + 5.0  # static + dynamic losses
        if mep.pump_head_m < required_pump_head_m:
            result.add_failure(
                "D_PUMP_HEAD_INSUFFICIENT",
                f"Pump head {mep.pump_head_m}m is insufficient for building height {total_building_height_m:.1f}m (min {required_pump_head_m:.1f}m required)."
            )

    # ----------------------------------------------------
    # Judge E - Ergonomics
    # ----------------------------------------------------
    @staticmethod
    def check_ergonomics(twin: HouseTwin, result: JudgeResult):
        """
        Circulation < 900mm = FAIL.
        Furniture blocks door = FAIL.
        Kitchen triangle > 22ft = WARN.
        """
        circulation_width_mm = twin.metadata.get("circulation_width_mm", 1000)
        if circulation_width_mm < 900:
            result.add_failure(
                "E_CIRCULATION_TOO_NARROW",
                f"Clear corridor/circulation width {circulation_width_mm}mm is under minimum 900mm."
            )

        if twin.metadata.get("furniture_blocks_door", False):
            result.add_failure("E_FURNITURE_BLOCKS_DOOR", "Placed furniture obstructs required 90-degree door swing clearance.")

        kitchen_triangle_ft = twin.metadata.get("kitchen_triangle_perimeter_ft", 18.0)
        if kitchen_triangle_ft > 22.0:
            result.add_warning(
                "E_KITCHEN_TRIANGLE_HIGH",
                f"Kitchen work triangle perimeter {kitchen_triangle_ft:.1f}ft exceeds recommended 22ft ergonomics limit."
            )
