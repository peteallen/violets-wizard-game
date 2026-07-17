import { defineCharacterModule } from '../CharacterModule.js';
import { conductorCharacterDefinition } from './definition.js';

export {
  conductorCharacterDefinition,
  conductorFullFrameCharacterDefinition,
} from './definition.js';

export async function loadConductorCharacterRuntime() {
  const { conductorCharacterRuntime } = await import('./runtime.js');
  return conductorCharacterRuntime;
}

export const conductorCharacterModule = defineCharacterModule({
  definition: conductorCharacterDefinition,
  loadRuntime: loadConductorCharacterRuntime,
  reviews: [],
});
