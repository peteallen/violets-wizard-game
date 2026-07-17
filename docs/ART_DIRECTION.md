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

**Violet (the player):** long **warm light-brown** hair, *deliberately a little messy* — three or four soft hair-attached wisps that move with her walk (per the client: she prefers it messy; never spikes or antennae); warm brown eyes behind **dark-green rectangular glasses** (photo-matched, D37 — world and portrait states both wear them); rosy cheeks. She begins at home and shops for her wand in ordinary clothes: a high-contrast three-tone blue-violet soccer jersey, dark leggings, and slate trainers with a purple accent, deliberately separated from the bedroom’s softer purple furnishings. Madam Malkin’s is the earned costume change into a black first-year robe with her selected color visible across the broad lining, collar, cuffs, and hem, and her signature purple returning in the shoes and chosen trim. Violet V8 at `art/characters/violet/canonical/casual-approved.png` is the locked identity source; its SHA-256 is `68e9871ceecc32b9fbf50cbf36eecbae226eb184ad5337f67bbca2e53266e033`. Do not regenerate or reinterpret her neutral identity. Post-Sorting she gains the Gryffindor scarf while the confirmed robe color persists throughout.

**Cast silhouettes** stay instantly readable at gameplay scale: the half-giant guide is the broadest and tallest friendly adult, but his room-scale silhouette still fits beneath the authored doorway he uses; his great width, boots, coat, and posture sell the scale without breaking the room. The charms professor is knee-high with a book-stack podium; the potions master is a black column with a widow's peak; the villain is smoke-edged. Silhouette-first design, faces second.

**Portraits** (dialogue frames) use the same identity and face construction as the world frames, at the detail needed by the dialogue card. Generate and map only the speaking and expression states the current dialogue requests, framed in ornate gilt like castle paintings.

## UI: parchment, wax, and brass

Uncluttered but highly stylized — the HUD should look like objects from the world, not chrome:

- **Materials:** parchment cards with deckled edges, wax-seal buttons, brass/gold filigree trim, quill-drawn icons with ink texture.
- **The wand button** is her actual wand in a brass holster; **the satchel** is a leather school bag; **the quest star** is a small enchanted compass-star. Nothing on screen looks like software.
- Diegetic HUD objects appear only after Violet receives them in the story: the opening bedroom shows the quest compass, not an empty wand sheath or an as-yet-unowned satchel.
- **Spell cards** in the fan: parchment with the quill-drawn spell icon, the one-word name in a friendly rounded hand, and the spell's signature color as the wax seal.
- **Incantation ribbons & rune-tiles** (the learning layer): floating parchment ribbon with letter slots; letter tiles as small stone runes with gold-leaf letters that flip and chime into place; completed words ignite in the spell's color.
- **Caption chips:** cream parchment chip, large friendly rounded lettering (high contrast, ~44px virtual minimum), max three words, bottom-center above the HUD line.

Satchel controls and destination panels follow the same generated-prop pipeline as other raster UI: generate one textless object on a flat `#00ff00` field, keep the untouched source and prompt under `art/ui/satchel`, remove the key locally, and ship only the cropped WebP under `public/assets/art/ui/satchel`. Generated art reserves an explicit calm label rectangle; the runtime draws every word and state marker in that rectangle with `textAlign = 'center'` and `textBaseline = 'middle'`. A new or changed satchel layout is inspected in the browser and captured at both required sizes across the early Chapter One map, late Chapter One map, Chapter One cards, Chapter Two cards-only, and Chapter Three cards-only scenes.
- **Dialogue card:** one unrotated asymmetric deckled parchment, never a rolled scroll. The speaking portrait is physically attached half outside the edge nearest the on-screen speaker; the short caption is printed directly on the parchment; **Again** and advance are separate full-size wax/brass controls on the opposite edge. No nested caption box and no floating “bookend” curls.
- **Chapter preview:** preserve the painted hero image between a compact upper title plaque and one bottom action shelf. Preview actions never cover the title or focal painting, and decorative character/animal icons appear only when they communicate an action — never as corner filler.
- **Type:** one bundled open-license rounded storybook face (candidates: Baloo 2, Quicksand, or Andika — pick during Ch. 1 build; Andika is designed for early readers) — self-hosted, no CDN. Display flourishes get a second decorative face used *only* at title/chapter cards.
- **Motion language:** everything eases (no linear tweens); UI enters with a soft overshoot (`easeOutBack`); nothing flashes hard; reduced-motion swaps overshoots for fades.

## Effects

Particle sparkles, spell trails, candle flicker, dust motes in light shafts, firework bursts — all built from **pre-rendered soft-gradient sprites** (drawn once to small offscreen canvases at boot), object-pooled, hard-capped. Each spell owns a signature color + particle shape so casts are identifiable with the sound off. No `shadowBlur` or `ctx.filter` at runtime — glow is baked into the sprites (house performance rule).

## Screens of honor

Four moments get extra art budget because they carry the game's memory: the letter opening (Ch. 1), first sight of the castle over the lake (Ch. 2), the Mirror of Erised (Ch. 6), and the Expelliarmus finisher + feast (Ch. 8). These are the screenshots-in-her-head twenty years from now.
