import './check-node.mjs';

import { createHash } from 'node:crypto';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { assertEnvironmentIdentity } from '../src/harness/environment.js';
import { assertExactKeys, assertRegistryId } from '../src/harness/registry.js';
import {
  assertOnlyOptions,
  captureFileName,
  normalizeCaptureSelectors,
  parseCliTokens,
  reviewScenarioDirectory,
  scenarioDirectoryName,
} from './snap.mjs';

const ROOT_DIRECTORY = fileURLToPath(new URL('..', import.meta.url));
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function parseFraction(value, label, fallback) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0 || number > 1) throw new TypeError(`${label} must be a number from 0 through 1.`);
  return number;
}

export function parseDiffArgs(argv) {
  const options = parseCliTokens(argv, new Set(['all', 'help']));
  assertOnlyOptions(options, [
    'all', 'help', 'scene', 'state', 'actions', 'seed', 'size', 'dpr', 'motion', 'learning',
    'review-dir', 'timeout-ms', 'goldens-dir', 'threshold', 'max-diff',
  ]);
  if (options.help) return { help: true };
  if (!options.all && !options.scene) throw new TypeError('Provide --scene <id> or --all.');
  const selectors = normalizeCaptureSelectors(options);
  return {
    ...selectors,
    all: Boolean(options.all),
    sceneFilter: options.scene,
    goldensDirectory: path.resolve(options['goldens-dir'] ?? path.join(ROOT_DIRECTORY, 'goldens')),
    threshold: parseFraction(options.threshold, '--threshold', 0.1),
    maximumDifference: parseFraction(options['max-diff'], '--max-diff', 0.005),
    help: false,
  };
}

function assertPositiveInteger(value, pathLabel, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new TypeError(`${pathLabel} must be a positive integer.`);
}

export function validateCaptureManifest(manifest, pathLabel = 'capture manifest') {
  assertExactKeys(manifest, [
    'schemaVersion', 'environment', 'scene', 'state', 'actions', 'scenario', 'seeds', 'profile', 'frames',
  ], pathLabel);
  if (manifest.schemaVersion !== 1) throw new TypeError(`${pathLabel}.schemaVersion must be 1.`);
  assertEnvironmentIdentity(manifest.environment);
  assertRegistryId(manifest.scene, `${pathLabel}.scene`);
  assertRegistryId(manifest.state, `${pathLabel}.state`);
  assertRegistryId(manifest.actions, `${pathLabel}.actions`);
  if (!Array.isArray(manifest.seeds) || manifest.seeds.length === 0) throw new TypeError(`${pathLabel}.seeds must be a non-empty array.`);
  const seeds = new Set();
  manifest.seeds.forEach((seed, index) => {
    assertPositiveInteger(seed, `${pathLabel}.seeds[${index}]`, 0xffffffff);
    if (seeds.has(seed)) throw new TypeError(`${pathLabel}.seeds contains duplicate seed ${seed}.`);
    seeds.add(seed);
  });
  assertExactKeys(manifest.profile, ['width', 'height', 'dpr', 'motion', 'learning'], `${pathLabel}.profile`);
  assertPositiveInteger(manifest.profile.width, `${pathLabel}.profile.width`, 4096);
  assertPositiveInteger(manifest.profile.height, `${pathLabel}.profile.height`, 4096);
  assertPositiveInteger(manifest.profile.dpr, `${pathLabel}.profile.dpr`, 2);
  if (!['full', 'reduced'].includes(manifest.profile.motion)) throw new TypeError(`${pathLabel}.profile.motion is invalid.`);
  if (!['off', 'gentle', 'stretchy'].includes(manifest.profile.learning)) throw new TypeError(`${pathLabel}.profile.learning is invalid.`);
  const expectedScenario = scenarioDirectoryName({
    state: manifest.state,
    actions: manifest.actions,
    motion: manifest.profile.motion,
    learning: manifest.profile.learning,
    width: manifest.profile.width,
    height: manifest.profile.height,
    dpr: manifest.profile.dpr,
  });
  if (manifest.scenario !== expectedScenario) throw new TypeError(`${pathLabel}.scenario must be "${expectedScenario}".`);
  if (!Array.isArray(manifest.frames) || manifest.frames.length === 0) throw new TypeError(`${pathLabel}.frames must be a non-empty array.`);
  const files = new Set();
  manifest.frames.forEach((frame, index) => {
    const framePath = `${pathLabel}.frames[${index}]`;
    assertExactKeys(frame, ['seed', 'frame', 'seconds', 'file', 'sha256'], framePath);
    assertPositiveInteger(frame.seed, `${framePath}.seed`, 0xffffffff);
    if (!seeds.has(frame.seed)) throw new TypeError(`${framePath}.seed is absent from the manifest seed list.`);
    if (!Number.isSafeInteger(frame.frame) || frame.frame < 0) throw new TypeError(`${framePath}.frame must be a non-negative integer.`);
    if (frame.seconds !== frame.frame / 60) throw new TypeError(`${framePath}.seconds does not match its frame.`);
    const expectedFile = captureFileName(frame.seed, frame.frame);
    if (frame.file !== expectedFile) throw new TypeError(`${framePath}.file must be "${expectedFile}".`);
    if (files.has(frame.file)) throw new TypeError(`${pathLabel}.frames contains duplicate file "${frame.file}".`);
    files.add(frame.file);
    if (typeof frame.sha256 !== 'string' || !SHA256_PATTERN.test(frame.sha256)) {
      throw new TypeError(`${framePath}.sha256 must be a lowercase SHA-256 digest.`);
    }
  });
  const usedSeeds = new Set(manifest.frames.map((frame) => frame.seed));
  for (const seed of seeds) {
    if (!usedSeeds.has(seed)) throw new TypeError(`${pathLabel}.seeds includes unused seed ${seed}.`);
  }
  return manifest;
}

