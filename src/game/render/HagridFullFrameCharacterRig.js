import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
  productionFullFrameCharacterRigs,
} from './FullFrameCharacterRig.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const HAGRID_ALIASES = Object.freeze({
  talk: 'speaking',
  walk: 'walking',
});

/**
 * Hagrid's production animation contract. Each source is one complete,
 * aligned painting, so turning left mirrors his entire pose as a unit. Hands
 * and limbs are never loaded, assembled, or mirrored independently.
 */
export const hagridFullFrameCharacterDefinition = Object.freeze({
  id: 'puppet.hagrid.full-frame',
  kind: 'guide',
  chapter: 'ch1',
  basePath: 'assets/art/characters/hagrid',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  // This matches the roughly 298-pixel legacy half-giant while preserving
  // the room-authored door and dialogue compositions.
  worldHeight: 295,
  // The dialogue cameo clips around its local origin. Lift Hagrid's aligned
  // ground anchor within that surface so his face, not his waistcoat, owns the
  // portrait frame.
  placement: Object.freeze({
    portrait: Object.freeze({ y: 58 }),
  }),
  bounds: Object.freeze({
    // Hagrid's broad boots need a figure-width floor shadow. The default
    // full-frame oval is Violet-sized and disappeared against rugs and dark
    // floorboards during walking review.
    shadow: Object.freeze({ x: 110, y: 1100, width: 676, height: 64 }),
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
        'profile-right': still('default/profile-right.png'),
        walking: Object.freeze({
          fps: 4,
          frames: Object.freeze([
            'default/profile-right.png',
            'default/walk-contact.png',
          ]),
          reducedMotionClip: 'profile-right',
        }),
      }),
      aliases: HAGRID_ALIASES,
    }),
  }),
});

export const hagridFullFrameCharacterManifest = createFullFrameCharacterManifest(
  hagridFullFrameCharacterDefinition,
);

export const hagridFullFrameCharacterRig = new FullFrameCharacterRig(
  hagridFullFrameCharacterManifest,
  { shadowOpacity: 0.34 },
);

productionFullFrameCharacterRigs.set('guide', hagridFullFrameCharacterRig);
