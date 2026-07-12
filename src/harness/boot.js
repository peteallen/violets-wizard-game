import '../style.css';
import { Game } from '../game/Game.js';

const params = new URLSearchParams(location.search);
const [width, height] = (params.get('size') ?? '640x360').split('x').map(Number);
const dpr = Number(params.get('dpr') ?? 1);
const frame = Number(params.get('frame') ?? Math.round(Number(params.get('t') ?? 0) * 60));
const canvas = document.querySelector('#game');

canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

const game = new Game(canvas, { harness: true, width, height, dpr });
game.start();
game.stepTo(frame / 60);

window.__harness = {
  describe: () => ({ scene: params.get('scene') ?? 'foundation', frame, width, height, dpr }),
  renderAt: async ({ frame: nextFrame }) => {
    game.stepTo(nextFrame / 60);
    return window.__harness.describe();
  },
  snapshot: () => canvas.toDataURL('image/png'),
  eventLog: () => [],
};
window.__ready = true;
window.__snapshot = window.__harness.snapshot;
window.__renderAt = (time) => game.stepTo(time);
