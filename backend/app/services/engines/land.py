"""
Land + city engine (brief model 11): plot risk flags and the approvals checklist for this plot, from the city
pack (DCPR 2034 draft) and the brief. It does not judge land price or title; those need a lawyer and a local
surveyor. All items unverified.
"""
from typing import Any, Dict, List

from backend.app.models.brief import Brief
from backend.app.services import pack


def analyse(brief: Brief, plot_m2: float, height_m: float) -> Dict[str, Any]:
    p = pack.load(brief.city)
    risks: List[Dict[str, str]] = []
    if brief.soil == "coastal":
        risks.append({"level": "high", "title": "Coastal Regulation Zone (CRZ) check",
                      "detail": p.get("crz_and_special_zones_note", "Plots near the coast may need MCZMA approval.")})
    if brief.flood_prone:
        risks.append({"level": "medium", "title": "Flooding", "detail": "Raise the plinth (done in this design), add a non-return valve on the drain, keep electrical points above 1.2 m on the ground floor."})
    if brief.soil in ("black_cotton", "coastal"):
        risks.append({"level": "medium", "title": "Soil", "detail": "Expansive or reclaimed soil: get a soil investigation (boreholes) before finalising the foundation."})
    if brief.road_width_m < 9:
        risks.append({"level": "medium", "title": "Narrow road", "detail": "Under 9 m only base FSI applies, and construction access (RMC trucks) may be hard."})
    if height_m > 9.0:
        risks.append({"level": "low", "title": "Airport height zone", "detail": "Parts of Mumbai fall under AAI height restrictions: check the NOCAS colour-coded zoning map for your plot."})
    checklist = list(p.get("approval_checklist", []))
    if plot_m2 >= 300:
        checklist.append("Rainwater harvesting system design (required for plots of 300 m² or more; unverified)")
    if brief.rental_floor:
        checklist.append("Separate electricity and water meters for the rental floor (MSEDCL / MCGM)")
    return {"risks": risks, "checklist": checklist, "open_questions": p.get("open_questions", []), "verified": p.get("verified", False),
            "not_covered": "Title search, land price, encumbrances and society NOCs need a property lawyer."}
