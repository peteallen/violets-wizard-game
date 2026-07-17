import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { hermioneGrangerFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  hermioneGrangerFullFrameCharacterDefinition,
  { backdrop: { dark: '#342720', light: '#9c7055' } },
);

export const hermioneGrangerFullFrameCharacterManifest = packageRuntime.manifest;
export const hermioneGrangerFullFrameCharacterRig = packageRuntime.rig;
export const hermioneGrangerPortraitPresentation = packageRuntime.presentation;
export const hermioneGrangerCharacterRuntime = packageRuntime.runtime;
