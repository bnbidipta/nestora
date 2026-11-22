# Comprehensive Residential Design Brief Inputs & Programming Research
**Document:** `docs/research/residential-brief-inputs.md`  
**Target:** Nestora Intake Questionnaire v3 Architecture, Dynamic Brief Engine & Constraint Solver  
**Status:** Architectural Programming Research Draft (`verified: false`)  
**Scope:** Independent Plotted Dwellings & Single-Family Residences  
**Primary Standards & Authorities Referenced:**  
- **RIBA:** Royal Institute of British Architects *Plan of Work 2020* (Stage 0: Strategic Definition; Stage 1: Preparation & Briefing) and *Residential Briefing Framework*
- **AIA:** American Institute of Architects *The Architect’s Handbook of Professional Practice* (15th Edition, Chapter 17: Architectural Programming & Problem Seeking Method)
- **CoA:** Council of Architecture (India) *Manual of Architectural Practice (2020)* & *Conditions of Engagement and Scale of Charges* (Stage 1: Concept Design & Client Brief Development)
- **NBC:** Bureau of Indian Standards *National Building Code of India 2016* (NBC 2016) — Part 3 (Development Control & General Building Requirements), Part 4 (Fire & Life Safety), Part 8 (Building Services), Part 9 (Plumbing Services)
- **BIS:** Bureau of Indian Standards Engineering Codes (IS 456:2000, IS 1893:2016, IS 875:2015, IS 1172:1993, IS 1742:1992, IS 732:2019, IS 13920:2016)
- **Municipal:** *Development Control and Promotion Regulations for Greater Mumbai 2034 (DCPR 2034)*
- **Ergonomics & Graphic Standards:** *Neufert Architects' Data* (4th & 5th Editions); *Time-Saver Standards for Building Types* (4th Edition, DeChiara & Callender); *Time-Saver Standards for Interior Design and Space Planning* (2nd Edition, DeChiara, Panero, Zelnik)

---

## Executive Summary & Briefing Philosophy

In professional architectural practice, the client brief is not a passive shopping list of rooms; it is an active diagnostic investigation into how a family lives, how their physical site behaves, and how their spatial needs will evolve over decades. Standard consumer intake forms often fail because they operate at a superficial level (e.g., "How many BHKs do you want?"). A practicing architect inquires several layers deeper to uncover the hidden behavioral patterns, regulatory boundaries, environmental constraints, and structural parameters that govern architectural form.

Every input documented below serves as an active constraint or generative variable in the design process. If an input does not change a specific architectural drawing, structural column grid, fenestration orientation, MEP routing, or spatial adjacency, it has been excluded.

This document synthesizes **66 granular architectural inputs** categorized under the 7 mandated briefing headings, followed by a definitive ranked analysis of the **30 inputs that change the design most**.

---

## 1. Site Inputs

### 1.1 Boundary Dimensions, Area & Geometry
* **Why It Matters (Design Decision Changed):** Establishes the absolute legal building envelope. Boundary dimensions dictate the statutory maximum ground coverage, permissible Floor Space Index (FSI/FAR), mandatory front/rear/side marginal setbacks, maximum building footprint aspect ratio, and the primary structural column bay grid (typically 3.0 m to 6.0 m intervals).
* **How Architects Typically Ask It:** *"Do you have a certified land survey map or revenue deed showing the exact perimeter boundary dimensions (in feet or meters), corner bearings, and total registered plot area?"*
* **Sensible Default (if Unknown):** 30 ft × 50 ft (1,500 sqft / 139.35 m²) rectangular suburban plot with 30 ft road frontage (a standard middle-density urban residential plot in India).
* **Source:** NBC 2016 Part 3 Clause 4.2 & 5.2; DCPR 2034 Regulation 30 & Table 12; Neufert Architects' Data 4th Ed, p. 245.

### 1.2 Irregular Shape, Splay & Corner Chamfers
* **Why It Matters (Design Decision Changed):** Non-orthogonal geometry (trapezoidal, triangular, skewed property lines) forces an immediate structural decision: adopt an orthogonal structural frame with irregular triangular perimeter garden pockets, or design non-orthogonal faceted/curved walls (which increases structural formwork costs by 15–25% and creates awkward internal dead corners). Corner plots often require statutory road-junction chamfers (typically 3.0 m × 3.0 m splay).
* **How Architects Typically Ask It:** *"Are the four corners of your plot true 90-degree right angles, or does the plot taper, splay at a street corner, or have non-parallel property lines?"*
* **Sensible Default (if Unknown):** True rectangular plot with 90° corners; zero boundary splay unless identified as a corner plot.
* **Source:** AIA Handbook of Professional Practice 15th Ed, Chapter 17.1; DCPR 2034 Regulation 43(1) (Corner Splay Requirements); Neufert 4th Ed, p. 246.

### 1.3 Slope, Contours & Topography
* **Why It Matters (Design Decision Changed):** Determines whether the house is built as a single flat slab-on-grade or requires split-level floors, stepped foundations, cut-and-fill earth retaining walls, or walk-out basements. Topography also dictates whether sanitary sewage and stormwater drain naturally by gravity or require expensive macerator lift pumping stations.
* **How Architects Typically Ask It:** *"Does the ground slope visibly across the property? What is the estimated difference in height between the highest point and lowest point of the land?"*
* **Sensible Default (if Unknown):** Flat terrain (slope < 1:50 / 2%), requiring minimal earth leveling and standard shallow isolated or strip footings.
* **Source:** NBC 2016 Part 3 Clause 5.1; Time-Saver Standards for Site Planning (DeChiara & Koppelman 2nd Ed), Section 2.2; IS 1904:1986 Clause 4.1.

### 1.4 Site Levels, Road Crown Datum & Plinth Height
* **Why It Matters (Design Decision Changed):** Determines the Finished Floor Level (FFL) of the ground floor relative to the municipal road crown. Insufficient plinth height leads to catastrophic monsoon stormwater backflow. Dictates the length and gradient of the vehicular driveway ramp (maximum permissible slope 1:8 to 1:10) and entry porch steps/ramps.
* **How Architects Typically Ask It:** *"Is the surface of your plot higher, lower, or at the exact same elevation as the crown of the paved street outside? Has the street been resurfaced recently?"*
* **Sensible Default (if Unknown):** Ground floor plinth set at minimum 450 mm to 600 mm above the permanent municipal road crown level; vehicular driveway ramp designed at 1:10 slope.
* **Source:** NBC 2016 Part 3 Clause 4.4 (Plinth Requirements); DCPR 2034 Regulation 37(15); IS 1742:1992 Clause 4.1.

### 1.5 Existing Trees & Protected Flora
* **Why It Matters (Design Decision Changed):** Mature specimen trees dictate the placement of building footprints and courtyard voids. In most jurisdictions (e.g. Maharashtra Tree Authority), felling mature trees requires formal statutory permits and compensatory planting. Trees establish Root Protection Zones (RPZs, typically 12× trunk diameter), within which foundation excavation is prohibited or requires cantilevered grade beams.
* **How Architects Typically Ask It:** *"Are there any mature or heritage trees on the property? Where are they located, and are there specific trees your family wishes to preserve as a central design feature?"*
* **Sensible Default (if Unknown):** Clear plot free of protected mature trees requiring statutory preservation or footprint displacement.
* **Source:** Maharashtra (Urban Areas) Protection and Preservation of Trees Act 1975; BS 5837:2012 (Trees in relation to design, demolition and construction); RIBA Plan of Work 2020 Stage 1.

### 1.6 Neighbours, Adjoining Heights & Privacy Overlooking
* **Why It Matters (Design Decision Changed):** Dictates fenestration placement and privacy buffers. Tall adjacent buildings (e.g. 4-storey apartments next to a bungalow) look directly down onto private terraces and rear gardens, forcing the architect to design internal introverted courtyards, high clerestory windows, angled louvers, or blank structural party walls on sensitive boundary faces.
* **How Architects Typically Ask It:** *"What is currently built on your left, right, and rear property lines? How many storeys tall are neighbouring buildings, and do they have windows or balconies looking into your plot?"*
* **Sensible Default (if Unknown):** Low-rise G+1 or G+2 residential neighbours on three sides with standard 1.5 m marginal setbacks; moderate privacy overlooking managed by window offset alignments.
* **Source:** NBC 2016 Part 3 Clause 5.2.1; DCPR 2034 Regulation 41 Table 15; Neufert Architects' Data 4th Ed, p. 248.

### 1.7 Views, Sightlines & Visual Orientation
* **Why It Matters (Design Decision Changed):** Establishes the orientation of primary habitable spaces (living room, master bedroom, outdoor decks) towards scenic vistas (distant hills, ocean, garden canopies, quiet street trees) while deliberately placing utilitarian service functions (bathrooms, laundry, stairwells, utility yards) towards ugly sightlines (neighbor service ducts, garbage dumps, blind party walls).
* **How Architects Typically Ask It:** *"What is the most beautiful or pleasant view from your property, and conversely, what is an unsightly view that you never want to see from your living room or bedroom?"*
* **Sensible Default (if Unknown):** Primary visual axis oriented towards the front street/landscaped garden; rear and side views treated as secondary or directed into private internal courtyards.
* **Source:** AIA Handbook of Professional Practice 15th Ed, Chapter 17.1; RIBA Plan of Work 2020 Stage 1 Briefing.

### 1.8 Acoustic Environment & Ambient Noise Sources
* **Why It Matters (Design Decision Changed):** Dictates zoning of quiet spaces (bedrooms, study) versus active spaces. Heavy ambient noise (highway traffic, railway line, commercial street, religious loudspeakers) forces bedrooms to the shielded rear of the site, requires solid masonry boundary buffer walls, and upgrades window specifications from standard single glass to acoustic double-glazed units (DGU with STC 35–42 dB).
* **How Architects Typically Ask It:** *"How noisy is your street during morning rush hours and late at night? Are there nearby train tracks, bus stops, schools, commercial shops, or religious institutions that broadcast sound?"*
* **Sensible Default (if Unknown):** Moderate suburban ambient noise (~50–55 dBA daytime, ~45 dBA nighttime); bedrooms positioned toward the quieter rear or side yards with standard double-glazed windows.
* **Source:** NBC 2016 Part 8 Building Services, Section 4 (Acoustics, Sound Insulation and Noise Control) Table 1 & Clause 3.2; Central Pollution Control Board (CPCB) Noise Standards 2000.

