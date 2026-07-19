const REMOVED_COMPATIBILITY_FIELDS = Object.freeze([
  'actorAnimation',
  'detail',
  'outfit',
  'portraitCharacterId',
  'walking',
]);

function renderState(request, context, time) {
  const {
    characterId: _characterId,
    surface: _surface,
    ...state
  } = request;
  return {
    ...state,
    context,
    time,
  };
}

function prepareState(request, time) {
  const {
    characterId: _characterId,
    surface: _surface,
    ...state
  } = request;
  return { ...state, time };
}

function validateRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError('Character render request must be an object.');
  }
  const characterId = request.characterId;
  if (typeof characterId !== 'string' || characterId.length === 0) {
    throw new TypeError('Character render request requires an exact characterId.');
  }
  const surface = request.surface;
  if (surface !== 'world' && surface !== 'portrait') {
    throw new TypeError('Character render request requires an exact world or portrait surface.');
  }
  for (const field of REMOVED_COMPATIBILITY_FIELDS) {
    if (Object.hasOwn(request, field)) {
      throw new TypeError(`Character render request field ${field} is no longer supported.`);
    }
  }
  return { characterId, surface };
}

/**
 * The generic rendering boundary. It knows only canonical identities and the
 * two public surfaces; all normalization and drawing beyond this point belongs
 * to the selected character package.
 */
export class RegisteredCharacterRenderer {
  constructor({ registry } = {}) {
    if (!registry || typeof registry.render !== 'function') {
      throw new TypeError('RegisteredCharacterRenderer requires a CharacterRegistry.');
    }
    this.registry = registry;
  }

  draw(context, request = {}, time = 0) {
    const { characterId, surface } = validateRequest(request);
    return this.registry.render(
      characterId,
      surface,
      renderState(request, context, time),
    );
  }

  prepare(request = {}, time = 0, options = {}) {
    const { characterId, surface } = validateRequest(request);
    return this.registry.prepare(
      characterId,
      surface,
      prepareState(request, time),
      options,
    );
  }

  preload(dependencies, context) {
    return this.registry.preload(dependencies, context);
  }

  release(dependencies, context) {
    return this.registry.release(dependencies, context);
  }
}
