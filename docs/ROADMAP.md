# Roadmap

Build order optimized for two things: reaching a real Violet playtest as fast as possible (her feedback should shape everything downstream), and never building content on unproven engine ground.

## Milestones

### M0 — Foundations (no gameplay)
Repo init (with `.nvmrc` — see ARCHITECTURE.md §Device reality), Vite/Vitest skeleton cribbed from the soccer game, CI with tests + `check:assets` + build, deploy pipeline proven end-to-end with a placeholder scene (verify all five deploy layers once, before it matters), **the verification harness + capture tooling (VERIFICATION.md) — built before any visual work exists, because retrofitting determinism is brutal**, `AGENTS.md`/`CLAUDE.md` house conventions. **Gate: a placeholder screen live on the iPad from the real URL, and a captured keyframe strip of it reviewed by an agent.**

### M1 — Engine core + spikes + Chapter 1 grey-box
World/Game split running (fixed-timestep); rooms, tap-walk, hotspots, dialogue (with captions; early voice placeholders were nonverbal synth blips, never browser text-to-speech), map travel, save/resume, HUD (wand/satchel/quest star), hint ladder. The foundational brick-wall, mirror, style-seam, and memory-ceiling spikes ran here on placeholder art, through the harness review loop, with results logged to DECISIONS.md before chapter work depended on them. Chapter 1 playable start-to-finish with placeholder rectangles-and-blobs art; chapter-walkthrough test green. **Gate: dad plays grey-box Ch. 1 on the iPad; controls feel right; dad has seen the brick-wall prototype GIF.**

### M2 — Chapter 1 full production ⭐ first Violet playtest
Painted rooms, animated characters, real voice (narrator, Guide, Wandmaker + QA loop), music cues, SFX, the letter-opening moment polished to perfection, pet choice + follow. **Gate: Violet plays Chapter 1. This is the real test of every UX assumption — tap-to-walk comprehension, dialogue pacing, caption reading, hint ladder timing. Everything downstream gets tuned by what we watch her do.**

> **Status 2026-07-16:** Chapter One is deployed end to end with its rebuilt
> storybook character cast, clearer Hagrid-led travel, and painted satchel. That
> work is no longer the active production queue. Per D32 there are no human
> approval gates: agents inspect the registered captures, ship each green
> increment, and Pete's feedback comes from playing the GitHub Pages build.
> "Gates" in this file are milestone checkpoints and feedback moments, never
> approval queues.

### M3 — Chapter 2 polish, then Chapter 3

Chapter Two is already playable on `main`: Violet reaches Platform Nine and
Three-Quarters, rides the train, crosses the lake, is sorted into Gryffindor,
and reaches her common room. Its approved Phase 2 fidelity and reliability pass
is the active milestone and is not yet complete. The pass first makes live play,
reload, and chapter completion agree; then it strengthens the Chapter Two cast,
train friendships, lake reveal, feast, password ritual, common-room page turn,
owl post, and truthful Chapter Three preview. It preserves Gryffindor as the only
outcome and does not add Chapter Three gameplay.

The reliability foundation is complete. The barrier handoff and reload agree,
Great Hall pointer targets no longer overlap, chapter completion is one durable
transaction, and v3 migration repairs completed Chapter Two saves that were
stranded on its card. Authored dialogue, quests, durable writes, cards, yearbook
moments, and chapter destinations now fail during package linking. At runtime,
visible dialogue pages, non-replayable story beats, quest lifecycle actions,
and logical set pieces resume idempotently across reloads, failed saves,
reduced-motion variants, skips, and chapter handoffs. Presentation plumbing and
the player-visible character, story, art, and audio pass remain active.

Chapter Three's native content and runtime foundation is now authored behind a
`placeholder` catalog gate: the spellbook, Lumos and Leviosa ceremonies, five
destination castle map, three-corridor Trevor route, sleeping ghost-book side
quest, exact rewards, save repair, and minimal Chapter Four flying preview all
have deterministic contracts. Production art, assembled harness captures, the
human audio listening pass, and the full local build still gate live play. That
learning-layer debut remains the moment to watch Violet's reaction to letter
tiles closely; Off, Gentle, and Stretchy change assistance without changing her
story or rewards. **Gate: Violet playtest #2 on the first fully assembled green
Chapter Three build.**

### M4 — Chapters 4–5
Minigame framework + broom flight; Alohomora optional doors; encounter framework v1 with the troll; Reparo & points celebrations. **Gate: does the troll fight land as exciting-not-scary? Violet playtest #3.**

### M5 — Chapters 6–7
Potion minigame (labels + counting), cloak night sequence, Mirror scene; Dueling Club (duel controls in a zero-stakes wrapper), the trapdoor gauntlet with per-stage checkpoints.

### M6 — Chapter 8 + polish pass
The three-phase finale, Expelliarmus letter finisher, feast/house-cup celebration, credits book; then a whole-game pass: transitions, load times, audio ducking, reduced-motion, replay-from-parent-panel, post-game free roam. **Gate: she beats Voldemort. Ideally filmed.**

## Working rules

- **Get each chapter in front of Violet before finishing the next one's detail pass.** Her behavior is the spec ([CHAPTERS.md](CHAPTERS.md) intentionally keeps later chapters at beat-level) — but this is guidance, not a hard gate (D32): building may run ahead when it makes sense; her feedback steers, it doesn't block.
- Every decision made along the way lands in [DECISIONS.md](DECISIONS.md) the day it's made.
- Every milestone ends on the actual iPad, from the deployed URL, added to the home screen.
- Asset generation happens per-chapter (never batch-ahead) so art direction can drift-correct and her feedback can steer content.
- Session-sized dev increments: the game must be *ship-ready at every merge to main* — she may ask to play at any moment, and "the game is broken right now" is not an acceptable answer to a 6-year-old.

## Playtest protocol (what to watch, not ask)

Kids can't articulate UX feedback; watch instead:

- Where does she hesitate? (Hint ladder too slow / signifier too subtle)
- Does she tap-spam? (Feedback insufficient or dialogue unskippable-feeling)
- Does she talk back to the characters? (Voice pacing right — this is the win condition)
- Does she re-open the spellbook/album just to look? (Richness layer landing)
- During letter tiles: leaning in, or leaning back? (Learning layer verdict — leaning back means dial it down)
- When a session ends: does she protest? (The only KPI that matters)
