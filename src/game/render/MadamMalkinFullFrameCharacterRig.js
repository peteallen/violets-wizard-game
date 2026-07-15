// Temporary compatibility shim for the legacy role-keyed renderer map.
import { productionFullFrameCharacterRigs } from './FullFrameCharacterRig.js';
import { madamMalkinFullFrameCharacterRig } from '../characters/madam-malkin/runtime.js';

export { madamMalkinFullFrameCharacterDefinition } from '../characters/madam-malkin/definition.js';
export {
  madamMalkinFullFrameCharacterManifest,
  madamMalkinFullFrameCharacterRig,
} from '../characters/madam-malkin/runtime.js';

productionFullFrameCharacterRigs.set('tailor', madamMalkinFullFrameCharacterRig);
