export const CURRENT_SAVE_SCHEMA_VERSION = 3;

const SAVE_SCHEMA_V1 = 1;
const SAVE_SCHEMA_V2 = 2;
const SAVE_SCHEMA_V3 = 3;

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
  if (!Array.isArray(value)) {
    fail('migrateSave.options.resumeRedirects', 'must be an array of chapter-owned redirects');
  }
  value.forEach((redirect, index) => validateResumeRedirect(
    redirect,
    `migrateSave.options.resumeRedirects[${index}]`,
  ));
  return value;
}

function validateCompletionRedirect(value, path) {
  exactObject(value, path, ['from', 'to']);
  exactObject(value.from, `${path}.from`, ['chapter', 'scene', 'room']);
  exactObject(value.to, `${path}.to`, ['chapter', 'scene', 'room', 'spawn']);

  const fromChapter = chapter(value.from.chapter, `${path}.from.chapter`);
  chapterReference(value.from.scene, fromChapter, `${path}.from.scene`);
  chapterReference(value.from.room, fromChapter, `${path}.from.room`);

  const toChapter = chapter(value.to.chapter, `${path}.to.chapter`);
  if (toChapter === fromChapter) {
    fail(`${path}.to.chapter`, 'must target a different chapter');
  }
  chapterReference(value.to.scene, toChapter, `${path}.to.scene`);
  chapterReference(value.to.room, toChapter, `${path}.to.room`);
  reference(value.to.spawn, `${path}.to.spawn`);
  return value;
}

function validateCompletionRedirects(value) {
  if (!Array.isArray(value)) {
    fail(
      'migrateSave.options.completionRedirects',
      'must be an array of cross-chapter completion redirects',
    );
  }
  value.forEach((redirect, index) => validateCompletionRedirect(
    redirect,
    `migrateSave.options.completionRedirects[${index}]`,
  ));
  return value;
}

function validateCheckpointRedirect(value, path) {
  exactObject(value, path, ['when', 'to']);
  exactObject(value.when, `${path}.when`, ['chapter', 'allFlags', 'noFlags']);
  exactObject(value.to, `${path}.to`, ['chapter', 'scene', 'room', 'spawn']);

  const chapterId = chapter(value.when.chapter, `${path}.when.chapter`);
  const seenFlags = new Set();
  for (const field of ['allFlags', 'noFlags']) {
    if (!Array.isArray(value.when[field])) fail(`${path}.when.${field}`, 'must be an array');
    value.when[field].forEach((flag, index) => {
      chapterReference(flag, chapterId, `${path}.when.${field}[${index}]`);
      if (seenFlags.has(flag)) {
        fail(`${path}.when.${field}[${index}]`, 'must be unique across checkpoint conditions');
      }
      seenFlags.add(flag);
    });
  }

  if (value.to.chapter !== chapterId) fail(`${path}.to.chapter`, `must be ${chapterId}`);
  chapterReference(value.to.scene, chapterId, `${path}.to.scene`);
  chapterReference(value.to.room, chapterId, `${path}.to.room`);
  reference(value.to.spawn, `${path}.to.spawn`);
  return value;
}

