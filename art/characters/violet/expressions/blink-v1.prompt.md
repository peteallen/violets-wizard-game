# Violet casual blink candidate v1

Status: **ACCEPTED PRODUCTION EXPRESSION SOURCE.** `blink.png` is the masked
composite over `casual-approved.png`; a fresh Art Director returned `PASS` on
2026-07-14. The globally repainted raw model output remains provenance only and
must never ship.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `blink-v1-raw.png` in 14.05
seconds. SHA-256:
`95fcacff3d4e89a8f1dc3008956347cfdc5d902011131664fb0d158897714bcf`.
The request used 1,495 prompt tokens and 1,120 image-completion tokens and cost
`$0.0679475`. Full safe provenance is recorded in `blink-v1.metadata.json`.

Preserved-pixel composite: `blink.png`, SHA-256
`995f433244851b2f4d5e0220c6f1ad2122e8abf71eb6ac440aaeb292a71a8158`.
The two eye masks changed 6,514 pixels; all 1,068,634 zero-mask pixels and the
entire base alpha plane remain byte-identical. Deterministic composite
provenance is recorded in `blink.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character facial-expression layer source.

Perform one tiny localized edit to reference 1. Return the exact same
896-by-1200 full-body Violet on the exact same cyan canvas in the exact same
position. Change only the visible eye artwork inside the two dark olive-green
glasses lenses so both eyes are naturally and fully closed in one calm blink.

Paint two soft, slightly downward-curving closed upper eyelids at the existing
eye positions, with warm brown lash lines and the faintest child-appropriate
lash suggestion. The lids follow the existing almond-eye width and perspective.
They close symmetrically but retain the painting's organic hand-made variation.
Hide the irises, pupils, sclera, and catchlights completely. Keep the relaxed
brows, cheeks, nose, and subtle smile so the expression reads as a comfortable
blink, not sleep, pain, a wink, a squint, or sadness.

Everything outside those two small eye interiors is locked. Preserve the exact
canvas, cyan field, character silhouette, pose, body, clothes, shoes, skin,
face shape, ears, hair, wisps, eyebrows, nose, cheeks, mouth, chin, and every
pixel of the dark olive-green rectangular glasses frames and bridge. Do not
move, redraw, brighten, thicken, recolor, or distort the glasses. Do not change
lighting, texture, color balance, brushwork, proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish inside the eyelids.
No eyeliner, mascara, eye shadow, makeup, glossy digital line, anime eye,
extra lashes, text, props, additional figure, watermark, or signature.
