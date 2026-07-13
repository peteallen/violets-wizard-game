import { cards, cardsById } from './cards.js';
import { validateMap } from '../contracts.js';
import {
  chapter1,
  chapter1AssetKeys,
  chapter1Map,
  chapter1ResumeRecaps,
} from './chapters/ch1.js';
import { chapter2, chapter2AssetKeys, chapter2Status } from './chapters/ch2.js';

export const contentRegistry = Object.freeze({
  ch1: chapter1,
  ch2: chapter2,
});

export const chapters = Object.freeze(Object.values(contentRegistry));

export const chapterAvailability = Object.freeze({ ch1: 'playable', ch2: chapter2Status });
export const chapterAssetKeys = Object.freeze({ ch1: chapter1AssetKeys, ch2: chapter2AssetKeys });
export const maps = Object.freeze({ [chapter1Map.id]: validateMap(chapter1Map) });
export const resumeRecaps = Object.freeze({ ch1: chapter1ResumeRecaps });

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
  const chapter = getChapter(idOrNumber);
  return chapter ? chapterAvailability[chapter.id] === 'playable' : false;
}

export function getMap(id) {
  return maps[id] ?? null;
}

export { cards, cardsById };
