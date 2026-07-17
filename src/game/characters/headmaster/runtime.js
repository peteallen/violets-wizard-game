import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { headmasterFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  headmasterFullFrameCharacterDefinition,
  { backdrop: { dark: '#262440', light: '#706da0' } },
);

export const headmasterFullFrameCharacterManifest = packageRuntime.manifest;
export const headmasterFullFrameCharacterRig = packageRuntime.rig;
export const headmasterPortraitPresentation = packageRuntime.presentation;
export const headmasterCharacterRuntime = packageRuntime.runtime;
