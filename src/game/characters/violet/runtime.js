import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
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

export const violetCharacterRuntime = createFullFrameCharacterRuntime(
  violetFullFrameCharacterRig,
);
