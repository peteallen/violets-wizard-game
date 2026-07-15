import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import { catCharacterDefinition, catCharacterReview } from './definition.js';

export { catCharacterDefinition, catCharacterReview, catPresentation, catStyle } from './definition.js';

export async function loadCatCharacterRuntime() {
  const { catCharacterRuntime } = await import('./runtime.js');
  return catCharacterRuntime;
}

export const catCharacterModule = defineCharacterModule({
  definition: catCharacterDefinition,
  loadRuntime: loadCatCharacterRuntime,
  reviews: characterReviewRegistrations(catCharacterReview, []),
});
