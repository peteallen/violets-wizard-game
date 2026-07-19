import '../style.css';
import {
  BOOT_FAILURE_COPY,
  BOOT_FAILURE_TITLE,
  BOOT_STAGE_COPY,
} from './bootCopy.js';

const params = new URL(globalThis.location.href).searchParams;
const scene = params.get('scene') ?? 'boot-loading-review';
const width = Number.parseInt(params.get('size')?.split('x')[0] ?? '1280', 10);
const height = Number.parseInt(params.get('size')?.split('x')[1] ?? '720', 10);
if (!['boot-loading-review', 'boot-failure-review'].includes(scene)) {
  throw new Error(`Unsupported boot review scene: ${scene}.`);
}

const response = await fetch(new URL('/index.html', globalThis.location.origin));
if (!response.ok) throw new Error(`Could not read the production boot surface (${response.status}).`);
const source = new DOMParser().parseFromString(await response.text(), 'text/html');
const productionSurface = source.querySelector('#boot-surface');
if (!productionSurface) throw new Error('Production index.html has no boot surface to review.');

const root = document.createElement('main');
root.id = 'game-root';
root.dataset.bootReady = 'false';
root.setAttribute('aria-busy', scene === 'boot-loading-review' ? 'true' : 'false');
const surface = document.importNode(productionSurface, true);
root.append(surface);
document.body.append(root);
document.documentElement.style.width = `${width}px`;
document.documentElement.style.height = `${height}px`;
document.body.style.width = `${width}px`;
document.body.style.height = `${height}px`;

function renderReview() {
  const title = surface.querySelector('#boot-title');
  const status = surface.querySelector('#boot-status');
  const retry = surface.querySelector('#boot-retry');
  surface.hidden = false;
  surface.dataset.stage = 'presentation';
  if (scene === 'boot-failure-review') {
    surface.dataset.state = 'error';
    title.textContent = BOOT_FAILURE_TITLE;
    status.textContent = BOOT_FAILURE_COPY.presentation;
    retry.hidden = false;
    retry.disabled = false;
  } else {
    const copy = BOOT_STAGE_COPY.presentation;
    surface.dataset.state = 'loading';
    title.textContent = copy.title;
    status.textContent = copy.status;
    retry.hidden = true;
    retry.disabled = true;
  }
}

renderReview();
globalThis.__harness = Object.freeze({
  renderAt: async () => {
    renderReview();
    return Object.freeze({ scene, width, height });
  },
});
globalThis.__ready = true;
