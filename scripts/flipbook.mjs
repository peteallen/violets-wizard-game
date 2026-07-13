import './check-node.mjs';

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  assertOnlyOptions,
  captureFrames,
  normalizeCaptureSelectors,
  parseCliTokens,
  reviewScenarioDirectory,
  secondsToFrame,
} from './snap.mjs';

function execute(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${file} failed: ${stderr || error.message}`;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseInteger(value, pathLabel, min, max) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new TypeError(`${pathLabel} must be an integer from ${min} through ${max}.`);
  }
  return number;
}

export function parseFlipbookArgs(argv) {
  const options = parseCliTokens(argv, new Set(['help']));
  assertOnlyOptions(options, [
    'scene', 'state', 'actions', 'seed', 'size', 'dpr', 'motion', 'learning', 'review-dir',
    'timeout-ms', 'from', 'to', 'fps', 'help',
  ]);
  if (options.help) return { help: true };
  const selectors = normalizeCaptureSelectors(options);
  if (selectors.seeds.length !== 1) throw new TypeError('Flipbooks accept exactly one --seed.');
  const fps = parseInteger(options.fps ?? '10', 'fps', 1, 60);
  if (60 % fps !== 0) throw new TypeError('--fps must divide evenly into the 60 fps simulation clock.');
  const fromFrame = secondsToFrame(options.from ?? '0', '--from');
  const toFrame = secondsToFrame(options.to ?? '2', '--to');
  if (toFrame <= fromFrame) throw new TypeError('--to must be later than --from.');
  const frameStep = 60 / fps;
  const frames = [];
  for (let frame = fromFrame; frame <= toFrame; frame += frameStep) frames.push(frame);
  if (frames.at(-1) !== toFrame) frames.push(toFrame);
  return { ...selectors, fps, fromFrame, toFrame, frames, help: false };
}

export function gifArguments({ fps, inputPattern, outputFile }) {
  return [
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `fps=${fps},split[gif][palette];[palette]palettegen=stats_mode=diff[p];[gif][p]paletteuse=dither=bayer`,
    '-loop', '0',
    outputFile,
  ];
}

export function sheetArguments({ fps, inputPattern, frameCount, outputFile }) {
  return [
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `tile=${frameCount}x1`,
    '-frames:v', '1',
    outputFile,
  ];
}

export function assertFfmpegVersion(output) {
  const match = /^ffmpeg version (\S+)/.exec(output);
  if (!match) throw new Error('Unable to read the ffmpeg version.');
  if (match[1] !== '8.1.2') throw new Error(`ffmpeg 8.1.2 is required; found ${match[1]}.`);
  return match[1];
}

export async function buildFlipbook(options, dependencies = {}) {
  const run = dependencies.execute ?? execute;
  const capture = dependencies.captureFrames ?? captureFrames;
  const version = await run('ffmpeg', ['-version']);
  assertFfmpegVersion(version.stdout);

  const scenarioDirectory = reviewScenarioDirectory(options);
  const motionDirectory = path.join(scenarioDirectory, 'motion-frames');
  await rm(motionDirectory, { recursive: true, force: true });
  const result = await capture({ ...options, outputDirectory: motionDirectory });
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'violet-flipbook-'));
  try {
    await mkdir(scenarioDirectory, { recursive: true });
    for (let index = 0; index < result.files.length; index += 1) {
      await copyFile(result.files[index], path.join(temporaryDirectory, `frame${String(index).padStart(6, '0')}.png`));
    }
    const inputPattern = path.join(temporaryDirectory, 'frame%06d.png');
    const gif = path.join(scenarioDirectory, 'flipbook.gif');
    const sheet = path.join(scenarioDirectory, 'sheet.png');
    await run('ffmpeg', gifArguments({ fps: options.fps, inputPattern, outputFile: gif }));
    await run('ffmpeg', sheetArguments({
      fps: options.fps,
      inputPattern,
      frameCount: result.files.length,
      outputFile: sheet,
    }));
    return { gif, sheet, frames: result.files };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function usage() {
  return [
    'Usage: node scripts/flipbook.mjs --scene <id> [options]',
    '  --from 0 --to 2 --fps 10',
    '  --seed 42 --state <fixture> --actions <fixture>',
    '  --size 640x360 --dpr 1 --motion full --learning gentle',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseFlipbookArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await buildFlipbook(options);
  console.log(`Wrote ${result.gif} and ${result.sheet}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
