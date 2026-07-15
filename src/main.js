import './style.css';
import { Game } from './game/Game.js';
import { CharacterScopeController } from './game/characters/CharacterScopeController.js';
import {
  productionCharacterCatalog,
  titleCharacterDependencies,
} from './game/characters/productionCatalog.js';
import { loadChapterPackage } from './game/content/index.js';
import { loadGameFonts } from './game/core/loadFonts.js';
import { VersionWatcher, shouldRevealVersionOffer } from './game/core/VersionWatcher.js';
import { RegisteredCharacterRenderer } from './game/render/RegisteredCharacterRenderer.js';
import { Save } from './game/systems/Save.js';

const url = new URL(window.location.href);
const params = url.searchParams;
const clock = () => new Date().toISOString();
const storage = browserStorage();
const saveManager = new Save({ storage, clock });
let bootstrapReset = null;

if (params.get('reset') === '1') {
  try {
    bootstrapReset = saveManager.clear();
  } catch (error) {
    bootstrapReset = { ok: false, status: 'storage-error', save: null, error };
  }

  params.delete('reset');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

const canvas = document.querySelector('#game');
await loadGameFonts();
const characterScopes = new CharacterScopeController({
  catalog: productionCharacterCatalog,
  loadChapterPackage,
});
await characterScopes.activateTitle(titleCharacterDependencies, { boot: true });
const characterRenderer = new RegisteredCharacterRenderer({
  registry: productionCharacterCatalog.registry,
});
const game = new Game(canvas, {
  debug: params.get('debug') === '1',
  saveManager,
  characterRenderer,
  characterScopes,
});
game.start();

const reloadOffer = document.querySelector('#version-reload');
const reloadNow = document.querySelector('#version-reload-now');
const reloadLater = document.querySelector('#version-reload-later');
const reloadForUpdate = () => window.location.reload();
const dismissUpdate = () => { reloadOffer.hidden = true; };
let versionWatcher = null;
let updateOfferTimer = null;

function updateOfferIsCalm() {
  return shouldRevealVersionOffer({
    screen: game.screen,
    state: game.world?.snapshot?.(),
  });
}

function revealUpdateAtCalmMoment() {
  if (updateOfferIsCalm()) {
    reloadOffer.hidden = false;
    game.updateStatus('New magic is ready. Reload now, or keep playing this version.');
    return;
  }
  updateOfferTimer = window.setTimeout(revealUpdateAtCalmMoment, 2_000);
}

if (import.meta.env.PROD && reloadOffer && reloadNow && reloadLater) {
  reloadNow.addEventListener('click', reloadForUpdate);
  reloadLater.addEventListener('click', dismissUpdate);
  versionWatcher = new VersionWatcher({
    currentSha: import.meta.env.VITE_BUILD_SHA,
    baseUrl: import.meta.env.BASE_URL,
    locationHref: window.location.href,
    onUpdate: () => {
      revealUpdateAtCalmMoment();
    },
  });
  versionWatcher.start();
}

if (bootstrapReset && !bootstrapReset.ok) {
  game.updateStatus('The development reset could not clear this browser’s saved game.');
}

window.__violetWizard = game;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    versionWatcher?.stop();
    if (updateOfferTimer !== null) window.clearTimeout(updateOfferTimer);
    reloadNow?.removeEventListener('click', reloadForUpdate);
    reloadLater?.removeEventListener('click', dismissUpdate);
    game.destroy();
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
