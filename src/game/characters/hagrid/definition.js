import { defineCharacter } from '../CharacterDefinition.js';
import { characterImageAssets, defineCharacterReview } from '../packageSupport.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const HAGRID_ALIASES = Object.freeze({
  talk: 'speaking',
  walk: 'walking',
});

/** Hagrid's complete aligned paintings; no body-part assembly occurs at runtime. */
export const hagridFullFrameCharacterDefinition = Object.freeze({
  id: 'character.hagrid',
  basePath: 'assets/art/characters/hagrid',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 295,
  placement: Object.freeze({
    portrait: Object.freeze({ y: 58 }),
  }),
  bounds: Object.freeze({
    shadow: Object.freeze({ x: 110, y: 1100, width: 676, height: 64 }),
  }),
  defaultAppearance: DEFAULT,
  appearances: Object.freeze({
    [DEFAULT]: Object.freeze({
      clips: Object.freeze({
        idle: still('default/neutral.webp'),
        neutral: still('default/neutral.webp'),
        blink: still('default/blink.webp'),
        'talk-a': still('default/talk-a.webp'),
        'talk-b': still('default/talk-b.webp'),
        speaking: Object.freeze({
          fps: 4,
          frames: Object.freeze(['default/talk-a.webp', 'default/talk-b.webp']),
          reducedMotionClip: 'talk-a',
        }),
        'profile-right': still('default/profile-right.webp'),
        walking: Object.freeze({
          fps: 4,
          frames: Object.freeze([
            'default/profile-right.webp',
            'default/walk-contact.webp',
          ]),
          reducedMotionClip: 'profile-right',
        }),
      }),
      aliases: HAGRID_ALIASES,
    }),
  }),
});

export const hagridCharacterDefinition = defineCharacter({
  id: 'character.hagrid',
  metadata: {
    displayName: 'Hagrid',
    kind: 'human',
    voiceRole: 'guide',
  },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: DEFAULT, pose: 'idle' },
  capabilities: {
    appearances: [DEFAULT],
    poses: [
      'idle', 'neutral', 'blink', 'talk-a', 'talk-b', 'speaking',
      'profile-right', 'walking', 'talk', 'walk',
    ],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: 0, y: 0, width: 896, height: 1132 },
    portrait: { x: 179.2, y: 0, width: 537.6, height: 504 },
  },
  assets: characterImageAssets('hagrid', [
    'default/neutral.webp',
    'default/blink.webp',
    'default/talk-a.webp',
    'default/talk-b.webp',
    'default/profile-right.webp',
    'default/walk-contact.webp',
  ]),
});

export const hagridCharacterReview = defineCharacterReview([
  'character-cast-review',
  'character-portraits-review',
  'hagrid-sprite-review',
]);
