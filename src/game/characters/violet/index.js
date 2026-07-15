import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  violetCharacterDefinition,
  violetCharacterReview,
} from './definition.js';

export {
  violetCharacterDefinition,
  violetCharacterReview,
  violetFullFrameCharacterDefinition,
} from './definition.js';

export async function loadVioletCharacterRuntime() {
  const { violetCharacterRuntime } = await import('./runtime.js');
  return violetCharacterRuntime;
}

export const violetCharacterModule = defineCharacterModule({
  definition: violetCharacterDefinition,
  loadRuntime: loadVioletCharacterRuntime,
  reviews: characterReviewRegistrations(violetCharacterReview),
});
