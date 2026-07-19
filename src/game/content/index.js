import { cards, cardsById } from './cards.js';
import { validateMap } from '../contracts.js';
import {
  chapter1,
  chapter1AssetKeys,
  chapter1Map,
  chapter1ResumeRecaps,
} from './chapters/ch1.js';
import { chapter2, chapter2AssetKeys } from './chapters/ch2.js';
import { chapter3 } from './chapters/ch3.js';
import { chapter4 } from './chapters/ch4.js';
import {
  chapterCatalog,
  chapterDescriptors,
  loadChapterRuntimeRegistry,
} from '../chapters/catalog.js';

export const chapterMaps = Object.freeze({
  ch1: Object.freeze({ [chapter1Map.id]: chapter1Map }),
  ch2: chapter2.maps,
  ch3: chapter3.maps,
  ch4: chapter4.maps,
});

export const contentRegistry = Object.freeze({
  ch1: chapter1,
  ch2: chapter2,
  ch3: chapter3,
  ch4: chapter4,
});

export const chapters = Object.freeze(Object.values(contentRegistry));

export const chapterAvailability = Object.freeze(Object.fromEntries(
  chapterDescriptors.map((descriptor) => [descriptor.id, descriptor.availability]),
));
export const chapterAssetKeys = Object.freeze({
  ch1: chapter1AssetKeys,
  ch2: chapter2AssetKeys,
  ch3: Object.freeze(Object.keys(chapter3.assets)),
  ch4: Object.freeze(Object.keys(chapter4.assets)),
});
export const maps = Object.freeze({ [chapter1Map.id]: validateMap(chapter1Map) });
export const resumeRecaps = Object.freeze({
  ch1: chapter1ResumeRecaps,
  ch2: chapter2.recaps,
  ch3: chapter3.recaps,
  ch4: chapter4.recaps,
});

export const content = Object.freeze({
  chapters: contentRegistry,
  cards: cardsById,
  maps,
  resumeRecaps,
  chapterAvailability,
  chapterAssetKeys,
});

export function getChapter(idOrNumber) {
  if (typeof idOrNumber === 'number') return chapters.find((chapter) => chapter.number === idOrNumber) ?? null;
  return contentRegistry[idOrNumber] ?? null;
}

export function isChapterPlayable(idOrNumber) {
  return chapterCatalog.getDescriptor(idOrNumber)?.availability === 'playable';
}

export function loadChapterPackage(idOrNumber, kind = 'content') {
  return chapterCatalog.load(idOrNumber, kind);
}

export function getMap(id) {
  return maps[id] ?? null;
}

export function resolveOwnedChapterMap(chapter, ownedMaps, sceneId = null) {
  if (!chapter) return null;
  const sceneMapId = sceneId ? chapter.scenes?.[sceneId]?.mapId : null;
  if (sceneMapId) return ownedMaps?.[sceneMapId] ?? null;
  if (chapter.contractVersion !== 1) return null;
  const candidates = Object.values(ownedMaps ?? {});
  return candidates.length === 1 ? candidates[0] : null;
}

export function getChapterMap(idOrNumber, sceneId = null) {
  const chapter = getChapter(idOrNumber);
  if (!chapter) return null;
  return resolveOwnedChapterMap(chapter, chapterMaps[chapter.id], sceneId);
}

export { cards, cardsById };
export { chapterCatalog, chapterDescriptors, loadChapterRuntimeRegistry };
