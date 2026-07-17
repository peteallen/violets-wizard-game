import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const WORLD_ENTRIES = Object.freeze([
  { id: 'idle', label: 'Idle', pose: 'idle' },
  { id: 'speaking', label: 'Speaking', pose: 'speaking' },
  { id: 'tearful', label: 'Worried', pose: 'tearful-but-not-panicked' },
  { id: 'relieved', label: 'Relieved', pose: 'relieved' },
  { id: 'reunion', label: 'Reunion', pose: 'idle', action: 'reunion' },
  { id: 'hugging', label: 'Trevor hold', pose: 'hugging-trevor' },
]);

const PORTRAITS = Object.freeze([
  { id: 'portrait-idle', label: 'Portrait idle', pose: 'idle', x: 320 },
  { id: 'portrait-talk', label: 'Portrait talk', pose: 'speaking', x: 640 },
  { id: 'portrait-worried', label: 'Portrait worried', pose: 'tearful', x: 960 },
]);

function entry({ id, label, pose, action = null }, index) {
  const x = 105 + index * 214;
  return {
    id: `neville.${id}`,
    characterId: 'character.neville',
    surface: 'world',
    state: {
      x,
      y: 600,
      scale: 0.98,
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

export const nevilleSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'neville-sprite-review',
  title: 'Neville · emotional readability and dialogue portraits',
  characterDependencies: ['character.neville'],
  entries: [
    ...PORTRAITS.map(({ id, label, pose, x }, index) => ({
      id: `neville.${id}`,
      characterId: 'character.neville',
      surface: 'portrait',
      state: { x, y: 215, scale: 1.08, pose },
      stateAtTime: null,
      timeOffset: index * 0.2,
      inheritReducedMotion: true,
      label: { text: label, x, y: 330, order: 'after', plinth: null },
      surround: null,
    })),
    ...WORLD_ENTRIES.map(entry),
  ],
});
