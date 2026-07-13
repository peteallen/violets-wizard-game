# Set Pieces & the Technique Toolbox

This document exists because of a tight line: **don't squash the imagination, and don't promise imagination we can't pull off.** Every magical moment in [CHAPTERS.md](CHAPTERS.md) is specified here as a composition of *proven, verifiable techniques*. An engineer (human or agent) building a set piece follows this spec exactly; if a desired moment can't be expressed in the toolbox, we redesign the moment or run a prototype spike first — we never improvise new rendering tech mid-chapter.

## The one law

> **If it moves, we drew it. If it's still, it's painted.**

Painted backgrounds are *never* animated, warped, or partially redrawn. Anything that moves — characters, props, doors, bricks, letters, flames, reflections — lives in the code-drawn layer or in a **source-cropped piece of painting** that code moves as a rigid tile. This is why the art rule "no people, no creatures, no text in backgrounds" is load-bearing: it's not a style preference, it's the animation architecture. The painting is the stage; everything on the stage is ours.

## Render layer stack (every room, every frame)

1. **Room cache** — painted background + static dressing, composited once to an offscreen canvas on room entry (see ARCHITECTURE.md).
2. **Behind-band props** — code-drawn props that characters can walk in front of.
3. **Characters & pets** — puppet layer, y-sorted.
4. **Front props & effects** — spell bolts, held items, sliced-tile animations.
5. **Lighting overlay** — darkness/glow compositing (only when a scene uses it).
6. **UI** — HUD, dialogue, ribbons.

Set pieces are choreography across layers 2–5 plus camera moves. The painting never changes within a scene; scene-wide changes (day→dusk, wrecked→repaired) are **crossfades between two paintings** under a particle flourish.

## The toolbox

### T1 — free, use anywhere
| Technique | Definition |
|---|---|
| Particles | Pooled sprites stamped from pre-rendered gradient canvases; hard cap ~300 |
| Camera | `{x, y, zoom}` tweened by script; shake = damped noise on x/y |
| Puppets | Layered part-transforms (translate/rotate/scale per part), path fills, tween library of named poses |
| Darkness & light | Full-screen dim overlay; light sources punch soft holes (`destination-out` radial gradients); glow washes via `screen` blend |
| Crossfade | Two paintings drawn with ramping `globalAlpha` |
| Freeze & flash | Sim pause with effects layer live; full-screen white/color flash with eased alpha |

### T2 — cheap, costs an asset or an authored prop
| Technique | Definition |
|---|---|
| Painting variants | Before/after or day/night versions of a room, generated together for consistency, crossfaded |
| Layered paintings | Background generated as 2–3 separately-generated slices (sky / midground / stage) for parallax or reveal-behind |
| **Sliced-tile animation** | A region of a painting (or a dedicated painted texture) cut into a grid via `drawImage` source-rects; each tile animated as a rigid quad (position/rotation/alpha). Source rects are integer-aligned with 1px inset gutters to prevent edge bleeding |
| Scripted props | Hand-authored vector props with purpose-built animation: the folding letter (3 hinged quads), the shattering vase (6–8 pre-authored shard polygons + gravity), the swaying feather (sine + noise), doors (rigid slice rotating on a hinge) |
| Canvas lettering | `fillText` with the bundled storybook font (loaded and awaited before first render); gold-leaf fills via gradient, never on the painting itself |

### T3 — flagship set pieces, budget ≈ one per chapter
Each T3 moment gets: its own spec section below, a named harness scene, a keyframe-strip + GIF review, and a prototype spike if it's the first use of its technique. T3s are compositions of T1/T2 with tighter choreography — they contain **no unique rendering technology**, only unique direction.

### Explicitly out of bounds
WebGL, shaders, DOM/CSS animation, video files, skeletal IK, physics engines, animating the painted pixels themselves (warps, meshes, displacement). If a moment seems to need one of these, the moment gets redesigned.

