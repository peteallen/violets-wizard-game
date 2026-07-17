import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { friendlyGhostFullFrameCharacterDefinition } from './definition.js';

export { friendlyGhostFullFrameCharacterDefinition } from './definition.js';

export const friendlyGhostFullFrameCharacterManifest = createFullFrameCharacterManifest(
  friendlyGhostFullFrameCharacterDefinition,
);

export const friendlyGhostFullFrameCharacterRig = new FullFrameCharacterRig(
  friendlyGhostFullFrameCharacterManifest,
  { shadowOpacity: 0 },
);

export const friendlyGhostPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#302849', light: '#8d7799' },
  figure: { x: 0, y: 104, scale: 0.9 },
});

const friendlyGhostFullFrameRuntime = createFullFrameCharacterRuntime(
  friendlyGhostFullFrameCharacterRig,
);

const drawFriendlyGhostPortrait = createCharacterPortraitRenderer({
  presentation: friendlyGhostPortraitPresentation,
  drawFigure: friendlyGhostFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => ({ ...state, pose: state.pose ?? 'speaking' }),
});

export const friendlyGhostCharacterRuntime = Object.freeze({
  ...friendlyGhostFullFrameRuntime,
  renderers: Object.freeze({
    ...friendlyGhostFullFrameRuntime.renderers,
    portrait: drawFriendlyGhostPortrait,
  }),
});
