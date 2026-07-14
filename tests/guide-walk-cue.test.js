import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1, validateSaveV1 } from '../src/game/systems/Save.js';
import {
  GUIDE_WALK_CUE,
  GUIDE_WALK_CUES,
  createGuideWalkCueSnapshot,
} from '../src/game/world/GuideWalkCue.js';
import { World } from '../src/game/world/World.js';

function createBedroomWorld({ guideMet = false, reducedMotion = false } = {}) {
  const save = createSaveV1({
    now: '2026-07-13T12:00:00.000Z',
    appVersion: 'guide-cue-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch1',
    scene: 'ch1.guideArrival',
    room: 'ch1.bedroom',
    spawn: 'bedroom.letter',
  };
  Object.assign(save.progress.questFlags, {
    'ch1.owlTapped': true,
    'ch1.letterOpened': true,
    'ch1.letterRead': true,
    ...(guideMet ? { 'ch1.guideMet': true } : {}),
  });
  save.settings.reducedMotion = reducedMotion;
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  world.drainEvents();
  return world;
}

function createLeakyWorld({ leakyReached = false, reducedMotion = false } = {}) {
  const save = createSaveV1({
    now: '2026-07-13T12:00:00.000Z',
    appVersion: 'guide-cue-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch1',
    scene: 'ch1.leakyArrival',
    room: 'ch1.leaky',
    spawn: 'leaky.entry',
  };
  Object.assign(save.progress.questFlags, {
    'ch1.owlTapped': true,
    'ch1.letterOpened': true,
    'ch1.letterRead': true,
    'ch1.guideMet': true,
    ...(leakyReached ? { 'ch1.leakyReached': true } : {}),
  });
  save.settings.reducedMotion = reducedMotion;
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  world.drainEvents();
  return world;
}

describe('Hagrid leads Violet through the first two rooms', () => {
  it('leaves through the bedroom door after his introduction instead of waiting for a second Hagrid tap', () => {
    const world = createBedroomWorld();
    expect(world.snapshot().tapToWalkCue).toBeNull();

    world.runAction({ type: 'dialogue.start', script: 'ch1.guide.arrival' });
    world.advanceDialogue();

    const started = world.snapshot().tapToWalkCue;
    expect(world.flags['ch1.guideMet']).toBe(true);
    expect(started).toMatchObject({
      id: 'ch1.guideLeavesBedroom',
      roomId: 'ch1.bedroom',
      stage: 'walk',
      voice: null,
      guide: {
        x: GUIDE_WALK_CUE.startX,
        facing: 'left',
        pose: 'walking',
        walking: true,
        visible: true,
      },
    });

    world.update(GUIDE_WALK_CUE.walkSeconds / 2);
    const walking = world.snapshot().tapToWalkCue;
    expect(walking.guide.x).toBeLessThan(GUIDE_WALK_CUE.startX);
    expect(walking.guide.x).toBeGreaterThan(GUIDE_WALK_CUE.destinationX);
    expect(walking.footprints.progress).toBeGreaterThan(0);

    world.update(GUIDE_WALK_CUE.walkSeconds / 2 + 0.1);
    const departed = world.snapshot().tapToWalkCue;
    expect(departed).toMatchObject({
      stage: 'departed',
      guide: {
        x: GUIDE_WALK_CUE.destinationX,
        facing: 'left',
        pose: 'idle',
        walking: false,
        visible: false,
      },
      footprints: { progress: 1 },
    });
    expect(world.snapshot().occupants.some(({ npc }) => npc === 'npc.guide')).toBe(false);
    expect(world.snapshot().targets.find(({ id }) => id === 'bedroom.exit')?.salience)
      .toMatchObject({ tier: 'thread', visible: 'thread' });
    const events = world.drainEvents();
    expect(events.some((event) => event.type === 'audio.command')).toBe(false);
  });

  it('walks out of the Leaky Cauldron as soon as “This way!” finishes, leaving Violet to follow', () => {
    const world = createLeakyWorld();
    expect(world.dialogue.scriptId).toBe('ch1.guide.leaky');

    world.advanceDialogue();

    const started = world.snapshot().tapToWalkCue;
    expect(world.flags['ch1.leakyReached']).toBe(true);
    expect(started).toMatchObject({
      id: 'ch1.guideLeavesLeaky',
      roomId: 'ch1.leaky',
      stage: 'walk',
      guide: {
        x: GUIDE_WALK_CUES.leaky.startX,
        facing: 'right',
        pose: 'walking',
        walking: true,
        visible: true,
      },
    });

    world.update(GUIDE_WALK_CUES.leaky.walkSeconds / 2);
    expect(world.snapshot().tapToWalkCue.guide.x).toBeGreaterThan(GUIDE_WALK_CUES.leaky.startX);

    world.update(GUIDE_WALK_CUES.leaky.walkSeconds / 2 + 0.1);
    const departed = world.snapshot();
    expect(departed.tapToWalkCue).toMatchObject({
      stage: 'departed',
      guide: { x: GUIDE_WALK_CUES.leaky.destinationX, visible: false },
      footprints: { progress: 1 },
    });
    expect(departed.player.x).toBe(160);
    expect(departed.occupants.some(({ npc }) => npc === 'npc.guide')).toBe(false);
    expect(departed.targets.find(({ id }) => id === 'leaky.courtyardDoor')?.salience)
      .toMatchObject({ tier: 'thread', visible: 'thread' });

    world.interactSemantic('leaky.courtyardDoor');
    expect(world.roomId).toBe('ch1.courtyard');
  });

  it('derives a fresh deterministic replay from an ordinary compatible save after reload', () => {
    const original = createBedroomWorld({ guideMet: true });
    original.update(0.9);
    const durableSave = structuredClone(original.save);
    expect(validateSaveV1(durableSave)).toBe(durableSave);
    expect(durableSave).not.toHaveProperty('guideWalkCue');

    const firstReload = new World({ chapters: contentRegistry, save: structuredClone(durableSave), seed: 42 });
    const secondReload = new World({ chapters: contentRegistry, save: structuredClone(durableSave), seed: 42 });
    expect(firstReload.snapshot().tapToWalkCue).toEqual(secondReload.snapshot().tapToWalkCue);
    expect(firstReload.snapshot().tapToWalkCue).toMatchObject({ stage: 'walk', progress: 0, voice: null });

    firstReload.update(GUIDE_WALK_CUE.walkSeconds);
    expect(firstReload.snapshot().tapToWalkCue).toMatchObject({
      stage: 'departed',
      guide: { pose: 'idle', visible: false },
    });
    expect(firstReload.snapshot().tapToWalkCue.footprints.from.x)
      .toBe(firstReload.player.x - 24);
  });

  it('keeps the cue stationary and legible when reduced motion is enabled', () => {
    const world = createBedroomWorld({ guideMet: true, reducedMotion: true });
    const first = world.snapshot().tapToWalkCue;
    world.update(5);
    const later = world.snapshot().tapToWalkCue;
    expect(first).toMatchObject({
      stage: 'departed',
      progress: 1,
      guide: { x: GUIDE_WALK_CUE.destinationX, pose: 'idle', visible: false },
      footprints: { progress: 1 },
    });
    expect(later.guide).toEqual(first.guide);
    expect(later.footprints).toEqual(first.footprints);
  });

  it('keeps the pure timeline deterministic for identical simulation inputs', () => {
    const input = {
      time: 0.83,
      startedAt: 0.2,
      playerStart: { x: 360, y: 610 },
    };
    expect(createGuideWalkCueSnapshot(input)).toEqual(createGuideWalkCueSnapshot(input));
  });
});
