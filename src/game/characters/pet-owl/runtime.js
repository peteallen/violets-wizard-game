import { createVectorOwlRuntime } from '../owl/runtimeSupport.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { petOwlDrawingProfile } from './profile.js';

export { petOwlDrawingProfile } from './profile.js';

export const petOwlPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#38313f', light: '#8b7a96' },
  figure: { x: 0, y: 62, scale: 0.86 },
});

const petOwlVectorRuntime = createVectorOwlRuntime(
  petOwlDrawingProfile,
  ['world', 'portrait'],
);

const drawPetOwlPortrait = createCharacterPortraitRenderer({
  presentation: petOwlPortraitPresentation,
  drawFigure: petOwlVectorRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const facing = state.facing ?? 'right';
    return {
      facing,
      lightSide: state.lightSide,
      pose: 'idle',
      lookX: facing === 'left' ? -0.35 : 0.35,
    };
  },
});

export const petOwlCharacterRuntime = Object.freeze({
  ...petOwlVectorRuntime,
  renderers: Object.freeze({
    ...petOwlVectorRuntime.renderers,
    portrait: drawPetOwlPortrait,
  }),
});
