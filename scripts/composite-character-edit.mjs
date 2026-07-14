import { createHash, randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  access,
  chmod,
  link,
  lstat,
  open,
  readFile,
  stat,
  unlink,
} from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

export const CHARACTER_EDIT_COMPOSITOR_POLICY = Object.freeze({
  schemaVersion: 1,
  algorithm: 'linear-light-premultiplied-rgba-v1',
  colorSpace: 'srgb',
  outputColorType: 6,
  outputBitDepth: 8,
  maskCoverageDenominator: 255 * 255,
});

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const MASK_COLOR_TYPES = new Set([0, 4, 6]);

export function parseCharacterEditArgs(argv) {
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
        throw new Error('--spec requires a JSON edit-spec path.');
      }
      index += 1;
      continue;
    }
    if (argument.startsWith('--spec=')) {
      if (options.spec) throw new Error('--spec may be supplied only once.');
      options.spec = argument.slice('--spec='.length);
      if (!options.spec) throw new Error('--spec requires a JSON edit-spec path.');
      continue;
    }
    throw new Error(`Unknown argument ${argument}.`);
  }
  if (!options.help && !options.spec) throw new Error('--spec is required.');
  return Object.freeze(options);
}

export function characterEditHelp() {
  return [
    'Composite one reviewed character edit through a strict preserved-pixel mask.',
    '',
    'Usage:',
    '  node scripts/composite-character-edit.mjs --spec <edit.json>',
    '',
    'Paths are relative to the repository root. Existing output files are never overwritten.',
  ].join('\n');
}

export function validateCharacterEditSpec(value) {
  assertPlainObject(value, 'edit spec');
  assertExactKeys(value, [
    'schema_version',
    'base',
    'raw_candidate',
    'mask',
    'output',
    'allow_alpha_change',
  ], 'edit spec');
  if (value.schema_version !== CHARACTER_EDIT_COMPOSITOR_POLICY.schemaVersion) {
    throw new Error(`edit spec.schema_version must be ${CHARACTER_EDIT_COMPOSITOR_POLICY.schemaVersion}.`);
  }

  validateHashedPng(value.base, 'edit spec.base');
  validateHashedPng(value.raw_candidate, 'edit spec.raw_candidate');

  validateHashedPng(value.mask, 'edit spec.mask');

  assertPlainObject(value.output, 'edit spec.output');
  assertExactKeys(value.output, ['image', 'provenance'], 'edit spec.output');
  assertPngPath(value.output.image, 'edit spec.output.image');
  assertNonEmptyString(value.output.provenance, 'edit spec.output.provenance');
  if (!value.output.provenance.toLowerCase().endsWith('.json')) {
    throw new Error('edit spec.output.provenance must end in .json.');
  }
  if (typeof value.allow_alpha_change !== 'boolean') {
    throw new TypeError('edit spec.allow_alpha_change must be boolean.');
  }
  return value;
}

