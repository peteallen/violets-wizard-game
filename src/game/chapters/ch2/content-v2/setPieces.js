import { storybookChecklist } from '../../../content/visualVerification.js';
import {
  actorActionCue,
  characterSet,
  dialogueStart,
  flagSet,
  musicCue,
  sfxCue,
  travel,
  yearbookCapture,
} from './authoring.js';

function verification(duration, ...checklist) {
  const keyframes = [...new Set([
    0,
    0.5,
    1,
    Number((duration / 2).toFixed(3)),
    duration,
  ])].filter((time) => time <= duration).sort((left, right) => left - right);
  return {
    keyframes,
    checklist: storybookChecklist(...checklist),
  };
}

function setPieceFamily({ id, renderer, assets, duration, timeline, params = {}, onComplete, checklist }) {
  const fallback = `${id}Fallback`;
  const reducedMotion = `${id}Reduced`;
  const shared = {
    tier: 'T1',
    duration,
    clock: 'world',
    blocksInput: true,
    particleBudget: 'reduced',
    renderer,
    params: { presentation: 'first-pass', ...params },
    timeline,
    verification: verification(duration, ...checklist),
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
    duration: 1.4,
    timeline: { tracks: [
      actorActionCue(0, 'ch2.npc.violet', 'barrier-run'),
      musicCue(0, 'music/ch2/platform'),
      sfxCue(0.3, 'sfx/ch2/barrier-whoosh'),
    ] },
    params: {
      preloadRoomVariant: 'platform',
      revealRoomVariantAt: 0.68,
    },
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
    duration: 1.6,
    timeline: { tracks: [
      actorActionCue(0, 'ch2.npc.violet', 'sweet-reaction', { expression: 'proud' }),
      sfxCue(0.12, 'sfx/ch2/sweet-reaction'),
    ] },
    params: { choiceId: 'ch2.choice.sweet' },
    onComplete: [flagSet('ch2.sweetReactionSeen')],
    checklist: [
      'Violet reacts silently through a readable face and body pose.',
      'The reaction is playful and never presents a failure state.',
      'Passing scenery and a restrained light sweep keep the train carriage gently in motion.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.lakeVista',
    renderer: 'setPiece.ch2.lakeVista',
    assets: ['music/ch2/lake-wonder'],
    duration: 3.2,
    timeline: { tracks: [musicCue(0, 'music/ch2/lake-wonder')] },
    onComplete: [
      flagSet('ch2.lakeSeen'),
      travel('ch2.greatHall', 'doors', 'ink'),
    ],
    checklist: [
      'The castle is the uncontested focal point for the complete hold.',
      'The foreground boat bobs and yaws while near water reflections move farther than distant mist.',
      'Reduced motion preserves the same quiet composition without drift.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.sortingReveal',
    renderer: 'setPiece.ch2.sortingReveal',
    assets: ['sfx/ch2/gryffindor-cheer', 'music/ch2/sorting'],
    duration: 3.6,
    timeline: { tracks: [musicCue(0, 'music/ch2/sorting'), sfxCue(0.88, 'sfx/ch2/gryffindor-cheer')] },
    params: {
      preloadRoomVariant: 'gryffindor',
      revealRoomVariantAt: 0.62,
    },
    onComplete: [
      characterSet('house', 'gryffindor'),
      yearbookCapture('ch2.yearbook.sorting'),
      flagSet('ch2.sortedGryffindor'),
    ],
    checklist: [
      'Gryffindor is the only outcome presented to Violet.',
      'The Hat pulse, answering candlelight, announcement ribbon, and banners arrive as separate readable beats.',
      'The yearbook frame includes Violet, the Hat, and the Gryffindor banner.',
    ],
  }),
  ...setPieceFamily({
    id: 'ch2.setPiece.commonRoomArrival',
    renderer: 'setPiece.ch2.commonRoomArrival',
    assets: ['music/ch2/common-room'],
    duration: 2.4,
    timeline: { tracks: [musicCue(0, 'music/ch2/common-room')] },
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
    assets: ['chapterCards/ch2/gryffindor-home', 'sfx/ch2/chapter-turn'],
    duration: 3.4,
    timeline: { tracks: [sfxCue(0, 'sfx/ch2/chapter-turn')] },
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
