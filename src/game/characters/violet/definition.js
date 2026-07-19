import { defineCharacter } from '../CharacterDefinition.js';
import { characterImageAssets, defineCharacterReview } from '../packageSupport.js';

const CASUAL = 'casual';
const ROBES = 'robes';
const ALIGNED_GROUND_Y = 1132;
const VIOLET_WORLD_HEIGHT = 185;
const VIOLET_PORTRAIT_HEIGHT = 235;

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

function held(path) {
  return Object.freeze({ fps: 1, loop: false, frames: Object.freeze([path]) });
}

const VIOLET_ACTIONS = Object.freeze({
  inspect: 'wand-test',
  'wrong-wand-one': 'wrong-wand-one',
  'wrong-wand-two': 'wrong-wand-two',
  'chosen-wand': 'cheer',
  'receive-wand': 'wand-receive',
  'admire-robes': 'robe-present',
  'broom-wonder': 'wonder',
  'barrier-run': 'walking',
  'sweet-reaction': 'giggle',
});

const COMMON_ALIASES = Object.freeze({
  talk: 'speaking',
  walk: 'walking',
  jump: 'jump-for-joy',
});

/**
 * Violet's production sheet contract. Each image is already aligned to the same
 * 896 x 1200 canvas, so runtime animation only selects whole painted frames.
 */
