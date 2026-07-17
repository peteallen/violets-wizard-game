import { defineCharacterModule } from '../CharacterModule.js';
import { harryPotterCharacterDefinition } from './definition.js';

export {
  harryPotterCharacterDefinition,
  harryPotterFullFrameCharacterDefinition,
} from './definition.js';

export async function loadHarryPotterCharacterRuntime() {
  const { harryPotterCharacterRuntime } = await import('./runtime.js');
  return harryPotterCharacterRuntime;
}

export const harryPotterCharacterModule = defineCharacterModule({
  definition: harryPotterCharacterDefinition,
  loadRuntime: loadHarryPotterCharacterRuntime,
  reviews: [],
});