export async function readCaptureManifest(file) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read capture manifest ${file}: ${error.message}`);
  }
  return validateCaptureManifest(manifest, file);
}

export function goldenScenarioDirectory(goldensDirectory, manifest) {
  validateCaptureManifest(manifest);
  return path.join(goldensDirectory, manifest.environment.id, manifest.scene, manifest.scenario);
}

export async function readVerifiedCaptureFile(directory, frame, profile) {
  const file = path.join(directory, frame.file);
  const buffer = await readFile(file);
  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== frame.sha256) throw new Error(`Capture checksum mismatch for ${file}. Run snap again before diffing or blessing.`);
  if (profile) {
    const png = PNG.sync.read(buffer);
    const expectedWidth = profile.width * profile.dpr;
    const expectedHeight = profile.height * profile.dpr;
    if (png.width !== expectedWidth || png.height !== expectedHeight) {
      throw new Error(`Capture dimensions for ${file} are ${png.width}x${png.height}; expected ${expectedWidth}x${expectedHeight}.`);
    }
  }
  return buffer;
}

export function validateBlessingRecord(blessing, manifest, pathLabel = 'blessing record') {
  assertExactKeys(blessing, [
    'schemaVersion', 'humanApproved', 'reviewer', 'approvedAt', 'environmentId', 'scene', 'scenario', 'frames',
  ], pathLabel);
  if (blessing.schemaVersion !== 1 || blessing.humanApproved !== true) throw new TypeError(`${pathLabel} must record explicit human approval.`);
  if (typeof blessing.reviewer !== 'string' || blessing.reviewer.trim().length < 2) throw new TypeError(`${pathLabel}.reviewer is invalid.`);
  if (typeof blessing.approvedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(blessing.approvedAt)) {
    throw new TypeError(`${pathLabel}.approvedAt must be an ISO timestamp.`);
  }
  if (blessing.environmentId !== manifest.environment.id) throw new TypeError(`${pathLabel}.environmentId does not match the golden manifest.`);
  if (blessing.scene !== manifest.scene || blessing.scenario !== manifest.scenario) {
    throw new TypeError(`${pathLabel} does not match the golden scenario.`);
  }
  const expectedFrames = manifest.frames.map((frame) => frame.file);
  if (!Array.isArray(blessing.frames) || blessing.frames.length !== expectedFrames.length
    || blessing.frames.some((file, index) => file !== expectedFrames[index])) {
    throw new TypeError(`${pathLabel}.frames does not match the golden manifest.`);
  }
  return blessing;
}

export async function readBlessingRecord(file, manifest) {
  let blessing;
  try {
    blessing = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read human blessing record ${file}: ${error.message}`);
  }
  return validateBlessingRecord(blessing, manifest, file);
}

