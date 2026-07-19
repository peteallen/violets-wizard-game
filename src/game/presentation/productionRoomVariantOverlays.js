import {
  chapterCatalog,
  chapterDescriptors as productionChapterDescriptors,
} from '../chapters/catalog.js';
import { createProductionPresentationRegistry } from './ProductionPresentationRegistry.js';

function chapterIdFromRoom(roomId) {
  const match = /^(ch[1-9][0-9]*)\./u.exec(roomId ?? '');
  return match?.[1] ?? null;
}

function chapterIdFromRequest(request = {}) {
  return request.chapterId
    ?? request.state?.chapterId
    ?? chapterIdFromRoom(request.roomId);
}

function metadataPackage(descriptor) {
  return Object.freeze({
    chapterId: descriptor.id,
    ...(descriptor.presentation ?? {}),
    registrations: Object.freeze([]),
    roomVariantOverlays: Object.freeze([]),
  });
}

function loadedPresentationPackage(module, descriptor) {
  const loaded = module?.default ?? module;
  if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)) {
    throw new TypeError(`Chapter ${descriptor.id} presentation loader must return a package object.`);
  }
  if (loaded.chapterId !== descriptor.id) {
    throw new TypeError(
      `Chapter ${descriptor.id} presentation loader returned package ${String(loaded.chapterId)}.`,
    );
  }
  return Object.freeze({
    ...(descriptor.presentation ?? {}),
    ...loaded,
  });
}

/**
 * Keeps the renderer-facing presentation API synchronous while chapter-owned
 * drawing code arrives asynchronously. Lightweight descriptor metadata makes
 * room music available immediately; drawings begin on the first frame after
 * their owning package finishes loading.
 */
export class LazyProductionPresentationRegistry {
  #descriptorById;

  #descriptorByNumber;

  #loadChapterPackage;

  #logger;

  #packageByChapter;

  #loadedChapterIds = new Set();

  #loadingByChapter = new Map();

  #requestErrors = new Map();

  #registry;

  constructor({
    chapterDescriptors = [],
    loadChapterPackage,
    logger = globalThis.console,
  } = {}) {
    if (!Array.isArray(chapterDescriptors)) {
      throw new TypeError('Production presentation chapterDescriptors must be an array.');
    }
    if (typeof loadChapterPackage !== 'function') {
      throw new TypeError('Production presentation loading requires loadChapterPackage().');
    }
    this.#descriptorById = new Map();
    this.#descriptorByNumber = new Map();
    this.#loadChapterPackage = loadChapterPackage;
    this.#logger = logger;
    this.#packageByChapter = new Map();
    for (const descriptor of chapterDescriptors) {
      if (!descriptor || typeof descriptor.id !== 'string') {
        throw new TypeError('Production presentation descriptors require an id.');
      }
      if (this.#descriptorById.has(descriptor.id)) {
        throw new TypeError(`Duplicate production presentation descriptor ${descriptor.id}.`);
      }
      this.#descriptorById.set(descriptor.id, descriptor);
      this.#descriptorByNumber.set(descriptor.number, descriptor);
      this.#packageByChapter.set(descriptor.id, metadataPackage(descriptor));
    }
    this.#rebuild();
  }

  get packages() {
    return this.#registry.packages;
  }

