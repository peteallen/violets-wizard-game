function renderState(request, context, time, surface) {
  const {
    surface: _requestedSurface,
    detail: _legacyDetail,
    outfit,
    walking,
    actorAnimation,
    action: explicitAction,
    actionProgress: explicitActionProgress,
    actionTime: explicitActionTime,
    ...state
  } = request;
  const action = explicitAction ?? actorAnimation?.action ?? null;
  const actionProgress = explicitActionProgress ?? actorAnimation?.progress;
  const actionTime = explicitActionTime ?? actorAnimation?.localTime;
  return {
    ...state,
    context,
    time,
    surface,
    ...(state.appearance === undefined && outfit !== undefined ? { appearance: outfit } : {}),
    ...(state.pose === undefined && walking ? { pose: 'walking' } : {}),
    action,
    ...(Number.isFinite(actionProgress) ? { actionProgress } : {}),
    ...(Number.isFinite(actionTime) ? { actionTime } : {}),
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
    const surface = request.surface ?? (request.detail === 'portrait' ? 'portrait' : 'world');
    return this.registry.render(
      characterId,
      surface,
      renderState(request, context, time, surface),
    );
  }

  drawPortrait(context, request = {}, time = 0) {
    return this.draw(context, {
      ...request,
      characterId: request.characterId ?? request.portraitCharacterId,
      surface: 'portrait',
    }, time);
  }

  preload(dependencies, context) {
    return this.registry.preload(dependencies, context);
  }

  release(dependencies, context) {
    return this.registry.release(dependencies, context);
  }
}
