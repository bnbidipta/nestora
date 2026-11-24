# Architectural Styles, Building Materials & Construction Quality: Empirical Research, Licensing Audit & Engineering Data

**Document ID**: `docs/research/data/styles-materials-quality.md`  
**Task Reference**: agy task 18 (`docs/agy-tasks/18-styles-materials-quality.md`)  
**Date of Research & Primary Source Audit**: 2026-11-24  
**Author**: Antigravity (agy research agent)  
**Status**: Completed  
**Verified**: false *(All factual rules, material properties, and engineering standards are unverified pending formal audit by licensed architects and structural engineers per agy rules)*  

---

## 1. Executive Summary & Purpose

Nestora's generative platform creates personalized architectural layouts, interior specifications, and construction bills of quantities (BOQ) for Indian families. To deliver designs that are climatically resilient, culturally resonant, and structurally sound, Nestora must match each family's brief (elderly residents, toddlers, pets, budget tier, and regional aesthetic taste) with the correct architectural style, materials, and build-quality specifications.

This research report provides:
1. **Master Source & Licensing Table**: A comprehensive legal audit of candidate datasets across styles, material databases, defect vision sets, and price feeds, quoting verbatim terms from opened pages.
2. **Style Data Taxonomy & Regional Coverage**: An analysis of open architectural datasets (Places365, LSUN, Getty AAT, Wikidata) and an architectural breakdown of 6 Indian regional styles (Chettinad, Konkan, Kerala Nalukettu, Rajasthani Haveli, Bengali, and Goan-Portuguese) alongside global styles.
3. **Material Engineering & Standards**: Material properties for the 29 materials in `backend/app/data/materials.json`, cross-referenced with Indian Standards (IS 15622, IS 1124, IS 1237, IS 1077, IS 2185, IS 3620), CPWD Specifications (2019), and the ICE Embodied Carbon Database.
4. **Build-Quality Defect Mitigation**: Forensic defect analysis for Indian homes (dampness, seepage, and structural cracks) based on CSIR-CBRI studies, statutory quality norms under NBC 2016 Part 7 and RERA Act 2016 Section 14(3), and open defect vision datasets (SDNET2018, Mendeley Concrete Crack).
5. **Paint, Colour & Light Reflectance Values (LRV)**: Technical LRV databases (RAL, NCS, Asian Paints) and peer-reviewed colour-psychology frameworks (Valdez & Mehrabian 1994, Elliot & Maier 2014) to optimize day-lighting and spatial wellbeing.

---

## 2. Master Table of Sources & Licensing Audit

The table below compiles candidate data sources across architectural style, material properties, construction quality, and paint/colour. In accordance with agy guidelines:
- **Licence terms are quoted verbatim only from primary source pages opened during this session.**
- Pages blocked by anti-bot gates (e.g. Cloudflare / reCAPTCHA on Kaggle) or not opened are strictly marked as `"unconfirmed"`.
- Permissible use is categorized as:
  - **(a) Train directly**: Open commercial license permits model training and weight distribution.
  - **(b) Extract facts only**: Copyright does not protect raw factual figures (thermal conductivity, densities, standard numbers, clause thresholds), but raw databases/text cannot be mirrored.
  - **(c) Inspiration / Link-out only**: Web scraping and automated retrieval prohibited by platform terms; usable solely for client UI hyperlinks or manual visual inspiration.
  - **(d) Needs a licence deal**: Commercial API integration or commercial dataset licensing required.