**Banned APIs (red-team verified against iPad Safari):** `ctx.filter` (still *disabled by default* in Safari through current versions — it will silently no-op; ALL blur/glow is baked into sprites at build/load time), `shadowBlur` (10–100× per-shape cost), per-frame `createRadialGradient`/`createLinearGradient`/pattern construction (CPU-side gradient realization is disproportionately expensive in WebKit — build once, cache, stamp via `drawImage`), and `getImageData` anywhere in the frame loop (forces a GPU→CPU readback stall). CI greps for these.

**Frame budget:** at most **5 full-screen-equivalent passes per frame** (each pass at DPR 2 touches ~3.9Mpx; the room blit + crossfade partner + darkness overlay + its composite + one wash is already the ceiling). The darkness overlay runs at **half resolution** and scales up on composite — visually identical for soft low-frequency darkness, 75% cheaper. Light holes are punched by stamping one pre-rendered feathered-hole sprite at per-light scale, never by constructing gradients per frame.

---

## Set-piece specifications

Format: **Moment · Composition · Assets · Beats · Verify** (illusion checklist for the reviewing agent) · **Fallback** (the simpler version that still lands if review fails).

### SP-01 `letter` — The letter arrives (Ch. 1) — T2

**Moment:** Owl taps window; letter drops; VIOLET glows on the envelope; tap her name; seal breaks; letter unfolds; narrator reads.
**Composition:** Owl = puppet (perch pose, tap-beak pose, flap-off). Window = painted; the *opening* casement is a rigid painted slice on a hinge (generated with the window shut; the open state reveals painted sky already behind it via the layered painting). Letter = scripted prop: envelope quad + wax-seal sprite + name lettering (canvas text, gold); unfold = 3 hinged quads opening in sequence (0.9s, `easeOutBack` on the last fold). Seal break = crack sprite swap + 12-particle burst.
**Assets:** bedroom painting (2 layers: room / sky-behind-window), owl puppet, letter prop, seal sprites, SFX (tap-tap, seal crack, paper).
**Beats:** owl taps ×2 (loop until tapped) → flutter to sill → letter slides out (0.6s) → name shimmer loop → [tap] seal crack + burst → unfold → camera push-in 12% over 2s while narrator reads.
**Verify:** name legible at iPad size in keyframe t=2.0; unfold quads never intersect visually; seal burst stays ≤ letter bounds ×1.5; push-in doesn't reveal painting edges.
**Fallback:** unfold → simple scale-up + crossfade to open-letter sprite.

### SP-02 `brick-wall` — Diagon Alley opens (Ch. 1) — T3 FLAGSHIP

The canonical answer to "are we really going to animate that?" Yes — like this, and only like this.

