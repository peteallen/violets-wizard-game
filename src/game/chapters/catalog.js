import { buildChapterCatalog } from '../content/chapterCatalog.js';
import { chapter1Descriptor } from './ch1/descriptor.js';
import { chapter2Descriptor } from './ch2/descriptor.js';
import { chapter3Descriptor } from './ch3/descriptor.js';
import { chapter4Descriptor } from './ch4/descriptor.js';

export const chapterCatalog = buildChapterCatalog([
  chapter1Descriptor,
  chapter2Descriptor,
  chapter3Descriptor,
  chapter4Descriptor,
]);

export const chapterDescriptors = chapterCatalog.descriptors;

function requireContentPackage(module, descriptor) {
  const chapterPackage = module?.default ?? module;
  if (!chapterPackage || typeof chapterPackage !== 'object' || Array.isArray(chapterPackage)) {
    throw new TypeError(`Chapter ${descriptor.id} content loader must return a package object.`);
  }
  if (chapterPackage.id !== descriptor.id) {
    throw new TypeError(
      `Chapter ${descriptor.id} content loader returned package ${String(chapterPackage.id)}.`,
    );
  }
  if (!chapterPackage.chapter || chapterPackage.chapter.id !== descriptor.id) {
    throw new TypeError(`Chapter ${descriptor.id} content package must contain its chapter.`);
  }
  if (!chapterPackage.maps || typeof chapterPackage.maps !== 'object') {
    throw new TypeError(`Chapter ${descriptor.id} content package must contain maps.`);
  }
  return chapterPackage;
}

function runtimeChapterIds(activeChapterId, preloadChapterIds, catalog) {
  if (!Array.isArray(preloadChapterIds)) {
    throw new TypeError('Chapter runtime preloadChapterIds must be an array.');
  }
  const requested = [activeChapterId, ...preloadChapterIds];
  const ids = [];
  for (const idOrNumber of requested) {
    const descriptor = catalog.getDescriptor(idOrNumber);
    if (!descriptor) throw new TypeError(`Unknown chapter ${String(idOrNumber)}.`);
    if (!ids.includes(descriptor.id)) ids.push(descriptor.id);
  }
  return ids;
}

function runtimeChapterMap(chapter, maps, sceneId = null) {
  const sceneMapId = sceneId ? chapter.scenes?.[sceneId]?.mapId : null;
  if (sceneMapId) return maps?.[sceneMapId] ?? null;
  if (chapter.contractVersion !== 1) return null;
  const candidates = Object.values(maps ?? {});
  return candidates.length === 1 ? candidates[0] : null;
}

function packageAssetDefinitions(chapterPackage) {
  const definitions = chapterPackage.assets ?? chapterPackage.chapter.assets ?? {};
  const entries = Array.isArray(definitions) ? definitions : Object.values(definitions);
  return Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
}

function frozenRecordSubset(source, ids) {
  return Object.freeze(Object.fromEntries(
    ids
      .filter((chapterId) => source[chapterId] !== undefined)
      .map((chapterId) => [chapterId, source[chapterId]]),
  ));
}

/**
 * Owns the asynchronous chapter-package boundary while preserving one stable
 * synchronous dictionary for World. Loading a later package mutates that
 * dictionary in place, so an existing World can cross chapter boundaries
 * without being reconstructed.
 */
export class ChapterRuntimeRegistry {
  #catalog;

  #loadedPackages = new Map();

  #loadingPackages = new Map();

  constructor({ catalog = chapterCatalog } = {}) {
    if (!catalog || typeof catalog.getDescriptor !== 'function' || typeof catalog.load !== 'function') {
      throw new TypeError('Chapter runtime loading requires a chapter catalog.');
    }
    for (const descriptor of catalog.descriptors ?? []) {
      if (descriptor.nextChapterId && !catalog.getDescriptor(descriptor.nextChapterId)) {
        throw new TypeError(
          `Chapter ${descriptor.id} points to unknown next chapter ${descriptor.nextChapterId}.`,
        );
      }
    }
    this.#catalog = catalog;
    this.descriptors = catalog.descriptors ?? Object.freeze([]);
    this.chapters = {};
    this.contentRegistry = this.chapters;
    this.packages = {};
    this.chapterMaps = {};
    this.resumeRecaps = {};
    this.chapterAssetKeys = {};
    this.chapterAssets = {};
    Object.freeze(this);
  }

