import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';
import { chapter3PresentationMetadata } from './presentationMetadata.js';

export const chapter3Descriptor = defineChapterDescriptor({
  id: 'ch3',
  number: 3,
  title: 'First Classes',
  availability: 'placeholder',
  nextChapterId: 'ch4',
  presentation: chapter3PresentationMetadata,
  loaders: {
    content: () => import('./contentLoader.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter3Descriptor;
