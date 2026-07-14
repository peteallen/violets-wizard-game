# SP-E spike — Violet from AI-painted sprite parts

Proves the character-medium change: painted sprite parts (generated in the room
style) assembled on the existing puppet animation grammar, replacing hand-drawn
bezier path art. Reviewed in harness scene `character-sprite-spike-review`
side-by-side against the code-drawn Violet.

## Provenance

- `sheet-v1.png` — raw generator output (JPEG bytes despite the name; kept verbatim).
- `sheet-v1-clean.png` — same image normalized to real PNG via `sips` (slicer input).
- Generated 2026-07-13 via OpenRouter, model `google/gemini-3.1-flash-lite-image`,
  Image API, aspect 16:9 at 1K (requested 1:1/2K, provider clamped), cost $0.0337.
- Prompt: recorded below, verbatim.
- `slice.mjs` — deterministic slicer: crop rects → modal-border-color flood key →
  keep dominant connected component → 1px feather → trim. Output in `parts/`.
- Parts: headOpen, headBlink, backHair, torso, arm (mirrored at runtime for the
  far side), legLeft, legRight. `wisps` is sliced but unused (read as a detached
  antenna arc when overlaid — the head part's painted-in wisps carry D11 instead).
- The sheet's second short-haired closed-eye head is off-spec output, unused.

## Generation prompt

```text
Children's storybook illustration, painterly gouache and watercolor, soft edges
and gentle paper texture, warm candlelit palette with deep violet accents, soft
dark-brown outlines with subtly varying weight. A cutout puppet part sheet for
ONE character, laid out like a paper-doll kit on a plain flat pale-cream
background, every part fully separated with clear empty space between parts,
all parts at the same consistent scale, no overlapping, no drop shadows, no
text, no labels, no lettering. The character: an original six-year-old girl
with a warm medium-light complexion, long warm light-brown hair, warm brown
eyes with two small catchlights, softly expressive eyebrows, rosy cheeks, a
small dimensional nose, a bright gentle smile, and dark-green rectangular
glasses. Parts on the sheet: (1) her head and face with hair framing the face
and three or four soft messy hair wisps, eyes open, wearing the dark-green
rectangular glasses; (2) a second identical head with eyes gently closed, same
everything else; (3) the back-of-hair piece alone — the long warm light-brown
hair mass that sits behind her body, shown by itself; (4) her torso wearing a
three-tone purple soccer jersey with a white V-collar and short puffed sleeves,
no arms attached, no head; (5) her left arm from shoulder to hand, relaxed and
slightly bent, bare forearm, small natural child hand with a visible thumb;
(6) her right arm from shoulder to hand, same style mirrored; (7) her left leg
from hip to foot wearing a dark plum legging and a purple sneaker with painted
seams; (8) her right leg, same style mirrored. Every part has base color, soft
shadow, and a gentle highlight as if lit from the upper left; hair has interior
strand groupings; fabric has soft fold shading. Picture-book child proportions
with a large head. Original character design, not any existing actor or film
character.
```
