function staticNpc({
  id,
  characterId,
  displayName,
  voiceRole,
  defaultTalk = null,
  puppet = `puppet.${characterId.replace(/^character\./u, '')}`,
  portrait = `portrait.${characterId.replace(/^character\./u, '')}`,
  scale = 1,
}) {
  return {
    id,
    characterId,
    displayName,
    puppet,
    portrait,
    voiceRole,
    scale,
    hitRadius: 88,
    defaultPose: 'idle',
    controller: { kind: 'static' },
    defaultTalk,
  };
}

function petNpc({ id, characterId, displayName, scale, controller }) {
  return {
    ...staticNpc({
      id,
      characterId,
      displayName,
      voiceRole: 'creature',
      scale,
    }),
    controller,
  };
}

export const chapter2NpcDefinitions = Object.freeze([
  staticNpc({
    id: 'ch2.npc.violet',
    characterId: 'character.violet',
    displayName: 'Violet',
    voiceRole: 'silent',
  }),
  staticNpc({
    id: 'ch2.npc.narrator',
    characterId: 'character.narrator',
    displayName: 'Narrator',
    puppet: 'puppet.none',
    portrait: 'portrait.none',
    voiceRole: 'narrator',
  }),
  staticNpc({
    id: 'ch2.npc.conductor',
    characterId: 'character.conductor',
    displayName: 'Conductor',
    voiceRole: 'warm-conductor',
  }),
  staticNpc({
    id: 'ch2.npc.harry',
    characterId: 'character.harry-potter',
    displayName: 'Harry',
    voiceRole: 'friendly-classmate',
  }),
  staticNpc({
    id: 'ch2.npc.ron',
    characterId: 'character.ron-weasley',
    displayName: 'Ron',
    voiceRole: 'friendly-classmate',
  }),
  staticNpc({
    id: 'ch2.npc.hermione',
    characterId: 'character.hermione-granger',
    displayName: 'Hermione',
    voiceRole: 'friendly-classmate',
  }),
  staticNpc({
    id: 'ch2.npc.trolleyWitch',
    characterId: 'character.trolley-witch',
    displayName: 'Trolley Witch',
    voiceRole: 'kind-shopkeeper',
  }),
  staticNpc({
    id: 'ch2.npc.deputyHead',
    characterId: 'character.deputy-head',
    displayName: 'Deputy Head',
    voiceRole: 'crisp-professor',
  }),
  staticNpc({
    id: 'ch2.npc.sortingHat',
    characterId: 'character.sorting-hat',
    displayName: 'Sorting Hat',
    voiceRole: 'ancient-kind-hat',
  }),
  staticNpc({
    id: 'ch2.npc.headmaster',
    characterId: 'character.headmaster',
    displayName: 'Headmaster',
    voiceRole: 'gentle-headmaster',
  }),
  petNpc({
    id: 'ch2.npc.pet.cat',
    characterId: 'character.cat',
    displayName: 'Cat',
    scale: 0.55,
    controller: {
      kind: 'follow', target: 'ch2.npc.violet', minimumDistance: 70, maxDistance: 190,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'paw' },
    },
  }),
  petNpc({
    id: 'ch2.npc.pet.owl',
    characterId: 'character.pet-owl',
    displayName: 'Owl',
    scale: 0.55,
    controller: {
      kind: 'follow', target: 'ch2.npc.violet', minimumDistance: 90, maxDistance: 220,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'perch' },
      facingLookMagnitude: 0.45,
    },
  }),
  petNpc({
    id: 'ch2.npc.pet.toad',
    characterId: 'character.toad',
    displayName: 'Toad',
    scale: 0.42,
    controller: {
      kind: 'follow', target: 'ch2.npc.violet', minimumDistance: 55, maxDistance: 150,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'idle' },
    },
  }),
]);

export const chapter2CharacterIds = Object.freeze(
  chapter2NpcDefinitions.map(({ characterId }) => characterId),
);