export async function runCharacterEditComposite({ specPath, repoRoot = ROOT }) {
  const root = resolve(repoRoot);
  const normalizedSpec = resolveRepositoryPath(root, specPath, 'edit spec path');
  const specBytes = await readFile(normalizedSpec.absolute);
  let spec;
  try {
    spec = JSON.parse(specBytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${normalizedSpec.relative} is not valid JSON: ${error.message}`);
  }
  validateCharacterEditSpec(spec);

  const paths = Object.freeze({
    base: resolveRepositoryPath(root, spec.base.path, 'base PNG path'),
    rawCandidate: resolveRepositoryPath(root, spec.raw_candidate.path, 'raw candidate PNG path'),
    mask: resolveRepositoryPath(root, spec.mask.path, 'mask PNG path'),
    outputImage: resolveRepositoryPath(root, spec.output.image, 'output image path'),
    outputProvenance: resolveRepositoryPath(root, spec.output.provenance, 'output provenance path'),
  });
  assertDistinctPaths(normalizedSpec, paths);
  await assertOutputDestinationsAvailable(paths.outputImage, paths.outputProvenance);

  const [baseBytes, candidateBytes, maskBytes] = await Promise.all([
    readFile(paths.base.absolute),
    readFile(paths.rawCandidate.absolute),
    readFile(paths.mask.absolute),
  ]);
  assertExpectedHash(baseBytes, spec.base.sha256, `Base PNG ${paths.base.relative}`);
  assertExpectedHash(candidateBytes, spec.raw_candidate.sha256, `Raw candidate PNG ${paths.rawCandidate.relative}`);
  assertExpectedHash(maskBytes, spec.mask.sha256, `Mask PNG ${paths.mask.relative}`);

  const base = inspectPng(baseBytes, `Base PNG ${paths.base.relative}`);
  const candidate = inspectPng(candidateBytes, `Raw candidate PNG ${paths.rawCandidate.relative}`);
  const mask = inspectPng(maskBytes, `Mask PNG ${paths.mask.relative}`);
  assertMatchingDimensions(base, candidate, mask);
  validateMask(mask, paths.mask.relative);

  const composite = compositeCharacterEditPixels({
    base,
    candidate,
    mask,
    allowAlphaChange: spec.allow_alpha_change,
  });
  const outputPng = new PNG({ width: base.width, height: base.height });
  outputPng.data.set(composite.data);
  const outputBytes = PNG.sync.write(outputPng, {
    colorType: CHARACTER_EDIT_COMPOSITOR_POLICY.outputColorType,
    inputColorType: CHARACTER_EDIT_COMPOSITOR_POLICY.outputColorType,
    bitDepth: CHARACTER_EDIT_COMPOSITOR_POLICY.outputBitDepth,
  });

  const dimensions = Object.freeze({ width: base.width, height: base.height });
  const provenance = {
    schema_version: CHARACTER_EDIT_COMPOSITOR_POLICY.schemaVersion,
    algorithm: {
      id: CHARACTER_EDIT_COMPOSITOR_POLICY.algorithm,
      color_space: CHARACTER_EDIT_COMPOSITOR_POLICY.colorSpace,
      transfer: 'IEC 61966-2-1 sRGB to linear light and back',
      representation: 'premultiplied RGBA',
      mask_coverage: 'grayscale multiplied by alpha',
      output_color_type: CHARACTER_EDIT_COMPOSITOR_POLICY.outputColorType,
      output_bit_depth: CHARACTER_EDIT_COMPOSITOR_POLICY.outputBitDepth,
    },
    edit_spec: {
      path: normalizedSpec.relative,
      bytes: specBytes.length,
      sha256: sha256(specBytes),
      schema_version: spec.schema_version,
    },
    controls: {
      allow_alpha_change: spec.allow_alpha_change,
      zero_mask_pixels_copied_byte_exactly: true,
    },
    inputs: {
      base: inputRecord(paths.base, baseBytes, base, spec.base.sha256),
      raw_candidate: inputRecord(paths.rawCandidate, candidateBytes, candidate, spec.raw_candidate.sha256),
      mask: inputRecord(paths.mask, maskBytes, mask, spec.mask.sha256),
    },
    mask: composite.mask,
    changes: composite.changes,
    output: {
      image: {
        path: paths.outputImage.relative,
        media_type: 'image/png',
        bytes: outputBytes.length,
        sha256: sha256(outputBytes),
        rgba_sha256: sha256(composite.data),
        dimensions,
      },
      provenance: paths.outputProvenance.relative,
    },
  };
  const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`);

  await installCharacterEditOutputPair({
    imagePath: paths.outputImage.absolute,
    imageBytes: outputBytes,
    provenancePath: paths.outputProvenance.absolute,
    provenanceBytes,
  });

  return Object.freeze({
    image: provenance.output.image,
    provenance_path: provenance.output.provenance,
    mask: provenance.mask,
    changes: provenance.changes,
  });
}

export function compositeCharacterEditPixels({ base, candidate, mask, allowAlphaChange }) {
  assertDecodedImage(base, 'base');
  assertDecodedImage(candidate, 'candidate');
  assertDecodedImage(mask, 'mask');
  if (typeof allowAlphaChange !== 'boolean') throw new TypeError('allowAlphaChange must be boolean.');
  assertMatchingDimensions(base, candidate, mask);
  validateMask(mask, 'mask');

  const data = Buffer.alloc(base.data.length);
  const pixelCount = base.width * base.height;
  let maskZeroPixels = 0;
  let maskNonzeroPixels = 0;
  let maskFullPixels = 0;
  let maskSoftPixels = 0;
  let minimumNonzeroCoverageUnits = CHARACTER_EDIT_COMPOSITOR_POLICY.maskCoverageDenominator;
  let maximumCoverageUnits = 0;
  let minimumX = base.width;
  let minimumY = base.height;
  let maximumX = -1;
  let maximumY = -1;
  let outputChangedPixels = 0;
  let rgbChangedPixels = 0;
  let alphaChangedPixels = 0;
  let changedChannelBytes = 0;
  let outsideMaskChangedPixels = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4;
    const coverageUnits = mask.data[offset] * mask.data[offset + 3];
    if (coverageUnits === 0) {
      maskZeroPixels += 1;
      base.data.copy(data, offset, offset, offset + 4);
    } else {
      maskNonzeroPixels += 1;
      if (coverageUnits === CHARACTER_EDIT_COMPOSITOR_POLICY.maskCoverageDenominator) maskFullPixels += 1;
      else maskSoftPixels += 1;
      minimumNonzeroCoverageUnits = Math.min(minimumNonzeroCoverageUnits, coverageUnits);
      maximumCoverageUnits = Math.max(maximumCoverageUnits, coverageUnits);
      const pixelX = pixel % base.width;
      const pixelY = Math.floor(pixel / base.width);
      minimumX = Math.min(minimumX, pixelX);
      minimumY = Math.min(minimumY, pixelY);
      maximumX = Math.max(maximumX, pixelX);
      maximumY = Math.max(maximumY, pixelY);
      compositePixel(data, offset, base.data, candidate.data, coverageUnits, allowAlphaChange);
    }

    let pixelChanged = false;
    let pixelRgbChanged = false;
    for (let channel = 0; channel < 4; channel += 1) {
      if (data[offset + channel] === base.data[offset + channel]) continue;
      pixelChanged = true;
      changedChannelBytes += 1;
      if (channel < 3) pixelRgbChanged = true;
    }
    if (pixelChanged) outputChangedPixels += 1;
    if (pixelRgbChanged) rgbChangedPixels += 1;
    if (data[offset + 3] !== base.data[offset + 3]) alphaChangedPixels += 1;
    if (coverageUnits === 0 && pixelChanged) outsideMaskChangedPixels += 1;
  }

  if (outsideMaskChangedPixels !== 0) {
    throw new Error('Compositor invariant failed: a zero-mask pixel changed.');
  }
  if (!allowAlphaChange && alphaChangedPixels !== 0) {
    throw new Error('Compositor invariant failed: base alpha changed while alpha edits were forbidden.');
  }

  const bounds = maskNonzeroPixels === 0 ? null : Object.freeze({
    x: minimumX,
    y: minimumY,
    width: maximumX - minimumX + 1,
    height: maximumY - minimumY + 1,
  });
  return Object.freeze({
    data,
    mask: Object.freeze({
      bounds,
      coverage_denominator: CHARACTER_EDIT_COMPOSITOR_POLICY.maskCoverageDenominator,
      minimum_nonzero_coverage_units: maskNonzeroPixels === 0 ? null : minimumNonzeroCoverageUnits,
      maximum_coverage_units: maskNonzeroPixels === 0 ? 0 : maximumCoverageUnits,
      zero_pixels: maskZeroPixels,
      nonzero_pixels: maskNonzeroPixels,
      full_pixels: maskFullPixels,
      soft_pixels: maskSoftPixels,
    }),
    changes: Object.freeze({
      total_pixels: pixelCount,
      output_changed_pixels: outputChangedPixels,
      rgb_changed_pixels: rgbChangedPixels,
      alpha_changed_pixels: alphaChangedPixels,
      changed_channel_bytes: changedChannelBytes,
      outside_zero_mask_changed_pixels: outsideMaskChangedPixels,
    }),
  });
}

