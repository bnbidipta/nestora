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
