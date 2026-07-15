// Temporary compatibility shim for the legacy role-keyed renderer map.
import { productionFullFrameCharacterRigs } from './FullFrameCharacterRig.js';
import { wandmakerFullFrameCharacterRig } from '../characters/wandmaker/runtime.js';

export { wandmakerFullFrameCharacterDefinition } from '../characters/wandmaker/definition.js';
export {
  wandmakerFullFrameCharacterManifest,
  wandmakerFullFrameCharacterRig,
} from '../characters/wandmaker/runtime.js';

productionFullFrameCharacterRigs.set('wandmaker', wandmakerFullFrameCharacterRig);
