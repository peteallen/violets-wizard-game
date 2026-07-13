import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1, validateSaveV1 } from '../src/game/systems/Save.js';
import {
  GUIDE_WALK_CUE,
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

describe('Hagrid tap-to-walk teaching cue', () => {
  it('starts when the arrival dialogue completes, then walks, turns, and beckons silently', () => {
    const world = createBedroomWorld();
    expect(world.snapshot().tapToWalkCue).toBeNull();

    world.runAction({ type: 'dialogue.start', script: 'ch1.guide.arrival' });
    world.advanceDialogue();

    const started = world.snapshot().tapToWalkCue;
    expect(world.flags['ch1.guideMet']).toBe(true);
    expect(started).toMatchObject({
      id: 'ch1.guideTapToWalk',
      stage: 'walk',
      voice: null,
      guide: { x: GUIDE_WALK_CUE.startX, facing: 'left', pose: 'walking', walking: true },
    });

    world.update(GUIDE_WALK_CUE.walkSeconds / 2);
    const walking = world.snapshot().tapToWalkCue;
    expect(walking.guide.x).toBeLessThan(GUIDE_WALK_CUE.startX);
    expect(walking.guide.x).toBeGreaterThan(GUIDE_WALK_CUE.destinationX);
    expect(walking.footprints.progress).toBeGreaterThan(0);

    world.update(GUIDE_WALK_CUE.walkSeconds / 2 + 0.1);
    expect(world.snapshot().tapToWalkCue).toMatchObject({
      stage: 'turn',
      guide: { x: GUIDE_WALK_CUE.destinationX, facing: 'right', pose: 'idle', walking: false },
    });

    world.update(GUIDE_WALK_CUE.turnSeconds);
    const beckoning = world.snapshot().tapToWalkCue;
    expect(beckoning).toMatchObject({
      stage: 'beckon',
      guide: { x: GUIDE_WALK_CUE.destinationX, facing: 'right', pose: 'beckon', walking: false },
      footprints: { progress: 1 },
    });
    const events = world.drainEvents();
    expect(events.some((event) => event.type === 'audio.command')).toBe(false);
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

    firstReload.update(GUIDE_WALK_CUE.walkSeconds + GUIDE_WALK_CUE.turnSeconds);
    expect(firstReload.snapshot().tapToWalkCue).toMatchObject({
      stage: 'beckon',
      guide: { pose: 'beckon' },
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
      stage: 'beckon',
      progress: 1,
      guide: { x: GUIDE_WALK_CUE.destinationX, pose: 'beckon' },
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
