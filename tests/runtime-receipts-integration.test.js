import { describe, expect, it, vi } from 'vitest';
import { chapter1 } from '../src/game/chapters/ch1/content/legacy.js';
import { chapter2V2 } from '../src/game/chapters/ch2/content-v2/index.js';
import { chapter3 } from '../src/game/chapters/ch3/content.js';
import {
  SAVE_STORAGE_KEY,
  Save,
  createSaveV1,
  createSaveV3,
  parseSave,
  serializeSave,
} from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-16T20:00:00.000Z';

function saveV3({
  chapter = 'ch1',
  scene = 'ch1.scene.story',
  room = 'ch1.room.story',
  spawn = 'start',
  dialogue = null,
  flags = {},
  reducedMotion = false,
} = {}) {
  const save = createSaveV3({ now: NOW, appVersion: 'runtime-receipts-integration', worldSeed: 42 });
  save.resume = { chapter, scene, room, spawn, dialogue };
  Object.assign(save.progress.questFlags, flags);
  save.settings.reducedMotion = reducedMotion;
  return save;
}

function storyChapter({
  contractVersion = 2,
  dialogues = {},
  onEnter = [],
  setPieces = {},
  quests = {},
} = {}) {
  return {
    contractVersion,
    id: 'ch1',
    number: 1,
    start: { scene: 'ch1.scene.story', room: 'ch1.room.story', spawn: 'start' },
    rooms: {
      'ch1.room.story': {
        id: 'ch1.room.story',
        size: { width: 1280, height: 720 },
        spawns: { start: { x: 180, y: 610, facing: 'right' } },
        occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
      },
    },
    scenes: {
      'ch1.scene.story': {
        id: 'ch1.scene.story', room: 'ch1.room.story', spawn: 'start', when: {}, onEnter,
      },
    },
    npcs: {},
    dialogues,
    quests,
    setPieces,
  };
}

function emptyChapter(id, number, { onEnter = [] } = {}) {
  const roomId = `${id}.room.start`;
  const sceneId = `${id}.scene.start`;
  return {
    contractVersion: 2,
    id,
    number,
    start: { scene: sceneId, room: roomId, spawn: 'start' },
    rooms: {
      [roomId]: {
        id: roomId,
        size: { width: 1280, height: 720 },
        spawns: { start: { x: 180, y: 610, facing: 'right' } },
        occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
      },
    },
    scenes: {
      [sceneId]: { id: sceneId, room: roomId, spawn: 'start', when: {}, onEnter },
    },
    npcs: {}, dialogues: {}, quests: {}, setPieces: {},
  };
}

function receiptSetPiece() {
  return {
    'ch1.setPiece.logical': {
      id: 'ch1.setPiece.logical',
      duration: 2,
      reducedMotion: 'ch1.setPiece.reduced',
      fallback: 'ch1.setPiece.fallback',
      params: {},
      timeline: { tracks: [] },
      onComplete: [{ type: 'flag.set', flag: 'ch1.logicalComplete', value: true }],
    },
    'ch1.setPiece.reduced': {
      id: 'ch1.setPiece.reduced',
      duration: 0.1,
      reducedMotion: null,
      fallback: null,
      params: {},
      timeline: { tracks: [] },
      onComplete: [],
    },
    'ch1.setPiece.fallback': {
      id: 'ch1.setPiece.fallback',
      duration: 0.2,
      reducedMotion: null,
      fallback: null,
      params: { presentation: 'fallback' },
      timeline: { tracks: [] },
      onComplete: [],
    },
  };
}

