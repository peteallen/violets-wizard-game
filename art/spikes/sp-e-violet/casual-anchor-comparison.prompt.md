# Casual Violet anchor comparison

Status: model-comparison candidates only. The Gemini candidate was **REJECTED**
by the three-lens Art Director review for older roughly four-head proportions,
unclear balloon-sleeve shoulder sockets, inconsistent shoe axes, identity and
hair-wisp drift, costume-like jersey geometry, glossy sticker-like rendering,
and fixed lighting that conflicts with the bedroom. Grok and Recraft were not
submitted for acceptance and may not be used as sprite sources.

Input reference: `art/character-refs/violet.png`.

Requested output: one 3:4 full-body neutral character on a simple parchment
ground, using the same prompt for each model. Raster models request 1K PNG;
the Recraft vector model requests SVG.

Models:

`google/gemini-3.1-flash-image`

`x-ai/grok-imagine-image-quality`

`recraft/recraft-v4.1-pro-vector`

Generated: 2026-07-14 through OpenRouter.

Gemini produced `casual-anchor-gemini-flash-raw.png` at 896x1200 in 14.08
seconds. SHA-256:
`9fa2d0769dabeaeb8fab5d3a66ab2b870f438ac77976255cb7578d84c576645d`.
The request cost `$0.068321`.

Grok produced `casual-anchor-grok-quality-raw.jpg` at 864x1152 in 12.22
seconds. SHA-256:
`b8f9a36fd2ef9d9d8c0399698c11b127d152aec58531b260e7d72a52058ce986`.
The request cost `$0.06`.

Recraft produced `casual-anchor-recraft-pro-vector-raw.svg` in 37.02 seconds.
SHA-256:
`e8b130a14d5f2985b2808d2caa6011ae38f10d53ce0fae3963a65f160f5f8490`.
The request cost `$0.30`. The 5.4 MB SVG contains 5,445 ungrouped paths and
50 linear gradients; it contains no raster image payload, but it also has no
semantic body-part groups.

Full response usage metadata without credentials or image bytes is recorded in
`casual-anchor-comparison.metadata.json`.

## Prompt

Use the supplied Violet character reference as a locked identity and style
reference. Create ONE single, fully assembled, front-facing, full-body neutral
portrait of this exact original six-year-old girl. Show her entire silhouette
from the top of every hair wisp through the soles of both shoes, centered with
generous empty space on a simple irregular warm parchment ground. Do not make a
reference sheet, exploded parts sheet, second view, inset portrait, prop, text,
label, border, scenery, or extra character.

Preserve Violet's recognizable face, warm medium-light complexion, warm brown
eyes, rosy cheeks, bright gentle smile, dark-green RECTANGULAR glasses, and
long WARM LIGHT-BROWN wavy hair with rich chestnut shadows and three or four
short, irregular, hair-attached wisps. Her hair sits naturally behind and beside
her shoulders. It does not form a beard, bib, curtain, or pointed wedge beneath
her chin. A small, natural skin neck is clearly visible from below her jaw into
the center of her collar.

Dress her in ordinary clothes: a clearly sporty, high-contrast THREE-TONE
blue-violet soccer jersey with a bright white V collar and short purple puff
sleeves, dark plum leggings, and slate-purple trainers with painted seams and a
small purple accent. The jersey must read as sportswear rather than a dress,
tunic, or robe, and must stay visually distinct against a purple bedroom.

Her anatomy and posture must be completely plausible before stylization. Her
head is visibly connected to her body by the neck. Her shoulders are present,
level, and relaxed. Each arm emerges from the outer shoulder socket and rests
beside the OUTER thigh, never in front of the pelvis. Each arm has a recognizable
upper arm, gentle elbow near the waist, forearm, narrow wrist near the hip, and
small relaxed hand with fingers together. The left and right thumbs are on the
correct inward-facing sides. The hands do not point, grasp, droop, fan open, or
bend outward. Her spine is upright and her weight is balanced evenly over two
straight but relaxed legs. Both shoes are planted flat and face almost forward
with only a tiny natural outward angle, never a side profile or duck-footed
stance. Use premium picture-book child proportions of approximately one head
to three and a quarter total body height, not a fashion doll, toddler, adult,
or chibi figure.

Match the game's premium warm storybook illustration: richly painted gouache
and watercolor, visible but gentle paper tooth, soft edges, dimensional skin,
shaped fabric folds, hair built from layered wavy masses with interior strand
groups, and subtly varying dark-brown painted contours. Use one coherent warm
upper-left key light with cooler violet-brown shadows. Preserve rich values and
color separation; never washed-out pastel, airbrushed nursery clip art, flat
minimal vector iconography, glossy plastic 3D, anime, or photorealism. If the
chosen model outputs SVG, express this same painterly depth through layered
editable vector shapes, restrained gradients, irregular contour shapes, and
subtle vector texture while keeping all major silhouette and clothing regions
cleanly separable.
