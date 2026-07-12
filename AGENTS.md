# Working on Violet's Wizard Game

Keep reports conversational and explain player-visible behavior in context. Preserve the game as playable at every merge, keep Violet's save compatible, and never place credentials or generated-service keys in browser code.

The documentation under `docs/` is the product source of truth. Shared contracts live in `src/game/contracts.js`; change them deliberately and update their tests and the decision log together. Simulation code must remain deterministic and independent of Canvas, audio, the DOM, wall-clock APIs, and unseeded randomness.

Visual changes require a registered harness scene and captured review frames. Generated assets belong in `public/assets`, while their prompts and source metadata belong under `art` or `audio`. Do not commit `dist`, `node_modules`, keys, runtime saves, or review scratch files.
