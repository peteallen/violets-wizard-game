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
  demonstrate: still('default/demonstrate.png'),
  'wand-cast': still('default/wand-cast.png'),
  celebrate: still('default/celebrate.png'),
});

const ALIASES = Object.freeze({
  talk: 'speaking',
  demonstrating: 'demonstrate',
  delighted: 'celebrate',
});

const ACTIONS = Object.freeze({
  demonstrate: 'demonstrate',
  'wand-cast': 'wand-cast',
  celebrate: 'celebrate',
});

export const flitwickFullFrameCharacterDefinition = Object.freeze({
  id: 'character.flitwick',
  basePath: 'assets/art/characters/flitwick',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 145,
  placement: Object.freeze({
    portrait: Object.freeze({ y: 36, scale: 0.22 }),
  }),
  defaultAppearance: DEFAULT,
  appearances: Object.freeze({
    [DEFAULT]: Object.freeze({ clips: CLIPS, aliases: ALIASES, actions: ACTIONS }),
  }),
});

export const flitwickCharacterDefinition = defineCharacter({
  id: 'character.flitwick',
  metadata: {
    displayName: 'Professor Flitwick',
    kind: 'human',
    voiceRole: 'bright-charms-professor',
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
  assets: characterImageAssets('flitwick', [
    'default/neutral.png',
    'default/talk-a.png',
    'default/talk-b.png',
    'default/demonstrate.png',
    'default/wand-cast.png',
    'default/celebrate.png',
  ]),
});

export const flitwickCharacterReview = defineCharacterReview([
  'flitwick-sprite-review',
]);
