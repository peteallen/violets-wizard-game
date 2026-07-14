import { createHash } from 'node:crypto';
import {
  link as fsLink,
  mkdir,
  mkdtemp,
  open as fsOpen,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PNG } from 'pngjs';
import {
  CHARACTER_IMAGE_POLICY,
  characterImageTransactionPath,
  extractMarkdownSection,
  installOutputPair,
  parseCharacterImageArgs,
  prepareCharacterImageRequest,
  recoverCharacterImageInstall,
  runCharacterImageGeneration,
  validateCharacterImageSpec,
} from '../scripts/generate-character-image.mjs';

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('character image request contract', () => {
  it('extracts only the named Markdown section and requires it exactly once', () => {
    const document = '# Candidate\n\nHeader material.\n\n## Prompt\n\nExact prompt.\n\n### Detail\n\nKeep this.\n\n## Review\n\nNot prompt.';
    expect(extractMarkdownSection(document, 'Prompt')).toBe('Exact prompt.\n\n### Detail\n\nKeep this.');
    expect(() => extractMarkdownSection('# Prompt\nA\n# Prompt\nB', 'Prompt')).toThrow('exactly one');
    expect(() => extractMarkdownSection('## Prompt\n\n', 'Prompt')).toThrow('is empty');
  });

  it('parses only the explicit request and dry-run CLI controls', () => {
    expect(parseCharacterImageArgs(['--request', 'art/violet.json', '--dry-run'])).toEqual({
      request: 'art/violet.json',
      dryRun: true,
      help: false,
    });
    expect(parseCharacterImageArgs(['--request=art/violet.json'])).toMatchObject({
      request: 'art/violet.json', dryRun: false,
    });
    expect(() => parseCharacterImageArgs(['--model', 'something-else'])).toThrow('Unknown argument');
    expect(() => parseCharacterImageArgs([])).toThrow('--request is required');
  });

  it('rejects model or provider overrides in the request spec', () => {
    const spec = requestSpec();
    spec.model = 'another/model';
    expect(() => validateCharacterImageSpec(spec)).toThrow('keys must be exactly');
    delete spec.model;
    spec.generation.provider = 'another-provider';
    expect(() => validateCharacterImageSpec(spec)).toThrow('keys must be exactly');
  });

  it('builds the exact locked request from the prompt section and ordered PNG references', async () => {
    const fixture = await createFixture();
    const prepared = await prepareCharacterImageRequest({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
    });

    expect(prepared.body).toMatchObject({
      model: 'google/gemini-3.1-flash-image',
      prompt: 'First prompt line.\n\nSecond prompt line.',
      aspect_ratio: '3:4',
      resolution: '1K',
      n: 1,
      output_format: 'png',
      provider: { only: ['google-vertex/global'], allow_fallbacks: false },
    });
    expect(prepared.body).not.toHaveProperty('seed');
    expect(prepared.body).not.toHaveProperty('background');
    expect(prepared.references.map(({ role, path, dimensions }) => ({ role, path, dimensions }))).toEqual([
      { role: 'identity lock', path: 'art/reference-a.png', dimensions: { width: 3, height: 2 } },
      { role: 'room style', path: 'art/reference-b.png', dimensions: { width: 2, height: 3 } },
    ]);
    expect(prepared.body.input_references).toHaveLength(2);
    expect(prepared.body.input_references[0].image_url.url).toMatch(/^data:image\/png;base64,/);
    expect(prepared.promptRecord.text_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(prepared.requestSpecRecord.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(prepared.bodySha256).toBe(hash(prepared.serializedBody));
  });

  it('rejects symbolic-link escapes for the request, prompt, and every reference input', async () => {
    for (const target of ['request', 'prompt', 'reference']) {
      const fixture = await createFixture();
      const outside = await mkdtemp(join(tmpdir(), `violet-character-image-outside-${target}-`));
      temporaryRoots.push(outside);
      const insidePath = {
        request: join(fixture.root, 'art/request.json'),
        prompt: join(fixture.root, 'art/prompt.md'),
        reference: join(fixture.root, 'art/reference-a.png'),
      }[target];
      const outsidePath = join(outside, `outside-${target}`);
      await writeFile(outsidePath, target === 'reference' ? pngBuffer(1, 1) : 'outside');
      await rm(insidePath);
      await symlink(outsidePath, insidePath);

      await expect(prepareCharacterImageRequest({
        requestPath: fixture.requestPath,
        repoRoot: fixture.root,
      })).rejects.toThrow('may not traverse symbolic link');
    }
  });

  it('rejects an output parent that is a symbolic link outside the repository', async () => {
    const fixture = await createFixture();
    const outside = await mkdtemp(join(tmpdir(), 'violet-character-image-output-escape-'));
    temporaryRoots.push(outside);
    await symlink(outside, join(fixture.root, 'art/escaped-output'));
    const spec = requestSpec();
    spec.output = {
      image: 'art/escaped-output/output.png',
      provenance: 'art/escaped-output/output.metadata.json',
    };
    await writeFile(join(fixture.root, 'art/request.json'), `${JSON.stringify(spec, null, 2)}\n`);

    await expect(prepareCharacterImageRequest({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
    })).rejects.toThrow('may not traverse symbolic link');
  });
});

describe('character image generation', () => {
  it('performs a live-catalog dry run without a key, POST, or file write', async () => {
    const fixture = await createFixture();
    const network = mockOpenRouter();
    const result = await runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      dryRun: true,
      fetchImpl: network.fetch,
      env: {},
      now: () => new Date('2026-07-14T18:00:00.000Z'),
      getRepositoryState: async () => ({ commit: 'a'.repeat(40), dirty: true }),
    });

    expect(result).toMatchObject({
      dry_run: true,
      model: CHARACTER_IMAGE_POLICY.model,
      canonical_model_slug: CHARACTER_IMAGE_POLICY.canonicalModelSlug,
      provider: CHARACTER_IMAGE_POLICY.provider,
      output_image: 'art/output.png',
      output_provenance: 'art/output.metadata.json',
    });
    expect(result.catalog.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(network.calls).toHaveLength(3);
    expect(network.calls.every(({ init }) => (init.method ?? 'GET') !== 'POST')).toBe(true);
    expect(network.calls.every(({ init }) => !new Headers(init.headers).has('authorization'))).toBe(true);
    await expect(readFile(join(fixture.root, 'art/output.png'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('makes one generation request and atomically saves validated PNG plus safe provenance', async () => {
    const fixture = await createFixture();
    const generatedPng = pngBuffer(4, 5, [83, 41, 129, 255]);
    const apiKey = 'sk-or-v1-unit-test-secret-that-must-never-be-recorded';
    const usage = {
      prompt_tokens: 1234,
      completion_tokens: 1120,
      total_tokens: 2354,
      cost: 0.067817,
      is_byok: false,
      cost_details: {
        upstream_inference_cost: 0.067817,
        upstream_inference_prompt_cost: 0.000617,
        upstream_inference_completions_cost: 0.0672,
      },
      completion_tokens_details: { image_tokens: 1120 },
    };
    const responseBody = {
      created: 1784055000,
      data: [{ b64_json: generatedPng.toString('base64'), media_type: 'image/png' }],
      usage,
      provider_metadata: { echoed_secret: `hidden ${apiKey}` },
    };
    const network = mockOpenRouter({
      generationBody: responseBody,
      generationHeaders: {
        'content-type': 'application/json',
        'x-request-id': 'req-test-1',
        'x-openrouter-generation-id': 'gen-test-1',
        'set-cookie': `credential=${apiKey}`,
        'x-secret-token': apiKey,
      },
    });
    const dates = [
      new Date('2026-07-14T18:00:00.000Z'),
      new Date('2026-07-14T18:00:01.000Z'),
      new Date('2026-07-14T18:00:01.250Z'),
    ];
    const monotonic = [1000, 1250];

    const result = await runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      fetchImpl: network.fetch,
      env: { OPENROUTER_API_KEY: apiKey },
      now: () => dates.shift(),
      monotonicNow: () => monotonic.shift(),
      getRepositoryState: async () => ({ commit: 'b'.repeat(40), dirty: true }),
    });

    expect(result).toMatchObject({
      dry_run: false,
      image: {
        path: 'art/output.png',
        media_type: 'image/png',
        bytes: generatedPng.length,
        dimensions: { width: 4, height: 5 },
      },
      provenance_path: 'art/output.metadata.json',
      usage,
    });
    expect(await readFile(join(fixture.root, 'art/output.png'))).toEqual(generatedPng);

    const provenanceText = await readFile(join(fixture.root, 'art/output.metadata.json'), 'utf8');
    const provenance = JSON.parse(provenanceText);
    expect(provenanceText).not.toContain(apiKey);
    expect(provenanceText).not.toContain('b64_json');
    expect(provenance).toMatchObject({
      schema_version: 1,
      policy: {
        model: CHARACTER_IMAGE_POLICY.model,
        canonical_model_slug: CHARACTER_IMAGE_POLICY.canonicalModelSlug,
        provider: CHARACTER_IMAGE_POLICY.provider,
        allow_fallbacks: false,
        automatic_retries: 0,
      },
      timestamps: {
        catalog_checked_at: '2026-07-14T18:00:00.000Z',
        generation_started_at: '2026-07-14T18:00:01.000Z',
        generation_completed_at: '2026-07-14T18:00:01.250Z',
        duration_ms: 250,
        response_created_unix: 1784055000,
      },
      repository: { commit: 'b'.repeat(40), dirty: true },
      request_spec: { path: 'art/request.json', schema_version: 1 },
      prompt: {
        path: 'art/prompt.md',
        section: 'Prompt',
      },
      response: {
        status: 200,
        request_id: 'req-test-1',
        generation_id: 'gen-test-1',
      },
      usage,
      output: {
        path: 'art/output.png',
        media_type: 'image/png',
        reported_media_type: 'image/png',
        bytes: generatedPng.length,
        sha256: hash(generatedPng),
        dimensions: { width: 4, height: 5 },
      },
    });
    expect(provenance.references.map(({ index, role, path, dimensions }) => ({
      index, role, path, dimensions,
    }))).toEqual([
      { index: 1, role: 'identity lock', path: 'art/reference-a.png', dimensions: { width: 3, height: 2 } },
      { index: 2, role: 'room style', path: 'art/reference-b.png', dimensions: { width: 2, height: 3 } },
    ]);
    expect(provenance.catalog.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(provenance.catalog.snapshot.provider_endpoint.provider_slug).toBe('google-vertex/global');
    expect(provenance.request.body_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(provenance.response.body_sha256).toBe(hash(JSON.stringify(responseBody)));
    expect(provenance.response.headers).toMatchObject({
      'content-type': 'application/json',
      'x-request-id': 'req-test-1',
      'x-openrouter-generation-id': 'gen-test-1',
    });
    expect(provenance.response.headers).not.toHaveProperty('set-cookie');
    expect(provenance.response.headers).not.toHaveProperty('x-secret-token');
    expect(provenance.response.metadata.image).toEqual({
      reported_media_type: 'image/png',
      bytes: generatedPng.length,
      sha256: hash(generatedPng),
    });
    expect(provenance.response).not.toHaveProperty('body_without_image_bytes');
    expect(provenance.response.metadata).not.toHaveProperty('provider_metadata');

    const postCalls = network.calls.filter(({ init }) => init.method === 'POST');
    expect(postCalls).toHaveLength(1);
    expect(postCalls[0].url).toBe('https://openrouter.ai/api/v1/images');
    expect(new Headers(postCalls[0].init.headers).get('authorization')).toBe(`Bearer ${apiKey}`);
    const transmitted = JSON.parse(postCalls[0].init.body);
    expect(transmitted.model).toBe(CHARACTER_IMAGE_POLICY.model);
    expect(transmitted.provider).toEqual({ only: ['google-vertex/global'], allow_fallbacks: false });
    expect(transmitted.input_references).toHaveLength(2);
    expect(provenance.request.body_sha256).toBe(hash(postCalls[0].init.body));
  });

  it('allowlists response metadata and omits unknown image data, signed URLs, and secret fields', async () => {
    const fixture = await createFixture();
    const generatedPng = pngBuffer(2, 2);
    const hostileSecret = 'secondary-provider-secret-that-is-not-the-api-key';
    const signedUrl = `https://provider.example/download?signature=${hostileSecret}`;
    const unknownDataUrl = `data:image/png;base64,${Buffer.from(hostileSecret).toString('base64')}`;
    const responseBody = {
      created: 1784055000,
      data: [{
        b64_json: generatedPng.toString('base64'),
        media_type: 'image/png',
        signed_url: signedUrl,
        alternate_image: unknownDataUrl,
        secret_field: hostileSecret,
      }],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 1120,
        total_tokens: 1132,
        cost: 0.0672,
        unknown_secret: hostileSecret,
        receipt_url: signedUrl,
        cost_details: {
          upstream_inference_cost: 0.0672,
          signed_receipt: signedUrl,
        },
      },
      signed_download_url: signedUrl,
      unknown_data_url: unknownDataUrl,
      secret_field: hostileSecret,
    };
    const network = mockOpenRouter({
      generationBody: responseBody,
      generationHeaders: {
        'content-type': 'application/json',
        'x-request-id': 'req-safe-1',
        'x-signed-download-url': signedUrl,
        'x-provider-secret': hostileSecret,
      },
    });

    await runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      fetchImpl: network.fetch,
      env: { OPENROUTER_API_KEY: 'sk-or-v1-safe-test-key' },
      now: () => new Date('2026-07-14T18:00:00.000Z'),
      monotonicNow: () => 100,
      getRepositoryState: async () => ({ commit: 'e'.repeat(40), dirty: false }),
    });

    const provenanceText = await readFile(join(fixture.root, 'art/output.metadata.json'), 'utf8');
    const provenance = JSON.parse(provenanceText);
    expect(provenanceText).not.toContain(hostileSecret);
    expect(provenanceText).not.toContain(signedUrl);
    expect(provenanceText).not.toContain(unknownDataUrl);
    expect(provenanceText).not.toContain('signed_download_url');
    expect(provenanceText).not.toContain('unknown_data_url');
    expect(provenanceText).not.toContain('secret_field');
    expect(provenanceText).not.toContain('receipt_url');
    expect(provenance.response.body_sha256).toBe(hash(JSON.stringify(responseBody)));
    expect(provenance.response.headers).toEqual({
      'content-type': 'application/json',
      'x-request-id': 'req-safe-1',
    });
    expect(provenance.usage).toEqual({
      prompt_tokens: 12,
      completion_tokens: 1120,
      total_tokens: 1132,
      cost: 0.0672,
      cost_details: { upstream_inference_cost: 0.0672 },
    });
  });

  it('fails before a cost-bearing call when the canonical model lineage drifts', async () => {
    const fixture = await createFixture();
    const network = mockOpenRouter({ canonicalSlug: 'google/gemini-3.1-flash-image-CHANGED' });
    await expect(runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      fetchImpl: network.fetch,
      env: { OPENROUTER_API_KEY: 'unused-key' },
      now: () => new Date('2026-07-14T18:00:00.000Z'),
      getRepositoryState: async () => ({ commit: 'c'.repeat(40), dirty: false }),
    })).rejects.toThrow('expected locked lineage');
    expect(network.calls.filter(({ init }) => init.method === 'POST')).toHaveLength(0);
  });

  it('fails before a cost-bearing call when the locked provider endpoint disappears', async () => {
    const fixture = await createFixture();
    const network = mockOpenRouter({ provider: 'google-ai-studio' });
    await expect(runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      fetchImpl: network.fetch,
      env: { OPENROUTER_API_KEY: 'unused-key' },
      now: () => new Date('2026-07-14T18:00:00.000Z'),
      getRepositoryState: async () => ({ commit: 'c'.repeat(40), dirty: false }),
    })).rejects.toThrow('locked provider google-vertex/global');
    expect(network.calls.filter(({ init }) => init.method === 'POST')).toHaveLength(0);
  });

  it('refuses an existing output before any network request', async () => {
    const fixture = await createFixture();
    await writeFile(join(fixture.root, 'art/output.png'), pngBuffer(1, 1));
    const fetchImpl = vi.fn(() => {
      throw new Error('network must not be reached');
    });
    await expect(runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      fetchImpl,
      env: { OPENROUTER_API_KEY: 'unused-key' },
    })).rejects.toThrow('Refusing to overwrite existing file art/output.png');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not save or retry when the paid response is not a valid PNG', async () => {
    const fixture = await createFixture();
    const network = mockOpenRouter({
      generationBody: {
        created: 1784055000,
        data: [{ b64_json: Buffer.from('not a png').toString('base64'), media_type: 'image/png' }],
        usage: { cost: 0.01 },
      },
    });
    await expect(runCharacterImageGeneration({
      requestPath: fixture.requestPath,
      repoRoot: fixture.root,
      fetchImpl: network.fetch,
      env: { OPENROUTER_API_KEY: 'unused-key' },
      now: () => new Date('2026-07-14T18:00:00.000Z'),
      getRepositoryState: async () => ({ commit: 'd'.repeat(40), dirty: false }),
    })).rejects.toThrow('signature mismatch');
    expect(network.calls.filter(({ init }) => init.method === 'POST')).toHaveLength(1);
    await expect(readFile(join(fixture.root, 'art/output.png'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readFile(join(fixture.root, 'art/output.metadata.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('character image output transaction', () => {
  it('cleans partial files after injected temporary-write and final-link failures', async () => {
    for (const failure of ['image-write', 'image-link', 'provenance-link']) {
      const root = await mkdtemp(join(tmpdir(), `violet-character-install-${failure}-`));
      temporaryRoots.push(root);
      const imagePath = join(root, 'output.png');
      const provenancePath = join(root, 'output.metadata.json');
      const io = {};
      if (failure === 'image-write') {
        io.open = async (path, ...args) => {
          if (String(path).includes('.character-image.image.tmp')) throw injectedIoError(failure);
          return fsOpen(path, ...args);
        };
      } else {
        io.link = async (source, destination) => {
          if ((failure === 'image-link' && destination === imagePath)
            || (failure === 'provenance-link' && destination === provenancePath)) {
            throw injectedIoError(failure);
          }
          return fsLink(source, destination);
        };
      }

      await expect(installOutputPair({
        imagePath,
        imageBytes: pngBuffer(2, 2),
        provenancePath,
        provenanceBytes: Buffer.from('{"safe":true}\n'),
      }, { io })).rejects.toThrow(failure);
      await expect(readFile(imagePath)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(readFile(provenancePath)).rejects.toMatchObject({ code: 'ENOENT' });
      expect(await readdir(root)).toEqual([]);
    }
  });

  it('recovers an interrupted image-first install by rolling back the uncommitted image', async () => {
    const root = await mkdtemp(join(tmpdir(), 'violet-character-install-crash-image-'));
    temporaryRoots.push(root);
    const imagePath = join(root, 'output.png');
    const provenancePath = join(root, 'output.metadata.json');
    const io = {
      link: async (source, destination) => {
        await fsLink(source, destination);
        if (destination === imagePath) throw injectedIoError('simulated-crash-after-image');
      },
    };

    await expect(installOutputPair({
      imagePath,
      imageBytes: pngBuffer(2, 2),
      provenancePath,
      provenanceBytes: Buffer.from('{"safe":true}\n'),
    }, { io, recoverOnError: false })).rejects.toThrow('simulated-crash-after-image');
    expect(await readFile(imagePath)).toBeInstanceOf(Buffer);
    await expect(readFile(provenancePath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(characterImageTransactionPath(provenancePath))).toBeInstanceOf(Buffer);

    await expect(recoverCharacterImageInstall({ imagePath, provenancePath })).resolves.toEqual({
      status: 'rolled_back',
    });
    expect(await readdir(root)).toEqual([]);
  });

  it('treats provenance as the commit marker and finishes cleanup after a post-commit interruption', async () => {
    const root = await mkdtemp(join(tmpdir(), 'violet-character-install-crash-provenance-'));
    temporaryRoots.push(root);
    const imagePath = join(root, 'output.png');
    const provenancePath = join(root, 'output.metadata.json');
    const imageBytes = pngBuffer(2, 2);
    const provenanceBytes = Buffer.from('{"safe":true}\n');
    const io = {
      link: async (source, destination) => {
        await fsLink(source, destination);
        if (destination === provenancePath) throw injectedIoError('simulated-crash-after-provenance');
      },
    };

    await expect(installOutputPair({
      imagePath,
      imageBytes,
      provenancePath,
      provenanceBytes,
    }, { io, recoverOnError: false })).rejects.toThrow('simulated-crash-after-provenance');
    expect(await readFile(imagePath)).toEqual(imageBytes);
    expect(await readFile(provenancePath)).toEqual(provenanceBytes);

    await expect(recoverCharacterImageInstall({ imagePath, provenancePath })).resolves.toEqual({
      status: 'committed',
    });
    expect(await readFile(imagePath)).toEqual(imageBytes);
    expect(await readFile(provenancePath)).toEqual(provenanceBytes);
    expect((await readdir(root)).sort()).toEqual(['output.metadata.json', 'output.png']);
  });
});

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'violet-character-image-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'art'), { recursive: true });
  await writeFile(join(root, 'art/prompt.md'), [
    '# Candidate',
    '',
    'Metadata that must not be transmitted.',
    '',
    '## Prompt',
    '',
    'First prompt line.',
    '',
    'Second prompt line.',
    '',
    '## Review',
    '',
    'Also not transmitted.',
  ].join('\n'));
  await writeFile(join(root, 'art/reference-a.png'), pngBuffer(3, 2, [20, 40, 60, 255]));
  await writeFile(join(root, 'art/reference-b.png'), pngBuffer(2, 3, [70, 90, 110, 255]));
  const spec = requestSpec();
  await writeFile(join(root, 'art/request.json'), `${JSON.stringify(spec, null, 2)}\n`);
  return { root, requestPath: 'art/request.json' };
}

function requestSpec() {
  return {
    schema_version: 1,
    prompt: { path: 'art/prompt.md', section: 'Prompt' },
    references: [
      { path: 'art/reference-a.png', role: 'identity lock' },
      { path: 'art/reference-b.png', role: 'room style' },
    ],
    generation: { aspect_ratio: '3:4', resolution: '1K' },
    output: { image: 'art/output.png', provenance: 'art/output.metadata.json' },
  };
}

function mockOpenRouter({
  canonicalSlug = CHARACTER_IMAGE_POLICY.canonicalModelSlug,
  provider = CHARACTER_IMAGE_POLICY.provider,
  generationBody = null,
  generationHeaders = { 'content-type': 'application/json' },
} = {}) {
  const calls = [];
  const controls = {
    resolution: { type: 'enum', values: ['512', '1K', '2K', '4K'] },
    aspect_ratio: { type: 'enum', values: ['1:1', '3:4', '16:9'] },
    n: { type: 'range', min: 1, max: 1 },
    input_references: { type: 'range', min: 0, max: 14 },
  };
  const model = {
    id: CHARACTER_IMAGE_POLICY.model,
    canonical_slug: canonicalSlug,
    architecture: {
      input_modalities: ['image', 'text'],
      output_modalities: ['image', 'text'],
    },
    pricing: { prompt: '0.0000005', completion: '0.000003', image_output: '0.00006' },
    links: { details: `/api/v1/models/${canonicalSlug}/endpoints` },
  };
  const imageModel = {
    id: CHARACTER_IMAGE_POLICY.model,
    architecture: {
      input_modalities: ['image', 'text'],
      output_modalities: ['image', 'text'],
    },
    supported_parameters: controls,
    supports_streaming: false,
    endpoints: `/api/v1/images/models/${CHARACTER_IMAGE_POLICY.model}/endpoints`,
  };
  const imageEndpoints = {
    id: CHARACTER_IMAGE_POLICY.model,
    endpoints: [{
      provider_name: 'Google Vertex',
      provider_slug: provider,
      provider_tag: provider,
      supported_parameters: controls,
      allowed_passthrough_parameters: ['cachedContent'],
      supports_streaming: false,
      pricing: [{ billable: 'output_image', unit: 'token', cost_usd: 0.00006 }],
    }],
  };
  const fetch = vi.fn(async (url, init = {}) => {
    calls.push({ url: String(url), init: { method: 'GET', ...init } });
    if (String(url).endsWith(`/model/${CHARACTER_IMAGE_POLICY.model}`)) {
      return jsonResponse({ data: model });
    }
    if (String(url).endsWith('/images/models')) return jsonResponse({ data: [imageModel] });
    if (String(url).endsWith(`/images/models/${CHARACTER_IMAGE_POLICY.model}/endpoints`)) {
      return jsonResponse(imageEndpoints);
    }
    if (String(url).endsWith('/images') && init.method === 'POST') {
      const body = generationBody ?? {
        created: 1784055000,
        data: [{ b64_json: pngBuffer(1, 1).toString('base64'), media_type: 'image/png' }],
        usage: { prompt_tokens: 1, completion_tokens: 1120, total_tokens: 1121, cost: 0.0672 },
      };
      return jsonResponse(body, { headers: generationHeaders });
    }
    return jsonResponse({ error: 'unexpected URL' }, { status: 404 });
  });
  return { fetch, calls };
}

function jsonResponse(value, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function pngBuffer(width, height, pixel = [120, 80, 160, 255]) {
  const png = new PNG({ width, height });
  for (let offset = 0; offset < png.data.length; offset += 4) png.data.set(pixel, offset);
  return PNG.sync.write(png);
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function injectedIoError(label) {
  const error = new Error(label);
  error.code = 'EIO';
  return error;
}
