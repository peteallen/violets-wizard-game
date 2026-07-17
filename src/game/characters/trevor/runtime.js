import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { trevorFullFrameCharacterDefinition } from './definition.js';

export { trevorFullFrameCharacterDefinition } from './definition.js';

export const trevorFullFrameCharacterManifest = createFullFrameCharacterManifest(
  trevorFullFrameCharacterDefinition,
);

export const trevorFullFrameCharacterRig = new FullFrameCharacterRig(
  trevorFullFrameCharacterManifest,
  { shadowOpacity: 0.24 },
);

export const trevorPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#28362d', light: '#a17446' },
  figure: { x: 0, y: 106, scale: 0.92 },
});

const trevorFullFrameRuntime = createFullFrameCharacterRuntime(
  trevorFullFrameCharacterRig,
);

const drawTrevorPortrait = createCharacterPortraitRenderer({
  presentation: trevorPortraitPresentation,
  drawFigure: trevorFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => ({ ...state, pose: state.pose ?? 'speaking' }),
});

export const trevorCharacterRuntime = Object.freeze({
  ...trevorFullFrameRuntime,
  renderers: Object.freeze({
    ...trevorFullFrameRuntime.renderers,
    portrait: drawTrevorPortrait,
  }),
});
