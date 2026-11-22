# DRAFT — not legal advice — requires review by a qualified lawyer

# Nestora Privacy Policy (Phase 1 Mumbai Pilot)
**Effective Date:** [Date of Public Beta Launch / February 2026]  
**Entity:** [Nestora Technologies Private Limited / Company Name Placeholder] ("Nestora", "we", "us", or "our")  
**Scope:** Visitors and users of the Nestora platform across web and mobile domains.  

---

## 1. Introduction & Statutory Framework
This Privacy Policy outlines how Nestora collects, processes, stores, and protects personal data in compliance with the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** of India, the **Information Technology Act, 2000**, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. For visitors residing in the European Economic Area (EEA) and United Kingdom, this policy also outlines rights under the **General Data Protection Regulation (GDPR)**.

Nestora operates as a **Data Fiduciary** under the DPDP Act 2023.

---

## 2. Personal Data We Collect
We collect only the personal and spatial data necessary to synthesize preliminary residential architectural concept plans and cost estimates:

1. **Identity & Contact Data:**
   - Email address and Google Account display profile (when signing in via Google Single Sign-On).
2. **Questionnaire & Lifestyle Data:**
   - Plot location (city, suburban ward/locality, road access width, and optional map coordinate pin).
   - Plot geometric dimensions (width, depth, cardinal orientation).
   - Household demographics (number of adults, children, and pets).
   - Health and mobility indicators voluntarily provided (e.g., family members with knee pain or wheelchair requirements, used strictly to mandate step-free ground-floor bedrooms and wider doorways).
   - Culinary, cultural, and spiritual preferences (vegetarian/Jain dietary sunlight habits, prayer/puja requirements, tradition compliance tiers).
   - Budget constraints and estimated construction timelines.
3. **Aesthetic Taste Profiling:**
   - User interactions, swipes, and keep/discard selections on architectural style cards.
4. **Free-Text Voice Aspirations:**
   - Unstructured text descriptions of your lifestyle wishes entered into the open prompt field.
5. **Technical & Telemetry Data:**
   - IP address, browser type, device specifications, operating system, and anonymous funnel telemetry (subject to cookie banner consent).

---

## 3. Third-Party Sub-Processors & Infrastructure
Nestora contracts with enterprise cloud infrastructure providers operating under strict data protection addenda:

| Sub-Processor | Primary Purpose | Data Shared | Processing Region |
| :--- | :--- | :--- | :--- |
| **Supabase Inc.** | User authentication, database management, and persistent storage of claimed House Twins. | Email address, user ID, claimed questionnaire responses, and generated design twins. | **Mumbai, India (ap-south-1)** |
| **Vercel Inc.** | Web frontend hosting, static site delivery, and edge routing. | IP address, browser user-agent, standard HTTP request headers. | Global Edge Network |
| **Render Services Inc.** | Backend application execution (FastAPI orchestrator engine). | Ephemeral questionnaire inputs and design generation payloads. | Cloud Data Center |
| **Groq Inc.** | Inference processing of unstructured free-text design prompts via Large Language Models. | **De-identified text only.** No user name, email, phone number, or exact address is ever transmitted. | United States (Encrypted in transit) |
| **PostHog Inc.** | Anonymous product analytics and funnel drop-off diagnostics. | Anonymous session events, screen views, and interaction timestamps. **Requires explicit consent banner opt-in.** | Cloud Infrastructure |

---

## 4. Anonymous Sessions & Data Retention
* **Anonymous Guest Users:** If you generate a concept house design without signing in or creating an account, your generated house twin and questionnaire session are stored under an anonymous session key. **All unclaimed anonymous designs and associated data are permanently purged after seven (7) days.**
* **Registered Accounts:** If you sign in or create an account to claim your house plan, your data is retained in our secure Supabase database until you request its deletion.
* **Aggregated Benchmarking:** De-identified, anonymized spatial parameters (e.g., plot dimension ratios and tradition rule compliance distributions) may be retained indefinitely for training and testing our generative layout algorithms.

---

## 5. Your Rights Under the DPDP Act 2023 (India)
As a Data Principal under Indian law, you are entitled to:
1. **Right to Access Information:** Request a summary of your personal data being processed and the processing activities undertaken.
2. **Right to Correction & Erasure:** Request the correction of inaccurate or outdated data, or the complete erasure of your personal data from our servers.
3. **Right of Grievance Redressal:** You have the right to register a grievance with our designated Grievance Officer regarding the handling of your data.
4. **Right to Nominate:** Nominate any other individual to exercise your data rights in the event of death or incapacity.

To exercise any of these rights, email our Grievance Officer at **privacy@[company-domain].com**. Requests are verified and processed within thirty (30) days.

---

## 6. Protection of Children’s Personal Data
The Nestora platform is not intended for use by persons under eighteen (18) years of age. We do not knowingly collect personal data from minors. In compliance with Section 9 of the DPDP Act 2023, we do not engage in behavioral tracking, targeted advertising, or processing of children's data that could cause detrimental effects on a child.

---

## 7. Supplemental Notice for European Union / EEA Visitors (GDPR)
If you access the platform from the EU/EEA:
* **Legal Basis for Processing:** Processing is grounded in your explicit consent (Art. 6(1)(a) GDPR) and the performance of a requested service (Art. 6(1)(b) GDPR).
* **International Data Transfers:** When data is transferred outside the EEA (such as to servers in India or the United States), transfers occur pursuant to Standard Contractual Clauses (SCCs) approved by the European Commission.
* **Supervisory Authority:** You retain the right to lodge a complaint with your local EU Data Protection Authority (DPA).

---

## 8. Grievance Officer & Contact Details
In accordance with the DPDP Act 2023 and the Information Technology Act 2000, the designated Grievance Officer for Nestora is:

* **Name / Title:** [Grievance Redressal Officer Placeholder]  
* **Entity:** [Nestora Technologies Private Limited / Company Placeholder]  
* **Registered Office Address:** [Mumbai Office Address Placeholder, Maharashtra, India]  
* **Email:** `grievance@[company-domain].com` / `privacy@[company-domain].com`  
* **Response Timeline:** Acknowledgment within 48 hours; resolution within 30 calendar days.
