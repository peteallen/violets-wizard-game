import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import { madamMalkinFullFrameCharacterDefinition } from './definition.js';

export { madamMalkinFullFrameCharacterDefinition } from './definition.js';

export const madamMalkinFullFrameCharacterManifest = createFullFrameCharacterManifest(
  madamMalkinFullFrameCharacterDefinition,
);

export const madamMalkinFullFrameCharacterRig = new FullFrameCharacterRig(
  madamMalkinFullFrameCharacterManifest,
);

export const madamMalkinCharacterRuntime = createFullFrameCharacterRuntime(
  madamMalkinFullFrameCharacterRig,
);
