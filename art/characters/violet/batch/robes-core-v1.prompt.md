# Violet robes turnaround and core actions v1

Status: complete-sheet production candidate. The first oversized request that
embedded the 18 MB casual sheet returned an upstream HTTP 500 without an image.
The v2 request uses the same prompt with a compact pose-only copy. Review any
successful sheet as one coherent robed character set before slicing.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 4:3, 4K, PNG, one image

Input references, in order:

1. `art/characters/violet/robes/neutral-purple-v1.png` — exact robed Violet V8 identity, outfit construction, palette, and painted finish
2. `art/characters/violet/batch/guides/casual-core-v1-pose-reference.png` — compact pose language and profile-walk reference only

## Prompt

Use case: identity-preserve production character animation sheet.
Asset type: deterministic-slicing source for a children's storybook game.

Create one polished 4K character production sheet containing twelve complete,
separate full-body drawings of the exact robed Violet in reference 1. Arrange
them in a strict six-column by two-row grid on one perfectly flat uniform cyan
field. Every invisible cell has equal size and padding. Keep every figure fully
inside its own cell, feet visible, ground level consistent within each row, and
no figure touching or overlapping another. Do not draw grid lines, boxes,
labels, numbers, captions, arrows, or text.

Reference 1 is the identity and wardrobe authority. Preserve the same
six-year-old proportions, warm light-brown long messy hair, soft attached
wisps, brown eyes, rosy cheeks, dark-green rectangular glasses, slate trainers,
and near-black first-year robe with broad vivid purple lining, collar, cuffs,
front edges, and hem. Preserve the warm-white collar and small purple-and-gold
tie. The purple trim is one continuous separable material because runtime
recolors it to Violet's chosen fabric color. Reference 2 supplies only the
natural profile, walk, and action pose language; never replace the robe with the
casual outfit.

Across every panel Violet must be unmistakably the same child, with equal head
size, shoe size, hair length, glasses shape, robe proportions, trim width, and
rendering detail. Keep soft dark-brown contours and opaque
gouache-and-watercolor picture-book rendering. Never age her up, slim her down,
enlarge her eyes, change her haircut, remove her glasses, shorten the robe, or
redesign the trim.

Use this exact panel order, left-to-right:

TOP ROW:
1. upright front neutral;
2. upright three-quarter view facing image-left;
3. clean full profile facing image-right, robe and hood draping naturally;
4. walking toward image-right, contact frame with forward heel and trailing toe
planted, robe hem responding slightly, opposite arm swing;
5. walking toward image-right, balanced passing frame with trailing foot lifted
under the body, robe hem responding slightly, opposite arm swing;
6. walking toward image-right, complementary contact frame with the other leg
forward, robe hem responding slightly, opposite arm swing.

BOTTOM ROW:
7. robe presentation with both hands open and slightly out, proud delighted
expression, full trim clearly visible;
8. gentle dressing-room twirl toward image-left, robe hem flaring safely;
9. complementary twirl toward image-right, robe hem flaring safely;
10. neutral wand hold at her side in her right hand, correct grip;
11. confident chosen-wand cast diagonally upward, balanced stance and clear free
hand;
12. finale cheer with wand raised overhead and one foot lifted, exuberant but
stable.

Profile anatomy must genuinely turn, including nose, glasses, hair volume,
shoulders, robe opening, knees, and shoes. Walking weight sits over the planted
foot. Robe sleeves attach at the shoulders, hands remain complete, and the hem
never tangles with or hides both shoes. The wand is slim warm-brown wood and
appears only in panels 10 through 12.

The cyan field must be uniform and removable: no shadows, gradients, texture,
floor plane, reflections, scenery, magical effects, house crest, scarf, badge,
logo, decorative border, duplicate limbs, extra people, watermark, or
signature. Return only the twelve robed Violet figures in the exact grid order.