export function comparePngBuffers(actualBuffer, expectedBuffer, threshold = 0.1) {
  const actual = PNG.sync.read(actualBuffer);
  const expected = PNG.sync.read(expectedBuffer);
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(`PNG dimensions differ: actual ${actual.width}x${actual.height}, golden ${expected.width}x${expected.height}.`);
  }
  const diff = new PNG({ width: actual.width, height: actual.height });
  const differentPixels = pixelmatch(
    actual.data,
    expected.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold },
  );
  return {
    width: actual.width,
    height: actual.height,
    differentPixels,
    fraction: differentPixels / (actual.width * actual.height),
    diffBuffer: PNG.sync.write(diff),
  };
}

function sameFrameSet(actual, expected) {
  const actualFiles = actual.frames.map((frame) => frame.file).sort();
  const expectedFiles = expected.frames.map((frame) => frame.file).sort();
  return actualFiles.length === expectedFiles.length && actualFiles.every((file, index) => file === expectedFiles[index]);
}

export async function diffScenario(captureManifestFile, options) {
  const captureManifest = await readCaptureManifest(captureManifestFile);
  const reviewDirectory = path.dirname(captureManifestFile);
  const goldenDirectory = goldenScenarioDirectory(options.goldensDirectory, captureManifest);
  const goldenManifestFile = path.join(goldenDirectory, 'capture.json');
  const goldenManifest = await readCaptureManifest(goldenManifestFile);
  await readBlessingRecord(path.join(goldenDirectory, 'blessing.json'), goldenManifest);
  if (goldenManifest.environment.id !== captureManifest.environment.id) throw new Error('Capture and golden environment identities differ.');
  for (const field of ['scene', 'state', 'actions', 'scenario']) {
    if (goldenManifest[field] !== captureManifest[field]) throw new Error(`Capture and golden ${field} values differ.`);
  }
  if (JSON.stringify(goldenManifest.profile) !== JSON.stringify(captureManifest.profile)) {
    throw new Error('Capture and golden profiles differ.');
  }
  if (!sameFrameSet(captureManifest, goldenManifest)) {
    throw new Error(`Capture and golden frame sets differ for ${captureManifest.scene}; human review and re-blessing are required.`);
  }
  const goldenFrames = new Map(goldenManifest.frames.map((frame) => [frame.file, frame]));
  const results = [];
  for (const frame of captureManifest.frames) {
    const actual = await readVerifiedCaptureFile(reviewDirectory, frame, captureManifest.profile);
    const expected = await readVerifiedCaptureFile(goldenDirectory, goldenFrames.get(frame.file), goldenManifest.profile);
    const comparison = comparePngBuffers(actual, expected, options.threshold);
    const diffFile = path.join(reviewDirectory, `diff_${frame.file}`);
    if (comparison.differentPixels > 0) await writeFile(diffFile, comparison.diffBuffer);
    else await rm(diffFile, { force: true });
    results.push({ file: frame.file, ...comparison, passed: comparison.fraction <= options.maximumDifference });
  }
  return { captureManifest, goldenDirectory, results, passed: results.every((result) => result.passed) };
}

async function walkCaptureManifests(directory, found) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name !== 'motion-frames') await walkCaptureManifests(path.join(directory, entry.name), found);
    } else if (entry.isFile() && entry.name === 'capture.json') {
      found.push(path.join(directory, entry.name));
    }
  }
}

export async function findCaptureManifests(reviewDirectory, sceneFilter) {
  const manifests = [];
  const root = sceneFilter ? path.join(reviewDirectory, sceneFilter) : reviewDirectory;
  await walkCaptureManifests(root, manifests);
  return manifests.sort();
}

export async function runDiff(options) {
  const manifests = options.all
    ? await findCaptureManifests(options.reviewDirectory, options.sceneFilter)
    : [path.join(reviewScenarioDirectory(options), 'capture.json')];
  if (manifests.length === 0) throw new Error('No review capture manifests were found. Run snap first.');
  const reports = [];
  for (const manifest of manifests) reports.push(await diffScenario(manifest, options));
  return reports;
}

function usage() {
  return [
    'Usage: node scripts/diff.mjs --scene <id> [capture options]',
    '       node scripts/diff.mjs --all [--scene <filter>]',
    'Defaults: --threshold 0.1 --max-diff 0.005',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseDiffArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  const reports = await runDiff(options);
  let failed = false;
  for (const report of reports) {
    for (const result of report.results) {
      console.log(`${report.captureManifest.scene} ${result.file}: ${(result.fraction * 100).toFixed(3)}% different`);
      if (!result.passed) failed = true;
    }
  }
  if (failed) {
    throw new Error(`Golden regression exceeded the ${(options.maximumDifference * 100).toFixed(3)}% difference budget. Review the generated diff PNGs.`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
