import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { chapter1 } from '../src/game/content/chapters/ch1.js';
import { contentRegistry } from '../src/game/content/index.js';
import { validateWorldEvent } from '../src/game/contracts.js';
import {
  createSaveV1,
  parseSave,
  serializeSave,
  validateSaveV1,
} from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-14T12:00:00.000Z';

const WAND_CUES = Object.freeze([
  {
    target: 'ollivanders.wand1',
    setPiece: 'sp.wandChaos1',
    action: 'wrong-wand-one',
    expression: 'curious',
    temporaryProp: 'prop.ch1.wand1',
    flags: {},
  },
  {
    target: 'ollivanders.wand2',
    setPiece: 'sp.wandChaos2',
    action: 'wrong-wand-two',
    expression: 'curious',
    temporaryProp: 'prop.ch1.wand2',
    flags: { 'ch1.wandTry1': true },
  },
  {
    target: 'ollivanders.wand3',
    setPiece: 'sp.wandChosen',
    action: 'chosen-wand',
    expression: 'wonder',
    temporaryProp: 'prop.ch1.wandChosen',
    flags: { 'ch1.wandTry1': true, 'ch1.wandTry2': true },
  },
]);

function createWandWorld(flags = {}) {
  const save = createSaveV1({ now: NOW, appVersion: 'actor-animation-test', worldSeed: 42 });
  Object.assign(save.progress.questFlags, { 'ch1.mapUsed': true }, flags);
  save.resume = {
    chapter: 'ch1',
    scene: 'ch1.wandShopping',
    room: 'ch1.ollivanders',
    spawn: 'entry',
  };
  const world = new World({ chapters: contentRegistry, save, seed: 42, clock: () => NOW });
  world.drainEvents();
  return world;
}

function hotspotActions(target) {
  return chapter1.rooms['ch1.ollivanders'].hotspots
    .find((hotspot) => hotspot.id === target).onInteract;
}

describe('transient actor-animation channel', () => {
  it.each(WAND_CUES)(
    'starts $action at local time zero in the same tick as $setPiece',
    ({ target, setPiece, action, expression, temporaryProp, flags }) => {
      const world = createWandWorld(flags);

      world.runActions(hotspotActions(target));

      const activeSetPiece = world.setPieces.active;
      const snapshot = world.snapshot();
      const animation = snapshot.actorAnimations['npc.violet'];
      expect(activeSetPiece).toMatchObject({ requestedId: setPiece, time: 0 });
      expect(animation).toEqual({
        actor: 'npc.violet',
        action,
        expression,
        temporaryProp,
        setPiece,
        startedAt: world.time,
        duration: activeSetPiece.descriptor.duration,
        localTime: 0,
        progress: 0,
      });
      expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.violet').renderState)
        .toMatchObject({
          action,
          actionTime: 0,
          actionProgress: 0,
        });
      expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.violet').renderState)
        .not.toHaveProperty('actorAnimation');

      const events = world.drainEvents();
      const setPieceEvent = events.find((event) => event.type === 'setPiece.started');
      const actorEvent = events.find((event) => event.type === 'actor.animationRequested');
      expect(actorEvent.at).toBe(setPieceEvent.at);
      expect(events.indexOf(actorEvent)).toBeGreaterThan(events.indexOf(setPieceEvent));
      expect(validateWorldEvent(actorEvent)).toBe(actorEvent);
    },
  );

  it('restarts local time from zero when a later action replaces the active one', () => {
    const world = createWandWorld();
    world.setPieces.start('sp.wandChaos1');
    world.update(0.75);
    expect(world.snapshot().actorAnimations['npc.violet']).toMatchObject({
      action: 'wrong-wand-one',
      localTime: 0.75,
      progress: 0.75 / 2.2,
    });

    world.setPieces.start('sp.wandChaos2');
    expect(world.snapshot().actorAnimations['npc.violet']).toMatchObject({
      action: 'wrong-wand-two',
      startedAt: 0.75,
      localTime: 0,
      progress: 0,
    });
  });

  it('clears an action at set-piece completion and immediately on travel', () => {
    const world = createWandWorld();
    world.setPieces.start('sp.wandChaos2');
    world.update(2.59);
    expect(world.snapshot().actorAnimations['npc.violet'].localTime).toBeCloseTo(2.59);

    world.update(0.02);
    expect(world.setPieces.active).toBeNull();
    expect(world.snapshot().actorAnimations).toEqual({});

    world.setPieces.start('sp.wandChosen');
    expect(world.snapshot().actorAnimations['npc.violet']).toBeDefined();
    world.travel('ch1.diagonStreet', 'west', 'none');
    expect(world.snapshot().actorAnimations).toEqual({});
  });

  it('never writes transient action state into Violet’s durable save', () => {
    const world = createWandWorld();
    const before = serializeSave(world.save);

    world.setPieces.start('sp.wandChaos1');
    world.update(0.5);

    expect(serializeSave(world.save)).toBe(before);
    expect(Object.hasOwn(world.save, 'actorAnimations')).toBe(false);
    expect(validateSaveV1(world.save)).toBe(world.save);

    const resumed = new World({
      chapters: contentRegistry,
      save: parseSave(serializeSave(world.save)),
      seed: 42,
      clock: () => NOW,
    });
    expect(resumed.snapshot().actorAnimations).toEqual({});
  });

  it('hands flat semantic action timing to the renderer without changing the pose', () => {
    const draws = [];
    const game = Object.assign(Object.create(Game.prototype), {
      simTime: 12,
      reducedMotion: false,
      characterRenderer: {
        draw: vi.fn((_context, character) => draws.push(character)),
      },
    });
    const state = {
      cameraX: 100,
      keyLight: 'left',
      actors: [{
        actorId: 'npc.violet',
        characterId: 'character.violet',
        depth: 610,
        renderState: {
          x: 500,
          y: 610,
          facing: 'right',
          pose: 'idle',
          action: 'wrong-wand-one',
          actionTime: 0.4,
          actionProgress: 0.2,
        },
      }],
    };

    game.drawCharacters({}, state);

    expect(draws).toHaveLength(1);
    expect(draws[0]).toMatchObject({
      characterId: 'character.violet',
      surface: 'world',
      x: 400,
      pose: 'idle',
      action: 'wrong-wand-one',
      actionTime: 0.4,
      actionProgress: 0.2,
    });
    expect(draws[0]).not.toHaveProperty('actorAnimation');
  });
});
