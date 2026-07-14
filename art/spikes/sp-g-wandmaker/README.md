# SP-G — Wandmaker from AI-painted sprite parts

Third character through the D48 painted-parts pipeline, and the first
generated against a **provisional identity anchor** (D53): the reference
`art/character-refs/wandmaker.png` locks identity and palette after three
adversarial rulings, while sheet craft is judged directly against the
Storybook Standard. His rig slot for the pose variant is the palm-up
**presenting** arm — the "Curious…" wand-offering gesture — mapped onto the
SpriteRig `armBeckon` slot at rig time.

## sheet-v1.png

- Generated 2026-07-14 via OpenRouter, `google/gemini-3.1-flash-image-preview`,
  cost $0.0676, 16:9 at 1K → 1376×768. `sheet-v1-clean.png` is the
  sips-normalized PNG. Prompt: block below — the sheet-prompt structure that
  produced Hagrid's v4 kit (empty-garment torso, exactly-nine with extras
  banned, separately-painted mirrored legs with the key-light clause,
  same-column walk pair, eyelid-only blink), with the wandmaker's identity
  kit from the provisional reference and the neck tape rewritten as a plain
  stitched cloth strip (no numerals anywhere — the lesson of the reference
  war).
- Author pre-check: cleanest first-roll kit of any character so far;
  known risks sent to the judge — the model painted the prompt's "shared
  swatches" as literal color chips in the top-right (extras), and the
  neck-drape strip drifted to a single hip sash on the torso.
- **Art Director verdict: FAIL — 2 CRITICAL, 2 MAJOR, 7 MINOR. Never
  sliced.** The neck-drape signature drifted to a single hip sash — zero
  strip pixels at the collar, 95% below the waistcoat hem (C1); the walk
  pair's feet point OPPOSITE directions with inverted contacts — both
  heel-planted and toe-up (C2); the right standing leg, hanging arm, and
  walk columns carry mirrored highlight planes against the one-key rule
  (M1, the right leg genuinely repainted yet mirror-lit: flip-IoU 0.934 but
  stroke correlation 0.116); bare flesh shoulder stubs sit at both armholes
  of the "empty garment" torso (M2). Minors: the painted swatch chips
  (benign discards), 1:3.9 lanky assembly needing a ~90px rig tuck, the D53
  skin-tooth ceiling (logged, non-blocking), painted ears on the
  back-of-hair, sleeve-vs-shirt cream dE up to 24.8, a 3px clearance
  squeeze, cooler back-hair. Preserve list: the best blink pair the
  pipeline has produced (4.4% changed, eyelid-only verified), both hands
  pass construction, matched arm lengths, clean left leg, locked palette,
  zero text.

## sheet-v2.png

- Generated 2026-07-14, same model, cost $0.0707, 16:9 at 1K → 1376×768.
  `sheet-v2-clean.png` is the sips-normalized PNG. Prompt: second block
  below — every v1 finding hardened: the strip wrapped around the NECK with
  both tails on the CHEST and nothing at the waist (C1), walk shoes same
  travel direction with a flat lead sole and lifted trailing heel (C2),
  per-part upper-left highlights called out on the mirrored-pose parts
  (M1), no bare skin at the armholes (M2), the swatch preamble reworded so
  the model stops painting literal chips (m1), and legs sized toward a
  three-heads-tall assembly (m2).
- Author pre-check: drape and walk pair visibly fixed, no extras, no ears
  on the back-of-hair.
- Art Director verdict: pending at time of writing; recorded here when ruled.

## v1 generation prompt

