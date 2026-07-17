export const STORYBOOK_STANDARD_CHECKS = Object.freeze([
  '[Storybook Standard 1/7 · Palette] Every artwork color harmonizes with the room or reference palette, with zero pure-black or pure-white fills or strokes.',
  '[Storybook Standard 2/7 · Line] Every visible contour uses soft dark-brown ink, and each outlined subject shows at least two line weights.',
  '[Storybook Standard 3/7 · Form] Every material form shows at least two tones (base and shadow) plus one highlight where the key light reaches it.',
  '[Storybook Standard 4/7 · Light] The scene uses exactly one warm key-light direction matching the room painting, with a lit-side rim on every character that is present.',
  '[Storybook Standard 5/7 · Texture] Every player-facing paper or material surface includes visible grain or material marks, leaving zero flat untextured surfaces.',
  '[Storybook Standard 6/7 · Shape] Player-facing silhouettes and surfaces contain zero perfect rectangles, perfect circles, or ruler-straight edges.',
  '[Storybook Standard 7/7 · Coherence] At thumbnail or squint scale, zero reviewed elements separate from the room or reference family in contrast, edge sharpness, or fidelity.',
]);

export function storybookChecklist(...illusionChecks) {
  if (illusionChecks.length === 0) {
    throw new TypeError('A visual checklist needs at least one illusion-specific check.');
  }
  if (illusionChecks.some((check) => typeof check !== 'string' || check.trim().length === 0)) {
    throw new TypeError('Illusion-specific checks must be non-empty strings.');
  }
  if (illusionChecks.some((check) => check.startsWith('[Storybook Standard'))) {
    throw new TypeError('Storybook Standard checks come only from the canonical seven-item section.');
  }
  if (new Set(illusionChecks).size !== illusionChecks.length) {
    throw new TypeError('Illusion-specific checks must be unique.');
  }
  return Object.freeze([...illusionChecks, ...STORYBOOK_STANDARD_CHECKS]);
}

