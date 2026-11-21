# DRAFT — not legal advice — requires review by a qualified lawyer

# Legal Review Brief & Open Questions for Counsel
**Document:** `docs/legal/README.md`  
**Purpose:** Instructions and issue spotting for the external Indian legal team reviewing Nestora's pilot policies.  
**Jurisdiction:** Republic of India (Maharashtra State / Greater Mumbai)  

---

## 1. Context of the Platform
Nestora is developing an autonomous AI architectural intelligence engine. In Phase 1 (Mumbai Pilot), users input plot dimensions, family requirements, and lifestyle choices into a web questionnaire, and the backend synthesizes:
1. Conceptual 2D CAD floor plans.
2. Conceptual 3D RCC structural frames (columns, beams).
3. Itemized preliminary bills of quantities (BOQ) with market rate estimates.

No payment is taken from users during the pilot; municipal review requests are mock prototypes.

---

## 2. Priority Questions for Indian Legal Counsel

Counsel is requested to review and provide guidance on the following specific legal risks:

### A. Architects Act, 1972 & Council of Architecture (CoA) Regulations
* **Issue:** Under Section 36 & 37 of the **Architects Act, 1972**, no person or corporate entity other than a registered architect may use the title and style of *"Architect"*.
* **Question for Counsel:** Does branding the software as an *"AI Architect"* or *"The Architect in Your Pocket"* create statutory exposure under Section 37?
* **Recommendation to Validate:** Should the marketing copy be strictly rebranded to *"AI Architectural Assistant"*, *"Algorithmic Spatial Synthesizer"*, or *"Residential Design Intelligence Engine"* prior to commercial advertising?

### B. Professional Negligence & Construction Liability Disclaimers
* **Issue:** If a self-builder takes an uncertified Nestora floor plan or column layout to an untrained contractor, constructs a building, and suffers structural cracking or a municipal demolition notice for setback violations, could Nestora face tort liability despite standard click-wrap disclaimers?
* **Question for Counsel:** Is the liability waiver in Section 3 of `terms.md` robust under the Indian Contract Act, 1872 and the Consumer Protection Act, 2019? Should the UI require an affirmative checkbox (*"I understand this is a concept sketch and not an approved building drawing"*) before allowing PDF/DWG export?

### C. Digital Personal Data Protection Act, 2023 (DPDP Act) Compliance
* **Issue:** The questionnaire gathers information regarding family composition, elderly relatives with mobility/knee pain constraints, and religious/cultural practices (puja, Qibla alignment, Jain dietary customs).
* **Question for Counsel:**
  1. Under the DPDP Act 2023, does recording mobility/knee pain constitute health data requiring specialized processing protocols?
  2. Is the 7-day retention and automated purge mechanism for anonymous guest users legally sufficient to demonstrate data minimization?
  3. Does the cross-border transfer of de-identified free-text prompt snippets to Groq (US) comply with current DPDP transfer rules?

### D. Intellectual Property in AI-Generated Architectural Works
* **Issue:** Section 2(d) of the Indian Copyright Act, 1957 recognizes the author of an artistic/architectural work. Indian copyright law currently presumes a human author.
* **Question for Counsel:** How should terms handle copyright assignment when plans are synthesized algorithmically by a multi-model software pipeline without human architect intervention?

---

## 3. Checklist of Documents in This Directory
* [`privacy-policy.md`](privacy-policy.md): User-facing privacy disclosure compliant with DPDP Act 2023.
* [`terms.md`](terms.md): Terms of service, acceptable use, and construction liability limitations.
* [`README.md`](README.md): This counsel briefing document.
