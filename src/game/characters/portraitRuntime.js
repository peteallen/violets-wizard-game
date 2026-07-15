import {
  PortraitCameoRenderer,
  definePortraitCameoFigure,
} from '../render/PortraitCameoRenderer.js';

function plainObject(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be a plain object.`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${path} must be a plain object.`);
  }
  return value;
}

function immutablePresentation({ backdrop, figure } = {}) {
  plainObject(backdrop, 'Character portrait backdrop');
  plainObject(figure, 'Character portrait figure placement');
  return Object.freeze({
    backdrop: Object.freeze({ ...backdrop }),
    figure: Object.freeze({ ...figure }),
  });
}

/**
 * Adapts one package-owned portrait figure to the shared cameo surround. The
 * adapter has no identity table: backdrop, placement, and state normalization
 * remain explicit inputs supplied by the character package that owns them.
 */
export function defineCharacterPortraitPresentation(source) {
  return immutablePresentation(source);
}

export function createCharacterPortraitRenderer({
  presentation,
  drawFigure,
  prepareFigureState = (state) => state,
} = {}) {
  const normalizedPresentation = immutablePresentation(presentation);
  if (typeof drawFigure !== 'function') {
    throw new TypeError('Character portrait drawFigure must be a function.');
  }
  if (typeof prepareFigureState !== 'function') {
    throw new TypeError('Character portrait prepareFigureState must be a function.');
  }
  const cameoRenderer = new PortraitCameoRenderer();

  return function renderCharacterPortrait(request) {
    const source = plainObject(request, 'Character portrait render request');
    const {
      context,
      time = 0,
      x = 0,
      y = 0,
      scale = 1,
      reducedMotion = false,
      ...figureSource
    } = source;
    const figureState = plainObject(prepareFigureState(Object.freeze({
      ...figureSource,
      reducedMotion: Boolean(reducedMotion),
    })), 'Prepared character portrait figure state');
    const figure = definePortraitCameoFigure({
      // Existing figure renderers apply motion before their local scale. Pass
      // the legacy placement through their request so bob, hop, and frame
      // offsets retain the same amplitude instead of being scaled twice by an
      // enclosing Canvas transform.
      placement: { x: 0, y: 0, scale: 1 },
      drawFigure: (figureContext, frame) => drawFigure(Object.freeze({
        ...figureState,
        context: figureContext,
        time: frame.time,
        x: normalizedPresentation.figure.x,
        y: normalizedPresentation.figure.y,
        scale: normalizedPresentation.figure.scale,
      })),
    });

    return cameoRenderer.draw(context, {
      x,
      y,
      scale,
      backdrop: normalizedPresentation.backdrop,
      reducedMotion,
      figure,
    }, time);
  };
}
