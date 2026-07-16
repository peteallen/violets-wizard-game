export const CURRENT_SAVE_SCHEMA_VERSION = 2;

const CHAPTER_ID = /^ch[1-9][0-9]*$/;
const CHAPTER_RECEIPT_ID = /^ch[1-9][0-9]*\.[A-Za-z0-9][A-Za-z0-9.-]*$/;
export const SAVE_V2_RECEIPT_FIELDS = Object.freeze([
  'storyReceipts',
  'questReceipts',
  'checkpointReceipts',
]);

export class SaveMigrationError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'SaveMigrationError';
    this.path = path;
  }
}

function fail(path, message) {
  throw new SaveMigrationError(path, message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneSave(value) {
  return structuredClone(value);
}

function exactObject(value, path, required) {
  if (!isPlainObject(value)) fail(path, 'must be a plain object');
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, 'is not supported');
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  }
  return value;
}

function reference(value, path) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(path, 'must be a non-empty string');
  }
  if (value.length > 240) fail(path, 'must be at most 240 characters');
  return value;
}

function chapter(value, path) {
  reference(value, path);
  if (!CHAPTER_ID.test(value)) fail(path, 'must be a numbered chapter id');
  return value;
}

function chapterReference(value, chapterId, path) {
  reference(value, path);
  if (!value.startsWith(`${chapterId}.`)) fail(path, `must belong to ${chapterId}`);
  return value;
}

function validateResumeRedirect(value, path) {
  exactObject(value, path, ['from', 'to']);
  exactObject(value.from, `${path}.from`, ['chapter', 'scene', 'room']);
  exactObject(value.to, `${path}.to`, ['chapter', 'scene', 'room', 'spawn']);

  const chapterId = chapter(value.from.chapter, `${path}.from.chapter`);
  chapterReference(value.from.scene, chapterId, `${path}.from.scene`);
  chapterReference(value.from.room, chapterId, `${path}.from.room`);
  if (value.to.chapter !== chapterId) fail(`${path}.to.chapter`, `must be ${chapterId}`);
  chapterReference(value.to.scene, chapterId, `${path}.to.scene`);
  chapterReference(value.to.room, chapterId, `${path}.to.room`);
  reference(value.to.spawn, `${path}.to.spawn`);
  return value;
}

function validateResumeRedirects(value) {
  if (!Array.isArray(value) || value.length === 0) {
    fail('migrateSave.options.resumeRedirects', 'must contain at least one chapter-owned redirect');
  }
  value.forEach((redirect, index) => validateResumeRedirect(
    redirect,
    `migrateSave.options.resumeRedirects[${index}]`,
  ));
  return value;
}

function matchingResumeRedirect(resume, redirects) {
  const matches = redirects.filter(({ from }) => resume.chapter === from.chapter
    && (resume.scene === from.scene || resume.room === from.room));
  if (matches.length > 1) {
    fail('migrateSave.options.resumeRedirects', 'contains more than one redirect for this resume point');
  }
  return matches[0] ?? null;
}

function validateReceiptArray(value, path) {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  const seen = new Set();
  value.forEach((receipt, index) => {
    const receiptPath = `${path}[${index}]`;
    if (typeof receipt !== 'string' || !CHAPTER_RECEIPT_ID.test(receipt)) {
      fail(receiptPath, 'must be a chapter-namespaced receipt id');
    }
    if (receipt.length > 240) fail(receiptPath, 'must be at most 240 characters');
    if (seen.has(receipt)) fail(receiptPath, 'must be unique');
    seen.add(receipt);
  });
}

function validateMigrationEnvelope(value, version, path = 'save') {
  if (!isPlainObject(value)) fail(path, 'must be a plain object');
  if (value.schemaVersion !== version) fail(`${path}.schemaVersion`, `must be ${version}`);
  if (!isPlainObject(value.progress)) fail(`${path}.progress`, 'must be a plain object');
  if (!isPlainObject(value.resume)) fail(`${path}.resume`, 'must be a plain object');
  return value;
}

export function validateSaveV2MigrationFields(value, path = 'save') {
  validateMigrationEnvelope(value, CURRENT_SAVE_SCHEMA_VERSION, path);
  for (const field of SAVE_V2_RECEIPT_FIELDS) {
    if (!Object.hasOwn(value.progress, field)) fail(`${path}.progress.${field}`, 'is required');
    validateReceiptArray(value.progress[field], `${path}.progress.${field}`);
  }
  return value;
}

function runInjectedValidator(value, version, validateVersion) {
  if (validateVersion === undefined) return;
  if (typeof validateVersion !== 'function') {
    fail('migrateSave.options.validateVersion', 'must be a function');
  }
  validateVersion(value, version);
}

export function resumeMatchesRedirect(resume, redirect) {
  validateResumeRedirect(redirect, 'resumeRedirect');
  return resume?.chapter === redirect.from.chapter
    && (resume.scene === redirect.from.scene || resume.room === redirect.from.room);
}

export function migrateSaveV1ToV2(value, options = {}) {
  validateMigrationEnvelope(value, 1);
  runInjectedValidator(value, 1, options.validateVersion);
  const redirects = validateResumeRedirects(options.resumeRedirects);
  const next = cloneSave(value);
  next.schemaVersion = 2;
  next.progress.storyReceipts = [];
  next.progress.questReceipts = [];
  next.progress.checkpointReceipts = [];

  const redirect = matchingResumeRedirect(next.resume, redirects);
  if (redirect) next.resume = { ...redirect.to };

  validateSaveV2MigrationFields(next);
  runInjectedValidator(next, 2, options.validateVersion);
  return next;
}

export const SAVE_MIGRATIONS = Object.freeze([
  Object.freeze({
    fromVersion: 1,
    toVersion: 2,
    migrate: migrateSaveV1ToV2,
  }),
]);

function schemaVersionOf(value) {
  if (!isPlainObject(value)) fail('save', 'must be a plain object');
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion < 1) {
    fail('save.schemaVersion', 'must be a positive integer');
  }
  return value.schemaVersion;
}

export function migrateSave(value, options = {}) {
  let version = schemaVersionOf(value);
  let current = cloneSave(value);

  if (version > CURRENT_SAVE_SCHEMA_VERSION) {
    fail(
      'save.schemaVersion',
      `v${version} is newer than supported schema v${CURRENT_SAVE_SCHEMA_VERSION}`,
    );
  }

  while (version < CURRENT_SAVE_SCHEMA_VERSION) {
    const migration = SAVE_MIGRATIONS.find(({ fromVersion }) => fromVersion === version);
    if (!migration) fail('save.schemaVersion', `no migration is registered from schema v${version}`);
    current = migration.migrate(current, options);
    const nextVersion = schemaVersionOf(current);
    if (nextVersion !== migration.toVersion || nextVersion <= version) {
      fail(
        'save.schemaVersion',
        `migration from v${version} did not advance to v${migration.toVersion}`,
      );
    }
    version = nextVersion;
  }

  validateSaveV2MigrationFields(current);
  runInjectedValidator(current, version, options.validateVersion);
  return current;
}
