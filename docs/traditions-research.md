# Tradition Rule Packs & Spatial Research
**Document:** `docs/traditions-research.md`  
**Target:** Algorithmic Constraint Solver & Tradition Gatekeeper  
**Status:** Research Draft (`verified: false`)  
**Traditions Covered:** 7 machine-checkable JSON specifications in `backend/app/data/traditions/`  

---

## 1. Summary of Traditions

### 1. Vaastu Shastra (`vaastu.json`)
* **Overview:** Ancient Vedic environmental and directional planning science aligning the built envelope with the cosmic Vastu Purusha Mandala and the five elemental forces (*Pancha Bhoota*).
* **Core Principles:** Unobstructed *Brahmasthana* in center; Fire elements (*Agni*) concentrated in South-East; Heavy grounding (*Nairutya*) in South-West; Purity and morning light (*Ishanya*) in North-East.
* **Code & Small-Plot Conflicts:**
  - *Conflict:* Narrow south-facing or west-facing plots often require front road access in the South or West, conflicting with the mandate for North-East entrances.
  - *Resolution:* Position entrance in the permissible auspicious sub-padas along the front boundary (e.g. *Pushpadanta* on West or *Grihakshata* on South) rather than the forbidden corner padas.
  - *Conflict:* On a compact 20×30 ft plot, placing kitchen in SE and master bedroom in SW while keeping center open leaves very narrow passage for living/dining.
  - *Resolution:* Modern Vaastu allows North-West as an acceptable secondary kitchen zone (*Vayu*), freeing the southern wall for master bedroom and staircase.
* **Sources:** *Brihat Samhita* of Varahamihira (Ch. 53, Vastu-vidya); *Samarangana Sutradhara* of King Bhoja (11th c.); *Manasara* (Ch. 9 & 36); *Vishvakarma Prakasha*.

---

### 2. Maharishi Sthapatya Veda (`sthapatya_veda.json`)
* **Overview:** Highly formalized architectural system founded by Maharishi Mahesh Yogi, asserting that orienting structures strictly to True Cardinal East unlocks total health and enlightenment.
* **Core Principles:** Exclusively True East and North entrances; central silent *Brahmastan* with rooftop lantern (*Kalash*); strict *Ayadi* mathematical dimensioning.
* **Code & Small-Plot Conflicts:**
  - *Conflict:* Municipal roads frequently run at oblique angles (e.g. 15°–45° off true north). MSV rejects buildings aligned to skewed road boundaries.
  - *Resolution:* If plot boundaries are skewed relative to cardinal north, the building footprint is rotated true cardinal on the site, using landscaped triangular setback wedges to absorb the municipal setback requirements.
  - *Conflict:* Demands substantial open perimeter space around the building (*Vastu fence*), difficult to achieve on standard urban row-housing plots $\le 100\text{ m}^2$.
  - *Resolution:* Apply MSV internal room zoning while acknowledging municipal boundary constraints as exterior perimeter envelope.
* **Sources:** Maharishi Mahesh Yogi, *Celebrating Perfection in Building* (1998); Maharishi Vastu Architecture Institute Design Manuals; *Vedic Architecture Compendium*.

---

### 3. Mayamatam / Dravidian Vastu (`mayamatam.json`)
* **Overview:** Premier classical treatise of the Dravidian school of Indian architecture attributed to Maya, widely practiced in Tamil Nadu, Kerala, Karnataka, and coastal Maharashtra.
* **Core Principles:** Scientific orientation established via solar shadow gnomon (*shanku-sthapana*); 64 or 81 grid *Padavinyasa*; deep climate-responsive shaded verandahs (*alimpanam*).
* **Code & Small-Plot Conflicts:**
  - *Conflict:* Rigorous adherence to *Ayadi Shadvarga* mathematical formulas (specific dimensional perimeters yielding auspicious remainder coefficients) can conflict with arbitrary municipal boundary setback lines.
  - *Resolution:* Prioritize the core structural grid to match Ayadi dimensions, absorbing discrepancies within exterior verandah overhangs or compound wall setbacks.
* **Sources:** *Mayamatam: Treatise of Housing, Architecture and Iconography* (translated by Bruno Dagens, Indira Gandhi National Centre for the Arts - IGNCA, 1994); *Manasara Silpa Sastra*.

---

### 4. Feng Shui (`feng_shui.json`)
* **Overview:** Traditional Chinese spatial art harmonizing human dwellings with environmental *Qi*, Yin/Yang balance, and the Five Element cycles (Wood, Fire, Earth, Metal, Water).
* **Core Principles:** "Command Position" for beds and desks (clear sight of door without direct alignment); protection of the central *Tai Chi*; mitigation of "Poison Arrows" (*Sha Chi*); avoidance of "Fire at Heaven's Gate" (no stove in North-West).
* **Code & Small-Plot Conflicts:**
  - *Conflict:* In compact Indian apartments/row houses, the kitchen is often placed in the North-West (which Indian Vaastu permits as a secondary option), but Feng Shui strictly forbids NW kitchens because Fire destroys Metal (*Qian* trigram representing the patriarch).
  - *Resolution:* When users choose both traditions, the layout solver resolves the conflict by enforcing South-East for the kitchen, which satisfies both Vaastu (*Agni*) and Feng Shui (*Wood* nurturing *Fire*).
