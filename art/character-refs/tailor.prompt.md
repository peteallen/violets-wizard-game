# Tailor reference-sheet provenance

This is a style target for the Tailor's painted sprite parts (D48) and the
identity source for every art-director judgment of her future part sheets.
Reference-only material; never shipped by the game.

## Current file (v1 — provisional identity anchor, D53)

- Status: **provisional identity anchor per D53** (second application, after
  the Wandmaker). Part sheets judge IDENTITY and PALETTE against this sheet;
  CRAFT is judged directly against the Storybook Standard and the room
  paintings. Outstanding v1 craft findings remain on file below (mechanical
  dot screen over airbrush, drawn contour lines, warm-only full-body
  shadows); a true-PASS regeneration is deferred until the toolchain can win
  that fight. Restored from `9d9ef56`.
- Generated: 2026-07-13, `google/gemini-3.1-flash-image-preview`, $0.0695,
  16:9 at 1K
- File: `tailor.png`
- SHA-256: `a773196cb59007007f58079340f8a4714a3a3b1f620d7b10c9952d6f113b2af7`
- What its ruling verified it locks: two-view single-skull identity (iris
  ΔH ≤ 4°, catchlights upper-left in all four eyes), the full wardrobe kit —
  tomato-red wrist pincushion, plum boots, apron with chalk and a
  tick-marks-only ruler, heather-purple dress pigment agreeing across views
  (ΔH < 3°, warmer than briefed; noted) — plus a warm motherly
  6-year-old-safe read and clean hygiene.

## History

- **v2** (`black-forest-labs/flux.2-pro`, $0.03, 1024×1024, SHA-256
  `64dda62fdb9a3d5e16f8474d6c0396e489cbb4ec4bc34fe187bcc46caaae880d`,
  committed at `2a5b4d3`-era): **FAILED D49 review — 3 CRITICAL, 5 MAJOR,
  4 MINOR.** The model-family switch did not repeat its Wandmaker craft win
  here: the judge measured outlined-drawing construction over airbrush fills
  with synthetic 1px micrograin — corner DoG 0.64–0.71 vs the anchors'
  1.07–1.66 — i.e. the medium itself failed (C2), and the wardrobe collapsed:
  near-black ballet flats instead of plum boots (C1); a pale-blue,
  polka-dotted, beribboned pincushion worn at MID-FOREARM instead of the
  tomato-red wrist bracelet (C3); a waist-only apron with the straps painted
  into the dress as purple seams, no pocket, no ruler (M1); unrequested gold
  hoops, a buckled leather cuff with glyph-like hardware, and a ribbon bow
  (M2); gold bloom at lower-left contradicting the catchlights with no rim
  and no figure cooling (M3); mauve-magenta dress (M4); a soft-fist cuff-side
  hand (M5). Its verdict recommended a three-lens panel for any future
  first-acceptance re-roll.

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
