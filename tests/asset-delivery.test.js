import { describe, expect, it, vi } from 'vitest';
import { revisionedAssetUrl } from '../src/game/core/assetUrl.js';
import {
  activateGameServiceWorkerUpdate,
  registerGameServiceWorker,
  resolveServiceWorkerUrl,
} from '../src/game/core/ServiceWorkerManager.js';
import {
  collectGameShellFiles,
  createBuildIdentity,
  publicArtRevisionPlugin,
  productionManualChunk,
  revisionPublicArtReferences,
  serviceWorkerPlugin,
  serviceWorkerSource,
} from '../vite.config.js';

const SHA = 'a'.repeat(40);
const BUILT_AT = '2026-07-19T16:00:00.000Z';

function generatedWorker(source, {
  cachedResponse = null,
  fetcher = vi.fn(),
} = {}) {
  const listeners = {};
  const cache = {
    addAll: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(cachedResponse),
    put: vi.fn().mockResolvedValue(undefined),
  };
  const cachesRef = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(true),
  };
  const selfRef = {
    registration: { scope: 'https://example.test/violets-wizard-game/' },
    location: { origin: 'https://example.test' },
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    addEventListener: (type, callback) => { listeners[type] = callback; },
  };
  new Function('self', 'caches', 'fetch', source)(selfRef, cachesRef, fetcher);
  return { cache, cachesRef, fetcher, listeners, selfRef };
}

function navigationRequest(path) {
  return {
    method: 'GET',
    headers: { has: () => false },
    mode: 'navigate',
    destination: 'document',
    url: `https://example.test/violets-wizard-game/${path}`,
  };
}

describe('revisioned production assets', () => {
  it('keeps development URLs readable and revisions production media by build', () => {
    expect(revisionedAssetUrl('/assets/art/title.webp', {
      baseUrl: '/violets-wizard-game/',
    })).toBe('/violets-wizard-game/assets/art/title.webp');
    expect(revisionedAssetUrl('/assets/art/title.webp', {
      baseUrl: '/violets-wizard-game/',
      buildSha: SHA,
      production: true,
    })).toBe(`/violets-wizard-game/assets/art/title.webp?v=${SHA}`);
  });

  it('does not attach an ambiguous shortened revision', () => {
    expect(revisionedAssetUrl('assets/art/title.webp', {
      baseUrl: './',
      buildSha: SHA.slice(0, 7),
      production: true,
    })).toBe('./assets/art/title.webp');
  });

  it('revisions public art without changing relative or root-based deployment paths', () => {
    const source = [
      '<link rel="icon" href="./assets/art/ui/browser/owl.png" />',
      'background: url("/assets/art/ui/dom/folio.webp");',
      'src: url("./assets/fonts/Andika.woff2");',
    ].join('\n');
    expect(revisionPublicArtReferences(source, SHA)).toBe([
      `<link rel="icon" href="./assets/art/ui/browser/owl.png?v=${SHA}" />`,
      `background: url("/assets/art/ui/dom/folio.webp?v=${SHA}");`,
      'src: url("./assets/fonts/Andika.woff2");',
    ].join('\n'));
    expect(revisionPublicArtReferences(
      `url("/assets/art/ui/dom/folio.webp?v=${SHA}")`,
      SHA,
    )).toBe(`url("/assets/art/ui/dom/folio.webp?v=${SHA}")`);
  });

  it('applies public-art revisioning only to the production HTML and shared stylesheet hooks', () => {
    const identity = createBuildIdentity({ sha: SHA, builtAt: BUILT_AT });
    const plugin = publicArtRevisionPlugin(identity);
    expect(plugin.transformIndexHtml.handler(
      '<link rel="icon" href="./assets/art/ui/browser/owl.png" />',
    )).toContain(`owl.png?v=${SHA}`);
    expect(plugin.transform(
      'background: url("/assets/art/ui/dom/folio.webp");',
      '/project/src/style.css?direct',
    )).toEqual({
      code: `background: url("/assets/art/ui/dom/folio.webp?v=${SHA}");`,
      map: null,
    });
    expect(plugin.transform(
      'const path = "/assets/art/story.webp";',
      '/project/src/game/example.js',
    )).toBeNull();
  });
});

