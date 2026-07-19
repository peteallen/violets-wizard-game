import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { productionCharacterCatalog } from '../src/game/characters/productionCatalog.js';
import {
  buildCharacterWebpBaseline,
  deriveCharacterPixelInvariant,
  parseLosslessWebp,
  validateCharacterWebpBaseline,
  verifyCharacterWebpBaseline,
} from '../scripts/character-webp.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const BASELINE_PATH = resolve(ROOT, 'scripts/character-webp-integrity.json');

describe('shipping character WebP integrity', () => {
  it('covers the exact current production catalog with 78 lossless-WebP records', async () => {
    const baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8'));
    const catalogPaths = Object.values(productionCharacterCatalog.assets)
      .map(({ path }) => path)
      .sort();

    expect(validateCharacterWebpBaseline(baseline)).toBe(baseline);
    expect(catalogPaths).toHaveLength(78);
    expect(Object.keys(baseline.frames).sort()).toEqual(catalogPaths);
    expect(catalogPaths.every((path) => path.endsWith('.webp'))).toBe(true);
  });

  it('parses the committed files as static 896x1200 VP8L images with alpha', async () => {
    const path = resolve(ROOT, 'public/assets/art/characters/violet/casual/neutral.webp');
    expect(parseLosslessWebp(await readFile(path), path)).toEqual({
      width: 896,
      height: 1200,
      hasAlpha: true,
    });

    const corrupted = Buffer.from(await readFile(path));
    corrupted.write('VP8 ', 12, 'ascii');
    expect(() => parseLosslessWebp(corrupted, 'corrupted frame')).toThrow(
      'must contain one lossless VP8L payload',
    );
  });

  it('ignores hidden transparent RGB but pins alpha, visible RGB, and composites', () => {
    const first = Buffer.from([
      12, 34, 56, 0,
      90, 80, 70, 128,
    ]);
    const hiddenRgbChanged = Buffer.from([
      255, 1, 200, 0,
      90, 80, 70, 128,
    ]);
    const visibleRgbChanged = Buffer.from(hiddenRgbChanged);
    visibleRgbChanged[4] = 91;

    const expected = deriveCharacterPixelInvariant(first, { width: 2, height: 1 });
    expect(deriveCharacterPixelInvariant(hiddenRgbChanged, { width: 2, height: 1 })).toEqual(expected);
    expect(deriveCharacterPixelInvariant(visibleRgbChanged, { width: 2, height: 1 })).not.toEqual(expected);
  });

  it('reports stale path sets and changed per-frame invariants', async () => {
    const path = 'assets/art/characters/test/default/neutral.webp';
    const record = integrityRecord('a');
    const baseline = await buildCharacterWebpBaseline({
      publicRoot: '/unused',
      characterPaths: [path],
      inspect: async () => record,
    });
    expect(await verifyCharacterWebpBaseline({
      publicRoot: '/unused',
      characterPaths: [path],
      baseline,
      inspect: async () => record,
    })).toEqual([]);

    const changed = integrityRecord('b');
    expect(await verifyCharacterWebpBaseline({
      publicRoot: '/unused',
      characterPaths: [path],
      baseline,
      inspect: async () => changed,
    })).toContainEqual(expect.stringContaining('visible_rgba_sha256'));
    expect(await verifyCharacterWebpBaseline({
      publicRoot: '/unused',
      characterPaths: ['assets/art/characters/test/default/blink.webp'],
      baseline,
      inspect: async () => record,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining('baseline is missing'),
      expect.stringContaining('baseline has stale frame'),
    ]));

    expect(await verifyCharacterWebpBaseline({
      publicRoot: '/unused',
      characterPaths: [path],
      baseline: null,
      inspect: async () => record,
    })).toEqual([
      expect.stringContaining('invalid character WebP baseline'),
    ]);
  });
});

function integrityRecord(digit) {
  const digest = digit.repeat(64);
  return Object.freeze({
    bytes: 2048,
    container_sha256: digest,
    alpha_sha256: digest,
    visible_rgba_sha256: digest,
    composite_sha256: Object.freeze({
      black: digest,
      white: digest,
      'saturated-magenta': digest,
    }),
  });
}
