"""
Fetch real, free-licence photos per architectural style from Wikimedia Commons (no API key).
Only CC0 / public domain / CC BY / CC BY-SA files (commercial use allowed, with credit). Skips religious buildings,
people, maps and drawings by title, rejects duplicates by SHA-1, and keeps landscape photos >= 800 px wide.
Writes frontend/public/styles/<style>/<n>.webp and backend/app/data/style_photos.json (credit + licence per photo).
Usage: python scripts/fetch_style_photos.py [style_id ...]
       python scripts/fetch_style_photos.py --reject chettinad:1,6 kerala_nalukettu:4   (drop, blacklist, refill)
"""
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "frontend", "public", "styles")
META = os.path.join(ROOT, "backend", "app", "data", "style_photos.json")
REJECTED = os.path.join(ROOT, "scripts", "style_photos_rejected.json")  # SHA-1s a person rejected on review
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "NestoraStylePhotos/1.0 (home-design catalogue; contact via project repository)"}
PER_STYLE = 6
OK_LICENCE = re.compile(r"^(cc0|public domain|pd|cc by(-sa)? [1-4]\.0|cc by(-sa)?$|cc by(-sa)? 2\.5|attribution)", re.I)
SKIP = re.compile(r"temple|church|mosque|cathedral|chapel|shrine|gopuram|mandir|masjid|dargah|basilica|monastery|statue|idol|deity|"
                  r"portrait|people|man |woman|wedding|map|plan|drawing|diagram|logo|sketch|painting|stamp|poster|interior of a (car|train)|"
                  r"hotel lobby|airport|station|mall|car |cars|bus|train|ship|tomb|grave|cemetery|fort |palace museum|ruins|rock|ratha|cave|"
                  r"monument|mahabalipuram|mamallapuram|stepwell|carving|relief|sculpture|gecko|lizard|hemidactylus|painting|oil on canvas|"
                  r"cezanne|cézanne|van gogh|kolam|rangoli|pookalam|amplifier|audio|preamp|airplane|aircraft|cabin|stage|theatre|theater|"
                  r"sign|plaque|board|diagram|infographic|model|lego|postcard|restaurant|shop|store|market|street|road|mountain|landscape|"
                  r"crane|construction site|engraving|woodblock|ukiyo|print", re.I)

