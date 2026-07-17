import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  flitwickCharacterDefinition,
  flitwickCharacterReview,
} from './definition.js';

export {
  flitwickCharacterDefinition,
  flitwickCharacterReview,
  flitwickFullFrameCharacterDefinition,
} from './definition.js';

export async function loadFlitwickCharacterRuntime() {
  const { flitwickCharacterRuntime } = await import('./runtime.js');
  return flitwickCharacterRuntime;
}

export const flitwickCharacterModule = defineCharacterModule({
  definition: flitwickCharacterDefinition,
  loadRuntime: loadFlitwickCharacterRuntime,
  reviews: characterReviewRegistrations(flitwickCharacterReview),
});
