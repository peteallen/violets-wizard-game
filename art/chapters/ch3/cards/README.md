# Chapter Three collectible-card portraits

Circe and Bertie Bott were generated on July 17, 2026 with Codex's built-in image-generation workflow. Each used the stable accepted PNGs `art/raw/ch2-card-merlin.png` and `art/raw/ch2-card-jocunda-sykes.png` only as finish, portrait-scale, breathing-room, and oval-crop references. Both prompts begin with the established locked card prefix and then describe original character interpretations rather than adaptation designs. The built-in workflow returned no model identifier, provider route, seed, or billable-usage record, so the request and metadata records do not invent them.

| Portrait | Prompt and request | Untouched native source | Accepted PNG | Shipping WebP | Metadata |
|---|---|---|---|---|---|
| Circe | `circe-native-v1.prompt.md`, `circe-native-v1.request.json` | `art/raw/ch3-card-circe-native-v1.png` | `art/raw/ch3-card-circe-v1.png` | `public/assets/art/cards/circe.webp` | `circe-native-v1.metadata.json` |
| Bertie Bott | `bertie-bott-native-v1.prompt.md`, `bertie-bott-native-v1.request.json` | `art/raw/ch3-card-bertie-bott-native-v1.png` | `art/raw/ch3-card-bertie-bott-v1.png` | `public/assets/art/cards/bertie-bott.webp` | `bertie-bott-native-v1.metadata.json` |

The built-in workflow returned both portraits at the exact 1254×1254 card-art contract. Each untouched native PNG was therefore copied byte-for-byte to its accepted PNG, then encoded with `cwebp -q 84 -m 6 -sharp_yuv`. Source inspection accepted both first candidates: each is an original, isolated, readable head-and-shoulders storybook portrait with complete hair and shoulders, generous oval-crop breathing room, no extra figure, no readable text, and no card frame or border. Shipping inspection at 1254×1254 confirmed that the WebPs preserve the painted texture, facial readability, crop safety, and clean frameless edges without visible conversion defects.
