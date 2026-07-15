import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import { toadCharacterDefinition, toadCharacterReview } from './definition.js';

export { toadCharacterDefinition, toadCharacterReview, toadPresentation, toadStyle } from './definition.js';

export async function loadToadCharacterRuntime() {
  const { toadCharacterRuntime } = await import('./runtime.js');
  return toadCharacterRuntime;
}

export const toadCharacterModule = defineCharacterModule({
  definition: toadCharacterDefinition,
  loadRuntime: loadToadCharacterRuntime,
  reviews: characterReviewRegistrations(toadCharacterReview, []),
});
