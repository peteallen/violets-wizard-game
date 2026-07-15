const GENERAL_ID = /^[a-z][A-Za-z0-9]*(?:[.-][A-Za-z0-9][A-Za-z0-9-]*)+$/;
const LOCAL_ID = /^[A-Za-z][A-Za-z0-9_-]*$/;

export class ChapterAuthoringError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'ChapterAuthoringError';
    this.path = path;
  }
}

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function assertPlainObject(value, path) {
  if (!isPlainObject(value)) throw new ChapterAuthoringError(path, 'must be a plain object');
  return value;
}

export function assertExactKeys(value, path, required, optional = []) {
  assertPlainObject(value, path);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new ChapterAuthoringError(`${path}.${key}`, 'is not supported');
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) throw new ChapterAuthoringError(`${path}.${key}`, 'is required');
  }
  return value;
}

export function assertString(value, path, { max = 240 } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ChapterAuthoringError(path, 'must be a non-empty string');
  }
  if (value.length > max) throw new ChapterAuthoringError(path, `must be at most ${max} characters`);
  return value;
}

export function assertNamespacedId(value, path) {
  assertString(value, path, { max: 160 });
  if (!GENERAL_ID.test(value)) {
    throw new ChapterAuthoringError(path, 'must be a namespaced identifier such as ch12.greatHall');
  }
  return value;
}

export function assertLocalId(value, path) {
  assertString(value, path, { max: 100 });
  if (!LOCAL_ID.test(value)) throw new ChapterAuthoringError(path, 'must be a local identifier');
  return value;
}

export function assertChapterOwnedId(value, chapterId, path) {
  assertNamespacedId(value, path);
  if (!value.startsWith(`${chapterId}.`)) {
    throw new ChapterAuthoringError(path, `must belong to the ${chapterId} namespace`);
  }
  return value;
}

export function clonePureData(value, path = 'value', seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ChapterAuthoringError(path, 'must contain only finite numbers');
    return value;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new ChapterAuthoringError(path, 'must not contain cycles');
    seen.add(value);
    const result = value.map((entry, index) => clonePureData(entry, `${path}[${index}]`, seen));
    seen.delete(value);
    return result;
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) throw new ChapterAuthoringError(path, 'must not contain cycles');
    seen.add(value);
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) throw new ChapterAuthoringError(`${path}.${key}`, 'must not be undefined');
      result[key] = clonePureData(entry, `${path}.${key}`, seen);
    }
    seen.delete(value);
    return result;
  }
  throw new ChapterAuthoringError(path, 'must contain only JSON-safe pure data');
}

export function deepFreeze(value, seen = new WeakSet()) {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

export function freezePureData(value, path = 'value') {
  return deepFreeze(clonePureData(value, path));
}

export function defineRoom(definition) {
  assertPlainObject(definition, 'room');
  assertNamespacedId(definition.id, 'room.id');
  if (definition.spawns !== undefined) {
    assertPlainObject(definition.spawns, 'room.spawns');
    for (const key of Object.keys(definition.spawns)) assertLocalId(key, `room.spawns.${key} key`);
  }
  return freezePureData(definition, `room ${definition.id}`);
}

export function defineScene(definition) {
  assertPlainObject(definition, 'scene');
  assertNamespacedId(definition.id, 'scene.id');
  assertNamespacedId(definition.room, 'scene.room');
  assertLocalId(definition.spawn, 'scene.spawn');
  if (!Number.isSafeInteger(definition.order) || definition.order < 0) {
    throw new ChapterAuthoringError('scene.order', 'must be a non-negative safe integer');
  }
  if (definition.resumeAt !== undefined) {
    assertExactKeys(definition.resumeAt, 'scene.resumeAt', ['room', 'spawn']);
    assertNamespacedId(definition.resumeAt.room, 'scene.resumeAt.room');
    assertLocalId(definition.resumeAt.spawn, 'scene.resumeAt.spawn');
  }
  return freezePureData(definition, `scene ${definition.id}`);
}
