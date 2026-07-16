import { describe, expect, it } from 'vitest';
import { validateSaveV1 } from '../src/game/systems/Save.js';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  SAVE_MIGRATIONS,
  SAVE_V2_RECEIPT_FIELDS,
  SaveMigrationError,
  migrateSave,
  migrateSaveV1ToV2,
  resumeMatchesRedirect,
  validateSaveV2MigrationFields,
} from '../src/game/systems/SaveMigrations.js';
import {
  LEGACY_SAVE_FIXTURES,
  cloneLegacySaveFixture,
} from './fixtures/saveFixtures.js';

const LEGACY_CHAPTER_TWO_PREVIEW = Object.freeze({
  chapter: 'ch2',
  scene: 'ch2.placeholder',
  room: 'ch2.previewRoom',
});

const CHAPTER_TWO_OPENING = Object.freeze({
  chapter: 'ch2',
  scene: 'ch2.scene.kingsCrossArrival',
  room: 'ch2.kingsCross',
  spawn: 'start',
});

const CHAPTER_TWO_REDIRECT = Object.freeze({
  from: LEGACY_CHAPTER_TWO_PREVIEW,
  to: CHAPTER_TWO_OPENING,
});

function projectV2ToV1(save) {
  const projection = structuredClone(save);
  projection.schemaVersion = 1;
  for (const field of SAVE_V2_RECEIPT_FIELDS) delete projection.progress[field];
  return projection;
}

function validateVersion(save, version) {
  if (version === 1) validateSaveV1(save);
  else {
    validateSaveV2MigrationFields(save);
    validateSaveV1(projectV2ToV1(save));
  }
}

function migrationOptions(overrides = {}) {
  return {
    resumeRedirects: [CHAPTER_TWO_REDIRECT],
    validateVersion,
    ...overrides,
  };
}

function expectedV2(fixture) {
  const expected = structuredClone(fixture);
  expected.schemaVersion = 2;
  expected.progress.storyReceipts = [];
  expected.progress.questReceipts = [];
  expected.progress.checkpointReceipts = [];
  return expected;
}

