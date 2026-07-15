# Wandmaker core dialogue batch v1

Status: first production candidate. Review the named usable subset before
deterministic slicing; unused malformed figures do not invalidate good panels.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 4:3, 4K, PNG, one image

Input references, in order:

1. `art/character-refs/wandmaker.png` — accepted exact Wandmaker identity,
   palette, outfit, and proportion anchor despite its documented provisional
   craft findings
2. `art/guides/ch1-room-style-triptych.png` — painterly room-style texture,
   key-light, and shadow-color guidance only

## Prompt

Use case: identity-preserving production character animation sheet.
Asset type: deterministic-slicing source for a premium children's storybook
game.

Create one polished 4K 4:3 image containing exactly four complete, separate,
full-body paintings of the exact Wandmaker in reference 1. Arrange them as a
clean two-column by two-row sheet on one perfectly flat, perfectly uniform cyan
background. Keep every figure entirely inside its own quadrant with generous
empty cyan separation, all hair wisps, arms, hands, trouser legs, and both shoe
soles complete and uncropped. Use the same body scale, head size, upright pose,
foot placement, and ground line in every panel. Do not draw grid lines, panel
borders, labels, numbers, captions, arrows, or any text.

Reference 1 locks identity, palette, outfit, and proportions exactly. Preserve
the same original very old, small, slight, kind Wandmaker: broad gently jowled
weathered face; large luminous pale silver-grey eyes with relaxed aged lids,
medium pupils, and small warm catchlights, never blue, hazel, or brown; wispy
flyaway silver-white hair around a high forehead; white tufty eyebrows; large
gentle ears; rosy cheeks; deep kind smile lines; and a warm knowing smile. Keep
him friendly, wise, quietly delighted, and safe for a young child, never creepy,
startled, severe, youthful, lanky, or actor-like.

Preserve the outfit identically in all four panels: dusty deep-plum waistcoat
with small cloth-covered buttons; soft cream shirt with sleeves rolled to the
elbows; loosely knotted dove-grey cravat; charcoal-brown trousers; worn
amber-brown leather shoes; and one soft yellow measuring tape draped around his
neck, with one tail hanging down each side of his chest in every panel. The tape
is wearable clothing here: keep it in the same place and length in every panel,
never put it in his hands, around his waist, or on the background. Do not add a
handheld wand or any other handheld prop.

All four panels use the exact same upright-neutral front three-quarter pose,
facing slightly toward image-right. Keep his spine vertical, chin level,
shoulders present and level, feet planted flat with toes only slightly turned
out, and weight balanced. Both arms hang naturally beside the body and both
small elderly hands rest relaxed against the outer thighs. The expressions are
the only intentional differences. Use this exact panel order:

TOP LEFT — neutral: eyes open and the warm knowing closed-mouth smile from the
identity anchor.

TOP RIGHT — blink: body, head, hair, outfit, hands, tape, and mouth identical to
top left, changing only both eyelids to a gentle natural closed blink.

BOTTOM LEFT — talk A: body, head, hair, outfit, hands, and tape identical to top
left; eyes open; mouth modestly open on a friendly wide vowel, with a small
natural dark mouth opening and lips moving without changing the jaw or identity.

BOTTOM RIGHT — talk B: body, head, hair, outfit, hands, and tape identical to
top left; eyes open; mouth in a clearly distinct, smaller rounded speaking
shape, visibly different from talk A while remaining gentle and restrained.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Draw his anatomical left
arm ending in a true left hand and his anatomical right arm ending in a true
right hand, based on his own body rather than the viewer's side of the image.
Each hand connects continuously through the correct cream sleeve, rolled cuff,
slender elderly forearm, wrist, palm, and knuckles. Keep both hands naturally
small, no larger than half his face. Show one believable thumb on the correct
side of each palm and four coherent gently curled fingers with soft separation.
The relaxed hands lie against the outer trouser thighs with the palm and dorsal
orientation naturally following each arm. They are distinct anatomical
counterparts, never one copied, mirrored, reused, reversed, swapped, rotated,
or turned backward. No sleeve stump, backward wrist, duplicate thumb, fused
mitten, claw, floating hand, oversized hand, hidden hand, or extra finger.

Match the richly painted gouache-and-watercolor room style, with visible paper
and dry-brush tooth, softly painted dark accents rather than hard ink outlines,
organic asymmetry, subtle woven fabric grain, worn leather detail, and softly
layered hair wisps. Reference 2 supplies only the painterly finish and light
story; include none of its rooms or furnishings. Light every figure from the
upper left with warm candle-gold highlights and clearly cool the shadow side of
skin, cream sleeves, plum waistcoat, trousers, hair undersides, and shoes into
violet-blue. Keep that key direction identical across all four figures. Avoid
airbrush-smooth skin, slick gradients, flat vector art, anime, 3D rendering, or
plastic surfaces.

The cyan field must be completely uniform and removable: no cast shadows,
contact shadows, gradients, texture, floor plane, reflections, scenery,
furniture, shelves, boxes, wands, magical effects, decorative marks, extra
people, animals, logos, watermark, or signature. No duplicate limbs, detached
anatomy, cropped shoes, malformed eyes, different outfits, different identities,
or differing body scales. Return only the four complete Wandmaker figures in
the specified order.
