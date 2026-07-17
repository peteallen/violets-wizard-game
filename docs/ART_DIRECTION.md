# Art Direction

## The style in one sentence

**Warm storybook illustration** — painterly gouache/watercolor, soft edges, candlelit golds against deep night blues — like the best picture-book rendition of a magic school, seen as theater-stage dioramas. NOT film-realism. NOT flat vector minimalism. Cozy-Ghibli-adjacent wonder.

## Palette

| Role | Colors | Notes |
|---|---|---|
| Warm light | candle gold `#e8b44f`, honey `#f4d58d`, firelight orange `#d98a3d` | The emotional temperature of the game; every room has a warm source |
| Night | deep blue `#1b2a4a`, twilight violet `#3a2d5e`, ink `#141126` | Night is velvet and inviting, never horror-dark |
| Stone & wood | warm stone `#8a7a66`, aged oak `#5e4634`, parchment `#f0e3c8` | The castle's body |
| Interaction accent | **one** gold shimmer `#ffd76a` with soft white core | The single "you can touch this" color, used for nothing else |
| Violet herself | hair unmistakably **warm light-brown** `#9b7654` with chestnut shadow, eyes warm brown `#5a3d28`, **dark-green rectangular glasses**, robe black `#26222e` with her selected lining/scarf-trim, purple sneakers | D44 supersedes D37’s cooler hair tone after it read gray in play; D37’s photo-matched glasses remain; purple is her signature (it's her name) pre-Sorting |

Gryffindor is Violet's canonical post-Sorting house. Its scarf, banners, and common-room grading are the Chapter Two production target; the exact storybook scarlet-and-gold palette is set during that chapter's art detail pass. Other house accent sets are deferred until deliberately needed.

## Rooms: AI-generated painted backgrounds

Generated via OpenRouter (`google/gemini-3.1-flash-lite-image` per the family model registry), 16:9 at 2048×1152, one painting per room (some rooms have day/night or before/after variants).

**The locked style-prefix** — every room prompt starts with the same block to hold the style together:

> *"Children's storybook illustration, painterly gouache and watercolor, soft edges and gentle texture, warm candlelit golds against deep night blues, cozy magical atmosphere, richly detailed but uncluttered, straight-on side view like a theater stage set, floor plane along the bottom quarter of the frame, no people, no creatures, no text or lettering."*

Beyond single-painting rooms, the pipeline produces (see [SET_PIECES.md](SET_PIECES.md) for how each is used):

- **Layered paintings** — sky/midground/stage slices generated separately for parallax and reveal-behinds (lake vista, broom flight, behind the brick wall, behind the portrait door).
- **Seasonal variants** — same-seed re-prompts of map and key exteriors (autumn/Halloween/winter/spring/summer) so the year visibly turns; landmark silhouettes must stay aligned across variants.
- **Cinemagraph overlays** — translucent loose layers (fog wisps, dust shafts, candle-glow washes) that code drifts as rigid layers over the painting; ≤2 per room.
- **Standalone portrait paintings** — small framed character portraits (original faces, storybook style) that the living-castle rig brings to life with code-drawn tracking eyes and slice-nudged mouths.
- **State variants** — before/after paintings (wrecked/repaired bathroom, shut/open apertures generated shut with the open state's reveal painted behind).

Rules learned from the sibling pipelines:

- **No people or creatures in backgrounds** — characters render from separate transparent production art on top; a figure baked into a room would break the layering and the style seam.
- **No text in backgrounds** — generated lettering is always mangled; signs are added as code-drawn overlays where needed.
- **One authored key light per room**: warm upper-left is the painting/character-sheet default, while explicit room metadata records visible exceptions such as the bedroom’s strong right-window light. Character sheets and any required directional variants must agree with the room instead of carrying a contradictory universal edge.
- **Walkable band kept visually calm** — the prompt pins the floor to the bottom quarter; hotspot furniture lives at band height or just above.
- Every prompt, seed, raw output, and accepted final is committed under `art/` with a regeneration script — rooms must be reproducible and re-editable months later (house pattern).
- Generate 3–4 candidates per room, pick one, log the choice. Style drift between chapters gets caught by eyeballing the full room contact sheet (`art/contact-sheet.html`, a build artifact).

### The room is a stage

Every gameplay room is composed as the stage of the current story beat, not as
wallpaper behind an interface. The painting establishes one readable focal
group, a calm walkable floor band, clear entrances and exits, and enough
negative space for the cast to act without silhouettes tangling together. The
authored key light and the room's strongest contrast lead the eye to the story;
the interface may support that hierarchy but may not establish a competing
center of attention.

Characters, moving props, affordances, effects, and interface remain separate
layers over that stage. Persistent controls stay at the corners. A dialogue
card, choice, objective reminder, or short-lived state object occupies available
edge space and protects the active speaker's face and body, Violet, the current
objective, and the route she needs to use. The dialogue card therefore chooses
its side from live actor placement and sits opposite the on-screen speaker. A
small overlay should appear mounted to a room surface or attached to the thing
it describes; it must not turn the painted room into a generic modal backdrop.

A full-screen surface is reserved for a physical object Violet has deliberately
opened, such as her satchel, a readable letter, or the grown-up panel. Returning
from it restores the same stage. At both required review sizes, the room must
still read clearly with the interface removed, and the interface must leave the
same protected story areas unobscured when it is present.

## Characters: painted full-frame animation

Characters are generated as coherent multi-view and core-action sheets, sliced
deterministically onto aligned transparent canvases, and selected by the runtime
for movement, dialogue, and story actions. The active production workflow is
[CHARACTER_PIPELINE.md](CHARACTER_PIPELINE.md): derive only the states normal
gameplay requests, use one or the smallest few coherent batch sheets, review the
source set once, integrate it immediately, and review the assembled character in
the game once.

Every character sheet and refinement uses
`google/gemini-3.1-flash-image` through `google-vertex/global`, with no model or
provider fallback or automatic retry. Finished characters use shaped anatomy,
overlapping
hair/fur/feather masses, articulated hands and shoes, facial structure, brows
and eyelids, clothing folds, material accents, asymmetry, expressive posture,
and readable secondary motion. No final character may read as a stack of
geometric primitives, a low-poly model, or a placeholder at gameplay scale. The
hero owl establishes the floor for the entire cast: layered feathers, distinct
facial disks, eye tracking, blinking, breathing, head turns, wing articulation,
hops, perching, flight, and companion-follow behavior.

Owls recur as a personal motif for Violet wherever the fiction supports them: post, pets, brass hardware, wax seals, satchel clasps, maps, letters, chapter pages, and keepsakes. The motif should make the game feel made specifically for her without becoming repeated decorative clutter.

The character and room layers are stitched together by a shared treatment:

- **Soft dark-brown outlines** (`#3a2d22`, ~2.5px virtual, slightly varying weight), never black.
- Layered base, shadow, and highlight planes on every material + the baked rim-light matching the room's authored key light.
- A soft, room-toned contact shadow anchors every full-body character at its feet and every persistent diegetic HUD object to the surface behind it; character shadows are drawn in floor space before body bob, hop, tilt, or sway, so nobody floats and no shadow rides upward with its character.
- Proportions: big heads (~1:3.5), small bodies, stubby limbs — picture-book kid proportions, matching the backgrounds' whimsy.

**Violet (the player):** long **warm light-brown** hair, *deliberately a little messy* — three or four soft hair-attached wisps that move with her walk (per the client: she prefers it messy; never spikes or antennae); warm brown eyes behind **dark-green rectangular glasses** (photo-matched, D37 — world and portrait states both wear them); rosy cheeks. She begins at home and shops for her wand in ordinary clothes: a high-contrast three-tone blue-violet soccer jersey, dark leggings, and slate trainers with a purple accent, deliberately separated from the bedroom’s softer purple furnishings. Madam Malkin’s is the earned costume change into a black first-year robe with her selected color visible across the broad lining, collar, cuffs, and hem, and her signature purple returning in the shoes and chosen trim. In world scenes she is the youngest and smallest human: clearly shorter than the older Hogwarts children and every adult, while dialogue portraits remain face-first close-ups rather than literal height comparisons. Violet V8 at `art/characters/violet/canonical/casual-approved.png` is the locked identity source; its SHA-256 is `68e9871ceecc32b9fbf50cbf36eecbae226eb184ad5337f67bbca2e53266e033`. Do not regenerate or reinterpret her neutral identity. Post-Sorting she gains the Gryffindor scarf while the confirmed robe color persists throughout.

**Cast silhouettes** stay instantly readable at gameplay scale: the half-giant guide is the broadest and tallest friendly adult, but his room-scale silhouette still fits beneath the authored doorway he uses; his great width, boots, coat, and posture sell the scale without breaking the room. The charms professor is knee-high with a book-stack podium; the potions master is a black column with a widow's peak; the villain is smoke-edged. Silhouette-first design, faces second.

**Portraits** (dialogue frames) use the same identity and face construction as the world frames, at the detail needed by the dialogue card. Generate and map only the speaking and expression states the current dialogue requests, framed in ornate gilt like castle paintings.

## UI: Violet's Field Kit

The shared interface language is **Violet's Field Kit**: a small collection of
storybook school, travel, and magical objects that feel as if they belong to
her. It is uncluttered but richly made. A new surface may introduce a new prop,
but it may not invent a new visual meaning for a material or reuse a familiar
object for an unrelated action. Nothing on screen should look like software
chrome wearing a parchment color.

The implementation and upgrade status of every player-facing family is kept in
[UI_ASSET_INVENTORY.md](UI_ASSET_INVENTORY.md); that inventory does not weaken
the material and state rules below.

### Material semantics

**Blackberry leather means containers and navigation.** It forms the satchel,
folio, page furniture, and bookmarks that hold content or move between sibling
views. **Parchment means story, labels, and choices.** It carries words, readable
objects, choice cards, and calm caption fields. **Aged brass means mechanisms,
frames, and grown-up utilities.** It belongs to working hinges, holsters,
portrait mounts, advance controls, and the grown-up keyhole. **Wax means closure
and confirmation.** A seal closes, continues, accepts, or confirms; it does not
silently become page navigation.

**Woven cloth means ceremony and house identity.** Ribbons, banners, scarves,
and ceremonial markers use cloth rather than borrowing ordinary control
materials. **Muted burgundy leather means serious or destructive utility.** It
sets a guarded action such as starting over apart from ordinary navigation
without turning the whole interface alarming. **Enchanted gold means only the
current objective or the instant of activation.** Brass highlights, honey
paper, and ordinary trim may stay warm, but the magical gold shimmer is never a
generic selected, decorative, or unavailable state.

### One meaning, one object

The same meaning uses the same object family wherever it appears, and one
object family does not change jobs to fit a convenient space. A bookmark moves
between sibling pages; parchment presents story, a label, or a choice; a wax
control closes or confirms; and a brass mechanism operates a tool. The sole
close action is always the same wax **X**, and that X never means **Start over**.
Optional narration always uses the same speaker control. The current objective
always comes from the same enchanted compass, whether Violet is asking what to
do or the map is showing where to go. A state stamp, check, flag, or star reports
state and is not a second hidden button. Decorative flourishes never accept
input, and interactive objects never masquerade as corner decoration.

### Component anatomy and the live boundary

Every field-kit component has one physical shell with a readable material and
silhouette, one semantic mark that explains its job without prose, a calm
aperture for any live label, portrait, or content, a separate live state layer,
and a contact shadow or mounting detail that anchors it. Its forgiving input
area may extend beyond the painted silhouette, but remains at least 88×88
virtual pixels and never overlaps a neighboring action. A component owns one
action; attached controls such as **Again** and advance remain visibly and
mechanically separate. Nested caption boxes, fake buttons, and ornamental hit
targets are not component anatomy.

Generated art owns stable material, silhouette, texture, and non-changing
ornament. The runtime owns **all text, state, portraits, and routes**. It draws
those live layers into deliberate blank or transparent apertures, using the
same state that handles input and saving. No generated asset bakes in a place
name, caption, current destination, completion mark, availability, selection,
progress, portrait, or path. This boundary lets the shell be repainted without
changing behavior and prevents a beautiful prop from lying about Violet's live
state.

### Named interaction states

The complete visual vocabulary is **rest, pressed, selected, unavailable,
focus, busy, success, error, and destructive**. These names describe different
meanings and must not be substituted for one another. Objective guidance is a
separate salience layer, so an ordinary selected control never borrows its
enchanted gold.

**Rest** shows the object's normal material and grounded shadow. **Pressed**
settles the object toward its surface and compresses its contact shadow; it
gives immediate feedback without requiring an animation. **Selected** is a
persistent current choice or page and uses a plum inset, stitch, or equivalent
material change, never enchanted gold. **Unavailable** changes the physical
story of the object: it is closed, fogged, folded, tied, or pocketed rather than
merely greyed out, and it cannot shimmer or accept activation.

**Focus** is the explicit accessibility exception. Keyboard or assistive focus
uses a high-contrast honey-and-violet indicator that may be cleaner and more
geometric than the surrounding illustration. It is exempt from the bans on
abstract rings, perfect geometry, and non-material outlines because finding the
active control matters more than preserving the illusion. It appears only when
focus is meant to be visible, layers additively over rest or selected, and is
never replaced by enchanted gold.

**Busy** keeps the object recognizable while a visible mechanism, fold, or
progress treatment explains that input is temporarily being handled; repeated
activation is blocked. **Success** gives a brief, material acknowledgement such
as a settled seal, check, or stitch and then yields to the new live state.
**Error** uses a warm ink or burgundy correction with a clear recovery path,
never a harsh red flash or a false success mark. **Destructive** uses muted
burgundy leather and an explicit confirmation step. It never borrows the close
X, selected plum, or enchanted objective gold.

Pressed feedback remains immediate under reduced motion: the component may
step directly to its settled pose and back, while entrances and state changes
use fades instead of overshoot or travel. Focus, unavailable, busy, success,
error, and destructive meaning may never depend on motion alone.

### Recurring field-kit components

The wand control is Violet's actual wand in a brass holster, the satchel is her
blackberry-leather school bag, and the quest control is her enchanted compass.
Diegetic HUD objects appear only after Violet receives them in the story: the
opening bedroom shows the quest compass, not an empty wand sheath or an
as-yet-unowned satchel.

Spell cards are parchment with a quill-drawn spell icon, a runtime one-word
name in a friendly rounded hand, and the spell's signature color at the wax
seal. Incantation ribbons and rune tiles form the learning layer: a parchment
ribbon holds the live letter slots, while stone runes with gold-leaf runtime
letters flip and chime into place and the completed word ignites in the spell's
signature color. Caption chips are cream parchment with large, high-contrast
rounded lettering, approximately 44 virtual pixels minimum and no more than
three words, placed bottom-center above the HUD line.

Satchel controls, destination panels, the static open-folio background, and
card holders follow the same generated-prop pipeline as other raster UI.
Chroma-keyed props are generated textless on flat `#00ff00`; full-screen
backgrounds are generated without controls, text, or state. Untouched sources,
exact prompt records, and deterministic processing live under `art/ui`; only
processed WebP derivatives ship under `public/assets/art/ui`. Generated art
reserves explicit calm label or portrait apertures. A new or changed satchel
layout is inspected in the browser and captured at both required sizes across
the early Chapter One map, late Chapter One map, Chapter One cards, Chapter Two
cards-only, and Chapter Three cards-only scenes.

The dialogue card is one **unrotated asymmetric deckled parchment**, never a
rolled scroll. The speaking portrait is physically attached half outside the
edge nearest the on-screen speaker; the short runtime caption is printed
directly on the parchment; **Again** and advance are separate full-size
wax/brass controls on the opposite edge. The whole component shifts to the side
opposite the live speaker. There is no nested caption box, hand-placed rotation,
or floating “bookend” curl. A warm-dark parchment variant belongs in night
rooms without changing this anatomy.

Chapter previews preserve the painted hero image between a compact upper title
plaque and one bottom action shelf. Preview actions never cover the title or
focal painting, and decorative character or animal icons appear only when they
communicate an action, never as corner filler. Type uses one bundled
open-license rounded storybook face, self-hosted with no CDN; display flourishes
use a second decorative face only on title and chapter cards. Everything eases
rather than moving linearly, interface entrances use a soft overshoot, nothing
flashes hard, and reduced motion replaces overshoot with a fade.

## Effects

Particle sparkles, spell trails, candle flicker, dust motes in light shafts, firework bursts — all built from **pre-rendered soft-gradient sprites** (drawn once to small offscreen canvases at boot), object-pooled, hard-capped. Each spell owns a signature color + particle shape so casts are identifiable with the sound off. No `shadowBlur` or `ctx.filter` at runtime — glow is baked into the sprites (house performance rule).

## Screens of honor

Four moments get extra art budget because they carry the game's memory: the letter opening (Ch. 1), first sight of the castle over the lake (Ch. 2), the Mirror of Erised (Ch. 6), and the Expelliarmus finisher + feast (Ch. 8). These are the screenshots-in-her-head twenty years from now.
