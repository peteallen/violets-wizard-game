import { assertExactKeys, deepFreeze } from './registry.js';

const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;
const REVISION_PATTERN = /^\d+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ARCHITECTURES = new Set(['arm64', 'x64']);

function assertVersion(value, path) {
  if (typeof value !== 'string' || !VERSION_PATTERN.test(value)) throw new TypeError(`${path} must be a numeric version string.`);
}

function assertToken(value, path) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._/-]+$/.test(value)) throw new TypeError(`${path} must be a stable token.`);
}

function fontIdentity(fonts) {
  if (fonts.length === 0) return 'fonts-none';
  return `fonts-${fonts.map((font) => font.sha256.slice(0, 8)).sort().join('.')}`;
}

export function environmentIdentityId(identity) {
  const mode = identity.browser.headless ? 'headless' : 'headed';
  return [
    identity.os.name,
    identity.os.version,
    identity.os.architecture,
    `node${identity.runtime.node}`,
    `pw${identity.browser.playwright}`,
    `${identity.browser.name}${identity.browser.revision}`,
    mode,
    identity.rendering.colorSpace,
    identity.rendering.locale.toLowerCase(),
    identity.rendering.timezone.toLowerCase(),
    fontIdentity(identity.rendering.fonts),
  ].join('-');
}

export function validateEnvironmentIdentity(identity, path = 'capture environment') {
  assertExactKeys(identity, ['schemaVersion', 'id', 'os', 'runtime', 'browser', 'rendering'], path);
  if (identity.schemaVersion !== 1) throw new TypeError(`${path}.schemaVersion must be 1.`);
  assertExactKeys(identity.os, ['name', 'version', 'architecture'], `${path}.os`);
  if (identity.os.name !== 'macos') throw new TypeError(`${path}.os.name must be macos for committed goldens.`);
  assertVersion(identity.os.version, `${path}.os.version`);
  if (!ARCHITECTURES.has(identity.os.architecture)) throw new TypeError(`${path}.os.architecture must be arm64 or x64.`);
  assertExactKeys(identity.runtime, ['node'], `${path}.runtime`);
  assertVersion(identity.runtime.node, `${path}.runtime.node`);
  assertExactKeys(identity.browser, ['name', 'revision', 'playwright', 'headless'], `${path}.browser`);
  if (identity.browser.name !== 'chromium') throw new TypeError(`${path}.browser.name must be chromium.`);
  if (typeof identity.browser.revision !== 'string' || !REVISION_PATTERN.test(identity.browser.revision)) {
    throw new TypeError(`${path}.browser.revision must be a numeric string.`);
  }
  assertVersion(identity.browser.playwright, `${path}.browser.playwright`);
  if (typeof identity.browser.headless !== 'boolean') throw new TypeError(`${path}.browser.headless must be boolean.`);
  assertExactKeys(identity.rendering, ['colorSpace', 'locale', 'timezone', 'fonts'], `${path}.rendering`);
  if (identity.rendering.colorSpace !== 'srgb') throw new TypeError(`${path}.rendering.colorSpace must be srgb.`);
  assertToken(identity.rendering.locale, `${path}.rendering.locale`);
  assertToken(identity.rendering.timezone, `${path}.rendering.timezone`);
  if (!Array.isArray(identity.rendering.fonts)) throw new TypeError(`${path}.rendering.fonts must be an array.`);
  const fontPaths = new Set();
  identity.rendering.fonts.forEach((font, index) => {
    const fontPath = `${path}.rendering.fonts[${index}]`;
    assertExactKeys(font, ['path', 'sha256'], fontPath);
    assertToken(font.path, `${fontPath}.path`);
    if (typeof font.sha256 !== 'string' || !SHA256_PATTERN.test(font.sha256)) {
      throw new TypeError(`${fontPath}.sha256 must be a lowercase SHA-256 digest.`);
    }
    if (fontPaths.has(font.path)) throw new TypeError(`${path}.rendering.fonts contains duplicate path "${font.path}".`);
    fontPaths.add(font.path);
  });
  const expectedId = environmentIdentityId(identity);
  if (identity.id !== expectedId) throw new TypeError(`${path}.id must be "${expectedId}".`);
  return identity;
}

function firstDifference(actual, expected, path = 'capture environment') {
  if (Object.is(actual, expected)) return null;
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return `${path}.length`;
    for (let index = 0; index < actual.length; index += 1) {
      const difference = firstDifference(actual[index], expected[index], `${path}[${index}]`);
      if (difference) return difference;
    }
    return null;
  }
  if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].sort();
    for (const key of keys) {
      const difference = firstDifference(actual[key], expected[key], `${path}.${key}`);
      if (difference) return difference;
    }
    return null;
  }
  return path;
}

export function assertEnvironmentIdentity(actual, expected = APPROVED_CAPTURE_ENVIRONMENT) {
  validateEnvironmentIdentity(actual, 'actual capture environment');
  validateEnvironmentIdentity(expected, 'expected capture environment');
  const difference = firstDifference(actual, expected);
  if (difference) {
    throw new Error(`Capture environment mismatch at ${difference}. Expected ${expected.id}, received ${actual.id}.`);
  }
  return actual;
}

const approvedDefinition = {
  schemaVersion: 1,
  id: '',
  os: { name: 'macos', version: '26.5.2', architecture: 'arm64' },
  runtime: { node: '22.17.0' },
  browser: { name: 'chromium', revision: '1208', playwright: '1.58.2', headless: true },
  rendering: {
    colorSpace: 'srgb',
    locale: 'en-US',
    timezone: 'UTC',
    fonts: [
      { path: 'src/assets/fonts/Andika-Regular.woff2', sha256: '50841fc9db96758f504a1776c700a585a774d172ac172e97b77fff5b75deff7b' },
      { path: 'src/assets/fonts/Andika-Bold.woff2', sha256: '6b73917d10eda36aa87b423b05100dd461ea23f88882edabcb8e5001fde80f2b' },
      { path: 'src/assets/fonts/Almendra-Bold.woff2', sha256: '2bb44ff2a9ac9b458b6183e029a785d4f5c36da6e7f488f675e1d2c102abf84b' },
    ],
  },
};

approvedDefinition.id = environmentIdentityId(approvedDefinition);
validateEnvironmentIdentity(approvedDefinition);

export const APPROVED_CAPTURE_ENVIRONMENT = deepFreeze(approvedDefinition);