  get loadedChapterIds() {
    return Object.freeze([...this.#loadedChapterIds]);
  }

  get loadingChapterIds() {
    return Object.freeze([...this.#loadingByChapter.keys()]);
  }

  getDescriptor(idOrNumber) {
    return typeof idOrNumber === 'number'
      ? this.#descriptorByNumber.get(idOrNumber) ?? null
      : this.#descriptorById.get(idOrNumber) ?? null;
  }

  isChapterLoaded(idOrNumber) {
    const descriptor = this.getDescriptor(idOrNumber);
    return Boolean(descriptor && this.#loadedChapterIds.has(descriptor.id));
  }

  async activateChapter(idOrNumber) {
    const descriptor = this.getDescriptor(idOrNumber);
    if (!descriptor) throw new TypeError(`Unknown presentation chapter ${String(idOrNumber)}.`);
    if (typeof descriptor.loaders?.presentation !== 'function') return null;
    if (this.#loadedChapterIds.has(descriptor.id)) {
      return this.#packageByChapter.get(descriptor.id);
    }
    const loading = this.#loadingByChapter.get(descriptor.id);
    if (loading) return loading;
    this.#requestErrors.delete(descriptor.id);
    const promise = Promise.resolve()
      .then(() => this.#loadChapterPackage(descriptor.id, 'presentation'))
      .then((module) => {
        const presentationPackage = loadedPresentationPackage(module, descriptor);
        this.#packageByChapter.set(descriptor.id, presentationPackage);
        this.#loadedChapterIds.add(descriptor.id);
        this.#rebuild();
        return presentationPackage;
      })
      .finally(() => {
        this.#loadingByChapter.delete(descriptor.id);
      });
    this.#loadingByChapter.set(descriptor.id, promise);
    return promise;
  }

  async activateChapters(ids) {
    if (!Array.isArray(ids)) throw new TypeError('Presentation chapter IDs must be an array.');
    return Promise.all([...new Set(ids)].map((id) => this.activateChapter(id)));
  }

  resolveRoomMusic(request = {}) {
    this.#requestChapter(chapterIdFromRequest(request));
    return this.#registry.resolveRoomMusic(request);
  }

  drawRoomVariantOverlay(context, request = {}) {
    this.#requestChapter(chapterIdFromRequest(request));
    return this.#registry.drawRoomVariantOverlay(context, request);
  }

  drawRoomVariantBackground(context, request = {}, drawBackground) {
    this.#requestChapter(chapterIdFromRequest(request));
    return this.#registry.drawRoomVariantBackground(context, request, drawBackground);
  }

  drawWorldEffects(context, request = {}) {
    this.#requestChapter(chapterIdFromRequest(request));
    return this.#registry.drawWorldEffects(context, request);
  }

  drawSetPiece(context, active, worldState, options = {}) {
    this.#requestChapter(worldState?.chapterId);
    return this.#registry.drawSetPiece(context, active, worldState, options);
  }

  setPieceInputLockSeconds(active, worldState) {
    this.#requestChapter(worldState?.chapterId);
    return this.#registry.setPieceInputLockSeconds(active, worldState);
  }

  setPieceRegistration(active, worldState) {
    this.#requestChapter(worldState?.chapterId);
    return this.#registry.setPieceRegistration(active, worldState);
  }

  resolveMapVignetteAsset(request = {}) {
    this.#requestChapter(chapterIdFromRequest(request));
    return this.#registry.resolveMapVignetteAsset(request);
  }

  #requestChapter(chapterId) {
    if (
      !chapterId
      || this.#loadedChapterIds.has(chapterId)
      || this.#loadingByChapter.has(chapterId)
      || this.#requestErrors.has(chapterId)
      || !this.#descriptorById.has(chapterId)
    ) return;
    void this.activateChapter(chapterId).catch((error) => {
      this.#requestErrors.set(chapterId, error);
      this.#logger?.warn?.(`Chapter ${chapterId} presentation could not load.`, error);
    });
  }

  #rebuild() {
    this.#registry = createProductionPresentationRegistry([...this.#packageByChapter.values()]);
  }
}

export function createLazyProductionPresentationRegistry(options) {
  return new LazyProductionPresentationRegistry(options);
}

export const productionPresentationRegistry = createLazyProductionPresentationRegistry({
  chapterDescriptors: productionChapterDescriptors,
  loadChapterPackage: (idOrNumber, kind) => chapterCatalog.load(idOrNumber, kind),
});

export async function loadProductionPresentationRegistry({
  chapterDescriptors = [],
  loadChapterPackage,
  activeChapterId = null,
  preloadChapterIds = [],
  logger = globalThis.console,
} = {}) {
  const registry = createLazyProductionPresentationRegistry({
    chapterDescriptors,
    loadChapterPackage,
    logger,
  });
  const chapterIds = [activeChapterId, ...preloadChapterIds].filter(Boolean);
  if (chapterIds.length > 0) await registry.activateChapters(chapterIds);
  return registry;
}

/** Resolves ordinary room music without teaching the game shell chapter IDs. */
export function resolveProductionRoomMusic({ chapterId, roomId } = {}) {
  return productionPresentationRegistry.resolveRoomMusic({ chapterId, roomId });
}

/** Draws the code-native presentation registered by the owning chapter. */
export function drawProductionRoomVariantOverlay(context, request = {}) {
  return productionPresentationRegistry.drawRoomVariantOverlay(context, request);
}

/** Lets an owning chapter move its painted room before the normal foreground overlay. */
export function drawProductionRoomVariantBackground(context, request = {}, drawBackground) {
  return productionPresentationRegistry.drawRoomVariantBackground(
    context,
    request,
    drawBackground,
  );
}

export function drawProductionWorldEffects(context, request = {}) {
  return productionPresentationRegistry.drawWorldEffects(context, request);
}

export function drawProductionSetPiece(context, active, worldState, options = {}) {
  return productionPresentationRegistry.drawSetPiece(context, active, worldState, options);
}

export function productionSetPieceInputLockSeconds(active, worldState) {
  return productionPresentationRegistry.setPieceInputLockSeconds(active, worldState);
}

export function resolveProductionMapVignetteAsset(request = {}) {
  return productionPresentationRegistry.resolveMapVignetteAsset(request);
}
