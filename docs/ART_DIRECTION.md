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

House accent sets (scarf, banner, common room grading) defined per house when the Sorting decision lands.

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

- **No people or creatures in backgrounds** — characters are code-drawn on top; a painted figure would break the layering and the style seam.
- **No text in backgrounds** — generated lettering is always mangled; signs are added as code-drawn overlays where needed.
- **Consistent key light** (warm, upper-left) across all rooms so code-drawn characters can bake one rim-light direction.
- **Walkable band kept visually calm** — the prompt pins the floor to the bottom quarter; hotspot furniture lives at band height or just above.
- Every prompt, seed, raw output, and accepted final is committed under `art/` with a regeneration script — rooms must be reproducible and re-editable months later (house pattern).
- Generate 3–4 candidates per room, pick one, log the choice. Style drift between chapters gets caught by eyeballing the full room contact sheet (`art/contact-sheet.html`, a build artifact).

## Characters: code-drawn vector puppets

Characters are drawn in canvas as layered part-puppets (body, head, hair, arms, wand, accessories) with bone-lite tweening — walk bob, idle sway, head-turns toward whatever was tapped, blink cycles, big readable emotes (jump-for-joy, tumble, giggle).

“Vector” is an implementation medium, not a license to simplify the cast. Finished puppets use shaped anatomy, overlapping hair/fur/feather masses, articulated hands and shoes, facial structure, brows and eyelids, clothing folds, material accents, asymmetry, expressive posture, and secondary motion. No final character may read as a stack of geometric primitives, a low-poly model, or a placeholder at gameplay scale. The hero owl establishes the floor for the entire cast: layered feathers, distinct facial disks, eye tracking, blinking, breathing, head turns, wing articulation, hops, perching, flight, and companion-follow behavior.

Owls recur as a personal motif for Violet wherever the fiction supports them: post, pets, brass hardware, wax seals, satchel clasps, maps, letters, chapter pages, and keepsakes. The motif should make the game feel made specifically for her without becoming repeated decorative clutter.

Why code-drawn against painted rooms: full control of Violet's exact look, animation without a spritesheet pipeline, crisp at any DPR, and instant iteration. The two layers are stitched together by a shared treatment:

- **Soft dark-brown outlines** (`#3a2d22`, ~2.5px virtual, slightly varying weight), never black.
- Flat-ish fills with one soft shading pass + the baked rim-light matching the rooms' key light.
- Proportions: big heads (~1:3.5), small bodies, stubby limbs — picture-book kid proportions, matching the backgrounds' whimsy.

**Violet (the player):** long **warm light-brown** hair, *deliberately a little messy* — three or four soft hair-attached wisps that bounce on the walk cycle (per the client: she prefers it messy; never spikes or antennae); warm brown eyes behind **dark-green rectangular glasses** (photo-matched, D37 — the puppet and portrait both wear them); rosy cheeks. She begins at home and shops for her wand in ordinary clothes: a three-tone purple soccer jersey, dark leggings, and purple sneakers. Madam Malkin’s is the earned costume change into a black first-year robe with her selected color visible across the broad lining, collar, cuffs, and hem, and the same purple sneakers peeking out. The accepted reference sheet `art/character-refs/violet.png` remains the canonical face, hair shape, glasses, and robed-look target, but D44’s warmer runtime hair color supersedes the sheet’s cooler tone. Post-Sorting she gains the house scarf; the confirmed robe color persists throughout.

**Cast silhouettes** stay instantly readable at gameplay scale: the half-giant guide is twice everyone's height and width; the charms professor is knee-high with a book-stack podium; the potions master is a black column with a widow's peak; the villain is smoke-edged. Silhouette-first design, faces second.

**Portraits** (dialogue frames) are larger, more detailed head-and-shoulders renders of the same puppets — same parts, higher detail tier — framed in ornate gilt like castle paintings, with two or three frames of mouth/eyebrow animation while speaking.

## UI: parchment, wax, and brass

Uncluttered but highly stylized — the HUD should look like objects from the world, not chrome:

- **Materials:** parchment cards with deckled edges, wax-seal buttons, brass/gold filigree trim, quill-drawn icons with ink texture.
- **The wand button** is her actual wand in a brass holster; **the satchel** is a leather school bag; **the quest star** is a small enchanted compass-star. Nothing on screen looks like software.
- **Spell cards** in the fan: parchment with the quill-drawn spell icon, the one-word name in a friendly rounded hand, and the spell's signature color as the wax seal.
- **Incantation ribbons & rune-tiles** (the learning layer): floating parchment ribbon with letter slots; letter tiles as small stone runes with gold-leaf letters that flip and chime into place; completed words ignite in the spell's color.
- **Caption chips:** cream parchment chip, large friendly rounded lettering (high contrast, ~44px virtual minimum), max three words, bottom-center above the HUD line.
- **Dialogue card:** one unrotated asymmetric deckled parchment, never a rolled scroll. The speaking portrait is physically attached half outside the edge nearest the on-screen speaker; the short caption is printed directly on the parchment; **Again** and advance are separate full-size wax/brass controls on the opposite edge. No nested caption box and no floating “bookend” curls.
- **Chapter preview:** preserve the painted hero image between a compact upper title plaque and one bottom action shelf. Preview actions never cover the title or focal painting, and decorative character/animal icons appear only when they communicate an action — never as corner filler.
- **Type:** one bundled open-license rounded storybook face (candidates: Baloo 2, Quicksand, or Andika — pick during Ch. 1 build; Andika is designed for early readers) — self-hosted, no CDN. Display flourishes get a second decorative face used *only* at title/chapter cards.
- **Motion language:** everything eases (no linear tweens); UI enters with a soft overshoot (`easeOutBack`); nothing flashes hard; reduced-motion swaps overshoots for fades.

## Effects

Particle sparkles, spell trails, candle flicker, dust motes in light shafts, firework bursts — all built from **pre-rendered soft-gradient sprites** (drawn once to small offscreen canvases at boot), object-pooled, hard-capped. Each spell owns a signature color + particle shape so casts are identifiable with the sound off. No `shadowBlur` or `ctx.filter` at runtime — glow is baked into the sprites (house performance rule).

## Screens of honor

Four moments get extra art budget because they carry the game's memory: the letter opening (Ch. 1), first sight of the castle over the lake (Ch. 2), the Mirror of Erised (Ch. 6), and the Expelliarmus finisher + feast (Ch. 8). These are the screenshots-in-her-head twenty years from now.
