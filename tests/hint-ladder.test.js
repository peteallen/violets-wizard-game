import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { HINTS, OBJECTIVE, WORLD } from '../src/game/config.js';
import { contentRegistry } from '../src/game/content/index.js';
import { validateWorldEvent } from '../src/game/contracts.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function createWorld() {
  const save = createSaveV1({
    now: '2026-07-12T18:00:00.000Z',
    appVersion: 'hint-ladder-test',
    worldSeed: 42,
  });
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  world.drainEvents();
  return world;
}

function hintEvents(world) {
  return world.drainEvents().filter((event) => event.type.startsWith('hint.'));
}

describe('World hint ladder', () => {
  it('emits authored look and voice guidance at deterministic idle thresholds', () => {
    const world = createWorld();

    world.update(HINTS.petLookSeconds - 1);
    expect(hintEvents(world)).toEqual([]);

    world.update(1);
    const look = hintEvents(world);
    expect(look).toEqual([expect.objectContaining({
      at: HINTS.petLookSeconds,
      type: 'hint.lookRequested',
      payload: {
        quest: 'ch1.shoppingTrip',
        step: 'openLetter',
        target: 'bedroom.owl',
      },
    })]);
    expect(() => validateWorldEvent(look[0])).not.toThrow();

    world.update(HINTS.repeatSeconds - HINTS.petLookSeconds);
    const voice = hintEvents(world);
    expect(voice).toEqual([expect.objectContaining({
      at: HINTS.repeatSeconds,
      type: 'hint.voiceRequested',
      payload: {
        quest: 'ch1.shoppingTrip',
        step: 'openLetter',
        voice: 'voice/ch1/objective/openLetter',
        text: 'Tap the owl at the window.',
      },
    })]);
    expect(() => validateWorldEvent(voice[0])).not.toThrow();

    world.update(HINTS.repeatSeconds);
    expect(hintEvents(world)).toEqual([]);
  });

  it('escalates explicit active-puzzle failures to a trail and then the authored safe assist', () => {
    const world = createWorld();

    for (let attempt = 1; attempt < HINTS.sparkleFailures; attempt += 1) {
      expect(world.recordPuzzleFailure()).toBe(true);
      expect(hintEvents(world)).toEqual([]);
    }

    expect(world.recordPuzzleFailure()).toBe(true);
    expect(hintEvents(world)).toEqual([expect.objectContaining({
      type: 'hint.trailRequested',
      payload: {
        quest: 'ch1.shoppingTrip',
        step: 'openLetter',
        target: 'bedroom.owl',
      },
    })]);

    for (let attempt = HINTS.sparkleFailures + 1; attempt < HINTS.autoCompleteFailures; attempt += 1) {
      expect(world.recordPuzzleFailure()).toBe(true);
      expect(hintEvents(world)).toEqual([]);
    }

    expect(world.recordPuzzleFailure()).toBe(true);
    const assistEvents = world.drainEvents();
    expect(assistEvents).toContainEqual(expect.objectContaining({
      type: 'hint.assistTriggered',
      payload: {
        quest: 'ch1.shoppingTrip',
        step: 'openLetter',
        target: 'bedroom.owl',
      },
    }));
    expect(assistEvents).toContainEqual(expect.objectContaining({
      type: 'ui.openRequested',
      payload: { surface: 'letter-reading', tab: null },
    }));
    expect(world.overlay).toEqual({ surface: 'letter-reading', tab: null });
    expect(world.recordPuzzleFailure()).toBe(false);
  });

  it('keeps ordinary walking taps out of the puzzle-failure ladder', () => {
    const world = createWorld();
    const emptyPoint = { x: 500, y: 610 };

    for (let attempt = 0; attempt < HINTS.autoCompleteFailures; attempt += 1) {
      expect(world.tap(emptyPoint)).toEqual({ kind: 'walk', x: emptyPoint.x });
    }

    expect(world.failedAttempts).toBe(0);
    expect(hintEvents(world)).toEqual([]);
    expect(world.overlay).toBeNull();
    expect(world.flags['ch1.letterRead']).not.toBe(true);
  });

  it('limits new-objective emphasis to eight deterministic simulation seconds', () => {
    const world = createWorld();

    expect(world.snapshot().newObjective).toBe(true);
    world.update(OBJECTIVE.emphasisSeconds - WORLD.step);
    expect(world.snapshot().newObjective).toBe(true);
    world.update(WORLD.step);
    expect(world.snapshot().newObjective).toBe(false);

    world.setFlag('ch1.letterRead', true);
    world.update(0);
    expect(world.objective.caption).toBe('Follow Hagrid!');
    expect(world.snapshot().newObjective).toBe(true);

    world.update(OBJECTIVE.emphasisSeconds);
    expect(world.snapshot().newObjective).toBe(false);
  });

  it('restarts the transient objective reminder when a saved world is resumed', () => {
    const original = createWorld();
    original.update(OBJECTIVE.emphasisSeconds);
    expect(original.snapshot().newObjective).toBe(false);

    const resumed = new World({
      chapters: contentRegistry,
      save: structuredClone(original.save),
      seed: original.save.worldSeed,
    });

    expect(resumed.snapshot().newObjective).toBe(true);
    resumed.update(OBJECTIVE.emphasisSeconds);
    expect(resumed.snapshot().newObjective).toBe(false);
  });

  it('resets elapsed time and failed attempts after meaningful input and quest progress', () => {
    const world = createWorld();

    world.update(HINTS.petLookSeconds);
    hintEvents(world);
    world.recordPuzzleFailure();
    world.recordPuzzleFailure();
    world.interactSemantic('bedroom.owl');

    expect(world.idleTime).toBe(0);
    expect(world.failedAttempts).toBe(0);
    expect(hintEvents(world)).toContainEqual(expect.objectContaining({
      type: 'hint.cleared',
      payload: { quest: 'ch1.shoppingTrip', step: 'openLetter', reason: 'input' },
    }));

    const progressedWorld = createWorld();
    progressedWorld.update(HINTS.petLookSeconds);
    hintEvents(progressedWorld);

    progressedWorld.setFlag('ch1.letterRead', true);
    expect(progressedWorld.idleTime).toBe(0);
    expect(progressedWorld.failedAttempts).toBe(0);
    expect(hintEvents(progressedWorld)).toContainEqual(expect.objectContaining({
      type: 'hint.cleared',
      payload: { quest: 'ch1.shoppingTrip', step: 'openLetter', reason: 'progress' },
    }));

    progressedWorld.update(0);
    progressedWorld.drainEvents();
    progressedWorld.update(HINTS.repeatSeconds);
    expect(hintEvents(progressedWorld)).toEqual([expect.objectContaining({
      type: 'hint.voiceRequested',
      payload: expect.objectContaining({ step: 'followGuide' }),
    })]);
  });

  it('pauses inactivity while the player is occupied instead of triggering unwanted help', () => {
    const world = createWorld();
    world.runAction({ type: 'dialogue.start', script: 'ch1.letter.read' });
    world.drainEvents();

    world.update(HINTS.repeatSeconds * 2);
    expect(world.idleTime).toBe(0);
    expect(hintEvents(world)).toEqual([]);

    world.advanceDialogue();
    world.advanceDialogue();
    world.drainEvents();
    world.update(HINTS.repeatSeconds);
    expect(hintEvents(world)).toEqual([expect.objectContaining({
      type: 'hint.voiceRequested',
      payload: expect.objectContaining({ step: 'followGuide' }),
    })]);
  });
});

