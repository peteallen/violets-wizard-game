# Violet casual curious candidate v1

Status: **REJECTED BEFORE RUNTIME USE.** A fresh Art Director found that the
masked expression is not distinct enough from neutral at gameplay scale and
reads worried or skeptical rather than open curiosity. Preserve the files as
provenance; never use `curious.png` as a production expression.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `curious-v1-raw.png` in 10.70
seconds. SHA-256:
`19896dc19582a8a33c8839039e7d46ac8647e89e2809e22549df99e98c497094`.
The request used 1,471 prompt tokens and 1,120 image-completion tokens and cost
`$0.0679355`. Full safe provenance is recorded in `curious-v1.metadata.json`.

Preserved-pixel candidate: `curious.png`, SHA-256
`e557cf6350b2b9d34129157e743c4e8c48a4988b2e21a0072b71595160f7518e`.
The expression mask changed 9,010 pixels; every zero-mask pixel and the base
alpha plane remain byte-identical. Composite provenance is recorded in
`curious.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character facial-expression layer source.

Perform one localized facial-expression edit to reference 1. Return the exact
same 896-by-1200 full-body Violet on the exact same cyan canvas in the exact
same position. Change only her eyebrows and mouth so Violet looks warmly and
actively curious.

Raise one eyebrow a little higher while the other stays softly attentive,
keeping both brows childlike, gently painted, and naturally asymmetrical.
Change the existing smile into a tiny thoughtful half-open smile at the exact
mouth position, as if she is about to ask “Why?” Keep the opening restrained,
with a warm mouth interior and no visible teeth. The combined expression reads
interested, clever, friendly, and ready to explore—not suspicious, annoyed,
smug, confused, worried, sarcastic, or adult.

Everything outside those small brow and mouth regions is locked. Preserve the
exact canvas, cyan field, silhouette, pose, body, clothes, shoes, skin, face
shape, eyes, pupils, gaze, nose, cheeks, chin, ears, glasses, complete hair,
and wisps. Do not change eye size, move the jaw, repaint the cheeks, alter the
nose, move or redraw the glasses, or change lighting, texture, color balance,
brushwork, proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish. No scowl, adult
arched brow, smirk, lipstick, makeup, teeth, giant mouth, glossy vector
features, text, prop, extra figure, watermark, or signature.
