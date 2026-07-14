import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
  productionFullFrameCharacterRigs,
} from './FullFrameCharacterRig.js';
import { recolorVioletRobeFrame } from './VioletRobeRecolor.js';

const CASUAL = 'casual';
const ROBES = 'robes';

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
  id: 'puppet.violet.full-frame',
  kind: 'violet',
  chapter: 'ch1',
  basePath: 'assets/art/characters/violet',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 235,
  defaultAppearance: CASUAL,
  appearanceAliases: Object.freeze({ robe: ROBES, robed: ROBES }),
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
        // Violet stows her wand while walking and at rest. The painted wand
        // frame is reserved for the three wand-shop moments where the prop is
        // the point of the action.
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

export const violetFullFrameCharacterManifest = createFullFrameCharacterManifest(
  violetFullFrameCharacterDefinition,
);

export const violetFullFrameCharacterRig = new FullFrameCharacterRig(
  violetFullFrameCharacterManifest,
  {
    imageTransform: ({ image, animation, character }) => (
      animation.appearance === ROBES
        ? recolorVioletRobeFrame(image, character.robeTrim ?? '#7a4fc9')
        : image
    ),
  },
);

productionFullFrameCharacterRigs.set('violet', violetFullFrameCharacterRig);
