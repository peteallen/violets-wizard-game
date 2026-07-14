import './check-node.mjs';

import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  throw new Error(`Aligned character extraction failed: ${message}`);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertInteger(value, path, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail(`${path} must be an integer from ${min} through ${max}.`);
  }
  return value;
}

function assertRelativePath(value, path) {
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('/') || value.includes('\\')) {
    fail(`${path} must be a non-empty repo-relative POSIX path.`);
  }
  const absolute = resolve(ROOT, value);
  if (absolute !== ROOT && !absolute.startsWith(`${ROOT}${sep}`)) fail(`${path} escapes the repository.`);
  return absolute;
}

function assertPathUnder(value, path, prefix) {
  const absolute = assertRelativePath(value, path);
  const allowed = resolve(ROOT, prefix);
  if (absolute !== allowed && !absolute.startsWith(`${allowed}${sep}`)) {
    fail(`${path} must stay under ${prefix}.`);
  }
  return absolute;
}

export function validateAlignedCharacterAssetSpec(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) fail('spec must be an object.');
  if (spec.version !== 1) fail('spec.version must be 1.');
  if (typeof spec.id !== 'string' || !/^[a-z0-9.-]+$/.test(spec.id)) fail('spec.id is invalid.');

  const canvas = spec.canvas;
  if (!canvas || typeof canvas !== 'object' || Array.isArray(canvas)) fail('spec.canvas must be an object.');
  assertInteger(canvas.width, 'spec.canvas.width', { min: 1, max: 4096 });
  assertInteger(canvas.height, 'spec.canvas.height', { min: 1, max: 4096 });

  const alpha = spec.alpha;
  if (!alpha || typeof alpha !== 'object' || Array.isArray(alpha)) fail('spec.alpha must be an object.');
  if (typeof alpha.maskSource !== 'string' || alpha.maskSource.length === 0) {
    fail('spec.alpha.maskSource must name a variant.');
  }
  assertInteger(alpha.opaqueCyanExcess, 'spec.alpha.opaqueCyanExcess', { min: -255, max: 254 });
  assertInteger(alpha.transparentCyanExcess, 'spec.alpha.transparentCyanExcess', { min: -254, max: 255 });
  if (alpha.opaqueCyanExcess >= alpha.transparentCyanExcess) {
    fail('spec.alpha.opaqueCyanExcess must be below transparentCyanExcess.');
  }
  assertInteger(alpha.edgeSpillRadius, 'spec.alpha.edgeSpillRadius', { min: 0, max: 32 });
  assertInteger(alpha.edgeSpillOpaqueCyanExcess, 'spec.alpha.edgeSpillOpaqueCyanExcess', { min: -255, max: 254 });
  assertInteger(alpha.edgeSpillMaxGreenBlueDelta, 'spec.alpha.edgeSpillMaxGreenBlueDelta', { min: 0, max: 255 });
  if (alpha.edgeSpillOpaqueCyanExcess >= alpha.transparentCyanExcess) {
    fail('spec.alpha.edgeSpillOpaqueCyanExcess must be below transparentCyanExcess.');
  }
  assertInteger(alpha.matteLowAlpha, 'spec.alpha.matteLowAlpha', { min: 0, max: 254 });
  assertInteger(alpha.matteHighAlpha, 'spec.alpha.matteHighAlpha', { min: 1, max: 255 });
  if (alpha.matteLowAlpha >= alpha.matteHighAlpha) {
    fail('spec.alpha.matteLowAlpha must be below matteHighAlpha.');
  }
  assertInteger(alpha.edgeColorRadius, 'spec.alpha.edgeColorRadius', { min: 0, max: 32 });

  if (!spec.variants || typeof spec.variants !== 'object' || Array.isArray(spec.variants)) {
    fail('spec.variants must be an object.');
  }
  const variants = Object.entries(spec.variants);
  if (variants.length === 0) fail('spec.variants must not be empty.');
  if (!Object.hasOwn(spec.variants, alpha.maskSource)) {
    fail(`spec.alpha.maskSource references unknown variant ${alpha.maskSource}.`);
  }
  const outputs = new Set();
  for (const [name, variant] of variants) {
    if (!/^[a-z0-9-]+$/.test(name)) fail(`variant name ${name} is invalid.`);
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
      fail(`spec.variants.${name} must be an object.`);
    }
    assertPathUnder(variant.source, `spec.variants.${name}.source`, 'art/characters');
    assertPathUnder(variant.output, `spec.variants.${name}.output`, 'public/assets/art/characters');
    if (!/^[a-f0-9]{64}$/.test(variant.sha256 ?? '')) {
      fail(`spec.variants.${name}.sha256 must be a lowercase SHA-256 digest.`);
    }
    if (outputs.has(variant.output)) fail(`multiple variants write ${variant.output}.`);
    outputs.add(variant.output);
  }
  return spec;
}

