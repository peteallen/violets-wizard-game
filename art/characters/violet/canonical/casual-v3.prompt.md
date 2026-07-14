# Violet casual canonical candidate v3

Status: discarded before formal review or derivation. The face-only identity
crop retained Violet, but the generation still lengthened the figure and
invented long sleeves, so it did not satisfy the canonical body or outfit
contract.

Model: `google/gemini-3.1-flash-image`

Endpoint: OpenRouter `POST /images`

Requested output: 3:4, 1K, PNG, one image

Generated: 2026-07-14. OpenRouter returned `casual-v3-raw.png` in 24.12
seconds. SHA-256:
`77068c7d6fc320f4f2512f06b6db8dd463bac01c5fce19f6426894506aebf68c`.
The request used 6,557 prompt tokens and 1,120 image-completion tokens and cost
`$0.0704785`. Response metadata without credentials or image bytes is recorded
in `casual-v3.metadata.json`.

Input references, in order:

1. `identity-face-crop.png` — Violet's locked face, glasses, hair identity, and painterly facial treatment; no body proportions
2. `art/guides/character-neutral-child-proportion-guide-compact.png` — strict full-body pose, joint placement, and compact silhouette
3. `art/character-refs/hagrid.png` — tactile gouache texture, material depth, broken edges, and decisive directional light only
4. `art/raw/ch1-bedroom.png` — room-painting texture and value depth only
5. `art/raw/ch1-diagon-day.png` — room-painting texture and warm/cool structure only

## Prompt

Paint from scratch one canonical casual-clothes Violet. Reference 1 is the ONLY
identity source: preserve that exact original six-year-old girl's broad round
face, almond-shaped warm brown eyes, lower-face length, small dimensional nose,
subtle bright smile, rosy cheeks, side-swept fringe, DARK-GREEN RECTANGULAR
glasses, and long WARM LIGHT-BROWN wavy hair with chestnut depth. Do not infer
any body proportion or outfit from reference 1. Show ONE fully assembled,
front-facing, upright-neutral full body centered on a simple irregular parchment
wash, completely visible from hair top through both shoe soles. No second view,
inset, parts sheet, prop, text, label, border, scenery, or extra person.

Use only three or four short, irregular, soft wisps that begin inside or at the
edge of the hair mass and curve back toward it. No center-parted salon curtain,
thin loops, floating arcs, horns, or antennae. Keep a short natural neck clearly
visible between jaw and white collar; hair frames but never covers that center
join.

Reference 2 is the mandatory full-body construction. Copy its compact stance,
joint positions, short pelvis-to-floor span, level shoulders, upright spine,
and balanced weight. Its red sole line is absolute: do not lengthen the legs
below it. The final painted figure must be 3.0 to 3.25 of her own head heights
from hair top to shoe soles, never 3.5 or more. She is a compact picture-book
six-year-old, not a toddler, chibi, older schoolgirl, fashion doll, or miniature
adult.

Each arm begins at the outer shoulder seam and has a recognizable upper arm,
gentle elbow at the waist, forearm, narrow wrist at the hip, and small relaxed
hand beside the OUTER thigh. Fingers remain together; left and right thumbs are
on the correct inward-facing sides. No pointing, splayed fingers, outward wrist,
boneless tube, inner-sleeve join, duplicated shoulder, or arm over the pelvis.

Both legs are compact, straight, and relaxed. Knees, shins, ankles, and toes
share the same forward axes. Paint BOTH SHOES STRAIGHT-ON FROM THE FRONT: the
complete toe caps and laces face the viewer, the inner and outer shoe edges are
nearly symmetrical, both soles share one floor line, and toe divergence is
under five degrees. No three-quarter shoe, side-profile shoe, duck foot, twisted
ankle, crossed leg, tiptoe, or floating sole.

Dress her in an unmistakable ordinary three-tone soccer jersey: a saturated
BLUE-VIOLET central body; clearly lighter violet, close-fitting short athletic
raglan sleeves with normal shoulder seams; wide DEEP-VIOLET side panels that
remain obvious at gameplay scale; and a bright white V collar. Add irregular
painted athletic-fabric folds. The jersey ends at the hips. No plain purple
T-shirt, puff sleeve, balloon sleeve, gather, stacked chevron, dress, tunic,
cheer top, princess blouse, superhero costume, robe, crest, number, logo, or
text. Leggings are charcoal-plum, substantially darker and more neutral than
the jersey. Trainers are practical slate with painted seams and one small
purple accent.

References 3, 4, and 5 define the visual medium only. Match their tactile
opaque and dry-brush gouache over visible watercolor paper tooth, irregular
pigment modulation, brush-shaped highlights, softened broken edges, selective
dark-brown contours, layered fabric planes, matte dimensional skin, and broad
wavy hair masses. The character must look painted by the same hand as the room,
not pasted over it. No smooth airbrush gradients, glossy ribbon highlights,
polished digital-cartoon skin, nursery clip art, perfect vector geometry,
plastic 3D, anime, photorealism, or washed-out pastel color.

Use one decisive warm upper-left key. The image-left forehead, hair ridges,
cheek, shoulder, forearm, jersey folds, and shoe edges receive warm honey
highlights and a restrained golden rim. The image-right face, hair, torso, arm,
and leg carry a visibly cooler violet-brown shadow mass. Never use neutral,
frontal, or symmetrical light. Add only a small warm violet-brown contact wash
directly under both planted soles, never a cool gray studio ellipse.