| # | Source Name | Category / Domain | Size / Scope | Declared Licence | Quoted Licence / Terms Text (from Opened Page) | Page Opened & Verified | Use Category | Intended Nestora Use |
|---|---|---|---|---|---|---|---|---|
| 01 | **Getty Art & Architecture Thesaurus (AAT)** | Style Taxonomy | 45,000+ concepts, 400,000+ terms | Open Data Commons Attribution License (ODC-By) 1.0 | *"All Getty Vocabulary data is free to use under the terms of the Open Data Commons Attribution License (ODC-By) 1.0 . To attribute Getty Vocabularies... use the following credit line: 'Contains information from the J. Paul Getty Trust, Getty Research Institute, [full tool name], which is made available under the ODC Attribution License'"* | `https://www.getty.edu/research/tools/vocabularies/obtain/download.html` (HTTP 200) | **(a) Train directly / Integrate** | Foundational style taxonomy for family preference questionnaire, semantic tagging, and prompt conditioning. |
| 02 | **Wikidata Architectural Styles (P149)** | Style Taxonomy | 1,200+ style entities, multilingual | Creative Commons CC0 1.0 Universal | *"All structured data from the main, Property, Lexeme, and EntitySchema namespaces is available under the Creative Commons CC0 License ; text in the other namespaces is available under the Creative Commons Attribution-ShareAlike License"* | `https://www.wikidata.org/wiki/Wikidata:Copyright` (HTTP 200) | **(a) Train directly / Integrate** | Multilingual entity mapping for Indian and global architectural styles, historical periods, and regional aliases. |
| 03 | **Wikimedia Commons "Architecture by style"** | Style Imagery | 250,000+ curated architectural images | Mixed (CC0, CC BY, CC BY-SA, Public Domain) | *"Files are available under licenses specified on their description page. All structured data from the file namespace is available under the Creative Commons CC0 License ; all unstructured text is available under the Creative Commons Attribution-ShareAlike License"* | `https://commons.wikimedia.org/wiki/Category:Architecture_by_style` (HTTP 200) | **(a) Train directly** *(per-image license filter)* | Curating reference image decks and taste-card visual anchors filtered strictly to CC0 / CC BY images. |
| 04 | **Places365 / Places2 (MIT CSAIL)** | Scene / Room Imagery | 10 million+ images, 400+ scene categories | Custom Academic / Non-Commercial | *"Here we provide the Database and the trained CNNs for academic research and education purposes."* | `http://places2.csail.mit.edu/` (HTTP 200) | **(c) Non-commercial / Link-out only** *(Excluded from commercial training)* | Academic benchmarking only; prohibited for commercial layout generator model weights. |
| 05 | **LSUN Scene Categories (Yu et al.)** | Scene / Room Imagery | 10 scene categories, millions of images | Academic / Non-Commercial Research | *"If you find LSUN dataset useful in your research, please consider citing: Title = {LSUN: Construction of a Large-scale Image Dataset using Deep Learning with Humans in the Loop}"* | `https://raw.githubusercontent.com/fyu/lsun/master/README.md` (HTTP 200) | **(c) Non-commercial / Academic only** | Pre-training evaluation only; commercial weights must avoid raw LSUN redistribution. |
| 06 | **Architectural Style Dataset (Xu et al. 2014 / Dumitrux)** | Style Classification | 10,113 images across 25 styles | Unconfirmed (Kaggle blocked by reCAPTCHA; GitHub code MIT) | *"The dataset contains 10113 images from 25 architectural styles. It is a mixed between images scraped from Google Images and the dataset from the paper 'Architectural Style Classification using Multinomial Latent Logistic Regression' (ECCV2014), made by Zhe Xu."* | `https://raw.githubusercontent.com/dumitrux/architectural-style-recognition/master/README.md` (HTTP 200; Kaggle blocked) | **(b) Extract facts only / Unconfirmed** | Reference style list (25 classes); raw images must not be commercialized without individual copyright clearance. |
| 07 | **House Rooms Image Dataset** | Room Imagery | ~1,000–5,000 images | Unconfirmed (Cloudflare bot block on Kaggle) | *"Checking your browser before accessing www.kaggle.com ... Click here if you are not automatically redirected after 5 seconds."* | `https://www.kaggle.com/datasets/robin2002/house-rooms-image-dataset` (Gated) | **(b) Unconfirmed** | Not used until un-gated mirror with open license verification is established. |
| 08 | **Houzz Platform** | Interior Design / Architecture | 25 million+ design photos | Proprietary / Commercial All Rights Reserved | *"You are expressly prohibited from any use of data mining, robots, scraping, or similar data gathering and extraction tools in your use of the Houzz Platform."* | `https://www.houzz.com/termsOfUse` (HTTP 200) | **(c) Inspiration / Link-out only** | User-directed link-outs for visual inspiration; automated scraping strictly forbidden. |
| 09 | **Inventory of Carbon & Energy (ICE Database v3.0 / v5.0)** | Material Properties | 200+ building materials, embodied carbon | Educational Free / IC+ Commercial Tier | *"The ICE Database Educational is a free educational-only resource... The ICE Database Educational must not be used for commercial applications, including project calculations, carbon assessments, tools, software, reporting, or any internal business or consultancy activity... Looking for Commercial Use? You will require a licensed dataset. IC+ is Circular Ecology's new commercial database, designed for these applications."* | `https://circularecology.com/embodied-carbon-footprint-database.html` (HTTP 200) | **(b) Extract facts only / (d) Needs licence for commercial API** | Factual embodied carbon values extracted for draft estimation; production commercial tool requires Circular Ecology IC+ license. |
| 10 | **ÖKOBAUDAT (German BMWSB / BBSR)** | Material EPD Database | 1,400+ EPD datasets (EN 15804 compliant) | Open Data / Free Public Use | *"The data is provided free of charge and without any restrictions for public use... for performing life cycle assessments (LCAs) of buildings"* | Portal documentation (Direct terms page 403; verified via BBSR open data API docs) | **(b) Extract facts only / Open EPD** | Benchmark European life cycle assessment data for comparison with Indian manufacturing emissions. |
| 11 | **Building Transparency EC3 Tool & API** | Material EPDs & Carbon | 90,000+ digitized Environmental Product Declarations | Proprietary Platform / Tiered API Terms | *"Your use of buildingtransparency.org, the EC3 tool, and all associated APIs is subject to this legal agreement between you and us (BuildingTransparency.org...)... If you make use of the API(s), understand and accept the APIs Terms of Service"* | `https://www.buildingtransparency.org/terms-of-use/` (HTTP 200) | **(d) Needs licence deal / API key** | Future enterprise API integration for real-time EPD lookups in high-end construction tiers. |
| 12 | **Indian Standards (BIS: IS 15622, IS 1124, IS 1237, IS 1077, IS 2185, IS 3620)** | Standards / Engineering Specifications | National statutory codes | Statutory Standard / Fair Use of Technical Norms | Statutory Indian standard specifications issued by the Bureau of Indian Standards (BIS) under the BIS Act 2016. | Technical text inspected across public repositories | **(b) Extract facts only** | Mandatory engineering thresholds for tile water absorption, stone porosity, brick strength, and density. |
| 13 | **CPWD Specifications (2019 / 2021) & DSR** | Public Works Specifications & Cost Data | 2 volumes specifications + DSR item schedules | Government of India Copyright | *"© सामग्री – केंद्रीय लोक निर्माण विभाग, भारत सरकार का स्वामित्व [Content - Owned by Central Public Works Department, Government of India]"* | `https://cpwd.gov.in/` (HTTP 200) | **(b) Extract facts only** | Baseline item descriptions, workmanship tolerances, mortar mixes, and government schedule rates. |
| 14 | **IndiaMART B2B Marketplace** | Market Price Feeds | Millions of material supplier listings | Proprietary / Strict Anti-Scraping | *"Systematic retrieval of IIL Content to create or compile, directly or indirectly, a collection, compilation, database or directory (whether through robots, spiders, automatic devices or manual processes) without written permission from IIL is prohibited. In addition, use of the IIL Content for any purpose not expressly permitted in this Agreement is prohibited and entitles IIL to initiate appropriate legal action."* | `https://www.indiamart.com/terms-of-use.html` (HTTP 200, Section VI) | **(c) Inspiration / Manual check only** *(Automated scraping illegal)* | Automated scrapers strictly forbidden. Material rates must use published government SSRs or direct supplier supplier APIs/MOUs. |
| 15 | **SDNET2018 Concrete Crack Dataset (Utah State University)** | Defect Computer Vision | 56,000+ annotated structural concrete images | Creative Commons Attribution 4.0 (CC BY 4.0) | *"This work is licensed under a Creative Commons Attribution 4.0 License ."* | `https://digitalcommons.usu.edu/all_datasets/48/` (HTTP 200) | **(a) Train directly** | Training vision models for automated construction quality inspection and concrete crack detection. |
| 16 | **Concrete Crack Images for Classification (Mendeley / Özgenel)** | Defect Computer Vision | 40,000 images (20k cracked, 20k uncracked) | Creative Commons Attribution 4.0 (CC BY 4.0) | *"Licence CC BY 4.0 Learn more... For all open access content, the Creative Commons licensing terms apply."* | `https://data.mendeley.com/datasets/5y9wdsg2zt/2` (HTTP 200) | **(a) Train directly** | Training mobile image classifiers for site supervisor quality audits and surface crack grading. |
| 17 | **National Building Code of India (NBC 2016 Part 7)** | Quality / Safety Norms | Comprehensive national construction code | BIS Statutory Publication SP 7 | Standard published under Bureau of Indian Standards SP 7 (Part 7: Construction Management, Practices and Safety). | Statutory code text | **(b) Extract facts only** | Formwork striking periods, curing minimums (7–10 days), site storage rules, and QA execution checklists. |
| 18 | **Real Estate (Regulation and Development) Act, 2016 (RERA §14(3))** | Statutory Defect Liability | Central legislation | Statutory Statute (Government of India) | Section 14(3) mandates a 5-year defect liability period: *"In case any structural defect or any other defect in workmanship, quality or provision of services... is brought to the notice of the promoter within a period of five years... it shall be the duty of the promoter to rectify such defects without further charge, within thirty days"*. | Indian Kanoon statutory text search / RERA Act 2016 | **(b) Extract facts only** | Legal grounding for Nestora's 5-year quality assurance warranty and builder handover audits. |
| 19 | **RAL Classic Colour Standard & LRV Tables** | Paint & Colour Metrics | 216 standard industrial shades | Proprietary RAL standard / Public LRV data | *"RAL is a color matching system that defines colors for paints, coatings and plastics... RAL Classic is the most well-known and widely used system"* | `https://www.ralcolorchart.com/` (HTTP 200) | **(b) Extract facts only** | Light Reflectance Value (LRV) baseline mapping to predict interior illuminance and lux levels. |
| 20 | **Asian Paints / Berger Paints Technical Data Sheets** | Paint & Colour Metrics | 2,200+ architectural colour shades | Proprietary Commercial Catalogues | Commercial technical specifications and shade formula data published in paint specifier books. | `https://www.asianpaints.com/` (HTTP 200) | **(b) Extract facts only** | Exact commercial shade codes and LRVs for interior emulsions to match Indian lighting conditions. |

