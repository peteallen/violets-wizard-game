import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
  productionFullFrameCharacterRigs,
} from './FullFrameCharacterRig.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const MADAM_MALKIN_ALIASES = Object.freeze({
  talk: 'speaking',
});

/**
 * Madam Malkin's current Chapter One contract covers the states normal robe-
 * shop play actually requests: a planted shop-floor idle, automatic blink,
 * and two speaking mouths shared by her world figure and dialogue portrait.
 * Every source is one complete aligned painting; unsupported future movement
 * and fitting actions remain visible contract errors until gameplay uses them.
 */
export const madamMalkinFullFrameCharacterDefinition = Object.freeze({
  id: 'puppet.madam-malkin.full-frame',
  kind: 'tailor',
  chapter: 'ch1',
  basePath: 'assets/art/characters/madam-malkin',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  // Preserve the robe shop's compact, motherly silhouette while keeping her
  // face and apron tools legible beside Violet at ordinary room scale.
  worldHeight: 225,
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
      aliases: MADAM_MALKIN_ALIASES,
    }),
  }),
});

export const madamMalkinFullFrameCharacterManifest = createFullFrameCharacterManifest(
  madamMalkinFullFrameCharacterDefinition,
);

export const madamMalkinFullFrameCharacterRig = new FullFrameCharacterRig(
  madamMalkinFullFrameCharacterManifest,
);

productionFullFrameCharacterRigs.set('tailor', madamMalkinFullFrameCharacterRig);
