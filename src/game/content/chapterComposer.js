import {
  ChapterAuthoringError,
  assertChapterOwnedId,
  assertExactKeys,
  assertNamespacedId,
  assertPlainObject,
  assertString,
  defineRoom,
  defineScene,
  freezePureData,
} from './chapterAuthoring.js';

const CHAPTER_ID = /^ch[1-9][0-9]*$/;
const CONTENT_COLLECTIONS = Object.freeze([
  'rooms',
  'scenes',
  'npcs',
  'dialogues',
  'quests',
  'learningBeats',
  'setPieces',
  'encounters',
  'minigames',
]);
const PACKAGE_COLLECTIONS = Object.freeze([
  'maps',
  'recaps',
  'assets',
  'characterDependencies',
]);
const FRAGMENT_KEYS = Object.freeze([...CONTENT_COLLECTIONS, ...PACKAGE_COLLECTIONS]);

export class ChapterCompositionError extends ChapterAuthoringError {
  constructor(path, message) {
    super(path, message);
    this.name = 'ChapterCompositionError';
  }
}

function assertArray(value, path) {
  if (!Array.isArray(value)) throw new ChapterCompositionError(path, 'must be an array');
  return value;
}

function entries(value, path) {
  if (value === undefined) return [];
  return assertArray(value, path);
}

function registerId(seen, id, path, chapterId) {
  assertChapterOwnedId(id, chapterId, `${path}.id`);
  const previous = seen.get(id);
  if (previous) {
    throw new ChapterCompositionError(`${path}.id`, `duplicates ${id}, first declared at ${previous}`);
  }
  seen.set(id, path);
}

function normalizeEntry(value, path, chapterId, seen, kind) {
  assertPlainObject(value, path);
  registerId(seen, value.id, path, chapterId);
  if (kind === 'rooms') return defineRoom(value);
  if (kind === 'scenes') return defineScene(value);
  return freezePureData(value, path);
}

function normalizeMap(value, path, chapterId, seen) {
  assertPlainObject(value, path);
  registerId(seen, value.id, path, chapterId);
  for (const [collection, collectionEntries] of [
    ['locations', value.locations],
    ['routes', value.routes],
  ]) {
    if (collectionEntries === undefined) continue;
    assertArray(collectionEntries, `${path}.${collection}`);
    collectionEntries.forEach((entry, index) => {
      const entryPath = `${path}.${collection}[${index}]`;
      assertPlainObject(entry, entryPath);
      registerId(seen, entry.id, entryPath, chapterId);
    });
  }
  return freezePureData(value, path);
}

function normalizeRecap(value, path, chapterId, seen) {
  assertPlainObject(value, path);
  registerId(seen, value.id, path, chapterId);
  return freezePureData(value, path);
}

function normalizeAsset(value, path) {
  assertPlainObject(value, path);
  assertString(value.key, `${path}.key`, { max: 240 });
  return freezePureData(value, path);
}

function emptyCollections() {
  return Object.fromEntries(CONTENT_COLLECTIONS.map((key) => [key, []]));
}

function normalizeDefinition(definition) {
  assertExactKeys(
    definition,
    'chapter',
    [
      'contractVersion', 'id', 'number', 'title', 'season', 'start',
      'chapterCard', 'yearbookMoments', 'fragments',
    ],
    PACKAGE_COLLECTIONS,
  );
  if (!Number.isSafeInteger(definition.contractVersion) || definition.contractVersion < 1) {
    throw new ChapterCompositionError('chapter.contractVersion', 'must be a positive safe integer');
  }
  assertString(definition.id, 'chapter.id', { max: 20 });
  if (!CHAPTER_ID.test(definition.id)) throw new ChapterCompositionError('chapter.id', 'must look like ch12');
  if (!Number.isSafeInteger(definition.number) || definition.number < 1) {
    throw new ChapterCompositionError('chapter.number', 'must be a positive safe integer');
  }
  if (definition.id !== `ch${definition.number}`) {
    throw new ChapterCompositionError('chapter.id', 'must match chapter.number');
  }
  assertString(definition.title, 'chapter.title', { max: 120 });
  assertString(definition.season, 'chapter.season', { max: 80 });
  assertExactKeys(definition.start, 'chapter.start', ['scene', 'room', 'spawn']);
  assertChapterOwnedId(definition.start.scene, definition.id, 'chapter.start.scene');
  assertChapterOwnedId(definition.start.room, definition.id, 'chapter.start.room');
  assertString(definition.start.spawn, 'chapter.start.spawn', { max: 100 });
  assertPlainObject(definition.chapterCard, 'chapter.chapterCard');
  assertArray(definition.yearbookMoments, 'chapter.yearbookMoments');
  definition.yearbookMoments.forEach((id, index) => {
    assertChapterOwnedId(id, definition.id, `chapter.yearbookMoments[${index}]`);
  });
  assertArray(definition.fragments, 'chapter.fragments');
  for (let index = 0; index < definition.fragments.length; index += 1) {
    assertExactKeys(definition.fragments[index], `chapter.fragments[${index}]`, [], FRAGMENT_KEYS);
  }
  for (const key of PACKAGE_COLLECTIONS) {
    if (definition[key] !== undefined) assertArray(definition[key], `chapter.${key}`);
  }
  return definition;
}

