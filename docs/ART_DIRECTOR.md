# The Art Director — adversarial review brief

Every visual change gets reviewed by a **fresh agent that did not author it**, before merge. This exists because of a proven failure mode (D49): the author self-reviewed the SP-E Violet rig against a geometric checklist, passed it, and shipped a figure whose *posture* read as a hunched goblin — which Pete caught in one glance. Authors grade comparatively ("better than before"), see what they intended, and review at the wrong zoom. A fresh adversarial judge with this brief catches the obvious.

This is an automated agent layer, not a human gate (D32 holds — nothing waits on Pete).

## Protocol

1. **Inputs the judge MUST receive** (author's responsibility):
   - For a generated character source review: the locked identity source, every production batch sheet, the named panels proposed for shipping, and the list of states normal gameplay currently requests. The judge may accept a named usable subset; defects in unused figures do not contaminate accepted panels by association.
   - For an assembled character review: captures at BOTH review zooms, the full 1280×720 frame and a 2× capture (`--size 2560x1440` — same scene, double pixel density), including the character moving in a normal in-world scene. Harness captures may supplement this view but never replace it.
   - For other visual work: the two required captures and the scene's illusion checklist as a *floor*, not the bar.
   - **Never the previous version.** Judges grade absolute, not improvement. The phrase "better than before" is banned from verdicts.
2. **The judge's stance is adversarial**: assume something is wrong and find it. List everything, harshest-professional-critic mode. A clean verdict must survive the judge actively hunting.
3. **Verdict format**: `PASS` or findings ranked CRITICAL / MAJOR / MINOR, each with a precise visual description ("both arms curl inward so the hands hover in front of the thighs — reads as sneaking, not standing") and, where possible, whether the defect lives in the *source art*, the *assembly*, or the *animation*.
4. **Gate**: CRITICAL and MAJOR findings that affect a proposed shipping panel or its extraction must be fixed (or explicitly decided away in DECISIONS.md) before merge. Findings confined to unused figures are inventory notes, not blockers. MINORs are logged in the report. A fresh judge rechecks blocking corrections without reopening already accepted states.
5. **When**: any change touching characters, rooms, UI surfaces, set pieces, or affordances. Character production has two meaningful boundaries: one fresh source review of the proposed shipping panel set before slicing, then one fresh review of the assembled character after immediate integration into normal gameplay. A source review may prescribe deterministic scale, key, or isolation corrections; those corrected slices receive one targeted recheck before shipping. Do not create separate face, limb, pose, or frame review gates.
6. **Scale**: one fresh judge handles each character source review and each assembled character review. A three-lens panel is reserved for genuinely flagship non-character surfaces such as the title or a major set-piece moment; ordinary visual work gets one judge.

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
