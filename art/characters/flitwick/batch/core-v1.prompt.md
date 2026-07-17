# Flitwick Chapter Three gameplay batch v1

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
full-body drawings of one original tiny Charms professor. Arrange them in a
strict three-column by two-row grid on one perfectly flat, uniform cyan
background. Keep every figure entirely inside its own cell with generous empty
cyan between figures, all hair and both shoe soles visible, and one identical
ground line and body scale across all six panels. Do not draw grid lines,
labels, numbers, captions, arrows, borders, or text.

The professor is an original elderly magical teacher, not a portrait of a real
person and not based on a film actor. He is knee-high beside schoolchildren,
with compact picture-book proportions: a large expressive head, small sturdy
body, short articulated limbs, warm tawny complexion, lively hazel eyes,
silver-white swept hair, neat crescent moustache, softly pointed ears, rosy
cheeks, and an irrepressibly delighted smile. His silhouette must read clearly
at tiny gameplay scale. Dress him in original deep plum-and-midnight teaching
robes with a short layered coat, honey-gold piping, moss-green waistcoat,
cream cravat, soft charcoal trousers, and curled oxblood shoes. Give him a
short walnut wand with one simple brass ring. Include no readable insignia.

Match reference 1's richly painted opaque gouache-and-watercolor picture-book
finish: visible paper tooth, organic asymmetry, woven cloth grain, soft
dark-brown contour accents with varied weight, warm upper-left gold light, and
cool violet-blue shadow masses. Keep face construction, head size, hair,
moustache, ears, clothing, wand, palette, and proportions identical throughout.
Use shaped anatomy, coherent shoulders, elbows, wrists, fingers, knees, and
shoes rather than geometric puppet parts.

Use this exact panel order, read left-to-right within each row:

ROW 1:

1. neutral idle: upright front three-quarter pose facing slightly image-right,
   wand resting safely at his side, bright attentive expression;
2. talk A: the same upright pose and scale, eyes open, one hand making a small
   welcoming teaching gesture, mouth modestly open on a wide vowel;
3. talk B: the same upright pose and scale, eyes open, the gesture lowered,
   mouth in a distinct small rounded speaking shape.

ROW 2:

4. demonstrate: front three-quarter teaching pose, one foot on the lowest book
   of a small uneven three-book podium, wand tracing a clear gentle swish at
   shoulder height; the books contain no letters or markings;
5. wand cast: balanced energetic pose with wand extended upward and outward,
   free hand open, delighted concentration, no magical effect painted around
   the wand;
6. celebrate: both feet grounded, wand lowered safely, both arms opened in
   delighted surprise, broad joyful smile.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Each arm must end in its
correct anatomical hand through a continuous sleeve, cuff, wrist, palm, thumb,
and four coherent fingers. No copied, mirrored, swapped, floating, fused, or
backward hands; no extra fingers, duplicate limbs, or sleeve stumps. Preserve a
clear wand grip without merging the wand into fingers. Keep the book-stack
podium only in panel 4 and entirely separated from neighboring panels.

Reference 2 defines the background: a perfectly uniform removable cyan field
with no shadows, gradients, texture, floor plane, reflections, scenery,
classroom, furniture beyond panel 4's tiny book stack, extra people, creatures,
text, logo, watermark, signature, or border. Never use cyan in the character.
No cast shadow, cropped body part, menacing expression, photorealism, actor
likeness, film-specific costume, flat vector art, 3D render, plastic skin,
anime styling, pure black, pure white, or hard black ink. Return only the six
complete professor figures in the specified order.
