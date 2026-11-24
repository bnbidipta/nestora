"""
Stage API: thin wrappers over the same stage functions the orchestrator runs, one implementation per stage.
POST /api/v1/stages/{stage} with a Brief returns that stage's output for the best-ranked design.
"""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException

from backend.app.models.brief import Brief
from backend.app.models.twin import HouseTwin
from backend.app.services import derive, orchestrator, pack, traditions
from backend.app.services.access import rate_limit
from backend.app.services.judge import JudgeService

router = APIRouter(prefix="/api/v1/stages", tags=["Stages"])
Stage = Literal["plot", "layout", "structure", "mep", "boq", "style", "traditions", "judge",
                "climate", "sound", "paint", "materials", "furniture", "mep_routes", "land", "suggestions"]


@router.post("/{stage}", dependencies=[Depends(rate_limit("stages", 10))])
def run_stage(stage: Stage, brief: Brief):
    W, D = brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT
    rules = pack.rules(W, D, brief.road_width_m, brief.city)
    if stage == "plot":
        return {"rules": rules, "envelope": pack.envelope(W, D, rules), "stair": pack.stair_box(rules)}
    good = orchestrator._pool(brief, {}, seed=0)
    if not good:
        raise HTTPException(status_code=422, detail=orchestrator.infeasible_reason(brief))
    cand, ev = good[0]
    twin = HouseTwin(house_id="stage")
    derive.apply(twin, brief, cand)
    out = {
        "layout": {"floors": [f.model_dump() for f in twin.floors], "dropped": cand["layout"]["dropped"], "strategy": cand["strategy"]},
        "structure": twin.structure.model_dump(),
        "mep": twin.mep.model_dump(),
        "boq": twin.metadata["boq"],
        "style": {"style": derive.styles()[twin.style.primary_style], "secondary": twin.style.secondary_style},
        "traditions": traditions.evaluate(cand, brief.facing, brief.traditions),
        "judge": JudgeService.validate_house(twin).to_dict(),
        "climate": twin.climate, "sound": twin.sound, "paint": twin.paint, "materials": twin.materials,
        "furniture": twin.furniture, "mep_routes": twin.mep_routes, "land": twin.land, "suggestions": twin.suggestions,
    }
    return {"stage": stage, "candidate": cand["id"], "score": ev["score"]["total"], "data": out[stage]}
