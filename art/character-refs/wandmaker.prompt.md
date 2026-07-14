# Wandmaker reference-sheet provenance

This is a style target for the Wandmaker's painted sprite parts (D48) and the
identity source for every art-director judgment of his future part sheets. It
is reference-only material and is never shipped by the game.

## Current file (v2)

- Status: **under fresh art-director review (D49)** — accepted only on a PASS
  verdict; this line is updated when the ruling lands
- Generated: 2026-07-13
- Workflow: OpenRouter Image API via the `openrouter-image` skill, 16:9 at 1K
- Model identifier: `google/gemini-3.1-flash-image-preview` — deliberately a
  tier above the part-sheet model, because the v1 verdict's fidelity finding
  (M1) was partly a model-capability ceiling and references anchor everything
  downstream
- Cost: $0.0693
- Reference images: none — text-to-image only
- Post-processing: the generator returned an off-spec duplicate second
  full-body view; the duplicate left figure was cropped out (columns < 360)
  before review — a pure crop, no repainting. Final dimensions 1016 × 768.
- File: `wandmaker.png`
- SHA-256: `beb95328193ed78607606d932989f811bdb27246545230ee22e924a9f1a576f5`

## History

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

## Generation prompt (v2)

```text
Premium children's storybook illustration, FULLY PAINTED dense gouache rendering with NO ink outlines and NO contour linework — every form built purely from painted values, soft edges, dry-brush texture, visible canvas tooth in every tone including the skin, organic asymmetry, RICH DEEP color values glowing like candlelight: aged parchment, deep candle gold, deep night blue, dusty violet, warm umber — never washed out, never pale, no pure black or pure white. A character reference sheet, landscape: the exact same character shown twice — a front-facing full-body standing pose on the left, and a much larger face-and-shoulders close-up on the right — with the identical face shape, identity, outfit, and colors in both views: one broader, gently jowled, kind old face in BOTH views. The background is ONE continuous atmospheric painted field behind both views, warm candle-gold parchment light melting into deep night blue toward the edges — never two separate panels, never framed blocks, no scenery, no text, no labels, no borders. The character: an original very old wandmaker and shopkeeper, small and slight, with a gentle visible scholarly stoop in the shoulders, bright-eyed and quietly delighted, as if he has just recognized something wonderful. Large luminous PALE SILVER-GREY eyes in BOTH views — never blue — with soft relaxed aged lids, medium pupils, and warm catchlights; wispy flyaway silver-white hair rising like soft smoke around a high forehead; tufty white eyebrows; large gentle ears; a warm knowing closed-mouth smile with deep kind smile lines. Both arms hang relaxed at his sides with his hands resting calmly against his outer thighs, palms toward his legs, fingers soft and together — each hand shows EXACTLY FIVE fingers: four gentle fingers side by side and one visible thumb, natural knuckles, never splayed, never clawed, never raised. He stands naturally, feet planted flat beneath his hips, toes turned only slightly outward. Wardrobe, original design: a dusty deep-plum waistcoat with small cloth-covered buttons over a soft cream shirt with gently rolled sleeves, a loosely knotted dove-grey neck cravat, warm charcoal-brown trousers with a clear brown warmth, worn amber-brown leather shoes, and a soft yellow cloth measuring tape draped around his neck like a scarf, hanging down both sides. One warm upper-left key light with a clear candle-gold rim glowing along his lit edge and cool violet-blue shadow on the opposite side, in both views. The emotional read: whispery, wise, a little mysterious, quietly delighted — friendly and safe, never creepy, never startled. Fabric has woven grain and painted fold bands; hair is soft shaded wisps with interior strands. Picture-book proportions. Original character design, not any existing actor or film character.
```
