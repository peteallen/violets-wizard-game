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
const temporaryDirectory = path.join(root, 'tmp/imagegen/hud-v1');

const assets = [
  'satchel-closed',
  'quest-compass-base',
  'quest-compass-needle',
  'wand-holster',
  'wand-violet-first-wand',
].map((id) => ({
  id,
  input: `art/ui/hud/source/${id}-chroma.png`,
  output: `public/assets/art/ui/hud/${id}.webp`,
}));

mkdirSync(temporaryDirectory, { recursive: true });

for (const asset of assets) {
  const input = path.join(root, asset.input);
  const keyedPng = path.join(temporaryDirectory, `${asset.id}-alpha.png`);
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
    '-resize', '512', '512',
    keyedPng,
    '-o', output,
  ], { stdio: 'inherit' });
}
