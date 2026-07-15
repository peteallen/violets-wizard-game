const HEX_COLOR = /^#[0-9a-f]{6}$/iu;

export const PORTRAIT_CAMEO_STYLE = Object.freeze({
  shadow: 'rgba(31, 20, 18, 0.48)',
  brassDeep: '#5a3924',
  brassShadow: '#805127',
  brassBase: '#bd8439',
  brassLight: '#edca79',
  parchmentShadow: '#aa7f4c',
  parchmentBase: '#d8b879',
  parchmentLight: '#f2dda5',
  toolMark: 'rgba(82, 50, 28, 0.48)',
});

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

function finite(value, fallback, path) {
  const candidate = value ?? fallback;
  if (!Number.isFinite(candidate)) throw new TypeError(`${path} must be a finite number.`);
  return candidate;
}

function positive(value, fallback, path) {
  const candidate = finite(value, fallback, path);
  if (candidate <= 0) throw new RangeError(`${path} must be greater than zero.`);
  return candidate;
}

function hexColor(value, path) {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw new TypeError(`${path} must be a six-digit hexadecimal color.`);
  }
  return value;
}

function normalizeBackdrop(value) {
  const backdrop = plainObject(value, 'Portrait cameo backdrop');
  return Object.freeze({
    dark: hexColor(backdrop.dark, 'Portrait cameo backdrop.dark'),
    light: hexColor(backdrop.light, 'Portrait cameo backdrop.light'),
  });
}

/**
 * Character packages can retain their own portrait placement while giving the
 * shared cameo renderer only a drawing callback. The callback draws at the
 * transformed local origin and receives deterministic time and motion state.
 */
export function definePortraitCameoFigure({ placement = {}, drawFigure } = {}) {
  const source = plainObject(placement, 'Portrait cameo figure placement');
  if (typeof drawFigure !== 'function') {
    throw new TypeError('Portrait cameo figure.drawFigure must be a function.');
  }
  return Object.freeze({
    placement: Object.freeze({
      x: finite(source.x, 0, 'Portrait cameo figure placement.x'),
      y: finite(source.y, 0, 'Portrait cameo figure placement.y'),
      scale: positive(source.scale, 1, 'Portrait cameo figure placement.scale'),
    }),
    drawFigure,
  });
}

function normalizeFigure(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Portrait cameo figure must be an object.');
  }
  return definePortraitCameoFigure(value);
}

function drawingContext(value) {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    throw new TypeError('Portrait cameo rendering requires a drawing context.');
  }
  return value;
}

export function tracePortraitCameoSilhouette(context, radius = 60) {
  const safeRadius = Number.isFinite(radius) ? Math.max(1, radius) : 60;
  context.beginPath();
  context.moveTo(-safeRadius * 0.055, -safeRadius);
  context.bezierCurveTo(
    -safeRadius * 0.38, -safeRadius * 1.05,
    -safeRadius * 0.82, -safeRadius * 0.88,
    -safeRadius * 0.95, -safeRadius * 0.55,
  );
  context.bezierCurveTo(
    -safeRadius * 1.07, -safeRadius * 0.14,
    -safeRadius * 0.96, safeRadius * 0.31,
    -safeRadius * 0.86, safeRadius * 0.6,
  );
  context.bezierCurveTo(
    -safeRadius * 0.68, safeRadius * 0.89,
    -safeRadius * 0.31, safeRadius * 1.02,
    -safeRadius * 0.05, safeRadius * 1.01,
  );
  context.bezierCurveTo(
    safeRadius * 0.33, safeRadius * 1.04,
    safeRadius * 0.73, safeRadius * 0.86,
    safeRadius * 0.92, safeRadius * 0.56,
  );
  context.bezierCurveTo(
    safeRadius * 1.06, safeRadius * 0.18,
    safeRadius * 0.97, -safeRadius * 0.35,
    safeRadius * 0.86, -safeRadius * 0.63,
  );
  context.bezierCurveTo(
    safeRadius * 0.69, -safeRadius * 0.92,
    safeRadius * 0.28, -safeRadius * 1.04,
    -safeRadius * 0.055, -safeRadius,
  );
  context.closePath();
}

