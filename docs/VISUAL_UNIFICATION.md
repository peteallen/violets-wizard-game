# The Visual Unification Pass

## Why

Pete's review of the deployed Chapter 1 (2026-07-13), confirmed by screen-by-screen inspection: the game renders **three fidelity tiers on every screen** — production-grade painted rooms, clipart-grade character puppets, wireframe-grade UI chrome — plus a fourth visual language of debug-looking affordances (dashed rings, tiny diamonds) and pervasive helper text that a non-reading six-year-old can't use. Individually defensible; together they read as amateur and undercut rooms that are genuinely beautiful. Separately, a batch of catalogued clarity bugs makes the game feel arbitrary ("things don't make sense").

This pass unifies everything to **one fidelity tier** before any new content is built, and it is the true completion of the M2 gate: Violet's first playtest happens after this pass, not before.

**Evidence base:** `output/playwright/blind-public-2-*.png` (full deployed playthrough), the six-dimension progress review (2026-07-13), and the illusion-checklist gap it exposed — geometric checklists pass screens that fail taste.

## The Storybook Standard (the "one tier" definition)

The bar, in one sentence: **everything on screen must look like it was illustrated by the same hand that painted the rooms.** Concretely, every element — character, prop, UI surface, effect — must satisfy:

1. **Palette**: colors sampled from or harmonized with the room palettes (ART_DIRECTION table). No pure `#000`/`#fff` fills; darkest ink is `#3a2d22`-family, lightest is parchment-family.
2. **Line**: soft dark-brown outlines with subtly varying weight. No uniform geometric strokes.
3. **Form**: nothing flat-filled. Every fill region carries ≥2 tones (base + shadow) plus a highlight where the key light hits. Fabric gets fold bands; wood gets grain hints; metal gets a sweep.
4. **Light**: one key light, warm, upper-left (matches the room prompts). Characters get a baked rim-light on the lit side.
5. **Texture**: UI surfaces carry parchment/paper grain (pre-rendered overlay sprites — cheap, within the banned-API rules).
6. **Shape**: hand-drawn wobble. No perfect rectangles, circles, or straight lines on any player-facing surface — corners are softly irregular, edges deckled. (Perfect geometry is precisely what reads as "programmer art.")
7. **The squint test**: squinting at a screenshot, no element should pop out as belonging to a different app.

These seven become a mandatory **Storybook Standard section in every illusion checklist** — phrased as countable checks (see Process, below).

## Workstream 1 — Characters (the biggest lever)

The puppets are the largest quality gap and Violet-the-puppet is on every screen. The fix is not "try harder" — it's giving builders a **visual target instead of adjectives**:

- **VU-00 Reference art first.** Generate painted character reference sheets in the exact room style (same style-prefix, front-facing full body + face close-up) for: Violet, Hagrid, the three shopkeepers, the hero owl, all three pets. These are *style targets, not shipped assets* — committed under `art/character-refs/` with prompts. Every puppet rebuild is reviewed **side-by-side against its reference**; the checklist question becomes "does the puppet look like this painting's cartoon sibling?" — answerable by an agent from a still.
- **Anatomy of the lift** (per ART_DIRECTION, now enforced): real eyes (iris + pupil + catch-light + lids — blinks are lid shapes, never a bar: the current title owl's blink frame reads as broken eyes in stills); eyebrows and cheek blush; hair as shaded masses with interior strand lines (Violet's messiness = the in-flight soft wisps, never spikes); robes with fold shading, collar/cuff detail, her purple lining and sneakers (D11); baked rim-light; soft varying outline.
- **One face construction shared by puppet and portrait** (two detail tiers, same bones) so a character standing next to their own dialogue portrait no longer reads as two different games.
- Order: **Violet first** (VU-01), then Hagrid + shopkeepers + owl + pets (VU-02). The in-flight hair-wisp work folds into VU-01.

## Workstream 2 — Affordances: one language, a salience hierarchy, and a lifecycle (VU-03)

Pete's playtest feedback (2026-07-13) sharpened this workstream: the dashed rings aren't just ugly — they're *confusing*. They appear everywhere at equal strength (five at once in Diagon Alley), they don't distinguish "your next step" from "optional fun," and they sometimes persist after the interaction is spent. That's three distinct defects: a style problem, a missing **salience hierarchy**, and a missing **affordance lifecycle**. All three are VU-03.

