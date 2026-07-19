import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FULL_GIT_SHA = /^[a-f0-9]{40}$/;
const PUBLIC_ART_REFERENCE = /(?:\.\/|\/)assets\/art\/[^\s"'()?#]+(?:\?[^\s"'()#]*)?(?:#[^\s"'()]*)?/gu;

export function currentGitSha({ cwd = process.cwd(), exec = execFileSync, env = process.env } = {}) {
  try {
    const sha = exec('git', ['rev-parse', '--verify', 'HEAD^{commit}'], { cwd, encoding: 'utf8' }).trim().toLowerCase();
    if (FULL_GIT_SHA.test(sha)) return sha;
  } catch {
    // The checked-out commit remains authoritative; CI's SHA is a fallback for archive builds.
  }
  const fallback = String(env.GITHUB_SHA ?? '').trim().toLowerCase();
  if (FULL_GIT_SHA.test(fallback)) return fallback;
  throw new Error('A full Git commit SHA is required to build Violet\'s Wizard Game.');
}

export function createBuildIdentity({ sha = currentGitSha(), builtAt = new Date().toISOString() } = {}) {
  if (!FULL_GIT_SHA.test(sha)) throw new TypeError('Build SHA must be a full lowercase 40-character Git SHA.');
  if (Number.isNaN(Date.parse(builtAt)) || !builtAt.endsWith('Z')) throw new TypeError('Build timestamp must be an ISO UTC instant.');
  return Object.freeze({ sha, builtAt });
}

export function versionFilePlugin(identity) {
  const version = createBuildIdentity(identity);
  return {
    name: 'violet-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify(version, null, 2)}\n`,
      });
    },
  };
}

function appendBuildRevision(reference, sha) {
  const hashIndex = reference.indexOf('#');
  const pathAndQuery = hashIndex === -1 ? reference : reference.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : reference.slice(hashIndex);
  if (/(?:\?|&)v=[a-f0-9]{40}(?:&|$)/u.test(pathAndQuery)) return reference;
  return `${pathAndQuery}${pathAndQuery.includes('?') ? '&' : '?'}v=${sha}${hash}`;
}

export function revisionPublicArtReferences(source, sha) {
  if (typeof source !== 'string') throw new TypeError('Public art source must be a string.');
  if (!FULL_GIT_SHA.test(sha)) {
    throw new TypeError('Public art revision must be a full lowercase 40-character Git SHA.');
  }
  return source.replace(PUBLIC_ART_REFERENCE, (reference) => (
    appendBuildRevision(reference, sha)
  ));
}

export function publicArtRevisionPlugin(identity) {
  const version = createBuildIdentity(identity);
  return {
    name: 'violet-public-art-revision',
    enforce: 'pre',
    transform(code, id) {
      if (!String(id).split('?', 1)[0].endsWith('/src/style.css')) return null;
      const revised = revisionPublicArtReferences(code, version.sha);
      return revised === code ? null : { code: revised, map: null };
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return revisionPublicArtReferences(html, version.sha);
      },
    },
  };
}

const TITLE_PRECACHE_PATHS = Object.freeze([
  './assets/art/ui/title/title-backdrop-v2.webp',
  './assets/art/ui/title/return-envelope-v2.webp',
  './assets/art/characters/violet/casual/neutral.webp',
  './assets/art/characters/violet/casual/blink.webp',
  './assets/art/characters/violet/casual/wonder.webp',
]);

const TITLE_RUNTIME_MODULE_SUFFIXES = Object.freeze([
  '/src/game/characters/violet/runtime.js',
  '/src/game/characters/post-owl/runtime.js',
]);

const PRODUCTION_SHELL_FORBIDDEN_MODULE_SUFFIXES = Object.freeze([
  '/src/harness/boot.js',
  '/src/boot/review.js',
]);

const PRODUCTION_CHARACTER_RUNTIME = /\/src\/game\/characters\/[^/]+\/runtime\.js$/u;

export function productionManualChunk(id) {
  const normalized = String(id ?? '').replaceAll('\\', '/');
  if (normalized.includes('/src/harness/')) return 'visual-harness';
  if (normalized.endsWith('/src/boot/review.js')) return 'boot-review';
  return undefined;
}

function chunkModuleIds(chunk) {
  return [chunk?.facadeModuleId, ...(chunk?.moduleIds ?? [])]
    .filter(Boolean)
    .map((moduleId) => String(moduleId).replaceAll('\\', '/'));
}

function chunkContainsTitleRuntime(chunk) {
  const moduleIds = chunkModuleIds(chunk);
  return TITLE_RUNTIME_MODULE_SUFFIXES.some((suffix) => (
    moduleIds.some((moduleId) => moduleId.endsWith(suffix))
  ));
}

function assertProductionShellChunk(chunk) {
  const forbiddenModule = chunkModuleIds(chunk).find((moduleId) => (
    PRODUCTION_SHELL_FORBIDDEN_MODULE_SUFFIXES.some((suffix) => moduleId.endsWith(suffix))
  ));
  if (forbiddenModule) {
    throw new Error(
      `Production boot dependency ${chunk.fileName} contains review entry ${forbiddenModule}.`,
    );
  }
}