describe('World runtime receipts', () => {
  it('persists visible line and choice cursors, then reconstructs them without replaying scene entry', () => {
    const chapter = storyChapter({
      onEnter: [{ type: 'flag.set', flag: 'ch1.sceneEntered', value: true }],
      dialogues: {
        'ch1.dialogue.resume': {
          id: 'ch1.dialogue.resume', start: 'line', resumePolicy: 'restart-current-node', replayable: true,
          nodes: {
            line: { type: 'line', text: 'A visible line', caption: 'Line', next: 'choice' },
            choice: {
              type: 'choice',
              choices: [{ id: 'continue', icon: 'continue', caption: 'Continue', next: 'end' }],
            },
            end: { type: 'end', actions: [] },
          },
        },
      },
    });
    const save = saveV3({ dialogue: { script: 'ch1.dialogue.resume', node: 'line' } });

    const fromLine = new World({ chapters: { ch1: chapter }, save, seed: 42 });
    expect(fromLine.dialoguePresentation).toMatchObject({ type: 'line', nodeId: 'line' });
    expect(save.progress.questFlags['ch1.sceneEntered']).toBeUndefined();

    fromLine.advanceDialogue();
    expect(save.resume.dialogue).toEqual({ script: 'ch1.dialogue.resume', node: 'choice' });
    const reconstructed = new World({ chapters: { ch1: chapter }, save: structuredClone(save), seed: 42 });

    expect(reconstructed.dialoguePresentation).toMatchObject({ type: 'choice', nodeId: 'choice' });
    expect(reconstructed.save.progress.questFlags['ch1.sceneEntered']).toBeUndefined();
  });

  it('restarts the authored Chapter One pet-selection script from its beginning', () => {
    const save = saveV3({
      scene: 'ch1.petShopping',
      room: 'ch1.menagerie',
      dialogue: { script: 'ch1.keeper.petAndName', node: 'name' },
      flags: { 'ch1.trimChosen': true },
    });

    const world = new World({ chapters: { ch1: chapter1 }, save, seed: 42 });

    expect(world.dialoguePresentation).toMatchObject({
      scriptId: 'ch1.keeper.petAndName', nodeId: 'welcome', type: 'line',
    });
    expect(save.resume.dialogue).toEqual({ script: 'ch1.keeper.petAndName', node: 'welcome' });
    expect(save.character.pet).toEqual({ type: null, name: null });
  });

  it('falls back to normal scene entry for stale or automatic-node cursors', () => {
    const chapter = storyChapter({
      onEnter: [{ type: 'flag.set', flag: 'ch1.sceneEntered', value: true }],
      dialogues: {
        'ch1.dialogue.cursor': {
          id: 'ch1.dialogue.cursor', start: 'page', resumePolicy: 'restart-current-node', replayable: true,
          nodes: {
            page: { type: 'line', text: 'Page', caption: 'Page', next: 'end' },
            automatic: { type: 'action', actions: [{ type: 'flag.set', flag: 'ch1.automaticRan', value: true }], next: 'page' },
            end: { type: 'end', actions: [] },
          },
        },
      },
    });

    for (const dialogue of [
      { script: 'ch1.dialogue.missing', node: 'page' },
      { script: 'ch1.dialogue.cursor', node: 'automatic' },
    ]) {
      const save = saveV3({ dialogue });
      const world = new World({ chapters: { ch1: chapter }, save, seed: 42 });
      expect(world.dialogue.active).toBe(false);
      expect(save.progress.questFlags).toMatchObject({ 'ch1.sceneEntered': true });
      expect(save.progress.questFlags['ch1.automaticRan']).toBeUndefined();
      expect(save.resume.dialogue).toBeNull();
    }
  });

  it('closes a terminal visible line, clears its cursor, and receipts a nonreplayable script', () => {
    const chapter = storyChapter({
      dialogues: {
        'ch1.dialogue.lastPage': {
          id: 'ch1.dialogue.lastPage',
          start: 'last',
          resumePolicy: 'restart-current-node',
          replayable: false,
          nodes: {
            last: { type: 'line', text: 'The end.', caption: 'The end.', next: null },
          },
        },
      },
    });
    const save = saveV3();
    const world = new World({
      chapters: { ch1: chapter }, save, seed: 42, clock: () => NOW,
    });

    world.dialogue.open('ch1.dialogue.lastPage');
    expect(save.resume.dialogue).toEqual({ script: 'ch1.dialogue.lastPage', node: 'last' });
    expect(world.advanceDialogue()).toBeNull();

    expect(world.dialogue.active).toBe(false);
    expect(save.resume.dialogue).toBeNull();
    expect(save.progress.storyReceipts).toContain('ch1.dialogue.lastPage');
    expect(world.dialogue.open('ch1.dialogue.lastPage')).toBeNull();
  });

  it('lands the closing Chapter Two script on Chapter Three’s durable interactive start', () => {
    const save = saveV3({
      chapter: 'ch2', scene: 'ch2.scene.chapterCard', room: 'ch2.chapterCardRoom',
      flags: {
        'ch1.complete': true,
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
        'ch2.commonRoomArrived': true,
      },
    });
    save.progress.highestUnlockedChapter = 2;
    save.progress.completedChapters = ['ch1'];

    const world = new World({ chapters: { ch2: chapter2V2, ch3: chapter3 }, save, seed: 42 });
    world.dialogue.open('ch2.dialogue.chapterEnd');
    world.advanceDialogue();

    expect(world.chapter.id).toBe('ch3');
    expect(world.currentSceneId).toBe('ch3.scene.spellbookParcel');
    expect(world.roomId).toBe('ch3.commonRoom');
    expect(world.dialoguePresentation).toBeNull();
    expect(save.resume.dialogue).toBeNull();
    expect(save.progress.questReceipts).toEqual(expect.arrayContaining([
      'ch2.quest.belonging.quest.v1.step.turnPage.completed',
      'ch2.quest.belonging.quest.v1.completed',
    ]));
  });

  it('records a nonreplayable Chapter Two dialogue only after its set-piece continuation, and recovers an interrupted run', () => {
    const save = saveV3({
      chapter: 'ch2', scene: 'ch2.scene.trolleySweets', room: 'ch2.trainCompartment',
      flags: {
        'ch1.complete': true,
        'ch2.barrierCrossed': true,
        'ch2.boardedTrain': true,
        'ch2.friendsMet': true,
      },
    });
    save.progress.highestUnlockedChapter = 2;
    save.progress.completedChapters = ['ch1'];
    const world = new World({ chapters: { ch2: chapter2V2 }, save, seed: 42 });

    world.dialogue.open('ch2.dialogue.trolleySweets');
    world.advanceDialogue();
    world.advanceDialogue('chocolateFrog');
    expect(world.setPieces.active).toMatchObject({ requestedId: 'ch2.setPiece.sweetReaction' });
    expect(save.progress.storyReceipts).not.toContain('ch2.dialogue.trolleySweets');

    const interruptedSave = structuredClone(save);
    const recovered = new World({ chapters: { ch2: chapter2V2 }, save: interruptedSave, seed: 42 });
    recovered.dialogue.open('ch2.dialogue.trolleySweets');
    recovered.advanceDialogue();
    recovered.advanceDialogue('chocolateFrog');
    recovered.setPieces.skip();
    expect(interruptedSave.progress.storyReceipts).toEqual(expect.arrayContaining([
      'ch2.setPiece.sweetReaction', 'ch2.dialogue.trolleySweets',
    ]));

    world.setPieces.skip();
    expect(save.progress.storyReceipts).toEqual(expect.arrayContaining([
      'ch2.setPiece.sweetReaction', 'ch2.dialogue.trolleySweets',
    ]));
    expect(world.dialogue.open('ch2.dialogue.trolleySweets')).toBeNull();
  });

  it('uses the logical set-piece receipt for reduced motion, explicit skip tails, and reconstructed continuations', () => {
    const chapter = storyChapter({ setPieces: receiptSetPiece() });
    const save = saveV3({ reducedMotion: true });
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42 });

    world.runActions([
      { type: 'setPiece.play', id: 'ch1.setPiece.logical' },
      { type: 'flag.set', flag: 'ch1.tailRan', value: true },
    ]);
    expect(world.setPieces.active).toMatchObject({
      id: 'ch1.setPiece.reduced', requestedId: 'ch1.setPiece.logical',
    });
    world.setPieces.skip();
    expect(save.progress.storyReceipts).toContain('ch1.setPiece.logical');
    expect(save.progress.questFlags).toMatchObject({
      'ch1.logicalComplete': true,
      'ch1.tailRan': true,
    });

    const reconstructedSave = saveV3();
    reconstructedSave.progress.storyReceipts.push('ch1.setPiece.logical');
    const reconstructed = new World({ chapters: { ch1: chapter }, save: reconstructedSave, seed: 42 });
    reconstructed.runActions([
      { type: 'setPiece.play', id: 'ch1.setPiece.logical' },
      { type: 'flag.set', flag: 'ch1.tailRecovered', value: true },
    ]);
    expect(reconstructed.setPieces.active).toBeNull();
    expect(reconstructedSave.progress.questFlags).toMatchObject({
      'ch1.logicalComplete': true,
      'ch1.tailRecovered': true,
    });
  });

  it('does not release a set-piece outcome until its receipt is durably saved', () => {
    const save = saveV3();
    const chapter = storyChapter({ setPieces: receiptSetPiece() });
    let failReceipt = true;
    const onDirty = ({ reason, save: candidate }) => {
      if (reason === 'set-piece-receipt' && failReceipt) {
        failReceipt = false;
        return { ok: false, status: 'storage-error', save: null };
      }
      return { ok: true, status: 'saved', save: structuredClone(candidate) };
    };
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });
    world.setPieces.start('ch1.setPiece.logical');

    world.setPieces.skip();

    expect(world.setPieces.active).toMatchObject({ requestedId: 'ch1.setPiece.logical' });
    expect(save.progress.storyReceipts).not.toContain('ch1.setPiece.logical');
    expect(save.progress.questFlags['ch1.logicalComplete']).toBeUndefined();

    world.setPieces.skip();

    expect(world.setPieces.active).toBeNull();
    expect(save.progress.storyReceipts).toContain('ch1.setPiece.logical');
    expect(save.progress.questFlags['ch1.logicalComplete']).toBe(true);
  });

  it('selects an authored fallback through World and keeps every Chapter One set piece safe in reduced motion', () => {
    const chapter = storyChapter({ setPieces: receiptSetPiece() });
    const fallbackWorld = new World({
      chapters: { ch1: chapter },
      save: saveV3(),
      seed: 42,
      selectSetPieceFallback: () => true,
    });
    fallbackWorld.setPieces.start('ch1.setPiece.logical');
    expect(fallbackWorld.setPieces.active).toMatchObject({
      id: 'ch1.setPiece.fallback', requestedId: 'ch1.setPiece.logical',
    });

    const reducedWorld = new World({
      chapters: { ch1: chapter1 },
      save: saveV3({ reducedMotion: true }),
      seed: 42,
    });
    for (const id of [
      'sp.letter',
      'sp.letterOpen',
      'sp.brickWall',
      'sp.wandChaos1',
      'sp.wandChaos2',
      'sp.wandChosen',
      'sp.chapterCard',
    ]) {
      reducedWorld.setPieces.reset();
      expect(() => reducedWorld.setPieces.start(id), id).not.toThrow();
      expect(reducedWorld.setPieces.active?.requestedId, id).toBe(id);
    }
  });

  it('keeps a consumed Chapter One wand performance replayable and recovers its receipted continuation', () => {
    const interruptedSave = saveV3({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      flags: { 'ch1.mapUsed': true },
    });
    const interrupted = new World({ chapters: { ch1: chapter1 }, save: interruptedSave, seed: 42 });

    interrupted.interactSemantic('ollivanders.wand1');
    interrupted.update(3);
    expect(interrupted.setPieces.active?.requestedId).toBe('sp.wandChaos1');
    expect(interruptedSave.progress.questFlags['ch1.wandTry1']).toBeUndefined();
    expect(interruptedSave.progress.storyReceipts).not.toContain('ch1.sp.wandChaos1');

    const replayed = new World({
      chapters: { ch1: chapter1 },
      save: structuredClone(interruptedSave),
      seed: 42,
    });
    expect(replayed.targets().some(({ id }) => id === 'ollivanders.wand1')).toBe(true);

    const receiptedSave = structuredClone(interruptedSave);
    receiptedSave.progress.storyReceipts.push('ch1.sp.wandChaos1');
    const recovered = new World({ chapters: { ch1: chapter1 }, save: receiptedSave, seed: 42 });
    recovered.interactSemantic('ollivanders.wand1');
    recovered.update(3);

    expect(recovered.setPieces.active).toBeNull();
    expect(receiptedSave.progress.questFlags['ch1.wandTry1']).toBe(true);
    expect(recovered.dialoguePresentation).toMatchObject({
      scriptId: 'ch1.wandmaker.wrong1', nodeId: 'oops',
    });
  });

  it('adopts historical quest progress silently and runs each live lifecycle transition exactly once', () => {
    const chapter = storyChapter({
      quests: {
        'ch1.quest.receipts': {
          id: 'ch1.quest.receipts', startWhen: {}, startStep: 'first', onComplete: [],
          steps: {
            first: {
              objective: { caption: 'First' }, doneWhen: { allFlags: ['ch1.firstDone'] },
              onEnter: [{ type: 'flag.set', flag: 'ch1.historicalEnter', value: true }],
              onComplete: [{ type: 'flag.set', flag: 'ch1.historicalComplete', value: true }], next: 'second',
            },
            second: {
              objective: { caption: 'Second' }, doneWhen: { allFlags: ['ch1.secondDone'] },
              onEnter: [{ type: 'flag.set', flag: 'ch1.historicalSecondEnter', value: true }],
              onComplete: [{ type: 'flag.set', flag: 'ch1.liveComplete', value: true }], next: null,
            },
          },
        },
      },
    });
    const save = saveV3({ flags: { 'ch1.firstDone': true } });
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42 });

    expect(save.progress.questFlags).not.toMatchObject({
      'ch1.historicalEnter': true,
      'ch1.historicalComplete': true,
      'ch1.historicalSecondEnter': true,
    });
    expect(save.progress.questReceipts).toEqual(expect.arrayContaining([
      'ch1.quest.receipts.quest.v1.step.first.entered',
      'ch1.quest.receipts.quest.v1.step.first.completed',
      'ch1.quest.receipts.quest.v1.step.second.entered',
      'ch1.quest.receipts.quest.v1.adopted',
    ]));

    const commitQuestTransition = vi.spyOn(world, 'commitQuestTransition');
    world.setFlag('ch1.secondDone', true);
    world.update(0);
    world.update(0);
    expect(commitQuestTransition.mock.calls.filter(([receipt]) => (
      receipt === 'ch1.quest.receipts.quest.v1.step.second.completed'
    ))).toHaveLength(1);
    expect(save.progress.questFlags['ch1.liveComplete']).toBe(true);
  });

  it('keeps the current objective and scene retryable when quest completion cannot be saved', () => {
    const chapter = storyChapter({
      dialogues: {
        'ch1.dialogue.stale': {
          id: 'ch1.dialogue.stale', start: 'line', resumePolicy: 'restart-current-node', replayable: true,
          nodes: {
            line: { type: 'line', text: 'This branch is stale.', caption: 'Stale', next: null },
          },
        },
      },
      quests: {
        'ch1.quest.scene-order': {
          id: 'ch1.quest.scene-order', startWhen: {}, startStep: 'only', onComplete: [],
          steps: {
            only: {
              objective: { caption: 'Finish' }, doneWhen: { allFlags: ['ch1.done'] },
              onEnter: [],
              onComplete: [{ type: 'flag.set', flag: 'ch1.lifecycleMid', value: true }],
              next: 'second',
            },
            second: {
              objective: { caption: 'Second' }, doneWhen: { allFlags: ['ch1.secondDone'] },
              onEnter: [{ type: 'flag.set', flag: 'ch1.lifecycleReady', value: true }],
              onComplete: [],
              next: null,
            },
          },
        },
      },
    });
    chapter.scenes = {
      'ch1.scene.story': {
        id: 'ch1.scene.story', room: 'ch1.room.story', spawn: 'start',
        when: { noFlags: ['ch1.done'] }, onEnter: [],
      },
      'ch1.scene.stale': {
        id: 'ch1.scene.stale', room: 'ch1.room.story', spawn: 'start',
        when: { allFlags: ['ch1.lifecycleMid'], noFlags: ['ch1.lifecycleReady'] },
        onEnter: [{ type: 'dialogue.start', script: 'ch1.dialogue.stale' }],
      },
      'ch1.scene.final': {
        id: 'ch1.scene.final', room: 'ch1.room.story', spawn: 'start',
        when: { allFlags: ['ch1.lifecycleReady'] }, onEnter: [],
      },
    };
    const save = saveV3();
    let failTransition = true;
    const onDirty = ({ reason, save: candidate }) => {
      if (reason === 'quest-transition' && failTransition) {
        failTransition = false;
        return { ok: false, status: 'storage-error', save: null };
      }
      return { ok: true, status: 'saved', save: structuredClone(candidate) };
    };
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });

    world.setFlag('ch1.done', true);

    expect(save.progress.questFlags['ch1.lifecycleMid']).toBeUndefined();
    expect(save.progress.questFlags['ch1.lifecycleReady']).toBeUndefined();
    expect(world.currentSceneId).toBe('ch1.scene.story');
    expect(world.dialogue.active).toBe(false);
    expect(world.objective).toMatchObject({ caption: 'Finish' });
    expect(save.progress.questReceipts).not.toContain(
      'ch1.quest.scene-order.quest.v1.step.only.completed',
    );

    world.update(0);

    expect(save.progress.questFlags).toMatchObject({
      'ch1.lifecycleMid': true,
      'ch1.lifecycleReady': true,
    });
    expect(world.currentSceneId).toBe('ch1.scene.final');
    expect(world.dialogue.active).toBe(false);
    expect(world.objective).toMatchObject({ caption: 'Second' });
    expect(save.progress.questReceipts).toContain(
      'ch1.quest.scene-order.quest.v1.step.only.completed',
    );
    expect(save.progress.questReceipts).toContain(
      'ch1.quest.scene-order.quest.v1.step.second.entered',
    );
  });

  it('keeps a dialogue page open when travel cannot settle its quest transition', () => {
    const scriptId = 'ch1.dialogue.travel-retry';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'last', resumePolicy: 'restart-current-node', replayable: false,
          nodes: {
            last: { type: 'line', text: 'All aboard.', caption: 'All aboard!', next: 'end' },
            end: {
              type: 'end',
              actions: [
                { type: 'flag.set', flag: 'ch1.readyToTravel', value: true },
                {
                  type: 'travel.request', room: 'ch1.room.next', spawn: 'start', transition: 'ink',
                },
              ],
            },
          },
        },
      },
      quests: {
        'ch1.quest.travel': {
          id: 'ch1.quest.travel', startWhen: {}, startStep: 'board', onComplete: [],
          steps: {
            board: {
              objective: { caption: 'Board' },
              doneWhen: { allFlags: ['ch1.readyToTravel'] },
              onEnter: [],
              onComplete: [{ type: 'flag.set', flag: 'ch1.travelSettled', value: true }],
              next: null,
            },
          },
        },
      },
    });
    chapter.scenes['ch1.scene.story'].when = { noFlags: ['ch1.readyToTravel'] };
    chapter.rooms['ch1.room.next'] = {
      id: 'ch1.room.next', size: { width: 1280, height: 720 },
      spawns: { start: { x: 180, y: 610, facing: 'right' } },
      occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
    };
    chapter.scenes['ch1.scene.next'] = {
      id: 'ch1.scene.next', order: 2, room: 'ch1.room.next', spawn: 'start',
      when: { allFlags: ['ch1.readyToTravel'] }, onEnter: [],
    };
    const save = saveV3();
    let failTransitions = true;
    const onDirty = ({ reason, save: candidate }) => (
      reason === 'quest-transition' && failTransitions
        ? { ok: false, status: 'storage-error', save: null }
        : { ok: true, status: 'saved', save: structuredClone(candidate) }
    );
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });
    world.dialogue.open(scriptId);

    world.advanceDialogue();

    expect(world.roomId).toBe('ch1.room.story');
    expect(world.dialoguePresentation).toMatchObject({ scriptId, nodeId: 'last' });
    expect(save.progress.storyReceipts).not.toContain(scriptId);
    expect(save.progress.questFlags['ch1.readyToTravel']).toBeUndefined();
    expect(save.progress.questFlags['ch1.travelSettled']).toBeUndefined();

    const recoveredSave = structuredClone(save);
    const recovered = new World({
      chapters: { ch1: chapter }, save: recoveredSave, seed: 42,
    });
    expect(recovered.currentSceneId).toBe('ch1.scene.story');
    expect(recovered.dialoguePresentation).toMatchObject({ scriptId, nodeId: 'last' });

    recovered.advanceDialogue();

    expect(recovered.roomId).toBe('ch1.room.next');
    expect(recovered.dialogue.active).toBe(false);
    expect(recoveredSave.progress.storyReceipts).toContain(scriptId);
    expect(recoveredSave.progress.questFlags['ch1.travelSettled']).toBe(true);
  });

  it('treats a destination quest enabled by scene entry as a live first entry', () => {
    const destination = {
      ...storyChapter(),
      id: 'ch2',
      number: 2,
      start: { scene: 'ch2.scene.start', room: 'ch2.room.start', spawn: 'start' },
      rooms: {
        'ch2.room.start': {
          id: 'ch2.room.start', size: { width: 1280, height: 720 },
          spawns: { start: { x: 180, y: 610, facing: 'right' } },
          occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
        },
      },
      scenes: {
        'ch2.scene.start': {
          id: 'ch2.scene.start', room: 'ch2.room.start', spawn: 'start', when: {},
          onEnter: [{ type: 'flag.set', flag: 'ch2.questStarted', value: true }],
        },
      },
      quests: {
        'ch2.quest.live': {
          id: 'ch2.quest.live',
          startWhen: { allFlags: ['ch2.questStarted'] },
          startStep: 'first',
          steps: {
            first: {
              objective: { caption: 'Begin' }, doneWhen: { allFlags: ['ch2.done'] },
              onEnter: [{ type: 'flag.set', flag: 'ch2.firstEntered', value: true }],
              onComplete: [], next: null,
            },
          },
          onComplete: [],
        },
      },
    };
    const save = saveV3();
    const world = new World({ chapters: { ch1: storyChapter(), ch2: destination }, save, seed: 42 });

    world.changeChapter('ch2');

    expect(save.progress.questFlags).toMatchObject({
      'ch2.questStarted': true,
      'ch2.firstEntered': true,
    });
    expect(save.progress.questReceipts).toEqual(expect.arrayContaining([
      'ch2.quest.live.quest.v1.adopted',
      'ch2.quest.live.quest.v1.step.first.entered',
    ]));
  });

  it('rolls a failed quest receipt out of the real save queue before retrying its action', () => {
    class FailingStorage {
      constructor() {
        this.values = new Map();
        this.failNextWrite = false;
      }

      getItem(key) { return this.values.get(key) ?? null; }

      setItem(key, value) {
        if (key === SAVE_STORAGE_KEY && this.failNextWrite) {
          this.failNextWrite = false;
          throw new Error('simulated storage failure');
        }
        this.values.set(key, value);
      }

      removeItem(key) { this.values.delete(key); }
    }

    const storage = new FailingStorage();
    const saveManager = new Save({ storage, clock: () => NOW, debounceMs: 60_000 });
    const save = saveV3();
    expect(saveManager.write(save).ok).toBe(true);
    const chapter = storyChapter({
      quests: {
        'ch1.quest.retry': {
          id: 'ch1.quest.retry', startWhen: {}, startStep: 'only',
          steps: {
            only: {
              objective: { caption: 'Retry' }, doneWhen: { allFlags: ['ch1.done'] },
              onEnter: [],
              onComplete: [{ type: 'flag.set', flag: 'ch1.lifecycleRan', value: true }],
              next: null,
            },
          },
          onComplete: [],
        },
      },
    });
    const onDirty = ({ flush, save: nextSave, rollbackSave = null }) => {
      const result = flush ? saveManager.write(nextSave) : saveManager.queue(nextSave);
      if (!result.ok && rollbackSave) saveManager.queue(rollbackSave);
      return result;
    };
    const world = new World({
      chapters: { ch1: chapter }, save, seed: 42, clock: () => NOW, onDirty,
    });
    storage.failNextWrite = true;

    world.setFlag('ch1.done', true);
    expect(save.progress.questFlags['ch1.lifecycleRan']).toBeUndefined();
    expect(save.progress.questReceipts).not.toContain(
      'ch1.quest.retry.quest.v1.step.only.completed',
    );

    expect(saveManager.flush().ok).toBe(true);
    const queuedSave = parseSave(storage.getItem(SAVE_STORAGE_KEY));
    expect(queuedSave.progress.questFlags['ch1.done']).toBe(true);
    expect(queuedSave.progress.questReceipts).not.toContain(
      'ch1.quest.retry.quest.v1.step.only.completed',
    );

    world.quests.update();
    expect(save.progress.questFlags['ch1.lifecycleRan']).toBe(true);
    expect(save.progress.questReceipts).toContain(
      'ch1.quest.retry.quest.v1.step.only.completed',
    );
  });

  it('retries a nonreplayable set-piece handoff without reopening dialogue beside it', () => {
    const setPieceId = 'ch1.setPiece.handoff';
    const scriptId = 'ch1.dialogue.handoff';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'last', resumePolicy: 'restart-current-node', replayable: false,
          nodes: {
            last: { type: 'line', text: 'Ready?', caption: 'Ready?', next: 'finish' },
            finish: {
              type: 'end',
              actions: [
                { type: 'setPiece.play', id: setPieceId },
                { type: 'chapter.complete', chapter: 'ch1', nextChapter: 'ch2' },
              ],
            },
          },
        },
      },
      setPieces: {
        [setPieceId]: {
          id: setPieceId, duration: 1, fallback: null, reducedMotion: null,
          params: {}, timeline: { tracks: [] }, onComplete: [],
        },
      },
    });
    const destination = {
      ...storyChapter(),
      id: 'ch2',
      number: 2,
      start: { scene: 'ch2.scene.start', room: 'ch2.room.start', spawn: 'start' },
      rooms: {
        'ch2.room.start': {
          id: 'ch2.room.start', size: { width: 1280, height: 720 },
          spawns: { start: { x: 180, y: 610, facing: 'right' } },
          occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
        },
      },
      scenes: {
        'ch2.scene.start': {
          id: 'ch2.scene.start', room: 'ch2.room.start', spawn: 'start', when: {}, onEnter: [],
        },
      },
    };
    const save = saveV3();
    let failCompletion = true;
    const onDirty = vi.fn(({ reason, save: candidate }) => {
      if (reason === 'chapter-complete' && failCompletion) {
        failCompletion = false;
        return { ok: false, status: 'storage-error', save: null };
      }
      return { ok: true, status: 'saved', save: structuredClone(candidate) };
    });
    const world = new World({
      chapters: { ch1: chapter, ch2: destination }, save, seed: 42, onDirty,
    });

    world.dialogue.open(scriptId);
    world.advanceDialogue();
    world.setPieces.skip();

    expect(world.chapter.id).toBe('ch1');
    expect(save.progress.storyReceipts).toContain(setPieceId);
    expect(save.progress.storyReceipts).not.toContain(scriptId);
    expect(world.dialogue.active).toBe(false);
    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'last' });
    expect(world.setPieces.pendingCompletion).toMatchObject({ stage: 'actions' });
    expect(world.blocked).toBe(true);
    expect(world.tap({ x: 640, y: 610 })).toEqual({ kind: 'blocked', reason: 'set-piece' });

    world.update(0);

    expect(world.chapter.id).toBe('ch2');
    expect(save.progress.storyReceipts).toContain(scriptId);
    const successfulCompletion = onDirty.mock.calls.find(([request]) => (
      request.reason === 'chapter-complete'
      && request.save.progress.storyReceipts.includes(scriptId)
    ));
    expect(successfulCompletion).toBeDefined();
    expect(onDirty.mock.calls.filter(([request]) => request.reason === 'dialogue-receipt')).toHaveLength(0);
  });

  it('commits cursor clearing and a one-shot dialogue receipt together or restores the page', () => {
    const scriptId = 'ch1.dialogue.atomic-close';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'last', resumePolicy: 'restart-current-node', replayable: false,
          nodes: {
            last: { type: 'line', text: 'Keep this page safe.', caption: 'Keep this page safe.', next: 'end' },
            end: {
              type: 'end',
              actions: [{ type: 'flag.set', flag: 'ch1.hiddenActionRan', value: true }],
            },
          },
        },
      },
    });
    const save = saveV3();
    let failCompletion = true;
    const onDirty = ({ reason, save: candidate }) => {
      if (reason === 'dialogue-completion' && failCompletion) {
        failCompletion = false;
        return { ok: false, status: 'storage-error', save: null };
      }
      return { ok: true, status: 'saved', save: structuredClone(candidate) };
    };
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });
    world.dialogue.open(scriptId);
    world.drainEvents();

    world.advanceDialogue();

    expect(save.progress.questFlags['ch1.hiddenActionRan']).toBe(true);
    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'last' });
    expect(save.progress.storyReceipts).not.toContain(scriptId);
    expect(world.dialoguePresentation).toMatchObject({ scriptId, nodeId: 'last' });
    expect(world.drainEvents()
      .filter(({ type }) => type.startsWith('dialogue.'))
      .map(({ type }) => type)).toEqual([
      'dialogue.closed',
      'dialogue.opened',
      'dialogue.lineChanged',
    ]);

    world.advanceDialogue();

    expect(save.resume.dialogue).toBeNull();
    expect(save.progress.storyReceipts).toContain(scriptId);
    expect(world.dialogue.active).toBe(false);
  });

  it('restores cross-chapter runtime state and controller identity when a terminal batch fails', () => {
    const source = storyChapter();
    const destination = emptyChapter('ch2', 2);
    const preview = emptyChapter('ch3', 3);
    const save = saveV3();
    const onDirty = vi.fn(({ reason, save: candidate }) => (
      reason === 'chapter-complete'
        ? { ok: false, status: 'storage-error', save: null }
        : { ok: true, status: 'saved', save: structuredClone(candidate) }
    ));
    const world = new World({
      chapters: { ch1: source, ch2: destination, ch3: preview }, save, seed: 42, onDirty,
    });
    world.drainEvents();
    world.pendingPetType = 'cat';
    world.guideWalkCue = { cueId: 'test-cue', startedAt: 0, playerStart: { x: 180, y: 610 } };
    world.actorAnimations.set('test.actor', { action: 'wave', startedAt: 0, duration: 1 });
    world.deferredDialogueReceipts.set('ch1.dialogue.pending', 'ch1.setPiece.pending');
    const before = {
      save: structuredClone(save),
      player: structuredClone(world.player),
      dialogue: world.dialogue,
      quests: world.quests,
      setPieces: world.setPieces,
    };

    expect(world.runActions([
      { type: 'ui.open', surface: 'satchel' },
      { type: 'travel.request', room: 'ch2.room.start', spawn: 'start', transition: 'ink' },
      { type: 'chapter.complete', chapter: 'ch2', nextChapter: 'ch3' },
    ])).toBe(false);

    expect(save).toEqual(before.save);
    expect(world.chapter.id).toBe('ch1');
    expect(world.roomId).toBe('ch1.room.story');
    expect(world.currentSceneId).toBe('ch1.scene.story');
    expect(world.player).toEqual(before.player);
    expect(world.overlay).toBeNull();
    expect(world.pendingPetType).toBe('cat');
    expect(world.guideWalkCue).toMatchObject({ cueId: 'test-cue' });
    expect(world.actorAnimations.get('test.actor')).toMatchObject({ action: 'wave' });
    expect(world.deferredDialogueReceipts.get('ch1.dialogue.pending')).toBe('ch1.setPiece.pending');
    expect(world.dialogue).toBe(before.dialogue);
    expect(world.quests).toBe(before.quests);
    expect(world.setPieces).toBe(before.setPieces);
    expect(world.drainEvents()).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'save.flushRequested', payload: { reason: 'action-batch-rollback' } }),
      expect.objectContaining({ type: 'state.changed', payload: { paths: ['save'], reason: 'action-batch-rollback' } }),
    ]));
  });

  it('rolls back runtime and save state before rethrowing an action handler error', () => {
    const save = saveV3();
    const world = new World({
      chapters: { ch1: storyChapter() },
      save,
      seed: 42,
      onDirty: ({ reason, save: candidate }) => {
        if (reason === 'choice') throw new Error('simulated persistence exception');
        return { ok: true, status: 'saved', save: structuredClone(candidate) };
      },
    });
    const before = structuredClone(save);
    world.drainEvents();

    expect(() => world.runActions([
      { type: 'ui.open', surface: 'satchel' },
      { type: 'choice.record', id: 'ch1.choice.failure', value: true },
    ])).toThrow('simulated persistence exception');

    expect(save).toEqual(before);
    expect(world.overlay).toBeNull();
    expect(world.drainEvents()).toContainEqual(expect.objectContaining({
      type: 'save.flushRequested', payload: { reason: 'action-batch-rollback' },
    }));
  });

  it('propagates a failed destination scene entry and rolls travel back to its source', () => {
    const source = storyChapter();
    source.rooms['ch1.room.next'] = {
      id: 'ch1.room.next', size: { width: 1280, height: 720 },
      spawns: { start: { x: 940, y: 600, facing: 'left' } },
      occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
    };
    source.scenes['ch1.scene.next'] = {
      id: 'ch1.scene.next', room: 'ch1.room.next', spawn: 'start', when: {},
      onEnter: [
        { type: 'ui.open', surface: 'satchel' },
        { type: 'chapter.complete', chapter: 'ch1', nextChapter: 'ch2' },
      ],
    };
    const save = saveV3();
    const world = new World({
      chapters: { ch1: source, ch2: emptyChapter('ch2', 2) },
      save,
      seed: 42,
      onDirty: ({ reason, save: candidate }) => (
        reason === 'chapter-complete'
          ? { ok: false, status: 'storage-error', save: null }
          : { ok: true, status: 'saved', save: structuredClone(candidate) }
      ),
    });
    const before = structuredClone(save);

    expect(world.travel('ch1.room.next', 'start')).toBe(false);

    expect(save).toEqual(before);
    expect(world.roomId).toBe('ch1.room.story');
    expect(world.currentSceneId).toBe('ch1.scene.story');
    expect(world.player).toMatchObject({ x: 180, y: 610, facing: 'right' });
    expect(world.overlay).toBeNull();
  });

  it('defers initial scene entry until failed constructor quest settlement can retry', () => {
    const chapter = storyChapter({
      onEnter: [{ type: 'flag.set', flag: 'ch1.sceneEntered', value: true }],
      quests: {
        'ch1.quest.constructor-retry': {
          id: 'ch1.quest.constructor-retry', startWhen: {}, startStep: 'only', onComplete: [],
          steps: {
            only: {
              objective: { caption: 'Begin' }, doneWhen: { allFlags: ['ch1.done'] },
              onEnter: [], onComplete: [], next: null,
            },
          },
        },
      },
    });
    const save = saveV3();
    let failReceipt = true;
    const world = new World({
      chapters: { ch1: chapter },
      save,
      seed: 42,
      onDirty: ({ reason, save: candidate }) => {
        if (reason === 'quest-receipt' && failReceipt) {
          failReceipt = false;
          return { ok: false, status: 'storage-error', save: null };
        }
        return { ok: true, status: 'saved', save: structuredClone(candidate) };
      },
    });

    expect(world.sceneEntryPending).toBe(true);
    expect(save.progress.questFlags['ch1.sceneEntered']).toBeUndefined();
    expect(save.progress.questReceipts).not.toContain(
      'ch1.quest.constructor-retry.quest.v1.adopted',
    );

    world.update(0);

    expect(world.sceneEntryPending).toBe(false);
    expect(save.progress.questFlags['ch1.sceneEntered']).toBe(true);
    expect(save.progress.questReceipts).toContain(
      'ch1.quest.constructor-retry.quest.v1.adopted',
    );
  });

  it('commits a dialogue-enabled quest as live work with its receipt and reward events', () => {
    const scriptId = 'ch1.dialogue.starts-quest';
    const questId = 'ch1.quest.dialogue-start';
    const cardId = 'card.ch1.dialogue-start';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'last', resumePolicy: 'restart-current-node', replayable: false,
          nodes: {
            last: { type: 'line', text: 'Let us begin.', caption: 'Begin', next: 'end' },
            end: {
              type: 'end',
              actions: [{ type: 'flag.set', flag: 'ch1.dialogueQuestStarted', value: true }],
            },
          },
        },
      },
      quests: {
        [questId]: {
          id: questId,
          startWhen: { allFlags: ['ch1.dialogueQuestStarted'] },
          startStep: 'first',
          onComplete: [],
          steps: {
            first: {
              objective: { caption: 'Continue' },
              doneWhen: { allFlags: ['ch1.dialogueQuestDone'] },
              onEnter: [{ type: 'collection.add', collection: 'cards', id: cardId }],
              onComplete: [],
              next: null,
            },
          },
        },
      },
    });
    const save = saveV3();
    const onDirty = vi.fn(({ save: candidate }) => ({
      ok: true, status: 'saved', save: structuredClone(candidate),
    }));
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });
    world.dialogue.open(scriptId);
    world.drainEvents();

    world.advanceDialogue();

    expect(save.progress.storyReceipts).toContain(scriptId);
    expect(save.progress.questReceipts).toEqual(expect.arrayContaining([
      `${questId}.quest.v1.adopted`,
      `${questId}.quest.v1.step.first.entered`,
    ]));
    expect(save.collections.cards).toContain(cardId);
    const completionWrite = onDirty.mock.calls.find(([request]) => (
      request.reason === 'dialogue-completion'
    ));
    expect(completionWrite?.[0].save).toMatchObject({
      progress: {
        storyReceipts: expect.arrayContaining([scriptId]),
        questReceipts: expect.arrayContaining([
          `${questId}.quest.v1.adopted`,
          `${questId}.quest.v1.step.first.entered`,
        ]),
      },
      collections: { cards: expect.arrayContaining([cardId]) },
    });
    const events = world.drainEvents();
    expect(events).toContainEqual(expect.objectContaining({
      type: 'reward.granted', payload: { collection: 'cards', id: cardId },
    }));
    expect(events).toContainEqual(expect.objectContaining({
      type: 'state.changed',
      payload: expect.objectContaining({
        reason: 'dialogue-completion',
        paths: expect.arrayContaining(['progress.questReceipts', 'collections.cards']),
      }),
    }));

    const recoveredSave = structuredClone(save);
    const recovered = new World({ chapters: { ch1: chapter }, save: recoveredSave, seed: 42 });
    expect(recoveredSave.collections.cards.filter((id) => id === cardId)).toHaveLength(1);
    expect(recovered.objective).toMatchObject({ caption: 'Continue' });
  });

  it('settles a quest enabled before an intermediate visible page in the cursor candidate', () => {
    const scriptId = 'ch1.dialogue.intermediate-quest';
    const questId = 'ch1.quest.intermediate-page';
    const cardId = 'card.ch1.intermediate-page';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'first', resumePolicy: 'restart-current-node', replayable: true,
          nodes: {
            first: { type: 'line', text: 'First', caption: 'First', next: 'startQuest' },
            startQuest: {
              type: 'action',
              actions: [{ type: 'flag.set', flag: 'ch1.intermediateQuestStarted', value: true }],
              next: 'second',
            },
            second: { type: 'line', text: 'Second', caption: 'Second', next: null },
          },
        },
      },
      quests: {
        [questId]: {
          id: questId,
          startWhen: { allFlags: ['ch1.intermediateQuestStarted'] },
          startStep: 'only', onComplete: [],
          steps: {
            only: {
              objective: { caption: 'Live objective' },
              doneWhen: { allFlags: ['ch1.intermediateQuestDone'] },
              onEnter: [{ type: 'collection.add', collection: 'cards', id: cardId }],
              onComplete: [], next: null,
            },
          },
        },
      },
    });
    const save = saveV3();
    const onDirty = vi.fn(({ save: candidate }) => ({
      ok: true, status: 'saved', save: structuredClone(candidate),
    }));
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });
    world.dialogue.open(scriptId);

    expect(world.advanceDialogue()).toMatchObject({ scriptId, nodeId: 'second' });

    expect(save.collections.cards).toContain(cardId);
    expect(save.progress.questReceipts).toEqual(expect.arrayContaining([
      `${questId}.quest.v1.adopted`,
      `${questId}.quest.v1.step.only.entered`,
    ]));
    const secondPageWrite = onDirty.mock.calls.find(([request]) => (
      request.reason === 'dialogue-cursor'
      && request.save.resume.dialogue?.node === 'second'
    ));
    expect(secondPageWrite?.[0].save.collections.cards).toContain(cardId);
    expect(secondPageWrite?.[0].save.progress.questReceipts).toContain(
      `${questId}.quest.v1.step.only.entered`,
    );

    const recoveredSave = structuredClone(save);
    const recovered = new World({ chapters: { ch1: chapter }, save: recoveredSave, seed: 42 });
    expect(recovered.dialoguePresentation).toMatchObject({ scriptId, nodeId: 'second' });
    expect(recoveredSave.collections.cards.filter((id) => id === cardId)).toHaveLength(1);
  });

  it('keeps an undurable dialogue page from replacing its previous visible cursor', () => {
    const scriptId = 'ch1.dialogue.cursor-retry';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'first', resumePolicy: 'restart-current-node', replayable: true,
          nodes: {
            first: { type: 'line', text: 'First', caption: 'First', next: 'second' },
            second: { type: 'line', text: 'Second', caption: 'Second', next: null },
          },
        },
      },
    });
    const save = saveV3();
    let failCursor = false;
    const world = new World({
      chapters: { ch1: chapter },
      save,
      seed: 42,
      onDirty: ({ reason, save: candidate }) => (
        reason === 'dialogue-cursor' && failCursor
          ? { ok: false, status: 'storage-error', save: null }
          : { ok: true, status: 'saved', save: structuredClone(candidate) }
      ),
    });
    world.dialogue.open(scriptId);
    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'first' });
    world.drainEvents();
    failCursor = true;

    expect(world.advanceDialogue()).toMatchObject({ scriptId, nodeId: 'first' });

    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'first' });
    expect(world.dialoguePresentation).toMatchObject({ scriptId, nodeId: 'first' });
    expect(world.drainEvents()).not.toContainEqual(expect.objectContaining({
      type: 'dialogue.lineChanged', payload: { script: scriptId, node: 'second' },
    }));

    failCursor = false;
    expect(world.advanceDialogue()).toMatchObject({ scriptId, nodeId: 'second' });
    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'second' });

    const unopenedSave = saveV3();
    const unopened = new World({
      chapters: { ch1: chapter },
      save: unopenedSave,
      seed: 42,
      onDirty: ({ reason, save: candidate }) => (
        reason === 'dialogue-cursor'
          ? { ok: false, status: 'storage-error', save: null }
          : { ok: true, status: 'saved', save: structuredClone(candidate) }
      ),
    });
    expect(unopened.dialogue.open(scriptId)).toBe(false);
    expect(unopened.dialogue.active).toBe(false);
    expect(unopenedSave.resume.dialogue).toBeNull();
  });

  it('keeps a restart-script cursor pending when its recovery write fails', () => {
    const scriptId = 'ch1.dialogue.restart-recovery';
    const chapter = storyChapter({
      onEnter: [{ type: 'flag.set', flag: 'ch1.sceneEntryReplayed', value: true }],
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'first', resumePolicy: 'restart-script', replayable: true,
          nodes: {
            first: { type: 'line', text: 'Restarted', caption: 'Restarted', next: 'saved' },
            saved: { type: 'line', text: 'Saved', caption: 'Saved', next: null },
          },
        },
      },
    });
    const savedCursor = { script: scriptId, node: 'saved' };
    const save = saveV3({ dialogue: savedCursor });
    let failCursor = true;
    const world = new World({
      chapters: { ch1: chapter },
      save,
      seed: 42,
      onDirty: ({ reason, save: candidate }) => {
        if (reason === 'dialogue-cursor' && failCursor) {
          failCursor = false;
          return { ok: false, status: 'storage-error', save: null };
        }
        return { ok: true, status: 'saved', save: structuredClone(candidate) };
      },
    });

    expect(world.sceneEntryPending).toBe(true);
    expect(world.dialogue.active).toBe(false);
    expect(save.resume.dialogue).toEqual(savedCursor);
    expect(save.progress.questFlags['ch1.sceneEntryReplayed']).toBeUndefined();

    world.update(0);

    expect(world.sceneEntryPending).toBe(false);
    expect(world.dialoguePresentation).toMatchObject({ scriptId, nodeId: 'first' });
    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'first' });
    expect(save.progress.questFlags['ch1.sceneEntryReplayed']).toBeUndefined();
  });

  it('retries set-piece travel with the deferred dialogue receipt in the travel write', () => {
    const scriptId = 'ch1.dialogue.travel-handoff';
    const setPieceId = 'ch1.setPiece.travel-handoff';
    const chapter = storyChapter({
      dialogues: {
        [scriptId]: {
          id: scriptId, start: 'last', resumePolicy: 'restart-current-node', replayable: false,
          nodes: {
            last: { type: 'line', text: 'This way.', caption: 'This way', next: 'end' },
            end: { type: 'end', actions: [{ type: 'setPiece.play', id: setPieceId }] },
          },
        },
      },
      setPieces: {
        [setPieceId]: {
          id: setPieceId, duration: 1, fallback: null, reducedMotion: null,
          params: {}, timeline: { tracks: [] },
          onComplete: [{ type: 'travel.request', room: 'ch1.room.next', spawn: 'start', transition: 'ink' }],
        },
      },
    });
    chapter.rooms['ch1.room.next'] = {
      id: 'ch1.room.next', size: { width: 1280, height: 720 },
      spawns: { start: { x: 960, y: 600, facing: 'left' } },
      occupants: [], hotspots: [], exits: [], ambientSetPieces: [],
    };
    chapter.scenes['ch1.scene.next'] = {
      id: 'ch1.scene.next', room: 'ch1.room.next', spawn: 'start', when: {}, onEnter: [],
    };
    const save = saveV3();
    let failTravel = true;
    const onDirty = vi.fn(({ reason, save: candidate }) => {
      if (reason === 'scene-change' && failTravel) {
        failTravel = false;
        return { ok: false, status: 'storage-error', save: null };
      }
      if (reason === 'dialogue-completion') {
        return { ok: false, status: 'unexpected-dialogue-write', save: null };
      }
      return { ok: true, status: 'saved', save: structuredClone(candidate) };
    });
    const world = new World({ chapters: { ch1: chapter }, save, seed: 42, onDirty });
    world.dialogue.open(scriptId);
    world.advanceDialogue();

    world.setPieces.skip();

    expect(world.roomId).toBe('ch1.room.story');
    expect(world.dialogue.active).toBe(false);
    expect(save.resume.dialogue).toEqual({ script: scriptId, node: 'last' });
    expect(save.progress.storyReceipts).toContain(setPieceId);
    expect(save.progress.storyReceipts).not.toContain(scriptId);
    expect(world.setPieces.pendingCompletion).toMatchObject({ stage: 'actions' });

    world.update(0);

    expect(world.roomId).toBe('ch1.room.next');
    expect(world.currentSceneId).toBe('ch1.scene.next');
    expect(save.resume.dialogue).toBeNull();
    expect(save.progress.storyReceipts).toEqual(expect.arrayContaining([setPieceId, scriptId]));
    expect(world.setPieces.pendingCompletion).toBeNull();
    const successfulTravel = onDirty.mock.calls.find(([request]) => (
      request.reason === 'scene-change'
      && request.save.progress.storyReceipts.includes(scriptId)
    ));
    expect(successfulTravel).toBeDefined();
    expect(onDirty.mock.calls.some(([request]) => request.reason === 'dialogue-completion')).toBe(false);

    const recovered = new World({
      chapters: { ch1: chapter }, save: structuredClone(save), seed: 42,
    });
    expect(recovered.roomId).toBe('ch1.room.next');
    expect(recovered.dialogue.active).toBe(false);
  });

  it('keeps version-one quest lifecycle declarations condition-derived under a v3 save', () => {
    const chapter = storyChapter({
      contractVersion: 1,
      quests: {
        'ch1.quest.legacy-async': {
          id: 'ch1.quest.legacy-async', startWhen: {}, startStep: 'visit_shop', onComplete: [],
          steps: {
            visit_shop: {
              objective: { caption: 'Visit the shop' },
              doneWhen: { allFlags: ['ch1.visitedShop'] },
              onEnter: [],
              onComplete: [{ type: 'ui.open', surface: 'satchel', tab: 'map' }],
              next: 'leave_shop',
            },
            leave_shop: {
              objective: { caption: 'Leave the shop' },
              doneWhen: { allFlags: ['ch1.leftShop'] },
              onEnter: [{ type: 'dialogue.start', script: 'ch1.dialogue.legacy' }],
              onComplete: [],
              next: null,
            },
          },
        },
      },
    });
    const save = saveV3();
    const world = new World({
      chapters: { ch1: chapter }, save, seed: 42, clock: () => NOW,
    });

    world.setFlag('ch1.visitedShop', true);

    expect(world.objective).toMatchObject({ caption: 'Leave the shop' });
    expect(world.overlay).toBeNull();
    expect(world.dialogue.active).toBe(false);
    expect(save.progress.questReceipts).toEqual([]);
    expect(() => serializeSave(save)).not.toThrow();
  });

  it('keeps v1 saves playable without introducing receipt or dialogue-cursor fields', () => {
    const save = createSaveV1({ now: NOW, appVersion: 'runtime-receipts-integration', worldSeed: 42 });
    save.resume = { chapter: 'ch1', scene: 'ch1.scene.story', room: 'ch1.room.story', spawn: 'start' };
    const chapter = storyChapter({
      dialogues: {
        'ch1.dialogue.legacy': {
          id: 'ch1.dialogue.legacy', start: 'line', nodes: {
            line: { type: 'line', text: 'Still playable', caption: 'Still playable', next: 'end' },
            end: { type: 'end', actions: [] },
          },
        },
      },
      quests: {
        'ch1.quest.legacy': {
          id: 'ch1.quest.legacy', startWhen: {}, startStep: 'step', onComplete: [],
          steps: {
            step: { objective: { caption: 'Legacy' }, doneWhen: {}, onEnter: [], onComplete: [], next: null },
          },
        },
      },
    });

    const world = new World({ chapters: { ch1: chapter }, save, seed: 42 });
    expect(world.dialogue.open('ch1.dialogue.legacy')).toMatchObject({ type: 'line' });
    expect(save.resume.dialogue).toBeUndefined();
    expect(save.progress.storyReceipts).toBeUndefined();
    expect(save.progress.questReceipts).toBeUndefined();
  });
});
