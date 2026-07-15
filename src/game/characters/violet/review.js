import { defineCharacterReviewDescriptor } from '../CharacterReviewDescriptor.js';
import { traceOrganicPatch } from '../vectorPrimitives.js';
import {
  VIOLET_EXPRESSION_REVIEW_VARIANT,
  violetExpressionReviewDefinition,
} from './expressionReviewDefinition.js';

const EXPRESSIONS = Object.freeze([
  Object.freeze({ id: 'neutral', label: 'Neutral' }),
  Object.freeze({ id: 'blink', label: 'Blink' }),
  Object.freeze({ id: 'talk-a', label: 'Talk A' }),
  Object.freeze({ id: 'talk-b', label: 'Talk B' }),
  Object.freeze({ id: 'wonder', label: 'Wonder' }),
  Object.freeze({ id: 'proud', label: 'Proud' }),
  Object.freeze({ id: 'curious', label: 'Curious' }),
]);

const PORTRAIT_BOUNDS = violetExpressionReviewDefinition.bounds.portrait;
const PORTRAIT_CENTER_X = PORTRAIT_BOUNDS.x + PORTRAIT_BOUNDS.width / 2;
const PORTRAIT_CENTER_Y = PORTRAIT_BOUNDS.y + PORTRAIT_BOUNDS.height / 2;
const PORTRAIT_SCALE = Math.min(
  118 / PORTRAIT_BOUNDS.width,
  136 / PORTRAIT_BOUNDS.height,
);
const CANONICAL_GROUND = violetExpressionReviewDefinition.canvas.ground;
const CANONICAL_SCALE = violetExpressionReviewDefinition.worldHeight
  / violetExpressionReviewDefinition.bounds.world.height;
const WORLD_ALIGNED_SCALE = 0.27;
const WORLD_GROUND_Y = 625;

function requestScale(alignedScale) {
  return alignedScale / CANONICAL_SCALE;
}

function portraitSurround(x, y, index) {
  const turn = index % 2 ? -0.16 : 0.14;
  return Object.freeze({
    beforeDraw(context) {
      context.save();
      context.fillStyle = '#1d192a';
      traceOrganicPatch(context, x, y, 66, 78, turn);
      context.fill();
      context.save();
      traceOrganicPatch(context, x, y, 61, 72, turn);
      context.clip();
      context.fillStyle = index % 2 ? '#5a486b' : '#4d4265';
      context.fillRect(x - 68, y - 80, 136, 160);
    },
    afterDraw(context) {
      context.restore();
      context.strokeStyle = '#d1a85e';
      context.lineWidth = 3;
      traceOrganicPatch(context, x, y, 64, 76, turn);
      context.stroke();
      context.strokeStyle = 'rgba(255, 231, 174, 0.55)';
      context.lineWidth = 1;
      traceOrganicPatch(context, x - 1, y - 1, 59, 70, -turn);
      context.stroke();
      context.restore();
    },
  });
}

function reviewEntry({ id, pose, x, y, scale, shadow, label, surround = null }) {
  return {
    id,
    characterId: 'character.violet',
    surface: 'world',
    state: {
      appearance: 'casual',
      pose,
      x,
      y,
      scale,
      facing: 'right',
      lightSide: 'left',
      shadow,
      reviewVariant: VIOLET_EXPRESSION_REVIEW_VARIANT,
    },
    stateAtTime: null,
    timeOffset: 0,
    inheritReducedMotion: false,
    label,
    surround,
  };
}

const entries = EXPRESSIONS.flatMap(({ id, label }, index) => {
  const x = 95 + index * (1090 / (EXPRESSIONS.length - 1));
  const portraitY = 210;
  return [
    reviewEntry({
      id: `violet.${id}.portrait`,
      pose: id,
      x: x - (PORTRAIT_CENTER_X - CANONICAL_GROUND.x) * PORTRAIT_SCALE,
      y: portraitY - (PORTRAIT_CENTER_Y - CANONICAL_GROUND.y) * PORTRAIT_SCALE,
      scale: requestScale(PORTRAIT_SCALE),
      shadow: false,
      label: null,
      surround: portraitSurround(x, portraitY, index),
    }),
    reviewEntry({
      id: `violet.${id}.world`,
      pose: id,
      x,
      y: WORLD_GROUND_Y,
      scale: requestScale(WORLD_ALIGNED_SCALE),
      shadow: true,
      label: { text: label, x, y: 670, order: 'before', plinth: null },
    }),
  ];
});

export const violetExpressionReviewDescriptor = defineCharacterReviewDescriptor({
  sceneId: 'violet-expression-review',
  title: 'Approved Violet · aligned expressions and portraits',
  characterDependencies: ['character.violet'],
  entries,
});
