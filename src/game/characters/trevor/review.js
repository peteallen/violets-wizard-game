import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const WORLD_ENTRIES = Object.freeze([
  { id: 'idle', label: 'Idle', pose: 'idle' },
  { id: 'hidden', label: 'Hidden eyes', pose: 'hidden-eyes' },
  { id: 'croak', label: 'Croak', pose: 'idle', action: 'croak' },
  { id: 'hop', label: 'Hop', pose: 'idle', action: 'hop' },
  { id: 'held', label: 'Held', pose: 'idle', action: 'held' },
  { id: 'reunion', label: 'Reunion', pose: 'idle', action: 'reunion' },
]);

function entry({ id, label, pose, action = null }, index) {
  const x = 105 + index * 214;
  return {
    id: `trevor.${id}`,
    characterId: 'character.trevor',
    surface: 'world',
    state: {
      x,
      y: 600,
      scale: 2.05,
      pose,
      facing: 'right',
      ...(action ? { action, actionProgress: 1 } : {}),
    },
    stateAtTime: null,
    timeOffset: index * 0.13,
    inheritReducedMotion: true,
    label: { text: label, x, y: 666, order: 'before', plinth: { x, y: 630 } },
    surround: null,
  };
}

export const trevorSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'trevor-sprite-review',
  title: 'Trevor · corridor reveal, movement, and dialogue portrait',
  characterDependencies: ['character.trevor'],
  entries: [
    {
      id: 'trevor.portrait-idle',
      characterId: 'character.trevor',
      surface: 'portrait',
      state: { x: 430, y: 215, scale: 1.08, pose: 'idle' },
      stateAtTime: null,
      timeOffset: 0,
      inheritReducedMotion: true,
      label: { text: 'Portrait idle', x: 430, y: 330, order: 'after', plinth: null },
      surround: null,
    },
    {
      id: 'trevor.portrait-croak',
      characterId: 'character.trevor',
      surface: 'portrait',
      state: { x: 850, y: 215, scale: 1.08, pose: 'speaking' },
      stateAtTime: null,
      timeOffset: 0.2,
      inheritReducedMotion: true,
      label: { text: 'Portrait croak', x: 850, y: 330, order: 'after', plinth: null },
      surround: null,
    },
    ...WORLD_ENTRIES.map(entry),
  ],
});
