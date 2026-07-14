# Violet casual talk-b candidate v1

Status: **ACCEPTED PRODUCTION EXPRESSION SOURCE.** `talk-b.png` is the masked
composite over `casual-approved.png`; a fresh Art Director returned `PASS` on
2026-07-14. The globally repainted raw model output remains provenance only and
must never ship.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `talk-b-v1-raw.png` in 14.80
seconds. SHA-256:
`13d72bf334634d5a76dd156d980e1151c340dbe06d5cc359ec11c6d5de83d445`.
The request used 1,454 prompt tokens and 1,120 image-completion tokens and cost
`$0.067927`. Full safe provenance is recorded in `talk-b-v1.metadata.json`.

Preserved-pixel candidate: `talk-b.png`, SHA-256
`2da242a791e5607f827e15a39941dc2b9f3721df1f438359674bc5061b8d33b9`.
The mouth mask changed 5,031 pixels; every zero-mask pixel and the base alpha
plane remain byte-identical. Composite provenance is recorded in
`talk-b.composite.json`.

Input references, in order:

1. `art/characters/violet/canonical/casual-approved.png` — exact edit target and immutable canonical source

## Prompt

Use case: precise-object-edit and identity-preserve.
Asset type: aligned-canvas game character speaking-mouth layer source.

Perform one tiny localized edit to reference 1. Return the exact same
896-by-1200 full-body Violet on the exact same cyan canvas in the exact same
position. Change only her mouth so she is speaking a small rounded “oh” sound.

Replace the closed smile with a compact child-proportioned softly rounded mouth
at the exact existing mouth position. The lips form a gentle small vertical
oval with a warm dark interior and subtle dimensional upper and lower lip. No
teeth or tongue are visible. Keep a hint of friendly smile warmth in the lip
corners. The opening must read at gameplay scale without becoming a gasp,
surprised face, shout, song, pout, kiss, or adult lipstick shape.

Everything outside the small mouth and immediate lip interior is locked.
Preserve the exact canvas, cyan field, character silhouette, pose, body,
clothes, shoes, skin, face shape, chin, cheeks, nose, eyes, brows, glasses,
ears, hair, and wisps. Do not move the jaw, repaint the cheeks, change the nose,
add dimples, alter lighting, or change texture, color balance, brushwork,
proportions, anatomy, or framing.

Match the canonical opaque gouache and watercolor finish inside the mouth. No
teeth, tongue emphasis, lipstick, makeup, glossy vector lip, black hole, anime
mouth, text, prop, extra figure, watermark, or signature.
