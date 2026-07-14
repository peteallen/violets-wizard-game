export const STORYBOOK_STANDARD_CHECKS = Object.freeze([
  '[Storybook Standard 1/7 · Palette] Every artwork color harmonizes with the room or reference palette, with zero pure-black or pure-white fills or strokes.',
  '[Storybook Standard 2/7 · Line] Every visible contour uses soft dark-brown ink, and each outlined subject shows at least two line weights.',
  '[Storybook Standard 3/7 · Form] Every material form shows at least two tones (base and shadow) plus one highlight where the key light reaches it.',
  '[Storybook Standard 4/7 · Light] The scene uses exactly one warm upper-left key-light direction, with a lit-side rim on every character that is present.',
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
  'ui-dialogue-review': [
    'One dialogue parchment, one portrait frame, and the two 88×88 replay/advance controls remain mutually separate and leave Hagrid unobscured.',
  ],
  'ui-dialogue-night-review': [
    'One dark-room dialogue parchment, one portrait frame, and the two 88×88 replay/advance controls remain mutually separate and leave the Wandmaker unobscured.',
    'All dialogue words and icons remain legible against the night-room treatment.',
  ],
  'ui-dialogue-center-review': [
    'The centered Violet puppet remains fully readable beside one dialogue parchment and two non-overlapping 88×88 controls.',
  ],
  'ui-broom-caption-review': [
    'The two-word “Flying broom!” caption remains readable, and neither 88×88 dialogue control covers Violet or the caption.',
  ],
  'ui-letter-reading-review': [
    'The complete invitation remains visible above two distinct, non-overlapping 88px-or-larger reading actions.',
    'The written invitation matches its narration and contains zero unrelated dialogue captions.',
  ],
  'ui-robe-picker-review': [
    'Violet’s real full-body robe puppet remains visible from hair to shoes inside the dressing mirror, with the selected trim applied to the preview.',
    'Exactly twelve named swatches appear as distinct, non-overlapping targets that are each at least 88×88.',
    'The selected swatch remains readable independently of its hue through one dark outer outline, one light inner outline, and one check marker.',
    'The mirror, twelve swatch targets, and 88px-or-larger confirmation control remain mutually non-overlapping.',
  ],
  'ui-choices-review': [
    'Exactly three pet choices appear as distinct, non-overlapping targets that are each at least 88×88.',
  ],
  'ui-satchel-map-review': [
    'Exactly one objective star marks the current destination, while every unlocked location remains a distinct 88px-or-larger target.',
    'The map, leather bookmarks, brass keyhole, and close control remain mutually non-overlapping.',
  ],
  'ui-satchel-cards-review': [
    'The earned and unearned card states are visually distinct, and both card targets remain at least 88×88 without covering the tabs or close control.',
  ],
  'ui-objective-review': [
    'Exactly one objective icon and one three-word-or-shorter caption are visible, with zero decorative owl filler.',
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
    'Each cast member has two readable eyes with iris, pupil, catch-light, and lid shapes; hair and clothing remain distinct masses.',
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
});

export const VISUAL_REVIEW_CHECKLISTS = Object.freeze(Object.fromEntries(
  Object.entries(REVIEW_SCENE_ILLUSION_CHECKS).map(([scene, checks]) => [
    scene,
    storybookChecklist(...checks),
  ]),
));

export function visualReviewChecklist(scene) {
  return VISUAL_REVIEW_CHECKLISTS[scene] ?? null;
}