export async function installCharacterEditOutputPair({
  imagePath,
  imageBytes,
  provenancePath,
  provenanceBytes,
}) {
  const imageTemporary = temporaryPath(imagePath);
  const provenanceTemporary = temporaryPath(provenancePath);
  let imageInstalled = false;
  let provenanceInstalled = false;
  try {
    await Promise.all([
      writeDurableTemporary(imageTemporary, imageBytes),
      writeDurableTemporary(provenanceTemporary, provenanceBytes),
    ]);
    try {
      await link(imageTemporary, imagePath);
      imageInstalled = true;
      await syncDirectory(dirname(imagePath));
      await link(provenanceTemporary, provenancePath);
      provenanceInstalled = true;
      await syncDirectory(dirname(provenancePath));
    } catch (error) {
      if (provenanceInstalled) {
        await unlink(provenancePath);
        provenanceInstalled = false;
        await syncDirectory(dirname(provenancePath));
      }
      if (imageInstalled) {
        await unlink(imagePath);
        imageInstalled = false;
        await syncDirectory(dirname(imagePath));
      }
      throw error;
    }
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new Error('Refusing to overwrite an existing character edit image or provenance record.');
    }
    throw error;
  } finally {
    await Promise.all([
      unlink(imageTemporary).catch(() => {}),
      unlink(provenanceTemporary).catch(() => {}),
    ]);
    if (imageInstalled) await access(imagePath, fsConstants.R_OK);
    if (provenanceInstalled) await access(provenancePath, fsConstants.R_OK);
  }
}

