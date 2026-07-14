# Violet casual talk-a candidate v1

Status: production expression candidate. The raw model output is never a
shipping asset; only a locally masked composite over `casual-approved.png` may
advance to review.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `talk-a-v1-raw.png` in 12.05
seconds. SHA-256:
`a8d8e5b2d92495202202c8d0138956d6bb93637c96affeb87dfc556c50a294cb`.
The request used 1,457 prompt tokens and 1,120 image-completion tokens and cost
`$0.0679285`. Full safe provenance is recorded in `talk-a-v1.metadata.json`.

Preserved-pixel candidate: `talk-a.png`, SHA-256
`eec0fa6d2956d7d80a0b2de6e967130834957292eb872fe4a71dddb49b24eb93`.
The mouth mask changed 5,034 pixels; every zero-mask pixel and the base alpha
plane remain byte-identical. Composite provenance is recorded in
`talk-a.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character speaking-mouth layer source.

Perform one tiny localized edit to reference 1. Return the exact same
896-by-1200 full-body Violet on the exact same cyan canvas in the exact same
position. Change only her mouth so she is speaking a gentle open mid-vowel.

Replace the closed smile with a small child-proportioned softly open mouth at
the exact existing mouth position. Keep the same friendly smile energy and
natural asymmetry. Show a restrained warm dark mouth interior, a subtle upper
lip, a soft lower lip, and at most a narrow suggestion of upper front teeth.
The opening stays compact and horizontally oval, readable at gameplay scale
without becoming a shout, grin, gasp, singing pose, or adult lipstick shape.

Everything outside the small mouth and immediate lip interior is locked.
Preserve the exact canvas, cyan field, character silhouette, pose, body,
clothes, shoes, skin, face shape, chin, cheeks, nose, eyes, brows, glasses,
ears, hair, and wisps. Do not move the jaw, widen the smile, repaint the cheeks,
change the nose, add dimples, alter lighting, or change texture, color balance,
brushwork, proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish inside the mouth. No
large teeth, tongue emphasis, lipstick, makeup, glossy vector lip, black hole,
anime mouth, text, prop, extra figure, watermark, or signature.