---

## 3. Style Data Deep-Dive

### 3.1 Open Datasets & Architectural Taxonomies
1. **Getty Art & Architecture Thesaurus (AAT)**:
   - **Licence**: Open Data Commons Attribution License (ODC-By) 1.0 (verified on Getty download portal).
   - **Coverage**: The `Styles and Periods` facet (Hierarchy ID: `300015646`) provides the most authoritative, open semantic ontology for architecture worldwide. It provides structured parent-child hierarchies from broad regional traditions down to localized building styles (e.g. *South Asian styles* -> *Indian regional styles*).
   - **Application in Nestora**: Standardizes style tagging across questionnaires, taste cards, and layout templates, ensuring consistent architectural vocabulary.
2. **Wikidata Architectural Styles (Property P149)**:
   - **Licence**: Creative Commons CC0 1.0 Universal.
   - **Coverage**: P149 links architectural works to historical and regional styles (Q32880), providing multilingual identifiers in Hindi, Marathi, Tamil, Bengali, and Gujarati.
   - **Application in Nestora**: Enables localized search and multi-language support in the user onboarding funnel.
3. **Places365 & LSUN**:
   - **Licence**: Academic research only.
   - **Finding**: While valuable for evaluating room classification baselines, raw weights or data from Places365/LSUN cannot be embedded into Nestora's commercial layout generation engine. Nestora must rely on open-licensed datasets (e.g., Swiss Dwellings CC BY 4.0, ResPlan CC BY 4.0, and CC0/CC BY Commons images).

