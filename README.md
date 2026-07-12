# Violet's Wizard Game

A private, non-commercial fan game for Violet (6): she goes to Hogwarts as a first-year, learns spells class by class, and at the end of the year she duels Voldemort and wins.

**Status: planning.** No game code exists yet — by design. The documentation suite below is the source of truth, written before the first line of engine code. Read in this order:

| Doc | What it holds |
|---|---|
| [docs/VISION.md](docs/VISION.md) | Who this is for, product pillars, IP stance, definition of done |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | The complete design: world, controls, spells, dialogue, duels, difficulty, saves |
| [docs/CHAPTERS.md](docs/CHAPTERS.md) | The eight-chapter story arc with beats, quests, and asset lists |
| [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) | Style bible: palette, Violet's character design, room generation prompts, UI motifs |
| [docs/AUDIO_DIRECTION.md](docs/AUDIO_DIRECTION.md) | Voice cast, music themes, SFX identity, generation + QA pipeline |
| [docs/SET_PIECES.md](docs/SET_PIECES.md) | The technique toolbox + exact spec for every magical moment (how the Diagon Alley wall actually opens) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, module layout, data contracts, performance playbook + device-reality rules, testing, deploy |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | How AI agents prove visual work looks right: deterministic harness, keyframe review, goldens, human gate |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Work packages with contracts and acceptance criteria — ready for engineers to fan out |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Running decision log — every choice, its reasoning, and open questions |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Build order, milestones, and Violet playtest checkpoints |

## House rules (inherited from the sibling games)

Playable without fluent reading. Touch-first on iPad. Forgiving everywhere. No fail-locked states, no punishment, celebration over score. Her save is sacred. Quietly a learning game (spelling hides inside spellcasting) but governed by hard anti-ed-game rules — if it ever smells like homework, it's a bug. All art, music, voice, and code are original and generated offline — no service credentials ever ship to the browser.
