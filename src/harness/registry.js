const REGISTRY_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function assertPlainObject(value, path) {
  if (!isPlainObject(value)) throw new TypeError(`${path} must be a plain object.`);
  return value;
}

export function assertExactKeys(value, allowedKeys, path) {
  assertPlainObject(value, path);
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new TypeError(`${path} has unsupported ${unexpected.length === 1 ? 'field' : 'fields'}: ${unexpected.join(', ')}.`);
  }
  const missing = allowedKeys.filter((key) => !Object.hasOwn(value, key));
  if (missing.length > 0) {
    throw new TypeError(`${path} is missing required ${missing.length === 1 ? 'field' : 'fields'}: ${missing.join(', ')}.`);
  }
  return value;
}

export function assertRegistryId(id, path = 'fixture id') {
  if (typeof id !== 'string' || !REGISTRY_ID_PATTERN.test(id)) {
    throw new TypeError(`${path} must use lowercase letters, numbers, dots, and hyphens.`);
  }
  return id;
}

export function deepFreeze(value, seen = new WeakSet()) {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

export function cloneFixture(value) {
  return structuredClone(value);
}

export class ImmutableRegistry {
  #entries = new Map();

  #sealed = false;

  constructor(name, validate) {
    if (typeof name !== 'string' || name.trim() === '') throw new TypeError('Registry name must be a non-empty string.');
    if (typeof validate !== 'function') throw new TypeError(`${name} registry requires a validator.`);
    this.name = name;
    this.validate = validate;
  }

  register(id, value) {
    if (this.#sealed) throw new Error(`${this.name} registry is sealed.`);
    assertRegistryId(id, `${this.name} fixture id`);
    if (this.#entries.has(id)) throw new Error(`${this.name} fixture "${id}" is already registered.`);
    this.validate(value, `${this.name} fixture "${id}"`);
    this.#entries.set(id, deepFreeze(value));
    return this;
  }

  seal() {
    this.#sealed = true;
    return this;
  }

  get(id) {
    assertRegistryId(id, `${this.name} fixture id`);
    if (this.#entries.has(id)) return this.#entries.get(id);
    const available = this.ids();
    throw new Error(`Unknown ${this.name} fixture "${id}". Available fixtures: ${available.join(', ') || '(none)'}.`);
  }

  clone(id) {
    return cloneFixture(this.get(id));
  }

  has(id) {
    return typeof id === 'string' && this.#entries.has(id);
  }

  ids() {
    return Object.freeze([...this.#entries.keys()]);
  }

  entries() {
    return Object.freeze([...this.#entries].map(([id, value]) => Object.freeze({ id, value })));
  }

  get sealed() {
    return this.#sealed;
  }
}
