import { BootAttemptController } from './boot/BootAttemptController.js';
import {
  BOOT_FAILURE_COPY,
  BOOT_FAILURE_TITLE,
  BOOT_STAGE_COPY,
} from './boot/bootCopy.js';

const url = new URL(window.location.href);
const params = url.searchParams;
const resetRequested = params.get('reset') === '1';
const clock = () => new Date().toISOString();
const storage = browserStorage();
const bootSurface = createBootSurface(document);
let runtimeDependenciesPromise = null;
let saveManager = null;
let bootstrapReset = null;
let resetHandled = false;

const boot = new BootAttemptController({
  runAttempt: runBootAttempt,
  disposeResult: disposeBootRuntime,
  onStage: (stage) => bootSurface.showStage(stage),
  onFailure: (error) => {
    console.error('Violet’s adventure could not finish starting.', error);
    bootSurface.showFailure();
  },
  onReady: (runtime) => {
    window.__violetWizard = runtime.game;
    if (bootstrapReset && !bootstrapReset.ok) {
      runtime.game.updateStatus('The development reset could not clear this browser’s saved game.');
    }
    bootSurface.showReady();
  },
  onCleanupError: (error) => {
    console.error('Violet’s previous startup attempt could not be fully cleaned up.', error);
  },
});

const retryBoot = () => (
  document.querySelector('#boot-surface')?.dataset.stage === 'runtime'
    ? window.location.reload()
    : boot.retry()
);
window.__violetRetryBoot = retryBoot;
void boot.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (window.__violetRetryBoot === retryBoot) delete window.__violetRetryBoot;
    boot.dispose();
  });
}

async function runBootAttempt(attempt) {
  let characterScopes = null;
  let game = null;
  let versionLifecycle = null;
  let cacheLifecycle = null;
  try {
    attempt.stage('runtime');
    const dependencies = await loadRuntimeDependencies();
    attempt.assertCurrent();
    const activeSaveManager = prepareSaveManager(dependencies);

    attempt.stage('fonts');
    await dependencies.loadGameFonts();
    attempt.assertCurrent();

    attempt.stage('presentation');
    const presentationRegistry = await dependencies.loadProductionPresentationRegistry({
      chapterDescriptors: dependencies.chapterDescriptors,
      loadChapterPackage: dependencies.loadChapterPackage,
    });
    attempt.assertCurrent();

    attempt.stage('title');
    characterScopes = new dependencies.CharacterScopeController({
      catalog: dependencies.productionCharacterCatalog,
      loadChapterPackage: dependencies.loadChapterPackage,
    });
    await characterScopes.activateTitle(dependencies.titleCharacterDependencies, { boot: true });
    attempt.assertCurrent();
    const characterRenderer = new dependencies.RegisteredCharacterRenderer({
      registry: dependencies.productionCharacterCatalog.registry,
    });
    const chapterRuntime = dependencies.createChapterRuntimeRegistry({
      catalog: dependencies.chapterCatalog,
    });
    const assetRegistry = new dependencies.AssetRegistry();

    attempt.stage('bootstrap');
    const canvas = document.querySelector('#game');
    game = new dependencies.Game(canvas, {
      debug: params.get('debug') === '1',
      saveManager: activeSaveManager,
      characterRenderer,
      characterScopes,
      presentationRegistry,
      chapterRuntime,
      assetRegistry,
    });
    if (typeof game.prepareTitleComposition === 'function') {
      await game.prepareTitleComposition();
      attempt.assertCurrent();
    }
    game.start();
    attempt.assertCurrent();
    versionLifecycle = setupVersionWatcher(game, dependencies);
    cacheLifecycle = setupOfflineCache(dependencies);
    return Object.freeze({ game, versionLifecycle, cacheLifecycle });
  } catch (error) {
    cacheLifecycle?.dispose();
    versionLifecycle?.dispose();
    if (game) await game.destroy();
    else if (characterScopes) await characterScopes.destroy();
    throw error;
  }
}

async function disposeBootRuntime(runtime) {
  runtime?.cacheLifecycle?.dispose();
  runtime?.versionLifecycle?.dispose();
  await runtime?.game?.destroy?.();
}

function setupOfflineCache({ registerGameServiceWorker }) {
  let disposed = false;
  let idleId = null;
  let timerId = null;
  const register = () => {
    idleId = null;
    timerId = null;
    if (!disposed) void registerGameServiceWorker();
  };

  if (typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(register, { timeout: 15_000 });
  } else {
    timerId = window.setTimeout(register, 5_000);
  }

  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
      if (timerId !== null) window.clearTimeout(timerId);
    },
  });
}

function prepareSaveManager({ Save, saveMigrationOptions }) {
  if (!saveManager) {
    saveManager = new Save({ storage, clock, migrationOptions: saveMigrationOptions });
  }
  if (!resetRequested || resetHandled) return saveManager;

  resetHandled = true;
  try {
    bootstrapReset = saveManager.clear();
  } catch (error) {
    bootstrapReset = { ok: false, status: 'storage-error', save: null, error };
  }
  params.delete('reset');
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
  return saveManager;
}

