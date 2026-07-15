import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const ROWS = Object.freeze([
  { id: 'hagrid.neutral', label: 'Neutral', x: 130, pose: 'idle', facing: 'right' },
  { id: 'hagrid.blink', label: 'Blink', x: 385, pose: 'blink', facing: 'right' },
  { id: 'hagrid.speaking', label: 'Speaking', x: 640, pose: 'speaking', facing: 'right' },
  { id: 'hagrid.walk-right', label: 'Walk right', x: 895, pose: 'walking', facing: 'right' },
  { id: 'hagrid.walk-left', label: 'Walk left', x: 1150, pose: 'walking', facing: 'left' },
]);

export const hagridSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'hagrid-sprite-review',
  title: 'Hagrid · aligned production poses',
  characterDependencies: ['character.hagrid'],
  entries: ROWS.map((row) => ({
    id: row.id,
    characterId: 'character.hagrid',
    surface: 'world',
    state: { x: row.x, y: 595, scale: 1, pose: row.pose, facing: row.facing },
    stateAtTime: null,
    timeOffset: row.x * 0.001,
    inheritReducedMotion: false,
    label: { text: row.label, x: row.x, y: 660, order: 'before', plinth: null },
    surround: null,
  })),
});
