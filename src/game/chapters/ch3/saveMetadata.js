export const chapter3StartMarker = Object.freeze({
  chapter: 'ch3',
  scene: 'ch3.scene.spellbookParcel',
  room: 'ch3.commonRoom',
  spawn: 'parcel',
});

export const chapter3EndMarker = Object.freeze({
  chapter: 'ch3',
  scene: 'ch3.scene.chapterClose',
  room: 'ch3.commonRoom',
});

export const chapter3ResumeRedirects = Object.freeze([
  Object.freeze({
    from: Object.freeze({
      chapter: 'ch3',
      scene: 'ch3.scene.preview',
      room: 'ch3.previewRoom',
    }),
    to: chapter3StartMarker,
  }),
]);

export const chapter3SaveMetadata = Object.freeze({
  startMarker: chapter3StartMarker,
  endMarker: chapter3EndMarker,
  resumeRedirects: chapter3ResumeRedirects,
});

export default chapter3SaveMetadata;
