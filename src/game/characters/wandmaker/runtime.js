import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import { wandmakerFullFrameCharacterDefinition } from './definition.js';

export { wandmakerFullFrameCharacterDefinition } from './definition.js';

export const wandmakerFullFrameCharacterManifest = createFullFrameCharacterManifest(
  wandmakerFullFrameCharacterDefinition,
);

export const wandmakerFullFrameCharacterRig = new FullFrameCharacterRig(
  wandmakerFullFrameCharacterManifest,
);

export const wandmakerCharacterRuntime = createFullFrameCharacterRuntime(
  wandmakerFullFrameCharacterRig,
);
