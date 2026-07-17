import { createStaticFullFrameCharacterRuntime } from '../staticFullFrameRuntime.js';
import { sortingHatFullFrameCharacterDefinition } from './definition.js';

const packageRuntime = createStaticFullFrameCharacterRuntime(
  sortingHatFullFrameCharacterDefinition,
  {
    backdrop: { dark: '#39271c', light: '#a57243' },
    figure: { x: 0, y: 132, scale: 0.94 },
  },
);

export function sortingHatSpeechMotionState(
  time,
  { speaking = false, reducedMotion = false } = {},
) {
  const safeTime = Math.max(0, Number.isFinite(time) ? time : 0);
  if (reducedMotion || !speaking) {
    return Object.freeze({ scale: 1, y: 0, reducedMotion: Boolean(reducedMotion) });
  }
  const syllable = (Math.sin(safeTime * 5.6) + Math.sin(safeTime * 8.4 + 0.7) * 0.35) / 1.35;
  const pulse = Math.max(-1, Math.min(1, syllable));
  return Object.freeze({
    scale: 1 + pulse * 0.012,
    y: -Math.max(0, pulse) * 2.4,
    reducedMotion: false,
  });
}

function drawSortingHatWorld(request) {
  const motion = sortingHatSpeechMotionState(request.time, {
    speaking: request.pose === 'speaking' || request.pose === 'talk',
    reducedMotion: request.reducedMotion,
  });
  return packageRuntime.runtime.renderers.world({
    ...request,
    y: (Number.isFinite(request.y) ? request.y : 0) + motion.y,
    scale: (Number.isFinite(request.scale) ? request.scale : 1) * motion.scale,
  });
}

export const sortingHatFullFrameCharacterManifest = packageRuntime.manifest;
export const sortingHatFullFrameCharacterRig = packageRuntime.rig;
export const sortingHatPortraitPresentation = packageRuntime.presentation;
export const sortingHatCharacterRuntime = Object.freeze({
  ...packageRuntime.runtime,
  renderers: Object.freeze({
    ...packageRuntime.runtime.renderers,
    world: drawSortingHatWorld,
  }),
});
