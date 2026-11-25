"""Design API: brief intake, catalogues, the 4-at-a-time option loop, simple edits and DXF export."""
import copy
import random
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from backend.app.models.brief import Brief
from backend.app.services import derive, generator, llm, orchestrator, pack, traditions, solver
from backend.app.api import swipe
from backend.app.services.access import rate_limit, require_edit
from backend.app.services.judge import JudgeService
from backend.app.services.repository import HouseTwinRepository

router = APIRouter(prefix="/api/v1", tags=["Design"])
FT = pack.FT
PILOT_CITIES = ("mumbai",)


def _twin(house_id: str):
    t = HouseTwinRepository.get(house_id)
    if not t:
        raise HTTPException(status_code=404, detail="House not found.")
    return t


@router.get("/styles")
def list_styles():
    s = derive.styles()
    ph = swipe.photos()
    rows = [{**x, "photo": ph[k][0]["file"] if ph.get(k) else None,
             "photo_credit": f"{ph[k][0]['author']} · {ph[k][0]['licence']}" if ph.get(k) else None} for k, x in s.items()]
    return {"groups": sorted({x["group"] for x in s.values()}), "styles": rows}


@router.get("/traditions")
def list_traditions():
    return {"traditions": [{"id": k, "name": v["display_name"], "description": v["description"], "verified": v.get("verified", False),
                            "rules": len(v["rules"])} for k, v in traditions.packs().items()]}


class ExtractIn(BaseModel):
    text: str = Field(max_length=2000)


@router.post("/brief/extract", dependencies=[Depends(rate_limit("extract", 10))])
def extract(body: ExtractIn):
    """Reads the family's own words; every returned field quotes the text it came from."""
    return llm.extract(body.text, list(derive.styles()))


def brief_sentences(b: Brief) -> List[str]:
    """What we understood, in plain words (shown for confirmation)."""
    out = [f"{b.plot_width_ft:.0f} × {b.plot_depth_ft:.0f} ft plot on a {b.road_width_m:.0f} m road on the {dict(N='north', E='east', S='south', W='west')[b.facing]} side."]
    pl = lambda n, w, ws=None: f"{n} {w if n == 1 else (ws or w + 's')}"
    if b.couples is not None or b.singles is not None:
        people = [pl(c, x, y) for c, x, y in ((b.couples or 0, "couple", None), (b.singles or 0, "single adult", None),
                                             (b.elder_couples or 0, "elder couple", None), (b.elder_singles or 0, "single elder", None)) if c]
    else:
        people = [pl(b.adults, "adult")] + ([pl(b.elders, "elder")] if b.elders else [])
    if b.elder_mobility_issue:
        people.append("someone who finds stairs hard")
    if b.kids:
        people.append(f"{b.kids} child{'ren' * (b.kids > 1)}")
    out.append("Living here: " + ", ".join(people) + (", plus pets" if b.pets else "") + ".")
    vehicles = [pl(b.cars, "car") if b.cars else "", pl(b.two_wheelers, "two-wheeler") if b.two_wheelers else ""]
    out.append(f"{pl(b.floors_wanted, 'floor')}, {pl(b.bedrooms_needed, 'bedroom')}" + (f"; parking for {' and '.join(v for v in vehicles if v)}." if any(vehicles) else "; no parking."))
    if b.elders:
        out.append("The elder's bedroom and bathroom go on the ground floor" + (", step-free with wider doors." if b.elder_mobility_issue else "."))
    if b.wfh_people:
        out.append(f"A study for {b.wfh_people} person(s) working from home.")
    if b.puja != "none":
        out.append("A puja " + ("room." if b.puja == "room" else "corner."))
    extras = [n for n, on in (("a guest room", b.guest_room), ("a room for live-in help", b.help_room), ("a laundry area", b.laundry),
                              ("a store room", b.store_room), ("a dressing area in the master bedroom", b.master_dressing)) if on]
    if extras:
        out.append("Also: " + ", ".join(extras) + ".")
    out.append("Open kitchen flowing into the living room." if b.kitchen == "open" else "Closed kitchen with a separate dining area.")
    for txt, on in (("Your street floods in monsoon: we raise the plinth.", b.flood_prone),
                    ("Frame sized for one more floor later.", b.future_extra_floor),
                    ("Space reserved for a lift later." if b.lift == "shaft" else "A lift" + (" (required from 3 floors)." if b.floors_wanted >= 3 else "."), b.lift != "none"),
                    ("Low-maintenance finishes.", b.low_maintenance)):
        if on:
            out.append(txt)
    if b.terrace_garden:
        out.append("Keep an open terrace garden on top where the rules allow.")
    if b.rental_floor:
        out.append("The top floor is a separate rental unit with its own kitchen.")
    act = [f"{k.replace('_', ' ').title()} ({v})" for k, v in b.traditions.items() if v != "off"]
    if act:
        out.append("Traditions: " + ", ".join(act) + ". Building code always comes first.")
    if b.styles:
        names = [derive.styles()[s]["name"] for s in b.styles if s in derive.styles()]
        out.append("Style: " + ", ".join(names) + ".")
    out.append(f"Budget ₹{b.budget_inr:,.0f}, {b.tier} finishes.")
    return out


