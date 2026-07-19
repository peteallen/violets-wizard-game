import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import {
  applyAlignedAlphaMask,
  buildAlignedCharacterAssets,
  CHARACTER_WEBP_COMPOSITE_BACKGROUNDS,
  CHARACTER_WEBP_ENCODING,
  deriveAlphaEdgeDistances,
  deriveCharacterWebpShippingPath,
  deriveCyanAlphaMask,
  deriveOpaqueEdgeDonors,
  deriveTransparentBackgroundColor,
  validateAlignedCharacterAssetSpec,
} from '../scripts/extract-aligned-character-assets.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SPEC_PATH = 'art/characters/violet/runtime-approved.json';

describe('aligned character asset extraction', () => {
  it('keeps approved sources and production destinations hash-pinned and inside their lanes', async () => {
    const spec = JSON.parse(await readFile(resolve(ROOT, SPEC_PATH), 'utf8'));
    expect(validateAlignedCharacterAssetSpec(spec)).toBe(spec);
    expect(Object.keys(spec.variants)).toEqual([
      'neutral', 'blink', 'talk-a', 'talk-b', 'wonder', 'proud', 'curious',
    ]);
    expect(deriveCharacterWebpShippingPath(spec.variants.neutral.output)).toBe(
      'public/assets/art/characters/violet/casual/neutral.webp',
    );
    expect(CHARACTER_WEBP_ENCODING).toEqual({
      command: 'cwebp',
      arguments: ['-lossless', '-z', '9', '-quiet'],
    });
    expect(CHARACTER_WEBP_COMPOSITE_BACKGROUNDS).toEqual([
      { name: 'black', rgb: [0, 0, 0] },
      { name: 'white', rgb: [255, 255, 255] },
      { name: 'saturated-magenta', rgb: [255, 0, 255] },
    ]);

    const escaping = structuredClone(spec);
    escaping.variants.neutral.output = 'public/assets/art/rooms/not-a-character.png';
    expect(() => validateAlignedCharacterAssetSpec(escaping)).toThrow(
      'must stay under public/assets/art/characters',
    );
  });

  it('keeps alpha, visible RGB, and rendered WebP pixels exact', async () => {
    const result = await buildAlignedCharacterAssets(SPEC_PATH, { check: true });
    expect(result.canvas).toEqual({ width: 896, height: 1200 });
    expect(result.mask).toEqual({
      transparentPixels: 828199,
      softPixels: 10455,
      opaquePixels: 236546,
      spillSuppressedPixels: 35440,
      matteRemovedPixels: 32729,
      matteHardenedPixels: 4163,
      bounds: { x: 247, y: 93, width: 390, height: 1036 },
      background: [5, 249, 252],
    });
    expect(result.outputs).toHaveLength(7);
    expect(result.outputs.every(({ status }) => status === 'current')).toBe(true);
    expect(result.outputs.every(({ output }) => output.endsWith('.webp'))).toBe(true);
    for (const { verification } of result.outputs) {
      expect(verification).toMatchObject({
        alpha: 'exact',
        visibleRgb: 'exact',
        compositeBackgrounds: ['black', 'white', 'saturated-magenta'],
      });
    }
  }, 60_000);

  it('keeps interior opaque art exact, despills the edge band, and aligns every accepted expression', async () => {
    const spec = JSON.parse(await readFile(resolve(ROOT, SPEC_PATH), 'utf8'));
    const sources = new Map();
    for (const [name, variant] of Object.entries(spec.variants)) {
      sources.set(name, PNG.sync.read(await readFile(resolve(ROOT, variant.source))));
    }
    const mask = deriveCyanAlphaMask(sources.get(spec.alpha.maskSource), spec.alpha);
    const background = deriveTransparentBackgroundColor(
      sources.get(spec.alpha.maskSource),
      mask.alpha,
    );
    const donors = deriveOpaqueEdgeDonors(sources.get(spec.alpha.maskSource), mask.alpha);
    const sharedEdgeDistances = deriveAlphaEdgeDistances(
      mask.alpha,
      spec.canvas.width,
      spec.canvas.height,
    );
    let canonicalAlpha = null;

    for (const [name] of Object.entries(spec.variants)) {
      const source = sources.get(name);
      const output = applyAlignedAlphaMask(
        source,
        mask.alpha,
        background,
        donors,
        sharedEdgeDistances,
        spec.alpha.edgeColorRadius,
      );
      expect([output.width, output.height]).toEqual([source.width, source.height]);

      const alpha = Buffer.alloc(output.width * output.height);
      for (let pixel = 0; pixel < alpha.length; pixel += 1) alpha[pixel] = output.data[pixel * 4 + 3];
      const edgeDistances = deriveAlphaEdgeDistances(alpha, output.width, output.height);
      let edgeOpaqueRgbChanges = 0;
      let interiorOpaqueRgbMismatches = 0;
      let softRgbChanges = 0;
      let visibleCyanSpillPixels = 0;
      for (let pixel = 0; pixel < alpha.length; pixel += 1) {
        const offset = pixel * 4;
        const outputAlpha = output.data[offset + 3];
        const rgbChanged = (
          output.data[offset] !== source.data[offset]
          || output.data[offset + 1] !== source.data[offset + 1]
          || output.data[offset + 2] !== source.data[offset + 2]
        );
        if (outputAlpha === 255 && rgbChanged && edgeDistances[pixel] <= spec.alpha.edgeColorRadius) {
          edgeOpaqueRgbChanges += 1;
        }
        if (outputAlpha === 255 && rgbChanged && edgeDistances[pixel] > spec.alpha.edgeColorRadius) {
          interiorOpaqueRgbMismatches += 1;
        }
        if (outputAlpha > 0 && outputAlpha < 255 && rgbChanged) softRgbChanges += 1;
        if (
          outputAlpha > 0
          && edgeDistances[pixel] <= spec.alpha.edgeColorRadius
          && (
            (
              output.data[offset + 1] > output.data[offset] + 5
              && output.data[offset + 2] > output.data[offset] + 5
              && Math.abs(output.data[offset + 1] - output.data[offset + 2]) <= 70
            )
            || (
              output.data[offset + 1] > output.data[offset] + 5
              && output.data[offset + 2] < output.data[offset + 1]
            )
          )
        ) visibleCyanSpillPixels += 1;
      }
      expect(edgeOpaqueRgbChanges).toBeGreaterThan(0);
      expect(interiorOpaqueRgbMismatches).toBe(0);
      expect(softRgbChanges).toBeGreaterThan(0);
      expect(visibleCyanSpillPixels).toBe(0);
      if (canonicalAlpha === null) canonicalAlpha = alpha;
      else expect(alpha.equals(canonicalAlpha)).toBe(true);
    }
  });
});
