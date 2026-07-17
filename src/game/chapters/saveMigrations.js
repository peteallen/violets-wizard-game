import {
  chapter2EndMarker,
  chapter2ResumeRedirects,
} from './ch2/content-v2/index.js';
import {
  chapter3,
  chapter3EndMarker,
  chapter3ResumeRedirects,
} from './ch3/content.js';
import { chapter4 } from './ch4/content.js';

const chapter3StartMarker = Object.freeze({
  chapter: chapter3.id,
  scene: chapter3.start.scene,
  room: chapter3.start.room,
  spawn: chapter3.start.spawn,
});

const chapter4StartMarker = Object.freeze({
  chapter: chapter4.id,
  scene: chapter4.start.scene,
  room: chapter4.start.room,
  spawn: chapter4.start.spawn,
});

const chapter1ChapterCardMarker = Object.freeze({
  chapter: 'ch1',
  scene: 'ch1.chapterCard',
  room: 'ch1.chapterCardRoom',
  spawn: 'start',
});

export const saveMigrationOptions = Object.freeze({
  resumeRedirects: Object.freeze([
    ...chapter2ResumeRedirects,
    ...chapter3ResumeRedirects,
  ]),
  completionRedirects: Object.freeze([
    Object.freeze({
      from: chapter2EndMarker,
      to: chapter3StartMarker,
    }),
    Object.freeze({
      from: chapter3EndMarker,
      to: chapter4StartMarker,
    }),
  ]),
  checkpointRedirects: Object.freeze([
    Object.freeze({
      when: Object.freeze({
        chapter: 'ch1',
        allFlags: Object.freeze(['ch1.ticketReceived']),
        noFlags: Object.freeze(['ch1.complete']),
      }),
      to: chapter1ChapterCardMarker,
    }),
  ]),
});
