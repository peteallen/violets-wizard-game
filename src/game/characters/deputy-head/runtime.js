import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { deputyHeadFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  deputyHeadFullFrameCharacterDefinition,
  { backdrop: { dark: '#26382f', light: '#6b8a70' } },
);

export const deputyHeadFullFrameCharacterManifest = packageRuntime.manifest;
export const deputyHeadFullFrameCharacterRig = packageRuntime.rig;
export const deputyHeadPortraitPresentation = packageRuntime.presentation;
export const deputyHeadCharacterRuntime = packageRuntime.runtime;