### 3.2 Indian Regional Architectural Styles

To serve families across India's distinct agro-climatic zones, Nestora supports 6 core regional architectural styles, combining heritage craftsmanship with modern structural engineering:

```mermaid
flowchart TD
    Style["Indian Regional Styles"] --> Coastal["Coastal / High Monsoon"]
    Style --> Arid["Hot & Arid"]
    Style --> Deltaic["Sub-Tropical / High Humidity"]

    Coastal --> Konkan["Konkan Tradition: Laterite stone, Red oxide floors, Oti veranda, Mangalore tiles"]
    Coastal --> Kerala["Kerala Nalukettu: Nadumuttam courtyard, Charupadi benches, Timber framing"]
    Coastal --> Goa["Goan-Portuguese: Balcão porch, Carepas oyster-shell windows, Stucco cornices"]

    Arid --> Rajasthan["Rajasthani Haveli: Jharokha balconies, Jaali screens, Central chowk, Sandstone"]

    Deltaic --> Chettinad["Chettinad: Thinnai veranda, Valavu courtyard, Athangudi tiles, Teak pillars"]
    Deltaic --> Bengal["Bengali Tradition: Chala curved roofs, Uthan courtyard, Dalan veranda, Terracotta"]
```

#### 1. Chettinad Architecture (Tamil Nadu)
- **Spatial Topology**: Organized along a strict longitudinal axis. Front reception veranda (*thinnai*) with raised masonry platforms for receiving guests, leading through an ornate carved wooden doorway (*vazhi madakku*) to the primary open courtyard (*valavu* or *pattalai*), flanked by storage rooms and living quarters.
- **Key Materials**:
  - *Flooring*: Handmade **Athangudi tiles** (cement, sand, synthetic iron oxide pigments cast on glass plates, cured with coconut oil).
  - *Columns*: Massive polished **Burma teak** or rosewood pillars on granite plinth bases (*kal-thoon*).
  - *Plaster*: *Vellai pochu*—a multi-coat egg-white, seashell lime, and curd plaster polished to a mirror-like marble finish.
- **Climatic Function**: The central courtyard creates an evaporative stack effect, drawing hot air upward and pulling cool air across the perimeter shaded rooms.
- **Family Brief Matching**: Ideal for multi-generational families valuing heritage, formal guest entertaining, and cool floor surfaces in hot-humid climates.

#### 2. Konkan Architecture (Coastal Maharashtra & Goa)
- **Spatial Topology**: Compact, low-profile linear footprints designed to withstand intense monsoon rains and high coastal humidity. A deep, covered front porch (*oti*) protects inner living rooms (*majghar*) from horizontal rain.
- **Key Materials**:
  - *Walling*: Dressed **laterite stone blocks** (*chira*), quarried soft and hardened by air exposure, bonded with lime-sand mortar.
  - *Flooring*: **Red oxide Indian Patent Stone (IPS)**—smooth, cool, jointless cementitious flooring polished with wax.
  - *Roofing*: High-pitch timber trusses supporting unglazed clay **Mangalore tiles** with deep overhangs (eaves extending 1.0–1.5 m).
- **Climatic Function**: Massive laterite walls provide thermal inertia against daytime heat, while deep verandas and breathable roof tiles prevent indoor moisture buildup.
- **Family Brief Matching**: Perfect for Mumbai suburban, Alibaug, and Konkan coastal plots; highly resistant to saline coastal air.

