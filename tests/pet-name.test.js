import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';
import { contentRegistry } from '../src/game/content/index.js';

describe('parent-assisted pet naming', () => {
  it('cleans and caps a name typed through the parent-assisted naming surface', async () => {
    const game = Object.create(Game.prototype);
    game.promptForText = vi.fn(() => '  Moon\n   Beam and a deliberately very long ending  ');
    game.updateStatus = vi.fn();

    await expect(game.requestCustomPetName()).resolves.toBe('Moon Beam and a delibera');
    expect(game.promptForText).toHaveBeenCalledWith('A grown-up can type a name for Violet’s pet:', '');
  });

  it('keeps the name choices open when the naming surface is cancelled or blank', async () => {
    const game = Object.create(Game.prototype);
    game.updateStatus = vi.fn();
    game.promptForText = vi.fn(() => null);
    await expect(game.requestCustomPetName()).resolves.toBeNull();

    game.promptForText = vi.fn(() => '   ');
    await expect(game.requestCustomPetName()).resolves.toBeNull();
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

  it('shows the chosen name in the keeper’s visible welcome caption', () => {
    const save = createSaveV1({ now: '2026-07-12T18:00:00.000Z', appVersion: 'pet-name-test', worldSeed: 42 });
    const world = new World({ chapters: contentRegistry, save, seed: 42 });
    world.pendingPetType = 'owl';
    world.dialogue.open('ch1.keeper.petAndName');
    world.dialogue.nodeId = 'done';
    world.setPetName('Moonbeam');

    expect(world.dialoguePresentation).toMatchObject({
      caption: 'Moonbeam!',
      speakerLabel: 'Keeper',
    });
  });

  it('returns from the custom naming dialog through the same dialogue choice path', async () => {
    const game = Object.create(Game.prototype);
    game.destroyed = false;
    game.requestCustomPetName = vi.fn(async () => 'Moonbeam');
    game.sound = { playSfx: vi.fn() };
    game.processWorldEvents = vi.fn();
    game.world = {
      snapshot: vi.fn(() => ({ dialogue: { type: 'choice', choices: [{ id: 'nameCustom' }] } })),
      setPetName: vi.fn(() => true),
      advanceDialogue: vi.fn(),
    };

    await expect(game.completeCustomPetNameChoice()).resolves.toBe(true);

    expect(game.world.setPetName).toHaveBeenCalledWith('Moonbeam');
    expect(game.world.advanceDialogue).toHaveBeenCalledWith('nameCustom');
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/choice', 'chime');
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });
});
