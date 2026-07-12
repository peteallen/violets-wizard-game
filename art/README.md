# Chapter 1 art source log

The paintings in `art/raw` were generated through Codex’s image-generation workflow on July 12, 2026, then visually reviewed before being converted to the smaller WebP files shipped from `public/assets/art`. They are original production assets for Violet’s private game. The prompts asked for warm, hand-painted children’s storybook scenes, clear touch-friendly landmarks, a consistent violet-and-gold palette, and no text, logos, existing actors, or copied film compositions.

This file records the production briefs and source relationships that matter for future regeneration. It does not claim a provider-specific random seed or hidden generation metadata that was not returned with the images.

| Raw source | Shipped purpose | Production brief and continuity constraint |
|---|---|---|
| `ch1-bedroom.png` | Violet’s opening bedroom | A sunlit, cozy wooden bedroom with violet fabrics, a large owl-friendly window, generous floor space for walking, and obvious letter-delivery staging. |
| `ch1-leaky.png` | The Leaky Cauldron | A welcoming old inn interior with warm timber, amber light, readable depth, and a clear route toward the rear courtyard. |
| `ch1-courtyard.png` | Brick-wall set piece | A secluded brick courtyard with an uninterrupted central wall large enough for the opening animation and safe margins for Violet and the guide. |
| `ch1-diagon-day.png` | Diagon Alley shopping street | A single-screen magical shopping street with three visually distinct storefront destinations and a broad, uncluttered walking lane. |
| `ch1-diagon-dusk.png` | Post-shopping Diagon Alley | A constrained edit of `ch1-diagon-day.png` that preserves the architecture and camera exactly while changing only the light and atmosphere to dusk. |
| `ch1-ollivanders.png` | Wand shop | A narrow, mysterious but child-safe shop with stacked wand boxes, warm pools of light, and open space for three escalating wand attempts. |
| `ch1-malkins.png` | Robe shop | A bright tailoring room with fabric, mirrors, and a central fitting area where trim colors remain easy to compare. |
| `ch1-menagerie.png` | Pet shop | A gentle, inviting animal shop with clear homes for a cat, owl, and toad and enough visual separation for large touch targets. |
| `ch1-platform.png` | Chapter card and Chapter 2 preview | A magical railway platform composition with open central space reserved for the chapter-complete typography and preview choices. |
| `card-morgana.png` | Collectible card portrait | An original, ornate storybook portrait for a historical witch card, framed for a small album tile and not based on a real performer. |
| `card-dumbledore.png` | Collectible card portrait | An original, kind headmaster portrait for a collectible card, framed consistently with Morgana and not based on a real performer. |

The generated room paintings intentionally contain no player character. Violet, companions, pets, and interactive effects are separate assets or render layers so movement, choices, and deterministic captures can remain under game-engine control.
