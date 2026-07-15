import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const ROWS = Object.freeze([
  { id: 'madam-malkin.neutral', label: 'Neutral', x: 190, pose: 'neutral' },
  { id: 'madam-malkin.blink', label: 'Blink', x: 490, pose: 'blink' },
  { id: 'madam-malkin.talk-a', label: 'Talk A', x: 790, pose: 'talk-a' },
  { id: 'madam-malkin.talk-b', label: 'Talk B', x: 1090, pose: 'talk-b' },
]);

export const madamMalkinSpriteReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'madam-malkin-sprite-review',
  title: 'Madam Malkin · aligned production expressions',
  characterDependencies: ['character.madam-malkin'],
  entries: ROWS.map((row) => ({
    id: row.id,
    characterId: 'character.madam-malkin',
    surface: 'world',
    state: { x: row.x, y: 595, scale: 1, pose: row.pose, facing: 'right', shadow: true },
    stateAtTime: null,
    timeOffset: row.x * 0.001,
    inheritReducedMotion: false,
    label: { text: row.label, x: row.x, y: 660, order: 'before', plinth: null },
    surround: null,
  })),
});
