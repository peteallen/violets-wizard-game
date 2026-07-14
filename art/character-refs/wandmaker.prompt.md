# Wandmaker reference-sheet provenance

This is a style target for the Wandmaker's painted sprite parts (D48) and the
identity source for every art-director judgment of his future part sheets. It
is reference-only material and is never shipped by the game.

## Current file (v3)

- Status: **under fresh art-director review (D49)** — accepted only on a PASS
  verdict; this line is updated when the ruling lands
- Generated: 2026-07-13
- Workflow: OpenRouter Image API via the `openrouter-image` skill, 16:9 at 1K
- Model identifier: `google/gemini-3.1-flash-image-preview`
- Cost: $0.0676
- Reference images: none — text-to-image only
- File: `wandmaker.png` (uncropped, exactly two views, close-up fills the
  right half)
- SHA-256: `3739379077e2c76e058fb311f931dcaa90ede6c74cafbcd064b67aa91cf19240`
- Prompt: v3 block below — every v2 finding encoded: hands with FOUR
  separated fingers plus visible thumbs (M1), violet-blue shadow cooling on
  the FULL-BODY figure too, not just the close-up (M2), woven canvas tooth in
  every skin tone (M3), one silver-grey iris pigment and silver-white hair in
  both views (m1/m2), upright-relaxed pose kept deliberately (the stoop moves
  to rig/pose level per the v2 ruling), close-up maximized for detail budget
  (m4).

## History

- **v2** (`google/gemini-3.1-flash-image-preview`, $0.0693, SHA-256
  `beb95328193ed78607606d932989f811bdb27246545230ee22e924a9f1a576f5`,
  committed at `b429079`; the generator returned a duplicate second full-body
  view, cropped out — pure crop, no repainting, 1016×768): **FAILED D49
  review — 0 CRITICAL, 3 MAJOR, 4 MINOR.** A true near-miss: identity lock,
  wardrobe palette, close-up light story, expression, hygiene, and the
  continuous field all measured clean, but both hands read as mittens with
  no unambiguous thumbs (M1), the violet-blue shadow story existed only in
  the close-up — every full-body shadow sampled warm (M2), and the skin was
  airbrush-smooth against the family's canvas-tooth floor (M3). Minors:
  warm-drifted full-body irises, gold-cast crown, absent scholarly stoop
  (ruled a rig-level trait, not a sheet trait), and a smaller-than-anchor
  detail budget. The v2 preserve list carried into v3 unchanged.

- **v1** (`google/gemini-3.1-flash-lite-image`, $0.0345, SHA-256
  `acb148aab216ee28cf17333993e8cd0212955974cceed4af9e676054fe9210ba`,
  committed at `f0b2856`): **FAILED D49 review — 1 CRITICAL, 2 MAJOR,
  5 MINOR.** Neither hand passed the five-finger test and both hovered in a
  splayed half-curl reading as a grabby talon (C1); the sheet was
  ink-outlined line-and-wash on two framed navy panels instead of the
  family's outline-free painterly rendering on one atmospheric field (M1);
  the candle-gold rim / violet-blue shadow light story was absent (M2);
  minors: slate-blue eyes in one view only, face-shape drift between views,
  dead-neutral trousers, near-first-position foot turnout, understated stoop
  with a startled distance-read. The judge's preserve list (silver-white
  flyaway hair, tufty brows, smile lines, plum waistcoat + cloth buttons,
  dove-grey cravat, draped tape, warm safe close-up expression) carried into
  v2 unchanged. Every finding is encoded in the v2 prompt below; the v1
  prompt text lives in git history at `f0b2856`.

## Design intent

CHAPTERS.md gives him one beat that defines him: whispery and delighted —
"Curious…" as the third wand erupts in golden light. The sheet aims that
personality at a 6-year-old: moonlike pale silver-grey eyes, flyaway
silver-white hair, a knowing closed-mouth smile, a gentle scholarly stoop that
must never loom, and the yellow measuring tape worn like a scarf. Wardrobe is
an original design (dusty deep-plum waistcoat, cream shirt with rolled
sleeves, dove-grey cravat, warm charcoal-brown trousers, amber-brown shoes) so
his part-sheet arms can carry cream shirt sleeves that match the torso's
rolled cuffs. No actor likeness, no film costume.

## Generation prompt (v3)

```text
Premium children's storybook illustration, FULLY PAINTED dense gouache rendering with NO ink outlines and NO contour linework — every form built purely from painted values, soft edges, dry-brush texture, and visible woven canvas tooth in EVERY tone INCLUDING ALL SKIN: cheeks, forehead, nose, and hands all show paper grain and dry-brush stipple up close, never airbrushed smooth gradients, never slick digital blends. RICH DEEP color values glowing like candlelight: aged parchment, deep candle gold, deep night blue, dusty violet, warm umber — never washed out, no pure black or pure white. A character reference sheet, wide landscape 16:9, the two views filling the frame edge to edge: the exact same character shown exactly TWICE — a front-facing full-body standing pose on the left, and a face-and-shoulders close-up occupying the entire right half of the frame from top edge to bottom edge, as large as possible — identical face shape, identity, outfit, and colors in both views: one broader, gently jowled, kind old face in BOTH views, never a third figure, never a duplicate. The background is ONE continuous atmospheric painted field behind both views, warm candle-gold parchment light melting into deep night blue toward the edges — never panels, no scenery, no text, no borders. The character: an original very old wandmaker and shopkeeper, small and slight, standing upright and relaxed, bright-eyed and quietly delighted, as if he has just recognized something wonderful. Large luminous PALE SILVER-GREY eyes with the exact same silver-grey iris pigment in BOTH views — never blue, never hazel, never warm brown — soft relaxed aged lids, medium pupils, warm upper-left catchlights; wispy flyaway SILVER-WHITE hair in both views, rising like soft smoke around a high forehead, with only the faintest warm light on its lit edge; tufty white eyebrows; large gentle ears; a warm knowing closed-mouth smile with deep kind smile lines. Both arms hang relaxed at his sides with his hands resting calmly against his outer thighs: each hand painted with FOUR clearly separated fingers side by side — small shadow gaps between every finger — and a visible THUMB in front, natural knuckles, fingers gently together, never splayed, never clawed, never merged into a mitten. He stands naturally, feet planted flat beneath his hips, toes turned only slightly outward. Wardrobe, original design: a dusty deep-plum waistcoat with small cloth-covered buttons over a soft cream shirt with gently rolled sleeves, a loosely knotted dove-grey neck cravat, warm charcoal-brown trousers with a clear brown warmth, worn amber-brown leather shoes, and a soft yellow cloth measuring tape with tick marks draped around his neck like a scarf, hanging down both sides. ONE warm upper-left key light obeyed identically in BOTH views: a clear candle-gold rim glowing along the lit left edge, and every shadow side — sleeves, trousers, hair underside, jaw — cooling to VIOLET-BLUE, never warm brown shadows, in the full-body figure just as much as in the close-up. The emotional read: whispery, wise, a little mysterious, quietly delighted — friendly and safe, never creepy, never startled. Fabric has woven grain and painted fold bands; hair is soft shaded wisps with interior strands. Picture-book proportions. Original character design, not any existing actor or film character.
```
