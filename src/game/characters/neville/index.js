import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  nevilleCharacterDefinition,
  nevilleCharacterReview,
} from './definition.js';

export {
  nevilleCharacterDefinition,
  nevilleCharacterReview,
  nevilleFullFrameCharacterDefinition,
} from './definition.js';

export async function loadNevilleCharacterRuntime() {
  const { nevilleCharacterRuntime } = await import('./runtime.js');
  return nevilleCharacterRuntime;
}

export const nevilleCharacterModule = defineCharacterModule({
  definition: nevilleCharacterDefinition,
  loadRuntime: loadNevilleCharacterRuntime,
  reviews: characterReviewRegistrations(nevilleCharacterReview),
});
