import './check-node.mjs';

import { createHash, randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  access,
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  unlink,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  posix,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import {
  applyAlignedAlphaMask,
  deriveAlphaEdgeDistances,
  deriveCyanAlphaMask,
  deriveOpaqueEdgeDonors,
} from './extract-aligned-character-assets.mjs';
import {
  CHARACTER_WEBP_ENCODING,
  encodeLosslessCharacterWebp,
} from './character-webp.mjs';

// This is the full-frame counterpart to slice-parts.mjs. It keeps that spike's
// useful border-flood and dominant-component approach, while reusing the
// production alpha/despill primitives from extract-aligned-character-assets.mjs.

export const CHARACTER_SHEET_SLICER_POLICY = Object.freeze({
  schemaVersion: 1,
  provenanceSchemaVersion: 2,
  algorithm: 'cyan-flood-aligned-character-sheet-v1',
  outputColorType: 6,
  outputBitDepth: 8,
  componentConnectivity: 8,
  scaleFilter: 'premultiplied-rgba-box-rational-v1',
  shippingEncoding: 'lossless-vp8l',
});

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u;
const FRAME_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u;
const SOURCE_LANE = 'art/characters';
const OUTPUT_LANE = 'public/assets/art/characters';

export function parseCharacterSheetArgs(argv) {
  const options = { spec: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--spec') {
      if (options.spec) throw new Error('--spec may be supplied only once.');
      options.spec = argv[index + 1] ?? null;
      if (!options.spec || options.spec.startsWith('--')) {
        throw new Error('--spec requires a JSON character-sheet layout path.');
      }
      index += 1;
      continue;
    }
    if (argument.startsWith('--spec=')) {
      if (options.spec) throw new Error('--spec may be supplied only once.');
      options.spec = argument.slice('--spec='.length);
      if (!options.spec) throw new Error('--spec requires a JSON character-sheet layout path.');
      continue;
    }
    throw new Error(`Unknown argument ${argument}.`);
  }
  if (!options.help && !options.spec) throw new Error('--spec is required.');
  return Object.freeze(options);
}

export function characterSheetHelp() {
  return [
    'Slice one reviewed cyan-background character sheet into aligned production frames.',
    '',
    'Usage:',
    '  node scripts/slice-character-sheet.mjs --spec <layout.json>',
    '',
    'Paths are repository-relative. The source hash is pinned and existing outputs are never overwritten.',
  ].join('\n');
}

export function validateCharacterSheetSpec(value) {
  assertPlainObject(value, 'character-sheet spec');
  assertExactKeys(value, [
    'schema_version',
    'id',
    'source',
    'output',
    'scale',
    'key',
    'components',
    'frames',
  ], 'character-sheet spec');
  if (value.schema_version !== CHARACTER_SHEET_SLICER_POLICY.schemaVersion) {
    throw new Error(
      `character-sheet spec.schema_version must be ${CHARACTER_SHEET_SLICER_POLICY.schemaVersion}.`,
    );
  }
  if (typeof value.id !== 'string' || !ID_PATTERN.test(value.id)) {
    throw new Error('character-sheet spec.id must be a lowercase dotted or dashed identifier.');
  }

  assertPlainObject(value.source, 'character-sheet spec.source');
  assertExactKeys(value.source, ['path', 'sha256'], 'character-sheet spec.source');
  assertPngPath(value.source.path, 'character-sheet spec.source.path');
  assertSha256(value.source.sha256, 'character-sheet spec.source.sha256');

  assertPlainObject(value.output, 'character-sheet spec.output');
  assertExactKeys(value.output, ['directory', 'provenance', 'canvas'], 'character-sheet spec.output');
  assertNonEmptyString(value.output.directory, 'character-sheet spec.output.directory');
  assertNonEmptyString(value.output.provenance, 'character-sheet spec.output.provenance');
  if (!value.output.provenance.toLowerCase().endsWith('.json')) {
    throw new Error('character-sheet spec.output.provenance must end in .json.');
  }
  assertPlainObject(value.output.canvas, 'character-sheet spec.output.canvas');
  assertExactKeys(
    value.output.canvas,
    ['width', 'height', 'center_x', 'ground_y'],
    'character-sheet spec.output.canvas',
  );
  assertInteger(value.output.canvas.width, 'character-sheet spec.output.canvas.width', 1, 8192);
  assertInteger(value.output.canvas.height, 'character-sheet spec.output.canvas.height', 1, 8192);
  assertInteger(
    value.output.canvas.center_x,
    'character-sheet spec.output.canvas.center_x',
    0,
    value.output.canvas.width - 1,
  );
  assertInteger(
    value.output.canvas.ground_y,
    'character-sheet spec.output.canvas.ground_y',
    0,
    value.output.canvas.height - 1,
  );

  assertPlainObject(value.scale, 'character-sheet spec.scale');
  assertExactKeys(value.scale, ['numerator', 'denominator'], 'character-sheet spec.scale');
  assertInteger(value.scale.numerator, 'character-sheet spec.scale.numerator', 1, 64);
  assertInteger(value.scale.denominator, 'character-sheet spec.scale.denominator', 1, 64);

  validateKey(value.key);

  assertPlainObject(value.components, 'character-sheet spec.components');
  assertExactKeys(
    value.components,
    ['detail_min_pixels', 'detail_max_pixels', 'detail_max_distance'],
    'character-sheet spec.components',
  );
  assertInteger(
    value.components.detail_min_pixels,
    'character-sheet spec.components.detail_min_pixels',
    1,
    1_000_000,
  );
  assertInteger(
    value.components.detail_max_pixels,
    'character-sheet spec.components.detail_max_pixels',
    1,
    1_000_000,
  );
  if (value.components.detail_min_pixels > value.components.detail_max_pixels) {
    throw new Error(
      'character-sheet spec.components.detail_min_pixels must not exceed detail_max_pixels.',
    );
  }
  assertInteger(
    value.components.detail_max_distance,
    'character-sheet spec.components.detail_max_distance',
    0,
    1024,
  );

  if (!Array.isArray(value.frames) || value.frames.length === 0) {
    throw new Error('character-sheet spec.frames must be a non-empty array.');
  }
  const names = new Set();
  for (let index = 0; index < value.frames.length; index += 1) {
    const frame = value.frames[index];
    const label = `character-sheet spec.frames[${index}]`;
    assertPlainObject(frame, label);
    assertExactKeys(frame, frame.overlap === undefined
      ? ['name', 'crop']
      : ['name', 'crop', 'overlap'], label);
    if (typeof frame.name !== 'string' || !FRAME_NAME_PATTERN.test(frame.name)) {
      throw new Error(`${label}.name must be a lowercase semantic frame name.`);
    }
    if (names.has(frame.name)) throw new Error(`${label}.name duplicates ${frame.name}.`);
    names.add(frame.name);
    assertPlainObject(frame.crop, `${label}.crop`);
    assertExactKeys(frame.crop, ['x', 'y', 'width', 'height'], `${label}.crop`);
    assertInteger(frame.crop.x, `${label}.crop.x`, 0, 1_000_000);
    assertInteger(frame.crop.y, `${label}.crop.y`, 0, 1_000_000);
    assertInteger(frame.crop.width, `${label}.crop.width`, 1, 65_536);
    assertInteger(frame.crop.height, `${label}.crop.height`, 1, 65_536);
    if (frame.overlap !== undefined) validateOverlap(frame.overlap, `${label}.overlap`);
  }
  return value;
}

