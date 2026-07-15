import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import { narratorCharacterDefinition, narratorCharacterReview } from './definition.js';

export {
  narratorCharacterDefinition,
  narratorCharacterReview,
  narratorPresentation,
  narratorStyle,
} from './definition.js';

export async function loadNarratorCharacterRuntime() {
  const { narratorCharacterRuntime } = await import('./runtime.js');
  return narratorCharacterRuntime;
}

export const narratorCharacterModule = defineCharacterModule({
  definition: narratorCharacterDefinition,
  loadRuntime: loadNarratorCharacterRuntime,
  reviews: characterReviewRegistrations(narratorCharacterReview, []),
});
