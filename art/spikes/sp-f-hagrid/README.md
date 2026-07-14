# SP-F — Hagrid from AI-painted sprite parts

Second character through the D48 painted-parts pipeline, and the first to run
the full D49 law end-to-end: every sheet is judged by a fresh Art Director
agent (docs/ART_DIRECTOR.md) BEFORE slicing.

## sheet-v1.png

- Generated 2026-07-14 via OpenRouter, `google/gemini-3.1-flash-lite-image`,
  cost $0.0348. JPEG bytes despite the name; `sheet-v1-clean.png` is the
  sips-normalized PNG. Prompt: first block below.
- **Art Director verdict: FAIL — 4 CRITICAL, 7 MAJOR, 4 MINOR. Never sliced.**
  Highlights: back-mane near-black vs brown heads and undersized (C1); torso
  had a baked-in left sleeve ending in a handless stump (C2); leg trousers
  ~80% lighter than the torso's trouser wedge (C3); walk pair 20% short in
  column height (C4); blink head drifted outside the eyelids (F5); standing
  boots were different designs pointing the same way (F6); stride inverted —
  lead toe-up, trailing flat (F7); lighting flipped between parts (F8); whole
  sheet systematically faded vs `art/character-refs/hagrid.png` (F9); bulk
  under spec at 1.79 head-widths vs the reference's ~2.4 (F10); beckon arm
  forearm-only (F11).
- `rects-v1.json` was drafted before the verdict and never used.

## sheet-v2.png

- Generated 2026-07-14, same model, cost $0.0349. Prompt: second block below —
  every v1 finding encoded as an explicit constraint (shared swatches, single
  upper-left key light, sleeveless torso ~2.5 heads wide, mirrored two-buckle
  legs, flat-planted lead foot, rich reference-depth values).
- **Art Director verdict: FAIL — 3 CRITICAL, 3 MAJOR, 4 MINOR. Never sliced.**
  Craft passed (one key light, per-join color continuity dE 5.7–12.7, mane
  1.32× head, genuinely sleeveless torso, no touching parts) but the kit is
  broken: torso only 1.38 head-widths vs ~2.4 spec / 2.08 measured on the
  reference (C1); the raised beckon arm exists only baked onto an unrequested
  duplicate torso — the standalone second arm is a low palm-up "offer" pose
  14% short (C2); three standing boots all toe-right, mirror-IoU test proves
  no mirrored pair exists (C3); blink head is a whole-head redraw — only 46%
  of diff pixels fall in the eye band, would shimmer every blink (M1); walk
  pair columns 9–12% short vs the standing leg (M2); two extra parts
  (duplicate torso, coat back view) plus bbox overlaps kill rectangle slicing
  (M3); palette uniformly grayer/cooler than the reference (m2). Verdict:
  regeneration mandatory; parts 00/02/03/04 alpha-salvageable in the interim.

## sheet-v3.png

- Generated 2026-07-13, same model, cost $0.0352 (requested 16:9/2K; the
  provider rejected 2K and the call fell back to the chat endpoint at
  1408×768). `sheet-v3-clean.png` is the sips-normalized PNG.
- Prompt: third block below — every v2 finding encoded as a constraint:
  EXACTLY NINE parts with duplicates/back-views banned, the torso as the
  largest piece at ~2.5 head-widths, a standalone raised beckon arm attached
  to nothing, LEFT/RIGHT mirrored standing boots pointing away from each
  other, the walk pair at the standing column height, the blink head changed
  only at the eyelids, finger-width clearances with no bbox overlaps, and
  warm reddish (never gray) browns.
- Art Director verdict: pending at time of writing; recorded here when ruled.

## v1 generation prompt

