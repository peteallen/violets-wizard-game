# Chapter 2 frog-card portraits

Merlin and Jocunda Sykes were generated on July 16, 2026 through OpenRouter
`POST /images` with model `google/gemini-3.1-flash-lite-image`, canonical lineage
`google/gemini-3.1-flash-lite-image-20260630`, and the pinned
`google-vertex/global` provider. Both requests are text-only and record a
reference count of zero; no local character, card, or style image was uploaded.

The live endpoint returned one 1024×1024 JPEG source for each portrait even
though PNG was requested. The exact response bytes are preserved as the
`*-native.jpg` files under `art/raw`. Each accepted source was resized once to
the existing card-art contract of 1254×1254 with `sips` and encoded as a
quality-84 sharp-YUV WebP with `cwebp`. The dedicated endpoint did not advertise
a seed control, so no seed was sent or claimed. `generate.mjs` reproduces the
catalog checks, one-candidate requests, validation, conversion, and provenance
records without embedding credentials.

| Card | Accepted source | Shipping WebP | Provenance |
|---|---|---|---|
| Merlin | `art/raw/ch2-card-merlin.png` | `public/assets/art/cards/merlin.webp` | `merlin.metadata.json` |
| Jocunda Sykes | `art/raw/ch2-card-jocunda-sykes.png` | `public/assets/art/cards/jocunda-sykes.webp` | `jocunda-sykes.metadata.json` |

Both first candidates were inspected once at delivery resolution and accepted
without regeneration. They are isolated, original head-and-shoulders storybook
portraits with readable faces, complete hair and shoulders, no readable text,
no card border or decorative frame, no extra figure, and enough breathing room
for the game's own oval crop and card furniture. The response-reported total
cost for the two generations was $0.0674675.
