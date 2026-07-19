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
import { recolorVioletRobeFrame } from './robeRecolor.js';

export { violetFullFrameCharacterDefinition } from './definition.js';

// Keep this review-only discriminator local. Importing its descriptor here lets
// Rollup connect Violet's production title runtime to the harness entry, whose
// top-level boot intentionally waits for a complete deterministic review scene.
const VIOLET_EXPRESSION_REVIEW_VARIANT = 'approved-expression-alignment';

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

const GRYFFINDOR_SCARF = Object.freeze({
  scarlet: '#8f2638',
  shadow: '#5b1c2b',
  gold: '#d8ac45',
  ink: '#43212c',
});

const FRONT_SCARF = Object.freeze({
  band: Object.freeze({ left: 354, top: 370, centerX: 448, pointY: 466, right: 542 }),
  tail: Object.freeze({ left: 421, top: 430, right: 478, bottom: 604, kick: 14 }),
});

const PROFILE_SCARF = Object.freeze({
  band: Object.freeze({ left: 344, top: 376, centerX: 470, pointY: 474, right: 564 }),
  tail: Object.freeze({ left: 500, top: 425, right: 553, bottom: 610, kick: 12 }),
});

function scarfLayout(animation) {
  return animation?.semantic === 'walking' || animation?.semantic === 'profile-right'
    ? PROFILE_SCARF
    : FRONT_SCARF;
}

function drawScarf(context, { band, tail }) {
  context.fillStyle = GRYFFINDOR_SCARF.shadow;
  context.beginPath();
  context.moveTo(tail.left + 8, tail.top + 10);
  context.lineTo(tail.right + 9, tail.top + 3);
  context.lineTo(tail.right + tail.kick + 10, tail.bottom + 9);
  context.lineTo(tail.left + tail.kick + 8, tail.bottom + 1);
  context.closePath();
  context.fill();

  context.lineJoin = 'round';
  context.fillStyle = GRYFFINDOR_SCARF.scarlet;
  context.strokeStyle = GRYFFINDOR_SCARF.ink;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(tail.left, tail.top);
  context.bezierCurveTo(
    tail.left + 14,
    tail.top + 18,
    tail.right - 12,
    tail.top + 17,
    tail.right,
    tail.top,
  );
  context.lineTo(tail.right + tail.kick, tail.bottom);
  context.lineTo((tail.left + tail.right) / 2 + tail.kick, tail.bottom - 18);
  context.lineTo(tail.left + tail.kick, tail.bottom);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(band.left, band.top);
  context.quadraticCurveTo(band.centerX, band.pointY, band.right, band.top);
  context.lineTo(band.right - 18, band.top + 47);
  context.quadraticCurveTo(band.centerX, band.pointY + 28, band.left + 18, band.top + 47);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = GRYFFINDOR_SCARF.gold;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(band.left + 10, band.top + 11);
  context.quadraticCurveTo(band.centerX, band.pointY + 4, band.right - 10, band.top + 11);
  context.stroke();

  for (const offset of [64, 118]) {
    context.beginPath();
    context.moveTo(tail.left + 5, tail.top + offset);
    context.lineTo(tail.right + tail.kick - 3, tail.top + offset + 4);
    context.stroke();
  }
}

/**
 * Adds Violet's saved Gryffindor identity without baking a second copy of
 * every aligned character frame. The scarf follows the exact transform used
 * by the full-frame rig, so it remains attached during mirroring and motion.
 */
function drawVioletGryffindorScarf(context, request, result) {
  const animation = result?.displayedAnimation ?? result?.animation;
  const sample = result?.sample;
  if (
    request?.house !== 'gryffindor'
    || animation?.appearance !== 'robes'
    || !sample?.root
    || result?.status !== 'drawn'
  ) return false;

  const surface = request.surface === 'portrait' ? 'portrait' : 'world';
  const placement = violetFullFrameCharacterManifest.fullFrame.placement[surface];
  const characterScale = Number.isFinite(request.scale) ? request.scale : 1;
  const scale = placement.scale * characterScale;
  const x = (Number.isFinite(request.x) ? request.x : 0) + placement.x * characterScale;
  const y = (Number.isFinite(request.y) ? request.y : 0) + placement.y * characterScale;
  const direction = animation.mirror ? -1 : 1;
  const { ground } = violetFullFrameCharacterManifest.canvas;
  const layout = scarfLayout(animation);

  context.save();
  context.translate(x, y);
  context.scale(direction * scale, scale);
  context.translate(sample.root.x, sample.root.y);
  context.rotate(sample.root.rotation);
  context.scale(sample.root.scaleX, sample.root.scaleY);
  context.translate(-ground.x, -ground.y);
  drawScarf(context, layout);
  context.restore();
  return true;
}

function drawVioletFullFrame(request, renderer) {
  const result = renderer(request);
  drawVioletGryffindorScarf(request.context, request, result);
  return result;
}

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
    return drawVioletFullFrame(request, violetFullFrameRuntime.renderers.world);
  }
  if (!expressionReviewRuntime) {
    throw new Error('Violet expression review runtime must be preloaded before rendering.');
  }
  const { reviewVariant: _reviewVariant, ...reviewRequest } = request;
  return expressionReviewRuntime.renderers.world(reviewRequest);
}

const drawVioletPortrait = createCharacterPortraitRenderer({
  presentation: violetPortraitPresentation,
  drawFigure: (request) => drawVioletFullFrame(
    request,
    violetFullFrameRuntime.renderers.portrait,
  ),
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
  preparers: violetFullFrameRuntime.preparers,
  renderers: Object.freeze({
    world: drawVioletWorld,
    portrait: drawVioletPortrait,
  }),
});
