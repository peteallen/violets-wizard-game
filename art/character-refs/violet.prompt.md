# Violet reference-sheet provenance

This is a style target only; it is not shipped by the game.

## Accepted candidate metadata

- Status: accepted after corrected-hair side-by-side review
- Generated: 2026-07-13
- Workflow: Codex built-in image generation
- Model identifier: not returned by the built-in workflow
- Seed: not returned
- Requested format: landscape 16:9 character reference sheet
- Returned dimensions: 1672 × 940 PNG
- Accepted file: `violet.png`
- SHA-256: `c3c9b18e9833fcb6eb30db89b4cb6c7d4cb8569f6ee95baad838b37b3ae244d2`
- Generation output: `exec-7918a43f-4868-4866-96cd-d402e3980029.png`
- Base candidate output: `exec-93894d87-3824-443d-8d47-7b2239d924b0.png`
- Reference images: `../raw/ch1-malkins.png`, `../raw/ch1-menagerie.png`, `../raw/ch1-diagon-dusk.png`, `../raw/ch1-bedroom.png`
- Selection note: the base candidate passed identity, age, clothing, palette, form, lighting, texture, and squint checks, but its long isolated crown arcs could still read as antennae. Candidate v2 keeps the accepted design and replaces those arcs with shorter hair-attached wisps. A second independent review confirmed that the blocker is resolved and found no new identity or Storybook Standard regression.

## Base generation prompt

```text
Use case: stylized-concept
Asset type: reference-only character design sheet for the storybook game "Violet at Hogwarts"
Input images: Image 1 (ch1-malkins.png): style reference for painterly fabrics, robe folds, warm wood, violet and gold materials; Image 2 (ch1-menagerie.png): style reference for organic shapes, rich painted texture, and warm lantern light; Image 3 (ch1-diagon-dusk.png): style reference for deep blue-violet atmosphere, soft dark-brown linework, and glowing gold accents; Image 4 (ch1-bedroom.png): style and palette reference for Violet's personal warm violet-and-gold world. These are style references only, not edit targets; do not copy their room layouts or objects.
Primary request: Paint one canonical character reference sheet for Violet, an original six-year-old first-year witch. The exact same Violet appears twice: a front-facing full-body neutral pose on the left and a much larger face-and-shoulders close-up on the right.
Subject: Violet has age-appropriate child proportions, a warm medium-light complexion, warm brown eyes, rosy cheeks, and long light-brown hair built from soft shaded masses. Her hair is naturally a little messy with only three or four irregular, gentle side and crown wisps; never spikes, horns, antennae, or symmetrical feelers. She wears a richly painted black first-year school robe with visible deep-purple lining at the collar and cuffs, subtle purple trim, layered fabric folds, and practical purple sneakers. Her expression is bright, capable, curious, and delighted by real magic, not babyish. Keep her hands relaxed and fully visible. Do not add a wand or hat.
Style/medium: premium children's storybook illustration in the exact painterly gouache-and-watercolor spirit of the four room references; richly detailed but uncluttered; soft edges and gentle paper texture; original illustrated character, not a film still and not flat vector art.
Composition/framing: landscape 16:9 reference sheet. Full body entirely visible from hair to shoe soles on the left, standing on a faint soft painted ground wash. On the right, a materially more detailed close-up showing the same facial proportions, hair construction, eyes, lids, eyebrows, blush, nose, and expression. Clear breathing space between views. Simple irregular parchment-and-deep-night-blue painted wash only; no scenery and no panel borders.
Lighting/mood: one warm upper-left key light matching the rooms, with a softly baked golden rim on the lit side and cooler violet-blue shadow on the opposite side.
Color palette: parchment, candle gold, deep violet, warm brown, charcoal-black robe; no pure black or pure white.
Materials/textures: every major form has base color, shadow, and highlight; hair has interior strand groupings; robe has fold bands, collar and cuff construction, subtle woven texture; sneakers have painted seams and soft wear.
Anatomy/detail: real illustrated eyes with warm-brown irises, dark pupils, two small catchlights, shaped upper and lower lids, lashes appropriate for a child, softly expressive eyebrows, cheek warmth, a small dimensional nose, and an expressive natural mouth. Soft subtly varying dark-brown outlines, hand-painted asymmetry, no perfect geometry.
Constraints: this is one child shown in two consistent views, not two different characters. Preserve identical face, complexion, hair color, hairline, eye color, outfit, and proportions between views. Original design only; no resemblance to any existing actor or real child; no copyrighted crest or logo; no text, labels, lettering, watermark, signature, extra people, animals, props, scenery, decorative frame, flat fills, clip art, 3D render, anime styling, doll-like plastic skin, bug-antenna hair, or malformed hands.
```

## Targeted hair correction prompt

```text
Use case: precise-object-edit
Asset type: reference-only character design sheet for the storybook game "Violet at Hogwarts"
Input images: Image 1 (violet-v1.png) is the edit target.
Primary request: Change only Violet's flyaway hair treatment in both views. Remove the long, thin, isolated arcs that hover above the crown and can read as antennae or wire. Replace them with only three or four short, irregular, soft wisps that begin visibly inside or at the edge of the shaded hair mass and curve naturally back toward it. The wisps must remain clearly connected to real hair and must not rise far above the head.
Invariants: Preserve the exact same child identity, face, expression, age, complexion, eye construction, eyebrows, blush, nose, mouth, hair color, hair length, main hair silhouette, robe, purple lining and trim, shirt, tie, sneakers, hands, pose, two-view composition, scale, parchment-and-deep-blue wash, brushwork, paper texture, warm upper-left lighting, shadows, highlights, colors, and framing. Keep the full-body view entirely visible and the close-up materially detailed. Do not redesign or beautify any other element.
Constraints: one child shown in two consistent views; no new props, text, labels, logos, crest, watermark, signature, scenery, borders, hat, wand, extra people, animals, extra hair ornaments, floating strands, symmetrical feelers, horns, spikes, antennae, malformed hands, or actor resemblance.
```
