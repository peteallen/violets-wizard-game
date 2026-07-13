import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function createWorld({ flags = {}, room = 'ch1.bedroom', spawn = 'bedroom.start' } = {}) {
  const save = createSaveV1({
    now: '2026-07-12T18:00:00.000Z',
    appVersion: 'interaction-test',
    worldSeed: 42,
  });
  save.resume = { chapter: 'ch1', scene: 'ch1.letter', room, spawn };
  Object.assign(save.progress.questFlags, flags);
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  world.drainEvents();
  return world;
}

function settle(world, seconds = 3) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) world.update(1 / 60);
}

describe('one-tap world interactions', () => {
  it('approaches and activates a highlighted hotspot from one tap', () => {
    const world = createWorld();

    const result = world.tap({ x: 1060, y: 210 });

    expect(result.id).toBe('bedroom.owl');
    expect(world.flags['ch1.owlTapped']).not.toBe(true);
    expect(world.snapshot().pendingInteraction).toMatchObject({
      targetId: 'bedroom.owl',
      kind: 'action',
      approach: { x: 950, y: 605, facing: 'right' },
    });
    expect(world.drainEvents()).toContainEqual(expect.objectContaining({
      type: 'feedback.command',
      payload: expect.objectContaining({ kind: 'approach', target: 'bedroom.owl' }),
    }));

    settle(world);

    expect(world.flags['ch1.owlTapped']).toBe(true);
    expect(world.setPieces.active?.requestedId).toBe('sp.letter');
    expect(world.pendingInteraction).toBeNull();
    expect(world.player.x).toBe(950);
  });

  it('approaches a character and starts the conversation without a second tap', () => {
    const world = createWorld({ flags: { 'ch1.letterRead': true } });

    world.tap({ x: 250, y: 455 });
    expect(world.dialogue.active).toBe(false);
    expect(world.pendingInteraction?.targetId).toBe('bedroom.guide');

    settle(world, 1);

    expect(world.dialogue.active).toBe(true);
    expect(world.dialogue.scriptId).toBe('ch1.guide.arrival');
    expect(world.pendingInteraction).toBeNull();
    expect(world.player.x).toBe(360);
  });

  it('approaches a delivered prop and opens it from one tap', () => {
    const world = createWorld({ flags: { 'ch1.owlTapped': true } });

    world.tap({ x: 650, y: 350 });
    expect(world.pendingInteraction?.targetId).toBe('bedroom.letter');

    settle(world, 2);

    expect(world.flags['ch1.letterOpened']).toBe(true);
    expect(world.setPieces.active?.requestedId).toBe('sp.letterOpen');
    expect(world.dialogue.active).toBe(false);
    expect(world.player.x).toBe(760);

    settle(world, 3.4);

    expect(world.dialogue.active).toBe(true);
    expect(world.dialogue.scriptId).toBe('ch1.letter.read');
  });

  it('lets Violet follow Hagrid by tapping Hagrid once instead of finding a clipped door target', () => {
    const world = createWorld({ flags: { 'ch1.guideMet': true } });

    const result = world.tap({ x: 250, y: 455 });

    expect(result.id).toBe('bedroom.exit');
    expect(world.roomId).toBe('ch1.leaky');
    expect(world.pendingInteraction).toBeNull();
  });

  it('keeps an empty-floor tap as walk-only and cancels the queued interaction', () => {
    const world = createWorld();
    world.tap({ x: 1060, y: 210 });

    expect(world.tap({ x: 650, y: 610 })).toEqual({ kind: 'walk', x: 650 });
    expect(world.pendingInteraction).toBeNull();

    settle(world);
    expect(world.flags['ch1.owlTapped']).not.toBe(true);
    expect(world.setPieces.active).toBeNull();
  });

  it('does not activate a queued target after another modal interaction interrupts it', () => {
    const world = createWorld();
    world.tap({ x: 1060, y: 210 });
    world.runAction({ type: 'dialogue.start', script: 'ch1.violet.noSpells' });

    world.update(1 / 60);

    expect(world.pendingInteraction).toBeNull();
    expect(world.player.targetX).toBe(world.player.x);
    expect(world.flags['ch1.owlTapped']).not.toBe(true);
  });

  it('drops queued actions when their target disappears or the chapter changes', () => {
    const invalidated = createWorld();
    invalidated.tap({ x: 1060, y: 210 });
    invalidated.setFlag('ch1.owlTapped', true);
    invalidated.update(1 / 60);

    expect(invalidated.pendingInteraction).toBeNull();
    expect(invalidated.setPieces.active).toBeNull();

    const changedChapter = createWorld();
    changedChapter.tap({ x: 1060, y: 210 });
    changedChapter.changeChapter('ch2');
    settle(changedChapter, 1);

    expect(changedChapter.chapter.id).toBe('ch2');
    expect(changedChapter.pendingInteraction).toBeNull();
    expect(changedChapter.flags['ch1.owlTapped']).not.toBe(true);
  });
});
