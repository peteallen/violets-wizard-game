import { defineCharacter } from '../CharacterDefinition.js';
import { defineCharacterReview } from '../packageSupport.js';

export const menagerieKeeperStyle = Object.freeze({
  coatBase: '#496653',
  coatMid: '#607b65',
  coatShadow: '#30483b',
  coatLight: 'rgba(204, 220, 184, 0.2)',
  apronBase: '#8c6344',
  apronMid: '#aa7950',
  apronShadow: '#5d412f',
  apronLight: 'rgba(236, 199, 145, 0.24)',
  pouchBase: '#765139',
  pouchShadow: '#4d3529',
  pouchLight: '#ae7d51',
  gauntletBase: '#79583f',
  gauntletShadow: '#513a2e',
  gauntletLight: '#aa8158',
  brushWood: '#6d4933',
  brushLight: '#b78355',
  bristle: '#d4bc91',
  bristleShadow: '#9b805f',
  featherBase: '#71858a',
  featherLight: '#aac0b8',
  hairBase: '#a9633a',
  hairMid: '#c5804d',
  hairShadow: '#6e402f',
  hairLight: '#e1a36c',
  skin: '#ca906d',
  skinShadow: '#9d6254',
  skinLight: 'rgba(255, 222, 177, 0.28)',
  cheek: 'rgba(180, 77, 76, 0.24)',
  iris: '#5b5638',
  shoe: '#3d342f',
  rim: 'rgba(255, 222, 154, 0.47)',
});

export const menagerieKeeperPresentation = Object.freeze({
  legacyKind: 'keeper',
  portraitAliases: Object.freeze(['keeper', 'menagerie']),
  world: Object.freeze({ scaleMultiplier: 1.04, phase: 2.22 }),
  portrait: Object.freeze({
    y: 116,
    scale: 0.84,
    backdrop: Object.freeze(['#2f4939', '#66856d']),
  }),
  reviews: Object.freeze({
    cast: Object.freeze({
      order: 4, label: 'Keeper', x: 1085, y: 595, scale: 1.05, pose: 'proud',
    }),
    portrait: Object.freeze({ order: 4, label: 'Keeper', speaker: 'keeper' }),
  }),
});

export const menagerieKeeperCharacterDefinition = defineCharacter({
  id: 'character.menagerie-keeper',
  metadata: { displayName: 'Menagerie Keeper', kind: 'human', voiceRole: 'keeper' },
  surfaces: ['world', 'portrait'],
  defaults: { appearance: 'default', pose: 'idle' },
  capabilities: {
    appearances: ['default'],
    poses: ['idle', 'walking', 'speaking', 'talk', 'proud'],
    actions: [],
    supportsReducedMotion: true,
  },
  bounds: {
    world: { x: -65, y: -195, width: 130, height: 225 },
    portrait: { x: -65, y: -195, width: 130, height: 225 },
  },
  assets: {},
});

export const menagerieKeeperCharacterReview = defineCharacterReview([
  'character-cast-review',
  'character-portraits-review',
]);
