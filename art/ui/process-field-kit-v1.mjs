import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const codexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME, '.codex');
const removeChroma = path.join(
  codexHome,
  'skills/.system/imagegen/scripts/remove_chroma_key.py',
);
const temporaryDirectory = path.join(root, 'tmp/imagegen/field-kit-v1');

const keyedAssets = [
  {
    input: 'art/ui/objective/source/objective-reminder-v2-chroma.png',
    output: 'public/assets/art/ui/objective/objective-reminder-v2.webp',
    crop: { x: 64, y: 96, width: 1856, height: 624 },
    width: 1840,
    height: 620,
    quality: 90,
  },
];

const fullScreenAssets = [
  {
    input: 'art/ui/title/source/title-backdrop-v2.png',
    output: 'public/assets/art/ui/title/title-backdrop-v2.webp',
    width: 2560,
    height: 1440,
    quality: 90,
  },
];

mkdirSync(temporaryDirectory, { recursive: true });

for (const asset of keyedAssets) {
  const input = path.join(root, asset.input);
  const keyedPng = path.join(
    temporaryDirectory,
    `${path.basename(asset.input, path.extname(asset.input))}-alpha.png`,
  );
  const output = path.join(root, asset.output);
  mkdirSync(path.dirname(output), { recursive: true });
  execFileSync('python3', [
    removeChroma,
    '--input', input,
    '--out', keyedPng,
    '--auto-key', 'border',
    '--soft-matte',
    '--transparent-threshold', '12',
    '--opaque-threshold', '220',
    '--despill',
  ], { stdio: 'inherit' });
  execFileSync('cwebp', [
    '-quiet',
    '-q', String(asset.quality),
    '-alpha_q', '100',
    '-crop',
    String(asset.crop.x),
    String(asset.crop.y),
    String(asset.crop.width),
    String(asset.crop.height),
    '-resize', String(asset.width), String(asset.height),
    keyedPng,
    '-o', output,
  ], { stdio: 'inherit' });
}

for (const asset of fullScreenAssets) {
  const input = path.join(root, asset.input);
  const output = path.join(root, asset.output);
  mkdirSync(path.dirname(output), { recursive: true });
  execFileSync('cwebp', [
    '-quiet',
    '-q', String(asset.quality),
    '-resize', String(asset.width), String(asset.height),
    input,
    '-o', output,
  ], { stdio: 'inherit' });
}
