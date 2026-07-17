# Verification — How an Agent Proves It Looks Right

The hard problem this doc solves: engineers on this project are largely AI agents, and agents cannot watch 60fps motion. Left unchecked, an agent will build the Diagon Alley wall, see no errors, and declare victory while the illusion is broken on screen. This doc defines the machinery that makes visual work *provable* — every claim below marked **VERIFIED** was smoke-tested on this machine during planning (headless Chromium launched, canvas captured, GIFs assembled, PNGs visually read by an agent).

## The verification pyramid

> **D32/D64: no approval or separate-review gates.** This is a family project; velocity beats ceremony. Pete's feedback comes from *playing the deployed game* whenever he likes, delivered conversationally — never from processing a review queue. The author inspects deterministic captures against the illusion checklist before the build gate.

1. **Headless sim tests** (Vitest) — logic: quest graphs, encounters, saves, geometry. Fast, exhaustive, no pixels.
2. **Content and architecture lint** — the data contract police plus a ratcheting ban on concrete chapter/character routing and reference-only runtime imports (see ARCHITECTURE.md §Testing).
3. **Harness keyframe self-review** — agents capture deterministic frames of visual work and *look at them* against written illusion checklists (including the Storybook Standard section). **VERIFIED: the Read tool renders PNGs visually — agents genuinely see their work.**
4. **Play it** — Pete and Violet, on the deployed game and the actual iPad. iPad Safari renders with a different rasterizer and DPR than the capture harness; nothing replaces the actual glass. Feedback arrives as conversation and lands in DECISIONS.md. Authors fix obvious defects such as bad posture, dead eyes, and floating parts during capture inspection whenever possible.

## Determinism requirements (engine-level, non-negotiable, built FIRST)

Retrofitting determinism is brutally expensive, so these foundations landed
before visual work and remain non-negotiable:

- **Fixed-timestep sim**: `update(dt)` locked to 1/60 steps fed by an accumulator (also the fix for iPad rAF running at 30Hz in Low Power Mode or 120Hz on ProMotion — see ARCHITECTURE.md). `Date.now`, `performance.now`, and rAF deltas are **banned inside sim and render code** (enforced by a grep-based lint in CI).
- **One seeded PRNG** (`core/rng.js`), injected at scene init; `Math.random` banned (same lint). Per-system sub-streams derived as `hash(masterSeed, systemName)` so adding a particle system doesn't reshuffle other systems' randomness.
- Every visual is a **pure function of (scene, seed, simTime)** — particles, shake, flicker, all of it.
- **Asset gating before first frame**: explicit `FontFace.load()` per face/weight actually used (`document.fonts.ready` alone is insufficient — it resolves early if nothing triggered a load) + one warm-up `fillText` offscreen; `await img.decode()` for every image; **audio hard-stubbed in harness mode** (headless AudioContext never resumes; anything awaiting it hangs the harness).
- Set pieces stay **≤10s** of sim time (`__renderAt(t)` re-steps from zero; keep capture fast).

## The harness

- `harness.html` + `src/harness/boot.js` (dev-only): reads `?scene=<id>&t=<seconds>&seed=<n>&size=640x360`. Boot: stub audio → await fonts → await image decodes → construct scene seeded → step fixed timesteps to `t` → render exactly one frame → `window.__ready = true`. Exposes `window.__snapshot()` → `canvas.toDataURL('image/png')` and `window.__renderAt(t)` (re-sim from zero, re-render — lets the capture tool iterate times without reloading).
- Every SET_PIECES.md id, every AM system, every UI surface, every room, and every production character registers a harness scene. Registration makes work inspectable; it is not a substitute for connecting the feature to normal gameplay. A character that exists only in the harness is unfinished.
- The URL-param path doubles as the human scrubber: dad can open `harness.html?scene=brick-wall&t=1.4` in a normal browser and eyeball any exact instant.

### State and inverse coverage

A visual fixture proves a state contract, not merely that a component can draw.
The shared Violet's Field Kit matrix covers the named interaction vocabulary:
**rest, pressed, selected, unavailable, focus, busy, success, error, and
destructive**. Pressed must visibly settle and compress its shadow; selected
must use plum inset or stitching rather than gold; unavailable must become
closed, fogged, folded, tied, or pocketed rather than simply grey; and focus
must show the honey-and-violet focus-visible treatment. Busy, success, error,
and destructive fixtures must remain distinguishable from selection and from
the enchanted-gold objective state. Reduced-motion fixtures prove the same
meaning without depending on travel, overshoot, flashing, or looping motion.

