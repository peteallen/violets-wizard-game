# Satchel button art

These five controls and four destination panels were generated with the built-in image-generation tool on
2026-07-16, then keyed locally from a flat green background and resized to WebP
for the game. The untouched chroma-key sources live in `source/`; only the
processed WebP files under `public/assets/art/ui/satchel/` ship.

All prompts shared this production direction: a polished hand-painted gouache
and colored-pencil prop for a children's wizard-adventure storybook, warm
upper-left candlelight, tactile leather/brass/parchment, irregular silhouettes,
no words or watermark, and a perfectly flat `#00ff00` background with no cast
shadow for deterministic removal.

## Map tab

Source: `source/map-tab-chroma.png`

Prompt: Create one wide blackberry-purple leather bookmark tab with imperfect
gold stitching, a folded parchment-map emblem on the left, blank label space on
the right, and a right-edge ribbon notch. Straight-on, horizontal, isolated.

## Cards tab

Source: `source/cards-tab-chroma.png`

Prompt: Using the Map tab as the exact geometry and style reference, create its
warm saddle-brown sibling. Replace the map with two cream collectible cards and
a small owl medallion, retain blank label space, stitching, lighting, and the
right-edge ribbon notch.

## Grown-ups

Source: `source/grown-ups-chroma.png`

Prompt: Create a compact horizontal antique-brass lock plate sewn to a deep
plum leather backing, with a friendly keyhole at left and blank label space at
right. The result should feel trustworthy rather than ominous.

## Start fresh

Source: `source/start-fresh-chroma.png`

Prompt: Create a compact muted-burgundy leather luggage tag with an aged-gold
circular reset arrow at left and blank label space at right. It must feel
secondary and serious, contain no X, and avoid bright warning red.

## Close seal

Source: `source/close-seal-chroma.png`

Prompt: Create an irregular hand-pressed blackberry-purple wax seal base with a
thin aged-gold inner rim and an empty center for a code-rendered close mark. It
must contain no symbol in the generated art.

## Destination panels

Sources: `source/destination-diagon-alley-chroma.png`,
`source/destination-ollivanders-chroma.png`,
`source/destination-malkins-chroma.png`, and
`source/destination-menagerie-chroma.png`.

The Diagon Alley panel established the family from the Map tab and Chapter One
street painting: one irregular warm parchment card in a thin aged-gold and
dark-plum rim, with recognizable crooked shops above a calm blank lower label
band. Ollivanders, Madam Malkin’s, and Menagerie were generated as matching
siblings using their shipping room paintings for place cues. Their prompts
substituted, respectively, glowing wand windows and boxes; jewel-toned robes,
fabric, measuring tape, and a mirror; and owl, cat, toad, circular perches,
leafy branches, and brass bells. Every prompt prohibited words, numbers, UI
markers, and watermarks and required a flat `#00ff00` background.

The runtime owns all destination names and progress state. Each processed panel
is 420×500 WebP and exposes the blank lower band as explicit label geometry;
Canvas centers the name using both `textAlign = 'center'` and
`textBaseline = 'middle'`. Here, completed checks, Next, and the objective star
remain code-rendered so saves and chapters never need alternate paintings.

## Processing

The sources were processed with the installed image-generation skill's
`remove_chroma_key.py` helper using border sampling, a soft matte, thresholds
12/220, and despill. The transparent results were cropped and resized with
`cwebp` at quality 88 and alpha quality 100.

## Provenance boundary

This first UI-prop set predates the repository's versioned request and response
records for generated production art. The built-in generator did not expose a
controllable seed or a provider receipt, so the committed raw sources, prompts,
generation date, and processing settings preserve the available provenance but
do not promise byte-for-byte regeneration. Any replacement of these props must
add a versioned request record and a repository-owned deterministic processing
script before the old source is retired. The stricter Gemini/Vertex-only rule
in the character pipeline applies to production characters; these textless UI
props remain historical output from the built-in generator.
