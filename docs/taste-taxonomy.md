# Nestora Taste Taxonomy & Aesthetic Card Catalogue
**Document:** `docs/taste-taxonomy.md`  
**Target:** Visual Taste Inference Engine & Swipe Profiler  
**Status:** Research Draft (`verified: false`)  
**Image Assets:** 54 WebP files in `frontend/public/swipe/` (1200×900, < 200 KB)  
**Card Metadata:** `backend/app/data/swipe_cards.json`  

---

## 1. Style Taxonomies (5 Core + 3 Recommended Global Extensions)

### Core Styles (5)
1. **`japanese` (Japandi / Wabi-Sabi):**  
   *Justification:* Prioritizes natural unvarnished cedar/cypress wood, low seating planes, tatami proportions, and diffuse paper-filtered natural light, embodying serenity and restraint.
2. **`biophilic` (Indoor-Outdoor Living, formerly "forest"):**  
   *Justification:* Centers around living courtyards, extensive indoor foliage, cross-ventilation, and natural skylights, directly responding to Mumbai's tropical climate.
3. **`brutalist` (Honest Structural Materiality):**  
   *Justification:* Celebrates exposed board-formed RCC concrete, heavy structural cantilevers, deep shadow reveals, and unadorned structural honesty.
4. **`minimalist` (Pure Geometric Planes):**  
   *Justification:* Eliminates visual noise through concealed flush cabinetry, monochromatic palettes, seamless microtopping/terrazzo floors, and continuous daylight wash.
5. **`indian_heritage` (Vernacular Craft, formerly "old_is_gold"):**  
   *Justification:* Integrates traditional regional crafts including carved teak wood pillars, brass metalwork, terracotta Mangalore roof tiles, Athangudi encaustic tiles, and shady verandahs.

### Recommended Global Additions (3)
6. **`scandinavian` (Nordic Warmth & Hygge):**  
   *Justification:* Blends functional minimalism with soft domestic warmth using blonde ash/birch woods, bouclé textiles, and welcoming bright ambient light.
7. **`mediterranean` (Earth & Sun Coastal):**  
   *Justification:* Features soft limewashed arches, terracotta pavers, raw stone masonry, and shaded pergolas that transition seamlessly to Indian coastal climates.
8. **`industrial` (Urban Loft & Tectonic Craft):**  
   *Justification:* Celebrates exposed wire-cut red brick, black steel I-beams, fluted glass partitions, and conduit detailing popular among urban loft renovations.

---

## 2. Continuous Attribute Axes (-1.0 to +1.0)

Every swipe card and design preference vector is evaluated along 9 normalized continuous axes:

| Axis Key | Negative Anchor (-1.0) | Positive Anchor (+1.0) | Description & Architectural Impact |
| :--- | :--- | :--- | :--- |
| **`palette_warm_cool`** | Cool (Greys, Blues, Stark White) | Warm (Terracotta, Ocre, Timber) | Governs interior paint tones, upholstery undertones, and lighting Kelvin temperature (2700K vs 5000K). |
| **`ornament_minimal_ornate`** | Minimal (Flush, Zero Moulding) | Ornate (Carved, Intricate, Moulded) | Controls cornices, architraves, carved pillar brackets, and decorative grills. |
| **`material_wood`** | Wood Absent / Discouraged | Wood Dominant (Teak, Oak, Cedar) | Determines wall cladding, ceiling panelling, cabinetry, and structural timber presence. |
| **`material_stone`** | Stone Absent / Polished Plaster | Heavy Stone (Limestone, Granite, Slate)| Governs flooring types, feature accent walls, and exterior facade masonry. |
| **`material_concrete`** | Concrete Concealed / Clad | Raw Exposed Concrete (Shuttering, Fair-faced)| Dictates whether RCC slab soffits and columns remain unplastered. |
| **`light_bright_moody`** | Moody (Low-key, Dramatic, Chiaroscuro)| Bright (High-key, Expansive Daylight)| Governs window-to-wall ratio, skylights, and ambient foot-candle specifications. |
| **`space_open_cozy`** | Cozy (Cellular, Nooks, Defined Rooms)| Open (Fluid, Free-plan, Double-height)| Informs layout solver whether to dissolve partitions into great rooms or partition into intimate spaces. |
| **`era_modern_traditional`** | Modern (Futuristic, Clean Geometric)| Traditional (Vernacular, Heritage, Historic)| Guides roof profiles (flat slab vs sloping pitched roof) and window framing styles. |
| **`greenery_none_lush`** | None (Sterile, Mineral, Architectural)| Lush (Indoor Courtyard, Plant Pockets)| Allocates floor area to planters, internal courtyards, and vertical trellises. |

