import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';
import { chapter1PresentationMetadata } from './presentationMetadata.js';

export const chapter1Descriptor = defineChapterDescriptor({
  id: 'ch1',
  number: 1,
  title: 'The Letter & Diagon Alley',
  availability: 'playable',
  nextChapterId: 'ch2',
  presentation: chapter1PresentationMetadata,
  loaders: {
    content: () => import('./content.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter1Descriptor;
