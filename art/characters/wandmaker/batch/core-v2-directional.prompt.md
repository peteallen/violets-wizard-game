# Wandmaker directional dialogue batch v2

Status: deliberate production refinement after the fresh core-v1 source review.
This is a new request, not an automatic retry. It corrects the directional read,
whole-body speech redraw, and nonuniform cyan field that blocked the proposed
core-v1 shipping subset.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 16:9, 4K, PNG, one image

Input references, in order:

1. `public/assets/art/characters/wandmaker/default/neutral.png` — exact
   deterministically extracted core-v1 production identity, palette, outfit,
   facial construction, and painterly finish; do not retain its frontal pose
2. `art/character-refs/wandmaker.png` — original identity and proportion anchor
3. `art/guides/ch1-room-style-triptych.png` — painterly room-style texture,
   key-light, and shadow-color guidance only

## Prompt

Use case: identity-preserving production character animation sheet refinement.
Asset type: deterministic-slicing source for a premium children's storybook game.

Create one polished 4K 16:9 image containing exactly four complete, separate,
full-body paintings of the exact same Wandmaker shown in references 1 and 2.
Arrange exactly one horizontal row of four figures, evenly spaced left to right,
on one perfectly flat solid RGB 104,192,209 (`#68C0D1`) cyan field. There must be
exactly four figures total, never a second row. Keep every figure entirely inside
its own quarter with generous empty cyan separation. Include every hair wisp,
elbow, hand, trouser leg, heel, and shoe sole uncropped. Do not draw grid lines,
panel borders, labels, numbers, captions, arrows, or any text.

Preserve the exact identity from reference 1: the same very old, small, slight,
kind Wandmaker with a broad gently jowled weathered face, luminous pale
silver-grey eyes with relaxed aged lids and warm catchlights, wispy flyaway
silver-white hair around a high forehead, white tufty eyebrows, large gentle
ears, rosy cheeks, deep kind smile lines, and a warm knowing smile. Preserve the
same dusty deep-plum waistcoat with cloth-covered buttons, soft cream shirt with
sleeves rolled to the elbows, loosely knotted dove-grey cravat, charcoal-brown
trousers, worn amber-brown shoes, and soft yellow measuring tape hanging down
both sides of his chest. The tape never enters either hand. Add no wand or other
handheld prop.

DIRECTION IS A HARD ACCEPTANCE CONSTRAINT. Every figure uses the same genuine
front three-quarter pose facing toward image-right, as if looking and speaking
to a child standing a little to his right. The turn must be unmistakable even in
silhouette: nose points toward image-right; nearer image-right cheek and ear are
more prominent; far image-left cheek and ear recede; sternum and waistcoat angle
toward image-right; the near image-right shoulder sits slightly forward and the
far shoulder slightly back; shoe direction and gaze both point image-right.
Never draw a squarely frontal, bilateral, passport-photo pose. Do not draw a
profile. His spine stays vertical, chin level, shoulders present, weight balanced,
and both arms hang naturally beside the body with small elderly hands against the
outer thighs.

REGISTRATION IS A HARD ACCEPTANCE CONSTRAINT. Treat the first figure as the one
shared body painting and duplicate that exact body, head silhouette, hair,
clothing, tape, limbs, hands, trousers, and shoes into positions two through four.
The only intended differences are the named eyelid or mouth pixels. Use the same
body scale, head size, ground line, horizontal facing, and foot placement in all
four quarters. Do not redraw or reinterpret clothing, hands, hair, shoulders,
limbs, or shoes between figures.

Use this exact left-to-right order:

1. NEUTRAL: eyes open and the warm knowing closed-mouth smile.
2. BLINK: identical to neutral, changing only both eyelids to a gentle natural
   closed blink. Keep the neutral mouth unchanged.
3. TALK A: identical to neutral with eyes open, changing only the lips and mouth
   interior to a modest friendly wide-vowel speaking shape.
4. TALK B: identical to neutral with eyes open, changing only the lips and mouth
   interior to a clearly distinct smaller rounded speaking shape.

Keep both hands anatomically coherent in every figure. Each arm connects through
the correct rolled sleeve, forearm, wrist, palm, and knuckles. Each small hand has
one believable thumb on the correct side and four gently curled fingers. No
backward wrist, duplicated thumb, fused mitten, claw, floating hand, oversized
hand, hidden hand, or extra finger.

Match the richly painted gouache-and-watercolor room style: visible paper and
dry-brush tooth, softly painted dark-brown accents rather than hard black ink,
organic asymmetry, woven fabric grain, worn leather detail, and softly layered
hair wisps. Reference 3 supplies only the finish and light story; include none of
its rooms or furnishings. Light every figure from upper left with warm
candle-gold highlights and violet-blue shadow color. Keep the key direction
identical across the row. Avoid airbrush-smooth skin, slick gradients, flat vector
art, anime, 3D rendering, or plastic surfaces.

THE CYAN FIELD IS A HARD ACCEPTANCE CONSTRAINT. Every background pixel outside
the four painted figures must be the same perfectly uniform solid `#68C0D1`.
Paint no glow, haze, aura, softened cyan cloud, value shift, vignette, shadow,
texture, gradient, floor plane, reflection, or color variation behind or around
any figure. No cast shadow or contact shadow. Keep crisp paint edges against the
flat field, especially around the pale hair and cream sleeves. Include no scenery,
furniture, shelves, boxes, wands, effects, decorative marks, extra people,
animals, logos, watermark, or signature. Return only the one row of four complete
directional Wandmaker figures in the specified order.
