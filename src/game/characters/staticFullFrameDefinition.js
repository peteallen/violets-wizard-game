import { defineCharacter } from './CharacterDefinition.js';
import { characterImageAssets } from './packageSupport.js';

const DEFAULT_APPEARANCE = 'default';
const NEUTRAL_FRAME = 'default/neutral.png';

export const STATIC_FULL_FRAME_CANVAS = Object.freeze({
  width: 896,
  height: 1200,
  ground: Object.freeze({ x: 448, y: 1132 }),
});

function still(path) {
  return Object.freeze({ fps: 1, frames: Object.freeze([path]) });
}

function uniquePoses(extraPoses) {
  if (!Array.isArray(extraPoses)) {
    throw new TypeError('Static full-frame extra poses must be an array.');
  }
  const poses = ['talk', 'speaking', ...extraPoses];
  if (poses.some((pose) => typeof pose !== 'string' || pose.trim() === '')) {
    throw new TypeError('Static full-frame poses must be non-empty strings.');
  }
  if (new Set(poses).size !== poses.length) {
    throw new TypeError('Static full-frame poses must not contain duplicates.');
  }
  return poses;
}

function normalizeCanvas(canvas) {
  return Object.freeze({
    width: canvas.width,
    height: canvas.height,
    ground: Object.freeze({ ...canvas.ground }),
  });
}

/**
 * Defines a first-pass full-frame identity backed by one generated still.
 * Semantic poses remain explicit aliases so later paintings can replace them
 * without changing authored Chapter content or save-compatible identity IDs.
 */
export function defineStaticFullFrameCharacter({
  id,
  slug,
  displayName,
  kind = 'human',
  voiceRole,
  extraPoses = [],
  worldHeight = 225,
  portraitY = 12,
  canvas = STATIC_FULL_FRAME_CANVAS,
}) {
  const aliasedPoses = uniquePoses(extraPoses);
  const aliases = Object.freeze(Object.fromEntries(
    aliasedPoses.map((pose) => [pose, 'idle']),
  ));
  const normalizedCanvas = normalizeCanvas(canvas);
  const fullFrameDefinition = Object.freeze({
    id,
    basePath: `assets/art/characters/${slug}`,
    canvas: normalizedCanvas,
    worldHeight,
    placement: Object.freeze({
      portrait: Object.freeze({ y: portraitY }),
    }),
    defaultAppearance: DEFAULT_APPEARANCE,
    appearances: Object.freeze({
      [DEFAULT_APPEARANCE]: Object.freeze({
        clips: Object.freeze({ idle: still(NEUTRAL_FRAME) }),
        aliases,
      }),
    }),
  });
  const characterDefinition = defineCharacter({
    id,
    metadata: { displayName, kind, voiceRole },
    surfaces: ['world', 'portrait'],
    defaults: { appearance: DEFAULT_APPEARANCE, pose: 'idle' },
    capabilities: {
      appearances: [DEFAULT_APPEARANCE],
      poses: ['idle', ...aliasedPoses],
      actions: [],
      supportsReducedMotion: true,
    },
    bounds: {
      world: {
        x: 0,
        y: 0,
        width: normalizedCanvas.width,
        height: normalizedCanvas.ground.y,
      },
      portrait: {
        x: normalizedCanvas.width * 0.2,
        y: 0,
        width: normalizedCanvas.width * 0.6,
        height: normalizedCanvas.height * 0.42,
      },
    },
    assets: characterImageAssets(slug, [NEUTRAL_FRAME]),
  });

  return Object.freeze({ characterDefinition, fullFrameDefinition });
}
