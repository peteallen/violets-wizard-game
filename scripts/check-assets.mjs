import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const required = [
  new URL('../index.html', import.meta.url),
  new URL('../src/main.js', import.meta.url),
];

for (const url of required) await access(fileURLToPath(url));
console.log(`Asset check passed (${required.length} foundation files).`);
