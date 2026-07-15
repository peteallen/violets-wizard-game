import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';

export const chapter1Descriptor = defineChapterDescriptor({
  id: 'ch1',
  number: 1,
  title: 'The Letter & Diagon Alley',
  availability: 'playable',
  loaders: {
    content: () => import('./content.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter1Descriptor;