function validateCheckpointRedirects(value) {
  if (!Array.isArray(value)) {
    fail(
      'migrateSave.options.checkpointRedirects',
      'must be an array of progress-aware same-chapter redirects',
    );
  }
  value.forEach((redirect, index) => validateCheckpointRedirect(
    redirect,
    `migrateSave.options.checkpointRedirects[${index}]`,
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

function matchingCompletionRedirect(value, redirects) {
  const completedChapters = Array.isArray(value.progress.completedChapters)
    ? value.progress.completedChapters
    : [];
  const matches = redirects.filter(({ from }) => completedChapters.includes(from.chapter)
    && value.resume.chapter === from.chapter
    && (value.resume.scene === from.scene || value.resume.room === from.room));
  if (matches.length > 1) {
    fail(
      'migrateSave.options.completionRedirects',
      'contains more than one redirect for this completed resume point',
    );
  }
  return matches[0] ?? null;
}

function matchingCheckpointRedirect(value, redirects) {
  const flags = value.progress.questFlags;
  const matches = redirects.filter(({ when }) => value.resume.chapter === when.chapter
    && when.allFlags.every((flag) => flags[flag] === true)
    && when.noFlags.every((flag) => flags[flag] !== true));
  if (matches.length > 1) {
    fail(
      'migrateSave.options.checkpointRedirects',
      'contains more than one redirect for this progress checkpoint',
    );
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
  validateMigrationEnvelope(value, SAVE_SCHEMA_V2, path);
  for (const field of SAVE_V2_RECEIPT_FIELDS) {
    if (!Object.hasOwn(value.progress, field)) fail(`${path}.progress.${field}`, 'is required');
    validateReceiptArray(value.progress[field], `${path}.progress.${field}`);
  }
  return value;
}

export function validateSaveV3MigrationFields(value, path = 'save') {
  validateMigrationEnvelope(value, SAVE_SCHEMA_V3, path);
  for (const field of SAVE_V2_RECEIPT_FIELDS) {
    if (!Object.hasOwn(value.progress, field)) fail(`${path}.progress.${field}`, 'is required');
    validateReceiptArray(value.progress[field], `${path}.progress.${field}`);
  }
  if (!Object.hasOwn(value.resume, 'dialogue')) fail(`${path}.resume.dialogue`, 'is required');
  if (value.resume.dialogue !== null) {
    exactObject(value.resume.dialogue, `${path}.resume.dialogue`, ['script', 'node']);
    reference(value.resume.dialogue.script, `${path}.resume.dialogue.script`);
    reference(value.resume.dialogue.node, `${path}.resume.dialogue.node`);
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

export function resumeMatchesCompletionRedirect(value, redirect) {
  validateCompletionRedirect(redirect, 'completionRedirect');
  return Array.isArray(value?.progress?.completedChapters)
    && value.progress.completedChapters.includes(redirect.from.chapter)
    && value?.resume?.chapter === redirect.from.chapter
    && (value.resume.scene === redirect.from.scene || value.resume.room === redirect.from.room);
}

export function migrateSaveV1ToV2(value, options = {}) {
  validateMigrationEnvelope(value, SAVE_SCHEMA_V1);
  runInjectedValidator(value, SAVE_SCHEMA_V1, options.validateVersion);
  const redirects = validateResumeRedirects(options.resumeRedirects ?? []);
  const next = cloneSave(value);
  next.schemaVersion = SAVE_SCHEMA_V2;
  next.progress.storyReceipts = [];
  next.progress.questReceipts = [];
  next.progress.checkpointReceipts = [];

  const redirect = matchingResumeRedirect(next.resume, redirects);
  if (redirect) next.resume = { ...redirect.to };

  validateSaveV2MigrationFields(next);
  runInjectedValidator(next, SAVE_SCHEMA_V2, options.validateVersion);
  return next;
}

export function migrateSaveV2ToV3(value, options = {}) {
  validateMigrationEnvelope(value, SAVE_SCHEMA_V2);
  runInjectedValidator(value, SAVE_SCHEMA_V2, options.validateVersion);
  const redirects = validateCompletionRedirects(options.completionRedirects ?? []);
  const next = cloneSave(value);
  next.schemaVersion = SAVE_SCHEMA_V3;
  next.resume.dialogue = null;

  const redirect = matchingCompletionRedirect(next, redirects);
  if (redirect) next.resume = { ...redirect.to, dialogue: null };

  validateSaveV3MigrationFields(next);
  runInjectedValidator(next, SAVE_SCHEMA_V3, options.validateVersion);
  return next;
}

export const SAVE_MIGRATIONS = Object.freeze([
  Object.freeze({
    fromVersion: SAVE_SCHEMA_V1,
    toVersion: SAVE_SCHEMA_V2,
    migrate: migrateSaveV1ToV2,
  }),
  Object.freeze({
    fromVersion: SAVE_SCHEMA_V2,
    toVersion: SAVE_SCHEMA_V3,
    migrate: migrateSaveV2ToV3,
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
  const resumeRedirects = validateResumeRedirects(options.resumeRedirects ?? []);
  const completionRedirects = validateCompletionRedirects(options.completionRedirects ?? []);
  const checkpointRedirects = validateCheckpointRedirects(options.checkpointRedirects ?? []);

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

  validateSaveV3MigrationFields(current);
  const completionRedirect = matchingCompletionRedirect(current, completionRedirects);
  if (completionRedirect) {
    current.resume = { ...completionRedirect.to, dialogue: null };
  }
  const resumeRedirect = matchingResumeRedirect(current.resume, resumeRedirects);
  if (resumeRedirect) {
    current.resume = { ...resumeRedirect.to, dialogue: null };
  }
  const checkpointRedirect = matchingCheckpointRedirect(current, checkpointRedirects);
  if (checkpointRedirect) {
    current.resume = { ...checkpointRedirect.to, dialogue: null };
  }
  validateSaveV3MigrationFields(current);
  runInjectedValidator(current, version, options.validateVersion);
  return current;
}
