import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  trevorCharacterDefinition,
  trevorCharacterReview,
} from './definition.js';

export {
  trevorCharacterDefinition,
  trevorCharacterReview,
  trevorFullFrameCharacterDefinition,
} from './definition.js';

export async function loadTrevorCharacterRuntime() {
  const { trevorCharacterRuntime } = await import('./runtime.js');
  return trevorCharacterRuntime;
}

export const trevorCharacterModule = defineCharacterModule({
  definition: trevorCharacterDefinition,
  loadRuntime: loadTrevorCharacterRuntime,
  reviews: characterReviewRegistrations(trevorCharacterReview),
});
