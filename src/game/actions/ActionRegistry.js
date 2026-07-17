const ACTION_TYPE_PATTERN = /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+$/u;

export class ActionRegistryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ActionRegistryError';
  }
}

export class DuplicateActionTypeError extends ActionRegistryError {
  constructor(type) {
    super(`Action type "${type}" is already registered.`);
    this.name = 'DuplicateActionTypeError';
    this.actionType = type;
  }
}

export class UnknownActionTypeError extends ActionRegistryError {
  constructor(type, availableTypes) {
    const available = availableTypes.join(', ') || '(none)';
    super(`Unknown action type "${String(type)}". Registered action types: ${available}.`);
    this.name = 'UnknownActionTypeError';
    this.actionType = type;
  }
}

export class MissingActionHandlerError extends ActionRegistryError {
  constructor(type) {
    super(`Action type "${type}" has no handler in the injected execution context.`);
    this.name = 'MissingActionHandlerError';
    this.actionType = type;
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertActionType(type, path = 'action type') {
  if (typeof type !== 'string' || !ACTION_TYPE_PATTERN.test(type)) {
    throw new TypeError(`${path} must be an exact namespaced identifier such as dialogue.start.`);
  }
  return type;
}

function assertActionCandidate(action, path) {
  if (!isPlainObject(action)) throw new TypeError(`${path} must be a plain object.`);
  if (!Object.hasOwn(action, 'type')) throw new TypeError(`${path}.type is required.`);
  assertActionType(action.type, `${path}.type`);
  return action;
}

function emptyReferences() {
  return [];
}

export function defineAction(source) {
  if (!isPlainObject(source)) throw new TypeError('Action definition must be a plain object.');
  const allowedKeys = new Set(['type', 'terminal', 'validate', 'references', 'execute']);
  for (const key of Object.keys(source)) {
    if (!allowedKeys.has(key)) throw new TypeError(`Action definition.${key} is not supported.`);
  }
  const type = assertActionType(source.type, 'Action definition.type');
  if (typeof source.validate !== 'function') {
    throw new TypeError(`Action definition "${type}" requires an exact validation hook.`);
  }
  if (source.references !== undefined && typeof source.references !== 'function') {
    throw new TypeError(`Action definition "${type}" references must be a function when provided.`);
  }
  if (typeof source.execute !== 'function') {
    throw new TypeError(`Action definition "${type}" requires an execution hook.`);
  }
  if (source.terminal !== undefined && typeof source.terminal !== 'boolean') {
    throw new TypeError(`Action definition "${type}" terminal must be a boolean when provided.`);
  }
  return Object.freeze({
    type,
    terminal: source.terminal ?? false,
    validate: source.validate,
    references: source.references ?? emptyReferences,
    execute: source.execute,
  });
}

function normalizeReferences(value, type) {
  if (!Array.isArray(value)) {
    throw new TypeError(`Action definition "${type}" references hook must return an array.`);
  }
  const references = value.map((reference, index) => {
    const path = `Action definition "${type}" reference ${index}`;
    if (!isPlainObject(reference)) throw new TypeError(`${path} must be a plain object.`);
    const allowedKeys = new Set(['kind', 'id', 'path']);
    for (const key of Object.keys(reference)) {
      if (!allowedKeys.has(key)) throw new TypeError(`${path}.${key} is not supported.`);
    }
    if (typeof reference.kind !== 'string' || reference.kind.length === 0) {
      throw new TypeError(`${path}.kind must be a non-empty string.`);
    }
    if (typeof reference.id !== 'string' || reference.id.length === 0) {
      throw new TypeError(`${path}.id must be a non-empty string.`);
    }
    if (reference.path !== undefined && (typeof reference.path !== 'string' || reference.path.length === 0)) {
      throw new TypeError(`${path}.path must be a non-empty string when provided.`);
    }
    return Object.freeze({
      kind: reference.kind,
      id: reference.id,
      ...(reference.path === undefined ? {} : { path: reference.path }),
    });
  });
  return Object.freeze(references);
}

export class ActionRegistry {
  #definitions = new Map();

  #sealed = false;

  constructor(definitions = []) {
    if (!Array.isArray(definitions)) throw new TypeError('Action definitions must be an array.');
    for (const definition of definitions) this.register(definition);
  }

  register(source) {
    if (this.#sealed) throw new ActionRegistryError('Action registry is sealed.');
    const definition = defineAction(source);
    if (this.#definitions.has(definition.type)) throw new DuplicateActionTypeError(definition.type);
    this.#definitions.set(definition.type, definition);
    return this;
  }

  seal() {
    this.#sealed = true;
    return this;
  }

  get sealed() {
    return this.#sealed;
  }

  has(type) {
    return typeof type === 'string' && this.#definitions.has(type);
  }

  get(type) {
    return typeof type === 'string' ? this.#definitions.get(type) : undefined;
  }

  require(type) {
    if (this.has(type)) return this.#definitions.get(type);
    throw new UnknownActionTypeError(type, this.ids());
  }

  ids() {
    return Object.freeze([...this.#definitions.keys()]);
  }

  entries() {
    return Object.freeze([...this.#definitions.values()]);
  }

  isTerminal(type) {
    return Boolean(this.require(type).terminal);
  }

  validate(action, path = 'action') {
    assertActionCandidate(action, path);
    const definition = this.require(action.type);
    definition.validate(action, path);
    return action;
  }

  references(action, path = 'action') {
    this.validate(action, path);
    const definition = this.require(action.type);
    return normalizeReferences(definition.references(action), definition.type);
  }

  execute(action, context) {
    this.validate(action);
    return this.require(action.type).execute(action, context);
  }
}

export function resolveInjectedActionHandler(context, type) {
  const handlers = context?.handlers;
  const handler = handlers instanceof Map
    ? handlers.get(type)
    : (isPlainObject(handlers) && Object.hasOwn(handlers, type) ? handlers[type] : undefined);
  if (typeof handler !== 'function') throw new MissingActionHandlerError(type);
  return handler;
}
