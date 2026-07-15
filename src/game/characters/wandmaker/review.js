import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const ROWS = Object.freeze([
  { id: 'wandmaker.neutral', label: 'Neutral', x: 190, pose: 'neutral' },
  { id: 'wandmaker.blink', label: 'Blink', x: 490, pose: 'blink' },
  { id: 'wandmaker.talk-a', label: 'Talk A', x: 790, pose: 'talk-a' },
  { id: 'wandmaker.talk-b', label: 'Talk B', x: 1090, pose: 'talk-b' },
]);

export const wandmakerSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'wandmaker-sprite-review',
  title: 'Wandmaker · aligned production expressions',
  characterDependencies: ['character.wandmaker'],
  entries: ROWS.map((row) => ({
    id: row.id,
    characterId: 'character.wandmaker',
    surface: 'world',
    state: { x: row.x, y: 595, scale: 1, pose: row.pose, facing: 'right', shadow: true },
    stateAtTime: null,
    timeOffset: row.x * 0.001,
    inheritReducedMotion: false,
    label: { text: row.label, x: row.x, y: 660, order: 'before', plinth: null },
    surround: null,
  })),
});
