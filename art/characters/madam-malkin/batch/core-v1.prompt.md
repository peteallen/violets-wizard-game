# Madam Malkin core dialogue batch v1

Status: inspected production source. The accepted shipping subset is the
top-left neutral figure, top-row second blink figure, bottom-left talk A figure,
and bottom-row third talk B figure. They keep one coherent identity, outfit,
scale, ground line, anatomy, and warm-upper-left light. The unselected duplicate
alternatives remain provenance-only and do not ship.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 4:3, 4K, PNG, one image

Input references, in order:

1. `art/character-refs/tailor.png` — accepted exact Madam Malkin identity,
   palette, outfit, and proportion anchor despite documented provisional craft
   findings
2. `art/guides/ch1-room-style-triptych.png` — painterly room-style texture,
   upper-left key-light, and violet-blue shadow guidance only

## Prompt

Use case: identity-preserving production character animation sheet.
Asset type: deterministic-slicing source for a premium children's storybook
game.

Create one polished 4K 4:3 image containing exactly four complete, separate,
full-body paintings of the exact Madam Malkin in reference 1. Arrange them as a
clean two-column by two-row sheet on one perfectly flat, perfectly uniform cyan
background. Keep every figure entirely inside its own quadrant with generous
empty cyan separation, all hair wisps, arms, hands, skirt hems, and both boot
soles complete and uncropped. Use the same body scale, head size, upright pose,
foot placement, and ground line in every panel. Do not draw grid lines, panel
borders, labels, numbers, captions, arrows, or any text.

Reference 1 locks identity, palette, outfit, and proportions exactly. Preserve
the same original plump, motherly, middle-aged witch tailor: round rosy face;
warm hazel-brown eyes with small warm upper-left catchlights; gentle laugh
lines; softly dimpled cheeks; short broad nose; warm busy smile; and auburn hair
with broad silver streaks swept into a soft loose bun with a few escaping wisps.
Keep her brisk, kind, warmly confident, quietly delighted to fuss, and safe for
a young child, never stern, creepy, severe, glamorous, youthful, or actor-like.

Preserve the outfit identically in all four panels: deep heather-purple work
dress with a high soft collar, fitted stitched bodice, rolled sleeves, and a
full below-knee skirt; warm cream bib apron with continuous shoulder straps, a
waist tie, and one wide divided front pocket; one small white stick of tailor's
chalk and one small light-brown wooden ruler with tick marks only inside the
pocket; one plump tomato-red pincushion worn like a bracelet at her left wrist;
and sturdy plum lace-up leather ankle boots. Keep the apron, pocket tools,
pincushion, laces, and boot color present in every panel. Do not add a handheld
wand, fabric, scissors, measuring tape, jewelry, hat, glasses, or any other
prop.

All four panels use the exact same upright-neutral front three-quarter pose,
facing slightly toward image-right. Keep her spine vertical, chin level,
shoulders relaxed and level, feet planted flat with toes only slightly turned
out, and weight balanced. Both arms hang naturally beside the body and both
small hands rest relaxed against the outer skirt and apron. The expressions are
the only intentional differences. Use this exact panel order:

TOP LEFT — neutral: eyes open and the warm closed-mouth smile from the identity
anchor.

TOP RIGHT — blink: body, head, hair, outfit, hands, tools, pincushion, and mouth
identical to top left, changing only both eyelids to a gentle natural closed
blink.

BOTTOM LEFT — talk A: body, head, hair, outfit, hands, tools, and pincushion
identical to top left; eyes open; mouth modestly open on a friendly wide vowel,
with a small natural dark mouth opening and lips moving without changing her
jaw or identity.

BOTTOM RIGHT — talk B: body, head, hair, outfit, hands, tools, and pincushion
identical to top left; eyes open; mouth in a clearly distinct, smaller rounded
speaking shape, visibly different from talk A while remaining gentle and
restrained.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Draw her anatomical left
arm ending in a true left hand and her anatomical right arm ending in a true
right hand, based on her own body rather than the viewer's side of the image.
Each hand connects continuously through the correct purple rolled sleeve,
forearm, wrist, palm, and knuckles. Keep both hands naturally small, no larger
than half her face. Show one believable thumb on the correct side of each palm
and four coherent gently relaxed fingers with soft separation. The relaxed
hands lie against the outer skirt with the palm and dorsal orientation
naturally following each arm. The pincushion sits at the left wrist without
swallowing or replacing the hand. The hands are distinct anatomical
counterparts, never one copied, mirrored, reused, reversed, swapped, rotated,
or turned backward. No sleeve stump, backward wrist, duplicate thumb, fused
mitten, claw, floating hand, oversized hand, hidden hand, or extra finger.

Match the richly painted gouache-and-watercolor room style, with visible paper
and dry-brush tooth, soft dark-brown contour accents that dissolve into painted
edges rather than hard ink outlines, organic asymmetry, subtle woven fabric
grain, worn leather detail, and softly layered hair locks. Reference 2 supplies
only the painterly finish and light story; include none of its rooms or
furnishings. Light every figure from the upper left with warm candle-gold
highlights and clearly cool the shadow side of skin, cream apron, purple dress,
hair underside, and boots into violet-blue. Keep that key direction identical
across all four figures. Avoid mechanical dot screens, airbrush-smooth skin,
slick gradients, flat vector art, anime, 3D rendering, or plastic surfaces.

The cyan field must be completely uniform and removable: no cast shadows,
contact shadows, gradients, texture, floor plane, reflections, scenery,
furniture, shelves, mirrors, mannequins, fabric bolts, magical effects,
decorative marks, extra people, animals, logos, watermark, or signature. No
duplicate limbs, detached anatomy, cropped boots, malformed eyes, different
outfits, different identities, or differing body scales. Return only the four
complete Madam Malkin figures in the specified order.
