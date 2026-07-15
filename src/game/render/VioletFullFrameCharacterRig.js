// Temporary compatibility shim. New code imports the identity package; the
// legacy CharacterRenderer import keeps its existing eager registration until
// registry-based rendering replaces the production map.
import { productionFullFrameCharacterRigs } from './FullFrameCharacterRig.js';
import { violetFullFrameCharacterRig } from '../characters/violet/runtime.js';

export { violetFullFrameCharacterDefinition } from '../characters/violet/definition.js';
export {
  violetFullFrameCharacterManifest,
  violetFullFrameCharacterRig,
} from '../characters/violet/runtime.js';

productionFullFrameCharacterRigs.set('violet', violetFullFrameCharacterRig);
