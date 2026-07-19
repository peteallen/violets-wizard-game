export const chapter1ChapterCardMarker = Object.freeze({
  chapter: 'ch1',
  scene: 'ch1.chapterCard',
  room: 'ch1.chapterCardRoom',
  spawn: 'start',
});

export const chapter1CheckpointRedirects = Object.freeze([
  Object.freeze({
    when: Object.freeze({
      chapter: 'ch1',
      allFlags: Object.freeze(['ch1.ticketReceived']),
      noFlags: Object.freeze(['ch1.complete']),
    }),
    to: chapter1ChapterCardMarker,
  }),
]);

export const chapter1SaveMetadata = Object.freeze({
  checkpointRedirects: chapter1CheckpointRedirects,
});

export default chapter1SaveMetadata;
