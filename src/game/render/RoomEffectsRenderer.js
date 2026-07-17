import { WORLD } from '../config.js';
import { drawLearningFeather } from './LearningRenderer.js';

const MASK_SCALE = 0.5;
const MASK_WIDTH = Math.round(WORLD.width * MASK_SCALE);
const MASK_HEIGHT = Math.round(WORLD.height * MASK_SCALE);

export class RoomEffectsRenderer {
  constructor({ canvasFactory = defaultCanvasFactory } = {}) {
    this.canvasFactory = canvasFactory;
    this.lightMaskCanvas = null;
    this.lightMaskContext = null;
  }

  drawLightMask(context, lightMask, {
    cameraX = 0,
    reducedMotion = false,
    time = 0,
  } = {}) {
    const darkness = clamp01(lightMask?.darkness ?? 0);
    if (darkness <= 0) return Object.freeze({ darkness: 0, lights: Object.freeze([]) });
    const lights = normalizeLights(lightMask?.lights);
    const mask = this.ensureLightMask();
    if (!mask) return null;
    const maskContext = this.lightMaskContext;
    maskContext.save();
    maskContext.setTransform(1, 0, 0, 1, 0, 0);
    maskContext.clearRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    maskContext.globalCompositeOperation = 'source-over';
    maskContext.fillStyle = `rgba(21,25,57,${0.28 + darkness * 0.64})`;
    maskContext.fillRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    maskContext.globalCompositeOperation = 'destination-out';
    for (const light of lights) {
      const x = (light.x - cameraX) * MASK_SCALE;
      const y = light.y * MASK_SCALE;
      const radius = light.radius * MASK_SCALE;
      const gradient = maskContext.createRadialGradient(x, y, radius * 0.12, x, y, radius);
      const strength = clamp01(light.intensity);
      gradient.addColorStop(0, `rgba(0,0,0,${strength})`);
      gradient.addColorStop(0.52, `rgba(0,0,0,${strength * 0.82})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      maskContext.fillStyle = gradient;
      maskContext.beginPath();
      maskContext.arc(x, y, radius, 0, Math.PI * 2);
      maskContext.fill();
    }
    maskContext.restore();

    context.save();
    context.imageSmoothingEnabled = true;
    context.drawImage(mask, 0, 0, MASK_WIDTH, MASK_HEIGHT, 0, 0, WORLD.width, WORLD.height);
    drawLightGlows(context, lights, cameraX, time, reducedMotion);
    context.restore();
    return Object.freeze({ darkness, lights: Object.freeze(lights) });
  }

  drawFeather(context, feather, time = 0, {
    reducedMotion = false,
    x = WORLD.width / 2,
    y = 470,
  } = {}) {
    if (!feather) return null;
    const lift = clamp01(feather.lift ?? 0);
    drawLearningFeather(context, lift, time, { reducedMotion, x, y });
    if (lift > 0.82) drawFeatherRibbons(context, x, y, lift, time, reducedMotion);
    return Object.freeze({ lift, stage: feather.stage ?? null, x, y });
  }

  destroy() {
    this.lightMaskCanvas = null;
    this.lightMaskContext = null;
  }

  ensureLightMask() {
    if (this.lightMaskCanvas && this.lightMaskContext) return this.lightMaskCanvas;
    const canvas = this.canvasFactory(MASK_WIDTH, MASK_HEIGHT);
    const context = canvas?.getContext?.('2d');
    if (!canvas || !context) return null;
    canvas.width = MASK_WIDTH;
    canvas.height = MASK_HEIGHT;
    this.lightMaskCanvas = canvas;
    this.lightMaskContext = context;
    return canvas;
  }
}

function normalizeLights(lights) {
  if (!Array.isArray(lights)) return [];
  return lights.filter((light) => (
    light
    && Number.isFinite(light.x)
    && Number.isFinite(light.y)
    && Number.isFinite(light.radius)
    && light.radius > 0
  )).map((light) => Object.freeze({
    targetId: typeof light.targetId === 'string' ? light.targetId : null,
    x: light.x,
    y: light.y,
    radius: light.radius,
    intensity: clamp01(light.intensity ?? 1),
  }));
}

function drawLightGlows(context, lights, cameraX, time, reducedMotion) {
  context.save();
  context.globalCompositeOperation = 'screen';
  for (const [index, light] of lights.entries()) {
    const x = light.x - cameraX;
    const pulse = reducedMotion ? 1 : 0.94 + Math.sin(Math.max(0, time) * 2.4 + index) * 0.06;
    const radius = light.radius * pulse;
    const gradient = context.createRadialGradient(x, light.y, 0, x, light.y, radius);
    gradient.addColorStop(0, `rgba(255,243,201,${0.2 + light.intensity * 0.18})`);
    gradient.addColorStop(0.45, `rgba(255,210,104,${light.intensity * 0.09})`);
    gradient.addColorStop(1, 'rgba(255,210,104,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, light.y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawFeatherRibbons(context, x, y, lift, time, reducedMotion) {
  const phase = reducedMotion ? 0 : Math.max(0, time);
  context.save();
  context.strokeStyle = `rgba(255,215,106,${0.28 + lift * 0.36})`;
  context.lineWidth = 5;
  context.lineCap = 'round';
  for (let index = 0; index < 3; index += 1) {
    const direction = index % 2 === 0 ? -1 : 1;
    const offset = (index - 1) * 38;
    const sway = reducedMotion ? 0 : Math.sin(phase * 2.1 + index * 1.7) * 18;
    context.beginPath();
    context.moveTo(x + offset, y - lift * 112);
    context.bezierCurveTo(
      x + offset + direction * (45 + sway),
      y - lift * 168,
      x - offset * 0.4 - direction * 56,
      y - lift * 224,
      x + direction * (112 + index * 18),
      y - lift * 278,
    );
    context.stroke();
  }
  context.restore();
}

function defaultCanvasFactory(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return null;
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

export const LIGHT_MASK_RESOLUTION = Object.freeze({
  width: MASK_WIDTH,
  height: MASK_HEIGHT,
  scale: MASK_SCALE,
});
