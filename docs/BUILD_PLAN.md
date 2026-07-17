# Build plan — current execution

The engine, deployment pipeline, review harness, and Chapter One production
rebuild are deployed. Chapter Two is also playable from the King's Cross
barrier through the Gryffindor common room. The active job is its approved Phase
2 fidelity and reliability pass: keep that complete route playable while making
its characters, interactions, transitions, feast, ending, and resume behavior
feel as deliberate as Chapter One and the wider game.

This plan describes the active destination, not shipped Phase 2 behavior. A
target counts as delivered only after its self-contained increment has passed
the full build, received both required visual captures when applicable, and
been pushed to `main`.

## Completion boundary

Phase 2 is complete when a new playthrough and every supported Chapter Two save
reach the same intended scene, dialogue beat, rewards, and player position;
when the six Chapter Two environments and their cast pass the Storybook Standard
at both review sizes; and when Violet controls the chapter's optional friendship
beats and quiet transitions rather than being hurried by timers. The finish also
includes owl post from Mum and Dad, a truthful illustrated Chapter Three preview,
reduced-motion review, and an iPad playthrough from the deployed URL.

The boundary stays narrow. Gryffindor remains the only sorting outcome. This
pass does not add Chapter Three gameplay, alternate house rooms, a friendship
meter, or a broad rewrite of the renderer merely because Chapter Two needs a
focused presentation seam.

## Delivery order

1. Capture the current six registered Chapter Two scenes as the visual baseline.
   Then fix the Headmaster/card overlap, make the barrier transition and reload
   agree on Violet's platform position, commit chapter completion atomically,
   and migrate saves that can otherwise strand her between scenes.
   **Delivered:** the baseline, pointer separation, opaque platform handoff,
   live/reload spawn parity, atomic completion, and stranded-card migration are
   now on `main` with normal and reduced-motion coverage.
2. Make the Chapter Two version-2 dialogue, quest, and action descriptions fail
   clearly when malformed. Introduce save schema version 3 with durable dialogue
   cursor and reward-receipt meaning, preserving every supported older save
   through explicit migrations and tests.
   **In progress:** the exact v3 envelope, v1→v2→v3 migrations, full
   dialogue and quest validation, durable-write ownership, and production
   package linking are delivered. Dialogue, quest, and set-piece receipt runtime
   semantics are the remaining reliability slice.
3. Add only the reusable presentation seams this chapter proves it needs:
   scene-owned player poses, speaking without losing a seated pose, named actor
   attachments and head anchors, scene-level music overrides, generic chapter
   previews, and an explicit `owlPost.open` action.
4. Upgrade one complete character package at a time in this order: conductor;
   Sorting Hat; Harry, Ron, and Hermione; trolley witch; deputy head and
   Headmaster; portrait guardian; then Violet's supplemental Chapter Two
   actions. Each package is reviewed in its actual room and dialogue before the
   next package begins.
5. Deliver the story as independently green slices: barrier and platform; train
   friendships and distinct sweets; the eight-second lake reveal with a
   player-held continuation; head-anchored Sorting Hat and the feast; password
   ritual and lingerable common room; then owl post, Chapter Two end card, and
   the truthful Chapter Three preview. Mum and Dad use generated placeholder
   voices behind stable replacement keys so later family recordings do not
   change authored dialogue or saves.
6. Run the complete Chapter Two walkthrough and every save migration under
   normal and reduced motion. Capture every affected registered scene at
   1280×720 and 2560×1440, inspect the assembled chapter against its illusion
   checklist, run `npm run build`, and finish with the deployed iPad playthrough.

## Per-character loop for the Chapter Two cast

Chapter One established this package workflow. Phase 2 reuses it for the active
Chapter Two cast in the order above, with one complete playable character as the
shipping increment.

1. Inspect the current renderer and Chapter Two content and list only the world,
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
   is never regenerated; Chapter Two adds only the supplemental actions its
   scenes actually request.
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
[DECISIONS.md](DECISIONS.md) immediately and take the next free number. Follow
the latest logged production decisions; do not reintroduce per-frame approval
queues, isolated-pose milestones, or other gates that separate a character from
its assembled result in the game.

## After Phase 2

Pete tests each green checkpoint on GitHub Pages while the pass is active. Once
the polished Chapter Two route is green, visually reviewed, and played on the
iPad, its findings can shape the Chapter Three detail pass. Spellbook gameplay,
new classes, and speculative future character inventory wait until then.
