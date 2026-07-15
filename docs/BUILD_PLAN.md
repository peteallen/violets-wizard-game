# Build plan — current execution

The engine, Chapter One, deployment, and review infrastructure already exist.
The active job is to replace the legacy Chapter One cast with finished painted
characters in the game Pete is testing, one deployable character at a time.
The milestone sequence beyond that remains in [ROADMAP.md](ROADMAP.md); this
file describes how current work reaches the live build.

## Current priority

Finish Violet first, then Hagrid, the Wandmaker, Madam Malkin, the Menagerie
keeper, the narrator portrait, the post owl, the cat, the pet owl, and the toad.
Each character is a complete green increment. Do not build a second animation
pipeline, polish hidden source details, or prepare the whole cast in an art
folder before the current character is moving in normal gameplay.

Parallel work stays inside the current character: gameplay-state inventory,
source inspection, integration analysis, tests, and review may overlap when
they do not create shared-file conflicts. Source production for the next
character begins only after the current complete character is built, committed,
and pushed.

## Per-character loop

1. Inspect the current renderer and Chapter One content and list only the world,
   portrait, direction, expression, outfit, locomotion, prop, and story-action
   states normal gameplay actually requests. Do not invent poses for future
   chapters.
2. Generate one coherent multi-view and core-action sheet, or the smallest
   coherent supplemental sheet needed when one canvas cannot hold the inventory.
   All production character generation and refinements use
   `google/gemini-3.1-flash-image` through `google-vertex/global`, with no model
   or provider fallback and no automatic retry. Violet starts from the locked
   V8 source at
   `art/characters/violet/canonical/casual-approved.png` and that neutral identity
   is never regenerated.
3. Inspect every batch sheet against the Storybook Standard and name the panels
   proposed for shipping. Resolve visible defects that affect that subset or
   its extraction; record defects in unused figures without letting them block
   usable panels. Do not add approval gates for individual faces, limbs, poses,
   or frames.
4. Slice known panel rectangles deterministically onto aligned transparent
   canvases, record provenance and runtime mappings, and place only reviewed
   shipping assets under `public/assets`. Prompts, sources, and metadata remain
   under `art/`.
5. Connect the character immediately to real rooms, walking, dialogue, outfits,
   and story actions. Missing states fail visibly during development; they never
   silently fall back to the legacy puppet. Preserve save compatibility and keep
   simulation code deterministic and independent of Canvas, the DOM, audio,
   wall-clock APIs, and unseeded randomness.
6. Capture the assembled character in its registered harness and moving in a
   normal in-world scene at 1280×720 and 2560×1440. Inspect the assembled
   character as a whole and refine only defects visible in those captures or
   during play.
7. Run `npm run build`, fix the full local gate, commit the self-contained green
   character, and push it to `main` immediately. GitHub Pages is the feedback
   surface; a sheet or harness-only scene is not a delivered character.

The detailed art workflow lives in
[CHARACTER_PIPELINE.md](CHARACTER_PIPELINE.md).

## Standing project gates

The game remains playable at every merge and Violet's saves remain compatible.
Shared contracts in `src/game/contracts.js` change only with their tests and a
matching decision-log entry. Generated-service credentials never enter browser
code or the repository.

Visual work retains a registered harness scene, the two required capture sizes,
and author inspection against the illusion checklist. `npm run build` is the release gate: tests, asset
validation, voice quality checks, audio loudness checks, and the production
bundle must all pass before a push. CI repeats that gate and controls Pages
deployment, but local green is required so every push is expected to deploy.

When appending a decision, re-read the tail of
[DECISIONS.md](DECISIONS.md) immediately and take the next free number. D57 and
D58 are the active character-production decisions; do not reintroduce the
per-frame mask, isolated-pose, perfect-grid, or art-folder-first milestones they
superseded.

## After the cast

Pete tests the completed Chapter One cast on GitHub Pages. His player-visible
findings determine whether the next step is a focused character correction or
the next milestone in [ROADMAP.md](ROADMAP.md). No later chapter or speculative
character inventory is expanded before that test.
