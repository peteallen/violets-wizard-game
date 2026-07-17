import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

const fullScreenAssets = [
  {
    input: 'art/ui/title/source/title-backdrop-v2.png',
    output: 'public/assets/art/ui/title/title-backdrop-v2.webp',
    width: 2560,
    height: 1440,
    quality: 90,
  },
];

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
