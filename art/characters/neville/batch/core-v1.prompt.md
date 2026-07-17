# Neville Chapter Three gameplay batch v1

Status: first production candidate. Review the named usable subset before
deterministic slicing; unused malformed figures do not invalidate good panels.

Model: `google/gemini-3.1-flash-image`

Provider: `google-vertex/global`

Endpoint: OpenRouter `POST /images`

Requested output: 4:3, 4K, PNG, one image

Input references, in order:

1. `art/guides/ch1-room-style-triptych.png` — the game's painterly storybook
   texture, warm key light, violet-blue shadow color, and soft dark-brown edge
   treatment only
2. `art/guides/flat-cyan-chroma.png` — the exact flat extraction background

## Prompt

Use case: identity-preserving production character animation sheet.
Asset type: deterministic-slicing source for a premium children's storybook
game.

Create one polished 4K sheet containing exactly six complete, separate,
full-body drawings of one original sweet first-year magical-school boy. Arrange
them in a strict three-column by two-row grid on one perfectly flat, uniform
cyan background. Keep every figure entirely inside its own cell with generous
empty cyan between figures, all hair and both shoe soles visible, and one
identical ground line and body scale across all six panels. Do not draw grid
lines, labels, numbers, captions, arrows, borders, or text.

The boy is an original storybook classmate, not a portrait of a real person and
not based on a film actor. He is a little older and taller than the young player
character but still unmistakably a child, with a large round head, small soft
body, short limbs, warm fair skin with freckles, round hazel eyes, tousled
chestnut-brown hair, softly prominent ears, and an earnest face that can wobble
without becoming frightening. Dress him in original black-plum school robes
with a muted burgundy lining, warm oatmeal sweater, soft grey trousers, striped
gold-and-russet scarf, and scuffed brown lace-up shoes. No crest, letters, or
readable insignia. He carries no wand or prop.

Match reference 1's richly painted opaque gouache-and-watercolor picture-book
finish: visible paper tooth, organic asymmetry, knitted wool and woven cloth
grain, soft dark-brown contour accents with varied weight, warm upper-left gold
light, and cool violet-blue shadow masses. Keep face construction, head size,
hair, freckles, ears, clothing, palette, and proportions identical throughout.
Use shaped anatomy, coherent shoulders, elbows, wrists, fingers, knees, and
shoes rather than geometric puppet parts.

Use this exact panel order, read left-to-right within each row:

ROW 1:

1. neutral idle: upright front three-quarter pose facing slightly image-right,
   hands resting loosely together, shy hopeful half-smile;
2. talk A: same upright pose and scale, eyes open, one hand making a small
   sincere request, mouth modestly open on a wide vowel;
3. talk B: same upright pose and scale, hand lowered, mouth in a distinct small
   rounded speaking shape.

ROW 2:

4. tearful but not panicked: shoulders slightly drawn inward, eyebrows lifted,
   eyes glossy with one restrained tear, mouth trembling softly, hands held
   together; he remains safe, calm enough to ask for help, and never distraught;
5. relieved: shoulders released, one hand over his heart, warm grateful smile,
   eyes still a little damp;
6. reunion hold: kneeling comfortably on one knee, torso upright, both hands
   cupped together just below his chest as if gently holding a small toad. Draw
   no toad or other object; leave a clear cyan pocket between and just above his
   hands so the separate Trevor character can be layered there at runtime.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Each arm must end in its
correct anatomical hand through a continuous sleeve, cuff, wrist, palm, thumb,
and four coherent fingers. No copied, mirrored, swapped, floating, fused, or
backward hands; no extra fingers, duplicate limbs, or sleeve stumps. In panel 6
the cupped hands must form a believable cradle while remaining visibly distinct
and leaving the central cyan pocket free.

Reference 2 defines the background: a perfectly uniform removable cyan field
with no shadows, gradients, texture, floor plane, reflections, scenery,
classroom, furniture, books, toad, extra people, creatures, text, logo,
watermark, signature, or border. Never use cyan in the character. No cast
shadow, cropped body part, panic, sobbing, photorealism, actor likeness,
film-specific costume, flat vector art, 3D render, plastic skin, anime styling,
pure black, pure white, or hard black ink. Return only the six complete boy
figures in the specified order.
