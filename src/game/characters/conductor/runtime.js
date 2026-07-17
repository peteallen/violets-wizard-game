import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { conductorFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  conductorFullFrameCharacterDefinition,
  { backdrop: { dark: '#302637', light: '#8d647b' } },
);

export const conductorFullFrameCharacterManifest = packageRuntime.manifest;
export const conductorFullFrameCharacterRig = packageRuntime.rig;
export const conductorPortraitPresentation = packageRuntime.presentation;
export const conductorCharacterRuntime = packageRuntime.runtime;
