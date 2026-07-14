import './check-node.mjs';

// Slice a generated character part sheet into keyed, trimmed part PNGs.
// Grown from the SP-E spike slicer (art/spikes/sp-e-violet/slice.mjs) into the
// shared pipeline step for every painted-parts character (D48).
//
//   node scripts/slice-parts.mjs --sheet <sheet.png> --map <rects.json> --out <dir> [--tolerance 28]
//
// The map file is {"partName": {"x":0,"y":0,"w":100,"h":100}, ...} in sheet pixels.
// Keying: sample the modal border color per crop (corner averages break when a
// crop edge clips a neighboring part — the SP-E backHair lesson), flood from the
// borders, keep the dominant connected component (kills neighbor slivers),
// feather one pixel, trim to content.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const sheetPath = arg('sheet');
const mapPath = arg('map');
const outDir = arg('out');
const TOL = Number(arg('tolerance', '28'));
if (!sheetPath || !mapPath || !outDir) {
  console.error('Usage: node scripts/slice-parts.mjs --sheet <png> --map <rects.json> --out <dir> [--tolerance 28]');
  process.exit(1);
}

const sheet = PNG.sync.read(fs.readFileSync(sheetPath));
const rects = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const idx = (png, x, y) => (png.width * y + x) << 2;

function crop(src, r) {
  const out = new PNG({ width: r.w, height: r.h });
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      const s = idx(src, r.x + x, r.y + y);
      const d = idx(out, x, y);
      out.data[d] = src.data[s];
      out.data[d + 1] = src.data[s + 1];
      out.data[d + 2] = src.data[s + 2];
      out.data[d + 3] = 255;
    }
  }
  return out;
}

function keyBackground(png) {
  const { width: w, height: h, data } = png;
  const buckets = new Map();
  const borderPixels = [];
  for (let x = 0; x < w; x++) borderPixels.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) borderPixels.push([0, y], [w - 1, y]);
  for (const [x, y] of borderPixels) {
    const i = idx(png, x, y);
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
    buckets.set(key, b);
  }
  const modal = [...buckets.values()].sort((a, c) => c.n - a.n)[0];
  const br = modal.r / modal.n, bg = modal.g / modal.n, bb = modal.b / modal.n;
  const isBgColor = (i) =>
    Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb) < TOL * 3;

  const bgMask = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, x + w * (h - 1));
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (bgMask[p]) continue;
    if (!isBgColor(p << 2)) continue;
    bgMask[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  const label = new Int32Array(w * h).fill(-1);
  let best = { id: -1, size: 0 };
  let nextId = 0;
  for (let p = 0; p < w * h; p++) {
    if (bgMask[p] || label[p] !== -1) continue;
    const id = nextId++;
    let size = 0;
    const q = [p];
    label[p] = id;
    while (q.length) {
      const c = q.pop();
      size++;
      const x = c % w;
      for (const n of [c - 1, c + 1, c - w, c + w]) {
        if (n < 0 || n >= w * h) continue;
        if (Math.abs((n % w) - x) > 1) continue;
        if (!bgMask[n] && label[n] === -1) { label[n] = id; q.push(n); }
      }
    }
    if (size > best.size) best = { id, size };
  }

  for (let p = 0; p < w * h; p++) {
    const a = (p << 2) + 3;
    if (bgMask[p] || label[p] !== best.id) data[a] = 0;
  }
  const snapshot = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) snapshot[p] = data[(p << 2) + 3] ? 1 : 0;
  for (let p = 0; p < w * h; p++) {
    if (!snapshot[p]) continue;
    const x = p % w, y = (p / w) | 0;
    const bare =
      (x > 0 && !snapshot[p - 1]) || (x < w - 1 && !snapshot[p + 1]) ||
      (y > 0 && !snapshot[p - w]) || (y < h - 1 && !snapshot[p + w]);
    if (bare) data[(p << 2) + 3] = 140;
  }
}

function trim(png, pad = 2) {
  const { width: w, height: h, data } = png;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[idx(png, x, y) + 3]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return png;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const out = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const s = idx(png, minX + x, minY + y);
      const d = idx(out, x, y);
      for (let k = 0; k < 4; k++) out.data[d + k] = data[s + k];
    }
  }
  return out;
}

for (const [name, rect] of Object.entries(rects)) {
  const piece = crop(sheet, rect);
  keyBackground(piece);
  const trimmed = trim(piece);
  fs.writeFileSync(path.join(outDir, `${name}.png`), PNG.sync.write(trimmed));
  console.log(`${name}: ${trimmed.width}x${trimmed.height}`);
}
console.log(`Sliced ${Object.keys(rects).length} part(s) into ${outDir}`);
