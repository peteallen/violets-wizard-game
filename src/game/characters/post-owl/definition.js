import { defineCharacter } from '../CharacterDefinition.js';
import { defineCharacterReview } from '../packageSupport.js';

export const postOwlCharacterDefinition = defineCharacter({
  id: 'character.post-owl',
  metadata: {
    displayName: 'Post Owl',
    kind: 'creature',
    voiceRole: 'creature',
  },
  surfaces: ['world'],
  defaults: { appearance: 'post', pose: 'perch' },
  capabilities: {
    appearances: ['post'],
    poses: ['perch', 'takeoff', 'delivery', 'flight', 'settle'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: -120, y: -155, width: 240, height: 175 },
  },
  // This identity is drawn from vectors and owns no decoded runtime assets.
  assets: {},
});

export const postOwlCharacterReview = defineCharacterReview([
  'owl-motion-review',
]);
