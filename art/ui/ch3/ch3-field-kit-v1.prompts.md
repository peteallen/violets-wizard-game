# Chapter Three Field Kit v1 production prompts

These are the exact prompts supplied to Codex built-in image generation on July
17, 2026. For all six outputs, the original request prompt and the
`image_generation_end` revised prompt in the source session are byte-identical.
The built-in workflow did not return a model identifier, provider route, or
seed. Runtime code owns all text, glyphs, spell colors, interaction state, and
save-dependent content.

Source session:
`/Users/peteallen/.codex/sessions/2026/07/17/rollout-2026-07-17T03-55-56-019f6f81-0cc0-7252-a86a-57b089c9e468.jsonl`

## Spellbook spread

Original reference supplied: `/Users/peteallen/work/violets-wizard-game/art/ui/satchel/source/spread-v2.png`

```text
Use case: precise-object-edit
Asset type: full-screen production spellbook spread for Violet's Wizard Game Chapter 3
Input images: Image 1 is the game's existing open satchel folio and exact material/style reference; it is the edit target for a new non-destructive sibling asset.
Primary request: Transform Image 1 into Violet's personal magical spellbook while preserving its wide 16:9 overhead composition, hand-painted material quality, large blank live-content apertures, and practical edge clearances. Change the surrounding satchel folio into a distinct bound spellbook resting on deep velvet.
Subject: a fully open two-page spellbook with warm thick deckled parchment, a hand-sewn central binding, deep blackberry-plum leather cover visible around the edges, slightly irregular honey-gold stitching, softly worn brass corner furniture with subtle original owl-feather curves but no literal readable emblem, and one small dark-green glass cabochon near the lower spine. Remove the upper-left lantern. Keep both pages nearly empty, with only faint hand-painted paper grain and extremely subtle unlettered border washes; all spell names, icons, slots, controls, and state will be drawn live by code.
Style/medium: preserve Image 1's premium children's storybook opaque gouache/watercolor, visible paper tooth, leather grain, organic asymmetry, varied dark-brown contours, warm upper-left light, cool violet shadows.
Composition/framing: centered open book filling the 16:9 frame; two generous calm page rectangles; edges and gutter clear enough for live interface; no perspective distortion that would make text hard to place.
Lighting/mood: intimate candle-gold study light over velvet night-blue and plum.
Color palette: parchment #f0e3c8, blackberry plum leather, aged brass gold, twilight violet, tiny dark-green accent.
Constraints: change only the housing, surface dressing, and removal of the lantern; preserve the two-page layout and blank usability. No text, letters, numbers, runes, spell icons, labels, portraits, buttons, hands, people, creatures, logos, watermark, pure black, or pure white.
Avoid: copying the satchel identity, rolled scrolls, perfect vector symmetry, photoreal product photography, 3D render, flat UI mockup, excessive ornament, baked gameplay state.
```

## Card shell

Original reference supplied: `/Users/peteallen/work/violets-wizard-game/art/ui/satchel/source/card-frame-v2-chroma.png`

```text
Use case: style-transfer
Asset type: transparent production game UI component, unselected spell card shell
Input images: Image 1 is the game's painted leather/parchment card-frame style and chroma-background reference, not a literal layout to copy.
Primary request: Create one textless vertical spell-card shell for Violet's Wizard Game, centered alone on a perfectly flat uniform #00ff00 chroma-key background for local extraction.
Subject: a hand-cut warm parchment card mounted on a thin blackberry-plum leather backing. The card has one large calm upper aperture for a live quill-drawn spell icon, one broad calm lower parchment aperture for a one-word live spell name, and a small blank round wax-seal mount at bottom center for live signature color. Use organically deckled edges, honey-gold stitching, two small aged-brass corner tabs, and restrained quill-feather embossing that never resembles writing. This is the normal unselected state: quiet, inviting, and tactile with no enchanted gold activation glow.
Style/medium: premium children's storybook opaque gouache and watercolor, visible paper tooth and leather grain, organic asymmetry, soft dark-brown contours with varied weight, warm upper-left light, cool violet shadows; same material family as Image 1.
Composition/framing: single 3:4-ish vertical card, front-facing with only a tiny handmade skew, generous green margin on all sides, strong silhouette, fully visible corners; large blank central apertures sized for live runtime content.
Lighting/mood: warm study-light craftsmanship, calm and usable.
Constraints: perfectly flat solid #00ff00 background with no shadow, gradient, texture, floor, reflection, or lighting variation. Do not use #00ff00 anywhere in the component. No text, letters, numbers, runes, icon, portrait, spell color, focus ring, selection glow, logo, watermark, cast shadow, contact shadow, or extra objects. No pure black or pure white.
Avoid: rolled scroll, satchel pocket, perfect rectangle, flat vector UI, 3D render, plastic bevels, metallic fantasy-game HUD, excessive ornament.
```