### The language (style)

Kill the dashed marching-ant rings and scattered diamond sparkles everywhere. One language, per ART_DIRECTION: **warm gold shimmer on the object itself** — a soft pre-rendered glow halo hugging the object's bounds + slow orbiting sparkle motes. The object glows; no abstract overlay shapes, ever.

### The hierarchy (attention budget)

Three salience tiers, strictly enforced:

1. **The golden thread** — the current objective's target. The strongest shimmer, and **exactly one on screen at any time**. If the objective's target is in another room, the room's exit/door carries the thread instead. She should always be able to answer "what's next?" by looking for the brightest gold thing.
2. **Discoverables** — optional interactables (shop browsing, flavor props, characters with idle lines). **No persistent glow.** They advertise via an occasional soft glint (~1.5s, staggered so no two glint simultaneously) and light up with the shimmer only on press-down (the arm-on-down input pattern already in the engine). Curiosity gets rewarded, not solicited.
3. **Secrets** (hidden frog cards) — rarer, fainter glint (~2s every ~8s), plus the pet occasionally wandering over and pawing at the spot (the GAME_DESIGN richness-layer affordance, currently unimplemented).

**Budget rule, checklist-enforced:** one golden thread + at most two visible glints in any 3-second window. A screen with five simultaneous advertisements is a defect by definition, regardless of how pretty each one is.

### The lifecycle (state correctness)

Affordance state derives from quest/flag state — mechanically, not by hand-authoring:

- **Spent hotspots go quiet.** When a hotspot's quest step completes or its script is exhausted to repeat-flavor, it drops out of the advertisement system entirely (still tappable for flavor — never advertised). Fixes "the ring is still there after I'm done."
- The golden thread **moves the instant the objective advances** (same event that updates the quest star and map star).
- The hint ladder plugs in as intensity, not new symbols: idle escalation brightens the existing golden thread and (rung 3+) sends the sparkle trail toward it.
- While dialogue, set pieces, or walking are active, all affordances quiet to nothing — the world doesn't blink for attention while someone is talking.
- Headless-testable: `World.snapshot()` exposes per-hotspot salience tier, so tests assert the budget ("exactly one thread; spent hotspots tier-none") across full chapter walkthroughs — this is a sim feature wearing art clothes.

### Map

The map objective is an actual glowing star on the destination — always present for the current objective (fixes the "tap the golden star" / no-star contradiction), and it's the same golden-thread visual language.

## Workstream 3 — Diegetic UI (VU-04, VU-05)

