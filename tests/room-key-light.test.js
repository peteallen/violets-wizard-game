import { describe, expect, it, vi } from 'vitest';
import { contentRegistry } from '../src/game/content/index.js';
import { Game } from '../src/game/Game.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function createWorldAt({ scene, room, spawn, flags = {} }) {
  const save = createSaveV1({
    now: '2026-07-13T18:00:00.000Z',
    appVersion: 'room-key-light-test',
    worldSeed: 46,
  });
  save.resume = { chapter: 'ch1', scene, room, spawn };
  Object.assign(save.progress.questFlags, flags);
  return new World({ chapters: contentRegistry, save, seed: 46 });
}

describe('room-authored character lighting', () => {
  it.each(['left', 'right'])('forwards a %s key light to Violet and ordinary NPCs', (keyLight) => {
    const characterRenderer = { draw: vi.fn() };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      characterRenderer,
      reducedMotion: false,
      simTime: 1.25,
    });

    game.drawCharacters({}, {
      cameraX: 80,
      keyLight,
      actors: [
        {
          actorId: 'npc.menagerieKeeper',
          characterId: 'character.menagerie-keeper',
          depth: 520,
          renderState: { x: 760, y: 520, facing: 'left', pose: 'idle' },
        },
        {
          actorId: 'npc.violet',
          characterId: 'character.violet',
          depth: 610,
          renderState: { x: 500, y: 610, facing: 'right', pose: 'idle' },
        },
      ],
    });

    expect(characterRenderer.draw).toHaveBeenCalledTimes(2);
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        characterId: 'character.violet', surface: 'world', x: 420, lightSide: keyLight,
      }),
      1.25,
    );
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        characterId: 'character.menagerie-keeper', surface: 'world', x: 680, lightSide: keyLight,
      }),
      1.25,
    );
  });

  it.each(['left', 'right'])('uses the same %s-lit dispatch for companions and the post owl', (keyLight) => {
    const characterRenderer = { draw: vi.fn() };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      characterRenderer,
      reducedMotion: false,
      simTime: 1.25,
    });

    game.drawCharacters({}, {
      cameraX: 80,
      keyLight,
      actors: [
        {
          actorId: 'npc.owlPost',
          characterId: 'character.post-owl',
          depth: 290,
          renderState: {
            x: 1060, y: 290, facing: 'left', pose: 'perch', appearance: 'post',
          },
        },
        {
          actorId: 'npc.pet.cat',
          characterId: 'character.cat',
          depth: 611,
          renderState: {
            x: 560, y: 610, facing: 'right', pose: 'idle', appearance: 'pet', timeOffset: 0.7,
          },
        },
      ],
    });

    expect(characterRenderer.draw).toHaveBeenCalledTimes(2);
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        characterId: 'character.cat', surface: 'world', lightSide: keyLight,
      }),
      1.95,
    );
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        characterId: 'character.post-owl', surface: 'world', lightSide: keyLight,
      }),
      1.25,
    );
  });

  it('uses the bedroom light from the right and defaults an unannotated room to the left', () => {
    const bedroom = createWorldAt({
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      spawn: 'bedroom.start',
    });
    const leakyCauldron = createWorldAt({
      scene: 'ch1.leakyArrival',
      room: 'ch1.leaky',
      spawn: 'leaky.entry',
      flags: { 'ch1.guideMet': true },
    });

    expect(contentRegistry.ch1.rooms['ch1.leaky'].background.keyLight).toBeUndefined();
    expect(leakyCauldron.snapshot().keyLight).toBe('left');
    expect(bedroom.snapshot().keyLight).toBe('right');
  });
});