function compositePixel(output, offset, base, candidate, coverageUnits, allowAlphaChange) {
  const coverage = coverageUnits / CHARACTER_EDIT_COMPOSITOR_POLICY.maskCoverageDenominator;
  const inverseCoverage = 1 - coverage;
  const baseAlpha = base[offset + 3] / 255;
  const candidateAlpha = candidate[offset + 3] / 255;
  const effectiveCandidateAlpha = allowAlphaChange ? candidateAlpha : baseAlpha;
  const outputAlpha = allowAlphaChange
    ? baseAlpha * inverseCoverage + candidateAlpha * coverage
    : baseAlpha;

  for (let channel = 0; channel < 3; channel += 1) {
    const baseLinear = srgbByteToLinear(base[offset + channel]);
    const candidateLinear = srgbByteToLinear(candidate[offset + channel]);
    const outputPremultiplied = baseLinear * baseAlpha * inverseCoverage
      + candidateLinear * effectiveCandidateAlpha * coverage;
    const outputLinear = outputAlpha > 0
      ? outputPremultiplied / outputAlpha
      : baseLinear * inverseCoverage + candidateLinear * coverage;
    output[offset + channel] = linearToSrgbByte(outputLinear);
  }
  output[offset + 3] = allowAlphaChange
    ? Math.round(clampUnit(outputAlpha) * 255)
    : base[offset + 3];
}

function srgbByteToLinear(value) {
  const srgb = value / 255;
  if (srgb <= 0.04045) return srgb / 12.92;
  return ((srgb + 0.055) / 1.055) ** 2.4;
}

function linearToSrgbByte(value) {
  const linear = clampUnit(value);
  const srgb = linear <= 0.0031308
    ? linear * 12.92
    : 1.055 * (linear ** (1 / 2.4)) - 0.055;
  return Math.round(clampUnit(srgb) * 255);
}

function clampUnit(value) {
  return Math.max(0, Math.min(1, value));
}

function validateHashedPng(value, label) {
  assertPlainObject(value, label);
  assertExactKeys(value, ['path', 'sha256'], label);
  assertPngPath(value.path, `${label}.path`);
  if (typeof value.sha256 !== 'string' || !SHA256_PATTERN.test(value.sha256)) {
    throw new TypeError(`${label}.sha256 must be a lowercase SHA-256 digest.`);
  }
}

function assertPngPath(value, label) {
  assertNonEmptyString(value, label);
  if (!value.toLowerCase().endsWith('.png')) throw new Error(`${label} must end in .png.`);
}

function assertExpectedHash(bytes, expected, label) {
  const actual = sha256(bytes);
  if (actual !== expected) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expected}, found ${actual}.`);
  }
}

function inspectPng(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${label} is not a PNG (signature mismatch).`);
  }
  try {
    const png = PNG.sync.read(bytes);
    assertDecodedImage(png, label);
    if (png.depth !== 8) throw new Error(`bit depth ${png.depth} is unsupported; expected 8`);
    return png;
  } catch (error) {
    throw new Error(`${label} is not a valid 8-bit PNG: ${error.message}`);
  }
}

