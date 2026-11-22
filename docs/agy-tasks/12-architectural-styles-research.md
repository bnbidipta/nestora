# agy task 12: Research architectural styles for homes (research only, no design)

Follow the rules in `docs/agy-tasks/README.md`. **Research only**: do not design UI, pick colours for screens, or write app code.

**Write only to:**
- `docs/research/architectural-styles.md` (readable report)
- `backend/app/data/styles_research.draft.json` (structured data)

## Why
Today the app offers 5 taste styles. Nestora is going global, so people need to recognise their own taste. Claude will design the style picker and generator mapping from your research.

## Do
Research **at least 40 residential architectural and interior styles** across these groups:
- Indian regional: Kerala nalukettu, Chettinad, Rajasthani haveli, Goan Portuguese, Konkan, Bengali, Kutchi bhunga, Dravidian-influenced, Indo-Saracenic, Bombay Art Deco, Laurie Baker (vernacular brick), Charles Correa / tropical modernism, Indian contemporary.
- Asian: Japanese (traditional + Japandi), Balinese, Chinese courtyard, Korean hanok, Thai.
- Middle East / North Africa: Moroccan riad, Arabian courtyard, Persian.
- European: Mediterranean, Tuscan, Greek Cycladic, Scandinavian, English cottage, French provincial, Spanish colonial, Bauhaus, Art Deco, Victorian, Georgian.
- Americas: Mid-century modern, Craftsman, Farmhouse / modern farmhouse, Prairie, Ranch, Pueblo / adobe, Brazilian modernism.
- Movements and approaches: Brutalism, Minimalism, Industrial, Biophilic, Tropical modernism, Parametric, Wabi-sabi, Maximalism, Bohemian, Eco / passive house, Contemporary.

For each style, give:
- `id` (snake_case), `name`, `aliases`, `region_of_origin`, `era`
- `climate_fit`: which climates it suits (hot-humid, hot-dry, temperate, cold, monsoon), and why
- `defining_features`: 5–8 architectural features (plan form, roof, openings, courtyards, verandahs, facade)
- `materials`: typical structure and finish materials, and what is locally available in India
- `palette`: 4–6 typical colours as hex, with a note on where each appears (walls, wood, stone, accent)
- `interior_traits`: furniture, lighting, textiles
- `cost_tier_tendency`: economy / standard / premium, and why
- `india_suitability`: notes for Mumbai's coastal monsoon climate (corrosion, damp, heat)
- `compatible_with`: other style ids that blend well
- `image_search_terms`: 3 phrases someone could use to find free-licence reference photos
- `sources`: books, museum or university pages, architecture references. Cite them; never invent.

## Output
- The JSON is a list of style objects, with `"verified": false` at the top level.
- The `.md` file is a readable summary table plus 1 paragraph per style.

## Done when
There are ≥ 40 styles, every style has sources, and the JSON parses.

---

## Done + Caveats (agy task 12)

- **Completed:** Researched 51 comprehensive residential architectural and interior styles across all 6 specified categories:
  - Indian regional (13 styles)
  - Asian (6 styles)
  - Middle East / North Africa (3 styles)
  - European (11 styles)
  - Americas (7 styles)
  - Movements and approaches (11 styles)
- **Deliverables written:**
  - `backend/app/data/styles_research.draft.json` (valid JSON with top-level `"verified": false`, 51 detailed style objects, verified parseable)
  - `docs/research/architectural-styles.md` (readable comprehensive markdown report with 51-row master summary table, 1 robust synthesis paragraph per style, detailed features, materiality, color palettes, Mumbai monsoon adaptations, and full academic/heritage citations)
- **Caveats:**
  1. `"verified": false` remains set at top level; all architectural parameters, dimensions, and material substitutions require professional review by a licensed architect before incorporation into spatial solvers or generative prompts.
  2. Mumbai coastal suitability: All foreign styles (Cycladic, Pueblo, Bauhaus, Hanok, English Cottage, etc.) include explicit technical adaptations for high relative humidity (>85%), monsoon downpours (>2,500 mm), and coastal salt mist (e.g. replacing unbaked mud/thatch with stabilized earth blocks/tiles, substituting paper shoji with frosted laminated glass, and requiring anti-carbonation coatings on fair-faced concrete).
  3. No code, UI, or taste generator mappings were edited; pure research output ready for Claude's downstream style picker design.