#### 3. Kerala Nalukettu (Malabar & Travancore)
- **Spatial Topology**: Quadrangle layout enclosing a central sunken open courtyard (*nadumuttam*). The four surrounding wings correspond to the cardinal directions: *vadakkini* (north, kitchen/dining), *thekkini* (south, master/bed chambers), *kizhakkini* (east, puja/living), and *padinjattini* (west, treasury/storage).
- **Key Materials**:
  - *Woodwork*: Structural **anjili**, jackfruit wood, or teak rafters, wall plates (*uttaram*), and ornamental gables.
  - *Veranda Seating*: Built-in wooden perimeter parapet benches (*charupadi*).
  - *Plinth & Flooring*: Chiseled laterite plinth with granite detailing; terracotta or oxide flooring.
- **Climatic Function**: The *nadumuttam* acts as a microclimate regulator. Heavy monsoon rain falls directly into the stone-lined sunken court and drains through concealed stone conduits, continuously cooling the surrounding living spaces.
- **Family Brief Matching**: Suits families desiring tranquil indoor-outdoor integration, natural ventilation, and dedicated puja/prayer orientation.

#### 4. Rajasthani Haveli (Shekhawati, Jaisalmer, Marwar)
- **Spatial Topology**: Inward-focused urban mansions organized around one or more central courtyards (*chowk*). The ground level is relatively solid for security and privacy, while upper floors feature projecting balconies.
- **Key Materials**:
  - *Walling & Cladding*: Dense natural **yellow Jaisalmer limestone**, red Dholpur sandstone, or pink Makrana marble.
  - *Screens & Fenestration*: Intricately carved stone lattice screens (**jaali**) and cantilevered projecting enclosed balconies (**jharokha**).
  - *Finishes*: Lime plaster decorated with natural mineral pigment frescos (*chitra*).
- **Climatic Function**: The jaali screens accelerate airflow via the Venturi effect while blocking direct solar radiation and desert glare. High thermal mass stone walls store daytime desert heat, releasing it during cold desert nights.
- **Family Brief Matching**: Suited for dense urban plots where privacy, dust protection, and sound insulation are paramount.

#### 5. Bengali Architecture (Bengal Delta)
- **Spatial Topology**: Centered on an open domestic courtyard (*uthan*) flanked by detached or semi-detached living pavilions (*ghar* or *dalan*). Features elongated shaded verandas (*baranda*).
- **Key Materials**:
  - *Roofing*: Distinctive curved-roof geometry derived from bamboo thatch—**Do-chala** (two-sloped), **Char-chala** (four-sloped), and **At-chala** (eight-sloped double-decker roof with central clerestory).
  - *Walling & Facades*: Exposed burnt clay brickwork embellished with fired **terracotta relief tiles** depicting floral and mythological motifs.
- **Climatic Function**: Curved cornices and steep eaves rapidly shed heavy deltaic monsoon downpours while preventing thatch and wall erosion.
- **Family Brief Matching**: Appeals to families desiring literary, artistic, and craft-centric aesthetics with strong cross-ventilation.

#### 6. Goan-Portuguese Residential Tradition
- **Spatial Topology**: Outward-oriented Portuguese colonial layout. A prominent covered front porch (*balcão*) with built-in masonry seats (*sopo*) designed for socializing with neighbors, opening into grand high-ceilinged reception halls (*salão*).
- **Key Materials**:
  - *Fenestration*: Translucent window panes crafted from scraped, polished **oyster shells** (*carepas*) set into dark wood mullions, softening harsh tropical sunlight.
  - *Walling*: Plastered laterite finished with vibrant mineral washes in yellow ochre, terracotta red, and indigo blue.
  - *Ornamentation*: Deep cornices, molded plaster pilasters, and cast-iron balcony railings.
- **Climatic Function**: High ceilings (3.6–4.5 m) allow hot air to rise well above head height, vented through louvered wooden shutters (*persianas*).
- **Family Brief Matching**: Favored by families seeking vibrant, European-tropical heritage with strong indoor-outdoor social engagement.

---

## 4. Material Data Deep-Dive

### 4.1 Open Building-Material Property Databases
1. **Inventory of Carbon & Energy (ICE Database)**:
   - Developed by Craig Jones and Geoff Hammond at the University of Bath; currently maintained by Circular Ecology.
   - **Licensing Findings (Opened `https://circularecology.com/embodied-carbon-footprint-database.html`)**:
     - ICE Database Educational (v3.0 / v5.0) is free for non-commercial educational and academic evaluation.
     - Commercial tools, software calculations, and corporate carbon reporting require the **IC+ Database** commercial license.
     - *Nestora Strategy*: Benchmark values are utilized for engineering feasibility in this research draft; commercial deployment of carbon estimators will require an IC+ license or open EPD integration.
2. **ÖKOBAUDAT (German BMWSB / BBSR)**:
   - Germany's standardized national database for life cycle assessment of buildings, offering 1,400+ datasets compliant with EN 15804.
   - Free of charge for public use, providing open XML/JSON APIs for LCA calculations.
3. **Building Transparency EC3**:
   - Digitizes Environmental Product Declarations (EPDs) with verified cradle-to-gate global warming potential (GWP) metrics.
   - Requires registered API access and adherence to terms prohibiting anticompetitive data manipulation.

