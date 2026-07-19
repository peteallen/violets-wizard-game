import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import {
  repairLowAlphaRedEdgeArtifacts,
  renderCharacterFrame,
  runCharacterSheetSlice,
  validateCharacterSheetSpec,
} from '../scripts/slice-character-sheet.mjs';
import { deriveCharacterPixelInvariant } from '../scripts/character-webp.mjs';

describe('batch character-sheet slicer', () => {
  it('repairs only low-alpha saturated red edge artifacts from opaque art donors', () => {
    const png = new PNG({ width: 3, height: 1, colorType: 6 });
    png.data.set([
      255, 0, 0, 96,
      112, 73, 45, 255,
      210, 35, 30, 255,
    ]);
    const alpha = new Uint8Array([96, 255, 255]);
    const donors = new Int32Array([1, -1, -1]);
    const distances = new Uint16Array([1, 2, 2]);

    expect(repairLowAlphaRedEdgeArtifacts(png, alpha, donors, distances)).toBe(1);
    expect([...png.data.slice(0, 4)]).toEqual([112, 73, 45, 96]);
    expect([...png.data.slice(8, 12)]).toEqual([210, 35, 30, 255]);

    const isolated = new PNG({ width: 1, height: 1, colorType: 6 });
    isolated.data.set([170, 20, 5, 60]);
    expect(repairLowAlphaRedEdgeArtifacts(
      isolated,
      new Uint8Array([60]),
      new Int32Array([-1]),
      new Uint16Array([1]),
    )).toBe(1);
    expect([...isolated.data]).toEqual([0, 0, 0, 0]);
  });

  it('validates a versioned semantic layout with one common scale and canvas anchor', async () => {
    const fixture = await createFixture();
    expect(validateCharacterSheetSpec(fixture.spec)).toBe(fixture.spec);

    const duplicate = structuredClone(fixture.spec);
    duplicate.frames[1].name = duplicate.frames[0].name;
    expect(() => validateCharacterSheetSpec(duplicate)).toThrow('duplicates idle');

    const perFrameScale = structuredClone(fixture.spec);
    perFrameScale.frames[0].scale = { numerator: 1, denominator: 1 };
    expect(() => validateCharacterSheetSpec(perFrameScale)).toThrow(
      'keys must be exactly: crop, name, overlap',
    );
  });

  it('flood-keys, keeps the character and nearby detail, removes debris, and emits aligned deterministic frames', async () => {
    const first = await createFixture();
    const second = await createFixture();
    const firstResult = await runCharacterSheetSlice({
      specPath: first.specPath,
      repoRoot: first.root,
      encodeFrame: fixtureWebpEncoder,
    });
    const secondResult = await runCharacterSheetSlice({
      specPath: second.specPath,
      repoRoot: second.root,
      encodeFrame: fixtureWebpEncoder,
    });

    expect(firstResult.outputs.map(({ name }) => name)).toEqual(['idle', 'step-right']);
    expect(firstResult.outputs.map(({ sha256 }) => sha256)).toEqual(
      secondResult.outputs.map(({ sha256 }) => sha256),
    );
    for (const output of firstResult.outputs) {
      const firstBytes = await readFile(join(first.root, output.path));
      const secondBytes = await readFile(join(second.root, output.path));
      expect(firstBytes.equals(secondBytes)).toBe(true);
      expect(hash(firstBytes)).toBe(output.sha256);
      expect(output.path.endsWith('.webp')).toBe(true);
      expect(output.pixel_invariant).toEqual(expect.objectContaining({
        alpha_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
        visible_rgba_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
      }));
    }
    expect(await readdir(join(first.root, 'public/assets/art/characters/test/casual'))).toEqual([
      'idle.webp',
      'step-right.webp',
    ]);
    const source = PNG.sync.read(await readFile(join(first.root, first.sourcePath)));
    for (const frame of first.spec.frames) {
      expect(visibleBounds(renderCharacterFrame({ source, frame, spec: first.spec }).png).maxY).toBe(12);
    }

    const firstProvenanceBytes = await readFile(join(first.root, firstResult.provenance.path));
    const secondProvenanceBytes = await readFile(join(second.root, secondResult.provenance.path));
    expect(firstProvenanceBytes.equals(secondProvenanceBytes)).toBe(true);
    expect(hash(firstProvenanceBytes)).toBe(firstResult.provenance.sha256);
    const provenance = JSON.parse(firstProvenanceBytes);
    expect(provenance.schema_version).toBe(2);
    expect(provenance.algorithm).toMatchObject({
      id: 'cyan-flood-aligned-character-sheet-v1',
      shipping_encoding: 'lossless-vp8l',
      shipping_encoder: {
        command: 'cwebp',
        arguments: ['-lossless', '-z', '9', '-quiet'],
      },
      deterministic: true,
    });
    expect(provenance.controls).toMatchObject({
      output_canvas: { width: 16, height: 14, center_x: 8, ground_y: 12 },
      common_scale: { numerator: 1, denominator: 2 },
    });
    expect(provenance.outputs[0]).toMatchObject({
      name: 'idle',
      crop: { x: 0, y: 0, width: 20, height: 24 },
      source_content_bounds: { x: 5, y: 3, width: 11, height: 17 },
      scaled_dimensions: { width: 6, height: 9 },
      placement: { x: 5, y: 4, width: 6, height: 9, center_x: 8, ground_y: 12 },
      components: {
        found: 3,
        kept: 2,
        removed: 1,
      },
    });
    expect(provenance.outputs[0].components.details).toEqual([
      { pixels: 4, distance_from_dominant: 6, kept: false },
      { pixels: 4, distance_from_dominant: 2, kept: true },
    ]);
    for (const output of provenance.outputs) {
      expect(hash(await readFile(join(first.root, output.path)))).toBe(output.sha256);
      expect(output.media_type).toBe('image/webp');
      expect(output.source_png_sha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(output.dimensions).toEqual({ width: 16, height: 14 });
    }
  });

  it('refuses stale source hashes, escaped lanes, and every existing output', async () => {
    const stale = await createFixture({ expectedSourceHash: '0'.repeat(64) });
    await expect(runCharacterSheetSlice({
      specPath: stale.specPath,
      repoRoot: stale.root,
      encodeFrame: fixtureWebpEncoder,
    })).rejects.toThrow('Source sheet art/characters/test/sheet.png SHA-256 mismatch');

    const escaped = await createFixture();
    escaped.spec.output.directory = 'public/assets/art/rooms/test';
    await writeFile(
      join(escaped.root, escaped.specPath),
      `${JSON.stringify(escaped.spec, null, 2)}\n`,
    );
    await expect(runCharacterSheetSlice({
      specPath: escaped.specPath,
      repoRoot: escaped.root,
      encodeFrame: fixtureWebpEncoder,
    })).rejects.toThrow('output directory must stay under public/assets/art/characters');

    const existing = await createFixture();
    const installed = await runCharacterSheetSlice({
      specPath: existing.specPath,
      repoRoot: existing.root,
      encodeFrame: fixtureWebpEncoder,
    });
    const before = await Promise.all(installed.outputs.map((output) => (
      readFile(join(existing.root, output.path))
    )));
    await expect(runCharacterSheetSlice({
      specPath: existing.specPath,
      repoRoot: existing.root,
      encodeFrame: fixtureWebpEncoder,
    })).rejects.toThrow('Refusing to overwrite existing file');
    const after = await Promise.all(installed.outputs.map((output) => (
      readFile(join(existing.root, output.path))
    )));
    expect(after.map((bytes, index) => bytes.equals(before[index]))).toEqual([true, true]);
  });

  it('refuses a legacy public PNG instead of leaving mixed shipping formats', async () => {
    const fixture = await createFixture();
    await mkdir(join(fixture.root, 'public/assets/art/characters/test/casual'), { recursive: true });
    await writeFile(
      join(fixture.root, 'public/assets/art/characters/test/casual/idle.png'),
      Buffer.from('legacy'),
    );

    await expect(runCharacterSheetSlice({
      specPath: fixture.specPath,
      repoRoot: fixture.root,
      encodeFrame: fixtureWebpEncoder,
    })).rejects.toThrow('Refusing to leave legacy public character PNG');
    expect(await readdir(join(fixture.root, 'public/assets/art/characters/test/casual'))).toEqual([
      'idle.png',
    ]);
  });

  it('installs neither WebPs nor provenance when promotion fails', async () => {
    const fixture = await createFixture();
    let encodes = 0;
    const failingEncoder = async (request) => {
      encodes += 1;
      if (encodes === 2) throw new Error('synthetic cwebp failure');
      return fixtureWebpEncoder(request);
    };

    await expect(runCharacterSheetSlice({
      specPath: fixture.specPath,
      repoRoot: fixture.root,
      encodeFrame: failingEncoder,
    })).rejects.toThrow('synthetic cwebp failure');
    for (const path of [
      'public/assets/art/characters/test/casual/idle.webp',
      'public/assets/art/characters/test/casual/step-right.webp',
      'art/characters/test/sheet.slice-provenance.json',
    ]) {
      await expect(readFile(join(fixture.root, path))).rejects.toMatchObject({ code: 'ENOENT' });
    }
  });
});

async function createFixture({ expectedSourceHash = null } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'violet-character-sheet-'));
  const sourcePath = 'art/characters/test/sheet.png';
  const specPath = 'art/characters/test/sheet.layout.json';
  await Promise.all([
    mkdir(join(root, 'art/characters/test'), { recursive: true }),
    mkdir(join(root, 'public/assets/art/characters'), { recursive: true }),
  ]);
  const sheet = syntheticSheet();
  const sourceBytes = PNG.sync.write(sheet, { colorType: 6, inputColorType: 6 });
  await writeFile(join(root, sourcePath), sourceBytes);
  const spec = {
    schema_version: 1,
    id: 'test.character-sheet-v1',
    source: {
      path: sourcePath,
      sha256: expectedSourceHash ?? hash(sourceBytes),
    },
    output: {
      directory: 'public/assets/art/characters/test/casual',
      provenance: 'art/characters/test/sheet.slice-provenance.json',
      canvas: {
        width: 16,
        height: 14,
        center_x: 8,
        ground_y: 12,
      },
    },
    scale: {
      numerator: 1,
      denominator: 2,
    },
    key: {
      color: { red: 0, green: 255, blue: 255 },
      tolerance: 16,
      alpha: {
        opaque_cyan_excess: 20,
        transparent_cyan_excess: 225,
        edge_spill_radius: 2,
        edge_spill_opaque_cyan_excess: -20,
        edge_spill_max_green_blue_delta: 70,
        matte_low_alpha: 0,
        matte_high_alpha: 255,
        edge_color_radius: 2,
      },
    },
    components: {
      detail_min_pixels: 2,
      detail_max_pixels: 8,
      detail_max_distance: 3,
    },
    frames: [
      {
        name: 'idle',
        crop: { x: 0, y: 0, width: 18, height: 24 },
        overlap: { top: 0, right: 2, bottom: 0, left: 0 },
      },
      {
        name: 'step-right',
        crop: { x: 24, y: 0, width: 20, height: 24 },
      },
    ],
  };
  await writeFile(join(root, specPath), `${JSON.stringify(spec, null, 2)}\n`);
  return { root, sourcePath, specPath, spec };
}

