import { defineCharacterModule } from '../CharacterModule.js';
import { trolleyWitchCharacterDefinition } from './definition.js';

export {
  trolleyWitchCharacterDefinition,
  trolleyWitchFullFrameCharacterDefinition,
} from './definition.js';

export async function loadTrolleyWitchCharacterRuntime() {
  const { trolleyWitchCharacterRuntime } = await import('./runtime.js');
  return trolleyWitchCharacterRuntime;
}

export const trolleyWitchCharacterModule = defineCharacterModule({
  definition: trolleyWitchCharacterDefinition,
  loadRuntime: loadTrolleyWitchCharacterRuntime,
  reviews: [],
});
