# Casual Violet Gemini edit v2

Status: image-edit candidate only. Do not use as a sprite source until the
independent Art Director review required by `docs/ART_DIRECTOR.md` passes.

Model: `google/gemini-3.1-flash-image`

Input reference 1: `casual-anchor-gemini-flash-raw.png`, the edit target.

Input reference 2: `art/character-refs/violet.png`, the canonical identity and
storybook-style reference.

Requested output: 3:4, 1K, PNG, one image.

Generated: 2026-07-14. OpenRouter returned
`casual-anchor-gemini-v2-edit-raw.png` in 12.04 seconds. SHA-256:
`c05fef00fb7027703dc0f1b500866827634d166d78103c85bf2f3e082e0c9e7e`.
The request used 3,022 prompt tokens and 1,120 image-completion tokens and cost
`$0.068711`. Response metadata without credentials or image bytes is recorded
in `casual-anchor-gemini-v2-edit.metadata.json`.

## Prompt

Perform a precise character-model edit. Reference image 1 is the EDIT TARGET:
keep its single front-facing full-body composition, its coherent connected
anatomy, its visible neck, its warm parchment ground, and its general Violet
color family. Reference image 2 is the CANONICAL IDENTITY AND STYLE SOURCE:
correct the target so the face, glasses, fringe, hair character, age, and
hand-painted storybook treatment unmistakably match that canonical Violet.
Return ONE single fully assembled character only, centered and completely
visible from the highest hair wisp through both shoe soles. Do not add a second
view, inset, exploded parts, props, text, labels, scenery, or partial figures.

Make only these deliberate corrections:

Make Violet read immediately as six years old with compact premium picture-book
proportions of approximately one head to three and a quarter total body height.
Keep her head large and childlike. Shorten the legs substantially, shorten and
widen the little torso slightly, soften the waist, and preserve a balanced
upright stance. Do not make her a toddler, chibi figure, older schoolgirl,
fashion doll, or miniature adult.

Restore the canonical broad round child face, side-swept fringe, warm brown
eyes, rosy cheeks, and bright capable smile. Make the glasses unmistakably
DARK GREEN and RECTANGULAR with softly rounded corners, not circular, oval,
olive, or black. Preserve a small natural neck clearly visible between jaw and
white collar.

Keep Violet's long WARM LIGHT-BROWN wavy hair with chestnut shadow depth, but
remove the halo of thin loops and floating arcs. Allow exactly three or four
short, irregular, soft wisps that begin visibly inside or at the edge of the
painted hair mass and curve back into it. No antenna arcs, closed loops, wire
shapes, salon symmetry, center-parted curtain, or hair crossing the central
neck and collar.

Replace the costume-like top with an unmistakably ordinary child's soccer
jersey. Use a saturated blue-violet main body, two clearly different darker
violet side panels, a bright white V collar, and ordinary short athletic raglan
sleeves in deep purple. The sleeves fit the shoulders and upper arms with clear
normal shoulder seams. No balloon sleeves, puff sleeves, gathers, princess
shoulders, stacked chevrons, superhero motif, tunic, dress, robe, crest, number,
logo, or text. Keep dark plum leggings and practical slate-purple trainers with
a small purple accent.

Keep the arms relaxed beside the OUTER thighs. Make both hands a matched neutral
pair: small wrists, fingers together with a gentle natural curve, and correctly
placed inward-facing thumbs. Neither hand points, grasps, fans open, droops, or
curls toward the thigh. Keep both knee, ankle, and toe axes aligned in the same
nearly frontal view. Plant both shoe soles flat and point both shoes almost
straight forward with only the same tiny outward angle. No duck-footed stance
and no side-profile shoe.

Bring the rendering closer to the canonical reference and painted rooms:
visible gentle paper tooth, layered gouache and watercolor shapes, softened
edge variation, dimensional but not glossy skin, irregular hand-painted fabric
folds, and subtly varying dark-brown contours. Reduce polished digital gloss,
airbrushed nursery rendering, perfect geometry, and sticker-like symmetry.
Preserve rich value separation so the blue-violet jersey remains distinct in a
purple bedroom. Keep the neutral upper-left source lighting for this anchor;
do not bake in a gray floor shadow, because room-specific contact shadows and
right-key lighting variants will be produced separately.