function syntheticSheet() {
  const png = new PNG({ width: 48, height: 24, colorType: 6 });
  fill(png, 0, 0, png.width, png.height, [0, 255, 255, 255]);

  // Idle: one large character, a detached nearby accessory, and overlap debris.
  fill(png, 6, 4, 6, 15, [220, 40, 30, 255]);
  fill(png, 5, 4, 1, 15, [80, 220, 220, 255]);
  fill(png, 12, 4, 1, 15, [80, 220, 220, 255]);
  fill(png, 6, 3, 6, 1, [80, 220, 220, 255]);
  fill(png, 6, 19, 6, 1, [80, 220, 220, 255]);
  fill(png, 14, 8, 2, 2, [240, 200, 20, 255]);
  fill(png, 18, 2, 2, 2, [180, 30, 190, 255]);

  // Step right: a differently sized pose that must still share the anchor.
  fill(png, 30, 5, 6, 15, [50, 60, 220, 255]);
  fill(png, 29, 5, 1, 15, [80, 220, 220, 255]);
  fill(png, 36, 5, 1, 15, [80, 220, 220, 255]);
  fill(png, 30, 4, 6, 1, [80, 220, 220, 255]);
  fill(png, 30, 20, 6, 1, [80, 220, 220, 255]);
  return png;
}

function fill(png, x, y, width, height, rgba) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const offset = (row * png.width + column) * 4;
      for (let channel = 0; channel < 4; channel += 1) png.data[offset + channel] = rgba[channel];
    }
  }
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function visibleBounds(png) {
  let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] > 0) maxY = y;
    }
  }
  return { maxY };
}

async function fixtureWebpEncoder({ pngBytes, expectedRgba, width, height }) {
  const bytes = Buffer.from(`fixture-webp:${hash(pngBytes)}`);
  return Object.freeze({
    bytes,
    verification: Object.freeze({
      alpha: 'exact',
      visibleRgb: 'exact',
      compositeBackgrounds: Object.freeze(['black', 'white', 'saturated-magenta']),
      integrity: Object.freeze({
        bytes: bytes.length,
        container_sha256: hash(bytes),
        ...deriveCharacterPixelInvariant(Buffer.from(expectedRgba), { width, height }),
      }),
    }),
  });
}
