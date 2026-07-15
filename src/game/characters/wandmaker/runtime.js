import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { wandmakerFullFrameCharacterDefinition } from './definition.js';

export { wandmakerFullFrameCharacterDefinition } from './definition.js';

export const wandmakerFullFrameCharacterManifest = createFullFrameCharacterManifest(
  wandmakerFullFrameCharacterDefinition,
);

export const wandmakerFullFrameCharacterRig = new FullFrameCharacterRig(
  wandmakerFullFrameCharacterManifest,
);

export const wandmakerPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#292b40', light: '#77799a' },
  figure: { x: 0, y: 116, scale: 0.84 },
});

const wandmakerFullFrameRuntime = createFullFrameCharacterRuntime(
  wandmakerFullFrameCharacterRig,
);

const drawWandmakerPortrait = createCharacterPortraitRenderer({
  presentation: wandmakerPortraitPresentation,
  drawFigure: wandmakerFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const { pose = 'speaking', reducedMotion: _reducedMotion, ...rest } = state;
    return { ...rest, pose: pose === 'talk' ? 'speaking' : pose };
  },
});

export const wandmakerCharacterRuntime = Object.freeze({
  ...wandmakerFullFrameRuntime,
  renderers: Object.freeze({
    ...wandmakerFullFrameRuntime.renderers,
    portrait: drawWandmakerPortrait,
  }),
});
