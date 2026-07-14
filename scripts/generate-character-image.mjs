import { execFile as execFileCallback } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
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
import { constants as fsConstants } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

export const CHARACTER_IMAGE_POLICY = Object.freeze({
  schemaVersion: 1,
  model: 'google/gemini-3.1-flash-image',
  canonicalModelSlug: 'google/gemini-3.1-flash-image-20260528',
  provider: 'google-vertex/global',
  apiBaseUrl: 'https://openrouter.ai/api/v1',
  outputFormat: 'png',
  imageCount: 1,
  maximumReferences: 14,
});

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const execFile = promisify(execFileCallback);
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const SAFE_APP_HEADERS = Object.freeze({
  'HTTP-Referer': 'https://github.com/peteallen/violets-wizard-game',
  'X-OpenRouter-Title': "Violet at Hogwarts character pipeline",
});
const SENSITIVE_HEADER_NAME = /authorization|cookie|api[-_]?key|token|secret|credential/i;

export function parseCharacterImageArgs(argv) {
  const options = { request: null, dryRun: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') {
      if (options.dryRun) throw new Error('--dry-run may be supplied only once.');
      options.dryRun = true;
      continue;
    }
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--request') {
      if (options.request) throw new Error('--request may be supplied only once.');
      options.request = argv[index + 1] ?? null;
      if (!options.request || options.request.startsWith('--')) {
        throw new Error('--request requires a JSON request-spec path.');
      }
      index += 1;
      continue;
    }
    if (argument.startsWith('--request=')) {
      if (options.request) throw new Error('--request may be supplied only once.');
      options.request = argument.slice('--request='.length);
      if (!options.request) throw new Error('--request requires a JSON request-spec path.');
      continue;
    }
    throw new Error(`Unknown argument ${argument}.`);
  }
  if (!options.help && !options.request) throw new Error('--request is required.');
  return Object.freeze(options);
}

export function characterImageHelp() {
  return [
    'Generate one production character image through the locked OpenRouter lineage.',
    '',
    'Usage:',
    '  node scripts/generate-character-image.mjs --request <spec.json> [--dry-run]',
    '',
    '--dry-run validates and hashes local inputs plus the live catalog, but never calls POST /images.',
    'The command never overwrites an image or provenance record and never retries a generation.',
  ].join('\n');
}

export function extractMarkdownSection(document, sectionName) {
  if (typeof document !== 'string') throw new TypeError('Prompt document must be text.');
  if (typeof sectionName !== 'string' || !sectionName.trim()) {
    throw new TypeError('prompt.section must be a non-empty Markdown heading.');
  }
  const expected = sectionName.trim();
  const headings = [];
  const expression = /^(#{1,6})[\t ]+(.+?)[\t ]*#*[\t ]*(?:\r?\n|$)/gm;
  for (const match of document.matchAll(expression)) {
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      start: match.index,
      contentStart: match.index + match[0].length,
    });
  }
  const matches = headings.filter(({ title }) => title === expected);
  if (matches.length !== 1) {
    throw new Error(`Prompt document must contain exactly one Markdown heading named ${JSON.stringify(expected)}; found ${matches.length}.`);
  }
  const heading = matches[0];
  const following = headings.find(({ start, level }) => start > heading.start && level <= heading.level);
  const content = document.slice(heading.contentStart, following?.start ?? document.length).trim();
  if (!content) throw new Error(`Markdown section ${JSON.stringify(expected)} is empty.`);
  return content;
}

