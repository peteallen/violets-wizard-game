import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';

export const chapter4Descriptor = defineChapterDescriptor({
  id: 'ch4',
  number: 4,
  title: 'Flying Lesson & the Forbidden Corridor',
  availability: 'placeholder',
  loaders: {
    content: () => import('./content.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter4Descriptor;