function validateKey(key) {
  assertPlainObject(key, 'character-sheet spec.key');
  assertExactKeys(key, ['color', 'tolerance', 'alpha'], 'character-sheet spec.key');
  assertPlainObject(key.color, 'character-sheet spec.key.color');
  assertExactKeys(key.color, ['red', 'green', 'blue'], 'character-sheet spec.key.color');
  for (const channel of ['red', 'green', 'blue']) {
    assertInteger(key.color[channel], `character-sheet spec.key.color.${channel}`, 0, 255);
  }
  if (key.color.green <= key.color.red || key.color.blue <= key.color.red) {
    throw new Error('character-sheet spec.key.color must be cyan-dominant.');
  }
  assertInteger(key.tolerance, 'character-sheet spec.key.tolerance', 0, 255);

  const alpha = key.alpha;
  assertPlainObject(alpha, 'character-sheet spec.key.alpha');
  assertExactKeys(alpha, [
    'opaque_cyan_excess',
    'transparent_cyan_excess',
    'edge_spill_radius',
    'edge_spill_opaque_cyan_excess',
    'edge_spill_max_green_blue_delta',
    'matte_low_alpha',
    'matte_high_alpha',
    'edge_color_radius',
  ], 'character-sheet spec.key.alpha');
  assertInteger(alpha.opaque_cyan_excess, 'character-sheet spec.key.alpha.opaque_cyan_excess', -255, 254);
  assertInteger(
    alpha.transparent_cyan_excess,
    'character-sheet spec.key.alpha.transparent_cyan_excess',
    -254,
    255,
  );
  if (alpha.opaque_cyan_excess >= alpha.transparent_cyan_excess) {
    throw new Error(
      'character-sheet spec.key.alpha.opaque_cyan_excess must be below transparent_cyan_excess.',
    );
  }
  assertInteger(alpha.edge_spill_radius, 'character-sheet spec.key.alpha.edge_spill_radius', 0, 32);
  assertInteger(
    alpha.edge_spill_opaque_cyan_excess,
    'character-sheet spec.key.alpha.edge_spill_opaque_cyan_excess',
    -255,
    254,
  );
  if (alpha.edge_spill_opaque_cyan_excess >= alpha.transparent_cyan_excess) {
    throw new Error(
      'character-sheet spec.key.alpha.edge_spill_opaque_cyan_excess must be below transparent_cyan_excess.',
    );
  }
  assertInteger(
    alpha.edge_spill_max_green_blue_delta,
    'character-sheet spec.key.alpha.edge_spill_max_green_blue_delta',
    0,
    255,
  );
  assertInteger(alpha.matte_low_alpha, 'character-sheet spec.key.alpha.matte_low_alpha', 0, 254);
  assertInteger(alpha.matte_high_alpha, 'character-sheet spec.key.alpha.matte_high_alpha', 1, 255);
  if (alpha.matte_low_alpha >= alpha.matte_high_alpha) {
    throw new Error('character-sheet spec.key.alpha.matte_low_alpha must be below matte_high_alpha.');
  }
  assertInteger(alpha.edge_color_radius, 'character-sheet spec.key.alpha.edge_color_radius', 0, 32);
}

