# Wandmaker reference-sheet provenance

This is a style target for the Wandmaker's painted sprite parts (D48) and the
identity source for every art-director judgment of his future part sheets. It
is reference-only material and is never shipped by the game.

## Current file

- Status: **under fresh art-director review (D49)** — accepted only on a PASS
  verdict; this line is updated when the ruling lands
- Generated: 2026-07-13
- Workflow: OpenRouter Image API via the `openrouter-image` skill (requested
  16:9 at 2K; provider rejected the resolution parameter and the call fell back
  to the chat endpoint)
- Model identifier: `google/gemini-3.1-flash-lite-image`
- Cost: $0.0345
- Reference images: none — text-to-image only; the room-palette vocabulary is
  carried entirely by the prompt
- Returned dimensions: 1376 × 768, normalized to true PNG via `sips`
- File: `wandmaker.png`
- SHA-256: `acb148aab216ee28cf17333993e8cd0212955974cceed4af9e676054fe9210ba`

## Design intent

CHAPTERS.md gives him one beat that defines him: whispery and delighted —
"Curious…" as the third wand erupts in golden light. The sheet aims that
personality at a 6-year-old: moonlike pale silver-grey eyes, flyaway
silver-white hair, a knowing closed-mouth smile, a gentle scholarly stoop that
must never loom, and the yellow measuring tape worn like a scarf. Wardrobe is
an original design (dusty deep-plum waistcoat, cream shirt with rolled
sleeves, dove-grey cravat, charcoal-brown trousers, amber-brown shoes) so his
part-sheet arms can carry cream shirt sleeves that match the torso's rolled
cuffs. No actor likeness, no film costume.

## Generation prompt

```text
Premium children's storybook illustration, painterly gouache and watercolor, soft edges, dry-brush texture, visible paper grain, organic asymmetry, gently varying dark-brown contour lines, RICH DEEP color values glowing like candlelight — aged parchment, candle gold, deep night blue, dusty violet, warm umber — never washed out, no pure black or pure white. A character reference sheet, landscape: the exact same character shown twice — a front-facing full-body neutral standing pose on the left, and a much larger face-and-shoulders close-up on the right, identical identity, outfit, and colors in both views, on a simple irregular parchment-and-deep-night-blue painted wash background, no scenery, no text, no labels, no panel borders. The character: an original very old wandmaker and shopkeeper, small and slight with a gentle scholarly stoop, but bright-eyed and utterly delighted, as if he has just discovered something wonderful. Large luminous pale silver-grey eyes, wide and moonlike, with catchlights; wispy flyaway silver-white hair rising like soft smoke around a high forehead; tufty white eyebrows; a warm knowing closed-mouth smile; a weathered kind face with deep smile lines; long slender careful fingers, both hands fully visible. Wardrobe, original design: a dusty deep-plum waistcoat with small cloth-covered buttons over a soft cream shirt with the sleeves gently rolled, a loosely knotted dove-grey neck cravat, charcoal-brown trousers, worn amber-brown leather shoes, and a soft yellow cloth measuring tape draped around his neck like a scarf. One warm upper-left key light with a candle-gold rim on his lit side and cool violet-blue shadow on the other. The emotional read: whispery, wise, a little mysterious, delighted — a keeper of a thousand small boxes; friendly and safe, never creepy. Every major form has base color, shadow, and highlight; fabric has woven grain and fold bands; hair is soft shaded wisps with interior strands. Real illustrated eyes with irises, pupils, catchlights, shaped lids. Picture-book proportions. Original character design, not any existing actor or film character.
```
