# SP-E spike — Violet from AI-painted sprite parts

> **Status addendum (2026-07-14):** `sheet-v2.png` (straightened-pose retry,
> $0.0337, prompt lessons folded into the D49 brief) was judged by the Art
> Director and **FAILED pre-slice**: the eyes-closed head is missing her
> glasses (identity trait would vanish every blink) and the walking leg pair
> has feet pointing opposite directions with no planted foot. Its usable
> learnings (straight arms with attached sleeve caps, defined shoulder line)
> carry into the pending v3 regeneration; v2 was never sliced. The rig
> mechanics moved from this spike's VioletSpriteRig into the shared
> `src/game/render/SpriteRig.js`.

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

## sheet-v3.png

- Generated 2026-07-13 via OpenRouter, `google/gemini-3.1-flash-lite-image`,
  cost $0.0338 (requested 16:9/2K; the provider rejected 2K and the call fell
  back to the chat endpoint at 1408×768). `sheet-v3-clean.png` is the
  sips-normalized PNG.
- Prompt: block below — the v2 verdict plus the Hagrid-run lessons encoded as
  constraints: the closed-eye head keeps the dark-green rectangular glasses
  and changes ONLY at the eyelids; arms hang STRAIGHT DOWN as exact mirrors;
  legs are separate mirrored LEFT/RIGHT parts with toes pointing away from
  each other; the walking pair shares the standing hip-to-floor height;
  EXACTLY NINE parts, shared swatches, one upper-left key light, finger-width
  clearances.
- **Art Director verdict: NOT A PASS — 1 CRITICAL, 5 MAJOR, 5 MINOR. Never
  sliced.** The standing legs are ONE fused connected component — spec slots
  7/8 don't exist and can't be rectangle-sliced or hip-pivoted (C1); the
  right arm is a mirror-COPY of the left including its paint, so its key
  light comes from the upper RIGHT (M1); both arms bow 8.5% off vertical
  with droopy splayed hands (M2); the blink head is a whole-head repaint —
  only ~56% of diff pixels fall in the eye band (M3; clean slice-time
  workaround: graft the lens interiors, since the glasses measured
  pixel-identical on both heads); the hair is a smooth straight bob vs the
  reference's long wavy strand-painted look (M4); the walk pair is 8.3%
  short of the standing column (M5). Measured clean and to protect: glasses
  identical across heads, walk-pose mechanics, every join continuity Δ≤3,
  the three-tone jersey, and 1:3.04 assembled proportions.

## v3 generation prompt

```text
Children's storybook illustration, painterly gouache and watercolor, soft 
edges and gentle paper texture, warm candlelit palette with deep violet 
accents, RICH color values — never washed out or pastel — soft dark-brown 
outlines with subtly varying weight. ONE consistent warm key light from the 
UPPER LEFT on every single part. A cutout puppet part sheet for ONE 
character, laid out like a paper-doll kit in a neat grid on a plain flat 
pale-cream background, EXACTLY NINE separate parts and nothing else — no 
duplicates, no extra pieces, no props; every part fully separated with at 
least a finger-width of empty background between any two parts, no part 
overlapping another, all parts at one consistent scale, no drop shadows, no 
text. The character: an original six-year-old girl with a warm medium-light 
complexion, long warm light-brown hair, warm brown eyes with two small 
catchlights, softly expressive eyebrows, rosy cheeks, a small dimensional 
nose, a bright gentle smile, and DARK-GREEN RECTANGULAR GLASSES. SHARED 
SWATCHES used identically wherever they appear: jersey = three-tone purple 
with a white V-collar; leggings = dark plum; sneakers = ONE single purple 
sneaker design with painted seams. The nine parts: (1) her head and face, 
eyes OPEN, wearing the dark-green rectangular glasses, hair framing the face 
with a few soft messy painted-in wisps; (2) the IDENTICAL head with eyes 
gently closed — an exact copy of part 1 changed ONLY at the eyelids: the SAME 
dark-green rectangular glasses still on her face, identical hair, identical 
wisps, identical smile, identical outline, identical size; (3) the 
back-of-hair piece alone: the long warm light-brown hair mass that hangs 
behind her body, by itself; (4) her torso wearing the three-tone purple 
soccer jersey with the white V-collar and short puffed sleeve caps, a defined 
little shoulder line, standing tall and straight, no arms, no head, a short 
skin neck stub at the collar; (5) her left arm from shoulder to hand hanging 
STRAIGHT DOWN and relaxed, bare forearm, a small natural child hand with a 
visible thumb, fingers relaxed; (6) her right arm: the exact MIRROR IMAGE of 
part 5, same length, also hanging straight down; (7) her LEFT leg from hip to 
foot, straight and vertical, dark plum legging, the purple sneaker planted 
FLAT with the toe turned slightly toward the LEFT edge of the picture; (8) 
her RIGHT leg: the exact MIRROR IMAGE of part 7, same height, same sneaker 
design, toe turned slightly toward the RIGHT edge — the two sneakers point 
AWAY from each other; (9) a walking leg pair with EXACTLY the same 
hip-to-floor height as parts 7 and 8: both feet pointing the same direction 
of travel, the LEADING foot planted completely FLAT, the TRAILING heel lifted 
with toe touching, same plum leggings, same purple sneakers. Every part has 
base color, soft shadow, and gentle highlight from the one upper-left light; 
hair has interior strand groupings; fabric has soft fold shading. 
Picture-book child proportions with a large head. Original character design, 
not any existing actor or film character.
```

