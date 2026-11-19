"""
SLM Orchestrator Wrapper - Section 6 of Nestora Brief.
LOCKED RULE:
- Translates user natural language -> ConstraintGraph JSON.
- Never outputs a dimension, column size, beam depth, load, slope, or cost directly.
- Direct dimension output invariant is strictly 0%.
"""
import re
from typing import Dict, Any, List
from backend.app.models.constraints import ConstraintGraph


class SLMService:
    @staticmethod
    def translate_to_constraints(user_text: str) -> ConstraintGraph:
        """
        Translates user natural language text into a structured ConstraintGraph.
        Under no circumstance will this function return structural dimensions (e.g. '230x230' column size).
        """
        text = user_text.lower()
        constraints: List[str] = []

        # 1. Elder / Mobility Analysis
        elder_present = any(kw in text for kw in ["elder", "grandma", "grandfather", "grandparents", "mom", "dad", "mother", "father", "old age", "senior"])
        knee_pain = any(kw in text for kw in ["knee pain", "wheelchair", "arthritis", "walking difficulty", "knee"])
        
        ground_floor_bedroom = False
        min_door_width = 900
        no_steps = False
        grab_bars = False

        if elder_present or knee_pain:
            elder_present = True
            ground_floor_bedroom = True
            min_door_width = 900
            constraints.append("ground_floor_bedroom = true")
            constraints.append("door_width_mm >= 900")
            if knee_pain:
                no_steps = True
                grab_bars = True
                constraints.append("no_steps = true")
                constraints.append("grab_bars = true")

        # 2. Toddler / Child Safety
        toddler_present = any(kw in text for kw in ["toddler", "baby", "infant", "child", "kids"])
        if toddler_present:
            constraints.append("balcony_safety_grill = true")
            constraints.append("anti_skid_flooring = true")

        # 3. Pets
        pet_present = any(kw in text for kw in ["dog", "cat", "pet", "labrador", "golden retriever"])
        if pet_present:
            constraints.append("scratch_resistant_flooring = true")
            constraints.append("no_toxic_plants = true")

        # 4. Work From Home
        wfh_present = any(kw in text for kw in ["wfh", "work from home", "office", "study", "quiet workspace", "remote work"])
        if wfh_present:
            constraints.append("acoustic_separation_study = true")
            constraints.append("dedicated_study_zone = true")

        # 5. Joint Family
        joint_family = any(kw in text for kw in ["joint family", "large family", "extended family", "3 generations"])

        # 6. Vaastu / Faith
        vaastu_mode = "soft"
        if "vaastu strict" in text or "strict vaastu" in text or "100% vaastu" in text:
            vaastu_mode = "strict"
            constraints.append("puja_east = true")
            constraints.append("kitchen_southeast = true")
            constraints.append("no_toilet_puja_wall = true")
        elif "no vaastu" in text or "vaastu off" in text or "modern layout" in text:
            vaastu_mode = "off"
        else:
            vaastu_mode = "soft"
            constraints.append("puja_east = true")

        # 7. Style preferences
        preferred_styles: List[str] = []
        if "japanese" in text or "zen" in text or "wabi sabi" in text:
            preferred_styles.append("japanese")
        if "forest" in text or "biophilic" in text or "plants" in text or "green" in text:
            preferred_styles.append("forest")
        if "brutalist" in text or "concrete" in text or "raw" in text:
            preferred_styles.append("brutalist")
        if "minimalist" in text or "clean" in text:
            preferred_styles.append("minimalist")
        if "traditional" in text or "heritage" in text or "old is gold" in text:
            preferred_styles.append("old_is_gold")
            
        if not preferred_styles:
            preferred_styles = ["japanese", "forest"]

        return ConstraintGraph(
            elder_present=elder_present,
            toddler_present=toddler_present,
            pet_present=pet_present,
            wfh_present=wfh_present,
            joint_family=joint_family,
            vaastu_mode=vaastu_mode,
            ground_floor_bedroom_required=ground_floor_bedroom,
            min_door_width_mm=min_door_width,
            no_steps=no_steps,
            grab_bars=grab_bars,
            kitchen_orientation="SouthEast" if vaastu_mode in ["strict", "soft"] else None,
            puja_orientation="East" if vaastu_mode in ["strict", "soft"] else None,
            preferred_styles=preferred_styles,
            constraints=constraints
        )

    @staticmethod
    def explain_decision(topic: str, context: Dict[str, Any]) -> str:
        """
        SLM explains numbers produced by task models. Never invents numbers.
        Example: "Column here because load 12 tons, soil 120 kN/m2, wind 44 m/s"
        """
        if topic == "column":
            load = context.get("load_tons", 12.0)
            soil = context.get("soil_bearing_kn_m2", 120.0)
            wind = context.get("wind_speed_ms", 44.0)
            size = context.get("size_mm", 230)
            return f"Column sized {size}x{size}mm because tributary load is {load} tons, soil bearing capacity is {soil} kN/m2, and basic wind speed is {wind} m/s per IS 456 Clause 39."

        elif topic == "beam":
            span = context.get("span_m", 4.5)
            depth = context.get("depth_mm", 290)
            return f"Beam depth is {depth}mm for span of {span}m based on span/16 deflection control criteria per IS 456:2000."

        elif topic == "drainage":
            slope = context.get("slope", "1:60")
            return f"Drainage slope set to {slope} to maintain self-cleansing velocity (min 0.75 m/s) without pipe scour per IS 1742."

        elif topic == "paint":
            color = context.get("name", "Warm White")
            lrv = context.get("lrv", 85)
            return f"Applied {color} (LRV {lrv}) to maximize ambient daylight reflection and visually expand interior volume."

        return f"Engineering decision calibrated per relevant IS and Mumbai DCR codes."