export function deriveCyanAlphaMask(png, {
  opaqueCyanExcess,
  transparentCyanExcess,
  edgeSpillRadius = 0,
  edgeSpillOpaqueCyanExcess = opaqueCyanExcess,
  edgeSpillMaxGreenBlueDelta = 0,
  matteLowAlpha = 0,
  matteHighAlpha = 255,
}) {
  const total = png.width * png.height;
  const alpha = Buffer.allocUnsafe(total);
  let spillSuppressedPixels = 0;
  let matteRemovedPixels = 0;
  let matteHardenedPixels = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  const span = transparentCyanExcess - opaqueCyanExcess;

  for (let pixel = 0; pixel < total; pixel += 1) {
    const offset = pixel * 4;
    const cyanExcess = Math.min(png.data[offset + 1], png.data[offset + 2]) - png.data[offset];
    let value;
    if (cyanExcess >= transparentCyanExcess) value = 0;
    else if (cyanExcess <= opaqueCyanExcess) value = 255;
    else value = Math.round(255 * (transparentCyanExcess - cyanExcess) / span);
    alpha[pixel] = value;

  }

  if (edgeSpillRadius > 0) {
    const distances = new Uint16Array(total);
    distances.fill(65535);
    for (let pixel = 0; pixel < total; pixel += 1) if (alpha[pixel] === 0) distances[pixel] = 0;
    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const pixel = y * png.width + x;
        if (distances[pixel] === 0) continue;
        let nearest = distances[pixel];
        if (x > 0) nearest = Math.min(nearest, distances[pixel - 1] + 1);
        if (y > 0) {
          nearest = Math.min(nearest, distances[pixel - png.width] + 1);
          if (x > 0) nearest = Math.min(nearest, distances[pixel - png.width - 1] + 1);
          if (x + 1 < png.width) nearest = Math.min(nearest, distances[pixel - png.width + 1] + 1);
        }
        distances[pixel] = nearest;
      }
    }
    for (let y = png.height - 1; y >= 0; y -= 1) {
      for (let x = png.width - 1; x >= 0; x -= 1) {
        const pixel = y * png.width + x;
        if (distances[pixel] === 0) continue;
        let nearest = distances[pixel];
        if (x + 1 < png.width) nearest = Math.min(nearest, distances[pixel + 1] + 1);
        if (y + 1 < png.height) {
          nearest = Math.min(nearest, distances[pixel + png.width] + 1);
          if (x > 0) nearest = Math.min(nearest, distances[pixel + png.width - 1] + 1);
          if (x + 1 < png.width) nearest = Math.min(nearest, distances[pixel + png.width + 1] + 1);
        }
        distances[pixel] = nearest;
      }
    }

    const edgeSpan = transparentCyanExcess - edgeSpillOpaqueCyanExcess;
    for (let pixel = 0; pixel < total; pixel += 1) {
      if (alpha[pixel] === 0 || distances[pixel] > edgeSpillRadius) continue;
      const offset = pixel * 4;
      const green = png.data[offset + 1];
      const blue = png.data[offset + 2];
      if (Math.abs(green - blue) > edgeSpillMaxGreenBlueDelta) continue;
      const cyanExcess = Math.min(green, blue) - png.data[offset];
      if (cyanExcess <= edgeSpillOpaqueCyanExcess) continue;
      const edgeAlpha = Math.round(255 * (transparentCyanExcess - cyanExcess) / edgeSpan);
      const refined = Math.max(1, Math.min(254, edgeAlpha));
      if (refined < alpha[pixel]) {
        alpha[pixel] = refined;
        spillSuppressedPixels += 1;
      }
    }
  }

  if (matteLowAlpha > 0 || matteHighAlpha < 255) {
    const matteSpan = matteHighAlpha - matteLowAlpha;
    for (let pixel = 0; pixel < total; pixel += 1) {
      const before = alpha[pixel];
      if (before === 0 || before === 255) continue;
      if (before <= matteLowAlpha) {
        alpha[pixel] = 0;
        matteRemovedPixels += 1;
      } else if (before >= matteHighAlpha) {
        alpha[pixel] = 255;
        matteHardenedPixels += 1;
      } else {
        const refined = Math.round(255 * (before - matteLowAlpha) / matteSpan);
        alpha[pixel] = refined;
        if (refined < before) matteRemovedPixels += 1;
        else if (refined > before) matteHardenedPixels += 1;
      }
    }
  }

  let transparentPixels = 0;
  let softPixels = 0;
  let opaquePixels = 0;
  for (let pixel = 0; pixel < total; pixel += 1) {
    const value = alpha[pixel];
    if (value === 0) transparentPixels += 1;
    else {
      if (value === 255) opaquePixels += 1;
      else softPixels += 1;
      const x = pixel % png.width;
      const y = Math.floor(pixel / png.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (transparentPixels === 0 || opaquePixels === 0 || maxX < minX || maxY < minY) {
    fail('cyan extraction did not produce both transparent background and opaque character pixels.');
  }
  return Object.freeze({
    alpha,
    stats: Object.freeze({
      transparentPixels,
      softPixels,
      opaquePixels,
      spillSuppressedPixels,
      matteRemovedPixels,
      matteHardenedPixels,
      bounds: Object.freeze({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      }),
    }),
  });
}

export function deriveTransparentBackgroundColor(png, alpha) {
  if (alpha.length !== png.width * png.height) fail('alpha mask dimensions do not match the source canvas.');
  const sums = [0, 0, 0];
  let pixels = 0;
  for (let pixel = 0; pixel < alpha.length; pixel += 1) {
    if (alpha[pixel] !== 0) continue;
    const offset = pixel * 4;
    sums[0] += png.data[offset];
    sums[1] += png.data[offset + 1];
    sums[2] += png.data[offset + 2];
    pixels += 1;
  }
  if (pixels === 0) fail('alpha mask has no transparent background from which to remove cyan spill.');
  return Object.freeze(sums.map((sum) => Math.round(sum / pixels)));
}

export function deriveAlphaEdgeDistances(alpha, width, height) {
  if (alpha.length !== width * height) fail('alpha mask dimensions do not match the edge-distance canvas.');
  const distances = new Uint16Array(alpha.length);
  distances.fill(65535);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) if (alpha[pixel] === 0) distances[pixel] = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      if (distances[pixel] === 0) continue;
      let nearest = distances[pixel];
      if (x > 0) nearest = Math.min(nearest, distances[pixel - 1] + 1);
      if (y > 0) {
        nearest = Math.min(nearest, distances[pixel - width] + 1);
        if (x > 0) nearest = Math.min(nearest, distances[pixel - width - 1] + 1);
        if (x + 1 < width) nearest = Math.min(nearest, distances[pixel - width + 1] + 1);
      }
      distances[pixel] = nearest;
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const pixel = y * width + x;
      if (distances[pixel] === 0) continue;
      let nearest = distances[pixel];
      if (x + 1 < width) nearest = Math.min(nearest, distances[pixel + 1] + 1);
      if (y + 1 < height) {
        nearest = Math.min(nearest, distances[pixel + width] + 1);
        if (x > 0) nearest = Math.min(nearest, distances[pixel + width - 1] + 1);
        if (x + 1 < width) nearest = Math.min(nearest, distances[pixel + width + 1] + 1);
      }
      distances[pixel] = nearest;
    }
  }
  return distances;
}

