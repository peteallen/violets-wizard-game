import {
  chapter2EndMarker,
  chapter2ResumeRedirects,
} from './ch2/content-v2/index.js';
import { chapter3 } from './ch3/content.js';

const chapter3StartMarker = Object.freeze({
  chapter: chapter3.id,
  scene: chapter3.start.scene,
  room: chapter3.start.room,
  spawn: chapter3.start.spawn,
});

const chapter1ChapterCardMarker = Object.freeze({
  chapter: 'ch1',
  scene: 'ch1.chapterCard',
  room: 'ch1.chapterCardRoom',
  spawn: 'start',
});

export const saveMigrationOptions = Object.freeze({
  resumeRedirects: chapter2ResumeRedirects,
  completionRedirects: Object.freeze([
    Object.freeze({
      from: chapter2EndMarker,
      to: chapter3StartMarker,
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
