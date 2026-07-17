function staticNpc({
  id,
  characterId,
  displayName,
  voiceRole,
  defaultTalk = null,
  puppet = `puppet.${characterId.replace(/^character\./u, '')}`,
  portrait = `portrait.${characterId.replace(/^character\./u, '')}`,
  scale = 1,
  defaultPose = 'idle',
  controller = { kind: 'static' },
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
    defaultPose,
    controller,
    defaultTalk,
  };
}

function petNpc({ id, characterId, displayName, scale, controller }) {
  return staticNpc({
    id,
    characterId,
    displayName,
    voiceRole: 'creature',
    scale,
    controller,
  });
}

export const chapter3NpcDefinitions = Object.freeze([
  staticNpc({
    id: 'ch3.npc.violet',
    characterId: 'character.violet',
    displayName: 'Violet',
    voiceRole: 'silent',
  }),
  staticNpc({
    id: 'ch3.npc.narrator',
    characterId: 'character.narrator',
    displayName: 'Narrator',
    puppet: 'puppet.none',
    portrait: 'portrait.none',
    voiceRole: 'narrator',
  }),
  staticNpc({
    id: 'ch3.npc.postOwl',
    characterId: 'character.post-owl',
    displayName: 'Post Owl',
    voiceRole: 'creature',
    scale: 0.64,
    defaultPose: 'perch',
  }),
  staticNpc({
    id: 'ch3.npc.flitwick',
    characterId: 'character.flitwick',
    displayName: 'Professor Flitwick',
    voiceRole: 'bright-charms-professor',
    scale: 0.72,
  }),
  staticNpc({
    id: 'ch3.npc.neville',
    characterId: 'character.neville',
    displayName: 'Neville',
    voiceRole: 'gentle-worried-classmate',
    scale: 0.9,
  }),
  staticNpc({
    id: 'ch3.npc.trevor',
    characterId: 'character.trevor',
    displayName: 'Trevor',
    voiceRole: 'creature',
    scale: 0.44,
  }),
  staticNpc({
    id: 'ch3.npc.friendlyGhost',
    characterId: 'character.friendly-ghost',
    displayName: 'Friendly Ghost',
    voiceRole: 'friendly-bookish-ghost',
    defaultPose: 'ambient',
  }),
  petNpc({
    id: 'ch3.npc.pet.cat',
    characterId: 'character.cat',
    displayName: 'Cat',
    scale: 0.55,
    controller: {
      kind: 'follow', target: 'ch3.npc.violet', minimumDistance: 70, maxDistance: 190,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'paw' },
    },
  }),
  petNpc({
    id: 'ch3.npc.pet.owl',
    characterId: 'character.pet-owl',
    displayName: 'Owl',
    scale: 0.55,
    controller: {
      kind: 'follow', target: 'ch3.npc.violet', minimumDistance: 90, maxDistance: 220,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'perch' },
      facingLookMagnitude: 0.45,
    },
  }),
  petNpc({
    id: 'ch3.npc.pet.toad',
    characterId: 'character.toad',
    displayName: 'Toad',
    scale: 0.42,
    controller: {
      kind: 'follow', target: 'ch3.npc.violet', minimumDistance: 55, maxDistance: 150,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'idle' },
    },
  }),
]);

export const chapter3CharacterIds = Object.freeze(
  [...new Set(chapter3NpcDefinitions.map(({ characterId }) => characterId))],
);
