import { describe, expect, it } from 'vitest';
import { saveMigrationOptions } from '../src/game/chapters/saveMigrations.js';
import {
  SAVE_BACKUP_KEY,
  SAVE_STORAGE_KEY,
  Save,
  SaveValidationError,
  createSaveV1,
  createSaveV2,
  parseSave,
  setFlag,
  serializeSave,
  validateSaveV1,
} from '../src/game/systems/Save.js';

const FIRST_TIME = '2026-07-12T18:00:00.000Z';
const SECOND_TIME = '2026-07-12T18:01:00.000Z';

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.failRead = false;
    this.failNextWrite = false;
  }

  getItem(key) {
    if (this.failRead) throw new Error('storage read denied');
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error('quota exceeded');
    }
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function saveFixture() {
  return createSaveV1({ now: FIRST_TIME, appVersion: 'abc1234', worldSeed: 42 });
}

describe('save schema v1', () => {
  it('creates a complete future-safe default and round-trips it', () => {
    const save = saveFixture();
    save.character.appearance.robeTrim = 'purple';
    save.character.pet = { type: 'cat', name: 'Biscuit' };
    save.spellbook.known.push('lumos');
    save.spellbook.stats.lumos = { casts: 11, masteryTier: 1 };
    save.yearbook.entries.push({
      id: 'ch1.wandChosen',
      chapter: 'ch1',
      caption: 'My wand',
      mime: 'image/jpeg',
      width: 480,
      height: 270,
      byteLength: 0,
      dataUrl: 'data:image/jpeg;base64,',
      capturedAt: FIRST_TIME,
    });

    expect(validateSaveV1(save)).toBe(save);
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it('rejects unknown fields and inconsistent durable state', () => {
    const unknown = saveFixture();
    unknown.settings.secretDifficulty = 'hard';
    expect(() => validateSaveV1(unknown)).toThrow(SaveValidationError);

    const missingStats = saveFixture();
    missingStats.spellbook.known.push('lumos');
    expect(() => validateSaveV1(missingStats)).toThrow(/stats.lumos/);

    const falseThumbnailSize = saveFixture();
    falseThumbnailSize.yearbook.entries.push({
      id: 'ch1.wandChosen', chapter: 'ch1', caption: 'My wand', mime: 'image/jpeg',
      width: 480, height: 270, byteLength: 4, dataUrl: 'data:image/jpeg;base64,', capturedAt: FIRST_TIME,
    });
    expect(() => validateSaveV1(falseThumbnailSize)).toThrow(/must match/);
  });

  it('routes durable flags through an idempotent choke point', () => {
    const save = saveFixture();
    expect(setFlag(save, 'ch1.letterOpened')).toBe(true);
    expect(setFlag(save, 'ch1.letterOpened')).toBe(false);
    expect(save.progress.questFlags['ch1.letterOpened']).toBe(true);
    expect(() => setFlag(save, 'letterOpened')).toThrow(/chapter-namespaced/);
  });
});

describe('safe storage adapter', () => {
  it('backs up and redirects a legacy Chapter Two preview before storing schema v2', () => {
    const storage = new MemoryStorage();
    const legacy = saveFixture();
    legacy.resume = {
      chapter: 'ch2',
      scene: 'ch2.placeholder',
      room: 'ch2.previewRoom',
      spawn: 'start',
    };
    legacy.progress.highestUnlockedChapter = 2;
    legacy.progress.completedChapters.push('ch1');
    const raw = serializeSave(legacy);
    storage.setItem(SAVE_STORAGE_KEY, raw);
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      migrationOptions: saveMigrationOptions,
    });

    const result = saves.load();

    expect(result).toMatchObject({
      ok: true,
      status: 'migrated',
      fromSchemaVersion: 1,
      backupStatus: 'backed-up',
      save: {
        schemaVersion: 2,
        resume: {
          chapter: 'ch2',
          scene: 'ch2.scene.kingsCross',
          room: 'ch2.kingsCross',
          spawn: 'start',
        },
      },
    });
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe(raw);
    expect(parseSave(storage.getItem(SAVE_BACKUP_KEY))).toEqual(legacy);
    expect(parseSave(storage.getItem(SAVE_STORAGE_KEY))).toEqual(result.save);
  });

  it('writes with an injected timestamp and loads without touching wall-clock APIs', () => {
    const storage = new MemoryStorage();
    const saves = new Save({ storage, clock: () => SECOND_TIME });
    const result = saves.write(saveFixture());

    expect(result).toMatchObject({ ok: true, status: 'saved' });
    expect(result.save.updatedAt).toBe(SECOND_TIME);
    expect(saves.load()).toMatchObject({ ok: true, status: 'loaded', save: result.save });
  });

  it('recovers a valid backup without overwriting corrupt primary data', () => {
    const storage = new MemoryStorage();
    const good = serializeSave(saveFixture());
    storage.setItem(SAVE_STORAGE_KEY, '{broken');
    storage.setItem(SAVE_BACKUP_KEY, good);
    const saves = new Save({ storage, clock: () => SECOND_TIME });

    const result = saves.load();
    expect(result).toMatchObject({
      ok: true,
      status: 'recovered-backup',
      save: createSaveV2({ now: FIRST_TIME, appVersion: 'abc1234', worldSeed: 42 }),
    });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe('{broken');
  });

  it('reports read failures and rolls back failed writes', () => {
    const storage = new MemoryStorage();
    const first = serializeSave(saveFixture());
    storage.setItem(SAVE_STORAGE_KEY, first);
    const saves = new Save({ storage, clock: () => SECOND_TIME });

    storage.failNextWrite = true;
    expect(saves.write(saveFixture())).toMatchObject({ ok: false, status: 'storage-error' });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(first);

    storage.failRead = true;
    expect(saves.load()).toMatchObject({ ok: false, status: 'storage-error', save: null });
  });

  it('queues debounced writes and keeps a failed pending save available to retry', () => {
    const storage = new MemoryStorage();
    const timers = [];
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: (callback) => { timers.push(callback); return timers.length; },
      clearTimer: () => {},
    });
    const save = saveFixture();
    expect(saves.queue(save)).toMatchObject({ ok: true, status: 'queued' });

    storage.failNextWrite = true;
    expect(saves.flush()).toMatchObject({ ok: false, status: 'storage-error' });
    expect(saves.pending).toEqual({
      ...createSaveV2({ now: FIRST_TIME, appVersion: 'abc1234', worldSeed: 42 }),
      updatedAt: SECOND_TIME,
    });
    expect(saves.flush()).toMatchObject({ ok: true, status: 'saved' });
    expect(saves.pending).toBeNull();
  });

  it('cancels an older queued snapshot when a newer save is written synchronously', () => {
    const storage = new MemoryStorage();
    let queuedCallback;
    const cancelledTimers = [];
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: (callback) => { queuedCallback = callback; return 31; },
      clearTimer: (timer) => cancelledTimers.push(timer),
    });
    const queued = saveFixture();
    queued.progress.storyChoices.checkpoint = 'queued';
    const latest = saveFixture();
    latest.progress.storyChoices.checkpoint = 'latest';

    saves.queue(queued);
    const result = saves.write(latest);

    expect(result).toMatchObject({ ok: true, status: 'saved' });
    expect(cancelledTimers).toEqual([31]);
    expect(saves.pending).toBeNull();
    expect(saves.timer).toBeNull();

    queuedCallback();
    expect(saves.load().save.progress.storyChoices.checkpoint).toBe('latest');
  });

  it('retains a failed synchronous write as the newest state to retry', () => {
    const storage = new MemoryStorage();
    let queuedCallback;
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: (callback) => { queuedCallback = callback; return 37; },
      clearTimer: () => {},
    });
    const queued = saveFixture();
    queued.progress.storyChoices.checkpoint = 'queued';
    const latest = saveFixture();
    latest.progress.storyChoices.checkpoint = 'latest';
    saves.queue(queued);

    storage.failNextWrite = true;
    expect(saves.write(latest)).toMatchObject({ ok: false, status: 'storage-error' });
    expect(saves.pending.progress.storyChoices.checkpoint).toBe('latest');
    expect(saves.pending.updatedAt).toBe(SECOND_TIME);

    queuedCallback();
    expect(saves.pending).toBeNull();
    expect(saves.load().save.progress.storyChoices.checkpoint).toBe('latest');
  });

  it('queues autosave only when a flag actually changes', () => {
    const storage = new MemoryStorage();
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: () => 1,
      clearTimer: () => {},
    });
    const save = saveFixture();
    expect(saves.setFlag(save, 'ch1.letterOpened')).toBe(true);
    expect(saves.pending.progress.questFlags['ch1.letterOpened']).toBe(true);
    expect(saves.flush()).toMatchObject({ ok: true, status: 'saved' });
    expect(saves.setFlag(save, 'ch1.letterOpened')).toBe(false);
    expect(saves.pending).toBeNull();
  });

  it('backs up the current device save before importing a valid replacement', () => {
    const storage = new MemoryStorage();
    const current = saveFixture();
    current.progress.storyChoices.transfer = 'current-device';
    const replacement = saveFixture();
    replacement.progress.storyChoices.transfer = 'replacement';
    const currentRaw = serializeSave(current);
    storage.setItem(SAVE_STORAGE_KEY, currentRaw);
    const saves = new Save({ storage, clock: () => SECOND_TIME });

    const result = saves.import(serializeSave(replacement));

    expect(result).toMatchObject({
      ok: true,
      status: 'imported',
      backupStatus: 'backed-up',
    });
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe(currentRaw);
    expect(saves.load().save.progress.storyChoices.transfer).toBe('replacement');
  });

  it('flushes pending progress into the backup before replacing the device save', () => {
    const storage = new MemoryStorage();
    const persisted = saveFixture();
    persisted.progress.storyChoices.transfer = 'older-persisted-progress';
    storage.setItem(SAVE_STORAGE_KEY, serializeSave(persisted));
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: () => 43,
      clearTimer: () => {},
    });
    const pending = saveFixture();
    pending.progress.storyChoices.transfer = 'latest-pending-progress';
    saves.queue(pending);
    const replacement = saveFixture();
    replacement.progress.storyChoices.transfer = 'replacement';

    const result = saves.import(serializeSave(replacement));

    expect(result).toMatchObject({
      ok: true,
      status: 'imported',
      backupStatus: 'backed-up',
      flushStatus: 'saved',
    });
    expect(parseSave(storage.getItem(SAVE_BACKUP_KEY)).progress.storyChoices.transfer)
      .toBe('latest-pending-progress');
    expect(saves.pending).toBeNull();
    expect(saves.timer).toBeNull();
  });

  it('does not mutate storage or queued progress when imported text is invalid', () => {
    const storage = new MemoryStorage();
    const primaryRaw = serializeSave(saveFixture());
    const backup = saveFixture();
    backup.progress.storyChoices.transfer = 'existing-backup';
    const backupRaw = serializeSave(backup);
    storage.setItem(SAVE_STORAGE_KEY, primaryRaw);
    storage.setItem(SAVE_BACKUP_KEY, backupRaw);
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: () => 41,
      clearTimer: () => {},
    });
    const queued = saveFixture();
    queued.progress.storyChoices.transfer = 'still-pending';
    saves.queue(queued);

    const result = saves.import('{"schemaVersion":1');

    expect(result).toMatchObject({ ok: false, status: 'invalid-import', save: null });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(primaryRaw);
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe(backupRaw);
    expect(saves.pending.progress.storyChoices.transfer).toBe('still-pending');
    expect(saves.timer).toBe(41);
  });

  it('leaves the current save untouched when its pre-import backup cannot be written', () => {
    const storage = new MemoryStorage();
    const currentRaw = serializeSave(saveFixture());
    storage.setItem(SAVE_STORAGE_KEY, currentRaw);
    const setItem = storage.setItem.bind(storage);
    storage.setItem = (key, value) => {
      if (key === SAVE_BACKUP_KEY) throw new Error('backup write denied');
      setItem(key, value);
    };
    const replacement = saveFixture();
    replacement.progress.storyChoices.transfer = 'must-not-land';
    const saves = new Save({ storage, clock: () => SECOND_TIME });

    const result = saves.import(serializeSave(replacement));

    expect(result).toMatchObject({ ok: false, status: 'backup-error', save: null });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(currentRaw);
  });

  it('does not retry a replacement later when the confirmed import write fails', () => {
    const storage = new MemoryStorage();
    const currentRaw = serializeSave(saveFixture());
    storage.setItem(SAVE_STORAGE_KEY, currentRaw);
    const setItem = storage.setItem.bind(storage);
    let failReplacement = true;
    storage.setItem = (key, value) => {
      if (key === SAVE_STORAGE_KEY && failReplacement) {
        failReplacement = false;
        throw new Error('replacement write denied');
      }
      setItem(key, value);
    };
    const replacement = saveFixture();
    replacement.progress.storyChoices.transfer = 'failed-replacement';
    const saves = new Save({ storage, clock: () => SECOND_TIME });

    const result = saves.import(serializeSave(replacement));

    expect(result).toMatchObject({ ok: false, status: 'storage-error', save: null });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(currentRaw);
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBe(currentRaw);
    expect(saves.pending).toBeNull();
    expect(saves.destroy()).toMatchObject({ ok: true, status: 'idle' });
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe(currentRaw);
  });

  it('clears primary and backup saves without letting a queued autosave resurrect them', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, serializeSave(saveFixture()));
    storage.setItem(SAVE_BACKUP_KEY, serializeSave(saveFixture()));
    let queuedCallback;
    const cancelledTimers = [];
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: (callback) => { queuedCallback = callback; return 17; },
      clearTimer: (timer) => cancelledTimers.push(timer),
    });
    saves.queue(saveFixture());

    expect(saves.clear()).toEqual({ ok: true, status: 'cleared', save: null });
    expect(cancelledTimers).toEqual([17]);
    expect(saves.pending).toBeNull();
    expect(saves.timer).toBeNull();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBeNull();

    queuedCallback();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBeNull();
  });

  it('still clears queued state and attempts both removals when storage denies one key', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, serializeSave(saveFixture()));
    storage.setItem(SAVE_BACKUP_KEY, serializeSave(saveFixture()));
    const removeItem = storage.removeItem.bind(storage);
    storage.removeItem = (key) => {
      if (key === SAVE_STORAGE_KEY) throw new Error('primary removal denied');
      removeItem(key);
    };
    let queuedCallback;
    const saves = new Save({
      storage,
      clock: () => SECOND_TIME,
      setTimer: (callback) => { queuedCallback = callback; return 23; },
      clearTimer: () => {},
    });
    saves.queue(saveFixture());

    const result = saves.clear();
    expect(result).toMatchObject({
      ok: false,
      status: 'storage-error',
      errors: [{ operation: 'remove-primary' }],
    });
    expect(saves.pending).toBeNull();
    expect(saves.timer).toBeNull();
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBeNull();

    queuedCallback();
    expect(storage.getItem(SAVE_BACKUP_KEY)).toBeNull();
  });
});