# Search phrases per catalogue style: exterior first, then interiors/details.
Q = {
    "indian_contemporary": ['modern house Bangalore', 'contemporary residence Kerala architect', 'modern bungalow India', 'modern house Pune'],
    "kerala_nalukettu": ["Nalukettu", "Kerala traditional house", "Kerala house courtyard nadumuttam"],
    "chettinad": ["Chettinad house", "Chettinad mansion Karaikudi", "Chettinad house courtyard"],
    "rajasthani_haveli": ["haveli Rajasthan", "haveli courtyard", "Shekhawati haveli"],
    "goan_portuguese": ["Goan Portuguese house", "Fontainhas Panjim houses", "Goa heritage house"],
    "konkan": ["Konkan house", "Konkan traditional house tiled roof", "Malvan house"],
    "bengali_traditional": ['Bengal terracotta house', 'Kolkata heritage house facade', 'zamindar house Bengal', 'Bengal rajbari'],
    "laurie_baker_vernacular": ['Laurie Baker house brick jali', 'Laurie Baker building Thiruvananthapuram', 'Laurie Baker architecture brick', 'Centre for Development Studies Thiruvananthapuram building'],
    "tropical_modernism": ["tropical modernism house", "Geoffrey Bawa house", "tropical modern house"],
    "bombay_art_deco": ["Art Deco Mumbai", "Marine Drive Art Deco buildings", "Art Deco building Mumbai"],
    "indo_saracenic": ["Indo-Saracenic architecture building", "Indo-Saracenic house", "Indo-Saracenic"],
    "mughal_indo_islamic": ["Mughal garden pavilion", "Mughal architecture jharokha", "Mughal palace interior"],
    "kutchi_bhunga": ['Bhunga', 'Bhungas Hodka', 'circular mud hut Kutch', 'Banni grassland village houses'],
    "japanese": ["Japanese traditional house", "minka", "Japanese house interior tatami"],
    "japandi": ['Japanese minimalist wooden house interior', 'Scandinavian Japanese interior wood', 'minimalist living room wood Japan', 'Nordic minimalist interior oak'],
    "balinese": ['Balinese house compound', 'Bali traditional house', 'Bali villa thatched roof', 'Balinese pavilion bale'],
    "chinese_courtyard": ['siheyuan courtyard', 'Chinese traditional courtyard house Pingyao', 'Beijing courtyard house', 'Huizhou architecture house'],
    "korean_hanok": ["hanok", "Bukchon Hanok", "hanok interior"],
    "thai_traditional": ["Thai traditional house", "Jim Thompson House", "Thai stilt house"],
    "moroccan_riad": ["riad Morocco courtyard", "riad Marrakech", "Moroccan riad interior"],
    "arabian_courtyard": ['Al Fahidi wind tower house', 'barjeel house Dubai', 'traditional house Doha Qatar courtyard', 'Emirati traditional house'],
    "persian": ["Persian traditional house courtyard", "Kashan historical house", "Iranian traditional house"],
    "mediterranean": ['Mediterranean villa house white walls terracotta roof', 'Mediterranean Revival house', 'villa Mallorca house', 'Mediterranean architecture house Cyprus'],
    "tuscan": ['Tuscan villa stone house cypress', 'casale Toscana', 'farmhouse Tuscany stone', "Val d'Orcia farmhouse"],
    "greek_cycladic": ["Cycladic architecture Santorini houses", "Mykonos houses", "Cycladic house"],
    "scandinavian": ['Scandinavian living room interior', 'Swedish red wooden house', 'Norwegian wooden house', 'Danish summer house'],
    "english_cottage": ['thatched cottage', 'Cotswold stone cottage', 'English country cottage garden', 'half-timbered cottage England'],
    "french_provincial": ['Provence mas farmhouse stone', 'French country house shutters', 'maison de campagne France', 'bastide Provence'],
    "spanish_colonial": ["Spanish Colonial Revival house", "Spanish colonial house", "Spanish Colonial architecture house courtyard"],
    "bauhaus": ["Bauhaus house", "Masters' Houses Dessau", "Bauhaus villa"],
    "art_deco": ["Art Deco house", "Art Deco villa", "Art Deco residential building"],
    "victorian": ["Victorian house", "Victorian terraced houses", "Painted Ladies Victorian houses"],
    "georgian": ["Georgian house", "Georgian architecture terrace", "Georgian townhouse"],
    "mid_century_modern": ["mid-century modern house", "Eichler house", "mid-century modern interior"],
    "craftsman": ["American Craftsman house", "Craftsman bungalow", "Craftsman style house porch"],
    "farmhouse": ["farmhouse", "American farmhouse", "modern farmhouse"],
    "prairie": ["Prairie School house", "Frank Lloyd Wright Prairie house", "Robie House"],
    "pueblo": ["Pueblo Revival architecture house", "adobe house Santa Fe", "Pueblo style house"],
    "brazilian_modernism": ["Brazilian modernism house", "Casa de Vidro Lina Bo Bardi", "Brazilian modernist residence"],
    "minimalist": ['minimalist house architecture white', 'minimalist residence concrete glass', 'white modern house minimal', 'minimalist interior living room'],
    "brutalist": ['brutalist house concrete', 'brutalist residential building', 'Barbican Estate', 'exposed concrete residence'],
    "industrial": ["industrial loft interior", "loft apartment exposed brick", "converted warehouse loft"],
    "biophilic": ['green facade house', 'house green roof', 'vertical garden building', 'indoor plants living room'],
    "wabi_sabi": ["wabi-sabi interior", "Japanese tea house interior", "rustic Japanese interior"],
    "maximalist": ['eclectic living room interior colourful', 'maximalist interior design', 'ornate living room interior', 'colourful interior design patterned'],
    "bohemian": ['bohemian living room plants rugs', 'boho interior', 'eclectic bohemian bedroom', 'bohemian style interior'],
    "eco_passive": ['passive house building', 'timber eco house', 'straw bale house', 'earthship house'],
    "old_world_heritage": ["heritage bungalow India", "colonial bungalow India", "old bungalow Bangalore"],
    "feng_shui_modern": ['modern house China villa', 'contemporary Chinese courtyard house architecture', 'Suzhou modern residence', 'Chinese modern villa garden'],
    "dravidian_residential": ['Agraharam houses Kumbakonam', 'Kerala Agraharam Palakkad houses', 'Tamil Nadu traditional house thinnai veranda', 'Karaikudi house veranda'],
    "ranch": ["ranch-style house", "California ranch house", "ranch house suburban"],
    "parametric": ['Zaha Hadid residential building', 'parametric architecture building facade', 'Beekman Tower facade', 'organic architecture residential building curved'],
    "contemporary": ["contemporary house architecture", "modern house glass", "contemporary villa"],
}


