import { assetUrl } from './assetUrl.js';
import { baseAssetManifest } from './baseAssetManifest.js';

const ASSET_KINDS = new Set(['image', 'music', 'sfx', 'voice']);

function defaultVolume(kind) {
  if (kind === 'voice') return 1;
  if (kind === 'sfx') return 0.8;
  if (kind === 'music') return 0.55;
  return null;
}

function normalizeAsset(key, value, chapter) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('Asset registry keys must be non-empty strings.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Asset ${key} must be an object.`);
  }
  if (typeof value.path !== 'string' || value.path.length === 0) {
    throw new TypeError(`Asset ${key} requires a path.`);
  }
  if (!ASSET_KINDS.has(value.kind)) {
    throw new TypeError(`Asset ${key} has unsupported kind ${String(value.kind)}.`);
  }
  const volume = value.volume ?? defaultVolume(value.kind);
  return Object.freeze({
    path: value.path,
    kind: value.kind,
    chapter,
    ...(volume === null ? {} : { volume }),
  });
}

function assetDefinitions(chapterPackage) {
  const source = chapterPackage?.assets ?? chapterPackage?.chapter?.assets;
  if (!source || typeof source !== 'object') {
    throw new TypeError(`Chapter ${String(chapterPackage?.id)} package must provide asset definitions.`);
  }
  return Array.isArray(source)
    ? source.map((entry) => [entry?.key, entry])
    : Object.entries(source).map(([key, entry]) => [entry?.key ?? key, entry]);
}

function sameAsset(left, right) {
  return left.path === right.path
    && left.kind === right.kind
    && (left.volume ?? null) === (right.volume ?? null);
}

export class AssetRegistry {
  #assets = new Map();

  #registeredChapters = new Set();

  constructor({ baseAssets = baseAssetManifest } = {}) {
    if (!baseAssets || typeof baseAssets !== 'object' || Array.isArray(baseAssets)) {
      throw new TypeError('AssetRegistry baseAssets must be an object.');
    }
    for (const [key, value] of Object.entries(baseAssets)) {
      this.#assets.set(key, normalizeAsset(key, value, null));
    }
    Object.freeze(this);
  }

  get manifest() {
    return Object.freeze(Object.fromEntries(this.#assets));
  }

  get registeredChapterIds() {
    return Object.freeze([...this.#registeredChapters]);
  }

  getAsset(key) {
    return this.#assets.get(key) ?? null;
  }

  resolveAsset(key) {
    const asset = this.getAsset(key);
    return asset ? assetUrl(asset.path) : null;
  }

  registerChapterPackage(chapterPackage) {
    const chapterId = chapterPackage?.id;
    if (typeof chapterId !== 'string' || chapterId.length === 0) {
      throw new TypeError('Asset registration requires a chapter package id.');
    }
    if (this.#registeredChapters.has(chapterId)) return Object.freeze([]);
    const registered = [];
    for (const [key, value] of assetDefinitions(chapterPackage)) {
      const asset = normalizeAsset(key, value, chapterId);
      const existing = this.#assets.get(key);
      if (existing) {
        if (!sameAsset(existing, asset)) {
          throw new TypeError(`Chapter ${chapterId} asset ${key} conflicts with an existing asset.`);
        }
        continue;
      }
      this.#assets.set(key, asset);
      registered.push(key);
    }
    this.#registeredChapters.add(chapterId);
    return Object.freeze(registered);
  }

  chapterAssets(chapter) {
    const chapterId = typeof chapter === 'number' ? `ch${chapter}` : chapter;
    return [...this.#assets.entries()]
      .filter(([, entry]) => entry.chapter === chapterId)
      .map(([key, entry]) => ({ key, ...entry }));
  }
}

export function createAssetRegistry(options) {
  return new AssetRegistry(options);
}

export default AssetRegistry;
