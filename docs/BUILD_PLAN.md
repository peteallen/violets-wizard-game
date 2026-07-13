# Build Plan — Work Packages for a Team of Engineers

This is the fan-out plan. Each work package (WP) is scoped to be built by one engineer/agent without hand-holding: it names its deliverables, the contracts it consumes and exposes, its acceptance criteria, and exactly how to verify it. The docs suite is the spec; when a WP forces a decision the docs don't cover, the builder appends it to [DECISIONS.md](DECISIONS.md) and flags it in their report — never silently improvises on player-facing behavior.

## Ground rules for every WP

1. **Contract-first.** WP-01 (the Constitution) freezes the shapes everything else plugs into. No WP redefines a shared shape; propose changes as a DECISIONS.md entry instead.
2. **Definition of done** = code + tests green + (if visual) harness scene registered with keyframe strip captured and reviewed against its illusion checklist + docs updated. Not "it works on my machine" — *proven per [VERIFICATION.md](VERIFICATION.md)*.
3. **Ship-ready main.** Every merge leaves the game playable end-to-end. A 6-year-old may ask to play at any moment; half-built UI is removed, not hidden (family house rule).
4. **Report conversationally** (sibling AGENTS.md convention): what you built, what you verified and how, what you're unsure about, what you decided.
5. Reference implementations are cribbed by file:line below — read them before writing the equivalent. They are a floor, not a ceiling: match their *reliability*, exceed their ambition where SET_PIECES.md calls for it.

## Dependency graph

```
WP-00 repo/CI/deploy skeleton
  └─ WP-01 THE CONSTITUTION (contracts)
       ├─ Track A: shell        WP-02 Game shell → WP-03 rooms/cache → WP-04 puppets
       │                        WP-05 UI ┐  WP-06 particles ┐  WP-07 sound
       ├─ Track B: sim          WP-08 World core → WP-09 dialogue → WP-10 quests
       │                        WP-11 spellbook/learning  WP-12 encounters
       │                        WP-13 minigames  WP-14 save
       ├─ Track C: verification WP-15 harness → WP-16 capture tooling   WP-17 content lint
       ├─ Track D: pipeline     WP-18 rooms-gen  WP-19 voice-gen  WP-20 sfx/music-gen  WP-21 check:assets
       └─ Track E: spikes       SP-A brick wall  SP-B mirror  SP-C style seam  SP-D memory ceiling
            (need WP-02+03 minimal + WP-15)
Content (per chapter, needs A+B+C green):
  WP-30 Ch1 grey-box → WP-31 Ch1 set pieces → WP-32 Ch1 production assets → WP-33 Ch1 device gate
  → Violet playtest ⭐ → WP-4x Ch2–3 → … (pattern repeats; chapters gated by playtests per ROADMAP.md)
```

Tracks A–E are parallel after WP-01. Within a track, arrows are hard dependencies; unmarked WPs in a track are parallel with each other.

---

## Phase 0 — serial foundation

### WP-00 · Repo, CI, deploy skeleton
**Blocked by:** open question O4 (hosting) in DECISIONS.md.
**Deliverables:** git repo (decide goldens storage before first commit: plain git at 640×360 is fine below ~50MB — converting to LFS later rewrites history); `.nvmrc` (22.17.0) + `"engines"` field; Vite + Vitest skeleton; `.github/workflows/pages.yml`; placeholder scene live at the real URL; `AGENTS.md` + one-line `CLAUDE.md`.
**Crib verbatim (rename only):** `violets-soccer-game/vite.config.js` (base `'./'`, `server {host:true, port:5173, strictPort:true}` — host:true is what enables iPad-on-LAN testing), `package.json` scripts + devDeps shape (zero runtime deps), `.github/workflows/pages.yml` (npm ci → test → build → upload-pages-artifact → deploy-pages, tests gate deploy), `index.html:1-24` (iPad meta: viewport-fit=cover, apple-mobile-web-app-capable, user-scalable=no).
**Acceptance:** the five-layer deploy verification (ARCHITECTURE.md) performed once and documented in the WP report; placeholder loads full-screen from an iPad home-screen icon.

