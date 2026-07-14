import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import {
  buildAlignedCharacterAssets,
  deriveAlphaEdgeDistances,
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

    const escaping = structuredClone(spec);
    escaping.variants.neutral.output = 'public/assets/art/rooms/not-a-character.png';
    expect(() => validateAlignedCharacterAssetSpec(escaping)).toThrow(
      'must stay under public/assets/art/characters',
    );
  });

  it('rebuilds the committed full-canvas RGBA assets byte-for-byte', async () => {
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
  });

  it('keeps interior opaque art exact, despills the edge band, and aligns every accepted expression', async () => {
    const spec = JSON.parse(await readFile(resolve(ROOT, SPEC_PATH), 'utf8'));
    let canonicalAlpha = null;

    for (const variant of Object.values(spec.variants)) {
      const source = PNG.sync.read(await readFile(resolve(ROOT, variant.source)));
      const output = PNG.sync.read(await readFile(resolve(ROOT, variant.output)));
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
