import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFile = promisify(execFileCallback);
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const apiBaseUrl = 'https://openrouter.ai/api/v1';
const lockedPrefix = "Children's storybook illustration, painterly gouache and watercolor, soft edges and gentle texture, warm candlelit golds against deep night blues, cozy magical atmosphere, richly detailed but uncluttered, straight-on side view like a theater stage set, floor plane along the bottom quarter of the frame, no people, no creatures, no text or lettering.";
const requestFiles = [
  'kings-cross.request.json',
  'platform.request.json',
  'train-compartment.request.json',
  'lake-vista.request.json',
  'great-hall.request.json',
  'great-hall-v2.request.json',
  'great-hall-v3.request.json',
  'gryffindor-common-room.request.json',
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function repositoryPath(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}/`)) {
    throw new Error(`Path escapes the repository: ${relativePath}`);
  }
  return absolutePath;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function extractPrompt(markdown, heading = 'Prompt') {
  const expression = new RegExp(`^## ${heading}\\s*$`, 'm');
  const match = expression.exec(markdown);
  if (!match) throw new Error(`Prompt document is missing the heading ## ${heading}.`);
  const remainder = markdown.slice(match.index + match[0].length);
  const nextHeading = remainder.search(/^## /m);
  return remainder.slice(0, nextHeading === -1 ? undefined : nextHeading).trim();
}

function safeHeaders(headers) {
  const allowed = [
    'cf-ray',
    'content-type',
    'date',
    'server',
    'x-generation-id',
    'x-openrouter-generation-id',
    'x-openrouter-model',
    'x-openrouter-provider',
    'x-openrouter-request-id',
    'x-request-id',
  ];
  return Object.fromEntries(allowed.flatMap((name) => {
    const value = headers.get(name);
    return value ? [[name, value]] : [];
  }));
}

async function fetchJson(path, options = {}) {
  const url = path.startsWith('http') ? path : `${apiBaseUrl}${path}`;
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} returned HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }
  return {
    url,
    status: response.status,
    headers: safeHeaders(response.headers),
    bodyBytes: Buffer.byteLength(text),
    bodySha256: sha256(text),
    body: JSON.parse(text),
    text,
  };
}

function assertEnumControl(record, name, expected) {
  const values = record?.supported_parameters?.[name]?.values;
  if (!Array.isArray(values) || !values.includes(expected)) {
    throw new Error(`Live image catalog does not advertise ${name}=${expected}.`);
  }
}

async function discover(spec) {
  const encodedModel = spec.generation.model.split('/').map(encodeURIComponent).join('/');
  const [modelSource, imageModelsSource, endpointSource] = await Promise.all([
    fetchJson(`/model/${encodedModel}`),
    fetchJson('/images/models'),
    fetchJson(`/images/models/${encodedModel}/endpoints`),
  ]);
  const model = modelSource.body?.data;
  const imageModel = imageModelsSource.body?.data?.find(({ id }) => id === spec.generation.model);
  const providerEndpoint = endpointSource.body?.endpoints?.find(({ provider_slug: slug }) => (
    slug === spec.generation.provider
  ));
  if (model?.canonical_slug !== spec.generation.canonical_model_slug) {
    throw new Error(`Canonical model slug changed to ${model?.canonical_slug ?? 'missing'}.`);
  }
  if (!imageModel) throw new Error(`Live image catalog is missing ${spec.generation.model}.`);
  if (!providerEndpoint) {
    throw new Error(`Live image endpoints are missing ${spec.generation.provider}.`);
  }
  assertEnumControl(imageModel, 'aspect_ratio', spec.generation.aspect_ratio);
  assertEnumControl(imageModel, 'resolution', spec.generation.resolution);
  assertEnumControl(providerEndpoint, 'aspect_ratio', spec.generation.aspect_ratio);
  assertEnumControl(providerEndpoint, 'resolution', spec.generation.resolution);
  return {
    checked_at: new Date().toISOString(),
    snapshot: { model, image_model: imageModel, provider_endpoint: providerEndpoint },
    sources: {
      model: sourceRecord(modelSource),
      image_models: sourceRecord(imageModelsSource),
      image_endpoints: sourceRecord(endpointSource),
    },
  };
}

function sourceRecord(source) {
  return {
    url: source.url,
    status: source.status,
    body_bytes: source.bodyBytes,
    body_sha256: source.bodySha256,
    response_headers: source.headers,
  };
}

function detectImage(bytes, reportedMediaType) {
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    return { mediaType: 'image/png', extension: '.png' };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mediaType: 'image/jpeg', extension: '.jpg' };
  }
  throw new Error(`Unsupported image response (${reportedMediaType ?? 'no media type'}).`);
}

async function dimensions(path) {
  const { stdout } = await execFile('/usr/bin/sips', [
    '-g', 'pixelWidth',
    '-g', 'pixelHeight',
    path,
  ]);
  const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`Could not read dimensions for ${path}.`);
  }
  return { width, height };
}