* **Sources:** Lillian Too, *The Illustrated Encyclopedia of Feng Shui*; Stephen Skinner, *The Living Earth Manual of Feng-Shui* (1982); Evelyn Lip, *Feng Shui for the Home*.

---

### 5. Islamic Domestic Architecture (`islamic.json`)
* **Overview:** Architectural ethics prioritizing visual privacy (*sitrah*), female seclusion from visitors (*mahram* zoning), hospitality (*majlis*), and directional cleanliness relative to the *Qibla*.
* **Core Principles:** Water closets (WC) must never face towards or have one's back directly turned to Mecca (*Qibla*); bent entrance vestibules (*Majaz*) preventing street sightlines; clear separation of public reception from domestic family quarters.
* **Code & Small-Plot Conflicts:**
  - *Conflict:* In Mumbai (latitude ~19.07° N, longitude ~72.87° E), the Qibla azimuth is approximately 275° (West-North-West). Standard Western/Indian plumbing shaft layouts often orient commodes facing East or West.
  - *Resolution:* The solver must enforce a hard constraint that all toilet commodes/fixtures are aligned along the North-South axis (facing 0° or 180°), ensuring that occupants face perpendicular to the Qibla during elimination.
  - *Conflict:* Narrow frontages (e.g. 20 ft) make creating a separate formal *Majlis* and family living room difficult.
  - *Resolution:* Implement a two-stage sliding/screen vestibule or vertical zoning (Ground floor guest reception / upper floor private family residence).
* **Sources:** *Sahih al-Bukhari* (Hadith 394); *Sahih Muslim* (Hadith 264); Besim S. Hakim, *Arabic-Islamic Cities: Building and Planning Principles* (1986); Hisham Mortada, *Traditional Islamic Principles of Built Environment* (2003).

---

### 6. Jain Domestic Planning (`jain.json`)
* **Overview:** Architecture rooted in *Ahimsa* (non-injury), daytime illumination for *Chauvihar* (fasting from sundown to sunrise), meticulous grain preservation, and ritual cleanliness.
* **Core Principles:** Kitchen must receive abundant natural sunlight to prevent food preparation in the dark; total prohibition of adjacent/shared plumbing between toilets and kitchens; pristine elevated home temple (*Derasar*).
* **Code & Small-Plot Conflicts:**
  - *Conflict:* Dense urban row plots often place kitchens in interior windowless middle zones relying on artificial lighting and exhaust fans, violating the *Chauvihar* daylight requirement.
  - *Resolution:* Solver enforces mandatory exterior wall or central courtyard aperture for the kitchen, ensuring natural morning daylight illuminates food preparation surfaces.
  - *Conflict:* Multi-storey building plumbing commonly runs common vertical wet stacks serving upstairs bathrooms right above ground-floor kitchens.
  - *Resolution:* Strict vertical zoning constraint: no bathroom, toilet, or wastewater drain pipe may sit directly above a ground-floor kitchen or puja room.
* **Sources:** Acharya Hemachandra, *Yoga Shastra* (Ch. 3); *Ratnakaranda Shravakachara*; traditional *Shravaka* domestic guidelines.

---

### 7. Biophilic Architecture (`biophilic.json`)
* **Overview:** Modern evidence-based design methodology rooted in evolutionary biology, cognitive psychology, and building physics, connecting inhabitants with living nature.
* **Core Principles:** Visual connection to nature; natural cross-ventilation and airflow variability; circadian dynamic daylight; non-rhythmic sensory stimuli (water, rustling foliage); honest natural textures.
* **Code & Small-Plot Conflicts:**
  - *Conflict:* Maximizing FSI on small plots often leads developers to cover 100% of the buildable footprint, eliminating internal green courts.
  - *Resolution:* Introduce micro-courtyards ($1.8\text{m} \times 1.8\text{m}$) or vertical light shafts that qualify as open-to-sky ventilation shafts under DCPR 2034 while providing the required biophilic connection.
  - *Conflict:* High ambient noise and air pollution along Mumbai roads make open cross-ventilation challenging.
  - *Resolution:* Orient inward-facing acoustic courtyards with water trickles that buffer external vehicular noise while circulating filtered air.
* **Sources:** William Browning et al., *14 Patterns of Biophilic Design* (Terrapin Bright Green, 2014); Stephen R. Kellert & Edward O. Wilson, *The Biophilia Hypothesis* (1993); WELL Building Standard v2 (Feature L01 Light & A01 Air); NBC 2016 Part 8.
