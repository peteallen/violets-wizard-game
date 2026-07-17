import { defineCharacterModule } from '../CharacterModule.js';
import { sortingHatCharacterDefinition } from './definition.js';

export {
  sortingHatCharacterDefinition,
  sortingHatFullFrameCharacterDefinition,
} from './definition.js';

export async function loadSortingHatCharacterRuntime() {
  const { sortingHatCharacterRuntime } = await import('./runtime.js');
  return sortingHatCharacterRuntime;
}

export const sortingHatCharacterModule = defineCharacterModule({
  definition: sortingHatCharacterDefinition,
  loadRuntime: loadSortingHatCharacterRuntime,
  reviews: [],
});
