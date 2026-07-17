import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

import { beforeAll, describe, expect, it, vi } from 'vitest';

import { assetManifest, resolveAsset } from '../src/game/core/assetManifest.js';
import {
  CHAPTER_THREE_PROP_ASSET_KEYS,
  drawChapterThreeTargetProps,
} from '../src/game/render/ChapterThreePropRenderer.js';

const SPEC_URL = new URL('../art/chapters/ch3/props/core-v1.processing.json', import.meta.url);
const METADATA_URL = new URL(
  '../art/chapters/ch3/props/core-v1.processing.metadata.json',
  import.meta.url,
);
const REFLECTED_EYES_REPLACEMENT_URL = new URL(
  '../art/chapters/ch3/props/edits/reflected-eyes-v2.metadata.json',
  import.meta.url,
);

const EXPECTED = Object.freeze([
  ['spellbook-parcel', 660, 570, 220, 190],
  ['lantern', 472, 616, 118, 154],
  ['feather', 736, 384, 184, 96],
  ['wet-footprints', 880, 432, 220, 108],
  ['ribbon-clue', 608, 368, 152, 92],
  ['reflected-eyes', 384, 232, 96, 58],
  ['torn-book', 656, 448, 164, 112],
  ['toad-token', 432, 432, 108, 108],
  ['sleeping-star', 432, 432, 70, 70],
]);

let spec;
let metadata;
let reflectedEyesReplacement;

beforeAll(async () => {
  const [specText, metadataText, replacementText] = await Promise.all([
    readFile(SPEC_URL, 'utf8'),
    readFile(METADATA_URL, 'utf8'),
    readFile(REFLECTED_EYES_REPLACEMENT_URL, 'utf8'),
  ]);
  spec = JSON.parse(specText);
  metadata = JSON.parse(metadataText);
  reflectedEyesReplacement = JSON.parse(replacementText);
});

