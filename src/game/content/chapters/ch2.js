import { storybookChecklist } from '../visualVerification.js';

export const chapter2CharacterIds = Object.freeze([
  'character.violet',
  'character.narrator',
  'character.cat',
  'character.pet-owl',
  'character.toad',
]);

const noCondition = Object.freeze({});

const previewDialogue = {
  id: 'ch2.preview',
  start: 'nextTime',
  resumePolicy: 'restart-current-node',
  replayable: true,
  nodes: {
    nextTime: {
      type: 'line',
      speaker: 'npc.narrator',
      voice: 'voice/ch2/narrator/preview',
      text: 'Next time, Violet runs through the barrier and rides the Hogwarts Express.',
      caption: 'Next: the train!',
      phoneticText: null,
      portraitPose: 'talk',
      next: 'choice',
    },
    choice: {
      type: 'choice',
      choices: [
        {
          id: 'explore',
          icon: 'map',
          caption: 'Explore',
          actions: [
            { type: 'flag.set', flag: 'ch1.previewSeen', value: true },
            { type: 'choice.record', id: 'ch2.preview.action', value: 'explore' },
            { type: 'travel.request', room: 'ch1.diagonStreet', spawn: 'west' },
          ],
          next: 'finish',
        },
        {
          id: 'playAgain',
          icon: 'page-turn',
          caption: 'Play again',
          actions: [
            { type: 'flag.set', flag: 'ch1.previewSeen', value: true },
            { type: 'choice.record', id: 'ch2.preview.action', value: 'replay' },
            { type: 'ui.open', surface: 'chapter-replay', tab: 'ch1' },
          ],
          next: 'finish',
        },
      ],
    },
    finish: { type: 'end', actions: [] },
  },
};

export const chapter2 = {
  contractVersion: 1,
  id: 'ch2',
  number: 2,
  title: 'Platform 9¾ & The Sorting',
  season: 'early-autumn',
  start: { scene: 'ch2.placeholder', room: 'ch2.previewRoom', spawn: 'start' },
  scenes: {
    'ch2.placeholder': {
      id: 'ch2.placeholder',
      room: 'ch2.previewRoom',
      spawn: 'start',
      when: { allFlags: ['ch1.complete'] },
      onEnter: [{ type: 'setPiece.play', id: 'sp.ch2.previewTicket' }],
      doneWhen: { allFlags: ['ch1.previewSeen'] },
      next: null,
      resumeAt: { room: 'ch2.previewRoom', spawn: 'start' },
    },
  },
  rooms: {
    'ch2.previewRoom': {
      id: 'ch2.previewRoom',
      size: { width: 1280, height: 720 },
      background: {
        layers: ['chapterCards/ch1/platform'],
        fit: 'cover',
        focalPoint: { x: 0.5, y: 0.5 },
        variants: {},
      },
      walkBand: { top: 600, bottom: 640 },
      spawns: { start: { x: 640, y: 620, facing: 'right' } },
      exits: [],
      occupants: [],
      hotspots: [],
      ambientSetPieces: [],
    },
  },
  npcs: {
    'npc.violet': {
      id: 'npc.violet',
      characterId: 'character.violet',
      displayName: 'Violet',
      puppet: 'puppet.violet',
      portrait: 'portrait.violet',
      voiceRole: 'silent',
      scale: 1,
      hitRadius: 88,
      defaultPose: 'idle',
      controller: { kind: 'static' },
      defaultTalk: null,
    },
    'npc.narrator': {
      id: 'npc.narrator',
      characterId: 'character.narrator',
      displayName: 'Narrator',
      puppet: 'puppet.none',
      portrait: 'portrait.none',
      voiceRole: 'narrator',
      scale: 1,
      hitRadius: 88,
      defaultPose: 'idle',
      controller: { kind: 'static' },
      defaultTalk: null,
    },
    'npc.pet.cat': {
      id: 'npc.pet.cat',
      characterId: 'character.cat',
      displayName: 'Cat',
      puppet: 'puppet.pet.cat',
      portrait: 'portrait.pet.cat',
      voiceRole: 'creature',
      scale: 0.55,
      hitRadius: 88,
      defaultPose: 'idle',
      controller: { kind: 'follow', target: 'npc.violet', minimumDistance: 70, maxDistance: 190 },
      defaultTalk: null,
    },
    'npc.pet.owl': {
      id: 'npc.pet.owl',
      characterId: 'character.pet-owl',
      displayName: 'Owl',
      puppet: 'puppet.pet.owl',
      portrait: 'portrait.pet.owl',
      voiceRole: 'creature',
      scale: 0.55,
      hitRadius: 88,
      defaultPose: 'idle',
      controller: { kind: 'follow', target: 'npc.violet', minimumDistance: 90, maxDistance: 220 },
      defaultTalk: null,
    },
    'npc.pet.toad': {
      id: 'npc.pet.toad',
      characterId: 'character.toad',
      displayName: 'Toad',
      puppet: 'puppet.pet.toad',
      portrait: 'portrait.pet.toad',
      voiceRole: 'creature',
      scale: 0.42,
      hitRadius: 88,
      defaultPose: 'idle',
      controller: { kind: 'follow', target: 'npc.violet', minimumDistance: 55, maxDistance: 150 },
      defaultTalk: null,
    },
  },
  dialogues: { [previewDialogue.id]: previewDialogue },
  quests: {},
  learningBeats: {},
  setPieces: {
    'sp.ch2.previewTicket': {
      id: 'sp.ch2.previewTicket',
      tier: 'T1',
      duration: 4,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'reduced',
      assets: ['chapterCards/ch1/platform', 'sfx/ch2/trainWhistle'],
      fallback: 'fallback.staticPage',
      reducedMotion: 'reduced.staticPage',
      params: { ticketBobPixels: 8 },
      timeline: { tracks: [] },
      verification: {
        keyframes: [0, 1, 4],
        checklist: storybookChecklist('The ticket remains legible.', 'The compact title plaque and bottom action shelf never overlap.', 'The platform painting remains visible between title and actions.', 'Explore, Play again, and Start fresh each have a distinct generous target.', 'No generic owl ornament or choice card is present.', 'Start fresh opens confirmation before clearing progress.', 'No control implies that Chapter 2 is already playable.'),
      },
      onComplete: [{ type: 'dialogue.start', script: 'ch2.preview' }],
    },
  },
  encounters: {},
  minigames: {},
  chapterCard: {
    art: 'chapterCards/ch1/platform',
    voice: 'voice/ch2/narrator/preview',
    title: 'Next: the train!',
  },
  yearbookMoments: [],
};

export const chapter2Status = 'placeholder';
export const chapter2Flags = ['ch1.previewSeen'];
export const chapter2AssetKeys = ['chapterCards/ch1/platform', 'voice/ch2/narrator/preview', 'sfx/ch2/trainWhistle'];
export const chapter2CodeResourceKeys = ['prop.ch1.ticket'];

export default chapter2;
