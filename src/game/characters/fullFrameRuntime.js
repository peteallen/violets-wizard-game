function renderRequest(rig, surface, request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError(`Full-frame ${surface} render request must be an object.`);
  }
  const {
    context,
    time = 0,
    characterId: _characterId,
    surface: requestedSurface,
    ...character
  } = request;
  if (!context || (typeof context !== 'object' && typeof context !== 'function')) {
    throw new TypeError(`Full-frame ${surface} rendering requires a drawing context.`);
  }
  if (requestedSurface !== surface) {
    throw new TypeError(`Full-frame ${surface} renderer requires surface: ${surface}.`);
  }
  return rig.draw(context, character, time, surface);
}

function prepareRequest(rig, surface, request, options = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError(`Full-frame ${surface} preparation request must be an object.`);
  }
  const {
    time = 0,
    characterId: _characterId,
    surface: requestedSurface,
    ...character
  } = request;
  if (requestedSurface !== surface) {
    throw new TypeError(`Full-frame ${surface} preparation requires surface: ${surface}.`);
  }
  return rig.prepareVisibleFrame(character, time, surface, options);
}

export function createFullFrameCharacterRuntime(rig) {
  if (!rig || typeof rig.draw !== 'function' || typeof rig.preload !== 'function') {
    throw new TypeError('Full-frame character runtime requires a rig with draw() and preload().');
  }
  return Object.freeze({
    renderers: Object.freeze({
      world: (request) => renderRequest(rig, 'world', request),
      portrait: (request) => renderRequest(rig, 'portrait', request),
    }),
    preparers: Object.freeze({
      world: (request, options) => prepareRequest(rig, 'world', request, options),
      portrait: (request, options) => prepareRequest(rig, 'portrait', request, options),
    }),
    // Chapter activation loads the lightweight runtime module but leaves image
    // decoding clip-scoped (D63). Deterministic review scopes opt into the
    // exhaustive manifest preload so captures never record a loading frame.
    preload: ({ context } = {}) => (context?.review === true ? rig.preload() : undefined),
    release: () => rig.release?.(),
  });
}
