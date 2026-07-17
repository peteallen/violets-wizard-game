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
 * Violet's production sheet contract. Each PNG is already aligned to the same
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
        idle: still('casual/neutral.png'),
        neutral: still('casual/neutral.png'),
        blink: still('casual/blink.png'),
        'talk-a': still('casual/talk-a.png'),
        'talk-b': still('casual/talk-b.png'),
        speaking: Object.freeze({
          fps: 4,
          frames: Object.freeze(['casual/talk-a.png', 'casual/talk-b.png']),
          reducedMotionClip: 'talk-a',
        }),
        'profile-right': still('casual/profile-right.png'),
        walking: Object.freeze({
          fps: 4,
          frames: Object.freeze([
            'casual/profile-right.png',
            'casual/walk-contact.png',
          ]),
          reducedMotionClip: 'profile-right',
        }),
        'jump-for-joy': held('casual/jump.png'),
        giggle: held('casual/giggle.png'),
        tumble: held('casual/tumble.png'),
        recovery: Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze(['casual/giggle.png', 'casual/neutral.png']),
          reducedMotionClip: 'idle',
        }),
        'wand-hold': still('casual/neutral.png'),
        'wand-test': Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze([
            'casual/wand-hold.png',
            'casual/tumble.png',
            'casual/giggle.png',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        'wand-receive': held('casual/wand-hold.png'),
        cast: held('casual/cheer.png'),
        'robe-present': held('casual/proud.png'),
        'wrong-wand-one': Object.freeze({
          fps: 1,
          loop: false,
          frames: Object.freeze(['casual/wand-hold.png']),
          reducedMotionClip: 'wand-hold',
        }),
        'wrong-wand-two': Object.freeze({
          fps: 1,
          loop: false,
          frames: Object.freeze(['casual/tumble.png']),
          reducedMotionClip: 'wand-hold',
        }),
        cheer: held('casual/cheer.png'),
        wonder: still('casual/wonder.png'),
        proud: still('casual/proud.png'),
        curious: still('casual/curious.png'),
      }),
      aliases: COMMON_ALIASES,
      actions: VIOLET_ACTIONS,
    }),
    [ROBES]: Object.freeze({
      clips: Object.freeze({
        idle: still('robes/neutral.png'),
        neutral: still('robes/neutral.png'),
        blink: still('robes/blink.png'),
        'talk-a': still('robes/talk-a.png'),
        'talk-b': still('robes/talk-b.png'),
        speaking: Object.freeze({
          fps: 4,
          frames: Object.freeze(['robes/talk-a.png', 'robes/talk-b.png']),
          reducedMotionClip: 'talk-a',
        }),
        'profile-right': still('robes/profile-right.png'),
        walking: Object.freeze({
          fps: 6,
          frames: Object.freeze([
            'robes/profile-right.png',
            'robes/walk-contact.png',
            'robes/walk-pass.png',
          ]),
          reducedMotionClip: 'profile-right',
        }),
        'jump-for-joy': held('robes/cheer.png'),
        giggle: held('robes/cheer.png'),
        tumble: held('robes/neutral.png'),
        recovery: held('robes/proud.png'),
        'wand-hold': still('robes/neutral.png'),
        'wand-test': Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze([
            'robes/wand-hold.png',
            'robes/neutral.png',
            'robes/proud.png',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        'wand-receive': held('robes/wand-hold.png'),
        cast: held('robes/cheer.png'),
        'robe-present': still('robes/robe-present.png'),
        'wrong-wand-one': Object.freeze({
          fps: 3,
          loop: false,
          frames: Object.freeze([
            'robes/wand-hold.png',
            'robes/neutral.png',
            'robes/proud.png',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        'wrong-wand-two': Object.freeze({
          fps: 4,
          loop: false,
          frames: Object.freeze([
            'robes/wand-hold.png',
            'robes/neutral.png',
            'robes/neutral.png',
            'robes/proud.png',
          ]),
          reducedMotionClip: 'wand-hold',
        }),
        cheer: held('robes/cheer.png'),
        wonder: still('robes/wonder.png'),
        proud: still('robes/proud.png'),
        curious: still('robes/curious.png'),
      }),
      aliases: COMMON_ALIASES,
      actions: VIOLET_ACTIONS,
    }),
  }),
});

const VIOLET_ASSETS = characterImageAssets('violet', [
  'casual/neutral.png',
  'casual/blink.png',
  'casual/talk-a.png',
  'casual/talk-b.png',
  'casual/profile-right.png',
  'casual/walk-contact.png',
  // Retained as Violet-owned source art even though the current two-frame
  // casual walk does not select it yet.
  'casual/walk-pass.png',
  'casual/jump.png',
  'casual/giggle.png',
  'casual/tumble.png',
  'casual/wand-hold.png',
  'casual/cheer.png',
  'casual/wonder.png',
  'casual/proud.png',
  'casual/curious.png',
  'robes/neutral.png',
  'robes/blink.png',
  'robes/talk-a.png',
  'robes/talk-b.png',
  'robes/profile-right.png',
  'robes/walk-contact.png',
  'robes/walk-pass.png',
  'robes/cheer.png',
  'robes/proud.png',
  'robes/wand-hold.png',
  'robes/robe-present.png',
  'robes/wonder.png',
  'robes/curious.png',
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
