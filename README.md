# Violet's Wizard Game

A private, non-commercial fan game for Violet (6): she goes to Hogwarts as a first-year, learns spells class by class, and at the end of the year she duels Voldemort and wins.

**Status: Chapters One and Two are playable end to end.** Chapter One's rebuilt
storybook cast and painted satchel are deployed. Chapter Two's approved Phase 2
fidelity and reliability pass is now active, but that pass is not yet complete;
the playable chapter remains the baseline while its presentation, story detail,
and save behavior are brought up to the standard of Chapter One and the wider
game. The current game is published at
[peteallen.github.io/violets-wizard-game](https://peteallen.github.io/violets-wizard-game/).
The documentation remains the product source of truth; read it in this order:

| Doc | What it holds |
|---|---|
| [docs/VISION.md](docs/VISION.md) | Who this is for, product pillars, IP stance, definition of done |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | The complete design: world, controls, spells, dialogue, duels, difficulty, saves |
| [docs/CHAPTERS.md](docs/CHAPTERS.md) | The eight-chapter story arc with beats, quests, and asset lists |
| [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) | Style bible: palette, Violet's character design, room generation prompts, UI motifs |
| [docs/AUDIO_DIRECTION.md](docs/AUDIO_DIRECTION.md) | Voice cast, music themes, SFX identity, generation + QA pipeline |
| [docs/SET_PIECES.md](docs/SET_PIECES.md) | The technique toolbox + exact spec for every magical moment (how the Diagon Alley wall actually opens) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, module layout, data contracts, performance playbook + device-reality rules, testing, deploy |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | How agents prove visual work looks right through deterministic harness scenes, dual-resolution captures, and author self-review |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | The active Chapter Two Phase 2 delivery order, contracts, and acceptance criteria |
| [docs/VISUAL_UNIFICATION.md](docs/VISUAL_UNIFICATION.md) | The shared storybook fidelity standard and how the completed Chapter One work now guides Chapter Two |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Running decision log — every choice, its reasoning, and open questions |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Build order, milestones, and Violet playtest checkpoints |

## House rules (inherited from the sibling games)

Playable without fluent reading. Touch-first on iPad. Forgiving everywhere. No fail-locked states, no punishment, celebration over score. Her save is sacred. Quietly a learning game (spelling hides inside spellcasting) but governed by hard anti-ed-game rules — if it ever smells like homework, it's a bug. All art, music, voice, and code are original and generated offline — no service credentials ever ship to the browser.

## Development reset

Open the game with `?debug=1` while building or testing to show a large `Start fresh` control at the top of the canvas. The same reset is available from the keyboard with `Alt+Shift+R`, or from the browser console with `window.__violetWizard.resetGame()`. Each route clears both the current save and its recovery backup before returning to the opening title.

For automation or a clean one-time launch, use `?reset=1`. The game clears the save before it starts, removes the `reset` parameter from the address without disturbing other parameters or the URL fragment, and does not add another browser-history entry. The ordinary game URL shows no reset control and does not enable the keyboard shortcut.

## Build and visual review

Use `npm run dev` for the local game and `npm run build` for the complete test, asset, voice, audio, and production-build gate. Visual work is reviewed through deterministic registered scenes: `npm run snap -- --scene <scene-id> --times 0,0.5,1 --seed 42` writes ignored review frames, while `npm run flipbook -- --scene <scene-id>` produces the motion strip. Agents self-review those artifacts against the illusion checklists and ship when the build gate is green (D32 — no human approval steps); `bless`/`diff` remain available as optional self-serve snapshot tools.