function assertDecodedImage(image, label) {
  if (!image || !Number.isInteger(image.width) || image.width <= 0
    || !Number.isInteger(image.height) || image.height <= 0
    || !Buffer.isBuffer(image.data) || image.data.length !== image.width * image.height * 4) {
    throw new TypeError(`${label} must be a decoded RGBA image with positive dimensions.`);
  }
}

function assertMatchingDimensions(base, candidate, mask) {
  if (candidate.width !== base.width || candidate.height !== base.height) {
    throw new Error(
      `Raw candidate dimensions ${candidate.width}x${candidate.height} do not match base ${base.width}x${base.height}.`,
    );
  }
  if (mask.width !== base.width || mask.height !== base.height) {
    throw new Error(`Mask dimensions ${mask.width}x${mask.height} do not match base ${base.width}x${base.height}.`);
  }
}

function validateMask(mask, label) {
  if (!MASK_COLOR_TYPES.has(mask.colorType)) {
    throw new Error(`${label} must be grayscale, grayscale-alpha, or RGBA; found PNG color type ${mask.colorType}.`);
  }
  for (let offset = 0; offset < mask.data.length; offset += 4) {
    if (mask.data[offset] !== mask.data[offset + 1] || mask.data[offset] !== mask.data[offset + 2]) {
      const pixel = offset / 4;
      throw new Error(`${label} RGBA mask RGB must be grayscale at pixel ${pixel}.`);
    }
  }
}

function inputRecord(path, bytes, png, expectedSha256 = undefined) {
  const record = {
    path: path.relative,
    bytes: bytes.length,
    sha256: sha256(bytes),
    rgba_sha256: sha256(png.data),
    dimensions: { width: png.width, height: png.height },
    png: {
      color_type: png.colorType,
      bit_depth: png.depth,
      has_color: png.color,
      has_alpha: png.alpha,
      interlaced: png.interlace,
    },
  };
  if (expectedSha256 !== undefined) record.expected_sha256 = expectedSha256;
  return record;
}

function assertDistinctPaths(specPath, paths) {
  const entries = [
    ['edit spec', specPath.absolute],
    ['base PNG', paths.base.absolute],
    ['raw candidate PNG', paths.rawCandidate.absolute],
    ['mask PNG', paths.mask.absolute],
    ['output image', paths.outputImage.absolute],
    ['output provenance', paths.outputProvenance.absolute],
  ];
  const seen = new Map();
  for (const [label, path] of entries) {
    if (seen.has(path)) throw new Error(`${label} path must differ from ${seen.get(path)} path.`);
    seen.set(path, label);
  }
}

async function assertOutputDestinationsAvailable(image, provenance) {
  await Promise.all([
    assertFileMissing(image.absolute, image.relative),
    assertFileMissing(provenance.absolute, provenance.relative),
    assertWritableDirectory(dirname(image.absolute), `parent directory for ${image.relative}`),
    assertWritableDirectory(dirname(provenance.absolute), `parent directory for ${provenance.relative}`),
  ]);
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

async function assertWritableDirectory(path, label) {
  const information = await stat(path);
  if (!information.isDirectory()) throw new Error(`${label} is not a directory.`);
  await access(path, fsConstants.W_OK);
}

function resolveRepositoryPath(repoRoot, value, label) {
  assertNonEmptyString(value, label);
  if (isAbsolute(value)) throw new Error(`${label} must be relative to the repository root.`);
  const root = resolve(repoRoot);
  const absolute = resolve(root, value);
  const relativePath = relative(root, absolute);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`${label} must identify a file inside the repository root.`);
  }
  return Object.freeze({
    absolute,
    relative: relativePath.split(sep).join('/'),
  });
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

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function temporaryPath(finalPath) {
  return resolve(dirname(finalPath), `.${randomUUID()}.character-edit.tmp`);
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

async function main() {
  const options = parseCharacterEditArgs(process.argv.slice(2));
  if (options.help) {
    console.log(characterEditHelp());
    return;
  }
  const result = await runCharacterEditComposite({ specPath: options.spec });
  console.log(JSON.stringify(result, null, 2));
}

const mainUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (mainUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  });
}
