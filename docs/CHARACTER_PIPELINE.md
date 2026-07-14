# Character production pipeline

The unit of production is a complete playable character, not an isolated frame.
Each character moves from one coherent source sheet set into the real game in one
short pass, and only defects that remain visible in play earn another art
generation.

## One model and one identity

Every production character sheet and every later production refinement uses
`google/gemini-3.1-flash-image` through `google-vertex/global`. There is no
silent model or provider fallback and no automatic retry. A provider failure is
surfaced; a deliberate new request may use the same exact route.
Prompts, source images, model details, hashes, and provenance stay under
`art/characters/<character>/`; only reviewed runtime assets ship under
`public/assets/art/characters/`.

Violet is the exception to creating a new identity during this pass because her
identity is already decided. The exact pixels in
`art/characters/violet/canonical/casual-approved.png` are Violet V8, the locked
canonical design selected by Pete. Her production sheet is generated as an edit
derived from that image, and the unchanged neutral artwork remains the identity
reference. Its SHA-256 is
`68e9871ceecc32b9fbf50cbf36eecbae226eb184ad5337f67bbca2e53266e033`.
Do not regenerate, reinterpret, or “improve” neutral Violet.

## Generate the whole character together

Before generation, inventory every way normal gameplay currently shows the
character: world scale, dialogue portrait, facing directions, expressions,
outfits, carried props, locomotion, and story actions. Generate one large,
clearly separated multi-panel sheet at a consistent scale and ground line. If
the model's practical sheet capacity requires it, add the smallest coherent
supplemental sheet needed for the remaining states rather than restarting a good
primary sheet. A proposed shipping figure must be extractable without another
figure attached to it. Perfect equal cells are not the product: deterministic
connected-component isolation may remove neighboring debris, and unused malformed
figures do not invalidate an otherwise usable batch.

The inventory comes from the current renderer and Chapter One content, not from
a universal pose wish list. Violet needs the directions, walk, dialogue,
celebration, tumble, wand, and robe-shop states that her playable scenes already
request. Each NPC and animal gets only its own requested locomotion, dialogue,
delivery, follow, selection, hint, or celebration states. Do not create
speculative poses for hypothetical later scenes.

Keeping the views and actions in one or a few coherent batch generations gives
the model the best chance
to preserve face construction, proportions, clothing, line, palette, and prop
scale across the set. Do not turn the first sheet into a frame-by-frame mask and
compositing project. If none of the required figures are usable, regenerate the
sheet as a unit. Otherwise name the usable production subset, record any missing
normal-game state, and move the usable work into the game.

## Review once at the meaningful source boundary

A fresh Art Director reviews the proposed shipping panels across the complete
batch before any slicing or shipping, following `docs/ART_DIRECTOR.md`. The review
judges identity across selected views, action readability, age and emotional
readability, room-style fit, scale, anchors, and whether normal gameplay is
covered. The verdict names the accepted subset and any blocking correction.
Violet’s review treats V8 as the decided identity, not as an invitation to reopen
her proportions. Defects in unused panels do not block integration.

There is no separate review gate for every face, arm, leg, or animation frame.
The proposed shipping subset across the batch is the single generated-art review unit.

## Slice deterministically and integrate immediately

After the proposed shipping subset passes, slice its known panel rectangles
with deterministic local tooling. Slicing may isolate connected components,
remove the sheet background, normalize selected figures to a common scale,
place them on the shared transparent canvas, clean extraction edges, apply a
review-prescribed opaque-art donor repair to a matte defect, and record ground,
portrait, hand, prop, and other runtime anchors. It may not generatively repaint
or reinterpret the figure. The character manifest must map every state the
current game requests and must fail visibly in development if a state is
missing rather than silently returning to the legacy puppet.

Hook the complete character into its real rooms, dialogue, movement, and story
actions immediately. A standalone sheet or harness is not a finished
character. Preserve save data and simulation determinism while the renderer
changes, and keep the game playable as each member of the cast lands.

Capture the assembled character in its registered harness and in-world context
at 1280×720 and 2560×1440, then have a fresh Art Director perform the required
assembled visual review. This is a single character-level review, not a new
per-frame loop.
Refine only defects that are visible in these captures or during play, using
`google/gemini-3.1-flash-image` through `google-vertex/global` again. Prefer a
targeted correction when one panel is genuinely broken; do not reopen approved
identity or polish hidden source details that players cannot see.

Run `npm run build`, commit, and push after each complete green character so the
GitHub Pages build becomes the main feedback surface rather than an art-folder
preview.

## Completion

A character is complete when the reviewed sheet covers every state the current
game requests, deterministic slices and anchors are in the production manifest,
the real game uses them for world and portrait rendering without a legacy-art
fallback, both required capture sizes have passed assembled Art Director review,
and the full build is green. Chapter One is complete only when this is true for
Violet, Hagrid, the Wandmaker, Madam Malkin, the Menagerie keeper, the narrator
portrait, the post owl, the cat, the pet owl, and the pet toad.
