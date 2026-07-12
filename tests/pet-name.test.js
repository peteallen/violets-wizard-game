import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';
import { contentRegistry } from '../src/game/content/index.js';

describe('parent-assisted pet naming', () => {
  it('cleans and caps a name typed through the native parent prompt', () => {
    const game = Object.create(Game.prototype);
    game.promptForText = vi.fn(() => '  Moon\n   Beam and a deliberately very long ending  ');
    game.updateStatus = vi.fn();

    expect(game.requestCustomPetName()).toBe('Moon Beam and a delibera');
    expect(game.promptForText).toHaveBeenCalledWith('Dad can type a name for Violet’s pet:', '');
  });

  it('keeps the name choices open when the prompt is cancelled or blank', () => {
    const game = Object.create(Game.prototype);
    game.updateStatus = vi.fn();
    game.promptForText = vi.fn(() => null);
    expect(game.requestCustomPetName()).toBeNull();

    game.promptForText = vi.fn(() => '   ');
    expect(game.requestCustomPetName()).toBeNull();
    expect(game.updateStatus).toHaveBeenCalledWith('Type a name, or choose one of the name cards.');
  });

  it('commits the pending pet type and custom name through normal save routing', () => {
    const save = createSaveV1({ now: '2026-07-12T18:00:00.000Z', appVersion: 'pet-name-test', worldSeed: 42 });
    const dirty = vi.fn();
    const world = new World({ chapters: contentRegistry, save, seed: 42, onDirty: dirty });
    world.pendingPetType = 'toad';

    expect(world.setPetName('Moon Beam')).toBe(true);
    expect(save.character.pet).toEqual({ type: 'toad', name: 'Moon Beam' });
    expect(world.pendingPetType).toBeNull();
    expect(dirty).toHaveBeenCalledWith(expect.objectContaining({ reason: 'character', save }));
    expect(world.setPetName('')).toBe(false);
  });
});
