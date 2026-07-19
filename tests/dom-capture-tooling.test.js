import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APPROVED_CAPTURE_ENVIRONMENT } from '../src/harness/environment.js';
import { validateCaptureManifest } from '../scripts/diff.mjs';
import {
  assertPngScreenshot,
  captureDomFrames,
  captureDomPageFrame,
  createDomCaptureManifest,
  domHarnessUrl,
  parseDomSnapArgs,
} from '../scripts/snap-dom.mjs';

const PNG = Buffer.from('89504e470d0a1a0a00000000', 'hex');
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe('DOM snap command parsing', () => {
  it('shares deterministic selectors and names both required visual-review sizes', () => {
    const standard = parseDomSnapArgs([
      '--scene', 'save-transfer',
      '--frames', '280,300',
      '--seed', '42',
      '--size', '1280x720',
      '--dpr', '1',
      '--motion', 'reduced',
      '--learning', 'off',
    ]);
    expect(standard).toMatchObject({
      scene: 'save-transfer',
      state: 'save-transfer',
      actions: 'save-transfer',
      frames: [280, 300],
      seeds: [42],
      width: 1280,
      height: 720,
      dpr: 1,
      motion: 'reduced',
      learning: 'off',
    });
    expect(createDomCaptureManifest(standard, APPROVED_CAPTURE_ENVIRONMENT, []).scenario).toBe(
      'save-transfer__save-transfer__reduced__off__1280x720@1x',
    );

    const large = parseDomSnapArgs([
      '--scene=pet-name-dialog',
      '--times=0,0.5',
      '--size=2560x1440',
    ]);
    expect(large).toMatchObject({
      state: 'pet-name-dialog',
      actions: 'pet-name-dialog',
      frames: [0, 30],
      width: 2560,
      height: 1440,
    });
    expect(createDomCaptureManifest(large, APPROVED_CAPTURE_ENVIRONMENT, []).scenario).toBe(
      'pet-name-dialog__pet-name-dialog__full__gentle__2560x1440@1x',
    );
  });

  it('passes every harness selector through the deterministic page URL', () => {
    const options = parseDomSnapArgs([
      '--scene', 'save-transfer',
      '--state', 'parent-save',
      '--actions', 'save-transfer',
      '--seed', '7',
      '--size', '1280x720',
      '--dpr', '2',
      '--motion', 'reduced',
      '--learning', 'stretchy',
    ]);
    const url = new URL(domHarnessUrl('http://127.0.0.1:4173', options, 7));
    expect(url.pathname).toBe('/harness.html');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      scene: 'save-transfer',
      state: 'parent-save',
      actions: 'save-transfer',
      frame: '0',
      seed: '7',
      size: '1280x720',
      dpr: '2',
      motion: 'reduced',
      learning: 'stretchy',
    });
  });

  it('routes registered boot states through the dedicated pre-game DOM entrypoint', () => {
    const options = parseDomSnapArgs([
      '--scene', 'boot-failure-review',
      '--size', '2560x1440',
    ]);
    const url = new URL(domHarnessUrl('http://127.0.0.1:4173', options, 42));
    expect(url.pathname).toBe('/boot-review.html');
    expect(url.searchParams.get('state')).toBe('boot-failure-review');
    expect(url.searchParams.get('actions')).toBe('boot-failure-review');
  });
});

describe('DOM screenshot output', () => {
  it('steps the registered harness before taking a viewport PNG', async () => {
    const order = [];
    const page = {
      evaluate: vi.fn(async (_callback, frame) => order.push(`render:${frame}`)),
      screenshot: vi.fn(async () => {
        order.push('screenshot');
        return PNG;
      }),
    };

    await expect(captureDomPageFrame(page, 300)).resolves.toEqual(PNG);
    expect(order).toEqual(['render:300', 'screenshot']);
    expect(page.screenshot).toHaveBeenCalledWith({
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      scale: 'device',
      type: 'png',
    });
    expect(() => assertPngScreenshot(Buffer.from('not a png'))).toThrow(/PNG signature/);
  });

  it('writes page bytes and snap-compatible capture metadata without a live browser', async () => {
    const reviewDirectory = await mkdtemp(path.join(os.tmpdir(), 'violet-dom-snap-'));
    temporaryDirectories.push(reviewDirectory);
    const options = parseDomSnapArgs([
      '--scene', 'save-transfer',
      '--frames', '300',
      '--seed', '42',
      '--size', '1280x720',
      '--review-dir', reviewDirectory,
    ]);
    const page = {
      on: vi.fn(),
      goto: vi.fn(async () => {}),
      waitForFunction: vi.fn(async () => {}),
      evaluate: vi.fn(async () => {}),
      screenshot: vi.fn(async () => PNG),
    };
    const context = {
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => {}),
    };
    const browser = {
      newContext: vi.fn(async () => context),
      close: vi.fn(async () => {}),
    };
    const chromium = { launch: vi.fn(async () => browser) };
    const server = {
      httpServer: { address: () => ({ port: 4173 }) },
      listen: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    };
    const createServer = vi.fn(async () => server);

    const result = await captureDomFrames(options, {
      chromium,
      createServer,
      environment: APPROVED_CAPTURE_ENVIRONMENT,
    });
    const expectedDirectory = path.join(
      reviewDirectory,
      'save-transfer',
      'save-transfer__save-transfer__full__gentle__1280x720@1x',
    );
    expect(result.outputDirectory).toBe(expectedDirectory);
    expect(result.files).toEqual([path.join(expectedDirectory, 'seed42_f000300.png')]);
    await expect(readFile(result.files[0])).resolves.toEqual(PNG);

    const manifest = JSON.parse(await readFile(path.join(expectedDirectory, 'capture.json'), 'utf8'));
    expect(manifest).toEqual({
      schemaVersion: 1,
      environment: APPROVED_CAPTURE_ENVIRONMENT,
      scene: 'save-transfer',
      state: 'save-transfer',
      actions: 'save-transfer',
      scenario: 'save-transfer__save-transfer__full__gentle__1280x720@1x',
      seeds: [42],
      profile: {
        width: 1280,
        height: 720,
        dpr: 1,
        motion: 'full',
        learning: 'gentle',
      },
      frames: [{
        seed: 42,
        frame: 300,
        seconds: 5,
        file: 'seed42_f000300.png',
        sha256: createHash('sha256').update(PNG).digest('hex'),
      }],
    });
    expect(validateCaptureManifest(manifest)).toBe(manifest);
    expect(page.goto.mock.calls[0][0]).toContain('/harness.html?scene=save-transfer');
    expect(page.waitForFunction).toHaveBeenCalledOnce();
    expect(page.evaluate).toHaveBeenCalledOnce();
    expect(page.screenshot).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
    expect(browser.close).toHaveBeenCalledOnce();
    expect(server.close).toHaveBeenCalledOnce();
  });
});
