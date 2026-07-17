# The Visual Unification Pass

## Why

Pete's review of the deployed Chapter One build on 2026-07-13 found **three
fidelity tiers on every screen**: production-grade painted rooms,
clipart-grade character puppets, and wireframe-grade interface chrome, plus a
fourth visual language of debug-looking affordances and too much helper text for
a six-year-old who is still learning to read. That review launched this pass;
it is historical evidence, not a description of the current Chapter One build.

Chapter One's rebuilt storybook cast, clearer travel, and painted satchel are
now deployed. Chapter Two is also playable end to end. The active application
of this standard is the approved Chapter Two Phase 2 fidelity and reliability
pass, which is underway but not yet complete. The detailed workstreams below
remain the visual contract and design record; their original sequencing should
not be mistaken for the current execution queue, which lives in
[BUILD_PLAN.md](BUILD_PLAN.md).

**Evidence base:** `output/playwright/blind-public-2-*.png` (full deployed playthrough), the six-dimension progress review (2026-07-13), and the illusion-checklist gap it exposed — geometric checklists pass screens that fail taste.

## The Storybook Standard (the "one tier" definition)

The bar, in one sentence: **everything on screen must look like it was illustrated by the same hand that painted the rooms.** Concretely, every element — character, prop, UI surface, effect — must satisfy:

1. **Palette**: colors sampled from or harmonized with the room palettes (ART_DIRECTION table). No pure `#000`/`#fff` fills; darkest ink is `#3a2d22`-family, lightest is parchment-family.
2. **Line**: soft dark-brown outlines with subtly varying weight. No uniform geometric strokes.
3. **Form**: nothing flat-filled. Every fill region carries ≥2 tones (base + shadow) plus a highlight where the key light hits. Fabric gets fold bands; wood gets grain hints; metal gets a sweep.
4. **Light**: one warm key light matching the actual room painting. Upper-left remains the default used by the reference sheets, but room data records exceptions; the sunlit bedroom is keyed from its right-hand window. Characters get a baked rim-light on the room-lit side.
5. **Texture**: UI surfaces carry parchment/paper grain (pre-rendered overlay sprites — cheap, within the banned-API rules).
6. **Shape**: hand-drawn wobble. No perfect rectangles, circles, or straight lines on any player-facing surface — corners are softly irregular, edges deckled. (Perfect geometry is precisely what reads as "programmer art.")
7. **The squint test**: squinting at a screenshot, no element should pop out as belonging to a different app.

These seven become a mandatory **Storybook Standard section in every illusion checklist** — phrased as countable checks (see Process, below).

## Workstream 1 — Characters (the biggest lever)

The puppets were the largest quality gap in the original Chapter One review,
and Violet remains on nearly every screen. VU-00 established the Storybook
Standard and its countable checks; the room paintings and existing reference
material remain the visual target. Character production no longer waits on a
second set of style-only reference sheets.

VU-01 and VU-02 follow [CHARACTER_PIPELINE.md](CHARACTER_PIPELINE.md). Each
character is generated with `google/gemini-3.1-flash-image` through
`google-vertex/global` as one coherent multi-view and core-action production
sheet, plus only a minimal coherent supplement if the inventory does not fit.
The named panels proposed for shipping are reviewed fresh in the context of all
batch sheets, sliced deterministically, and connected to the real game
immediately; malformed unused figures do not block that subset. Violet V8 is the
locked identity for VU-01; her neutral design is not regenerated. Once the
assembled character is moving in its actual rooms and dialogue, only defects
visible in the required captures or in play are refined.

