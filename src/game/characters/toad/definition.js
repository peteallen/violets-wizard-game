import { defineCharacter } from '../CharacterDefinition.js';
import { defineCharacterReview } from '../packageSupport.js';

export const toadStyle = Object.freeze({
  skinBase: '#71865a', skinMid: '#899d69', skinShadow: '#3f5237', skinDeep: '#2f402c',
  skinLight: '#a9b77d', belly: '#b2aa6a', bellyLight: 'rgba(232, 218, 139, 0.42)',
  eyeWhite: '#eee7c8', iris: '#c3a23e', pupil: '#252018', catchlight: '#fff5c8',
  mouth: '#39452f', rim: 'rgba(255, 229, 164, 0.5)',
});

export const toadPresentation = Object.freeze({
  portrait: Object.freeze({
    y: 48, scale: 1.05, backdrop: Object.freeze(['#34412d', '#71875c']),
  }),
});

export const toadCharacterDefinition = defineCharacter({
  id: 'character.toad',
  metadata: { displayName: 'Toad Companion', kind: 'creature', voiceRole: 'creature' },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: 'pet', pose: 'idle' },
  capabilities: {
    appearances: ['pet'],
    poses: ['idle', 'follow', 'pet-follow'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: -65, y: -75, width: 130, height: 105 },
    portrait: { x: -65, y: -75, width: 130, height: 105 },
  },
  assets: {},
});

export const toadCharacterReview = defineCharacterReview([
  'character-pets-review',
  'character-portraits-review',
]);
