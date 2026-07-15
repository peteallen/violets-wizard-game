# Build plan — current execution

The engine, Chapter One, deployment, and review infrastructure already exist,
and all ten production character identities now render through their own lazy
packages. The active job is the scale-ready character, chapter, scene, and
presentation refactor: remove the retired compatibility graph, extract Chapter
One into room and scene modules, make the version-2 content/action/save
contracts truthful, and then split the game shell and presentation monoliths.
No additional cast or chapter content is added while those boundaries move.

## Current priority

Finish the exact-identity character cleanup first, including package-owned
review descriptors, dead renderer deletion, both required capture sizes, and a
green full build. Then decompose Chapter One without changing its exported
behavior, activate content contract version 2, introduce the exact action
registry and save-schema migration, and only then split the game shell, render
pipeline, UI surfaces, and reusable illustration families. The final pass makes
chapter presentation and asset ownership lazy, unifies the harness descriptor,
empties the architecture allowlist, and removes the shared-chunk warning.

## Per-character loop for future cast additions

The existing cast completed this loop before the scale refactor began. Reuse it
when a later chapter genuinely introduces another character; it is not the
current execution queue.

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

## After the refactor

Pete tests each green checkpoint on GitHub Pages. Player-visible findings can
trigger a focused correction, but later chapter content and speculative
character inventory wait until the scale refactor meets its acceptance suite.
