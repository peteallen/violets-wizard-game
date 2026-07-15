export const chapter1NpcDefinitions = [
  { id: 'npc.violet', characterId: 'character.violet', displayName: 'Violet', puppet: 'puppet.violet', portrait: 'portrait.violet', voiceRole: 'silent', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
  { id: 'npc.narrator', characterId: 'character.narrator', displayName: 'Narrator', puppet: 'puppet.none', portrait: 'portrait.none', voiceRole: 'narrator', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
  { id: 'npc.guide', characterId: 'character.hagrid', displayName: 'Hagrid', puppet: 'puppet.guide', portrait: 'portrait.guide', voiceRole: 'guide', scale: 2, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'scripted' }, defaultTalk: null },
  { id: 'npc.wandmaker', characterId: 'character.wandmaker', displayName: 'Wandmaker', puppet: 'puppet.wandmaker', portrait: 'portrait.wandmaker', voiceRole: 'wandmaker', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
  { id: 'npc.tailor', characterId: 'character.madam-malkin', displayName: 'Madam Malkin', puppet: 'puppet.tailor', portrait: 'portrait.tailor', voiceRole: 'tailor', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
  { id: 'npc.menagerieKeeper', characterId: 'character.menagerie-keeper', displayName: 'Keeper', puppet: 'puppet.menagerieKeeper', portrait: 'portrait.menagerieKeeper', voiceRole: 'keeper', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
  { id: 'npc.owlPost', characterId: 'character.post-owl', displayName: 'Owl', puppet: 'puppet.owlPost', portrait: 'portrait.none', voiceRole: 'creature', scale: 0.75, hitRadius: 88, defaultPose: 'perch', controller: { kind: 'scripted' }, defaultTalk: null },
  {
    id: 'npc.pet.cat', characterId: 'character.cat', displayName: 'Cat', puppet: 'puppet.pet.cat', portrait: 'portrait.pet.cat', voiceRole: 'creature', scale: 0.55, hitRadius: 88, defaultPose: 'idle',
    controller: {
      kind: 'follow', target: 'npc.violet', minimumDistance: 70, maxDistance: 190,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'paw' },
    },
    defaultTalk: null,
  },
  {
    id: 'npc.pet.owl', characterId: 'character.pet-owl', displayName: 'Owl', puppet: 'puppet.pet.owl', portrait: 'portrait.pet.owl', voiceRole: 'creature', scale: 0.55, hitRadius: 88, defaultPose: 'idle',
    controller: {
      kind: 'follow', target: 'npc.violet', minimumDistance: 90, maxDistance: 220,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'perch' },
      facingLookMagnitude: 0.45,
    },
    defaultTalk: null,
  },
  {
    id: 'npc.pet.toad', characterId: 'character.toad', displayName: 'Toad', puppet: 'puppet.pet.toad', portrait: 'portrait.pet.toad', voiceRole: 'creature', scale: 0.42, hitRadius: 88, defaultPose: 'idle',
    controller: {
      kind: 'follow', target: 'npc.violet', minimumDistance: 55, maxDistance: 150,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'idle' },
    },
    defaultTalk: null,
  },
];