describe('save schema migrations', () => {
  it('registers one ordered version step to the current schema', () => {
    expect(CURRENT_SAVE_SCHEMA_VERSION).toBe(2);
    expect(SAVE_MIGRATIONS.map(({ fromVersion, toVersion }) => [fromVersion, toVersion]))
      .toEqual([[1, 2]]);
  });

  it('preserves every version-1 field in fresh, mid, and completed Chapter One saves', () => {
    for (const fixtureId of ['freshChapterOne', 'midChapterOne', 'completedChapterOne']) {
      const fixture = LEGACY_SAVE_FIXTURES[fixtureId];
      const before = structuredClone(fixture);
      const migrated = migrateSave(fixture, migrationOptions());

      expect(migrated).toEqual(expectedV2(fixture));
      expect(validateSaveV2MigrationFields(migrated)).toBe(migrated);
      expect(fixture).toEqual(before);
      expect(Object.isFrozen(fixture)).toBe(true);
    }
  });

  it('moves the retired Chapter Two preview to the injected real opening', () => {
    const fixture = LEGACY_SAVE_FIXTURES.chapterTwoPreview;
    const migrated = migrateSave(fixture, migrationOptions());
    const expected = expectedV2(fixture);
    expected.resume = structuredClone(CHAPTER_TWO_OPENING);

    expect(migrated).toEqual(expected);
    expect(fixture.resume).toEqual({ ...LEGACY_CHAPTER_TWO_PREVIEW, spawn: 'start' });
  });

  it('recognizes either retired preview marker only within the redirect chapter', () => {
    const byScene = cloneLegacySaveFixture('chapterTwoPreview');
    byScene.resume.room = 'ch2.someOtherRoom';
    const byRoom = cloneLegacySaveFixture('chapterTwoPreview');
    byRoom.resume.scene = 'ch2.someOtherScene';
    const chapterOne = cloneLegacySaveFixture('completedChapterOne');
    chapterOne.resume.scene = 'ch2.placeholder';
    chapterOne.resume.room = 'ch2.previewRoom';

    expect(resumeMatchesRedirect(byScene.resume, CHAPTER_TWO_REDIRECT)).toBe(true);
    expect(resumeMatchesRedirect(byRoom.resume, CHAPTER_TWO_REDIRECT)).toBe(true);
    expect(resumeMatchesRedirect(chapterOne.resume, CHAPTER_TWO_REDIRECT)).toBe(false);
    expect(migrateSave(byScene, migrationOptions()).resume).toEqual(CHAPTER_TWO_OPENING);
    expect(migrateSave(byRoom, migrationOptions()).resume).toEqual(CHAPTER_TWO_OPENING);
    expect(migrateSave(chapterOne, migrationOptions()).resume).toEqual(chapterOne.resume);
  });

  it('does not redirect an already real Chapter Two position', () => {
    const save = cloneLegacySaveFixture('chapterTwoPreview');
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.trainCompartment',
      room: 'ch2.trainCompartment',
      spawn: 'door',
    };

    expect(migrateSave(save, migrationOptions()).resume).toEqual(save.resume);
  });

  it('requires a valid chapter-owned redirect for every version-1 migration', () => {
    expect(() => migrateSave(LEGACY_SAVE_FIXTURES.freshChapterOne))
      .toThrow(/resumeRedirects.*at least one chapter-owned redirect/);
    expect(() => migrateSave(LEGACY_SAVE_FIXTURES.chapterTwoPreview, migrationOptions({
      resumeRedirects: [{
        from: LEGACY_CHAPTER_TWO_PREVIEW,
        to: { ...CHAPTER_TWO_OPENING, chapter: 'ch1' },
      }],
    }))).toThrow(/to.chapter.*must be ch2/);
    expect(() => migrateSave(LEGACY_SAVE_FIXTURES.chapterTwoPreview, migrationOptions({
      resumeRedirects: [{
        from: LEGACY_CHAPTER_TWO_PREVIEW,
        to: { ...CHAPTER_TWO_OPENING, room: 'ch1.bedroom' },
      }],
    }))).toThrow(/to.room.*must belong to ch2/);
  });

  it('is idempotent and returns an independent current-schema value', () => {
    const first = migrateSave(LEGACY_SAVE_FIXTURES.chapterTwoPreview, migrationOptions());
    first.progress.storyReceipts.push('ch2.story.barrierCrossed');
    first.progress.questReceipts.push('ch2.quest.boardTrain');
    first.progress.checkpointReceipts.push('ch2.checkpoint.platformArrival');

    const second = migrateSave(first, migrationOptions({
      resumeRedirects: [{
        from: LEGACY_CHAPTER_TWO_PREVIEW,
        to: {
          chapter: 'ch2',
          scene: 'ch2.scene.shouldNotReplaceCurrentSave',
          room: 'ch2.shouldNotReplaceCurrentSave',
          spawn: 'start',
        },
      }],
    }));

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.progress).not.toBe(first.progress);
  });

  it('validates receipt buckets as unique chapter-namespaced ids', () => {
    const save = migrateSave(LEGACY_SAVE_FIXTURES.freshChapterOne, migrationOptions());
    save.progress.storyReceipts.push('ch2.story.barrierCrossed');
    save.progress.questReceipts.push('ch2.quest.boardTrain');
    save.progress.checkpointReceipts.push('ch2.checkpoint.platformArrival');
    expect(validateSaveV2MigrationFields(save)).toBe(save);

    const duplicate = structuredClone(save);
    duplicate.progress.storyReceipts.push('ch2.story.barrierCrossed');
    expect(() => validateSaveV2MigrationFields(duplicate))
      .toThrow(/storyReceipts\[1\].*must be unique/);

    const unscoped = structuredClone(save);
    unscoped.progress.questReceipts = ['boardTrain'];
    expect(() => validateSaveV2MigrationFields(unscoped))
      .toThrow(/questReceipts\[0\].*chapter-namespaced/);

    const missing = structuredClone(save);
    delete missing.progress.checkpointReceipts;
    expect(() => validateSaveV2MigrationFields(missing))
      .toThrow(/checkpointReceipts.*is required/);
  });

  it('rejects invalid inputs, unsupported future saves, and invalid source saves', () => {
    expect(() => migrateSave(null)).toThrow(SaveMigrationError);
    expect(() => migrateSave({ schemaVersion: 3 })).toThrow(/newer than supported/);

    const invalidV1 = cloneLegacySaveFixture('freshChapterOne');
    invalidV1.resume.chapter = 'ch9';
    expect(() => migrateSaveV1ToV2(invalidV1, migrationOptions()))
      .toThrow(/cannot exceed highestUnlockedChapter/);
  });

  it('lets Save.js inject full validation without introducing an import cycle', () => {
    const calls = [];
    const migrated = migrateSave(LEGACY_SAVE_FIXTURES.freshChapterOne, migrationOptions({
      validateVersion: (save, version) => {
        calls.push([save.schemaVersion, version]);
        validateVersion(save, version);
      },
    }));

    expect(calls).toEqual([[1, 1], [2, 2], [2, 2]]);
    expect(migrated.schemaVersion).toBe(2);
  });
});
