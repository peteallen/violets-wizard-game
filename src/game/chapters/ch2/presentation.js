import {
  CHAPTER_PREVIEW_ACTIONS,
  ChapterPreviewRenderer,
  chapterPreviewActionAt,
  chapterPreviewLayout,
} from '../../render/ChapterPreviewRenderer.js';

export const chapter2PreviewPresentation = Object.freeze({
  id: 'ch2.preview',
  kind: 'overlay',
  createRenderer: () => new ChapterPreviewRenderer(),
  layout: chapterPreviewLayout,
  semanticTargetAt: chapterPreviewActionAt,
  semanticTargets: CHAPTER_PREVIEW_ACTIONS,
});

export const chapter2PresentationPackage = Object.freeze({
  chapterId: 'ch2',
  registrations: Object.freeze([chapter2PreviewPresentation]),
});

export default chapter2PresentationPackage;