export function validateCharacterImageSpec(value) {
  assertPlainObject(value, 'request spec');
  assertExactKeys(value, [
    'schema_version',
    'prompt',
    'references',
    'generation',
    'output',
  ], 'request spec');
  if (value.schema_version !== CHARACTER_IMAGE_POLICY.schemaVersion) {
    throw new Error(`request spec.schema_version must be ${CHARACTER_IMAGE_POLICY.schemaVersion}.`);
  }

  assertPlainObject(value.prompt, 'request spec.prompt');
  assertExactKeys(value.prompt, ['path', 'section'], 'request spec.prompt');
  assertNonEmptyString(value.prompt.path, 'request spec.prompt.path');
  assertNonEmptyString(value.prompt.section, 'request spec.prompt.section');

  if (!Array.isArray(value.references)) throw new TypeError('request spec.references must be an array.');
  if (value.references.length > CHARACTER_IMAGE_POLICY.maximumReferences) {
    throw new Error(`request spec.references may contain at most ${CHARACTER_IMAGE_POLICY.maximumReferences} entries.`);
  }
  value.references.forEach((reference, index) => {
    const label = `request spec.references[${index}]`;
    assertPlainObject(reference, label);
    assertExactKeys(reference, ['path', 'role'], label);
    assertNonEmptyString(reference.path, `${label}.path`);
    assertNonEmptyString(reference.role, `${label}.role`);
  });

  assertPlainObject(value.generation, 'request spec.generation');
  assertExactKeys(value.generation, ['aspect_ratio', 'resolution'], 'request spec.generation');
  assertNonEmptyString(value.generation.aspect_ratio, 'request spec.generation.aspect_ratio');
  assertNonEmptyString(value.generation.resolution, 'request spec.generation.resolution');

  assertPlainObject(value.output, 'request spec.output');
  assertExactKeys(value.output, ['image', 'provenance'], 'request spec.output');
  assertNonEmptyString(value.output.image, 'request spec.output.image');
  assertNonEmptyString(value.output.provenance, 'request spec.output.provenance');
  if (!value.output.image.toLowerCase().endsWith('.png')) {
    throw new Error('request spec.output.image must end in .png.');
  }
  if (!value.output.provenance.toLowerCase().endsWith('.json')) {
    throw new Error('request spec.output.provenance must end in .json.');
  }
  if (value.output.image === value.output.provenance) {
    throw new Error('request spec output image and provenance paths must differ.');
  }
  return value;
}

export async function prepareCharacterImageRequest({ requestPath, repoRoot = ROOT }) {
  const normalizedRequest = resolveRepositoryPath(repoRoot, requestPath, 'request path');
  const requestSpecBytes = await readFile(normalizedRequest.absolute);
  let requestSpec;
  try {
    requestSpec = JSON.parse(requestSpecBytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${normalizedRequest.relative} is not valid JSON: ${error.message}`);
  }
  validateCharacterImageSpec(requestSpec);

  const promptPath = resolveRepositoryPath(repoRoot, requestSpec.prompt.path, 'prompt path');
  const promptDocumentBytes = await readFile(promptPath.absolute);
  const promptDocument = promptDocumentBytes.toString('utf8');
  const prompt = extractMarkdownSection(promptDocument, requestSpec.prompt.section);

  const references = [];
  const inputReferences = [];
  for (let index = 0; index < requestSpec.references.length; index += 1) {
    const specReference = requestSpec.references[index];
    const referencePath = resolveRepositoryPath(repoRoot, specReference.path, `reference ${index + 1} path`);
    const bytes = await readFile(referencePath.absolute);
    const png = inspectPng(bytes, `Reference ${index + 1} (${referencePath.relative})`);
    references.push({
      index: index + 1,
      role: specReference.role.trim(),
      path: referencePath.relative,
      media_type: 'image/png',
      bytes: bytes.length,
      sha256: sha256(bytes),
      dimensions: { width: png.width, height: png.height },
      png: pngMetadata(png),
    });
    inputReferences.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${bytes.toString('base64')}` },
    });
  }

  const outputImage = resolveRepositoryPath(repoRoot, requestSpec.output.image, 'output image path');
  const outputProvenance = resolveRepositoryPath(repoRoot, requestSpec.output.provenance, 'output provenance path');
  if (outputImage.absolute === outputProvenance.absolute) {
    throw new Error('Output image and provenance paths resolve to the same file.');
  }

  const body = {
    model: CHARACTER_IMAGE_POLICY.model,
    prompt,
    aspect_ratio: requestSpec.generation.aspect_ratio,
    resolution: requestSpec.generation.resolution,
    n: CHARACTER_IMAGE_POLICY.imageCount,
    output_format: CHARACTER_IMAGE_POLICY.outputFormat,
    input_references: inputReferences,
    provider: {
      only: [CHARACTER_IMAGE_POLICY.provider],
      allow_fallbacks: false,
    },
  };
  const serializedBody = JSON.stringify(body);
  return Object.freeze({
    repoRoot: resolve(repoRoot),
    requestSpec,
    requestSpecRecord: Object.freeze({
      path: normalizedRequest.relative,
      bytes: requestSpecBytes.length,
      sha256: sha256(requestSpecBytes),
      schema_version: requestSpec.schema_version,
    }),
    promptRecord: Object.freeze({
      path: promptPath.relative,
      section: requestSpec.prompt.section.trim(),
      document_bytes: promptDocumentBytes.length,
      document_sha256: sha256(promptDocumentBytes),
      text_bytes: Buffer.byteLength(prompt, 'utf8'),
      text_sha256: sha256(prompt),
    }),
    references: Object.freeze(references),
    output: Object.freeze({
      image: outputImage,
      provenance: outputProvenance,
    }),
    body,
    serializedBody,
    bodyBytes: Buffer.byteLength(serializedBody, 'utf8'),
    bodySha256: sha256(serializedBody),
  });
}

