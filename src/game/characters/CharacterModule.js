import { CharacterDefinition, defineCharacter } from './CharacterDefinition.js';

const REVIEW_SCENE_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export class CharacterModuleValidationError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'CharacterModuleValidationError';
    this.path = path;
  }
}

function fail(path, message) {
  throw new CharacterModuleValidationError(path, message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function plainObject(value, path) {
  if (!isPlainObject(value)) fail(path, 'must be a plain object');
  return value;
}

function exactObject(value, path, required) {
  plainObject(value, path);
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, 'is not part of the character module contract');
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  }
}

function cloneImmutable(value, path) {
  if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) fail(path, 'must contain only finite numbers');
    return value;
  }
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

function normalizeReviews(value, path) {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  return Object.freeze(value.map((registration, index) => {
    const registrationPath = `${path}[${index}]`;
    plainObject(registration, registrationPath);
    if (typeof registration.sceneId !== 'string' || !REVIEW_SCENE_ID.test(registration.sceneId)) {
      fail(`${registrationPath}.sceneId`, 'must be a lowercase review scene identifier');
    }
    return cloneImmutable(registration, registrationPath);
  }));
}

export function validateCharacterModule(value, path = 'characterModule') {
  if (value instanceof CharacterModule) return value;
  exactObject(value, path, ['definition', 'loadRuntime', 'reviews']);
  defineCharacter(value.definition);
  if (typeof value.loadRuntime !== 'function') fail(`${path}.loadRuntime`, 'must be an explicit lazy loader');
  normalizeReviews(value.reviews, `${path}.reviews`);
  return value;
}

/**
 * One side-effect-free character package contribution. The loader is retained
 * as a function and is never invoked while the module or catalog is built.
 */
export class CharacterModule {
  constructor(source) {
    validateCharacterModule(source);
    const definition = source.definition instanceof CharacterDefinition
      ? source.definition
      : defineCharacter(source.definition);
    this.id = definition.id;
    this.definition = definition;
    this.loadRuntime = source.loadRuntime;
    this.reviews = normalizeReviews(source.reviews, `characterModule ${definition.id}.reviews`);
    Object.freeze(this);
  }
}

export function defineCharacterModule(source) {
  if (source instanceof CharacterModule) return source;
  return new CharacterModule(source);
}