### 1.9 Sun Path & Solar Orientation
* **Why It Matters (Design Decision Changed):** The sun path determines building orientation to maximize natural daylighting while minimizing unconditioned solar heat gain. Directs placement of South and West facade horizontal/vertical shading overhangs (chhajjas/louvers), locates North-facing artist/work desks for glare-free illumination, and identifies unshaded rooftop zones for solar PV panels.
* **How Architects Typically Ask It:** *"Which cardinal direction does your road and main gate face? Does the hot afternoon sun beat down on the front or the back of the property?"*
* **Sensible Default (if Unknown):** Verified via cadastral map or site compass; building massing oriented with long axis East-West, minimizing unshaded West-facing glass to curb peak air-conditioning cooling loads.
* **Source:** NBC 2016 Part 8 Section 1 Clause 4.2; Energy Conservation Building Code (ECBC) 2017 / Eco-Niwas Samhita 2021 Part 1 (Building Envelope - RETV); Neufert 4th Ed, p. 115.

### 1.10 Wind Direction & Prevailing Microclimate Breeze
* **Why It Matters (Design Decision Changed):** Determines the placement of operable window fenestration on opposing walls to establish natural cross-ventilation axes. In tropical and monsoon climates, capturing the prevailing summer breeze (typically South-West in peninsular India) dramatically reduces mechanical air-conditioning reliance and evacuates humid indoor air.
* **How Architects Typically Ask It:** *"Where does the cool evening breeze blow from across the land? Are there neighbouring buildings or high walls that block the natural breeze?"*
* **Sensible Default (if Unknown):** Prevailing warm-season breeze originating from South-West; cross-ventilation pathway designed through the primary living and dining axis with aligned pressure-differential openings.
* **Source:** NBC 2016 Part 8 Section 1 Clause 5.2 (Natural Ventilation); Neufert 4th Ed, p. 115.

### 1.11 Existing Structures, Wells & Subterranean Encumbrances
* **Why It Matters (Design Decision Changed):** Dictates demolition budgets, permits, and structural risks. Abandoned open water wells, active borewells, or decommissioned septic tanks represent weak subsoil pockets that cannot support structural column footings without expensive pile foundations or structural bridging grade beams.
* **How Architects Typically Ask It:** *"Is the land completely vacant, or are there existing old structures, foundations, an open well, or an active borewell that must be demolished, capped, or incorporated?"*
* **Sensible Default (if Unknown):** Greenfield site with no underground encumbrances, buried foundations, or decommissioned septic tanks.
* **Source:** AIA Handbook of Professional Practice 15th Ed Chapter 17.1; IS 1904:1986 Clause 4.2; CoA Manual of Architectural Practice 2020.

### 1.12 Municipal Infrastructure & Utility Connections
* **Why It Matters (Design Decision Changed):** The depth and invert level of the public street sewer determines whether basement or ground-floor plumbing fixtures discharge via gravity or need a sewage ejector pump. Municipal water supply hours and pressure determine underground water sump storage sizing. Overhead electrical power lines (HT/LT) crossing the site enforce statutory safety clearance zones (minimum 2.5 m to 3.7 m horizontal/vertical), cutting into buildable volume.
* **How Architects Typically Ask It:** *"Is there an underground municipal sewer line and piped municipal water supply in the street outside? What are the water supply hours? Are there overhead electricity power cables crossing into your property line?"*
* **Sensible Default (if Unknown):** Intermittent municipal water supply (2–3 hours daily); municipal gravity sewer available in street at 1.5 m invert depth; underground 3-phase electrical power cable at plot boundary; zero overhead power line encumbrances.
* **Source:** NBC 2016 Part 9 Plumbing Services, Section 1 & 2; Indian Electricity Rules 1956 Rules 79 & 80 (Clearance from buildings of lines).

### 1.13 Road Frontage, Right-of-Way & Vehicular Ingress
* **Why It Matters (Design Decision Changed):** Road width directly limits statutory permissible FSI under urban town planning bylaws (e.g. roads < 9.0 m wide in Mumbai suburbs receive only 1.0 base FSI, whereas roads $\ge 9.0\text{ m}$ allow up to 2.0 FSI). Road frontage width dictates entry gate width (min 3.0 m for car), driveway turning circle radius (min 5.0 m to 6.0 m), and safe vehicular sight distance when backing out.
* **How Architects Typically Ask It:** *"What is the exact width of the access street fronting your property? Is it a dead-end private lane, a two-lane municipal road, or a busy main avenue? Are there street trees, electrical poles, or storm gutters blocking your gate entrance?"*
* **Sensible Default (if Unknown):** 9.0 m (30 ft) paved municipal road; 3.5 m wide main vehicular sliding/swing gate with an adjacent 1.0 m pedestrian wicket gate.
* **Source:** NBC 2016 Part 3 Clause 4.3; DCPR 2034 Regulation 30 Table 12 & Regulation 44; Indian Roads Congress (IRC) SP:41 Guidelines for Urban Roads.

### 1.14 Soil Stratigraphy & Geotechnical Bearing Capacity
* **Why It Matters (Design Decision Changed):** Determines the entire structural foundation engineering typology. Hard basalt rock or dense gravel allows economical shallow isolated column footings at 1.5 m depth; expansive black cotton clay or soft marine clay requires costly under-reamed bored piles (6.0 m to 12.0 m deep) or a monolithic raft slab, shifting 15% to 30% of total civil structural expenditure below ground.
* **How Architects Typically Ask It:** *"Has a geotechnical soil bore test been conducted on the land? Do you know what lies beneath the surface: hard rock, red murrum, loose clay, or filled earth?"*
* **Sensible Default (if Unknown):** Medium dense gravel/weathered rock (murrum) with presumptive Safe Bearing Capacity (SBC) of 150 to 180 kN/m² at 1.5 m depth below ground level; standard isolated reinforced concrete footings.
* **Source:** IS 1904:1986 (Code of practice for design and construction of foundations in soils) Clause 4 & Table 1; NBC 2016 Part 6 Structural Design, Section 2 (Soils and Foundations) Table 1.

### 1.15 Flood History, Seasonal Waterlogging & Stormwater Outfall
* **Why It Matters (Design Decision Changed):** Dictates minimum plinth elevation, eliminates subterranean basements in high water-table zones, sizes emergency stormwater sump pumps, and enforces compliance with statutory Coastal Regulation Zone (CRZ) or river flood plain setbacks.
* **How Architects Typically Ask It:** *"During the heaviest monsoon cloudbursts, does rainwater ever pool or flood on your plot or in the street outside? What is the highest water level the neighborhood has experienced in recent memory?"*
* **Sensible Default (if Unknown):** Zero waterlogging on the plot; surface stormwater sheds naturally to municipal roadside storm gutters; site sits comfortably outside CRZ and 100-year flood lines.
* **Source:** NBC 2016 Part 3 Clause 4.4 & Part 9 Section 5; National Disaster Management Authority (NDMA) Urban Flooding Guidelines 2010.

---

## 2. Household & Demographics Inputs

### 2.1 Occupant Inventory, Ages & Generational Structure
* **Why It Matters (Design Decision Changed):** The fundamental basis of space planning. Determines total bedroom and bathroom counts, spatial zoning between generations (e.g., elderly parents on ground floor, parents' master suite, children's wing), acoustic separation, and common living space sizing.
* **How Architects Typically Ask It:** *"Who will live in the home on a permanent daily basis? Could you share each person's age, their relationship, and who needs their own private room?"*
* **Sensible Default (if Unknown):** 4 to 5 occupants: 2 working adults (parents, 40–45 yrs), 2 growing children (10–18 yrs), and 1 resident elderly grandparent (70+ yrs).
* **Source:** AIA Handbook of Professional Practice 15th Ed Chapter 17.1; Neufert Architects' Data 4th Ed, p. 248; Time-Saver Standards for Building Types 4th Ed, p. 812.

### 2.2 Daily Routines, Occupancy Cycles & Peak Traffic Clashes
* **Why It Matters (Design Decision Changed):** Pinpoints peak plumbing and circulation bottlenecks (typically 7:00 AM to 8:30 AM weekday rush), requiring simultaneous bathroom fixtures and dedicated kitchen breakfast bar throughput. Midday occupancy dictates whether common living spaces require continuous daytime thermal comfort and daylighting.
* **How Architects Typically Ask It:** *"Walk me through a typical weekday morning for your household between 6:30 AM and 9:00 AM. Who wakes up first, who needs to get ready simultaneously, and how does breakfast and departure unfold?"*
* **Sensible Default (if Unknown):** Peak morning bathroom and breakfast concurrency between 7:15 AM and 8:15 AM; 1 adult working remotely during the day; entire family congregating in living/dining from 7:30 PM onwards.
* **Source:** RIBA Residential Briefing Framework 2020; Neufert 4th Ed, p. 249.

### 2.3 Mobility, Physical Abilities & Universal Accessibility (Aging-in-Place)
* **Why It Matters (Design Decision Changed):** Enforces barrier-free universal design: eliminates sunken bathroom thresholds, specifies minimum 900 mm clear door widths, 1200 mm wide hallway corridors, 1500 mm wheelchair turning radii, step-free roll-in showers with wall-blocking for grab bars, and mandates a full master bedroom suite on the ground floor.
* **How Architects Typically Ask It:** *"Does anyone in your family experience knee pain, joint stiffness, or mobility challenges with stairs? Would you like this home designed so that you or your parents can live on the ground floor without navigating any steps?"*
* **Sensible Default (if Unknown):** Step-free accessible main entry ramp (slope 1:12); at least one complete master suite with accessible ensuite bathroom located on the ground floor; provision of space for future elevator installation.
* **Source:** NBC 2016 Part 3 Clause 13 (Requirements for Persons with Disabilities); CPWD Guidelines for Barrier Free Built Environment 2021; ADA Standards for Accessible Design 2010 Sections 304 & 404.

