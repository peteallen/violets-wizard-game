# Trevor held pose replacement v2

Status: non-shipping replacement candidate for numeric validation and separate
visual review. Do not replace the production frame before approval.

Workflow: Codex built-in image generation, exactly one call.

Input reference:

1. `art/characters/trevor/batch/core-v1.png` — reference only for Trevor's
   established identity, proportions, anatomy, palette, skin texture,
   storybook painting style, and flat cyan extraction field. It is a six-pose
   sheet, but the requested output is one pose, not another sheet.

## Prompt

Use case: identity-preserve.
Asset type: single production-source character pose for a premium children's
storybook game, prepared for deterministic cyan-background extraction.
Input images: Image 1 is the sole identity and style reference. Preserve the
same Trevor, but generate a new single held pose; do not reproduce the sheet or
its grid.

Create exactly one complete drawing of Trevor on one square source canvas.
This is a single isolated character pose, not a character sheet, not a panel,
not a sequence, and not multiple variants. Center the one connected toad with
generous clear cyan padding on every side. Keep his complete silhouette safely
inside the canvas. Trevor should occupy about two-thirds of the square's width
and height so that his scale matches the individual square cells in Image 1.

Preserve Trevor's established identity exactly: a plump, lovably indignant
young toad with a broad moss-olive body, warm russet and golden-ochre mottling,
a creamy throat, amber-brown eyes with horizontal pupils, softly pebbled skin,
short sturdy legs, long expressive toad toes, and the same compact proportions
as Image 1. Preserve the same richly painted opaque gouache-and-watercolor
picture-book finish, visible paper tooth within the painted toad, organic
asymmetry, layered skin tones, soft dark-brown contour accents with varied
weight, warm upper-left golden light, and cool muted violet shadow masses.
Trevor is friendly and appealing, never slimy, grotesque, frightening, plastic,
photorealistic, flat-vector, anime, or 3D-rendered.

Pose Trevor tucked safely into a compact sitting curl suitable for resting
between a child's two cupped hands, but draw no human hands. His body is gently
rounded, his eyes look upward, both rear legs are visibly and naturally folded
along the sides of his body, and both front legs bend naturally with their two
separate front feet resting close together. The front feet must read as two
ordinary attached toad feet with coherent toes. They must not interlock,
clasp, pray, imitate human fingers or hands, or form a heart shape.

ANATOMY AND CONNECTIVITY ARE HARD ACCEPTANCE CONSTRAINTS. Trevor has exactly
two front legs and exactly two rear legs, all four coherently jointed and
physically attached to the body. Every visible foot has distinct, attached
toad toes consistent with Image 1. No duplicated, fused, severed, detached, or
floating limbs; no mammal paws; no human-like hands; no extra eyes. The entire
painted Trevor, including all toes and markings, must form one connected
foreground component against the cyan field.

Preserve the small pale crescent marking above Trevor's left eye, but paint it
directly onto and physically attached to the brow skin. Surround the crescent
on all sides with Trevor's painted brow; there must be no cyan pixel, cyan
outline, cyan gap, halo, cutout, or empty background between the crescent and
his brow. The crescent is a flat skin marking, never a floating, raised, or
detached object.

Scene/backdrop: perfectly flat, solid, uniform `#01F4FD` cyan for local
background removal. The cyan field must be one exact-looking color from edge
to edge, with no gradient, texture, paper grain, vignette, lighting variation,
floor plane, alcove, reflection, contact shadow, or cast shadow. Do not use
cyan, teal, or turquoise anywhere on Trevor or inside his silhouette.

Constraints: exactly one Trevor and one pose; one connected foreground
component; crisp complete extractable silhouette; generous cyan margin; no
human hands, people, other animals, props, scenery, flies, flowers, effects,
motion marks, text, labels, numbers, grid lines, borders, logo, watermark,
signature, detached marking, cast shadow, contact shadow, or cropped toes.
Return only the one complete Trevor held pose on the perfectly flat cyan field.