export async function discoverCharacterImageCatalog({
  fetchImpl = globalThis.fetch,
  apiBaseUrl = CHARACTER_IMAGE_POLICY.apiBaseUrl,
  aspectRatio,
  resolution,
  referenceCount,
}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
  const encodedModel = CHARACTER_IMAGE_POLICY.model.split('/').map(encodeURIComponent).join('/');
  const sourceUrls = Object.freeze({
    model: `${apiBaseUrl}/model/${encodedModel}`,
    image_models: `${apiBaseUrl}/images/models`,
    image_endpoints: `${apiBaseUrl}/images/models/${encodedModel}/endpoints`,
  });
  const entries = await Promise.all(Object.entries(sourceUrls).map(async ([name, url]) => [
    name,
    await fetchJsonOnce(url, { fetchImpl }),
  ]));
  const sources = Object.fromEntries(entries);

  const model = sources.model.body?.data;
  if (model?.id !== CHARACTER_IMAGE_POLICY.model) {
    throw new Error(`Live model catalog did not return ${CHARACTER_IMAGE_POLICY.model}.`);
  }
  if (model.canonical_slug !== CHARACTER_IMAGE_POLICY.canonicalModelSlug) {
    throw new Error(
      `Live canonical slug is ${JSON.stringify(model.canonical_slug)}; expected locked lineage ${CHARACTER_IMAGE_POLICY.canonicalModelSlug}.`,
    );
  }
  assertModalities(model.architecture, 'general model catalog');

  const imageModels = sources.image_models.body?.data;
  if (!Array.isArray(imageModels)) throw new Error('Live image-model catalog has no data array.');
  const imageModel = imageModels.find(({ id }) => id === CHARACTER_IMAGE_POLICY.model);
  if (!imageModel) throw new Error(`Live image-model catalog has no ${CHARACTER_IMAGE_POLICY.model} record.`);
  assertModalities(imageModel.architecture, 'image-model catalog');
  if (imageModel.supports_streaming !== false) {
    throw new Error('Locked image model unexpectedly advertises streaming; lineage review is required.');
  }
  const expectedEndpointsPath = `/api/v1/images/models/${CHARACTER_IMAGE_POLICY.model}/endpoints`;
  if (imageModel.endpoints !== expectedEndpointsPath) {
    throw new Error(`Live image-model endpoint path changed from ${expectedEndpointsPath}.`);
  }
  assertGenerationControls(imageModel.supported_parameters, {
    aspectRatio,
    resolution,
    referenceCount,
    source: 'image-model catalog',
  });

  const endpointBody = sources.image_endpoints.body;
  if (endpointBody?.id !== CHARACTER_IMAGE_POLICY.model || !Array.isArray(endpointBody.endpoints)) {
    throw new Error('Live image endpoint response does not describe the locked model.');
  }
  const providerEndpoint = endpointBody.endpoints.find((endpoint) => (
    endpoint.provider_slug === CHARACTER_IMAGE_POLICY.provider
    && endpoint.provider_tag === CHARACTER_IMAGE_POLICY.provider
  ));
  if (!providerEndpoint) {
    throw new Error(`Live image endpoints do not include locked provider ${CHARACTER_IMAGE_POLICY.provider}.`);
  }
  assertGenerationControls(providerEndpoint.supported_parameters, {
    aspectRatio,
    resolution,
    referenceCount,
    source: `provider ${CHARACTER_IMAGE_POLICY.provider}`,
  });
  if (!Array.isArray(providerEndpoint.pricing) || providerEndpoint.pricing.length === 0) {
    throw new Error(`Provider ${CHARACTER_IMAGE_POLICY.provider} returned no image pricing record.`);
  }
  if (providerEndpoint.supports_streaming !== false) {
    throw new Error(`Provider ${CHARACTER_IMAGE_POLICY.provider} unexpectedly advertises streaming.`);
  }

  const snapshot = {
    model,
    image_model: imageModel,
    provider_endpoint: providerEndpoint,
  };
  const serializedSnapshot = JSON.stringify(snapshot);
  return Object.freeze({
    sha256: sha256(serializedSnapshot),
    bytes: Buffer.byteLength(serializedSnapshot, 'utf8'),
    snapshot,
    sources: Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, {
      url: source.url,
      status: source.status,
      body_bytes: source.bodyBytes,
      body_sha256: source.bodySha256,
      response_headers: source.headers,
    }])),
  });
}