### WP-01 · The Constitution (single author — everything imports this)
**Deliverables:**
- `src/game/config.js` — frozen `WORLD {1280×720}`, palette (from ART_DIRECTION), tuning tables (hint-ladder delays, duel windows, touch radii ≥88, particle caps), following `violets-soccer-game/src/game/config.js:1-93` (freeze everything; sim and renderer import the same geometry).
- `src/game/core/math.js` (clamp/lerp/easings incl. easeOutBack/easeInOutCubic) and `core/rng.js` — seeded PRNG; **all sim randomness flows through it** (soccer's `math.js:27-33` LCG is fine).
- Content data contracts as JSDoc typedefs + runtime validators for: room, hotspot, dialogue script, quest step, encounter phase, set-piece descriptor, learning beat (shapes in ARCHITECTURE.md §Content data contracts).
- `systems/Save.js` schema v1 + `setFlag()` choke point signature; event-name registry (the World→Game event vocabulary, cribbing the emit/drain pattern contract from `Match.js:102-114`).
- `core/assetManifest.js` entry shape `{key → {path, kind, chapter, volume?}}`.
**Acceptance:** validators have unit tests (valid fixtures pass, each malformed field fails loudly); a `docs/` cross-check — every shape in ARCHITECTURE.md matches the typedef, or ARCHITECTURE.md is updated in the same PR.

---

## Phase 1 — parallel tracks

### Track A — the shell

**WP-02 · Game shell.** Loop/letterbox/camera/input/lifecycle. Crib: resize with DPR cap (`Game.js:24-105`) — but the loop itself is a **fixed-timestep accumulator** (1/60 steps, ~100ms clamp, wall-clock tweens) per ARCHITECTURE.md §Device reality, deliberately superseding soccer's variable-dt tick (`Game.js:340-348`) because of iOS 30Hz/120Hz rAF variance and harness determinism. Also crib: `toWorld()` + single-pointer guard + arm-on-down/commit-on-up tap semantics (`Game.js:107-263` — keep press-confirm; it's what makes kid taps forgiving), camera-as-numbers with the save/applyCamera/scene/restore/UI-outside sandwich (`Game.js:479-535`), `visibilitychange` lastTime reset + `document.hidden → dt 0` (`Game.js:58-60, 342`), HMR dispose + `window.__violetWizard` global (`main.js:1-13`), reduced-motion flag (`Game.js:50` — also listen for `change`), URL-param hooks `?scene&t&seed` reserved for the harness (pattern: `Game.js:265-280`). *Acceptance:* input unit tests via the `Object.create(Game.prototype)` no-DOM harness trick (`tests/game-input.test.js:11-31`); letterbox correct at 3 aspect ratios (harness screenshots).

**WP-03 · RoomRenderer + memory management.** Painted-layer compositing to an offscreen room cache; image loading via `BASE_URL` with complete/naturalWidth draw guards and procedural fallback underneath (`Game.js:46-47, 484-503` — no loading screens, rooms pop in over a gradient); **the full canvas-memory doctrine from ARCHITECTURE.md §Device reality**: 5-canvas hard cap, `canvas.width=1` eviction, ≤3 decoded PNGs, `decode()`-then-composite-immediately, getContext-null canary with emergency eviction; layered paintings, cinemagraph overlays, seasonal variant swaps. *Acceptance:* headless cache-lifecycle tests (enter/leave/evict counts, canary path); harness scene per layering feature; SP-D confirms the budget numbers on the real device.

**WP-04 · Puppets.** Part-transform character rig + pose/tween library + y-sort; Violet per ART_DIRECTION (messy-hair flyaways on the walk cycle is an acceptance criterion, not a nicety); portrait tier; the AM-01 living-portrait eye rig. *Acceptance:* pose snapshot strip per character reviewed against ART_DIRECTION; walk/idle/emote cycles loop seamlessly (strip at loop boundary).

**WP-05 · UI.** HUD (wand/satchel/quest star), spell fan, incantation ribbon + rune tiles, caption chips, dialogue frames, satchel spread (map/album/gear), parent panel (long-press gate). Font loaded via FontFace and awaited before first text render. *Acceptance:* every target ≥88px (headless geometry test over all UI layouts); harness scenes for each surface; caption legibility check at iPad size.

