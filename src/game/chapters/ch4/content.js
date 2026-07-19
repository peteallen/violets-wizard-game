import { defineRoom, defineScene } from '../../content/chapterAuthoring.js';
import { defineChapter } from '../../content/chapterComposer.js';

function staticNpc({
  id,
  characterId,
  displayName,
  voiceRole,
  puppet = `puppet.${characterId.replace(/^character\./u, '')}`,
  portrait = `portrait.${characterId.replace(/^character\./u, '')}`,
  scale = 1,
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
    defaultPose: 'idle',
    controller,
    defaultTalk: null,
  };
}

const previewRoom = defineRoom({
  id: 'ch4.previewRoom',
  size: { width: 1280, height: 720 },
  background: {
    layers: ['chapterCards/ch4/flying-lesson'],
    fit: 'cover',
    focalPoint: { x: 0.5, y: 0.5 },
    variants: {},
  },
  walkBand: { top: 590, bottom: 640 },
  spawns: { start: { x: 430, y: 620, facing: 'right' } },
  exits: [],
  occupants: [],
  hotspots: [],
  ambientSetPieces: [],
});

const previewScene = defineScene({
  id: 'ch4.scene.preview',
  order: 10,
  room: previewRoom.id,
  spawn: 'start',
  when: { allFlags: ['ch3.complete'] },
  onEnter: [],
  resumeAt: { room: previewRoom.id, spawn: 'start' },
  layer: { occupants: [], hotspots: [], exits: [], ambientSetPieces: [] },
});

const npcs = [
  staticNpc({
    id: 'ch4.npc.violet',
    characterId: 'character.violet',
    displayName: 'Violet',
    voiceRole: 'silent',
  }),
  staticNpc({
    id: 'ch4.npc.narrator',
    characterId: 'character.narrator',
    displayName: 'Narrator',
    puppet: 'puppet.none',
    portrait: 'portrait.none',
    voiceRole: 'narrator',
  }),
  staticNpc({
    id: 'ch4.npc.pet.cat',
    characterId: 'character.cat',
    displayName: 'Cat',
    voiceRole: 'creature',
    scale: 0.55,
    controller: {
      kind: 'follow', target: 'ch4.npc.violet', minimumDistance: 70, maxDistance: 190,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'paw' },
    },
  }),
  staticNpc({
    id: 'ch4.npc.pet.owl',
    characterId: 'character.pet-owl',
    displayName: 'Owl',
    voiceRole: 'creature',
    scale: 0.55,
    controller: {
      kind: 'follow', target: 'ch4.npc.violet', minimumDistance: 90, maxDistance: 220,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'perch' },
      facingLookMagnitude: 0.45,
    },
  }),
  staticNpc({
    id: 'ch4.npc.pet.toad',
    characterId: 'character.toad',
    displayName: 'Toad',
    voiceRole: 'creature',
    scale: 0.42,
    controller: {
      kind: 'follow', target: 'ch4.npc.violet', minimumDistance: 55, maxDistance: 150,
      poseMap: { moving: 'pet-follow', hintLook: 'idle', hintAttention: 'idle' },
    },
  }),
];

export const chapter4AssetDefinitions = Object.freeze([
  {
    key: 'chapterCards/ch4/flying-lesson',
    path: 'assets/art/chapter-cards/ch4-flying-lesson.webp',
    kind: 'image',
  },
  {
    key: 'voice/ch4/narrator/preview',
    path: 'assets/audio/voice/ch4/narrator/preview.mp3',
    kind: 'voice',
  },
  {
    key: 'sfx/ch4/flying-preview',
    path: 'assets/audio/sfx/ch4/flying-preview.mp3',
    kind: 'sfx',
  },
].map((asset) => Object.freeze(asset)));

const characterDependencies = [...new Set(npcs.map(({ characterId }) => characterId))];

export const chapter4 = defineChapter({
  contractVersion: 2,
  id: 'ch4',
  number: 4,
  title: 'Flying Lesson & the Forbidden Corridor',
  season: 'autumn',
  start: { scene: previewScene.id, room: previewRoom.id, spawn: 'start' },
  chapterCard: {
    art: 'chapterCards/ch4/flying-lesson',
    voice: 'voice/ch4/narrator/preview',
    title: 'Flying Lesson',
  },
  yearbookMoments: [],
  fragments: [{
    rooms: [previewRoom],
    scenes: [previewScene],
    npcs,
    assets: chapter4AssetDefinitions,
    characterDependencies,
  }],
});

export const chapter4ContentPackage = Object.freeze({
  id: chapter4.id,
  chapter: chapter4,
  maps: chapter4.maps,
  resumeRecaps: chapter4.recaps,
  assets: chapter4AssetDefinitions,
  assetKeys: Object.freeze(Object.keys(chapter4.assets)),
  codeResourceKeys: Object.freeze([]),
  characterDependencies: chapter4.characterDependencies,
  flags: Object.freeze([]),
  status: 'placeholder',
});

export default chapter4ContentPackage;
