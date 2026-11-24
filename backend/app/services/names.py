"""Readable room names for text shown to people (mirrors frontend/lib/rooms.ts roomName)."""
import re

_NAME = {
    "living": "living room", "lounge": "family lounge", "dining": "dining area", "kitchen": "kitchen", "bedroom": "bedroom",
    "bedroom_master": "master bedroom", "bedroom_elder": "elders' bedroom", "bedroom_guest": "guest bedroom", "study": "study",
    "toilet": "bathroom", "stair": "stair", "lift": "lift", "passage": "passage", "porch": "car parking", "entrance": "entrance",
    "puja": "puja", "balcony": "balcony", "utility": "utility", "help": "help's room", "help_room": "help's room",
    "laundry": "wash area", "store": "store", "dress": "dressing",
}


def display(room_id: str) -> str:
    """'bedroom_master' -> 'master bedroom', 'stair_1' -> 'stair', 'bedroom_3' -> 'bedroom 3', 'toilet_master' -> 'master bathroom'."""
    if room_id in _NAME:
        return _NAME[room_id]
    if room_id.startswith("toilet_"):
        who = re.sub(r"_?\d+$", "", room_id[len("toilet_"):])
        return f"{who.replace('_', ' ')} bathroom" if who and who != "common" else "bathroom"
    if room_id.startswith("rental_"):
        return "rental " + display(room_id[len("rental_"):])
    base, num = re.match(r"(.+?)(?:_(\d+))?$", room_id).groups()
    name = _NAME.get(base, base.replace("_", " "))
    return f"{name} {num}" if num and base == "bedroom" else name  # other ids end in a floor number