export async function runCharacterImageGeneration({
  requestPath,
  dryRun = false,
  repoRoot = ROOT,
  fetchImpl = globalThis.fetch,
  env = process.env,
  apiBaseUrl = CHARACTER_IMAGE_POLICY.apiBaseUrl,
  now = () => new Date(),
  monotonicNow = () => performance.now(),
  getRepositoryState = readRepositoryState,
  installOutputs = installOutputPair,
} = {}) {
  const prepared = await prepareCharacterImageRequest({ requestPath, repoRoot });
  await assertOutputDestinationsAvailable(prepared.output);
  const repository = await getRepositoryState(prepared.repoRoot);
  const catalogCheckedAt = isoTimestamp(now(), 'catalog checked time');
  const catalog = await discoverCharacterImageCatalog({
    fetchImpl,
    apiBaseUrl,
    aspectRatio: prepared.body.aspect_ratio,
    resolution: prepared.body.resolution,
    referenceCount: prepared.references.length,
  });

  const safeSummary = {
    dry_run: Boolean(dryRun),
    model: CHARACTER_IMAGE_POLICY.model,
    canonical_model_slug: CHARACTER_IMAGE_POLICY.canonicalModelSlug,
    provider: CHARACTER_IMAGE_POLICY.provider,
    request_spec: prepared.requestSpecRecord.path,
    request_body_sha256: prepared.bodySha256,
    prompt_sha256: prepared.promptRecord.text_sha256,
    references: prepared.references.map(({ index, role, path, sha256: hash, dimensions }) => ({
      index, role, path, sha256: hash, dimensions,
    })),
    output_image: prepared.output.image.relative,
    output_provenance: prepared.output.provenance.relative,
    catalog_sha256: catalog.sha256,
  };
  if (dryRun) return Object.freeze({ ...safeSummary, catalog });

  const apiKey = env?.OPENROUTER_API_KEY;
  if (typeof apiKey !== 'string' || !apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set. No generation request was made.');
  }
  await assertOutputDestinationsAvailable(prepared.output);
  const startedAt = isoTimestamp(now(), 'generation start time');
  const startedMonotonic = monotonicNow();
  const generationUrl = `${apiBaseUrl}/images`;
  const response = await fetchImpl(generationUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...SAFE_APP_HEADERS,
    },
    body: prepared.serializedBody,
  });
  const responseText = await response.text();
  const responseBodyBytes = Buffer.byteLength(responseText, 'utf8');
  const responseBodySha256 = sha256(responseText);
  if (!response.ok) {
    throw new Error(
      `OpenRouter image generation returned HTTP ${response.status}: ${safeErrorBody(responseText, apiKey)}`,
    );
  }
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.toLowerCase().startsWith('application/json')) {
    throw new Error(`OpenRouter image generation returned unexpected Content-Type ${JSON.stringify(contentType)}.`);
  }
  let responseBody;
  try {
    responseBody = JSON.parse(responseText);
  } catch (error) {
    throw new Error(`OpenRouter image generation returned invalid JSON: ${error.message}`);
  }
  const validated = validateGenerationResponse(responseBody);
  const completedAt = isoTimestamp(now(), 'generation completion time');
  const durationMs = Math.max(0, Math.round(monotonicNow() - startedMonotonic));
  const responseHeaders = safeHeaders(response.headers, apiKey);
  const sanitizedResponseBody = sanitizeResponseBody(responseBody, apiKey);
  const safeUsage = sanitizeResponseBody(responseBody.usage, apiKey);
  const requestId = firstPresent(
    responseHeaders['x-request-id'],
    responseHeaders['x-openrouter-request-id'],
    responseBody.request_id,
  );
  const generationId = firstPresent(
    responseHeaders['x-openrouter-generation-id'],
    responseHeaders['x-generation-id'],
    responseBody.generation_id,
    responseBody.id,
  );

  const provenance = {
    schema_version: 1,
    kind: 'openrouter-character-image-generation',
    policy: {
      model: CHARACTER_IMAGE_POLICY.model,
      canonical_model_slug: CHARACTER_IMAGE_POLICY.canonicalModelSlug,
      provider: CHARACTER_IMAGE_POLICY.provider,
      allow_fallbacks: false,
      automatic_retries: 0,
    },
    timestamps: {
      catalog_checked_at: catalogCheckedAt,
      generation_started_at: startedAt,
      generation_completed_at: completedAt,
      duration_ms: durationMs,
      response_created_unix: responseBody.created,
    },
    repository,
    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    request_spec: prepared.requestSpecRecord,
    prompt: prepared.promptRecord,
    references: prepared.references,
    catalog,
    request: {
      endpoint: generationUrl,
      method: 'POST',
      body_bytes: prepared.bodyBytes,
      body_sha256: prepared.bodySha256,
      controls: {
        model: CHARACTER_IMAGE_POLICY.model,
        aspect_ratio: prepared.body.aspect_ratio,
        resolution: prepared.body.resolution,
        n: CHARACTER_IMAGE_POLICY.imageCount,
        output_format: CHARACTER_IMAGE_POLICY.outputFormat,
        reference_count: prepared.references.length,
        provider: prepared.body.provider,
      },
    },
    response: {
      status: response.status,
      status_text: response.statusText,
      headers: responseHeaders,
      body_bytes: responseBodyBytes,
      body_sha256: responseBodySha256,
      request_id: requestId,
      generation_id: generationId,
      body_without_image_bytes: sanitizedResponseBody,
    },
    usage: safeUsage,
    output: {
      path: prepared.output.image.relative,
      media_type: 'image/png',
      reported_media_type: validated.reportedMediaType,
      bytes: validated.imageBytes.length,
      sha256: sha256(validated.imageBytes),
      dimensions: { width: validated.png.width, height: validated.png.height },
      png: pngMetadata(validated.png),
    },
  };
  const provenanceText = `${JSON.stringify(provenance, null, 2)}\n`;
  if (provenanceText.includes(apiKey)) {
    throw new Error('Refusing to persist provenance because it contains the API key.');
  }
  await assertOutputDestinationsAvailable(prepared.output);
  await installOutputs({
    imagePath: prepared.output.image.absolute,
    imageBytes: validated.imageBytes,
    provenancePath: prepared.output.provenance.absolute,
    provenanceBytes: Buffer.from(provenanceText),
  });
  return Object.freeze({
    ...safeSummary,
    dry_run: false,
    image: provenance.output,
    provenance_path: prepared.output.provenance.relative,
    usage: provenance.usage,
  });
}

