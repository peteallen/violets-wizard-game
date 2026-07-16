import {
  characterSet,
  dialogueStart,
  flagSet,
  travel,
  yearbookCapture,
} from './authoring.js';

function verification(...checklist) {
  return { keyframes: [0, 0.5, 1], checklist };
}

function setPieceFamily({ id, renderer, assets, onComplete, checklist }) {
  const fallback = `${id}Fallback`;
  const reducedMotion = `${id}Reduced`;
  const shared = {
    tier: 'T1',
    duration: 1,
    clock: 'world',
    blocksInput: true,
    particleBudget: 'reduced',
    renderer,
    params: { presentation: 'greybox' },
    timeline: { tracks: [] },
    verification: verification(...checklist),
  };
  return [
    {
      ...shared,
      id,
      assets,
      fallback,
      reducedMotion,
      onComplete,
    },
    {
      ...shared,
      id: fallback,
      assets: [],
      fallback: null,
      reducedMotion: null,
      onComplete,
    },
    {
      ...shared,
      id: reducedMotion,
      assets: [],
      fallback: null,
      reducedMotion: null,
      onComplete,
    },
  ];
}

export const chapter2SetPieceDefinitions = Object.freeze([
  ...setPieceFamily({
    id: 'ch2.setPiece.barrierRun',
    renderer: 'setPiece.ch2.barrierRun',
    assets: ['sfx/ch2/barrier-whoosh', 'music/ch2/platform'],
    onComplete: [flagSet('ch2.barrierCrossed')],
    checklist: [
      'Comic hesitation reads before Violet commits to the run.',
      'The opaque whoosh fully covers the platform room-variant swap.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.sweetReaction',
    renderer: 'setPiece.ch2.sweetReaction',
    assets: ['sfx/ch2/sweet-reaction'],
    onComplete: [flagSet('ch2.sweetReactionSeen')],
    checklist: [
      'Violet reacts silently through a readable face and body pose.',
      'The reaction is playful and never presents a failure state.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.lakeVista',
    renderer: 'setPiece.ch2.lakeVista',
    assets: ['music/ch2/lake-wonder'],
    onComplete: [
      flagSet('ch2.lakeSeen'),
      travel('ch2.greatHall', 'doors', 'ink'),
    ],
    checklist: [
      'The castle is the uncontested focal point for the complete hold.',
      'Reduced motion preserves the same quiet composition without drift.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.sortingReveal',
    renderer: 'setPiece.ch2.sortingReveal',
    assets: ['sfx/ch2/gryffindor-cheer', 'music/ch2/sorting'],
    onComplete: [
      characterSet('house', 'gryffindor'),
      yearbookCapture('ch2.yearbook.sorting'),
      flagSet('ch2.sortedGryffindor'),
    ],
    checklist: [
      'Gryffindor is the only outcome presented to Violet.',
      'The yearbook frame includes Violet, the Hat, and the Gryffindor banner.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.commonRoomArrival',
    renderer: 'setPiece.ch2.commonRoomArrival',
    assets: ['music/ch2/common-room'],
    onComplete: [
      flagSet('ch2.commonRoomArrived'),
      travel('ch2.chapterCardRoom', 'start', 'ink'),
    ],
    checklist: [
      'The common room reads as warm, safe, and specifically Gryffindor.',
      'Violet remains the center of the welcome composition.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.chapterCard',
    renderer: 'setPiece.ch2.chapterCard',
    assets: ['chapterCards/ch2/gryffindor-home-greybox', 'sfx/ch2/chapter-turn'],
    onComplete: [dialogueStart('ch2.dialogue.chapterEnd')],
    checklist: [
      'The chapter title remains legible over the illustrated card.',
      'The page turn reveals no blank or unpainted frame.',
    ],
  }),
]);

export const chapter2SetPieceRendererIds = Object.freeze([
  ...new Set(chapter2SetPieceDefinitions.map(({ renderer }) => renderer)),
]);
