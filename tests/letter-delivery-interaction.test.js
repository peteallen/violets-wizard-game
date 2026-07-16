import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function createDeliveredLetterWorld() {
  const save = createSaveV1({
    now: '2026-07-16T19:00:00.000Z',
    appVersion: 'letter-delivery-interaction-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch1',
    scene: 'ch1.letter',
    room: 'ch1.bedroom',
    spawn: 'bedroom.start',
  };
  save.progress.questFlags['ch1.owlTapped'] = true;
  return new World({ chapters: contentRegistry, save, seed: 42 });
}

function advance(world, seconds) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) world.update(1 / 60);
}

describe('letter delivery interaction timing', () => {
  it('returns control as soon as the delivered letter reaches its resting pose', () => {
    const world = createDeliveredLetterWorld();

    world.runAction({ type: 'setPiece.play', id: 'sp.letter' });
    advance(world, 2.2);

    expect(world.setPieces.active?.requestedId).toBe('sp.letter');
    expect(world.tap({ x: 650, y: 350 })).toEqual({ kind: 'blocked', reason: 'set-piece' });

    advance(world, 0.05);

    expect(world.setPieces.active).toBeNull();
    expect(world.snapshot().targets.some(({ id }) => id === 'bedroom.letter')).toBe(true);
    expect(world.tap({ x: 650, y: 350 })?.id).toBe('bedroom.letter');
  });
});
