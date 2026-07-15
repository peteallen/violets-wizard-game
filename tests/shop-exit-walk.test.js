import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function createShopWorld(room) {
  const save = createSaveV1({
    now: '2026-07-14T18:00:00.000Z',
    appVersion: 'shop-exit-walk-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch1',
    scene: 'ch1.diagonArrival',
    room,
    spawn: 'entry',
  };
  Object.assign(save.progress.questFlags, {
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
    'ch1.wandChosen': true,
    'ch1.trimChosen': true,
  });
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  world.drainEvents();
  return world;
}

describe('Diagon Alley shop exits', () => {
  it.each([
    ['ch1.ollivanders', 'ollivanders.exit'],
    ['ch1.malkins', 'malkins.exit'],
    ['ch1.menagerie', 'menagerie.exit'],
  ])('walks Violet through %s before transitioning outside', (shopRoom, exitId) => {
    const world = createShopWorld(shopRoom);
    const startingX = world.player.x;
    const startingY = world.player.y;

    world.interactSemantic(exitId);

    expect(world.roomId).toBe(shopRoom);
    expect(world.pendingInteraction).toMatchObject({
      targetId: exitId,
      kind: 'exit',
    });
    expect(world.drainEvents().some(({ type }) => type === 'room.transitionRequested')).toBe(false);

    world.update(0.1);

    expect(world.roomId).toBe(shopRoom);
    expect(world.player.walking).toBe(true);
    expect(world.player.x).not.toBe(startingX);
    expect(world.player.y).toBeLessThan(startingY);
    expect(world.player.scale).toBeLessThan(1);
    expect(world.drainEvents().some(({ type }) => type === 'room.transitionRequested')).toBe(false);

    let transition = null;
    for (let frame = 0; frame < 360 && !transition; frame += 1) {
      world.update(1 / 60);
      transition = world.drainEvents().find(({ type }) => type === 'room.transitionRequested') ?? null;
    }

    expect(transition).toMatchObject({
      payload: {
        from: shopRoom,
        to: 'ch1.diagonStreet',
        effect: 'ink',
      },
    });
    expect(world.roomId).toBe('ch1.diagonStreet');
    expect(world.pendingInteraction).toBeNull();
  });
});