```text
Children's storybook illustration, painterly gouache and watercolor, soft
edges and gentle paper texture, warm candlelit palette, soft dark-brown
outlines with subtly varying weight. A cutout puppet part sheet for ONE
character, laid out like a paper-doll kit in a neat grid on a plain flat
pale-cream background, every part fully separated with clear empty space
between parts, all parts at the same consistent scale, one consistent
upper-left warm light across all parts, no overlapping, no drop shadows, no
text, no labels. The character: an original gentle half-giant groundskeeper,
a huge kindly bear of a man with a wild dark-chocolate-brown mane of hair, a
full bushy dark-brown beard and moustache with a visible warm smile beneath,
twinkling warm brown eyes under heavy expressive eyebrows, a big friendly
bulbous nose, and rosy weathered cheeks. The parts, each shown once: (1) his
head and face: forehead and eyes visible under the shaggy fringe, the full
beard and moustache attached, eyes OPEN, framed by the front of his mane;
(2) the exact same head again with eyes gently CLOSED under heavy lids —
everything else pixel-for-pixel identical to part 1: same beard, same
moustache, same hair, same size, same position of every feature; (3) the big
back-of-mane hair mass alone, the wild dark hair that sits behind his body
and shoulders; (4) his massive torso wearing a long weathered brown overcoat
with visible stitched patches and round brass toggle buttons, open at the
chest to show a dark-green waistcoat and a plum-purple scarf, with a clearly
defined broad shoulder line, a short neck stub of skin at the collar, NO
sleeves, NO arms, NO head; the coat colors softly shaded with folds, one
consistent brown family, never hard color-block bands; (5) one enormous arm
hanging STRAIGHT DOWN, vertical and relaxed with the slightest natural elbow
bend, the brown coat sleeve with a wide folded cuff attached at the shoulder
end and painted in exactly the same brown tones as the torso shoulder area,
ending in a huge friendly hand with fingers together and a visible thumb;
(6) a second arm raised in a warm beckoning gesture, bent at the elbow, big
open hand waving follow-me, same matching coat sleeve and cuff; (7) his left
leg standing PERFECTLY STRAIGHT and vertical from hip to foot, baggy brown
trousers and a huge brown leather boot with buckles, the foot angled about
30 degrees outward, planted flat on the ground; (8) his right leg, identical,
straight and vertical, planted flat; (9) one extra pair of legs together in a
gentle mid-stride walking pose, BOTH feet pointing in the same direction of
travel, the leading foot planted FLAT on the ground and the trailing heel
just lifting, never tip-toe on both feet, never feet pointing opposite ways.
Every part has base color, soft shadow, and gentle highlight; hair and beard
built from soft shaded masses with interior strand groupings, never flat
silhouettes. Broad picture-book proportions: he is wide, round-shouldered,
and mighty but friendly. Original character design, not any existing actor or
film character.
```

## v2 generation prompt

```text
Children's storybook illustration, painterly gouache and watercolor, soft
edges, gentle paper texture, RICH DEEP color values: dark chocolate browns,
deep greens, deep plum — never washed out or pastel. ONE consistent warm key
light from the UPPER LEFT on every single part. A cutout puppet part sheet
for ONE character, laid out like a paper-doll kit in a neat grid on a plain
flat pale-cream background, parts fully separated, all at one consistent
scale, no overlapping, no drop shadows, no text. The character: an original
gentle half-giant groundskeeper, enormous and mighty but friendly, with a
wild DARK-CHOCOLATE-BROWN mane, full bushy dark-brown beard and moustache
with a visible warm smile, twinkling warm brown eyes under heavy brows, big
bulbous nose, rosy weathered cheeks. SHARED SWATCHES used identically
wherever they appear: coat = deep weathered chocolate brown with stitched
patches; trousers = DARK espresso brown; boots = one single design, deep
brown leather with TWO brass buckles; hair and mane = one warm very dark
brown. The parts: (1) head with face: eyes OPEN, beard and moustache
attached, shaggy dark fringe; (2) the IDENTICAL head with eyes gently closed
— copy of part 1 changed ONLY at the eyelids: identical fringe, identical
beard, identical mouth, identical outline, identical size; (3) the
back-of-mane: a HUGE wild warm dark-brown hair mass, much wider and taller
than the head, flowing past shoulder height, painted in exactly the head's
hair color; (4) his massive torso, VERY broad and round — about two and a
half heads wide at the chest: the long deep-brown patched overcoat with
brass toggles down the full front, open over a deep-green waistcoat and
deep-plum scarf worn directly over the beard line with no shirt collar, dark
espresso trousers visible between the coat flaps at the bottom, a short skin
neck stub at the collar, COMPLETELY SLEEVELESS: no sleeve, no cuff, no arm
on either side, clean coat silhouette on both sides; (5) one complete arm
from SHOULDER to fingertips hanging straight down, slightest elbow bend,
deep-brown coat sleeve with wide folded cuff in exactly the coat's colors,
ending in a huge thick-fingered hand with a visible thumb, fingers together;
(6) a second complete arm from SHOULDER to fingertips, same length as part
5, raised and bent at the elbow in a friendly follow-me beckon, big
thick-fingered open hand, same sleeve colors; (7) left standing leg from hip
to foot, PERFECTLY straight and vertical, dark espresso trousers, the
two-buckle deep-brown boot planted FLAT, foot angled about 30 degrees toward
the viewer; (8) right standing leg: the exact MIRROR of part 7, same length,
same boot design, same colors; (9) a walking leg pair with the SAME
hip-to-floor height as parts 7 and 8: both feet pointing the direction of
travel, the LEADING foot planted completely FLAT on the ground, the TRAILING
foot with its heel lifted and toe touching, dark espresso trousers, the same
two-buckle boots. Every part shares the one upper-left key light with warm
highlights and cool shadow sides. Hair, mane, and beard are soft shaded
masses with interior strand groupings. Original character design, not any
existing actor or film character.
```

