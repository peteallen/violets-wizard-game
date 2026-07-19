import './check-node.mjs';

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  captureFileName,
  localCaptureEnvironment,
  parseSnapArgs,
  reviewScenarioDirectory,
  scenarioDirectoryName,
} from './snap.mjs';

const ROOT_DIRECTORY = fileURLToPath(new URL('..', import.meta.url));
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');

export function parseDomSnapArgs(argv) {
  return parseSnapArgs(argv);
}

function serverOrigin(server) {
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Vite did not expose its listening port.');
  return `http://127.0.0.1:${address.port}`;
}

export function domHarnessUrl(origin, options, seed) {
  const reviewPage = options.scene.startsWith('boot-')
    ? '/boot-review.html'
    : '/harness.html';
  const url = new URL(reviewPage, origin);
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

export function assertPngScreenshot(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Page screenshot must be PNG bytes.');
  const png = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (png.length < PNG_SIGNATURE.length || !png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new TypeError('Page screenshot did not contain a valid PNG signature.');
  }
  return png;
}

export async function captureDomPageFrame(page, frame) {
  await page.evaluate(async (nextFrame) => {
    if (!window.__harness?.renderAt) throw new Error('Harness renderAt API is unavailable.');
    await window.__harness.renderAt({ frame: nextFrame });
  }, frame);
  const screenshot = await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    fullPage: false,
    scale: 'device',
    type: 'png',
  });
  return assertPngScreenshot(screenshot);
}

export function createDomCaptureManifest(options, environment, captures) {
  return {
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
}

async function captureDependencies(overrides) {
  let { chromium, createServer } = overrides;
  if (!chromium) ({ chromium } = await import('playwright'));
  if (!createServer) ({ createServer } = await import('vite'));
  return { chromium, createServer };
}

function assertFrame(frame) {
  if (!Number.isSafeInteger(frame) || frame < 0) throw new TypeError('frame must be a non-negative integer.');
  return frame;
}

export async function captureDomFrames(options, dependencies = {}) {
  const environment = dependencies.environment ?? localCaptureEnvironment();
  const frames = [...new Set(options.frames)].sort((a, b) => a - b);
  if (frames.length === 0) throw new TypeError('At least one capture frame is required.');
  frames.forEach(assertFrame);
  const outputDirectory = options.outputDirectory ?? reviewScenarioDirectory(options);
  await mkdir(outputDirectory, { recursive: true });

  const { chromium, createServer } = await captureDependencies(dependencies);
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
        await page.goto(domHarnessUrl(serverOrigin(server), options, seed), {
          waitUntil: 'load',
          timeout: options.timeoutMs,
        });
        await page.waitForFunction(() => window.__ready === true, undefined, { timeout: options.timeoutMs });
        for (const frame of frames) {
          const png = await captureDomPageFrame(page, frame);
          if (pageErrors.length > 0) throw pageErrors[0];
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

  const manifest = createDomCaptureManifest(options, environment, captures);
  await writeFile(path.join(outputDirectory, 'capture.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { outputDirectory, manifest, files: captures.map(({ file }) => path.join(outputDirectory, file)) };
}

function usage() {
  return [
    'Usage: node scripts/snap-dom.mjs --scene <id> [options]',
    'Captures the complete harness viewport, including accessible DOM overlays.',
    '  --frames 0,15,30       exact 60 fps simulation frames',
    '  --times 0,0.25,0.5     times that land exactly on the 60 fps grid',
    '  --seed 1,42,1337       one or more deterministic seeds',
    '  --state <fixture> --actions <fixture>',
    '  --size 1280x720 --dpr 1 --motion full --learning gentle',
    'Repeat with --size 2560x1440 for the large visual-review frame.',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseDomSnapArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await captureDomFrames(options);
  console.log(`Captured ${result.manifest.frames.length} DOM-inclusive PNG frame(s) in ${result.outputDirectory}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
