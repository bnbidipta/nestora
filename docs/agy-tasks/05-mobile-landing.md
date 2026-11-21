# agy task 05: Mobile static landing page + optimised images

Follow the rules in `docs/agy-tasks/README.md`.

**Write only to:** `frontend/components/landing/mobile/` (new folder) and `frontend/public/images/home/optimised/`

## Goal
The desktop landing page is a 600vh CSS-3D scroll experience (`frontend/components/landing/UnifiedHorizontalStack.tsx`), which is too heavy for a ₹15k Android phone. On mobile and for `prefers-reduced-motion`, we'll serve a **static stacked version** with the same story. Claude Code will do the switching and routing; you build the component and the images.

## Deliverables
1. **`frontend/components/landing/mobile/MobileLanding.tsx`**: one default-exported React component that:
   - uses the same six-section story as `STAGES_DATA` in `UnifiedHorizontalStack.tsx` (overview + 5 stages). **Import the data from there; don't copy it.** If an export is needed, write down the one-line change for Claude instead of editing that file.
   - uses Tailwind and the existing palette in `frontend/tailwind.config.js` (ivory, sage, champagne, drafting).
   - has no framer-motion, no Lenis, no three.js and no scroll-jacking; CSS transitions only.
   - uses `next/image` with `sizes`, lazy-loading below the fold.
   - is accessible: one `<h1>`, semantic sections, ≥ 14px body text, 4.5:1 contrast and visible focus states.
   - **contains no unsupported claims.** Copy must not say: "Guaranteed", "0% hidden costs", "escrow", "certified", "approved", "Council of Architecture". Every result is described as a *concept design and estimate, to be reviewed by a licensed architect*.
2. **`frontend/public/images/home/optimised/`**: WebP and AVIF versions of the 5 PNGs in `frontend/public/images/home/` at widths 640, 1080 and 1600, each under 150 KB. Use filenames like `hero_dusk_courtyard-1080.avif`.

## Done when
- `cd frontend && npx tsc --noEmit` passes with your component.
- All images are under 150 KB.
