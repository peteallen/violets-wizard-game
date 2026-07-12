export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_STORAGE_KEY = 'violets-wizard-save-v1';
export const SAVE_BACKUP_KEY = 'violets-wizard-save-v1-backup';
export const YEARBOOK_MAX_ENTRIES = 24;
export const YEARBOOK_MAX_BYTES = 60 * 1024;

const FLAG_ID = /^ch[1-9][0-9]*\.[A-Za-z0-9][A-Za-z0-9.-]*$/;
const CHAPTER_ID = /^ch[1-9][0-9]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export class SaveValidationError extends TypeError {
  constructor(path, message, cause) {
    super(`${path}: ${message}`, cause ? { cause } : undefined);
    this.name = 'SaveValidationError';
    this.path = path;
  }
}

function fail(path, message, cause) {
  throw new SaveValidationError(path, message, cause);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactObject(value, path, required, optional = []) {
  if (!isPlainObject(value)) fail(path, 'must be a plain object');
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, 'is not part of save schema v1');
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  }
  return value;
}

function string(value, path, { max = 5000, nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (typeof value !== 'string' || value.trim().length === 0) fail(path, 'must be a non-empty string');
  if (value.length > max) fail(path, `must be at most ${max} characters`);
  return value;
}

function oneOf(value, allowed, path, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (!allowed.includes(value)) fail(path, `must be one of: ${allowed.join(', ')}`);
  return value;
}

function number(value, path, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (!Number.isFinite(value)) fail(path, 'must be a finite number');
  if (integer && !Number.isInteger(value)) fail(path, 'must be an integer');
  if (value < min || value > max) fail(path, `must be between ${min} and ${max}`);
  return value;
}

function boolean(value, path) {
  if (typeof value !== 'boolean') fail(path, 'must be a boolean');
  return value;
}

function array(value, path, validate, { min = 0, max = Infinity, unique = false } = {}) {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  if (value.length < min || value.length > max) fail(path, `must contain between ${min} and ${max} items`);
  const seen = new Set();
  value.forEach((entry, index) => {
    validate(entry, `${path}[${index}]`);
    if (unique) {
      const key = typeof entry === 'string' ? entry : JSON.stringify(entry);
      if (seen.has(key)) fail(`${path}[${index}]`, 'must be unique');
      seen.add(key);
    }
  });
  return value;
}

function record(value, path, validate) {
  if (!isPlainObject(value)) fail(path, 'must be a plain object');
  for (const [key, entry] of Object.entries(value)) validate(entry, `${path}.${key}`, key);
  return value;
}

function jsonValue(value, path, depth = 0) {
  if (depth > 12) fail(path, 'is nested too deeply');
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(path, 'must contain finite numbers');
    return value;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => jsonValue(entry, `${path}[${index}]`, depth + 1));
    return value;
  }
  if (isPlainObject(value)) {
    for (const [key, entry] of Object.entries(value)) jsonValue(entry, `${path}.${key}`, depth + 1);
    return value;
  }
  fail(path, 'must be JSON-serializable data');
}

function isoDate(value, path) {
  string(value, path, { max: 40 });
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) fail(path, 'must be an ISO-8601 UTC timestamp');
  return value;
}

function chapterId(value, path) {
  string(value, path, { max: 20 });
  if (!CHAPTER_ID.test(value)) fail(path, 'must be a chapter id such as ch1');
}

function reference(value, path) {
  string(value, path, { max: 240 });
}

