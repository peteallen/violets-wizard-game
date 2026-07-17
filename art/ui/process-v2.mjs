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
const temporaryDirectory = path.join(root, 'tmp/imagegen/ui-v2');

const keyedAssets = [
  {
    input: 'art/ui/title/return-envelope-v2-chroma.png',
    output: 'public/assets/art/ui/title/return-envelope-v2.webp',
    width: 900,
    height: 500,
  },
  {
    input: 'art/ui/satchel/source/card-frame-v2-chroma.png',
    output: 'public/assets/art/ui/satchel/card-frame-v2.webp',
    width: 500,
    height: 560,
  },
  {
    input: 'art/ui/satchel/source/card-pocket-v2-chroma.png',
    output: 'public/assets/art/ui/satchel/card-pocket-v2.webp',
    width: 500,
    height: 560,
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
    '-q', '90',
    '-alpha_q', '100',
    '-resize', String(asset.width), String(asset.height),
    keyedPng,
    '-o', output,
  ], { stdio: 'inherit' });
}

const spreadSource = path.join(root, 'art/ui/satchel/source/spread-v2.png');
const spreadOutput = path.join(root, 'public/assets/art/ui/satchel/spread-v2.webp');
mkdirSync(path.dirname(spreadOutput), { recursive: true });
execFileSync('cwebp', [
  '-quiet',
  '-q', '90',
  '-resize', '2560', '1440',
  spreadSource,
  '-o', spreadOutput,
], { stdio: 'inherit' });