@router.post("/house/{house_id}/brief")
def save_brief(house_id: str, brief: Brief, _u: Optional[str] = Depends(require_edit)):
    twin = _twin(house_id)
    twin.metadata["brief"] = brief.model_dump()
    twin.metadata.pop("pool", None)
    twin.status = "draft"
    HouseTwinRepository.save(twin)
    waitlist = None
    if brief.build_type != "new_plot":
        waitlist = brief.build_type
    elif brief.city not in PILOT_CITIES:
        waitlist = "city"
    return {"success": True, "house_id": house_id, "understood": brief_sentences(brief), "waitlist": waitlist}


class WaitlistIn(BaseModel):
    kind: Literal["city", "flat_interior", "renovation"]
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=200)
    city: Optional[str] = Field(default=None, max_length=80)


@router.post("/waitlist", dependencies=[Depends(rate_limit("waitlist", 5))])
def join_waitlist(body: WaitlistIn):
    HouseTwinRepository.add_waitlist(body.kind, email=body.email, city=body.city)
    return {"success": True}


@router.post("/house/{house_id}/options", dependencies=[Depends(rate_limit("options", 20))])
def start_options(house_id: str, _u: Optional[str] = Depends(require_edit)):
    _twin(house_id)
    return orchestrator.start_options(house_id)


class SelectIn(BaseModel):
    keep: List[str] = Field(default_factory=list, max_length=4)
    discard: List[str] = Field(default_factory=list, max_length=4)


@router.post("/house/{house_id}/options/select", dependencies=[Depends(rate_limit("options", 20))])
def select(house_id: str, body: SelectIn, _u: Optional[str] = Depends(require_edit)):
    _twin(house_id)
    return orchestrator.select(house_id, body.keep, body.discard)


class ChooseIn(BaseModel):
    id: str = Field(max_length=20)


