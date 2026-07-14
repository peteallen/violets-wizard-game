# Violet robed neutral candidate v1

Status: production appearance candidate. The raw model output is never a
shipping asset; only a locally masked composite over `casual-approved.png` may
advance to review.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — immutable identity, pose, canvas, and painted-style authority
2. `art/character-refs/violet.png` — robe construction reference only

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas neutral robed game-character appearance source.

Reference 1 is the exact Violet and the only authority for her identity,
proportions, age, pose, warm light-brown hair, dark-green rectangular glasses,
face, hands, sneakers, lighting, cyan canvas, scale, registration, and opaque
gouache-and-watercolor finish. Reference 2 supplies only the successful robe
construction: a first-year black school robe with a broad colored lining,
collar, cuffs, center edges, and hem. Do not copy reference 2's face, cooler
hair, body proportions, parchment background, alternate rendering style, or
two-view composition.

Return the exact same 896-by-1200 full-body Violet from reference 1 on the
exact same cyan field, in the exact same neutral pose, position, scale, and
front-facing viewpoint. Change only her clothing from the base of her neck to
just above her shoes. Replace the soccer jersey and visible leggings with an
earned first-year robe ensemble while leaving every part of Violet herself
unchanged.

The robe is richly painted near-black charcoal fabric, never a flat black
shape. Give it soft dark-brown outlines, deep blue-black and warm charcoal
planes, subtle woven texture, believable folds from shoulders and elbows, and
small warm highlights consistent with reference 1. It falls to mid-calf and
opens enough at the bottom for both original slate trainers and purple shoe
accents to remain fully visible. It has generous sleeves that taper into broad
purple cuffs just above her unchanged hands.

Use vivid Violet-purple `#7a4fc9` as one clearly separable trim material across
the broad hood/collar lining, both cuffs, both front opening edges, and the
lower hem. The purple areas must be continuous, wide, and readable at gameplay
scale because runtime recolors this same trim to any of twelve chosen fabric
colors. Beneath the open collar show a simple warm-white shirt collar and a
small purple-and-muted-gold striped tie. Keep the ensemble childlike, practical,
and premium-picture-book rather than formal adult tailoring.

Preserve reference 1's exact head, face, expression, eyes, glasses, ears,
complete hair silhouette and attached wisps, neck, hands, fingers, shoes, floor
coordinate, and cyan field. Keep both shoulders level and both arms resting
beside the body. The sleeves attach cleanly at the shoulders and terminate at
the wrists; the robe has a visible neck opening and must not swallow her head,
hide her hands, merge into her hair, or obscure either shoe.

Do not change Violet's anatomy, posture, proportions, skin, hair, glasses,
shoes, lighting direction, color balance, brushwork, framing, or identity. No
hood on her head, scarf, house crest, badge, logo, belt, skirt, dress, cape,
wand, satchel, prop, contact shadow, scenery, text, label, border, extra figure,
watermark, or signature. Return only the one complete robed Violet on cyan.
