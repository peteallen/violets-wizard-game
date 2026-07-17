import { describe, expect, it } from 'vitest';
import { saveMigrationOptions } from '../src/game/chapters/saveMigrations.js';
import { createSaveV3 } from '../src/game/systems/Save.js';
import { migrateSave } from '../src/game/systems/SaveMigrations.js';

const NOW = '2026-07-17T20:00:00.000Z';

function currentSave() {
  const save = createSaveV3({ now: NOW, worldSeed: 42 });
  save.progress.highestUnlockedChapter = 3;
  save.progress.completedChapters = ['ch1', 'ch2'];
  save.progress.questFlags['ch1.complete'] = true;
  save.progress.questFlags['ch2.complete'] = true;
  return save;
}

describe('Chapter Three current-save repairs', () => {
  it('moves the retired Chapter Three preview to the real spellbook opening without changing progress', () => {
    const save = currentSave();
    save.resume = {
      chapter: 'ch3',
      scene: 'ch3.scene.preview',
      room: 'ch3.previewRoom',
      spawn: 'start',
      dialogue: null,
    };
    const before = structuredClone(save);

    const repaired = migrateSave(save, saveMigrationOptions);

    expect(repaired.resume).toEqual({
      chapter: 'ch3',
      scene: 'ch3.scene.spellbookParcel',
      room: 'ch3.commonRoom',
      spawn: 'parcel',
      dialogue: null,
    });
    expect(repaired.progress).toEqual(save.progress);
    expect(save).toEqual(before);
  });

  it('moves a completed Chapter Three end marker to the registered Chapter Four preview', () => {
    const save = currentSave();
    save.progress.highestUnlockedChapter = 4;
    save.progress.completedChapters.push('ch3');
    save.progress.questFlags['ch3.complete'] = true;
    save.resume = {
      chapter: 'ch3',
      scene: 'ch3.scene.chapterClose',
      room: 'ch3.commonRoom',
      spawn: 'close',
      dialogue: null,
    };

    const repaired = migrateSave(save, saveMigrationOptions);

    expect(repaired.resume).toEqual({
      chapter: 'ch4',
      scene: 'ch4.scene.preview',
      room: 'ch4.previewRoom',
      spawn: 'start',
      dialogue: null,
    });
    expect(repaired.progress).toEqual(save.progress);
  });

  it('leaves a valid Chapter Three corridor checkpoint untouched and stays idempotent', () => {
    const save = currentSave();
    Object.assign(save.progress.questFlags, {
      'ch3.spellbookOpened': true,
      'ch3.lumosLearned': true,
      'ch3.lumosProved': true,
      'ch3.leviosaLearned': true,
      'ch3.toadQuestAccepted': true,
      'ch3.trailFound': true,
    });
    save.resume = {
      chapter: 'ch3',
      scene: 'ch3.scene.corridorTwo',
      room: 'ch3.corridorTwo',
      spawn: 'map',
      dialogue: null,
    };

    const first = migrateSave(save, saveMigrationOptions);
    const second = migrateSave(first, saveMigrationOptions);

    expect(first.resume).toEqual(save.resume);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});
