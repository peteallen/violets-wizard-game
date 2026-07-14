# Hagrid reference-sheet provenance

This is a style target for the deterministic Canvas puppet and dialogue portrait. It is reference-only material and is never shipped by the game.

## Current accepted file

- Status: accepted after direct Storybook Standard review; no corrective iteration was needed
- Generated: 2026-07-13
- Workflow: Codex built-in image generation
- Use case: `stylized-concept`
- Model identifier: not returned by the built-in workflow
- Seed: not returned by the built-in workflow
- Requested format: landscape 16:9 character reference sheet
- Returned dimensions: 1672 × 940 PNG, 8-bit RGB
- Accepted file: `hagrid.png`
- SHA-256: `062d6c3a7b4c56fb6da84a51bca2e1985dc9d99ba403705f473b1918af2e20a7`
- Generation output ID: `exec-8f8a9802-e6ff-45e3-afe3-0c1241460d88.png`
- Generation output path: `/Users/peteallen/.codex/generated_images/019f5cfb-61ae-7ba2-a518-f105589f11f2/exec-8f8a9802-e6ff-45e3-afe3-0c1241460d88.png`
- Reference images: `../raw/ch1-leaky.png`, `../raw/ch1-malkins.png`, `../raw/ch1-menagerie.png`, `../raw/ch1-diagon-dusk.png`, and `violet.png`
- Acceptance note: the accepted sheet preserves one identity across the full-body and portrait views; reads immediately as an enormous, safe, weathered guide; keeps both hands and both boots fully readable; and matches the rooms' parchment, umber, forest-green, violet-shadow, candle-gold, painterly texture, and upper-left light. His face, coat construction, and palette are original rather than an actor or film-costume copy. The full-body anatomy is deliberately massive and twice-wide, but the sheet does not include a child or ruler, so the exact two-times gameplay scale remains a renderer requirement rather than a literal measurement visible inside this image.
- Runtime-fit note: D47 supersedes the final scale clause above. The accepted sheet remains the face, anatomy, material, and broad-silhouette target, while the live puppet must fit beneath each authored doorway he visibly uses; width, coat volume, boots, and posture carry the half-giant read without breaking room geometry.

## Reference roles

`ch1-leaky.png` anchors the Guide to his associated room's candlelit stone, old wood, umber materials, and cozy shadow. `ch1-malkins.png` anchors painted fabric folds and woven texture. `ch1-menagerie.png` anchors organic hand-shaped silhouettes, forest green, and lantern gold. `ch1-diagon-dusk.png` anchors deep blue-violet atmosphere, dark-brown linework, and warm highlights. `violet.png` is only the accepted two-view character-sheet construction and relative-scale reference; no part of Violet's identity or costume was requested for reuse.

## Generation prompt

```text
Use case: stylized-concept
Asset type: reference-only character design sheet for the deterministic Canvas puppet cast of the storybook game "Violet at Hogwarts"
Input images: Image 1 (ch1-leaky.png) is the Guide's associated-room reference for candlelit stone, ancient wood, umber materials, and cozy shadow; Image 2 (ch1-malkins.png) is a style reference for richly painted fabric folds, woven texture, and warm upper-left light; Image 3 (ch1-menagerie.png) is a style reference for organic hand-shaped silhouettes, deep forest green, and lantern gold; Image 4 (ch1-diagon-dusk.png) is a style reference for deep blue-violet atmosphere, soft dark-brown linework, and warm windows; Image 5 (violet.png) is a character-sheet construction and scale reference only. Match its two-view presentation and illustration fidelity, but do not copy Violet's identity, clothing, palette, or proportions, and do not include her.
Primary request: Paint one canonical character reference sheet for Hagrid, an original half-giant magical-school guide with kind, gruff Scottish warmth and gentle-giant energy. The exact same Hagrid appears twice: a front-facing full-body neutral pose on the left and a much larger face-and-shoulders close-up on the right. This sheet is a visual target for a code-drawn puppet, never a runtime sprite.
Subject and silhouette: Make him unmistakably enormous and broad: his intended in-game body is approximately twice Violet's full-body height and twice her width, with massive rounded shoulders, a barrel chest, huge relaxed hands, thick sturdy legs, and oversized worn boots. Preserve friendly picture-book proportions rather than realism; his body should feel powerful but soft and safe, never threatening. His face is an original design: middle-aged, broad and weathered, warm medium complexion, large characterful nose, warm hazel-brown irises, dark pupils and catchlights, shaped lids, heavy expressive brows, ruddy cheeks, and a crooked welcoming half-smile. Give him thick, unruly dark chestnut-brown hair and a magnificent layered beard built from large shaded locks with interior strand groupings; keep the eyes, cheeks, and mouth readable through the beard. His pose should feel patient and ready to beckon a child onward. Keep both enormous hands fully visible with believable fingers.
Wardrobe: An original, richly painted long field coat in weathered umber-brown with a dark forest-green waistcoat beneath, a muted plum woven neckerchief, roomy brown trousers, oversized patchworked leather boots, and hand-worked brass toggles. The coat has broad lapels, deep pockets, reinforced elbow patches, irregular hems, visible seams, fold bands, and soft wear. No hat, wand, umbrella, weapon, crest, school logo, or film-specific costume pieces.
Style/medium: premium children's storybook illustration in the exact painterly gouache-and-watercolor spirit of the room references and Violet sheet; richly detailed but uncluttered; soft edges, dry-brush texture, visible paper grain, organic asymmetry, and gently varying dark-brown contour accents. Original illustrated design only, not a film still, cosplay portrait, actor likeness, or flat vector art.
Composition/framing: landscape 16:9 reference sheet. Full body entirely visible from hair to boot soles on the left, standing on a faint soft painted ground wash. On the right, a materially more detailed close-up showing the identical face, hairline, hair color, beard construction, eye construction, brows, cheeks, nose, and expression. Give the enormous full-body silhouette generous breathing room without cropping. Simple irregular parchment-and-deep-night-blue painted wash only; no scenery, no ruler, no scale figure, and no panel borders.
Lighting/mood: one warm upper-left key light matching the rooms, with a softly baked candle-gold rim on his lit side, warm bounce in the beard and coat, and cooler violet-blue shadow on the opposite side. The emotional read is safe, dependable, slightly scruffy, and delighted to introduce a child to magic.
Color palette: aged parchment, candle gold, deep night blue, forest green, muted plum, chestnut hair, weathered umber leather, and warm skin; no pure black or pure white.
Materials/textures: every major form has base color, shadow, and highlight. Hair and beard have layered painted masses plus interior strands; coat and waistcoat have woven grain and fold bands; brass has a soft light sweep; leather boots have seams, patches, creases, and scuffs.
Anatomy/detail: real illustrated eyes with irises, pupils, catchlights, shaped upper and lower lids; thick asymmetrical eyebrows; cheek warmth; a dimensional nose; natural mouth; five readable fingers on each hand. Soft subtly varying dark-brown outlines and hand-painted wobble, with no perfect geometry.
Constraints: one adult half-giant shown in two consistent views, not two different characters. Preserve identical identity, complexion, hair and beard color, hairline, facial proportions, eye color, outfit, and materials between views. His giant scale and twice-wide silhouette must remain immediately legible even without another person in frame. No resemblance to any actor or real person; do not copy a film still, costume, pose, or promotional image. No text, labels, lettering, logos, watermark, signature, extra people, children, animals, props, scenery, decorative frame, flat fills, clip art, 3D render, anime styling, plastic skin, duplicate limbs, hidden hands, malformed fingers, cropped boots, or menacing expression.
```
