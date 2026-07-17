import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { flitwickFullFrameCharacterDefinition } from './definition.js';

export { flitwickFullFrameCharacterDefinition } from './definition.js';

export const flitwickFullFrameCharacterManifest = createFullFrameCharacterManifest(
  flitwickFullFrameCharacterDefinition,
);

export const flitwickFullFrameCharacterRig = new FullFrameCharacterRig(
  flitwickFullFrameCharacterManifest,
  { shadowOpacity: 0.26 },
);

export const flitwickPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#2d2547', light: '#a06f55' },
  figure: { x: 0, y: 110, scale: 0.94 },
});

const flitwickFullFrameRuntime = createFullFrameCharacterRuntime(
  flitwickFullFrameCharacterRig,
);

const drawFlitwickPortrait = createCharacterPortraitRenderer({
  presentation: flitwickPortraitPresentation,
  drawFigure: flitwickFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => ({ ...state, pose: state.pose ?? 'speaking' }),
});

export const flitwickCharacterRuntime = Object.freeze({
  ...flitwickFullFrameRuntime,
  renderers: Object.freeze({
    ...flitwickFullFrameRuntime.renderers,
    portrait: drawFlitwickPortrait,
  }),
});
