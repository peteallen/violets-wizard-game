# Working on Violet's Wizard Game

Keep reports conversational and explain player-visible behavior in context. Preserve the game as playable at every merge, keep Violet's save compatible, and never place credentials or generated-service keys in browser code.

The documentation under `docs/` is the product source of truth. Shared contracts live in `src/game/contracts.js`; change them deliberately and update their tests and the decision log together. Simulation code must remain deterministic and independent of Canvas, audio, the DOM, wall-clock APIs, and unseeded randomness.

Visual changes require a registered harness scene and captured review frames. Generated assets belong in `public/assets`, while their prompts and source metadata belong under `art` or `audio`. Do not commit `dist`, `node_modules`, keys, runtime saves, or review scratch files.

When appending to the decision log, re-read the tail of `docs/DECISIONS.md` immediately before writing and take the next free number — concurrent sessions have collided on numbers before (see D34/D35).

Commit and push in small, frequent increments (D33). After each self-contained green step — a fixed bug, a rebuilt surface, a passing checklist item — run `npm test` and push to `main`: several pushes per working session, not one at the end. Every push deploys: CI re-runs the full battery and publishes to GitHub Pages within a couple of minutes, and Pete tests the live site continuously (the in-game reload prompt picks up new builds). Never push red; never sit on green. If you must stop while red, say exactly what is broken in your report so the next session can pick it up.
