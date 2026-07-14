# Violet casual proud candidate v2

Status: **ACCEPTED PRODUCTION EXPRESSION SOURCE.** `proud-v2.png` is the masked
composite over `casual-approved.png`; a fresh Art Director returned `PASS` on
2026-07-14. The globally repainted raw output remains provenance only and must
never ship.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `proud-v2-raw.png` in 20.12
seconds. SHA-256:
`23e9df3101073b62dd010c5f8ae72781bc34c257e4d0648de6e425e8e65da535`.
The request used 1,492 prompt tokens and 1,120 image-completion tokens and cost
`$0.067946`. Full safe provenance is recorded in `proud-v2.metadata.json`.

Preserved-pixel candidate: `proud-v2.png`, SHA-256
`09e3aae3513e8d14f5344fb7a1d2f8988d45558f4308c7a70a0e0e4d84fdbc0b`.
The expression mask changed 15,087 pixels; every zero-mask pixel and the base
alpha plane remain byte-identical. Composite provenance is recorded in
`proud-v2.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character facial-expression layer source.

Perform one localized facial-expression edit to reference 1. Return the exact
same 896-by-1200 full-body Violet on the exact same cyan canvas in the exact
same position. Change only both eyebrows, the visible eye interiors inside the
unchanged glasses, and the mouth. Make warm childlike pride unmistakable even
when the complete figure is reduced to gameplay scale.

Lift both eyebrows openly and evenly, with gentle organic asymmetry but no
lowered inner corners. Give both eyes the same bright pleased look: preserve
their almond shape and size while lifting the lower lids slightly from a real
smile. Replace the closed neutral smile with a broader delighted accomplishment
smile, centered rather than one-sided, showing only a narrow childlike glimpse
of upper front teeth. The expression says “I did it!”—joyful, capable, warm,
and eager to share—not smug, sly, sarcastic, self-satisfied, adult, or stern.

Everything outside those small facial regions is locked. Preserve the exact
canvas, cyan field, silhouette, pose, body, clothes, shoes, skin, face shape,
nose, cheeks, chin, ears, complete hair and wisps, and every pixel of the dark
olive-green rectangular glasses frames and bridge. Do not move or redraw the
glasses. Do not change lighting, texture, color balance, brushwork,
proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish. No smirk, one-sided
mouth, lowered inner brows, giant teeth, adult makeup, glossy vector features,
text, prop, extra figure, watermark, or signature.
