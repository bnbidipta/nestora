# agy task 10: Privacy policy, terms and pilot disclaimer (drafts for a lawyer)

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `docs/legal/privacy-policy.md`, `docs/legal/terms.md`, `docs/legal/README.md`

## Why
The pilot collects user data and gives construction-related output, so it needs a privacy policy and terms before any real user signs up. These are **drafts for an Indian lawyer to review**, not final legal text. Say so at the top of each file.

## Facts to base them on
- Data: an email or Google account, questionnaire answers (family make-up, health hints such as "knee pain", budget, plot size and location), taste-card choices and generated designs.
- Processors:
  - Supabase (database and sign-in; Mumbai region)
  - Render (backend hosting)
  - Vercel (frontend)
  - Groq (an LLM reads the free-text answer; no name or email is sent)
  - PostHog (anonymous funnel analytics, behind a consent banner)
- Anonymous designs are deleted after 7 days unless the user signs in and claims them.
- Output is a **concept design and estimate, not for construction**. Building rules and rates are unverified drafts. Architect review is a free request during the pilot; no payment is taken.
- Users may be anywhere in the world, but the pilot only designs for Mumbai.

## Cover
- **Privacy:** India's **DPDP Act 2023** (consent, the user's rights to access, correct and erase, a grievance officer, children), plus a short GDPR section for EU visitors.
- **Terms:** no reliance for construction, limitation of liability, intellectual property in the generated designs, acceptable use, and governing law (India, Mumbai courts). Leave a placeholder for the company name.
- **`docs/legal/README.md`:** the open questions a lawyer must answer.

## Done when
- All three files exist.
- Each file starts with "DRAFT — not legal advice — requires review by a qualified lawyer".

---

## Status: Done + Caveats (Antigravity Audit)
- **Delivered files:**
  - `docs/legal/privacy-policy.md`: Drafted under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and IT Act 2000, detailing Supabase (Mumbai), Vercel, Render, Groq (de-identified text), and PostHog data flows, 7-day auto-purge for anonymous users, and Grievance Officer framework.
  - `docs/legal/terms.md`: Comprehensive terms of service emphasizing that outputs are conceptual sketches not for construction, requiring independent verification by a licensed CoA Architect and MCGM Structural Engineer, with liability caps and IP terms.
  - `docs/legal/README.md`: Priority issues spotted for Indian legal counsel (Architects Act 1972 Section 37 title risks, DPDP health data nuances, consumer liability disclaimers, and AI copyright ownership).
- **Validation:** Automated test confirmed all 3 files exist and start with `"DRAFT — not legal advice — requires review by a qualified lawyer"`.

