# Wandmaker reference-sheet provenance

This is a style target for the Wandmaker's painted sprite parts (D48) and the
identity source for every art-director judgment of his future part sheets. It
is reference-only material and is never shipped by the game.

## Current file (v4)

- Status: **under fresh art-director review (D49)** — accepted only on a PASS
  verdict; this line is updated when the ruling lands
- Generated: 2026-07-13
- Workflow: OpenRouter Image API via the `openrouter-image` skill
- Model identifier: `black-forest-labs/flux.2-pro` — a deliberate model-family
  switch after three same-locus failures (hands, full-body shadow cooling,
  skin/field tooth) across two Gemini tiers; FLUX's prior is strong on
  texture and hands
- Cost: $0.03. Requested 16:9; FLUX returned 1024×1024 square (format drift
  noted for the judge)
- Reference images: none — text-to-image only
- File: `wandmaker.png`
- SHA-256: `490e92f99502925d11fa76160027ca3feb61daff29a760510e760772f07eecc5`
- Prompt: v4 block below — rewritten in plainer descriptive language for the
  new model family, all v3 findings encoded: hands no larger than half the
  face, resting in contact with the thighs, thumb + curled fingers with
  shadow gaps (C1); one almost-colorless cool slate-grey iris pigment in both
  views (C2); violet-blue shadow cooling named per surface on the full-body
  figure (M1); weave demanded through skin, gold bloom, and the darkest
  corners (M2/M3); catchlights pinned upper-left (m1); same age both views
  (m2).

## History

- **v3** (`google/gemini-3.1-flash-image-preview`, $0.0676, SHA-256
  `3739379077e2c76e058fb311f931dcaa90ede6c74cafbcd064b67aa91cf19240`,
  committed at `426a5ef`): **FAILED D49 review — 2 CRITICAL, 3 MAJOR,
  2 MINOR.** Posture, wardrobe lock, composition, expression, and hygiene
  all measured clean, but both hands were merged-finger droops ~45%
  oversized with one floating off the thigh (C1); the two views disagreed on
  iris pigment with the full-body reading hazel-warm (C2); full-body shadows
  stayed warm-only while the close-up cooled correctly (M1); full-body skin
  was airbrush-smooth and the close-up's tooth was the thinnest in the
  family (M2); the dark field went airbrush-dead at the edges (M3); minors:
  catchlights upper-right against the upper-left key, and a decade of
  age drift between views.

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

## Generation prompt (v4)

```text
A premium children's storybook character reference sheet, painted in dense traditional gouache with visible woven canvas tooth in every tone — the paper weave shows through the darkest navy corners, through the gold glow, and through all skin, with dry-brush stipple grain on cheeks, forehead, and hands; no ink outlines anywhere, no airbrush-smooth gradients, no slick digital blending. Wide landscape sheet showing the exact same character exactly twice on one continuous atmospheric background of warm candle-gold parchment light melting into deep night blue: on the left, his full body standing; filling the entire right half, a large face-and-shoulders close-up. Identical identity in both views: the same broader, gently jowled, kind old face, the same age, the same colors, never a third figure. He is an original very old wandmaker and shopkeeper: small, slight, upright and relaxed, bright-eyed and quietly delighted, as if he has just recognized something wonderful. Both views give him large luminous pale silver-grey eyes of the exact same almost-colorless cool slate-grey pigment — not blue, not hazel, not brown — with soft relaxed aged lids, medium pupils, and a small warm catchlight at the upper left of each eye. Wispy flyaway silver-white hair rises like soft smoke around his high forehead in both views; tufty white eyebrows; large gentle ears; a warm knowing closed-mouth smile with deep kind smile lines. His arms hang relaxed and his small elderly hands rest flat against his outer thighs, the thumb and gently curled fingers clearly drawn with soft shadow gaps between them — natural small hands at rest touching the trouser fabric, never claws, never mittens, never floating away from the leg, and no larger than half his face. He stands with feet planted flat, toes only slightly turned out. He wears a dusty deep-plum waistcoat with small cloth-covered buttons over a soft cream shirt with rolled sleeves, a loosely knotted dove-grey cravat, warm charcoal-brown trousers, worn amber-brown leather shoes, and a soft yellow cloth measuring tape with tick marks draped around his neck, hanging down both sides. One warm key light from the upper left, obeyed identically in both views: a candle-gold rim along his lit left edge, and every shadow — sleeve cores, trouser folds, hair underside, and the shadowed side of his face and jaw — cooling clearly into violet-blue, on the full-body figure exactly as strongly as in the close-up. He reads as whispery, wise, slightly mysterious, quietly delighted; friendly and safe for a young child, never creepy, never startled. No text, no labels, no borders, no scenery. An original character design, not any existing actor or film character.
```
