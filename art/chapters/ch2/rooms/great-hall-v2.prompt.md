# Chapter 2 Great Hall v2

Status: accepted corrective candidate. The first candidate was rejected because
the model added carved creature figures despite the background constraint.

Model: `google/gemini-3.1-flash-lite-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested delivery: one 16:9 room painting at 2048×1152. The live Lite endpoint
currently produces a native 1K source, which is center-cropped and resized once
to the exact delivery dimensions before WebP optimization.

## Prompt

Children's storybook illustration, painterly gouache and watercolor, soft edges and gentle texture, warm candlelit golds against deep night blues, cozy magical atmosphere, richly detailed but uncluttered, straight-on side view like a theater stage set, floor plane along the bottom quarter of the frame, no people, no creatures, no text or lettering.

Use case: illustration-story. Asset type: full-screen gameplay room painting for Violet's welcome, Sorting, and first feast.

Paint an original immense magical-school dining hall at night, staged broadside so it remains playable as one room. Soaring plain warm-stone arches and tall dark windows frame a deep blue enchanted ceiling that suggests a clear starry sky through loose watercolor speckles. Hundreds of floating ivory candles create layered honey-gold light without forming letters or symbols. Long aged-oak dining tables with simple empty golden place settings recede along the left and middle, while a generous central aisle leads toward a shallow staff dais across the back-right. Keep that dais visually calm for separately rendered teachers. At the center of the playable foreground, place one plain empty three-legged wooden stool beneath a soft pool of candlelight; do not put a hat or cushion on it. Near the far left, preserve a clear dark doorway and walking route for the later exit.

Every wall, column, arch bracket, fireplace, and torch support must be simple nonfigurative architecture. Use only plain stone blocks, restrained leafless geometric tracery, rectangles, diamonds, and soft painted wear. Absolutely no gargoyles, grotesques, statues, carved heads, wings, birds, animals, creature silhouettes, heraldic figures, murals, portraits, or emblems anywhere in the room, even as tiny decoration. Keep every visible wall surface free of figurative imagery.

Keep the bottom quarter as a broad uncluttered flagstone floor that can hold Violet, the Sorting Hat character, classmates, and dialogue portraits. Use an authored warm upper-left key light, candle-gold highlights on wood and stone, deep navy and twilight-violet recesses, visible paper tooth, layered gouache, softened dark-brown contours, and gentle asymmetry. House color should be restrained and neutral in this base painting: muted parchment, deep blue, aged wood, and warm gold, leaving any celebratory scarlet-and-gold reveal to separate runtime layers. The hall should feel ceremonious, wondrous, and kind rather than intimidating.

No students, teachers, faces, silhouettes, hands, animals, birds, ghosts, portraits, statues, sculpted figures, figurative carvings, hats, food piles, readable banners, heraldry, letters, numbers, logos, watermark, signature, copied movie architecture, copied film composition, photorealism, 3D rendering, flat vector art, pure black, horror gloom, harsh spotlight, or clutter across the foreground aisle. Do not paint interaction sparkles, cheering effects, or a Gryffindor reveal.
