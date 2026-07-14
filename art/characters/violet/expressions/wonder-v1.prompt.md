# Violet casual wonder candidate v1

Status: **ACCEPTED PRODUCTION EXPRESSION SOURCE.** `wonder.png` is the masked
composite over `casual-approved.png`; a fresh Art Director found no blocking
issue on 2026-07-14. The globally repainted raw output remains provenance only
and must never ship.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `wonder-v1-raw.png` in 13.43
seconds. SHA-256:
`f0ea11f7900573488ed08ef0ce0aac661edcf6be32c4e5e2846976b4557c690e`.
The request used 1,475 prompt tokens and 1,120 image-completion tokens and cost
`$0.0679375`. Full safe provenance is recorded in `wonder-v1.metadata.json`.

Preserved-pixel candidate: `wonder.png`, SHA-256
`a1c4968104d625ba170c77e41572288a65682b92789f210bc622fc37c2bc7eb9`.
The expression mask changed 15,095 pixels; every zero-mask pixel and the base
alpha plane remain byte-identical. Composite provenance is recorded in
`wonder.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character facial-expression layer source.

Perform one localized facial-expression edit to reference 1. Return the exact
same 896-by-1200 full-body Violet on the exact same cyan canvas in the exact
same position. Change only the eyebrows, visible eye interiors inside the
unchanged glasses, and mouth so Violet shows bright, childlike wonder.

Lift both eyebrows gently with organic asymmetry. Open the existing warm-brown
almond eyes slightly wider without enlarging the glasses or turning the eyes
round; keep the same iris color and restrained pupil/catchlight treatment. Give
her a small delighted open smile at the exact existing mouth position, with a
warm dark interior and at most a tiny suggestion of upper teeth. The combined
expression reads as “Oh, wow!”—warm, curious, delighted, and safe—not shock,
fear, screaming, doll stare, or exaggerated surprise.

Everything outside those small facial regions is locked. Preserve the exact
canvas, cyan field, silhouette, pose, body, clothes, shoes, skin, face shape,
nose, cheeks, chin, ears, complete hair and wisps, and every pixel of the dark
olive-green rectangular glasses frames and bridge. Do not move or redraw the
glasses. Do not change lighting, texture, color balance, brushwork,
proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish. No circular anime
eyes, heavy lashes, mascara, makeup, giant teeth, black mouth hole, glossy
vector features, text, prop, extra figure, watermark, or signature.
