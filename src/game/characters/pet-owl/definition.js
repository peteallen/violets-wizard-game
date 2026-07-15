import { defineCharacter } from '../CharacterDefinition.js';
import { defineCharacterReview } from '../packageSupport.js';

export const petOwlCharacterDefinition = defineCharacter({
  id: 'character.pet-owl',
  metadata: {
    displayName: 'Owl Companion',
    kind: 'creature',
    voiceRole: 'creature',
  },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: 'pet', pose: 'idle' },
  capabilities: {
    appearances: ['pet'],
    poses: ['idle', 'perch', 'pet-follow'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: -80, y: -135, width: 160, height: 155 },
    portrait: { x: -80, y: -135, width: 160, height: 155 },
  },
  // This identity is drawn from vectors and owns no decoded runtime assets.
  assets: {},
});

export const petOwlCharacterReview = defineCharacterReview([
  'character-pets-review',
  'character-portraits-review',
  'owl-motion-review',
]);
