import { defineCharacter } from '../CharacterDefinition.js';
import { characterImageAssets, defineCharacterReview } from '../packageSupport.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const CLIPS = Object.freeze({
  idle: still('default/neutral.webp'),
  neutral: still('default/neutral.webp'),
  'hidden-eyes': still('default/hidden-eyes.webp'),
  croak: still('default/croak.webp'),
  speaking: Object.freeze({
    fps: 2,
    frames: Object.freeze(['default/croak.webp', 'default/neutral.webp']),
    reducedMotionClip: 'croak',
  }),
  hop: still('default/hop.webp'),
  held: still('default/held.webp'),
  reunion: still('default/reunion.webp'),
});

const ALIASES = Object.freeze({
  talk: 'speaking',
  revealed: 'neutral',
});

const ACTIONS = Object.freeze({
  revealed: 'neutral',
  hop: 'hop',
  croak: 'croak',
  held: 'held',
  reunion: 'reunion',
});

export const trevorFullFrameCharacterDefinition = Object.freeze({
  id: 'character.trevor',
  basePath: 'assets/art/characters/trevor',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 82,
  placement: Object.freeze({
    portrait: Object.freeze({ y: 46, scale: 0.22 }),
  }),
  defaultAppearance: DEFAULT,
  appearances: Object.freeze({
    [DEFAULT]: Object.freeze({ clips: CLIPS, aliases: ALIASES, actions: ACTIONS }),
  }),
});

export const trevorCharacterDefinition = defineCharacter({
  id: 'character.trevor',
  metadata: {
    displayName: 'Trevor',
    kind: 'creature',
    voiceRole: 'creature',
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
    portrait: { x: 89.6, y: 230, width: 716.8, height: 680 },
  },
  assets: characterImageAssets('trevor', [
    'default/neutral.webp',
    'default/hidden-eyes.webp',
    'default/croak.webp',
    'default/hop.webp',
    'default/held.webp',
    'default/reunion.webp',
  ]),
});

export const trevorCharacterReview = defineCharacterReview([
  'trevor-sprite-review',
]);
