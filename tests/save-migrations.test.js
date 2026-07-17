import { describe, expect, it } from 'vitest';
import {
  validateSaveV1,
  validateSaveV2,
  validateSaveV3,
} from '../src/game/systems/Save.js';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  SAVE_MIGRATIONS,
  SAVE_V2_RECEIPT_FIELDS,
  SaveMigrationError,
  migrateSave,
  migrateSaveV1ToV2,
  migrateSaveV2ToV3,
  resumeMatchesCompletionRedirect,
  resumeMatchesRedirect,
  validateSaveV2MigrationFields,
  validateSaveV3MigrationFields,
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

const CHAPTER_TWO_END = Object.freeze({
  chapter: 'ch2',
  scene: 'ch2.scene.chapterCard',
  room: 'ch2.chapterCardRoom',
});

const CHAPTER_THREE_START = Object.freeze({
  chapter: 'ch3',
  scene: 'ch3.scene.preview',
  room: 'ch3.previewRoom',
  spawn: 'start',
});

const CHAPTER_TWO_COMPLETION_REDIRECT = Object.freeze({
  from: CHAPTER_TWO_END,
  to: CHAPTER_THREE_START,
});

function validateVersion(save, version) {
  if (version === 1) validateSaveV1(save);
  else if (version === 2) validateSaveV2(save);
  else if (version === 3) validateSaveV3(save);
  else throw new Error(`Unexpected schema v${version}`);
}