```text
Children's storybook illustration, FULLY PAINTED dense gouache and watercolor with soft painted edges, gentle paper texture, RICH color values glowing like candlelight: dusty plum-violet, soft cream, warm charcoal brown, pale silver — never washed out, never pastel. ONE warm key light from the UPPER LEFT on EVERY single part: every part's highlight side is its left side and its soft cool shadow side is its right side — including BOTH arms and BOTH legs; never mirrored lighting. A cutout puppet part sheet for ONE character, laid out like a paper-doll kit in a neat grid on a plain flat pale-cream background, EXACTLY NINE separate parts and nothing else — no duplicate parts, no props, no extra pieces; every part fully separated with at least a hand-width of empty background between any two parts, no overlapping, all parts at one consistent scale, no drop shadows, no text, no numbers, no lettering anywhere. The character: an original very old wandmaker and shopkeeper, small and slight but bright and warm, with wispy flyaway SILVER-WHITE hair around a high forehead, tufty white eyebrows, large gentle ears, large luminous pale silver-grey eyes, a big friendly nose, rosy weathered cheeks, and a warm knowing closed-mouth smile with deep kind smile lines. SHARED SWATCHES used identically wherever they appear: waistcoat = dusty deep plum-violet with small cloth-covered buttons; shirt = soft cream; trousers = warm charcoal brown; shoes = ONE single design, worn amber-brown leather; hair = silver-white. The nine parts: (1) his head and face: eyes OPEN with relaxed aged lids, framed by the wispy silver-white hair, big ears visible; (2) the IDENTICAL head with eyes gently closed — an exact copy of part 1 changed ONLY at the eyelids: identical hair wisps, identical brows, identical ears, identical nose, identical smile, identical outline, identical size; (3) the back-of-hair alone: the soft wispy silver-white hair mass that sits behind his head, slightly wider than the head; (4) his slight torso, shaped like an EMPTY GARMENT with nobody inside: the dusty plum-violet waistcoat with small cloth buttons over the cream shirt front, a loosely knotted dove-grey cravat at the collar, a plain pale-yellow cloth strip draped around the neck hanging down both sides of the chest with faint stitch dashes and no markings, warm charcoal-brown trousers showing below the waistcoat hem, a short skin neck stub at the collar — and ABSOLUTELY NO SLEEVES, NO CUFFS, NO HANDS, NO ARMS anywhere on this piece: both shoulders end in clean smooth armhole seams; (5) one complete arm from SHOULDER to fingertips hanging STRAIGHT DOWN: the cream shirt sleeve rolled to the elbow, a slender bare elderly forearm, and a small natural hand with a visible thumb and gently curled fingers, relaxed; (6) a second complete arm from SHOULDER to fingertips, EXACTLY the same length as part 5, floating alone attached to NOTHING: bent at the elbow with the small open hand held out at chest height, PALM UP, as if gently presenting something wonderful, same rolled cream sleeve; (7) his LEFT standing leg from hip to foot, straight and vertical, warm charcoal-brown trouser, the amber-brown leather shoe planted FLAT with the toe turned slightly toward the LEFT edge of the picture; (8) his RIGHT standing leg, painted separately — same trouser, same shoe design, same length, toe turned slightly toward the RIGHT edge, and lit from the SAME upper left as every other part (highlight on its left side), never a copied flip; (9) a walking pair: BOTH legs full length from the SAME hip height as parts 7 and 8 down to the floor, both feet pointing the same travel direction, the LEADING foot planted completely FLAT, the TRAILING heel lifted with toe touching, same trousers, same shoes. Hair is soft shaded wisps with interior strands; fabric has woven grain and soft fold shading. Picture-book proportions for a small slight elder. Original character design, not any existing actor or film character.
```

## v2 generation prompt

