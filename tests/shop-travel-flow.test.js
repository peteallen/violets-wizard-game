import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const streetProgress = {
  'ch1.owlTapped': true,
  'ch1.letterOpened': true,
  'ch1.letterRead': true,
  'ch1.guideMet': true,
  'ch1.leakyReached': true,
  'ch1.courtyardReached': true,
  'ch1.wallOpened': true,
  'ch1.diagonReached': true,
  'ch1.satchelReceived': true,
};

function createWorld({ flags = {}, room = 'ch1.diagonStreet', spawn = 'west' } = {}) {
  const save = createSaveV1({
    now: '2026-07-14T18:00:00.000Z',
    appVersion: 'shop-travel-test',
    worldSeed: 42,
  });
  save.resume = { chapter: 'ch1', scene: 'ch1.diagonArrival', room, spawn };
  Object.assign(save.progress.questFlags, streetProgress, flags);
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  world.drainEvents();
  return world;
}

function settleUntil(world, predicate, maximumSeconds = 6) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += 1 / 60) {
    if (predicate()) return;
    world.update(1 / 60);
  }
  expect(predicate()).toBe(true);
}

describe('direct Diagon Alley shop travel', () => {
  it('lets Violet take Ollivanders street door without first selecting it on the map', () => {
    const world = createWorld();

    expect(world.flags['ch1.mapUsed']).not.toBe(true);
    expect(world.snapshot().targets.find(({ id }) => id === 'street.ollivandersDoor')?.salience)
      .toMatchObject({ tier: 'discoverable' });
    expect(world.snapshot().affordances.thread).toMatchObject({
      targetId: 'hud.satchel',
      worldTargetId: null,
      channel: 'hud',
    });
    expect(world.snapshot().targets.some(({ id }) => id === 'street.guide')).toBe(false);
    expect(world.snapshot().occupants.find(({ npc }) => npc === 'npc.guide')?.x).toBe(490);

    const tapped = world.tap({ x: 295, y: 455 });

    expect(tapped.id).toBe('street.ollivandersDoor');
    expect(world.roomId).toBe('ch1.diagonStreet');
    expect(world.pendingInteraction).toMatchObject({
      targetId: 'street.ollivandersDoor',
      kind: 'exit',
      approach: { x: 295, facing: 'right' },
    });

    settleUntil(world, () => world.roomId === 'ch1.ollivanders');

    expect(world.flags['ch1.mapUsed']).toBe(true);
    expect(world.currentSceneId).toBe('ch1.wandShopping');
    expect(world.dialogue.scriptId).toBe('ch1.wandmaker.welcome');
  });

  it.each([
    ['street.malkinsDoor', { x: 710, y: 455 }, 'ch1.malkins', { 'ch1.mapUsed': true, 'ch1.wandChosen': true }],
    ['street.menagerieDoor', { x: 1140, y: 455 }, 'ch1.menagerie', {
      'ch1.mapUsed': true,
      'ch1.wandChosen': true,
      'ch1.trimChosen': true,
    }],
  ])('lets Violet enter %s from its painted doorway', (doorId, point, destination, flags) => {
    const world = createWorld({ flags });

    const tapped = world.tap(point);

    expect(tapped.id).toBe(doorId);
    expect(world.roomId).toBe('ch1.diagonStreet');
    expect(world.pendingInteraction?.targetId).toBe(doorId);
    settleUntil(world, () => world.roomId === destination);
  });

  it.each([
    ['ch1.ollivanders', 'entry', 'ollivanders.exit', 75, 'left', 180],
    ['ch1.malkins', 'entry', 'malkins.exit', 350, 'right', 180],
    ['ch1.menagerie', 'entry', 'menagerie.exit', 85, 'left', 1100],
  ])('walks visibly through the authored exit from %s before returning outside', (
    room,
    spawn,
    exitId,
    expectedDoorX,
    expectedFacing,
    expectedStreetX,
  ) => {
    const world = createWorld({
      flags: {
        'ch1.mapUsed': true,
        'ch1.wandChosen': true,
        'ch1.trimChosen': true,
      },
      room,
      spawn,
    });
    const startingX = world.player.x;

    world.interactSemantic(exitId);

    expect(world.roomId).toBe(room);
    expect(world.pendingInteraction).toMatchObject({
      targetId: exitId,
      kind: 'exit',
      approach: { x: expectedDoorX, facing: expectedFacing },
    });

    world.update(0.1);

    expect(world.roomId).toBe(room);
    expect(world.player.walking).toBe(true);
    expect(world.player.x).not.toBe(startingX);

    settleUntil(world, () => world.roomId === 'ch1.diagonStreet');

    expect(world.player.x).toBe(expectedStreetX);
    expect(world.pendingInteraction).toBeNull();
  });
});
