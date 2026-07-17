import { defineCharacterModule } from '../CharacterModule.js';
import { headmasterCharacterDefinition } from './definition.js';

export {
  headmasterCharacterDefinition,
  headmasterFullFrameCharacterDefinition,
} from './definition.js';

export async function loadHeadmasterCharacterRuntime() {
  const { headmasterCharacterRuntime } = await import('./runtime.js');
  return headmasterCharacterRuntime;
}

export const headmasterCharacterModule = defineCharacterModule({
  definition: headmasterCharacterDefinition,
  loadRuntime: loadHeadmasterCharacterRuntime,
  reviews: [],
});