The intended lift remains concrete: real eyes and readable blinks, expressive
brows and cheeks, shaded hair masses without antenna-like spikes, articulated
limbs and hands, clothing with material and fold detail, room-consistent light,
a stable floor-space contact shadow, and softly varying outlines. These are
judged across the proposed shipping subset and the assembled game character, not expanded
into a separate generation-and-review loop for every body part. Puppet and
portrait share one face construction at two useful detail tiers. The Chapter
One order — Violet, Hagrid, the Wandmaker, Madam Malkin, the Menagerie keeper,
the narrator portrait, the post owl, the cat, the pet owl, and the toad — is
complete and deployed. Phase 2 now applies the same complete-character loop to
the conductor, Sorting Hat, Harry, Ron, Hermione, trolley witch, deputy head,
Headmaster, portrait guardian, and Violet's Chapter Two supplemental actions.
Those Chapter Two upgrades are targets until their individual green increments
land.

## Workstream 2 — Affordances: one language, a salience hierarchy, and a lifecycle (VU-03)

Pete's playtest feedback (2026-07-13) sharpened this workstream: the dashed rings aren't just ugly — they're *confusing*. They appear everywhere at equal strength (five at once in Diagon Alley), they don't distinguish "your next step" from "optional fun," and they sometimes persist after the interaction is spent. That's three distinct defects: a style problem, a missing **salience hierarchy**, and a missing **affordance lifecycle**. All three are VU-03.

The Chapter One implementation is deployed. Chapter Two Phase 2 preserves this
same attention budget and lifecycle while adding new friend, feast, password,
and page-turn interactions.

### The language (style)

Kill the dashed marching-ant rings and scattered diamond sparkles everywhere. One language, per ART_DIRECTION: **warm gold shimmer on the object itself** — a soft pre-rendered glow halo hugging the object's bounds + slow orbiting sparkle motes. The object glows; no abstract overlay shapes, ever.

### The hierarchy (attention budget)

Three salience tiers, strictly enforced:

1. **The golden thread** — the current objective's target. The strongest shimmer, and **exactly one *assigned* at any time** (rendered only during active-play states — see the lifecycle rules below for when affordances draw at all). If the objective's target is in another room, the room's exit/door carries the thread instead. She should always be able to answer "what's next?" by looking for the brightest gold thing.
2. **Discoverables** — optional interactables (shop browsing, flavor props, characters with idle lines). **No persistent glow.** They advertise via an occasional soft glint (~1.5s, staggered so no two glint simultaneously) and light up with the shimmer only on press-down (the arm-on-down input pattern already in the engine). Curiosity gets rewarded, not solicited.
3. **Secrets** (hidden frog cards) — rarer, fainter glint (~2s every ~8s), plus the pet occasionally wandering over and pawing at the spot. This GAME_DESIGN richness-layer cue is deterministic, never moves Violet or takes her input away, goes quiet with every other affordance during dialogue, set pieces, overlays, and walking, and stops once the card has been collected.

