import { defineCharacterModule } from '../CharacterModule.js';
import { characterReviewRegistrations } from '../packageSupport.js';
import {
  menagerieKeeperCharacterDefinition,
  menagerieKeeperCharacterReview,
} from './definition.js';

export {
  menagerieKeeperCharacterDefinition,
  menagerieKeeperCharacterReview,
  menagerieKeeperFullFrameCharacterDefinition,
} from './definition.js';

export async function loadMenagerieKeeperCharacterRuntime() {
  const { menagerieKeeperCharacterRuntime } = await import('./runtime.js');
  return menagerieKeeperCharacterRuntime;
}

export const menagerieKeeperCharacterModule = defineCharacterModule({
  definition: menagerieKeeperCharacterDefinition,
  loadRuntime: loadMenagerieKeeperCharacterRuntime,
  reviews: characterReviewRegistrations(
    menagerieKeeperCharacterReview,
    ['menagerie-keeper-sprite-review'],
  ),
});