function referenceArray(value, path, options = {}) {
  return array(value, path, reference, options);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateResume(value, path) {
  exactObject(value, path, ['chapter', 'scene', 'room', 'spawn']);
  chapterId(value.chapter, `${path}.chapter`);
  reference(value.scene, `${path}.scene`);
  reference(value.room, `${path}.room`);
  reference(value.spawn, `${path}.spawn`);
}

function validateEncounterCheckpoint(value, path) {
  exactObject(value, path, ['phase', 'retries']);
  number(value.phase, `${path}.phase`, { min: 1, integer: true });
  number(value.retries, `${path}.retries`, { min: 0, integer: true });
}

function validateMinigameCheckpoint(value, path) {
  exactObject(value, path, ['stage', 'completed']);
  reference(value.stage, `${path}.stage`);
  boolean(value.completed, `${path}.completed`);
}

function validateProgress(value, path) {
  exactObject(value, path, [
    'highestUnlockedChapter', 'completedChapters', 'questFlags', 'storyChoices',
    'rewardReceipts', 'encounterCheckpoints', 'minigameCheckpoints', 'openedOwlPost',
  ]);
  number(value.highestUnlockedChapter, `${path}.highestUnlockedChapter`, { min: 1, integer: true });
  array(value.completedChapters, `${path}.completedChapters`, chapterId, { unique: true });
  record(value.questFlags, `${path}.questFlags`, (entry, entryPath, key) => {
    if (!FLAG_ID.test(key)) fail(entryPath, 'must use a chapter-namespaced flag key');
    boolean(entry, entryPath);
  });
  record(value.storyChoices, `${path}.storyChoices`, jsonValue);
  referenceArray(value.rewardReceipts, `${path}.rewardReceipts`, { unique: true });
  record(value.encounterCheckpoints, `${path}.encounterCheckpoints`, validateEncounterCheckpoint);
  record(value.minigameCheckpoints, `${path}.minigameCheckpoints`, validateMinigameCheckpoint);
  referenceArray(value.openedOwlPost, `${path}.openedOwlPost`, { unique: true });
}

function validateCharacter(value, path) {
  exactObject(value, path, ['name', 'house', 'wandId', 'appearance', 'pet', 'commonRoomPassword']);
  string(value.name, `${path}.name`, { max: 80 });
  oneOf(value.house, ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'], `${path}.house`, { nullable: true });
  string(value.wandId, `${path}.wandId`, { max: 160, nullable: true });
  exactObject(value.appearance, `${path}.appearance`, ['robeTrim']);
  string(value.appearance.robeTrim, `${path}.appearance.robeTrim`, { max: 80, nullable: true });
  exactObject(value.pet, `${path}.pet`, ['type', 'name']);
  oneOf(value.pet.type, ['owl', 'cat', 'toad'], `${path}.pet.type`, { nullable: true });
  string(value.pet.name, `${path}.pet.name`, { max: 80, nullable: true });
  if ((value.pet.type === null) !== (value.pet.name === null)) fail(`${path}.pet`, 'type and name must both be set or both be null');
  array(value.commonRoomPassword, `${path}.commonRoomPassword`, reference, { max: 3 });
  if (![0, 3].includes(value.commonRoomPassword.length)) fail(`${path}.commonRoomPassword`, 'must be empty or contain exactly three icons');
}

function validateSpellbook(value, path) {
  exactObject(value, path, ['known', 'stats']);
  referenceArray(value.known, `${path}.known`, { unique: true });
  const known = new Set(value.known);
  record(value.stats, `${path}.stats`, (entry, entryPath, key) => {
    reference(key, `${entryPath} key`);
    if (!known.has(key)) fail(entryPath, 'cannot contain stats for an unknown spell');
    exactObject(entry, entryPath, ['casts', 'masteryTier']);
    number(entry.casts, `${entryPath}.casts`, { min: 0, integer: true });
    number(entry.masteryTier, `${entryPath}.masteryTier`, { min: 0, max: 3, integer: true });
  });
  for (const spell of known) {
    if (!Object.hasOwn(value.stats, spell)) fail(`${path}.stats.${spell}`, 'is required for every known spell');
  }
}

function validateCollections(value, path) {
  exactObject(value, path, ['cards', 'treasures', 'housePoints']);
  referenceArray(value.cards, `${path}.cards`, { unique: true });
  referenceArray(value.treasures, `${path}.treasures`, { unique: true });
  number(value.housePoints, `${path}.housePoints`, { min: 0, integer: true });
}

function validateLearning(value, path) {
  exactObject(value, path, ['letterSkill', 'phonicsSkill', 'countingSkill', 'completedBeats']);
  number(value.letterSkill, `${path}.letterSkill`, { min: 0, max: 10, integer: true });
  number(value.phonicsSkill, `${path}.phonicsSkill`, { min: 0, max: 10, integer: true });
  number(value.countingSkill, `${path}.countingSkill`, { min: 0, max: 10, integer: true });
  referenceArray(value.completedBeats, `${path}.completedBeats`, { unique: true });
}

function decodedBase64Bytes(dataUrl, path) {
  const comma = dataUrl.indexOf(',');
  const encoded = dataUrl.slice(comma + 1);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    fail(path, 'must contain valid base64');
  }
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  return encoded.length * 3 / 4 - padding;
}

function validateYearbookEntry(value, path) {
  exactObject(value, path, [
    'id', 'chapter', 'caption', 'mime', 'width', 'height',
    'byteLength', 'dataUrl', 'capturedAt',
  ]);
  reference(value.id, `${path}.id`);
  chapterId(value.chapter, `${path}.chapter`);
  string(value.caption, `${path}.caption`, { max: 80 });
  if (value.caption.trim().split(/\s+/u).length > 3) fail(`${path}.caption`, 'must contain at most three words');
  if (value.mime !== 'image/jpeg') fail(`${path}.mime`, 'must be image/jpeg');
  number(value.width, `${path}.width`, { min: 1, max: 1280, integer: true });
  number(value.height, `${path}.height`, { min: 1, max: 720, integer: true });
  number(value.byteLength, `${path}.byteLength`, { min: 0, max: YEARBOOK_MAX_BYTES, integer: true });
  string(value.dataUrl, `${path}.dataUrl`, { max: Math.ceil(YEARBOOK_MAX_BYTES * 4 / 3) + 64 });
  if (!value.dataUrl.startsWith('data:image/jpeg;base64,')) fail(`${path}.dataUrl`, 'must be a JPEG data URL');
  const actualBytes = decodedBase64Bytes(value.dataUrl, `${path}.dataUrl`);
  if (actualBytes !== value.byteLength) fail(`${path}.byteLength`, `must match data URL size ${actualBytes}`);
  isoDate(value.capturedAt, `${path}.capturedAt`);
}

function validateYearbook(value, path) {
  exactObject(value, path, ['entries']);
  array(value.entries, `${path}.entries`, validateYearbookEntry, { max: YEARBOOK_MAX_ENTRIES });
  const ids = new Set();
  value.entries.forEach((entry, index) => {
    if (ids.has(entry.id)) fail(`${path}.entries[${index}].id`, 'must be unique');
    ids.add(entry.id);
  });
}

function validateSettings(value, path) {
  exactObject(value, path, ['muted', 'volumes', 'reducedMotion', 'learning']);
  boolean(value.muted, `${path}.muted`);
  exactObject(value.volumes, `${path}.volumes`, ['master', 'voice', 'music', 'sfx']);
  for (const key of ['master', 'voice', 'music', 'sfx']) {
    number(value.volumes[key], `${path}.volumes.${key}`, { min: 0, max: 1 });
  }
  boolean(value.reducedMotion, `${path}.reducedMotion`);
  oneOf(value.learning, ['off', 'gentle', 'stretchy'], `${path}.learning`);
}

export function validateSaveV1(value, path = 'save') {
  exactObject(value, path, [
    'schemaVersion', 'createdAt', 'updatedAt', 'appVersion', 'worldSeed',
    'resume', 'progress', 'character', 'spellbook', 'collections',
    'learning', 'yearbook', 'settings',
  ]);
  if (value.schemaVersion !== SAVE_SCHEMA_VERSION) fail(`${path}.schemaVersion`, `must be ${SAVE_SCHEMA_VERSION}`);
  isoDate(value.createdAt, `${path}.createdAt`);
  isoDate(value.updatedAt, `${path}.updatedAt`);
  if (Date.parse(value.updatedAt) < Date.parse(value.createdAt)) fail(`${path}.updatedAt`, 'must not precede createdAt');
  string(value.appVersion, `${path}.appVersion`, { max: 120 });
  number(value.worldSeed, `${path}.worldSeed`, { min: 0, max: 0xffffffff, integer: true });
  validateResume(value.resume, `${path}.resume`);
  validateProgress(value.progress, `${path}.progress`);
  const currentChapterNumber = Number(value.resume.chapter.slice(2));
  if (currentChapterNumber > value.progress.highestUnlockedChapter) {
    fail(`${path}.resume.chapter`, 'cannot exceed highestUnlockedChapter');
  }
  validateCharacter(value.character, `${path}.character`);
  validateSpellbook(value.spellbook, `${path}.spellbook`);
  validateCollections(value.collections, `${path}.collections`);
  validateLearning(value.learning, `${path}.learning`);
  validateYearbook(value.yearbook, `${path}.yearbook`);
  validateSettings(value.settings, `${path}.settings`);
  return value;
}

export function createSaveV1({ now, appVersion = 'development', worldSeed = 1, name = 'Violet' } = {}) {
  isoDate(now, 'createSaveV1.now');
  const save = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    appVersion,
    worldSeed,
    resume: {
      chapter: 'ch1',
      scene: 'ch1.letterScene',
      room: 'ch1.bedroom',
      spawn: 'start',
    },
    progress: {
      highestUnlockedChapter: 1,
      completedChapters: [],
      questFlags: {},
      storyChoices: {},
      rewardReceipts: [],
      encounterCheckpoints: {},
      minigameCheckpoints: {},
      openedOwlPost: [],
    },
    character: {
      name,
      house: null,
      wandId: null,
      appearance: { robeTrim: null },
      pet: { type: null, name: null },
      commonRoomPassword: [],
    },
    spellbook: {
      known: [],
      stats: {},
    },
    collections: {
      cards: [],
      treasures: [],
      housePoints: 0,
    },
    learning: {
      letterSkill: 0,
      phonicsSkill: 0,
      countingSkill: 0,
      completedBeats: [],
    },
    yearbook: { entries: [] },
    settings: {
      muted: false,
      volumes: { master: 1, voice: 1, music: 1, sfx: 1 },
      reducedMotion: false,
      learning: 'gentle',
    },
  };
  validateSaveV1(save);
  return save;
}

