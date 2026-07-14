# The Art Director — adversarial review brief

Every visual change gets reviewed by a **fresh agent that did not author it**, before merge. This exists because of a proven failure mode (D49): the author self-reviewed the SP-E Violet rig against a geometric checklist, passed it, and shipped a figure whose *posture* read as a hunched goblin — which Pete caught in one glance. Authors grade comparatively ("better than before"), see what they intended, and review at the wrong zoom. A fresh adversarial judge with this brief catches the obvious.

This is an automated agent layer, not a human gate (D32 holds — nothing waits on Pete).

## Protocol

1. **Inputs the judge MUST receive** (author's responsibility):
   - Captures at BOTH review zooms: the full 1280×720 frame *and* a 2× capture (`--size 2560x1440` — same scene, double pixel density). Posture and face defects live at 2×.
   - The relevant reference sheet(s) from `art/character-refs/` (and for part-sheet reviews, the generated sheet itself).
   - The scene's illusion checklist — as a *floor*, not the bar.
   - **Never the previous version.** Judges grade absolute, not improvement. The phrase "better than before" is banned from verdicts.
2. **The judge's stance is adversarial**: assume something is wrong and find it. List everything, harshest-professional-critic mode. A clean verdict must survive the judge actively hunting.
3. **Verdict format**: `PASS` or findings ranked CRITICAL / MAJOR / MINOR, each with a precise visual description ("both arms curl inward so the hands hover in front of the thighs — reads as sneaking, not standing") and, where possible, whether the defect lives in the *part art*, the *assembly*, or the *animation*.
4. **Gate**: CRITICAL and MAJOR findings must be fixed (or explicitly decided away in DECISIONS.md) before merge. MINORs are logged in the report. The author re-submits after fixes; the re-review is also by a fresh judge.
5. **When**: any change touching characters, rooms, UI surfaces, set pieces, or affordances. **Generated part sheets are reviewed BEFORE slicing and rigging** — a bent arm caught on the sheet costs a $0.03 regeneration; caught after rigging it costs the whole loop.
6. **Scale**: routine changes get one judge. Flagship surfaces (title, set-piece moments, a character's first acceptance) get a three-lens panel — posture/anatomy, style-consistency-vs-rooms, six-year-old readability — run as parallel agents; any lens can block.

## The absolute standards (the judge's bar)

Beyond the Storybook Standard (VISUAL_UNIFICATION.md), judge every figure and frame against:

- **Posture**: weight balanced over the feet; spine line vertical or purposefully posed; chin level; shoulders present and level. Arms rest *beside* the body, hands near outer thighs. Nothing hunches, creeps, wilts, or T-poses unless the pose is the point.
- **Silhouette test**: blacked out, the figure must read as a confident child (or the character's essence) — not a blob, not a lurker.
- **Anatomy joins**: neck exists; limbs join at plausible sockets; hands have thumbs and rest naturally; no part reads as detached, floating, or duplicated.
- **Expression congruence**: face, pose, and context agree. A smiling face on a slinking body is a defect.
- **Proportion**: picture-book (~1:3–1:3.5 head:body for kids), consistent across a scene's cast; scale coherent with the room and neighboring figures.
- **Grounding**: contact shadow present, sized to the figure (not a spill), and the feet actually meet it.
- **Identity**: the character's locked traits (e.g. Violet: dark-green rectangular glasses, warm light-brown hair, soft attached wisps — never antenna arcs) all present at both zooms.
- **The picture-book test**: would this exact frame look at home in a premium children's picture book? If the honest answer is "almost," it's findings, not a pass.

## Running a judge (any session)

Spawn a fresh agent whose entire prompt is: this file, the input image paths, and the sentence *"You are the Art Director. Review these against the brief. Assume something is wrong and find it."* Do not include authoring context, prior verdicts, or the change's history.
