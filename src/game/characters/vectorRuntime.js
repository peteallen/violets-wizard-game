function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function finiteOrDefault(value, fallback, path) {
  const candidate = value ?? fallback;
  if (!Number.isFinite(candidate)) throw new TypeError(`${path} must be a finite number.`);
  return candidate;
}

export function normalizeVectorRenderRequest(request, {
  surface,
  x = 0,
  y = 0,
  scale = 1,
  pose = 'idle',
} = {}) {
  if (!isPlainObject(request)) throw new TypeError(`Vector ${surface} render request must be a plain object.`);
  const {
    context,
    time,
    characterId: _characterId,
    surface: _surface,
    ...state
  } = request;
  if (!context || (typeof context !== 'object' && typeof context !== 'function')) {
    throw new TypeError(`Vector ${surface} rendering requires a drawing context.`);
  }
  const normalizedScale = finiteOrDefault(state.scale, scale, `Vector ${surface} scale`);
  if (normalizedScale <= 0) throw new TypeError(`Vector ${surface} scale must be greater than zero.`);
  const normalizedPose = state.pose ?? pose;
  if (typeof normalizedPose !== 'string' || normalizedPose.trim() === '') {
    throw new TypeError(`Vector ${surface} pose must be a non-empty string.`);
  }
  const facing = state.facing ?? 'right';
  if (!['left', 'right'].includes(facing)) {
    throw new TypeError(`Vector ${surface} facing must be left or right.`);
  }
  const lightSide = state.lightSide ?? 'left';
  if (!['left', 'right'].includes(lightSide)) {
    throw new TypeError(`Vector ${surface} lightSide must be left or right.`);
  }
  return Object.freeze({
    context,
    time: Number.isFinite(time) ? time : 0,
    state: Object.freeze({
      ...state,
      x: finiteOrDefault(state.x, x, `Vector ${surface} x`),
      y: finiteOrDefault(state.y, y, `Vector ${surface} y`),
      scale: normalizedScale,
      pose: normalizedPose,
      facing,
      lightSide,
      reducedMotion: Boolean(state.reducedMotion),
    }),
  });
}

export function createVectorCharacterRuntime({ drawWorld, drawPortrait = null } = {}) {
  if (typeof drawWorld !== 'function' && typeof drawPortrait !== 'function') {
    throw new TypeError('Vector character runtime requires at least one renderer.');
  }
  const renderers = {};
  if (drawWorld) renderers.world = drawWorld;
  if (drawPortrait) renderers.portrait = drawPortrait;
  return Object.freeze({ renderers: Object.freeze(renderers) });
}
