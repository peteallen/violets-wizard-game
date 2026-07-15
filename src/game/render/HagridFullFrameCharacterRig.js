// Temporary compatibility shim for the legacy role-keyed renderer map.
import { productionFullFrameCharacterRigs } from './FullFrameCharacterRig.js';
import { hagridFullFrameCharacterRig } from '../characters/hagrid/runtime.js';

export { hagridFullFrameCharacterDefinition } from '../characters/hagrid/definition.js';
export {
  hagridFullFrameCharacterManifest,
  hagridFullFrameCharacterRig,
} from '../characters/hagrid/runtime.js';

productionFullFrameCharacterRigs.set('guide', hagridFullFrameCharacterRig);
