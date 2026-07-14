# Violet casual canonical candidate v6: face and hair correction

Status: **REJECTED before derivation** by the three-lens Art Director review.
Anatomy and six-year-old readability found only minor issues. The independent
style and room-integration lens blocked the source for continuous sticker-like
contours, a strong baked image-left rim that contradicts rooms with other light
directions or values, and identity drift toward brighter square glasses, a
round doll-like face, and tidy honey-blonde barrel waves. The opaque parchment
also makes clean extraction unsafe. Do not derive, slice, or ship this
candidate.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned
`casual-v6-identity-edit-raw.png` in 11.37 seconds. SHA-256:
`1bee995856ef74956414ea34ae0afa368d2fbaa3e48d115556769fbff885e151`.
The request used 2,862 prompt tokens and 1,120 image-completion tokens and cost
`$0.068631`. Response metadata without credentials or image bytes is recorded
in `casual-v6-identity-edit.metadata.json`.

Input references, in order:

1. `casual-v5-compact-repaint-raw.png` — the edit target; its body, pose, outfit, compact proportions, and painted medium are locked
2. `identity-face-crop.png` — the exact Violet face, glasses, fringe, and calm hair identity to restore

## Prompt

Perform one localized identity correction to reference 1. Return the same single
front-facing, upright-neutral, compact full-body Violet on the same parchment
canvas. Preserve the exact canvas, character position, 3.0-to-3.25-head body
proportion, visible neck, shoulders, arms, hands, jersey, leggings, shoes, floor
line, contact wash, upper-left key light, cool right-side shadows, gouache
texture, outlines, and all pixels below the base of the hair. Do not lengthen,
shorten, shift, crop, or redesign the body or clothing.

Change only Violet's face, crown/fringe, and hair mass so they match reference 2
unmistakably at gameplay scale.

FACE: restore reference 2's broad rounded six-year-old face and soft rounded jaw.
Remove the narrow taper and pointed chin. Preserve her warm medium-light skin,
warm brown almond-shaped eyes, rosy cheeks, small subtle dimensional nose, and
bright but gentle child smile. Use the reference's relaxed, slightly flatter
eyebrows and restrained child-appropriate lashes; no high arched brows, heavy
mascara, sharp nose bridge, sculpted cheekbones, elongated preteen face, doll
stare, or adult makeup. Keep the DARK-GREEN RECTANGULAR glasses in the exact
identity shape, neither round nor oversized. Make the cheek lift, smile, and
brow warmth readable when the full figure is reduced to gameplay scale without
changing her identity.

HAIR: restore reference 2's clearly side-swept fringe and off-center crown.
Build the long warm light-brown hair from broad soft waves with chestnut shadow
depth, not corkscrew ringlets. Narrow and calm the outer silhouette so hair falls
behind the shoulders and leaves both athletic sleeves, elbows, and arm outlines
fully readable. It may reach past the shoulders, but it must not merge into or
cover the sleeve caps, elbows, hands, or central neck/collar. Use exactly three
or four short, irregular, chunky wisps visibly attached to the main hair mass.
No near-center part, symmetrical bell shape, halo, excessive volume, thin loops,
floating arcs, antennae, or dozens of outlined ringlets.

Preserve the tactile opaque and dry-brush gouache, visible watercolor paper
tooth, irregular pigment modulation, broken painted edges, selective dark-brown
contours, decisive warm upper-left highlights, restrained golden rim, and cool
violet-brown right-side shadow. The corrected face and hair must look painted by
the same hand as the locked body, not pasted on. No smooth airbrush, glossy
ribbon hair, nursery clip art, vector geometry, plastic 3D, anime, or
photorealism.

Do not add text, labels, props, extra views, extra people, clothing changes,
long sleeves, scenery, borders, or decorations.
