const CHARACTER_ID_PATTERN = /^character\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const CAPABILITY_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const ASSET_KEY_PATTERN = /^[a-z0-9][a-z0-9._/-]*$/;
const CHARACTER_SURFACES = Object.freeze(['world', 'portrait']);
const CHARACTER_SURFACE_SET = new Set(CHARACTER_SURFACES);
const ASSET_KINDS = Object.freeze(['image', 'voice', 'sfx', 'music']);
const ASSET_KIND_SET = new Set(ASSET_KINDS);

export class CharacterDefinitionValidationError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'CharacterDefinitionValidationError';
    this.path = path;
  }
}

function fail(path, message) {
  throw new CharacterDefinitionValidationError(path, message);
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

function exactObject(value, path, required, optional = []) {
  plainObject(value, path);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, 'is not part of the character definition contract');
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  }
  return value;
}

function nonEmptyString(value, path, maxLength = 240) {
  if (typeof value !== 'string') fail(path, 'must be a string');
  if (value.trim().length === 0) fail(path, 'must not be empty');
  if (value.length > maxLength) fail(path, `must be at most ${maxLength} characters`);
  return value;
}

function capabilityId(value, path) {
  nonEmptyString(value, path, 100);
  if (!CAPABILITY_ID_PATTERN.test(value)) {
    fail(path, 'must use lowercase identity tokens separated by dots or hyphens');
  }
  return value;
}

export function assertCharacterId(value, path = 'character.id') {
  nonEmptyString(value, path, 160);
  if (!CHARACTER_ID_PATTERN.test(value)) {
    fail(path, 'must be a stable identity identifier such as character.violet');
  }
  return value;
}

export function assertCharacterSurface(value, path = 'character surface') {
  nonEmptyString(value, path, 40);
  if (!CHARACTER_SURFACE_SET.has(value)) {
    fail(path, `must be one of: ${CHARACTER_SURFACES.join(', ')}`);
  }
  return value;
}

function uniqueCapabilityList(value, path, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  if (!allowEmpty && value.length === 0) fail(path, 'must contain at least one item');
  const seen = new Set();
  value.forEach((entry, index) => {
    capabilityId(entry, `${path}[${index}]`);
    if (seen.has(entry)) fail(`${path}[${index}]`, `duplicates ${entry}`);
    seen.add(entry);
  });
  return value;
}

function validateMetadata(value, path) {
  exactObject(value, path, ['displayName', 'kind', 'voiceRole']);
  nonEmptyString(value.displayName, `${path}.displayName`, 120);
  capabilityId(value.kind, `${path}.kind`);
  capabilityId(value.voiceRole, `${path}.voiceRole`);
}

function validateSurfaces(value, path) {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  if (value.length === 0) fail(path, 'must contain at least one render surface');
  const seen = new Set();
  value.forEach((surface, index) => {
    assertCharacterSurface(surface, `${path}[${index}]`);
    if (seen.has(surface)) fail(`${path}[${index}]`, `duplicates ${surface}`);
    seen.add(surface);
  });
}

function validateCapabilities(value, path) {
  exactObject(value, path, ['appearances', 'poses', 'actions', 'supportsReducedMotion']);
  uniqueCapabilityList(value.appearances, `${path}.appearances`);
  uniqueCapabilityList(value.poses, `${path}.poses`);
  uniqueCapabilityList(value.actions, `${path}.actions`, { allowEmpty: true });
  if (typeof value.supportsReducedMotion !== 'boolean') {
    fail(`${path}.supportsReducedMotion`, 'must be a boolean');
  }
}

function validateDefaults(value, capabilities, path) {
  exactObject(value, path, ['appearance', 'pose']);
  capabilityId(value.appearance, `${path}.appearance`);
  capabilityId(value.pose, `${path}.pose`);
  if (!capabilities.appearances.includes(value.appearance)) {
    fail(`${path}.appearance`, `references unsupported appearance ${value.appearance}`);
  }
  if (!capabilities.poses.includes(value.pose)) {
    fail(`${path}.pose`, `references unsupported pose ${value.pose}`);
  }
}

function finiteNumber(value, path) {
  if (!Number.isFinite(value)) fail(path, 'must be a finite number');
  return value;
}

