import {
  ChapterAuthoringError,
  assertExactKeys,
  assertString,
  deepFreeze,
} from './chapterAuthoring.js';

const CHAPTER_ID = /^ch[1-9][0-9]*$/;
const AVAILABILITY = new Set(['playable', 'placeholder', 'planned']);
const LOADER_KEYS = Object.freeze(['content', 'presentation', 'harness']);

function assertLoader(value, path, { required = false } = {}) {
  if (value === null && !required) return value;
  if (typeof value !== 'function') {
    throw new ChapterAuthoringError(path, required ? 'must be a loader function' : 'must be a loader function or null');
  }
  return value;
}

export function defineChapterDescriptor(definition) {
  assertExactKeys(
    definition,
    'chapterDescriptor',
    ['id', 'number', 'title', 'availability', 'loaders'],
  );
  assertString(definition.id, 'chapterDescriptor.id', { max: 20 });
  if (!CHAPTER_ID.test(definition.id)) {
    throw new ChapterAuthoringError('chapterDescriptor.id', 'must look like ch12');
  }
  if (!Number.isSafeInteger(definition.number) || definition.number < 1) {
    throw new ChapterAuthoringError('chapterDescriptor.number', 'must be a positive safe integer');
  }
  if (definition.id !== `ch${definition.number}`) {
    throw new ChapterAuthoringError('chapterDescriptor.id', 'must match chapterDescriptor.number');
  }
  assertString(definition.title, 'chapterDescriptor.title', { max: 120 });
  if (!AVAILABILITY.has(definition.availability)) {
    throw new ChapterAuthoringError(
      'chapterDescriptor.availability',
      `must be one of: ${[...AVAILABILITY].join(', ')}`,
    );
  }
  assertExactKeys(definition.loaders, 'chapterDescriptor.loaders', LOADER_KEYS);
  assertLoader(definition.loaders.content, 'chapterDescriptor.loaders.content', { required: true });
  assertLoader(definition.loaders.presentation, 'chapterDescriptor.loaders.presentation');
  assertLoader(definition.loaders.harness, 'chapterDescriptor.loaders.harness');

  return deepFreeze({
    id: definition.id,
    number: definition.number,
    title: definition.title,
    availability: definition.availability,
    loaders: {
      content: definition.loaders.content,
      presentation: definition.loaders.presentation,
      harness: definition.loaders.harness,
    },
  });
}

export function validateChapterLoader(descriptor, kind) {
  if (!LOADER_KEYS.includes(kind)) {
    throw new ChapterAuthoringError('chapter loader kind', `must be one of: ${LOADER_KEYS.join(', ')}`);
  }
  const loader = descriptor?.loaders?.[kind];
  return assertLoader(loader, `chapterDescriptor.loaders.${kind}`, { required: kind === 'content' });
}
