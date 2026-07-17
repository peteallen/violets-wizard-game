import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { harryPotterFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  harryPotterFullFrameCharacterDefinition,
  { backdrop: { dark: '#30272a', light: '#98694f' } },
);

export const harryPotterFullFrameCharacterManifest = packageRuntime.manifest;
export const harryPotterFullFrameCharacterRig = packageRuntime.rig;
export const harryPotterPortraitPresentation = packageRuntime.presentation;
export const harryPotterCharacterRuntime = packageRuntime.runtime;
