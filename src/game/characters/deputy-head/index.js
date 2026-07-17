import { defineCharacterModule } from '../CharacterModule.js';
import { deputyHeadCharacterDefinition } from './definition.js';

export {
  deputyHeadCharacterDefinition,
  deputyHeadFullFrameCharacterDefinition,
} from './definition.js';

export async function loadDeputyHeadCharacterRuntime() {
  const { deputyHeadCharacterRuntime } = await import('./runtime.js');
  return deputyHeadCharacterRuntime;
}

export const deputyHeadCharacterModule = defineCharacterModule({
  definition: deputyHeadCharacterDefinition,
  loadRuntime: loadDeputyHeadCharacterRuntime,
  reviews: [],
});
