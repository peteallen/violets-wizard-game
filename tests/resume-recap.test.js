import { describe, expect, it, vi } from 'vitest';
import { Game, selectChapter1ResumeRecap, selectResumeRecap } from '../src/game/Game.js';
import { chapter1ResumeRecaps } from '../src/game/content/chapters/ch1.js';
import { chapter2RecapDefinitions } from '../src/game/chapters/ch2/content-v2/recaps.js';
import { contentRegistry, resumeRecaps } from '../src/game/content/index.js';
import { dialogueScrollLayout } from '../src/game/render/UIRenderer.js';
import { createSave, createSaveV1 } from '../src/game/systems/Save.js';

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
  game.characterScopes = {
    activateChapter: vi.fn().mockResolvedValue([]),
    releaseTitle: vi.fn().mockResolvedValue([]),
  };
  game.chapterRuntime = { chapters: contentRegistry, resumeRecaps };
  game.prepareChapterRuntime = vi.fn().mockResolvedValue(null);
  game.createWorld = vi.fn();
  game.updateStatus = vi.fn();
  game.persistSave = vi.fn(() => ({ ok: true, status: 'saved', save }));
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
      expect(selectChapter1ResumeRecap(save, chapter1ResumeRecaps)?.step).toBe(expectedStep);
    }

    expect(selectChapter1ResumeRecap(
      saveWithFlags('ch1.ticketReceived'),
      chapter1ResumeRecaps,
    )).toBeNull();
    const chapterTwo = saveWithFlags('ch1.petNamed');
    chapterTwo.resume.chapter = 'ch2';
    expect(selectChapter1ResumeRecap(chapterTwo, chapter1ResumeRecaps)).toBeNull();
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
    expect(fresh.sound.playSfx).not.toHaveBeenCalledWith('sfx/ch1/sealCrack', 'flourish');
    expect(fresh.updateStatus).toHaveBeenCalledWith('Violet’s letter is waiting by the window.');
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

  it('replays a resume recap from the visible Again control without dismissing it', () => {
    const recap = chapter1ResumeRecaps[1];
    const game = Object.create(Game.prototype);
    game.debug = false;
    game.screen = 'playing';
    game.replayMode = false;
    game.resumeRecap = recap;
    game.shouldShowDebugReset = () => false;
    game.shouldShowReplayExit = () => false;
    game.sound = {
      unlock: vi.fn().mockResolvedValue(undefined),
      playSfx: vi.fn(),
      speak: vi.fn(),
    };
    game.updateStatus = vi.fn();

    const layout = dialogueScrollLayout();
    game.handleTap({
      x: layout.replayRect.x + layout.replayRect.width / 2,
      y: layout.replayRect.y + layout.replayRect.height / 2,
    });

    expect(game.resumeRecap).toBe(recap);
    expect(game.sound.speak).toHaveBeenCalledWith(recap.voice, recap.text);
    expect(game.updateStatus).toHaveBeenCalledWith(recap.text);
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

describe('chapter-owned resume recaps', () => {
  it('selects the latest completed Chapter Two story beat without spoiling the next one', () => {
    const save = saveWithFlags('ch1.complete');
    save.progress.completedChapters = ['ch1'];
    save.progress.highestUnlockedChapter = 2;
    save.resume = {
      chapter: 'ch2', scene: 'ch2.scene.kingsCross', room: 'ch2.kingsCross', spawn: 'start',
    };

    expect(selectResumeRecap(save, contentRegistry, resumeRecaps)).toBeNull();

    for (const flag of ['ch2.barrierCrossed', 'ch2.boardedTrain', 'ch2.friendsMet']) {
      save.progress.questFlags[flag] = true;
    }
    expect(selectResumeRecap(save, contentRegistry, resumeRecaps)).toEqual(chapter2RecapDefinitions[0]);

    for (const flag of [
      'ch2.sweetReactionSeen', 'ch2.trainComplete', 'ch2.lakeSeen',
      'ch2.greatHallEntered', 'ch2.sortedGryffindor',
    ]) save.progress.questFlags[flag] = true;
    expect(selectResumeRecap(save, contentRegistry, resumeRecaps)).toEqual(chapter2RecapDefinitions[1]);

    for (const flag of ['ch2.feastAwarded', 'ch2.feastComplete', 'ch2.commonRoomArrived']) {
      save.progress.questFlags[flag] = true;
    }
    expect(selectResumeRecap(save, contentRegistry, resumeRecaps)).toEqual(chapter2RecapDefinitions[2]);

    save.progress.completedChapters.push('ch2');
    expect(selectResumeRecap(save, contentRegistry, resumeRecaps)).toBeNull();
  });

  it('presents each recap milestone once instead of replaying a stale recap on every resume', async () => {
    const save = createSave({ now: NOW, worldSeed: 42 });
    save.progress.completedChapters = ['ch1'];
    save.progress.highestUnlockedChapter = 2;
    for (const flag of [
      'ch1.complete',
      'ch2.barrierCrossed',
      'ch2.boardedTrain',
      'ch2.friendsMet',
      'ch2.sweetReactionSeen',
      'ch2.trainComplete',
      'ch2.lakeSeen',
      'ch2.greatHallEntered',
    ]) save.progress.questFlags[flag] = true;
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.sorting',
      room: 'ch2.greatHall',
      spawn: 'sorting',
      dialogue: null,
    };

    const firstResume = adventureStub(save);
    await firstResume.startAdventure();

    expect(firstResume.resumeRecap).toEqual(chapter2RecapDefinitions[0]);
    expect(firstResume.sound.speak).toHaveBeenCalledWith(
      chapter2RecapDefinitions[0].voice,
      chapter2RecapDefinitions[0].text,
    );
    expect(save.progress.storyReceipts).toEqual(['ch2.recap.train']);
    expect(firstResume.persistSave).toHaveBeenCalledWith(save, true);

    const repeatedResume = adventureStub(save);
    await repeatedResume.startAdventure();

    expect(repeatedResume.resumeRecap).toBeNull();
    expect(repeatedResume.sound.speak).not.toHaveBeenCalled();
    expect(repeatedResume.updateStatus).toHaveBeenCalledWith('Continue Violet’s adventure.');

    save.progress.questFlags['ch2.sortedGryffindor'] = true;
    expect(selectResumeRecap(save, contentRegistry, resumeRecaps)).toEqual(chapter2RecapDefinitions[1]);
  });
});