describe('Game hint presentation', () => {
  function gameStub() {
    const game = Object.create(Game.prototype);
    const state = {
      cameraX: 100,
      player: { x: 500, y: 610 },
      pet: null,
    };
    game.world = {
      objective: {
        text: 'Tap the owl at the window.',
        mapStar: null,
      },
      snapshot: vi.fn(() => state),
    };
    game.lastRenderState = state;
    game.reducedMotion = false;
    game.semanticTargets = vi.fn(() => [
      { id: 'bedroom.owl', x: 1060, y: 210 },
      { id: 'hud.quest', x: 80, y: 80 },
    ]);
    game.particles = { emit: vi.fn() };
    game.sound = { speak: vi.fn(), playSfx: vi.fn(), stopVoice: vi.fn() };
    game.updateStatus = vi.fn();
    return game;
  }

  it('turns every World hint event into visible or spoken guidance', () => {
    const game = gameStub();

    game.handleWorldEvent({ type: 'hint.lookRequested', payload: { target: 'bedroom.owl' } });
    expect(game.particles.emit).toHaveBeenCalledTimes(3);
    expect(game.particles.emit).toHaveBeenLastCalledWith(
      'sparkle', 1060, 210, 2, expect.objectContaining({ gravity: 0 }),
    );
    expect(game.updateStatus).toHaveBeenLastCalledWith('Tap the owl at the window.');

    game.particles.emit.mockClear();
    game.handleWorldEvent({
      type: 'hint.voiceRequested',
      payload: { voice: 'voice/ch1/objective/openLetter', text: 'Tap the owl at the window.' },
    });
    expect(game.sound.speak).toHaveBeenCalledWith(
      'voice/ch1/objective/openLetter',
      'Tap the owl at the window.',
    );

    game.handleWorldEvent({ type: 'hint.trailRequested', payload: { target: 'bedroom.owl' } });
    expect(game.particles.emit).toHaveBeenCalledTimes(8);
    expect(game.particles.emit).toHaveBeenLastCalledWith(
      'sparkle', 1060, 210, 3, expect.objectContaining({ life: 1.5 }),
    );

    game.particles.emit.mockClear();
    game.handleWorldEvent({ type: 'hint.assistTriggered', payload: { target: 'bedroom.owl' } });
    expect(game.particles.emit).toHaveBeenCalledWith(
      'sparkle', 1060, 210, 18, expect.objectContaining({ size: 9 }),
    );
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/choice', 'chime');

    game.handleWorldEvent({ type: 'hint.cleared', payload: {} });
    expect(game.sound.stopVoice).toHaveBeenCalledOnce();
  });

  it('keeps remote guidance visible by falling back to the map destination at the screen edge', () => {
    const game = gameStub();
    game.world.objective.mapStar = { hotspot: 'street.ollivandersDoor' };
    game.semanticTargets = vi.fn(() => [
      { id: 'street.ollivandersDoor', x: 1500, y: 300 },
      { id: 'hud.quest', x: 80, y: 80 },
    ]);

    expect(game.hintTargetPosition('ollivanders.wand1')).toEqual({ x: 1240, y: 300 });
  });
});
