# Architecture

## Stack

Vite + vanilla ES modules + one full-window Canvas 2D + Vitest — the family house style, proven across the soccer, robot, and car games. No framework, no TypeScript, no Pixi/Phaser (both were tried in earlier family projects and abandoned). The template to crib from directly: `~/work/violets-soccer-game` (project skeleton, Game loop, SoundEngine, test patterns) hardened with `~/work/robotgame` conventions (asset manifest gate, cache-busting, version watcher).

## The two load-bearing splits

### 1. World vs. Game (sim vs. shell)

`World` is a **headless simulation**: rooms, entity positions, walking, interactions, dialogue state, quest flags, encounters, learning-beat state. It is seedable, steppable (`world.update(1/60)`), and never touches canvas, audio, or DOM. `Game` is the shell: rendering, input routing, audio, transitions. This is the soccer game's Match/Game split, and it's what makes the deterministic test suite possible — tests drive the real `World` through entire chapters headlessly.

### 2. Engine vs. packages

Systems interpret contracts; chapters and characters arrive through packages. Chapter content remains pure data, while its presentation and review harness load separately. A chapter descriptor contains metadata and lazy loaders rather than importing its implementation into the engine. Character definitions contain stable identity, capabilities, bounds, and assets, while their Canvas runtime loads only when the active chapter declares that character as a dependency. Adding Chapter 5 or a new character must not require a branch in `Game`, `World`, a generic renderer, asset-manifest code, or harness boot.

The character package boundary is live: production and harness rendering use exact identities through `CharacterRegistry`, and the role-keyed compatibility renderer graph has been deleted. Chapter One's cast, quest, map, recaps, assets, rooms, ordered scenes, dialogues, and set pieces now live in its package; a small version-1 projection preserves the synchronous runtime contract until the version-2 cutover. The descriptor/composer and aggregate linker therefore still coexist temporarily with that adapter and the presentation monoliths. `npm run check:architecture` records every remaining concrete chapter route, source-art import, browser boundary leak, and nondeterministic headless API as a counted allowance. Any new leak fails immediately; removing a leak also requires removing its stale allowance. Completion means that allowance is empty.

## Boot and composition readiness

Startup has a deliberately tiny visual layer before the game modules arrive. The HTML page owns a storybook loading surface, so even a cold visit on a slow connection has an immediate, understandable state instead of a blank canvas. Its controller reports broad loading stages without inventing a percentage, turns a failed stage into a plainly different Retry action, and gives each retry a new attempt identity. A late result from an abandoned attempt is cleaned up rather than allowed to construct a second `Game` or replace the successful attempt.

That pre-module copy uses `font-display: swap`, so its system fallbacks remain visible while the authored webfonts travel. Canvas keeps the stricter rule below: the game does not reveal a composed frame until its exact fonts are loaded and warmed. The deterministic harness is a separately named production chunk and auto-starts only when `harness.html` marks its document with `data-violet-harness="true"`. Build generation rejects any production character runtime whose static dependency graph reaches a harness or boot-review module; loading a chapter must never execute review entry-point side effects, resize the live Canvas, or transfer the fixture catalog.

The boot surface stays in front until the fonts and the complete title composition needed for the first visible frame have decoded: the painted backdrop, the correct new-or-returning action, and Violet's currently visible title pose. Idle and blink frames may warm afterward; they are not allowed to hold the first reveal hostage. This is the first use of the wider production rule that readiness belongs to a composition, not to the whole asset library.

The same rule governs entering the adventure, changing rooms, and beginning a set piece. The shell prepares the chapter presentation, the characters and poses visible in the incoming frame, and the required room painting or room variant before it adopts that frame. Until those promises settle, the player keeps seeing the last complete title or room composition. Incoming simulation time, set-piece time, music, and voice do not get a head start behind the loading state. A failed required image keeps that complete frame in place and exposes a retry; production never deliberately reveals a half-painted room beside procedural or partially decoded character art.

