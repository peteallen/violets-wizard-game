import { chapter1AssetKeys } from '../content/chapters/ch1.js';
import { chapter2AssetKeys } from '../content/chapters/ch2.js';
import { assetUrl } from './assetUrl.js';

const IMAGE_PATHS = Object.freeze({
  'rooms/ch1/bedroom/base': 'assets/art/rooms/ch1-bedroom.webp',
  'rooms/ch1/bedroom/sky': 'assets/art/rooms/ch1-bedroom.webp',
  'rooms/ch1/leaky/base': 'assets/art/rooms/ch1-leaky.webp',
  'rooms/ch1/courtyard/base': 'assets/art/rooms/ch1-courtyard.webp',
  'rooms/ch1/diagon/day': 'assets/art/rooms/ch1-diagon-day.webp',
  'rooms/ch1/diagon/dusk': 'assets/art/rooms/ch1-diagon-dusk.webp',
  'rooms/ch1/ollivanders/base': 'assets/art/rooms/ch1-ollivanders.webp',
  'rooms/ch1/malkins/base': 'assets/art/rooms/ch1-malkins.webp',
  'rooms/ch1/menagerie/base': 'assets/art/rooms/ch1-menagerie.webp',
  'maps/ch1/diagon': 'assets/art/rooms/ch1-diagon-day.webp',
  'chapterCards/ch1/platform': 'assets/art/chapter-cards/ch1-platform.webp',
  'cards/morgana/portrait': 'assets/art/cards/morgana.webp',
  'cards/dumbledore/portrait': 'assets/art/cards/dumbledore.webp',
});

const CHARACTER_IMAGE_PATHS = Object.freeze({
  'characters/violet/casual/neutral': 'assets/art/characters/violet/casual/neutral.png',
  'characters/violet/casual/blink': 'assets/art/characters/violet/casual/blink.png',
  'characters/violet/casual/talk-a': 'assets/art/characters/violet/casual/talk-a.png',
  'characters/violet/casual/talk-b': 'assets/art/characters/violet/casual/talk-b.png',
  'characters/violet/casual/wonder': 'assets/art/characters/violet/casual/wonder.png',
  'characters/violet/casual/proud': 'assets/art/characters/violet/casual/proud.png',
  'characters/violet/casual/curious': 'assets/art/characters/violet/casual/curious.png',
  'characters/violet/casual/profile-right': 'assets/art/characters/violet/casual/profile-right.png',
  'characters/violet/casual/walk-contact': 'assets/art/characters/violet/casual/walk-contact.png',
  'characters/violet/casual/walk-pass': 'assets/art/characters/violet/casual/walk-pass.png',
  'characters/violet/casual/jump': 'assets/art/characters/violet/casual/jump.png',
  'characters/violet/casual/giggle': 'assets/art/characters/violet/casual/giggle.png',
  'characters/violet/casual/tumble': 'assets/art/characters/violet/casual/tumble.png',
  'characters/violet/casual/wand-hold': 'assets/art/characters/violet/casual/wand-hold.png',
  'characters/violet/casual/cheer': 'assets/art/characters/violet/casual/cheer.png',
  'characters/violet/robes/neutral': 'assets/art/characters/violet/robes/neutral.png',
  'characters/violet/robes/blink': 'assets/art/characters/violet/robes/blink.png',
  'characters/violet/robes/talk-a': 'assets/art/characters/violet/robes/talk-a.png',
  'characters/violet/robes/talk-b': 'assets/art/characters/violet/robes/talk-b.png',
  'characters/violet/robes/wonder': 'assets/art/characters/violet/robes/wonder.png',
  'characters/violet/robes/proud': 'assets/art/characters/violet/robes/proud.png',
  'characters/violet/robes/curious': 'assets/art/characters/violet/robes/curious.png',
  'characters/violet/robes/profile-right': 'assets/art/characters/violet/robes/profile-right.png',
  'characters/violet/robes/walk-contact': 'assets/art/characters/violet/robes/walk-contact.png',
  'characters/violet/robes/walk-pass': 'assets/art/characters/violet/robes/walk-pass.png',
  'characters/violet/robes/robe-present': 'assets/art/characters/violet/robes/robe-present.png',
  'characters/violet/robes/wand-hold': 'assets/art/characters/violet/robes/wand-hold.png',
  'characters/violet/robes/cheer': 'assets/art/characters/violet/robes/cheer.png',
  'characters/hagrid/default/neutral': 'assets/art/characters/hagrid/default/neutral.png',
  'characters/hagrid/default/blink': 'assets/art/characters/hagrid/default/blink.png',
  'characters/hagrid/default/talk-a': 'assets/art/characters/hagrid/default/talk-a.png',
  'characters/hagrid/default/talk-b': 'assets/art/characters/hagrid/default/talk-b.png',
  'characters/hagrid/default/profile-right': 'assets/art/characters/hagrid/default/profile-right.png',
  'characters/hagrid/default/walk-contact': 'assets/art/characters/hagrid/default/walk-contact.png',
});

const AMBIENCE_ALIASES = Object.freeze({
  'ambience/ch1/bedroom': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/leaky': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/diagon': 'assets/audio/music/ch1/diagonAlley.mp3',
  'ambience/ch1/shop': 'assets/audio/music/ch1/violetTheme.mp3',
});

const allKeys = [...new Set([...chapter1AssetKeys, ...chapter2AssetKeys])];

const chapterAssetEntries = Object.fromEntries(allKeys.map((key) => {
  const chapter = key.includes('/ch2/') ? 'ch2' : 'ch1';
  if (IMAGE_PATHS[key]) return [key, Object.freeze({ path: IMAGE_PATHS[key], kind: 'image', chapter })];
  if (AMBIENCE_ALIASES[key]) return [key, Object.freeze({ path: AMBIENCE_ALIASES[key], kind: 'music', chapter, volume: 0.38 })];
  if (key.startsWith('voice/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'voice', chapter, volume: 1 })];
  if (key.startsWith('sfx/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'sfx', chapter, volume: 0.8 })];
  if (key.startsWith('music/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'music', chapter, volume: 0.55 })];
  throw new Error(`No manifest convention exists for asset key ${key}.`);
}));

const characterAssetEntries = Object.fromEntries(Object.entries(CHARACTER_IMAGE_PATHS).map(([key, path]) => [
  key,
  Object.freeze({ path, kind: 'image', chapter: 'ch1' }),
]));

export const assetManifest = Object.freeze({ ...chapterAssetEntries, ...characterAssetEntries });

export function getAsset(key) {
  return assetManifest[key] ?? null;
}

export function resolveAsset(key) {
  return assetManifest[key] ? assetUrl(assetManifest[key].path) : null;
}

export function chapterAssets(chapter) {
  const chapterId = typeof chapter === 'number' ? `ch${chapter}` : chapter;
  return Object.entries(assetManifest)
    .filter(([, entry]) => entry.chapter === chapterId)
    .map(([key, entry]) => ({ key, ...entry }));
}
