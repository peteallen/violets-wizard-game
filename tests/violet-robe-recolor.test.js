import { describe, expect, it, vi } from 'vitest';
import {
  VIOLET_ROBE_FRAME_SIZE,
  VioletRobeRecolorer,
  parseHexColor,
} from '../src/game/characters/violet/robeRecolor.js';

const { width, height } = VIOLET_ROBE_FRAME_SIZE;
const PIXEL_COUNT = width * height;

function frameSource() {
  return { complete: true, naturalWidth: width, naturalHeight: height };
}

function canvasHarness(colors) {
  const data = new Uint8ClampedArray(PIXEL_COUNT * 4);
  colors.forEach((color, index) => data.set(color, index * 4));
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data })),
    putImageData: vi.fn(),
  };
  const canvas = { width, height, getContext: vi.fn(() => context) };
  return { canvas, context, data };
}

function rgbToHsl([sourceRed, sourceGreen, sourceBlue]) {
  const red = sourceRed / 255;
  const green = sourceGreen / 255;
  const blue = sourceBlue / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  const lightness = (max + min) / 2;
  if (!chroma) return { hue: 0, saturation: 0, lightness };
  let hue;
  if (max === red) hue = 60 * (((green - blue) / chroma) % 6);
  else if (max === green) hue = 60 * (((blue - red) / chroma) + 2);
  else hue = 60 * (((red - green) / chroma) + 4);
  if (hue < 0) hue += 360;
  return {
    hue,
    saturation: chroma / (1 - Math.abs((2 * lightness) - 1)),
    lightness,
  };
}

describe('Violet robe trim color parsing', () => {
  it('normalizes short, mixed-case and padded opaque hex colors', () => {
    expect(parseHexColor('  #AbC ')).toEqual({
      hex: '#aabbcc', red: 170, green: 187, blue: 204,
    });
    expect(parseHexColor('#4E83B7')).toEqual({
      hex: '#4e83b7', red: 78, green: 131, blue: 183,
    });
  });

  it.each([null, '', '4e83b7', '#12', '#1234', '#12345g', '#11223344']) (
    'rejects unsupported target color %j',
    (value) => expect(() => parseHexColor(value)).toThrow(/hex color|#rgb/iu),
  );
});

describe('Violet robe trim recoloring', () => {
  it('remaps purple trim hue and saturation while preserving lightness and alpha', () => {
    const sourceColors = [
      [95, 54, 143, 255],
      [122, 79, 152, 91],
      [114, 84, 148, 208],
    ];
    const harness = canvasHarness(sourceColors);
    const canvasFactory = vi.fn(() => harness.canvas);
    const recolorer = new VioletRobeRecolorer({ canvasFactory });
    const source = frameSource();

    expect(recolorer.recolor(source, '#3f8c88')).toBe(harness.canvas);
    expect(canvasFactory).toHaveBeenCalledWith(width, height);
    expect(harness.context.drawImage).toHaveBeenCalledWith(source, 0, 0, width, height);
    expect(harness.context.putImageData).toHaveBeenCalledTimes(1);

    sourceColors.forEach((sourceColor, index) => {
      const result = [...harness.data.slice(index * 4, (index * 4) + 4)];
      const sourceHsl = rgbToHsl(sourceColor);
      const resultHsl = rgbToHsl(result);
      const targetHsl = rgbToHsl([63, 140, 136]);
      expect(resultHsl.hue).toBeCloseTo(targetHsl.hue, 0);
      expect(resultHsl.saturation).toBeCloseTo(targetHsl.saturation, 1);
      expect(resultHsl.lightness).toBeCloseTo(sourceHsl.lightness, 2);
      expect(result[3]).toBe(sourceColor[3]);
    });
  });

  it('leaves robe blue-black, hair, skin, ink, white cloth, and transparent pixels unchanged', () => {
    const protectedColors = [
      [32, 45, 55, 255],
      [28, 48, 57, 255],
      [92, 61, 40, 255],
      [205, 140, 110, 255],
      [12, 9, 19, 255],
      [209, 201, 205, 255],
      [4, 251, 255, 0],
    ];
    const harness = canvasHarness(protectedColors);
    const recolorer = new VioletRobeRecolorer({ canvasFactory: () => harness.canvas });

    recolorer.recolor(frameSource(), '#d4a944');

    protectedColors.forEach((color, index) => {
      expect([...harness.data.slice(index * 4, (index * 4) + 4)]).toEqual(color);
    });
  });

  it('caches by source identity and normalized target color', () => {
    const first = canvasHarness([[95, 54, 143, 255]]);
    const second = canvasHarness([[95, 54, 143, 255]]);
    const third = canvasHarness([[95, 54, 143, 255]]);
    const canvases = [first.canvas, second.canvas, third.canvas];
    const canvasFactory = vi.fn(() => canvases.shift());
    const recolorer = new VioletRobeRecolorer({ canvasFactory });
    const source = frameSource();
    const anotherSource = frameSource();

    expect(recolorer.recolor(source, '#ABC')).toBe(first.canvas);
    expect(recolorer.recolor(source, '#aabbcc')).toBe(first.canvas);
    expect(recolorer.recolor(source, '#b95873')).toBe(second.canvas);
    expect(recolorer.recolor(anotherSource, '#aabbcc')).toBe(third.canvas);
    expect(canvasFactory).toHaveBeenCalledTimes(3);
  });

  it('rejects unloaded, mis-sized, or unreadable sources before caching output', () => {
    const canvasFactory = vi.fn(() => ({ width, height, getContext: () => null }));
    const recolorer = new VioletRobeRecolorer({ canvasFactory });

    expect(() => recolorer.recolor({ complete: false, naturalWidth: 0, naturalHeight: 0 }, '#abc'))
      .toThrow('must be loaded');
    expect(() => recolorer.recolor({ width: 10, height: 10 }, '#abc'))
      .toThrow(`${width} x ${height}`);
    expect(() => recolorer.recolor(frameSource(), '#abc')).toThrow('readable 2D context');
  });
});
