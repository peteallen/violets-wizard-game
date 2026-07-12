import './style.css';
import { Game } from './game/Game.js';
import { Save } from './game/systems/Save.js';

const url = new URL(window.location.href);
const params = url.searchParams;
let bootstrapReset = null;

if (params.get('reset') === '1') {
  try {
    const saves = new Save({
      storage: window.localStorage,
      clock: () => new Date().toISOString(),
    });
    bootstrapReset = saves.clear();
  } catch (error) {
    bootstrapReset = { ok: false, status: 'storage-error', save: null, error };
  }

  params.delete('reset');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

const canvas = document.querySelector('#game');
const game = new Game(canvas, { debug: params.get('debug') === '1' });
game.start();

if (bootstrapReset && !bootstrapReset.ok) {
  game.updateStatus('The development reset could not clear this browser’s saved game.');
}

window.__violetWizard = game;

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy());
}
