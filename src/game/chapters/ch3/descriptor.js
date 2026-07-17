import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';

export const chapter3Descriptor = defineChapterDescriptor({
  id: 'ch3',
  number: 3,
  title: 'First Classes',
  availability: 'placeholder',
  loaders: {
    content: () => import('./content.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter3Descriptor;
