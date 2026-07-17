import { defineCharacterModule } from '../CharacterModule.js';
import { hermioneGrangerCharacterDefinition } from './definition.js';

export {
  hermioneGrangerCharacterDefinition,
  hermioneGrangerFullFrameCharacterDefinition,
} from './definition.js';

export async function loadHermioneGrangerCharacterRuntime() {
  const { hermioneGrangerCharacterRuntime } = await import('./runtime.js');
  return hermioneGrangerCharacterRuntime;
}

export const hermioneGrangerCharacterModule = defineCharacterModule({
  definition: hermioneGrangerCharacterDefinition,
  loadRuntime: loadHermioneGrangerCharacterRuntime,
  reviews: [],
});
