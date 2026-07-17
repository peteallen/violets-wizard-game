import { buildChapterCatalog } from '../content/chapterCatalog.js';
import { chapter1Descriptor } from './ch1/descriptor.js';
import { chapter2Descriptor } from './ch2/descriptor.js';
import { chapter3Descriptor } from './ch3/descriptor.js';
import { chapter4Descriptor } from './ch4/descriptor.js';

export const chapterCatalog = buildChapterCatalog([
  chapter1Descriptor,
  chapter2Descriptor,
  chapter3Descriptor,
  chapter4Descriptor,
]);

export const chapterDescriptors = chapterCatalog.descriptors;

export default chapterCatalog;