function centeredCrop({ width, height }, targetWidth, targetHeight) {
  const sourceRatio = width / height;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    return { width: Math.floor(height * targetRatio), height };
  }
  return { width, height: Math.floor(width / targetRatio) };
}

async function fileRecord(path, relativePath, mediaType) {
  const bytes = await readFile(path);
  return {
    path: relativePath,
    media_type: mediaType,
    bytes: bytes.length,
    sha256: sha256(bytes),
    dimensions: await dimensions(path),
  };
}

async function prepareReferences(spec) {
  return Promise.all((spec.references ?? []).map(async ({ path, role }, index) => {
    const absolutePath = repositoryPath(path);
    const bytes = await readFile(absolutePath);
    const detected = detectImage(bytes, null);
    return {
      record: {
        index: index + 1,
        path,
        role,
        media_type: detected.mediaType,
        bytes: bytes.length,
        sha256: sha256(bytes),
        dimensions: await dimensions(absolutePath),
      },
      input: {
        type: 'image_url',
        image_url: {
          url: `data:${detected.mediaType};base64,${bytes.toString('base64')}`,
        },
      },
    };
  }));
}

async function deriveAcceptedAndShipping(spec, nativePath) {
  const acceptedPath = repositoryPath(spec.output.accepted_png);
  const shippingPath = repositoryPath(spec.output.shipping_webp);
  await Promise.all([mkdir(dirname(acceptedPath), { recursive: true }), mkdir(dirname(shippingPath), { recursive: true })]);
  const nativeDimensions = await dimensions(nativePath);
  const crop = spec.conversion.native_crop ?? centeredCrop(
    nativeDimensions,
    spec.conversion.width,
    spec.conversion.height,
  );
  if (crop.width > nativeDimensions.width || crop.height > nativeDimensions.height) {
    throw new Error(`Native crop ${crop.width}x${crop.height} exceeds ${nativeDimensions.width}x${nativeDimensions.height}.`);
  }
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'violet-ch2-room-'));
  const croppedPath = join(temporaryDirectory, 'cropped.png');
  try {
    await execFile('/usr/bin/sips', [
      '-s', 'format', 'png',
      '-c', String(crop.height), String(crop.width),
      nativePath,
      '--out', croppedPath,
    ]);
    await execFile('/usr/bin/sips', [
      '-s', 'format', 'png',
      '-z', String(spec.conversion.height), String(spec.conversion.width),
      croppedPath,
      '--out', acceptedPath,
    ]);
    await execFile('cwebp', [
      '-quiet',
      '-q', String(spec.conversion.webp_quality),
      '-m', String(spec.conversion.webp_method),
      '-sharp_yuv',
      acceptedPath,
      '-o', shippingPath,
    ]);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  const [acceptedDimensions, shippingDimensions] = await Promise.all([
    dimensions(acceptedPath),
    dimensions(shippingPath),
  ]);
  for (const [label, actual] of [['accepted PNG', acceptedDimensions], ['shipping WebP', shippingDimensions]]) {
    if (actual.width !== spec.conversion.width || actual.height !== spec.conversion.height) {
      throw new Error(`${label} is ${actual.width}x${actual.height}, expected ${spec.conversion.width}x${spec.conversion.height}.`);
    }
  }
  return { crop };
}

async function requestSpec(path) {
  const bytes = await readFile(path);
  const spec = JSON.parse(bytes.toString('utf8'));
  return { spec, bytes };
}

async function outputState(spec) {
  const nativeCandidates = ['.png', '.jpg'].map((extension) => (
    repositoryPath(`${spec.output.raw_native_base}${extension}`)
  ));
  const paths = [
    ...nativeCandidates,
    repositoryPath(spec.output.accepted_png),
    repositoryPath(spec.output.shipping_webp),
    repositoryPath(spec.output.metadata),
  ];
  const present = await Promise.all(paths.map(exists));
  const nativeCount = present.slice(0, 2).filter(Boolean).length;
  const complete = nativeCount === 1 && present.slice(2).every(Boolean);
  const partial = present.some(Boolean) && !complete;
  return { complete, partial };
}

