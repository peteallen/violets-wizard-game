import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from '../fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import { menagerieKeeperFullFrameCharacterDefinition } from './definition.js';

export { menagerieKeeperFullFrameCharacterDefinition } from './definition.js';

export const menagerieKeeperFullFrameCharacterManifest = createFullFrameCharacterManifest(
  menagerieKeeperFullFrameCharacterDefinition,
);

export const menagerieKeeperFullFrameCharacterRig = new FullFrameCharacterRig(
  menagerieKeeperFullFrameCharacterManifest,
);

export const menagerieKeeperPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: { dark: '#2f4939', light: '#66856d' },
  figure: { x: 0, y: 116, scale: 0.84 },
});

const menagerieKeeperFullFrameRuntime = createFullFrameCharacterRuntime(
  menagerieKeeperFullFrameCharacterRig,
);

const drawMenagerieKeeperPortrait = createCharacterPortraitRenderer({
  presentation: menagerieKeeperPortraitPresentation,
  drawFigure: menagerieKeeperFullFrameRuntime.renderers.portrait,
  prepareFigureState: (state) => {
    const { pose = 'speaking', reducedMotion: _reducedMotion, ...rest } = state;
    return { ...rest, pose: pose === 'talk' ? 'speaking' : pose };
  },
});

export const menagerieKeeperCharacterRuntime = Object.freeze({
  ...menagerieKeeperFullFrameRuntime,
  renderers: Object.freeze({
    ...menagerieKeeperFullFrameRuntime.renderers,
    portrait: drawMenagerieKeeperPortrait,
  }),
});