const REVIEW_SCENE_ILLUSION_CHECKS = Object.freeze({
  foundation: [
    'Before play begins, one illustrated title, one casual-clothes Violet, one owl, and one obvious 88px-or-larger envelope action remain readable without overlapping.',
  ],
  'foundation-saved-review': [
    'The returning-player title keeps Violet, the owl, the castle painting, and one 88px-or-larger continue envelope visually separate.',
  ],
  'ch1-start': [
    'The delivered envelope, opening choreography, readable invitation, and two independent reading actions preserve one continuous letter identity with zero ambiguous next step.',
    'Before Violet earns her school gear, the quest compass is the only persistent HUD object; no empty wand sheath or unowned satchel appears.',
  ],
  'world-shimmer-review': [
    'Exactly one current-objective golden thread remains strongest, while optional and secret glints stay quieter and never become competing rings or symbols.',
  ],
  'world-shimmer-hint-review': [
    'Hint escalation strengthens only the existing first-wand golden thread, with zero added arrows, rings, labels, or competing objective marks.',
  ],
  'world-secret-pet-review': [
    'The cat’s wander, paw, and return cue remains readable beside the rare secret glint without hiding Violet, the wandmaker, or the active golden thread.',
  ],
  'ch1-wand-chosen': [
    'The chosen wand reads as Violet’s completed interaction, drops out of advertisement, and leaves exactly one visually stronger next objective.',
  ],
  'ch1-complete': [
    'The completed Chapter One free-roam frame keeps Violet, her companion, and exactly one next objective visually distinct, with spent shopping interactions quiet.',
  ],
  'sp-letter-open-review': [
    'The sealed envelope, opening frame zero, unfolding paper, and settled invitation retain identical material proportions with zero blank or doubled-paper frame.',
  ],
  'transition-ink-review': [
    'After one doorway tap, Violet visibly walks to and through the authored exit before the room transition begins; she never teleports from her starting position.',
    'The organic ink reveal covers the outgoing room before exposing the destination street, with zero blank canvas, hard geometric wipe edge, or exposed painting boundary.',
  ],
  'transition-sparkle-review': [
    'Map-travel sparkles remain attached to the organic reveal edge while the destination replaces the street with zero blank canvas or competing objective symbol.',
  ],
  'sp-brick-wall-review': [
    'The intact courtyard wall opens center-out as one readable ten-by-eight mortar grid whose moving cells become individual opaque bricks, with full-canvas Diagon Alley continuously visible from frame zero at one stable world scale, the aperture naturally occluding the outgoing cast, zero courtyard border, zero rectangular painting edge, and zero second room-transition wipe.',
  ],
  'sp-wand-vase-review': [
    'The wrong-wand vase wobble, break, bounce, and settle remain a single readable mishap, with every shard inside the room and clear of Violet and the controls.',
  ],
  'sp-wand-chosen-review': [
    'The chosen-wand crescendo keeps Violet, wand, and wandmaker readable through one restrained golden focal effect that fully settles before control returns.',
  ],
  'sp-ch2-barrier-run-review': [
    'Violet’s hesitation, committed run, and disappearance through the brick barrier read as one continuous action from her real approach point, with no teleport or duplicate Violet.',
    'The opaque storybook whoosh fully covers the ordinary-to-magical platform swap before the scarlet train and conductor appear, with zero blank frame, exposed painting edge, or mixed station variant; the conductor’s objective shimmer stays attached to his figure and never encloses him in a generic ring or capsule.',
  ],
  'sp-ch2-sweet-reaction-review': [
    'Violet’s chosen Every-Flavour Bean produces one playful, silent face-and-body reaction that remains readable beside the trolley and her seated friends without presenting failure or punishment.',
    'The reaction effect stays attached to Violet, clears her glasses and expression, and introduces no text, score, success badge, or competing objective symbol.',
  ],
  'sp-ch2-lake-vista-review': [
    'The illuminated castle and its lake reflection remain the uncontested focal point for the full quiet hold, with Violet and her companion clear of the silhouette and no gameplay affordance competing for attention.',
    'Full and reduced motion preserve one stable painted scale and horizon with zero blank frame, hard layer edge, camera snap, or ornamental clutter over the vista.',
  ],
  'sp-ch2-sorting-reveal-review': [
    'The reveal presents Gryffindor as Violet’s one canonical outcome, keeping Violet, the Sorting Hat, and the scarlet-and-gold house response simultaneously readable.',
    'The yearbook-ready composition preserves Violet’s chosen robe trim while adding the Gryffindor identity through shaped, textured hanging cloth with zero flat fill strips, alternate-house color, duplicate character, or banner covering her face.',
  ],
  'sp-ch2-common-room-arrival-review': [
    'The common room reads immediately as warm, safe, and specifically Gryffindor while Violet remains the center of Harry, Ron, and Hermione’s welcome composition and the welcome words belong to one visibly hung fabric object rather than floating over the painting.',
    'Violet’s Gryffindor identity, her chosen robe trim, her companion, and all three friends remain mutually readable with no furniture collision, clipped figure, or competing interaction glow.',
  ],
  'sp-ch2-chapter-card-review': [
    'The Chapter Two completion page keeps most of the Gryffindor common-room painting unobscured while its compact hanging chapter title and separate first-classes scroll remain readable as one intentional storybook composition.',
    'The page turn reveals zero blank or unpainted frame and contains no retired preview ticket, replay choice shelf, generic owl ornament, or false gameplay affordance.',
  ],
  'parent-panel': [
    'The grown-up book presents replay and yearbook as two distinct 88px-or-larger actions, with tabs, content, and close control mutually non-overlapping.',
  ],
  'parent-settings': [
    'Every grown-up sound, movement, and learning control has one readable label, one visible state, and an 88px-or-larger target that overlaps no neighboring control.',
  ],
  'parent-save': [
    'Save transfer, recovery, and Start Over remain three visually distinct guarded actions with zero overlap between labels, icons, or touch targets.',
  ],
  'parent-confirm': [
    'The Start Over confirmation shows exactly one safe cancel action and one destructive confirmation action as separate 88px-or-larger targets.',
  ],
  'parent-yearbook': [
    'The yearbook keeps its mounted keepsake area, caption, page marks, navigation, and close action mutually separate in both empty and populated states.',
  ],
  'save-transfer': [
    'The grown-up save-transfer dialog reads as one organically curved parchment sheet with a leather-and-brass owl seal, a paper data field, and two distinct 88px-or-larger actions, with zero clipped polygon corners, flat white fields, or overlap.',
  ],
  'pet-name-dialog': [
    'The parent-assisted naming dialog keeps one text field, one confirmation action, and one cancel action visible, keyboard reachable, and mutually non-overlapping.',
  ],
  'ui-dialogue-review': [
    'One dialogue parchment, one portrait frame, and the two 88×88 replay/advance controls remain mutually separate and leave Hagrid unobscured.',
  ],
  'ui-dialogue-night-review': [
    'One dark-room dialogue parchment, one portrait frame, and the two 88×88 replay/advance controls remain mutually separate and leave the Wandmaker unobscured.',
    'All dialogue words and icons remain legible against the night-room treatment.',
  ],
  'ui-dialogue-center-review': [
    'The centered, silent Violet puppet remains fully readable beside one narrated dialogue parchment and two non-overlapping 88×88 controls.',
  ],
  'ui-dialogue-live-review': [
    'The live bedroom dialogue keeps Hagrid, Violet, Hagrid’s portrait, the current objective scenery, one parchment caption, and two 88×88 controls mutually separate against the painted room.',
    'Hagrid reads as a grounded half-giant with visible coat sleeves, hands, boots, separate shaded hair and beard masses, and zero gold painted inside his silhouette.',
    'Casual Violet reads as a long-limbed child in a three-tone soccer jersey, shaded leggings, and sneakers, with joined shoulder, elbow, wrist, and hand shapes.',
    'Hagrid’s broad silhouette remains visibly larger than Violet while fitting beneath the bedroom doorway he uses.',
    'Both bedroom characters cast visible floor-planted contact shadows that stay still beneath body motion and place their highlight and rim on the side lit by the right-hand window.',
  ],
  'ui-dialogue-night-live-review': [
    'The live dusk-street dialogue keeps Hagrid, his portrait, one warm-dark parchment caption, and two 88×88 controls mutually separate and legible.',
    'Hagrid stands between storefronts instead of covering the Ollivanders entrance, and his ticket interaction remains visually distinct from every shop door.',
  ],
  'ui-letter-reading-review': [
    'The complete invitation remains visible beside Violet and above two distinct, non-overlapping 88px-or-larger reading actions; paper and actions cover no part of her puppet.',
    'The written invitation matches its narration and contains zero unrelated dialogue captions.',
  ],
  'ui-robe-picker-review': [
    'Violet’s real full-body robe puppet remains visible from hair to shoes inside the dressing mirror, with the selected trim applied to the preview.',
    'Exactly twelve named swatches appear as distinct, non-overlapping targets that are each at least 88×88.',
    'The selected swatch remains readable independently of its hue through one dark outer outline, one light inner outline, and one check marker.',
    'The mirror, twelve swatch targets, and 88px-or-larger confirmation control remain mutually non-overlapping.',
  ],
  'ui-choices-review': [
    'The normal Chapter One Menagerie remains recognizable but subdued behind exactly three painted pet choices, each retaining its live companion puppet, code-rendered label, and distinct non-overlapping 88×88-or-larger target.',
  ],
  'ui-choice-icons-review': [
    'The normal Chapter One Menagerie remains recognizable but subdued behind exactly two painted confirmation choices, each retaining its code-drawn emblem, code-rendered label, and distinct non-overlapping 88×88-or-larger target.',
  ],
  'ui-satchel-map-early-review': [
    'Exactly four painted destination panels appear in one readable journey, with Diagon Alley marked Here, Ollivanders marked Next, and the two later shops visibly softened by mist plus one small brass lock without becoming illegible.',
    'Every destination name is code-rendered and centered within its own blank parchment label band, while Map, Cards, Grown-ups, and Start fresh remain centered in the intentional blank label area of their painted props.',
    'The close seal is the only X on the spread, and every visible control remains separate from every 88px-or-larger destination target.',
  ],
  'ui-satchel-map-review': [
    'Exactly four readable painted destination panels appear, one plum Here marker identifies Violet’s current place, completed stops carry small gold check marks, and exactly one gold objective star with a readable Next tag is visibly attached to the intended destination.',
    'Every unlocked location remains a distinct 88px-or-larger target, while one gold trail links Here directly to Next and the older route marks stay quiet enough not to imply a different destination.',
    'Every destination name is code-rendered and centered within its own blank parchment label band, while Map, Cards, Grown-ups, and Start fresh remain centered in the intentional blank label area of their painted props.',
    'The close seal is the only X on the spread; Start fresh uses a circular return arrow, and both remain visually distinct from the Map and Cards navigation.',
    'The fold-out map, painted leather bookmarks, bottom-edge grown-up and Start fresh utilities, and close control remain mutually non-overlapping.',
  ],
  'ui-satchel-cards-review': [
    'Exactly four production card slots appear as two earned painted keepsakes and two quieter closed pockets, with every state recognizable at thumbnail scale.',
    'Every card target remains at least 88×88 without crossing the book gutter or covering the tabs, labeled grown-up keyhole, permanent Start fresh action, or close control.',
    'The close seal is the only X on the spread, while Start fresh keeps its separate circular return arrow.',
  ],
  'ui-satchel-ch2-cards-review': [
    'The Chapter Two satchel opens directly to Cards, shows exactly one Cards bookmark, and contains no Map bookmark or empty navigation gap that suggests a missing page.',
    'Exactly four production slots appear as three earned painted keepsakes and one quieter closed pocket, with every state recognizable at thumbnail scale.',
    'Cards, Grown-ups, and Start fresh remain centered in their painted label areas, and every card and control remains a distinct 88px-or-larger target.',
  ],
  'ui-satchel-ch3-cards-review': [
    'The Chapter Three satchel opens directly to Cards, shows exactly one Cards bookmark, and contains no Map bookmark or empty navigation gap that suggests a missing page.',
    'All four production cards appear as earned painted keepsakes, with no closed pocket and no control overlapping a card.',
    'Cards, Grown-ups, and Start fresh remain centered in their painted label areas, and the close seal remains the only X.',
  ],
  'ui-objective-review': [
    'The real Chapter One street remains readable beneath a light veil while the compact reminder stays along the upper edge instead of replacing the room with a full-screen page.',
    'Exactly one detailed brass quest compass, one live three-word-or-shorter caption, and one wax close seal remain mutually separate on the painted leather-backed parchment, with zero decorative owl filler.',
  ],
  'ui-chapter-card-review': [
    'One chapter painting, one title, and one 88px-or-larger action remain readable and mutually non-overlapping, with zero decorative owl filler.',
  ],
  'ch1-follow-hagrid-review': [
    'Hagrid visibly walks out through the bedroom doorway after his introduction, leaves no stationary second Hagrid interaction behind, and the sparkle footprints point from Violet to that door.',
    'Violet remains inside the bedroom while the departing Hagrid and the golden-threaded door stay visually distinct.',
  ],
  'ch1-follow-hagrid-leaky-review': [
    'Hagrid visibly walks out through the Leaky Cauldron courtyard door after “This way!”, leaves no stationary Hagrid interaction behind, and the sparkle footprints point from Violet to that door.',
    'Violet remains inside the Leaky Cauldron while the departing Hagrid and the golden-threaded courtyard door stay visually distinct.',
  ],
  'character-cast-review': [
    'Exactly five labeled, full-body cast members remain visually separated and readable at gameplay scale.',
    'Violet reads as the youngest and smallest human, clearly shorter than the Wandmaker, Madam Malkin, the Keeper, and the deliberately towering Hagrid.',
    'Each cast member has two readable eyes with iris, pupil, catch-light, and lid shapes; hair and clothing remain distinct masses.',
    'Every cast member has articulated limbs, readable thumbs/hands and shoes, layered base-shadow-highlight material planes, and a visible floor-planted contact shadow beneath the feet.',
    'Hagrid retains visible arms, broad boots, a shaped coat, and separate shaded hair, moustache, and beard masses instead of one dark silhouette.',
  ],
  'character-pets-review': [
    'Exactly three labeled companions remain visually separated, grounded, and readable at follow-gameplay scale.',
    'Cat, owl, and toad each retain a distinct silhouette, face, and material treatment.',
  ],
  'character-portraits-review': [
    'Exactly nine labeled portraits remain separated, fully inside their frames, and recognizable as the same characters used at gameplay scale.',
  ],
  'owl-motion-review': [
    'Exactly eight labeled owl renderings remain distinct: the post owl in perch, takeoff, delivery, flight, and settle poses, plus the pet owl in idle, perch, and follow poses.',
    'Post and pet identities remain recognizable in every pose, with two intact eyes and one continuous head/body silhouette per owl.',
    'Full-motion and reduced-motion frames preserve each owl variant’s proportions and material treatment.',
  ],
  'hagrid-sprite-review': [
    'Exactly five labeled full-frame Hagrids remain separated on plinths: neutral, blink, speaking, walking right, and walking left, each with a grounded contact shadow.',
    'Every pose reads as one connected half-giant painting at gameplay scale, with no assembled-limb seams, floating parts, double edges, or independently mirrored hands.',
    'Both hands remain anatomically oriented and attached to the correct arms in every pose, including the single whole-frame mirror used for the leftward walk.',
    'Every figure keeps the same identity: wild dark-brown mane and beard with a visible warm smile, patched deep-brown coat with brass toggles, deep-green waistcoat, plum scarf, and matching two-buckle boots.',
    'The speaking loop has two readable mouth shapes, the walk has two distinct planted steps, and every boot sole meets its contact shadow with no lit gap at both review sizes.',
  ],
  'wandmaker-sprite-review': [
    'Exactly four labeled full-frame Wandmakers remain visually separated: neutral, blink, talk A, and talk B, each with one figure-sized grounded contact shadow.',
    'Every state reads as one connected small elder painting with no assembled-limb seams, floating parts, double edges, background field, or independently mirrored hands.',
    'All four states keep the same identity, silhouette, and registration: wispy silver-white hair, pale silver-grey eyes when open, warm knowing face, dusty plum waistcoat, cream rolled-sleeve shirt, warm charcoal trousers, yellow measuring tape, and worn amber-brown shoes.',
    'Blink changes only the eyelids, while talk A and talk B provide two distinct readable mouth shapes without changing the Wandmaker’s head, hands, clothing, or body proportions.',
    'Both shoe soles meet their contact shadows with no lit gap, and every figure remains clear of its label and the outer gold frame at both review sizes.',
  ],
  'wandmaker-live-review': [
    'When Violet enters Ollivanders in normal gameplay, the Wandmaker speaks his automatic welcome with the same identity in his world figure and attached dialogue portrait.',
    'The two speaking mouth shapes remain readable without moving his registration, while his full body stays planted beside the counter and clear of Violet, the parchment, and both dialogue controls.',
    'The Wandmaker reads as a small, kind elder at the intended room scale, with silver-white hair, dusty plum waistcoat, yellow measuring tape, warm charcoal trousers, and amber-brown shoes all readable against Ollivanders.',
  ],
  'madam-malkin-sprite-review': [
    'Exactly four labeled full-frame Madam Malkins remain visually separated: neutral, blink, talk A, and talk B, each with one figure-sized grounded contact shadow.',
    'Every state reads as one connected motherly tailor painting with no assembled-limb seams, floating parts, double edges, background field, or independently mirrored hands.',
    'All four states keep the same identity, silhouette, and registration: silver-streaked auburn bun, warm hazel-brown eyes when open, rosy face, heather-purple work dress, cream apron with chalk and ruler, tomato-red wrist pincushion, and plum lace-up boots.',
    'Blink changes only the eyelids, while talk A and talk B provide two distinct readable mouth shapes without changing Madam Malkin’s head, hands, clothing, tools, or body proportions.',
    'Both boot soles meet their contact shadows with no lit gap, and every figure remains clear of its label and the outer gold frame at both review sizes.',
  ],
  'madam-malkin-live-review': [
    'After Violet approaches the robe-shop stool in normal gameplay, Madam Malkin welcomes her with the same identity in her world figure and attached dialogue portrait.',
    'The two speaking mouth shapes remain readable without moving her registration, while her full body stays planted beside the fitting area and clear of Violet, the parchment, and both dialogue controls.',
    'Madam Malkin reads as a warm, brisk, motherly tailor at the intended room scale, with her silver-streaked bun, purple work dress, cream apron tools, red wrist pincushion, and plum boots readable against the painted shop.',
  ],
  'menagerie-keeper-sprite-review': [
    'Exactly four labeled full-frame Menagerie Keepers remain visually separated: neutral, blink, talk A, and talk B, each with one figure-sized grounded contact shadow.',
    'Every state reads as one connected animal keeper painting with no assembled-limb seams, floating parts, double edges, cyan source field, or detached extraction fragments.',
    'All four states keep the same identity, silhouette, and registration: burnt-auburn side braid, moss-green eyes, freckled face, repaired green work coat, tawny leather apron, left gauntlet, paw-clasp pouch, right-hand grooming brush, sage trousers, and umber lace-up boots.',
    'Blink changes only the eyelids, while talk A and talk B provide two distinct readable mouth shapes without changing the keeper’s head, braid, hands, tools, clothing, or body proportions.',
    'Both boot soles meet their contact shadows with no lit gap, the complete grooming brush remains visible, and every figure stays clear of its label and the outer gold frame at both review sizes.',
  ],
  'menagerie-keeper-live-review': [
    'After Violet approaches the keeper in normal Menagerie gameplay, the keeper welcomes her with the same identity in her world figure and attached dialogue portrait.',
    'The two speaking mouth shapes remain readable without moving her registration, while her full body stays planted beside the counter and clear of Violet, the parchment, the pet choices, and both dialogue controls.',
    'The keeper reads as a calm, capable animal caretaker at the intended room scale, with her auburn braid, green coat, leather apron, gauntlet, pouch, brush, and boots readable against the painted Menagerie.',
  ],
  'violet-expression-review': [
    'Exactly seven labeled Violet states appear as matched portrait and full-body pairs: neutral, blink, talk A, talk B, wonder, proud, and curious.',
    'Every state retains the locked Violet identity and unchanged full-body silhouette: dark-green rectangular glasses, warm light-brown hair with attached wisps, warm brown eyes when open, purple-and-blue soccer jersey, dark leggings, and gray-purple trainers.',
    'At portrait scale, blink closes both eyes naturally, talk A and talk B have distinct readable mouth shapes, and wonder, proud, and curious preserve their approved eye, brow, and mouth art without changing Violet’s identity.',
    'The cyan source field is completely absent, with no turquoise fringe, clipped hair wisps, holes, or detached edge fragments at either review zoom.',
    'All seven full figures share exact aligned-canvas registration, each receives exactly one figure-sized planted contact shadow, and all remain visually separated from their labels, portrait frames, and the outer gold frame.',
  ],
});

// A fixture belongs here only when it renders no surface visible to Violet or an assisting grown-up.
// Each future entry must explain that internal-only purpose; every current harness fixture is visible.
export const NON_PLAYER_HARNESS_SCENE_EXCLUSIONS = Object.freeze({});

export const VISUAL_REVIEW_CHECKLISTS = Object.freeze(Object.fromEntries(
  Object.entries(REVIEW_SCENE_ILLUSION_CHECKS).map(([scene, checks]) => [
    scene,
    storybookChecklist(...checks),
  ]),
));

export function visualReviewChecklist(scene) {
  return VISUAL_REVIEW_CHECKLISTS[scene] ?? null;
}