function traceOrganicPatch(context, x, y, radiusX, radiusY, turn = 0) {
  context.beginPath();
  context.moveTo(x - radiusX * (1 + turn * 0.08), y + radiusY * turn * 0.18);
  context.bezierCurveTo(
    x - radiusX * (0.82 - turn * 0.08),
    y - radiusY * (0.78 + turn * 0.06),
    x - radiusX * (0.22 + turn * 0.08),
    y - radiusY * (1.06 - turn * 0.05),
    x + radiusX * (0.28 - turn * 0.05),
    y - radiusY * (0.91 + turn * 0.08),
  );
  context.bezierCurveTo(
    x + radiusX * (0.84 + turn * 0.04),
    y - radiusY * (0.7 - turn * 0.08),
    x + radiusX * (1.04 - turn * 0.05),
    y - radiusY * (0.14 + turn * 0.08),
    x + radiusX * (0.91 + turn * 0.06),
    y + radiusY * (0.36 - turn * 0.05),
  );
  context.bezierCurveTo(
    x + radiusX * (0.72 - turn * 0.05),
    y + radiusY * (0.94 + turn * 0.05),
    x + radiusX * (0.08 + turn * 0.06),
    y + radiusY * (1.04 - turn * 0.03),
    x - radiusX * (0.42 - turn * 0.05),
    y + radiusY * (0.87 + turn * 0.06),
  );
  context.bezierCurveTo(
    x - radiusX * (0.92 + turn * 0.04),
    y + radiusY * (0.66 - turn * 0.06),
    x - radiusX * (1.03 - turn * 0.04),
    y + radiusY * (0.18 + turn * 0.05),
    x - radiusX * (1 + turn * 0.08),
    y + radiusY * turn * 0.18,
  );
  context.closePath();
}

function darken(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const delta = -Math.round(255 * Math.abs(amount));
  const r = Math.max(0, Math.min(255, (value >> 16) + delta));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + delta));
  const b = Math.max(0, Math.min(255, (value & 0xff) + delta));
  return `rgb(${r}, ${g}, ${b})`;
}

export function drawPortraitCameoBackdrop(context, { backdrop, reducedMotion = false } = {}, time = 0) {
  drawingContext(context);
  const { dark, light } = normalizeBackdrop(backdrop);
  const safeTime = Number.isFinite(time) ? time : 0;
  const shimmer = reducedMotion ? 0.13 : 0.13 + Math.sin(safeTime * 1.1) * 0.025;
  context.save();
  try {
    context.save();
    try {
      context.translate(1.8, 2.7);
      context.fillStyle = PORTRAIT_CAMEO_STYLE.shadow;
      tracePortraitCameoSilhouette(context, 62);
      context.fill();
    } finally {
      context.restore();
    }

    context.fillStyle = PORTRAIT_CAMEO_STYLE.brassBase;
    context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassDeep;
    context.lineWidth = 1.8;
    tracePortraitCameoSilhouette(context, 61);
    context.fill();
    context.stroke();

    context.save();
    try {
      tracePortraitCameoSilhouette(context, 61);
      context.clip();
      context.fillStyle = PORTRAIT_CAMEO_STYLE.brassLight;
      traceOrganicPatch(context, -36, -39, 43, 28, -0.2);
      context.fill();
      context.fillStyle = PORTRAIT_CAMEO_STYLE.brassShadow;
      traceOrganicPatch(context, 39, 40, 46, 34, 0.16);
      context.fill();
    } finally {
      context.restore();
    }

    context.fillStyle = PORTRAIT_CAMEO_STYLE.parchmentBase;
    tracePortraitCameoSilhouette(context, 57.5);
    context.fill();

    context.save();
    try {
      tracePortraitCameoSilhouette(context, 57.5);
      context.clip();
      context.fillStyle = PORTRAIT_CAMEO_STYLE.parchmentLight;
      traceOrganicPatch(context, -34, -37, 37, 26, -0.16);
      context.fill();
      context.fillStyle = PORTRAIT_CAMEO_STYLE.parchmentShadow;
      traceOrganicPatch(context, 36, 38, 41, 31, 0.14);
      context.fill();
    } finally {
      context.restore();
    }

    context.fillStyle = dark;
    tracePortraitCameoSilhouette(context, 55);
    context.fill();

    context.save();
    try {
      tracePortraitCameoSilhouette(context, 55);
      context.clip();
      context.save();
      try {
        context.globalAlpha = 0.58;
        context.fillStyle = light;
        traceOrganicPatch(context, -26, -29, 39, 28, -0.16);
        context.fill();
      } finally {
        context.restore();
      }
      context.fillStyle = `rgba(255,239,194,${shimmer})`;
      traceOrganicPatch(context, -24, -27, 34, 22, -0.18);
      context.fill();
      context.fillStyle = darken(dark, 0.08);
      context.globalAlpha = 0.36;
      traceOrganicPatch(context, 27, 30, 36, 22, 0.14);
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = 'rgba(255, 235, 188, 0.16)';
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(-47, 4);
      context.bezierCurveTo(-24, -4, 8, -2, 39, -13);
      context.moveTo(-38, 29);
      context.bezierCurveTo(-13, 21, 14, 28, 37, 18);
      context.stroke();
    } finally {
      context.restore();
    }
  } finally {
    context.restore();
  }
}

