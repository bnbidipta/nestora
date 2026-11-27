"""
Orchestrator: brief -> candidate pool -> (derive -> Judge -> traditions -> rank) per candidate
-> 4-at-a-time keep/replace loop -> chosen design written to the House Twin.

Stages are plain functions; the Judge gates every candidate (failing candidates are never shown).
Generators: A = template arrangements + row fitter (generator.py), B = LLM topology proposer (llm.py),
C1 = learned ranker (rank.py).
"""
import json
import logging
import random
from typing import Any, Dict, List, Optional, Tuple

from backend.app.models.brief import Brief
from backend.app.models.twin import HouseTwin
from backend.app.services import derive, generator, layoutgen, llm, look, pack, rank, traditions
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
            "compact": brief.compact,
            "envelope_ft": [twin.metadata["envelope_width_ft"], twin.metadata["envelope_depth_ft"]],
        },
        "preview": _preview(c),
        "look": twin.metadata["look"],
    }


LEARNED = True  # add the learned layout generator's arrangement to the pool
SOLVE = 3  # the best generator layouts are re-solved by the constraint solver (reachability, store/puja kept, stacked baths)
VARIANTS = 4  # layouts tried per strategy/arrangement/mirror; the most realistic is kept


def _learned_arrangements(brief: Brief) -> List[Dict[str, Any]]:
    """Room types per floor for the brief's first strategy -> learned arrangement (None if the model isn't installed)."""
    try:
        r = pack.rules(brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT, brief.road_width_m, brief.city)
        st = generator.strategies(brief, r)[0]
        prog = generator.program(brief, r, st["floors"], st["parking"], st["stilt"])
        floors: Dict[int, List[str]] = {}
        for rm in prog:
            floors.setdefault(rm["floor"], []).append(rm["type"])
        return layoutgen.arrangements(floors, brief.plot_width_ft / brief.plot_depth_ft)
    except Exception:  # learned proposals are optional; never block generation
        log.warning("learned arrangement failed", exc_info=True)
        return []


def _solved(brief: Brief, prefs: Dict[str, float], scored, seed: int, on_each=None) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Merge: the generator's best layouts (one per strategy) become hints for the solver, which returns guaranteed
    versions of them; with no usable generator layout, the solver works from the brief alone."""
    from backend.app.services import solver
    best: Dict[str, Dict[str, Any]] = {}
    for c, e in sorted(scored, key=lambda x: -x[1]["score"]["total"]):
        best.setdefault(str(c["strategy"]), c)
    jobs = list(best.values())[:SOLVE]
    r = pack.rules(brief.plot_width_ft * pack.FT, brief.plot_depth_ft * pack.FT, brief.road_width_m, brief.city)
    if not jobs:
        jobs = [{"strategy": s} for s in generator.strategies(brief, r)[:SOLVE]]
    rng = random.Random(seed)
    from backend.app.services import library
    try:  # pre-solved plans fitted to this plot (milliseconds); the live solver only runs when the library has none
        lib = library.plans(brief, generator.strategies(brief, r), random.Random(seed))
    except Exception:
        log.warning("plan library failed", exc_info=True)
        lib = []
    if lib:
        out = [(c, evaluate(brief, c, prefs)) for c in lib]
        if on_each:
            for i, x in enumerate(out):
                on_each(x, len(out) - i - 1)
        return out

    def one(i_h):
        i, h = i_h
        try:
            return solver.solve(brief, h["strategy"], random.Random(seed + i), hint=h if "layout" in h else None)
        except Exception:  # the solver is an addition; never block options
            log.warning("solver failed", exc_info=True)
            return None
    out = []
    for i_h in enumerate(jobs):  # sequential: building CP-SAT models from threads is not safe
        s = one(i_h)
        if s:
            out.append((s, evaluate(brief, s, prefs)))
        if on_each:
            on_each(out[-1] if s else None, len(jobs) - i_h[0] - 1)
    rng.shuffle(out)
    return out


def _fast(brief: Brief, prefs: Dict[str, float], seed: int) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Generator candidates, scored (a few seconds); the solver adds guaranteed layouts afterwards."""
    extra = []
    if any(v != "off" for v in brief.traditions.values()):
        extra.append(traditions.arrangement_for(brief.facing, brief.traditions))
    proposal = llm.propose_arrangement(brief)
    if proposal:
        extra.append(proposal)
    if LEARNED:
        extra.extend(_learned_arrangements(brief))
    cands = generator.candidates(brief, n=24, seed=seed, extra_arrangements=extra, score=rank.realism, variants=VARIANTS)
    return [(c, evaluate(brief, c, prefs)) for c in cands]