**Budget rule, precisely** (checklist- and test-enforced): one assigned golden thread + at most **two glint activation *starts* in any inclusive rolling 3-second window** (counting starts, not overlap — two glints whose tails overlap a third's start still satisfy the rule only if no 3s window contains three starts). A screen with five simultaneous advertisements is a defect by definition, regardless of how pretty each one is.

### The lifecycle (state correctness)

Affordance state derives from quest/flag state — mechanically, not by hand-authoring:

- **Spent hotspots go quiet.** When a hotspot's quest step completes or its script is exhausted to repeat-flavor, it drops out of the advertisement system entirely (still tappable for flavor — never advertised). Fixes "the ring is still there after I'm done."
- The golden thread **moves the instant the objective advances** (same event that updates the quest star and map star).
- The hint ladder plugs in as intensity, not new symbols: idle escalation brightens the existing golden thread and (rung 3+) sends the sparkle trail toward it.
- While dialogue, set pieces, or walking are active, **zero affordances render** — the thread stays *assigned* in the sim but draws nothing; the world doesn't blink for attention while someone is talking. (This is the reconciliation of "exactly one thread" with "quiet during dialogue": assignment is constant, rendering is state-gated.)
- Headless-testable: `World.snapshot()` exposes, per hotspot, its **salience tier** (`thread` / `discoverable` / `secret` / `none`) plus the **render-quiet state flag**, **glint activation timestamps**, and the active pet hint's target/stage. Tests assert the budget mechanically across full chapter walkthroughs: exactly one `thread` assigned; zero rendered during quiet states; no inclusive rolling 3s window containing >2 glint starts; pet hints reproduce from simulation time without changing Violet's movement state; spent hotspots at `none`. This is a sim feature wearing art clothes.

### Map

The map objective is an actual glowing star on the destination — always present for the current objective (fixes the "tap the golden star" / no-star contradiction), and it's the same golden-thread visual language.

## Workstream 3 — Diegetic UI (VU-04, VU-05)

- **Dialogue panel rebuild (VU-04)**: the full-width cream slab becomes a **parchment scroll banner** — bottom ~22% of the screen, deckled edges, slight hand-placed rotation, portrait in a small gilt frame, caption chip integrated. **Hard layout rule: the active speaker's puppet is never occluded** — the panel narrows or shifts opposite the speaker. Warm-dark parchment variant for night rooms so the panel stops fighting moody paintings.
- **Satchel & map rebuild (VU-05)**: the flowchart-in-a-book becomes an **illustrated map** — a generated parchment map painting of Diagon Alley (stylized vignette composition; the pipeline's first UI painting) with locations as small painted vignettes, the objective star glowing, dotted ink path drawn as quill strokes. Tabs become leather bookmarks; the software gear becomes a **brass keyhole** (voiced "Ask a grown-up!" on tap); locked locations get soft fog, not gray boxes with X's. Icon audit across the game: every icon pictorial and diegetic (wand, robe, paw — never hearts/X's/gears).

The dialogue composition and deterministic parchment satchel are now deployed.
Painted Map and Cards bookmarks own top navigation; the grown-up keyhole and
Start fresh luggage tag sit on the bottom book edge; close is the only X. Four
textless painted destination panels form a left-to-right journey, while
code-rendered names sit inside each panel's deliberate blank parchment band.
Here, completed-stop checks, and the written Next flag make current state and
intended travel explicit without baking progress into the art. Chapters Two and
Three have no authored travel map, so their registered review scenes open
directly to a single centered Cards bookmark instead of showing a misleading
Chapter One Map page. Generated source art and prompts live under
`art/ui/satchel`; only keyed WebP props ship. Phase 2 keeps this deployed surface
and makes only the scene-specific composition changes Chapter Two needs.

## Workstream 4 — Text rule (VU-07)

**Rule (tightens GAME_DESIGN; exceptions per D36):** during play, on-screen text is caption chips (≤3 words) and proper nouns on title/chapter cards — plus two deliberate exceptions: **readable story objects** (the letter's parchment, spellbook incantations, rune tiles, potion labels — reading them *is* the content per the learning layer, and their written words must match any narration verbatim) and **short action labels on primary controls** (≤3 easy caption-vocabulary words: "Hear the letter", "Again", the update prompt's "Reload"/"Later"). Everything else — helper sentences, subtitles, state labels — dies; voice + icons carry all instruction. The parent panel is exempt (it's *for* adults).

The original kill list included "Tap the page to continue," "A map that
remembers where Violet needs to go," "Tap to travel," "Violet goes here,"
"Still hidden," "Hold for grown-ups," "Best with sound on," the title subtitle,
and the envelope eyebrow. It remains here as a regression checklist rather than
a claim that all of this clutter is present in the current build. Any removal
that loses information gains a voice line through the existing generation and
quality-assurance pipeline.

## Workstream 5 — Title (VU-06)

The deterministic castle, reflective lake, mist, shore, Violet, and owl
composition is deployed with the Almendra masthead and one envelope action. The
earlier idea of sharing a newly generated title painting with the Chapter Two
lake vista did not become part of the Chapter One delivery and is not part of
the active Phase 2 scope; Chapter Two keeps its current lake painting while
receiving dedicated end-card and Chapter Three preview art.

## Workstream 6 — Chapter One clarity record (VU-08)

The original "doesn't make sense" list remains recorded here as acceptance
history. It is not the Chapter Two Phase 2 queue, and an item should not be
treated as currently broken without checking the deployed behavior:

1. **Empty walk-taps no longer count as puzzle failures** — the hint ladder's failure rungs scope to interactions with the active puzzle; idle-time rungs (pet glance, voice repeat) remain time-based. Five happy taps must never auto-complete the letter.
2. **The written letter text = the narrated text, exactly**, original wording only — and "We await your owl." is removed (near-verbatim book fragment; hard IP line).
3. **Map star exists at the map-teaching step** (see Workstream 2).
4. **Quest-star pulse means something**: pulses for ~8s when an objective arrives, then settles (`newObjective` currently initialized true and never cleared).
5. **Following Hagrid is taught diegetically** (D45): after his bedroom introduction Hagrid walks out through the bedroom door; after his voiced “This way!” in the Leaky Cauldron he walks out through the courtyard door. Violet remains behind with sparkle footprints and the golden-threaded door to follow. The game never asks her to tap Hagrid a second time.
6. **"Curious…" restored** as the Wandmaker's whispery beat (spec flavor, cheap).
7. The always-on "Again" replay affordance and pulsing next-arrow stay — they tested fine.

## Process rules (velocity-first, per D32)

1. **Inspect complete outcomes**: character work inspects the named proposed shipping subset in the context of all generated batches, then proceeds to deterministic slicing and immediate integration. The assembled character is captured in the game at both required sizes and inspected again as a complete player-visible result. There is no per-frame approval queue, and unused malformed figures do not block selected panels.
2. **No review gates anywhere** (D32, D64): no GIF approvals, no PENDING queue, no golden blessing, and no separate reviewer requirement. Agents self-review strictly before the local `npm run build` gate and merge. CI re-runs the full test, asset, voice, audio, and bundle battery and gates deployment. Taste-risky changes get a plain-language heads-up in the report so Pete knows what to look at *in the deployed game*.
3. **Fix what play exposes**: after integration, character refinements answer player-visible defects in captures or play. Source-level concerns that disappear at runtime scale do not restart production.
4. Log the drift batch this pass resolves in DECISIONS.md as it lands (dashed-ring removal, text rule, map rebuild replacing the hardcoded renderer bypass, etc.).

## Active order and stopping point

```
Chapter One storybook cast, travel, and satchel deployed
  → capture the playable Chapter Two baseline
  → repair Chapter Two save, completion, and contract seams
  → deliver one complete Chapter Two character or story slice at a time
  → dual-resolution, reduced-motion, build, and deployed iPad review
```

The locked Violet V8 identity remains the source for any Chapter Two supplemental
actions and is not regenerated. The Chapter Two pass follows the detailed order
in [BUILD_PLAN.md](BUILD_PLAN.md); nothing in this visual record authorizes
Chapter Three gameplay or speculative character inventory.

Every VU work package follows the standing loop (VERIFICATION.md): implement → capture → self-review against the upgraded checklist → merge when green. For character work, the increment is one complete playable character rather than one isolated sprite. Commit and push **every green increment** (D33) so the GitHub Pages build is always current; Pete tests there continuously and feedback arrives as conversation.

## Non-goals

No Chapter Three gameplay, alternate house outcomes, friendship meter, or broad
renderer-monolith rewrite. The six current Chapter Two room paintings remain the
standard everything else rises to; Phase 2 adds only the approved feast variant,
Chapter Two end card, and Chapter Three preview art. Focused simulation, save,
contract, and presentation changes are allowed where Chapter Two's reliability
and assembled scenes require them.
