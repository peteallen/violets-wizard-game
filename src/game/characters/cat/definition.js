import { defineCharacter } from '../CharacterDefinition.js';
import { defineCharacterReview } from '../packageSupport.js';

export const catStyle = Object.freeze({
  furBase: '#9d7254', furMid: '#b88963', furShadow: '#65483b', furDeep: '#49352f',
  furLight: '#d2a67d', chest: '#c69a72', muzzle: '#dab38c', ear: '#c98582',
  eyeWhite: '#f6ead7', iris: '#b78f32', pupil: '#251b18', catchlight: '#fff5cf',
  nose: '#815254', collar: '#62516d', brass: '#d8b355', rim: 'rgba(255, 224, 158, 0.5)',
});

export const catPresentation = Object.freeze({
  legacyType: 'cat',
  portraitAliases: Object.freeze(['cat']),
  portrait: Object.freeze({
    y: 78, scale: 0.96, backdrop: Object.freeze(['#49352b', '#b18464']),
  }),
  reviews: Object.freeze({
    pet: Object.freeze({
      order: 0,
      label: 'Cat companion',
      x: 225,
      y: 550,
      plinthY: 610,
      scale: 1.9,
      pose: 'pet-follow',
      timeOffset: 0,
    }),
    portrait: Object.freeze({ order: 6, label: 'Cat', speaker: 'cat' }),
  }),
});

export const catCharacterDefinition = defineCharacter({
  id: 'character.cat',
  metadata: { displayName: 'Cat Companion', kind: 'creature', voiceRole: 'creature' },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: 'pet', pose: 'idle' },
  capabilities: {
    appearances: ['pet'],
    poses: ['idle', 'follow', 'pet-follow', 'paw'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: -75, y: -105, width: 150, height: 135 },
    portrait: { x: -75, y: -105, width: 150, height: 135 },
  },
  assets: {},
});

export const catCharacterReview = defineCharacterReview([
  'character-pets-review',
  'character-portraits-review',
]);