Production surfaces then register the states they can actually enter and the
meaningful **inverse** of each one. An earned portrait is paired with an
unearned closed pocket; a selected bookmark with an unselected sibling; an
available action with its unavailable physical state; a current destination
with a non-current destination; an objective or activation shimmer with the
same object when it must not shimmer; and a room overlay with the stage before
that overlay appears. The purpose of an inverse fixture is to prove that
forbidden information and emphasis are absent, not just that the positive state
looks attractive.

Coverage uses the smallest pairwise matrix that exercises every material,
named state, live-content boundary, and inverse rule; it does not require a
meaningless cross-product of every label and room. Each fixture is constructed
through the normal runtime state and production renderer. It may not inject a
special drawing-only flag that normal play cannot reach. Text, state, portraits,
and routes remain live in the fixture, while the painted shell remains
unchanged, so the capture proves the same boundary the player uses.

Room-stage fixtures include the unobstructed room and every materially
different overlay placement. Dialogue coverage includes speakers on both sides
and both ordinary and warm-dark parchment contexts, proving that the unrotated
asymmetric card moves opposite the speaker without covering Violet, the active
speaker, the objective, or the usable route. Full-screen field-kit surfaces
prove that closing them returns to the same room stage. These compositions are
captured at 1280×720 and 2560×1440, not certified from the 640×360 iteration
preview.

Focus is reviewed as an accessibility state, not as decoration. The explicit
honey-and-violet indicator may be clean, geometric, and non-diegetic; it is an
intentional exception to the no-abstract-ring, hand-wobbled-shape, and room-
palette rules. Browser inspection confirms it appears for visible keyboard or
assistive focus, remains legible over every material it can surround, and does
not become a persistent pointer or touch halo.

## Capture stack (VERIFIED on this machine)

- **Playwright pinned to exactly `1.58.2`** — the matching `chromium-1208` + headless shell are already in `~/Library/Caches/ms-playwright`, so installation downloads **zero bytes** of browser. The pin is exact (no caret): a Playwright bump changes the Chromium revision, downloads ~200MB, *and* invalidates all goldens via antialiasing drift — treat any bump as a deliberate golden-regeneration event.
- devDependencies: `playwright@1.58.2`, `pixelmatch`, `pngjs`. Nothing else.
- **Node footgun (CONFIRMED)**: non-interactive shells on this machine resolve node **v14.15.4**, which breaks Vite 7 and Playwright. The repo ships `.nvmrc` (`22.17.0`), `"engines": {"node": ">=22"}`, and a fail-fast version guard at the top of every script in `scripts/` that prints the fix.
- Captures standardize on `__snapshot()`/toDataURL, **not** `page.screenshot` — verified pixel-identical at dpr=1 today, but toDataURL reads the raw backing store (immune to future CSS scaling) and keeps all frames RGBA, which matters because of a **verified ffmpeg gotcha**: a PNG sequence mixing RGBA and RGB frames makes the image2 demuxer silently blank frames in GIF/tile output.
- Harness captures at 640×360 remain the quick iteration preview. Any renderer, room, set-piece, overlay, or layout change is reviewed at 1280×720 and 2560×1440 with dpr forced to 1; both profiles are required so gameplay scale and large-screen composition remain visible during refactors. Production runs dpr≤2, and one smoke scene keeps a `deviceScaleFactor: 2` variant so that path is not entirely unexercised.
- Satchel changes use the registered matrix `ui-satchel-map-early-review`, `ui-satchel-map-review`, `ui-satchel-cards-review`, `ui-satchel-ch2-cards-review`, and `ui-satchel-ch3-cards-review`. This covers fogged and completed travel states plus the materially different cards-only layout used after Chapter One. Before capture, the harness preloads every satchel and card image so a review frame cannot accidentally certify a one-frame vector fallback. Browser inspection additionally checks that each code-rendered button or destination name lands at the horizontal and vertical center of its declared blank label rectangle; coordinate tests enforce the same geometry without replacing the visual check.

## The tools

| Script | Does |
|---|---|
| `scripts/snap.mjs` | `--scene <id> --times 0,0.25,0.5,1,2 --seed 42` → starts Vite **programmatically** (`createServer()` — no port races or orphan processes when agents run captures concurrently), loads the harness once, iterates `__renderAt(t)` + `__snapshot()`, writes `review/<scene>/seed42_t00250.png` (zero-padded ms so globs sort chronologically) |
| `scripts/flipbook.mjs` | ffmpeg (v8.1.2, **VERIFIED**: `palettegen stats_mode=diff` + `paletteuse dither=bayer`) → `review/<scene>/flipbook.gif` at dense steps (0.1s, 10fps) + `sheet.png` contact strip (`tile=Nx1`) |
| `scripts/diff.mjs` / `scripts/bless.mjs` | **Optional tools, not process** (D32): pixelmatch comparison against `goldens/<scene>/` snapshots an agent may take for itself mid-refactor (perceptual threshold 0.1, >0.5% fail — never exact). No blessing ritual, no committed goldens requirement, not wired into CI. |
| `review/index.html` | static gallery of every scene's strip + GIF — browse it if you're curious, ignore it if you're not; `review/` is gitignored |

