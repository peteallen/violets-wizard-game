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
    const characterRenderer = {
      draw: vi.fn(),
      drawPet: vi.fn(),
    };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      characterRenderer,
      reducedMotion: false,
      simTime: 1.25,
      world: { flags: {} },
    });

    game.drawCharacters({}, {
      roomId: 'ch1.bedroom',
      cameraX: 80,
      keyLight,
      player: {
        kind: 'violet',
        x: 500,
        y: 610,
        facing: 'right',
        walking: false,
      },
      pet: null,
      occupants: [{
        npc: 'npc.keeper',
        x: 760,
        y: 520,
        facing: 'left',
        pose: 'idle',
      }],
    });

    expect(characterRenderer.draw).toHaveBeenCalledTimes(2);
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ kind: 'violet', x: 420, lightSide: keyLight }),
      1.25,
    );
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ kind: 'keeper', x: 680, lightSide: keyLight }),
      1.25,
    );
  });

  it.each(['left', 'right'])('forwards a %s key light to companions, the post owl, and shop pets', (keyLight) => {
    const characterRenderer = {
      draw: vi.fn(),
      drawPet: vi.fn(),
    };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      characterRenderer,
      reducedMotion: false,
      simTime: 1.25,
      world: { flags: {} },
    });
    const player = {
      kind: 'violet', x: 500, y: 610, facing: 'right', walking: false,
    };

    game.drawCharacters({}, {
      roomId: 'ch1.bedroom',
      cameraX: 80,
      keyLight,
      player,
      pet: { type: 'cat', x: 560, y: 610, facing: 'right', pose: 'idle' },
      occupants: [{
        npc: 'npc.owlPost', x: 1060, y: 210, facing: 'left', pose: 'perch',
      }],
    });

    expect(characterRenderer.drawPet).toHaveBeenCalledTimes(2);
    expect(characterRenderer.drawPet).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ type: 'cat', lightSide: keyLight }),
      1.25,
    );
    expect(characterRenderer.drawPet).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ type: 'owl', variant: 'post', lightSide: keyLight }),
      1.25,
    );

    characterRenderer.drawPet.mockClear();
    game.drawCharacters({}, {
      roomId: 'ch1.menagerie',
      cameraX: 80,
      keyLight,
      player,
      pet: null,
      occupants: [],
    });
    expect(characterRenderer.drawPet).toHaveBeenCalledTimes(3);
    expect(characterRenderer.drawPet.mock.calls.every(([, pet]) => (
      pet.lightSide === keyLight
    ))).toBe(true);
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