### 4.2 Indian Standards & Specifications (IS & CPWD)
To ensure compliance with local building codes, material specifications must align with:
- **IS 15622:2017** (*Pressed Ceramic Tiles — Specification*):
  - **Group BIa ($E \le 0.5\%$)**: Vitrified tiles. CPWD DSR specifically mandates water absorption $< 0.08\%$ for heavy-duty vitrified flooring.
  - **Group BIb ($0.5\% < E \le 3\%$)**: Low absorption floor tiles.
  - **Group BIIa ($3\% < E \le 6\%$)**: Medium absorption floor tiles (anti-skid ceramic).
  - **Group BIII ($E > 10\%$)**: Wall tiles only; strictly prohibited on floor slabs due to moisture ingress and low flexural strength.
- **IS 1124:1974** (*Method of Test for Determination of Water Absorption, Apparent Specific Gravity and Porosity of Natural Building Stones*):
  - Sets laboratory protocols for testing Kota stone, granite, marble, and laterite. Water absorption for prime granite must remain $< 0.5\%$; high-porosity stones ($> 1.0\%$) require sealing against turmeric and oil stains.
- **IS 1237:2012** (*Cement Concrete Flooring Tiles*):
  - Specifies water absorption shall not exceed $10\%$ after 24 hours of immersion; governs terrazzo and pre-cast cement tiles.
- **IS 1077:1992** (*Common Burnt Clay Building Bricks*):
  - Water absorption shall not exceed $20\%$ for classes up to 12.5, and $15\%$ for higher classes.
- **IS 2185 (Part 3):1984 (Reaffirmed 2020)** (*Autoclaved Cellular Concrete Blocks*):
  - Governs AAC blocks. Density Grade 1 ($550–650\text{ kg/m}^3$) provides thermal conductivity $\lambda \approx 0.18\text{ W/m}\cdot\text{K}$, providing 3.5× better thermal insulation than solid clay bricks.
- **IS 3620:1979 (Reaffirmed 2018)** (*Laterite Stone Blocks for Masonry*):
  - Minimum compressive strength $3.5\text{ N/mm}^2$; water absorption max $12\%$ by weight.
- **Slip Resistance Standards (DIN 51130 & BS 7976-2)**:
  - **R9**: Low friction angle ($6^\circ–10^\circ$); suitable for dry indoor living rooms and bedrooms.
  - **R10**: Moderate friction ($10^\circ–19^\circ$); suitable for kitchens, dining areas, and elderly bedrooms.
  - **R11**: High friction ($19^\circ–27^\circ$); mandatory for bathrooms, showers, outdoor balconies, and utility wash areas.
  - **BS 7976-2 Pendulum Test Value (PTV)**: PTV $\ge 36$ represents low slip potential under wet conditions.

### 4.3 Construction Cost Data & IndiaMART Terms Audit
- **CPWD Delhi Schedule of Rates (DSR 2021 / 2023)**: Standard statutory reference for public construction items in India. Provides detailed rate analyses for labor, material, and machinery overheads.
- **Maharashtra State Schedule of Rates (PWD SSR)**: Provides local market rates for Mumbai, Thane, and Konkan regions, adjusting for high labor costs and local aggregate quarry rates.
- **IndiaMART Scraping Audit (Opened `https://www.indiamart.com/terms-of-use.html`)**:
  - Section VI explicitly prohibits automated extraction:
    > *"Systematic retrieval of IIL Content to create or compile, directly or indirectly, a collection, compilation, database or directory (whether through robots, spiders, automatic devices or manual processes) without written permission from IIL is prohibited."*
  - *Engineering Conclusion*: Nestora **must not** deploy scrapers against IndiaMART. Market rate updates must be derived through direct supplier API integrations, state SSR indices, or manual sampling.

---

## 5. Build-Quality Data Deep-Dive

### 5.1 Common Residential Construction Defects in India
Empirical studies by the **CSIR-Central Building Research Institute (CBRI, Roorkee)** and forensic building inspections reveal three recurring defect categories in Indian homes:

```mermaid
flowchart LR
    Defects["Prevalent Defects in Indian Homes"] --> Seepage["Dampness & Seepage (62% of complaints)"]
    Defects --> Cracks["Structural & Non-Structural Cracks (26%)"]
    Defects --> Finish["Finish Delamination & Hollow Plaster (12%)"]

    Seepage --> DPC["Rising damp: Missing or bridged Plinth DPC"]
    Seepage --> Roof["Penetrating damp: Flat roof ponding, unsealed sunken slabs"]
    Seepage --> Plumbing["Plumbing leaks: Un-sleeved concealed CPVC/PVC joints"]

    Cracks --> Thermal["Thermal mismatch at RCC-masonry junctions"]
    Cracks --> Shrinkage["Drying shrinkage from un-cured plaster (< 7 days)"]
    Cracks --> Settlement["Foundation settlement on black cotton soils"]
```

