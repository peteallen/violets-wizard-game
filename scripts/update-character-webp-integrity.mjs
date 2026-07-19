import './check-node.mjs';

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionCharacterCatalog } from '../src/game/characters/productionCatalog.js';
import { buildCharacterWebpBaseline } from './character-webp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');
const OUTPUT = resolve(ROOT, 'scripts/character-webp-integrity.json');

const characterPaths = Object.values(productionCharacterCatalog.assets).map(({ path }) => path);
const baseline = await buildCharacterWebpBaseline({ publicRoot: PUBLIC, characterPaths });
await writeFile(OUTPUT, `${JSON.stringify(baseline, null, 2)}\n`);

console.log(
  `Wrote ${characterPaths.length} verified character WebP records to `
  + `${OUTPUT.slice(ROOT.length + 1)}.`,
);
