const FRAME_WIDTH = 896;
const FRAME_HEIGHT = 1200;
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/iu;

const SOURCE_VIOLET = Object.freeze({
  minHue: 242,
  maxHue: 294,
  minSaturation: 0.09,
  minLightness: 0.09,
  maxLightness: 0.93,
  minChroma: 10 / 255,
});

export const VIOLET_ROBE_FRAME_SIZE = Object.freeze({
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
});

export function parseHexColor(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Robe trim color must be a hex color string.');
  }
  const candidate = value.trim().toLowerCase();
  if (!HEX_COLOR.test(candidate)) {
    throw new TypeError('Robe trim color must use #rgb or #rrggbb format.');
  }
  const compact = candidate.slice(1);
  const expanded = compact.length === 3
    ? [...compact].map((digit) => `${digit}${digit}`).join('')
    : compact;
  return Object.freeze({
    hex: `#${expanded}`,
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  });
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lightness = (max + min) / 2;
  if (chroma === 0) return { hue: 0, saturation: 0, lightness, chroma };

  let hue;
  if (max === r) hue = 60 * (((g - b) / chroma) % 6);
  else if (max === g) hue = 60 * (((b - r) / chroma) + 2);
  else hue = 60 * (((r - g) / chroma) + 4);
  if (hue < 0) hue += 360;

  return {
    hue,
    saturation: chroma / (1 - Math.abs((2 * lightness) - 1)),
    lightness,
    chroma,
  };
}

function hueToRgb(p, q, sourceT) {
  let t = sourceT;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + ((q - p) * 6 * t);
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + ((q - p) * ((2 / 3) - t) * 6);
  return p;
}

function hslToRgb(hue, saturation, lightness) {
  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return [channel, channel, channel];
  }
  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - (lightness * saturation);
  const p = (2 * lightness) - q;
  const h = hue / 360;
  return [
    Math.round(hueToRgb(p, q, h + (1 / 3)) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - (1 / 3)) * 255),
  ];
}

function isSourceViolet({ hue, saturation, lightness, chroma }) {
  return hue >= SOURCE_VIOLET.minHue
    && hue <= SOURCE_VIOLET.maxHue
    && saturation >= SOURCE_VIOLET.minSaturation
    && lightness >= SOURCE_VIOLET.minLightness
    && lightness <= SOURCE_VIOLET.maxLightness
    && chroma >= SOURCE_VIOLET.minChroma;
}

function sourceDimensions(source) {
  if (!source || (typeof source !== 'object' && typeof source !== 'function')) {
    throw new TypeError('Robe frame source must be an image or canvas-like object.');
  }
  if ('complete' in source && source.complete === false) {
    throw new TypeError('Robe frame source must be loaded before recoloring.');
  }
  const usesNaturalSize = 'naturalWidth' in source || 'naturalHeight' in source;
  const width = usesNaturalSize ? source.naturalWidth : source.width;
  const height = usesNaturalSize ? source.naturalHeight : source.height;
  if (width !== FRAME_WIDTH || height !== FRAME_HEIGHT) {
    throw new RangeError(`Robe frame source must be a loaded ${FRAME_WIDTH} x ${FRAME_HEIGHT} image.`);
  }
  return { width, height };
}

function defaultCanvasFactory(width, height) {
  if (globalThis.document?.createElement) {
    const canvas = globalThis.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof globalThis.OffscreenCanvas === 'function') {
    return new globalThis.OffscreenCanvas(width, height);
  }
  return null;
}

export class VioletRobeRecolorer {
  constructor({ canvasFactory = defaultCanvasFactory } = {}) {
    if (typeof canvasFactory !== 'function') {
      throw new TypeError('canvasFactory must be a function.');
    }
    this.canvasFactory = canvasFactory;
    this.cache = new WeakMap();
  }

  recolor(source, targetHex) {
    const target = parseHexColor(targetHex);
    const { width, height } = sourceDimensions(source);
    const sourceCache = this.cache.get(source);
    if (sourceCache?.has(target.hex)) return sourceCache.get(target.hex);

    const canvas = this.canvasFactory(width, height);
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new TypeError('canvasFactory must return a canvas-like object.');
    }
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context
      || typeof context.drawImage !== 'function'
      || typeof context.getImageData !== 'function'
      || typeof context.putImageData !== 'function') {
      throw new TypeError('Recolor canvas must provide a readable 2D context.');
    }

    context.drawImage(source, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData?.data;
    if (!pixels || pixels.length !== width * height * 4) {
      throw new TypeError('Recolor canvas returned invalid frame pixel data.');
    }
    const targetHsl = rgbToHsl(target.red, target.green, target.blue);

    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] === 0) continue;
      const sourceHsl = rgbToHsl(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
      if (!isSourceViolet(sourceHsl)) continue;
      const [red, green, blue] = hslToRgb(
        targetHsl.hue,
        targetHsl.saturation,
        sourceHsl.lightness,
      );
      pixels[offset] = red;
      pixels[offset + 1] = green;
      pixels[offset + 2] = blue;
    }

    context.putImageData(imageData, 0, 0);
    const cache = sourceCache ?? new Map();
    cache.set(target.hex, canvas);
    if (!sourceCache) this.cache.set(source, cache);
    return canvas;
  }
}

export const violetRobeRecolorer = new VioletRobeRecolorer();

export function recolorVioletRobeFrame(source, targetHex) {
  return violetRobeRecolorer.recolor(source, targetHex);
}
