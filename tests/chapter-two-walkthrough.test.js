import { describe, expect, it } from 'vitest';
import { chapter2V2 } from '../src/game/chapters/ch2/content-v2/index.js';
import { chapter3 } from '../src/game/chapters/ch3/content.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-16T18:00:00.000Z';
const STEP_SECONDS = 1 / 60;
const CHAPTER_TWO_FLAGS = [
  'ch2.barrierCrossed',
  'ch2.boardedTrain',
  'ch2.friendsMet',
  'ch2.sweetChosen',
  'ch2.sweetReactionSeen',
  'ch2.trainComplete',
  'ch2.lakeSeen',
  'ch2.greatHallEntered',
  'ch2.sorting.cares.protect',
  'ch2.sorting.courage.truth',
  'ch2.sortedGryffindor',
  'ch2.feastAwarded',
  'ch2.feastComplete',
  'ch2.commonRoomArrived',
  'ch2.chapterCardSeen',
  'ch2.complete',
];

function createChapterTwoSave() {
  const save = createSaveV1({
    now: NOW,
    appVersion: 'chapter-two-walkthrough-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch2',
    scene: 'ch2.scene.kingsCross',
    room: 'ch2.kingsCross',
    spawn: 'start',
  };
  save.progress.highestUnlockedChapter = 2;
  save.progress.completedChapters = ['ch1'];
  save.progress.questFlags['ch1.complete'] = true;
  save.character.wandId = 'violet-first-wand';
  save.character.appearance.robeTrim = 'purple';
  save.character.pet = { type: 'cat', name: 'Biscuit' };
  save.collections.cards = ['morgana'];
  return save;
}

function settleUntil(world, predicate, visitScene, maximumSeconds = 12) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += STEP_SECONDS) {
    if (predicate()) return;
    world.update(STEP_SECONDS);
    visitScene();
  }
  if (!predicate()) throw new Error(`Chapter Two did not settle after ${maximumSeconds} seconds.`);
}

function runChapterTwoWalkthrough() {
  const save = createChapterTwoSave();
  const world = new World({
    chapters: { ch2: chapter2V2, ch3: chapter3 },
    save,
    seed: 42,
    clock: () => NOW,
  });
  const openingSnapshot = world.snapshot();
  const events = [];
  const spokenLines = [];
  const choiceSurfaces = [];
  const collectibleChecks = [];
  const scenes = [];
  const visitScene = () => {
    if (scenes.at(-1) !== world.currentSceneId) scenes.push(world.currentSceneId);
  };
  const drainEvents = () => events.push(...world.drainEvents());
  const settle = (predicate = () => !world.pendingInteraction && !world.setPieces.active) => {
    settleUntil(world, predicate, visitScene);
    drainEvents();
  };
  const interact = (targetId) => {
    world.interactSemantic(targetId);
    settle();
  };
  const recordDialogueSurface = () => {
    const presentation = world.dialogue.presentation();
    if (presentation?.type === 'line') {
      spokenLines.push({
        script: presentation.scriptId,
        node: presentation.nodeId,
        speaker: presentation.speaker,
      });
    }
    if (presentation?.type === 'choice') {
      choiceSurfaces.push({
        script: presentation.scriptId,
        node: presentation.nodeId,
        choices: presentation.choices.map(({ id, icon }) => ({ id, icon })),
      });
    }
    return presentation;
  };
  const advanceLine = () => {
    const presentation = recordDialogueSurface();
    if (presentation?.type !== 'line') {
      throw new Error(`Expected a dialogue line, received ${presentation?.type ?? 'nothing'}.`);
    }
    world.advanceDialogue();
    drainEvents();
  };
  const choose = (choiceId) => {
    const presentation = recordDialogueSurface();
    if (presentation?.type !== 'choice') {
      throw new Error(`Expected a dialogue choice, received ${presentation?.type ?? 'nothing'}.`);
    }
    world.advanceDialogue(choiceId);
    drainEvents();
  };

  visitScene();
  drainEvents();

  interact('ch2.kingsCross.barrier');

  interact('ch2.platform.conductor');
  advanceLine();
  visitScene();

  interact('ch2.train.harry');
  advanceLine();
  advanceLine();
  advanceLine();
  visitScene();

  collectibleChecks.push({
    id: 'ch2.train.card',
    initialTier: world.snapshot().targets.find(({ id }) => id === 'ch2.train.card')?.salience.tier,
  });
  interact('ch2.train.card');
  collectibleChecks.at(-1).retired = !world.targets().some(({ id }) => id === 'ch2.train.card');
  interact('ch2.train.trolley');
  advanceLine();
  choose('chocolateFrog');
  settle();

  interact('ch2.train.window');
  visitScene();

  collectibleChecks.push({
    id: 'ch2.greatHall.card',
    initialTier: world.snapshot().targets.find(({ id }) => id === 'ch2.greatHall.card')?.salience.tier,
  });
  interact('ch2.greatHall.card');
  collectibleChecks.at(-1).retired = !world.targets().some(({ id }) => id === 'ch2.greatHall.card');
  interact('ch2.greatHall.deputyHead');
  advanceLine();
  visitScene();

  interact('ch2.greatHall.sortingHat');
  advanceLine();
  choose('protectFriends');
  advanceLine();
  choose('tellTruth');
  advanceLine();
  advanceLine();
  advanceLine();
  settle();
  visitScene();

  interact('ch2.greatHall.headmaster');
  advanceLine();

  interact('ch2.greatHall.toCommonRoom');
  visitScene();
  interact('ch2.commonRoom.harry');
  advanceLine();
  settle();
  visitScene();

  advanceLine();
  visitScene();

  return {
    save: structuredClone(save),
    scenes,
    spokenLines,
    choiceSurfaces,
    collectibleChecks,
    events: events.map(({ type, payload }) => ({ type, payload })),
    world: {
      chapter: world.chapter.id,
      scene: world.currentSceneId,
      room: world.roomId,
      dialogueActive: world.dialogue.active,
      setPieceActive: Boolean(world.setPieces.active),
    },
    openingSnapshot: {
      playerActorId: openingSnapshot.actors.find(({ characterId }) => (
        characterId === 'character.violet'
      ))?.actorId,
      petActorId: openingSnapshot.actors.find(({ characterId }) => (
        characterId === 'character.cat'
      ))?.actorId,
      roomVariant: openingSnapshot.roomVariant,
    },
  };
}