export function deriveOpaqueEdgeDonors(png, alpha, maxRadius = 16) {
  const { width, height } = png;
  if (alpha.length !== width * height) fail('alpha mask dimensions do not match the donor canvas.');
  const donors = new Int32Array(alpha.length).fill(-1);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) {
    if (alpha[pixel] <= 0 || alpha[pixel] >= 255) continue;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const sourceOffset = pixel * 4;
    const sourceGreen = png.data[sourceOffset + 1];
    const sourceBlue = png.data[sourceOffset + 2];
    const sourceCyanExcess = Math.min(sourceGreen, sourceBlue) - png.data[sourceOffset];
    const preferWarmDonor = Math.abs(sourceGreen - sourceBlue) <= 70 && sourceCyanExcess > -20;
    let fallback = -1;
    let fallbackDistance = Number.POSITIVE_INFINITY;
    for (let radius = 1; radius <= maxRadius; radius += 1) {
      let preferred = -1;
      let preferredDistance = Number.POSITIVE_INFINITY;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const candidateX = x + dx;
          const candidateY = y + dy;
          if (candidateX < 0 || candidateX >= width || candidateY < 0 || candidateY >= height) continue;
          const candidate = candidateY * width + candidateX;
          if (alpha[candidate] !== 255) continue;
          const distance = dx * dx + dy * dy;
          if (fallback === -1 || distance < fallbackDistance || (distance === fallbackDistance && candidate < fallback)) {
            fallback = candidate;
            fallbackDistance = distance;
          }
          if (preferWarmDonor) {
            const candidateOffset = candidate * 4;
            const red = png.data[candidateOffset];
            const green = png.data[candidateOffset + 1];
            const blue = png.data[candidateOffset + 2];
            if (
              red >= green - 2
              && red >= blue - 10
              && (preferred === -1 || distance < preferredDistance || (distance === preferredDistance && candidate < preferred))
            ) {
              preferred = candidate;
              preferredDistance = distance;
            }
          }
        }
      }
      if (preferred !== -1) {
        donors[pixel] = preferred;
        break;
      }
      if (!preferWarmDonor && fallback !== -1) {
        donors[pixel] = fallback;
        break;
      }
    }
    if (donors[pixel] === -1) donors[pixel] = fallback;
  }
  return donors;
}

