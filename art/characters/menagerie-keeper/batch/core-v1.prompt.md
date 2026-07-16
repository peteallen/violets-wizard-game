# Menagerie Keeper core dialogue batch v1

Status: inspected production source. All four figures are the accepted shipping
subset in source order: neutral, blink, talk A, and talk B. They preserve one
coherent identity, outfit, scale, ground line, anatomy, and upper-left light;
the deterministic layout adds narrow neighboring-cell overlap solely so the
complete grooming brush survives extraction.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 4:3, 4K, PNG, one image

Input references, in order:

1. `art/characters/menagerie-keeper/canonical/identity-v1-production-reference.png`
   — exact downscaled copy of the keeper identity sheet, preserving her face,
   braid, palette, outfit, proportions, and emotional read while keeping the
   embedded request payload reliable
2. `art/guides/ch1-room-style-triptych.png` — painterly room-style texture,
   upper-left key-light, and violet-blue shadow guidance only

## Prompt

Use case: identity-preserve.
Asset type: deterministic-slicing source for a premium children's storybook
game character.

Create one polished 4K 4:3 image containing exactly four complete, separate,
full-body paintings of the exact Menagerie Keeper in reference 1. Arrange them
as a clean two-column by two-row sheet on one perfectly flat, perfectly uniform
cyan background. Keep every figure entirely inside its own quadrant with
generous empty cyan separation. Every curl, braid end, arm, gauntlet, hand,
brush, coat hem, pouch, and both boot soles must be complete and uncropped. Use
the same body scale, head size, front three-quarter stance, foot placement, and
ground line in every panel. Do not draw grid lines, panel borders, labels,
numbers, captions, arrows, or any text.

Reference 1 locks the exact identity, palette, outfit, proportions, and
emotional read. Preserve the same original early-forties magical animal-shop
keeper: tall-ish, sturdy, rangy build; long friendly oval face; lightly crooked
nose; freckled warm copper skin; high expressive brows; clear moss-green eyes
with small warm upper-left catchlights; and a restrained asymmetric smile with
one corner slightly higher. Keep her calm, observant, quietly amused, capable,
welcoming, gently eccentric, and entirely safe for a young child. Never make
her stern, creepy, severe, glamorous, youthful, vacant, generic, or actor-like.

Preserve her hair identically in all four panels: thick burnt-auburn hair from
the same off-center part, swept into one substantial loose side braid over her
right shoulder to mid-chest, built from broad overlapping locks, with the same
few soft curls near her temples and ears. Keep the same braid side, length,
volume, hairline, copper-gold highlights, and tie in every panel. No bun,
ponytail, loose straight hair, hat, or hood.

Preserve the complete outfit identically in every panel: weathered deep
moss-green knee-length work coat with soft standing collar, rolled cuffs,
curved brass toggles, visible stitched repairs, and flared skirt; warm
tawny-brown leather work apron from upper chest to just above the knees with a
diagonal shoulder strap; compact dark-brown keeper's pouch at her right hip
with one tiny unlettered brass paw-shaped clasp; muted sage trousers; and sturdy
dark umber lace-up leather ankle boots with broad planted soles. Preserve every
toggle, repair, strap, pouch, clasp, cuff, trouser roll, boot, and material color
in all four panels.

Her anatomical left forearm and hand wear the same long caramel-brown
protective animal-handling leather gauntlet reaching nearly to the elbow, with
simple wrap stitching. Her anatomical right hand stays bare and loosely holds
the same small oval wooden grooming brush against the outside of her thigh,
bristles pointing inward. The brush is an occupational tool, never a wand or
weapon. Do not add a pet, bird, cat, owl, toad, cage, carrier, wand, feathers,
jewelry, glasses, or any other prop.

All four figures use the exact same upright-neutral front three-quarter pose,
facing slightly toward image-right. Keep her spine vertical, chin level,
shoulders relaxed, feet planted flat with toes only slightly turned out, and
weight balanced. Both arms hang naturally beside the body. The gauntleted left
hand rests relaxed against the coat; the bare right hand holds the brush at the
outer thigh. Expressions are the only intentional differences. Use this exact
panel order:

TOP LEFT — neutral: eyes open and the restrained asymmetric closed-mouth smile
from the identity anchor.

TOP RIGHT — blink: body, head, hair, outfit, hands, gauntlet, brush, pouch, and
mouth identical to top left, changing only both eyelids to a gentle natural
closed blink.

BOTTOM LEFT — talk A: body, head, hair, outfit, hands, gauntlet, brush, and pouch
identical to top left; eyes open; mouth modestly open on a friendly wide vowel,
with a small natural dark mouth opening and lips moving without changing her
jaw, smile asymmetry, or identity.

BOTTOM RIGHT — talk B: body, head, hair, outfit, hands, gauntlet, brush, and
pouch identical to top left; eyes open; mouth in a clearly distinct smaller
rounded speaking shape, visibly different from talk A while remaining gentle
and restrained.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Her anatomical left arm
must end in the true left gauntleted hand and her anatomical right arm must end
in the true bare right hand based on her own body, not the viewer's side. Each
hand connects continuously through the correct coat sleeve, forearm, wrist,
palm, and knuckles. Keep both hands naturally small, no larger than half her
face. Show one believable thumb on the correct side of each palm and four
coherent gently relaxed fingers with soft separation. The gauntlet must wrap
the left hand without turning it into a mitten. The right fingers must wrap
naturally around the brush handle without swallowing it. The hands are distinct
anatomical counterparts, never copied, mirrored, reused, reversed, swapped,
rotated, or turned backward. No sleeve stump, backward wrist, duplicate thumb,
fused mitten, claw, fist, floating hand, oversized hand, hidden hand, extra
finger, or missing finger.

Match the richly painted gouache-and-watercolor room style, with visible woven
paper and dry-brush tooth, soft dark-brown contour accents that dissolve into
painted edges rather than hard ink outlines, organic asymmetry, freckled skin,
woven coat grain, scuffed leather, and softly layered braid locks. Reference 2
supplies only the painterly finish and light story; include none of its rooms or
furnishings. Light every figure from the upper left with warm candle-gold
highlights and visibly cool the shadow side of skin, green coat, leather apron,
braid underside, trousers, gauntlet, pouch, and boots into violet-blue. Keep the
key direction identical across all four figures. Avoid airbrush-smooth skin,
slick gradients, mechanical dot screens, hard comic ink, flat vector art,
anime, 3D rendering, or plastic surfaces.

The cyan field must be completely uniform and removable: no cast shadows,
contact shadows, gradients, texture, floor plane, reflections, scenery,
furniture, shelves, plants, cages, animals, magical effects, decorative marks,
extra people, logos, watermark, or signature. No duplicate limbs, detached
anatomy, cropped boots, malformed eyes, different outfits, different identities,
or differing body scales. Return only the four complete Menagerie Keeper
figures in the specified order.
