# Verification — How an Agent Proves It Looks Right

The hard problem this doc solves: engineers on this project are largely AI agents, and agents cannot watch 60fps motion. Left unchecked, an agent will build the Diagon Alley wall, see no errors, and declare victory while the illusion is broken on screen. This doc defines the machinery that makes visual work *provable* — every claim below marked **VERIFIED** was smoke-tested on this machine during planning (headless Chromium launched, canvas captured, GIFs assembled, PNGs visually read by an agent).

## The verification pyramid

> **D32 (2026-07-13): no human approval gates.** This is a family project; velocity beats ceremony. Everything below is agent-automated and free. Pete's feedback comes from *playing the deployed game* whenever he likes, delivered conversationally — never from processing a review queue. Agents are therefore the last line of visual defense and must self-review strictly.

1. **Headless sim tests** (Vitest) — logic: quest graphs, encounters, saves, geometry. Fast, exhaustive, no pixels.
2. **Content lint** — the data contract police (see ARCHITECTURE.md §Testing).
3. **Harness keyframe self-review** — agents capture deterministic frames of visual work and *look at them* against written illusion checklists (including the Storybook Standard section). **VERIFIED: the Read tool renders PNGs visually — agents genuinely see their work.**
4. **Art-director adversarial review** (D49, brief: [ART_DIRECTOR.md](ART_DIRECTOR.md)) — a **fresh agent that did not author the change** judges the captures at 1× and 2× against absolute standards (posture, silhouette, anatomy joins, expression congruence, grounding, identity, the picture-book test), prompted to assume something is wrong and find it. CRITICAL/MAJOR findings block the merge. Exists because self-review provably passes taste failures the checklists can't express: the author sees intent and grades "better than before"; the judge sees only the frame. Generated art (part sheets, rooms) is judged *before* it enters the pipeline.
5. **Play it** — Pete and Violet, on the deployed game and the actual iPad. iPad Safari renders with a different rasterizer and DPR than the capture harness; nothing replaces the actual glass. Feedback arrives as conversation and lands in DECISIONS.md — but obvious defects (posture, dead eyes, floating parts) must die at layer 4, never reach Pete.

## Determinism requirements (engine-level, non-negotiable, built FIRST)

Retrofitting determinism is brutally expensive, so these land in WP-01/WP-02 before any visual work:

- **Fixed-timestep sim**: `update(dt)` locked to 1/60 steps fed by an accumulator (also the fix for iPad rAF running at 30Hz in Low Power Mode or 120Hz on ProMotion — see ARCHITECTURE.md). `Date.now`, `performance.now`, and rAF deltas are **banned inside sim and render code** (enforced by a grep-based lint in CI).
- **One seeded PRNG** (`core/rng.js`), injected at scene init; `Math.random` banned (same lint). Per-system sub-streams derived as `hash(masterSeed, systemName)` so adding a particle system doesn't reshuffle other systems' randomness.
- Every visual is a **pure function of (scene, seed, simTime)** — particles, shake, flicker, all of it.
- **Asset gating before first frame**: explicit `FontFace.load()` per face/weight actually used (`document.fonts.ready` alone is insufficient — it resolves early if nothing triggered a load) + one warm-up `fillText` offscreen; `await img.decode()` for every image; **audio hard-stubbed in harness mode** (headless AudioContext never resumes; anything awaiting it hangs the harness).
- Set pieces stay **≤10s** of sim time (`__renderAt(t)` re-steps from zero; keep capture fast).

## The harness

- `harness.html` + `src/harness/boot.js` (dev-only): reads `?scene=<id>&t=<seconds>&seed=<n>&size=640x360`. Boot: stub audio → await fonts → await image decodes → construct scene seeded → step fixed timesteps to `t` → render exactly one frame → `window.__ready = true`. Exposes `window.__snapshot()` → `canvas.toDataURL('image/png')` and `window.__renderAt(t)` (re-sim from zero, re-render — lets the capture tool iterate times without reloading).
- Every SET_PIECES.md id, every AM system, every UI surface, and every room registers a harness scene. If it isn't in the registry, it can't be reviewed; if it can't be reviewed, it doesn't merge.
- The URL-param path doubles as the human scrubber: dad can open `harness.html?scene=brick-wall&t=1.4` in a normal browser and eyeball any exact instant.

## Capture stack (VERIFIED on this machine)

