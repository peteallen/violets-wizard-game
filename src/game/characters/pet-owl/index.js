import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  petOwlCharacterDefinition,
  petOwlCharacterReview,
} from './definition.js';

export {
  petOwlCharacterDefinition,
  petOwlCharacterReview,
} from './definition.js';

export async function loadPetOwlCharacterRuntime() {
  const { petOwlCharacterRuntime } = await import('./runtime.js');
  return petOwlCharacterRuntime;
}

export const petOwlCharacterModule = defineCharacterModule({
  definition: petOwlCharacterDefinition,
  loadRuntime: loadPetOwlCharacterRuntime,
  // The current pet and portrait scenes are shared compositions. Their future
  // unified harness descriptors declare this module as a dependency instead
  // of duplicating ownership of those scene IDs here.
  reviews: characterReviewRegistrations(petOwlCharacterReview, []),
});