### 2.4 Health Conditions, Allergies & Environmental Sensitivities
* **Why It Matters (Design Decision Changed):** Directly affects indoor air quality (IAQ) and material specifications. Respiratory asthma or severe dust-mite allergies necessitate mechanical heat/energy recovery ventilation (HRV/ERV) with HEPA filtration, zero-VOC mineral paints, formaldehydeless cabinetry, elimination of dust-trapping soft carpeting, and mold-resistant lime plasters.
* **How Architects Typically Ask It:** *"Does any family member suffer from asthma, dust or pollen allergies, chemical sensitivities, or require specialized health equipment (like CPAP machines or oxygen concentrators) at home?"*
* **Sensible Default (if Unknown):** Standard healthy domestic environment; low-VOC wall finishes; no specialized medical electrical circuits required.
* **Source:** WELL Building Standard v2 (Air and Materials Features); NBC 2016 Part 8 Section 3 Clause 4.1.

### 2.5 Sleep Schedules, Chronotypes & Acoustic Isolation
* **Why It Matters (Design Decision Changed):** Differentiates night owls from early risers. Prevents early morning kitchen clatter or late-night TV noise from disturbing light sleepers. Dictates partition wall acoustic ratings (STC $\ge 45\text{ dB}$ using staggered stud or double-brick walls) and isolates bedroom headboard walls from plumbing soil stacks and elevator shafts.
* **How Architects Typically Ask It:** *"Is anyone in the house a particularly light sleeper, a night owl, or an early riser? Does anyone work late shifts or require deep daytime sleep?"*
* **Sensible Default (if Unknown):** Standard diurnal sleep schedule (11:00 PM sleep, 6:30 AM wake); standard partition wall acoustic buffering (STC 40–45 dB); bedroom headboards positioned away from plumbing walls.
* **Source:** NBC 2016 Part 8 Section 4 Clause 3.2 (Acoustic Ratings for Residential Rooms); Neufert 4th Ed, p. 118.

### 2.6 Overnight Guests & Extended Family Visits
* **Why It Matters (Design Decision Changed):** Dictates whether a permanent dedicated guest bedroom with private ensuite bathroom is justified, or if a flexible multi-purpose study/den with a premium sofa-bed and adjacent powder room is more space-efficient. Sizes linen and luggage storage closets.
* **How Architects Typically Ask It:** *"How often do relatives, parents, or out-of-town guests stay overnight in your home? When they visit, how long do they usually stay, and how many people stay simultaneously during holidays or family events?"*
* **Sensible Default (if Unknown):** Occasional overnight guests (1–2 weekends per month, 1–2 persons); 1 dedicated guest bedroom on the ground floor with an attached 3-fixture bathroom.
* **Source:** AIA Handbook of Professional Practice 15th Ed Chapter 17.1; Neufert Architects' Data 4th Ed, p. 254.

### 2.7 Domestic Staff, Staffing Model & Service Circulation
* **Why It Matters (Design Decision Changed):** Live-in domestic staff requires dedicated quarters (bedroom + private bathroom) and independent service access. Daily part-time staff (maid, cook, driver) requires a dedicated exterior staff toilet/change room, separate service entrance, and direct exterior access to the wet kitchen and laundry yard without crossing private living zones.
* **How Architects Typically Ask It:** *"What is your domestic help routine: will you have live-in domestic staff (cook, maid, driver, caretaker) needing their own bedroom and bathroom, or daily part-time helpers who come for cleaning and cooking?"*
* **Sensible Default (if Unknown):** Daily part-time domestic helpers (visiting 1–2 times daily); requires an exterior-accessed staff toilet/washroom, utility wash yard, and direct service entrance to the kitchen/utility area.
* **Source:** CoA Manual of Architectural Practice 2020; Time-Saver Standards for Building Types 4th Ed, p. 815; NBC 2016 Part 3 Clause 4.5.

### 2.8 Pets, Companion Animals & Spatial Features
* **Why It Matters (Design Decision Changed):** Requires scratch-resistant, non-porous flooring (vitrified tile or honed natural stone instead of soft timber or porous marble), dedicated pet washing shower station in the utility/garage, integrated feeding bowl nooks, cat litter box ventilation exhaust, and escape-proof perimeter garden fencing.
* **How Architects Typically Ask It:** *"Do you have dogs, cats, or other pets living with you, or plan to get one? Where do they sleep, eat, and relieve themselves, and do they spend time indoors, outdoors, or both?"*
* **Sensible Default (if Unknown):** No indoor pets; or 1 medium dog requiring durable non-scratch flooring, non-toxic garden landscaping, and an exterior wash tap in the utility yard.
* **Source:** RIBA Residential Design Guide 2020; AIA Handbook 15th Ed Chapter 17.1.

### 2.9 10- to 20-Year Family Lifecycle Evolution & Adaptability
* **Why It Matters (Design Decision Changed):** Houses are 50-year assets. Designing strictly for today leads to rapid functional obsolescence as children leave for university (leaving empty bedrooms), aging parents move in, or married children return. The architect must plan for future internal adaptations: convertible rooms, structural slabs that accommodate future vertical floors, or locating staircases near the main entrance so an upper level can be partitioned into an independent rental flat.
* **How Architects Typically Ask It:** *"How do you see your family structure changing over the next 10 to 15 years? Will children be leaving for college, might aging parents move in, or would you ever want the option to rent out an upper floor as an independent unit?"*
* **Sensible Default (if Unknown):** Ground floor designed with full aging-in-place capacity; staircase positioned near the entrance vestibule allowing upper floor segregation; structural slab designed for future vertical expansion.
* **Source:** RIBA Plan of Work 2020 Stage 1 (Adaptability and Longevity); Habraken, N.J., *Supports: An Alternative to Mass Housing* (Open Building Theory).

---

## 3. Room Program: Sizing & Placement Inputs

### 3.1 Master Bedroom Suite
* **Why It Matters (Design Decision Changed):** Largest private room on the plan. Sizing depends on bed dimensions (King: 1.83 m × 2.0 m / 72" × 78" plus 900 mm walk-around clearance on three sides), wardrobe capacity (minimum 3.0 m to 4.5 m linear run per couple for hanging, drawers, and folded storage), walk-in dressing room vs built-in cupboards, 4-fixture bathroom (double vanity, private WC cubicle, walk-in rain shower, soaking tub), and private balcony access.
* **How Architects Typically Ask It:** *"What size bed do you sleep in? How many linear feet of wardrobe storage does each partner need? Do you want a walk-in dressing room, double sinks in the bathroom, a bathtub, and a private balcony?"*
* **Sensible Default (if Unknown):** King-size bed (1.8 m × 2.0 m); minimum 200 sqft (18.5 m²) bedroom area; 3.6 m linear wardrobe run; 4-fixture ensuite bathroom (75 sqft / 7.0 m²) with double sink vanity and glass walk-in shower; attached 50 sqft private balcony.
* **Source:** NBC 2016 Part 3 Clause 4.5; Neufert Architects' Data 4th Ed, pp. 250–252; Time-Saver Standards for Interior Design, pp. 112–118.

### 3.2 Secondary & Children’s Bedrooms
* **Why It Matters (Design Decision Changed):** Sized for single or Queen bed (1.5 m × 2.0 m), dedicated study desk (min 1.2 m × 0.6 m) with task lighting and ergonomic chair pull-out clearance (min 900 mm), built-in wardrobe (min 1.8 m to 2.4 m linear run), bookshelves, and ensuite 3-fixture bathroom (or shared Jack-and-Jill bathroom between siblings).
* **How Architects Typically Ask It:** *"How many bedrooms do your children need? Do they study in their bedrooms, requiring dedicated desks and extensive bookshelves, and should each bedroom have its own private attached bathroom?"*
* **Sensible Default (if Unknown):** Queen or twin bed; minimum 130–150 sqft (12.0–14.0 m²) carpet area; 2.0 m linear wardrobe; dedicated 1.2 m study desk; ensuite 3-fixture bathroom (35–40 sqft / 3.3–3.7 m²).
* **Source:** NBC 2016 Part 3 Clause 4.5; Neufert 4th Ed, p. 253; DCPR 2034 Regulation 37(1).

### 3.3 Kitchen Architecture: Cooking Style, Wet vs Dry, & Appliances
* **Why It Matters (Design Decision Changed):** Primary functional and cultural engine of the house. Intensive traditional Indian cooking (spices, oil frying, heavy tadka) generates airborne oil grease and strong aromas, requiring an enclosed kitchen with high-capacity chimney exhaust (min 1200–1500 m³/hr) or a dual-kitchen layout: a clean open-concept "dry/show kitchen" for coffee, reheating, and light prep, paired with an enclosed "wet kitchen / scullery" for heavy frying and vessel scrubbing. Dictates the kitchen work triangle (sink-cooktop-refrigerator perimeter between 4.0 m and 7.0 m) and appliance alcoves (double-door 600L fridge, built-in microwave/oven, 60cm/90cm dishwasher, RO purifier).
* **How Architects Typically Ask It:** *"How does cooking happen in your home: do you want an open Western-style show kitchen connected to the dining room, or an enclosed kitchen (or a two-kitchen setup: clean dry kitchen + heavy wet utility kitchen)? What specific appliances must be integrated?"*
* **Sensible Default (if Unknown):** Semi-open kitchen (100–120 sqft / 9.5–11.0 m²) with a high-capacity suction hood (1200 m³/hr), attached separate enclosed wet utility scullery (50–60 sqft / 4.6–5.5 m²) for vessel washing, dishwasher, and washing machine.
* **Source:** NBC 2016 Part 3 Clause 4.6 (Kitchen Dimensions & Clearances); Neufert Architects' Data 4th Ed, pp. 260–267; Time-Saver Standards for Building Types 4th Ed, pp. 822–828.

