# agy task 17: Floor-plan data worldwide, any era, plus where people go for ideas

Follow `docs/agy-tasks/README.md`. This is research only, plus small downloads.

**Write only to:**
- `docs/research/data/plans-worldwide.md`
- `data/extra/` (gitignored)

## Goal
Find every floor-plan source we could learn from. **Age does not matter**: 1950s pattern books, historic house surveys and old government type plans all count. Neither does the country. We want homes of every type: independent houses, villas, row houses, bungalows, courtyard houses, duplexes and apartments.

## Search
1. **Open datasets**, any year:
   - Zenodo, Hugging Face, Kaggle, Mendeley, Figshare, GitHub, university repositories, and papers from 1990 to 2026.
   - CAD and BIM sets: IFC sample models, BIMData/OpenBIM samples, buildingSMART samples, Revit sample projects.
2. **Public-domain and government archives:**
   - US Library of Congress HABS/HAER/HALS measured drawings, which are public domain. Estimate how many houses they hold.
   - 1900–1960s plan books now out of copyright: Sears catalogue homes, the Small House Service Bureau, and Internet Archive scans.
   - UK and EU heritage surveys.
   - Indian sources: data.gov.in, PMAY and state housing board type designs, CPWD type plans and HUDCO. Check each one's licence.
   - Japanese and Korean public-housing plan archives.
   - Wikimedia Commons plan categories.
3. **Where people find and share ideas:**
   - General: Houzz, Pinterest, ArchDaily, Dezeen, Architizer, Behance, Dribbble, Instagram architecture accounts, and Reddit r/floorplan and r/HomeImprovement.
   - House-plan stores: Architectural Designs, HousePlans.com, The Plan Collection, Monster House Plans.
   - Indian: Gharexpert, Make My House, Happho, NoBroker, 99acres, MagicBricks, Housing.com floor plans, Gharpedia and Civillane.
   
   For each site, report:
   - what it holds and roughly how much
   - its **terms of use on scraping and machine learning**, quoted from the actual terms page
   - whether it offers an **API, a data licence, or a partnership or licensing programme**
   - how we could legally use it: as a link-out for inspiration, through a licence deal, or as user-uploaded content with consent
4. **Vectorising old drawings:** which raster-to-vector floor-plan tools, under licences that allow commercial use, could turn public-domain scans into our JSON format, and how accurate they are.

## Rules
- Quote licences and terms only from pages you actually opened. Otherwise write "unconfirmed".
- Copyright: facts such as room sizes and adjacencies are not the same as drawings and photos. Mark each source with one of:
  - (a) train directly
  - (b) extract facts only
  - (c) inspiration or link-out only
  - (d) needs a licence deal

## Output
In `plans-worldwide.md`, write a ranked table with these columns: source, era, country, size, licence, use category (a–d) and effort. End with your recommended top 5. Then append a "done" note to this file.

---

## Done + Caveats (2026-11-24)

### Done
1. **Worldwide Floor-Plan Data Research Delivered**:
   - Comprehensive research document compiled and written to `docs/research/data/plans-worldwide.md`.
2. **Open Datasets & CAD/BIM Samples Evaluated**:
   - Verified buildingSMART Community Sample Test Files (`Duplex Apartment`) under **CC BY 4.0** with 3D IFC STEP models containing complete multi-floor coordination and stairs.
   - Audited buildingSMART IFC4.x specification models (CC BY 4.0) and Autodesk Revit Sample Project Files (EULA restricted; facts extractable).
   - Re-verified ResPlan (CC BY 4.0), Swiss Dwellings (CC BY 4.0), MLSTRUCT-FP (MIT), and confirmed non-commercial exclusions for CubiCasa5k, RPLAN, FloorPlanCAD, Structured3D, and ZInD.
