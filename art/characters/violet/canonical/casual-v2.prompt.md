# Violet casual canonical candidate v2

Status: discarded before formal review or derivation. It improved texture,
lighting, and jersey separation, but still reproduced the older full-body
identity reference's long lower body and outward-turned shoes. It may not be
used as a canonical source.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `casual-v2-raw.png` in 16.59
seconds. SHA-256:
`eaf458f56d159f9cc5de3c97a78b74b77248f7b2ba19bc86fa4dcd5d6a0eb80d`.
The request used 6,644 prompt tokens and 1,120 image-completion tokens and cost
`$0.070522`. Response metadata without credentials or image bytes is recorded
in `casual-v2.metadata.json`.

Input references, in order:

1. `art/character-refs/violet.png` — locked Violet face, glasses, hair identity, and age
2. `art/guides/character-neutral-child-proportion-guide-compact.png` — strict compact stance and shoe-axis constraint
3. `art/character-refs/hagrid.png` — brush texture, material depth, broken edges, and strong directional light only
4. `art/raw/ch1-bedroom.png` — room-painting surface texture and value depth only
5. `art/raw/ch1-diagon-day.png` — room-painting surface texture and warm/cool structure only

## Prompt

Paint from scratch ONE canonical casual-clothes Violet, the exact original
six-year-old girl identified by reference 1. This is a new source painting, not
an edit and not a reconstruction of any other candidate. Show one fully
assembled, front-facing, upright-neutral full body centered on a simple
irregular parchment wash, completely visible from the highest hair wisp through
both shoe soles. No second view, inset, parts sheet, prop, text, label, border,
room scenery, or extra person.

IDENTITY FROM REFERENCE 1: preserve Violet's broad round child face, slightly
almond-shaped warm brown eyes, rosy cheeks, small dimensional nose, subtle
bright smile, side-swept fringe, DARK-GREEN RECTANGULAR glasses, and long WARM
LIGHT-BROWN wavy hair with chestnut shadow depth. Keep the lower face long
enough to match her identity instead of becoming a generic baby doll. Use only
three or four short, irregular, soft wisps visibly attached to the main hair
mass. No circular eyes or glasses, center-parted salon curtain, thin loops,
floating arcs, horns, or antennae. A short natural neck remains clearly visible
between jaw and white collar; hair may frame but never cover that center join.

PROPORTION AND POSE FROM REFERENCE 2: copy the compact silhouette and joint
placement. The guide is intentionally strict: do not lengthen its torso or
legs. The final painted child must measure between 3.0 and 3.25 of her own head
heights from hair top to shoe soles, never 3.5 or more. Preserve a large
storybook head, compact pelvis-to-floor construction, level shoulders, upright
spine, and balanced weight. She is six, not a toddler, chibi, older schoolgirl,
fashion doll, or miniature adult.

Paint two anatomically coherent arms. Each begins at the OUTER shoulder seam,
with a visible upper arm, gentle elbow at the waist, forearm, narrow wrist at
the hip, and small relaxed hand beside the OUTER thigh. Fingers stay together
in a natural curve; left and right thumbs sit on the correct inward-facing
sides. No arm crosses the torso or pelvis. No pointing, splayed fingers,
outward-bent wrist, boneless tube, inner-sleeve attachment, or duplicate sleeve.

Paint two anatomically coherent legs and NEARLY FRONT-FACING SHOES. Each knee,
shin, ankle, and toe follows one continuous forward axis. Both full toe caps and
laces are visible from the front. Both soles are planted on the same floor line.
The toes may diverge by only a tiny matching amount—less than five degrees—and
must remain directly beneath their own knees and ankles. No three-quarter or
side-profile shoe, duck feet, twisted ankle, crossed legs, tiptoe, or floating
sole.

OUTFIT: an unmistakable ordinary child's THREE-TONE soccer jersey, not a plain
purple T-shirt. Use a saturated BLUE-VIOLET central body, clearly lighter
violet athletic raglan sleeves with normal close-fitting shoulder seams, and
wide DEEP-VIOLET side panels that remain visible at small gameplay scale. Add a
bright white V collar and hand-painted athletic fabric folds. The jersey ends
at the hips. No puff or balloon sleeves, gathers, stacked chevrons, dress,
tunic, cheer top, princess blouse, superhero costume, robe, crest, number,
logo, or text. Use charcoal-plum leggings substantially darker and more neutral
than the jersey, plus practical slate trainers with painted seams and one small
purple accent.

MEDIUM FROM REFERENCES 3, 4, AND 5: match the tactile painted surface rather
than their people, proportions, clothes, or scenery. Use opaque and dry-brush
gouache shapes over visible watercolor paper tooth, irregular pigment
modulation inside every major form, brush-shaped highlights, softened broken
edges, selectively reinforced dark-brown contours, layered fabric planes,
dimensional matte skin, and hair painted as broad wavy masses with restrained
strand groups. The character must look painted by the same hand as the rooms,
not pasted over them. No smooth airbrush gradients, glossy ribbon hair,
polished digital-cartoon skin, nursery clip art, perfect vector geometry,
plastic 3D, anime, photorealism, or washed-out pastel color.

LIGHTING: one unmistakable warm upper-left key. The image-left forehead, hair
ridges, cheek, shoulder, forearm, jersey folds, and shoe edges receive warm
honey highlights and a restrained golden rim. The image-right face, hair,
torso, arm, and leg carry a clearly cooler violet-brown shadow mass. Do not use
neutral, frontal, or symmetrical studio light. Add only a small warm
violet-brown contact wash directly beneath both planted soles; never a cool gray
studio ellipse.
