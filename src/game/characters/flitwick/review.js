import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const WORLD_ENTRIES = Object.freeze([
  { id: 'idle', label: 'Idle', pose: 'idle' },
  { id: 'speaking', label: 'Speaking', pose: 'speaking' },
  { id: 'demonstrate', label: 'Demonstrate', pose: 'idle', action: 'demonstrate' },
  { id: 'wand-cast', label: 'Wand cast', pose: 'idle', action: 'wand-cast' },
  { id: 'celebrate', label: 'Celebrate', pose: 'idle', action: 'celebrate' },
  { id: 'delighted', label: 'Delighted', pose: 'delighted' },
]);

const PORTRAITS = Object.freeze([
  { id: 'portrait-idle', label: 'Portrait idle', pose: 'idle', x: 320 },
  { id: 'portrait-talk', label: 'Portrait talk', pose: 'speaking', x: 640 },
  { id: 'portrait-delight', label: 'Portrait delight', pose: 'delighted', x: 960 },
]);

function entry({ id, label, pose, action = null }, index) {
  const x = 105 + index * 214;
  return {
    id: `flitwick.${id}`,
    characterId: 'character.flitwick',
    surface: 'world',
    state: {
      x,
      y: 600,
      scale: 1.18,
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

export const flitwickSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'flitwick-sprite-review',
  title: 'Professor Flitwick · gameplay actions and dialogue portraits',
  characterDependencies: ['character.flitwick'],
  entries: [
    ...PORTRAITS.map(({ id, label, pose, x }, index) => ({
      id: `flitwick.${id}`,
      characterId: 'character.flitwick',
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
