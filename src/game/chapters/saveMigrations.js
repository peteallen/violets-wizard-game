import { chapter1SaveMetadata } from './ch1/saveMetadata.js';
import { chapter2SaveMetadata } from './ch2/saveMetadata.js';
import { chapter3SaveMetadata } from './ch3/saveMetadata.js';
import { chapter4SaveMetadata } from './ch4/saveMetadata.js';

export const saveMigrationOptions = Object.freeze({
  resumeRedirects: Object.freeze([
    ...chapter2SaveMetadata.resumeRedirects,
    ...chapter3SaveMetadata.resumeRedirects,
  ]),
  completionRedirects: Object.freeze([
    Object.freeze({
      from: chapter2SaveMetadata.endMarker,
      to: chapter3SaveMetadata.startMarker,
    }),
    Object.freeze({
      from: chapter3SaveMetadata.endMarker,
      to: chapter4SaveMetadata.startMarker,
    }),
  ]),
  checkpointRedirects: Object.freeze([
    ...chapter1SaveMetadata.checkpointRedirects,
  ]),
});
