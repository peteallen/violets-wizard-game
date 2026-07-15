import {
  assertCharacterId,
  assertCharacterSurface,
} from './CharacterDefinition.js';

const REVIEW_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/u;

export class CharacterReviewDescriptorError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'CharacterReviewDescriptorError';
    this.path = path;
  }
}

function fail(path, message) {
  throw new CharacterReviewDescriptorError(path, message);
}

function plainObject(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(path, 'must be a plain object');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(path, 'must be a plain object');
  }
  return value;
}

function exactObject(value, path, keys) {
  plainObject(value, path);
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, 'is not part of the review descriptor contract');
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  }
  return value;
}

function reviewId(value, path) {
  if (typeof value !== 'string' || !REVIEW_ID.test(value)) {
    fail(path, 'must be a lowercase exact review identifier');
  }
  return value;
}

function finite(value, path) {
  if (!Number.isFinite(value)) fail(path, 'must be a finite number');
  return value;
}

function nonEmptyString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') fail(path, 'must be a non-empty string');
  return value;
}

function cloneImmutable(value, path) {
  if (value === null || ['string', 'boolean', 'undefined'].includes(typeof value)) return value;
  if (typeof value === 'number') return finite(value, path);
  if (typeof value === 'function') return value;
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => cloneImmutable(entry, `${path}[${index}]`)));
  }
  plainObject(value, path);
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    cloneImmutable(entry, `${path}.${key}`),
  ])));
}

function normalizeLabel(value, path) {
  if (value === null) return null;
  exactObject(value, path, ['text', 'x', 'y', 'order', 'plinth']);
  nonEmptyString(value.text, `${path}.text`);
  finite(value.x, `${path}.x`);
  finite(value.y, `${path}.y`);
  if (!['before', 'after'].includes(value.order)) fail(`${path}.order`, 'must be before or after');
  if (value.plinth !== null) {
    exactObject(value.plinth, `${path}.plinth`, ['x', 'y']);
    finite(value.plinth.x, `${path}.plinth.x`);
    finite(value.plinth.y, `${path}.plinth.y`);
  }
  return cloneImmutable(value, path);
}

function normalizeSurround(value, path) {
  if (value === null) return null;
  exactObject(value, path, ['beforeDraw', 'afterDraw']);
  for (const method of ['beforeDraw', 'afterDraw']) {
    if (typeof value[method] !== 'function') fail(`${path}.${method}`, 'must be a function');
  }
  return Object.freeze({ beforeDraw: value.beforeDraw, afterDraw: value.afterDraw });
}

function normalizeEntry(value, path, dependencies) {
  exactObject(value, path, [
    'id', 'characterId', 'surface', 'state', 'stateAtTime', 'timeOffset',
    'inheritReducedMotion', 'label', 'surround',
  ]);
  reviewId(value.id, `${path}.id`);
  assertCharacterId(value.characterId, `${path}.characterId`);
  assertCharacterSurface(value.surface, `${path}.surface`);
  if (!dependencies.has(value.characterId)) {
    fail(`${path}.characterId`, `references undeclared dependency ${value.characterId}`);
  }
  plainObject(value.state, `${path}.state`);
  if (value.stateAtTime !== null && typeof value.stateAtTime !== 'function') {
    fail(`${path}.stateAtTime`, 'must be null or a function');
  }
  finite(value.timeOffset, `${path}.timeOffset`);
  if (typeof value.inheritReducedMotion !== 'boolean') {
    fail(`${path}.inheritReducedMotion`, 'must be a boolean');
  }
  return Object.freeze({
    id: value.id,
    characterId: value.characterId,
    surface: value.surface,
    state: cloneImmutable(value.state, `${path}.state`),
    stateAtTime: value.stateAtTime,
    timeOffset: value.timeOffset,
    inheritReducedMotion: value.inheritReducedMotion,
    label: normalizeLabel(value.label, `${path}.label`),
    surround: normalizeSurround(value.surround, `${path}.surround`),
  });
}

export function defineCharacterReviewDescriptor(source, path = 'characterReviewDescriptor') {
  exactObject(source, path, ['sceneId', 'title', 'characterDependencies', 'entries']);
  reviewId(source.sceneId, `${path}.sceneId`);
  nonEmptyString(source.title, `${path}.title`);
  if (!Array.isArray(source.characterDependencies)) {
    fail(`${path}.characterDependencies`, 'must be an array');
  }
  const dependencies = new Set();
  const characterDependencies = source.characterDependencies.map((characterId, index) => {
    assertCharacterId(characterId, `${path}.characterDependencies[${index}]`);
    if (dependencies.has(characterId)) {
      fail(`${path}.characterDependencies[${index}]`, `duplicates ${characterId}`);
    }
    dependencies.add(characterId);
    return characterId;
  });
  if (!Array.isArray(source.entries) || source.entries.length === 0) {
    fail(`${path}.entries`, 'must be a non-empty array');
  }
  const entryIds = new Set();
  const entries = source.entries.map((entry, index) => {
    const normalized = normalizeEntry(entry, `${path}.entries[${index}]`, dependencies);
    if (entryIds.has(normalized.id)) {
      fail(`${path}.entries[${index}].id`, `duplicates ${normalized.id}`);
    }
    entryIds.add(normalized.id);
    return normalized;
  });
  return Object.freeze({
    sceneId: source.sceneId,
    title: source.title,
    characterDependencies: Object.freeze(characterDependencies),
    entries: Object.freeze(entries),
  });
}

export class CharacterReviewDescriptorRegistry {
  #bySceneId = new Map();

  constructor(descriptors = []) {
    if (!Array.isArray(descriptors)) fail('characterReviewRegistry', 'must receive an array');
    descriptors.forEach((descriptor, index) => {
      const normalized = defineCharacterReviewDescriptor(
        descriptor,
        `characterReviewRegistry[${index}]`,
      );
      if (this.#bySceneId.has(normalized.sceneId)) {
        fail(`characterReviewRegistry[${index}].sceneId`, `duplicates ${normalized.sceneId}`);
      }
      this.#bySceneId.set(normalized.sceneId, normalized);
    });
    this.sceneIds = Object.freeze([...this.#bySceneId.keys()]);
    Object.freeze(this);
  }

  get(sceneId) {
    return this.#bySceneId.get(sceneId) ?? null;
  }
}