async function generate(requestFile) {
  const requestPath = resolve(here, requestFile);
  const { spec, bytes: specBytes } = await requestSpec(requestPath);
  const state = await outputState(spec);
  if (state.complete) {
    process.stdout.write(`skip ${spec.slug}: complete\n`);
    return;
  }
  if (state.partial) throw new Error(`Refusing to overwrite partial outputs for ${spec.slug}.`);

  const promptPath = repositoryPath(spec.prompt.path);
  const promptDocument = await readFile(promptPath);
  const prompt = extractPrompt(promptDocument.toString('utf8'), spec.prompt.section);
  if (!prompt.startsWith(lockedPrefix)) {
    throw new Error(`${spec.prompt.path} does not start with the locked room prefix.`);
  }
  const references = await prepareReferences(spec);
  const catalog = await discover(spec);
  const body = {
    model: spec.generation.model,
    prompt,
    aspect_ratio: spec.generation.aspect_ratio,
    resolution: spec.generation.resolution,
    n: spec.generation.n,
    output_format: spec.generation.output_format,
    provider: {
      only: [spec.generation.provider],
      allow_fallbacks: false,
      automatic_retries: 0,
    },
  };
  if (references.length > 0) body.input_references = references.map(({ input }) => input);
  const serializedBody = JSON.stringify(body);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set.');

  process.stdout.write(`generate ${spec.slug}\n`);
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const response = await fetch(spec.generation.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/peteallen/violets-wizard-game',
      'X-OpenRouter-Title': "Violet's Wizard Game Chapter 2 room pipeline",
    },
    body: serializedBody,
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`POST /images returned HTTP ${response.status}: ${responseText.slice(0, 1200)}`);
  }
  const responseBody = JSON.parse(responseText);
  if (!Array.isArray(responseBody.data) || responseBody.data.length !== 1) {
    throw new Error('OpenRouter did not return exactly one image.');
  }
  const image = responseBody.data[0];
  if (typeof image.b64_json !== 'string' || !image.b64_json) {
    throw new Error('OpenRouter image response is missing b64_json.');
  }
  const imageBytes = Buffer.from(image.b64_json, 'base64');
  const detected = detectImage(imageBytes, image.media_type);
  const rawNativeRelative = `${spec.output.raw_native_base}${detected.extension}`;
  const rawNativePath = repositoryPath(rawNativeRelative);
  await mkdir(dirname(rawNativePath), { recursive: true });
  await writeFile(rawNativePath, imageBytes, { flag: 'wx' });
  const { crop } = await deriveAcceptedAndShipping(spec, rawNativePath);

  const [native, accepted, shipping] = await Promise.all([
    fileRecord(rawNativePath, rawNativeRelative, detected.mediaType),
    fileRecord(repositoryPath(spec.output.accepted_png), spec.output.accepted_png, 'image/png'),
    fileRecord(repositoryPath(spec.output.shipping_webp), spec.output.shipping_webp, 'image/webp'),
  ]);
  const headers = safeHeaders(response.headers);
  const generationId = headers['x-generation-id']
    ?? headers['x-openrouter-generation-id']
    ?? responseBody.generation_id
    ?? responseBody.id
    ?? null;
  const requestId = headers['x-request-id']
    ?? headers['x-openrouter-request-id']
    ?? responseBody.request_id
    ?? null;
  const metadata = {
    schema_version: 1,
    kind: 'openrouter-room-image-generation',
    slug: spec.slug,
    model: spec.generation.model,
    canonical_model_slug: spec.generation.canonical_model_slug,
    provider: spec.generation.provider,
    endpoint: spec.generation.endpoint,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    seconds: Math.round((performance.now() - started) / 10) / 100,
    seed: null,
    seed_note: 'The dedicated OpenRouter image endpoint did not advertise a seed control during live discovery, so no seed was sent or returned.',
    request_spec: {
      path: `art/chapters/ch2/rooms/${requestFile}`,
      bytes: specBytes.length,
      sha256: sha256(specBytes),
    },
    prompt: {
      path: spec.prompt.path,
      section: spec.prompt.section,
      document_bytes: promptDocument.length,
      document_sha256: sha256(promptDocument),
      text_bytes: Buffer.byteLength(prompt),
      text_sha256: sha256(prompt),
      locked_prefix_sha256: sha256(lockedPrefix),
    },
    references: references.map(({ record }) => record),
    catalog,
    request: {
      endpoint: spec.generation.endpoint,
      method: 'POST',
      body_bytes: Buffer.byteLength(serializedBody),
      body_sha256: sha256(serializedBody),
      controls: {
        model: body.model,
        aspect_ratio: body.aspect_ratio,
        resolution: body.resolution,
        n: body.n,
        output_format: body.output_format,
        reference_count: references.length,
        provider: body.provider,
      },
    },
    response: {
      status: response.status,
      headers,
      body_bytes: Buffer.byteLength(responseText),
      body_sha256: sha256(responseText),
      request_id: requestId,
      generation_id: generationId,
      image: {
        reported_media_type: image.media_type ?? null,
        detected_media_type: detected.mediaType,
        bytes: imageBytes.length,
        sha256: sha256(imageBytes),
      },
      usage: responseBody.usage ?? null,
    },
    conversion: {
      native_center_crop: crop,
      accepted_dimensions: { width: spec.conversion.width, height: spec.conversion.height },
      accepted_tool: '/usr/bin/sips',
      shipping_tool: 'cwebp',
      shipping_quality: spec.conversion.webp_quality,
      shipping_method: spec.conversion.webp_method,
      shipping_sharp_yuv: true,
    },
    output: { native, accepted, shipping },
  };
  await writeFile(
    repositoryPath(spec.output.metadata),
    `${JSON.stringify(metadata, null, 2)}\n`,
    { flag: 'wx' },
  );
  process.stdout.write(`complete ${spec.slug}: ${native.dimensions.width}x${native.dimensions.height} native -> ${shipping.dimensions.width}x${shipping.dimensions.height} WebP\n`);
}

for (const requestFile of requestFiles) {
  await generate(requestFile);
}
