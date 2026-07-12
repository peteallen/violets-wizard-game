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

const AMBIENCE_ALIASES = Object.freeze({
  'ambience/ch1/bedroom': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/leaky': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/diagon': 'assets/audio/music/ch1/diagonAlley.mp3',
  'ambience/ch1/shop': 'assets/audio/music/ch1/violetTheme.mp3',
});

const allKeys = [...new Set([...chapter1AssetKeys, ...chapter2AssetKeys])];

export const assetManifest = Object.freeze(Object.fromEntries(allKeys.map((key) => {
  const chapter = key.includes('/ch2/') ? 'ch2' : 'ch1';
  if (IMAGE_PATHS[key]) return [key, Object.freeze({ path: IMAGE_PATHS[key], kind: 'image', chapter })];
  if (AMBIENCE_ALIASES[key]) return [key, Object.freeze({ path: AMBIENCE_ALIASES[key], kind: 'music', chapter, volume: 0.38 })];
  if (key.startsWith('voice/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'voice', chapter, volume: 1 })];
  if (key.startsWith('sfx/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'sfx', chapter, volume: 0.8 })];
  if (key.startsWith('music/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'music', chapter, volume: 0.55 })];
  throw new Error(`No manifest convention exists for asset key ${key}.`);
})));

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
