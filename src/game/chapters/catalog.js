import { buildChapterCatalog } from '../content/chapterCatalog.js';
import { chapter1Descriptor } from './ch1/descriptor.js';
import { chapter2Descriptor } from './ch2/descriptor.js';

export const chapterCatalog = buildChapterCatalog([
  chapter1Descriptor,
  chapter2Descriptor,
]);

export const chapterDescriptors = chapterCatalog.descriptors;

export default chapterCatalog;
