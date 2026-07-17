import { defineCharacterModule } from '../CharacterModule.js';
import { ronWeasleyCharacterDefinition } from './definition.js';

export {
  ronWeasleyCharacterDefinition,
  ronWeasleyFullFrameCharacterDefinition,
} from './definition.js';

export async function loadRonWeasleyCharacterRuntime() {
  const { ronWeasleyCharacterRuntime } = await import('./runtime.js');
  return ronWeasleyCharacterRuntime;
}

export const ronWeasleyCharacterModule = defineCharacterModule({
  definition: ronWeasleyCharacterDefinition,
  loadRuntime: loadRonWeasleyCharacterRuntime,
  reviews: [],
});
