import { describe, expect, it } from 'vitest';
import { chapter1, chapter1CharacterIds } from '../src/game/content/chapters/ch1.js';
import { chapter2, chapter2CharacterIds } from '../src/game/content/chapters/ch2.js';
import { productionCharacterCatalog } from '../src/game/characters/productionCatalog.js';
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

function menagerieWorld({ selectedPet = null, petNamed = Boolean(selectedPet) } = {}) {
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
      ...(petNamed ? { 'ch1.petChosen': true, 'ch1.petNamed': true } : {}),
    },
    pet: selectedPet,
  });
  save.character.wandId = 'violet-first-wand';
  save.character.appearance.robeTrim = 'purple';
  return new World({ chapters: contentRegistry, save, seed: 42 });
}

function expectSupportedActorStates(snapshot) {
  for (const actor of snapshot.actors) {
    expect(() => productionCharacterCatalog.registry.resolveRenderState(
      actor.characterId,
      actor.renderState,
    )).not.toThrow();
  }
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
        pose: 'idle',
        layoutBounds: { width: 148, height: 236, ground: 32 },
      },
    });
    expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.pet.owl')).toEqual({
      actorId: 'npc.pet.owl',
      characterId: 'character.pet-owl',
      depth: 520,
      renderState: {
        x: 900,
        y: 520,
        facing: 'right',
        pose: 'idle',
        scale: 0.92,
        timeOffset: 0.7,
        lookX: -0.35,
        layoutBounds: { width: 132, height: 142, ground: 28 },
        action: null,
      },
    });
    expect(snapshot.actors.find(({ actorId }) => actorId === 'npc.pet.toad').renderState)
      .toEqual({
        x: 1110,
        y: 595,
        facing: 'right',
        pose: 'idle',
        timeOffset: 1.3,
        layoutBounds: { width: 132, height: 142, ground: 28 },
        action: null,
      });
    expectSupportedActorStates(snapshot);
  });

  it('publishes the post owl at its rendered anchor with authored scale and player-relative gaze', () => {
    const save = saveAt({
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      spawn: 'bedroom.start',
    });
    const snapshot = new World({ chapters: contentRegistry, save, seed: 42 }).snapshot();
    const postOwl = snapshot.actors.find(({ actorId }) => actorId === 'npc.owlPost');

    expect(postOwl).toEqual({
      actorId: 'npc.owlPost',
      characterId: 'character.post-owl',
      depth: 210,
      renderState: {
        x: 1060,
        y: 290,
        facing: 'left',
        pose: 'perch',
        scale: 1.08,
        layoutBounds: { width: 154, height: 188, ground: 25 },
        lookX: -1,
        lookY: (610 - 210 - 170) / 300,
        action: null,
      },
    });
    expectSupportedActorStates(snapshot);
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
    expect(hagrid.characterId).toBe('character.hagrid');
    expect(hagrid.renderState).not.toHaveProperty('scale');
    expectSupportedActorStates(snapshot);
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
        x: snapshot.pet.x,
        y: snapshot.pet.y,
        facing: snapshot.pet.facing,
        pose: snapshot.pet.pose,
        action: null,
      },
    });
    expect(animalActors[0].renderState).not.toHaveProperty('type');
    expect(animalActors[0].renderState).not.toHaveProperty('name');
    expect(animalActors[0].renderState).not.toHaveProperty('scale');
    expectSupportedActorStates(snapshot);
  });

  it('never duplicates a selected companion while the Menagerie displays are still eligible', () => {
    const snapshot = menagerieWorld({
      selectedPet: { type: 'owl', name: 'Moonbeam' },
      petNamed: false,
    }).snapshot();
    const animalActors = snapshot.actors.filter(({ actorId }) => actorId.startsWith('npc.pet.'));
    const actorIds = animalActors.map(({ actorId }) => actorId);

    expect(actorIds).toHaveLength(3);
    expect(new Set(actorIds).size).toBe(actorIds.length);
    expect(actorIds.filter((actorId) => actorId === 'npc.pet.owl')).toHaveLength(1);
    expectSupportedActorStates(snapshot);
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

    const chapterTwoSnapshot = chapterTwoWorld.snapshot();
    expect(chapterTwoSnapshot.actors.map(({ actorId, characterId }) => ({
      actorId,
      characterId,
    }))).toEqual([
      { actorId: 'npc.violet', characterId: 'character.violet' },
      { actorId: 'npc.pet.owl', characterId: 'character.pet-owl' },
    ]);
    expect(chapterTwoSnapshot.actors.find(({ actorId }) => actorId === 'npc.pet.owl').renderState)
      .toEqual({
        x: 575,
        y: 620,
        facing: 'right',
        pose: 'idle',
        lookX: 0.45,
        action: null,
      });
    expectSupportedActorStates(chapterTwoSnapshot);
    expect(chapterTwoWorld.dialoguePresentation).toMatchObject({
      speaker: 'npc.narrator',
      speakerLabel: 'Narrator',
      portraitCharacterId: 'character.narrator',
    });
  });
});