**WP-06 · Particles.** Pooled, capped, pre-rendered gradient sprites; world-pass + overlay-pass split and kind-tag single-array design cribbed from `Game.js:438-477, 1033-1050` (add pooling — soccer skipped it; our celebration budget is bigger); clear-on-scene-change. *Acceptance:* cap enforcement test; per-kind harness gallery scene.

**WP-07 · Sound.** Crib the SoundEngine shape wholesale (`core/SoundEngine.js:1-159`): unlock-on-first-tap, mute persistence, HTMLAudio loops for music/ambience, single-voice-at-a-time `speak()` with ambience ducking, synth-fallback tones. Extend: per-chapter lazy clip groups from the manifest, loudness assumptions per AUDIO_DIRECTION, music crossfade between cues. *Acceptance:* plays-with-zero-assets test (synth fallback); duck/restore unit test; chapter-group lazy-load test.

### Track B — the sim (all headless, all seeded)

**WP-08 · World core.** Rooms/walk/hotspots/exits/pet-follow; `emit`/`drainEvents` exactly per `Match.js:102-114` + `Game.js:350-356`; `World.update(1/60)` steppable; `advance()` test helper + invariant helpers cribbed from `tests/match.test.js:5-17` (e.g. `expectNeverStuck(world)` — asserts a completable action always exists). *Acceptance:* scenario tests + a long random-walk fuzz test (pattern: `match.test.js:513-541` — random taps for 30 sim-minutes, state always valid, never stuck).
**WP-09 · Dialogue.** Line queue, captions, choices, replay, resume-recap hooks, portrait events. *Acceptance:* script-runner tests incl. interrupt/replay paths.
**WP-10 · Quests + hint ladder.** Flag machine, triggers, rewards (idempotent on replay), the four-rung escalation with config timings. *Acceptance:* reachability property test — every quest graph completable from every legal intermediate state.
**WP-11 · Spellbook + learning.** Casting lifecycle, target resolution, assembly sequences (letter/syllable), adaptive `letterSkill`, parent dial including Off bypass, mastery tiers. *Acceptance:* full assembly state-machine tests incl. wrong-tap comedy path and auto-converge; dial matrix test (Off/Gentle/Stretchy × each beat).
**WP-12 · Encounters.** Telegraph pattern machine, windows + invisible rubber-band, phase checkpoints, loss/retry with persistence. *Acceptance:* seeded determinism test (same seed → identical telegraph stream); rubber-band math unit tests; checkpoint-across-loss tests.
**WP-13 · Minigames.** The enter/succeed/celebrate contract + broom (damped position control), potion (recipe machine), stir/trace gesture (angle accumulation). *Acceptance:* per-minigame sim tests; gesture recognizer tested with recorded-noise fixtures (sloppy 6-year-old circles must pass).
**WP-14 · Save.** Full Save.js: debounced autosave, sync flush on scene change + `visibilitychange`, migrations + `-backup`, corrupt-parse recovery, export/import, yearbook thumbnail storage caps. *Acceptance:* roundtrip + every-migration tests; corrupt-save fuzz (truncated/garbage JSON never crashes, never silently wipes).

### Track C — verification infrastructure (see VERIFICATION.md for full detail; the stack below is already smoke-tested on this machine)