- **Dialogue panel rebuild (VU-04)**: the full-width cream slab becomes a **parchment scroll banner** — bottom ~22% of the screen, deckled edges, slight hand-placed rotation, portrait in a small gilt frame, caption chip integrated. **Hard layout rule: the active speaker's puppet is never occluded** — the panel narrows or shifts opposite the speaker. Warm-dark parchment variant for night rooms so the panel stops fighting moody paintings.
- **Satchel & map rebuild (VU-05)**: the flowchart-in-a-book becomes an **illustrated map** — a generated parchment map painting of Diagon Alley (stylized vignette composition; the pipeline's first UI painting) with locations as small painted vignettes, the objective star glowing, dotted ink path drawn as quill strokes. Tabs become leather bookmarks; the software gear becomes a **brass keyhole** (voiced "Ask a grown-up!" on tap); locked locations get soft fog, not gray boxes with X's. Icon audit across the game: every icon pictorial and diegetic (wand, robe, paw — never hearts/X's/gears).

## Workstream 4 — Text purge (VU-07)

**Rule (tightens GAME_DESIGN):** during play, on-screen text is caption chips (≤3 words) and proper nouns on title/chapter cards. Nothing else. Voice + icons carry all instruction. The parent panel is exempt (it's *for* adults).

Kill list from the current build: "Tap the page to continue" (the pulsing arrow already exists — first-time voice hint covers it), "A map that remembers where Violet needs to go," "Tap to travel," "Violet goes here," "Still hidden," "Hold for grown-ups," "Best with sound on" clutter, the title's subtitle sentence and envelope eyebrow text. Each removal that loses information gains a voice line (small VU voice-gen batch rides the existing pipeline + QA loop).

## Workstream 5 — Title v3 (VU-06)

The in-flight redesign is a real step up (keep: Almendra masthead, composition, owl placement) but it's typography-forward. v3 goes **illustration-forward**: a painted hero night scene — the castle across the lake with warm windows (generated once, and it *is* the Chapter 2 lake-vista painting, so the asset does double duty) — Violet-and-owl vignette, masthead, and **one glowing envelope to tap**. Text: title + button label, nothing else. Absorbs and supersedes the uncommitted title work; the owl blink fix lands here.

## Workstream 6 — Clarity bug batch (VU-08)

The "doesn't make sense" list, fixed in one sweep (all engine/content, parallel-safe with art work):

1. **Empty walk-taps no longer count as puzzle failures** — the hint ladder's failure rungs scope to interactions with the active puzzle; idle-time rungs (pet glance, voice repeat) remain time-based. Five happy taps must never auto-complete the letter.
2. **The written letter text = the narrated text, exactly**, original wording only — and "We await your owl." is removed (near-verbatim book fragment; hard IP line).
3. **Map star exists at the map-teaching step** (see Workstream 2).
4. **Quest-star pulse means something**: pulses for ~8s when an objective arrives, then settles (`newObjective` currently initialized true and never cleared).
5. **Tap-to-walk gets taught diegetically**: Hagrid walks ahead to the door, turns, beckons with a voiced "This way!" — sparkle footprints trace the ground between him and Violet.
6. **"Curious…" restored** as the Wandmaker's whispery beat (spec flavor, cheap).
7. The always-on "Again" replay affordance and pulsing next-arrow stay — they tested fine.

## Prerequisite: land the in-flight diff (VU-pre)

Before the pass starts, the working tree goes green and empty: the Nimbus caption and on-screen title are decided (D30 — "Flying broom!" and **Violet at Hogwarts**, aligned in index.html), changed scenes re-captured and self-reviewed, decisions logged, committed.

## Process changes (VU-09 — velocity-first, per D32)

1. **Checklists gain the Storybook Standard section** — countable checks: every fill region ≥2 tones; outline colors within the ink range; no perfect-geometry primitives on player-facing surfaces; palette sampled within room-palette distance; element passes the squint test vs. its reference sheet.
2. **Side-by-side self-review**: agents capture character/UI work next to its reference art in the same image strip and judge the match themselves — a tool for hitting the bar, not an approval step.
3. **No human gates anywhere** (D32): no GIF approvals, no PENDING queue, no golden blessing. Agents self-review strictly, merge when green, and ship; CI (tests + content lint + asset checks) is the only gate. Taste-risky changes get a plain-language heads-up in the report so Pete knows what to look at *in the deployed game*.
4. Log the drift batch this pass resolves in DECISIONS.md as it lands (dashed-ring removal, text rule, map rebuild replacing the hardcoded renderer bypass, etc.).

## Order and gating

```
VU-pre (land in-flight diff, tree green)
  → VU-00 Standard + reference art        ← everything below depends on the refs
      ├─ VU-01 Violet rebuild → VU-02 cast rebuild        (character track)
      ├─ VU-03 affordance language                        (parallel)
      ├─ VU-04 dialogue panel → VU-05 satchel/map         (UI track)
      └─ VU-08 clarity bugs                               (parallel, engine/content)
  → VU-06 title v3 + VU-07 text purge     ← after the language/UI tracks settle
  → VU-09 checklist upgrades land in docs/tests
  → deploy continuously → **Violet's first playtest** (the real M2 gate, at last)
```

Every VU work package follows the standing loop (VERIFICATION.md): implement → capture → self-review against the upgraded checklist → merge when green. Commit and push **every green increment** (D33) — several pushes per session — so the GitHub Pages build is always current; Pete tests there continuously and feedback arrives as conversation.

## Non-goals

No new chapters, mechanics, spells, or rooms. No changes to the sim/engine architecture beyond the clarity fixes. The room paintings themselves are untouched — they're the standard everything else is rising to.