@router.post("/house/{house_id}/options/choose")
def choose(house_id: str, body: ChooseIn, _u: Optional[str] = Depends(require_edit)):
    _twin(house_id)
    try:
        return orchestrator.choose(house_id, body.id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


class EditIn(BaseModel):
    room: Optional[str] = Field(default=None, max_length=40)
    action: Literal["grow", "shrink", "mirror"]


@router.post("/house/{house_id}/edit", dependencies=[Depends(rate_limit("edit", 20))])
def edit(house_id: str, body: EditIn, _u: Optional[str] = Depends(require_edit)):
    """Simple edits: make a room bigger/smaller (others adjust), or mirror the plan. Re-judged before saving."""
    twin = _twin(house_id)
    cand = twin.metadata.get("chosen_candidate")
    if not cand:
        raise HTTPException(status_code=409, detail="Choose a design first.")
    brief = orchestrator.brief_of(twin)
    c = copy.deepcopy(cand)
    rooms = [r for r in c["layout"]["rooms"] if r["type"] != "utility"]
    stair_left = c["layout"]["stair_left"]
    if body.action == "mirror":
        stair_left = not stair_left
    else:
        target = [r for r in rooms if r["id"] == body.room]
        if not target:
            raise HTTPException(status_code=404, detail="Room not found in this design.")
        for r in target:
            r["weight"] = max(0.05, r["weight"] * (1.8 if body.action == "grow" else 0.5))
    before = {r["id"]: r["w"] * r["d"] for r in cand["layout"]["rooms"]}
    if body.action == "mirror":
        solver.mirror(c)
    elif c["layout"].get("engine") == "solver":
        a = before[body.room]
        bounds = (a * 1.2, a * 2.0) if body.action == "grow" else (a * 0.4, a * 0.8)
        s = solver.solve(brief, c["strategy"], random.Random(), hint=c, step_m=c["layout"].get("upper_step_m", 0), resize={body.room: bounds})
        if s is None:
            raise HTTPException(status_code=422, detail="That change doesn't fit within the setbacks and minimum room sizes.")
        c["layout"] = s["layout"]
    else:
        layout = generator.fit(rooms, c["envelope"], c["rules"], c["layout"]["depths"], {}, stair_left)
        if layout is None:
            raise HTTPException(status_code=422, detail="That change doesn't fit within the setbacks and minimum room sizes.")
        layout.update(stilt=c["layout"].get("stilt"), dropped=c["layout"]["dropped"] + layout["dropped"])
        c["layout"] = layout
    c["id"] = f"e{random.randrange(16**6):06x}"
    trial = copy.deepcopy(twin)
    derive.apply(trial, brief, c)
    j = JudgeService.validate_house(trial)
    if not j.passed:
        raise HTTPException(status_code=422, detail="That change breaks a rule: " + j.failures[0]["message"])
    if body.action != "mirror" and abs(sum(r["w"] * r["d"] for r in c["layout"]["rooms"] if r["id"] == body.room) - before.get(body.room, 0)) < 0.05:
        raise HTTPException(status_code=422, detail="That room can't change size here: its row is already at its limits.")
    return orchestrator.commit_edit(house_id, brief, c, f"Edit: {body.action} {body.room or 'plan'}.")


@router.get("/house/{house_id}/export/dxf")
def export_dxf(house_id: str):
    """AutoCAD R12 DXF in metres: plot, setback line, rooms with labels, columns. Floors side by side."""
    twin = _twin(house_id)
    if not twin.floors:
        raise HTTPException(status_code=409, detail="Generate a design first.")
    md = twin.metadata
    pw, pd = twin.plot.plot_width_ft * FT, twin.plot.plot_depth_ft * FT
    sx, sy = md.get("setback_side_m", 0), md.get("setback_front_m", 0)
    ents: List[str] = []

    def line(layer, x1, y1, x2, y2):
        ents.extend(["0", "LINE", "8", layer, "10", f"{x1:.3f}", "20", f"{y1:.3f}", "11", f"{x2:.3f}", "21", f"{y2:.3f}"])

    def rect(layer, x, y, w, d):
        for a, b, c, e in ((x, y, x + w, y), (x + w, y, x + w, y + d), (x + w, y + d, x, y + d), (x, y + d, x, y)):
            line(layer, a, b, c, e)

    def text(layer, x, y, h, s):
        ents.extend(["0", "TEXT", "8", layer, "10", f"{x:.3f}", "20", f"{y:.3f}", "40", f"{h:.2f}", "1", s[:60]])

    for i, fl in enumerate(twin.floors):
        ox = i * (pw + 3)
        rect("PLOT", ox, 0, pw, pd)
        rect("SETBACK", ox + sx, sy, md.get("envelope_width_ft", 0) * FT, md.get("envelope_depth_ft", 0) * FT)
        text("LABELS", ox, -1.2, 0.5, f"FLOOR {fl.floor_no}  (concept, not for construction)")
        for r in fl.rooms:
            x, y, w, d = ox + sx + r.x * FT, sy + r.y * FT, r.length_ft * FT, r.width_ft * FT
            rect(f"ROOMS_F{fl.floor_no}", x, y, w, d)
            text("LABELS", x + 0.15, y + d / 2, 0.25, f"{r.name} {w:.2f}x{d:.2f}m")
        for c in twin.structure.columns:
            cx, cy = ox + sx + c.x * FT, sy + c.y * FT
            rect("COLUMNS", cx - 0.115, cy - 0.115, 0.23, (c.size_y_mm or 230) / 1000)
    dxf = "\n".join(["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "6", "0", "ENDSEC",
                     "0", "SECTION", "2", "ENTITIES", *ents, "0", "ENDSEC", "0", "EOF"]) + "\n"
    return Response(dxf, media_type="application/dxf", headers={"Content-Disposition": f'attachment; filename="{house_id}.dxf"'})
