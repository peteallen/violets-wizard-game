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
    persist
      .mockReturnValueOnce({ ok: false, status: 'storage-error', save: null })
      .mockImplementation(({ save: candidate }) => ({
        ok: true,
        status: 'saved',
        save: structuredClone(candidate),
      }));
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
      dialogue: null,
    });
    expect(persist).toHaveBeenCalledTimes(2);
    expect(world.drainEvents()).toContainEqual(expect.objectContaining({
      type: 'chapter.completed',
      payload: { chapter: 'ch2', nextChapter: 'ch3' },
    }));
    expect(persist).toHaveBeenCalledTimes(2);
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

    expect(persist).toHaveBeenCalledOnce();
    expect(persist.mock.calls[0][0].save.progress.questFlags['ch3.entered']).toBeUndefined();
    expect(world.flags['ch3.entered']).toBe(true);
    expect(world.drainEvents()).toContainEqual(expect.objectContaining({
      type: 'save.persistenceSuppressed',
      payload: { reason: 'flag' },
    }));
  });
});
