import './check-node.mjs';

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  APPROVED_CAPTURE_ENVIRONMENT,
  assertEnvironmentIdentity,
  environmentIdentityId,
} from '../src/harness/environment.js';
import { assertRegistryId } from '../src/harness/registry.js';

const require = createRequire(import.meta.url);
const ROOT_DIRECTORY = fileURLToPath(new URL('..', import.meta.url));
const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';
const UINT32_MAX = 0xffffffff;
const DEFAULT_TIMEOUT_MS = 30_000;

export function parseCliTokens(argv, booleanOptions = new Set()) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new TypeError(`Unexpected positional argument "${token}".`);
    const equals = token.indexOf('=');
    const key = token.slice(2, equals === -1 ? undefined : equals);
    if (!key) throw new TypeError('Option names cannot be empty.');
    if (Object.hasOwn(options, key)) throw new TypeError(`Option --${key} was provided more than once.`);
    if (booleanOptions.has(key)) {
      if (equals !== -1) throw new TypeError(`Boolean option --${key} does not take a value.`);
      options[key] = true;
      continue;
    }
    const value = equals === -1 ? argv[++index] : token.slice(equals + 1);
    if (value === undefined || value.startsWith('--')) throw new TypeError(`Option --${key} requires a value.`);
    options[key] = value;
  }
  return options;
}

export function assertOnlyOptions(options, allowed) {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(options).filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) throw new TypeError(`Unknown option${unknown.length === 1 ? '' : 's'}: ${unknown.map((key) => `--${key}`).join(', ')}.`);
}

function parseInteger(value, path, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new TypeError(`${path} must be an integer from ${min} through ${max}.`);
  }
  return parsed;
}

export function parseSize(value = '640x360') {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) throw new TypeError('--size must look like 640x360.');
  const width = parseInteger(match[1], 'capture width', { min: 1, max: 4096 });
  const height = parseInteger(match[2], 'capture height', { min: 1, max: 4096 });
  return { width, height };
}

export function parseSeeds(value = '42') {
  const seeds = value.split(',').map((seed) => parseInteger(seed.trim(), 'seed', { min: 1, max: UINT32_MAX }));
  if (seeds.length === 0) throw new TypeError('At least one seed is required.');
  return [...new Set(seeds)];
}

export function secondsToFrame(value, path = 'time') {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) throw new TypeError(`${path} must be a non-negative number.`);
  const frame = Math.round(seconds * 60);
  if (Math.abs(frame / 60 - seconds) > 1e-9) {
    throw new TypeError(`${path} must land on the 60 fps simulation grid; use --frames for exact control.`);
  }
  return frame;
}

function parseNumberList(value, label, convert) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${label} cannot be empty.`);
  const parsed = value.split(',').map((entry, index) => convert(entry.trim(), `${label}[${index}]`));
  return [...new Set(parsed)].sort((a, b) => a - b);
}

export function parseFrames(options) {
  if (options.frames && options.times) throw new TypeError('Use either --frames or --times, not both.');
  if (options.frames) {
    return parseNumberList(options.frames, '--frames', (value, pathLabel) => parseInteger(value, pathLabel));
  }
  if (options.times) return parseNumberList(options.times, '--times', secondsToFrame);
  return [0];
}

export function normalizeCaptureSelectors(options) {
  const scene = options.scene ?? 'foundation';
  const state = options.state ?? 'foundation';
  const actions = options.actions ?? 'foundation';
  assertRegistryId(scene, 'scene');
  assertRegistryId(state, 'state fixture');
  assertRegistryId(actions, 'action fixture');
  const size = parseSize(options.size);
  const dpr = parseInteger(options.dpr ?? '1', 'dpr', { min: 1, max: 2 });
  const motion = options.motion ?? 'full';
  if (!['full', 'reduced'].includes(motion)) throw new TypeError('--motion must be full or reduced.');
  const learning = options.learning ?? 'gentle';
  if (!['off', 'gentle', 'stretchy'].includes(learning)) throw new TypeError('--learning must be off, gentle, or stretchy.');
  return {
    scene,
    state,
    actions,
    seeds: parseSeeds(options.seed),
    ...size,
    dpr,
    motion,
    learning,
    reviewDirectory: path.resolve(options['review-dir'] ?? path.join(ROOT_DIRECTORY, 'review')),
    timeoutMs: parseInteger(options['timeout-ms'] ?? String(DEFAULT_TIMEOUT_MS), 'timeout', { min: 1_000, max: 300_000 }),
  };
}

export function parseSnapArgs(argv) {
  const options = parseCliTokens(argv, new Set(['help']));
  assertOnlyOptions(options, [
    'scene', 'state', 'actions', 'frames', 'times', 'seed', 'size', 'dpr', 'motion', 'learning',
    'review-dir', 'timeout-ms', 'help',
  ]);
  if (options.help) return { help: true };
  return { ...normalizeCaptureSelectors(options), frames: parseFrames(options), help: false };
}

export function scenarioDirectoryName(options) {
  return [
    options.state,
    options.actions,
    options.motion,
    options.learning,
    `${options.width}x${options.height}@${options.dpr}x`,
  ].join('__');
}

export function reviewScenarioDirectory(options) {
  return path.join(options.reviewDirectory, options.scene, scenarioDirectoryName(options));
}

export function captureFileName(seed, frame) {
  return `seed${seed}_f${String(frame).padStart(6, '0')}.png`;
}

export function decodePngDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
    throw new TypeError('Harness snapshot must be a PNG data URL.');
  }
  const png = Buffer.from(dataUrl.slice(PNG_DATA_URL_PREFIX.length), 'base64');
  if (png.length < 8 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new TypeError('Harness snapshot did not contain a valid PNG signature.');
  }
  return png;
}

export function localCaptureEnvironment() {
  const playwrightDirectory = path.dirname(require.resolve('playwright'));
  const playwrightCoreDirectory = path.dirname(require.resolve('playwright-core'));
  const browsers = require(path.join(playwrightCoreDirectory, 'browsers.json')).browsers;
  const chromium = browsers.find((browser) => browser.name === 'chromium');
  if (!chromium) throw new Error('Playwright does not declare a Chromium revision.');
  const identity = structuredClone(APPROVED_CAPTURE_ENVIRONMENT);
  identity.os.name = process.platform === 'darwin' ? 'macos' : process.platform;
  identity.os.version = process.platform === 'darwin'
    ? execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim()
    : '0.0';
  identity.os.architecture = process.arch;
  identity.runtime.node = process.versions.node;
  identity.browser.playwright = require(path.join(playwrightDirectory, 'package.json')).version;
  identity.browser.revision = chromium.revision;
  identity.id = environmentIdentityId(identity);
  return assertEnvironmentIdentity(identity);
}

function serverOrigin(server) {
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Vite did not expose its listening port.');
  return `http://127.0.0.1:${address.port}`;
}