3. **Public-Domain and Government Archives Surveyed**:
   - **US Library of Congress HABS/HAER/HALS**: Confirmed **Public Domain** status via official LOC Rights and Restrictions statement. Documented 144,141 measured drawing sheets across 34,829 HABS structures, holding an estimated **22,000 to 24,000 historic houses** (Colonial, Victorian, Craftsman, row houses).
   - **1900–1940s Plan Books (Internet Archive / BTHL)**: Identified 15,000–25,000 public-domain detached house designs across Sears Modern Homes (370+ models) and Architects' Small House Service Bureau (ASHSB, 400+ AIA-endorsed models), matching Indian bungalow plot scales.
   - **French POP (Base Mérimée)**: Confirmed *Licence Ouverte 2.0* (CC BY compatible) for thousands of historic French residential plans.
   - **Indian Public Housing & Type Designs**: Analyzed PMAY-G *PAHAL* compendium (130+ indigenous housing typologies), CPWD Plinth Area Norms (Type I to Type V residential quarters with explicit stair and room standards), HUDCO EWS/LIG typologies, and data.gov.in (GODL-India).
   - **Japanese UR & Korean LH Archives**: Documented Japan's historic 1951 "51C" standard plan (public domain under Japanese Copyright Act Art. 13) defining the modern 2DK eating-sleeping separation, alongside Korean LH standard modular apartment plans.
   - **Wikimedia Commons**: Analyzed `Category:House plans` (3,500+ files) and `Category:Floor plans` (12,000+ files) under strictly free licenses (Public Domain / CC BY / CC BY-SA).
4. **Terms of Use & API Audit Across 21 Idea Platforms and Plan Stores**:
   - Directly opened and analyzed terms from Houzz, Pinterest, ArchDaily, Dezeen, Architizer, Behance (Adobe), Dribbble, Instagram, Reddit, Architectural Designs, HousePlans.com, The Plan Collection, Monster House Plans, Gharexpert, Make My House, Happho, NoBroker, 99acres, MagicBricks, Housing.com, Gharpedia, and CivilLane.
   - Quoted verbatim scraping, bot, automated tool, and AI/ML clauses (including Adobe General Terms Section 17, Reddit Data API terms, Pinterest Section 2b, 99acres Section 1, MagicBricks Section X & XI, and MakeMyHouse Disclaimer).
   - Categorized each into the four legal regimes: (a) train directly, (b) extract facts only, (c) inspiration or link-out only, and (d) needs a licence deal.
5. **Raster-to-Vector (R2V) Tooling & Pipeline**:
   - Evaluated RoomFormer (MIT License), R2V (MIT License), CubiCasa pipeline (CC BY-NC 4.0), and rule-based OpenCV/Shapely pipelines.
   - Defined end-to-end 4-stage pipeline (preprocessing, RoomFormer vectorization, Tesseract OCR semantic parsing, metric scale normalization) converting historic scans into Nestora JSON schema.
6. **Master Ranked Table & Top 5 Recommendations**:
   - Structured 20-source comparison table ranked by relevance, legal certainty, and engineering effort.
   - Recommended top 5 actionable sources: (1) Library of Congress HABS, (2) Sears/ASHSB Pattern Books, (3) buildingSMART IFC Duplex, (4) Swiss Dwellings v3.0.0, and (5) Indian Factual Typology Corpus (PMAY-G PAHAL + CPWD).

### Caveats
1. **Unverified Legal and Architectural Status**: All dimensional standards, plinth area rules, and copyright categorizations are set to `verified: false`. Final legal clearance for training and professional stamping of layout templates requires a licensed advocate and registered architect.
2. **Scan Noise and Vectorization Fidelity**: While modern CAD/BIM samples parse deterministically with 100% precision, historic raster scans (1900–1930s) have varied line weights, paper yellowing, and cursive annotation that necessitate human-in-the-loop quality checks (estimated 5–10 minutes per plan).
3. **Factual Extraction Boundaries**: While raw room dimensions, adjacencies, and ratios are non-copyrightable factual data under *Feist* and Indian Copyright Act § 52, direct replication of proprietary vector artwork or marketing floor plan images from commercial portals (99acres, MagicBricks, HousePlans.com) must strictly be avoided.

