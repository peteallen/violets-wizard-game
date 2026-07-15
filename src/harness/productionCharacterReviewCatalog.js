import {
  CharacterReviewDescriptorRegistry,
} from '../game/characters/CharacterReviewDescriptor.js';
import { hagridSpriteReviewDescriptor } from '../game/characters/hagrid/review.js';
import { madamMalkinSpriteReviewDescriptor } from '../game/characters/madam-malkin/review.js';
import { owlMotionReviewDescriptor } from '../game/characters/post-owl/review.js';
import { violetExpressionReviewDescriptor } from '../game/characters/violet/review.js';
import { wandmakerSpriteReviewDescriptor } from '../game/characters/wandmaker/review.js';
import { sharedCharacterReviewDescriptors } from './scenes/characterReviewScenes.js';

export const productionCharacterReviewDescriptors = Object.freeze([
  ...sharedCharacterReviewDescriptors,
  owlMotionReviewDescriptor,
  hagridSpriteReviewDescriptor,
  wandmakerSpriteReviewDescriptor,
  madamMalkinSpriteReviewDescriptor,
  violetExpressionReviewDescriptor,
]);

export const productionCharacterReviewCatalog = new CharacterReviewDescriptorRegistry(
  productionCharacterReviewDescriptors,
);
