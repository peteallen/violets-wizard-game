import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const streetProgress = Object.freeze({
  'ch1.owlTapped': true,
  'ch1.letterOpened': true,
  'ch1.letterRead': true,
  'ch1.guideMet': true,
  'ch1.leakyReached': true,
  'ch1.courtyardReached': true,
  'ch1.wallOpened': true,
  'ch1.diagonReached': true,
  'ch1.satchelReceived': true,
  'ch1.mapUsed': true,
});

const roomScenes = Object.freeze({
  'ch1.ollivanders': 'ch1.wandShopping',
  'ch1.malkins': 'ch1.robeShopping',
  'ch1.menagerie': 'ch1.petShopping',
});

function createWorld({ room, flags = {}, finishDialogue = true }) {
  const save = createSaveV1({
    now: '2026-07-23T12:00:00.000Z',
    appVersion: 'inviting-targets-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch1',
    scene: roomScenes[room],
    room,
    spawn: 'entry',
  };
  Object.assign(save.progress.questFlags, streetProgress, flags);
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  if (finishDialogue) finishAutoDialogue(world);
  world.drainEvents();
  return world;
}

function finishAutoDialogue(world) {
  while (world.dialogue.active) {
    expect(world.dialogue.node.type).not.toBe('choice');
    world.advanceDialogue();
  }
}

function settleUntil(world, predicate, maximumSeconds = 8) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += 1 / 60) {
    if (predicate()) return;
    world.update(1 / 60);
  }
  expect(predicate()).toBe(true);
}

function expectSoleThread(world, targetId) {
  const threadTargets = world.snapshot().targets.filter(
    (target) => target.salience.tier === 'thread',
  );
  expect(threadTargets).toHaveLength(1);
  expect(threadTargets[0].id).toBe(targetId);
}

const wandBoxes = [
  { x: 535, y: 382 },
  { x: 782, y: 382 },
  { x: 1054, y: 382 },
];

const wandStages = [
  {
    flags: {},
    thread: 'ollivanders.wand1',
    setPiece: 'sp.wandChaos1',
    objectiveIndex: 0,
    approach: { x: 690, y: 610, facing: 'right' },
    targetIds: [
      'ollivanders.wand1',
      'ollivanders.box2ToWand1',
      'ollivanders.box3ToWand1',
    ],
  },
  {
    flags: { 'ch1.wandTry1': true },
    thread: 'ollivanders.wand2',
    setPiece: 'sp.wandChaos2',
    objectiveIndex: 1,
    approach: { x: 910, y: 610, facing: 'right' },
    targetIds: [
      'ollivanders.box1ToWand2',
      'ollivanders.wand2',
      'ollivanders.box3ToWand2',
    ],
  },
  {
    flags: { 'ch1.wandTry1': true, 'ch1.wandTry2': true },
    thread: 'ollivanders.wand3',
    setPiece: 'sp.wandChosen',
    objectiveIndex: 2,
    approach: { x: 1080, y: 610, facing: 'right' },
    targetIds: [
      'ollivanders.box1ToWand3',
      'ollivanders.box2ToWand3',
      'ollivanders.wand3',
    ],
  },
];

describe('inviting Chapter One shop targets', () => {
  it('frames the wand moment as a guided sequence instead of a free colour choice', () => {
    const world = createWorld({ room: 'ch1.ollivanders', finishDialogue: false });

    expect(world.dialoguePresentation).toMatchObject({
      caption: 'Try this one!',
    });
  });

  it.each(wandStages)(
    'redirects every painted wand box to $setPiece while keeping $thread as the sole thread',
    ({ flags, thread, setPiece, objectiveIndex, approach, targetIds }) => {
      for (const [index, point] of wandBoxes.entries()) {
        const world = createWorld({ room: 'ch1.ollivanders', flags });

        expectSoleThread(world, thread);
        expect(new Set(world.targets().map(({ id }) => id)).size).toBe(world.targets().length);
        expect(world.targetAt(point)).toMatchObject({
          id: targetIds[index],
          approach,
          presentation: { glow: index === objectiveIndex ? 'objective' : 'none' },
        });

        const tapped = world.tap(point);

        expect(tapped).toMatchObject({ id: targetIds[index], kind: 'action' });
        expect(tapped.kind).not.toBe('walk');
        expect(world.pendingInteraction).toMatchObject({
          targetId: targetIds[index],
          kind: 'action',
          approach,
        });

        settleUntil(world, () => world.setPieces.active?.requestedId === setPiece);

        expect(world.setPieces.active?.requestedId).toBe(setPiece);
        expect(world.pendingInteraction).toBeNull();
      }
    },
  );

  it.each([
    ['menagerie.cat', { x: 650, y: 520 }],
    ['menagerie.owl', { x: 900, y: 455 }],
    ['menagerie.toad', { x: 1110, y: 530 }],
  ])('redirects a tap on %s to the keeper conversation', (targetId, point) => {
    const world = createWorld({
      room: 'ch1.menagerie',
      flags: { 'ch1.wandChosen': true, 'ch1.trimChosen': true },
    });

    expectSoleThread(world, 'menagerie.keeper');

    const tapped = world.tap(point);

    expect(tapped).toMatchObject({ id: targetId, kind: 'talk' });
    expect(tapped.kind).not.toBe('walk');
    expect(world.pendingInteraction).toMatchObject({
      targetId,
      approach: { x: 390, y: 610, facing: 'left' },
    });
    settleUntil(world, () => world.dialogue.active);
    expect(world.dialogue.scriptId).toBe('ch1.keeper.petAndName');
    expect(world.roomId).toBe('ch1.menagerie');
  });

  it('lets Madam Malkin win the overlapping doorway hit test and begin the fitting', () => {
    const world = createWorld({
      room: 'ch1.malkins',
      flags: { 'ch1.wandChosen': true },
    });

    expectSoleThread(world, 'malkins.stool');

    const tapped = world.tap({ x: 310, y: 455 });

    expect(tapped).toMatchObject({ id: 'malkins.tailor', kind: 'talk' });
    expect(tapped.kind).not.toBe('walk');
    expect(world.pendingInteraction?.targetId).toBe('malkins.tailor');
    settleUntil(world, () => world.dialogue.active);
    expect(world.dialogue.scriptId).toBe('ch1.tailor.fitting');
    expect(world.roomId).toBe('ch1.malkins');
  });

  it.each([
    ['ch1.ollivanders', {}, { x: 75, y: 200 }],
    ['ch1.malkins', { 'ch1.wandChosen': true }, { x: 400, y: 220 }],
    [
      'ch1.menagerie',
      { 'ch1.wandChosen': true, 'ch1.trimChosen': true },
      { x: 75, y: 200 },
    ],
  ])('keeps the actual doorway usable in %s', (room, flags, point) => {
    const world = createWorld({ room, flags });

    const tapped = world.tap(point);

    expect(tapped).toMatchObject({ kind: 'exit' });
    settleUntil(world, () => world.roomId === 'ch1.diagonStreet');
    expect(world.roomId).toBe('ch1.diagonStreet');
  });
});