Chapter descriptors remain lightweight enough to discover the book without importing every chapter. Before `World` is constructed, the runtime loader resolves the active chapter plus its immediate transition target and injects their synchronous content registry, maps, recaps, and asset keys into the game shell. Presentation follows the same activation boundary. A replay or later transition prepares any chapter that is not already in that scope before switching to it. This active-plus-next contract lets `World` remain synchronous and deterministic while later chapter content and presentation stay out of the startup graph.

## Module layout

```
src/
  main.js                     staged boot, dynamic runtime load, retry, lifecycle cleanup
  boot/                       pre-module copy + generation-safe boot attempt controller
  style.css
  game/
    Game.js                   loop, input routing, screen transitions, render orchestration
    config.js                 frozen tunables: WORLD (1280×720 virtual), timing, hint ladder
                              delays, duel windows, palette constants
    world/World.js            HEADLESS sim (see above)
    characters/
      CharacterDefinition.js  immutable identity, capability, bounds, asset contract
      CharacterRegistry.js    duplicate-safe definitions + lazy world/portrait runtimes
      <identity>/              one package per canonical character identity
    systems/
      Dialogue.js             voiced line queue, captions, icon choices, replay
      Quests.js               flag machine: steps, triggers, rewards, hint-ladder state
      Spellbook.js            known spells, target resolution, cast lifecycle,
                              incantation-assembly state (learning layer)
      Encounters.js           duel/puzzle-fight state machine — seeded, deterministic
      Minigames.js            enter/succeed/celebrate contract (broom, potion, quill)
      Learning.js             adaptive tile difficulty (hidden letterSkill), parent dial
      Save.js                 schema, autosave, migrations, backup, export/import, guard
    entities/                 Violet, NPC, Pet, Prop simulation-facing state
    render/
      RoomRenderer.js         cached-background compositing, hotspot glows, exits
      RegisteredCharacterRenderer.js exact identity + world/portrait dispatch
      FullFrameCharacterRig.js manifest-driven world/portrait frame selection
      AlignedSpriteRig.js     aligned-canvas transforms and orientation
      UIRenderer.js           HUD, spell fan, ribbons/tiles, satchel, map, parent panel
      Particles.js            pooled sprite particles, pre-rendered glow sprites
    core/
      math.js                 clamp/lerp/easing (crib soccer's, add easeOutBack users)
      rng.js                  seeded PRNG (mulberry32) — all sim randomness goes through it
      SoundEngine.js          WebAudio SFX buffers + <audio> music loops, ducking,
                              unlock-on-first-tap, mute persistence, synth fallback
      assetManifest.js        SINGLE SOURCE OF TRUTH for every art/voice/sfx/music file
      assetUrl.js             BASE_URL-relative paths + ?v=<build SHA> busting
      ServiceWorkerManager.js post-title registration for bounded revision caches
      VersionWatcher.js       polls version.json, prompts reload on new deploy
    content/
      chapterDescriptor.js    metadata + independent content/presentation/harness loaders
      chapterAuthoring.js     immutable pure-data room and scene helpers
      chapterComposer.js      duplicate-safe fragment composition + explicit scene order
      chapterLinker.js        aggregate reference resolution through injected registries
      vocabulary.js           core caption vocabulary (the deliberate sight-word set)
      spells.js               spell defs: id, verb, icon, incantation (+ syllable split,
                              phonetic TTS spelling), signature color/sfx
      cards.js                chocolate frog card defs
      chapters/
        ch1.js … ch8.js       rooms, hotspots, NPCs, dialogue scripts, quest graphs,
                              encounter defs, learning beats — DATA ONLY
```

## Content data contracts (shapes that tests enforce)