export function validateGenerationResponse(body) {
  assertPlainObject(body, 'OpenRouter response');
  if (!Number.isInteger(body.created) || body.created < 0) {
    throw new Error('OpenRouter response.created must be a non-negative Unix timestamp.');
  }
  if (!Array.isArray(body.data) || body.data.length !== CHARACTER_IMAGE_POLICY.imageCount) {
    throw new Error(`OpenRouter response must contain exactly ${CHARACTER_IMAGE_POLICY.imageCount} image.`);
  }
  const image = body.data[0];
  assertPlainObject(image, 'OpenRouter response.data[0]');
  const reportedMediaType = image.media_type ?? null;
  if (reportedMediaType !== null && reportedMediaType !== 'image/png') {
    throw new Error(`OpenRouter returned ${JSON.stringify(reportedMediaType)} instead of image/png.`);
  }
  const imageBytes = decodeBase64Strict(image.b64_json, 'OpenRouter response.data[0].b64_json');
  const png = inspectPng(imageBytes, 'OpenRouter output');
  assertPlainObject(body.usage, 'OpenRouter response.usage');
  if (typeof body.usage.cost !== 'number' || !Number.isFinite(body.usage.cost) || body.usage.cost < 0) {
    throw new Error('OpenRouter response.usage.cost must be a non-negative number.');
  }
  return Object.freeze({ imageBytes, png, reportedMediaType });
}

