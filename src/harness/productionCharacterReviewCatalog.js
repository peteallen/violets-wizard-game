import {
  CharacterReviewDescriptorRegistry,
} from '../game/characters/CharacterReviewDescriptor.js';
import { flitwickSpriteReviewDescriptor } from '../game/characters/flitwick/review.js';
import { friendlyGhostSpriteReviewDescriptor } from '../game/characters/friendly-ghost/review.js';
import { hagridSpriteReviewDescriptor } from '../game/characters/hagrid/review.js';
import { madamMalkinSpriteReviewDescriptor } from '../game/characters/madam-malkin/review.js';
import { menagerieKeeperSpriteReviewDescriptor } from '../game/characters/menagerie-keeper/review.js';
import { nevilleSpriteReviewDescriptor } from '../game/characters/neville/review.js';
import { owlMotionReviewDescriptor } from '../game/characters/post-owl/review.js';
import { trevorSpriteReviewDescriptor } from '../game/characters/trevor/review.js';
import { violetExpressionReviewDescriptor } from '../game/characters/violet/review.js';
import { wandmakerSpriteReviewDescriptor } from '../game/characters/wandmaker/review.js';
import { sharedCharacterReviewDescriptors } from './scenes/characterReviewScenes.js';

export const productionCharacterReviewDescriptors = Object.freeze([
  ...sharedCharacterReviewDescriptors,
  owlMotionReviewDescriptor,
  hagridSpriteReviewDescriptor,
  wandmakerSpriteReviewDescriptor,
  madamMalkinSpriteReviewDescriptor,
  menagerieKeeperSpriteReviewDescriptor,
  violetExpressionReviewDescriptor,
  flitwickSpriteReviewDescriptor,
  nevilleSpriteReviewDescriptor,
  trevorSpriteReviewDescriptor,
  friendlyGhostSpriteReviewDescriptor,
]);

export const productionCharacterReviewCatalog = new CharacterReviewDescriptorRegistry(
  productionCharacterReviewDescriptors,
);
