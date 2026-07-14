# Violet casual canonical candidate v5: compact-layout repaint

Status: **REJECTED before derivation** by the three-lens Art Director review.
Anatomy and style found only minor issues, but readability blocked the source
for an older, narrow pointed face and a centered, over-wide corkscrew hair mass
that drifted from Violet and obscured the sleeve and elbow silhouette. Do not
derive, slice, or ship this candidate.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned
`casual-v5-compact-repaint-raw.png` in 16.37 seconds. SHA-256:
`6143f4488a6e675ef239049fb91b00357ea54ed0f72a79c736ddac3433c26834`.
The request used 6,337 prompt tokens and 1,120 image-completion tokens and cost
`$0.0703685`. Response metadata without credentials or image bytes is recorded
in `casual-v5-compact-repaint.metadata.json`.

Input references, in order:

1. `casual-v2-compact-layout-guide.png` — exact full-body silhouette, joint positions, jersey, and compact floor line
2. `identity-face-crop.png` — locked Violet face, glasses, and hair identity
3. `art/character-refs/hagrid.png` — tactile gouache surface, broken edges, and directional light only
4. `art/raw/ch1-bedroom.png` — room-painting material depth only
5. `art/raw/ch1-diagon-day.png` — room-painting warm/cool structure only

## Prompt

Repaint reference 1 as a finished canonical character while obeying its body
layout exactly. Return one fully assembled, front-facing, upright-neutral Violet
on a complete 3:4 irregular parchment wash, visible from hair top through both
shoe soles. Reference 1 already has the required compact child silhouette: keep
its hair top, chin, neck, shoulder, jersey hem, hip, knee, ankle, and raised floor
line at the same positions. Do not lengthen the torso or legs, lower the shoes,
or restore the blank band beneath the current compact floor. Extend clean
parchment texture through the unused bottom canvas instead. The finished figure
must remain 3.0 to 3.25 of her own head heights, never 3.5 or more.

Reference 2 locks identity. Preserve the same broad round six-year-old face,
almond warm-brown eyes, lower-face length, small dimensional nose, subtle bright
smile, rosy cheeks, side-swept fringe, DARK-GREEN RECTANGULAR glasses, and long
WARM LIGHT-BROWN wavy hair with chestnut depth. Keep three or four short,
irregular, visibly attached wisps. Keep the central neck visible. No circular
eyes or glasses, salon symmetry, thin loops, floating arcs, horns, or antennae.

Repair the mechanically compressed lower half into natural compact anatomy
WITHOUT changing its existing hem, hip, knee, ankle, or floor coordinates.
Keep two short childlike thighs and shins with painted legging folds. Paint both
trainers straight-on from the front, directly below their own knees and ankles,
with full toe caps and laces visible, equal sizes, matching slate materials,
small purple accents, and under-five-degree toe divergence. Both soles meet the
existing raised floor line. No three-quarter or side-profile shoe, duck foot,
twisted ankle, crossed leg, tiptoe, floating sole, or oversized footwear.

Retain the connected arm anatomy and ordinary three-tone soccer outfit: a
saturated BLUE-VIOLET central jersey body, clearly lighter violet close-fitting
short raglan sleeves with normal shoulder seams, wide DEEP-VIOLET side panels,
and a bright white V collar. Keep hands relaxed beside the outer thighs with
correct inward-facing thumbs. Leggings remain charcoal-plum and substantially
darker than the jersey. No long or puffed sleeves, gathers, chevrons, dress,
tunic, costume, robe, crest, number, logo, or text.

References 3, 4, and 5 define the visual medium. Use tactile opaque and
dry-brush gouache over visible watercolor paper tooth, irregular pigment
modulation, brush-shaped highlights, softened broken edges, selective
dark-brown contours, layered fabric planes, matte dimensional skin, and broad
wavy hair masses. Use a decisive warm upper-left key with honey highlights and
a restrained golden rim on the image-left planes, plus a cooler violet-brown
shadow mass on the image-right planes. No smooth airbrush, glossy ribbon hair,
polished digital-cartoon skin, nursery clip art, perfect vector geometry,
plastic 3D, anime, photorealism, washed-out pastel color, or symmetrical studio
light. Add a small warm violet-brown contact wash only beneath the raised soles.

Do not add a second view, inset, parts sheet, prop, text, label, border, room
scenery, or extra person.
