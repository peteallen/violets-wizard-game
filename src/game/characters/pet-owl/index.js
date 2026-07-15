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
  reviews: characterReviewRegistrations(petOwlCharacterReview),
});