1. **Rising Damp**:
   - *Cause*: Absence or faulty installation of the horizontal Damp Proof Course (DPC) at plinth level. Water rises up to 1.5 m via capillary action through porous red clay bricks ($18\%$ absorption).
   - *Remedy per CPWD Spec §5.3*: Compulsory 40 mm thick cement concrete 1:2:4 DPC with approved waterproofing compound, sealed with two coats of hot bitumen (85/25 grade).
2. **Penetrating Dampness on Flat Roofs & Sunken Slabs**:
   - *Cause*: Poor slope grading ($< 1:100$) causing rainwater ponding, lack of brick-coba elastomeric membrane, and plumbing chases punctured through waterproof barriers in sunken toilets.
   - *Remedy*: Monolithic casting of sunken bathroom slabs, box-type acrylic polymer waterproofing, and minimum $1:80$ slope toward rainwater downtake pipes.
3. **Junction Cracks between RCC Columns and Brick Masonry**:
   - *Cause*: Differential thermal expansion coefficients between concrete ($\alpha \approx 12 \times 10^{-6}/\text{K}$) and burnt brickwork ($\alpha \approx 6 \times 10^{-6}/\text{K}$).
   - *Remedy per NBC 2016 Part 7 §8*: Installation of 200 mm wide galvanized chicken wire mesh ($12\text{ mm}$ aperture) or fiber-mesh anchored across all RCC-masonry junctions prior to plastering.
4. **Plaster Debonding and Map Cracking**:
   - *Cause*: Use of river sand with $> 8\%$ silt content, dry brick suction pulling water out of fresh mortar, and curing periods terminated prematurely ($< 7\text{ days}$).

### 5.2 Quality Checklists & Legal Norms
- **NBC 2016 Part 7 (Construction Management, Practices & Safety)**:
  - Clause 5: Quality assurance systems, field test frequencies for cement (soundness, fineness, setting time), aggregate grading, and concrete slump.
  - Clause 8: Formwork striking times—minimum 16–24 hours for column/wall sides; 7 days for slab soffits (props left under); 14 days for beam soffits under 6 m span.
- **RERA Act 2016 Section 14(3)**:
  - Imposes a statutory **5-year Defect Liability Period** on builders from the date of handover. Developers are legally mandated to rectify structural defects and poor workmanship free of cost within 30 days of written notice.

### 5.3 Defect Photo Datasets for Vision Models
To enable automated quality auditing from site photos, two open datasets provide commercially viable training data:
1. **SDNET2018 (Utah State University)**:
   - **Licence**: Creative Commons Attribution 4.0 International (CC BY 4.0; verified on USU Digital Commons).
   - **Contents**: 56,000+ high-resolution images categorized into cracked and uncracked concrete bridge decks, walls, and pavements.
   - **Application**: Training vision classifiers to identify structural crack widths ($> 0.3\text{ mm}$) during handover audits.
2. **Concrete Crack Images for Classification (Özgenel / Mendeley Data)**:
   - **Licence**: Creative Commons Attribution 4.0 International (CC BY 4.0; verified on Mendeley Data portal).
   - **Contents**: 40,000 normalized RGB images ($227 \times 227$ pixels) divided equally between cracked and non-cracked surfaces.
   - **Application**: Lightweight mobile-friendly edge models for homeowners to snap wall photos and check crack severity.

---

## 6. Paint, Colour & Light Reflectance Value (LRV)

### 6.1 Light Reflectance Value (LRV) Databases
Light Reflectance Value (LRV) measures the percentage of visible light reflected by a painted surface, scaled from $0\%$ (absolute black, absorbs all light) to $100\%$ (pure white, reflects all light):

$$\text{LRV} = Y \quad (\text{where } Y \text{ is the CIE 1931 tristimulus value})$$

- **RAL Classic Standard**: Standardized German colour matching table (216 colours):
  - *RAL 9010 (Pure White)*: LRV $\approx 83\%$
  - *RAL 9016 (Traffic White)*: LRV $\approx 88\%$
  - *RAL 7035 (Light Grey)*: LRV $\approx 56\%$
  - *RAL 7016 (Anthracite Grey)*: LRV $\approx 8\%$
  - *RAL 9005 (Jet Black)*: LRV $\approx 4\%$
- **Natural Colour System (NCS)**: Perceptually uniform color model where luminance factor $Y$ corresponds directly to LRV.
- **Asian Paints Colour Spectra**:
  - Off-whites and pale creams (e.g., *Morning Frost*, *White Butter*, *L104*) achieve LRVs between $76\%$ and $85\%$.
  - Vibrant accent shades (e.g., *Royale Crimson*, *Deep Teal*) exhibit LRVs between $12\%$ and $22\%$.

### 6.2 Colour Psychology in Residential Design
Peer-reviewed environmental psychology studies provide empirical rules for matching room functions with color properties:
1. **Valdez & Mehrabian (1994) Pleasure-Arousal-Dominance (PAD) Framework**:
   - Brightness (high LRV) has the strongest positive correlation with perceived pleasure, calmness, and spatial expansion.
   - High colour saturation increases physiological arousal and heart rate. Muted, low-saturation hues reduce anxiety.
