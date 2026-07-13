# Verification — How an Agent Proves It Looks Right

The hard problem this doc solves: engineers on this project are largely AI agents, and agents cannot watch 60fps motion. Left unchecked, an agent will build the Diagon Alley wall, see no errors, and declare victory while the illusion is broken on screen. This doc defines the machinery that makes visual work *provable* — every claim below marked **VERIFIED** was smoke-tested on this machine during planning (headless Chromium launched, canvas captured, GIFs assembled, PNGs visually read by an agent).

## The verification pyramid

1. **Headless sim tests** (Vitest) — logic: quest graphs, encounters, saves, geometry. Fast, exhaustive, no pixels.
2. **Content lint** — the data contract police (see ARCHITECTURE.md §Testing).
3. **Harness keyframe review** — agents capture deterministic frames of visual work and *look at them* against written illusion checklists. **VERIFIED: the Read tool renders PNGs visually — agents genuinely see their work.**
4. **Golden regression** — approved keyframes become per-environment goldens; perceptual pixel-diff catches unintended drift forever after.
5. **Human taste gate** — dad reviews the GIF/strip for every set piece; agents verify consistency, humans verify *magic*. This gate is load-bearing: easing glitches and tempo problems can hide between sampled keyframes.
6. **Device gate** — the real iPad, every milestone. Goldens certify Chromium only; iPad Safari renders with a different rasterizer and DPR. Nothing replaces playing it on the actual glass.

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
| `scripts/diff.mjs` | pixelmatch vs `goldens/<scene>/` — **perceptual threshold 0.1, fail at >0.5% differing pixels, never exact-match** (absorbs sub-pixel AA drift); writes `diff_<frame>.png` heatmaps the agent Reads to localize regressions |
| `scripts/bless.mjs` | copies reviewed keyframes into `goldens/<scene>/` — **human-triggered only**; agents never bless their own work |
| `review/index.html` | static gallery of every scene's strip + GIF for human browsing; `review/` is gitignored, `goldens/` is committed (640×360 stylized frames ≈ 5–50KB; plain git, no LFS needed below ~50MB total) |

## The agent review loop (per visual change)

1. **Implement** the set piece per its SET_PIECES.md spec.
2. **Capture**: `snap.mjs` at the spec's keyframe times (chosen to hit anticipation / impact / settle). Multi-seed spot-check (`--seed 1,42,1337`) to catch seed-dependent bugs.
3. **Self-review**: Read the PNGs against the set piece's illusion checklist. Checklists are **geometric and countable** ("no tile crosses another into visual mush at t=1.4", "name legible at 640×360", "particle count 20–40") — never vibes; keyframe judgment of subtle motion is the weakest link, so the checklist carries the burden. Iterate until it passes.
4. **Regression guard**: `diff.mjs --all`; any drift on scenes you didn't intend to touch is a regression — Read the heatmaps and fix.
5. **Motion artifact**: `flipbook.mjs` → GIF + contact sheet; add to `review/index.html`.
6. **Flag for human**: append to `review/PENDING.md` (scene, seed, what changed, checklist verdict, GIF path) and say so in your report. GIFs are for *motion* judgment; 256-color quantization hides art subtleties — PNGs are ground truth.
7. **Human review**: dad watches the GIF, optionally scrubs the harness live, and (for anything already past its chapter's device gate) checks the iPad.
8. **Bless**: on explicit approval, `bless.mjs` locks the look. Future changes that move those pixels require re-review — which is exactly the intended workflow.

## What this machinery does NOT cover (and what does)

- **Cross-platform fidelity**: goldens are per-environment. Chromium-vs-iPad pixel comparison is explicitly not attempted (different rasterizers, fonts, AA — a guaranteed false-positive machine). The device gate covers it.
- **Motion feel between keyframes**: dense GIFs help; the human gate decides.
- **Art taste** (is the room beautiful? does Violet's hair read as *hers*?): contact sheets + dad. Agents check consistency (palette, outline weight, light direction per ART_DIRECTION), not beauty.
- **Fun**: Violet. There is no script for this one.