export function setFlag(save, flag, value = true) {
  validateSaveV1(save);
  if (typeof flag !== 'string' || !FLAG_ID.test(flag)) fail('setFlag.flag', 'must be a chapter-namespaced flag');
  boolean(value, 'setFlag.value');
  if (save.progress.questFlags[flag] === value) return false;
  save.progress.questFlags[flag] = value;
  return true;
}

export function serializeSave(value) {
  validateSaveV1(value);
  return JSON.stringify(value);
}

export function parseSave(raw) {
  if (typeof raw !== 'string') fail('save', 'serialized save must be a string');
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    fail('save', 'contains invalid JSON', error);
  }
  validateSaveV1(value);
  return value;
}

function storageError(error, rollbackError) {
  return {
    ok: false,
    status: 'storage-error',
    save: null,
    error,
    ...(rollbackError ? { rollbackError } : {}),
  };
}

export class Save {
  constructor({
    storage,
    clock,
    key = SAVE_STORAGE_KEY,
    backupKey = SAVE_BACKUP_KEY,
    debounceMs = 500,
    setTimer = globalThis.setTimeout?.bind(globalThis),
    clearTimer = globalThis.clearTimeout?.bind(globalThis),
  } = {}) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
      throw new TypeError('Save requires a localStorage-compatible storage adapter.');
    }
    if (typeof clock !== 'function') throw new TypeError('Save requires an injected clock returning an ISO timestamp.');
    if (typeof setTimer !== 'function' || typeof clearTimer !== 'function') {
      throw new TypeError('Save requires timer functions.');
    }
    number(debounceMs, 'Save.debounceMs', { min: 0 });
    this.storage = storage;
    this.clock = clock;
    this.key = key;
    this.backupKey = backupKey;
    this.debounceMs = debounceMs;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.pending = null;
    this.timer = null;
  }

  load() {
    let raw;
    try {
      raw = this.storage.getItem(this.key);
    } catch (error) {
      return storageError(error);
    }
    if (raw === null) return { ok: true, status: 'empty', save: null };

    try {
      return { ok: true, status: 'loaded', save: parseSave(raw) };
    } catch (error) {
      let backupRaw;
      try {
        backupRaw = this.storage.getItem(this.backupKey);
      } catch (backupStorageError) {
        return {
          ok: false,
          status: 'corrupt',
          save: null,
          error,
          backupError: backupStorageError,
        };
      }
      if (backupRaw !== null) {
        try {
          return { ok: true, status: 'recovered-backup', save: parseSave(backupRaw), error };
        } catch (backupError) {
          return { ok: false, status: 'corrupt', save: null, error, backupError };
        }
      }
      return { ok: false, status: 'corrupt', save: null, error };
    }
  }

  write(value) {
    validateSaveV1(value);
    const updatedAt = this.clock();
    isoDate(updatedAt, 'Save.clock()');
    const nextSave = cloneJson({ ...value, updatedAt });
    validateSaveV1(nextSave);
    const serialized = serializeSave(nextSave);

    let previous;
    try {
      previous = this.storage.getItem(this.key);
    } catch (error) {
      return storageError(error);
    }

    try {
      this.storage.setItem(this.key, serialized);
    } catch (error) {
      let rollbackError;
      try {
        if (previous === null) this.storage.removeItem?.(this.key);
        else this.storage.setItem(this.key, previous);
      } catch (restoreError) {
        rollbackError = restoreError;
      }
      return storageError(error, rollbackError);
    }
    return { ok: true, status: 'saved', save: nextSave };
  }

  setFlag(value, flag, flagValue = true) {
    const changed = setFlag(value, flag, flagValue);
    if (changed) this.queue(value);
    return changed;
  }

  queue(value) {
    validateSaveV1(value);
    this.pending = cloneJson(value);
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.flush();
    }, this.debounceMs);
    return { ok: true, status: 'queued', save: this.pending };
  }

  flush() {
    if (this.pending === null) return { ok: true, status: 'idle', save: null };
    if (this.timer !== null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
    const result = this.write(this.pending);
    if (result.ok) this.pending = null;
    return result;
  }

  backupCurrent() {
    let raw;
    try {
      raw = this.storage.getItem(this.key);
      if (raw === null) return { ok: true, status: 'empty', save: null };
      this.storage.setItem(this.backupKey, raw);
      return { ok: true, status: 'backed-up', save: null };
    } catch (error) {
      return storageError(error);
    }
  }

  restoreBackup() {
    let raw;
    try {
      raw = this.storage.getItem(this.backupKey);
    } catch (error) {
      return storageError(error);
    }
    if (raw === null) return { ok: false, status: 'missing-backup', save: null };
    let value;
    try {
      value = parseSave(raw);
    } catch (error) {
      return { ok: false, status: 'corrupt-backup', save: null, error };
    }
    const result = this.write(value);
    return result.ok ? { ...result, status: 'restored-backup' } : result;
  }

  import(raw) {
    let value;
    try {
      value = parseSave(raw);
    } catch (error) {
      return { ok: false, status: 'invalid-import', save: null, error };
    }
    return this.write(value);
  }

  export(value) {
    return serializeSave(value);
  }

  clear() {
    const errors = [];
    const timer = this.timer;
    this.timer = null;
    this.pending = null;

    if (timer !== null) {
      try {
        this.clearTimer(timer);
      } catch (error) {
        errors.push({ operation: 'cancel-timer', error });
      }
    }

    for (const [operation, key] of [
      ['remove-primary', this.key],
      ['remove-backup', this.backupKey],
    ]) {
      try {
        this.storage.removeItem(key);
      } catch (error) {
        errors.push({ operation, error });
      }
    }

    if (errors.length > 0) {
      return {
        ok: false,
        status: 'storage-error',
        save: null,
        error: errors[0].error,
        errors,
      };
    }
    return { ok: true, status: 'cleared', save: null };
  }

  destroy() {
    return this.flush();
  }
}