## Selected card shell

Original reference supplied: `/Users/peteallen/.codex/generated_images/019f6f81-0cc0-7252-a86a-57b089c9e468/exec-626e67a1-b6fd-4955-92e9-123931072dbd.png`

```text
Use case: precise-object-edit
Asset type: transparent production game UI component, selected spell card shell
Input images: Image 1 is the exact unselected spell-card shell and edit target.
Primary request: Create the selected-state sibling of Image 1. Preserve the exact card silhouette, dimensions, material family, blank icon aperture, blank name aperture, seal mount, background color, camera, and lighting. Change only the physical selected-state treatment.
Subject/state change: make the card look gently seated into the open spellbook by adding a narrow hand-stitched dark-plum inset just inside the leather border, a subtle violet pressed crease around the parchment, and two tiny dark-green thread accents near the lower corners. Slightly deepen the lower-right contact shading on the card itself, but do not add a cast shadow onto the background. Selection must read through plum/violet inset and stitching, never through enchanted gold.
Style/medium: preserve the same premium children's storybook gouache/watercolor, paper tooth, leather grain, organic deckled edges, brass tabs, warm upper-left light, and cool violet shadows.
Composition/framing: preserve exact front-facing vertical geometry and generous uniform green margin.
Constraints: change only selected-state stitching/inset/pressed material cues. Keep the perfectly flat uniform #00ff00 background unchanged with no shadow, gradient, texture, or reflection. Do not use #00ff00 in the component. No gold activation glow, white halo, focus ring, text, letters, numbers, runes, icon, portrait, spell color, logo, watermark, extra objects, pure black, or pure white.
Avoid: geometry drift, resized apertures, new ornaments, luminous magic, flat vector UI, 3D render, plastic bevel.
```

## Incantation ribbon

Original reference supplied: `/Users/peteallen/work/violets-wizard-game/art/ui/story-surfaces/source/action-note-v2-chroma.png`

```text
Use case: style-transfer
Asset type: transparent production game UI component, incantation ribbon
Input images: Image 1 is the game's painted parchment/leather action-note material and exact chroma-background reference, not a literal shape to copy.
Primary request: Create one long horizontal textless incantation ribbon for Violet's Wizard Game, centered alone on a perfectly flat uniform #00ff00 chroma-key background for local extraction.
Subject: a single gently unfurled strip of thick warm parchment, held at both ends by small blackberry-plum leather tabs with honey stitching and tiny aged-brass studs. The center is a large calm blank ribbon aperture for live rune slots and syllable tiles. Its upper and lower edges are subtly deckled and bowed by hand; the ends make short soft curls without becoming a rolled scroll. Include restrained unlettered quill-feather embossing only in the outer tabs.
Style/medium: premium children's storybook opaque gouache and watercolor, visible paper tooth, leather grain, organic asymmetry, soft dark-brown contours with varied weight, warm upper-left light, violet shadows; exact same field-kit material family as Image 1.
Composition/framing: one wide low component, roughly 5:1, front-facing, generous green margin on all sides, crisp complete silhouette, blank center occupying at least 75 percent of the width and 60 percent of the height.
Lighting/mood: warm crafted magical-study object, quiet until live spell color appears.
Constraints: perfectly flat solid #00ff00 background with no shadow, gradient, texture, floor, reflection, or lighting variation. Do not use #00ff00 in the component. No text, letters, numbers, runes, fixed slots, icons, labels, glow, spell color, focus ring, logo, watermark, cast shadow, contact shadow, or extra objects. No pure black or pure white.
Avoid: rolled scroll anatomy, perfect vector rectangle, modern banner, 3D render, plastic bevel, metallic HUD, excessive gold, baked gameplay state.
```

