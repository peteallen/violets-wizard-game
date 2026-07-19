import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const CHARACTER_ASSET_PREFIX = 'assets/art/characters/';

export const CHARACTER_WEBP_ENCODING = Object.freeze({
  command: 'cwebp',
  arguments: Object.freeze(['-lossless', '-z', '9', '-quiet']),
});

export const CHARACTER_WEBP_COMPOSITE_BACKGROUNDS = Object.freeze([
  Object.freeze({ name: 'black', rgb: Object.freeze([0, 0, 0]) }),
  Object.freeze({ name: 'white', rgb: Object.freeze([255, 255, 255]) }),
  Object.freeze({ name: 'saturated-magenta', rgb: Object.freeze([255, 0, 255]) }),
]);

export const CHARACTER_WEBP_BASELINE_SCHEMA_VERSION = 1;
export const CHARACTER_WEBP_BASELINE_CANVAS = Object.freeze({ width: 896, height: 1200 });

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function parseLosslessWebp(bytes, label = 'Character WebP') {
  if (!Buffer.isBuffer(bytes) || bytes.length < 26) {
    throw new Error(`${label} is too small to be a WebP.`);
  }
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${label} is not a RIFF WebP.`);
  }
  const declaredLength = bytes.readUInt32LE(4) + 8;
  if (declaredLength !== bytes.length) {
    throw new Error(`${label} RIFF length is ${declaredLength}; file has ${bytes.length} bytes.`);
  }

  let offset = 12;
  let lossless = null;
  let lossyChunks = 0;
  let animationChunks = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error(`${label} has a truncated WebP chunk header.`);
    const type = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const payload = offset + 8;
    const end = payload + length;
    if (end > bytes.length) throw new Error(`${label} has a truncated ${type} chunk.`);
    if (type === 'VP8 ') lossyChunks += 1;
    if (type === 'ANIM' || type === 'ANMF') animationChunks += 1;
    if (type === 'VP8L') {
      if (lossless) throw new Error(`${label} contains multiple VP8L payloads.`);
      if (length < 5 || bytes[payload] !== 0x2f) {
        throw new Error(`${label} has an invalid VP8L signature.`);
      }
      const bits = bytes.readUInt32LE(payload + 1);
      const version = bits >>> 29;
      if (version !== 0) throw new Error(`${label} uses unsupported VP8L version ${version}.`);
      lossless = Object.freeze({
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
        hasAlpha: ((bits >>> 28) & 1) === 1,
      });
    }
    offset = end + (length % 2);
  }
  if (offset !== bytes.length) throw new Error(`${label} has an invalid padded chunk length.`);
  if (lossyChunks > 0 || !lossless) {
    throw new Error(`${label} must contain one lossless VP8L payload and no lossy VP8 payload.`);
  }
  if (animationChunks > 0) throw new Error(`${label} must be a static VP8L image, not an animation.`);
  return lossless;
}

export function deriveCharacterPixelInvariant(rgba, { width, height }) {
  const expectedLength = width * height * 4;
  if (!Buffer.isBuffer(rgba) || rgba.length !== expectedLength) {
    throw new TypeError(`Character RGBA must contain ${expectedLength} bytes for ${width}x${height}.`);
  }
  const pixels = width * height;
  const alpha = Buffer.allocUnsafe(pixels);
  const visibleRgba = Buffer.from(rgba);
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    const offset = pixel * 4;
    const value = rgba[offset + 3];
    alpha[pixel] = value;
    if (value !== 0) continue;
    visibleRgba[offset] = 0;
    visibleRgba[offset + 1] = 0;
    visibleRgba[offset + 2] = 0;
  }

  const compositeSha256 = {};
  const composite = Buffer.allocUnsafe(pixels * 3);
  for (const { name, rgb } of CHARACTER_WEBP_COMPOSITE_BACKGROUNDS) {
    for (let pixel = 0; pixel < pixels; pixel += 1) {
      const rgbaOffset = pixel * 4;
      const compositeOffset = pixel * 3;
      const pixelAlpha = rgba[rgbaOffset + 3];
      for (let channel = 0; channel < 3; channel += 1) {
        composite[compositeOffset + channel] = Math.round((
          rgba[rgbaOffset + channel] * pixelAlpha
          + rgb[channel] * (255 - pixelAlpha)
        ) / 255);
      }
    }
    compositeSha256[name] = sha256(composite);
  }

  return Object.freeze({
    alpha_sha256: sha256(alpha),
    visible_rgba_sha256: sha256(visibleRgba),
    composite_sha256: Object.freeze(compositeSha256),
  });
}

export async function decodeCharacterWebpRgba(
  path,
  { width, height, execute = execFileAsync } = {},
) {
  const expectedLength = width * height * 4;
  let stdout;
  try {
    ({ stdout } = await execute(
      'ffmpeg',
      ['-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'],
      { encoding: null, maxBuffer: expectedLength + 64 * 1024 },
    ));
  } catch (error) {
    throw new Error(`Could not decode ${path} with ffmpeg: ${error.message}`, { cause: error });
  }
  const decoded = Buffer.from(stdout);
  if (decoded.length !== expectedLength) {
    throw new Error(`${path} decoded to ${decoded.length} RGBA bytes; expected ${expectedLength}.`);
  }
  return decoded;
}

export async function inspectCharacterWebp(
  path,
  {
    expectedWidth = CHARACTER_WEBP_BASELINE_CANVAS.width,
    expectedHeight = CHARACTER_WEBP_BASELINE_CANVAS.height,
    decode = decodeCharacterWebpRgba,
  } = {},
) {
  const bytes = await readFile(path);
  const header = parseLosslessWebp(bytes, path);
  if (header.width !== expectedWidth || header.height !== expectedHeight) {
    throw new Error(
      `${path} is ${header.width}x${header.height}; expected ${expectedWidth}x${expectedHeight}.`,
    );
  }
  if (!header.hasAlpha) throw new Error(`${path} VP8L payload does not declare alpha.`);
  const rgba = await decode(path, { width: header.width, height: header.height });
  return Object.freeze({
    bytes: bytes.length,
    container_sha256: sha256(bytes),
    ...deriveCharacterPixelInvariant(rgba, header),
  });
}

export function validateCharacterWebpBaseline(value) {
  assertPlainObject(value, 'character WebP baseline');
  assertExactKeys(
    value,
    [
      'schema_version',
      'encoding',
      'pixel_encoding',
      'canvas',
      'composite_backgrounds',
      'frames',
    ],
    'character WebP baseline',
  );
  if (value.schema_version !== CHARACTER_WEBP_BASELINE_SCHEMA_VERSION) {
    throw new Error(
      `character WebP baseline.schema_version must be ${CHARACTER_WEBP_BASELINE_SCHEMA_VERSION}.`,
    );
  }
  if (value.encoding !== 'lossless-vp8l') {
    throw new Error('character WebP baseline.encoding must be lossless-vp8l.');
  }
  if (value.pixel_encoding !== 'rgba8-row-major-straight-alpha') {
    throw new Error(
      'character WebP baseline.pixel_encoding must be rgba8-row-major-straight-alpha.',
    );
  }
  assertPlainObject(value.canvas, 'character WebP baseline.canvas');
  assertExactKeys(value.canvas, ['width', 'height'], 'character WebP baseline.canvas');
  if (
    value.canvas.width !== CHARACTER_WEBP_BASELINE_CANVAS.width
    || value.canvas.height !== CHARACTER_WEBP_BASELINE_CANVAS.height
  ) {
    throw new Error('character WebP baseline.canvas must be 896x1200.');
  }
  assertPlainObject(value.composite_backgrounds, 'character WebP baseline.composite_backgrounds');
  const expectedBackgrounds = Object.fromEntries(
    CHARACTER_WEBP_COMPOSITE_BACKGROUNDS.map(({ name, rgb }) => [name, [...rgb]]),
  );
  if (JSON.stringify(value.composite_backgrounds) !== JSON.stringify(expectedBackgrounds)) {
    throw new Error('character WebP baseline.composite_backgrounds do not match the verifier policy.');
  }
  assertPlainObject(value.frames, 'character WebP baseline.frames');
  if (Object.keys(value.frames).length === 0) throw new Error('character WebP baseline.frames is empty.');
  for (const [path, record] of Object.entries(value.frames)) {
    if (!path.startsWith(CHARACTER_ASSET_PREFIX) || !path.endsWith('.webp')) {
      throw new Error(`character WebP baseline frame ${path} is not a shipping character WebP path.`);
    }
    validateIntegrityRecord(record, `character WebP baseline.frames[${JSON.stringify(path)}]`);
  }
  return value;
}

export async function buildCharacterWebpBaseline({ publicRoot, characterPaths, inspect = inspectCharacterWebp }) {
  const frames = {};
  for (const path of sortedUniqueCharacterPaths(characterPaths)) {
    frames[path] = await inspect(resolve(publicRoot, path));
  }
  return Object.freeze({
    schema_version: CHARACTER_WEBP_BASELINE_SCHEMA_VERSION,
    encoding: 'lossless-vp8l',
    pixel_encoding: 'rgba8-row-major-straight-alpha',
    canvas: Object.freeze({ ...CHARACTER_WEBP_BASELINE_CANVAS }),
    composite_backgrounds: Object.freeze(Object.fromEntries(
      CHARACTER_WEBP_COMPOSITE_BACKGROUNDS.map(({ name, rgb }) => [name, Object.freeze([...rgb])]),
    )),
    frames: Object.freeze(frames),
  });
}

export async function verifyCharacterWebpBaseline({
  publicRoot,
  characterPaths,
  baseline,
  inspect = inspectCharacterWebp,
}) {
  const failures = [];
  try {
    validateCharacterWebpBaseline(baseline);
  } catch (error) {
    return [`invalid character WebP baseline: ${error.message}`];
  }
  let paths;
  try {
    paths = sortedUniqueCharacterPaths(characterPaths);
  } catch (error) {
    return [error.message];
  }
  const expectedPaths = Object.keys(baseline.frames).sort();
  for (const path of paths) {
    if (!Object.hasOwn(baseline.frames, path)) {
      failures.push(`character WebP baseline is missing ${path}`);
    }
  }
  for (const path of expectedPaths) {
    if (!paths.includes(path)) failures.push(`character WebP baseline has stale frame ${path}`);
  }

  for (const path of paths.filter((entry) => Object.hasOwn(baseline.frames, entry))) {
    let actual;
    try {
      actual = await inspect(resolve(publicRoot, path));
    } catch (error) {
      failures.push(`${path}: ${error.message}`);
      continue;
    }
    compareIntegrityRecords(actual, baseline.frames[path], path, failures);
  }
  return failures;
}

export async function verifyRenderedCharacterWebp(
  path,
  expectedRgba,
  { width, height, inspect = inspectCharacterWebp } = {},
) {
  const expected = deriveCharacterPixelInvariant(Buffer.from(expectedRgba), { width, height });
  const actual = await inspect(path, { expectedWidth: width, expectedHeight: height });
  const failures = [];
  comparePixelInvariants(actual, expected, path, failures);
  if (failures.length > 0) throw new Error(failures.join(' '));
  return Object.freeze({
    alpha: 'exact',
    visibleRgb: 'exact',
    compositeBackgrounds: Object.freeze(
      CHARACTER_WEBP_COMPOSITE_BACKGROUNDS.map(({ name }) => name),
    ),
    integrity: actual,
  });
}

export async function encodeLosslessCharacterWebp({
  pngBytes,
  expectedRgba,
  width,
  height,
  outputLabel,
  execute = execFileAsync,
  verify = verifyRenderedCharacterWebp,
}) {
  if (!Buffer.isBuffer(pngBytes)) throw new TypeError('Character WebP encoder requires PNG bytes.');
  const scratch = await mkdtemp(join(tmpdir(), 'violet-character-webp-'));
  const pngPath = join(scratch, 'frame.png');
  const webpPath = join(scratch, 'frame.webp');
  try {
    await writeFile(pngPath, pngBytes);
    try {
      await execute(
        CHARACTER_WEBP_ENCODING.command,
        [...CHARACTER_WEBP_ENCODING.arguments, pngPath, '-o', webpPath],
      );
    } catch (error) {
      throw new Error(
        `Could not encode ${outputLabel} with cwebp -lossless -z 9: ${error.message}`,
        { cause: error },
      );
    }
    const verification = await verify(webpPath, Buffer.from(expectedRgba), { width, height });
    return Object.freeze({ bytes: await readFile(webpPath), verification });
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

function sortedUniqueCharacterPaths(characterPaths) {
  if (!Array.isArray(characterPaths) || characterPaths.length === 0) {
    throw new TypeError('Character WebP inventory requires at least one manifest path.');
  }
  const paths = [...characterPaths].sort();
  if (new Set(paths).size !== paths.length) {
    throw new Error('Character WebP inventory contains duplicate manifest paths.');
  }
  for (const path of paths) {
    if (typeof path !== 'string' || !path.startsWith(CHARACTER_ASSET_PREFIX) || !path.endsWith('.webp')) {
      throw new Error(`Character WebP inventory path ${path} must be under ${CHARACTER_ASSET_PREFIX} and end in .webp.`);
    }
  }
  return paths;
}

function validateIntegrityRecord(value, label) {
  assertPlainObject(value, label);
  assertExactKeys(
    value,
    ['bytes', 'container_sha256', 'alpha_sha256', 'visible_rgba_sha256', 'composite_sha256'],
    label,
  );
  if (!Number.isSafeInteger(value.bytes) || value.bytes <= 1024) {
    throw new Error(`${label}.bytes must be an integer greater than 1024.`);
  }
  for (const field of ['container_sha256', 'alpha_sha256', 'visible_rgba_sha256']) {
    if (typeof value[field] !== 'string' || !SHA256_PATTERN.test(value[field])) {
      throw new Error(`${label}.${field} must be a lowercase SHA-256 digest.`);
    }
  }
  assertPlainObject(value.composite_sha256, `${label}.composite_sha256`);
  const backgroundNames = CHARACTER_WEBP_COMPOSITE_BACKGROUNDS.map(({ name }) => name);
  assertExactKeys(value.composite_sha256, backgroundNames, `${label}.composite_sha256`);
  for (const name of backgroundNames) {
    if (!SHA256_PATTERN.test(value.composite_sha256[name] ?? '')) {
      throw new Error(`${label}.composite_sha256.${name} must be a lowercase SHA-256 digest.`);
    }
  }
}

function compareIntegrityRecords(actual, expected, label, failures) {
  for (const field of ['bytes', 'container_sha256']) {
    if (actual[field] !== expected[field]) {
      failures.push(`${label}: ${field} expected ${expected[field]}, found ${actual[field]}`);
    }
  }
  comparePixelInvariants(actual, expected, label, failures);
}

function comparePixelInvariants(actual, expected, label, failures) {
  for (const field of ['alpha_sha256', 'visible_rgba_sha256']) {
    if (actual[field] !== expected[field]) {
      failures.push(`${label}: ${field} expected ${expected[field]}, found ${actual[field]}`);
    }
  }
  for (const { name } of CHARACTER_WEBP_COMPOSITE_BACKGROUNDS) {
    if (actual.composite_sha256?.[name] !== expected.composite_sha256?.[name]) {
      failures.push(
        `${label}: composite_sha256.${name} expected ${expected.composite_sha256?.[name]}, `
        + `found ${actual.composite_sha256?.[name]}`,
      );
    }
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new Error(`${label} keys must be exactly: ${sortedExpected.join(', ')}.`);
  }
}
