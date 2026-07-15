import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  madamMalkinCharacterDefinition,
  madamMalkinCharacterReview,
} from './definition.js';

export {
  madamMalkinCharacterDefinition,
  madamMalkinCharacterReview,
  madamMalkinFullFrameCharacterDefinition,
} from './definition.js';

export async function loadMadamMalkinCharacterRuntime() {
  const { madamMalkinCharacterRuntime } = await import('./runtime.js');
  return madamMalkinCharacterRuntime;
}

export const madamMalkinCharacterModule = defineCharacterModule({
  definition: madamMalkinCharacterDefinition,
  loadRuntime: loadMadamMalkinCharacterRuntime,
  reviews: characterReviewRegistrations(madamMalkinCharacterReview, ['madam-malkin-sprite-review']),
});