def get(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    for _ in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return json.load(r)
        except Exception:  # transient network / rate limit
            time.sleep(3)
    return {}


def search(q):
    d = get({"action": "query", "generator": "search", "gsrnamespace": 6, "gsrsearch": f"{q} filetype:bitmap", "gsrlimit": 30,
             "prop": "imageinfo", "iiprop": "url|sha1|size|extmetadata|mime", "iiurlwidth": 1200})
    return (d.get("query") or {}).get("pages", [])


def clean(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()


def candidates(style):
    for q in Q[style]:
        for p in search(q):
            ii = (p.get("imageinfo") or [{}])[0]
            m = ii.get("extmetadata", {})
            lic = clean(m.get("LicenseShortName", {}).get("value"))
            title = p.get("title", "")
            w, h = ii.get("width", 0), ii.get("height", 1)
            if ii.get("mime") not in ("image/jpeg", "image/png") or not OK_LICENCE.match(lic) or "nc" in lic.lower().split():
                continue
            if SKIP.search(title) or SKIP.search(clean(m.get("ImageDescription", {}).get("value"))[:200]):
                continue
            if w < 800 or not (1.15 <= w / h <= 2.0):
                continue
            yield {"title": title, "thumb": ii.get("thumburl") or ii["url"], "page": ii.get("descriptionurl"), "sha1": ii.get("sha1"),
                   "licence": lic, "licence_url": m.get("LicenseUrl", {}).get("value", ""),
                   "author": clean(m.get("Artist", {}).get("value"))[:120] or "Unknown", "query": q}


def main(styles, keep_existing=False):
    meta = json.load(open(META, encoding="utf-8")) if os.path.exists(META) else {}
    rejected = set(json.load(open(REJECTED))) if os.path.exists(REJECTED) else set()
    seen = {p["sha1"] for v in meta.values() for p in v} | rejected
    for st in styles:
        out_dir = os.path.join(OUT, st)
        os.makedirs(out_dir, exist_ok=True)
        got = [p for p in meta.get(st, []) if p["sha1"] not in rejected] if keep_existing else []
        tmp = []  # renumber kept photos 1..n
        for i, p in enumerate(got, 1):
            src = os.path.join(ROOT, "frontend", "public", p["file"].lstrip("/"))
            dst = os.path.join(out_dir, f"_{i}.webp")
            os.replace(src, dst); tmp.append((dst, os.path.join(out_dir, f"{i}.webp"))); p["file"] = f"/styles/{st}/{i}.webp"
        for f in os.listdir(out_dir):
            if not f.startswith("_"):
                os.remove(os.path.join(out_dir, f))
        for a, b in tmp:
            os.replace(a, b)
        pix = set()
        for c in candidates(st):
            if len(got) >= PER_STYLE or c["sha1"] in seen:
                continue
            try:
                with urllib.request.urlopen(urllib.request.Request(c["thumb"], headers=UA), timeout=60) as r:
                    im = Image.open(io.BytesIO(r.read())).convert("RGB")
            except Exception:
                continue
            im.thumbnail((960, 640))
            ph = hashlib.md5(im.resize((16, 16)).convert("L").tobytes()).hexdigest()  # near-duplicate guard
            if ph in pix:
                continue
            n = len(got) + 1
            im.save(os.path.join(out_dir, f"{n}.webp"), "WEBP", quality=72, method=6)
            pix.add(ph); seen.add(c["sha1"])
            got.append({**{k: c[k] for k in ("title", "page", "sha1", "licence", "licence_url", "author", "query")}, "file": f"/styles/{st}/{n}.webp"})
            time.sleep(0.3)
        meta[st] = got
        print(st, len(got), flush=True)
        json.dump(meta, open(META, "w", encoding="utf-8"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    if sys.argv[1:2] == ["--reject"]:
        meta = json.load(open(META, encoding="utf-8"))
        rej = set(json.load(open(REJECTED))) if os.path.exists(REJECTED) else set()
        styles = []
        for arg in sys.argv[2:]:
            st, nums = arg.split(":")
            rej |= {meta[st][int(n) - 1]["sha1"] for n in nums.split(",")}
            styles.append(st)
        json.dump(sorted(rej), open(REJECTED, "w"), indent=0)
        main(styles, keep_existing=True)
    else:
        main(sys.argv[1:] or list(Q))
