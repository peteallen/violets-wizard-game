# Chapter 3 corridor-three destination vignette — native v1

This is the exact accepted prompt supplied to Codex's built-in image-generation
workflow on July 17, 2026. The workflow did not return a model identifier,
provider route, or seed.

The returned PNG was copied byte-for-byte to the native source path before any
image processing. The accepted alpha PNG was produced with the installed
`remove_chroma_key.py` helper using border auto-keying, a soft matte,
transparent/opaque thresholds of 12/220, and despill. Transparent padding only
normalized the canvas to 1155×1375 without cropping or aspect distortion;
`cwebp` then encoded the 420×500 shipping asset at quality 88 and alpha quality
100.

The references were supplied in this order:

1. `public/assets/art/ui/satchel/destination-diagon-alley.webp`
2. `art/raw/ch2-great-hall-v4.png`

The first reference is the exact destination-card family and geometry anchor.
The second reference supplies only the magical-school stone, timber, candlelit
depth, arched architecture, and painterly finish.

## Accepted built-in prompt

Use case: stylized-concept.
Asset type: textless Chapter Three map destination vignette for a premium children's storybook adventure game.
Input images: Image 1 is the exact family and geometry reference. Match its single irregular warm-parchment destination card, slim aged-gold and dark-plum rim, portrait proportions, upper place-painting area, calm blank lower label band, tactile gouache-and-colored-pencil finish, and straight-on presentation. Image 2 supplies only the magical-school honey-stone, dark timber, arched architecture, warm candlelight, blue-violet depth, and premium painted texture; create an original intimate castle corridor rather than a dining hall.
Primary request: Create one new castle-corridor destination card in the exact visual family of Image 1. In the upper approximately 70 percent, paint a compact stone passage with exactly three separate readable features: one plain standing suit of armor with its visor fully closed and no emblem or weapon; one heavy floor-length burgundy curtain hanging against a solid wall; and one separate empty dark arched alcove clearly divided from the curtain by lit stonework. Do not hide the alcove behind the curtain and do not add duplicate props. The lower approximately 23 percent must be one completely blank, calm warm-parchment label band with no decoration that could be mistaken for a mark or character.
Scene/backdrop: Isolate the complete card on a perfectly flat, uniform solid `#00ff00` chroma-key background for deterministic local removal. The green field must have no floor plane, texture, gradient, glow, lighting variation, reflection, contact shadow, or cast shadow.
Composition/framing: One straight-on portrait card only, fully contained inside the image with generous but modest green margin on every side. Match Image 1's approximately 0.84-to-1 outer card width-to-height ratio exactly; the card must be broad like Image 1, never elongated or narrow, and it should occupy at least 80 percent of the generated canvas width. Keep the irregular outer silhouette and thin double rim clearly separated from the background. Preserve the same painting-to-label-band relationship as Image 1. Nothing may cross into the label band.
Style/medium: Rich hand-painted gouache and colored pencil on warm parchment, visible paper tooth, softly broken dark-brown contours, aged-gold edge detail, deep plum trim, warm upper-left light, and the dimensional storybook finish of the references. The miniature must remain legible at 420 by 500 pixels.
Color palette: Honey parchment, aged gold, dark blackberry plum, warm amber stone, plain aged steel, heavy burgundy cloth, dark oak, and restrained blue-violet shadow. Do not use chroma green anywhere in the card.
Constraints: exactly one plain closed-visor armor suit, exactly one heavy burgundy curtain, and exactly one separate empty dark alcove; no people, children, adults, faces, visible eyes, silhouettes, hands, characters, creatures, animals, birds, portraits, statues, heraldry, shields, weapons, extra armor, extra curtains, extra alcoves, text, letters, numbers, runes, routes, stars, checks, locks, logos, watermark, signature, state markers, clues, progress cues, interaction sparkles, `Here`, `Next`, copied film-set composition, or cropped card edges.
Avoid: an open visor, a person inside the armor, the curtain covering a doorway, secret-route imagery, modern software UI, flat vector art, cel shading, photorealism, 3D rendering, perfect rectangles, bulky borders, clutter in the label band, green fringe, background variation, and any shadow outside the card.