describe('game service worker', () => {
  it('is emitted with a build-owned cache and bounded title precache', () => {
    const identity = createBuildIdentity({ sha: SHA, builtAt: BUILT_AT });
    const emitFile = vi.fn();
    const bundle = {
      'assets/game.js': {
        type: 'chunk',
        fileName: 'assets/game.js',
        isEntry: true,
        name: 'game',
        imports: ['assets/shared.js'],
        dynamicImports: ['assets/boot-runtime.js'],
        viteMetadata: {
          importedCss: new Set(['assets/game.css']),
          importedAssets: new Set(['assets/unvisited-room.webp']),
        },
      },
      'assets/shared.js': {
        type: 'chunk',
        fileName: 'assets/shared.js',
        imports: [],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/boot-runtime.js': {
        type: 'chunk',
        fileName: 'assets/boot-runtime.js',
        isDynamicEntry: true,
        imports: ['assets/boot-shared.js'],
        facadeModuleId: '/project/src/game/Game.js',
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/boot-shared.js': {
        type: 'chunk',
        fileName: 'assets/boot-shared.js',
        imports: [],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/violet-runtime.js': {
        type: 'chunk',
        fileName: 'assets/violet-runtime.js',
        imports: ['assets/title-shared.js'],
        facadeModuleId: '/project/src/game/characters/violet/runtime.js',
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/post-owl-runtime.js': {
        type: 'chunk',
        fileName: 'assets/post-owl-runtime.js',
        imports: ['assets/title-shared.js'],
        facadeModuleId: '/project/src/game/characters/post-owl/runtime.js',
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/title-shared.js': {
        type: 'chunk',
        fileName: 'assets/title-shared.js',
        imports: [],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/unrelated-chapter.js': {
        type: 'chunk',
        fileName: 'assets/unrelated-chapter.js',
        isDynamicEntry: true,
        imports: [],
        facadeModuleId: '/project/src/game/chapters/ch4/contentLoader.js',
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/game.css': { type: 'asset', fileName: 'assets/game.css' },
      'assets/game.woff2': { type: 'asset', fileName: 'assets/game.woff2' },
      'assets/unvisited-room.webp': { type: 'asset', fileName: 'assets/unvisited-room.webp' },
      'assets/later.mp3': { type: 'asset', fileName: 'assets/later.mp3' },
    };
    expect(collectGameShellFiles(bundle)).toEqual([
      './assets/boot-runtime.js',
      './assets/boot-shared.js',
      './assets/game.css',
      './assets/game.js',
      './assets/game.woff2',
      './assets/post-owl-runtime.js',
      './assets/shared.js',
      './assets/title-shared.js',
      './assets/violet-runtime.js',
      './index.html',
    ]);
    serviceWorkerPlugin(identity).generateBundle.call({ emitFile }, {}, bundle);
    expect(emitFile).toHaveBeenCalledOnce();
    const asset = emitFile.mock.calls[0][0];
    expect(asset).toMatchObject({ type: 'asset', fileName: 'service-worker.js' });
    expect(asset.source).toContain(`violet-wizard-${SHA}`);
    expect(asset.source).toContain('title-backdrop-v2.webp');
    expect(asset.source).toContain('casual/neutral.webp');
    expect(asset.source).toContain('./assets/shared.js');
    expect(asset.source).toContain('./assets/boot-runtime.js');
    expect(asset.source).toContain('./assets/violet-runtime.js');
    expect(asset.source).toContain('./assets/post-owl-runtime.js');
    expect(asset.source).not.toContain('./assets/unrelated-chapter.js');
    expect(asset.source).not.toContain('./assets/unvisited-room.webp');
    expect(asset.source).toContain('./assets/game.woff2');
    expect(asset.source).not.toContain('assets/audio');
    expect(asset.source).toContain("request.headers.has('range')");
    expect(asset.source).toContain("event.data?.type !== 'SKIP_WAITING'");
    expect(() => new Function(asset.source)).not.toThrow();
  });

  it('rejects review entry points from the production boot dependency graph', () => {
    const bundle = {
      'assets/game.js': {
        type: 'chunk',
        fileName: 'assets/game.js',
        isEntry: true,
        name: 'game',
        imports: [],
        dynamicImports: ['assets/boot-runtime.js'],
        moduleIds: ['/project/src/main.js'],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/boot-runtime.js': {
        type: 'chunk',
        fileName: 'assets/boot-runtime.js',
        imports: ['assets/harness.js'],
        facadeModuleId: '/project/src/game/Game.js',
        moduleIds: ['/project/src/game/Game.js'],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/harness.js': {
        type: 'chunk',
        fileName: 'assets/harness.js',
        imports: [],
        facadeModuleId: '/project/src/harness/boot.js',
        moduleIds: ['/project/src/harness/boot.js'],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
    };

    expect(() => collectGameShellFiles(bundle)).toThrow(
      'Production boot dependency assets/harness.js contains review entry /project/src/harness/boot.js.',
    );
  });

  it('isolates harness entry modules and rejects them from every production character runtime', () => {
    expect(productionManualChunk('/project/src/harness/boot.js')).toBe('visual-harness');
    expect(productionManualChunk('/project/src/harness/stateFixtures.js')).toBe('visual-harness');
    expect(productionManualChunk('/project/src/boot/review.js')).toBe('boot-review');
    expect(productionManualChunk('/project/src/game/render/UIRenderer.js')).toBeUndefined();

    const bundle = {
      'assets/game.js': {
        type: 'chunk',
        fileName: 'assets/game.js',
        isEntry: true,
        name: 'game',
        imports: [],
        dynamicImports: [],
        moduleIds: ['/project/src/main.js'],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/cat-runtime.js': {
        type: 'chunk',
        fileName: 'assets/cat-runtime.js',
        imports: ['assets/visual-harness.js'],
        moduleIds: ['/project/src/game/characters/cat/runtime.js'],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
      'assets/visual-harness.js': {
        type: 'chunk',
        fileName: 'assets/visual-harness.js',
        imports: [],
        moduleIds: ['/project/src/harness/boot.js'],
        viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
      },
    };

    expect(() => collectGameShellFiles(bundle)).toThrow(
      'Production character runtime assets/cat-runtime.js depends on review module /project/src/harness/boot.js via assets/cat-runtime.js -> assets/visual-harness.js.',
    );
  });

  it('uses the current network game page while leaving other production pages alone', async () => {
    const identity = createBuildIdentity({ sha: SHA, builtAt: BUILT_AT });
    const networkResponse = { ok: true, source: 'network' };
    const worker = generatedWorker(serviceWorkerSource(identity), {
      cachedResponse: { ok: true, source: 'cache' },
      fetcher: vi.fn().mockResolvedValue(networkResponse),
    });
    const gameEvent = {
      request: navigationRequest('index.html'),
      respondWith: vi.fn(),
    };
    worker.listeners.fetch(gameEvent);
    expect(gameEvent.respondWith).toHaveBeenCalledOnce();
    await expect(gameEvent.respondWith.mock.calls[0][0]).resolves.toBe(networkResponse);
    expect(worker.fetcher).toHaveBeenCalledWith(gameEvent.request, { cache: 'no-store' });

    const harnessEvent = {
      request: navigationRequest('harness.html'),
      respondWith: vi.fn(),
    };
    worker.listeners.fetch(harnessEvent);
    expect(harnessEvent.respondWith).not.toHaveBeenCalled();
  });

  it('falls back to the revision-owned game page offline and accepts explicit activation', async () => {
    const identity = createBuildIdentity({ sha: SHA, builtAt: BUILT_AT });
    const cachedResponse = { ok: true, source: 'cache' };
    const worker = generatedWorker(serviceWorkerSource(identity), {
      cachedResponse,
      fetcher: vi.fn().mockRejectedValue(new Error('offline')),
    });
    const event = {
      request: navigationRequest(''),
      respondWith: vi.fn(),
    };
    worker.listeners.fetch(event);
    await expect(event.respondWith.mock.calls[0][0]).resolves.toBe(cachedResponse);

    const activation = { data: { type: 'SKIP_WAITING' }, waitUntil: vi.fn() };
    worker.listeners.message(activation);
    expect(worker.selfRef.skipWaiting).toHaveBeenCalledOnce();
    expect(activation.waitUntil).toHaveBeenCalledOnce();
    await expect(activation.waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
  });

  it('registers beneath the deployed base path only in production', async () => {
    expect(resolveServiceWorkerUrl(
      '/violets-wizard-game/',
      'https://example.test/anything',
    )).toBe('https://example.test/violets-wizard-game/service-worker.js');

    const register = vi.fn().mockResolvedValue({ scope: '/violets-wizard-game/' });
    await expect(registerGameServiceWorker({
      navigatorRef: { serviceWorker: { register } },
      locationHref: 'https://example.test/violets-wizard-game/',
      baseUrl: '/violets-wizard-game/',
      production: true,
    })).resolves.toMatchObject({ status: 'registered' });
    expect(register).toHaveBeenCalledWith(
      'https://example.test/violets-wizard-game/service-worker.js',
      { scope: '/violets-wizard-game/', updateViaCache: 'none' },
    );
  });

  it('promotes a waiting update before reloading the accepted new build', async () => {
    const listeners = new Map();
    const serviceWorker = {
      addEventListener: vi.fn((type, callback) => listeners.set(type, callback)),
      removeEventListener: vi.fn(),
      getRegistration: vi.fn(),
    };
    const waiting = {
      postMessage: vi.fn(() => listeners.get('controllerchange')?.()),
    };
    const registration = {
      waiting,
      installing: null,
      update: vi.fn().mockResolvedValue(undefined),
    };
    serviceWorker.getRegistration.mockResolvedValue(registration);
    const reload = vi.fn();

    await expect(activateGameServiceWorkerUpdate({
      navigatorRef: { serviceWorker },
      locationHref: 'https://example.test/violets-wizard-game/',
      baseUrl: '/violets-wizard-game/',
      reload,
    })).resolves.toMatchObject({ status: 'activated-and-reloading', registration });
    expect(serviceWorker.getRegistration).toHaveBeenCalledWith(
      'https://example.test/violets-wizard-game/',
    );
    expect(registration.update).toHaveBeenCalledOnce();
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads through the network-first worker when no waiting update is visible', async () => {
    const registration = {
      waiting: null,
      installing: null,
      update: vi.fn().mockResolvedValue(undefined),
    };
    const serviceWorker = {
      getRegistration: vi.fn().mockResolvedValue(registration),
    };
    const reload = vi.fn();
    await expect(activateGameServiceWorkerUpdate({
      navigatorRef: { serviceWorker },
      locationHref: 'https://example.test/violets-wizard-game/',
      baseUrl: '/violets-wizard-game/',
      reload,
    })).resolves.toMatchObject({ status: 'reloading', registration });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('keeps play available when registration is unsupported or fails', async () => {
    await expect(registerGameServiceWorker({
      navigatorRef: {},
      production: true,
    })).resolves.toMatchObject({ status: 'unsupported' });

    const error = new Error('offline');
    const logger = { warn: vi.fn() };
    await expect(registerGameServiceWorker({
      navigatorRef: { serviceWorker: { register: vi.fn().mockRejectedValue(error) } },
      locationHref: 'https://example.test/violets-wizard-game/',
      baseUrl: '/violets-wizard-game/',
      production: true,
      logger,
    })).resolves.toMatchObject({ status: 'failed', error });
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
