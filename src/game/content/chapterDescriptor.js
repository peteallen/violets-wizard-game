import {
  ChapterAuthoringError,
  assertExactKeys,
  assertPlainObject,
  assertString,
  clonePureData,
  deepFreeze,
} from './chapterAuthoring.js';

const CHAPTER_ID = /^ch[1-9][0-9]*$/;
const AVAILABILITY = new Set(['playable', 'placeholder', 'planned']);
const LOADER_KEYS = Object.freeze(['content', 'presentation', 'harness']);

function assertOptionalAssetKey(value, path) {
  if (value === null) return value;
  return assertString(value, path, { max: 200 });
}

function normalizePresentationMetadata(value) {
  if (value === undefined) return null;
  assertExactKeys(
    value,
    'chapterDescriptor.presentation',
    [],
    ['roomMusic', 'mapVignetteAssets'],
  );
  if (value.roomMusic !== undefined) {
    assertExactKeys(
      value.roomMusic,
      'chapterDescriptor.presentation.roomMusic',
      ['default', 'rooms'],
    );
    assertOptionalAssetKey(
      value.roomMusic.default,
      'chapterDescriptor.presentation.roomMusic.default',
    );
    assertPlainObject(
      value.roomMusic.rooms,
      'chapterDescriptor.presentation.roomMusic.rooms',
    );
    for (const [roomId, assetKey] of Object.entries(value.roomMusic.rooms)) {
      assertString(roomId, `chapterDescriptor.presentation.roomMusic.rooms.${roomId} key`, {
        max: 160,
      });
      assertString(
        assetKey,
        `chapterDescriptor.presentation.roomMusic.rooms.${roomId}`,
        { max: 200 },
      );
    }
  }
  if (value.mapVignetteAssets !== undefined) {
    assertPlainObject(
      value.mapVignetteAssets,
      'chapterDescriptor.presentation.mapVignetteAssets',
    );
    for (const [locationId, assetKey] of Object.entries(value.mapVignetteAssets)) {
      assertString(
        locationId,
        `chapterDescriptor.presentation.mapVignetteAssets.${locationId} key`,
        { max: 200 },
      );
      assertString(
        assetKey,
        `chapterDescriptor.presentation.mapVignetteAssets.${locationId}`,
        { max: 200 },
      );
    }
  }
  return clonePureData(value, 'chapterDescriptor.presentation');
}

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
    ['nextChapterId', 'presentation'],
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

  const nextChapterId = definition.nextChapterId ?? null;
  if (nextChapterId !== null) {
    assertString(nextChapterId, 'chapterDescriptor.nextChapterId', { max: 20 });
    if (!CHAPTER_ID.test(nextChapterId)) {
      throw new ChapterAuthoringError('chapterDescriptor.nextChapterId', 'must look like ch12 or be null');
    }
    if (nextChapterId === definition.id) {
      throw new ChapterAuthoringError('chapterDescriptor.nextChapterId', 'must identify a different chapter');
    }
  }

  const presentation = normalizePresentationMetadata(definition.presentation);

  return deepFreeze({
    id: definition.id,
    number: definition.number,
    title: definition.title,
    availability: definition.availability,
    nextChapterId,
    loaders: {
      content: definition.loaders.content,
      presentation: definition.loaders.presentation,
      harness: definition.loaders.harness,
    },
    ...(presentation ? { presentation } : {}),
  });
}

export function validateChapterLoader(descriptor, kind) {
  if (!LOADER_KEYS.includes(kind)) {
    throw new ChapterAuthoringError('chapter loader kind', `must be one of: ${LOADER_KEYS.join(', ')}`);
  }
  const loader = descriptor?.loaders?.[kind];
  return assertLoader(loader, `chapterDescriptor.loaders.${kind}`, { required: kind === 'content' });
}
