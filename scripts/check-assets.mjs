import { access, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetManifest } from '../src/game/core/assetManifest.js';
import { validateAssetManifestEntry } from '../src/game/contracts.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');
const requiredFoundation = [resolve(ROOT, 'index.html'), resolve(ROOT, 'src/main.js')];
const failures = [];

for (const path of requiredFoundation) {
  try {
    await access(path);
  } catch {
    failures.push(`missing foundation file: ${relative(ROOT, path)}`);
  }
}

const manifestedPaths = new Set();
for (const [key, entry] of Object.entries(assetManifest)) {
  try {
    validateAssetManifestEntry(entry, `assetManifest[${JSON.stringify(key)}]`);
  } catch (error) {
    failures.push(error.message);
    continue;
  }
  const path = resolve(PUBLIC, entry.path);
  manifestedPaths.add(path);
  try {
    const info = await stat(path);
    if (!info.isFile() || info.size <= 1024) failures.push(`${key}: file is empty or implausibly small (${entry.path})`);
  } catch {
    failures.push(`${key}: missing file ${entry.path}`);
  }
}

for (const path of await walk(resolve(PUBLIC, 'assets'))) {
  if (!manifestedPaths.has(path)) failures.push(`orphaned public asset: ${relative(PUBLIC, path)}`);
}

if (failures.length) {
  console.error(`Asset check failed with ${failures.length} problem${failures.length === 1 ? '' : 's'}:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Asset check passed: ${Object.keys(assetManifest).length} manifest keys resolve to ${manifestedPaths.size} production files.`);

async function walk(root) {
  const paths = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}
