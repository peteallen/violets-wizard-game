import { drawOwlWithProfile } from './sharedDrawing.js';

function renderRequest(profile, surface, request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError(`Vector owl ${surface} render request must be an object.`);
  }
  const {
    context,
    time = 0,
    characterId: _characterId,
    surface: _surface,
    appearance: _appearance,
    action: _action,
    actionProgress: _actionProgress,
    actionTime: _actionTime,
    ...owl
  } = request;
  if (!context || (typeof context !== 'object' && typeof context !== 'function')) {
    throw new TypeError(`Vector owl ${surface} rendering requires a drawing context.`);
  }
  if (!Number.isFinite(time)) throw new TypeError(`Vector owl ${surface} rendering time must be finite.`);
  return drawOwlWithProfile(context, owl, time, profile);
}

export function createVectorOwlRuntime(profile, surfaces) {
  if (!profile || typeof profile !== 'object') {
    throw new TypeError('Vector owl runtime requires a drawing profile.');
  }
  if (!Array.isArray(surfaces) || surfaces.length === 0) {
    throw new TypeError('Vector owl runtime requires at least one surface.');
  }
  const renderers = Object.fromEntries(surfaces.map((surface) => [
    surface,
    (request) => renderRequest(profile, surface, request),
  ]));
  return Object.freeze({
    renderers: Object.freeze(renderers),
    // Vector owls own no decoded images or other retained browser resources.
    // Explicit hooks keep their registry lifecycle symmetric and truthful.
    preload: () => undefined,
    release: () => undefined,
  });
}
