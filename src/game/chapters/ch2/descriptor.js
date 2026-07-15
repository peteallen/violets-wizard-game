import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';

export const chapter2Descriptor = defineChapterDescriptor({
  id: 'ch2',
  number: 2,
  title: 'Platform 9¾ & The Sorting',
  availability: 'placeholder',
  loaders: {
    content: () => import('./content.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter2Descriptor;