function harnessUrl(origin, options, seed) {
  const url = new URL('/harness.html', origin);
  url.searchParams.set('scene', options.scene);
  url.searchParams.set('state', options.state);
  url.searchParams.set('actions', options.actions);
  url.searchParams.set('frame', '0');
  url.searchParams.set('seed', String(seed));
  url.searchParams.set('size', `${options.width}x${options.height}`);
  url.searchParams.set('dpr', String(options.dpr));
  url.searchParams.set('motion', options.motion);
  url.searchParams.set('learning', options.learning);
  return url.href;
}

export async function captureFrames(options) {
  const environment = localCaptureEnvironment();
  const frames = [...new Set(options.frames)].sort((a, b) => a - b);
  if (frames.length === 0) throw new TypeError('At least one capture frame is required.');
  frames.forEach((frame) => parseInteger(frame, 'frame'));
  const outputDirectory = options.outputDirectory ?? reviewScenarioDirectory(options);
  await mkdir(outputDirectory, { recursive: true });

  const [{ chromium }, { createServer }] = await Promise.all([import('playwright'), import('vite')]);
  const server = await createServer({
    root: ROOT_DIRECTORY,
    configFile: path.join(ROOT_DIRECTORY, 'vite.config.js'),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  });
  let browser;
  const captures = [];
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    for (const seed of options.seeds) {
      const context = await browser.newContext({
        viewport: { width: options.width, height: options.height },
        deviceScaleFactor: options.dpr,
        locale: environment.rendering.locale,
        timezoneId: environment.rendering.timezone,
        reducedMotion: options.motion === 'reduced' ? 'reduce' : 'no-preference',
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error));
      try {
        await page.goto(harnessUrl(serverOrigin(server), options, seed), { waitUntil: 'load', timeout: options.timeoutMs });
        await page.waitForFunction(() => window.__ready === true, undefined, { timeout: options.timeoutMs });
        for (const frame of frames) {
          const dataUrl = await page.evaluate(async (nextFrame) => {
            if (!window.__harness?.renderAt || !window.__harness?.snapshot) {
              throw new Error('Harness renderAt/snapshot API is unavailable.');
            }
            await window.__harness.renderAt({ frame: nextFrame });
            return window.__harness.snapshot();
          }, frame);
          if (pageErrors.length > 0) throw pageErrors[0];
          const png = decodePngDataUrl(dataUrl);
          const file = captureFileName(seed, frame);
          await writeFile(path.join(outputDirectory, file), png);
          captures.push({
            seed,
            frame,
            seconds: frame / 60,
            file,
            sha256: createHash('sha256').update(png).digest('hex'),
          });
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await server.close();
  }

  const manifest = {
    schemaVersion: 1,
    environment,
    scene: options.scene,
    state: options.state,
    actions: options.actions,
    scenario: scenarioDirectoryName(options),
    seeds: [...options.seeds],
    profile: {
      width: options.width,
      height: options.height,
      dpr: options.dpr,
      motion: options.motion,
      learning: options.learning,
    },
    frames: captures,
  };
  await writeFile(path.join(outputDirectory, 'capture.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { outputDirectory, manifest, files: captures.map((capture) => path.join(outputDirectory, capture.file)) };
}

function usage() {
  return [
    'Usage: node scripts/snap.mjs --scene <id> [options]',
    '  --frames 0,15,30       exact 60 fps simulation frames',
    '  --times 0,0.25,0.5     times that land exactly on the 60 fps grid',
    '  --seed 1,42,1337       one or more deterministic seeds',
    '  --state <fixture> --actions <fixture>',
    '  --size 640x360 --dpr 1 --motion full --learning gentle',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseSnapArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await captureFrames(options);
  console.log(`Captured ${result.manifest.frames.length} PNG frame(s) in ${result.outputDirectory}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
