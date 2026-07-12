import { PALETTE, WORLD } from './config.js';
import { clamp } from './core/math.js';

export class Game {
  constructor(canvas, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Game requires a canvas element.');
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    if (!this.context) throw new Error('Canvas 2D is unavailable.');

    this.harness = Boolean(options.harness);
    this.running = false;
    this.destroyed = false;
    this.accumulator = 0;
    this.simTime = 0;
    this.lastFrame = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;
    this.pointer = null;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.boundResize = () => this.resize();
    this.boundFrame = (time) => this.frame(time);
    this.boundPointerDown = (event) => this.onPointerDown(event);
    this.boundPointerUp = (event) => this.onPointerUp(event);
    this.boundVisibility = () => {
      this.lastFrame = null;
    };

    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibility);
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    canvas.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('pointercancel', this.boundPointerUp);
    this.resize(options.width, options.height, options.dpr);
  }

  start() {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.render();
    if (!this.harness) requestAnimationFrame(this.boundFrame);
  }

  frame(timestamp) {
    if (!this.running || this.destroyed) return;
    if (document.hidden) {
      this.lastFrame = timestamp;
      requestAnimationFrame(this.boundFrame);
      return;
    }

    const elapsed = this.lastFrame === null ? 0 : clamp((timestamp - this.lastFrame) / 1000, 0, WORLD.maxFrameSeconds);
    this.lastFrame = timestamp;
    this.accumulator += elapsed;

    while (this.accumulator >= WORLD.step) {
      this.update(WORLD.step);
      this.accumulator -= WORLD.step;
    }

    this.render();
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    this.simTime += dt;
  }

  stepTo(seconds) {
    if (seconds < this.simTime) {
      this.simTime = 0;
      this.accumulator = 0;
    }
    while (this.simTime + WORLD.step <= seconds + 1e-9) this.update(WORLD.step);
    this.render();
  }

  resize(forcedWidth, forcedHeight, forcedDpr) {
    const cssWidth = forcedWidth ?? this.canvas.clientWidth ?? window.innerWidth;
    const cssHeight = forcedHeight ?? this.canvas.clientHeight ?? window.innerHeight;
    this.dpr = clamp(forcedDpr ?? window.devicePixelRatio ?? 1, 1, WORLD.maxDpr);
    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);
    const fit = Math.min(cssWidth / WORLD.width, cssHeight / WORLD.height);
    this.scale = fit;
    this.offsetX = (cssWidth - WORLD.width * fit) / 2;
    this.offsetY = (cssHeight - WORLD.height * fit) / 2;
    this.render();
  }

  toWorld(event) {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;
    return {
      x: (cssX - this.offsetX) / this.scale,
      y: (cssY - this.offsetY) / this.scale,
    };
  }

  onPointerDown(event) {
    if (this.pointer !== null) return;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.pointer = { id: event.pointerId, point: this.toWorld(event) };
  }

  onPointerUp(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    const point = this.toWorld(event);
    this.pointer = null;
    this.handleTap(point);
  }

  handleTap() {
    const status = document.querySelector('#game-status');
    if (status) status.textContent = 'The adventure is ready to begin.';
  }

  withWorldTransform(draw) {
    const context = this.context;
    context.save();
    context.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, this.dpr * this.offsetX, this.dpr * this.offsetY);
    draw(context);
    context.restore();
  }

  render() {
    if (this.destroyed || !this.context) return;
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.ink;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.withWorldTransform((ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
      gradient.addColorStop(0, PALETTE.night);
      gradient.addColorStop(0.62, PALETTE.twilight);
      gradient.addColorStop(1, PALETTE.ink);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);

      const pulse = this.reducedMotion ? 1 : 0.92 + Math.sin(this.simTime * 2) * 0.08;
      ctx.save();
      ctx.translate(WORLD.width / 2, 214);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = PALETTE.candle;
      for (let ray = 0; ray < 12; ray += 1) {
        ctx.rotate(Math.PI / 6);
        ctx.fillRect(-2, -70, 4, 30);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.parchment;
      ctx.font = '700 64px "Trebuchet MS", sans-serif';
      ctx.fillText("Violet's Wizard Game", WORLD.width / 2, 350);
      ctx.fillStyle = PALETTE.honey;
      ctx.font = '32px "Trebuchet MS", sans-serif';
      ctx.fillText('A storybook adventure is taking shape…', WORLD.width / 2, 410);

      ctx.fillStyle = PALETTE.oak;
      roundRect(ctx, WORLD.width / 2 - 170, 490, 340, 96, 34);
      ctx.fill();
      ctx.strokeStyle = PALETTE.interactive;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = PALETTE.parchment;
      ctx.font = '700 34px "Trebuchet MS", sans-serif';
      ctx.fillText('Tap for magic', WORLD.width / 2, 551);
    });
  }

  destroy() {
    this.running = false;
    this.destroyed = true;
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundPointerUp);
  }
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}
