import { defineCharacter } from '../CharacterDefinition.js';
import { characterImageAssets, defineCharacterReview } from '../packageSupport.js';

const DEFAULT = 'default';

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

const CLIPS = Object.freeze({
  idle: still('default/ambient.webp'),
  'talk-a': still('default/talk-a.webp'),
  'talk-b': still('default/talk-b.webp'),
  speaking: Object.freeze({
    fps: 4,
    frames: Object.freeze(['default/talk-a.webp', 'default/talk-b.webp']),
    reducedMotionClip: 'talk-a',
  }),
  emerge: still('default/emerge.webp'),
  'listening-reward': still('default/listening-reward.webp'),
  delighted: still('default/delighted.webp'),
});

const ALIASES = Object.freeze({
  ambient: 'idle',
  talk: 'speaking',
  'portrait-emerge': 'emerge',
});

const ACTIONS = Object.freeze({ emerge: 'emerge' });

export const friendlyGhostFullFrameCharacterDefinition = Object.freeze({
  id: 'character.friendly-ghost',
  basePath: 'assets/art/characters/friendly-ghost',
  canvas: Object.freeze({
    width: 896,
    height: 1200,
    ground: Object.freeze({ x: 448, y: 1132 }),
  }),
  worldHeight: 205,
  placement: Object.freeze({
    portrait: Object.freeze({ y: 20, scale: 0.24 }),
  }),
  defaultAppearance: DEFAULT,
  appearances: Object.freeze({
    [DEFAULT]: Object.freeze({ clips: CLIPS, aliases: ALIASES, actions: ACTIONS }),
  }),
});

export const friendlyGhostCharacterDefinition = defineCharacter({
  id: 'character.friendly-ghost',
  metadata: {
    displayName: 'Friendly Ghost',
    kind: 'ghost',
    voiceRole: 'friendly-bookish-ghost',
  },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: DEFAULT, pose: 'ambient' },
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
  assets: characterImageAssets('friendly-ghost', [
    'default/ambient.webp',
    'default/talk-a.webp',
    'default/talk-b.webp',
    'default/emerge.webp',
    'default/listening-reward.webp',
    'default/delighted.webp',
  ]),
});

export const friendlyGhostCharacterReview = defineCharacterReview([
  'friendly-ghost-sprite-review',
]);