**Moment:** The Guide taps bricks; the wall shivers, then unfolds outward brick by brick from a center point; Diagon Alley blazes through the growing opening; camera pushes through.
**Composition — three stacked assets, one animated grid:**
1. *Reveal painting:* Diagon Alley street (the Ch. 1 street room's own painting — reused, no extra asset).
2. *Courtyard frame painting:* the dingy courtyard, generated with a **large flat brick wall filling the center** (prompt pins this) — drawn as the top layer.
3. *The animated grid:* an authored 10×8 grid defines the wall region. The courtyard painting remains one decoded image: each moving tile uses the nine-argument `drawImage` source-crop form with a 3px source gutter and ~1% destination overlap. **Do not allocate a canvas per brick.** That would violate the global five-canvas WebKit budget even though each canvas is small. The overlapping source crops keep the painted mortar and surface detail attached to each moving rigid tile without creating 80 backing stores. Tiles that have not begun moving are not redrawn at all, so the intact wall is pixel-quiet before the shiver. Animation: tiles rotate away and slide outward+back with `easeInOutCubic`, ordered by distance from the tap point (center-out wave, 60ms distance stagger), each fading during the last 20% of its travel. **The intact wall painting stays drawn beneath the moving crops**, and the Diagon Alley painting is clipped into only the source cells whose tiles have departed — so the growing hole is real and any residual seam shows wall pixels, never an unchanged wall or a premature full-screen reveal.
**Dust particles** at each tile's departure edge; low rumble + brick-clack ticks synced to the stagger; camera: hold 0.5s → slow 8% push during the wave → 1.2s push-through crossfading courtyard→street room.
**Assets:** courtyard painting (center wall), authored grid bounds, rumble/clack SFX. ~2.5s total, 80 tiles = at most 80 transformed source-crop `drawImage` calls/frame at peak (well inside the draw-call budget and with zero additional tile canvases; brick-slicing looks *intentional* because bricks are rectangles).
**Beats:** t0 Guide tap-tap-tap (puppet) → t0.4 wall shiver (grid jitters ±2px) → t0.8 wave starts at tap brick → t2.2 last tile gone → t2.4 camera push-through begins → t3.6 street room active.
**Verify (keyframe strip at t = 0, 0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.2):** no background bleed at tile seams at rest (t=0 must be pixel-quiet — the wall must look *unsliced* before it moves); wave reads center-out; no tile crosses another mid-flight into visual mush; reveal painting alignment — street horizon level sits consistent through the hole; dust stays local; final frame is clean street room.
**Fallback:** wall splits as two large hinged slices (double-door style) + heavy dust cover — still magical, 1/10th the choreography.
**Spike:** this is prototype spike SP-A in M1 (see ROADMAP) — built against a placeholder painting before the real one is generated.

### SP-03 `wand-chaos` — Ollivanders (Ch. 1) — T2

**Moment:** Two wrong wands cause escalating comic chaos; the third erupts golden.
**Composition:** All chaos is props: paper stack = 15 fluttering quad sprites (rotation noise + drift); vase = vector prop with 7 pre-authored shard polygons, shatter = shards fly with gravity + bounce-once (also the Reparo teaching asset in Ch. 5 — same shards reverse-interpolate home); shelf wobble = painted shelves stay still, a *code-drawn* box stack on top wobbles (2-part puppet). Wand 3: screen-wide warm `screen`-blend wash + particle column + camera 6% push + music swell.
**Verify:** shards never leave the room bounds; wash doesn't clip to white (peak alpha ≤ 0.65); chaos props all settle (nothing left mid-air at end state).
**Fallback:** skip shards; papers + wobble only, vase pre-broken.

### SP-04 `barrier` — Platform 9¾ (Ch. 2) — T1
Run at the wall: Violet puppet sprint pose toward painted pillar → 0.2s before contact, full-screen white flash (eased) covering a room swap → she stumbles comically into frame on the platform side. The joke is the *cut*, not a through-wall effect. **Verify:** flash fully opaque exactly at swap frame. **Fallback:** none needed (this is the floor).

### SP-05 `lake-vista` — first sight of the castle (Ch. 2) — T2
Pure layered-painting moment: sky layer, castle-on-cliff layer, lake layer; boats = props drifting; slow 20s drift-zoom (Ken Burns) + firefly particles + the score's big chord. No interaction; it just *holds*. **Verify:** layer parallax coherent (near moves more than far); no layer edge exposed at max drift. **Fallback:** single painting, same music, still holds.

### SP-06 `sorting-hat` — the Hat (Ch. 2) — T2
Hat = puppet on Violet's head-anchor: brim = mouth (classic), crease = eyebrows; talking = brim flap synced to voice amplitude buckets (precomputed per line at generation time, stored beside the clip — no runtime audio analysis). House announcement: banner props unfurl (vertical scale ease) + house-color particle burst + common-room crossfade later. **Verify:** brim sync within ±100ms of syllable peaks on the strip; hat never detaches from head anchor during her idle sway. **Fallback:** fixed 8Hz brim flap while line plays.

### SP-07 `feather` — Wingardium Leviosa (Ch. 3) — T2
Feather prop: sine-sway rise with noise drift, gold swirl particles orbiting (parametric circle + rise). Class = 3 NPC puppets + painted classroom. The *incantation ribbon* (GAME_DESIGN learning layer) runs first — UI layer, rune tiles chime in. **Verify:** feather path smooth (no teleports between keyframes); ribbon text legible at iPad scale. **Fallback:** feather rises on a straight ease; still reads.

### SP-08 `lumos-darkness` — the darkness system (Ch. 3, 6, 7) — T1 (system)
Overlay canvas **at half resolution** (scaled up on composite — per the frame budget rules above): dim fill (navy, alpha 0.82 — *velvet*, never black); each light source (wand tip, candles, Trevor's eyes) punches a soft hole by stamping the shared pre-rendered feathered-hole sprite via `destination-out` at per-light scale; hole radii breathe (slow sine). Hidden hotspots simply don't render their glow until inside a hole radius — discovery is geometric, testable headlessly. **Verify:** dim level leaves room silhouettes readable (agent checks a no-light keyframe: castle shapes discernible, per the "cozy-night not horror" rule); holes feather softly (no hard edges). **Fallback:** none needed — single-technique system.

### SP-09 `broom-flight` — flying (Ch. 4, 7) — T2
Layered sky painting (3 slices, parallax); Violet-on-broom puppet with banking lean (rotation follows velocity); rings = torus sprites with front/back halves drawn on separate layers so she passes *through* them; finger-position control with critically-damped smoothing (no physics fight). **Verify:** parallax ratios (far:mid:near ≈ 0.2:0.5:1.0) visible across keyframes; ring pass-through layering correct (front arc occludes her). **Fallback:** single-layer sky; rings become flat hoops she overlaps.

### SP-10 `fluffy` — the three-headed dog (Ch. 4) — T2
One body puppet, three head puppets on neck anchors; sleep = staggered breathing scale loops (phase-offset so heads never sync — sells "three creatures"); snore particles (musical Zzz glyphs — canvas text sprites); near-wake = one eye-lid part opens + music sting + the kids' flee poses. Comic, zero threat mechanics. **Verify:** breathing phase offsets visible in strip; eye-open frame lands with the sting (audio marker in harness log). **Fallback:** two heads visible, one implied off-frame (cheaper, still funny).

### SP-11 `troll` — the encounter (Ch. 5) — T2 (encounter framework)
Troll = 4× kid-scale puppet; club = separate part (the Leviosa target — detaches to a prop when cast); telegraphs = wind-up poses held 300ms with color flash + horn blast (dual-coded); club-over-head hover = prop float loop; bonk = squash-stretch head + circling-stars sprite + floor shake (camera y-noise 0.4s). **Verify:** telegraph poses distinguishable at a glance in single keyframes (agent must correctly name which attack is telegraphed from the still alone — if the agent can't, a 6-year-old can't); club-as-prop swap seamless (no double-club frame). **Fallback:** N/A — this IS encounter framework v1; if it fails review, the framework isn't done.

### SP-12 `reparo-bathroom` — fixing the bathroom (Ch. 5) — T2
Wrecked→repaired painting crossfade, but staged: each Reparo cast reverse-scatters one authored shard-prop group (sink, mirror, tiles — the vase shards pattern reused ×3) and *then* a masked region of the crossfade completes behind a sparkle burst. Three casts, three regions, done. **Verify:** crossfade regions don't ghost (no half-broken double-exposure outside the active region); shard reverse paths match forward-scatter paths reversed. **Fallback:** single full-room crossfade under one big sparkle cover.

### SP-13 `potion` — potions class (Ch. 6) — T2
Cauldron = prop (bubble particle emitter + surface ellipse with hue lerp per ingredient); jars = props with parchment labels (canvas text); recipe card = UI panel with pictograms + numerals; stir = circle-gesture detection (angle accumulation ≥ 540° at any speed, direction-agnostic — maximum forgiveness); wrong ingredient = colored smoke plume + cauldron raspberry + recipe re-show. **Verify:** label words legible on iPad-size capture; smoke plume alpha never obscures the recipe card; hue states distinguishable for 3 recipe stages. **Fallback:** stir gesture becomes tap-the-spoon ×3.

### SP-14 `cloak` — invisibility sneak (Ch. 6) — T1
Violet puppet at 0.35 alpha + slow shimmer edge (outline stroked with animated dash offset); prefect puppets patrol fixed paths with visible lantern holes (darkness system); "spotted" = she auto-ducks behind a code-drawn prop (giggle SFX) until lantern passes — unfailable by construction. **Verify:** her silhouette at 0.35 alpha still readable against the darkest room region (check every night painting); duck animation never clips through the hiding prop. **Fallback:** raise alpha to 0.5 + stronger shimmer.

### SP-15 `mirror` — the Mirror of Erised (Ch. 6) — T3 FLAGSHIP
**Moment:** The quiet scene. The mirror shows her family and friends waving; the headmaster speaks softly; nothing is asked of her.
**Composition:** Mirror contents render into an offscreen canvas sized to the mirror's *bounding box* (not full-screen), then composite through a **pre-rendered feathered-ellipse alpha sprite via `destination-in`** — red-team preference over a raw `ctx.clip()` ellipse: same cost, but the soft feathered rim reads as glass rather than cut-out, and it renders identically across Safari and the Chromium harness (clip antialiasing differs between engines; the raw clip remains the documented fallback). Inside: a *pre-rendered soft pass* of the reflection cast — family silhouettes + her own puppet + pet, rendered once to an offscreen canvas at 60% detail then blurred **at bake time** (`ctx.filter` is disabled in Safari — all blur in this game is baked, never runtime), drawn flipped with 0.85 alpha + slow 4px drift; over it, a `screen`-blend shimmer wash (two drifting gradient sprites) + occasional star glints. Outside: darkness system at its gentlest (0.6 dim), single moonbeam hole. Reflection figures wave on an 8s loop; her real puppet's idle and the reflection's idle are deliberately *out of sync* (dreams don't mirror).
**Assets:** mirror-chamber painting (mirror generated as *dark empty glass* — the prompt pins this so we own everything inside it); reflection bake list; the score's most beautiful cue.
**Verify (this one is taste-critical — strip at t = 0, 2, 4, 8, 12):** reflection reads as *in* the glass (clip edge clean, shimmer over figures, alpha under 0.9); out-of-sync idle visible by t=8 comparison; scene stays warm (histogram check: mean luminance above the horror floor); nothing prompts action (no glows, no HUD pulses — verify their absence).
**Fallback:** reflection = static baked image with shimmer wash only (no waving loop). Still lands — the music is doing half the work.
**Spike:** prototype spike SP-B in M1 (clip + bake pipeline proven on placeholder art).

### SP-16 `snare` / SP-17 `keys` / SP-18 `chess` — the gauntlet (Ch. 7) — T2/T3-lite
**Snare:** 10 bezier-tentacle props (3 quadratic segments each, control points on sine offsets); Incendio = bluebell flame particles + tentacles interpolate to recoiled pose + alpha out. Verify: tentacle motion organic in strip (no straight-line snaps); recoil wave propagates outward from flame point. Fallback: 5 tentacles.
**Keys:** 40-sprite swarm, boid-lite wander (cohesion + noise only); the One Key glints (periodic star sprite) and flees gently from her broom; catch radius generous. Verify: glint visible against swarm in stills; swarm never exits room bounds. Fallback: 15 keys, slower.
**Chess:** giant painted board (perspective baked in the painting), 3 hero pieces = puppets on marked squares; each round: the correct piece glows per hint-ladder; wrong pick = piece shakes head; right pick = grinding slide (camera rumble) + checkmate on round 3. Verify: board perspective vs piece scale coherent (agent checks a piece on far vs near square against painting perspective — pieces scale ~15% smaller on far squares). Fallback: flat-on board painting, no perspective scaling.

### SP-19 `turban` — the reveal (Ch. 8) — T3
**Moment:** Quirrell's turban unwinds; the face on the back of his head is revealed. Menacing-but-hammy.
**Composition:** Staged swap under cover: 4 bezier ribbon strips (turban-colored) whip outward in sequence (0.9s) into a purple-black smoke burst (40 particles, the game's densest cloud); inside the cover, the Quirrell puppet swaps to the reveal variant (turned head-part with the second face). Voldemort's face is a *designed puppet face* — snake-nostrils, red eyes, but rendered in the same storybook puppet style as everyone (this is what keeps it beatable-scary: he's in *her* art style, on her turf).
**Verify:** no frame in the strip shows both faces / a half-swapped head (capture at 60ms steps through the burst window to prove cover density); reveal face reads menacing-hammy not horror (agent judges against ART_DIRECTION fear-calibration line; dad reviews the GIF before any child sees it — hard gate).
**Fallback:** lights flicker to black (darkness system, 0.3s), swap in the dark, lightning-flash reveal.

### SP-20 `finisher` — the Expelliarmus finisher (Ch. 8) — T3 FLAGSHIP
**Moment:** Time freezes mid-duel; the incantation's letters flare around the locked wands; she taps each; the word completes and detonates. The climax of the entire game.
**Composition:** Sim freeze (encounter clock stops; particle/UI layers live). Background dims 0.5 (T1 overlay); the two beam-locked wands = 3-layer gradient quads (wide soft color, mid glow, white core) with animated noise on width; 12 letter-rune sprites arc around the lock point (precomputed arc positions), each dormant→flaring (scale pulse + glow sprite)→tapped (ignites gold, chimes a rising pentatonic step — the word literally plays a melody). Untapped letters auto-brighten after 2s (unfailable). On completion: 0.4s full white flash → Voldemort deflate puppet-anim (shriek pitch-bend) → smoke poof → confetti/fireworks system takeover.
**Verify:** letters legible AND ordered readably in stills (arc must read left-to-right as a word — E X P E L L I A R M U S — agent spells it back from the keyframe); beam layering shows white core inside color (not additive white-out before the flash); freeze actually freezes (two captures 0.5s apart inside freeze differ only in UI/particle layers); tap targets ≥88px apart (headless geometry test).
**Fallback:** letters appear one at a time auto-paced with her single "hold wand" press — loses spelling agency, keeps spectacle. (Fallback only if playtest shows letter-hunting breaks the climax — the parent dial's Off setting already routes here.)

### SP-21 `feast-cup` — the celebration (Ch. 8) — T1/T2
Feast painting + banner-unfurl props in her house colors + the full particle budget (fireworks = burst emitters through the great-hall windows — painted windows, particles in front); every friend puppet in cheer pose; house-cup prop gleam (screen-blend sweep). Credits = picture-book page turns: each chapter card painting slides in with its music sting. **Verify:** particle cap respected at maximum celebration (headless count assert + frame-time budget in harness perf mode); every named friend present (content lint: finale cast list). **Fallback:** none. This one gets the full budget; it's the memory.

---

## Ambient systems (always-on set dressing — the living castle)

These aren't one-off moments; they're persistent systems built from the same toolbox, and they're where "all out" lives room-to-room.

### AM-01 `portraits` — living wall portraits — T2
Portrait art = small standalone generated paintings (originals, storybook style, ornate frames added in code). Layered at bake: painting + code-drawn **eye overlays** (two dark ellipses on white sclera shapes, positioned per-portrait in the slice map). Runtime: eyes track Violet's x-position (clamped ±20% of socket), blink on randomized 4–9s timers, close when snoring (Zzz glyph particles). Talking portraits get brim-style jaw regions — a slice of the painting's mouth area nudged ±3px with voice amplitude buckets (same rig as the Sorting Hat). **Verify:** eye tracking direction correct in a 3-keyframe walkthrough (left/center/right); sockets never overflow the painted face (per-portrait bounds in slice map, headless-tested).

### AM-02 `candles` — Great Hall floating candles & cinemagraph layers — T2
Two flavors: (a) **prop candles** — code-drawn candle sprites with flicker-glow (pre-rendered gradient, alpha noise) drifting on slow sine paths in front of the painting; (b) **cinemagraph overlays** — *generated translucent PNG layers* (fog wisps, dust shafts, aurora-glow) that drift/loop as whole layers over the painting (rigid transforms only — the one law holds). Budget: ≤2 cinemagraph layers per room. **Verify:** loop seam invisible (keyframes at loop boundary t=L−0.1 vs t=0.1 near-identical); combined overlay alpha never muddies the painting (mean luminance drop ≤12%).

### AM-03 `ink-transitions` — scene transitions — T1
Room-to-room and chapter cards transition via **ink blooms**: an organic blob mask (8-point blob path, radii animated with eased noise) grows from the tap/door point, filled with the destination already rendered inside it (`clip`), swallowing the screen in 0.6s. Map travel uses the sparkle-cover variant. **Verify:** blob edge organic (no polygon corners visible at 2× zoom keyframe); destination renders complete inside the mask from first frame (no white flash).

### AM-04 `password-door` — the common-room portrait door — T2
The portrait guardian (AM-01 rig, larger) asks; her three chosen icon cards fan up (UI layer); each tapped card chimes; on the third, the frame swings (rigid painted slice on hinge, generated shut; wall layer behind reveals the doorway) with a satisfying triple-lock brass cascade. Hint ladder applies to forgotten passwords (guardian mouths the first icon…). **Verify:** hinge pivot at frame edge (no floating-door look); card fan targets ≥88px apart.

### AM-05 `yearbook-capture` — the golden-moment camera — T1 (system)
At scripted flags, the live frame is captured (canvas snapshot → downscaled ~480px thumbnail, JPEG-compressed dataURL → save file), stamped with a parchment border + one-word caption at *render* time (not baked), and slotted into the album. **Verify:** headless — capture fires exactly once per flag (idempotent on replay); thumbnail size ≤60KB each, album capped (~24 slots) so localStorage stays safe; visual — album page renders captures inside frames without distortion.

### AM-06 `seasons` — the year turns — T2
Map + key exteriors (courtyard, castle vista, greenhouse walk) get seasonal painting variants (autumn/halloween/winter/spring/summer), generated as same-seed re-prompts for maximal continuity; interiors get dressing swaps via the prop layer (pumpkins, garlands, tree, blossom petals drifting as particles). Chapter transitions crossfade the map under owl-post flight. **Verify:** variant continuity — landmark silhouettes align across seasons (overlay-diff keyframes; structural drift ≤ small threshold in landmark regions); dressing props never occlude hotspots (headless geometry test).

### AM-07 `snowball` — Christmas courtyard play (Ch. 6) — T1
Pure-play toy: tap anywhere lobs a snowball (parabolic arc, splat sprite + puff); friends lob back at *nothing in particular* (never at her — no dodge mechanic, no stakes); snowman prop assembles after enough splats. A toy, not a game — it exists to be joy. **Verify:** arc apex and splat land where tapped ±10px; snow particles respect the cap.

---

## Choreography runtime

Set pieces are **data + timelines**, not bespoke engine code: `systems/Timeline.js` executes declarative tracks (`at(t, fn)`, `tween(t0, t1, easing, apply)`, `stagger(items, dt, fn)`) driven by World's clock — meaning every set piece is a pure function of `(t, seed)`, scrub-able by the harness to any instant, and testable headlessly (see [VERIFICATION.md](VERIFICATION.md)). Chapter content declares set pieces by id + parameters; the engine provides only the primitives in the toolbox.

## Budget discipline

- T3 count is capped at one per chapter (Ch. 1 carries two — `brick-wall` and nothing else heavy; `letter` is T2 — because it's the first impression chapter).
- Every T3 has a named fallback *specified before it's built*, so a failed review costs a downgrade, not a redesign.
- New-technique spikes (SP-A brick slicing, SP-B mirror clip/bake, SP-C style-seam, SP-D memory ceiling — see ROADMAP) run on placeholder art in M1, before any chapter promises depend on them.