export function applyAlignedAlphaMask(png, alpha, background, donors, edgeDistances, edgeColorRadius) {
  if (alpha.length !== png.width * png.height) fail('alpha mask dimensions do not match the source canvas.');
  if (!Array.isArray(background) || background.length !== 3) fail('background must be an RGB triplet.');
  if (!(donors instanceof Int32Array) || donors.length !== alpha.length) fail('donor map dimensions do not match the source canvas.');
  if (!(edgeDistances instanceof Uint16Array) || edgeDistances.length !== alpha.length) fail('edge-distance map dimensions do not match the source canvas.');
  const output = new PNG({ width: png.width, height: png.height, colorType: 6 });
  png.data.copy(output.data);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) {
    const offset = pixel * 4;
    const value = alpha[pixel];
    output.data[offset + 3] = value;
    if (value <= 0) continue;

    // The model paints antialiased edge pixels over the cyan source field.
    // Once those pixels become translucent, retaining their composited RGB
    // would draw the source field a second time as a turquoise halo. Extend
    // the nearest fully opaque approved art color beneath the soft alpha,
    // which is the standard texture-edge dilation treatment. If a very thin
    // isolated wisp has no opaque donor nearby, solve source-over instead.
    if (value < 255) {
      const donor = donors[pixel];
      if (donor >= 0) {
        const donorOffset = donor * 4;
        output.data[offset] = png.data[donorOffset];
        output.data[offset + 1] = png.data[donorOffset + 1];
        output.data[offset + 2] = png.data[donorOffset + 2];
      } else {
        const coverage = value / 255;
        for (let channel = 0; channel < 3; channel += 1) {
          const foreground = (
            png.data[offset + channel] - background[channel] * (1 - coverage)
          ) / coverage;
          output.data[offset + channel] = Math.max(0, Math.min(255, Math.round(foreground)));
        }
      }
    }

    if (edgeColorRadius > 0 && edgeDistances[pixel] <= edgeColorRadius) {
      const red = output.data[offset];
      let green = output.data[offset + 1];
      let blue = output.data[offset + 2];
      const cyanSpill = Math.max(0, Math.min(green, blue) - red);
      if (blue > green + 10) {
        green = Math.max(0, green - cyanSpill);
        blue = Math.max(0, blue - cyanSpill);
      } else if (cyanSpill > 0 || (green > red && blue < green)) {
        green = Math.min(Math.max(0, green - cyanSpill), Math.round(red * 0.9));
        blue = Math.min(Math.max(0, blue - cyanSpill), Math.round(red * 0.75));
      }
      output.data[offset + 1] = green;
      output.data[offset + 2] = blue;
    }
  }
  return output;
}

