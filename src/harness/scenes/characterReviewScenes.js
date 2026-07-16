import { defineCharacterReviewDescriptor } from '../../game/characters/CharacterReviewDescriptor.js';

function label(text, x, y, { order = 'before', plinth = null } = {}) {
  return { text, x, y, order, plinth };
}

function entry({
  id,
  characterId,
  surface = 'world',
  state,
  stateAtTime = null,
  timeOffset = 0,
  inheritReducedMotion = false,
  entryLabel = null,
}) {
  return {
    id,
    characterId,
    surface,
    state,
    stateAtTime,
    timeOffset,
    inheritReducedMotion,
    label: entryLabel,
    surround: null,
  };
}

const CAST = Object.freeze([
  {
    id: 'cast.violet', characterId: 'character.violet', label: 'Violet', x: 126,
    state: { x: 126, y: 595, scale: 1, appearance: 'casual', wand: true, robeTrim: '#7952b7', pose: 'speaking' },
  },
  {
    id: 'cast.hagrid', characterId: 'character.hagrid', label: 'Hagrid', x: 365,
    state: { x: 365, y: 595, scale: 1.18, pose: 'speaking' },
  },
  {
    id: 'cast.wandmaker', characterId: 'character.wandmaker', label: 'Wandmaker', x: 625,
    state: { x: 625, y: 595, scale: 1.05, pose: 'speaking' },
  },
  {
    id: 'cast.madam-malkin', characterId: 'character.madam-malkin', label: 'Tailor', x: 855,
    state: { x: 855, y: 595, scale: 1.05, pose: 'speaking' },
  },
  {
    id: 'cast.menagerie-keeper', characterId: 'character.menagerie-keeper', label: 'Keeper', x: 1085,
    state: { x: 1085, y: 595, scale: 1.05, pose: 'speaking' },
  },
]);

export const characterCastReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'character-cast-review',
  title: 'Illustrated cast · gameplay scale',
  characterDependencies: CAST.map(({ characterId }) => characterId),
  entries: CAST.map((item) => entry({
    id: item.id,
    characterId: item.characterId,
    state: item.state,
    timeOffset: item.x * 0.001,
    entryLabel: label(item.label, item.x, 660, {
      plinth: { x: item.x, y: 625 },
    }),
  })),
});

export const characterPetsReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'character-pets-review',
  title: 'Companions · follow animation and material detail',
  characterDependencies: ['character.cat', 'character.pet-owl', 'character.toad'],
  entries: [
    entry({
      id: 'pets.cat',
      characterId: 'character.cat',
      state: { x: 225, y: 550, scale: 1.9, pose: 'pet-follow' },
      inheritReducedMotion: true,
      entryLabel: label('Cat companion', 225, 645, { plinth: { x: 225, y: 610 } }),
    }),
    entry({
      id: 'pets.owl',
      characterId: 'character.pet-owl',
      state: {
        appearance: 'pet', x: 640, y: 554, scale: 1.62, pose: 'pet-follow', lookY: -0.15,
      },
      stateAtTime: ({ baseTime }) => ({ lookX: Math.sin(baseTime * 0.7) * 0.8 }),
      timeOffset: 0.35,
      inheritReducedMotion: true,
      entryLabel: label('Owl companion', 640, 645, { plinth: { x: 640, y: 610 } }),
    }),
    entry({
      id: 'pets.toad',
      characterId: 'character.toad',
      state: { x: 1055, y: 570, scale: 2.05, pose: 'pet-follow' },
      timeOffset: 0.7,
      inheritReducedMotion: true,
      entryLabel: label('Toad companion', 1055, 645, { plinth: { x: 1055, y: 610 } }),
    }),
  ],
});

const PORTRAITS = Object.freeze([
  ['Violet', 'character.violet', { pose: 'speaking', appearance: 'robes' }],
  ['Hagrid', 'character.hagrid', { pose: 'speaking' }],
  ['Wandmaker', 'character.wandmaker', { pose: 'speaking' }],
  ['Tailor', 'character.madam-malkin', { pose: 'speaking' }],
  ['Keeper', 'character.menagerie-keeper', { pose: 'speaking' }],
  ['Narrator', 'character.narrator', { pose: 'speaking' }],
  ['Cat', 'character.cat', { pose: 'idle' }],
  ['Owl', 'character.pet-owl', { pose: 'idle' }],
  ['Toad', 'character.toad', { pose: 'idle' }],
]);

export const characterPortraitsReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'character-portraits-review',
  title: 'Dialogue cameos · one shared puppet family',
  characterDependencies: PORTRAITS.map(([, characterId]) => characterId),
  entries: PORTRAITS.map(([portraitLabel, characterId, state], index) => {
    const x = 140 + (index % 5) * 250;
    const y = 265 + Math.floor(index / 5) * 260;
    return entry({
      id: `portraits.${characterId.slice('character.'.length)}`,
      characterId,
      surface: 'portrait',
      state: { ...state, x, y, scale: 1.38 },
      timeOffset: index * 0.29,
      entryLabel: label(portraitLabel, x, y + 100, { order: 'after' }),
    });
  }),
});

export const sharedCharacterReviewDescriptors = Object.freeze([
  characterCastReviewDescriptor,
  characterPetsReviewDescriptor,
  characterPortraitsReviewDescriptor,
]);
