import { describe, expect, it, vi } from 'vitest';
import { Game, selectChapter1ResumeRecap } from '../src/game/Game.js';
import { chapter1ResumeRecaps } from '../src/game/content/chapters/ch1.js';
import { createSaveV1 } from '../src/game/systems/Save.js';

const NOW = '2026-07-12T18:00:00.000Z';

function saveWithFlags(...flags) {
  const save = createSaveV1({ now: NOW, worldSeed: 42 });
  for (const flag of flags) save.progress.questFlags[flag] = true;
  return save;
}

function adventureStub(save, hasStoredSave = true) {
  const game = Object.create(Game.prototype);
  game.sessionGeneration = 0;
  game.destroyed = false;
  game.hasStoredSave = hasStoredSave;
  game.saveData = save;
  game.resumeRecap = null;
  game.sound = {
    unlock: vi.fn().mockResolvedValue(undefined),
    speak: vi.fn(),
    playSfx: vi.fn(),
  };
  game.particles = { emit: vi.fn() };
  game.createWorld = vi.fn();
  game.updateStatus = vi.fn();
  return game;
}

describe('Chapter 1 resume recaps', () => {
  it('selects the latest useful recap from durable progress rather than the saved room', () => {
    const stages = [
      [[], 'openLetter'],
      [['ch1.letterRead'], 'followGuide'],
      [['ch1.letterRead', 'ch1.wallOpened'], 'useMap'],
      [['ch1.wandChosen'], 'chooseRobes'],
      [['ch1.trimChosen'], 'choosePet'],
      [['ch1.petNamed'], 'returnToGuide'],
    ];

    for (const [flags, expectedStep] of stages) {
      const save = saveWithFlags(...flags);
      save.resume.room = 'ch1.bedroom';
      expect(selectChapter1ResumeRecap(save)?.step).toBe(expectedStep);
    }

    expect(selectChapter1ResumeRecap(saveWithFlags('ch1.ticketReceived'))).toBeNull();
    const chapterTwo = saveWithFlags('ch1.petNamed');
    chapterTwo.resume.chapter = 'ch2';
    expect(selectChapter1ResumeRecap(chapterTwo)).toBeNull();
  });

  it('voices one recap when a stored Chapter 1 adventure is continued, but not on a fresh start', async () => {
    const stored = adventureStub(saveWithFlags('ch1.wandChosen'));
    await stored.startAdventure();

    const expected = chapter1ResumeRecaps.find((recap) => recap.step === 'chooseRobes');
    expect(stored.createWorld).toHaveBeenCalledOnce();
    expect(stored.resumeRecap).toBe(expected);
    expect(stored.sound.speak).toHaveBeenCalledWith(expected.voice, expected.text);
    expect(stored.sound.playSfx).not.toHaveBeenCalledWith('sfx/ch1/sealCrack', 'flourish');

    const fresh = adventureStub(saveWithFlags(), false);
    await fresh.startAdventure();
    expect(fresh.resumeRecap).toBeNull();
    expect(fresh.sound.speak).not.toHaveBeenCalled();
    expect(fresh.sound.playSfx).toHaveBeenCalledWith('sfx/ch1/sealCrack', 'flourish');
  });

  it('uses one tap to dismiss the recap and then restores normal dialogue', () => {
    const dialogue = { voice: 'voice/ch1/guide/arrival', text: 'Come with me!' };
    const game = Object.create(Game.prototype);
    game.debug = false;
    game.screen = 'playing';
    game.resumeRecap = chapter1ResumeRecaps[1];
    game.world = { dialoguePresentation: dialogue, tap: vi.fn() };
    game.sound = {
      unlock: vi.fn().mockResolvedValue(undefined),
      stopVoice: vi.fn(),
      playSfx: vi.fn(),
      speak: vi.fn(),
    };
    game.updateStatus = vi.fn();

    game.handleTap({ x: 640, y: 360 });

    expect(game.resumeRecap).toBeNull();
    expect(game.sound.stopVoice).toHaveBeenCalledOnce();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/page', 'tap');
    expect(game.sound.speak).toHaveBeenCalledWith(dialogue.voice, dialogue.text);
    expect(game.world.tap).not.toHaveBeenCalled();
  });

  it('pauses world simulation until the recap is dismissed', () => {
    const game = Object.create(Game.prototype);
    game.simTime = 0;
    game.transitionAlpha = 0;
    game.screen = 'playing';
    game.resumeRecap = chapter1ResumeRecaps[0];
    game.particles = { update: vi.fn() };
    game.world = { update: vi.fn() };
    game.processWorldEvents = vi.fn();

    game.update(1 / 60);
    expect(game.world.update).not.toHaveBeenCalled();

    game.resumeRecap = null;
    game.update(1 / 60);
    expect(game.world.update).toHaveBeenCalledOnce();
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });
});