export function drawPortraitCameoFrame(context, { reducedMotion = false } = {}, time = 0) {
  drawingContext(context);
  const safeTime = Number.isFinite(time) ? time : 0;
  const glow = reducedMotion ? 0.7 : 0.66 + Math.sin(safeTime * 1.23) * 0.08;

  context.save();
  try {
    context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassDeep;
    context.lineWidth = 8.5;
    tracePortraitCameoSilhouette(context, 60);
    context.stroke();

    context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassBase;
    context.lineWidth = 5.2;
    tracePortraitCameoSilhouette(context, 59.5);
    context.stroke();

    context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassShadow;
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo(49, -25);
    context.bezierCurveTo(54, -5, 52, 21, 42, 37);
    context.bezierCurveTo(35, 47, 25, 52, 14, 54);
    context.stroke();

    context.strokeStyle = PORTRAIT_CAMEO_STYLE.parchmentShadow;
    context.lineWidth = 3;
    tracePortraitCameoSilhouette(context, 55.9);
    context.stroke();
    context.strokeStyle = PORTRAIT_CAMEO_STYLE.parchmentLight;
    context.lineWidth = 1.25;
    tracePortraitCameoSilhouette(context, 54.8);
    context.stroke();

    context.save();
    try {
      context.globalAlpha = glow;
      context.strokeStyle = PORTRAIT_CAMEO_STYLE.brassLight;
      context.lineWidth = 1.8;
      context.beginPath();
      context.moveTo(-49, -32);
      context.bezierCurveTo(-43, -49, -23, -58, -5, -57);
      context.bezierCurveTo(7, -59, 19, -56, 29, -51);
      context.stroke();
    } finally {
      context.restore();
    }

    context.strokeStyle = PORTRAIT_CAMEO_STYLE.toolMark;
    context.lineWidth = 1.05;
    context.beginPath();
    context.moveTo(47, -27);
    context.quadraticCurveTo(50, -21, 49, -15);
    context.moveTo(51, 11);
    context.quadraticCurveTo(49, 17, 46, 22);
    context.moveTo(30, 49);
    context.quadraticCurveTo(24, 52, 18, 53);
    context.moveTo(-34, 46);
    context.quadraticCurveTo(-39, 42, -41, 37);
    context.stroke();

    context.strokeStyle = 'rgba(255, 226, 156, 0.4)';
    context.lineWidth = 0.75;
    context.beginPath();
    context.moveTo(-50, -17);
    context.lineTo(-47, -13);
    context.moveTo(-22, -53);
    context.lineTo(-17, -54);
    context.moveTo(39, 38);
    context.lineTo(35, 42);
    context.stroke();
  } finally {
    context.restore();
  }
}

export function drawPortraitCameo(context, {
  x = 0,
  y = 0,
  scale = 1,
  backdrop,
  reducedMotion = false,
  figure,
} = {}, time = 0) {
  drawingContext(context);
  const safeX = finite(x, 0, 'Portrait cameo x');
  const safeY = finite(y, 0, 'Portrait cameo y');
  const safeScale = positive(scale, 1, 'Portrait cameo scale');
  const safeTime = Number.isFinite(time) ? time : 0;
  const safeReducedMotion = Boolean(reducedMotion);
  const safeBackdrop = normalizeBackdrop(backdrop);
  const safeFigure = normalizeFigure(figure);
  let result;

  context.save();
  try {
    context.translate(safeX, safeY);
    context.scale(safeScale, safeScale);
    drawPortraitCameoBackdrop(context, {
      backdrop: safeBackdrop,
      reducedMotion: safeReducedMotion,
    }, safeTime);

    context.save();
    try {
      tracePortraitCameoSilhouette(context, 55);
      context.clip();
      context.save();
      try {
        const { placement } = safeFigure;
        context.translate(placement.x, placement.y);
        context.scale(placement.scale, placement.scale);
        result = safeFigure.drawFigure(context, Object.freeze({
          time: safeTime,
          reducedMotion: safeReducedMotion,
        }));
      } finally {
        context.restore();
      }
    } finally {
      context.restore();
    }

    drawPortraitCameoFrame(context, { reducedMotion: safeReducedMotion }, safeTime);
  } finally {
    context.restore();
  }
  return result;
}

export class PortraitCameoRenderer {
  draw(context, presentation = {}, time = 0) {
    return drawPortraitCameo(context, presentation, time);
  }
}
