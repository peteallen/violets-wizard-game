import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { madamMalkinFullFrameCharacterDefinition } from './definition.js';

export { madamMalkinFullFrameCharacterDefinition } from './definition.js';

export const madamMalkinFullFrameCharacterManifest = createFullFrameCharacterManifest(
  madamMalkinFullFrameCharacterDefinition,
);

export const madamMalkinFullFrameCharacterRig = new FullFrameCharacterRig(
  madamMalkinFullFrameCharacterManifest,
);

export const madamMalkinPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#4e2943', light: '#ae688e' },
  figure: { x: 0, y: 116, scale: 0.84 },
});

const madamMalkinFullFrameRuntime = createFullFrameCharacterRuntime(
  madamMalkinFullFrameCharacterRig,
);

const drawMadamMalkinPortrait = createCharacterPortraitRenderer({
  presentation: madamMalkinPortraitPresentation,
  drawFigure: madamMalkinFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const { pose = 'speaking', reducedMotion: _reducedMotion, ...rest } = state;
    return { ...rest, pose: pose === 'talk' ? 'speaking' : pose };
  },
});

export const madamMalkinCharacterRuntime = Object.freeze({
  ...madamMalkinFullFrameRuntime,
  renderers: Object.freeze({
    ...madamMalkinFullFrameRuntime.renderers,
    portrait: drawMadamMalkinPortrait,
  }),
});
