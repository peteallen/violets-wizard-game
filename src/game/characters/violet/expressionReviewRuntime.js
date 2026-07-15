import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import { violetExpressionReviewDefinition } from './expressionReviewDefinition.js';

export const violetExpressionReviewManifest = createFullFrameCharacterManifest(
  violetExpressionReviewDefinition,
);

export const violetExpressionReviewRig = new FullFrameCharacterRig(
  violetExpressionReviewManifest,
);

export const violetExpressionReviewRuntime = createFullFrameCharacterRuntime(
  violetExpressionReviewRig,
);
