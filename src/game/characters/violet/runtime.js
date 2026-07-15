import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { violetFullFrameCharacterDefinition } from './definition.js';
import { VIOLET_EXPRESSION_REVIEW_VARIANT } from './expressionReviewDefinition.js';
import { recolorVioletRobeFrame } from './robeRecolor.js';

export { violetFullFrameCharacterDefinition } from './definition.js';

export const violetFullFrameCharacterManifest = createFullFrameCharacterManifest(
  violetFullFrameCharacterDefinition,
);

export const violetFullFrameCharacterRig = new FullFrameCharacterRig(
  violetFullFrameCharacterManifest,
  {
    imageTransform: ({ image, animation, character }) => (
      animation.appearance === 'robes'
        ? recolorVioletRobeFrame(image, character.robeTrim ?? '#7a4fc9')
        : image
    ),
  },
);

export const violetPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#302642', light: '#8b63aa' },
  figure: { x: 0, y: 118, scale: 0.82 },
});

const violetFullFrameRuntime = createFullFrameCharacterRuntime(
  violetFullFrameCharacterRig,
);

let expressionReviewRuntime = null;

async function preloadViolet(request = {}) {
  const loading = [violetFullFrameRuntime.preload(request)];
  if (
    request.context?.review === true
    && request.context?.sceneId === 'violet-expression-review'
  ) {
    const reviewModule = await import('./expressionReviewRuntime.js');
    expressionReviewRuntime = reviewModule.violetExpressionReviewRuntime;
    loading.push(expressionReviewRuntime.preload(request));
  }
  await Promise.all(loading);
}

function releaseViolet(request) {
  const releasing = [violetFullFrameRuntime.release(request)];
  if (expressionReviewRuntime) releasing.push(expressionReviewRuntime.release(request));
  expressionReviewRuntime = null;
  return Promise.all(releasing);
}

function drawVioletWorld(request) {
  if (request.reviewVariant !== VIOLET_EXPRESSION_REVIEW_VARIANT) {
    return violetFullFrameRuntime.renderers.world(request);
  }
  if (!expressionReviewRuntime) {
    throw new Error('Violet expression review runtime must be preloaded before rendering.');
  }
  const { reviewVariant: _reviewVariant, ...reviewRequest } = request;
  return expressionReviewRuntime.renderers.world(reviewRequest);
}

const drawVioletPortrait = createCharacterPortraitRenderer({
  presentation: violetPortraitPresentation,
  drawFigure: violetFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const {
      appearance,
      pose = 'speaking',
      robeTrim = '#7a4fc9',
      wand,
      ...rest
    } = state;
    return {
      ...rest,
      appearance: appearance ?? 'robes',
      pose: pose === 'talk' ? 'speaking' : pose,
      robeTrim,
      wand: Boolean(wand),
    };
  },
});

export const violetCharacterRuntime = Object.freeze({
  preload: preloadViolet,
  release: releaseViolet,
  renderers: Object.freeze({
    world: drawVioletWorld,
    portrait: drawVioletPortrait,
  }),
});