## The agent review loop (per visual change)

1. **Implement** the set piece per its SET_PIECES.md spec.
2. **Capture**: `snap.mjs` at the spec's keyframe times (chosen to hit anticipation / impact / settle). Multi-seed spot-check (`--seed 1,42,1337`) to catch seed-dependent bugs. For interface work, capture the relevant named states, their meaningful inverses, reduced motion, focus-visible where applicable, and the room with and without the composition-changing overlay at both required sizes.
3. **Self-review**: Read the PNGs against the set piece's illusion checklist. Checklists are **geometric and countable** ("no tile crosses another into visual mush at t=1.4", "name legible at 640×360", "particle count 20–40") — never vibes; keyframe judgment of subtle motion is the weakest link, so the checklist carries the burden. For field-kit work, also confirm that the painted asset contains no baked text, state, portrait, or route; the live state has the correct object and material meaning; the inverse omits the forbidden marker or emphasis; and the focus indicator remains visible without being mistaken for enchanted gold. Generate the `flipbook.mjs` GIF and read the contact strip for motion sanity. Iterate until the author pass is clean, then ship only after the full local gate is green (**`npm run build`**: tests, content lint, asset/voice/audio checks, production bundle — not `npm test` alone). CI re-runs the same battery and gates deployment, so a red push can't reach Pages — but the local gate exists so pushes *deploy*, not merely survive.

There is no approval queue, no PENDING.md, no blessing step, and no golden gate (D32 retired them). If a change is genuinely taste-risky — a new character design, a signature moment's feel — say so plainly in your report so Pete knows to look at it in the deployed game; that's a heads-up, not a blocking request.

Character work follows the shorter batch-first loop in
[CHARACTER_PIPELINE.md](CHARACTER_PIPELINE.md): inventory only states the current
game requests, generate one or the smallest few coherent sheets, inspect the
named shipping subset across those batches once, slice deterministically, integrate into real rooms and dialogue,
inspect the assembled result once, run `npm run build`, and push the complete
green character. Do not expand this general set-piece loop into separate
character-frame milestones.

## Mandatory Storybook Standard checklist section

Every chapter set-piece checklist and every registered player-facing harness fixture ends with the same ordered seven-item Storybook Standard section. The canonical wording and the review-scene checklist registry live in `src/game/content/visualVerification.js`; chapter content uses its helper instead of copying the wording. The state-fixture registry is authoritative for harness coverage, and the test gate reconciles it with the matching action fixtures before requiring exactly one canonical checklist for every visible fixture. A genuinely internal fixture may be excluded only through the explicit non-player exclusion registry with a written reason, so a newly registered room, transition, character, UI, or grown-up surface cannot silently bypass review.

The seven countable checks cover palette harmony with zero pure-black or pure-white artwork colors; soft dark-brown contours with at least two visible line weights; at least two tones plus a highlight facing the authored room key; one warm room-matched light direction and a lit-side character rim; visible grain or material marks on every player-facing surface; zero perfect rectangles, circles, or ruler-straight edges on those surfaces; and zero elements that separate from the room or reference family under a thumbnail/squint comparison. These checks make omissions and obvious mismatches countable, but they do not turn palette harmony or family resemblance into pixel-computable facts; the agent still judges those two comparisons from review frames.

The focus-visible indicator is not artwork and does not count as a
player-facing material surface for the palette, contour, texture, or perfect-
geometry checks. Its deliberate honey-and-violet accessibility treatment is
therefore not a Storybook Standard failure. Omitting it, hiding it under a
painted shell, or replacing it with the enchanted-gold objective shimmer is a
verification failure of its own.

## What this machinery does NOT cover (and what does)

- **Cross-platform fidelity**: captures certify Chromium only; iPad Safari differs (rasterizer, fonts, AA, DPR). Playing on the actual iPad covers it.
- **Motion feel between keyframes**: dense GIFs help agents; Pete feels it in play.
- **Art taste** (is the room beautiful? does Violet's hair read as *hers*?): agents check consistency against the Storybook Standard and the character reference sheets (palette, outline weight, light direction, ≥2-tone form); beauty gets judged in play.
- **Fun**: Violet. There is no script for this one.
