import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  hagridCharacterDefinition,
  hagridCharacterReview,
} from './definition.js';

export {
  hagridCharacterDefinition,
  hagridCharacterReview,
  hagridFullFrameCharacterDefinition,
} from './definition.js';

export async function loadHagridCharacterRuntime() {
  const { hagridCharacterRuntime } = await import('./runtime.js');
  return hagridCharacterRuntime;
}

export const hagridCharacterModule = defineCharacterModule({
  definition: hagridCharacterDefinition,
  loadRuntime: loadHagridCharacterRuntime,
  reviews: characterReviewRegistrations(hagridCharacterReview),
});
