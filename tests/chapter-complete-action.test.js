import { describe, expect, it, vi } from 'vitest';
import { chapter2V2 } from '../src/game/chapters/ch2/content-v2/index.js';
import { chapter3 } from '../src/game/chapters/ch3/content.js';
import {
  ContractValidationError,
  validateAction,
  validateDialogue,
} from '../src/game/contracts.js';
import { createSaveV3 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-16T20:00:00.000Z';

function chapterTwoEndingSave() {
  const save = createSaveV3({ now: NOW, appVersion: 'chapter-complete-test', worldSeed: 42 });
  save.resume = {
    chapter: 'ch2',
    scene: 'ch2.scene.chapterCard',
    room: 'ch2.chapterCardRoom',
    spawn: 'start',
    dialogue: null,
  };
  save.progress.highestUnlockedChapter = 2;
  save.progress.completedChapters = ['ch1'];
  Object.assign(save.progress.questFlags, {
    'ch1.complete': true,
    'ch2.commonRoomArrived': true,
  });
  save.character.pet = { type: 'cat', name: 'Biscuit' };
  return save;
}

describe('chapter completion action', () => {
  it('declares an explicit next chapter without relying on a Chapter One default', () => {
    const action = {
      type: 'chapter.complete',
      chapter: 'ch2',
      nextChapter: 'ch3',
    };

    expect(validateAction(action)).toBe(action);
  });

  it('rejects an invalid next chapter identity', () => {
    expect(() => validateAction({
      type: 'chapter.complete',
      chapter: 'ch2',
      nextChapter: 'chapter-three',
    })).toThrow(ContractValidationError);
  });

  it('requires the destination instead of deriving it from the chapter number', () => {
    expect(() => validateAction({
      type: 'chapter.complete',
      chapter: 'ch2',
    })).toThrow(/nextChapter.*required/);
    expect(() => validateAction({
      type: 'chapter.complete',
      chapter: 'ch2',
      nextChapter: 'ch2',
    })).toThrow(/nextChapter.*differ/);
  });

  it('must be terminal within its authored action batch', () => {
    expect(() => validateDialogue({
      id: 'ch2.dialogue.end',
      start: 'finish',
      resumePolicy: 'restart-current-node',
      replayable: false,
      nodes: {
        finish: {
          type: 'end',
          actions: [
            { type: 'chapter.complete', chapter: 'ch2', nextChapter: 'ch3' },
            { type: 'flag.set', flag: 'ch2.afterCompletion', value: true },
          ],
        },
      },
    })).toThrow(/chapter\.complete must be the terminal action/);

    expect(() => validateDialogue({
      id: 'ch2.dialogue.badFlow',
      start: 'complete',
      resumePolicy: 'restart-current-node',
      replayable: false,
      nodes: {
        complete: {
          type: 'action',
          actions: [{ type: 'chapter.complete', chapter: 'ch2', nextChapter: 'ch3' }],
          next: 'after',
        },
        after: { type: 'end', actions: [] },
      },
    })).toThrow(/chapter\.complete is only valid in an end node/);
  });

  it('validates ownership and a registered destination before mutating progress', () => {
    const save = chapterTwoEndingSave();
    const world = new World({ chapters: { ch2: chapter2V2, ch3: chapter3 }, save, seed: 42 });
    const before = structuredClone(save);

    expect(() => world.completeChapter('ch1', 'ch3')).toThrow(/while ch2 is active/);
    expect(() => world.completeChapter('ch2', 'ch99')).toThrow(/Unknown next chapter/);
    expect(save).toEqual(before);
  });

  it('keeps the final page retryable when persistence fails, then adopts one committed handoff', () => {
    const save = chapterTwoEndingSave();
    const persist = vi.fn(({ save: candidate }) => ({
      ok: true,
      status: 'saved',
      save: structuredClone(candidate),
    }));
    const world = new World({
      chapters: { ch2: chapter2V2, ch3: chapter3 },
      save,
      seed: 42,
      clock: () => NOW,
      onDirty: persist,
    });
    persist.mockReset();
    let completionAttempts = 0;
    persist.mockImplementation(({ reason, save: candidate }) => {
      if (reason === 'chapter-complete' && completionAttempts++ === 0) {
        return { ok: false, status: 'storage-error', save: null };
      }
      return {
        ok: true,
        status: 'saved',
        save: structuredClone(candidate),
      };
    });
    world.dialogue.open('ch2.dialogue.chapterEnd');
    const before = structuredClone(save);

    expect(world.advanceDialogue()).toMatchObject({
      type: 'line',
      scriptId: 'ch2.dialogue.chapterEnd',
      nodeId: 'nextTime',
    });
    expect(save).toEqual(before);
    expect(world.chapter.id).toBe('ch2');
    expect(world.dialogue.active).toBe(true);
    expect(world.drainEvents().some(({ type }) => type === 'chapter.completed')).toBe(false);

    expect(world.advanceDialogue()).toBeNull();
    expect(save.progress.completedChapters).toEqual(['ch1', 'ch2']);
    expect(save.progress.highestUnlockedChapter).toBe(3);
    expect(save.progress.questFlags).toMatchObject({
      'ch2.chapterCardSeen': true,
      'ch2.complete': true,
    });
    expect(save.resume).toEqual({
      chapter: 'ch3',
      scene: 'ch3.scene.preview',
      room: 'ch3.previewRoom',
      spawn: 'start',
      dialogue: { script: 'ch3.dialogue.preview', node: 'nextTime' },
    });
    expect(persist.mock.calls.filter(([request]) => request.reason === 'chapter-complete')).toHaveLength(2);
    expect(world.drainEvents()).toContainEqual(expect.objectContaining({
      type: 'chapter.completed',
      payload: { chapter: 'ch2', nextChapter: 'ch3' },
    }));
    expect(persist.mock.calls.filter(([request]) => request.reason === 'chapter-complete')).toHaveLength(2);
    expect(world.chapter.id).toBe('ch3');
    expect(world.currentSceneId).toBe('ch3.scene.preview');
    expect(world.dialogue.scriptId).toBe('ch3.dialogue.preview');
  });

  it('suppresses destination entry writes after the single committed completion candidate', () => {
    const save = chapterTwoEndingSave();
    const destination = structuredClone(chapter3);
    destination.scenes[destination.start.scene].onEnter = [
      { type: 'flag.set', flag: 'ch3.entered', value: true },
    ];
    destination.quests = {
      'ch3.quest.entry': {
        id: 'ch3.quest.entry', startWhen: { allFlags: ['ch3.entered'] },
        startStep: 'begin', onComplete: [],
        steps: {
          begin: {
            objective: { caption: 'Begin Chapter Three' },
            doneWhen: { allFlags: ['ch3.done'] },
            onEnter: [{ type: 'flag.set', flag: 'ch3.questEntered', value: true }],
            onComplete: [], next: null,
          },
        },
      },
    };
    const persist = vi.fn(({ save: candidate }) => ({
      ok: true,
      status: 'saved',
      save: structuredClone(candidate),
    }));
    const world = new World({
      chapters: { ch2: chapter2V2, ch3: destination },
      save,
      seed: 42,
      clock: () => NOW,
      onDirty: persist,
    });
    persist.mockClear();
    world.dialogue.open('ch2.dialogue.chapterEnd');

    world.advanceDialogue();

    const completionWrites = persist.mock.calls.filter(([request]) => request.reason === 'chapter-complete');
    expect(completionWrites).toHaveLength(1);
    expect(completionWrites[0][0].save.progress.questFlags['ch3.entered']).toBeUndefined();
    expect(world.flags).toMatchObject({
      'ch3.entered': true,
      'ch3.questEntered': true,
    });
    expect(persist.mock.calls.map(([request]) => request.reason)).not.toContain('quest-transition');
    expect(world.drainEvents()).toContainEqual(expect.objectContaining({
      type: 'save.persistenceSuppressed',
      payload: { reason: 'flag' },
    }));
  });

  it('announces quest rewards settled inside the chapter-completion transaction', () => {
    const save = chapterTwoEndingSave();
    Object.assign(save.progress.questFlags, {
      'ch2.barrierCrossed': true,
      'ch2.boardedTrain': true,
      'ch2.friendsMet': true,
      'ch2.sweetReactionSeen': true,
      'ch2.trainComplete': true,
      'ch2.lakeSeen': true,
      'ch2.greatHallEntered': true,
      'ch2.sortedGryffindor': true,
      'ch2.feastAwarded': true,
      'ch2.feastComplete': true,
    });
    const source = structuredClone(chapter2V2);
    const quest = source.quests['ch2.quest.belonging'];
    quest.steps.turnPage.onComplete = [
      { type: 'collection.add', collection: 'cards', id: 'card.ch2.final-page' },
    ];
    quest.onComplete = [{
      type: 'reward.grant',
      receipt: 'ch2.reward.chapter-finish',
      cards: [],
      treasures: ['treasure.ch2.welcome'],
      points: 4,
    }];
    const world = new World({
      chapters: { ch2: source, ch3: chapter3 }, save, seed: 42, clock: () => NOW,
    });
    world.drainEvents();

    world.completeChapter('ch2', 'ch3');

    expect(save.collections).toMatchObject({
      cards: expect.arrayContaining(['card.ch2.final-page']),
      treasures: expect.arrayContaining(['treasure.ch2.welcome']),
      housePoints: 4,
    });
    const events = world.drainEvents();
    expect(events).toContainEqual(expect.objectContaining({
      type: 'state.changed',
      payload: expect.objectContaining({
        reason: 'chapter-complete',
        paths: expect.arrayContaining([
          'collections.cards',
          'collections.treasures',
          'collections.housePoints',
        ]),
      }),
    }));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'reward.granted',
        payload: { collection: 'cards', id: 'card.ch2.final-page' },
      }),
      expect.objectContaining({
        type: 'reward.granted',
        payload: { receipt: 'ch2.reward.chapter-finish' },
      }),
    ]));
  });
});
