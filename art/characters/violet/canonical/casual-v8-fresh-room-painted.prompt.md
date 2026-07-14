# Violet casual canonical candidate v8: fresh room-painted master

Status: **OWNER-ACCEPTED CANONICAL SOURCE.** On 2026-07-14 Pete selected this
exact image as perfect and directed that canonical iteration stop. D55
explicitly decides away the automated proportion concerns that had caused this
source to be discarded. Every production expression, pose, outfit, and lighting
variant derives from `casual-approved.png`, whose RGB pixels are exactly equal
to this JPEG's decoded pixels. Do not regenerate or redesign the neutral source.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image, routed only to the
`google-ai-studio` provider

Attempt note: an earlier request of this candidate used the same exact model
through `google-vertex/global` with the three room paintings as separate input
references. It timed out before any HTTP response headers after approximately
five minutes and produced no file or usage record; whether the upstream attempt
was billed is unknown. The request below replaces those three references with
one deterministic room-style triptych and pins `google-ai-studio`; this provider
will remain fixed for every accepted descendant if the candidate passes.

Generated: 2026-07-14. OpenRouter returned
`casual-v8-fresh-room-painted-raw.jpg` in 14.33 seconds. SHA-256:
`70b1135acddf0f00e80271a80f514db1fe6d35f9d179aef6ba9703f822aef20f`.
The request used 2,359 prompt tokens and 1,120 image-completion tokens and cost
`$0.0699185`. Response metadata, request controls, hashed reference provenance,
and the safe response body without image bytes are recorded in
`casual-v8-fresh-room-painted.metadata.json`.

Owner-selected lossless source: `casual-approved.png`, 896 by 1200 RGB PNG,
SHA-256 `68e9871ceecc32b9fbf50cbf36eecbae226eb184ad5337f67bbca2e53266e033`.
Pixel comparison against the decoded raw JPEG found zero differing RGB channel
values across all 1,075,200 pixels. Acceptance provenance is recorded in
`casual-approved.metadata.json`.

Input references, in order:

1. `art/guides/character-neutral-child-proportion-guide-silent.png` — exact compact neutral joint layout and silhouette envelope only; never copy its shapes, colors, outlines, or blank face
2. `art/character-refs/violet.png` — exact Violet identity, age, face construction, glasses shape/color, and hair identity
3. `art/character-refs/hagrid.png` — character-paint material depth, broken contour handling, and dimensional cloth/hair only; never copy the subject, pose, palette, lighting, or clothing
4. `art/guides/ch1-room-style-triptych.webp` — the bedroom's bright soft-edge material modeling, Malkin's warm gouache and fabric weight, and Ollivanders' deep-value colored shadows only
5. `art/guides/flat-cyan-chroma.png` — exact required background color and uniformity only

## Prompt

Use case: identity-preserve.
Asset type: canonical aligned-canvas game character master.

Paint from scratch one original six-year-old Violet in her ordinary casual
sports clothes. Return ONE fully assembled, front-facing, upright-neutral,
full-body character centered on the exact flat cyan field shown in reference 5.
The background must be a single uniform `#00FFFF` color from corner to corner,
with no paper texture, vignette, gradient, glow, lighting, floor, horizon,
shadow, reflection, scenery, decoration, or color variation. Never use cyan in
the character. Show the entire silhouette from the highest attached hair wisp
through both shoe soles with generous empty padding. Do not paint a contact
shadow; runtime supplies a separate room-colored shadow.

REFERENCE 1 IS A MEASUREMENT MANNEQUIN ONLY. Follow its compact upright joint
layout and silhouette envelope exactly: the complete figure is 3.0 to 3.25 of
her own head heights; the short neck is visible; shoulders are present and
level; elbows sit near the waist; relaxed wrists and hands rest beside the
outer thighs; short child thighs and shins connect through visible knees and
ankles; both full toe caps face nearly forward and meet one floor line. Preserve
balanced weight and naturally grouped fingers with correct inward-facing
thumbs. Never copy the mannequin's blank head, geometric shapes, flat colors,
joint circles, floor line, or heavy outline.

REFERENCE 2 ALONE LOCKS VIOLET'S IDENTITY. Preserve its exact original child,
not a generic cute girl: the same softly oval six-year-old face, natural lower
face width, gentle jaw, warm medium-light skin, warm-brown almond eyes at the
reference's restrained size, small dimensional nose, rosy cheeks, relaxed
brows, and subtle capable closed smile. Keep the exact dark olive-green glasses
with thin HORIZONTALLY RECTANGULAR frames, visibly wider than tall and narrow
at the corners. No round or square frames, bright green plastic, oversized
lenses, wide circular doll face, button nose, enormous symmetrical eyes,
glossy toy pupils, heavy lashes, pointed chin, adult makeup, or generic nursery
character.

Keep reference 2's deeper warm light-brown/chestnut hair. It is not blonde,
gold, caramel, copper, or a mass of shiny ribbons. Preserve the off-center side
part and side-swept fringe. Build a slightly messy, asymmetrical silhouette from
broad irregular painted masses with deep chestnut interior values, restrained
warm highlights, and a few short fine wisps that visibly attach to the hair.
Let the hair fall mainly behind the shoulders so the neck, sleeve caps, elbows,
and hands read cleanly. No tidy barrel curls, evenly spaced waves, symmetrical
bell shape, outward hooks at every lock, halo, floating arcs, or antennae.

Dress her in unmistakably ordinary pre-wizard sports clothes: a saturated
blue-violet soccer jersey body with bright white V collar, close-fitting
lighter-violet short raglan sleeves, clearly deeper-violet side panels,
charcoal-plum leggings, and practical slate trainers with a small visible
purple accent on each shoe. No robe, cape, crest, number, logo, text, puff
sleeve, dress, tunic, jewelry, prop, or wand.

REFERENCES 3 AND 4 LOCK THE GAME'S PAINTED HAND. This must look like a
figure painted directly by the same artist inside those storybook rooms, not a
character-design sticker laid over them. Use their dimensional opaque gouache
and watercolor modeling: layered scumbling, brush-shaped value planes, matte
skin, weighty cloth, deep broad hair masses, irregular pigment density, and
varied edge hardness. Contours arise from adjoining painted values and colors,
not ink. Let outer and interior edges soften, break, and disappear where values
meet; reserve only small firm accents for the eyes, glasses bridge, collar,
fingertips, laces, and shoe soles. Match Hagrid's deep material modeling at a
child-appropriate scale without copying him. Do not draw continuous dark lines
around hair locks, face, jersey panels, arms, hands, leggings, or shoes. No
uniform paper-grain overlay, cel shading, sticker outline, clip art, polished
airbrush, glossy 3D, anime, vector geometry, or photorealism.

Use neutral master illumination. Model form with broad soft ambient light and
restrained cool-brown occlusion, keeping full midtones and shadows. Do not bake
directional sunlight, a golden image-left rim, halo, bright edge stripe, cast
shadow, or high-key glow into either side. Later same-model edits will create
separate left-key and right-key room variants.

Return only the one complete Violet on reference 5's perfectly uniform cyan
field. No second view, portrait inset, parts sheet, labels, border, room object,
extra person, watermark, or signature.