---

## 3. Style Centroid Table on Attribute Axes

The mathematical centroid representing each style's canonical position in 9-dimensional attribute space:

| Style | `palette_warm_cool` | `ornament_minimal_ornate` | `material_wood` | `material_stone` | `material_concrete` | `light_bright_moody` | `space_open_cozy` | `era_modern_traditional` | `greenery_none_lush` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Japanese** | $+0.35$ | $-0.85$ | $+0.80$ | $+0.25$ | $-0.60$ | $+0.40$ | $+0.10$ | $+0.20$ | $+0.30$ |
| **Biophilic** | $+0.30$ | $-0.45$ | $+0.70$ | $+0.50$ | $-0.25$ | $+0.75$ | $+0.55$ | $-0.25$ | $+0.90$ |
| **Brutalist** | $-0.60$ | $-0.85$ | $-0.40$ | $+0.25$ | $+0.95$ | $-0.10$ | $+0.50$ | $-0.65$ | $-0.55$ |
| **Minimalist** | $-0.25$ | $-0.95$ | $+0.10$ | $+0.40$ | $+0.15$ | $+0.85$ | $+0.70$ | $-0.85$ | $-0.70$ |
| **Indian Heritage** | $+0.80$ | $+0.75$ | $+0.90$ | $+0.65$ | $-0.80$ | $+0.35$ | $+0.30$ | $+0.90$ | $+0.40$ |
| **Scandinavian** | $+0.15$ | $-0.75$ | $+0.80$ | $+0.00$ | $-0.45$ | $+0.85$ | $+0.45$ | $-0.25$ | $+0.30$ |
| **Mediterranean**| $+0.75$ | $+0.00$ | $+0.45$ | $+0.85$ | $-0.60$ | $+0.80$ | $+0.55$ | $+0.50$ | $+0.45$ |
| **Industrial** | $-0.10$ | $-0.45$ | $+0.35$ | $+0.15$ | $+0.70$ | $-0.10$ | $+0.50$ | $-0.40$ | $-0.50$ |

---

## 4. Recommended Opening Set (10–12 Cards for Maximum Information Gain)

To construct an accurate taste profile with the fewest swipes, the swipe engine should present high-variance "orthogonal boundary" cards that maximally bisect the 9 axes:

1. **`tie_wood_vs_concrete` (Split Materiality):**  
   *Separates:* High wood preference (`japanese`, `scandinavian`, `indian_heritage`) from raw concrete preference (`brutalist`, `industrial`).
2. **`min_living_01` (Stark White Minimalist):**  
   *Separates:* Pure planar modernism (`minimalist`) from textured or decorative styles.
3. **`ind_living_02` (Carved Teak & Brass Heritage):**  
   *Separates:* Indian vernacular ornament and heritage resonance (`indian_heritage`) from international styles.
4. **`bio_living_01` (Indoor Tree & Tropical Sun):**  
   *Separates:* High biophilic nature requirement (`biophilic`) from mineral architectural styles.
5. **`brut_exterior_01` (Monumental Board-formed Concrete):**  
   *Separates:* Bold sculptural concrete geometry (`brutalist`) from delicate or traditional domestic forms.
6. **`tie_bright_vs_moody` (Chiaroscuro Light Well):**  
   *Separates:* High-key airy daylight seekers from low-key atmospheric chiaroscuro lovers.
7. **`med_living_02` (Arched Plaster & Travertine):**  
   *Separates:* Earthy textured warm stone (`mediterranean`) from austere industrial metal/glass.
8. **`indus_living_01` (Red Brick & Black I-Beam Loft):**  
   *Separates:* Tectonic industrial craft (`industrial`) from smooth finished interiors.
9. **`jp_living_01` (Low Wood Tatami Platform):**  
   *Separates:* Eastern contemplative restraint (`japanese`) from Western maximalism.
10. **`scand_living_01` (Blonde Ash & Bouclé Hygge):**  
    *Separates:* Bright domestic comfort (`scandinavian`) from stark brutalist austerity.
11. **`tie_heritage_vs_modern` (Cantilever Glass Over Ancient Colonnade):**  
    *Separates:* Modernist avant-garde inclination from historical preservationist sensibilities.
12. **`bio_courtyard_05` (Central Water Pond Atrium):**  
    *Separates:* Central courtyard / atrium adoption willingness from strictly covered floorplates.