### 3.4 Living Room & Formal Parlour
* **Why It Matters (Design Decision Changed):** The main public reception room. Dictates furniture conversational groupings (ideal conversational distance 2.4 m to 3.6 m across facing seats), seating capacity (formal seating for 6 to 10 adults), focal alignment (garden view vs art display vs television), ceiling volume (standard single-height vs dramatic double-height void), and spatial buffer from private family zones.
* **How Architects Typically Ask It:** *"Do you want one combined living space for both entertaining guests and everyday family relaxation, or two distinct spaces: a formal parlour for receiving visitors and an informal family den for watching TV in comfort? How many people should be able to sit down together?"*
* **Sensible Default (if Unknown):** Formal living room (220–280 sqft / 20–26 m²) oriented towards front garden/verandah; separate upper-floor informal family lounge (150–180 sqft / 14–17 m²) for TV and casual relaxation.
* **Source:** Neufert 4th Ed, pp. 256–259; Time-Saver Standards for Interior Design, pp. 88–95; NBC 2016 Part 3 Clause 4.5.

### 3.5 Dining Room & Table Capacity
* **Why It Matters (Design Decision Changed):** Dictates table geometry (6-seater: 1.8 m × 0.9 m; 8-seater: 2.4 m × 1.0 m; 10-seater: 3.0 m × 1.1 m), perimeter circulation clearances (min 900 mm from table edge to wall for chair push-back; 1200 mm for food service passage), direct serving counter connection to kitchen, and placement of a dedicated handwash washbasin alcove buffered from dining sightlines.
* **How Architects Typically Ask It:** *"How many people sit down for dinner on a normal evening, and how large should the table expand to when hosting dinner parties or family festivals? Do you require a dedicated handwash sink nearby?"*
* **Sensible Default (if Unknown):** 6-to-8-seater dining table; dining room area 140–180 sqft (13.0–16.7 m²); dedicated handwash counter alcove buffered from direct dining view; direct serving counter link to kitchen.
* **Source:** Neufert Architects' Data 4th Ed, p. 258; Time-Saver Standards for Building Types 4th Ed, p. 819.

### 3.6 Study / Dedicated Home Office
* **Why It Matters (Design Decision Changed):** Full-time remote work requires an acoustically isolated room with a solid-core door (STC $\ge 35\text{ dB}$), professional video call backdrop (preventing blinding backlight from windows behind the desk), desk ergonomics (min 1.5 m × 0.8 m surface for dual monitors), cable management trunking, bookshelves, and glare-free North/East natural daylight.
* **How Architects Typically Ask It:** *"Do you or your partner work from home regularly? Do you need a dedicated acoustically private room for confidential video conferences, or is an open study nook sufficient? Will more than one person work here simultaneously?"*
* **Sensible Default (if Unknown):** Dedicated 100–120 sqft (9.3–11.1 m²) home office on a quiet upper level; acoustic door; non-glare North/East natural daylight; integrated shelving and data trunking.
* **Source:** Neufert 4th Ed, p. 255; CIBSE Code for Lighting (Workplace Standards); NBC 2016 Part 8 Section 1.

### 3.7 Puja / Prayer Room / Sacred Sanctum
* **Why It Matters (Design Decision Changed):** Dictates strict orientation and layout parameters in Indian residential programming (North-East / Ishanya corner, devotee facing East or North while praying), exhaust ventilation for incense and oil lamp smoke, marble or stone floor cladding, storage for ritual brass vessels and scriptures, and a dedicated shoe-removal threshold.
* **How Architects Typically Ask It:** *"Do you require a dedicated walk-in Puja/prayer room, or a designed mandir cabinet/alcove? Do you follow traditional Vaastu or specific cardinal orientations for prayer?"*
* **Sensible Default (if Unknown):** Dedicated walk-in Puja room (35–50 sqft / 3.3–4.6 m²) located in the North-East zone of the house; natural marble floor; exhaust fan or operable window for smoke exhaust; shoe-removal threshold.
* **Source:** NBC 2016 Part 3 Clause 4.5 (Pooja/Prayer room minimums); Indian Architectural Traditions / Vastu Vidya texts (Mayamata / Manasara); docs/traditions-research.md.

