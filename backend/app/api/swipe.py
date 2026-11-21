"""
Swipe Taste API Router - Section 5 & 10.
Manages 3 decks, 30 cards, dwell-weighted signals, and 512-dim taste vector embedding.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import numpy as np

from typing import Optional
from fastapi import Depends
from backend.app.services.access import require_edit
from backend.app.services.repository import HouseTwinRepository
from backend.app.models.twin import SwipeRecord

router = APIRouter(prefix="/api/v1", tags=["Swipe"])

# Static Catalog of 30 Taste Cards across 3 Decks
CARDS_CATALOG = [
    # Deck 1: Structure (10 cards)
    {"id": "s_01", "deck": "structure", "title": "Central Courtyard", "style": "forest", "desc": "Open sky courtyard with natural breeze and rain capture"},
    {"id": "s_02", "deck": "structure", "title": "Double Height Living", "style": "minimalist", "desc": "High 20ft ceiling living room with mezzanine gallery"},
    {"id": "s_03", "deck": "structure", "title": "Modern Boxy Geometric", "style": "brutalist", "desc": "Crisp cantilevered cubic volumes with clean lines"},
    {"id": "s_04", "deck": "structure", "title": "L-Shaped Garden Wrap", "style": "japanese", "desc": "House wraps around a private garden oasis"},
    {"id": "s_05", "deck": "structure", "title": "Split-Level Mezzanine", "style": "minimalist", "desc": "Half-flight stairs separating public and private zones"},
    {"id": "s_06", "deck": "structure", "title": "Traditional Sloped Roof", "style": "old_is_gold", "desc": "Mangalore tiled pitched eaves shedding coastal monsoon rain"},
    {"id": "s_07", "deck": "structure", "title": "Flat Accessible Terrace", "style": "brutalist", "desc": "Open roof deck for evening gatherings and container gardening"},
    {"id": "s_08", "deck": "structure", "title": "Compact Duplex", "style": "minimalist", "desc": "Vertical space efficiency with stairs acting as lightwell"},
    {"id": "s_09", "deck": "structure", "title": "Deep Shaded Verandah", "style": "old_is_gold", "desc": "Extended overhang porch blocking tropical heat"},
    {"id": "s_10", "deck": "structure", "title": "Screened Jali Facade", "style": "forest", "desc": "Perforated brick/iron skin filtering sunlight and breeze"},

    # Deck 2: Color + Material (12 cards)
    {"id": "cm_01", "deck": "color_material", "title": "Warm White & Teak", "style": "japanese", "desc": "Warm White (LRV 85) with natural Burma teak wood slats"},
    {"id": "cm_02", "deck": "color_material", "title": "Raw Board-Formed Concrete", "style": "brutalist", "desc": "Industrial grey exposed architectural concrete walls"},
    {"id": "cm_03", "deck": "color_material", "title": "Forest Moss & Terracotta", "style": "forest", "desc": "Earthy green plaster paired with unglazed terracotta floor"},
    {"id": "cm_04", "deck": "color_material", "title": "All-White Monolithic", "style": "minimalist", "desc": "High LRV 90+ seamless surfaces bouncing indirect sunlight"},
    {"id": "cm_05", "deck": "color_material", "title": "Polished Terrazzo Chips", "style": "old_is_gold", "desc": "Custom handcrafted marble-chip mosaic flooring"},
    {"id": "cm_06", "deck": "color_material", "title": "Seamless Microcement", "style": "minimalist", "desc": "Grout-free continuous floor and wall bath finish"},
    {"id": "cm_07", "deck": "color_material", "title": "Rustic Laterite Feature", "style": "forest", "desc": "Porous red Konkan laterite stone texture"},
    {"id": "cm_08", "deck": "color_material", "title": "Black Granite & Steel", "style": "brutalist", "desc": "Honed jet-black countertops with powder-coated matte metal"},
    {"id": "cm_09", "deck": "color_material", "title": "Pet-Proof Epoxy Floor", "style": "japanese", "desc": "Self-leveling warm ivory epoxy resistant to claw scratches"},
    {"id": "cm_10", "deck": "color_material", "title": "Limewash Velvety Plaster", "style": "minimalist", "desc": "Breathable mineral limewash with natural tonal variation"},
    {"id": "cm_11", "deck": "color_material", "title": "Heritage Ochre & Chettinad", "style": "old_is_gold", "desc": "Vibrant Indian yellow ochre with floral border accents"},
    {"id": "cm_12", "deck": "color_material", "title": "Fluted Glass & Reeded Oak", "style": "japanese", "desc": "Textured light diffusion panels for semi-private zones"},

    # Deck 3: Decor & Furniture (8 cards)
    {"id": "d_01", "deck": "decor", "title": "Low Tatami Japanese Seating", "style": "japanese", "desc": "Floor-cushioned dining and platform tea table"},
    {"id": "d_02", "deck": "decor", "title": "Scandinavian Ergonomic", "style": "minimalist", "desc": "Curved bentwood armchairs and light oak credenza"},
    {"id": "d_03", "deck": "decor", "title": "Antique Brass & Rosewood", "style": "old_is_gold", "desc": "Heritage swing (jhula) with brass chains and cane weave"},
    {"id": "d_04", "deck": "decor", "title": "Indoor Vertical Green Wall", "style": "forest", "desc": "Living moss and fern wall with automated drip irrigation"},
    {"id": "d_05", "deck": "decor", "title": "Cantilevered Floating Shelves", "style": "minimalist", "desc": "Understated steel plate shelving integrated into wall"},
    {"id": "d_06", "deck": "decor", "title": "Heavy Cast Concrete Table", "style": "brutalist", "desc": "Monolithic dining slab with raw steel legs"},
    {"id": "d_07", "deck": "decor", "title": "Woven Rattan & Jute Rugs", "style": "forest", "desc": "Natural plant-fiber textures for soft foot acoustic damping"},
    {"id": "d_08", "deck": "decor", "title": "Minimalist Linear Lighting", "style": "japanese", "desc": "Concealed 3000K warm LED coves with zero glare"}
]


class SwipeInput(BaseModel):
    card_id: str
    deck: str
    direction: str = Field(description="'right' for like, 'left' for pass")
    dwell_ms: int = Field(default=2000, description="Milliseconds user viewed card before swiping")


@router.get("/swipe/decks", response_model=Dict[str, Any])
def get_swipe_decks():
    """Returns the full 30-card catalog grouped by decks."""
    return {
        "success": True,
        "total_cards": len(CARDS_CATALOG),
        "decks": {
            "structure": [c for c in CARDS_CATALOG if c["deck"] == "structure"],
            "color_material": [c for c in CARDS_CATALOG if c["deck"] == "color_material"],
            "decor": [c for c in CARDS_CATALOG if c["deck"] == "decor"]
        }
    }


@router.post("/house/{house_id}/swipe", response_model=Dict[str, Any])
def register_swipe(house_id: str, swipe: SwipeInput, _user: Optional[str] = Depends(require_edit)):
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")

    # Record swipe
    record = SwipeRecord(
        card_id=swipe.card_id,
        deck=swipe.deck,
        direction=swipe.direction,
        dwell_ms=swipe.dwell_ms
    )
    twin.swipe_history.append(record)

    # Calculate Taste Vector (512 floats)
    # Right = +1, Left = -1. Dwell > 3000ms = 1.8x weight multiplier.
    weight = 1.8 if swipe.dwell_ms >= 3000 else 1.0
    signal = 1.0 * weight if swipe.direction.lower() == "right" else -1.0 * weight

    # Find card style
    matched_card = next((c for c in CARDS_CATALOG if c["id"] == swipe.card_id), None)
    card_style = matched_card["style"] if matched_card else "japanese"

    # Style indices in 512-dim vector
    style_offsets = {
        "japanese": 0,
        "forest": 100,
        "brutalist": 200,
        "minimalist": 300,
        "old_is_gold": 400
    }
    base_idx = style_offsets.get(card_style, 0)

    # Initialize 512-dim vector if needed
    if len(twin.style.taste_vector) != 512:
        vector = np.zeros(512, dtype=float)
    else:
        vector = np.array(twin.style.taste_vector, dtype=float)

    # Update 50 dimensions corresponding to this style
    vector[base_idx : base_idx + 50] += signal * 0.1
    
    # Normalize L2
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
        
    twin.style.taste_vector = [round(float(v), 5) for v in vector]
    HouseTwinRepository.save(twin)

    return {
        "success": True,
        "house_id": house_id,
        "card_id": swipe.card_id,
        "direction": swipe.direction,
        "weight": weight,
        "total_swipes": len(twin.swipe_history),
        "dominant_style": card_style
    }
