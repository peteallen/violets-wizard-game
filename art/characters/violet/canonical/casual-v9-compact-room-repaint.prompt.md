# Violet casual canonical candidate v9: compact room-style repaint

Status: **REJECTED FOR DERIVATION BY OWNER SELECTION.** This compact repaint was
generated only because the automated anatomy process continued after V8. Pete
subsequently selected V8's exact pixels as the canonical Violet and directed
that canonical iteration stop. Preserve this file as provenance, but never use
it for production parts, expressions, poses, outfits, or lighting variants.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image, routed only to the
`google-vertex/global` provider. The provider is pinned because the faster
Google AI Studio endpoint returned JPEG despite the V8 PNG request; an accepted
source and every descendant need one lossless provider lineage.

Generated: 2026-07-14. OpenRouter returned
`casual-v9-compact-room-repaint-raw.png` in 16.74 seconds. SHA-256:
`314def7bb9065517bfbb8d895b968f8befc9b2f6a889f67988f19f915c68ff91`.
The request used 6,628 prompt tokens and 1,120 image-completion tokens and cost
`$0.070514`. Response metadata, request controls, hashed reference provenance,
and the safe response body without image bytes are recorded in
`casual-v9-compact-room-repaint.metadata.json`.

Input references, in order:

1. `casual-v8-compact-layout-guide.png` — exact compact character coordinates, body proportions, neutral pose, outfit geometry, identity placement, and cyan floor position; repaint its vertical compression artifacts and finish without changing any landmark
2. `art/character-refs/violet.png` — exact Violet identity, age, face construction, glasses, and deeper chestnut hair
3. `art/character-refs/hagrid.png` — dimensional character-paint material depth and broken contour handling only
4. `art/guides/ch1-room-style-triptych.webp` — the game's bright, warm, and dark room-painting hand and value range only
5. `art/guides/flat-cyan-chroma.png` — exact required background color and uniformity only

## Prompt

Use case: identity-preserve.
Asset type: canonical aligned-canvas game character master.

Repaint reference 1 as one finished canonical casual-clothes Violet while
obeying its compact layout exactly. Return ONE fully assembled, front-facing,
upright-neutral, full-body six-year-old centered on reference 5's perfectly
uniform solid `#00FFFF` cyan field. The background has no paper texture,
vignette, gradient, glow, light, floor, horizon, shadow, reflection, scenery,
decoration, or variation. Do not use cyan in the character and do not paint a
contact shadow.

REFERENCE 1 LOCKS EVERY CHARACTER LANDMARK. Keep its hair top near y=85, chin
near y=345, visible neck, level shoulders, sleeve ends, elbows, wrists, jersey
hem near y=605, hips, knees, ankles, and shoe soles near y=905 in the same
positions on the 896-by-1200 output. The entire figure remains approximately
3.2 to 3.35 of her own head heights with a large child head and short natural
body. Preserve its centered width, relaxed hands beside the outer thighs,
forward knees and ankles, and nearly forward planted shoes. The large empty
cyan band below the soles is intentional. Never lengthen the torso, arms,
thighs, or shins; never lower the shoes; never scale or shift the figure to fill
the canvas. Repair only the guide's vertically compressed paint and anatomy
into natural short child forms inside those fixed coordinates.

REFERENCE 2 LOCKS VIOLET'S ORIGINAL IDENTITY. Preserve the same softly oval
six-year-old face and natural lower-face width, warm medium-light skin,
warm-brown almond eyes at restrained child scale, small dimensional nose, rosy
cheeks, relaxed brows, and subtle capable closed smile. Keep the exact dark
olive-green HORIZONTALLY RECTANGULAR glasses, visibly wider than tall with
narrow corners. No square or round frames, bright green plastic, oversized
lenses, circular doll face, button nose, enormous symmetric eyes, glossy toy
pupils, heavy lashes, pointed chin, adult makeup, or generic nursery child.

Keep reference 2's deeper warm light-brown/chestnut hair, never blonde, gold,
caramel, or copper. Preserve the off-center side part, side-swept fringe,
slightly messy asymmetrical mass, deep chestnut interior values, restrained
warm highlights, and several short fine wisps visibly attached to the hair.
Hair stays mostly behind the shoulders so the neck, sleeves, elbows, and hands
remain readable. No tidy barrel curls, evenly spaced ribbons, bell silhouette,
repeated outward hooks, halo, floating arcs, or antennae.

Retain the ordinary pre-wizard sports outfit inside reference 1's exact shape:
saturated blue-violet jersey body, bright white V collar, close-fitting
lighter-violet short raglan sleeves, clearly deeper-violet side panels,
charcoal-plum leggings, and practical slate trainers with one visible purple
accent on each. Both hands keep correct inward-facing thumbs and naturally
grouped fingers. No robe, cape, crest, number, logo, text, puff sleeve, dress,
tunic, jewelry, prop, or wand.

REFERENCES 3 AND 4 LOCK THE PAINTED FINISH. Paint Violet as if the same artist
painted her directly into those storybook rooms: dimensional opaque gouache and
watercolor, layered scumbling, brush-shaped value planes, matte skin, weighty
cloth, deep broad hair masses, irregular pigment density, and varied edge
hardness. Contours come from adjoining painted values and colors, not ink. Let
outer and interior edges soften, break, and disappear where values meet;
reserve small firm accents for the eyes, glasses bridge, collar, fingertips,
laces, and soles. Match Hagrid's material depth at a child-appropriate scale.
Do not draw continuous dark lines around hair locks, face, jersey panels,
limbs, hands, leggings, or shoes. No uniform texture overlay, cel shading,
sticker outline, clip art, polished airbrush, glossy 3D, anime, vector geometry,
or photorealism.

Use neutral master illumination: broad soft ambient form modeling, full
midtones, and restrained cool-brown occlusion. No directional sun, golden
image-left rim, halo, edge stripe, cast shadow, or high-key glow. Later
same-model edits will create independent left-key and right-key room variants.

Return only the single compact Violet on reference 5's exact flat cyan field.
No second view, portrait inset, parts sheet, label, border, room object, extra
person, watermark, or signature.
