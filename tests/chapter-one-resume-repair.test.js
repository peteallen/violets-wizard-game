import { describe, expect, it } from 'vitest';
import { saveMigrationOptions } from '../src/game/chapters/saveMigrations.js';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV3 } from '../src/game/systems/Save.js';
import { migrateSave } from '../src/game/systems/SaveMigrations.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-17T04:00:00.000Z';

describe('Chapter One resume repair', () => {
  it('turns a stranded Diagon Alley ticket checkpoint into the chapter exit', () => {
    const stranded = createSaveV3({ now: NOW, appVersion: 'resume-repair-test', worldSeed: 42 });
    Object.assign(stranded.progress.questFlags, {
      'ch1.wandChosen': true,
      'ch1.trimChosen': true,
      'ch1.petChosen': true,
      'ch1.petNamed': true,
      'ch1.shoppingComplete': true,
      'ch1.ticketReceived': true,
    });
    stranded.character.wandId = 'violet-first-wand';
    stranded.character.appearance.robeTrim = 'purple';
    stranded.character.pet = { type: 'cat', name: 'Biscuit' };
    stranded.resume = {
      chapter: 'ch1',
      scene: 'ch1.ticket',
      room: 'ch1.diagonStreet',
      spawn: 'east',
      dialogue: null,
    };

    const repaired = migrateSave(stranded, saveMigrationOptions);
    const world = new World({ chapters: contentRegistry, save: repaired, seed: 42, clock: () => NOW });

    expect(world.roomId).toBe('ch1.chapterCardRoom');
    expect(world.currentSceneId).toBe('ch1.chapterCard');
    expect(world.setPieces.active?.requestedId).toBe('sp.chapterCard');

    world.update(10);
    expect(world.dialogue.scriptId).toBe('ch1.narrator.chapterEnd');
    world.advanceDialogue();

    expect(world.chapter.id).toBe('ch2');
    expect(world.roomId).toBe('ch2.kingsCross');
    expect(repaired.progress.completedChapters).toContain('ch1');
    expect(repaired.character).toMatchObject({
      wandId: 'violet-first-wand',
      appearance: { robeTrim: 'purple' },
      pet: { type: 'cat', name: 'Biscuit' },
    });
  });
});