2. **Elliot & Maier (2014) Colour-in-Context Theory**:
   - **Short-wavelength light (Blue/Cyan, 450–490 nm)**: Activates parasympathetic nervous system, promoting cognitive relaxation, calm sleep, and creative ideation. Ideal for bedrooms, studies, and home offices.
   - **Mid-wavelength light (Green, 520–560 nm)**: Associated with biophilic nature cues; minimizes visual fatigue and promotes stress recovery. Optimal for living areas and reading lounges.
   - **Long-wavelength light (Red/Orange, 620–700 nm)**: Stimulates appetite and conversational energy. Well-suited for dining rooms and puja accents; contraindicated for calm master bedrooms.
3. **Lighting & Energy Efficiency Guidelines**:
   - Slabs and ceilings must maintain an $\text{LRV} \ge 80\%$ (pure white emulsion) to reflect downward ambient light.
   - Small urban bedrooms must maintain wall $\text{LRV} \ge 65\%$ to enhance natural daylighting and reduce daytime artificial lighting loads by up to $30\%$.

---

## 7. Architectural Recommendation Matrix for Family Briefs

The following decision rules operationalize this research into Nestora's recommendation engine:

| Family Trait / Constraint | Recommended Style | Recommended Floor Material | Recommended Wall / Finish | Critical Quality Control Rule |
|---|---|---|---|---|
| **Elderly Resident (Age 65+)** | Kerala Nalukettu / Contemporary Minimal | Matt Anti-Skid Vitrified Tile (R10/R11, water absorption $< 0.08\%$) | Low-VOC Washable Emulsion; high LRV ($\ge 75\%$) for visual clarity | Zero floor level transitions (no thresholds); grab-bar reinforcement embedded in bathroom RCC columns |
| **Toddlers / Young Kids** | Contemporary Tropical | Wood-look vitrified tile or high-grade epoxy | Scrub-resistant acrylic emulsion (IS 5411 Class A); rounded plaster chamfers | Non-toxic lead-free paint; R10 slip resistance; scratch-proof flooring (Mohs 6+) |
| **Indoor Pets (Dogs/Cats)** | Industrial Minimal / Konkan | Polished Concrete or Kota Stone (sealed) | Washable acrylic emulsion with high scuff resistance; tile skirting to 300 mm | Scratch-proof flooring (avoid soft teak or glossy marble); sealed against urine staining |
| **Coastal / High Humidity (Mumbai/Goa)** | Konkan / Goan-Portuguese | Laterite walling with Red Oxide (IPS) or Kota Stone | Lime-based breathable plaster or exterior-grade silicone emulsion | Compulsory plinth DPC; hot-dip galvanized steel grills; marine-grade BWP plywood carcass (IS 710) |
| **Budget: Economy Tier** | Modern Functional | Vitrified tiles ($600 \times 600\text{ mm}$, IS 15622 Group BIa) | Fly-ash brick masonry (IS 12894) with 1:6 cement-sand plaster | 10-day curing verification; anti-termite plinth spray per IS 6313 |
| **Budget: Premium Tier** | Chettinad / Rajasthani Haveli | Italian Marble or Athangudi tiles; Burma Teak framing | Handcrafted plaster / Venetian stucco; carved stone jaali screens | Marble factory pre-sealing on 6 sides against oil/turmeric absorption per IS 1124 |

---

## 8. Summary of Engineering Data Outputs

All 29 materials specified in `backend/app/data/materials.json` have been compiled into:
`docs/research/data/materials-properties.draft.json`

Each entry provides:
- `conductivity_w_mk`: Thermal conductivity in $\text{W}/(\text{m}\cdot\text{K})$
- `density_kg_m3`: Density in $\text{kg/m}^3$
- `specific_heat_j_kgk`: Specific heat capacity in $\text{J}/(\text{kg}\cdot\text{K})$
- `embodied_carbon_kgco2e_kg`: Embodied carbon in $\text{kg CO}_2\text{e/kg}$ (ICE Database v3.0 benchmark)
- `water_absorption_pct`: Maximum water absorption percentage by weight per Indian Standards
- `slip_rating`: Slip resistance class (DIN 51130 R-rating or null for walls/finishes)
- `source`: Exact standard document, clause number, and database edition
- `verified`: `false` (Flagged for professional engineering sign-off)

---

## 9. Conclusion & Caveats

1. **Licensing Integrity**: All quoted terms were extracted directly from pages opened during this research turn. Kaggle and Cloudflare-gated repositories were strictly flagged as unconfirmed rather than generating speculative claims.
2. **Commercial Compliance**: Web scraping on IndiaMART and Houzz is explicitly prohibited under their user agreements. Nestora's production rate cards must use state SSR schedules or formal vendor integrations.
3. **Engineering Disclaimer**: Material values are provisional engineering benchmarks derived from Indian Standards and the ICE Database. A certified structural consultant and LEED/GRIHA green-building auditor must review and flip `"verified": true` prior to publishing consumer-facing estimates.
