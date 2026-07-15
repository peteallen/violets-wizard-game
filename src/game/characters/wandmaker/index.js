import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  wandmakerCharacterDefinition,
  wandmakerCharacterReview,
} from './definition.js';

export {
  wandmakerCharacterDefinition,
  wandmakerCharacterReview,
  wandmakerFullFrameCharacterDefinition,
} from './definition.js';

export async function loadWandmakerCharacterRuntime() {
  const { wandmakerCharacterRuntime } = await import('./runtime.js');
  return wandmakerCharacterRuntime;
}

export const wandmakerCharacterModule = defineCharacterModule({
  definition: wandmakerCharacterDefinition,
  loadRuntime: loadWandmakerCharacterRuntime,
  reviews: characterReviewRegistrations(wandmakerCharacterReview),
});
