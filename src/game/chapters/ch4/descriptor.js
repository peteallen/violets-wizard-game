import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';
import { chapter4PresentationMetadata } from './presentationMetadata.js';

export const chapter4Descriptor = defineChapterDescriptor({
  id: 'ch4',
  number: 4,
  title: 'Flying Lesson & the Forbidden Corridor',
  availability: 'placeholder',
  nextChapterId: null,
  presentation: chapter4PresentationMetadata,
  loaders: {
    content: () => import('./contentLoader.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter4Descriptor;
