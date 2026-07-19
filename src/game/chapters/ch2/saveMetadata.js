export const chapter2StartMarker = Object.freeze({
  chapter: 'ch2',
  scene: 'ch2.scene.kingsCross',
  room: 'ch2.kingsCross',
  spawn: 'start',
});

export const chapter2EndMarker = Object.freeze({
  chapter: 'ch2',
  scene: 'ch2.scene.chapterCard',
  room: 'ch2.chapterCardRoom',
});

export const chapter2ResumeRedirects = Object.freeze([
  Object.freeze({
    from: Object.freeze({
      chapter: 'ch2',
      scene: 'ch2.placeholder',
      room: 'ch2.previewRoom',
    }),
    to: chapter2StartMarker,
  }),
]);

export const chapter2SaveMetadata = Object.freeze({
  startMarker: chapter2StartMarker,
  endMarker: chapter2EndMarker,
  resumeRedirects: chapter2ResumeRedirects,
});

export default chapter2SaveMetadata;