```js
// A room
{ id: 'ollivanders', bg: 'rooms/ollivanders',        // manifest key
  widthScreens: 1.25, walkBand: [560, 640],           // virtual Y range
  exits: [{ to: 'diagonStreet', x: 60, icon: 'arrow' }],
  hotspots: [{ id: 'wandBoxes', x: 820, y: 420, r: 90,
    kind: 'inspect' | 'talk' | 'spellTarget',
    spell: 'lumos',                                    // spellTarget only
    requires: 'ch1.enteredShop',                       // optional flag gate
    script: 'ollivander.boxes' }] }

// A dialogue script: array of voiced lines / choices
[ { line: 'ollivander.curious', caption: 'Curious…' },
  { choice: [{ icon: 'wand', caption: 'Try it!', set: 'ch1.tookWand' },
             { icon: 'eyes', caption: 'Look' }] } ]

// A quest step
{ id: 'ch3.findToad', give: { line: 'neville.lostToad', caption: 'Help!' },
  objective: { line: 'quest.findToad', mapStar: 'corridorEast' },
  done: 'ch3.toadFound', reward: { points: 10, card: 'trevor' } }

// An encounter phase
{ telegraphs: ['swingLeft', 'swingRight', 'glow'],
  pattern: [['swingLeft'], ['swingRight', 'swingLeft'], ['glow']],
  window: 1.2, opening: { spell: 'leviosa', target: 'club' } }
```

Every id above resolves through the manifest / flag registry / spell table — resolvable-by-construction, verified by lint tests.

## Save system

