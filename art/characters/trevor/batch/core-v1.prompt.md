# Trevor Chapter Three gameplay batch v1

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

Create one polished 4K sheet containing exactly six complete, separate drawings
of one original storybook toad named Trevor. Arrange them in a strict
three-column by two-row grid on one perfectly flat, uniform cyan background.
Keep every toad entirely inside its own cell with generous empty cyan between
figures, at one consistent body scale except for the explicitly airborne hop,
and with a consistent baseline for grounded panels. Do not draw grid lines,
labels, numbers, captions, arrows, borders, or text.

Trevor must be visually distinct from any generic player pet. He is a plump,
lovably indignant young toad with a broad moss-olive body, warm russet and
golden-ochre mottling, creamy throat, amber-brown eyes with horizontal pupils,
one small pale crescent marking above his left eye, softly pebbled skin, short
sturdy legs, and long expressive toes. Avoid teal, turquoise, or cyan anywhere
on him. His silhouette is compact and instantly readable at very small gameplay
scale. He is never slimy, grotesque, frightening, or realistic enough to feel
unfriendly.

Match reference 1's richly painted opaque gouache-and-watercolor picture-book
finish: visible paper tooth, organic asymmetry, layered skin tones, soft
dark-brown contour accents with varied weight, warm upper-left gold light, and
cool muted violet shadow masses. Keep eye spacing, crescent marking, body width,
leg shapes, toe count, mottling, palette, and proportions identical throughout.
Use coherent toad anatomy with two front legs and two rear legs in every fully
visible pose.

Use this exact panel order, read left-to-right within each row:

ROW 1:

1. neutral idle: grounded three-quarter view facing image-right, body settled,
   eyes open, mildly suspicious but friendly expression;
2. hidden eyes: the same crouched silhouette and scale rendered in deep
   desaturated indigo-violet shadow, with only his two warm amber reflective
   eyes, pale crescent marking, and a faint readable rim on his back clearly
   visible; keep the full toad silhouette opaque enough for clean extraction;
3. croak: same three-quarter body and scale, throat pouch round and gently
   expanded, mouth slightly open, eyes bright and indignant.

ROW 2:

4. hop: full toad airborne in a compact forward hop toward image-right, rear
   legs extended naturally behind and front feet reaching forward, every toe
   visible, no motion trail or effect;
5. held: body tucked safely into a compact sitting curl appropriate for resting
   between a child's two cupped hands, front feet together, rear legs folded,
   eyes looking up; draw no human hands;
6. reunion: grounded alert pose with front body lifted proudly, one front foot
   raised, broad relieved expression, same exact identity.

ANATOMY IS A HARD ACCEPTANCE CONSTRAINT IN EVERY PANEL. Preserve exactly two
front legs and two rear legs with coherent joints and believable feet. Each
visible foot has distinct attached toes; no duplicated, fused, detached, or
floating limbs, no mammal paws, and no extra eyes. The hop pose must remain one
connected extractable figure. The hidden-eyes pose must retain a full connected
body silhouette rather than isolated floating eyes.

Reference 2 defines the background: a perfectly uniform removable cyan field
with no shadows, gradients, texture, floor plane, reflections, scenery,
alcoves, hands, people, extra animals, flies, flowers, text, logo, watermark,
signature, or border. Never use cyan in Trevor. No cast shadow, cropped toes,
horror, photorealism, film-specific design, flat vector art, 3D render, plastic
skin, anime styling, pure black, pure white, or hard black ink. Return only the
six complete Trevor figures in the specified order.
