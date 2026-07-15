import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import { hagridFullFrameCharacterDefinition } from './definition.js';

export { hagridFullFrameCharacterDefinition } from './definition.js';

export const hagridFullFrameCharacterManifest = createFullFrameCharacterManifest(
  hagridFullFrameCharacterDefinition,
);

export const hagridFullFrameCharacterRig = new FullFrameCharacterRig(
  hagridFullFrameCharacterManifest,
  { shadowOpacity: 0.34 },
);

export const hagridCharacterRuntime = createFullFrameCharacterRuntime(
  hagridFullFrameCharacterRig,
);