export function composeChapter(definition) {
  normalizeDefinition(definition);
  const chapterId = definition.id;
  const seenIds = new Map();
  const collected = emptyCollections();
  const maps = [];
  const recaps = [];
  const assets = [];
  const characterDependencies = [];

  const contributions = [
    {
      maps: definition.maps,
      recaps: definition.recaps,
      assets: definition.assets,
      characterDependencies: definition.characterDependencies,
    },
    ...definition.fragments,
  ];

  contributions.forEach((fragment, fragmentIndex) => {
    const prefix = fragmentIndex === 0 ? 'chapter' : `chapter.fragments[${fragmentIndex - 1}]`;
    for (const collection of CONTENT_COLLECTIONS) {
      entries(fragment[collection], `${prefix}.${collection}`).forEach((entry, index) => {
        collected[collection].push(normalizeEntry(
          entry,
          `${prefix}.${collection}[${index}]`,
          chapterId,
          seenIds,
          collection,
        ));
      });
    }
    entries(fragment.maps, `${prefix}.maps`).forEach((map, index) => {
      maps.push(normalizeMap(map, `${prefix}.maps[${index}]`, chapterId, seenIds));
    });
    entries(fragment.recaps, `${prefix}.recaps`).forEach((recap, index) => {
      recaps.push(normalizeRecap(recap, `${prefix}.recaps[${index}]`, chapterId, seenIds));
    });
    entries(fragment.assets, `${prefix}.assets`).forEach((asset, index) => {
      assets.push(normalizeAsset(asset, `${prefix}.assets[${index}]`));
    });
    entries(fragment.characterDependencies, `${prefix}.characterDependencies`).forEach((id, index) => {
      assertNamespacedId(id, `${prefix}.characterDependencies[${index}]`);
      characterDependencies.push(id);
    });
  });

  const assetKeys = new Map();
  assets.forEach((asset, index) => {
    if (assetKeys.has(asset.key)) {
      throw new ChapterCompositionError(
        `chapter assets[${index}].key`,
        `duplicates ${asset.key}, first declared at ${assetKeys.get(asset.key)}`,
      );
    }
    assetKeys.set(asset.key, `chapter assets[${index}]`);
  });

  const dependencyIds = new Set();
  characterDependencies.forEach((id, index) => {
    if (dependencyIds.has(id)) {
      throw new ChapterCompositionError(`chapter characterDependencies[${index}]`, `duplicates ${id}`);
    }
    dependencyIds.add(id);
  });

  const sceneOrders = new Map();
  collected.scenes.forEach((scene) => {
    const previous = sceneOrders.get(scene.order);
    if (previous) {
      throw new ChapterCompositionError(
        `chapter.scenes.${scene.id}.order`,
        `duplicates explicit scene order ${scene.order} used by ${previous}`,
      );
    }
    sceneOrders.set(scene.order, scene.id);
  });
  collected.scenes.sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

  const idMap = (collection) => Object.fromEntries(collection.map((entry) => [entry.id, entry]));
  return freezePureData({
    contractVersion: definition.contractVersion,
    id: chapterId,
    number: definition.number,
    title: definition.title,
    season: definition.season,
    start: definition.start,
    sceneOrder: collected.scenes.map((scene) => scene.id),
    scenes: idMap(collected.scenes),
    rooms: idMap(collected.rooms),
    npcs: idMap(collected.npcs),
    dialogues: idMap(collected.dialogues),
    quests: idMap(collected.quests),
    learningBeats: idMap(collected.learningBeats),
    setPieces: idMap(collected.setPieces),
    encounters: idMap(collected.encounters),
    minigames: idMap(collected.minigames),
    chapterCard: definition.chapterCard,
    yearbookMoments: definition.yearbookMoments,
    maps: idMap(maps),
    recaps,
    assets: Object.fromEntries(assets.map((asset) => [asset.key, asset])),
    characterDependencies,
  }, `chapter ${chapterId}`);
}

export function defineChapter(definition) {
  return composeChapter(definition);
}
