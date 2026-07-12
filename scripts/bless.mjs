import './check-node.mjs';

import { copyFile, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  goldenScenarioDirectory,
  readCaptureManifest,
  readVerifiedCaptureFile,
} from './diff.mjs';
import {
  assertOnlyOptions,
  normalizeCaptureSelectors,
  parseCliTokens,
  reviewScenarioDirectory,
} from './snap.mjs';

const ROOT_DIRECTORY = fileURLToPath(new URL('..', import.meta.url));

export function requireHumanApproval({ humanApproved, reviewer }) {
  if (humanApproved !== true) {
    throw new Error('Blessing requires --human-approved after a person has reviewed the PNGs and motion artifact.');
  }
  if (typeof reviewer !== 'string' || reviewer.trim().length < 2) {
    throw new Error('Blessing requires --reviewer with the approving person’s name.');
  }
  return reviewer.trim();
}

export function parseBlessArgs(argv) {
  const options = parseCliTokens(argv, new Set(['human-approved', 'help']));
  assertOnlyOptions(options, [
    'human-approved', 'help', 'reviewer', 'scene', 'state', 'actions', 'seed', 'size', 'dpr',
    'motion', 'learning', 'review-dir', 'timeout-ms', 'goldens-dir',
  ]);
  if (options.help) return { help: true };
  if (!options.scene) throw new TypeError('--scene is required; blessing never defaults to a broad scope.');
  const selectors = normalizeCaptureSelectors(options);
  return {
    ...selectors,
    humanApproved: Boolean(options['human-approved']),
    reviewer: options.reviewer,
    goldensDirectory: path.resolve(options['goldens-dir'] ?? path.join(ROOT_DIRECTORY, 'goldens')),
    help: false,
  };
}

export async function blessCapture(options) {
  const reviewer = requireHumanApproval(options);
  const reviewDirectory = reviewScenarioDirectory(options);
  const captureManifestFile = path.join(reviewDirectory, 'capture.json');
  const manifest = await readCaptureManifest(captureManifestFile);
  if (manifest.scene !== options.scene || manifest.state !== options.state || manifest.actions !== options.actions) {
    throw new Error('The capture manifest does not match the requested scene and fixtures.');
  }
  if (manifest.scenario !== path.basename(reviewDirectory)) {
    throw new Error('The capture manifest profile does not match the requested review directory.');
  }
  for (const frame of manifest.frames) await readVerifiedCaptureFile(reviewDirectory, frame, manifest.profile);

  const destination = goldenScenarioDirectory(options.goldensDirectory, manifest);
  const parent = path.dirname(destination);
  await mkdir(parent, { recursive: true });
  const staging = await mkdtemp(path.join(parent, `.${path.basename(destination)}.tmp-`));
  try {
    for (const frame of manifest.frames) {
      await copyFile(path.join(reviewDirectory, frame.file), path.join(staging, frame.file));
    }
    await copyFile(captureManifestFile, path.join(staging, 'capture.json'));
    const blessing = {
      schemaVersion: 1,
      humanApproved: true,
      reviewer,
      approvedAt: new Date().toISOString(),
      environmentId: manifest.environment.id,
      scene: manifest.scene,
      scenario: manifest.scenario,
      frames: manifest.frames.map((frame) => frame.file),
    };
    await writeFile(path.join(staging, 'blessing.json'), `${JSON.stringify(blessing, null, 2)}\n`);
    await rm(destination, { recursive: true, force: true });
    await rename(staging, destination);
    return { destination, blessing };
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

function usage() {
  return [
    'Usage: node scripts/bless.mjs --scene <id> --human-approved --reviewer <name> [capture options]',
    'This command replaces one scenario’s golden PNGs only after explicit human approval.',
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseBlessArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await blessCapture(options);
  console.log(`Blessed ${result.blessing.frames.length} frame(s) into ${result.destination}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
