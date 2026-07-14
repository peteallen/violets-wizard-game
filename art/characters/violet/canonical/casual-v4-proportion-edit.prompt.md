# Violet casual canonical candidate v4: lower-body correction

Status: discarded before formal review or derivation. Gemini repainted 96.4%
of the canvas but retained essentially the same lower-body geometry, confirming
that prompt-only editing is not a pixel-preserving structural correction.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned
`casual-v4-proportion-edit-raw.png` in 13.01 seconds. SHA-256:
`c5968c5753e4dc973e73300367f0c96a0b44c77f327d370326c2bcb8b20e4384`.
The request used 2,697 prompt tokens and 1,120 image-completion tokens and cost
`$0.0685485`. Response metadata without credentials or image bytes is recorded
in `casual-v4-proportion-edit.metadata.json`.

Input references, in order:

1. `casual-v2-raw.png` — the edit target whose upper character and painted treatment are locked
2. `art/guides/character-neutral-child-proportion-guide-compact.png` — the required compact pelvis-to-floor construction and frontal foot axes

## Prompt

Perform one surgical structural correction to reference 1 while preserving its
exact Violet identity and painting. Return the same single front-facing full
body on the same 3:4 parchment canvas. The entire image ABOVE THE BOTTOM EDGE OF
THE JERSEY is locked: preserve the exact head size and position, face, eyes,
glasses, nose, smile, hair silhouette and strands, visible neck, shoulders,
short sleeves, arms, hands, jersey shape, jersey colors, brush texture,
directional lighting, outlines, parchment wash, and canvas framing. Do not
repaint, redesign, shift, scale, crop, or beautify any locked upper-body pixel.

Change only the connected lower body beginning under the jersey hem. Keep the
pelvis and top of both leggings attached at the exact current hem position, then
SHORTEN THE PELVIS-TO-SOLE DISTANCE BY TWENTY-EIGHT PERCENT. Compress the thighs,
shins, and ankle spacing into anatomically plausible compact six-year-old legs,
following reference 2. Lift both shoe soles and their warm violet-brown contact
wash upward by approximately 120 pixels within the 1200-pixel-tall target so the
complete figure measures about 3.2 of her own head heights from hair top to
sole. Preserve the charcoal-plum legging colors and painted folds while adapting
them to the shorter limbs. Do not move the jersey hem or lengthen the torso.

Correct both foot axes as part of this same lower-body construction. Paint both
trainers nearly straight-on from the front, directly beneath their own knees
and ankles. Show both full toe caps and laces frontally, with matching shoe size
and less than five degrees of toe divergence. Both soles meet the same floor
line. Preserve their slate colors, seams, and small purple accents. No
three-quarter or side-profile shoe, duck foot, twisted ankle, crossed leg,
tiptoe, floating sole, or oversized footwear.

Everything else remains exactly reference 1. Do not add text, labels, props,
extra views, extra people, new clothing, long sleeves, scenery, borders, or
decorations.
