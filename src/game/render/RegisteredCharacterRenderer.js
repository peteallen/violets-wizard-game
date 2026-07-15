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
    return this.registry.render(
      characterId,
      surface,
      renderState(request, context, time),
    );
  }

  preload(dependencies, context) {
    return this.registry.preload(dependencies, context);
  }

  release(dependencies, context) {
    return this.registry.release(dependencies, context);
  }
}