Schema in [GAME_DESIGN.md](GAME_DESIGN.md#save-and-persistence). Implementation rules:

- Autosave: debounced 500ms after any flag/collection mutation; synchronous write on scene change and `visibilitychange → hidden` (iPad home-button safety).
- `schemaVersion` + ordered migration functions; pre-migration copy to `violets-wizard-save-v1-backup`. A corrupt save never crashes: parse failure → offer backup restore via parent panel, never silent wipe.
- All quest flags are namespaced strings (`ch3.toadFound`) written through one `setFlag()` choke point (which is also where autosave, quest triggers, and tests hook).

## Performance playbook (iPad Safari, 60fps target)

1. **Room background cache** — the big one: composite the painted background + static dressing + baked lighting ONCE into an offscreen canvas at device resolution on room entry; per-frame cost is one `drawImage` plus dynamic entities. Rebuild only on resize/orientation.
2. `getContext('2d', { alpha: false })`; DPR capped at 2; fixed virtual 1280×720 with letterbox scale (soccer pattern).
3. Only the active room simulates; NPC idle animation freezes off-screen during pans.
4. Particles are pooled, hard-capped (~400), and built from pre-rendered gradient sprites. Reviewed character frames are decoded before use and drawn from their aligned canvases; slicing, background removal, and pixel cleanup happen deterministically offline during the per-character production pass, before manifest integration, and never in the frame loop.
5. **Frame budget: ≤5 full-screen-equivalent composite passes** (see SET_PIECES.md §Banned APIs: no `ctx.filter` — *disabled in Safari* — no `shadowBlur`, no per-frame gradient construction, no frame-loop `getImageData`; darkness overlay at half resolution).
6. **Chapter code + assets lazy-load** via dynamic `import()` — startup sees descriptors rather than the whole book; adventure entry injects the active chapter plus its immediate successor, presentation activates for that scope, and each incoming room or set piece prepares only the images and character poses its first complete frame needs.
7. `visibilitychange`: flush save, pause audio, resume the AudioContext if Safari left it `interrupted`.
8. Device gate: every milestone ends with a run on the actual iPad — Safari, added to home screen (fullscreen meta), touch targets and frame rate checked by hand. The early stress scene (6 characters + max particles + darkness overlay) is profiled on the *base* iPad, not a Pro.

## Device reality (red-team verified — rules, not suggestions)

**Canvas memory.** WebKit enforces a *global* cap on live canvas backing stores (224MB on some iOS versions, 384MB on others). Exceeding it throws nothing: Safari logs a console warning, new `getContext('2d')` calls return null, and canvases **silently render transparent**. At DPR 2 a full-screen-class canvas costs ~15.5MB. Rules:

- Hard cap of **5 live full-screen-class canvases**: (1) the visible canvas, (2) current room cache, (3) exactly one preloaded neighbor room cache, (4) the darkness overlay at half resolution (~3.9MB), (5) one scratch. The room-crossfade moment (both room caches live) is the accounted-for peak.
- Evict by setting `canvas.width = canvas.height = 1` **before** dropping the reference — WebKit retains freed stores for a while otherwise; the 1×1 resize forces immediate release.
- Keep ≤3 decoded 2048×1152 room paintings alive (~9.4MB each at RGBA decode size, regardless of their smaller transfer encoding); drop image refs after compositing into a cache.
- **Runtime canary**: every canvas allocation checks `getContext` for null; on null, run emergency eviction and log. Never assume allocation succeeded.

**Image decode.** The first `drawImage` of a 2048×1152 room painting can trigger a ~20–60ms synchronous main-thread decode — a guaranteed hitch mid-gameplay, and Safari can evict decoded data under pressure and silently re-decode later. Rule: `await img.decode()` in the preloader, then **immediately composite into the room cache** (forces the decode; the cache is eviction-immune); neighbor-room work happens during idle/transitions in chunks ≤8ms. `createImageBitmap` is feature-detected optimization only (unreliable before Safari 18.5). Character frames ship as lossless WebP derivatives to reduce transfer size, but they obey the same decode-before-reveal rule.

**Timing.** iOS throttles rAF to 30fps in Low Power Mode (undetectably) and runs 120Hz on ProMotion iPads. Rule: **fixed-timestep simulation** — 1/60s steps from an accumulator fed by rAF timestamps, per-frame elapsed clamped at ~100ms; all tweens are wall-clock-based, never frame-count-based. (This deliberately supersedes the soccer game's variable-dt loop, and it's what makes the verification harness deterministic — see VERIFICATION.md.) Under Low Power Mode the game then plays correctly at 30fps; QA that state explicitly.

**Audio memory.** Decoded WebAudio buffers are Float32 at hardware rate: ~150 voice clips × 3s ≈ **86MB per chapter in mono** (double in stereo); one 3-minute stereo music track ≈ 69MB decoded. Rules: voice clips are **mono AAC/M4A** (Safari's `decodeAudioData` handles WAV/MP3/AAC reliably; never Ogg/Opus); exactly one chapter's buffers resident (drop all references on chapter change; optionally keep the ~50KB compressed ArrayBuffers for cheap re-entry); music and ambience beds stay in `<audio>` elements (streamed, hardware-decoded, a few MB total). Unlock on the title-screen tap: `ctx.resume()` + play a 1-sample silent buffer + prime the music `<audio>` elements with a muted play/pause. Do not start incoming music or voice until its visible composition is ready, so narration cannot run ahead of a slow room or character request. Handle Safari's non-standard `interrupted` AudioContext state (backgrounding, screen lock, Smart Cover) with a `visibilitychange`/`focus` handler that calls `resume()`.

**Fonts.** Canvas `fillText` with a not-yet-loaded face silently bakes the fallback font into the frame forever (canvas never reflows). Rule: explicit `new FontFace(...).load()` (or `document.fonts.load('700 32px …')`) for **every weight/style actually used**, awaited in the preloader, then one warm-up `fillText` offscreen — `document.fonts.ready` alone is not a sufficient gate. Re-set `ctx.font` after any canvas resize (resizing resets all context state). Static labels render once into sprite canvases — `fillText` is among the slowest per-frame 2D ops and the most platform-fragile pixel source for goldens.

**Color.** Everything is sRGB: art exported as sRGB, every canvas on the default color space. Never opt into `colorSpace: 'display-p3'` — it changes blend arithmetic and diverges from the test environment.

**Node.** This machine's non-interactive shells resolve node v14 (breaks Vite 7 and Playwright). The repo ships `.nvmrc` (22.17.0), an `"engines"` field, and a fail-fast version guard in every `scripts/*.mjs`.

## Testing (Vitest, all headless)

- **Chapter walkthrough sims** — the crown jewel, enabled by the World/Game split: a test drives `World` through an entire chapter with scripted taps and asserts completion, flag order, and that no state ever dead-ends. One per chapter, run in CI.
- **Quest machine**: transitions, hint-ladder escalation timing, reward idempotence (no double-grants on replay).
- **Save**: roundtrip, every migration path, corrupt-JSON recovery, backup restore.
- **Encounters**: seeded determinism (same seed → same telegraph sequence), rubber-band widening math, phase checkpoint persistence across simulated "losses."
- **Spellbook/learning**: target resolution, assembly tile sequences (including wrong-tap paths), adaptive counter bounds, `learning: off` bypass.
- **Content lint** (the contract police, run on every chapter data module):
  - every dialogue line id has a manifest voice entry AND a caption of ≤ 3 words, drawn from `vocabulary.js` or whitelisted proper nouns;
  - every hotspot/exit/mapStar/flag/spell/card id resolves;
  - every quest graph is completable (topological reachability from chapter start);
  - every manifest entry exists on disk with sane size (> 1KB), and every disk asset is in the manifest (`npm run check:assets`, robotgame pattern — build fails on drift).
- **Architecture lint**: the generic engine may not import concrete chapter or character implementations, runtime code may not import reference-only `art` or `audio`, headless code may not touch browser or nondeterministic APIs, and generic dispatch may not route on chapter or named-character literals. The temporary allowance is exact and stale-entry checked, so each extraction visibly reduces the remaining debt.

## Deploy

GitHub Pages, mirroring the siblings:

- `vite.config.js` `base: './'`; all asset paths through `assetUrl()` (`import.meta.env.BASE_URL` + `?v=<SHA>`).
- CI on push to `main`: tests + content lint + `check:assets` + build → Pages **artifact** workflow (soccer's `pages.yml`). If artifact deploys flake, fall back to the gh-pages branch force-push workflow (robotgame's proven plan B).
- `version.json` written at build (SHA + timestamp); `VersionWatcher` polls it and offers reload — beats Pages' stale-HTML caching (the robotgame war).
- Production builds also emit a service worker whose cache name contains that full SHA. It precaches only the shell, fonts, title painting and action, and Violet's critical title frames; visited images, scripts, styles, and fonts join the current revision cache on demand. Range requests and `version.json` bypass it, so streamed audio and update detection keep their existing semantics. Registration waits until the title composition is ready and the browser is idle (with a short timer fallback), preventing cache installation from competing with a cold first paint. Activation removes older game revisions only after the new cache is installed; the game remains network-capable if registration itself fails.
- Review pages and review chunks are never cached as part of the game shell. The worker handles navigation only for the deployed scope root and `index.html`; `harness.html` remains an ordinary network navigation and must fail normally when the server is unavailable rather than receiving the game page.
- Deploy verification, day to day: CI green is trusted (it gates on the full test/lint/asset battery). The five-layer checklist (workflow green → deployment advanced → Pages status → live `version.json` matches SHA → live HTML references the new bundle) is a **debugging tool for when a deploy looks wrong**, plus a one-time proof at pipeline setup — not a per-push ritual (D32).
- iPad meta: `viewport-fit=cover`, `apple-mobile-web-app-capable`, home-screen icon + title, `user-scalable=no`.

## Dev workflow

```bash
npm run dev          # Vite dev server
npm test             # Vitest (sim + lint suites)
npm run check:architecture # package boundaries + deterministic/headless boundaries
npm run check:assets # manifest ⇄ disk ⇄ scripts drift gate
npm run build        # production build (runs check:assets first)
```

Asset generation (offline, keys from env, committed outputs):

```bash
python3 scripts/generate_rooms.py --chapter 1        # OpenRouter images
node scripts/generate_voice.mjs --chapter 1          # ElevenLabs + transcription QA
node scripts/generate_sfx.mjs / generate_music.mjs
```

Repo gets `AGENTS.md` (+ one-line `CLAUDE.md` pointing at it) at code-start, carrying the sibling conventions: conversational report style, never commit `dist`/`node_modules`/keys/runtime state, preserve uncommitted changes, pre-push build check.