def _rank(scored: List[Tuple[Dict[str, Any], Dict[str, Any]]]) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    good = [x for x in scored if x[1]["pass"]]
    if len(good) < SHOW:  # strict traditions vetoed most code-compliant layouts: top up with the closest, flagged
        relaxed = sorted((x for x in scored if x[1]["judge"]["pass"] and not x[1]["pass"]), key=lambda x: -x[1]["score"]["total"])
        for _, e in relaxed:
            e["tradition_relaxed"] = True
        good = good + relaxed
    good.sort(key=lambda x: -x[1]["score"]["total"])
    return good


def _pool(brief: Brief, prefs: Dict[str, float], seed: int) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    scored = _fast(brief, prefs, seed)
    return _rank(scored + _solved(brief, prefs, scored, seed))


def _sig(c: Dict[str, Any]) -> tuple:
    return (str(c["strategy"]), c["arrangement"], c["layout"]["stair_left"])


def _diverse(items: List[Tuple[Dict[str, Any], Dict[str, Any]]], k: int, exclude: set) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Best-first, but each pick must differ from earlier picks in strategy, arrangement or mirroring."""
    out, sigs = [], set()
    for c, e in items:
        if c["id"] in exclude:
            continue
        sig = _sig(c)
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


def plot_check(w_ft: float, d_ft: float, road_m: float, city: str = "mumbai") -> Dict[str, Any]:
    """Can the smallest home (one storey, one bedroom, compact rooms) fit this plot at all? Checked before the questionnaire
    goes on, so a too-small plot is flagged where it is entered."""
    from backend.app.services import pack
    W, D = w_ft * FT, d_ft * FT
    r = pack.rules(W, D, road_m, city)
    env = pack.envelope(W, D, r)
    b = Brief(plot_width_ft=w_ft, plot_depth_ft=d_ft, road_width_m=road_m, city=city, floors_wanted=1, singles=1, couples=0,
              bedrooms=1, puja="none", parking="two_wheeler", compact=True)
    need = sum(x["min_area"] for x in generator.program(b, r, 1, "two_wheeler", False) if x["prio"] == 1)
    have = min(env["width_m"] * env["depth_m"], W * D * r["fsi_max"])
    ok = have >= need and min(env["width_m"], env["depth_m"]) >= r["habitable_min_width_m"]
    return {"ok": ok, "buildable_m2": round(env["width_m"] * env["depth_m"], 1), "need_m2": round(need, 1),
            "envelope_m": [round(env["width_m"], 2), round(env["depth_m"], 2)], "reason": "" if ok else infeasible_reason(b)}


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


FAST_SHOW = 2  # shown at once from the generator; the solver's designs join as they finish


def start_options(house_id: str, seed: Optional[int] = None, background=None) -> Dict[str, Any]:
    """With `background` (a task runner), returns the first options in seconds and adds solved ones later
    (metadata.pending counts the solver jobs left); without it, waits for everything."""
    twin = _get(house_id)
    brief = brief_of(twin)
    seed = seed if seed is not None else random.randrange(1 << 30)
    prefs = twin.metadata.get("prefs", {})
    scored = _fast(brief, prefs, seed)
    if not brief.compact and not _rank(scored):  # standard rooms don't fit: try compact rooms with fold-away furniture
        cb = brief.model_copy(update={"compact": True})
        cs = _fast(cb, prefs, seed)
        if _rank(cs):
            brief, scored = cb, cs
            twin.metadata["brief"] = {**twin.metadata.get("brief", {}), "compact": True}
    fast = _rank(scored)
    if background and len(fast) >= FAST_SHOW:
        shown = _diverse(fast, FAST_SHOW, set())
        look.assign(brief, [c for c, _ in shown])
        shown = [(c, evaluate(brief, c, prefs)) for c, _ in shown]
        twin.metadata.update({
            "pool": [c for c, _ in fast[:POOL_KEEP]] + [c for c, _ in shown if c not in [g[0] for g in fast[:POOL_KEEP]]],
            "options": [e for _, e in shown], "round": 1, "seed": seed, "prefs": prefs, "pending": SOLVE,
            "labels": twin.metadata.get("labels", []), "seen": [c["id"] for c, _ in shown],
        })
        twin.status = "choosing"
        HouseTwinRepository.save(twin)
        background(_add_solved, house_id, brief, prefs, scored, fast, seed)
        return {"success": True, "status": "choosing", "round": 1, "options": twin.metadata["options"], "pool_size": len(fast),
                "pending": SOLVE}
    good = _rank(scored + _solved(brief, prefs, scored, seed))
    if not good and not brief.compact:
        cb = brief.model_copy(update={"compact": True})
        cs = _fast(cb, prefs, seed)
        good = _rank(cs + _solved(cb, prefs, cs, seed))
        if good:
            brief = cb
            twin.metadata["brief"] = {**twin.metadata.get("brief", {}), "compact": True}
    if not good:
        twin.status = "infeasible"
        twin.metadata["infeasible_reason"] = infeasible_reason(brief)
        HouseTwinRepository.save(twin)
        return {"success": False, "status": "infeasible", "reason": twin.metadata["infeasible_reason"], "options": []}
    shown = _diverse(good, SHOW, set())
    look.assign(brief, [c for c, _ in shown])
    shown = [(c, evaluate(brief, c, prefs)) for c, _ in shown]
    twin.metadata.update({
        "pool": [c for c, _ in good[:POOL_KEEP]] + [c for c, _ in shown if c not in [g[0] for g in good[:POOL_KEEP]]],
        "options": [e for _, e in shown], "round": 1, "seed": seed, "prefs": prefs,
        "labels": twin.metadata.get("labels", []), "seen": [c["id"] for c, _ in shown],
    })
    twin.status = "choosing"
    HouseTwinRepository.save(twin)
    return {"success": True, "status": "choosing", "round": 1, "options": twin.metadata["options"], "pool_size": len(good)}


def _add_solved(house_id: str, brief: Brief, prefs: Dict[str, float], scored, fast, seed: int) -> None:
    """Background: each solver design joins the board as a new card (cards already shown never change);
    then the board is topped up from the fast pool. Stops if the user has moved on (new round or chosen)."""
    def current():
        t = HouseTwinRepository.get(house_id)
        return t if t and t.status == "choosing" and t.metadata.get("seed") == seed and t.metadata.get("round") == 1 else None

    def add(found, left):
        twin = current()
        if not twin:
            return
        md = twin.metadata
        pool = {c["id"]: c for c in md.get("pool", [])}
        shown = [pool[o["id"]] for o in md["options"] if o["id"] in pool]
        if found and found[1]["pass"] and len(md["options"]) < SHOW and _sig(found[0]) not in {_sig(c) for c in shown}:
            c = found[0]
            look.assign(brief, [c], [o.get("look", {}).get("archetype") for o in md["options"]])
            md["options"].append(evaluate(brief, c, prefs))
            md["pool"].append(c)
            md["seen"].append(c["id"])
        md["pending"] = left
        HouseTwinRepository.save(twin)

    try:
        _solved(brief, prefs, scored, seed, on_each=add)
    finally:  # top up to SHOW from the fast pool, distinct from what is shown
        twin = current()
        if twin:
            md = twin.metadata
            pool = {c["id"]: c for c in md.get("pool", [])}
            have = {o["id"] for o in md["options"]}
            sigs = {_sig(pool[i]) for i in have if i in pool}
            for c, _ in fast:
                if len(md["options"]) >= SHOW:
                    break
                if c["id"] not in have and _sig(c) not in sigs:
                    look.assign(brief, [c], [o.get("look", {}).get("archetype") for o in md["options"]])
                    md["options"].append(evaluate(brief, c, prefs))
                    md["seen"].append(c["id"])
                    sigs.add(_sig(c))
            md["pending"] = 0
            HouseTwinRepository.save(twin)


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
            look.assign(brief, [found[0]], [current[k].get("look", {}).get("archetype") for k in keep] + [n[0].get("look_archetype") for n in new])
            found = (found[0], evaluate(brief, found[0], prefs))
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


VERSIONS = 10


def _commit(twin: HouseTwin, brief: Brief, cand: Dict[str, Any], trace: List[str]) -> Dict[str, Any]:
    prev = twin.metadata.get("chosen_candidate")
    if prev:  # keep the design this one replaces, so it can be restored
        import time
        twin.metadata["versions"] = ([{"note": twin.metadata.get("last_note", "Earlier design"), "at": time.time(),
                                       "brief": twin.metadata.get("brief"), "cand": prev}] + twin.metadata.get("versions", []))[:VERSIONS]
    twin.metadata["last_note"] = trace[-1] if trace else "Design"
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
    # photoreal render (scripts/render_batch.py): keyed by the plan and the look, so a changed design never shows an old photo
    import hashlib
    key = hashlib.sha1(json.dumps([cand["id"], cand["layout"].get("rooms"), twin.metadata.get("look")], sort_keys=True, default=str).encode()).hexdigest()[:12]
    if (twin.metadata.get("render") or {}).get("key") != key:
        twin.metadata["render"] = {"status": "queued", "key": key}
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
