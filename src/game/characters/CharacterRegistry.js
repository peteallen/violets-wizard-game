import {
  CharacterDefinition,
  assertCharacterSurface,
  defineCharacter,
} from './CharacterDefinition.js';

export class CharacterRegistryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CharacterRegistryError';
  }
}

export class UnknownCharacterError extends CharacterRegistryError {
  constructor(id, availableIds) {
    const available = availableIds.join(', ') || '(none)';
    super(`Unknown character "${id}". Registered identities: ${available}.`);
    this.name = 'UnknownCharacterError';
    this.characterId = id;
  }
}

export class UnsupportedCharacterSurfaceError extends CharacterRegistryError {
  constructor(characterId, surface, supported) {
    super(`Character "${characterId}" does not support the "${surface}" surface. Supported surfaces: ${supported.join(', ') || '(none)'}.`);
    this.name = 'UnsupportedCharacterSurfaceError';
    this.characterId = characterId;
    this.surface = surface;
  }
}

export class UnsupportedCharacterCapabilityError extends CharacterRegistryError {
  constructor(characterId, capability, value, supported) {
    super(`Character "${characterId}" does not support ${capability} "${value}". Supported ${capability} values: ${supported.join(', ') || '(none)'}.`);
    this.name = 'UnsupportedCharacterCapabilityError';
    this.characterId = characterId;
    this.capability = capability;
    this.value = value;
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainObject(value, path) {
  if (!isPlainObject(value)) throw new TypeError(`${path} must be a plain object.`);
  return value;
}

function runtimeCandidate(value) {
  if (isPlainObject(value) && !Object.hasOwn(value, 'renderers') && Object.hasOwn(value, 'default')) {
    return value.default;
  }
  return value;
}

export function validateCharacterRuntime(value, definition, path = `Runtime for ${definition.id}`) {
  const runtime = runtimeCandidate(value);
  assertPlainObject(runtime, path);
  const allowedRuntimeKeys = new Set(['renderers', 'preload', 'release']);
  for (const key of Object.keys(runtime)) {
    if (!allowedRuntimeKeys.has(key)) throw new TypeError(`${path}.${key} is not part of the character runtime contract.`);
  }
  if (!Object.hasOwn(runtime, 'renderers')) throw new TypeError(`${path}.renderers is required.`);
  assertPlainObject(runtime.renderers, `${path}.renderers`);

  const supported = new Set(definition.surfaces);
  for (const surface of definition.surfaces) {
    if (typeof runtime.renderers[surface] !== 'function') {
      throw new TypeError(`${path}.renderers.${surface} must be a function for the declared surface.`);
    }
  }
  for (const surface of Object.keys(runtime.renderers)) {
    assertCharacterSurface(surface, `${path}.renderers key`);
    if (!supported.has(surface)) {
      throw new TypeError(`${path}.renderers.${surface} has no matching surface in ${definition.id}.`);
    }
  }
  for (const lifecycleMethod of ['preload', 'release']) {
    if (runtime[lifecycleMethod] !== undefined && typeof runtime[lifecycleMethod] !== 'function') {
      throw new TypeError(`${path}.${lifecycleMethod} must be a function when provided.`);
    }
  }
  return runtime;
}

function freezeRuntime(value, definition) {
  const runtime = validateCharacterRuntime(value, definition);
  return Object.freeze({
    renderers: Object.freeze(Object.fromEntries(definition.surfaces.map((surface) => [
      surface,
      runtime.renderers[surface],
    ]))),
    ...(runtime.preload ? { preload: runtime.preload } : {}),
    ...(runtime.release ? { release: runtime.release } : {}),
  });
}

function lifecycleRequest(characterId, definition, context) {
  return Object.freeze({
    characterId,
    definition,
    assets: definition.assets,
    context,
  });
}

export class CharacterRegistry {
  #definitions = new Map();

  #loaders = new Map();

  #runtimes = new Map();

  #runtimePromises = new Map();

  #preloadPromises = new Map();

  #activeCounts = new Map();

  #sealed = false;

  register(source, loadRuntime) {
    if (this.#sealed) throw new CharacterRegistryError('Character registry is sealed.');
    const definition = source instanceof CharacterDefinition ? source : defineCharacter(source);
    if (typeof loadRuntime !== 'function') {
      throw new TypeError(`Character "${definition.id}" requires an explicit lazy runtime loader.`);
    }
    if (this.#definitions.has(definition.id)) {
      throw new CharacterRegistryError(`Character "${definition.id}" is already registered.`);
    }
    this.#definitions.set(definition.id, definition);
    this.#loaders.set(definition.id, loadRuntime);
    return this;
  }

  seal() {
    this.#sealed = true;
    return this;
  }

  resolveId(reference) {
    if (typeof reference !== 'string') throw new TypeError('Character reference must be a string.');
    if (this.#definitions.has(reference)) return reference;
    throw new UnknownCharacterError(reference, this.ids());
  }

  has(reference) {
    return typeof reference === 'string' && this.#definitions.has(reference);
  }

  getDefinition(reference) {
    return this.#definitions.get(this.resolveId(reference));
  }

  getBounds(reference, surface) {
    const definition = this.getDefinition(reference);
    assertCharacterSurface(surface);
    if (!definition.surfaces.includes(surface)) {
      throw new UnsupportedCharacterSurfaceError(definition.id, surface, definition.surfaces);
    }
    return definition.bounds[surface];
  }

  ids() {
    return Object.freeze([...this.#definitions.keys()]);
  }

  entries() {
    return Object.freeze([...this.#definitions.values()]);
  }

  get sealed() {
    return this.#sealed;
  }

  isLoaded(reference) {
    if (!this.has(reference)) return false;
    return this.#runtimes.has(this.resolveId(reference));
  }

  async loadRuntime(reference) {
    const characterId = this.resolveId(reference);
    if (this.#runtimes.has(characterId)) return this.#runtimes.get(characterId);
    if (this.#runtimePromises.has(characterId)) return this.#runtimePromises.get(characterId);

    const definition = this.#definitions.get(characterId);
    const loader = this.#loaders.get(characterId);
    const pending = Promise.resolve()
      .then(() => loader(definition))
      .then((runtime) => freezeRuntime(runtime, definition))
      .then((runtime) => {
        this.#runtimes.set(characterId, runtime);
        this.#runtimePromises.delete(characterId);
        return runtime;
      })
      .catch((error) => {
        this.#runtimePromises.delete(characterId);
        throw error;
      });
    this.#runtimePromises.set(characterId, pending);
    return pending;
  }

  resolveRenderState(reference, state = {}) {
    const definition = this.getDefinition(reference);
    assertPlainObject(state, `Render state for ${definition.id}`);
    const appearance = state.appearance ?? definition.defaults.appearance;
    const pose = state.pose ?? definition.defaults.pose;
    const action = state.action ?? null;
    this.#assertCapability(definition, 'appearance', appearance, definition.capabilities.appearances);
    this.#assertCapability(definition, 'pose', pose, definition.capabilities.poses);
    if (action !== null) this.#assertCapability(definition, 'action', action, definition.capabilities.actions);
    return Object.freeze({
      ...state,
      characterId: definition.id,
      appearance,
      pose,
      action,
    });
  }

  render(reference, surface, state = {}) {
    const characterId = this.resolveId(reference);
    const definition = this.#definitions.get(characterId);
    assertCharacterSurface(surface);
    if (!definition.surfaces.includes(surface)) {
      throw new UnsupportedCharacterSurfaceError(characterId, surface, definition.surfaces);
    }
    const runtime = this.#runtimes.get(characterId);
    if (!runtime) {
      throw new CharacterRegistryError(`Character "${characterId}" is not loaded. Call loadRuntime() or preload() before rendering.`);
    }
    const renderState = this.resolveRenderState(characterId, state);
    return runtime.renderers[surface](Object.freeze({ ...renderState, surface }), definition);
  }

  async preload(dependencies, context = undefined) {
    const characterIds = this.resolveDependencies(dependencies);
    const results = await Promise.allSettled(characterIds.map((characterId) => (
      this.#activate(characterId, context)
    )));
    const failures = results
      .map((result, index) => ({ result, characterId: characterIds[index] }))
      .filter(({ result }) => result.status === 'rejected');
    if (failures.length > 0) {
      const activated = results
        .map((result, index) => ({ result, characterId: characterIds[index] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(({ characterId }) => characterId);
      await Promise.allSettled(activated.map((characterId) => this.#deactivate(characterId, context)));
      throw new AggregateError(
        failures.map(({ result }) => result.reason),
        `Could not preload character dependencies: ${failures.map(({ characterId }) => characterId).join(', ')}.`,
      );
    }
    return characterIds;
  }

  async release(dependencies, context = undefined) {
    const characterIds = this.resolveDependencies(dependencies);
    for (const characterId of characterIds) {
      if ((this.#activeCounts.get(characterId) ?? 0) === 0) {
        throw new CharacterRegistryError(`Character "${characterId}" has no active dependency scope to release.`);
      }
    }
    await Promise.all(characterIds.map((characterId) => this.#deactivate(characterId, context)));
    return characterIds;
  }

  resolveDependencies(dependencies) {
    if (!Array.isArray(dependencies)) throw new TypeError('Character dependencies must be an array.');
    const characterIds = [];
    const seen = new Set();
    for (const reference of dependencies) {
      const characterId = this.resolveId(reference);
      if (seen.has(characterId)) continue;
      seen.add(characterId);
      characterIds.push(characterId);
    }
    return Object.freeze(characterIds);
  }

  #assertCapability(definition, capability, value, supported) {
    if (typeof value !== 'string' || !supported.includes(value)) {
      throw new UnsupportedCharacterCapabilityError(definition.id, capability, value, supported);
    }
  }

  async #activate(characterId, context) {
    const runtime = await this.loadRuntime(characterId);
    const activeCount = this.#activeCounts.get(characterId) ?? 0;
    if (activeCount === 0) {
      let pending = this.#preloadPromises.get(characterId);
      if (!pending) {
        const definition = this.#definitions.get(characterId);
        pending = Promise.resolve().then(() => runtime.preload?.(
          lifecycleRequest(characterId, definition, context),
        ));
        this.#preloadPromises.set(characterId, pending);
      }
      try {
        await pending;
      } finally {
        if (this.#preloadPromises.get(characterId) === pending) this.#preloadPromises.delete(characterId);
      }
    }
    this.#activeCounts.set(characterId, (this.#activeCounts.get(characterId) ?? 0) + 1);
  }

  async #deactivate(characterId, context) {
    const activeCount = this.#activeCounts.get(characterId) ?? 0;
    if (activeCount <= 0) {
      throw new CharacterRegistryError(`Character "${characterId}" has no active dependency scope to release.`);
    }
    if (activeCount > 1) {
      this.#activeCounts.set(characterId, activeCount - 1);
      return;
    }
    this.#activeCounts.delete(characterId);
    const runtime = this.#runtimes.get(characterId);
    const definition = this.#definitions.get(characterId);
    await runtime.release?.(lifecycleRequest(characterId, definition, context));
  }
}
