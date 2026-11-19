"""
Unit Tests for SLM Orchestrator Wrapper (Section 6 & 16).
Verifies:
1. 20 real-world briefs translated accurately to ConstraintGraph.
2. Invariant: SLM NEVER outputs structural dimensions or loads directly (0% direct dimension output).
"""
import pytest
from backend.app.services.slm import SLMService
from backend.app.models.constraints import ConstraintGraph


TEST_BRIEFS_20 = [
    # 1. Elder with knee pain
    ("Mom moves in, has acute knee pain, needs ground floor room.", 
     {"elder_present": True, "ground_floor_bedroom_required": True, "no_steps": True}),
    
    # 2. Toddler safety
    ("We have a 2-year old toddler and a playful Labrador dog.",
     {"toddler_present": True, "pet_present": True}),
     
    # 3. WFH remote engineer
    ("I work from home 10 hours a day as a programmer, need quiet office space.",
     {"wfh_present": True}),
     
    # 4. Strict Vaastu
    ("We want 100% strict Vaastu compliance, kitchen in agneya (southeast).",
     {"vaastu_mode": "strict", "kitchen_orientation": "SouthEast"}),
     
    # 5. Japanese Minimalist
    ("Design a zen Japanese wabi sabi aesthetic with tatami inspired spaces.",
     {"preferred_styles": ["japanese"]}),
     
    # 6. Biophilic Forest
    ("Lots of green plants, indoor garden, biophilic forest concept.",
     {"preferred_styles": ["forest"]}),
     
    # 7. Brutalist Concrete
    ("We love raw concrete textures and industrial brutalist architecture.",
     {"preferred_styles": ["brutalist"]}),
     
    # 8. Modern no Vaastu
    ("No vaastu needed, keep it modern layout with open concept living.",
     {"vaastu_mode": "off"}),
     
    # 9. Joint 3-generation family
    ("Joint family with grandparents, 2 toddlers, and working parents.",
     {"joint_family": True, "elder_present": True, "toddler_present": True}),
     
    # 10. Senior citizen with wheelchair
    ("Senior citizen in wheelchair needs wide doors and grab bars.",
     {"elder_present": True, "grab_bars": True, "min_door_width_mm": 900}),
     
    # 11. Pet lover with Golden Retriever
    ("Living with golden retriever, need scratch proof flooring.",
     {"pet_present": True}),
     
    # 12. Dual WFH couple
    ("Both husband and wife work from home with frequent video calls.",
     {"wfh_present": True}),
     
    # 13. Heritage Traditional
    ("Love traditional old is gold Indian courtyard aesthetics.",
     {"preferred_styles": ["old_is_gold"]}),
     
    # 14. Elder grandmother
    ("My grandmother lives with us, cannot climb stairs.",
     {"elder_present": True, "ground_floor_bedroom_required": True}),
     
    # 15. Minimalist clean
    ("Minimalist clean lines, uncluttered warm white palette.",
     {"preferred_styles": ["minimalist"]}),
     
    # 16. Soft Vaastu with East prayer
    ("Soft vaastu belief, east facing prayer space is desirable.",
     {"vaastu_mode": "soft", "puja_orientation": "East"}),
     
    # 17. High energy infant
    ("Infant and toddler in home, need baby-proof layout.",
     {"toddler_present": True}),
     
    # 18. Japanese + Forest hybrid
    ("Japanese zen look blended with biophilic green forest elements.",
     {"preferred_styles": ["japanese", "forest"]}),
     
    # 19. Remote architect needing study
    ("Remote work studio required with ample daylight.",
     {"wfh_present": True}),
     
    # 20. Multi-generational Mumbai home
    ("Mumbai 30x40 home for 3 generations: grandparents, parents, toddler.",
     {"elder_present": True, "toddler_present": True, "joint_family": True})
]


@pytest.mark.parametrize("user_text,expected_attrs", TEST_BRIEFS_20)
def test_slm_translates_20_briefs(user_text, expected_attrs):
    cg = SLMService.translate_to_constraints(user_text)
    assert isinstance(cg, ConstraintGraph)
    for attr, expected_val in expected_attrs.items():
        actual_val = getattr(cg, attr)
        if isinstance(expected_val, list):
            for item in expected_val:
                assert item in actual_val, f"Brief '{user_text}': Expected style {item} in {actual_val}"
        else:
            assert actual_val == expected_val, f"Brief '{user_text}': Expected {attr}={expected_val}, got {actual_val}"


def test_slm_strict_zero_dimension_invariant():
    """
    CRITICAL LOCKED RULE 1:
    SLM MUST NEVER output a structural dimension (column size, beam depth, load, slope, etc.).
    Verification: ConstraintGraph model fields must contain ZERO structural dimension fields.
    """
    forbidden_keys = [
        "column_size", "beam_depth", "column_size_mm", "beam_depth_mm",
        "load_tons", "pipe_slope", "cement_bags", "steel_kg", "cost_inr",
        "footing_depth", "wall_thickness"
    ]
    
    for user_text, _ in TEST_BRIEFS_20:
        cg = SLMService.translate_to_constraints(user_text)
        cg_dict = cg.model_dump()
        
        # Check top-level keys
        for key in cg_dict.keys():
            assert key not in forbidden_keys, f"Invariant violation: SLM produced structural key '{key}'"
            
        # Check constraints string content does not prescribe column/beam dimensions
        for c in cg.constraints:
            assert "column" not in c.lower(), f"Invariant violation: SLM prescribed column in constraint: {c}"
            assert "beam" not in c.lower(), f"Invariant violation: SLM prescribed beam in constraint: {c}"
            assert "load" not in c.lower(), f"Invariant violation: SLM prescribed load in constraint: {c}"


def test_slm_explanation_includes_numbers_and_reasons():
    """
    LOCKED RULE 5:
    Every output has Reason + Number.
    """
    col_exp = SLMService.explain_decision("column", {"load_tons": 14.5, "soil_bearing_kn_m2": 120.0, "size_mm": 230})
    assert "14.5 tons" in col_exp
    assert "120.0 kN/m2" in col_exp
    assert "IS 456" in col_exp

    beam_exp = SLMService.explain_decision("beam", {"span_m": 4.8, "depth_mm": 300})
    assert "300mm" in beam_exp
    assert "4.8m" in beam_exp
    assert "IS 456:2000" in beam_exp