export async function installOutputPair({ imagePath, imageBytes, provenancePath, provenanceBytes }) {
  const imageTemporary = temporaryPath(imagePath);
  const provenanceTemporary = temporaryPath(provenancePath);
  let provenanceInstalled = false;
  try {
    await Promise.all([
      writeDurableTemporary(imageTemporary, imageBytes),
      writeDurableTemporary(provenanceTemporary, provenanceBytes),
    ]);
    await link(provenanceTemporary, provenancePath);
    provenanceInstalled = true;
    try {
      await link(imageTemporary, imagePath);
    } catch (error) {
      await unlink(provenancePath).catch(() => {});
      provenanceInstalled = false;
      throw error;
    }
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error('Refusing to overwrite an existing image or provenance record.');
    throw error;
  } finally {
    await Promise.all([
      unlink(imageTemporary).catch(() => {}),
      unlink(provenanceTemporary).catch(() => {}),
    ]);
    if (provenanceInstalled) await access(provenancePath, fsConstants.R_OK);
  }
}

export async function readRepositoryState(repoRoot) {
  const [{ stdout: commitOutput }, { stdout: statusOutput }] = await Promise.all([
    execFile('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }),
    execFile('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: repoRoot, encoding: 'utf8' }),
  ]);
  const commit = commitOutput.trim();
  if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error('Could not determine the repository commit.');
  return Object.freeze({ commit, dirty: Boolean(statusOutput.trim()) });
}

async function assertOutputDestinationsAvailable(output) {
  await Promise.all([
    assertFileMissing(output.image.absolute, output.image.relative),
    assertFileMissing(output.provenance.absolute, output.provenance.relative),
    assertWritableDirectory(dirname(output.image.absolute), `parent directory for ${output.image.relative}`),
    assertWritableDirectory(dirname(output.provenance.absolute), `parent directory for ${output.provenance.relative}`),
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

async function fetchJsonOnce(url, { fetchImpl }) {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter catalog request ${url} returned HTTP ${response.status}: ${safeErrorBody(text)}`);
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new Error(`OpenRouter catalog request ${url} returned invalid JSON: ${error.message}`);
  }
  return Object.freeze({
    url,
    status: response.status,
    headers: safeHeaders(response.headers),
    body,
    bodyBytes: Buffer.byteLength(text, 'utf8'),
    bodySha256: sha256(text),
  });
}

function assertGenerationControls(parameters, { aspectRatio, resolution, referenceCount, source }) {
  assertPlainObject(parameters, `${source} supported_parameters`);
  assertEnumControl(parameters.resolution, resolution, `${source} resolution`);
  assertEnumControl(parameters.aspect_ratio, aspectRatio, `${source} aspect_ratio`);
  assertRangeControl(parameters.n, CHARACTER_IMAGE_POLICY.imageCount, `${source} n`);
  assertRangeControl(parameters.input_references, referenceCount, `${source} input_references`);
}

function assertEnumControl(control, value, label) {
  if (control?.type !== 'enum' || !Array.isArray(control.values) || !control.values.includes(value)) {
    throw new Error(`${label} does not support ${JSON.stringify(value)}.`);
  }
}

function assertRangeControl(control, value, label) {
  if (control?.type !== 'range'
    || !Number.isFinite(control.min)
    || !Number.isFinite(control.max)
    || value < control.min
    || value > control.max) {
    throw new Error(`${label} does not support ${value}.`);
  }
}

function assertModalities(architecture, source) {
  const inputs = architecture?.input_modalities;
  const outputs = architecture?.output_modalities;
  if (!Array.isArray(inputs) || !inputs.includes('text') || !inputs.includes('image')) {
    throw new Error(`${source} no longer advertises both text and image input.`);
  }
  if (!Array.isArray(outputs) || !outputs.includes('image')) {
    throw new Error(`${source} no longer advertises image output.`);
  }
}

function inspectPng(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${label} is not a PNG (signature mismatch).`);
  }
  try {
    const png = PNG.sync.read(bytes);
    if (!Number.isInteger(png.width) || png.width <= 0 || !Number.isInteger(png.height) || png.height <= 0) {
      throw new Error('invalid dimensions');
    }
    return png;
  } catch (error) {
    throw new Error(`${label} is not a valid PNG: ${error.message}`);
  }
}

function pngMetadata(png) {
  return {
    bit_depth: png.depth,
    color_type: png.colorType,
    has_color: png.color,
    has_alpha: png.alpha,
    interlaced: png.interlace,
  };
}

function decodeBase64Strict(value, label) {
  if (typeof value !== 'string' || !value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`${label} is not canonical base64.`);
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) throw new Error(`${label} is not canonical base64.`);
  return bytes;
}

function sanitizeResponseBody(value, secret) {
  if (Array.isArray(value)) return value.map((entry) => sanitizeResponseBody(entry, secret));
  if (isPlainObject(value)) {
    const sanitized = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'b64_json') {
        const bytes = decodeBase64Strict(entry, 'OpenRouter response b64_json');
        sanitized.image_bytes = { bytes: bytes.length, sha256: sha256(bytes) };
      } else {
        sanitized[key] = sanitizeResponseBody(entry, secret);
      }
    }
    return sanitized;
  }
  if (typeof value === 'string' && secret && value.includes(secret)) {
    return value.split(secret).join('[REDACTED]');
  }
  return value;
}

