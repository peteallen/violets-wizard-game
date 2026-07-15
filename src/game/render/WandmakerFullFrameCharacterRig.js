import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
  productionFullFrameCharacterRigs,
} from './FullFrameCharacterRig.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const WANDMAKER_ALIASES = Object.freeze({
  talk: 'speaking',
});

/**
 * The Wandmaker's first production contract deliberately covers only the
 * poses used while he stands behind his counter and speaks. Each source is a
 * complete aligned painting; unsupported movement and set-piece cues remain
 * visible contract errors until reviewed art exists for them.
 */
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
  // This preserves the current small, slight shopkeeper read in the room.
  worldHeight: 215,
  // The ordinary portrait call already lifts a non-Hagrid figure to y=116.
  // A small source-space nudge keeps the Wandmaker's high wispy hair inside
  // the cameo while centering his eyes; live capture will tune this value.
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

export const wandmakerFullFrameCharacterManifest = createFullFrameCharacterManifest(
  wandmakerFullFrameCharacterDefinition,
);

export const wandmakerFullFrameCharacterRig = new FullFrameCharacterRig(
  wandmakerFullFrameCharacterManifest,
);

productionFullFrameCharacterRigs.set('wandmaker', wandmakerFullFrameCharacterRig);
