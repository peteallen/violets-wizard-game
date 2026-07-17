import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { ronWeasleyFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  ronWeasleyFullFrameCharacterDefinition,
  { backdrop: { dark: '#3c2921', light: '#b76d45' } },
);

export const ronWeasleyFullFrameCharacterManifest = packageRuntime.manifest;
export const ronWeasleyFullFrameCharacterRig = packageRuntime.rig;
export const ronWeasleyPortraitPresentation = packageRuntime.presentation;
export const ronWeasleyCharacterRuntime = packageRuntime.runtime;