## Rune tile

Original reference supplied: `/Users/peteallen/work/violets-wizard-game/art/ui/satchel/source/card-frame-v2-chroma.png`

```text
Use case: style-transfer
Asset type: transparent production game UI component, textless rune tile
Input images: Image 1 is the game's painted field-kit material and chroma-background reference; use its hand-painted finish and palette without copying its card shape.
Primary request: Create one large textless stone rune tile for the Lumos learning performance, centered alone on a perfectly flat uniform #00ff00 chroma-key background for local extraction.
Subject: one palm-sized, softly irregular square of warm grey-violet castle stone with clipped organic corners, a shallow recessed central face deliberately left completely blank for one live runtime letter, a thin imperfect gold-leaf channel around that recess, and a small blackberry-plum leather loop peeking from the top edge. The tile must have a strong readable silhouette and tactile edge thickness, with one small chip and subtle mineral grain. No symbol is carved or painted.
Style/medium: premium children's storybook opaque gouache and watercolor, visible paper tooth and stone granulation, organic asymmetry, soft dark-brown contours with varied weight, warm upper-left gold light, cool violet-blue shadows; same handcrafted family as Image 1.
Composition/framing: single nearly-square tile, straight-on with a slight top-face view, generous uniform green margin, fully visible edges and loop, blank center taking at least 60 percent of tile width and height.
Lighting/mood: cozy magical classroom object, substantial and friendly rather than ancient or ominous.
Color palette: warm stone #8a7a66, twilight violet shadow #3a2d5e, aged honey gold, blackberry-plum leather.
Constraints: perfectly flat solid #00ff00 background with no shadow, gradient, texture, floor, reflection, or lighting variation. Do not use #00ff00 in the tile. No text, letter, number, rune, icon, glyph, face, glow, spell color, focus ring, logo, watermark, cast shadow, contact shadow, or extra object. No pure black or pure white.
Avoid: literal rune marks, harsh black outline, perfect geometric square, photoreal rock, 3D render, flat vector UI, plastic bevel, metallic fantasy-game icon, scary cracked stone.
```

## Chant tile

Original reference supplied: `/Users/peteallen/work/violets-wizard-game/art/ui/story-surfaces/source/action-note-v2-chroma.png`

```text
Use case: style-transfer
Asset type: transparent production game UI component, textless chant tile
Input images: Image 1 is the game's painted parchment/leather field-kit and chroma-background reference; use its material language without copying the long note shape.
Primary request: Create one compact textless chant tile for the Wingardium Leviosa rhythm performance, centered alone on a perfectly flat uniform #00ff00 chroma-key background for local extraction.
Subject: one small hand-cut parchment lozenge mounted on a thin warm-oak backing, wider than tall, with softly notched organic corners, a generous completely blank center for one live syllable, a narrow blackberry-plum stitched edge, and one tiny aged-brass feather-shaped clasp at the top. Make it light and buoyant in visual weight, distinctly different from the heavy stone rune tile. No actual feather, symbol, or lettering is painted in the center.
Style/medium: premium children's storybook opaque gouache and watercolor, visible paper tooth, wood grain, leather stitching, organic asymmetry, soft dark-brown contours with varied weight, warm upper-left gold light, cool violet shadows; same handcrafted family as Image 1.
Composition/framing: single 3:2 horizontal tile, front-facing with a minute handmade tilt, generous uniform green margin, crisp complete silhouette, blank center taking at least 65 percent of width and 55 percent of height.
Lighting/mood: playful, musical, warm classroom craft object.
Color palette: parchment #f0e3c8, aged oak #5e4634, blackberry-plum leather, aged honey brass.
Constraints: perfectly flat solid #00ff00 background with no shadow, gradient, texture, floor, reflection, or lighting variation. Do not use #00ff00 in the tile. No text, letter, number, syllable, rune, icon, glyph, portrait, glow, spell color, focus ring, logo, watermark, cast shadow, contact shadow, or extra object. No pure black or pure white.
Avoid: stone slab, square rune tile, rolled scroll, perfect vector rectangle, photoreal product object, 3D render, plastic bevel, metallic fantasy-game HUD, excessive ornament.
```