function validateOverlap(overlap, label) {
  assertPlainObject(overlap, label);
  assertExactKeys(overlap, ['top', 'right', 'bottom', 'left'], label);
  for (const side of ['top', 'right', 'bottom', 'left']) {
    assertInteger(overlap[side], `${label}.${side}`, 0, 8192);
  }
}

export async function runCharacterSheetSlice({
  specPath,
  repoRoot = ROOT,
  encodeFrame = encodeLosslessCharacterWebp,
}) {
  if (typeof encodeFrame !== 'function') {
    throw new TypeError('Character-sheet encodeFrame must be a function.');
  }
  const root = resolve(repoRoot);
  const normalizedSpec = resolveRepositoryPath(root, specPath, 'character-sheet spec path');
  assertInLane(normalizedSpec, SOURCE_LANE, 'character-sheet spec path');
  const specBytes = await readFile(normalizedSpec.absolute);
  let spec;
  try {
    spec = JSON.parse(specBytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${normalizedSpec.relative} is not valid JSON: ${error.message}`);
  }
  validateCharacterSheetSpec(spec);

  const sourcePath = resolveRepositoryPath(root, spec.source.path, 'source sheet path');
  const outputDirectory = resolveRepositoryPath(root, spec.output.directory, 'output directory');
  const provenancePath = resolveRepositoryPath(root, spec.output.provenance, 'output provenance path');
  assertInLane(sourcePath, SOURCE_LANE, 'source sheet path');
  assertInLane(outputDirectory, OUTPUT_LANE, 'output directory', { allowLaneRoot: false });
  assertInLane(provenancePath, SOURCE_LANE, 'output provenance path');
  if (
    sourcePath.absolute === normalizedSpec.absolute
    || sourcePath.absolute === provenancePath.absolute
    || normalizedSpec.absolute === provenancePath.absolute
  ) {
    throw new Error('Source, spec, and provenance paths must be distinct.');
  }

  const framePaths = spec.frames.map((frame) => resolveRepositoryPath(
    root,
    posix.join(outputDirectory.relative, `${frame.name}.webp`),
    `output path for frame ${frame.name}`,
  ));
  const legacyPngPaths = spec.frames.map((frame) => resolveRepositoryPath(
    root,
    posix.join(outputDirectory.relative, `${frame.name}.png`),
    `legacy PNG path for frame ${frame.name}`,
  ));
  const allDestinations = [...framePaths, provenancePath];
  assertDistinctPaths(allDestinations);
  await Promise.all(allDestinations.map((path) => assertFileMissing(path.absolute, path.relative)));
  await Promise.all(legacyPngPaths.map((path) => assertLegacyPublicPngMissing(path)));

  const sourceBytes = await readFile(sourcePath.absolute);
  const actualSourceHash = sha256(sourceBytes);
  if (actualSourceHash !== spec.source.sha256) {
    throw new Error(
      `Source sheet ${sourcePath.relative} SHA-256 mismatch: expected ${spec.source.sha256}, found ${actualSourceHash}.`,
    );
  }
  const source = inspectOpaquePng(sourceBytes, `Source sheet ${sourcePath.relative}`);

  const renderedFrames = [];
  for (let index = 0; index < spec.frames.length; index += 1) {
    const frame = spec.frames[index];
    const rendered = renderCharacterFrame({ source, frame, spec });
    const sourcePngBytes = PNG.sync.write(rendered.png, {
      colorType: CHARACTER_SHEET_SLICER_POLICY.outputColorType,
      inputColorType: CHARACTER_SHEET_SLICER_POLICY.outputColorType,
      bitDepth: CHARACTER_SHEET_SLICER_POLICY.outputBitDepth,
    });
    const encoded = await encodeFrame({
      pngBytes: sourcePngBytes,
      expectedRgba: rendered.png.data,
      width: rendered.png.width,
      height: rendered.png.height,
      outputLabel: framePaths[index].relative,
    });
    assertEncodedCharacterFrame(encoded, framePaths[index].relative);
    renderedFrames.push(Object.freeze({
      name: frame.name,
      path: framePaths[index],
      outputBytes: encoded.bytes,
      sourcePngBytes,
      verification: encoded.verification,
      png: rendered.png,
      record: rendered.record,
    }));
  }

  const dimensions = { width: spec.output.canvas.width, height: spec.output.canvas.height };
  const provenance = {
    schema_version: CHARACTER_SHEET_SLICER_POLICY.provenanceSchemaVersion,
    algorithm: {
      id: CHARACTER_SHEET_SLICER_POLICY.algorithm,
      component_connectivity: CHARACTER_SHEET_SLICER_POLICY.componentConnectivity,
      scale_filter: CHARACTER_SHEET_SLICER_POLICY.scaleFilter,
      output_color_type: CHARACTER_SHEET_SLICER_POLICY.outputColorType,
      output_bit_depth: CHARACTER_SHEET_SLICER_POLICY.outputBitDepth,
      shipping_encoding: CHARACTER_SHEET_SLICER_POLICY.shippingEncoding,
      shipping_encoder: {
        command: CHARACTER_WEBP_ENCODING.command,
        arguments: [...CHARACTER_WEBP_ENCODING.arguments],
      },
      deterministic: true,
    },
    slice_spec: {
      path: normalizedSpec.relative,
      bytes: specBytes.length,
      sha256: sha256(specBytes),
      schema_version: spec.schema_version,
      id: spec.id,
    },
    source: {
      path: sourcePath.relative,
      bytes: sourceBytes.length,
      expected_sha256: spec.source.sha256,
      sha256: actualSourceHash,
      rgba_sha256: sha256(source.data),
      dimensions: { width: source.width, height: source.height },
    },
    controls: {
      output_canvas: { ...spec.output.canvas },
      common_scale: { ...spec.scale },
      key: structuredClone(spec.key),
      components: structuredClone(spec.components),
    },
    outputs: renderedFrames.map((rendered) => ({
      name: rendered.name,
      path: rendered.path.relative,
      media_type: 'image/webp',
      bytes: rendered.outputBytes.length,
      sha256: sha256(rendered.outputBytes),
      source_png_bytes: rendered.sourcePngBytes.length,
      source_png_sha256: sha256(rendered.sourcePngBytes),
      rgba_sha256: sha256(rendered.png.data),
      pixel_invariant: {
        alpha_sha256: rendered.verification.integrity.alpha_sha256,
        visible_rgba_sha256: rendered.verification.integrity.visible_rgba_sha256,
        composite_sha256: rendered.verification.integrity.composite_sha256,
      },
      dimensions,
      ...rendered.record,
    })),
    provenance_path: provenancePath.relative,
  };
  const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);

  await mkdir(outputDirectory.absolute, { recursive: true });
  await mkdir(dirname(provenancePath.absolute), { recursive: true });
  await installCharacterSheetOutputs([
    ...renderedFrames.map((rendered) => ({
      path: rendered.path.absolute,
      label: rendered.path.relative,
      bytes: rendered.outputBytes,
    })),
    {
      path: provenancePath.absolute,
      label: provenancePath.relative,
      bytes: provenanceBytes,
    },
  ]);

  return Object.freeze({
    id: spec.id,
    source: Object.freeze({ path: sourcePath.relative, sha256: actualSourceHash }),
    provenance: Object.freeze({
      path: provenancePath.relative,
      bytes: provenanceBytes.length,
      sha256: sha256(provenanceBytes),
    }),
    outputs: Object.freeze(provenance.outputs.map((output) => Object.freeze({
      name: output.name,
      path: output.path,
      bytes: output.bytes,
      sha256: output.sha256,
      rgba_sha256: output.rgba_sha256,
      pixel_invariant: output.pixel_invariant,
    }))),
  });
}

export function renderCharacterFrame({ source, frame, spec }) {
  assertDecodedImage(source, 'source');
  const expandedCrop = expandCrop(frame.crop, frame.overlap, source.width, source.height, frame.name);
  const cropped = cropPng(source, expandedCrop);
  const alphaResult = deriveCyanAlphaMask(cropped, alphaControls(spec.key.alpha));
  const flood = floodKeyCyan(cropped, spec.key);
  const foreground = new Uint8Array(cropped.width * cropped.height);
  for (let pixel = 0; pixel < foreground.length; pixel += 1) {
    foreground[pixel] = flood.background[pixel] === 0 && alphaResult.alpha[pixel] > 0 ? 1 : 0;
  }
  const components = keepCharacterComponents(
    foreground,
    cropped.width,
    cropped.height,
    spec.components,
  );
  const selectedAlpha = Buffer.alloc(foreground.length);
  for (let pixel = 0; pixel < selectedAlpha.length; pixel += 1) {
    if (components.selected[pixel]) selectedAlpha[pixel] = alphaResult.alpha[pixel];
  }
  const backgroundColor = averageFloodColor(cropped, flood.background);
  const donors = deriveOpaqueEdgeDonors(cropped, selectedAlpha);
  const edgeDistances = deriveAlphaEdgeDistances(selectedAlpha, cropped.width, cropped.height);
  const keyed = applyAlignedAlphaMask(
    cropped,
    selectedAlpha,
    backgroundColor,
    donors,
    edgeDistances,
    spec.key.alpha.edge_color_radius,
  );
  clearTransparentPixels(keyed);
  const trimmed = trimVisible(keyed, frame.name);
  assertScaledFrameFits(trimmed.png, spec.scale, spec.output.canvas, frame.name);
  const scaled = resamplePremultiplied(trimmed.png, spec.scale);
  const scaledAlpha = alphaChannel(scaled);
  const scaledDonors = deriveOpaqueEdgeDonors(scaled, scaledAlpha);
  const scaledEdgeDistances = deriveAlphaEdgeDistances(scaledAlpha, scaled.width, scaled.height);
  const edgeArtifactsRepaired = repairLowAlphaRedEdgeArtifacts(
    scaled,
    scaledAlpha,
    scaledDonors,
    scaledEdgeDistances,
  );
  const placed = placeAtCommonAnchor(scaled, spec.output.canvas, frame.name);

  return Object.freeze({
    png: placed.png,
    record: Object.freeze({
      crop: expandedCrop,
      source_content_bounds: trimmed.bounds,
      scaled_dimensions: { width: scaled.width, height: scaled.height },
      placement: placed.placement,
      flood: flood.stats,
      components: components.stats,
      alpha: alphaStats(selectedAlpha),
      edge_artifacts_repaired: edgeArtifactsRepaired,
    }),
  });
}

function alphaChannel(png) {
  const alpha = new Uint8Array(png.width * png.height);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) alpha[pixel] = png.data[pixel * 4 + 3];
  return alpha;
}

/**
 * Gemini occasionally leaves saturated red unmatte pixels at the cyan/hair
 * boundary. They are low-alpha source-over solve artifacts, not authored red
 * paint. Replace only those edge pixels with the nearest fully opaque art
 * donor while preserving their antialias alpha. Real red clothing keeps its
 * red opaque donor, while Violet's brown hair inherits brown instead of neon.
 */
export function repairLowAlphaRedEdgeArtifacts(png, alpha, donors, edgeDistances) {
  assertDecodedImage(png, 'edge-artifact source');
  if (!(alpha instanceof Uint8Array || Buffer.isBuffer(alpha)) || alpha.length !== png.width * png.height) {
    throw new TypeError('edge-artifact alpha must match the source dimensions.');
  }
  if (!(donors instanceof Int32Array) || donors.length !== alpha.length) {
    throw new TypeError('edge-artifact donors must match the source dimensions.');
  }
  if (!(edgeDistances instanceof Uint16Array) || edgeDistances.length !== alpha.length) {
    throw new TypeError('edge-artifact distances must match the source dimensions.');
  }
  let repaired = 0;
  for (let pixel = 0; pixel < alpha.length; pixel += 1) {
    const value = alpha[pixel];
    if (value === 0 || value > 160 || edgeDistances[pixel] > 6) continue;
    const offset = pixel * 4;
    const red = png.data[offset];
    const green = png.data[offset + 1];
    const blue = png.data[offset + 2];
    if (red < 145 || green > 90 || blue > 80 || red < green * 1.7 || red < blue * 1.7) continue;
    const donor = donors[pixel];
    if (donor < 0) {
      png.data[offset] = 0;
      png.data[offset + 1] = 0;
      png.data[offset + 2] = 0;
      png.data[offset + 3] = 0;
    } else {
      const donorOffset = donor * 4;
      png.data[offset] = png.data[donorOffset];
      png.data[offset + 1] = png.data[donorOffset + 1];
      png.data[offset + 2] = png.data[donorOffset + 2];
    }
    repaired += 1;
  }
  return repaired;
}

export function floodKeyCyan(png, key) {
  assertDecodedImage(png, 'flood-key source');
  const total = png.width * png.height;
  const background = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const matches = (pixel) => {
    const offset = pixel * 4;
    return Math.abs(png.data[offset] - key.color.red) <= key.tolerance
      && Math.abs(png.data[offset + 1] - key.color.green) <= key.tolerance
      && Math.abs(png.data[offset + 2] - key.color.blue) <= key.tolerance;
  };
  const enqueue = (pixel) => {
    if (background[pixel] || !matches(pixel)) return;
    background[pixel] = 1;
    queue[tail] = pixel;
    tail += 1;
  };
  for (let x = 0; x < png.width; x += 1) {
    enqueue(x);
    enqueue((png.height - 1) * png.width + x);
  }
  for (let y = 0; y < png.height; y += 1) {
    enqueue(y * png.width);
    enqueue(y * png.width + png.width - 1);
  }
  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    const x = pixel % png.width;
    const y = Math.floor(pixel / png.width);
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < png.width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - png.width);
    if (y + 1 < png.height) enqueue(pixel + png.width);
  }
  if (tail === 0) throw new Error('Cyan flood key found no border-connected background pixels.');
  return Object.freeze({
    background,
    stats: Object.freeze({
      background_pixels: tail,
      non_background_pixels: total - tail,
      background_fraction: tail / total,
    }),
  });
}

export function keepCharacterComponents(foreground, width, height, controls) {
  if (!(foreground instanceof Uint8Array) || foreground.length !== width * height) {
    throw new TypeError('foreground must be a one-byte mask matching width and height.');
  }
  const labels = new Int32Array(foreground.length);
  labels.fill(-1);
  const queue = new Int32Array(foreground.length);
  const components = [];
  for (let first = 0; first < foreground.length; first += 1) {
    if (!foreground[first] || labels[first] !== -1) continue;
    const id = components.length;
    let head = 0;
    let tail = 0;
    let size = 0;
    labels[first] = id;
    queue[tail] = first;
    tail += 1;
    while (head < tail) {
      const pixel = queue[head];
      head += 1;
      size += 1;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          const next = nextY * width + nextX;
          if (!foreground[next] || labels[next] !== -1) continue;
          labels[next] = id;
          queue[tail] = next;
          tail += 1;
        }
      }
    }
    components.push({ id, size, first });
  }
  if (components.length === 0) throw new Error('Character crop contains no foreground after cyan keying.');
  const dominant = components.reduce((best, component) => (
    component.size > best.size
      || (component.size === best.size && component.first < best.first)
      ? component
      : best
  ));

  const distance = componentDistances(labels, dominant.id, width, height);
  const minimumDistances = new Uint32Array(components.length);
  minimumDistances.fill(0xffff_ffff);
  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    const id = labels[pixel];
    if (id >= 0) minimumDistances[id] = Math.min(minimumDistances[id], distance[pixel]);
  }
  const selectedIds = new Set([dominant.id]);
  const details = [];
  for (const component of components) {
    if (component.id === dominant.id) continue;
    const minimumDistance = minimumDistances[component.id];
    const kept = component.size >= controls.detail_min_pixels
      && component.size <= controls.detail_max_pixels
      && minimumDistance <= controls.detail_max_distance;
    if (kept) selectedIds.add(component.id);
    details.push(Object.freeze({
      pixels: component.size,
      distance_from_dominant: minimumDistance,
      kept,
    }));
  }
  const selected = new Uint8Array(foreground.length);
  let selectedPixels = 0;
  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    if (!selectedIds.has(labels[pixel])) continue;
    selected[pixel] = 1;
    selectedPixels += 1;
  }
  return Object.freeze({
    selected,
    stats: Object.freeze({
      found: components.length,
      dominant_pixels: dominant.size,
      kept: selectedIds.size,
      removed: components.length - selectedIds.size,
      selected_pixels: selectedPixels,
      details: Object.freeze(details),
    }),
  });
}

function componentDistances(labels, dominantId, width, height) {
  const distance = new Uint32Array(labels.length);
  distance.fill(0xffff_ffff);
  const queue = new Int32Array(labels.length);
  let head = 0;
  let tail = 0;
  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    if (labels[pixel] !== dominantId) continue;
    distance[pixel] = 0;
    queue[tail] = pixel;
    tail += 1;
  }
  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    const nextDistance = distance[pixel] + 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
        const next = nextY * width + nextX;
        if (distance[next] <= nextDistance) continue;
        distance[next] = nextDistance;
        queue[tail] = next;
        tail += 1;
      }
    }
  }
  return distance;
}

function assertScaledFrameFits(source, scale, canvas, frameName) {
  const width = Math.ceil(source.width * scale.numerator / scale.denominator);
  const height = Math.ceil(source.height * scale.numerator / scale.denominator);
  const left = canvas.center_x - Math.floor(width / 2);
  const top = canvas.ground_y - height + 1;
  if (left < 0 || top < 0 || left + width > canvas.width || top + height > canvas.height) {
    throw new Error(
      `Frame ${frameName} (${width}x${height}) does not fit the authored ${canvas.width}x${canvas.height} canvas anchor.`,
    );
  }
}

export function resamplePremultiplied(source, scale) {
  assertDecodedImage(source, 'resample source');
  const outputWidth = Math.ceil(source.width * scale.numerator / scale.denominator);
  const outputHeight = Math.ceil(source.height * scale.numerator / scale.denominator);
  const output = new PNG({ width: outputWidth, height: outputHeight, colorType: 6 });
  output.data.fill(0);
  const numerator = scale.numerator;
  const denominator = scale.denominator;

  for (let outputY = 0; outputY < outputHeight; outputY += 1) {
    const destinationTop = outputY * denominator;
    const destinationBottom = Math.min((outputY + 1) * denominator, source.height * numerator);
    const sourceTop = Math.floor(destinationTop / numerator);
    const sourceBottom = Math.ceil(destinationBottom / numerator);
    for (let outputX = 0; outputX < outputWidth; outputX += 1) {
      const destinationLeft = outputX * denominator;
      const destinationRight = Math.min((outputX + 1) * denominator, source.width * numerator);
      const sourceLeft = Math.floor(destinationLeft / numerator);
      const sourceRight = Math.ceil(destinationRight / numerator);
      let totalWeight = 0;
      let alphaWeight = 0;
      const colorWeight = [0, 0, 0];
      for (let sourceY = sourceTop; sourceY < sourceBottom; sourceY += 1) {
        const yWeight = Math.max(0, Math.min(destinationBottom, (sourceY + 1) * numerator)
          - Math.max(destinationTop, sourceY * numerator));
        for (let sourceX = sourceLeft; sourceX < sourceRight; sourceX += 1) {
          const xWeight = Math.max(0, Math.min(destinationRight, (sourceX + 1) * numerator)
            - Math.max(destinationLeft, sourceX * numerator));
          const weight = xWeight * yWeight;
          if (weight === 0) continue;
          const sourceOffset = (sourceY * source.width + sourceX) * 4;
          const alpha = source.data[sourceOffset + 3];
          totalWeight += weight;
          alphaWeight += alpha * weight;
          for (let channel = 0; channel < 3; channel += 1) {
            colorWeight[channel] += source.data[sourceOffset + channel] * alpha * weight;
          }
        }
      }
      const outputOffset = (outputY * outputWidth + outputX) * 4;
      if (alphaWeight > 0) {
        for (let channel = 0; channel < 3; channel += 1) {
          output.data[outputOffset + channel] = Math.round(colorWeight[channel] / alphaWeight);
        }
        output.data[outputOffset + 3] = Math.round(alphaWeight / totalWeight);
      }
    }
  }
  return output;
}

export async function installCharacterSheetOutputs(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new TypeError('installCharacterSheetOutputs requires at least one file.');
  }
  const paths = new Set();
  for (const file of files) {
    if (!file || typeof file.path !== 'string' || !Buffer.isBuffer(file.bytes)) {
      throw new TypeError('Each character-sheet output must have a path and Buffer bytes.');
    }
    if (paths.has(file.path)) throw new Error(`Duplicate character-sheet output path ${file.path}.`);
    paths.add(file.path);
  }
  await Promise.all(files.map((file) => assertFileMissing(file.path, file.label ?? file.path)));
  const prepared = files.map((file) => ({
    ...file,
    temporary: resolve(dirname(file.path), `.${randomUUID()}.character-sheet.tmp`),
  }));
  const installed = [];
  try {
    await Promise.all(prepared.map((file) => writeDurableTemporary(file.temporary, file.bytes)));
    for (const file of prepared) {
      await link(file.temporary, file.path);
      installed.push(file.path);
    }
    for (const directory of new Set(prepared.map((file) => dirname(file.path)))) {
      await syncDirectory(directory);
    }
  } catch (error) {
    for (const path of installed.reverse()) await unlink(path).catch(() => {});
    if (error?.code === 'EEXIST') {
      throw new Error('Refusing to overwrite an existing character-sheet frame or provenance record.');
    }
    throw error;
  } finally {
    await Promise.all(prepared.map((file) => unlink(file.temporary).catch(() => {})));
  }
  await Promise.all(files.map((file) => access(file.path, fsConstants.R_OK)));
}

function assertEncodedCharacterFrame(encoded, label) {
  if (!encoded || typeof encoded !== 'object' || !Buffer.isBuffer(encoded.bytes)) {
    throw new TypeError(`Character WebP encoder returned no bytes for ${label}.`);
  }
  const verification = encoded.verification;
  if (
    !verification
    || verification.alpha !== 'exact'
    || verification.visibleRgb !== 'exact'
    || !verification.integrity
  ) {
    throw new Error(`Character WebP encoder did not verify rendered pixels for ${label}.`);
  }
  const integrity = verification.integrity;
  for (const field of ['alpha_sha256', 'visible_rgba_sha256']) {
    if (typeof integrity[field] !== 'string' || !SHA256_PATTERN.test(integrity[field])) {
      throw new Error(`Character WebP encoder returned invalid ${field} for ${label}.`);
    }
  }
  const composites = integrity.composite_sha256;
  for (const background of ['black', 'white', 'saturated-magenta']) {
    if (typeof composites?.[background] !== 'string' || !SHA256_PATTERN.test(composites[background])) {
      throw new Error(`Character WebP encoder returned invalid ${background} composite for ${label}.`);
    }
  }
}

function expandCrop(crop, overlap, sheetWidth, sheetHeight, frameName) {
  const padding = overlap ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const expanded = Object.freeze({
    x: crop.x - padding.left,
    y: crop.y - padding.top,
    width: crop.width + padding.left + padding.right,
    height: crop.height + padding.top + padding.bottom,
  });
  if (
    expanded.x < 0
    || expanded.y < 0
    || expanded.x + expanded.width > sheetWidth
    || expanded.y + expanded.height > sheetHeight
  ) {
    throw new Error(
      `Frame ${frameName} crop plus overlap exceeds the ${sheetWidth}x${sheetHeight} source sheet.`,
    );
  }
  return expanded;
}

function cropPng(source, crop) {
  const output = new PNG({ width: crop.width, height: crop.height, colorType: 6 });
  for (let y = 0; y < crop.height; y += 1) {
    const sourceStart = ((crop.y + y) * source.width + crop.x) * 4;
    const sourceEnd = sourceStart + crop.width * 4;
    source.data.copy(output.data, y * crop.width * 4, sourceStart, sourceEnd);
  }
  return output;
}

function alphaControls(alpha) {
  return Object.freeze({
    opaqueCyanExcess: alpha.opaque_cyan_excess,
    transparentCyanExcess: alpha.transparent_cyan_excess,
    edgeSpillRadius: alpha.edge_spill_radius,
    edgeSpillOpaqueCyanExcess: alpha.edge_spill_opaque_cyan_excess,
    edgeSpillMaxGreenBlueDelta: alpha.edge_spill_max_green_blue_delta,
    matteLowAlpha: alpha.matte_low_alpha,
    matteHighAlpha: alpha.matte_high_alpha,
  });
}

function averageFloodColor(png, background) {
  const sums = [0, 0, 0];
  let count = 0;
  for (let pixel = 0; pixel < background.length; pixel += 1) {
    if (!background[pixel]) continue;
    const offset = pixel * 4;
    sums[0] += png.data[offset];
    sums[1] += png.data[offset + 1];
    sums[2] += png.data[offset + 2];
    count += 1;
  }
  if (count === 0) throw new Error('Cannot derive a cyan background color from an empty flood.');
  return sums.map((sum) => Math.round(sum / count));
}

function clearTransparentPixels(png) {
  for (let offset = 0; offset < png.data.length; offset += 4) {
    if (png.data[offset + 3] !== 0) continue;
    png.data[offset] = 0;
    png.data[offset + 1] = 0;
    png.data[offset + 2] = 0;
  }
}

function trimVisible(png, frameName) {
  let minimumX = png.width;
  let minimumY = png.height;
  let maximumX = -1;
  let maximumY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] === 0) continue;
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }
  if (maximumX < minimumX || maximumY < minimumY) {
    throw new Error(`Frame ${frameName} has no visible character pixels after keying.`);
  }
  const bounds = Object.freeze({
    x: minimumX,
    y: minimumY,
    width: maximumX - minimumX + 1,
    height: maximumY - minimumY + 1,
  });
  return Object.freeze({ png: cropPng(png, bounds), bounds });
}

function placeAtCommonAnchor(source, canvas, frameName) {
  const left = canvas.center_x - Math.floor(source.width / 2);
  const top = canvas.ground_y - source.height + 1;
  if (left < 0 || top < 0 || left + source.width > canvas.width || top + source.height > canvas.height) {
    throw new Error(
      `Frame ${frameName} (${source.width}x${source.height}) does not fit the authored ${canvas.width}x${canvas.height} canvas anchor.`,
    );
  }
  const output = new PNG({ width: canvas.width, height: canvas.height, colorType: 6 });
  output.data.fill(0);
  for (let y = 0; y < source.height; y += 1) {
    const sourceStart = y * source.width * 4;
    const destinationStart = ((top + y) * canvas.width + left) * 4;
    source.data.copy(output.data, destinationStart, sourceStart, sourceStart + source.width * 4);
  }
  return Object.freeze({
    png: output,
    placement: Object.freeze({
      x: left,
      y: top,
      width: source.width,
      height: source.height,
      center_x: canvas.center_x,
      ground_y: canvas.ground_y,
    }),
  });
}

function alphaStats(alpha) {
  let transparent = 0;
  let soft = 0;
  let opaque = 0;
  for (const value of alpha) {
    if (value === 0) transparent += 1;
    else if (value === 255) opaque += 1;
    else soft += 1;
  }
  return Object.freeze({
    transparent_pixels: transparent,
    soft_pixels: soft,
    opaque_pixels: opaque,
  });
}

function inspectOpaquePng(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${label} is not a PNG (signature mismatch).`);
  }
  let png;
  try {
    png = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a valid PNG: ${error.message}`);
  }
  assertDecodedImage(png, label);
  if (png.depth !== 8) throw new Error(`${label} must be an 8-bit PNG.`);
  for (let offset = 3; offset < png.data.length; offset += 4) {
    if (png.data[offset] !== 255) throw new Error(`${label} must be an opaque cyan-background sheet.`);
  }
  return png;
}

function assertDecodedImage(image, label) {
  if (!image || !Number.isInteger(image.width) || image.width <= 0
    || !Number.isInteger(image.height) || image.height <= 0
    || !Buffer.isBuffer(image.data) || image.data.length !== image.width * image.height * 4) {
    throw new TypeError(`${label} must be a decoded RGBA image with positive dimensions.`);
  }
}

function resolveRepositoryPath(repoRoot, value, label) {
  assertNonEmptyString(value, label);
  if (isAbsolute(value) || value.includes('\\')) {
    throw new Error(`${label} must be a repository-relative POSIX path.`);
  }
  const root = resolve(repoRoot);
  const absolute = resolve(root, value);
  const relativePath = relative(root, absolute);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`${label} must identify a path inside the repository root.`);
  }
  return Object.freeze({
    absolute,
    relative: relativePath.split(sep).join('/'),
  });
}

function assertInLane(path, lane, label, { allowLaneRoot = true } = {}) {
  if (path.relative !== lane && !path.relative.startsWith(`${lane}/`)) {
    throw new Error(`${label} must stay under ${lane}.`);
  }
  if (!allowLaneRoot && path.relative === lane) {
    throw new Error(`${label} must name a directory beneath ${lane}.`);
  }
}

function assertDistinctPaths(paths) {
  const seen = new Set();
  for (const path of paths) {
    if (seen.has(path.absolute)) throw new Error(`Duplicate output path ${path.relative}.`);
    seen.add(path.absolute);
  }
}

async function assertFileMissing(path, label) {
  try {
    await lstat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`Refusing to overwrite existing file ${label}.`);
}

async function assertLegacyPublicPngMissing(path) {
  try {
    await lstat(path.absolute);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(
    `Refusing to leave legacy public character PNG ${path.relative}; `
    + 'remove or promote it before slicing.',
  );
}

async function writeDurableTemporary(path, bytes) {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(path, 0o644);
}

async function syncDirectory(path) {
  const handle = await open(path, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(`${label} keys must be exactly: ${sortedExpected.join(', ')}.`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must be a non-empty string.`);
}

function assertPngPath(value, label) {
  assertNonEmptyString(value, label);
  if (!value.toLowerCase().endsWith('.png')) throw new Error(`${label} must end in .png.`);
}

function assertSha256(value, label) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 digest.`);
  }
}

function assertInteger(value, label, minimum, maximum) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} must be an integer from ${minimum} through ${maximum}.`);
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  const options = parseCharacterSheetArgs(process.argv.slice(2));
  if (options.help) {
    console.log(characterSheetHelp());
    return;
  }
  const result = await runCharacterSheetSlice({ specPath: options.spec });
  console.log(JSON.stringify(result, null, 2));
}

const mainUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (mainUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  });
}