## v3 generation prompt

```text
Children's storybook illustration, painterly gouache and watercolor, soft 
edges, gentle paper texture, RICH DEEP WARM color values: reddish chocolate 
browns, deep greens, deep plum, glowing like a candlelit oil painting — never 
washed out, never gray-brown, never pastel. ONE consistent warm key light 
from the UPPER LEFT on every single part. A cutout puppet part sheet for ONE 
character, laid out like a paper-doll kit in a neat grid on a plain flat 
pale-cream background, EXACTLY NINE separate parts and nothing else — no 
duplicate parts, no back views, no props, no extra pieces; every part fully 
separated with at least a finger-width of empty background between any two 
parts, no part overlapping another, all parts at one consistent scale, no 
drop shadows, no text. The character: an original gentle half-giant 
groundskeeper, enormous and mighty but friendly, with a wild 
DARK-CHOCOLATE-BROWN mane, full bushy dark-brown beard and moustache with a 
visible warm smile, twinkling warm brown eyes under heavy brows, big bulbous 
nose, rosy weathered cheeks. SHARED SWATCHES used identically wherever they 
appear: coat = deep weathered chocolate brown with stitched patches; trousers 
= dark espresso brown; boots = ONE single design, deep brown leather with TWO 
brass buckles; hair, mane, and beard = one warm very dark brown. The nine 
parts: (1) head with face: eyes OPEN, beard and moustache attached, shaggy 
dark fringe; (2) the IDENTICAL head with eyes gently closed — an exact copy of 
part 1 changed ONLY at the eyelids: identical hair strands, identical fringe, 
identical beard, identical brows, identical mouth, identical outline, 
identical size; (3) the back-of-mane alone: a HUGE wild warm dark-brown hair 
mass, wider and taller than the head; (4) his GIGANTIC torso — THE LARGEST 
PIECE ON THE SHEET BY FAR, a wide mountain of coat about as wide as it is 
tall, the chest and hem TWO AND A HALF TIMES AS WIDE AS THE HEAD PART, much 
wider than the back-of-mane piece, with massive round sloping shoulders: the 
long deep-brown patched overcoat with brass toggles down the front, open over 
a deep-green waistcoat and deep-plum scarf, wide dark espresso trousers 
showing between the coat flaps at the bottom, a short skin neck stub at the 
collar, COMPLETELY SLEEVELESS with NO arms and clean armhole silhouettes on 
both sides; (5) one complete arm from SHOULDER to fingertips hanging STRAIGHT 
DOWN, deep-brown coat sleeve with wide folded cuff in exactly the coat's 
colors, ending in a huge thick-fingered hand, fingers together, visible 
thumb; (6) a second complete arm from SHOULDER to fingertips, EXACTLY the 
same length as part 5, floating on the background attached to NOTHING: bent 
at the elbow with the big open hand RAISED UP at head height, palm facing 
out, fingers pointing upward in a friendly follow-me wave; (7) his LEFT 
standing leg from hip to foot, straight and vertical, wide dark espresso 
trouser leg, the two-buckle deep-brown boot planted FLAT with the toe turned 
about 30 degrees toward the LEFT edge of the picture; (8) his RIGHT standing 
leg: the exact MIRROR IMAGE of part 7, same height, same boot design, toe 
turned about 30 degrees toward the RIGHT edge of the picture — the two boots 
point AWAY from each other; (9) a walking leg pair with EXACTLY the same 
hip-to-floor height as parts 7 and 8: both feet pointing the same direction 
of travel, the LEADING foot planted completely FLAT, the TRAILING heel lifted 
with toe touching, same wide espresso trousers, same two-buckle boots. Every 
trouser leg is thick and wide to match the trousers on the torso. Hair, mane, 
and beard are soft shaded masses with interior strand groupings. Original 
character design, not any existing actor or film character.
```
