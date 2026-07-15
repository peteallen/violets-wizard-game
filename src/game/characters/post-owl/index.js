import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  postOwlCharacterDefinition,
  postOwlCharacterReview,
} from './definition.js';

export {
  postOwlCharacterDefinition,
  postOwlCharacterReview,
} from './definition.js';

export async function loadPostOwlCharacterRuntime() {
  const { postOwlCharacterRuntime } = await import('./runtime.js');
  return postOwlCharacterRuntime;
}

export const postOwlCharacterModule = defineCharacterModule({
  definition: postOwlCharacterDefinition,
  loadRuntime: loadPostOwlCharacterRuntime,
  reviews: characterReviewRegistrations(postOwlCharacterReview),
});
