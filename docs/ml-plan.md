# Nestora ML plan: making the models better

Status on 2026-11-24 (updated after agy task 15):

- **Prior v2:** trained on ResPlan (13.5k plans) and Swiss Dwellings (2,080 buildings, 1,385 multi-floor, 8k stairs). It is conditioned on plot size and measures room outlines correctly. Held-out score: real plans beat shuffled ones **99.3%** of the time on both sets.
- **Generator:** bedroom, kitchen and stair caps are now the learned 90th percentile, and the toilet aspect limit is ≤ 2.6. Realism went 0.419 → 0.434, with no loss of feasible designs on 80 briefs.
- **MSD:** 100% duplicates Swiss Dwellings, so it is excluded.
- **Learned generator (model 4):** agy recommends a MaskPLAN-style graph-masked transformer (MIT licence), trained on 1 GPU in under 36 h. See `docs/research/layout-models-sota.md`.

Previously:

- The **plan-realism prior** is trained on ResPlan (13.5k plans). On held-out plans it scores the real plan above a shuffled version 98.4% of the time. The ranker uses it.
- Generated designs score 0.31–0.44, against 0.57 for real homes. That gap is the main target.

## The models, and what makes each better

| # | Model | Today | Next step | Data | Gate (measured by) |
|---|---|---|---|---|---|
| 1 | **Realism prior** | Per-type log-normal size and aspect, plus adjacency rates, from ResPlan | Add Swiss Dwellings and MSD to cover multi-floor homes and stairs. Make it conditional on plot size (small and large plots differ). Split ResPlan's merged "living" label (it includes corridors). | ResPlan + Swiss + MSD | Real beats shuffled ≥ 95% on every set; our designs within 0.05 of real |
| 2 | **Generator fit** | Hand-set room sizes, caps and aspect limits | Replace the hand caps with the learned 10th–90th percentile per room type and plot bucket. Feed realism back to the fitter (pick the most realistic of several fits). | Same | Feasibility unchanged on the 500-brief eval; realism +0.1 |
| 3 | **Ranker** | Fixed weights plus online per-user preference updates | Train a pairwise model (logistic or gradient-boosted trees) on keep/discard pairs. Until pilot data exists, use synthetic pairs: real plan > perturbed plan. | Synthetic pairs now, pilot labels later | Pairwise accuracy on held-out users > 70% |
| 4 | **Layout generator** (learned) | None. The template + fitter generator is used. | Train the method agy recommends (`docs/research/layout-models-sota.md`): graph or boundary to plan. Its output still goes through the fitter and the Judge, so it can never break the rules. | Combined clean sets, commercial licences only | Judge first-pass ≥ 90%; realism ≥ real − 0.05; architects rate ≥ 4/5 |
| 5 | **Taste model** | Beta posterior per style from swipes | Image embeddings (CLIP, open weights) on the card images. Learn a user vector and match styles by cosine similarity. | Card images (licensed) | Swipes to a confident style: 30 → ≤ 12 |
| 6 | **Brief understanding** | Groq extraction plus keyword fallback | Build a labelled set of about 200 real or Hinglish briefs, and measure per-field accuracy. Fine-tune only if accuracy is under 90%. | Pilot briefs (consented, PII stripped) | Field accuracy ≥ 90% |
| 7 | **Engines** (climate, sound, colour, material, furniture) | Physics and rule based | Calibrate against measured data (Mumbai weather file for solar gain; real quotes for material costs). These stay rule-based, because they are explainable. | ISHRAE/EPW weather, rate quotes | Error vs measurement or quote within ±15% |

## Order

1. agy task 15: settle licences, then clean Swiss Dwellings and MSD (in progress).
2. Retrain the prior on the combined data, condition it on plot size, and split ResPlan's "living" label (model 1).
3. Learned size ranges in the fitter (model 2), checked on the 500-brief eval.
4. Synthetic-pair ranker (model 3).
5. A GPU run of the recommended layout generator (model 4). This needs about 1 rented GPU-day, roughly $20–60.
6. Pilot data feeds models 3, 5 and 6.

## Data and licence rules

- **Train only on data whose licence allows commercial use.** This means CC BY or public domain. NC and research-only data is never used.
- Show the attribution text for every dataset on `/terms` and in the model metadata.
- Commit only aggregate statistics and model weights; raw data stays gitignored.

## Open conflicts (agy resolves them in task 15)

| Conflict | Resolution path |
|---|---|
| ResPlan: GitHub says CC BY 4.0, Kaggle `croissant.json` says CC BY-NC-SA 4.0 | agy checks the paper, author statements and mirrors. If it's still unclear, we email the authors and treat the data as NC until they answer. The realism prior is aggregate statistics, so it can be retrained without ResPlan in minutes. |
| ResPlan labels the whole open area as "living" | Split it by polygon shape (corridors are thin), or rely on the Swiss/MSD room labels. |
| ResPlan is apartments; Mumbai plots are houses on their own plot | Swiss and MSD add multi-floor buildings. Condition on plot size and only use the matching plans. |
