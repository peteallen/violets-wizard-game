import { describe, expect, it } from 'vitest';
import {
  SAVE_BACKUP_KEY,
  SAVE_STORAGE_KEY,
  Save,
  SaveValidationError,
  createSaveV1,
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
    expect(result).toMatchObject({ ok: true, status: 'recovered-backup', save: saveFixture() });
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
    expect(saves.pending).toEqual(save);
    expect(saves.flush()).toMatchObject({ ok: true, status: 'saved' });
    expect(saves.pending).toBeNull();
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
});
