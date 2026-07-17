# Chapter Three prop batch v1

Status: first production candidate. Review the named usable subset before
deterministic slicing; a malformed cell must be regenerated rather than silently
mapped to a different prop.

Model: built-in image generation

Requested output: 4:3 PNG, one image

Input references, in order:

1. `art/guides/ch1-room-style-triptych.png` — the game's painterly storybook
   texture, warm key light, violet-blue shadow color, and soft dark-brown edge
   treatment only
2. `art/guides/flat-cyan-chroma.png` — the exact flat extraction background

## Prompt

Use case: stylized-concept
Asset type: deterministic-slicing source sheet for nine transparent Chapter
Three game props in a premium children's storybook game

Create one polished image containing exactly nine complete, separate game props
arranged in a strict three-column by three-row grid on one perfectly flat,
uniform cyan background. Keep each prop wholly inside its own equal cell with
generous empty cyan around it. Use the same centered scale and ground logic
within each cell while allowing wide props to be wider and tall props to be
taller. Do not draw grid lines, cell borders, labels, letters, numbers, arrows,
captions, scenery, or text.

Match reference 1's premium opaque gouache-and-watercolor storybook finish:
visible paper tooth, organic asymmetry, tactile wood, paper, leather, brass, and
stone grain, soft dark-brown contour accents with varied weight, warm upper-left
gold light, and cool violet-blue shadow masses. Every silhouette must remain
clear at small gameplay scale. Use shaped physical objects rather than flat
vector icons, plastic 3D renders, or photoreal products.

Use this exact cell order, read left-to-right within each row:

ROW 1:

1. spellbook parcel: a compact rectangular parcel wrapped in thick warm
   parchment and blackberry-plum string, with a small blank plum wax seal and
   one folded corner; no writing or emblem;
2. lantern: a small aged-brass magical classroom lantern with warm cream glass,
   curved handle, sturdy base, and a visibly dark unlit center so live light can
   bloom over it later;
3. feather: one large soft cream quill feather lying at a gentle diagonal, with
   a warm brown shaft and enough open silhouette for a rising animation;

ROW 2:

4. wet footprints: a short trail of exactly four small shiny toad footprints,
   staggered from lower-left toward upper-right, with no floor painted around
   them;
5. ribbon clue: one short dropped rust-and-gold woven ribbon scrap, loosely
   curled, child-safe and clearly toad-sized, with no letters;
6. reflected eyes: one tiny pair of warm honey-green reflected toad eyes in a
   compact horizontal arrangement, with only a faint soft violet darkness
   immediately around the eyes and no face or creature body;

ROW 3:

7. torn book: one small closed old storybook with a blackberry-plum cover,
   aged-brass corners, several visibly torn parchment pages peeking out, and a
   loose page edge; no title, symbol, or writing;
8. toad token: one round hand-carved warm-oak keepsake token bearing a simple
   original raised toad silhouette, edged with a thin aged-brass ring; no text,
   number, crest, or currency markings;
9. sleeping star: one small physical five-point silver quest star made from
   softly hammered metal, resting quietly with a tiny crescent-shaped plum
   enamel inset; it must read as dormant and gentle, with no gold activation
   glow and no face.

Reference 2 defines the background: a perfectly uniform removable cyan field
with no shadows, gradients, texture, floor plane, reflections, or lighting
variation. Never use cyan inside a prop. Give each object crisp complete edges
and no cast or contact shadow. No extra objects, duplicates, creatures, people,
hands, wands, readable marks, logos, watermarks, signatures, pure black, pure
white, hard black ink, film-specific designs, or neighboring-cell overlap.
Return only the nine props in the specified order.
