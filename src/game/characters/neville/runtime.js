import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { nevilleFullFrameCharacterDefinition } from './definition.js';

export { nevilleFullFrameCharacterDefinition } from './definition.js';

export const nevilleFullFrameCharacterManifest = createFullFrameCharacterManifest(
  nevilleFullFrameCharacterDefinition,
);

export const nevilleFullFrameCharacterRig = new FullFrameCharacterRig(
  nevilleFullFrameCharacterManifest,
  { shadowOpacity: 0.28 },
);

export const nevillePortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#33263d', light: '#9a684d' },
  figure: { x: 0, y: 108, scale: 0.9 },
});

const nevilleFullFrameRuntime = createFullFrameCharacterRuntime(
  nevilleFullFrameCharacterRig,
);

const drawNevillePortrait = createCharacterPortraitRenderer({
  presentation: nevillePortraitPresentation,
  drawFigure: nevilleFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => ({ ...state, pose: state.pose ?? 'speaking' }),
});

export const nevilleCharacterRuntime = Object.freeze({
  ...nevilleFullFrameRuntime,
  renderers: Object.freeze({
    ...nevilleFullFrameRuntime.renderers,
    portrait: drawNevillePortrait,
  }),
});
