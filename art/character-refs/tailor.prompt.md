# Tailor reference-sheet provenance

This is a style target for the Tailor's painted sprite parts (D48) and the
identity source for every art-director judgment of her future part sheets.
Reference-only material; never shipped by the game.

## Current file (v2)

- Status: **under fresh art-director review (D49)** — accepted only on a PASS
  verdict; this line is updated when the ruling lands
- Generated: 2026-07-14
- Workflow: OpenRouter Image API via the `openrouter-image` skill
- Model identifier: `black-forest-labs/flux.2-pro` (same model-family switch
  that cured the Wandmaker's craft findings; requested 16:9, FLUX returned
  1024×1024 square)
- Cost: $0.03
- Reference images: none — text-to-image only
- File: `tailor.png`
- SHA-256: `64dda62fdb9a3d5e16f8474d6c0396e489cbb4ec4bc34fe187bcc46caaae880d`
- Prompt: v2 block below — the v1 verdict encoded: dense gouache with weave
  in every tone and no dot screen (C1), edges modeled by paint value with no
  drawn contours (M1), violet-blue shadow cooling named per surface on the
  full-body figure (M2), the pincushion-side hand resting flat with thumb +
  separated fingers (m1), symmetric narrow apron straps in both views (m2),
  stance-sized contact shadow (m3), and the dress pigment ruled canon as
  blue-leaning heather, never magenta plum (m4).

## History

- **v1** (`google/gemini-3.1-flash-image-preview`, $0.0695, SHA-256
  `a773196cb59007007f58079340f8a4714a3a3b1f620d7b10c9952d6f113b2af7`,
  committed at `9d9ef56`): **FAILED D49 review — 1 CRITICAL, 2 MAJOR,
  4 MINOR.** The judge called the character design "genuinely lovable" and
  measured the identity locked (iris ΔH ≤ 4° across views, catchlights
  upper-left, tick-marks-only ruler, no actor likeness) — but the rendering
  was the wrong artist: an airbrushed vignette with a uniform mechanical
  dot screen instead of woven gouache tooth (FFT peak/median 37–55 vs the
  anchors' 16–24; field brushwork as little as 1/6 of the anchors'), ~2–3px
  drawn contour lines tracing sleeves, fingers, soles, and lips (M1), and
  warm-only full-body shadows while only the close-up cooled to violet-blue
  (M2). Minors: pincushion-side hand read as a loose fist, apron strap
  geometry drifted between views, contact shadow spilled 1.3 boot-lengths,
  and the dress rendered magenta-side plum instead of heather.

## Design intent

She keeps the robe shop where Violet's permanent outfit change happens
(D41's dressing-room beat), so the read is warm, brisk, motherly, delighted
to fuss — never stern. Original design: plump middle-aged witch tailor,
round rosy face, warm hazel-brown eyes, silver-streaked auburn hair in a
soft loose bun, deep heather-purple work dress with rolled sleeves, cream
work apron with chalk and a small wooden ruler in the pocket, a tomato-red
pincushion worn like a bracelet, sturdy plum boots. Born with every lesson
the Wandmaker's three failed rulings taught: upright-neutral pose (D52),
hands resting in contact with the outer thighs with thumb + separated
fingers, one iris pigment in both views, violet-blue shadow cooling on the
full-body figure, canvas tooth in every tone. No actor likeness, no film
costume.

## Generation prompt (v1)

```text
Premium children's storybook illustration, FULLY PAINTED dense gouache rendering with NO ink outlines and NO contour linework — every form built purely from painted values, soft edges, dry-brush texture, and visible woven canvas tooth in EVERY tone including the darkest background corners and ALL SKIN: cheeks, forehead, and hands show paper grain and dry-brush stipple up close, never airbrushed smooth gradients. RICH DEEP color values glowing like candlelight: aged parchment, deep candle gold, deep night blue, heather purple, warm umber — never washed out, no pure black or pure white. A character reference sheet, wide landscape 16:9, the two views filling the frame edge to edge: the exact same character shown exactly TWICE — a front-facing full-body standing pose on the left, and a face-and-shoulders close-up occupying the entire right half from top edge to bottom edge — identical face shape, identity, outfit, and colors in both views, never a third figure. The background is ONE continuous atmospheric painted field behind both views, warm candle-gold light melting into deep night blue toward the edges — never panels, no scenery, no text, no borders. The character: an original warm, bustling witch tailor who keeps a robe shop — a plump, motherly middle-aged woman, standing upright and relaxed, brisk and kind, delighted to fuss over a new customer. A round rosy face with warm HAZEL-BROWN eyes of the exact same pigment in BOTH views, gentle laugh lines, softly dimpled cheeks, and a warm busy closed-mouth smile; silver-streaked auburn hair swept into a soft loose bun with a few escaping wisps, identical in both views. Her arms hang relaxed with her small hands resting flat against her outer thighs, thumb and gently curled fingers clearly drawn with soft shadow gaps between them — natural hands at rest touching the fabric, never claws, never mittens, never floating. She stands with feet planted flat, toes only slightly turned out. Wardrobe, original design: a deep heather-purple work dress with a high soft collar, a fitted stitched bodice, and rolled sleeves; a warm cream work apron with a wide front pocket holding a stick of tailor's chalk and a small wooden ruler; a plump tomato-red pincushion worn like a bracelet on one wrist; sturdy plum leather boots. ONE warm upper-left key light obeyed identically in BOTH views: a clear candle-gold rim along her lit left edge, and every shadow side — sleeves, apron folds, hair underside, jaw — cooling to VIOLET-BLUE, in the full-body figure just as much as in the close-up, with a small warm catchlight at the upper left of each eye. The emotional read: warm, brisk, motherly, quietly delighted — friendly and safe for a young child, never stern, never creepy. Fabric has woven grain and painted fold bands; hair is soft shaded masses with interior strands. Picture-book proportions. Original character design, not any existing actor or film character.
```
