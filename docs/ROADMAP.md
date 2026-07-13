# Roadmap

Build order optimized for two things: reaching a real Violet playtest as fast as possible (her feedback should shape everything downstream), and never building content on unproven engine ground.

## Milestones

### M0 — Foundations (no gameplay)
Repo init (with `.nvmrc` — see ARCHITECTURE.md §Device reality), Vite/Vitest skeleton cribbed from the soccer game, CI with tests + `check:assets` + build, deploy pipeline proven end-to-end with a placeholder scene (verify all five deploy layers once, before it matters), **the verification harness + capture tooling (VERIFICATION.md) — built before any visual work exists, because retrofitting determinism is brutal**, `AGENTS.md`/`CLAUDE.md` house conventions. **Gate: a placeholder screen live on the iPad from the real URL, and a captured keyframe strip of it reviewed by an agent.**

### M1 — Engine core + spikes + Chapter 1 grey-box
World/Game split running (fixed-timestep); rooms, tap-walk, hotspots, dialogue (with captions; voice stubbed as synth blips), map travel, save/resume, HUD (wand/satchel/quest star), hint ladder. **The four spikes run here** (BUILD_PLAN Track E): SP-A brick wall, SP-B mirror, SP-C style seam (the art direction's go/no-go), SP-D memory ceiling — all on placeholder art, all through the harness review loop, results logged to DECISIONS.md before any chapter depends on them. Chapter 1 playable start-to-finish with placeholder rectangles-and-blobs art; chapter-walkthrough test green. **Gate: dad plays grey-box Ch. 1 on the iPad; controls feel right; dad has seen the brick-wall prototype GIF.**

### M2 — Chapter 1 full production ⭐ first Violet playtest
Painted rooms, character puppets, real voice (narrator, Guide, Wandmaker + QA loop), music cues, SFX, the letter-opening moment polished to perfection, pet choice + follow. **Gate: Violet plays Chapter 1. This is the real test of every UX assumption — tap-to-walk comprehension, dialogue pacing, caption reading, hint ladder timing. Everything downstream gets tuned by what we watch her do.**

> **Status 2026-07-13:** production landed but Pete's review found a three-tier fidelity mismatch (rooms ≫ puppets ≫ UI) and a clarity-bug batch. The **Visual Unification Pass** ([VISUAL_UNIFICATION.md](VISUAL_UNIFICATION.md), D26–D33) now completes M2: VU-pre → VU-00 standard/checklists/refs → character + affordance + UI + clarity tracks → title v3 + text purge → continuous deploys → **then** Violet's first playtest completes M2. Per D32 there are no human approval gates anywhere — agents self-review and ship; Pete's feedback comes from playing. "Gates" in this file are milestone checkpoints and feedback moments, never approval queues: nothing waits on them.

### M3 — Chapters 2–3
Sorting (needs O1 answered), house theming, icon choices; spellbook + casting + first incantation assemblies (learning layer debut — watch her reaction to letter tiles *closely*; this is the "did we ruin it?" checkpoint, and the parent dial exists if we did), quest chains, side quests, frog card album. **Gate: Violet playtest #2.**

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