function safeHeaders(headers, secret) {
  const safe = {};
  for (const [rawName, rawValue] of headers.entries()) {
    const name = rawName.toLowerCase();
    if (SENSITIVE_HEADER_NAME.test(name)) continue;
    if (secret && rawValue.includes(secret)) continue;
    safe[name] = rawValue;
  }
  return safe;
}

function safeErrorBody(body, secret) {
  let safe = String(body ?? '');
  if (secret) safe = safe.split(secret).join('[REDACTED]');
  return safe.slice(0, 4000);
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
  if (!isPlainObject(value)) throw new TypeError(`${label} must be an object.`);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

function isoTimestamp(value, label) {
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) throw new TypeError(`${label} must be a valid Date.`);
  return value.toISOString();
}

function firstPresent(...values) {
  return values.find((value) => typeof value === 'string' && value) ?? null;
}

function temporaryPath(finalPath) {
  return resolve(dirname(finalPath), `.${randomUUID()}.character-image.tmp`);
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

async function main() {
  const options = parseCharacterImageArgs(process.argv.slice(2));
  if (options.help) {
    console.log(characterImageHelp());
    return;
  }
  const result = await runCharacterImageGeneration({
    requestPath: options.request,
    dryRun: options.dryRun,
  });
  console.log(JSON.stringify(result, null, 2));
}

const mainUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (mainUrl === import.meta.url) {
  main().catch((error) => {
    const key = process.env.OPENROUTER_API_KEY;
    console.error(safeErrorBody(error?.message ?? error, key));
    process.exitCode = 1;
  });
}
