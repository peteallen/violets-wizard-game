# Hagrid core gameplay batch v1

Status: first production candidate. Review the named usable subset before
deterministic slicing; unused malformed figures do not invalidate good panels.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 4:3, 4K, PNG, one image

Input references, in order:

1. `art/character-refs/hagrid.png` — accepted Hagrid identity, anatomy, outfit, palette, proportions, and painted finish
2. `art/guides/ch1-room-style-triptych.png` — minimum room-style reference for the game's gouache-and-watercolor texture, warm key light, and violet-blue shadow color

## Prompt

Use case: identity-preserving production character animation sheet.
Asset type: deterministic-slicing source for a premium children's storybook
game.

Create one polished 4K sheet containing exactly six complete, separate,
full-body drawings of the exact Hagrid in reference 1. Arrange them in a strict
three-column by two-row grid on one perfectly flat, uniform cyan background.
Keep every figure entirely inside its own cell with generous empty cyan between
figures, all hair and both boot soles visible, and one identical ground line and
body scale across all six panels. Do not draw grid lines, labels, numbers,
captions, arrows, borders, or text.

Identity is locked to reference 1. Preserve the same original middle-aged,
friendly half-giant: warm medium complexion; broad weathered face; large
characterful nose; hazel-brown eyes; heavy brows; ruddy cheeks; crooked warm
smile; thick unruly dark chestnut hair; magnificent layered chestnut beard;
massive rounded shoulders; barrel chest; huge relaxed hands; sturdy legs; and
oversized patchworked boots. Preserve his weathered umber field coat with broad
lapels, deep pockets, reinforced elbow patches, irregular hem, brass toggles,
dark forest-green waistcoat, muted plum neckerchief, and roomy brown trousers.
Keep the anchor's compact, broad, gentle-giant proportions rather than making
him lanky or literally twice human height: his runtime figure must be able to
fit beneath the game's ordinary room doorways while still reading as the
broadest adult in the cast.

Match reference 1's richly painted opaque gouache-and-watercolor picture-book
finish, soft dark-brown contour accents, dry-brush tooth, organic asymmetry,
leather wear, woven folds, layered hair locks, warm highlights, and cool
violet-blue shadows. Reference 2 is style and lighting guidance only; include
none of its rooms or furnishings. Preserve equal head size, beard length, coat
length, shoulder width, hand size, boot design, palette, and rendering detail
throughout the sheet. Keep him safe, dependable, warm, and gently scruffy, with
no resemblance to an actor or real person and no film-specific costume.

Use this exact panel order, read left-to-right within each row:

ROW 1 — stationary dialogue states, all in the same upright front
three-quarter pose facing slightly toward image-right, with both arms relaxed
beside the coat and both hands completely visible:

1. neutral: eyes open, mouth resting in his crooked welcoming half-smile;
2. blink: identical pose and expression to panel 1, changing only both eyelids
fully closed naturally;
3. talk A: identical body pose, eyes open, mouth modestly open on a friendly
wide vowel, beard parting naturally around the mouth.

ROW 2:

4. talk B: the same upright front three-quarter body pose and scale, eyes open,
mouth in a distinct smaller rounded speaking shape, beard parting naturally;
5. clean full right profile walking toward image-right, passing frame: weight
balanced over the planted leg, the other foot lifted beneath the body, natural
opposite arm swing, face and boots genuinely turned into profile;
6. clean full right profile walking toward image-right, contact frame: forward
heel planted and trailing toe planted, legs clearly separated, natural opposite
arm swing, face and boots genuinely turned into profile.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Draw Hagrid's anatomical
left arm ending in a true left hand and his anatomical right arm ending in a
true right hand, based on the character's own body rather than the viewer's
side of the image. Each hand must connect continuously through the correct
sleeve, cuff, wrist, palm, and knuckles. Show a believable thumb on the correct
side of each palm, with four coherent thick fingers; palms and knuckle backs
must face the direction required by that arm's relaxed pose or walking swing.
The two hands are distinct anatomical counterparts, never one copied, mirrored,
reused, reversed, swapped, or rotated hand. In the profile walk panels, preserve
correct hand ownership even where one hand is partly occluded; do not turn a
backward palm outward to make it more visible. No sleeve may end in a stump,
floating hand, backward wrist, duplicate thumb, fused fingers, or hidden hand.

Keep a visible neck/shoulder transition, plausible arm sockets, coherent
elbows, wrists, hips, knees, ankles, and boot direction in every figure. Walking
weight must sit over the planted foot. The profile head, nose, beard, coat,
hands, trousers, and boots must genuinely turn together; do not fake a profile
by sliding facial features or mirroring a front-facing body. Maintain one warm
upper-left key direction across the painted figures without changing anatomy.

The cyan field must be perfectly uniform and removable: no shadows, gradients,
texture, floor plane, reflections, scenery, furniture, doors, decorative
elements, props, wand, umbrella, weapon, magical effects, extra people,
animals, logos, watermark, or signature. No duplicate limbs, cropped boots,
detached anatomy, menacing expression, flat vector art, 3D render, plastic
skin, or anime styling. Return only the six complete Hagrid figures in the
specified order.
