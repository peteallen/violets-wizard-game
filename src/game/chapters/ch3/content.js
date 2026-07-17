import { defineRoom, defineScene } from '../../content/chapterAuthoring.js';
import { defineChapter } from '../../content/chapterComposer.js';

const petController = (target, poseMap, extras = {}) => ({
  kind: 'follow',
  target,
  minimumDistance: 65,
  maxDistance: 190,
  poseMap,
  ...extras,
});

const npcs = [
  {
    id: 'ch3.npc.violet', characterId: 'character.violet',
    displayName: 'Violet', puppet: 'puppet.violet', portrait: 'portrait.violet',
    voiceRole: 'silent', scale: 1, hitRadius: 88, defaultPose: 'idle',
    controller: { kind: 'static' }, defaultTalk: null,
  },
  {
    id: 'ch3.npc.narrator', characterId: 'character.narrator',
    displayName: 'Narrator', puppet: 'puppet.none', portrait: 'portrait.none',
    voiceRole: 'narrator', scale: 1, hitRadius: 88, defaultPose: 'idle',
    controller: { kind: 'static' }, defaultTalk: null,
  },
  {
    id: 'ch3.npc.pet.cat', characterId: 'character.cat',
    displayName: 'Cat', puppet: 'puppet.pet.cat', portrait: 'portrait.pet.cat',
    voiceRole: 'creature', scale: 0.55, hitRadius: 88, defaultPose: 'idle',
    controller: petController('ch3.npc.violet', {
      moving: 'pet-follow', hintLook: 'idle', hintAttention: 'paw',
    }),
    defaultTalk: null,
  },
  {
    id: 'ch3.npc.pet.owl', characterId: 'character.pet-owl',
    displayName: 'Owl', puppet: 'puppet.pet.owl', portrait: 'portrait.pet.owl',
    voiceRole: 'creature', scale: 0.55, hitRadius: 88, defaultPose: 'idle',
    controller: petController('ch3.npc.violet', {
      moving: 'pet-follow', hintLook: 'idle', hintAttention: 'perch',
    }, { facingLookMagnitude: 0.45 }),
    defaultTalk: null,
  },
  {
    id: 'ch3.npc.pet.toad', characterId: 'character.toad',
    displayName: 'Toad', puppet: 'puppet.pet.toad', portrait: 'portrait.pet.toad',
    voiceRole: 'creature', scale: 0.42, hitRadius: 88, defaultPose: 'idle',
    controller: petController('ch3.npc.violet', {
      moving: 'pet-follow', hintLook: 'idle', hintAttention: 'idle',
    }),
    defaultTalk: null,
  },
];

const previewRoom = defineRoom({
  id: 'ch3.previewRoom',
  size: { width: 1280, height: 720 },
  background: {
    layers: ['chapterCards/ch3/first-classes'],
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
  id: 'ch3.scene.preview',
  order: 10,
  room: previewRoom.id,
  spawn: 'start',
  when: {},
  onEnter: [{ type: 'dialogue.start', script: 'ch3.dialogue.preview' }],
  resumeAt: { room: previewRoom.id, spawn: 'start' },
  layer: { occupants: [], hotspots: [], exits: [], ambientSetPieces: [] },
});

export const chapter3 = defineChapter({
  contractVersion: 2,
  id: 'ch3',
  number: 3,
  title: 'First Classes',
  season: 'early-autumn',
  start: { scene: previewScene.id, room: previewRoom.id, spawn: 'start' },
  chapterCard: {
    art: 'chapterCards/ch3/first-classes',
    voice: 'voice/ch3/narrator/preview',
    title: 'First Classes',
  },
  yearbookMoments: [],
  fragments: [{
    rooms: [previewRoom],
    scenes: [previewScene],
    npcs,
    dialogues: [{
      id: 'ch3.dialogue.preview',
      start: 'nextTime',
      resumePolicy: 'restart-current-node',
      replayable: true,
      nodes: {
        nextTime: {
          type: 'line',
          speaker: 'ch3.npc.narrator',
          voice: 'voice/ch3/narrator/preview',
          text: 'Next time, Violet opens her spellbook and begins her first magical classes.',
          caption: 'Next: first classes!',
          phoneticText: null,
          portraitPose: 'talk',
          next: 'finish',
        },
        finish: { type: 'end', actions: [] },
      },
    }],
    assets: [
      {
        key: 'chapterCards/ch3/first-classes',
        path: 'assets/art/rooms/ch2-gryffindor-common-room.webp',
        kind: 'image',
      },
      {
        key: 'voice/ch3/narrator/preview',
        path: 'assets/audio/voice/ch2/narrator/chapterEnd.mp3',
        kind: 'voice',
      },
    ],
    characterDependencies: [
      'character.violet',
      'character.narrator',
      'character.cat',
      'character.pet-owl',
      'character.toad',
    ],
  }],
});

export const chapter3ContentPackage = Object.freeze({
  id: chapter3.id,
  chapter: chapter3,
  maps: chapter3.maps,
  resumeRecaps: chapter3.recaps,
  assetKeys: Object.freeze(Object.keys(chapter3.assets)),
  codeResourceKeys: Object.freeze([]),
  characterDependencies: chapter3.characterDependencies,
  flags: Object.freeze([]),
  status: 'placeholder',
});

export default chapter3ContentPackage;
