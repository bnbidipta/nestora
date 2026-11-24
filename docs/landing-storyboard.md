# Landing page storyboard (for approval, nothing built yet)

**Goal:** in about 60 seconds of scrolling, someone understands *"tell it about your family and plot, get a house that fits, checked against the rules, costed, and walkable in 3D"*, then clicks **Design my home**.

**Structure:**
- scroll-craft grammar: pinned scenes, one horizontal rail, line-by-line headline reveals, colour shift between scenes.
- taste-skill art direction: warm ivory, sage, terracotta; one serif display face plus a clean sans; real photos, no stock-AI look.
- scroll-world motion: scroll scrubs a short video per scene, with seamless crossfades.

All videos are made with **agy**, which is free. Copy follows no-ai-slop and ai-design-skills. Motion timing follows the LottieFiles rules. Components come from motion-primitives: text reveal, animated number, tilt, magnetic button.

**Fallbacks:**
- Phones (under 768 px) get a static version of each scene: a poster frame plus text.
- With reduced motion on, videos show a single frame and reveals become fades.

---

### Scene 1: Hero (pinned, about 1.5 screens of scroll)
- **Visual:** the scroll scrubs a video of an empty Indian plot at dawn. Survey pegs appear, string lines draw the plot edges, then the camera rises.
- **Copy:** "Your family. Your plot. **A home that fits.**" with the sub-line "Answer a few questions. Get a house design that follows the building rules, a cost estimate, and a 3D walk-through."
- **Motion:** the headline reveals line by line, and a magnetic **Design my home** button fades in at 60% scroll.
- **agy video prompt (5 s, 16:9, 1080p):** "Slow aerial rise over an empty residential plot in a Mumbai suburb at dawn, red soil, string lines and wooden survey pegs marking a 30 by 40 foot rectangle, neighbouring two-storey houses, soft warm light, photoreal, no people, no text."

### Scene 2: Tell us about you (horizontal rail, 3 cards)
- **Visual:** three cards slide in sideways as you scroll, mirroring the real questionnaire.
  - Plot: "30 × 40 ft, road on the east"
  - Family: "a couple, two children, grandmother"
  - Style: photo chips from the real style photos
- **Copy:** "Tell us how you live: no jargon, no drawings needed."
- **Motion:** cards tilt slightly on hover, and the numbers count up as the card enters.

### Scene 3: Options appear (pinned)
- **Visual:** four plan thumbnails draw themselves line by line (real generated plans, rendered as SVG). One gets a heart, the others swap out for new ones.
- **Copy:** "Like the ones you're drawn to. We'll show more like them."
- **Motion:** SVG stroke-draw scrubbed by scroll, then the heart pops.

### Scene 4: Checked and costed (split screen)
- **Visual:**
  - Left: the plan with the services overlay (water, drainage, electrical) fading in.
  - Right: three ticking checks ("Setbacks ✓", "Lift from 3 floors ✓", "Every room meets minimum size ✓") and the cost range counting up ("₹31–36 lakh").
- **Copy:** "Every design is checked against the building rules and costed in Economy, Standard and Premium."
- **Honesty line, small:** "A concept, not a construction drawing: an architect must review and stamp it."

### Scene 5: Walk through it (pinned, scroll-scrubbed video)
- **Visual:** the camera walks from the entrance into the living room, past the stair, and out to the window at sunset. This is a screen recording of our own 3D tour, so it's real product, not a render.
- **Copy:** "Walk through your home before a single brick is laid."
- **agy video prompt (fallback if the screen recording looks too plain), 6 s:** "First-person slow walk through a modest modern Indian home interior, warm sunset light through a window, kota stone floor, white walls, teak furniture, calm, photoreal, no people, no text."

### Scene 6: Close (static)
- **Copy:** "Start with your plot. It takes about 5 minutes." with the **Design my home** button.
- **Footer:** Privacy, Terms, and photo credits (Wikimedia Commons, as the licences require).

---

**Decisions for you:**
1. **Hero video:** generate it with agy, or use a real photo plus an animated plot outline (lighter and faster to load)?
2. **Scene 5:** record our own 3D tour (recommended, it's the real product), or use the agy video?
3. **Logo:** pick one of the four proposals in `docs/brand/logo-proposals/`, or keep the current "N" wordmark.
4. **Sample house:** the landing should link to a real sample house. Shall I generate a polished one and pin it?