export const violetFullFrameCharacterDefinition = Object.freeze({
  id: 'character.violet',
  basePath: 'assets/art/characters/violet',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: ALIGNED_GROUND_Y }),
  }),
  // Violet is the youngest human in the cast. Keep her physically smaller in
  // rooms and set pieces without shrinking the face-first dialogue cameo.
  worldHeight: VIOLET_WORLD_HEIGHT,
  placement: Object.freeze({
    portrait: Object.freeze({
      scale: VIOLET_PORTRAIT_HEIGHT / ALIGNED_GROUND_Y,
    }),
  }),
  defaultAppearance: CASUAL,
  appearances: Object.freeze({
    [CASUAL]: Object.freeze({
      clips: Object.freeze({
        idle: still('casual/neutral.webp'),
        neutral: still('casual/neutral.webp'),
        blink: still('casual/blink.webp'),
        'talk-a': still('casual/talk-a.webp'),
        'talk-b': still('casual/talk-b.webp'),
        speaking: Object.freeze({
          fps: 4,
          frames: Object.freeze(['casual/talk-a.webp', 'casual/talk-b.webp']),
          reducedMotionClip: 'talk-a',
        }),
        'profile-right': still('casual/profile-right.webp'),
        walking: Object.freeze({
          fps: 4,
          frames: Object.freeze([
            'casual/profile-right.webp',
            'casual/walk-contact.webp',
          ]),
          reducedMotionClip: 'profile-right',
        }),
        'jump-for-joy': held('casual/jump.webp'),
        giggle: held('casual/giggle.webp'),
        tumble: held('casual/tumble.webp'),
        recovery: Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze(['casual/giggle.webp', 'casual/neutral.webp']),
          reducedMotionClip: 'idle',
        }),
        'wand-hold': still('casual/neutral.webp'),
        'wand-test': Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze([
            'casual/wand-hold.webp',
            'casual/tumble.webp',
            'casual/giggle.webp',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        'wand-receive': held('casual/wand-hold.webp'),
        cast: held('casual/cheer.webp'),
        'robe-present': held('casual/proud.webp'),
        'wrong-wand-one': Object.freeze({
          fps: 1,
          loop: false,
          frames: Object.freeze(['casual/wand-hold.webp']),
          reducedMotionClip: 'wand-hold',
        }),
        'wrong-wand-two': Object.freeze({
          fps: 1,
          loop: false,
          frames: Object.freeze(['casual/tumble.webp']),
          reducedMotionClip: 'wand-hold',
        }),
        cheer: held('casual/cheer.webp'),
        wonder: still('casual/wonder.webp'),
        proud: still('casual/proud.webp'),
        curious: still('casual/curious.webp'),
      }),
      aliases: COMMON_ALIASES,
      actions: VIOLET_ACTIONS,
    }),
    [ROBES]: Object.freeze({
      clips: Object.freeze({
        idle: still('robes/neutral.webp'),
        neutral: still('robes/neutral.webp'),
        blink: still('robes/blink.webp'),
        'talk-a': still('robes/talk-a.webp'),
        'talk-b': still('robes/talk-b.webp'),
        speaking: Object.freeze({
          fps: 4,
          frames: Object.freeze(['robes/talk-a.webp', 'robes/talk-b.webp']),
          reducedMotionClip: 'talk-a',
        }),
        'profile-right': still('robes/profile-right.webp'),
        walking: Object.freeze({
          fps: 6,
          frames: Object.freeze([
            'robes/profile-right.webp',
            'robes/walk-contact.webp',
            'robes/walk-pass.webp',
          ]),
          reducedMotionClip: 'profile-right',
        }),
        'jump-for-joy': held('robes/cheer.webp'),
        giggle: held('robes/cheer.webp'),
        tumble: held('robes/neutral.webp'),
        recovery: held('robes/proud.webp'),
        'wand-hold': still('robes/neutral.webp'),
        'wand-test': Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze([
            'robes/wand-hold.webp',
            'robes/neutral.webp',
            'robes/proud.webp',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        'wand-receive': held('robes/wand-hold.webp'),
        cast: held('robes/cheer.webp'),
        'robe-present': still('robes/robe-present.webp'),
        'wrong-wand-one': Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze([
            'robes/wand-hold.webp',
            'robes/neutral.webp',
            'robes/proud.webp',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        'wrong-wand-two': Object.freeze({
          fps: 4,
          loop: false,
          frames: Object.freeze([
            'robes/wand-hold.webp',
            'robes/neutral.webp',
            'robes/neutral.webp',
            'robes/proud.webp',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        cheer: held('robes/cheer.webp'),
        wonder: still('robes/wonder.webp'),
        proud: still('robes/proud.webp'),
        curious: still('robes/curious.webp'),
      }),
      aliases: COMMON_ALIASES,
      actions: VIOLET_ACTIONS,
    }),
  }),
});

const VIOLET_ASSETS = characterImageAssets('violet', [
  'casual/neutral.webp',
  'casual/blink.webp',
  'casual/talk-a.webp',
  'casual/talk-b.webp',
  'casual/profile-right.webp',
  'casual/walk-contact.webp',
  // Retained as Violet-owned source art even though the current two-frame
  // casual walk does not select it yet.
  'casual/walk-pass.webp',
  'casual/jump.webp',
  'casual/giggle.webp',
  'casual/tumble.webp',
  'casual/wand-hold.webp',
  'casual/cheer.webp',
  'casual/wonder.webp',
  'casual/proud.webp',
  'casual/curious.webp',
  'robes/neutral.webp',
  'robes/blink.webp',
  'robes/talk-a.webp',
  'robes/talk-b.webp',
  'robes/profile-right.webp',
  'robes/walk-contact.webp',
  'robes/walk-pass.webp',
  'robes/cheer.webp',
  'robes/proud.webp',
  'robes/wand-hold.webp',
  'robes/robe-present.webp',
  'robes/wonder.webp',
  'robes/curious.webp',
]);

export const violetCharacterDefinition = defineCharacter({
  id: 'character.violet',
  metadata: {
    displayName: 'Violet',
    kind: 'human',
    voiceRole: 'silent',
  },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: CASUAL, pose: 'idle' },
  capabilities: {
    appearances: [CASUAL, ROBES],
    poses: [
      'idle', 'neutral', 'blink', 'talk-a', 'talk-b', 'speaking', 'profile-right',
      'walking', 'jump-for-joy', 'giggle', 'tumble', 'recovery', 'wand-hold',
      'wand-test', 'wand-receive', 'cast', 'robe-present', 'wrong-wand-one',
      'wrong-wand-two', 'cheer', 'wonder', 'proud', 'curious', 'talk', 'walk', 'jump',
    ],
    actions: Object.keys(VIOLET_ACTIONS),
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: 0, y: 0, width: 896, height: 1132 },
    portrait: { x: 179.2, y: 0, width: 537.6, height: 504 },
  },
  assets: VIOLET_ASSETS,
});

export const violetCharacterReview = defineCharacterReview([
  'character-cast-review',
  'character-portraits-review',
  'violet-expression-review',
  'ui-robe-picker-review',
]);
