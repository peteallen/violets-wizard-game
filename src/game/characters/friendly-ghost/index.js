import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  friendlyGhostCharacterDefinition,
  friendlyGhostCharacterReview,
} from './definition.js';

export {
  friendlyGhostCharacterDefinition,
  friendlyGhostCharacterReview,
  friendlyGhostFullFrameCharacterDefinition,
} from './definition.js';

export async function loadFriendlyGhostCharacterRuntime() {
  const { friendlyGhostCharacterRuntime } = await import('./runtime.js');
  return friendlyGhostCharacterRuntime;
}

export const friendlyGhostCharacterModule = defineCharacterModule({
  definition: friendlyGhostCharacterDefinition,
  loadRuntime: loadFriendlyGhostCharacterRuntime,
  reviews: characterReviewRegistrations(friendlyGhostCharacterReview),
});
