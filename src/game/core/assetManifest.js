import { assetUrl } from './assetUrl.js';

const entries = [
  ['rooms/ch1/bedroom/base', 'assets/art/rooms/ch1-bedroom.webp', 'image', 1],
  ['rooms/ch1/bedroom/sky', 'assets/art/rooms/ch1-bedroom-sky.webp', 'image', 1],
  ['rooms/ch1/leaky/base', 'assets/art/rooms/ch1-leaky.webp', 'image', 1],
  ['rooms/ch1/courtyard/base', 'assets/art/rooms/ch1-courtyard.webp', 'image', 1],
  ['rooms/ch1/diagon/day', 'assets/art/rooms/ch1-diagon-day.webp', 'image', 1],
  ['rooms/ch1/diagon/dusk', 'assets/art/rooms/ch1-diagon-dusk.webp', 'image', 1],
  ['rooms/ch1/ollivanders/base', 'assets/art/rooms/ch1-ollivanders.webp', 'image', 1],
  ['rooms/ch1/malkins/base', 'assets/art/rooms/ch1-malkins.webp', 'image', 1],
  ['rooms/ch1/menagerie/base', 'assets/art/rooms/ch1-menagerie.webp', 'image', 1],
  ['chapterCards/ch1/platform', 'assets/art/chapter-cards/ch1-platform.webp', 'image', 1],
  ['cards/morgana/portrait', 'assets/art/cards/morgana.webp', 'image', 1],
  ['cards/dumbledore/portrait', 'assets/art/cards/dumbledore.webp', 'image', 1],
  ['music/ch1/violetTheme', 'assets/audio/music/violet-theme.mp3', 'music', 1, 0.55],
  ['music/ch1/diagonAlley', 'assets/audio/music/diagon-alley.mp3', 'music', 1, 0.52],
  ['music/ch1/chapterTriumph', 'assets/audio/music/chapter-triumph.mp3', 'music', 1, 0.58],
  ['voice/ch2/preview', 'assets/audio/voice/ch2/preview.mp3', 'voice', 2, 1],
  ['sfx/ch2/trainWhistle', 'assets/audio/sfx/train-whistle.mp3', 'sfx', 2, 0.75],
];

const voiceIds = [
  'letter/invitation', 'letter/waiting', 'guide/arrival', 'guide/wall', 'guide/map',
  'wandmaker/welcome', 'wandmaker/wrong1', 'wandmaker/wrong2', 'wandmaker/chosen', 'violet/wow',
  'tailor/welcome', 'tailor/done', 'keeper/welcome', 'keeper/confirm', 'keeper/name', 'keeper/done',
  'guide/ticket', 'guide/platform', 'narrator/chapterEnd', 'card/morgana', 'card/dumbledore',
  'violet/broom', 'violet/noSpells',
];

for (const id of voiceIds) entries.push([`voice/ch1/${id}`, `assets/audio/voice/ch1/${id}.mp3`, 'voice', 1, 1]);

const sfxIds = [
  'owlTap', 'owlFlap', 'paperSlide', 'sealCrack', 'wallRumble', 'brickClack', 'wandPaperWhirl',
  'vaseShatter', 'wandChosen', 'coin', 'ticket', 'chapterTurn', 'petCat', 'petOwl', 'petToad',
];
for (const id of sfxIds) entries.push([`sfx/ch1/${id}`, `assets/audio/sfx/${id}.mp3`, 'sfx', 1, 0.8]);

export const assetManifest = Object.freeze(Object.fromEntries(entries.map(([key, path, kind, chapter, volume]) => [
  key,
  Object.freeze({ key, path, kind, chapter, volume, available: false }),
])));

export function getAsset(key) {
  return assetManifest[key] ?? null;
}

export function resolveAsset(key) {
  const entry = getAsset(key);
  return entry?.available ? assetUrl(entry.path) : null;
}

export function chapterAssets(chapter) {
  return Object.values(assetManifest).filter((entry) => entry.chapter === chapter);
}
