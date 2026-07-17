import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const WORLD_ENTRIES = Object.freeze([
  { id: 'ambient', label: 'Ambient', pose: 'ambient' },
  { id: 'speaking', label: 'Speaking', pose: 'speaking' },
  { id: 'emerge', label: 'Emerge', pose: 'ambient', action: 'emerge' },
  { id: 'portrait-emerge', label: 'Portrait rise', pose: 'portrait-emerge' },
  { id: 'reward', label: 'Listening gift', pose: 'listening-reward' },
  { id: 'delighted', label: 'Delighted', pose: 'delighted' },
]);

const PORTRAITS = Object.freeze([
  { id: 'portrait-idle', label: 'Portrait idle', pose: 'ambient', x: 320 },
  { id: 'portrait-talk', label: 'Portrait talk', pose: 'speaking', x: 640 },
  { id: 'portrait-reward', label: 'Portrait reward', pose: 'listening-reward', x: 960 },
]);

function entry({ id, label, pose, action = null }, index) {
  const x = 105 + index * 214;
  return {
    id: `friendly-ghost.${id}`,
    characterId: 'character.friendly-ghost',
    surface: 'world',
    state: {
      x,
      y: 600,
      scale: 1,
      pose,
      facing: 'right',
      shadow: false,
      ...(action ? { action, actionProgress: 1 } : {}),
    },
    stateAtTime: null,
    timeOffset: index * 0.13,
    inheritReducedMotion: true,
    label: { text: label, x, y: 666, order: 'before', plinth: { x, y: 630 } },
    surround: null,
  };
}

export const friendlyGhostSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'friendly-ghost-sprite-review',
  title: 'Friendly Ghost · portrait emergence and warm dialogue',
  characterDependencies: ['character.friendly-ghost'],
  entries: [
    ...PORTRAITS.map(({ id, label, pose, x }, index) => ({
      id: `friendly-ghost.${id}`,
      characterId: 'character.friendly-ghost',
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