### 3.8 Home Theatre / Media Room
* **Why It Matters (Design Decision Changed):** Sizing depends on projection throw distance (min 3.8 m to 4.5 m viewing distance for a 120" 4K projection screen), acoustic isolation (double drywall with Green Glue or resilient channels, STC $\ge 55\text{ dB}$, bass traps), complete blackout environment (zero exterior windows or motorized blackout cassettes), tiered recliner seating, and a dedicated ventilated closet for heat-generating AV amplifiers.
* **How Architects Typically Ask It:** *"Are you serious cinema/gaming enthusiasts who want a dedicated blacked-out, acoustically treated home theatre with a projector and surround sound, or does your family prefer watching TV in the family lounge?"*
* **Sensible Default (if Unknown):** Integrated 75"-85" television setup in the informal family lounge; if a dedicated home theatre is requested, a 220–280 sqft (20–26 m²) acoustically isolated room with 6–8 recliner seats and no exterior windows.
* **Source:** CEDIA (Custom Electronic Design & Installation Association) Home Theater Standards CEB-22 & CEB-23; Neufert 4th Ed, p. 385.

### 3.9 Gym, Fitness & Yoga Studio
* **Why It Matters (Design Decision Changed):** Dictates structural floor slab live-load engineering (gym equipment and dropped free weights require 4.0 to 5.0 kN/m² design capacity vs standard residential 2.0 kN/m²), clear ceiling height ($\ge 3.0\text{ m}$ for overhead dumbbell presses and pull-ups), impact-absorbing rubber/cork flooring, high fresh air ventilation rates (6–8 air changes per hour), and full-height mirrors.
* **How Architects Typically Ask It:** *"Do you exercise at home? What equipment do you use (treadmill, spin bike, free weights, power rack, or yoga mats)? Does it require its own dedicated room or can it share a terrace/den?"*
* **Sensible Default (if Unknown):** Multi-purpose wellness/yoga room (120–150 sqft / 11–14 m²) with natural morning daylight, wooden or cork flooring, and provision for 1 treadmill and free weights.
* **Source:** IS 875 (Part 2):2015 Table 1 (Imposed Floor Loads for Gymnasium: 4.0 to 5.0 kN/m²); Neufert 4th Ed, pp. 490–495.

### 3.10 Guest Bedroom(s)
* **Why It Matters (Design Decision Changed):** Sizing for double/queen bed, luggage bench, wardrobe (min 1.2 m run), and ensuite 3-fixture bathroom. Ground-floor placement is mandatory if visiting grandparents or elderly guests stay, while upper-floor placement is preferred if guests are peers or young friends.
* **How Architects Typically Ask It:** *"Where should your guest room be situated: on the ground floor for easy access by elderly relatives, or upstairs for maximum privacy? Does it need an ensuite bathroom or can it share with a powder room?"*
* **Sensible Default (if Unknown):** Ground-floor guest bedroom (130–150 sqft / 12–14 m²) with an attached 3-fixture bathroom (wheelchair-accessible), allowing dual use for aging parents or guests.
* **Source:** NBC 2016 Part 3 Clause 4.5 & Clause 13; Neufert 4th Ed, p. 254.

### 3.11 Domestic Staff Quarters & Facilities
* **Why It Matters (Design Decision Changed):** Live-in domestic staff requires a dedicated bedroom (min 7.5 to 9.5 m²), attached private bathroom (WC + shower, min 1.8 to 2.2 m²), dedicated access stair or exterior path so staff can enter/exit without keys to the main house, and immediate connection to kitchen/utility yard.
* **How Architects Typically Ask It:** *"Do you require live-in accommodation for household staff (maid, cook, or driver)? Should the staff room have its own external private entrance and attached bathroom?"*
* **Sensible Default (if Unknown):** Compact staff bedroom (70–80 sqft / 6.5–7.5 m²) with attached private WC/shower (25 sqft / 2.3 m²), accessed externally via the rear service yard or stilt parking.
* **Source:** NBC 2016 Part 3 Clause 4.5 & Clause 4.7; DCPR 2034 Regulation 37(1) & (3).

### 3.12 Storage, Pantry & Utility Rooms
* **Why It Matters (Design Decision Changed):** Lack of storage is the #1 recorded post-occupancy complaint among residential homeowners. Demands a dedicated bulk food pantry adjacent to the kitchen, general luggage/seasonal box store, under-stair storage, entrance foyer coat/shoe cabinetry, and an electrical/inverter battery closet.
* **How Architects Typically Ask It:** *"Where do you currently keep large suitcases, festival decorations, ladders, tools, and spare bedding? Do you need a walk-in kitchen pantry for bulk groceries and grains?"*
* **Sensible Default (if Unknown):** Walk-in dry pantry (25–35 sqft) adjacent to kitchen; dedicated general luggage/box room (50–60 sqft); built-in shoe cabinet for 40+ pairs at the main entry foyer.
* **Source:** Neufert 4th Ed, p. 268; NBC 2016 Part 3 Clause 4.10 (Store Rooms).

### 3.13 Laundry Room & Weather-Protected Drying Yard
* **Why It Matters (Design Decision Changed):** Sizing for side-by-side or stacked washer-dryer, deep ceramic soaking sink, linen folding counter, ironing board setup, and critically: an exterior, rain-protected, well-ventilated drying yard (crucial in monsoon and humid climates where tumble dryers consume high electrical power).
* **How Architects Typically Ask It:** *"Do you dry clothes on lines or in a tumble dryer? Do you need a shaded, rain-sheltered outdoor drying yard or utility balcony that is hidden from public street view?"*
* **Sensible Default (if Unknown):** Dedicated covered utility balcony or drying yard (60–80 sqft / 5.5–7.5 m²) directly accessible from the kitchen/laundry room, fitted with louvered privacy screens to hide drying clothes.
* **Source:** Neufert Architects' Data 4th Ed, p. 269; Time-Saver Standards for Building Types 4th Ed, p. 828.

### 3.14 Terraces, Balconies & Outdoor Decking
* **Why It Matters (Design Decision Changed):** Requires structural slab load engineering for planters and wet soil (saturated soil adds 18–20 kN/m³ dead load), slope for rapid monsoon stormwater drainage (min 1:50), multi-layer elastomeric waterproofing membranes, safety parapet heights ($\ge 1.05\text{ m}$ to $1.2\text{ m}$), and privacy screens from neighbors.
* **How Architects Typically Ask It:** *"How do you envision using your terraces and balconies: for morning coffee, evening cocktails, vegetable/pot plants, or large family gatherings? Do you want a covered pergola?"*
* **Sensible Default (if Unknown):** Partially covered first-floor terrace (150–250 sqft) opening off family lounge with pergola shading; accessible roof terrace with solar PV mounting and viewing deck; parapet height 1.1 m.
* **Source:** NBC 2016 Part 3 Clause 4.14 (Balconies & Parapets); IS 2645 & IS 3067 (Code of practice for waterproofing).

### 3.15 Garden, Landscape & Outdoor Living
* **Why It Matters (Design Decision Changed):** Determines building footprint setbacks, allocation of permeable softscape vs hardscape paving (affects rainwater recharge and municipal green plot ratio), positioning of lawn, outdoor dining deck, water feature, and kitchen herb garden.
* **How Architects Typically Ask It:** *"How much garden do you want to maintain: a lawn for children/pets, a vegetable/herb patch, or low-maintenance paved courtyards with potted plants? Do you want an outdoor dining pavilion or barbecue?"*
* **Sensible Default (if Unknown):** 20% to 30% of plot area preserved as permeable softscape lawn and native perimeter planting; small paved patio with outdoor seating off dining/verandah.
* **Source:** NBC 2016 Part 3 Clause 5.2; GRIHA / IGBC Green Homes Rating System (Sustainable Site & Water Efficiency Criteria).

---

## 4. Lifestyle & Spatial Behaviour Inputs

### 4.1 Entertaining Scale, Frequency & Social Dynamics
* **Why It Matters (Design Decision Changed):** Dictates spatial connectivity and structural spans. Hosting 30–50 guests requires open-plan living, dining, and outdoor verandah zones to coalesce into a single fluid 500+ sqft space without intrusive structural load-bearing walls or closely spaced columns. Dictates powder room fixture capacity and catering service routes.
* **How Architects Typically Ask It:** *"When you entertain friends and family, what does it look like: intimate dinner parties of 6–8 people, or festive gatherings of 30–50+ people? How often does this happen, and do you hire outside caterers?"*
* **Sensible Default (if Unknown):** Intimate gatherings of 6–10 people monthly; large festive parties of 25–35 people 2–3 times a year; living and dining spaces designed with wide openings to coalesce into a single 450+ sqft entertaining zone.
* **Source:** AIA Handbook 15th Ed Chapter 17.1; Neufert 4th Ed, p. 256.

### 4.2 Privacy Gradients & Public-to-Private Transitions
* **Why It Matters (Design Decision Changed):** Establishes the clear spatial sequence of the home: Public Porch $\rightarrow$ Semi-Public Foyer & Formal Living $\rightarrow$ Semi-Private Dining/Family Lounge $\rightarrow$ Strictly Private Bedrooms. Prevents couriers, delivery drivers, or casual visitors from peering into private family living quarters from the main entrance.
* **How Architects Typically Ask It:** *"When a courier delivery arrives or a casual acquaintance steps to the door, how much of your home should they be able to see? Do you prefer an open-concept flow or clear separation between public and private rooms?"*
* **Sensible Default (if Unknown):** Distinct entrance foyer with coat/shoe storage and sightline baffles; formal living and guest powder room clustered near entrance; family lounge and bedrooms strictly secluded on upper floor or rear wing.
* **Source:** Christopher Alexander et al., *A Pattern Language* (Patterns 127: Intimacy Gradient, 130: Entrance Room); Neufert 4th Ed, p. 248.

### 4.3 Indoor–Outdoor Living & Microclimatic Thresholds
* **Why It Matters (Design Decision Changed):** Dictates large operable glazed openings (lift-and-slide or pocket doors), deep shaded verandahs (chhajjas/overhangs min 1.5 m to 2.4 m depth to prevent rain lashing), central open-to-sky courtyards (Brahmasthana), and weather-sealed transitions between air-conditioned interiors and humid exteriors.
* **How Architects Typically Ask It:** *"How connected do you want your interior rooms to the outdoors? Do you like sitting on shaded verandahs, having an internal open courtyard, or keeping the house fully enclosed and air-conditioned?"*
* **Sensible Default (if Unknown):** Deep covered verandah (otla) at front/side connecting living room to garden; living and dining feature large sliding glass doors opening onto a protected deck; deep 1.2 m–1.8 m eaves for monsoon shade.
* **Source:** Charles Correa, *Creating Spaces: Courtyards and Verandahs in Tropical Architecture*; NBC 2016 Part 3 Clause 4.14.

### 4.4 Hobbies, Passions & Specialized Activities
* **Why It Matters (Design Decision Changed):** Requires dedicated structural, acoustic, or plumbing provisions (e.g. grand piano requires reinforced floor slab and acoustic tuning; painting studio requires glare-free North daylight and solvent wash sink; wine cellar requires dedicated climate cooling unit $13^\circ\text{C}$ and dark thermal insulation; swimming pool requires structural shell and filtration plant).
* **How Architects Typically Ask It:** *"Does anyone in the family have serious hobbies or creative passions that require special space: music instruments (piano/drums), painting, woodworking, gardening, wine collecting, or swimming?"*
* **Sensible Default (if Unknown):** No specialized high-cost hobby rooms; flexible study room or terrace configured with extra electrical points and durable finishes to accommodate creative hobbies.
* **Source:** AIA Architect's Handbook 15th Ed Chapter 17.1; Neufert 4th Ed, pp. 255, 385, 496.

### 4.5 Cultural Rituals, Shoe Removal & Floor Habits
* **Why It Matters (Design Decision Changed):** Mandates a dedicated shoe-removal vestibule (with bench, shoe disinfection, storage for 40+ pairs); clean/barefoot living transitions; floor seating alcoves (baithak / diwan); morning sun salutation / yoga spaces; outdoor fire/homam ceremonial terrace provisions.
* **How Architects Typically Ask It:** *"Do you take off your shoes at the entrance? Do family members enjoy sitting on the floor or a low diwan for tea, music, or dining? Do you perform traditional rituals involving fire or incense?"*
* **Sensible Default (if Unknown):** Mandatory shoe-free home with a recessed 150 mm dropped entry vestibule with built-in ventilated shoe cabinetry and bench seating; open floor area in family room for floor seating/yoga.
* **Source:** CoA Manual of Architectural Practice 2020; docs/traditions-research.md; Neufert 4th Ed, p. 248.

### 4.6 Festivals, Cultural Ceremonies & Festive Capacity
* **Why It Matters (Design Decision Changed):** Dictates surge capacity for major cultural/religious festivals (Diwali, Eid, Christmas, Navratri, weddings, housewarming Griha Pravesh); temporary parking surge on street/lawn; outdoor catering setup with gas burner and wash water; temporary decorative flower/lighting hooks.
* **How Architects Typically Ask It:** *"How does your family celebrate major festivals? Do you host 50+ people for pujas, feasts, or parties, and where do people gather, eat, and park their cars?"*
* **Sensible Default (if Unknown):** Ground-floor living-dining-verandah designed as an open-flowing continuous space capable of accommodating 40 people standing/seated during festive occasions; outdoor power points and water tap for catering.
* **Source:** AIA Handbook 15th Ed Chapter 17.1; Time-Saver Standards for Building Types 4th Ed, p. 812.

### 4.7 Home Business, Professional Practice & Public Access
* **Why It Matters (Design Decision Changed):** Requires completely separate public exterior entrance and dedicated client powder room to prevent outside visitors/clients from traversing the family home; dedicated parking space; separate electrical sub-metering; compliance with municipal home-occupation bylaws (typically max 25% to 30% of residential area).
* **How Architects Typically Ask It:** *"Does anyone run a business, consulting practice, medical clinic, or design office from home where clients, patients, or business associates will visit in person?"*
* **Sensible Default (if Unknown):** Standard remote work from home (WFH) with video calls only; no outside clients visiting in person; no independent public office entrance required.
* **Source:** DCPR 2034 Regulation 34 (Permissible User in Residential Zones - professional offices); NBC 2016 Part 3 Clause 3.1.

---

## 5. Technical & Environmental Preferences Inputs

### 5.1 Thermal Comfort Strategy & HVAC System
* **Why It Matters (Design Decision Changed):** Dictates building envelope insulation, wall thickness (cavity walls or AAC blocks vs solid brick), window-to-wall ratio (WWR $\le 20\text{--}30\%$), ceiling heights, mechanical duct shafts, outdoor condenser AC ledge locations, and electrical transformer/sanctioned load sizing (e.g. 15 kW to 30 kW).
* **How Architects Typically Ask It:** *"How do you prefer to keep cool/warm: do you run air conditioning 24/7 in every room, or do you prefer ceiling fans and open windows for natural breeze, using AC only in bedrooms at night?"*
* **Sensible Default (if Unknown):** Mixed-mode bioclimatic design: high ceiling fans in all habitable rooms, cross-ventilation for mild weather, and energy-efficient inverter split AC units (or mini-VRF) in bedrooms and living rooms for peak summer/monsoon humidity.
* **Source:** NBC 2016 Part 8 Section 3 Clause 4.1; ECBC 2017 Section 4; ASHRAE Standard 55 (Thermal Environmental Conditions for Human Occupancy - Adaptive Comfort Model).

### 5.2 Rooftop Solar Photovoltaic (PV) & Energy Strategy
* **Why It Matters (Design Decision Changed):** Requires unshaded South/South-West roof terrace orientation; structural slab dead load for mounting frames (0.15–0.25 kN/m²); electrical conduit from roof to ground meter panel; space for grid-tied string inverter or battery energy storage system (BESS).
* **How Architects Typically Ask It:** *"Do you want to install rooftop solar panels to generate electricity and lower your bills? Do you want a grid-tied net-metering system, or a battery storage system for complete off-grid power resilience?"*
* **Sensible Default (if Unknown):** Grid-tied rooftop solar PV system (capacity: 5 kWp to 8 kWp, requiring ~400–600 sqft unshaded roof area); conduit pre-installed to main electrical panel; net-metering connection.
* **Source:** Ministry of New and Renewable Energy (MNRE) Rooftop Solar Guidelines 2021; NBC 2016 Part 8 Section 2 Clause 5.10.

### 5.3 Rainwater Harvesting (RWH) & Stormwater Management
* **Why It Matters (Design Decision Changed):** Statutory legal requirement in most Indian municipalities for plots $\ge 100\text{--}300\text{ m}^2$; determines roof rainwater downpipe routing, first-flush diverter, sand-gravel filter pit, storage sump sizing ($V = A \times R \times C$, e.g. 10,000 to 20,000 liters), and groundwater recharge borewell pit.
* **How Architects Typically Ask It:** *"Are you required by municipal law to harvest rainwater? Do you want to filter and store rainwater in a dedicated underground tank for domestic use, or recharge it directly into the groundwater table?"*
* **Sensible Default (if Unknown):** Dual-purpose RWH system: first-flush filter with a 10,000-liter dedicated underground storage tank for garden irrigation and car washing, with overflow directed to a percolation recharge pit.
* **Source:** NBC 2016 Part 9 Section 5 (Rainwater Harvesting); Central Ground Water Board (CGWB) Manual on Artificial Recharge; DCPR 2034 Regulation 38(22).

### 5.4 Water Storage Capacity & Pressure Booster System
* **Why It Matters (Design Decision Changed):** Sizing underground sump (UGT) and overhead tank (OHT) based on 135 to 200 liters per capita per day (LPCD) for 2–3 days reserve capacity; structural slab engineering for overhead tank weight ($10\text{--}15\text{ tonnes}$ of water on roof column grid); hydropneumatic booster pump system for equal high-pressure showers on all floors.
* **How Architects Typically Ask It:** *"What is the municipal water supply schedule like in your area (daily, alternate days, or tanker dependent)? Do you want a constant-pressure water booster system for luxury rain showers?"*
* **Sensible Default (if Unknown):** Total water storage: 150 LPCD $\times$ 6 occupants $\times$ 3 days reserve = 2,700 L overhead tank (OHT) + 5,000 L underground sump (UGT); automated transfer pump; hydropneumatic pressure booster pump (2.5–3.5 bar pressure).
* **Source:** NBC 2016 Part 9 Section 1 Table 1 & Clause 4.1; IS 1172:1993 Clause 4.1; IS 12183:1987.

### 5.5 Power Backup Infrastructure & Electrical Load
* **Why It Matters (Design Decision Changed):** Space and acoustic allocation for backup system (diesel generator requires outdoor acoustic enclosure, fuel storage, exhaust pipe to terrace vs lithium-ion inverter which sits silently in an internal utility closet); segregation of electrical circuits into Essential (fans, lights, Wi-Fi, fridge) vs Non-Essential (heavy ACs, oven).
* **How Architects Typically Ask It:** *"How reliable is the grid power in your area? When power cuts occur, do you need full 100% home backup (including multiple air conditioners) via a generator, or is an inverter battery for fans, lights, and Wi-Fi sufficient?"*
* **Sensible Default (if Unknown):** 5–7.5 kVA silent hybrid lithium-ion (LiFePO4) inverter-battery system backing up all lighting, fans, refrigeration, Wi-Fi, and 1 bedroom AC during power outages; zero noise and zero diesel fumes.
* **Source:** NBC 2016 Part 8 Section 2 Clause 5; IS 732:2019 (Electrical Wiring); Central Electricity Authority (CEA) Regulations 2010.

### 5.6 Home Security, Access Control & Surveillance
* **Why It Matters (Design Decision Changed):** Conduit planning for perimeter infrared motion beams, 8-16 IP CCTV cameras covering blind spots, video door phone (VDP) with electronic strike locks, biometric smart locks on main door and master suite, and structural window security grills on ground/first floor.
* **How Architects Typically Ask It:** *"What level of security makes you feel safe: simple video doorbell and sturdy locks, or a comprehensive multi-zone alarm system with CCTV cameras, motion sensors, and security window grills?"*
* **Sensible Default (if Unknown):** Main door biometric lock (fingerprint/PIN); 4-core video door phone connected to mobile app; 6-8 external HD IP CCTV cameras covering perimeter boundaries and parking; structural security grills integrated into all ground-floor windows.
* **Source:** NBC 2016 Part 8 Section 2 Clause 5.12; Neufert 4th Ed, p. 248.

### 5.7 Smart Home Automation & IoT Infrastructure
* **Why It Matters (Design Decision Changed):** Determines electrical cabling topology (centralized star-wired smart relay panels requiring dedicated low-voltage riser shafts vs wireless Zigbee/Matter retrofittable smart switches with neutral wire in every switchboard); motorized curtain pelmets with power outlets; smart HVAC thermostats.
* **How Architects Typically Ask It:** *"Do you want integrated smart home automation (voice/app control of lighting, scheduled motorized curtains, smart AC climate control, and multi-room audio), or do you prefer traditional mechanical switches?"*
* **Sensible Default (if Unknown):** Hybrid smart infrastructure: deep wall conduit boxes with neutral wires at all switchboards, centralized Cat6 Ethernet data cabling to all TV points/desks, motorized curtain conduits in living and master bedroom, and Wi-Fi 6 mesh ceiling access points.
* **Source:** IEEE 802.11ax / Matter Protocol Standards; NBC 2016 Part 8 Section 2 Clause 5.13.

### 5.8 Vertical Circulation & Residential Elevator / Lift
* **Why It Matters (Design Decision Changed):** Structural concrete or steel lift shaft (min 1500 mm wide $\times$ 1500 mm deep clear internal dimension for 4-passenger / 300 kg car or wheelchair accessibility), pit depth (min 1000 mm to 1200 mm below ground slab), overhead clearance (min 3800 mm to 4200 mm above top floor FFL), and 3-phase power supply.
* **How Architects Typically Ask It:** *"Do you want an elevator (lift) installed now or provisioned for the future? Will an elderly family member or wheelchair user rely on it to reach upper floors?"*
* **Sensible Default (if Unknown):** If building G+2 or higher, an elevator shaft (1500 $\times$ 1500 mm clear) is constructed with knock-out concrete/brick walls; if not installed initially, space is utilized as stacked walk-in store rooms on each floor.
* **Source:** NBC 2016 Part 8 Section 5 Clause 4 (Installation of Lifts); IS 14665 (Electric Traction Lifts); DCPR 2034 Regulation 37(17).

### 5.9 Electric Vehicle (EV) Charging Infrastructure
* **Why It Matters (Design Decision Changed):** Mandates dedicated high-power electrical circuit (32A single-phase 7.4 kW or 16A 3-phase 11 kW AC Level 2 charger) from the main meter board to the designated car parking bay, sub-metering, miniature circuit breaker (MCB), and Type-B residual current device (RCD).
* **How Architects Typically Ask It:** *"Do you currently drive an electric vehicle (EV) or plan to buy one in the next 3 to 5 years? How many parking bays need dedicated high-speed EV chargers?"*
* **Sensible Default (if Unknown):** Provision of 1 dedicated 32A / 7.4 kW AC Level 2 charging conduit and isolator switch at the primary covered car parking bay, connected to a separate sub-panel.
* **Source:** Ministry of Power (India) Guidelines and Standards for EV Charging Infrastructure 2022; NBC 2016 Part 8 Section 2 (Amendments 2021).

---

## 6. Aesthetic & Sensory Preferences Inputs

### 6.1 Architectural Style, Language & Formal Expression
* **Why It Matters (Design Decision Changed):** Dictates massing, roof profile (pitched terracotta tile vs flat terrace vs exposed concrete cantilever), facade fenestration rhythm (symmetrical classical vs asymmetrical modernist), external cladding materials, and interior spatial language.
* **How Architects Typically Ask It:** *"When you picture your dream home from the street, what architectural style feels like 'you': clean modern minimalism, warm tropical/vernacular with exposed brick and pitched roofs, classical colonial, or something eclectic?"*
* **Sensible Default (if Unknown):** Contemporary Tropical Modernism: clean cubic volumes balanced with warm natural timber/stone textures, deep sheltering eaves, large shaded glass openings, and verdant landscaped planters.
* **Source:** AIA Architect's Handbook 15th Ed Chapter 17.1; RIBA Plan of Work 2020 Stage 1 (Quality Aspirations); docs/research/architectural-styles.md.

### 6.2 Materiality, Finishes & Maintenance Tolerance
* **Why It Matters (Design Decision Changed):** Establishes specification schedule for civil and finishing contracts; determines lifetime maintenance frequency (e.g. natural timber cladding requires sanding and re-oiling every 2-3 years, while porcelain tile/granite is zero-maintenance; exposed concrete requires hydrophobic silane sealers against monsoon damp).
* **How Architects Typically Ask It:** *"What materials do you love running your hands over (e.g. natural rough stone, teak wood, smooth lime plaster), and are there materials you absolutely hate (e.g. glossy tiles, dark granite, cold glass)? How much time or money are you willing to spend on maintenance?"*
* **Sensible Default (if Unknown):** Low-to-medium maintenance natural palette: honed Kota or Jaisalmer stone / large-format matte porcelain tiles for floors; warm teak or engineered oak wood accents; textured lime-wash or acrylic emulsion walls; anti-fungal exterior silicate paint.
* **Source:** RIBA Residential Briefing Guide 2020; Neufert 4th Ed, pp. 24–32; CPWD Specifications 2019 Vol 1 & 2.

### 6.3 Color Palette, Light Reflectance & Psychological Mood
* **Why It Matters (Design Decision Changed):** Affects perceived room volume, natural light bounce (Light Reflectance Value - LRV: white $\approx 85\%$, dark charcoal $\approx 10\%$), interior artificial lux requirements, and emotional comfort (calming bedrooms vs vibrant social spaces).
* **How Architects Typically Ask It:** *"What color tones make you feel peaceful and happy at home: light airy neutrals (whites, beiges, creams), warm earthy tones (terracotta, ochre, forest greens), or dramatic high-contrast dark tones?"*
* **Sensible Default (if Unknown):** Neutral warm base palette (warm off-white walls LRV 75–80%, natural oak/teak wood tones, neutral greys) with richness introduced through loose art, upholstery fabrics, and lush tropical green plants.
* **Source:** IS 5410:1992 (Dimensions of color in architectural design); CIBSE Code for Lighting; Neufert 4th Ed, p. 119.

### 6.4 Natural Light Quality, Glare & Fenestration Character
* **Why It Matters (Design Decision Changed):** Sizes window openings relative to floor area (statutory minimum 10% to 15% window-to-floor ratio); determines placement of skylights, clerestory windows, and external jaali screens to provide abundant soft diffuse North/East daylight while preventing blinding glare on work desks and TV screens.
* **How Architects Typically Ask It:** *"How do you like daylight to enter your rooms: bright and sunny with direct light, or soft, filtered, and glare-free? Are you bothered by sun shining directly on screens or furniture?"*
* **Sensible Default (if Unknown):** Unobstructed natural daylight factor of 1.5% to 2.0% in all habitable rooms; deep window reveals, horizontal overhangs (chhajjas $\ge 600\text{--}750\text{ mm}$), and vertical fins on West/South facades to eliminate direct solar glare while keeping rooms naturally lit.
* **Source:** NBC 2016 Part 8 Section 1 Clause 4.2 & Table 2; IS 2440:1968 (Guide for daylighting of buildings); DCPR 2034 Regulation 37(19).

### 6.5 Spatial Volumes, Ceiling Heights & Vertical Drama
* **Why It Matters (Design Decision Changed):** Changes structural floor-to-floor height (standard 3.0 m vs luxurious 3.3 m to 3.6 m), sizes structural beams and staircase flight lengths (longer run required for higher floors), enables double-height living room voids, and increases HVAC cooling volume.
* **How Architects Typically Ask It:** *"Do you love the grandeur of high ceilings and double-height living spaces where you look down from an upper bridge, or do you prefer intimate, cozy, easily air-conditioned spaces?"*
* **Sensible Default (if Unknown):** Generous floor-to-ceiling clear height of 3.05 m (10 ft) for standard rooms; a focal double-height void (height $\ge 6.0\text{ m}$) over the main living or dining area connecting the upper family gallery.
* **Source:** NBC 2016 Part 3 Clause 4.5.2 (Ceiling Height Minimums: min 2.75 m); Neufert 4th Ed, p. 248; DCPR 2034 Regulation 37(1)(b).

### 6.6 Acoustic Character & Tactile Sensations
* **Why It Matters (Design Decision Changed):** Dictates room reverberation time ($RT_{60}$ target 0.5 to 0.7 seconds for domestic speech clarity vs boomy 1.5+ seconds in untreated minimalist tile-and-glass boxes), specifying acoustic wood slat paneling, soft curtains, and solid-core timber doors with perimeter acoustic seals.
* **How Architects Typically Ask It:** *"Are you sensitive to echo and noisy clatter in a room? Do you prefer a home that feels acoustically soft and quiet like a library, or bright and open?"*
* **Sensible Default (if Unknown):** Medium acoustic absorption: sound-dampening acoustic plasterboard ceilings in living and TV areas, plush rugs, linen drapery, and solid-core timber flush doors (STC 30–35 dB) to prevent hollow echoing.
* **Source:** NBC 2016 Part 8 Section 4 Clause 3.2; IS 2526:1968 (Code of practice for acoustical design of auditoriums and domestic rooms).

---

## 7. Budget, Phasing & Process Inputs

### 7.1 Total Capital Outlay & Scope Inclusions
* **Why It Matters (Design Decision Changed):** Governs total permissible built-up area ($A = \text{Budget} / \text{Cost per sqft}$); avoids fatal project insolvency by aligning client expectations with true market construction costs (civil structure vs architectural finishes vs modular woodwork vs MEP vs loose furniture vs landscaping vs municipal liaison & professional fees).
* **How Architects Typically Ask It:** *"What is your total target investment budget for the entire project, and what does this number include in your mind: just the civil concrete shell, or the complete finished home including modular kitchen, wardrobes, air conditioning, and landscaping?"*
* **Sensible Default (if Unknown):** Clear budget breakdown establishing that civil structure + basic finishes account for ~60% of total outlay, fixed interior joinery & MEP equipment account for ~25%, landscaping and external works ~5%, and professional fees, municipal sanctions, and contingency reserve account for ~10%.
* **Source:** AIA Handbook of Professional Practice 15th Ed Chapter 17.2 & Chapter 21; CoA Manual of Architectural Practice 2020 Scale of Charges; docs/agy-tasks/04-mumbai-rates.md.

### 7.2 Phasing, Staged Construction & Vertical Expansion
* **Why It Matters (Design Decision Changed):** Determines structural engineering design (sizing ground-floor columns and footings to carry future upper floors: e.g. G+1 designed with structural load capacity for G+2 or G+3), stubbing electrical conduits and plumbing drainage stacks at the terrace slab, and designing an independent external staircase access.
* **How Architects Typically Ask It:** *"Do you plan to build the entire house at once, or would you prefer to construct the ground and first floor now, leaving the terrace structured to add another floor or rental apartment 5 to 10 years later?"*
* **Sensible Default (if Unknown):** Construct full core civil structure in single phase; if budget is constrained, complete civil frame fully, finish Ground Floor to high standard, and leave Upper Floor as a semi-finished shell with pre-stubbed MEP infrastructure.
* **Source:** IS 456:2000 Clause 34 (Footing design for future loads); RIBA Plan of Work 2020 Stage 1 (Phasing Strategy).

### 7.3 Project Timeline, Critical Milestones & Hard Deadlines
* **Why It Matters (Design Decision Changed):** Governs procurement scheduling, selection of fast-track construction technologies (e.g. precast AAC blockwork vs slow red brick; ready-mix concrete vs on-site mixing), monsoon season excavation planning (excavation must complete before monsoon onset in coastal zones), and auspicious moving-in dates (Griha Pravesh, Diwali).
* **How Architects Typically Ask It:** *"When do you ideally want to break ground on site, and what is your target move-in date? Is there a hard cultural or family deadline (such as an auspicious date, a wedding, or school year start) that must be met?"*
* **Sensible Default (if Unknown):** Realistic 14-to-18-month overall timeline for a custom independent house (3–4 months design & municipal sanction approval, 8–10 months civil RCC structure and masonry, 4–5 months interior finishing, MEP testing, and joinery). Groundbreaking timed immediately post-monsoon (October–November).
* **Source:** AIA Handbook 15th Ed Chapter 17.2; RIBA Plan of Work 2020 Overview (Stages 1 through 6 timelines); CoA Manual of Architectural Practice 2020.

### 7.4 Decision-Making Authority & Stakeholder Governance
* **Why It Matters (Design Decision Changed):** Prevents catastrophic design thrashing, conflicting instructions to the site team, and unapproved variation orders; defines the single primary representative authorized to approve drawings, sign variation orders, and release milestone payments.
* **How Architects Typically Ask It:** *"Who in the family has the final authority to sign off on architectural drawings and budget decisions? Will one person act as the day-to-day point of contact for the architect and site engineer?"*
* **Sensible Default (if Unknown):** One designated Primary Client Representative with full legal and financial sign-off authority; structured family review meetings at fixed milestone gates (Concept, Scheme, Tender, Finishes).
* **Source:** AIA Document B101-2017 (Standard Form of Agreement Between Owner and Architect), Section 2.2; RIBA Plan of Work 2020 Stage 1 (Roles and Governance).

### 7.5 Statutory Approvals, Municipal Sanctions & Regulatory Hurdles
* **Why It Matters (Design Decision Changed):** Sizing setbacks, road widening reservations, permissible height, environmental clearances, and heritage precinct guidelines; avoids building illegal unauthorized structures that face municipal demolition or denial of Occupancy Certificate (OC).
* **How Architects Typically Ask It:** *"Are there any special municipal zoning covenants, pending road widening notices, heritage zone restrictions, or Coastal Regulation Zone (CRZ) rules that apply to your property?"*
* **Sensible Default (if Unknown):** Full compliance with local municipal building regulations (e.g. DCPR 2034 in Mumbai / NBC 2016 nationwide) with zero illegal deviations, ensuring timely receipt of formal Building Sanction, Intimation of Disapproval (IOD), Commencement Certificate (CC), and Occupancy Certificate (OC).
* **Source:** MRTP Act 1966 Section 44/45; DCPR 2034 Regulation 10 & 11; NBC 2016 Part 2 (Administration), Clause 3 & 4.

### 7.6 Client Risk Perceptions, Anxieties & Prior Experiences
* **Why It Matters (Design Decision Changed):** Shapes project delivery model (Item-rate tender vs Turn-key design-build vs Cost-plus project management), contingency reserve percentage (holding 10% to 15% contingency), inspection frequency, waterproofing warranty requirements (mandatory 10-year contractor guarantee), and contract dispute resolution clauses.
* **How Architects Typically Ask It:** *"Have you built or renovated a home before? What are your biggest fears or nightmares about this project: contractor cost overruns, timeline delays, shoddy construction quality, or water seepage during monsoons?"*
* **Sensible Default (if Unknown):** 10% to 12% financial contingency reserve held strictly outside the construction contract; third-party structural and waterproofing quality audits; comprehensive 10-year performance guarantee for subterranean and terrace waterproofing.
* **Source:** AIA Handbook of Professional Practice 15th Ed Chapter 21 (Risk Management & Construction Phase Services); FIDIC Conditions of Contract for Construction (Red Book) / Indian Standard Contract Conditions.

---

## 8. Ranked List: The 30 Inputs that Change the Design Most

The following ranked register isolates the **30 briefing inputs that trigger the most profound cascading architectural, structural, and financial consequences**. Changing any of these 30 inputs mid-way through a project tears up the floor plans, invalidates engineering calculations, or forces major cost revisions.

| Rank | Briefing Input | Primary Heading | Core Architectural Decision Changed (Why It Ranks Here) | Downstream Cascading Impacts |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Plot Dimensions, Bearings & Area** | 1. Site | Fixes statutory maximum buildable footprint, permissible FSI, and mandatory boundary setbacks. | Dictates structural column bay spacing, building aspect ratio, and total achievable floor area. |
| **2** | **Road Width & Municipal Bylaws / FSI** | 1. Site / 7. Budget | Determines base vs premium FSI eligibility (e.g., FSI 1.0 vs 2.0 under DCPR 2034). | Governs total allowable building height, number of storeys, and driveway entrance width. |
| **3** | **Total Capital Budget & Scope Inclusions** | 7. Budget & Process | Sets the hard ceiling on total gross floor area ($A = \text{Budget} / \text{Cost per sqft}$). | Governs whether aspirations are feasible; triggers value engineering before a single line is drawn. |
| **4** | **Soil Stratigraphy & Bearing Capacity** | 1. Site | Dictates structural foundation typology: shallow isolated footings vs deep piles or raft. | Shifts 15%–30% of total civil budget below ground; dictates excavation depth and basement viability. |
| **5** | **Site Levels, Road Crown & High Flood Level** | 1. Site | Establishes Ground Floor Finished Floor Level (FFL) and plinth height above road crown. | Governs driveway gradient, entry steps/ramps, stormwater backflow risk, and gravity sewer discharge. |
| **6** | **Household Occupants & Generational Roster** | 2. Household | Sets the irreducible bedroom, bathroom, and parking space count. | Establishes vertical zoning between elders, working adults, and children; sizes living/dining spaces. |
| **7** | **Mobility, Aging-in-Place & Universal Access** | 2. Household | Enforces zero-threshold level transitions, 900mm doors, 1200mm halls, and ground-floor master suite. | Mandates accessible roll-in shower geometry and provision of elevator shaft. |
| **8** | **Sun Path & Solar Orientation** | 1. Site | Governs building massing orientation, window-to-wall ratios (WWR), and deep overhangs. | Controls peak thermal heat gain, air-conditioning sizing, North daylighting, and solar PV terrace zones. |
| **9** | **Topography, Slope & Natural Contours** | 1. Site | Forces choice between flat slab-on-grade vs stepped split-level floors and retaining walls. | Drives cut-and-fill civil costs, structural earth retention, and internal level-change stairs. |
| **10** | **Kitchen Architecture: Wet vs Dry / Tadka** | 3. Room Program | Dictates open Western show kitchen vs enclosed traditional Indian masala kitchen / scullery. | Governs high-CFM exhaust ducting, gas piping routing, acoustic isolation, and grease containment. |
| **11** | **Wind Direction & Natural Ventilation Axes** | 1. Site | Directs placement of operable fenestration on opposing walls for stack and cross ventilation. | Lowers mechanical air conditioning reliance and flushes monsoonal humidity. |
| **12** | **Phasing & Vertical Structural Expansion** | 7. Budget & Process | Sizes foundation footings and RCC columns to carry future unbuilt storeys. | Dictates external vs internal staircase access, slab rebar stubbing, and rooftop plumbing stacks. |
| **13** | **Master Bedroom Suite Program & Storage** | 3. Room Program | Largest private space on the plan; dictates linear wardrobe runs (3.0–4.5m) and 4-fixture bath. | Anchor room that defines the upper floor footprint and plumbing wet-wall stack alignment. |
| **14** | **Domestic Staffing Model & Circulation** | 2. Household | Dictates independent service stairs, staff room/bath, and exterior kitchen/utility access. | Separates dirty service traffic from family private zones; eliminates security vulnerabilities. |
| **15** | **Vertical Circulation & Elevator Provision** | 5. Technical | Allocates 1500×1500mm structural lift core, pit depth (1.2m), and overhead headroom (4.2m). | Acts as a rigid structural shear core across all floors; defines primary circulation spine. |
| **16** | **Neighbours, Overlooking & Party Walls** | 1. Site | Forces internal introverted courtyards or blank party walls when adjacent buildings overlook. | Dictates window placement, lightwell positions, and fire separation distances. |
| **17** | **Cultural Sacred Space & Puja Orientation** | 3. Room Program | Dictates non-negotiable North-East (Ishanya) placement and devotee cardinal facing direction. | Constrains corner room allocations; requires dedicated smoke exhaust and shoes-off threshold. |
| **18** | **Privacy Gradients & Spatial Zoning** | 4. Lifestyle | Controls spatial sequencing from public entry to private family bedrooms. | Prevents delivery/guest sightlines into private zones; defines foyer buffer vestibules. |
| **19** | **Entertaining Scale & Living-Dining Openness** | 4. Lifestyle | Dictates wide structural spans to merge living, dining, and verandah into a single 500+ sqft zone. | Eliminates intermediate load-bearing columns; increases structural beam depths. |
| **20** | **Thermal Comfort Strategy & HVAC System** | 5. Technical | Dictates central VRF vs split AC units, ceiling fan drops, and building envelope insulation. | Sizes electrical sanctioned load (15–30 kW), outdoor compressor ledges, and false ceiling drop heights. |
| **21** | **Water Storage Capacity & Supply Schedule** | 5. Technical | Sizes underground sump (5,000L+) and rooftop overhead water tank (10+ tonne load). | Adds massive structural point loads onto roof column grids; determines booster pump locations. |
| **22** | **Municipal Drainage Outfall & Sewer Invert** | 1. Site | Dictates whether sewage discharges via gravity or requires expensive basement lift pumps. | Sets basement feasibility, ground plinth elevation, and underground inspection chamber network. |
| **23** | **Existing Mature Trees & Preservation Laws** | 1. Site | Carves out building footprint around tree Root Protection Zones (RPZ = 12× trunk diameter). | Protects against statutory criminal tree-felling penalties; creates natural courtyard focal points. |
| **24** | **Vehicular Parking Count & EV Infrastructure** | 5. Technical / 1. Site | Allocates covered stilt/driveway footprint (min 3.0×6.0m per car) and turning radii. | Consumes 25%–40% of ground-level footprint; mandates 32A electrical supply to parking bays. |
| **25** | **Work-from-Home & Acoustic Isolation Needs** | 3. Room Program | Allocates an acoustically isolated upper-floor study with glare-free North natural daylight. | Requires dedicated data trunking, solid-core acoustic doors, and professional video call backdrops. |
| **26** | **Rainwater Harvesting & Stormwater Sumps** | 5. Technical | Allocates site area for filtration pits, underground cisterns, and percolation borewells. | Mandatory for municipal statutory building sanction compliance; reduces municipal water reliance. |
| **27** | **Ceiling Heights & Spatial Volumes / Voids** | 6. Aesthetic | Shifts floor-to-floor height from 3.0m to 3.3m–3.6m; adds double-height living voids. | Lengthens staircase flight runs; increases masonry wall surface area and HVAC cooling volume. |
| **28** | **Materiality & Maintenance Tolerance** | 6. Aesthetic | Dictates structural/finish specifications (e.g. anti-corrosive concrete, non-porous stone vs timber). | Dictates client life-cycle maintenance expenditure; prevents coastal monsoon peeling and damp. |
| **29** | **Project Timeline & Monsoon Scheduling** | 7. Budget & Process | Dictates fast-track construction methods (AAC blocks vs brick) and groundbreaking timing. | Foundation excavation must complete before monsoon cloudbursts flood open trenches. |
| **30** | **Decision-Making Hierarchy & Governance** | 7. Budget & Process | Defines the single primary authorized client representative for drawing and variation approvals. | Prevents conflicting family instructions, costly on-site demolition, and project timeline paralysis. |

---

## 9. Methodological Notes & Cross-Reference Mapping

When Claude or downstream design agents design the **Questionnaire v3** intake engine, the following structural principles derived from this research must be applied:

1. **Progressive Disclosure:** Never present all 66 inputs in a flat list. Organize into logical cognitive stages matching the natural briefing dialogue:
   - *Stage A: Site & Legal Reality* (Inputs 1.1 to 1.15)
   - *Stage B: Family Demographics & Daily Living* (Inputs 2.1 to 2.9)
   - *Stage C: Room Sizing & Functional Adjacencies* (Inputs 3.1 to 3.15)
   - *Stage D: Cultural & Lifestyle Nuances* (Inputs 4.1 to 4.7)
   - *Stage E: Building Systems, Tech & Climate* (Inputs 5.1 to 5.9)
   - *Stage F: Aesthetic Language & Sensual Character* (Inputs 6.1 to 6.6)
   - *Stage G: Financial Realism & Project Execution* (Inputs 7.1 to 7.6)
2. **Defensible Defaults:** For every input, if the homeowner responds *"I don't know"* or skips the field, the system must substitute the researched **Sensible Default** rather than leaving the constraint solver unconstrained or guessing arbitrary numbers.
3. **Statutory Precedence:** When a client aspiration directly conflicts with a statutory site constraint (e.g., wanting 3,000 sqft on a plot limited to 1,500 sqft FSI by road width), the system must flag the contradiction immediately and enforce the legal bylaw limit.
