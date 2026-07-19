import { defineChapterDescriptor } from '../../content/chapterDescriptor.js';
import { chapter2PresentationMetadata } from './presentationMetadata.js';

export const chapter2Descriptor = defineChapterDescriptor({
  id: 'ch2',
  number: 2,
  title: 'Platform 9¾ & The Sorting',
  availability: 'playable',
  nextChapterId: 'ch3',
  presentation: chapter2PresentationMetadata,
  loaders: {
    content: () => import('./content.js'),
    presentation: () => import('./presentation.js'),
    harness: () => import('./harness.js'),
  },
});

export default chapter2Descriptor;