async function loadPinnedPng(variantName, variant, canvas) {
  const sourcePath = assertPathUnder(variant.source, `spec.variants.${variantName}.source`, 'art/characters');
  const bytes = await readFile(sourcePath);
  const actualHash = sha256(bytes);
  if (actualHash !== variant.sha256) {
    fail(`${variant.source} has SHA-256 ${actualHash}; expected ${variant.sha256}.`);
  }
  let png;
  try {
    png = PNG.sync.read(bytes);
  } catch (error) {
    fail(`${variant.source} is not a readable PNG: ${error.message}`);
  }
  if (png.width !== canvas.width || png.height !== canvas.height) {
    fail(`${variant.source} is ${png.width}x${png.height}; expected ${canvas.width}x${canvas.height}.`);
  }
  for (let offset = 3; offset < png.data.length; offset += 4) {
    if (png.data[offset] !== 255) fail(`${variant.source} must be an opaque aligned source canvas.`);
  }
  return png;
}

export async function buildAlignedCharacterAssets(specPath, { check = false } = {}) {
  const absoluteSpec = assertRelativePath(specPath, 'spec path');
  const spec = validateAlignedCharacterAssetSpec(JSON.parse(await readFile(absoluteSpec, 'utf8')));
  const loaded = new Map();
  for (const [name, variant] of Object.entries(spec.variants)) {
    loaded.set(name, await loadPinnedPng(name, variant, spec.canvas));
  }
  const mask = deriveCyanAlphaMask(loaded.get(spec.alpha.maskSource), spec.alpha);
  const background = deriveTransparentBackgroundColor(loaded.get(spec.alpha.maskSource), mask.alpha);
  const donors = deriveOpaqueEdgeDonors(loaded.get(spec.alpha.maskSource), mask.alpha);
  const edgeDistances = deriveAlphaEdgeDistances(mask.alpha, spec.canvas.width, spec.canvas.height);
  const outputs = [];

  for (const [name, variant] of Object.entries(spec.variants)) {
    const outputPng = applyAlignedAlphaMask(
      loaded.get(name),
      mask.alpha,
      background,
      donors,
      edgeDistances,
      spec.alpha.edgeColorRadius,
    );
    const outputBytes = PNG.sync.write(outputPng, {
      colorType: 6,
      inputColorType: 6,
      inputHasAlpha: true,
    });
    const outputPath = assertPathUnder(
      variant.output,
      `spec.variants.${name}.output`,
      'public/assets/art/characters',
    );
    let status = 'written';
    if (check) {
      let committed;
      try {
        committed = await readFile(outputPath);
      } catch {
        fail(`${variant.output} is missing; run the extractor without --check.`);
      }
      if (!committed.equals(outputBytes)) fail(`${variant.output} is stale; run the extractor without --check.`);
      status = 'current';
    } else {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, outputBytes);
    }
    outputs.push(Object.freeze({
      name,
      source: variant.source,
      output: variant.output,
      sha256: sha256(outputBytes),
      bytes: outputBytes.length,
      status,
    }));
  }

  return Object.freeze({
    id: spec.id,
    spec: relative(ROOT, absoluteSpec),
    canvas: Object.freeze({ ...spec.canvas }),
    mask: Object.freeze({ ...mask.stats, background }),
    outputs: Object.freeze(outputs),
  });
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : process.argv[index + 1];
}

async function main() {
  const specPath = argument('spec');
  if (!specPath) fail('usage: node scripts/extract-aligned-character-assets.mjs --spec <repo-relative.json> [--check]');
  const result = await buildAlignedCharacterAssets(specPath, { check: process.argv.includes('--check') });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
