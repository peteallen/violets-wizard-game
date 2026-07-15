import { defineCharacter } from '../CharacterDefinition.js';
import { characterImageAssets, defineCharacterReview } from '../packageSupport.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const WANDMAKER_ALIASES = Object.freeze({ talk: 'speaking' });

/** The Wandmaker's shipped counter and dialogue paintings. */
export const wandmakerFullFrameCharacterDefinition = Object.freeze({
  id: 'puppet.wandmaker.full-frame',
  kind: 'wandmaker',
  chapter: 'ch1',
  basePath: 'assets/art/characters/wandmaker',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 215,
  placement: Object.freeze({
    portrait: Object.freeze({ y: 12 }),
  }),
  defaultAppearance: DEFAULT,
  appearances: Object.freeze({
    [DEFAULT]: Object.freeze({
      clips: Object.freeze({
        idle: still('default/neutral.png'),
        neutral: still('default/neutral.png'),
        blink: still('default/blink.png'),
        'talk-a': still('default/talk-a.png'),
        'talk-b': still('default/talk-b.png'),
        speaking: Object.freeze({
          fps: 4,
          frames: Object.freeze(['default/talk-a.png', 'default/talk-b.png']),
          reducedMotionClip: 'talk-a',
        }),
      }),
      aliases: WANDMAKER_ALIASES,
    }),
  }),
});

export const wandmakerCharacterDefinition = defineCharacter({
  id: 'character.wandmaker',
  metadata: {
    displayName: 'Wandmaker',
    kind: 'human',
    voiceRole: 'wandmaker',
  },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: DEFAULT, pose: 'idle' },
  capabilities: {
    appearances: [DEFAULT],
    poses: ['idle', 'neutral', 'blink', 'talk-a', 'talk-b', 'speaking', 'talk'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: 0, y: 0, width: 896, height: 1132 },
    portrait: { x: 179.2, y: 0, width: 537.6, height: 504 },
  },
  assets: characterImageAssets('wandmaker', [
    'default/neutral.png',
    'default/blink.png',
    'default/talk-a.png',
    'default/talk-b.png',
  ]),
});

export const wandmakerCharacterReview = defineCharacterReview([
  'character-cast-review',
  'character-portraits-review',
  'wandmaker-sprite-review',
]);
