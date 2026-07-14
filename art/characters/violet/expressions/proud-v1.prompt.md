# Violet casual proud candidate v1

Status: **REJECTED BEFORE RUNTIME USE.** A fresh Art Director found that the
masked expression collapses toward neutral at gameplay scale and reads sly or
mildly smug at full scale rather than warm childlike accomplishment. Preserve
the files as provenance; never use `proud.png` as a production expression.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `proud-v1-raw.png` in 9.98 seconds.
SHA-256:
`aad85a916746bda2681daa227989e46b025408397d15cc7e4524b95dacaf002b`.
The request used 1,461 prompt tokens and 1,120 image-completion tokens and cost
`$0.0679305`. Full safe provenance is recorded in `proud-v1.metadata.json`.

Preserved-pixel candidate: `proud.png`, SHA-256
`8205e794642777c1de21e834f5317e3944b867210eeb22701919894a0c00264b`.
The expression mask changed 8,936 pixels; every zero-mask pixel and the base
alpha plane remain byte-identical. Composite provenance is recorded in
`proud.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character facial-expression layer source.

Perform one localized facial-expression edit to reference 1. Return the exact
same 896-by-1200 full-body Violet on the exact same cyan canvas in the exact
same position. Change only her eyebrows and mouth so Violet looks quietly,
warmly proud of herself.

Give both brows a gentle confident lift with slight organic asymmetry, keeping
their existing thickness, color, and childlike softness. Refine the existing
closed smile into a small satisfied smile with subtly lifted corners and a
restrained fuller lower lip. Keep the mouth closed with no teeth. The combined
expression reads “I did it!”—capable, pleased, warm, and grounded—not smug,
sarcastic, adult, mischievous, stern, or self-important.

Everything outside those small brow and mouth regions is locked. Preserve the
exact canvas, cyan field, silhouette, pose, body, clothes, shoes, skin, face
shape, eyes, pupils, nose, cheeks, chin, ears, glasses, complete hair, and
wisps. Do not change eye size or gaze, move the jaw, repaint the cheeks, alter
the nose, move or redraw the glasses, or change lighting, texture, color
balance, brushwork, proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish. No smirk, lipstick,
makeup, heavy arched adult brows, giant grin, teeth, glossy vector features,
text, prop, extra figure, watermark, or signature.
