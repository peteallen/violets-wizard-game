import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { trolleyWitchFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  trolleyWitchFullFrameCharacterDefinition,
  { backdrop: { dark: '#40253b', light: '#aa7188' } },
);

export const trolleyWitchFullFrameCharacterManifest = packageRuntime.manifest;
export const trolleyWitchFullFrameCharacterRig = packageRuntime.rig;
export const trolleyWitchPortraitPresentation = packageRuntime.presentation;
export const trolleyWitchCharacterRuntime = packageRuntime.runtime;