function migrationOptions(overrides = {}) {
  return {
    resumeRedirects: [CHAPTER_TWO_REDIRECT],
    completionRedirects: [CHAPTER_TWO_COMPLETION_REDIRECT],
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

function expectedV3(fixture) {
  const expected = expectedV2(fixture);
  expected.schemaVersion = 3;
  expected.resume.dialogue = null;
  return expected;
}

function completedChapterTwoV2() {
  const save = expectedV2(LEGACY_SAVE_FIXTURES.chapterTwoPreview);
  save.progress.highestUnlockedChapter = 3;
  save.progress.completedChapters = ['ch1', 'ch2'];
  save.progress.questFlags['ch2.complete'] = true;
  save.resume = { ...CHAPTER_TWO_END, spawn: 'start' };
  return save;
}

describe('save schema migrations', () => {
  it('registers both ordered version steps to schema three', () => {
    expect(CURRENT_SAVE_SCHEMA_VERSION).toBe(3);
    expect(SAVE_MIGRATIONS.map(({ fromVersion, toVersion }) => [fromVersion, toVersion]))
      .toEqual([[1, 2], [2, 3]]);
  });

  it('migrates version one through version three without changing existing durable state', () => {
    for (const fixtureId of ['freshChapterOne', 'midChapterOne', 'completedChapterOne']) {
      const fixture = LEGACY_SAVE_FIXTURES[fixtureId];
      const before = structuredClone(fixture);
      const migrated = migrateSave(fixture, migrationOptions());

      expect(migrated).toEqual(expectedV3(fixture));
      expect(validateSaveV3MigrationFields(migrated)).toBe(migrated);
      expect(validateSaveV3(migrated)).toBe(migrated);
      expect(fixture).toEqual(before);
      expect(Object.isFrozen(fixture)).toBe(true);
    }
  });

  it('migrates version two directly and byte-preserves every existing receipt bucket', () => {
    const save = expectedV2(LEGACY_SAVE_FIXTURES.completedChapterOne);
    save.progress.rewardReceipts = ['ch1.reward.wand', 'ch1.reward.ticket'];
    save.progress.storyReceipts = ['ch1.story.wall', 'ch1.story.platform'];
    save.progress.questReceipts = ['ch1.quest.shopping', 'ch1.quest.train'];
    save.progress.checkpointReceipts = ['ch1.checkpoint.wand', 'ch1.checkpoint.platform'];
    const before = structuredClone(save);

    const migrated = migrateSaveV2ToV3(save, migrationOptions());

    expect(migrated).toEqual({
      ...save,
      schemaVersion: 3,
      resume: { ...save.resume, dialogue: null },
    });
    for (const field of ['rewardReceipts', ...SAVE_V2_RECEIPT_FIELDS]) {
      expect(JSON.stringify(migrated.progress[field])).toBe(JSON.stringify(save.progress[field]));
    }
    expect(save).toEqual(before);
  });

  it('keeps the version-one same-chapter preview repair before adding v3 dialogue state', () => {
    const fixture = LEGACY_SAVE_FIXTURES.chapterTwoPreview;
    const migrated = migrateSave(fixture, migrationOptions());
    const expected = expectedV3(fixture);
    expected.resume = { ...CHAPTER_TWO_OPENING, dialogue: null };

    expect(migrated).toEqual(expected);
    expect(fixture.resume).toEqual({ ...LEGACY_CHAPTER_TWO_PREVIEW, spawn: 'start' });
  });

  it('recognizes either retired preview marker only within the same chapter', () => {
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
    expect(migrateSave(byScene, migrationOptions()).resume)
      .toEqual({ ...CHAPTER_TWO_OPENING, dialogue: null });
    expect(migrateSave(byRoom, migrationOptions()).resume)
      .toEqual({ ...CHAPTER_TWO_OPENING, dialogue: null });
    expect(migrateSave(chapterOne, migrationOptions()).resume)
      .toEqual({ ...chapterOne.resume, dialogue: null });
  });

  it('repairs a completed Chapter Two save stranded on either end marker', () => {
    const byBoth = completedChapterTwoV2();
    const byScene = completedChapterTwoV2();
    byScene.resume.room = 'ch2.someOtherRoom';
    const byRoom = completedChapterTwoV2();
    byRoom.resume.scene = 'ch2.scene.someOtherScene';

    for (const save of [byBoth, byScene, byRoom]) {
      expect(resumeMatchesCompletionRedirect(save, CHAPTER_TWO_COMPLETION_REDIRECT)).toBe(true);
      expect(migrateSaveV2ToV3(save, migrationOptions()).resume)
        .toEqual({ ...CHAPTER_THREE_START, dialogue: null });
    }
  });

  it('does not cross chapters unless Chapter Two is complete and the resume is stranded', () => {
    const incomplete = completedChapterTwoV2();
    incomplete.progress.completedChapters = ['ch1'];
    delete incomplete.progress.questFlags['ch2.complete'];
    const elsewhere = completedChapterTwoV2();
    elsewhere.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.commonRoomArrival',
      room: 'ch2.gryffindorCommonRoom',
      spawn: 'portraitDoor',
    };
    const otherChapter = completedChapterTwoV2();
    otherChapter.resume = {
      chapter: 'ch1',
      scene: CHAPTER_TWO_END.scene,
      room: CHAPTER_TWO_END.room,
      spawn: 'start',
    };

    expect(migrateSaveV2ToV3(incomplete, migrationOptions()).resume)
      .toEqual({ ...incomplete.resume, dialogue: null });
    expect(migrateSaveV2ToV3(elsewhere, migrationOptions()).resume)
      .toEqual({ ...elsewhere.resume, dialogue: null });
    expect(migrateSaveV2ToV3(otherChapter, migrationOptions()).resume)
      .toEqual({ ...otherChapter.resume, dialogue: null });
  });

  it('keeps same-chapter and completion redirect contracts strict and separate', () => {
    expect(() => migrateSaveV1ToV2(LEGACY_SAVE_FIXTURES.chapterTwoPreview, migrationOptions({
      resumeRedirects: [{
        from: LEGACY_CHAPTER_TWO_PREVIEW,
        to: { ...CHAPTER_TWO_OPENING, chapter: 'ch3' },
      }],
    }))).toThrow(/to.chapter.*must be ch2/);

    const save = completedChapterTwoV2();
    expect(() => migrateSaveV2ToV3(save, migrationOptions({
      completionRedirects: [{
        from: CHAPTER_TWO_END,
        to: { ...CHAPTER_TWO_OPENING },
      }],
    }))).toThrow(/to.chapter.*different chapter/);
    expect(() => migrateSaveV2ToV3(save, migrationOptions({
      completionRedirects: [{
        from: CHAPTER_TWO_END,
        to: { ...CHAPTER_THREE_START, room: 'ch2.chapterCardRoom' },
      }],
    }))).toThrow(/to.room.*must belong to ch3/);
    expect(() => migrateSaveV2ToV3(save, migrationOptions({
      completionRedirects: [{
        from: { ...CHAPTER_TWO_END, extra: true },
        to: CHAPTER_THREE_START,
      }],
    }))).toThrow(/from.extra.*not supported/);
  });

  it('rejects ambiguous completion repairs', () => {
    const save = completedChapterTwoV2();
    expect(() => migrateSaveV2ToV3(save, migrationOptions({
      completionRedirects: [
        CHAPTER_TWO_COMPLETION_REDIRECT,
        {
          from: { ...CHAPTER_TWO_END, room: 'ch2.anotherRoom' },
          to: CHAPTER_THREE_START,
        },
      ],
    }))).toThrow(/more than one redirect/);
  });

  it('is idempotent and returns an independent current-schema value', () => {
    const first = migrateSave(LEGACY_SAVE_FIXTURES.chapterTwoPreview, migrationOptions());
    first.progress.storyReceipts.push('ch2.story.barrierCrossed');
    first.progress.questReceipts.push('ch2.quest.boardTrain');
    first.progress.checkpointReceipts.push('ch2.checkpoint.platformArrival');
    first.resume.dialogue = { script: 'ch2.dialogue.platformWelcome', node: 'welcome' };

    const second = migrateSave(first, migrationOptions({
      completionRedirects: [{
        from: CHAPTER_TWO_END,
        to: CHAPTER_THREE_START,
      }],
    }));

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.progress).not.toBe(first.progress);
    expect(second.resume.dialogue).not.toBe(first.resume.dialogue);
  });

  it('pins migration-field validation to the exact v2 and v3 envelopes', () => {
    const v2 = expectedV2(LEGACY_SAVE_FIXTURES.freshChapterOne);
    const v3 = expectedV3(LEGACY_SAVE_FIXTURES.freshChapterOne);
    expect(validateSaveV2MigrationFields(v2)).toBe(v2);
    expect(validateSaveV3MigrationFields(v3)).toBe(v3);
    expect(() => validateSaveV2MigrationFields(v3)).toThrow(/schemaVersion.*must be 2/);
    expect(() => validateSaveV3MigrationFields(v2)).toThrow(/schemaVersion.*must be 3/);

    const malformedDialogue = structuredClone(v3);
    malformedDialogue.resume.dialogue = { script: 'ch1.letter.read', node: 'open', extra: true };
    expect(() => validateSaveV3MigrationFields(malformedDialogue))
      .toThrow(/dialogue.extra.*not supported/);
  });

  it('still validates receipt buckets as unique chapter-namespaced ids', () => {
    const save = expectedV2(LEGACY_SAVE_FIXTURES.freshChapterOne);
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
  });

  it('rejects invalid inputs, version four, and invalid source saves', () => {
    expect(() => migrateSave(null)).toThrow(SaveMigrationError);
    expect(() => migrateSave({ schemaVersion: 4 })).toThrow(/newer than supported schema v3/);

    const invalidV1 = cloneLegacySaveFixture('freshChapterOne');
    invalidV1.resume.chapter = 'ch9';
    expect(() => migrateSaveV1ToV2(invalidV1, migrationOptions()))
      .toThrow(/cannot exceed highestUnlockedChapter/);

    const invalidV2 = expectedV2(LEGACY_SAVE_FIXTURES.freshChapterOne);
    invalidV2.resume.dialogue = null;
    expect(() => migrateSaveV2ToV3(invalidV2, migrationOptions()))
      .toThrow(/resume.dialogue.*not part of this save schema/);
  });

  it('runs full injected validation at every source, intermediate, and final boundary', () => {
    const calls = [];
    const migrated = migrateSave(LEGACY_SAVE_FIXTURES.freshChapterOne, migrationOptions({
      validateVersion: (save, version) => {
        calls.push([save.schemaVersion, version]);
        validateVersion(save, version);
      },
    }));

    expect(calls).toEqual([[1, 1], [2, 2], [2, 2], [3, 3], [3, 3]]);
    expect(migrated.schemaVersion).toBe(3);
  });
});