  get loadedChapterIds() {
    return Object.freeze(
      this.descriptors
        .map(({ id }) => id)
        .filter((chapterId) => this.#loadedPackages.has(chapterId)),
    );
  }

  getDescriptor(idOrNumber) {
    return this.#catalog.getDescriptor(idOrNumber);
  }

  getChapter(idOrNumber) {
    const descriptor = this.getDescriptor(idOrNumber);
    return descriptor ? this.chapters[descriptor.id] ?? null : null;
  }

  getPackage(idOrNumber) {
    const descriptor = this.getDescriptor(idOrNumber);
    return descriptor ? this.#loadedPackages.get(descriptor.id) ?? null : null;
  }

  getChapterMap(idOrNumber, sceneId = null) {
    const descriptor = this.getDescriptor(idOrNumber);
    const chapter = descriptor ? this.chapters[descriptor.id] : null;
    return chapter
      ? runtimeChapterMap(chapter, this.chapterMaps[descriptor.id], sceneId)
      : null;
  }

  async prepare(
    activeChapterId,
    {
      preloadChapterIds = [],
      includeNext = true,
    } = {},
  ) {
    const descriptor = this.getDescriptor(activeChapterId);
    if (!descriptor) throw new TypeError(`Unknown chapter ${String(activeChapterId)}.`);
    const nextChapterIds = includeNext && descriptor.nextChapterId
      ? [descriptor.nextChapterId]
      : [];
    const chapterIds = runtimeChapterIds(
      descriptor.id,
      [...nextChapterIds, ...preloadChapterIds],
      this.#catalog,
    );
    const packages = await Promise.all(chapterIds.map((chapterId) => this.#load(chapterId)));
    return Object.freeze({
      activeChapterId: descriptor.id,
      chapterIds: Object.freeze([...chapterIds]),
      packages: Object.freeze([...packages]),
    });
  }

  #load(chapterId) {
    const loaded = this.#loadedPackages.get(chapterId);
    if (loaded) return Promise.resolve(loaded);
    const loading = this.#loadingPackages.get(chapterId);
    if (loading) return loading;
    const descriptor = this.getDescriptor(chapterId);
    const promise = Promise.resolve()
      .then(() => this.#catalog.load(chapterId, 'content'))
      .then((module) => requireContentPackage(module, descriptor))
      .then((chapterPackage) => {
        this.#loadedPackages.set(chapterId, chapterPackage);
        this.packages[chapterId] = chapterPackage;
        this.chapters[chapterId] = chapterPackage.chapter;
        this.chapterMaps[chapterId] = chapterPackage.maps;
        this.resumeRecaps[chapterId] = chapterPackage.resumeRecaps
          ?? chapterPackage.chapter.recaps
          ?? Object.freeze([]);
        this.chapterAssetKeys[chapterId] = chapterPackage.assetKeys
          ?? Object.freeze(Object.keys(chapterPackage.chapter.assets ?? {}));
        this.chapterAssets[chapterId] = packageAssetDefinitions(chapterPackage);
        return chapterPackage;
      })
      .finally(() => {
        this.#loadingPackages.delete(chapterId);
      });
    this.#loadingPackages.set(chapterId, promise);
    return promise;
  }
}

export function createChapterRuntimeRegistry(options) {
  return new ChapterRuntimeRegistry(options);
}

export function loadChapterPackage(idOrNumber, kind = 'content') {
  return chapterCatalog.load(idOrNumber, kind);
}

/**
 * Loads only the resumed chapter and any explicitly prepared transition targets.
 * The returned chapter dictionary is synchronous, so World can consume it
 * without learning about module loading.
 */
export async function loadChapterRuntimeRegistry(
  activeChapterId,
  {
    preloadChapterIds = [],
    catalog = chapterCatalog,
  } = {},
) {
  const runtime = new ChapterRuntimeRegistry({ catalog });
  const prepared = await runtime.prepare(activeChapterId, {
    preloadChapterIds,
    includeNext: false,
  });
  const { chapterIds } = prepared;
  const packages = frozenRecordSubset(runtime.packages, chapterIds);
  const chapters = frozenRecordSubset(runtime.chapters, chapterIds);
  const chapterMaps = frozenRecordSubset(runtime.chapterMaps, chapterIds);
  const resumeRecaps = frozenRecordSubset(runtime.resumeRecaps, chapterIds);
  const chapterAssetKeys = frozenRecordSubset(runtime.chapterAssetKeys, chapterIds);
  const chapterAssets = frozenRecordSubset(runtime.chapterAssets, chapterIds);

  return Object.freeze({
    activeChapterId: chapterIds[0],
    chapterIds: Object.freeze([...chapterIds]),
    packages,
    chapters,
    contentRegistry: chapters,
    chapterMaps,
    resumeRecaps,
    chapterAssetKeys,
    chapterAssets,
    getChapter(idOrNumber) {
      const descriptor = catalog.getDescriptor(idOrNumber);
      return descriptor ? chapters[descriptor.id] ?? null : null;
    },
    getChapterMap(idOrNumber, sceneId = null) {
      const descriptor = catalog.getDescriptor(idOrNumber);
      const chapter = descriptor ? chapters[descriptor.id] : null;
      return chapter
        ? runtimeChapterMap(chapter, chapterMaps[descriptor.id], sceneId)
        : null;
    },
  });
}

export default chapterCatalog;
