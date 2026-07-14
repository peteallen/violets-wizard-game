# Character production pipeline

This is the production contract for rebuilding the cast. It covers every
character visible in the playable game and is designed to extend to the later
chapter roster without changing rendering media or animation semantics again.

## One visual lineage per character

Every character begins with one independently reviewed, fully assembled,
upright-neutral canonical painting. Canonical character generation and every
production refinement derived from it use
`google/gemini-3.1-flash-image` through OpenRouter. Cheaper or different models
may be used only for disposable research that can never enter a shipping asset
lineage. A production prompt always records the canonical input, exact model,
output hash, cost, and review status under `art/characters/<character>/`.

The canonical painting locks identity, age, proportions, palette, outfit,
material language, and the neutral attachment geometry. It is reviewed before
any expression, limb, outfit, lighting, or action variant is generated. A
rejected canonical source is never sliced and never becomes an input to a
shipping derivative.

## Reproducible generation command

Production generations use `npm run assets:character-image -- --request
<request.json>`. The command itself fixes the model to
`google/gemini-3.1-flash-image`, the reviewed canonical model slug to
`google/gemini-3.1-flash-image-20260528`, and the provider to
`google-vertex/global`. A request file cannot override any of those values. It
names one Markdown prompt section, the reference images in their semantic
order, the requested aspect ratio and resolution, and new image and provenance
paths. Every path is relative to the repository root.

```json
{
  "schema_version": 1,
  "prompt": {
    "path": "art/characters/violet/canonical/casual-v8.prompt.md",
    "section": "Prompt"
  },
  "references": [
    {
      "path": "art/character-refs/violet.png",
      "role": "exact identity and age"
    },
    {
      "path": "art/raw/ch1-bedroom.png",
      "role": "painted room material language"
    }
  ],
  "generation": {
    "aspect_ratio": "3:4",
    "resolution": "1K"
  },
  "output": {
    "image": "art/characters/violet/canonical/casual-v8-raw.png",
    "provenance": "art/characters/violet/canonical/casual-v8.metadata.json"
  }
}
```

Adding `--dry-run` reads and hashes the local inputs and verifies the current
read-only OpenRouter model catalogs, but it does not require a key, call the
cost-bearing image endpoint, or write a file. A real generation reads
`OPENROUTER_API_KEY` only from the environment after catalog validation. It
makes exactly one generation request, never retries automatically, refuses any
existing output path, validates the returned PNG, and installs the PNG and its
safe provenance atomically. The provenance retains the prompt, reference,
request, catalog, response, and output hashes together with dimensions, usage,
cost, timestamps, runtime, and repository commit; it never retains image bytes
inside the response JSON or any credential. This cost-bearing command is
deliberately outside `npm run build`; its offline contract tests remain part of
the normal deterministic test gate.

## Atomic image editing and preserved pixels

A refinement changes one visual concern at a time. Examples are closing the
eyelids, changing one mouth shape, raising the right wand arm, or creating one
planted walking-leg frame. Gemini receives the approved canonical source and a
precise edit instruction. The resulting image is registered to the canonical
canvas, and only the intended changed region is retained. Everything outside
that region comes from the approved canonical pixels rather than trusting the
model to repaint them consistently.

This rule applies even when an edit appears identity-stable. A blink may not
repaint the glasses or hair. A speaking mouth may not repaint the nose or
cheeks. An arm gesture may not repaint the torso. A walking frame may not
repaint the face. Local compositing is the mechanical identity guarantee that
image-to-image prompting alone cannot provide.

## Aligned-canvas puppet contract

Every runtime layer occupies the same transparent canonical canvas and uses the
same ground anchor. Runtime code never guesses a neck, shoulder, hip, or hand
join from a trimmed image rectangle. Layer changes therefore preserve exact
registration.

The core layer order is authored per character. A typical human uses rear hair,
leg or lower-body frame, rear arm, torso or outfit, front arm, base head,
localized face expression, front hair, and attached prop layers. Characters
with coats, beards, wings, tails, hats, or multiple heads define their own
order. Each action frame may change both its selected layers and their z-order
where an arm moves in front of the face or behind the body.

Every logical asset has independently derived left-key and right-key variants.
Facing is a world transform, while room lighting remains in world space. The
renderer selects the opposite local light variant before mirroring a puppet so
the visible highlight still agrees with the room.

Every rig declares its canonical canvas and floor root, world bounds, portrait
crop, shadow bounds, head-safe region, and all sockets used by gameplay. Human
rigs declare at least the neck, left and right shoulders, elbows, wrists, hands,
hips, knees, ankles, and planted feet. Violet also declares a wand grip and wand
tip. Hagrid declares map, ticket, and brick-tap hand sockets. Owls declare
talons, letter carry, and release sockets. Unknown identities, appearances,
expressions, clips, or missing required sockets are validation errors; they may
not silently become another character, another pose, or the old drawing medium.

The implementation seam is `src/game/render/AlignedSpriteRig.js`. Production
assets belong under `public/assets/art/characters/`; `art/characters/` contains
canonical sources, prompts, edit inputs, masks, and provenance only.

## Animation vocabulary

Locomotion, expression, transient action, appearance, props, facing, gaze,
room light, and reduced-motion behavior are independent inputs. The renderer
does not overload one `pose` string with all of them.

Every humanoid requires idle, walking, blinking, gaze, speaking, jump-for-joy,
giggle, and comic tumble/recovery. Every speaking identity has a neutral
portrait, blink, two or three talking mouth states, and the expressions used by
its dialogue. Encounter participants add ready, telegraph, cast or attack,
block or dodge, hit, stagger, defeated, and recovery clips. Friend characters
add a finale cheer.

Chapter One adds the following character-specific actions. Violet needs casual
and robed appearances, runtime robe trim, wonder, proud, curious, wand hold,
wrong-wand tests, wand receive, cast, and robe presentation. Hagrid needs
beckon, walking departure, map handoff, ticket handoff, and triple brick tap.
The Wandmaker needs assessment, surprised amusement, encouraging reset, and
chosen-wand delight. Madam Malkin needs measuring, fitting, color presentation,
and approval. The Menagerie keeper needs three-pet presentation, confirmation,
name request, and new-friend celebration. The post owl retains perch, takeoff,
delivery, flight, release, and settle. Cat, pet owl, and toad retain their
complete idle, follow, curiosity, selection, portrait, hint, and celebration
behavior.

One-shot actions use action-local time or explicit progress. Global game time
is only for harmless looping motion such as breathing and idle sway. Transient
animation state remains outside the save payload, so existing saves retain
their current character, wand, robe-trim, pet, quest, and yearbook data.

## Review gate

Canonical paintings and generated variants receive the fresh Art Director
review before they become runtime inputs. A flagship canonical character gets
the three-lens panel: posture and anatomy, style and room integration, and
six-year-old readability. No judge sees the previous version.

After approved layers are assembled, each character receives four clean
registered harness surfaces with no previous-version comparison: full-body clip
strip, expression and portrait strip, reduced-motion strip, and in-world action
scene. Captures are produced at 1280x720 and 2560x1440. CRITICAL and MAJOR
findings return to generation, local compositing, rig configuration, or content
cue authoring as appropriate. Only a clean assembled verdict can replace the
currently deployed puppet.

The complete playable Chapter One gate covers Violet, Hagrid, the Wandmaker,
Madam Malkin, the Menagerie keeper, narrator portrait, post owl, cat, pet owl,
and pet toad across every current action and portrait state. Later chapter
characters enter the same pipeline as their authored identities and actions
become concrete; unresolved ensembles remain explicit inventory slots rather
than invented characters.
