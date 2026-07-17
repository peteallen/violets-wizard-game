import { defineCharacter } from '../CharacterDefinition.js';
import { characterImageAssets, defineCharacterReview } from '../packageSupport.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const CLIPS = Object.freeze({
  idle: still('default/neutral.png'),
  neutral: still('default/neutral.png'),
  'talk-a': still('default/talk-a.png'),
  'talk-b': still('default/talk-b.png'),
  speaking: Object.freeze({
    fps: 4,
    frames: Object.freeze(['default/talk-a.png', 'default/talk-b.png']),
    reducedMotionClip: 'talk-a',
  }),
  tearful: still('default/tearful.png'),
  relieved: still('default/relieved.png'),
  reunion: still('default/reunion.png'),
});

const ALIASES = Object.freeze({
  talk: 'speaking',
  'tearful-but-not-panicked': 'tearful',
  'hugging-trevor': 'reunion',
});

const ACTIONS = Object.freeze({ reunion: 'reunion' });

export const nevilleFullFrameCharacterDefinition = Object.freeze({
  id: 'character.neville',
  basePath: 'assets/art/characters/neville',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 205,
  placement: Object.freeze({
    portrait: Object.freeze({ y: 22, scale: 0.23 }),
  }),
  defaultAppearance: DEFAULT,
  appearances: Object.freeze({
    [DEFAULT]: Object.freeze({ clips: CLIPS, aliases: ALIASES, actions: ACTIONS }),
  }),
});

export const nevilleCharacterDefinition = defineCharacter({
  id: 'character.neville',
  metadata: {
    displayName: 'Neville',
    kind: 'human',
    voiceRole: 'gentle-worried-classmate',
  },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: DEFAULT, pose: 'idle' },
  capabilities: {
    appearances: [DEFAULT],
    poses: [...Object.keys(CLIPS), ...Object.keys(ALIASES)],
    actions: Object.keys(ACTIONS),
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: 0, y: 0, width: 896, height: 1132 },
    portrait: { x: 179.2, y: 0, width: 537.6, height: 504 },
  },
  assets: characterImageAssets('neville', [
    'default/neutral.png',
    'default/talk-a.png',
    'default/talk-b.png',
    'default/tearful.png',
    'default/relieved.png',
    'default/reunion.png',
  ]),
});

export const nevilleCharacterReview = defineCharacterReview([
  'neville-sprite-review',
]);
