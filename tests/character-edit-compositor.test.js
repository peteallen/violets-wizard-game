import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import {
  installCharacterEditOutputPair,
  parseCharacterEditArgs,
  runCharacterEditComposite,
  validateCharacterEditSpec,
} from '../scripts/composite-character-edit.mjs';

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('character edit compositor contract', () => {
  it('accepts only the strict versioned edit spec and explicit CLI path', () => {
    const spec = editSpec({
      baseHash: 'a'.repeat(64), candidateHash: 'b'.repeat(64), maskHash: 'c'.repeat(64),
    });
    expect(validateCharacterEditSpec(spec)).toBe(spec);
    expect(parseCharacterEditArgs(['--spec', 'art/edit.json'])).toEqual({
      spec: 'art/edit.json', help: false,
    });

    spec.model = 'another/model';
    expect(() => validateCharacterEditSpec(spec)).toThrow('keys must be exactly');
    expect(() => parseCharacterEditArgs([])).toThrow('--spec is required');
  });

  it('copies every channel byte outside the mask and records exact mask bounds', async () => {
    const fixture = await createFixture({
      width: 3,
      basePixels: [
        [12, 34, 56, 78],
        [20, 40, 60, 80],
        [91, 92, 93, 94],
      ],
      candidatePixels: [
        [210, 211, 212, 213],
        [220, 180, 140, 100],
        [230, 231, 232, 233],
      ],
      maskPixels: [
        [0, 0, 0, 255],
        [255, 255, 255, 255],
        [0, 0, 0, 255],
      ],
      maskColorType: 0,
    });

    const result = await runCharacterEditComposite({
      specPath: fixture.specPath,
      repoRoot: fixture.root,
    });
    const output = PNG.sync.read(await readFile(fixture.outputPath));
    expect(pixelAt(output, 0)).toEqual(fixture.basePixels[0]);
    expect(pixelAt(output, 2)).toEqual(fixture.basePixels[2]);
    expect(pixelAt(output, 1)).toEqual([220, 180, 140, 80]);
    expect(result.mask).toMatchObject({
      bounds: { x: 1, y: 0, width: 1, height: 1 },
      zero_pixels: 2,
      nonzero_pixels: 1,
      full_pixels: 1,
      soft_pixels: 0,
    });
    expect(result.changes.outside_zero_mask_changed_pixels).toBe(0);

    const provenance = JSON.parse(await readFile(fixture.provenancePath, 'utf8'));
    expect(provenance.controls).toEqual({
      allow_alpha_change: false,
      zero_mask_pixels_copied_byte_exactly: true,
    });
    expect(provenance.inputs.base.expected_sha256).toBe(fixture.baseHash);
    expect(provenance.inputs.raw_candidate.expected_sha256).toBe(fixture.candidateHash);
    expect(provenance.output.image.sha256).toBe(hash(await readFile(fixture.outputPath)));
    expect(provenance.output.image.rgba_sha256).toBe(hash(output.data));
  });

  it('preserves base alpha exactly unless the spec explicitly allows alpha changes', async () => {
    const preserved = await createFixture({
      width: 2,
      basePixels: [[10, 20, 30, 17], [40, 50, 60, 203]],
      candidatePixels: [[200, 180, 160, 255], [130, 120, 110, 0]],
      maskPixels: [[255, 255, 255, 255], [255, 255, 255, 255]],
      allowAlphaChange: false,
    });
    await runCharacterEditComposite({ specPath: preserved.specPath, repoRoot: preserved.root });
    const preservedOutput = PNG.sync.read(await readFile(preserved.outputPath));
    expect(pixelAt(preservedOutput, 0)[3]).toBe(17);
    expect(pixelAt(preservedOutput, 1)[3]).toBe(203);

    const allowed = await createFixture({
      width: 2,
      basePixels: [[10, 20, 30, 17], [40, 50, 60, 203]],
      candidatePixels: [[200, 180, 160, 255], [130, 120, 110, 0]],
      maskPixels: [[255, 255, 255, 255], [255, 255, 255, 255]],
      allowAlphaChange: true,
    });
    const allowedResult = await runCharacterEditComposite({ specPath: allowed.specPath, repoRoot: allowed.root });
    const allowedOutput = PNG.sync.read(await readFile(allowed.outputPath));
    expect(pixelAt(allowedOutput, 0)[3]).toBe(255);
    expect(pixelAt(allowedOutput, 1)[3]).toBe(0);
    expect(allowedResult.changes.alpha_changed_pixels).toBe(2);
  });

  it('uses soft RGBA mask coverage in linear light instead of averaging sRGB bytes', async () => {
    const fixture = await createFixture({
      basePixels: [[0, 0, 0, 255]],
      candidatePixels: [[255, 255, 255, 255]],
      maskPixels: [[255, 255, 255, 128]],
    });
    const result = await runCharacterEditComposite({ specPath: fixture.specPath, repoRoot: fixture.root });
    const output = PNG.sync.read(await readFile(fixture.outputPath));

    expect(pixelAt(output, 0)).toEqual([188, 188, 188, 255]);
    expect(pixelAt(output, 0)[0]).not.toBe(128);
    expect(result.mask).toMatchObject({
      full_pixels: 0,
      soft_pixels: 1,
      minimum_nonzero_coverage_units: 32640,
      maximum_coverage_units: 32640,
    });

    const premultiplied = await createFixture({
      basePixels: [[0, 0, 0, 64]],
      candidatePixels: [[255, 255, 255, 192]],
      maskPixels: [[128, 128, 128, 255]],
      allowAlphaChange: true,
    });
    await runCharacterEditComposite({ specPath: premultiplied.specPath, repoRoot: premultiplied.root });
    const premultipliedOutput = PNG.sync.read(await readFile(premultiplied.outputPath));
    expect(pixelAt(premultipliedOutput, 0)).toEqual([225, 225, 225, 128]);
  });

  it('produces identical PNG and provenance bytes for identical inputs', async () => {
    const first = await createFixture({
      basePixels: [[7, 31, 89, 211]],
      candidatePixels: [[201, 133, 41, 177]],
      maskPixels: [[151, 151, 151, 255]],
      allowAlphaChange: true,
    });
    const second = await createFixture({
      basePixels: [[7, 31, 89, 211]],
      candidatePixels: [[201, 133, 41, 177]],
      maskPixels: [[151, 151, 151, 255]],
      allowAlphaChange: true,
    });
    await runCharacterEditComposite({ specPath: first.specPath, repoRoot: first.root });
    await runCharacterEditComposite({ specPath: second.specPath, repoRoot: second.root });

    expect(await readFile(first.outputPath)).toEqual(await readFile(second.outputPath));
    expect(await readFile(first.provenancePath)).toEqual(await readFile(second.provenancePath));
  });

  it('rejects stale expected hashes and mismatched input dimensions without writing outputs', async () => {
    const stale = await createFixture({ basePixels: [[1, 2, 3, 4]] });
    stale.spec.base.sha256 = '0'.repeat(64);
    await writeFile(stale.specFile, `${JSON.stringify(stale.spec, null, 2)}\n`);
    await expect(runCharacterEditComposite({
      specPath: stale.specPath,
      repoRoot: stale.root,
    })).rejects.toThrow('Base PNG art/base.png SHA-256 mismatch');
    await expect(readFile(stale.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readFile(stale.provenancePath)).rejects.toMatchObject({ code: 'ENOENT' });

    const staleMask = await createFixture();
    staleMask.spec.mask.sha256 = '0'.repeat(64);
    await writeFile(staleMask.specFile, `${JSON.stringify(staleMask.spec, null, 2)}\n`);
    await expect(runCharacterEditComposite({
      specPath: staleMask.specPath,
      repoRoot: staleMask.root,
    })).rejects.toThrow('Mask PNG art/mask.png SHA-256 mismatch');
    await expect(readFile(staleMask.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });

    const dimensions = await createFixture({
      width: 1,
      basePixels: [[1, 2, 3, 255]],
      candidateWidth: 2,
      candidatePixels: [[4, 5, 6, 255], [7, 8, 9, 255]],
      maskPixels: [[255, 255, 255, 255]],
    });
    await expect(runCharacterEditComposite({
      specPath: dimensions.specPath,
      repoRoot: dimensions.root,
    })).rejects.toThrow('Raw candidate dimensions 2x1 do not match base 1x1');
    await expect(readFile(dimensions.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('refuses to overwrite either member of the output pair', async () => {
    const fixture = await createFixture();
    const sentinel = Buffer.from('existing output must remain untouched');
    await writeFile(fixture.outputPath, sentinel);

    await expect(runCharacterEditComposite({
      specPath: fixture.specPath,
      repoRoot: fixture.root,
    })).rejects.toThrow('Refusing to overwrite existing file art/output.png');
    expect(await readFile(fixture.outputPath)).toEqual(sentinel);
    await expect(readFile(fixture.provenancePath)).rejects.toMatchObject({ code: 'ENOENT' });

    await rm(fixture.outputPath);
    const provenanceSentinel = Buffer.from('another process won the provenance race');
    await writeFile(fixture.provenancePath, provenanceSentinel);
    await expect(installCharacterEditOutputPair({
      imagePath: fixture.outputPath,
      imageBytes: Buffer.from('new image'),
      provenancePath: fixture.provenancePath,
      provenanceBytes: Buffer.from('new provenance'),
    })).rejects.toThrow('Refusing to overwrite');
    await expect(readFile(fixture.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(fixture.provenancePath)).toEqual(provenanceSentinel);
  });
});

async function createFixture({
  width = 1,
  height = 1,
  candidateWidth = width,
  candidateHeight = height,
  basePixels = [[20, 40, 60, 255]],
  candidatePixels = [[120, 140, 160, 255]],
  maskPixels = [[255, 255, 255, 255]],
  maskColorType = 6,
  allowAlphaChange = false,
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'violet-character-edit-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'art'), { recursive: true });
  const baseBytes = pngBuffer(width, height, basePixels);
  const candidateBytes = pngBuffer(candidateWidth, candidateHeight, candidatePixels);
  const maskBytes = pngBuffer(width, height, maskPixels, { colorType: maskColorType });
  const baseHash = hash(baseBytes);
  const candidateHash = hash(candidateBytes);
  const maskHash = hash(maskBytes);
  const spec = editSpec({ baseHash, candidateHash, maskHash, allowAlphaChange });
  const specFile = join(root, 'art/edit.json');
  await Promise.all([
    writeFile(join(root, 'art/base.png'), baseBytes),
    writeFile(join(root, 'art/candidate.png'), candidateBytes),
    writeFile(join(root, 'art/mask.png'), maskBytes),
    writeFile(specFile, `${JSON.stringify(spec, null, 2)}\n`),
  ]);
  return {
    root,
    spec,
    specFile,
    specPath: 'art/edit.json',
    outputPath: join(root, 'art/output.png'),
    provenancePath: join(root, 'art/output.metadata.json'),
    basePixels,
    baseHash,
    candidateHash,
    maskHash,
  };
}

function editSpec({ baseHash, candidateHash, maskHash, allowAlphaChange = false }) {
  return {
    schema_version: 1,
    base: { path: 'art/base.png', sha256: baseHash },
    raw_candidate: { path: 'art/candidate.png', sha256: candidateHash },
    mask: { path: 'art/mask.png', sha256: maskHash },
    output: { image: 'art/output.png', provenance: 'art/output.metadata.json' },
    allow_alpha_change: allowAlphaChange,
  };
}

function pngBuffer(width, height, pixels, { colorType = 6 } = {}) {
  const png = new PNG({ width, height });
  const expectedPixels = width * height;
  if (pixels.length !== expectedPixels) throw new Error(`Expected ${expectedPixels} pixels, found ${pixels.length}.`);
  pixels.forEach((pixel, index) => png.data.set(pixel, index * 4));
  return PNG.sync.write(png, { colorType, inputColorType: 6, bitDepth: 8 });
}

function pixelAt(png, index) {
  return [...png.data.subarray(index * 4, index * 4 + 4)];
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}
