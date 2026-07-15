import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { violetFullFrameCharacterDefinition } from './definition.js';
import { recolorVioletRobeFrame } from './robeRecolor.js';

export { violetFullFrameCharacterDefinition } from './definition.js';

export const violetFullFrameCharacterManifest = createFullFrameCharacterManifest(
  violetFullFrameCharacterDefinition,
);

export const violetFullFrameCharacterRig = new FullFrameCharacterRig(
  violetFullFrameCharacterManifest,
  {
    imageTransform: ({ image, animation, character }) => (
      animation.appearance === 'robes'
        ? recolorVioletRobeFrame(image, character.robeTrim ?? '#7a4fc9')
        : image
    ),
  },
);

export const violetPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#302642', light: '#8b63aa' },
  figure: { x: 0, y: 118, scale: 0.82 },
});

const violetFullFrameRuntime = createFullFrameCharacterRuntime(
  violetFullFrameCharacterRig,
);

const drawVioletPortrait = createCharacterPortraitRenderer({
  presentation: violetPortraitPresentation,
  drawFigure: violetFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const {
      appearance,
      outfit,
      pose = 'speaking',
      robeTrim = '#7a4fc9',
      wand,
      ...rest
    } = state;
    return {
      ...rest,
      appearance: appearance ?? outfit ?? 'robes',
      pose: pose === 'talk' ? 'speaking' : pose,
      robeTrim,
      wand: Boolean(wand),
    };
  },
});

export const violetCharacterRuntime = Object.freeze({
  ...violetFullFrameRuntime,
  renderers: Object.freeze({
    ...violetFullFrameRuntime.renderers,
    portrait: drawVioletPortrait,
  }),
});