## sheet-v4.png

- Generated 2026-07-13 via OpenRouter, `google/gemini-3.1-flash-image-preview`
  (model upgraded from lite for the protagonist — same reasoning as the
  Wandmaker reference: the craft ceiling was part of the problem), cost
  $0.0701, 16:9 at 1K → 1376×768. `sheet-v4-clean.png` is the sips-normalized
  PNG.
- Prompt: block below — every v3 finding encoded: legs as TWO separate
  pieces with a background gap (C1), the right arm painted with its OWN
  upper-left light instead of mirror-copied paint (M1), plumb-vertical arms
  with fingers together (M2), blink changed only at the eyelids (M3), LONG
  WAVY strand-painted hair per the reference (M4), walk pair at the exact
  standing column height (M5), slight toe turnout (m1), rich warm never-pastel
  palette (m4).
- Art Director verdict: **none — the sheet judge was cancelled by Pete
  mid-run.** Sliced and shipped live 2026-07-14 under D51's best-available
  rule on author pre-check: every axis the v3 verdict failed measurably
  improved (separated legs, wavy reference-matched hair, straight arms,
  pixel-identical glasses carried over), and the v1 parts it replaced had
  strictly worse findings on file. `rects-v4.json` maps the slice; the
  duplicate torso (the sheet painted two) and the mirror-lit second arm are
  skipped — the rig mirrors the well-lit arm at runtime. Rig numbers retuned
  for the v4 part dimensions (grounded feet, wider hip sockets, calmer leg
  swing, raised head).

## v4 generation prompt

```text
Children's storybook illustration, FULLY PAINTED gouache and watercolor with 
soft painted edges, gentle paper texture, warm candlelit palette with deep 
violet accents, RICH WARM color depth — skin with warm rosy depth, colors 
saturated like aged gouache, never pale, never pastel — soft dark-brown 
painted outlines with subtly varying weight. ONE warm key light from the 
UPPER LEFT on every single part: every part's highlight side is its left side 
and its soft shadow side is its right side, including BOTH arms and BOTH legs 
— never mirrored lighting. A cutout puppet part sheet for ONE character, laid 
out like a paper-doll kit in a neat grid on a plain flat pale-cream 
background, EXACTLY NINE separate parts and nothing else — no duplicates, no 
extra pieces, no props; every part fully separated with at least a 
finger-width of empty background between any two parts — the two legs 
especially are TWO separate pieces with a clear gap of background between 
them, never joined at the hip — no overlapping, all parts at one consistent 
scale, no drop shadows, no text. The character: an original six-year-old girl 
with a warm medium-light complexion, LONG WAVY warm light-brown hair falling 
past her shoulders with soft flyaway strand clusters and painted interior 
wave structure, warm brown eyes with two small catchlights, softly expressive 
eyebrows, rosy cheeks, a small dimensional nose, a bright gentle smile, and 
DARK-GREEN RECTANGULAR GLASSES. SHARED SWATCHES used identically wherever 
they appear: jersey = three-tone purple with a white V-collar; leggings = 
dark plum; sneakers = ONE single purple sneaker design with painted seams. 
The nine parts: (1) her head and face, eyes OPEN, wearing the dark-green 
rectangular glasses, long wavy hair framing the face with a few soft flyaway 
wisps; (2) the IDENTICAL head with eyes gently closed — an exact copy of part 
1 changed ONLY at the eyelids: the SAME dark-green rectangular glasses, 
identical wavy hair and wisps, identical eyebrows, identical cheeks, 
identical smile, identical outline, identical size; (3) the back-of-hair 
piece alone: the long WAVY warm light-brown hair mass that hangs behind her 
body past her shoulders, with painted wave ridges and strand groups; (4) her 
torso wearing the three-tone purple soccer jersey with the white V-collar and 
short puffed sleeve caps, a defined little shoulder line, standing tall and 
straight, no arms, no head, a short skin neck stub at the collar; (5) her 
left arm from shoulder to hand hanging PLUMB VERTICAL, perfectly straight and 
relaxed, bare forearm, the small child hand relaxed with fingers TOGETHER 
pointing straight down and a visible thumb resting against the side — never 
splayed, never drooping, never grasping; (6) her right arm: the same straight 
relaxed vertical arm mirrored in SHAPE only, exactly the same length — but 
painted with its OWN light still from the upper left of the picture, its 
highlight on the same left side as every other part on the sheet; (7) her 
LEFT leg alone, from hip to foot, one single separate straight vertical leg, 
dark plum legging, the purple sneaker planted FLAT, the toe turned only 
SLIGHTLY outward toward the left, nearly pointing forward; (8) her RIGHT leg 
alone: a separate mirror of part 7 standing in its own clear space on the 
sheet, same height, same sneaker design, its toe turned only slightly toward 
the right; (9) a walking leg pair EXACTLY AS TALL from hip to floor as parts 
7 and 8: both feet pointing the same direction of travel, the LEADING foot 
planted completely FLAT, the TRAILING heel lifted with toe touching, same 
plum leggings, same purple sneakers. Every part has base color, soft shadow, 
and gentle highlight from the one upper-left light; hair has interior strand 
groupings and wave structure; fabric has soft fold shading. Picture-book 
child proportions with a large head. Original character design, not any 
existing actor or film character.
```
