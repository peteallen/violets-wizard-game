import { describe, expect, it } from 'vitest';
import { chapter1, chapter1CharacterIds } from '../src/game/content/chapters/ch1.js';
import { chapter2, chapter2CharacterIds } from '../src/game/content/chapters/ch2.js';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const CHARACTER_IDENTITIES = Object.freeze({
  'npc.violet': 'character.violet',
  'npc.narrator': 'character.narrator',
  'npc.guide': 'character.hagrid',
  'npc.wandmaker': 'character.wandmaker',
  'npc.tailor': 'character.madam-malkin',
  'npc.menagerieKeeper': 'character.menagerie-keeper',
  'npc.owlPost': 'character.post-owl',
  'npc.pet.cat': 'character.cat',
  'npc.pet.owl': 'character.pet-owl',
  'npc.pet.toad': 'character.toad',
});

function saveAt({
  chapter = 'ch1',
  scene = 'ch1.petShopping',
  room = 'ch1.menagerie',
  spawn = 'entry',
  flags = {},
  pet = null,
} = {}) {
  const save = createSaveV1({
    now: '2026-07-15T06:00:00.000Z',
    appVersion: 'world-character-identity-test',
    worldSeed: 42,
  });
  save.resume = { chapter, scene, room, spawn };
  Object.assign(save.progress.questFlags, flags);
  if (pet) save.character.pet = { ...pet };
  return save;
}

function menagerieWorld({ selectedPet = null } = {}) {
  const named = Boolean(selectedPet);
  const save = saveAt({
    flags: {
      'ch1.letterRead': true,
      'ch1.guideMet': true,
      'ch1.leakyReached': true,
      'ch1.wallOpened': true,
      'ch1.diagonReached': true,
      'ch1.satchelReceived': true,
      'ch1.mapUsed': true,
      'ch1.wandChosen': true,
      'ch1.trimChosen': true,
      ...(named ? { 'ch1.petChosen': true, 'ch1.petNamed': true } : {}),
    },
    pet: selectedPet,
  });
  save.character.wandId = 'violet-first-wand';
  save.character.appearance.robeTrim = 'purple';
  return new World({ chapters: contentRegistry, save, seed: 42 });
}

describe('canonical character identity in content and world snapshots', () => {
  it('keeps every legacy Chapter One NPC role while declaring its exact character identity', () => {
    expect(Object.fromEntries(Object.entries(chapter1.npcs).map(([actorId, npc]) => [
      actorId,
      npc.characterId,
    ]))).toEqual(CHARACTER_IDENTITIES);

    expect(chapter2.npcs['npc.violet'].characterId).toBe('character.violet');
    expect(chapter2.npcs['npc.narrator'].characterId).toBe('character.narrator');
    expect(chapter2.npcs['npc.pet.cat'].characterId).toBe('character.cat');
    expect(chapter2.npcs['npc.pet.owl'].characterId).toBe('character.pet-owl');
    expect(chapter2.npcs['npc.pet.toad'].characterId).toBe('character.toad');
    expect(chapter1CharacterIds).toEqual([...new Set(Object.values(CHARACTER_IDENTITIES))]);
    expect(chapter2CharacterIds).toEqual([
      'character.violet',
      'character.narrator',
      'character.cat',
      'character.pet-owl',
      'character.toad',
    ]);
  });

  it('exposes one depth-sortable actor record for the player and each visible room occupant', () => {
    const snapshot = menagerieWorld().snapshot();

    expect(snapshot.actors.map(({ actorId }) => actorId)).toEqual([
      'npc.pet.owl',
      'npc.pet.cat',
      'npc.pet.toad',
      'npc.menagerieKeeper',
      'npc.violet',
    ]);
    expect(snapshot.actors.map(({ depth }) => depth)).toEqual([520, 585, 595, 610, 610]);
    expect(snapshot.actors.filter(({ actorId }) => actorId === 'npc.violet')).toHaveLength(1);

    expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.violet')).toMatchObject({
      characterId: 'character.violet',
      renderState: {
        x: 120,
        y: 610,
        appearance: 'robes',
        pose: 'idle',
        action: null,
      },
    });
    expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.menagerieKeeper')).toMatchObject({
      characterId: 'character.menagerie-keeper',
      renderState: {
        x: 270,
        y: 610,
        scale: 1,
        pose: 'idle',
      },
    });
    expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.pet.owl')).toMatchObject({
      characterId: 'character.pet-owl',
      renderState: { x: 900, y: 520, scale: 1, pose: 'idle' },
    });
  });

  it('does not reinterpret unused legacy NPC scale metadata as a render transform', () => {
    const save = saveAt({
      scene: 'ch1.wallOpening',
      room: 'ch1.courtyard',
      spawn: 'entry',
      flags: {
        'ch1.letterRead': true,
        'ch1.guideMet': true,
        'ch1.leakyReached': true,
        'ch1.courtyardReached': true,
      },
    });
    const snapshot = new World({ chapters: contentRegistry, save, seed: 42 }).snapshot();
    const hagrid = snapshot.actors.find(({ actorId }) => actorId === 'npc.guide');

    expect(chapter1.npcs['npc.guide'].scale).toBe(2);
    expect(hagrid).toMatchObject({
      characterId: 'character.hagrid',
      renderState: { scale: 1 },
    });
  });

  it('replaces the display animals with the exact selected-pet actor after naming', () => {
    const snapshot = menagerieWorld({ selectedPet: { type: 'cat', name: 'Biscuit' } }).snapshot();
    const animalActors = snapshot.actors.filter(({ actorId }) => actorId.startsWith('npc.pet.'));

    expect(animalActors).toHaveLength(1);
    expect(animalActors[0]).toMatchObject({
      actorId: 'npc.pet.cat',
      characterId: 'character.cat',
      depth: snapshot.pet.y + 1,
      renderState: {
        type: 'cat',
        name: 'Biscuit',
        x: snapshot.pet.x,
        y: snapshot.pet.y,
        facing: snapshot.pet.facing,
        scale: 1,
        pose: snapshot.pet.pose,
        action: null,
      },
    });
  });

  it('carries canonical portrait identity through Chapter One and Chapter Two dialogue', () => {
    const chapterOneWorld = menagerieWorld();
    chapterOneWorld.dialogue.open('ch1.keeper.petAndName');
    expect(chapterOneWorld.dialoguePresentation).toMatchObject({
      speaker: 'npc.menagerieKeeper',
      speakerLabel: 'Keeper',
      portraitCharacterId: 'character.menagerie-keeper',
    });

    const chapterTwoSave = saveAt({
      chapter: 'ch2',
      scene: 'ch2.placeholder',
      room: 'ch2.previewRoom',
      spawn: 'start',
      flags: { 'ch1.complete': true },
    });
    chapterTwoSave.progress.highestUnlockedChapter = 2;
    chapterTwoSave.character.pet = { type: 'owl', name: 'Moonbeam' };
    const chapterTwoWorld = new World({ chapters: contentRegistry, save: chapterTwoSave, seed: 42 });
    chapterTwoWorld.dialogue.open('ch2.preview');

    expect(chapterTwoWorld.snapshot().actors.map(({ actorId, characterId }) => ({
      actorId,
      characterId,
    }))).toEqual([
      { actorId: 'npc.violet', characterId: 'character.violet' },
      { actorId: 'npc.pet.owl', characterId: 'character.pet-owl' },
    ]);
    expect(chapterTwoWorld.dialoguePresentation).toMatchObject({
      speaker: 'npc.narrator',
      speakerLabel: 'Narrator',
      portraitCharacterId: 'character.narrator',
    });
  });
});
