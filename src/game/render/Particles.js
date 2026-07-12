import { EFFECTS } from '../config.js';

const PRESETS = Object.freeze({
  sparkle: { life: 1.1, speed: 90, gravity: -8, size: 7, color: '#ffd76a', shape: 'star' },
  dust: { life: 1.4, speed: 55, gravity: -18, size: 10, color: '#d4b88c', shape: 'circle' },
  paper: { life: 2, speed: 100, gravity: 65, size: 12, color: '#f0e3c8', shape: 'diamond' },
  heart: { life: 1.4, speed: 55, gravity: -30, size: 13, color: '#f19ab3', shape: 'heart' },
  confetti: { life: 2.2, speed: 140, gravity: 95, size: 10, color: '#7a4fc9', shape: 'diamond' },
});

export class Particles {
  constructor(random, { reducedMotion = false } = {}) {
    this.random = random;
    this.reducedMotion = reducedMotion;
    this.items = [];
  }

  emit(kind, x, y, count = 12, overrides = {}) {
    const preset = { ...(PRESETS[kind] ?? PRESETS.sparkle), ...overrides };
    const cap = this.reducedMotion ? EFFECTS.reducedParticleCap : EFFECTS.particleCap;
    const allowed = Math.min(count, Math.max(0, cap - this.items.length));
    for (let index = 0; index < allowed; index += 1) {
      const angle = this.random.range(0, Math.PI * 2);
      const speed = this.random.range(preset.speed * 0.35, preset.speed);
      this.items.push({
        kind,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: this.random.range(preset.life * 0.75, preset.life * 1.2),
        gravity: preset.gravity,
        size: this.random.range(preset.size * 0.65, preset.size * 1.25),
        rotation: this.random.range(0, Math.PI * 2),
        spin: this.random.range(-4, 4),
        color: Array.isArray(preset.color) ? this.random.pick(preset.color) : preset.color,
        shape: preset.shape,
      });
    }
  }

  update(dt) {
    for (const item of this.items) {
      item.age += dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy += item.gravity * dt;
      item.rotation += item.spin * dt;
    }
    this.items = this.items.filter((item) => item.age < item.life);
  }

  clear() {
    this.items.length = 0;
  }

  draw(context) {
    for (const item of this.items) {
      const alpha = Math.max(0, 1 - item.age / item.life);
      context.save();
      context.translate(item.x, item.y);
      context.rotate(item.rotation);
      context.globalAlpha = alpha;
      context.fillStyle = item.color;
      drawShape(context, item.shape, item.size);
      context.restore();
    }
  }
}

function drawShape(context, shape, size) {
  if (shape === 'star') {
    context.beginPath();
    for (let index = 0; index < 8; index += 1) {
      const radius = index % 2 === 0 ? size : size * 0.3;
      const angle = -Math.PI / 2 + index * Math.PI / 4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    return;
  }
  if (shape === 'diamond') {
    context.beginPath();
    context.moveTo(0, -size);
    context.lineTo(size * 0.7, 0);
    context.lineTo(0, size);
    context.lineTo(-size * 0.7, 0);
    context.closePath();
    context.fill();
    return;
  }
  if (shape === 'heart') {
    context.beginPath();
    context.moveTo(0, size * 0.8);
    context.bezierCurveTo(-size * 1.2, 0, -size, -size * 0.8, 0, -size * 0.15);
    context.bezierCurveTo(size, -size * 0.8, size * 1.2, 0, 0, size * 0.8);
    context.fill();
    return;
  }
  context.beginPath();
  context.arc(0, 0, size, 0, Math.PI * 2);
  context.fill();
}
