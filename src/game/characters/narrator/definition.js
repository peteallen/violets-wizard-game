import { defineCharacter } from '../CharacterDefinition.js';
import { defineCharacterReview } from '../packageSupport.js';

export const narratorStyle = Object.freeze({
  page: '#ead7aa',
  pageLine: '#957148',
  ribbon: '#5c4765',
  ribbonLight: '#d8c2e3',
  star: '#e5b74f',
});

export const narratorPresentation = Object.freeze({
  portraitAliases: Object.freeze(['narrator']),
  portrait: Object.freeze({
    backdrop: Object.freeze(['#33283f', '#8d6ca0']),
  }),
  reviews: Object.freeze({
    portrait: Object.freeze({ order: 5, label: 'Narrator', speaker: 'narrator' }),
  }),
});

export const narratorCharacterDefinition = defineCharacter({
  id: 'character.narrator',
  metadata: { displayName: 'Narrator', kind: 'portrait', voiceRole: 'narrator' },
  surfaces: ['portrait'],
  defaults: { appearance: 'default', pose: 'idle' },
  capabilities: {
    appearances: ['default'],
    poses: ['idle', 'speaking'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: { portrait: { x: -50, y: -50, width: 100, height: 100 } },
  assets: {},
});

export const narratorCharacterReview = defineCharacterReview(['character-portraits-review']);
