import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { APPROVED_CAPTURE_ENVIRONMENT } from '../src/harness/environment.js';
import {
  captureFileName,
  decodePngDataUrl,
  parseSnapArgs,
  scenarioDirectoryName,
  secondsToFrame,
} from '../scripts/snap.mjs';
import {
  assertFfmpegVersion,
  gifArguments,
  parseFlipbookArgs,
  sheetArguments,
} from '../scripts/flipbook.mjs';
import {
  comparePngBuffers,
  goldenScenarioDirectory,
  parseDiffArgs,
  validateBlessingRecord,
  validateCaptureManifest,
} from '../scripts/diff.mjs';
import { parseBlessArgs, requireHumanApproval } from '../scripts/bless.mjs';

function captureManifest() {
  const profile = { width: 640, height: 360, dpr: 1, motion: 'full', learning: 'gentle' };
  return {
    schemaVersion: 1,
    environment: APPROVED_CAPTURE_ENVIRONMENT,
    scene: 'foundation',
    state: 'foundation',
    actions: 'foundation',
    scenario: scenarioDirectoryName({ state: 'foundation', actions: 'foundation', ...profile }),
    seeds: [42],
    profile,
    frames: [{
      seed: 42,
      frame: 15,
      seconds: 0.25,
      file: captureFileName(42, 15),
      sha256: 'a'.repeat(64),
    }],
  };
}

function pngBuffer(secondPixel) {
  const png = new PNG({ width: 2, height: 1 });
  png.data.set([255, 255, 255, 255, ...secondPixel]);
  return PNG.sync.write(png);
}

describe('snap command helpers', () => {
  it('normalizes exact simulation frames, seeds, settings, and scenario names', () => {
    const options = parseSnapArgs([
      '--scene', 'foundation',
      '--times', '0,0.25,0.5',
      '--seed', '1,42,42',
      '--size', '640x360',
      '--dpr', '2',
      '--motion', 'reduced',
      '--learning', 'off',
    ]);
    expect(options.frames).toEqual([0, 15, 30]);
    expect(options.seeds).toEqual([1, 42]);
    expect(options.dpr).toBe(2);
    expect(scenarioDirectoryName(options)).toBe('foundation__foundation__reduced__off__640x360@2x');
  });

  it('rejects off-grid times and decodes only PNG data URLs', () => {
    expect(secondsToFrame('0.25')).toBe(15);
    expect(() => secondsToFrame('0.06')).toThrow(/60 fps simulation grid/);
    const signature = Buffer.from('89504e470d0a1a0a', 'hex');
    expect(decodePngDataUrl(`data:image/png;base64,${signature.toString('base64')}`)).toEqual(signature);
    expect(() => decodePngDataUrl('data:text/plain;base64,SGk=')).toThrow(/PNG data URL/);
  });
});

describe('flipbook command helpers', () => {
  it('uses a fixed-step cadence and the approved palette pipeline', () => {
    const options = parseFlipbookArgs(['--scene', 'foundation', '--from', '0', '--to', '0.2', '--fps', '10']);
    expect(options.frames).toEqual([0, 6, 12]);
    const gif = gifArguments({ fps: 10, inputPattern: 'frame%06d.png', outputFile: 'flipbook.gif' });
    expect(gif.join(' ')).toContain('palettegen=stats_mode=diff');
    expect(gif.join(' ')).toContain('paletteuse=dither=bayer');
    expect(sheetArguments({ fps: 10, inputPattern: 'frame%06d.png', frameCount: 3, outputFile: 'sheet.png' })).toContain('tile=3x1');
  });

  it('pins ffmpeg and rejects cadences that cannot align with 60 fps', () => {
    expect(assertFfmpegVersion('ffmpeg version 8.1.1 Copyright')).toBe('8.1.1');
    expect(() => assertFfmpegVersion('ffmpeg version 7.0 Copyright')).toThrow(/8\.1\.1 is required/);
    expect(() => parseFlipbookArgs(['--scene', 'foundation', '--fps', '7'])).toThrow(/divide evenly/);
  });
});

describe('golden diff helpers', () => {
  it('validates explicit capture identity and places goldens beneath it', () => {
    const manifest = captureManifest();
    expect(validateCaptureManifest(manifest)).toBe(manifest);
    expect(goldenScenarioDirectory('/goldens', manifest)).toBe(
      `/goldens/${APPROVED_CAPTURE_ENVIRONMENT.id}/foundation/${manifest.scenario}`,
    );
    const invalid = structuredClone(manifest);
    invalid.scenario = 'wrong';
    expect(() => validateCaptureManifest(invalid)).toThrow(/scenario must be/);
  });

  it('uses perceptual pixel matching and reports the differing fraction', () => {
    const white = [255, 255, 255, 255];
    const black = [0, 0, 0, 255];
    const same = comparePngBuffers(pngBuffer(white), pngBuffer(white));
    expect(same.differentPixels).toBe(0);
    const changed = comparePngBuffers(pngBuffer(black), pngBuffer(white), 0.1);
    expect(changed.differentPixels).toBe(1);
    expect(changed.fraction).toBe(0.5);
    expect(PNG.sync.read(changed.diffBuffer)).toMatchObject({ width: 2, height: 1 });
  });

  it('defaults to the documented pixelmatch and failure thresholds', () => {
    const options = parseDiffArgs(['--scene', 'foundation']);
    expect(options.threshold).toBe(0.1);
    expect(options.maximumDifference).toBe(0.005);
  });

  it('requires a blessing record to match the exact captured environment and frame set', () => {
    const manifest = captureManifest();
    const blessing = {
      schemaVersion: 1,
      humanApproved: true,
      reviewer: 'Pete',
      approvedAt: '2026-07-12T16:00:00.000Z',
      environmentId: manifest.environment.id,
      scene: manifest.scene,
      scenario: manifest.scenario,
      frames: manifest.frames.map((frame) => frame.file),
    };
    expect(validateBlessingRecord(blessing, manifest)).toBe(blessing);
    blessing.frames = [];
    expect(() => validateBlessingRecord(blessing, manifest)).toThrow(/frames does not match/);
  });
});

describe('human blessing guard', () => {
  it('requires both an explicit approval assertion and a named reviewer', () => {
    expect(() => requireHumanApproval({ humanApproved: false, reviewer: 'Pete' })).toThrow(/--human-approved/);
    expect(() => requireHumanApproval({ humanApproved: true, reviewer: '' })).toThrow(/--reviewer/);
    expect(requireHumanApproval({ humanApproved: true, reviewer: ' Pete ' })).toBe('Pete');
    const options = parseBlessArgs([
      '--scene', 'foundation',
      '--human-approved',
      '--reviewer', 'Pete',
    ]);
    expect(options.humanApproved).toBe(true);
    expect(options.reviewer).toBe('Pete');
  });
});