function validateBoundsRect(value, path) {
  exactObject(value, path, ['x', 'y', 'width', 'height']);
  finiteNumber(value.x, `${path}.x`);
  finiteNumber(value.y, `${path}.y`);
  finiteNumber(value.width, `${path}.width`);
  finiteNumber(value.height, `${path}.height`);
  if (value.width <= 0) fail(`${path}.width`, 'must be greater than zero');
  if (value.height <= 0) fail(`${path}.height`, 'must be greater than zero');
}

function validateBounds(value, surfaces, path) {
  plainObject(value, path);
  const expected = new Set(surfaces);
  for (const surface of surfaces) {
    if (!Object.hasOwn(value, surface)) fail(`${path}.${surface}`, 'is required for the declared surface');
    validateBoundsRect(value[surface], `${path}.${surface}`);
  }
  for (const surface of Object.keys(value)) {
    assertCharacterSurface(surface, `${path} key`);
    if (!expected.has(surface)) fail(`${path}.${surface}`, 'has no matching declared surface');
  }
}

function validateAssetPath(value, path) {
  nonEmptyString(value, path, 500);
  if (value.startsWith('/') || value.includes('\\') || /^[a-z]+:\/\//u.test(value)) {
    fail(path, 'must be a relative browser asset path');
  }
  if (value.split('/').some((segment) => segment === '..' || segment === '')) {
    fail(path, 'must not contain empty or parent path segments');
  }
}

function validateAssets(value, path) {
  plainObject(value, path);
  for (const [key, asset] of Object.entries(value)) {
    if (!ASSET_KEY_PATTERN.test(key) || key.includes('//') || key.endsWith('/')) {
      fail(`${path} key`, `has invalid asset key ${key}`);
    }
    exactObject(asset, `${path}.${key}`, ['path', 'kind'], ['volume']);
    validateAssetPath(asset.path, `${path}.${key}.path`);
    if (!ASSET_KIND_SET.has(asset.kind)) {
      fail(`${path}.${key}.kind`, `must be one of: ${ASSET_KINDS.join(', ')}`);
    }
    if (asset.volume !== undefined) {
      finiteNumber(asset.volume, `${path}.${key}.volume`);
      if (asset.volume < 0 || asset.volume > 1) {
        fail(`${path}.${key}.volume`, 'must be between zero and one');
      }
    }
  }
}

export function validateCharacterDefinition(value, path = 'character') {
  const source = value instanceof CharacterDefinition ? { ...value } : plainObject(value, path);
  exactObject(source, path, [
    'id',
    'metadata',
    'surfaces',
    'defaults',
    'capabilities',
    'bounds',
    'assets',
  ]);
  assertCharacterId(source.id, `${path}.id`);
  validateMetadata(source.metadata, `${path}.metadata`);
  validateSurfaces(source.surfaces, `${path}.surfaces`);
  validateCapabilities(source.capabilities, `${path}.capabilities`);
  validateDefaults(source.defaults, source.capabilities, `${path}.defaults`);
  validateBounds(source.bounds, source.surfaces, `${path}.bounds`);
  validateAssets(source.assets, `${path}.assets`);
  return value;
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function cloneDefinition(source) {
  return {
    id: source.id,
    metadata: { ...source.metadata },
    surfaces: [...source.surfaces],
    defaults: { ...source.defaults },
    capabilities: {
      appearances: [...source.capabilities.appearances],
      poses: [...source.capabilities.poses],
      actions: [...source.capabilities.actions],
      supportsReducedMotion: source.capabilities.supportsReducedMotion,
    },
    bounds: Object.fromEntries(Object.entries(source.bounds).map(([surface, bounds]) => [
      surface,
      { ...bounds },
    ])),
    assets: Object.fromEntries(Object.entries(source.assets).map(([key, asset]) => [
      key,
      { ...asset },
    ])),
  };
}

/**
 * Pure, immutable metadata for one stable character identity. Runtime renderers
 * are deliberately registered elsewhere so importing a definition cannot touch
 * Canvas, the DOM, image decoding, or global state.
 */
export class CharacterDefinition {
  constructor(source) {
    validateCharacterDefinition(source);
    Object.assign(this, cloneDefinition(source));
    deepFreeze(this);
  }
}

export function defineCharacter(source) {
  if (source instanceof CharacterDefinition) return source;
  return new CharacterDefinition(source);
}

export { ASSET_KINDS as CHARACTER_ASSET_KINDS, CHARACTER_SURFACES };