**WP-15 · Harness.** `harness.html` + `?scene=<id>&t=<s>&seed=<n>&size=` boot path: registry of harness scenes (every SET_PIECES id, AM system, UI surface, and room), audio hard-stubbed, fonts/images awaited, fixed-timestep to t, single frame, `window.__ready` + `window.__snapshot()` + `window.__renderAt(t)`. **WP-16 · Capture tooling.** `scripts/snap.mjs` (Playwright pinned **exactly 1.58.2** — its Chromium is already cached on this machine, zero download; Vite via programmatic `createServer()`), `flipbook.mjs` (ffmpeg 8.1.2 palettegen/paletteuse — verified; all frames from the single toDataURL path to dodge the verified mixed-pix_fmt blank-frame gotcha), `diff.mjs`/`bless.mjs` (optional self-serve snapshot tools per D32 — no blessing ritual, no queue), `review/index.html` gallery. Repo prerequisites from WP-00: `.nvmrc` 22.17.0 + engines guard (this machine's non-interactive shells resolve node v14). **WP-17 · Content lint.** The full battery from ARCHITECTURE.md §Testing plus the banned-API greps (`Math.random`/`Date.now`/`performance.now` in sim, `ctx.filter`, `shadowBlur`, frame-loop `getImageData`), wired into `npm test` and CI.

### Track D — asset pipeline

**WP-18 · Room generation.** `scripts/generate_rooms.py`: style-prefix + per-room prompt tables, layered/variant/cinemagraph outputs, slice-map JSON convention, candidates + accepted-choice logging under `art/`, contact-sheet build. **WP-19 · Voice.** `generate_voice.mjs` + transcription-QA loop + phonetic-spelling fields + learning packs + family-recording drop-in path. **WP-20 · SFX/music.** Idempotent generators, loudness normalization, loop-point authoring, Williams-similarity listen-check step. **WP-21 · `check:assets`.** Manifest ⇄ disk ⇄ generation-script ⇄ source-reference validation, in `npm run build` (crib `robotgame/scripts/check_assets.mjs` mechanics).

### Track E — spikes (throwaway code, placeholder art; results → DECISIONS.md)

| Spike | Question it answers | Pass criterion |
|---|---|---|
| **SP-A brick wall** | Does sliced-tile choreography hold 60fps and read as magic? | Strip + GIF pass SP-02's illusion checklist on placeholder art; frame time ≤8ms at peak on desktop, verified on iPad |
| **SP-B mirror** | Clip + baked-soft-reflection pipeline | SP-15 checklist on placeholder art |
| **SP-C style seam** | Do code-drawn puppets sit on generated paintings? | One real generated room + Violet puppet, agent-reviewed against the Storybook Standard; flagged to dad as a taste heads-up (non-blocking, per D32) — his play feedback steers the art direction |
| **SP-D memory ceiling** | Confirm the researched budget (224–384MB global canvas cap, silent transparent failure) on *our* target iPad | The 5-canvas doctrine + canary from ARCHITECTURE.md exercised past the limit on device; observed ceiling and canary behavior land in DECISIONS.md |

---

## Phase 2 — content, chapter by chapter

The repeating pattern (shown for Ch. 1; each later chapter clones it after its CHAPTERS.md detail pass):

- **WP-30 · Ch. 1 grey-box.** `content/chapters/ch1.js` complete against placeholder assets: all rooms/hotspots/dialogue/quests wired, walkthrough sim test green (scripted taps complete the chapter headlessly), content lint green. *This WP proves the chapter's design in data before a single asset exists.*
- **WP-31 · Ch. 1 set pieces.** SP-01 letter, SP-02 brick wall (from SP-A learnings), SP-03 wand chaos + AM systems used in Ch. 1 — each to its illusion checklist via harness strips.
- **WP-32 · Ch. 1 production assets.** Rooms, voices (+ QA), music, SFX generated per chapter asset list; contact sheet reviewed; `check:assets` green.
- **WP-33 · Ch. 1 device checkpoint.** Deployed (CI-gated); played end-to-end on the actual iPad (touch, perf, audio unlock, home-screen); yearbook capture verified. → **Violet playtest** (protocol in ROADMAP.md; a feedback checkpoint, not an approval — per D32 nothing blocks on it) → findings feed Ch. 2–3 detail pass.

Chapter WPs after engine-stability can run with content parallelism (e.g. Ch. 3 grey-box while Ch. 2 production assets generate), but playtest gates in ROADMAP.md order the *releases*.

## Sizing honestly

Tracks A+B are ~homogeneous medium-sized packages (each a few days of focused agent work with review cycles); the long pole is **content production quality loops** (generate → review → regenerate), which is why the pipeline WPs land before Ch. 1 production and why every chapter's asset list is already enumerated in CHAPTERS.md. The spikes are small and run first — they're the cheap insurance against the expensive mistakes.