describe('Chapter Three production prop assets', () => {
  it('records the reviewed gutter isolation without remapping the generated request order', () => {
    const expectedIds = EXPECTED.map(([id]) => id);

    expect(spec.request.order).toEqual(expectedIds);
    expect(spec.assets.map(({ id }) => id)).toEqual(expectedIds);
    expect(metadata.request.order).toEqual(expectedIds);
    expect(metadata.assets.map(({ id }) => id)).toEqual(expectedIds);
    expect(metadata.source).toMatchObject({
      path: 'art/chapters/ch3/props/batch/core-v1.png',
      dimensions: [1536, 1024],
      sha256: 'd16a9b4254590ef7c0dd41646f15096cbdcb33fb487dcea3d88b98a27650f31b',
    });
    expect(metadata.grid.accepted_gutter_boundaries).toEqual({
      x: [0, 557, 979, 1536],
      y: [0, 391, 669, 1024],
    });
    expect(metadata.grid.verified_empty_gutters.every(
      ({ visible_alpha_pixels: visibleAlphaPixels }) => visibleAlphaPixels === 0,
    )).toBe(true);
    expect(metadata.grid.retained_component_count).toBe(12);
    expect(metadata.assets.map(({ components }) => components.length)).toEqual([
      1, 1, 1, 4, 1, 1, 1, 1, 1,
    ]);

    for (const [index, record] of metadata.assets.entries()) {
      expect(record.crop).toEqual(spec.assets[index].crop);
      expect(record.source_alpha_bounds[0]).toBeGreaterThan(record.crop.x);
      expect(record.source_alpha_bounds[1]).toBeGreaterThan(record.crop.y);
      expect(record.source_alpha_bounds[2]).toBeLessThan(
        record.crop.x + record.crop.width,
      );
      expect(record.source_alpha_bounds[3]).toBeLessThan(
        record.crop.y + record.crop.height,
      );
      expect(record.placement.aspect_preserved).toBe(true);
    }
  });

  it('ships exactly the nine hashed WebP canvases from their accepted provenance', async () => {
    for (const [index, [id, width, height]] of EXPECTED.entries()) {
      const assetSpec = spec.assets[index];
      const record = metadata.assets[index];
      const outputUrl = new URL(`../${assetSpec.output}`, import.meta.url);
      const bytes = await readFile(outputUrl);
      const information = await stat(outputUrl);
      const hash = createHash('sha256').update(bytes).digest('hex');

      expect(assetSpec).toMatchObject({
        id,
        key: `props/ch3/${id}`,
        output: `public/assets/art/props/ch3/${id}.webp`,
        canvas: { width, height },
      });
      const acceptedOutput = id === 'reflected-eyes'
        ? {
            ...reflectedEyesReplacement.candidate,
            path: reflectedEyesReplacement.promotion.path,
            bytes: reflectedEyesReplacement.promotion.bytes,
            sha256: reflectedEyesReplacement.promotion.sha256,
          }
        : record.output;
      expect(acceptedOutput).toMatchObject({
        path: assetSpec.output,
        dimensions: [width, height],
        bytes: information.size,
        sha256: hash,
      });
      expect(acceptedOutput.alpha.extrema).toEqual([0, 255]);
      expect(acceptedOutput.alpha.opaque_pixels).toBeGreaterThan(0);
      expect(acceptedOutput.alpha.partially_transparent_pixels).toBeGreaterThan(0);
      expect(acceptedOutput.alpha.transparent_pixels).toBeGreaterThan(0);
      expect(Object.values(acceptedOutput.alpha.corner_alpha_extrema)).toEqual([
        [0, 0], [0, 0], [0, 0], [0, 0],
      ]);
      expect(acceptedOutput.alpha.visible_cyan_pixels_above_threshold).toBe(0);
      expect(acceptedOutput.alpha.maximum_soft_edge_expansion).toBeLessThanOrEqual(
        assetSpec.maximum_soft_edge_expansion,
      );

      if (id === 'reflected-eyes') {
        expect(reflectedEyesReplacement).toMatchObject({
          status: 'accepted production replacement',
          shipping_asset: {
            path: assetSpec.output,
            replaced_sha256: record.output.sha256,
            sha256: hash,
          },
          review: { result: 'accepted' },
          promotion: {
            source: reflectedEyesReplacement.candidate.path,
            path: assetSpec.output,
            sha256: hash,
          },
        });
        expect(hash).not.toBe(record.output.sha256);
      }
    }
  });

  it('resolves the metadata canvases through the Chapter Three presentation contract', () => {
    const targetAssets = EXPECTED.slice(0, -1);
    const records = new Map(metadata.assets.map((record) => [record.key, record]));
    const drawImage = vi.fn();
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      drawImage,
    };
    const targets = targetAssets.map(([id], index) => ({
      id: `target.${id}`,
      presentation: { icon: `props/ch3/${id}` },
      hitArea: { shape: 'rect', x: index * 100, y: 200, width: 80, height: 80 },
    }));

    expect(CHAPTER_THREE_PROP_ASSET_KEYS).toEqual(
      targetAssets.map(([id]) => `props/ch3/${id}`),
    );
    expect(drawChapterThreeTargetProps(context, {
      state: { targets },
      imageFor: (key) => {
        const [naturalWidth, naturalHeight] = records.get(key).output.dimensions;
        return { complete: true, naturalWidth, naturalHeight };
      },
    })).toBe(true);
    expect(drawImage).toHaveBeenCalledTimes(targetAssets.length);

    for (const [index, [id, width, height, drawWidth, drawHeight]] of targetAssets.entries()) {
      const key = `props/ch3/${id}`;
      const entry = assetManifest[key];
      const call = drawImage.mock.calls[index];
      expect(entry).toEqual({
        path: `assets/art/props/ch3/${id}.webp`,
        kind: 'image',
        chapter: 'ch3',
      });
      expect(resolveAsset(key)).toMatch(new RegExp(`assets/art/props/ch3/${id}\\.webp$`, 'u'));
      expect(call.slice(-2)).toEqual([drawWidth, drawHeight]);
      expect(width / drawWidth).toBe(height / drawHeight);
      expect(width / drawWidth).toBeGreaterThanOrEqual(3);
    }

    const sleepingStar = assetManifest['props/ch3/sleeping-star'];
    expect(sleepingStar).toEqual({
      path: 'assets/art/props/ch3/sleeping-star.webp',
      kind: 'image',
      chapter: 'ch3',
    });
    expect(metadata.assets.at(-1).output.dimensions).toEqual([432, 432]);
  });
});
