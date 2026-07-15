import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';

const ROWS = Object.freeze([
  {
    characterId: 'character.post-owl', appearance: 'post', poses: ['perch', 'takeoff', 'delivery', 'flight', 'settle'],
    left: 150, right: 1130, owlY: 337, plinthY: 382, scale: 0.84,
  },
  {
    characterId: 'character.pet-owl', appearance: 'pet', poses: ['idle', 'perch', 'pet-follow'],
    left: 290, right: 990, owlY: 552, plinthY: 607, scale: 0.94,
  },
]);

const entries = ROWS.flatMap((row, rowIndex) => row.poses.map((pose, index) => {
  const progress = row.poses.length === 1 ? 0.5 : index / (row.poses.length - 1);
  const x = row.left + (row.right - row.left) * progress;
  const airborne = pose === 'delivery' || pose === 'flight';
  const variant = row.appearance;
  return {
    id: `owl-motion.${variant}.${pose}`,
    characterId: row.characterId,
    surface: 'world',
    state: {
      appearance: row.appearance,
      pose,
      x,
      y: airborne ? row.owlY - 32 : row.owlY,
      scale: row.scale,
      lookX: progress * 1.6 - 0.8,
      lookY: index % 2 ? -0.2 : 0.16,
      phase: rowIndex * 0.43 + index * 0.31,
    },
    stateAtTime: null,
    timeOffset: 0,
    inheritReducedMotion: true,
    label: {
      text: `${variant} · ${pose.replace('-', ' ')}`,
      x,
      y: row.plinthY + 35,
      order: 'before',
      plinth: { x, y: row.plinthY },
    },
    surround: null,
  };
}));

export const owlMotionReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'owl-motion-review',
  title: 'Hero owl · pose and motion library',
  characterDependencies: ['character.post-owl', 'character.pet-owl'],
  entries,
});
