# Violet v5 Lite part-sheet candidate

Status: **REJECTED before slicing** by the three-lens Art Director review. The
closed-eye head loses Violet's glasses; both heads remain beard-like busts with
no open neck channel; the torso and sleeved arms duplicate shoulder anatomy;
the arm pair has mismatched hands and no useful elbow or wrist articulation;
the feet are strongly ducked out; the jersey, hair palette, and painterly room
style drift. Do not slice or ship this candidate.

Model: `google/gemini-3.1-flash-lite-image`

Endpoint: OpenRouter `POST /images`

Requested output: 16:9, 1K, PNG, one image

Input reference: `art/character-refs/violet.png`, used only to preserve Violet's
face, glasses, hair identity, age, and painterly storybook treatment. The casual
soccer outfit and rig-ready part layout are defined below.

Generated: 2026-07-14. OpenRouter returned a 1376x768 JPEG despite the requested
PNG output. The verbatim response image is `sheet-v5-lite-raw.jpg`; its SHA-256
is `4d2e84aea8d8a32ec8a317d655ae5044e8af241ab8586371b1ae40ba5d9442b3`.
Usage was 2,159 prompt tokens and 1,120 image-completion tokens, costing
`$0.03413975`. Request metadata is recorded in
`sheet-v5-lite.metadata.json`; no credentials or response image bytes are
stored there.

## Prompt

Create a professional rig-ready cutout puppet part sheet for the same original
six-year-old girl shown in the supplied identity reference. Preserve her exact
recognizable face, warm medium-light complexion, warm brown eyes, rosy cheeks,
bright gentle smile, dark-green rectangular glasses, and long warm light-brown
wavy hair with a few soft hair-attached wisps. Translate her into her casual
outfit: a rich three-tone blue-violet soccer jersey with a white V collar, dark
plum leggings, and slate-purple sneakers. This is an original children's
storybook character, not an actor or film character.

Paint in premium children's picture-book gouache and watercolor: rich warm
color depth, soft painted dark-brown outlines, gentle paper texture, shaped
fabric folds, dimensional skin, and one consistent warm key light from the
upper left on every part. Use a completely flat pale-cream background with no
shadows, scenery, text, labels, borders, props, decorative marks, or extra
pieces. Arrange exactly EIGHT isolated parts in a clean two-row grid. Every
part must be fully visible, at one consistent body scale, separated from every
other part by a wide band of untouched cream background, and must not overlap
or touch another part.

The eight parts are these and only these:

First, one eyes-open head. It includes Violet's face, crown hair, and natural
side locks, but it is a riggable HEAD rather than a bust. The central area
directly below the jaw must remain visibly open so that a separate neck can be
seen when assembled. Do not paint a beard-shaped curtain or pointed wedge of
hair beneath the chin. The side hair may descend beside the neck, never across
the center of the neck or collar.

Second, one eyes-closed head that is pixel-compositionally identical to the
open head except for the eyelids. Keep the same glasses, hair, outline, face,
smile, size, and lighting. It must have the same open central neck channel.

Third, one back-hair piece, shaped to sit behind the head, shoulders, and upper
torso. It is only the rear curtain of long wavy hair, with a broad rounded
upper silhouette and a shallow central lower edge. It contains no face, no
neck, no chest, and no beard-like point.

Fourth, one front-facing torso. It has a short but unmistakably visible skin
neck rising naturally from the white V collar. The jersey body ends at two
clean rounded shoulder sockets and HAS NO SLEEVES and no arms. The shoulders
are level and childlike, not sloped or hunched.

Fifth, one complete LEFT arm painted independently. It begins with the full
left purple puff sleeve and continues through a naturally shaped upper arm,
an unmistakable but gentle elbow, a forearm, a small wrist, and a relaxed child
hand. It hangs beside the body. The shoulder-to-elbow and elbow-to-wrist
lengths are nearly equal. The elbow aligns with the waist, the wrist with the
hip, and the fingertips with the upper-to-middle thigh. Fingers rest together
and point down. Include a correctly placed thumb. The arm is not a straight
tapered tube.

Sixth, one complete RIGHT arm with the same anatomy and pose, independently
painted rather than a flipped copy. Its silhouette mirrors the left arm, but
its highlights and shadows still come from the same upper-left light in image
space. The palm orientation and thumb must be anatomically correct for the
right hand.

Seventh, one separate LEFT leg from hip to shoe, straight and weight-bearing,
in a dark plum legging with a planted slate-purple sneaker angled only slightly
outward.

Eighth, one separate RIGHT leg matching the left leg's height and design, also
straight and weight-bearing, with its sneaker angled only slightly outward.

Treat the joins as an engineered asset contract. Both arm tops need clean,
rounded shoulder attachment edges of equal size. Both leg tops need clean,
matching hip attachment edges. The head must clearly expose the central neck
connection. All anatomy must look plausible when assembled into an upright
neutral six-year-old child with a balanced stance, level shoulders, arms beside
the outer thighs, visible neck, and a picture-book head-to-body proportion of
about one to three and a quarter. Do not add a full assembled figure. Do not
duplicate any torso, head, arm, or leg. Do not fuse the legs. Do not put sleeves
on the torso. Do not hide the neck with hair. Do not splay the hands. Do not
bend the wrists outward. Do not create extra fingers, extra limbs, antenna-like
hair arcs, a bob haircut, washed-out pastel colors, flat vector art, 3D render,
or malformed anatomy.
