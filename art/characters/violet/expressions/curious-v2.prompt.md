# Violet casual curious candidate v2

Status: **ACCEPTED PRODUCTION EXPRESSION SOURCE.** `curious-v2.png` is the
masked composite over `casual-approved.png`; a fresh Art Director returned
`PASS` on 2026-07-14. The globally repainted raw output remains provenance only
and must never ship.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `curious-v2-raw.png` in 21.00
seconds. SHA-256:
`d949f88d2d7fdcd21122bd9c210410cefafa68e11bdc9a2adfe68be14da3c2fb`.
The request used 1,504 prompt tokens and 1,120 image-completion tokens and cost
`$0.067952`. Full safe provenance is recorded in `curious-v2.metadata.json`.

Preserved-pixel candidate: `curious-v2.png`, SHA-256
`c75a5f311c5bb52a0417a9a980a15346da584cb91798b36477847b6ecf40abf4`.
The expression mask changed 14,886 pixels; every zero-mask pixel and the base
alpha plane remain byte-identical. Composite provenance is recorded in
`curious-v2.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character facial-expression layer source.

Perform one localized facial-expression edit to reference 1. Return the exact
same 896-by-1200 full-body Violet on the exact same cyan canvas in the exact
same position. Change only both eyebrows, the visible eye interiors inside the
unchanged glasses, and the mouth. Make friendly active curiosity unmistakable
even when the complete figure is reduced to gameplay scale.

Raise one eyebrow clearly higher while the other remains softly open and
relaxed; neither inner brow may pinch downward. Keep both warm-brown eyes at
their canonical almond size and centered gaze, but open the lids a little more
with bright attentive catchlights. Replace the neutral smile with a small
clearly parted questioning smile, centered and gently rounded, with a warm dark
interior and no teeth. The expression says “Ooh—what is that?”—interested,
clever, friendly, and ready to investigate—not worried, skeptical, suspicious,
confused, annoyed, sarcastic, or adult.

Everything outside those small facial regions is locked. Preserve the exact
canvas, cyan field, silhouette, pose, body, clothes, shoes, skin, face shape,
nose, cheeks, chin, ears, complete hair and wisps, and every pixel of the dark
olive-green rectangular glasses frames and bridge. Do not move or redraw the
glasses. Do not change lighting, texture, color balance, brushwork,
proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish. No pinched inner
brow, scowl, smirk, frown, giant round eyes, teeth, lipstick, adult makeup,
glossy vector features, text, prop, extra figure, watermark, or signature.
