import { storybookChecklist } from '../../../content/visualVerification.js';
import {
  actorActionCue,
  dialogueStart,
  flagSet,
  musicCue,
  rewardGrant,
  sfxCue,
  uiOpen,
} from './authoring.js';

function verification(duration, ...checklist) {
  const keyframes = [...new Set([
    0,
    0.5,
    1,
    Number((duration / 2).toFixed(3)),
    duration,
  ])].filter((time) => time <= duration).sort((left, right) => left - right);
  return { keyframes, checklist: storybookChecklist(...checklist) };
}

function setPieceFamily({
  id,
  renderer,
  assets,
  duration,
  timeline,
  params = {},
  onComplete,
  checklist,
  particleBudget = 'standard',
  blocksInput = false,
}) {
  const fallback = `${id}Fallback`;
  const reducedMotion = `${id}Reduced`;
  const shared = {
    tier: 'T1',
    duration,
    clock: 'world',
    blocksInput,
    particleBudget,
    renderer,
    params: { presentation: 'storybook-first-pass', ...params },
    timeline,
    verification: verification(duration, ...checklist),
  };
  return [
    { ...shared, id, assets, fallback, reducedMotion, onComplete },
    { ...shared, id: fallback, assets: [], fallback: null, reducedMotion: null, onComplete },
    { ...shared, id: reducedMotion, assets: [], fallback: null, reducedMotion: null, onComplete },
  ];
}

