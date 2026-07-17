# Friendly Ghost Chapter Three gameplay batch v1

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
full-body drawings of one original unnamed friendly castle ghost. Arrange them
in a strict three-column by two-row grid on one
perfectly flat, uniform cyan background. Keep every figure entirely inside its
own cell with generous empty cyan between figures, all hair and the complete
wispy tail visible, and one identical body scale and tail baseline across all
six panels. Do not draw grid lines, labels, numbers, captions, arrows, borders,
or text.

The character is an original warm male bibliophile ghost, not a portrait of a real
person and not based on a film actor. He has a large kind oval head, gently
arched brows, lively dark-violet eyes, a long friendly nose, soft silver-lilac
side curls, small curled moustache, and an attentive smile. His compact upper
body tapers into one broad curling spectral tail instead of legs. Dress him in
an old-fashioned parchment-cream scholar's coat with lavender shadows,
ruffled collar, plum waistcoat, and a tiny unlettered brass bookmark pin. His
entire figure is painted as pale luminous parchment, pearl-lilac, and muted
violet layers with warm honey rims. He should feel softly spectral but remain
opaque and saturated enough for clean cyan extraction; never use cyan,
turquoise, or blue-green in his body, glow, eyes, or clothing.

Match reference 1's richly painted opaque gouache-and-watercolor picture-book
finish: visible paper tooth, organic asymmetry, woven cloth grain, soft
dark-brown-violet contour accents with varied weight, warm upper-left gold
light, and cool violet shadow masses. Keep face construction, head size, curls,
moustache, clothing, tail shape, palette, and proportions identical throughout.
Use shaped anatomy, coherent shoulders, elbows, wrists, and fingers rather than
geometric puppet parts. His mood is cozy, wistful, and gently funny, never
horror-dark.

Use this exact panel order, read left-to-right within each row:

ROW 1:

1. ambient idle: upright floating front three-quarter pose facing slightly
   image-right, hands loosely folded, tail curled beneath him, kind half-smile;
2. talk A: same floating pose and scale, eyes open, one hand making a small
   storytelling gesture, mouth modestly open on a wide vowel;
3. talk B: same floating pose and scale, gesture softened, mouth in a distinct
   small rounded speaking shape.

ROW 2:

4. emerge: leaning forward as if rising through a wall portrait, both hands on
   an invisible lower ledge, shoulders and complete curling tail still visible,
   welcoming surprised expression; draw no portrait frame, wall, or ledge;
5. listening reward: one hand over his heart and the other offering one small
   blank chocolate-frog-style card outward; the card has no picture, lettering,
   number, logo, or readable mark;
6. delighted listen: both hands clasped warmly near his chest, head tilted,
   bright grateful smile, complete curled tail.

HANDS ARE A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Each arm must end in its
correct anatomical hand through a continuous sleeve, cuff, wrist, palm, thumb,
and four coherent fingers. No copied, mirrored, swapped, floating, fused, or
backward hands; no extra fingers, duplicate limbs, or sleeve stumps. In panel 5
the offering hand and blank card must remain connected and wholly within the
cell. Do not draw detached glow particles that could become unwanted extracted
components.

Reference 2 defines the background: a perfectly uniform removable cyan field
with no shadows, gradients, texture, floor plane, reflections, scenery, wall,
portrait frame, books, furniture, extra people, creatures, text, logo,
watermark, signature, or border. Never use cyan in the ghost. No cast shadow,
cropped tail, skeleton, chains, horror, menace, photorealism, actor likeness,
film-specific costume, flat vector art, 3D render, plastic skin, anime styling,
pure black, pure white, or hard black ink. Return only the six complete
friendly ghost figures in the specified order.
