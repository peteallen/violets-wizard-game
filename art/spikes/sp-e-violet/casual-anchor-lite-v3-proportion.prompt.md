# Casual Violet Lite edit v3: child proportion only

Status: atomic image-edit candidate only. Do not use as a sprite source until
the independent Art Director review required by `docs/ART_DIRECTOR.md` passes.

Model: `google/gemini-3.1-flash-lite-image`

Input reference: `casual-anchor-gemini-v2-edit-raw.png`, the edit target.

Requested output: 3:4, 1K, PNG, one image.

Generated: 2026-07-14. OpenRouter returned a JPEG in 5.31 seconds as
`casual-anchor-lite-v3-proportion-raw.jpg`. SHA-256:
`e78bfb4fead1b6f73653f1d66465b99abe4e03aad029a95ed5d2d91018b22bd8`.
The request used 1,428 prompt tokens and 1,120 image-completion tokens and cost
`$0.033957`. Response metadata without credentials or image bytes is recorded
in `casual-anchor-lite-v3-proportion.metadata.json`. The edit preserved identity
and outfit well but only modestly shortened the figure; it is still an
unaccepted experiment and has not been sliced or shipped.

## Prompt

Make exactly ONE structural edit to this supplied character painting: change
the girl's proportions from an older long-legged child to a compact six-year-old
storybook child measuring approximately three and one quarter of her own head
heights from the highest hair to the shoe soles. Keep the head and face at
exactly their current size, shape, position, expression, and identity. Shorten
the torso slightly and shorten both legs substantially; move the hips, hands,
knees, ankles, shoes, and parchment ground upward as needed so the resulting
body remains anatomically connected, balanced, and naturally proportioned.
Keep the shoulders level, the visible neck, elbows near the waist, wrists near
the hips, and fingertips near the upper-to-middle thighs.

Preserve everything else exactly: the same single centered front-facing Violet,
same dark-green rectangular glasses, same eyes and smile, same warm light-brown
hair and every hair lock, same blue-violet soccer jersey and white V collar,
same purple athletic sleeves, same dark plum leggings, same trainers, same hand
poses, same nearly neutral stance, same gouache-and-watercolor rendering, same
paper texture, same colors, same lighting, same outlines, same 3:4 framing, and
same warm parchment background. Do not redesign, beautify, add, remove, or alter
any other feature. No text, labels, props, extra views, extra characters, or
cropping.