export const chapter3SetPieceDefinitions = Object.freeze([
  ...setPieceFamily({
    id: 'ch3.setPiece.spellbookReveal',
    renderer: 'setPiece.ch3.spellbookReveal',
    assets: ['props/ch3/spellbook-parcel', 'sfx/ch1/owlFlap', 'sfx/ch1/paperSlide'],
    duration: 2.4,
    timeline: { tracks: [
      sfxCue(0, 'sfx/ch1/owlFlap'),
      sfxCue(0.55, 'sfx/ch1/paperSlide'),
    ] },
    params: { asset: 'props/ch3/spellbook-parcel', title: 'Violet’s Spellbook' },
    onComplete: [
      flagSet('ch3.spellbookOpened'),
      uiOpen('spellbook'),
    ],
    checklist: [
      'The wrapped parcel, named spellbook, empty card frames, and opening fan read as one continuous gift with no blank or doubled-book frame.',
      'All lettering and the newly available map state remain live-rendered rather than baked into the parcel or book painting.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.lumosBloom',
    renderer: 'setPiece.ch3.lumosBloom',
    assets: ['props/ch3/lantern', 'sfx/ch3/lumos-bloom'],
    duration: 1.4,
    timeline: { tracks: [
      actorActionCue(0, 'ch3.npc.flitwick', 'celebrate'),
      sfxCue(0.2, 'sfx/ch3/lumos-bloom'),
    ] },
    params: {
      target: 'ch3.charms.lantern',
      x: 550,
      y: 430,
      warmColor: '#ffe8aa',
    },
    onComplete: [
      flagSet('ch3.lumosProved'),
      dialogueStart('ch3.dialogue.lumosSuccess'),
    ],
    particleBudget: 'celebration',
    checklist: [
      'The classroom stays readable as it dims and the lantern answers Violet’s warm-white wand light without using a black failure frame.',
      'The Lumos bloom remains attached to the lantern and wand while Flitwick’s celebration stays clear of Violet and the spell controls.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.leviosaFeather',
    renderer: 'setPiece.ch3.leviosaFeather',
    assets: ['props/ch3/feather', 'sfx/ch3/leviosa-harp'],
    duration: 2.8,
    timeline: { tracks: [
      actorActionCue(0, 'ch3.npc.flitwick', 'demonstrate'),
      sfxCue(1.05, 'sfx/ch3/leviosa-harp'),
      actorActionCue(1.3, 'ch3.npc.flitwick', 'celebrate'),
    ] },
    params: { feather: 'props/ch3/feather', stages: 6 },
    onComplete: [dialogueStart('ch3.dialogue.leviosaSuccess')],
    particleBudget: 'celebration',
    checklist: [
      'The feather’s six increasing lift stages remain one continuous motion that ends in a clean overhead sail and settled feather.',
      'Gold ribbons and sparkles celebrate the completed chant without covering the feather, Violet, Flitwick, or the learned-card meaning.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.corridorOneReveal',
    renderer: 'setPiece.ch3.corridorOneReveal',
    assets: ['props/ch3/wet-footprints', 'sfx/ch3/trevor-croak-distant'],
    duration: 1.5,
    timeline: { tracks: [sfxCue(0.62, 'sfx/ch3/trevor-croak-distant')] },
    params: {
      reveal: 'wet-footprints',
      destination: 'ch3.corridorTwo',
      x: 1025,
      y: 385,
    },
    onComplete: [
      flagSet('ch3.trailFound'),
      uiOpen('satchel', 'map'),
    ],
    checklist: [
      'Lumos reveals a small wet footprint trail inside one feathered pool of light while every corridor silhouette remains cozy and legible.',
      'The footprints point toward the next route without resembling Trevor or baking a false completion mark into the room.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.trevorReveal',
    renderer: 'setPiece.ch3.trevorReveal',
    assets: ['props/ch3/reflected-eyes', 'sfx/ch3/trevor-croak-near'],
    duration: 1.5,
    timeline: { tracks: [
      sfxCue(0.32, 'sfx/ch3/trevor-croak-near', { pan: 0.55 }),
      actorActionCue(0.45, 'ch3.npc.trevor', 'revealed'),
    ] },
    params: { source: 'ch3.corridorThree.alcove', x: 1010, y: 385 },
    onComplete: [flagSet('ch3.toadRevealed')],
    checklist: [
      'Trevor emerges from the correct alcove as one distinct toad identity, never becoming confused with Violet’s possible pet toad.',
      'Reflected eyes resolve into Trevor only after the valid Lumos cast, while the armor and curtain remain clearly ordinary shapes.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.trevorFound',
    renderer: 'setPiece.ch3.trevorFound',
    assets: ['sfx/ch3/trevor-croak-found'],
    duration: 1.2,
    timeline: { tracks: [
      actorActionCue(0, 'ch3.npc.trevor', 'hop'),
      sfxCue(0.36, 'sfx/ch3/trevor-croak-found'),
    ] },
    params: { caption: 'Found Trevor!' },
    onComplete: [
      flagSet('ch3.toadFound'),
      uiOpen('satchel', 'map'),
    ],
    checklist: [
      'Trevor’s hop into Violet’s hands and indignant croak read clearly without giving silent Violet a generated or authored spoken line.',
      'The short celebration preserves the corridor’s cozy night legibility and leaves the return route immediately available.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.trevorReunion',
    renderer: 'setPiece.ch3.trevorReunion',
    assets: ['props/ch3/toad-token', 'sfx/ch3/trevor-croak-found'],
    duration: 2.2,
    timeline: { tracks: [
      actorActionCue(0, 'ch3.npc.neville', 'reunion'),
      actorActionCue(0.2, 'ch3.npc.trevor', 'reunion'),
      sfxCue(0.5, 'sfx/ch3/trevor-croak-found'),
    ] },
    params: { points: 10, token: 'treasure.ch3.toad-token' },
    onComplete: [
      rewardGrant('ch3.reward.trevorReturned', {
        points: 10,
        treasures: ['treasure.ch3.toad-token'],
      }),
      flagSet('ch3.toadReturned'),
    ],
    checklist: [
      'Neville and Trevor’s relieved reunion remains the focal action while Violet’s ten house points and toad token arrive as one restrained reward beat.',
      'The distinct Trevor identity remains readable throughout the handoff and never swaps to Violet’s selectable pet-toad art.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch3.setPiece.chapterClose',
    renderer: 'setPiece.ch3.chapterClose',
    assets: [
      'chapterCards/ch3/first-spells',
      'chapterCards/ch4/flying-lesson',
      'sfx/ch2/chapter-turn',
      'music/ch2/common-room',
    ],
    duration: 3.2,
    timeline: { tracks: [
      musicCue(0, 'music/ch2/common-room'),
      sfxCue(0.18, 'sfx/ch2/chapter-turn'),
    ] },
    params: {
      art: 'chapterCards/ch3/first-spells',
      title: 'Violet’s First Spells',
      spells: ['lumos', 'leviosa'],
      preview: 'chapterCards/ch4/flying-lesson',
      previewEyebrow: 'Coming soon',
      previewTitle: 'Flying Lesson',
    },
    onComplete: [
      flagSet('ch3.chapterCardSeen'),
      dialogueStart('ch3.dialogue.chapterClose'),
    ],
    checklist: [
      'Lumos and Leviosa appear together in Violet’s open spellbook beneath the exact live chapter title Violet’s First Spells.',
      'The autumn common-room close turns cleanly into one truthful flying-lesson preview with no blank page or playable-Chapter-Four implication.',
    ],
  }),
]);

export const chapter3SetPieceRendererIds = Object.freeze([
  ...new Set(chapter3SetPieceDefinitions.map(({ renderer }) => renderer)),
]);