```text
Children's storybook illustration, FULLY PAINTED dense gouache and watercolor with soft painted edges, gentle paper texture, RICH color values glowing like candlelight: dusty plum-violet, soft cream, warm charcoal brown, pale silver — never washed out, never pastel. ONE warm key light from the UPPER LEFT on EVERY single part: every part's highlight side is its left side and its soft cool shadow side is its right side — including BOTH arms and BOTH legs; never mirrored lighting. A cutout puppet part sheet for ONE character, laid out like a paper-doll kit in a neat grid on a plain flat pale-cream background, EXACTLY NINE separate parts and nothing else — no duplicate parts, no props, no extra pieces; every part fully separated with at least a hand-width of empty background between any two parts, no overlapping, all parts at one consistent scale, no drop shadows, no text, no numbers, no lettering anywhere. The character: an original very old wandmaker and shopkeeper, small and slight but bright and warm, with wispy flyaway SILVER-WHITE hair around a high forehead, tufty white eyebrows, large gentle ears, large luminous pale silver-grey eyes, a big friendly nose, rosy weathered cheeks, and a warm knowing closed-mouth smile with deep kind smile lines. These exact colors are used identically wherever they appear (never paint any color chips, swatch squares, or legend items anywhere on the sheet): waistcoat = dusty deep plum-violet with small cloth-covered buttons; shirt = soft cream; trousers = warm charcoal brown; shoes = ONE single design, worn amber-brown leather; hair = silver-white. The nine parts: (1) his head and face: eyes OPEN with relaxed aged lids, framed by the wispy silver-white hair, big ears visible; (2) the IDENTICAL head with eyes gently closed — an exact copy of part 1 changed ONLY at the eyelids: identical hair wisps, identical brows, identical ears, identical nose, identical smile, identical outline, identical size; (3) the back-of-hair alone: the soft wispy silver-white hair mass that sits behind his head, slightly wider than the head; (4) his slight torso, shaped like an EMPTY GARMENT with nobody inside: the dusty plum-violet waistcoat with small cloth buttons over the cream shirt front, a loosely knotted dove-grey cravat at the collar, a plain pale-yellow cloth strip wrapped around the NECK like a scarf with BOTH tails hanging down the CHEST, one tail on each side of the waistcoat, both ending above the waist — nothing draped at the waist or hip — with faint stitch dashes and no markings, warm charcoal-brown trousers showing below the waistcoat hem, a short skin neck stub at the collar — and ABSOLUTELY NO SLEEVES, NO CUFFS, NO HANDS, NO ARMS, and NO BARE SKIN anywhere on this piece except the neck stub: the armhole openings show only fabric and soft shadow — no shoulders, no upper arms, no flesh at either armhole; both shoulders end in clean smooth armhole seams; (5) one complete arm from SHOULDER to fingertips hanging STRAIGHT DOWN, its highlight edge on ITS LEFT side like every other part: the cream shirt sleeve rolled to the elbow, a slender bare elderly forearm, and a small natural hand with a visible thumb and gently curled fingers, relaxed; (6) a second complete arm from SHOULDER to fingertips, EXACTLY the same length as part 5, floating alone attached to NOTHING: bent at the elbow with the small open hand held out at chest height, PALM UP, as if gently presenting something wonderful, same rolled cream sleeve; (7) his LEFT standing leg from hip to foot, straight and vertical and not too long — sized so the assembled figure stands about three heads tall — warm charcoal-brown trouser, the amber-brown leather shoe planted FLAT with the toe turned slightly toward the LEFT edge of the picture; (8) his RIGHT standing leg, painted separately — same trouser, same shoe design, same length, toe turned slightly toward the RIGHT edge — and even though its shape mirrors part 7, its LIGHTING does not mirror: its highlight edge is on ITS LEFT side, lit from the same upper left as every other part, never a copied flip; (9) a walking pair: BOTH legs full length from the SAME hip height as parts 7 and 8 down to the floor, and BOTH shoes pointing toward the SAME side of the picture — the same direction of travel, never toward each other, never apart — with the LEADING foot resting its whole sole completely FLAT on the floor from heel to toe, and the TRAILING foot behind it with its heel LIFTED high and only its toe touching the floor, same trousers, same shoes. Hair is soft shaded wisps with interior strands; fabric has woven grain and soft fold shading. Picture-book proportions for a small slight elder. Original character design, not any existing actor or film character.
```