- **Playwright pinned to exactly `1.58.2`** — the matching `chromium-1208` + headless shell are already in `~/Library/Caches/ms-playwright`, so installation downloads **zero bytes** of browser. The pin is exact (no caret): a Playwright bump changes the Chromium revision, downloads ~200MB, *and* invalidates all goldens via antialiasing drift — treat any bump as a deliberate golden-regeneration event.
- devDependencies: `playwright@1.58.2`, `pixelmatch`, `pngjs`. Nothing else.
- **Node footgun (CONFIRMED)**: non-interactive shells on this machine resolve node **v14.15.4**, which breaks Vite 7 and Playwright. The repo ships `.nvmrc` (`22.17.0`), `"engines": {"node": ">=22"}`, and a fail-fast version guard at the top of every script in `scripts/` that prints the fix.
- Captures standardize on `__snapshot()`/toDataURL, **not** `page.screenshot` — verified pixel-identical at dpr=1 today, but toDataURL reads the raw backing store (immune to future CSS scaling) and keeps all frames RGBA, which matters because of a **verified ffmpeg gotcha**: a PNG sequence mixing RGBA and RGB frames makes the image2 demuxer silently blank frames in GIF/tile output.
- Harness captures at 640×360, dpr forced to 1 (headless default, verified). Production runs dpr≤2 — one smoke scene gets a `deviceScaleFactor: 2` capture variant so the dpr path isn't entirely unexercised.

## The tools

| Script | Does |
|---|---|
| `scripts/snap.mjs` | `--scene <id> --times 0,0.25,0.5,1,2 --seed 42` → starts Vite **programmatically** (`createServer()` — no port races or orphan processes when agents run captures concurrently), loads the harness once, iterates `__renderAt(t)` + `__snapshot()`, writes `review/<scene>/seed42_t00250.png` (zero-padded ms so globs sort chronologically) |
| `scripts/flipbook.mjs` | ffmpeg (v8.1.2, **VERIFIED**: `palettegen stats_mode=diff` + `paletteuse dither=bayer`) → `review/<scene>/flipbook.gif` at dense steps (0.1s, 10fps) + `sheet.png` contact strip (`tile=Nx1`) |
| `scripts/diff.mjs` / `scripts/bless.mjs` | **Optional tools, not process** (D32): pixelmatch comparison against `goldens/<scene>/` snapshots an agent may take for itself mid-refactor (perceptual threshold 0.1, >0.5% fail — never exact). No blessing ritual, no committed goldens requirement, not wired into CI. |
| `review/index.html` | static gallery of every scene's strip + GIF — browse it if you're curious, ignore it if you're not; `review/` is gitignored |

## The agent review loop (per visual change)

1. **Implement** the set piece per its SET_PIECES.md spec.
2. **Capture**: `snap.mjs` at the spec's keyframe times (chosen to hit anticipation / impact / settle). Multi-seed spot-check (`--seed 1,42,1337`) to catch seed-dependent bugs.
3. **Self-review**: Read the PNGs against the set piece's illusion checklist. Checklists are **geometric and countable** ("no tile crosses another into visual mush at t=1.4", "name legible at 640×360", "particle count 20–40") — never vibes; keyframe judgment of subtle motion is the weakest link, so the checklist carries the burden. Generate the `flipbook.mjs` GIF and read the contact strip for motion sanity. Iterate until it passes — **you are the last reviewer** (D32); ship when the full local gate is green (**`npm run build`**: tests, content lint, asset/voice/audio checks, production bundle — not `npm test` alone). CI re-runs the same battery and gates deployment, so a red push can't reach Pages — but the local gate exists so pushes *deploy*, not merely survive.

There is no approval queue, no PENDING.md, no blessing step, and no golden gate (D32 retired them). If a change is genuinely taste-risky — a new character design, a signature moment's feel — say so plainly in your report so Pete knows to look at it in the deployed game; that's a heads-up, not a blocking request.

## Mandatory Storybook Standard checklist section

Every chapter set-piece checklist and every registered player-facing harness fixture ends with the same ordered seven-item Storybook Standard section. The canonical wording and the review-scene checklist registry live in `src/game/content/visualVerification.js`; chapter content uses its helper instead of copying the wording. The state-fixture registry is authoritative for harness coverage, and the test gate reconciles it with the matching action fixtures before requiring exactly one canonical checklist for every visible fixture. A genuinely internal fixture may be excluded only through the explicit non-player exclusion registry with a written reason, so a newly registered room, transition, character, UI, or grown-up surface cannot silently bypass review.

The seven countable checks cover palette harmony with zero pure-black or pure-white artwork colors; soft dark-brown contours with at least two visible line weights; at least two tones plus a highlight facing the authored room key; one warm room-matched light direction and a lit-side character rim; visible grain or material marks on every player-facing surface; zero perfect rectangles, circles, or ruler-straight edges on those surfaces; and zero elements that separate from the room or reference family under a thumbnail/squint comparison. These checks make omissions and obvious mismatches countable, but they do not turn palette harmony or family resemblance into pixel-computable facts; the agent still judges those two comparisons from review frames.

## What this machinery does NOT cover (and what does)

- **Cross-platform fidelity**: captures certify Chromium only; iPad Safari differs (rasterizer, fonts, AA, DPR). Playing on the actual iPad covers it.
- **Motion feel between keyframes**: dense GIFs help agents; Pete feels it in play.
- **Art taste** (is the room beautiful? does Violet's hair read as *hers*?): agents check consistency against the Storybook Standard and the character reference sheets (palette, outline weight, light direction, ≥2-tone form); beauty gets judged in play.
- **Fun**: Violet. There is no script for this one.
