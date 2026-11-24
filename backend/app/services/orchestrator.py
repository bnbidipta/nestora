"""
Orchestrator: brief -> candidate pool -> (derive -> Judge -> traditions -> rank) per candidate
-> 4-at-a-time keep/replace loop -> chosen design written to the House Twin.

Stages are plain functions; the Judge gates every candidate (failing candidates are never shown).
Generators: A = template arrangements + row fitter (generator.py), B = LLM topology proposer (llm.py),
C1 = learned ranker (rank.py).
"""
import logging
import random
from typing import Any, Dict, List, Optional, Tuple

from backend.app.models.brief import Brief
from backend.app.models.twin import HouseTwin
from backend.app.services import derive, generator, llm, rank, traditions
from backend.app.services.judge import JudgeService
from backend.app.services.repository import HouseTwinRepository

log = logging.getLogger(__name__)
SHOW = 4
POOL_KEEP = 20
FT = 0.3048


def brief_of(twin: HouseTwin) -> Brief:
    return Brief(**twin.metadata.get("brief", {}))


def _preview(c: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Compact geometry (ft) for drawing option thumbnails."""
    return [{"f": r["floor"], "id": r["id"], "t": r["type"], "x": round(r["x"] / FT, 1), "y": round(r["y"] / FT, 1),
             "w": round(r["w"] / FT, 1), "d": round(r["d"] / FT, 1)} for r in c["layout"]["rooms"]]


def evaluate(brief: Brief, c: Dict[str, Any], prefs: Dict[str, float]) -> Dict[str, Any]:
    twin = HouseTwin(house_id="eval")
    derive.apply(twin, brief, c, engines=False)
    judge = JudgeService.validate_house(twin)
    trad = traditions.evaluate(c, brief.facing, brief.traditions)
    s = rank.score(brief, c, prefs, trad["score"], len(judge.warnings))
    tier = twin.metadata["boq"]["tiers"][brief.tier]
    return {
        "id": c["id"], "pass": judge.passed and not trad["veto"], "judge": judge.to_dict(), "veto": trad["veto"],
        "traditions": {k: {"mode": v["mode"], "score": v["score"]} for k, v in trad["packs"].items()},
        "score": s,
        "summary": {
            "floors": c["floors"], "parking": c["strategy"]["parking"], "stilt": c["strategy"]["stilt"],
            "arrangement": c["arrangement"], "built_up_sqft": twin.metadata["fsi_built_up_sqft"],
            "fsi_used": twin.metadata["fsi_used"],
            "bedrooms": sum(1 for f in twin.floors for r in f.rooms if (r.type or "").startswith("bedroom")),
            "cost_inr": {k: tier[k]["total"] for k in ("low", "expected", "high")},
            "dropped": c["layout"]["dropped"],
            "envelope_ft": [twin.metadata["envelope_width_ft"], twin.metadata["envelope_depth_ft"]],
        },
        "preview": _preview(c),
    }


def _pool(brief: Brief, prefs: Dict[str, float], seed: int) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    extra = []
    if any(v != "off" for v in brief.traditions.values()):
        extra.append(traditions.arrangement_for(brief.facing, brief.traditions))
    proposal = llm.propose_arrangement(brief)
    if proposal:
        extra.append(proposal)
    cands = generator.candidates(brief, n=24, seed=seed, extra_arrangements=extra)
    scored = [(c, evaluate(brief, c, prefs)) for c in cands]
    good = [x for x in scored if x[1]["pass"]]
    if len(good) < SHOW:  # strict traditions vetoed most code-compliant layouts: top up with the closest, flagged
        relaxed = sorted((x for x in scored if x[1]["judge"]["pass"] and not x[1]["pass"]), key=lambda x: -x[1]["score"]["total"])
        for _, e in relaxed:
            e["tradition_relaxed"] = True
        good = good + relaxed
    good.sort(key=lambda x: -x[1]["score"]["total"])
    return good


def _diverse(items: List[Tuple[Dict[str, Any], Dict[str, Any]]], k: int, exclude: set) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Best-first, but each pick must differ from earlier picks in strategy, arrangement or mirroring."""
    out, sigs = [], set()
    for c, e in items:
        if c["id"] in exclude:
            continue
        sig = (str(c["strategy"]), c["arrangement"], c["layout"]["stair_left"])
        if sig in sigs:
            continue
        sigs.add(sig)
        out.append((c, e))
        if len(out) == k:
            return out
    for c, e in items:  # top up if not enough distinct ones
        if len(out) == k:
            break
        if c["id"] not in exclude and all(c["id"] != o[0]["id"] for o in out):
            out.append((c, e))
    return out


def infeasible_reason(brief: Brief) -> str:
    from backend.app.services import pack
    W, D = brief.plot_width_ft * FT, brief.plot_depth_ft * FT
    r = pack.rules(W, D, brief.road_width_m, brief.city)
    env = pack.envelope(W, D, r)
    return (f"After the required setbacks ({r['setback_front_m']} m front, {r['setback_side_m']} m sides, {r['setback_rear_m']} m rear) "
            f"the buildable area is only {env['width_m']:.1f} × {env['depth_m']:.1f} m. That is too small to fit a stair and "
            f"code-minimum rooms (habitable rooms {r['habitable_min_m2']} m², at least {r['habitable_min_width_m']} m wide). "
            "Options: a row-house or gaothan plot with relaxed side setbacks, a single-storey studio, or a larger plot. "
            "An architect can check whether your plot qualifies for relaxations.")


def start_options(house_id: str, seed: Optional[int] = None) -> Dict[str, Any]:
    twin = _get(house_id)
    brief = brief_of(twin)
    seed = seed if seed is not None else random.randrange(1 << 30)
    prefs = twin.metadata.get("prefs", {})
    good = _pool(brief, prefs, seed)
    if not good:
        twin.status = "infeasible"
        twin.metadata["infeasible_reason"] = infeasible_reason(brief)
        HouseTwinRepository.save(twin)
        return {"success": False, "status": "infeasible", "reason": twin.metadata["infeasible_reason"], "options": []}
    shown = _diverse(good, SHOW, set())
    twin.metadata.update({
        "pool": [c for c, _ in good[:POOL_KEEP]] + [c for c, _ in shown if c not in [g[0] for g in good[:POOL_KEEP]]],
        "options": [e for _, e in shown], "round": 1, "seed": seed, "prefs": prefs,
        "labels": twin.metadata.get("labels", []), "seen": [c["id"] for c, _ in shown],
    })
    twin.status = "choosing"
    HouseTwinRepository.save(twin)
    return {"success": True, "status": "choosing", "round": 1, "options": twin.metadata["options"], "pool_size": len(good)}


def select(house_id: str, keep: List[str], discard: List[str]) -> Dict[str, Any]:
    """Records keep/discard labels, updates preference weights, replaces discarded options."""
    twin = _get(house_id)
    brief = brief_of(twin)
    md = twin.metadata
    pool = {c["id"]: c for c in md.get("pool", [])}
    current = {e["id"]: e for e in md.get("options", [])}
    keep = [k for k in keep if k in current]
    discard = [d for d in discard if d in current and d not in keep]
    kept_f = [rank.features(pool[k]) for k in keep if k in pool]
    disc_f = [rank.features(pool[d]) for d in discard if d in pool]
    prefs = rank.update(md.get("prefs", {}), kept_f, disc_f)
    rng = random.Random(md.get("seed", 0) + md.get("round", 1))
    seen = set(md.get("seen", []))
    new: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
    for _ in discard:
        found = None
        for _attempt in range(8):  # mutate a kept option first: "more like this one"
            if not keep:
                break
            child = generator.mutate(brief, pool[rng.choice(keep)], rng)
            if child and child["id"] not in seen:
                ev = evaluate(brief, child, prefs)
                if ev["pass"]:
                    found = (child, ev)
                    break
        if not found:  # fall back to the best unseen pool candidate under the updated preferences
            rest = [(c, evaluate(brief, c, prefs)) for cid, c in pool.items() if cid not in seen]
            rest = [x for x in rest if x[1]["pass"]]
            rest.sort(key=lambda x: -x[1]["score"]["total"])
            found = rest[0] if rest else None
        if found:
            new.append(found)
            seen.add(found[0]["id"])
            pool[found[0]["id"]] = found[0]
    options = [evaluate(brief, pool[k], prefs) for k in keep] + [e for _, e in new]
    if not options:
        options = [current[k] for k in current]
    md["labels"] = md.get("labels", []) + [{"round": md.get("round", 1), "keep": keep, "discard": discard}]
    md.update({"pool": list(pool.values())[-60:], "options": options, "round": md.get("round", 1) + 1, "prefs": prefs, "seen": sorted(seen)})
    HouseTwinRepository.save(twin)
    return {"success": True, "status": "choosing", "round": md["round"], "options": options, "prefs": prefs,
            "exhausted": len(new) < len(discard)}


def choose(house_id: str, cand_id: str) -> Dict[str, Any]:
    twin = _get(house_id)
    brief = brief_of(twin)
    cand = next((c for c in twin.metadata.get("pool", []) if c["id"] == cand_id), None)
    if not cand:
        raise ValueError("That option is no longer available.")
    return _commit(twin, brief, cand, [f"Option {cand_id} chosen by the user."])


def _commit(twin: HouseTwin, brief: Brief, cand: Dict[str, Any], trace: List[str]) -> Dict[str, Any]:
    decisions = derive.apply(twin, brief, cand)
    trace.append(f"Derived structure ({len(twin.structure.columns)} columns, {twin.structure.foundation.type}), MEP and BOQ.")
    trad = traditions.evaluate(cand, brief.facing, brief.traditions)
    judge = JudgeService.validate_house(twin)
    twin.metadata["final_judge"] = judge.to_dict()
    twin.metadata["traditions"] = trad["packs"]
    twin.metadata["chosen"] = cand["id"]
    twin.metadata["chosen_candidate"] = cand
    twin.metadata.pop("pool", None)  # keep the stored twin small once a design is chosen
    twin.status = "ready" if judge.passed else "needs_review"
    trace.append(f"Judge: {'pass' if judge.passed else 'fail'} ({len(judge.failures)} failures, {len(judge.warnings)} warnings).")
    HouseTwinRepository.save(twin)
    return {"success": judge.passed, "house_id": twin.house_id, "status": twin.status, "execution_trace": trace,
            "judge_summary": judge.to_dict(), "decisions": decisions}


def commit_edit(house_id: str, brief: Brief, cand: Dict[str, Any], note: str) -> Dict[str, Any]:
    return _commit(_get(house_id), brief, cand, [note])


def _get(house_id: str) -> HouseTwin:
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise ValueError(f"House '{house_id}' not found.")
    return twin


class OrchestrationDAG:
    """One-shot generation (best-ranked option), kept for the existing /generate endpoint."""

    @staticmethod
    def run_pipeline(house_id: str) -> Dict[str, Any]:
        twin = _get(house_id)
        brief = brief_of(twin)
        trace = [f"Brief: {brief.plot_width_ft:.0f}×{brief.plot_depth_ft:.0f} ft plot, {brief.floors_wanted} floor(s), {brief.bedrooms_needed} bedroom(s)."]
        good = _pool(brief, twin.metadata.get("prefs", {}), seed=0)
        trace.append(f"Generated and judged candidates: {len(good)} passed every check.")
        if not good:
            twin.status = "infeasible"
            twin.metadata["infeasible_reason"] = infeasible_reason(brief)
            HouseTwinRepository.save(twin)
            trace.append(twin.metadata["infeasible_reason"])
            return {"success": False, "house_id": house_id, "status": "infeasible", "execution_trace": trace,
                    "judge_summary": {"pass": False, "failures": [{"rule_id": "A_NO_FEASIBLE_LAYOUT", "message": twin.metadata["infeasible_reason"]}], "warnings": []}}
        best, ev = good[0]
        trace.append(f"Best option {best['id']} (score {ev['score']['total']}).")
        return _commit(twin, brief, best, trace)
