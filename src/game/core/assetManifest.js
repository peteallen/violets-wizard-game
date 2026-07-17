import { chapter1AssetKeys } from '../content/chapters/ch1.js';
import { chapters } from '../content/index.js';
import { productionCharacterCatalog } from '../characters/productionCatalog.js';
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

const UI_IMAGE_PATHS = Object.freeze({
  'ui/title/backdrop-v2': 'assets/art/ui/title/title-backdrop-v2.webp',
  'ui/title/return-envelope-v2': 'assets/art/ui/title/return-envelope-v2.webp',
  'ui/satchel/spread-v2': 'assets/art/ui/satchel/spread-v2.webp',
  'ui/satchel/card-frame-v2': 'assets/art/ui/satchel/card-frame-v2.webp',
  'ui/satchel/card-pocket-v2': 'assets/art/ui/satchel/card-pocket-v2.webp',
  'ui/satchel/map-tab': 'assets/art/ui/satchel/map-tab.webp',
  'ui/satchel/cards-tab': 'assets/art/ui/satchel/cards-tab.webp',
  'ui/satchel/grown-ups': 'assets/art/ui/satchel/grown-ups.webp',
  'ui/satchel/start-fresh': 'assets/art/ui/satchel/start-fresh.webp',
  'ui/satchel/close-seal': 'assets/art/ui/satchel/close-seal.webp',
  'ui/satchel/destination-diagon-alley': 'assets/art/ui/satchel/destination-diagon-alley.webp',
  'ui/satchel/destination-ollivanders': 'assets/art/ui/satchel/destination-ollivanders.webp',
  'ui/satchel/destination-malkins': 'assets/art/ui/satchel/destination-malkins.webp',
  'ui/satchel/destination-menagerie': 'assets/art/ui/satchel/destination-menagerie.webp',
});

const AMBIENCE_ALIASES = Object.freeze({
  'ambience/ch1/bedroom': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/leaky': 'assets/audio/music/ch1/violetTheme.mp3',
  'ambience/ch1/diagon': 'assets/audio/music/ch1/diagonAlley.mp3',
  'ambience/ch1/shop': 'assets/audio/music/ch1/violetTheme.mp3',
});

const allKeys = [...new Set(chapter1AssetKeys)];

const chapterAssetEntries = Object.fromEntries(allKeys.map((key) => {
  const chapter = 'ch1';
  if (IMAGE_PATHS[key]) return [key, Object.freeze({ path: IMAGE_PATHS[key], kind: 'image', chapter })];
  if (AMBIENCE_ALIASES[key]) return [key, Object.freeze({ path: AMBIENCE_ALIASES[key], kind: 'music', chapter, volume: 0.38 })];
  if (key.startsWith('voice/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'voice', chapter, volume: 1 })];
  if (key.startsWith('sfx/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'sfx', chapter, volume: 0.8 })];
  if (key.startsWith('music/')) return [key, Object.freeze({ path: `assets/audio/${key}.mp3`, kind: 'music', chapter, volume: 0.55 })];
  throw new Error(`No manifest convention exists for asset key ${key}.`);
}));

const characterAssetEntries = Object.fromEntries(Object.entries(productionCharacterCatalog.assets).map(([key, asset]) => [
  key,
  Object.freeze({ ...asset, chapter: null }),
]));

const uiAssetEntries = Object.fromEntries(Object.entries(UI_IMAGE_PATHS).map(([key, path]) => [
  key,
  Object.freeze({ path, kind: 'image', chapter: null }),
]));

const packagedChapterAssetEntries = Object.fromEntries(
  chapters
    .filter((chapter) => chapter.contractVersion === 2)
    .flatMap((chapter) => Object.entries(chapter.assets).map(([key, entry]) => {
      const { key: _declaredKey, ...assetEntry } = entry;
      return [key, Object.freeze({
        ...assetEntry,
        chapter: chapter.id,
        ...(entry.kind === 'voice' ? { volume: 1 } : {}),
        ...(entry.kind === 'sfx' ? { volume: 0.8 } : {}),
        ...(entry.kind === 'music' ? { volume: 0.55 } : {}),
      })];
    })),
);

export const assetManifest = Object.freeze({
  ...chapterAssetEntries,
  ...packagedChapterAssetEntries,
  ...characterAssetEntries,
  ...uiAssetEntries,
});

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
