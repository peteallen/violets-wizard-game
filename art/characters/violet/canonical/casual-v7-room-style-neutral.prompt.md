# Violet casual canonical candidate v7: room-style neutral master

Status: discarded before formal review or derivation. The compact anatomy was
retained, but the rejected V6 input remained the dominant visual anchor: the
result repeated its continuous outlined/cel-shaded finish, tidy blonde barrel
waves, bright near-square glasses, and doll-like face. It also rendered a cyan
vignette instead of the required uniform extraction field. Do not derive,
slice, or ship this candidate.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image, routed only to Google's provider

Generated: 2026-07-14. OpenRouter returned
`casual-v7-room-style-neutral-raw.png` in 22.09 seconds. SHA-256:
`fc1be066310a674124a3d1e9af90329e3f283ce54de9ae64fac8c0b778aa1d16`.
The request used 6,695 prompt tokens and 1,120 image-completion tokens and cost
`$0.0705475`. Response metadata, request controls, and hashed reference
provenance without credentials or image bytes are recorded in
`casual-v7-room-style-neutral.metadata.json`.

Input references, in order:

1. `casual-v6-identity-edit-raw.png` — compact anatomy, full-body placement, ordinary sports outfit, and neutral stance only; its paint finish, lighting, face construction, glasses, and hair are not references
2. `art/character-refs/violet.png` — exact Violet identity, age, face construction, glasses shape and color, and hair identity
3. `art/raw/ch1-bedroom.png` — soft-edge painted material language and bright-room value modeling only
4. `art/raw/ch1-malkins.png` — warm gouache surface, fabric weight, and selective edge handling only
5. `art/raw/ch1-ollivanders.png` — deep-value paint modeling and readable shadow color only

## Prompt

Use case: identity-preserve.
Asset type: canonical aligned-canvas game character master.

Create one newly painted canonical casual-clothes Violet from the supplied
references. Return ONE fully assembled, front-facing, upright-neutral,
full-body six-year-old on a perfectly flat, uniform solid `#00FFFF` cyan
chroma-key background. The cyan background is solely for local extraction: it
must contain no paper grain, wash, gradient, lighting, shadow, floor, horizon,
reflection, decoration, or color variation. Do not use `#00FFFF` anywhere in
the character. Show the complete silhouette from the highest attached hair
wisp through both shoe soles with generous padding. Do not include a contact
shadow; the game supplies its own room-toned shadow.

REFERENCE 1 LOCKS GEOMETRY ONLY. Match its exact compact child scale, centered
placement, 3.0-to-3.25-head total proportion, large child head, visible short
neck, level shoulders, ordinary short-sleeved soccer jersey, relaxed arms
beside the outer thighs, short leggings-clad legs, forward-planted trainers,
and balanced neutral stance. Keep anatomically legible shoulders, elbows,
wrists, hands, knees, ankles, and forward foot axes. Both hands have clear
inward-facing thumbs and quiet grouped fingers. Both toe caps face almost
straight toward the viewer and sit on one floor line. Do not copy reference
1's continuous outlines, cel-shaded planes, golden rim, paper texture, face,
glasses construction, or hair design.

REFERENCE 2 LOCKS VIOLET'S IDENTITY AND AGE. Paint the same original
six-year-old: a softly oval child face with the reference's natural lower-face
width and gentle jaw, warm medium-light skin, warm-brown almond eyes at the
reference's restrained scale, small dimensional nose, rosy cheeks, relaxed
eyebrows, and bright but subtle closed smile. Avoid a wide circular doll face,
button nose, enormous symmetrical eyes, long lashes, glossy pupils, sculpted
cheekbones, pointed chin, adult makeup, or generic nursery character. Preserve
the exact DARK OLIVE-GREEN, HORIZONTALLY RECTANGULAR glasses: visibly wider
than tall, narrow at the corners, darker and less saturated than the jersey,
never bright green, near-square, round, oversized, or translucent.

Restore reference 2's deeper WARM LIGHT-BROWN TO CHESTNUT hair, not blonde,
gold, caramel, or copper. Use broad irregular waves with deep chestnut interior
shadow and only restrained warm highlights. Keep the off-center side part,
side-swept fringe, asymmetrical outer silhouette, and several short irregular
fine wisps that visibly attach to the main mass. Let the hair fall mostly
behind the shoulders so the neck, sleeve caps, elbows, and hands remain clear.
No tidy barrel curls, evenly spaced ribbon waves, salon symmetry, bell shape,
dozens of outward hooks, floating arcs, antennae, or halo.

Keep the ordinary pre-wizard outfit: saturated blue-violet jersey body, bright
white V collar, close-fitting lighter-violet athletic raglan sleeves, clearly
deeper-violet side panels, charcoal-plum leggings, and practical slate trainers
with one small visible purple accent on each shoe. No robe, costume, crest,
number, logo, text, puff sleeve, dress, tunic, jewelry, prop, or wand.

REFERENCES 3, 4, AND 5 LOCK THE GAME'S PAINTED HAND. Paint Violet as though the
same room artist painted her directly into those scenes, then lifted the intact
figure onto cyan. Use opaque and dry-brush gouache over subtle watercolor
tooth inside the paint, layered scumbling, irregular pigment density, soft
matte skin, broad modeled hair masses, fabric weight, and varied edge hardness.
Contours are value and color boundaries made by adjoining brush shapes, not
line art. Let edges soften, break, and disappear where neighboring values meet;
reserve a few firmer accents for the glasses, eyes, collar, fingers, and shoe
soles. Do not surround hair ribbons, face, jersey panels, limbs, hands, or shoes
with continuous dark strokes. No uniform texture overlay, cel shading, sticker
outline, clip art, airbrush polish, glossy 3D, anime, vector geometry, or
photorealism.

This is a NEUTRAL-LIGHT MASTER for later room-specific left-key and right-key
derivatives. Give form readable midtone modeling with a soft broad ambient
source and restrained cool-brown occlusion only. Do not bake a rim light,
directional sun stripe, golden edge, bright halo, cast shadow, or high-key glow
onto either side. Preserve enough midtone and shadow depth that the figure can
be relit convincingly for both the bright bedroom and dark Ollivanders without
repainting her identity.

Return only the single character on the perfectly uniform cyan field. No
second view, portrait inset, exploded parts, labels, border, scenery, room
objects, extra person, watermark, or signature.
