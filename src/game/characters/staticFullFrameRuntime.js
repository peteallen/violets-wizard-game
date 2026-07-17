import {
  FullFrameCharacterRig,
  createFullFrameCharacterManifest,
} from '../render/FullFrameCharacterRig.js';
import { createFullFrameCharacterRuntime } from './fullFrameRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from './portraitRuntime.js';

/** Builds the lazy runtime half of a one-painting first-pass character package. */
export function createStaticFullFrameCharacterRuntime(fullFrameDefinition, {
  backdrop,
  figure = { x: 0, y: 116, scale: 0.84 },
  shadowOpacity,
} = {}) {
  const manifest = createFullFrameCharacterManifest(fullFrameDefinition);
  const rig = new FullFrameCharacterRig(manifest, {
    ...(shadowOpacity === undefined ? {} : { shadowOpacity }),
  });
  const presentation = defineCharacterPortraitPresentation({ backdrop, figure });
  const fullFrameRuntime = createFullFrameCharacterRuntime(rig);
  const portrait = createCharacterPortraitRenderer({
    presentation,
    drawFigure: fullFrameRuntime.renderers.portrait,
    prepareFigureState: (state) => {
      const { pose = 'speaking', reducedMotion: _reducedMotion, ...rest } = state;
      return { ...rest, pose };
    },
  });
  const runtime = Object.freeze({
    ...fullFrameRuntime,
    renderers: Object.freeze({
      ...fullFrameRuntime.renderers,
      portrait,
    }),
  });

  return Object.freeze({ manifest, rig, presentation, runtime });
}
