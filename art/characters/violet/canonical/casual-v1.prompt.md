# Violet casual canonical candidate v1

Status: **REJECTED before derivation** by the three-lens Art Director review.
The readability lens passed with minor notes, but anatomy blocked the source at
roughly 3.5 head-heights and a duck-footed ankle-to-shoe axis. Style blocked it
for smooth digital-cartoon rendering, weak directional light, and insufficient
three-tone jersey separation. Do not derive, slice, or ship this candidate.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `casual-v1-raw.png` in 21.86
seconds. SHA-256:
`75aa1a09f242012fe7c0e24c9684963306da68f91108a076b23efd0584d8f837`.
The request used 5,385 prompt tokens and 1,120 image-completion tokens and cost
`$0.0698925`. Response metadata without credentials or image bytes is recorded
in `casual-v1.metadata.json`.

Input references, in order:

1. `art/character-refs/violet.png` — locked face, glasses, hair identity, and age
2. `art/guides/character-neutral-child-proportion-guide.png` — exact neutral stance and 3.25-head silhouette
3. `art/raw/ch1-bedroom.png` — painterly room style and material depth only
4. `art/raw/ch1-diagon-day.png` — painterly room style and value structure only

## Prompt

Create from scratch the canonical casual-clothes character painting for Violet,
the original six-year-old girl identified by reference image 1. Produce ONE
single, fully assembled, front-facing, full-body neutral character centered on
a simple irregular warm parchment wash. Show her entire silhouette from the
highest hair wisp through both shoe soles with generous empty space. Do not
create a character sheet, second view, portrait inset, exploded parts, prop,
text, label, border, scenery, or extra person.

Reference image 1 locks Violet's identity. Preserve the same broad round child
face, warm medium-light complexion, warm brown eyes, rosy cheeks, small
dimensional nose, bright capable smile, side-swept fringe, DARK-GREEN
RECTANGULAR glasses, and long warm light-brown wavy hair with chestnut depth.
Use exactly three or four short, irregular, softly painted wisps that begin
visibly inside or at the edge of the hair mass and curve back toward it. Never
use circular glasses, a center-parted salon curtain, thin looping flyaways,
floating arcs, horns, or antenna shapes.

Reference image 2 is an exact body-layout constraint, not a style reference.
Match its upright neutral stance, joint placement, compact limb lengths, and
overall proportion: the complete painted figure from hair top to shoe soles is
approximately 3.25 of her own head heights. Her large head reads as a
picture-book six-year-old, not a toddler, chibi, older schoolgirl, fashion doll,
or miniature adult. Her shoulders are present and level. A short natural neck
is unmistakably visible below her jaw and enters the center of the collar. Her
spine is upright and her weight is balanced evenly over both planted feet.

Paint anatomically coherent arms and hands. Each arm emerges from the OUTER
shoulder seam, with a recognizable upper arm, soft elbow near the waist,
forearm, narrow wrist near the hip, and small relaxed hand resting beside the
OUTER thigh. Fingers stay together with a natural gentle curve. Left and right
thumbs appear on their correct inward-facing sides. Neither arm crosses the
torso or pelvis. No pointing finger, fanned hand, bent-out wrist, boneless tube,
inside-sleeve attachment, duplicated shoulder, or hidden elbow.

Paint anatomically coherent legs and feet. Both legs are straight but relaxed,
with knees, ankles, and toes sharing the same nearly frontal axes. Both shoes
are planted flat and point almost directly forward with the same tiny natural
outward angle. No side-profile shoes, duck-footed stance, crossed legs, tiptoe,
or floating sole.

Dress Violet in unmistakably ordinary sports clothes that she wears before she
earns wizard robes: a saturated blue-violet soccer jersey with a bright white
V collar, two clearly darker violet side panels, and ordinary close-fitting
short athletic raglan sleeves with visible shoulder seams. The jersey is loose
enough for a child but ends at the hips. It is not a dress, tunic, cheer top,
princess blouse, superhero costume, or robe. No puff sleeves, balloon sleeves,
gathers, stacked chevrons, crest, number, logo, or text. Add dark plum leggings
and practical slate trainers with painted seams and one small purple accent.
The blue-violet jersey must retain strong value separation against a purple
bedroom.

References 3 and 4 lock the game's visual medium but not their scenery. Match
their premium warm storybook gouache and watercolor: visible gentle paper
tooth, rich layered color, softened painted edges, irregular hand-painted
forms, subtly varying dark-brown contours, dimensional skin, fabric fold
planes, and hair built from broad wavy masses with restrained interior strand
groups. Use one coherent warm upper-left key light with cooler violet-brown
shadows. Do not copy any room object or background. Avoid glossy digital
character rendering, polished nursery clip art, perfect vector geometry,
plastic 3D, anime, photorealism, washed-out pastel color, or a sticker-like
outline. Add only a small soft neutral contact wash directly beneath both feet
to prove grounding; it is reference-only and will not be part of runtime art.