function setupVersionWatcher(game, {
  VersionWatcher,
  shouldRevealVersionOffer,
  activateGameServiceWorkerUpdate,
}) {
  const reloadOffer = document.querySelector('#version-reload');
  const reloadNow = document.querySelector('#version-reload-now');
  const reloadLater = document.querySelector('#version-reload-later');
  const reloadForUpdate = () => {
    void activateGameServiceWorkerUpdate();
  };
  const dismissUpdate = () => { reloadOffer.hidden = true; };
  let disposed = false;
  let versionWatcher = null;
  let updateOfferTimer = null;

  const updateOfferIsCalm = () => shouldRevealVersionOffer({
    screen: game.screen,
    state: game.world?.snapshot?.(),
  });
  const revealUpdateAtCalmMoment = () => {
    if (disposed) return;
    if (updateOfferIsCalm()) {
      reloadOffer.hidden = false;
      game.updateStatus('New magic is ready. Reload now, or keep playing this version.');
      return;
    }
    updateOfferTimer = window.setTimeout(revealUpdateAtCalmMoment, 2_000);
  };

  if (import.meta.env.PROD && reloadOffer && reloadNow && reloadLater) {
    reloadNow.addEventListener('click', reloadForUpdate);
    reloadLater.addEventListener('click', dismissUpdate);
    versionWatcher = new VersionWatcher({
      currentSha: import.meta.env.VITE_BUILD_SHA,
      baseUrl: import.meta.env.BASE_URL,
      locationHref: window.location.href,
      onUpdate: revealUpdateAtCalmMoment,
    });
    versionWatcher.start();
  }

  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      versionWatcher?.stop();
      if (updateOfferTimer !== null) window.clearTimeout(updateOfferTimer);
      reloadNow?.removeEventListener('click', reloadForUpdate);
      reloadLater?.removeEventListener('click', dismissUpdate);
    },
  });
}

function loadRuntimeDependencies() {
  if (!runtimeDependenciesPromise) {
    runtimeDependenciesPromise = Promise.all([
      import('./game/Game.js'),
      import('./game/characters/CharacterScopeController.js'),
      import('./game/chapters/saveMigrations.js'),
      import('./game/characters/productionCatalog.js'),
      import('./game/chapters/catalog.js'),
      import('./game/core/AssetRegistry.js'),
      import('./game/core/loadFonts.js'),
      import('./game/presentation/productionRoomVariantOverlays.js'),
      import('./game/core/VersionWatcher.js'),
      import('./game/core/ServiceWorkerManager.js'),
      import('./game/render/RegisteredCharacterRenderer.js'),
      import('./game/systems/Save.js'),
    ]).then(([
      { Game },
      { CharacterScopeController },
      { saveMigrationOptions },
      { productionCharacterCatalog, titleCharacterDependencies },
      {
        chapterCatalog,
        chapterDescriptors,
        createChapterRuntimeRegistry,
        loadChapterPackage,
      },
      { AssetRegistry },
      { loadGameFonts },
      { loadProductionPresentationRegistry },
      { VersionWatcher, shouldRevealVersionOffer },
      { activateGameServiceWorkerUpdate, registerGameServiceWorker },
      { RegisteredCharacterRenderer },
      { Save },
    ]) => Object.freeze({
      Game,
      CharacterScopeController,
      saveMigrationOptions,
      productionCharacterCatalog,
      titleCharacterDependencies,
      chapterCatalog,
      chapterDescriptors,
      createChapterRuntimeRegistry,
      loadChapterPackage,
      AssetRegistry,
      loadGameFonts,
      loadProductionPresentationRegistry,
      VersionWatcher,
      shouldRevealVersionOffer,
      activateGameServiceWorkerUpdate,
      registerGameServiceWorker,
      RegisteredCharacterRenderer,
      Save,
    }));
  }
  return runtimeDependenciesPromise.catch((error) => {
    runtimeDependenciesPromise = null;
    throw error;
  });
}

function createBootSurface(documentRef) {
  const gameRoot = documentRef.querySelector('#game-root');
  const canvas = documentRef.querySelector('#game');
  const surface = documentRef.querySelector('#boot-surface');
  const title = documentRef.querySelector('#boot-title');
  const status = documentRef.querySelector('#boot-status');
  const retry = documentRef.querySelector('#boot-retry');
  if (!gameRoot || !canvas || !surface || !title || !status || !retry) {
    throw new Error('The page is missing its boot surface.');
  }
  let currentStage = 'bootstrap';

  return Object.freeze({
    showStage(stage) {
      const copy = BOOT_STAGE_COPY[stage];
      if (!copy) throw new TypeError(`Unknown boot stage: ${String(stage)}.`);
      currentStage = stage;
      gameRoot.dataset.bootReady = 'false';
      gameRoot.setAttribute('aria-busy', 'true');
      canvas.setAttribute('aria-hidden', 'true');
      surface.hidden = false;
      surface.dataset.state = 'loading';
      surface.dataset.stage = stage;
      title.textContent = copy.title;
      status.textContent = copy.status;
      retry.hidden = true;
      retry.disabled = true;
    },
    showFailure() {
      gameRoot.setAttribute('aria-busy', 'false');
      surface.hidden = false;
      surface.dataset.state = 'error';
      surface.dataset.stage = currentStage;
      title.textContent = BOOT_FAILURE_TITLE;
      status.textContent = BOOT_FAILURE_COPY[currentStage] ?? BOOT_FAILURE_COPY.bootstrap;
      retry.hidden = false;
      retry.disabled = false;
      retry.focus({ preventScroll: true });
    },
    showReady() {
      gameRoot.dataset.bootReady = 'true';
      gameRoot.setAttribute('aria-busy', 'false');
      canvas.removeAttribute('aria-hidden');
      surface.hidden = true;
    },
  });
}

function browserStorage() {
  try {
    if (window.localStorage) return window.localStorage;
  } catch {
    // Continue with a session-only adapter when browser storage is blocked.
  }
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}