function assertProductionRuntimeDependencies(chunks) {
  const roots = [...chunks.values()].filter((chunk) => (
    chunkModuleIds(chunk).some((moduleId) => PRODUCTION_CHARACTER_RUNTIME.test(moduleId))
  ));
  for (const root of roots) {
    const visited = new Set();
    const visit = (chunk, chain = []) => {
      if (!chunk || visited.has(chunk.fileName)) return;
      visited.add(chunk.fileName);
      const nextChain = [...chain, chunk.fileName];
      const forbiddenModule = chunkModuleIds(chunk).find((moduleId) => (
        moduleId.includes('/src/harness/') || moduleId.endsWith('/src/boot/review.js')
      ));
      if (forbiddenModule) {
        throw new Error(
          `Production character runtime ${root.fileName} depends on review module ${forbiddenModule} via ${nextChain.join(' -> ')}.`,
        );
      }
      for (const imported of chunk.imports ?? []) visit(chunks.get(imported), nextChain);
    };
    visit(root);
  }
}

export function collectGameShellFiles(bundle = {}) {
  const files = new Set(['index.html']);
  const chunks = new Map(Object.values(bundle)
    .filter((entry) => entry?.type === 'chunk')
    .map((entry) => [entry.fileName, entry]));
  assertProductionRuntimeDependencies(chunks);
  const gameEntry = [...chunks.values()].find((entry) => entry.isEntry && entry.name === 'game');
  const visitStaticImports = (chunk) => {
    if (!chunk || files.has(chunk.fileName)) return;
    assertProductionShellChunk(chunk);
    files.add(chunk.fileName);
    for (const imported of chunk.imports ?? []) visitStaticImports(chunks.get(imported));
    for (const css of chunk.viteMetadata?.importedCss ?? []) files.add(css);
  };

  visitStaticImports(gameEntry);
  for (const dynamicImport of gameEntry?.dynamicImports ?? []) {
    visitStaticImports(chunks.get(dynamicImport));
  }
  for (const chunk of chunks.values()) {
    if (chunkContainsTitleRuntime(chunk)) visitStaticImports(chunk);
  }
  for (const entry of Object.values(bundle)) {
    if (entry?.type === 'asset' && /\.woff2$/u.test(entry.fileName)) files.add(entry.fileName);
  }
  return Object.freeze([...files].sort().map((file) => `./${file.replace(/^\/+/, '')}`));
}

export function serviceWorkerSource(identity, { shellPaths = ['./index.html'] } = {}) {
  const version = createBuildIdentity(identity);
  const cacheName = `violet-wizard-${version.sha}`;
  const precache = [
    ...shellPaths.map((path) => (
      path === './index.html' ? `${path}?v=${version.sha}` : path
    )),
    ...TITLE_PRECACHE_PATHS.map((path) => (
      `${path}?v=${version.sha}`
    )),
  ];
  return `const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = 'violet-wizard-';
const PRECACHE_PATHS = ${JSON.stringify(precache, null, 2)};
const SCOPE_URL = new URL(self.registration.scope);
const GAME_INDEX_URL = new URL('./index.html', SCOPE_URL);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(
    PRECACHE_PATHS.map((path) => new URL(path, self.registration.scope).href),
  )));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)),
  )).then(() => self.clients.claim()));
});

async function gameNavigation(request) {
  let networkResponse = null;
  try {
    networkResponse = await fetch(request, { cache: 'no-store' });
    if (networkResponse.ok) return networkResponse;
  } catch {
    // The revision-owned shell below is the offline fallback.
  }
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(new URL('./index.html?v=${version.sha}', self.registration.scope).href);
  if (cached) return cached;
  if (networkResponse) return networkResponse;
  return fetch(request, { cache: 'no-store' });
}

async function cachedAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SKIP_WAITING') return;
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('/version.json')) return;
  if (request.mode === 'navigate') {
    const isGameNavigation = url.pathname === SCOPE_URL.pathname
      || url.pathname === GAME_INDEX_URL.pathname;
    if (isGameNavigation) event.respondWith(gameNavigation(request));
    return;
  }
  if (['image', 'script', 'style', 'font'].includes(request.destination)) {
    event.respondWith(cachedAsset(request));
  }
});
`;
}

export function serviceWorkerPlugin(identity) {
  const version = createBuildIdentity(identity);
  return {
    name: 'violet-service-worker',
    generateBundle(_options, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'service-worker.js',
        source: serviceWorkerSource(version, {
          shellPaths: collectGameShellFiles(bundle),
        }),
      });
    },
  };
}

export function productionHtmlInputs() {
  return Object.freeze({
    game: fileURLToPath(new URL('./index.html', import.meta.url)),
    harness: fileURLToPath(new URL('./harness.html', import.meta.url)),
  });
}

export default defineConfig(() => {
  const identity = createBuildIdentity();
  return {
    base: './',
    define: {
      'import.meta.env.VITE_BUILD_SHA': JSON.stringify(identity.sha),
    },
    plugins: [
      publicArtRevisionPlugin(identity),
      versionFilePlugin(identity),
      serviceWorkerPlugin(identity),
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
    },
    build: {
      target: 'es2022',
      rollupOptions: {
        input: productionHtmlInputs(),
        output: {
          manualChunks: productionManualChunk,
          onlyExplicitManualChunks: true,
        },
      },
    },
  };
});
