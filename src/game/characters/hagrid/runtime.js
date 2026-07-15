import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { hagridFullFrameCharacterDefinition } from './definition.js';

export { hagridFullFrameCharacterDefinition } from './definition.js';

export const hagridFullFrameCharacterManifest = createFullFrameCharacterManifest(
  hagridFullFrameCharacterDefinition,
);

export const hagridFullFrameCharacterRig = new FullFrameCharacterRig(
  hagridFullFrameCharacterManifest,
  { shadowOpacity: 0.34 },
);

export const hagridPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#30271f', light: '#7f6347' },
  figure: { x: 0, y: 166, scale: 0.92 },
});

const hagridFullFrameRuntime = createFullFrameCharacterRuntime(
  hagridFullFrameCharacterRig,
);

const drawHagridPortrait = createCharacterPortraitRenderer({
  presentation: hagridPortraitPresentation,
  drawFigure: hagridFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const { pose = 'speaking', reducedMotion: _reducedMotion, ...rest } = state;
    return { ...rest, pose: pose === 'talk' ? 'speaking' : pose };
  },
});

export const hagridCharacterRuntime = Object.freeze({
  ...hagridFullFrameRuntime,
  renderers: Object.freeze({
    ...hagridFullFrameRuntime.renderers,
    portrait: drawHagridPortrait,
  }),
});
