import {
  flagSet,
  setPiecePlay,
  spellLearn,
  uiOpen,
} from './authoring.js';

const compactAssistance = 'learning.compact-3-6-9';

function learningModes({ gentleInteraction, stretchyInteraction }) {
  return {
    off: { interaction: 'singleTap' },
    gentle: {
      interaction: gentleInteraction,
      tileFace: 'shown',
      distractorCount: 1,
    },
    stretchy: {
      interaction: stretchyInteraction,
      tileFace: 'adaptive',
      distractorCount: 2,
    },
  };
}

export const lumosLearningBeat = Object.freeze({
  id: 'ch3.learning.lumos',
  kind: 'assembly',
  scene: 'ch3.scene.lumosClass',
  skill: 'phonics',
  completionFlag: 'ch3.lumosLearned',
  replayable: false,
  assistanceProfile: compactAssistance,
  feedback: {
    wrongVoice: 'voice/ch3/flitwick/letters-into-magic',
    wrongCaption: 'Lumos',
  },
  content: {
    spell: 'lumos',
    presentation: 'learning.ch3.lumos-runes',
    units: [
      { id: 'l', glyph: 'L', voice: 'voice/ch3/learning/lumos/l' },
      { id: 'u', glyph: 'U', voice: 'voice/ch3/learning/lumos/u' },
      { id: 'm', glyph: 'M', voice: 'voice/ch3/learning/lumos/m' },
      { id: 'o', glyph: 'O', voice: 'voice/ch3/learning/lumos/o' },
      { id: 's', glyph: 'S', voice: 'voice/ch3/learning/lumos/s' },
    ],
    order: ['l', 'u', 'm', 'o', 's'],
    distractors: [
      { id: 'e', glyph: 'E', voice: 'voice/ch3/learning/lumos/e' },
      { id: 'a', glyph: 'A', voice: 'voice/ch3/learning/lumos/a' },
    ],
  },
  modes: learningModes({
    gentleInteraction: 'guided-match',
    stretchyInteraction: 'adaptive-match',
  }),
  onComplete: [
    flagSet('ch3.lumosLearned'),
    spellLearn('lumos'),
    uiOpen('spellbook', 'lumos'),
  ],
});

export const leviosaLearningBeat = Object.freeze({
  id: 'ch3.learning.leviosa',
  kind: 'sequence',
  scene: 'ch3.scene.leviosaClass',
  skill: 'sequence',
  completionFlag: 'ch3.leviosaLearned',
  replayable: false,
  assistanceProfile: compactAssistance,
  feedback: {
    wrongVoice: 'voice/ch3/flitwick/swish-and-flick',
    wrongCaption: 'Swish! Flick!',
  },
  content: {
    spell: 'leviosa',
    presentation: 'learning.ch3.leviosa-chant',
    units: [
      { id: 'win', glyph: 'WIN', voice: 'voice/ch3/learning/leviosa/win' },
      { id: 'gar', glyph: 'GAR', voice: 'voice/ch3/learning/leviosa/gar' },
      { id: 'dium', glyph: 'DIUM', voice: 'voice/ch3/learning/leviosa/dium' },
      { id: 'levi', glyph: 'LEVI', voice: 'voice/ch3/learning/leviosa/levi' },
      { id: 'o', glyph: 'O', voice: 'voice/ch3/learning/leviosa/o' },
      { id: 'sa', glyph: 'SA', voice: 'voice/ch3/learning/leviosa/sa' },
    ],
    order: ['win', 'gar', 'dium', 'levi', 'o', 'sa'],
    distractors: [],
  },
  modes: learningModes({
    gentleInteraction: 'guided-chant',
    stretchyInteraction: 'adaptive-chant',
  }),
  onComplete: [
    flagSet('ch3.leviosaLearned'),
    spellLearn('leviosa'),
    setPiecePlay('ch3.setPiece.leviosaFeather'),
  ],
});

export const chapter3LearningBeatDefinitions = Object.freeze([
  lumosLearningBeat,
  leviosaLearningBeat,
]);
