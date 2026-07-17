# Chapter 2 Great Hall v3 corrective edit

Status: final corrective pass. The first two candidates were rejected because
the model added carved creature figures despite the background constraint.

Model: `google/gemini-3.1-flash-lite-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested delivery: one 16:9 room painting at 2048×1152. The live Lite endpoint
currently produces a native 1K source, which is center-cropped and resized once
to the exact delivery dimensions before WebP optimization.

Input Image 1: `art/raw/ch2-great-hall-v2-native.jpg`, used only as the room
painting to correct while preserving its composition and visual identity.

## Prompt

Children's storybook illustration, painterly gouache and watercolor, soft edges and gentle texture, warm candlelit golds against deep night blues, cozy magical atmosphere, richly detailed but uncluttered, straight-on side view like a theater stage set, floor plane along the bottom quarter of the frame, no people, no creatures, no text or lettering.

Use case: precise-object-edit. Asset type: final full-screen gameplay room painting for Violet's welcome, Sorting, and first feast. Input Image 1 is the edit target.

Preserve Input Image 1's exact 16:9 camera, architecture, perspective, enchanted blue star ceiling, floating candles, long tables, empty golden place settings, central aisle, staff dais, left doorway, plain three-legged stool, warm candlelight, blue-violet shadows, painterly texture, and empty floor. Change only the figurative stone decorations on the walls.

Remove every winged gargoyle, bird, carved creature, creature-shaped candle bracket, relief, head, face, and figurative emblem from every wall and column. Replace each one with a small plain rectangular stone corbel or simple nonfigurative brass shelf matching the surrounding light and perspective. The replacements must be ordinary geometric architecture with straight block edges: no wings, beaks, eyes, heads, paws, tails, bodies, silhouettes, or animal-like curves. Leave the wall above the far-right fireplace plain. Leave every other part of the image unchanged.

No new objects, people, silhouettes, animals, birds, ghosts, portraits, statues, figures, figurative carvings, hats, banners, heraldry, letters, numbers, logos, watermark, signature, copied movie details, photorealism, 3D rendering, flat vector art, or interaction effects. Return only the corrected room painting with no border, caption, comparison panel, or before-and-after layout.