describe('Chapter Two headless walkthrough', () => {
  it('rehydrates an interrupted sweet reaction with a safe way to finish it', () => {
    const save = createChapterTwoSave();
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.trolleySweets',
      room: 'ch2.trainCompartment',
      spawn: 'window',
    };
    Object.assign(save.progress.questFlags, {
      'ch2.barrierCrossed': true,
      'ch2.boardedTrain': true,
      'ch2.friendsMet': true,
      'ch2.sweetChosen': true,
    });
    save.progress.storyChoices['ch2.choice.sweet'] = 'chocolate-frog';

    const world = new World({
      chapters: { ch2: chapter2V2 },
      save,
      seed: 42,
      clock: () => NOW,
    });
    const recoveryTarget = world.targets().find(({ actions }) => actions.some((action) => (
      action.type === 'dialogue.start' && action.script === 'ch2.dialogue.trolleySweets'
    )));

    expect(world.currentSceneId).toBe('ch2.scene.trolleySweets');
    expect(world.flags['ch2.sweetReactionSeen']).not.toBe(true);
    expect(recoveryTarget).toMatchObject({
      id: 'ch2.train.trolleyRecovery',
      source: 'hotspot',
      repeat: 'until-condition',
    });

    world.interactSemantic(recoveryTarget.id);
    settleUntil(world, () => world.dialogue.active, () => {});
    expect(world.dialogue.scriptId).toBe('ch2.dialogue.trolleySweets');
    world.advanceDialogue();
    world.advanceDialogue('chocolateFrog');
    settleUntil(world, () => world.flags['ch2.sweetReactionSeen'] === true, () => {});

    expect(world.flags['ch2.sweetReactionSeen']).toBe(true);
    expect(world.targets().some(({ id }) => id === 'ch2.train.window')).toBe(true);
  });

  it('replaces stale Sorting answers after reload before choosing the Hat reason', () => {
    const save = createChapterTwoSave();
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.sorting',
      room: 'ch2.greatHall',
      spawn: 'sorting',
    };
    Object.assign(save.progress.questFlags, {
      'ch2.barrierCrossed': true,
      'ch2.boardedTrain': true,
      'ch2.friendsMet': true,
      'ch2.sweetChosen': true,
      'ch2.sweetReactionSeen': true,
      'ch2.trainComplete': true,
      'ch2.lakeSeen': true,
      'ch2.greatHallEntered': true,
      'ch2.sorting.cares.protect': true,
      'ch2.sorting.courage.forward': true,
    });

    const world = new World({
      chapters: { ch2: chapter2V2 },
      save,
      seed: 42,
      clock: () => NOW,
    });
    world.interactSemantic('ch2.greatHall.sortingHat');
    settleUntil(world, () => world.dialogue.active, () => {});
    world.advanceDialogue();
    world.advanceDialogue('helpSomeone');
    world.advanceDialogue();
    world.advanceDialogue('tellTruth');

    expect(world.flags).toMatchObject({
      'ch2.sorting.cares.protect': false,
      'ch2.sorting.cares.explore': false,
      'ch2.sorting.cares.help': true,
      'ch2.sorting.courage.forward': false,
      'ch2.sorting.courage.truth': true,
      'ch2.sorting.courage.together': false,
    });
    expect(world.dialogue.presentation()).toMatchObject({
      scriptId: 'ch2.dialogue.sorting',
      nodeId: 'helpReason',
    });
    world.advanceDialogue();
    expect(world.dialogue.presentation()).toMatchObject({ nodeId: 'truthReason' });
  });

  it('does not expose the feast conversation before Sorting is complete', () => {
    const save = createChapterTwoSave();
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.sorting',
      room: 'ch2.greatHall',
      spawn: 'sorting',
    };
    Object.assign(save.progress.questFlags, {
      'ch2.barrierCrossed': true,
      'ch2.boardedTrain': true,
      'ch2.friendsMet': true,
      'ch2.sweetChosen': true,
      'ch2.sweetReactionSeen': true,
      'ch2.trainComplete': true,
      'ch2.lakeSeen': true,
      'ch2.greatHallEntered': true,
    });

    const world = new World({
      chapters: { ch2: chapter2V2 },
      save,
      seed: 42,
      clock: () => NOW,
    });

    expect(world.currentSceneId).toBe('ch2.scene.sorting');
    expect(world.targets().some(({ actions }) => actions.some((action) => (
      action.type === 'dialogue.start' && action.script === 'ch2.dialogue.feast'
    )))).toBe(false);
  });

  it('keeps the feast card and Headmaster as separate pointer targets', () => {
    const save = createChapterTwoSave();
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.feast',
      room: 'ch2.greatHall',
      spawn: 'table',
    };
    Object.assign(save.progress.questFlags, {
      'ch2.barrierCrossed': true,
      'ch2.boardedTrain': true,
      'ch2.friendsMet': true,
      'ch2.sweetChosen': true,
      'ch2.sweetReactionSeen': true,
      'ch2.trainComplete': true,
      'ch2.lakeSeen': true,
      'ch2.greatHallEntered': true,
      'ch2.sortedGryffindor': true,
    });

    const world = new World({ chapters: { ch2: chapter2V2 }, save, seed: 42, clock: () => NOW });

    expect(world.tap({ x: 400, y: 475 }).id).toBe('ch2.greatHall.card');
    expect(world.flags['ch2.feastAwarded']).not.toBe(true);
    expect(world.tap({ x: 1080, y: 450 }).id).toBe('ch2.greatHall.headmaster');
    expect(world.dialogue.scriptId).toBe('ch2.dialogue.feast');
  });

  it.each([false, true])(
    'lands normal and reduced-motion barrier runs at the same durable platform spawn (reduced motion: %s)',
    (reducedMotion) => {
      const save = createChapterTwoSave();
      save.settings.reducedMotion = reducedMotion;
      const world = new World({ chapters: { ch2: chapter2V2 }, save, seed: 42, clock: () => NOW });

      world.interactSemantic('ch2.kingsCross.barrier');
      settleUntil(world, () => world.flags['ch2.barrierCrossed'] === true, () => {});

      expect(world.currentSceneId).toBe('ch2.scene.barrierPlatform');
      expect(world.roomId).toBe('ch2.kingsCross');
      expect(world.player).toMatchObject({ x: 220, y: 620, targetX: 220, targetY: 620, facing: 'right' });
      expect(save.resume).toEqual({
        chapter: 'ch2',
        scene: 'ch2.scene.barrierPlatform',
        room: 'ch2.kingsCross',
        spawn: 'platform',
      });

      const reconstructed = new World({
        chapters: { ch2: chapter2V2 },
        save: structuredClone(save),
        seed: 42,
        clock: () => NOW,
      });
      expect(reconstructed.currentSceneId).toBe(world.currentSceneId);
      expect(reconstructed.roomId).toBe(world.roomId);
      expect(reconstructed.player).toEqual(world.player);
      expect(reconstructed.snapshot().pet).toEqual(world.snapshot().pet);
    },
  );

  it('plays Violet into Gryffindor and hands the completed story to Chapter Three deterministically', () => {
    const first = runChapterTwoWalkthrough();
    const second = runChapterTwoWalkthrough();

    expect(second).toEqual(first);
    expect(first.scenes).toEqual([
      'ch2.scene.kingsCross',
      'ch2.scene.barrierPlatform',
      'ch2.scene.trainFriends',
      'ch2.scene.trolleySweets',
      'ch2.scene.lakeVista',
      'ch2.scene.greatHall',
      'ch2.scene.sorting',
      'ch2.scene.feast',
      'ch2.scene.commonRoomArrival',
      'ch2.scene.chapterCard',
      'ch3.scene.preview',
    ]);
    expect(first.world).toEqual({
      chapter: 'ch3',
      scene: 'ch3.scene.preview',
      room: 'ch3.previewRoom',
      dialogueActive: true,
      setPieceActive: false,
    });
    expect(first.openingSnapshot).toEqual({
      playerActorId: 'ch2.npc.violet',
      petActorId: 'ch2.npc.pet.cat',
      roomVariant: 'base',
    });

    expect(first.spokenLines.map(({ speaker }) => speaker).slice(0, 4)).toEqual([
      'ch2.npc.conductor',
      'ch2.npc.harry',
      'ch2.npc.ron',
      'ch2.npc.hermione',
    ]);
    expect(first.spokenLines.some(({ speaker }) => speaker === 'ch2.npc.violet')).toBe(false);
    expect(first.spokenLines).toContainEqual(expect.objectContaining({
      script: 'ch2.dialogue.sorting',
      node: 'truthReason',
      speaker: 'ch2.npc.sortingHat',
    }));
    expect(first.choiceSurfaces).toEqual([
      {
        script: 'ch2.dialogue.trolleySweets',
        node: 'choose',
        choices: [
          { id: 'everyFlavorBeans', icon: 'icons/ch2/every-flavor-beans' },
          { id: 'chocolateFrog', icon: 'icons/ch2/chocolate-frog' },
          { id: 'cauldronCake', icon: 'icons/ch2/cauldron-cake' },
        ],
      },
      {
        script: 'ch2.dialogue.sorting',
        node: 'careChoice',
        choices: [
          { id: 'protectFriends', icon: 'icons/ch2/protect-friends' },
          { id: 'exploreMysteries', icon: 'icons/ch2/explore-mysteries' },
          { id: 'helpSomeone', icon: 'icons/ch2/help-someone' },
        ],
      },
      {
        script: 'ch2.dialogue.sorting',
        node: 'courageChoice',
        choices: [
          { id: 'stepForward', icon: 'icons/ch2/step-forward' },
          { id: 'tellTruth', icon: 'icons/ch2/tell-truth' },
          { id: 'stayClose', icon: 'icons/ch2/stay-close' },
        ],
      },
    ]);
    expect(first.collectibleChecks).toEqual([
      { id: 'ch2.train.card', initialTier: 'secret', retired: true },
      { id: 'ch2.greatHall.card', initialTier: 'secret', retired: true },
    ]);

    expect(first.save.progress.questFlags).toMatchObject(Object.fromEntries(
      CHAPTER_TWO_FLAGS.map((flag) => [flag, true]),
    ));
    expect(first.save.progress.storyChoices).toMatchObject({
      'ch2.choice.sweet': 'chocolate-frog',
      'ch2.choice.sortingCare': 'protect-friends',
      'ch2.choice.sortingCourage': 'tell-truth',
    });
    expect(first.save.character).toMatchObject({
      house: 'gryffindor',
      wandId: 'violet-first-wand',
      appearance: { robeTrim: 'purple' },
      pet: { type: 'cat', name: 'Biscuit' },
    });
    expect(first.save.collections).toMatchObject({
      cards: ['morgana', 'merlin', 'jocunda-sykes'],
      housePoints: 10,
    });
    expect(first.save.progress.rewardReceipts).toEqual([
      'ch2.reward.card.train',
      'ch2.reward.card.greatHall',
      'ch2.reward.firstHousePoints',
    ]);
    expect(first.save.progress.completedChapters).toEqual(['ch1', 'ch2']);
    expect(first.save.progress.highestUnlockedChapter).toBe(3);
    expect(first.save.yearbook.entries).toEqual([]);

    expect(first.events.filter(({ type }) => type === 'yearbook.captureRequested')).toEqual([
      {
        type: 'yearbook.captureRequested',
        payload: { moment: 'ch2.yearbook.sorting', caption: 'Magic!' },
      },
    ]);
    expect(first.events.filter(({ type }) => type === 'chapter.completed')).toEqual([
      {
        type: 'chapter.completed',
        payload: { chapter: 'ch2', nextChapter: 'ch3' },
      },
    ]);
    expect(first.events.filter(({ type, payload }) => (
      type === 'setPiece.completed' && payload.id === 'ch2.setPiece.lakeVista'
    ))).toHaveLength(1);
  });
});
