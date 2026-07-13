import { easeInOutCubic, easeOutBack, easeOutCubic, lerp } from '../core/math.js';
import { PALETTE, WORLD } from '../config.js';
import { drawVectorOwl, sampleOwlDelivery } from './OwlRenderer.js';

export const BRICK_GRID = Object.freeze({
  x: 278,
  y: 60,
  width: 840,
  height: 528,
  columns: 10,
  rows: 8,
});

const BRICK_IMAGE_KEYS = Object.freeze([
  'rooms/ch1/courtyard/base',
  'rooms/ch1/diagon/day',
]);

const VASE_ORIGIN = Object.freeze({ x: 1045, y: 358 });
const VASE_SHARDS = Object.freeze([
  { points: [[-37, -43], [-8, -51], [-12, -5], [-45, 7]], offset: [-18, -22], vx: -70, vy: -285, spin: -5.2, color: '#6f6aa1' },
  { points: [[-8, -51], [26, -43], [18, -2], [-12, -5]], offset: [8, -23], vx: 76, vy: -315, spin: 4.4, color: '#8b7db2' },
  { points: [[26, -43], [42, 2], [13, 12], [18, -2]], offset: [28, -8], vx: 118, vy: -185, spin: 6.1, color: '#665e91' },
  { points: [[-45, 7], [-12, -5], [-8, 32], [-31, 47]], offset: [-26, 20], vx: -94, vy: -120, spin: -6.8, color: '#8275aa' },
  { points: [[-12, -5], [13, 12], [10, 48], [-8, 32]], offset: [1, 20], vx: 16, vy: -220, spin: 3.2, color: '#5e5989' },
  { points: [[13, 12], [42, 2], [31, 44], [10, 48]], offset: [27, 25], vx: 106, vy: -85, spin: 5.7, color: '#9485ba' },
  { points: [[-31, 47], [-8, 32], [10, 48], [24, 57], [-25, 58]], offset: [-2, 47], vx: -28, vy: -48, spin: -3.9, color: '#746b9e' },
]);

export class SetPieceRenderer {
  constructor({
    resolveAsset = () => null,
    imageFactory = defaultImageFactory,
  } = {}) {
    this.resolveAsset = resolveAsset;
    this.imageFactory = imageFactory;
    this.imageRecords = new Map();
    this.brickWallWasActive = false;
  }

  draw(context, active, worldState, { reducedMotion = false } = {}) {
    if (!active) {
      if (this.brickWallWasActive) this.releaseImages(BRICK_IMAGE_KEYS);
      this.brickWallWasActive = false;
      return;
    }
    const id = String(active.requestedId ?? active.id ?? '');
    const normalized = id.toLowerCase();
    if (normalized.includes('letter')) this.drawLetter(context, active, { reducedMotion });
    else if (normalized.includes('brick')) {
      this.brickWallWasActive = true;
      this.drawBrickWall(context, active, { reducedMotion });
    }
    else if (normalized.includes('wandchaos') || normalized.includes('wand-chaos')) {
      this.drawWandChaos(context, active, { reducedMotion });
    } else if (normalized.includes('wandchosen') || normalized.includes('wand-chosen')) {
      this.drawWandChosen(context, active, worldState, { reducedMotion });
    } else if (normalized.includes('ticket')) this.drawTicket(context, active, { reducedMotion });
  }

  async preloadBrickWall() {
    await Promise.all(BRICK_IMAGE_KEYS.map((key) => this.loadImage(key)));
  }

  async loadImage(key) {
    const current = this.imageRecords.get(key);
    if (current) return current.promise;
    const path = this.resolveAsset(key);
    const image = path ? this.imageFactory() : null;
    if (!image) return null;
    const record = { image, ready: false, promise: null };
    record.promise = (async () => {
      try {
        image.decoding = 'async';
        image.src = path;
        if (typeof image.decode === 'function') await image.decode();
        record.ready = Boolean(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
        return record.ready ? image : null;
      } catch {
        return null;
      }
    })();
    this.imageRecords.set(key, record);
    return record.promise;
  }

  readyImage(key) {
    const record = this.imageRecords.get(key);
    if (record?.ready) return record.image;
    void this.loadImage(key);
    return null;
  }

  destroy() {
    this.releaseImages([...this.imageRecords.keys()]);
    this.brickWallWasActive = false;
  }

  releaseImages(keys) {
    for (const key of keys) {
      const record = this.imageRecords.get(key);
      if (!record) continue;
      try {
        record.image.src = '';
      } catch {
        // A test image adapter may expose a read-only src.
      }
      this.imageRecords.delete(key);
    }
  }

  drawLetter(context, active, { reducedMotion = false } = {}) {
    const variant = active.params?.variant ?? active.descriptor?.params?.variant;
    const id = String(active.requestedId ?? active.id ?? '').toLowerCase();
    if (variant === 'open-invitation' || id.includes('letteropen')) {
      this.drawLetterOpen(context, active, { reducedMotion });
      return;
    }
    this.drawLetterDelivery(context, active, { reducedMotion });
  }

  drawLetterDelivery(context, active, { reducedMotion = false } = {}) {
    const t = active.time;
    const progress = t / active.descriptor.duration;
    const delivery = sampleOwlDelivery(t, { reducedMotion });
    context.fillStyle = 'rgba(20,17,38,0.24)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    if (delivery.owl.opacity > 0) {
      drawVectorOwl(context, {
        ...delivery.owl,
        variant: 'post',
        facing: 'left',
        reducedMotion,
        lookX: -0.25,
        lookY: 0.2,
      }, t);
    }

    const focus = easeOutBack(clamp01((t - 2.18) / 1.25));
    const scale = delivery.letter.scale * (1 + focus * 0.34);
    context.save();
    context.translate(delivery.letter.x, delivery.letter.y);
    context.rotate(delivery.letter.rotation);
    context.scale(scale, scale);
    drawDeliveryEnvelope(context, progress, { reducedMotion });
    context.restore();
  }

  drawLetterOpen(context, active, { reducedMotion = false } = {}) {
    const state = letterOpenState(active.time, { reducedMotion });
    context.fillStyle = `rgba(20,17,38,${0.34 + state.push * 0.12})`;
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    if (state.closedOpacity > 0.01) {
      context.save();
      context.globalAlpha = state.closedOpacity;
      context.translate(640, 376);
      context.scale(0.92, 0.92);
      drawOpeningEnvelopeBack(context, state);
      context.restore();
    }

    if (state.paperOpacity > 0.01) {
      context.save();
      context.globalAlpha = state.paperOpacity;
      context.translate(640, 340 + (1 - state.paperRise) * 92);
      context.scale(state.scale, state.scale);
      drawInvitation(context, state);
      context.restore();
    }

    if (state.closedOpacity > 0.01) {
      context.save();
      context.globalAlpha = state.closedOpacity;
      context.translate(640, 376);
      context.scale(0.92, 0.92);
      drawOpeningEnvelopeFront(context, state);
      context.restore();
    }
  }

  drawBrickWall(context, active, { reducedMotion = false } = {}) {
    const t = active.time;
    const reveal = this.readyImage('rooms/ch1/diagon/day');
    const courtyard = this.readyImage('rooms/ch1/courtyard/base');

    if (reducedMotion) {
      const fade = easeInOutCubic(clamp01((t - 0.25) / 1.45));
      context.save();
      context.globalAlpha = fade;
      drawStreetReveal(context, reveal, 0);
      context.restore();
      return;
    }

    const states = [];
    for (let row = 0; row < BRICK_GRID.rows; row += 1) {
      for (let column = 0; column < BRICK_GRID.columns; column += 1) {
        states.push(brickTileState(row, column, t));
      }
    }

    const opening = states.filter((state) => state.progress > 0.001);
    if (opening.length) {
      context.save();
      context.beginPath();
      for (const state of opening) {
        context.rect(state.x - 1, state.y - 1, state.width + 2, state.height + 2);
      }
      context.clip();
      drawStreetReveal(context, reveal, 0);
      context.restore();
    }

    const shivering = t >= 0.4 && t < 0.8;
    if (shivering) {
      for (const state of states) this.drawBrickTile(context, state, t, courtyard, { shiver: true });
    } else {
      for (const state of states) {
        if (state.progress <= 0 || state.progress >= 1) continue;
        this.drawBrickTile(context, state, t, courtyard);
        drawBrickDust(context, state);
      }
    }

    const push = easeInOutCubic(clamp01((t - 2.35) / 1.25));
    if (push > 0) {
      const x = lerp(BRICK_GRID.x, 0, push);
      const y = lerp(BRICK_GRID.y, 0, push);
      const width = lerp(BRICK_GRID.width, WORLD.width, push);
      const height = lerp(BRICK_GRID.height, WORLD.height, push);
      context.save();
      context.beginPath();
      context.rect(x, y, width, height);
      context.clip();
      drawStreetReveal(context, reveal, (1 - push) * 0.06);
      context.restore();
      context.fillStyle = `rgba(255,221,142,${Math.sin(push * Math.PI) * 0.13})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
  }

  drawBrickTile(context, state, t, courtyardImage, { shiver = false } = {}) {
    const jitterX = shiver ? Math.sin(t * 48 + state.index * 1.7) * 2 : 0;
    const jitterY = shiver ? Math.cos(t * 43 + state.index * 2.3) * 1.5 : 0;
    context.save();
    context.translate(state.centerX + state.offsetX + jitterX, state.centerY + state.offsetY + jitterY);
    context.rotate(state.rotation);
    context.scale(1.012, 1.012);
    context.globalAlpha = state.alpha;
    if (courtyardImage) {
      const source = brickTileSourceRect(courtyardImage, state);
      context.drawImage(
        courtyardImage,
        source.x,
        source.y,
        source.width,
        source.height,
        -state.width / 2 - 3,
        -state.height / 2 - 3,
        state.width + 6,
        state.height + 6,
      );
    } else {
      context.fillStyle = state.fallbackColor;
      roundRect(context, -state.width / 2 - 1, -state.height / 2 - 1, state.width + 2, state.height + 2, 7);
      context.fill();
      context.strokeStyle = 'rgba(84,47,39,0.72)';
      context.lineWidth = 3;
      context.stroke();
    }
    context.restore();
  }

  drawWandChaos(context, active, { reducedMotion = false } = {}) {
    const id = String(active.requestedId ?? active.id ?? '').toLowerCase();
    const variant = active.params?.variant ?? active.descriptor?.params?.variant;
    if (variant === 'golden-choice' || id.includes('chosen')) {
      this.drawWandChosen(context, active, null, { reducedMotion });
      return;
    }
    if (variant === 'vase') {
      this.drawVaseChaos(context, active, { reducedMotion });
      return;
    }
    drawPaperChaos(context, active.time, active.descriptor.duration, { reducedMotion });
  }

  drawVaseChaos(context, active, { reducedMotion = false } = {}) {
    const t = active.time;
    const breakTime = 1.05;
    const anticipation = clamp01(t / breakTime);
    const bolt = easeOutCubic(clamp01((t - 0.45) / 0.5));

    if (!reducedMotion && bolt > 0 && t < breakTime + 0.12) {
      context.save();
      context.globalAlpha = 1 - clamp01((t - breakTime) / 0.12);
      context.strokeStyle = '#d8b0ff';
      context.lineWidth = 9;
      context.beginPath();
      context.moveTo(860, 474);
      context.bezierCurveTo(930, 430, 975, 410, VASE_ORIGIN.x - 10, VASE_ORIGIN.y - 18);
      context.stroke();
      context.strokeStyle = '#fff5c8';
      context.lineWidth = 3;
      context.stroke();
      context.restore();
    }

    if (t < breakTime) {
      const wobble = reducedMotion ? 0 : Math.sin(anticipation * Math.PI * 8) * anticipation * 0.12;
      context.save();
      context.translate(VASE_ORIGIN.x, VASE_ORIGIN.y);
      context.rotate(wobble);
      context.translate(0, Math.abs(wobble) * -18);
      drawVase(context);
      context.restore();
      return;
    }

    const impact = reducedMotion ? 0 : clamp01((t - breakTime) / 0.18);
    if (impact > 0 && impact < 1) {
      context.fillStyle = `rgba(244,218,255,${Math.sin(impact * Math.PI) * 0.32})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    for (let index = 0; index < VASE_SHARDS.length; index += 1) {
      const pose = vaseShardPose(index, t, { reducedMotion });
      drawVaseShard(context, VASE_SHARDS[index], pose);
    }
    drawShardPlinks(context, t, { reducedMotion });
  }

  drawWandChosen(context, active, _worldState, { reducedMotion = false } = {}) {
    const state = wandChosenState(active.time, active.descriptor.duration, { reducedMotion });
    const tip = { x: 744, y: 278 };

    if (state.anticipation > 0 && state.burst < 1) {
      context.fillStyle = `rgba(25,20,45,${(1 - state.burst) * 0.22})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    context.save();
    context.globalCompositeOperation = 'screen';
    context.fillStyle = `rgba(255,210,92,${state.washAlpha})`;
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.restore();

    context.save();
    context.translate(tip.x, tip.y);
    context.scale(state.cameraScale, state.cameraScale);
    drawGoldenRays(context, state);
    drawGoldenRings(context, state);
    drawGoldenColumn(context, active.time, state, { reducedMotion });
    context.restore();

    drawChosenWand(context, state);
    drawGoldenRibbons(context, state);

    if (state.crescendo > 0.15) {
      context.save();
      context.textAlign = 'center';
      context.globalAlpha = Math.min(1, state.crescendo * 1.3) * (1 - state.settle * 0.45);
      context.fillStyle = '#fff2b0';
      context.font = '700 24px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('THE WAND CHOOSES VIOLET', 640, 116);
      context.restore();
    }
  }

  drawTicket(context, active, { reducedMotion = false } = {}) {
    const state = ticketPresentationState(active.time, active.descriptor.duration, { reducedMotion });
    context.fillStyle = 'rgba(20,17,38,0.42)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    context.translate(640, 360 + state.bob);
    context.scale(state.scale, state.scale);
    context.rotate(reducedMotion ? 0 : -0.018 * (1 - state.settled));

    context.save();
    context.translate(10, 14);
    context.fillStyle = 'rgba(20,17,38,0.35)';
    ticketPath(context);
    context.fill();
    context.restore();

    context.fillStyle = '#e7c979';
    ticketPath(context);
    context.fill();
    context.strokeStyle = '#5d3d2e';
    context.lineWidth = 8;
    context.stroke();
    context.strokeStyle = 'rgba(255,244,181,0.72)';
    context.lineWidth = 3;
    roundRect(context, -278, -122, 556, 244, 17);
    context.stroke();

    context.strokeStyle = 'rgba(93,61,46,0.55)';
    context.lineWidth = 3;
    context.setLineDash([10, 9]);
    context.beginPath();
    context.moveTo(-176, -116);
    context.lineTo(-176, 116);
    context.stroke();
    context.setLineDash([]);

    drawTicketOwl(context, -228, 0);
    context.fillStyle = '#4e3428';
    context.textAlign = 'center';
    context.font = '700 35px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('HOGWARTS EXPRESS', 45, -66);
    context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('LONDON  →  HOGWARTS', 45, -25);
    context.font = '700 56px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('PLATFORM 9 ¾', 45, 39);
    context.font = '700 18px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('1 SEPTEMBER · ELEVEN O’CLOCK', 45, 76);
    context.fillStyle = '#70425c';
    context.font = '700 16px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('A PREVIEW OF CHAPTER TWO', 45, 105);
    context.restore();
  }
}

export function letterOpenState(time, { reducedMotion = false } = {}) {
  const t = Math.max(0, time);
  if (reducedMotion) {
    const invitation = easeInOutCubic(clamp01((t - 0.35) / 0.8));
    return Object.freeze({
      sealCrack: t >= 0.2 ? 1 : 0,
      sealPart: 0,
      flap: 0,
      paperRise: 1,
      foldTop: 1,
      foldBottom: 1,
      push: 0,
      scale: 1.03,
      closedOpacity: 1 - invitation,
      paperOpacity: invitation,
      reducedMotion: true,
    });
  }
  const sealCrack = easeOutCubic(clamp01((t - 0.18) / 0.34));
  const sealPart = easeOutCubic(clamp01((t - 0.52) / 0.42));
  const flap = easeInOutCubic(clamp01((t - 0.76) / 0.58));
  const paperRise = easeOutBack(clamp01((t - 1.08) / 0.82));
  const foldTop = easeInOutCubic(clamp01((t - 1.62) / 0.72));
  const foldBottom = easeInOutCubic(clamp01((t - 2.12) / 0.78));
  const push = easeInOutCubic(clamp01((t - 2.9) / 1.25));
  return Object.freeze({
    sealCrack,
    sealPart,
    flap,
    paperRise,
    foldTop,
    foldBottom,
    push,
    scale: lerp(0.7, 1.03, push),
    closedOpacity: 1 - easeInOutCubic(clamp01((t - 2.28) / 0.92)),
    paperOpacity: easeInOutCubic(clamp01((t - 1.04) / 0.32)),
    reducedMotion: false,
  });
}

export function brickTileState(row, column, time) {
  const width = BRICK_GRID.width / BRICK_GRID.columns;
  const height = BRICK_GRID.height / BRICK_GRID.rows;
  const x = BRICK_GRID.x + column * width;
  const y = BRICK_GRID.y + row * height;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const gridX = column - (BRICK_GRID.columns - 1) / 2;
  const gridY = row - (BRICK_GRID.rows - 1) / 2;
  const gridDistance = Math.hypot(gridX, gridY);
  const delay = 0.8 + gridDistance * 0.06;
  const linearProgress = clamp01((time - delay) / 1.0);
  const progress = easeInOutCubic(linearProgress);
  const distance = Math.max(0.001, Math.hypot(centerX - 700, centerY - 330));
  const directionX = (centerX - 700) / distance;
  const directionY = (centerY - 330) / distance;
  const travel = 125 + gridDistance * 17;
  return Object.freeze({
    index: row * BRICK_GRID.columns + column,
    row,
    column,
    x,
    y,
    width,
    height,
    centerX,
    centerY,
    delay,
    progress,
    offsetX: directionX * progress * travel,
    offsetY: directionY * progress * travel * 0.58 - Math.sin(progress * Math.PI) * 24,
    rotation: directionX * progress * (0.42 + (row % 3) * 0.08),
    alpha: linearProgress >= 0.999999 ? 0 : 1 - clamp01((linearProgress - 0.8) / 0.2),
    fallbackColor: ['#8d5144', '#9b5b4a', '#74463f'][(row + column) % 3],
  });
}

export function brickTileSourceRect(image, state) {
  const source = coverSourceRect(image, WORLD.width / WORLD.height);
  const gutterX = (3 / WORLD.width) * source.width;
  const gutterY = (3 / WORLD.height) * source.height;
  return Object.freeze({
    x: source.x + (state.x / WORLD.width) * source.width - gutterX,
    y: source.y + (state.y / WORLD.height) * source.height - gutterY,
    width: (state.width / WORLD.width) * source.width + gutterX * 2,
    height: (state.height / WORLD.height) * source.height + gutterY * 2,
  });
}

export function vaseShardPose(index, time, { reducedMotion = false } = {}) {
  const shard = VASE_SHARDS[index];
  if (!shard) throw new RangeError(`Unknown vase shard ${index}.`);
  const elapsed = reducedMotion ? 1.55 : Math.max(0, time - 1.05);
  const gravity = 900;
  const baseX = VASE_ORIGIN.x + shard.offset[0];
  const baseY = VASE_ORIGIN.y + shard.offset[1];
  const floor = 574 - (index % 3) * 5;
  const discriminant = Math.max(0, shard.vy ** 2 - 2 * gravity * (baseY - floor));
  const hitTime = Math.max(0, (-shard.vy + Math.sqrt(discriminant)) / gravity);
  let x;
  let y;
  let rotation;
  let settled = false;
  if (elapsed <= hitTime) {
    x = baseX + shard.vx * elapsed;
    y = baseY + shard.vy * elapsed + 0.5 * gravity * elapsed ** 2;
    rotation = shard.spin * elapsed;
  } else {
    const afterHit = elapsed - hitTime;
    const impactVelocity = shard.vy + gravity * hitTime;
    const bounceVelocity = -Math.abs(impactVelocity) * 0.17;
    const bounceDuration = Math.max(0, -2 * bounceVelocity / gravity);
    const bounceTime = Math.min(afterHit, bounceDuration);
    x = baseX + shard.vx * (hitTime + bounceTime * 0.32);
    y = floor + bounceVelocity * bounceTime + 0.5 * gravity * bounceTime ** 2;
    rotation = shard.spin * (hitTime + bounceTime * 0.45);
    if (afterHit >= bounceDuration) {
      y = floor;
      settled = true;
    }
  }
  return Object.freeze({
    x: Math.max(28, Math.min(WORLD.width - 28, x)),
    y: Math.max(40, Math.min(WORLD.height - 30, y)),
    rotation,
    settled,
  });
}

export function wandChosenState(time, duration = 3, { reducedMotion = false } = {}) {
  const t = Math.max(0, Math.min(duration, time));
  const anticipation = easeOutCubic(clamp01(t / 0.48));
  const burst = easeOutCubic(clamp01((t - 0.36) / 0.58));
  const crescendo = easeInOutCubic(clamp01((t - 0.72) / 1.05));
  const settle = easeInOutCubic(clamp01((t - 2.2) / Math.max(0.1, duration - 2.2)));
  const envelope = Math.sin(clamp01(t / duration) * Math.PI);
  return Object.freeze({
    anticipation,
    burst,
    crescendo,
    settle,
    washAlpha: Math.min(0.58, envelope * (0.22 + crescendo * 0.44)),
    cameraScale: reducedMotion ? 1 : 1 + easeOutCubic(clamp01((t - 0.3) / 2.4)) * 0.06,
    wandGlow: Math.min(1, 0.25 + burst * 0.5 + crescendo * 0.4),
    reducedMotion,
  });
}

export function ticketPresentationState(time, duration = 4, { reducedMotion = false } = {}) {
  const settled = time <= 0 ? 0 : easeOutBack(clamp01(time / Math.max(0.1, duration * 0.28)));
  return Object.freeze({
    settled,
    scale: reducedMotion ? clamp01(time / 0.35) : settled,
    bob: reducedMotion ? 0 : Math.sin(time * 2.2) * 8 * clamp01(settled),
  });
}

function drawOpeningEnvelopeBack(context, state) {
  context.fillStyle = '#f2dfb6';
  context.strokeStyle = '#6c4b36';
  context.lineWidth = 6;
  roundRect(context, -190, -105, 380, 210, 18);
  context.fill();
  context.stroke();

  const flapTipY = lerp(-4, -176, state.flap);
  context.fillStyle = '#ead5ab';
  context.beginPath();
  context.moveTo(-184, -98);
  context.lineTo(184, -98);
  context.lineTo(0, flapTipY);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawOpeningEnvelopeFront(context, state) {
  context.fillStyle = '#dfc696';
  context.strokeStyle = '#6c4b36';
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-184, 98);
  context.lineTo(-184, -12);
  context.lineTo(0, 38);
  context.lineTo(184, -12);
  context.lineTo(184, 98);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = 'rgba(108,75,54,0.42)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-178, 92);
  context.lineTo(0, -8);
  context.lineTo(178, 92);
  context.stroke();

  const sealSeparation = state.sealPart * 34;
  context.save();
  context.translate(-sealSeparation, 30 - state.sealPart * 13);
  drawSealHalf(context, 'left', state.sealCrack);
  context.restore();
  context.save();
  context.translate(sealSeparation, 30 + state.sealPart * 10);
  drawSealHalf(context, 'right', state.sealCrack);
  context.restore();

  if (state.sealPart > 0 && !state.reducedMotion) {
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6 + 0.2;
      const radius = state.sealPart * (34 + (index % 3) * 13);
      drawStar(context, Math.cos(angle) * radius, 30 + Math.sin(angle) * radius, 4 + (index % 2) * 2, '#ffd76a', 1 - state.sealPart * 0.55);
    }
  }
}

function drawSealHalf(context, side, crack) {
  context.fillStyle = '#8d2f47';
  context.strokeStyle = '#542237';
  context.lineWidth = 3;
  context.beginPath();
  if (side === 'left') {
    context.arc(0, 0, 34, Math.PI / 2, Math.PI * 1.5);
    context.lineTo(2 + crack * 8, -13);
    context.lineTo(-4 - crack * 4, -2);
    context.lineTo(4 + crack * 7, 10);
  } else {
    context.arc(0, 0, 34, -Math.PI / 2, Math.PI / 2);
    context.lineTo(-2 - crack * 8, 13);
    context.lineTo(4 + crack * 4, 2);
    context.lineTo(-4 - crack * 7, -10);
  }
  context.closePath();
  context.fill();
  context.stroke();
}

function drawInvitation(context, state) {
  const width = 650;
  const centerHeight = 150;
  const topHeight = 138 * state.foldTop;
  const bottomHeight = 142 * state.foldBottom;
  const top = -centerHeight / 2 - topHeight;
  const topInset = (1 - state.foldTop) * 84;
  const bottomInset = (1 - state.foldBottom) * 84;

  context.save();
  context.fillStyle = 'rgba(24,16,28,0.34)';
  traceInvitation(context, width + 16, centerHeight, topHeight, bottomHeight, topInset, bottomInset, 10, 12);
  context.fill();
  context.restore();

  context.fillStyle = '#f4e7c6';
  context.strokeStyle = '#72543b';
  context.lineWidth = 5;
  traceInvitation(context, width, centerHeight, topHeight, bottomHeight, topInset, bottomInset);
  context.fill();
  context.stroke();

  context.save();
  traceInvitation(context, width - 14, centerHeight - 14, Math.max(0, topHeight - 7), Math.max(0, bottomHeight - 7), topInset, bottomInset, 0, 0);
  context.clip();
  context.strokeStyle = 'rgba(121,83,52,0.055)';
  context.lineWidth = 1;
  for (let index = 0; index < 18; index += 1) {
    const y = top + 14 + index * 23;
    context.beginPath();
    context.moveTo(-304 + Math.sin(index * 1.7) * 7, y);
    context.bezierCurveTo(-120, y + 2, 115, y - 3, 304 - Math.cos(index * 1.3) * 6, y + 1);
    context.stroke();
  }
  context.restore();

  if (state.foldTop < 0.98 && topHeight > 1) {
    context.fillStyle = `rgba(118,78,48,${(1 - state.foldTop) * 0.18})`;
    context.beginPath();
    context.moveTo(-width / 2, -centerHeight / 2);
    context.lineTo(-width / 2 + topInset, top);
    context.lineTo(width / 2 - topInset, top);
    context.lineTo(width / 2, -centerHeight / 2);
    context.closePath();
    context.fill();
  }
  if (state.foldBottom < 0.98 && bottomHeight > 1) {
    context.fillStyle = `rgba(255,252,226,${(1 - state.foldBottom) * 0.28})`;
    context.beginPath();
    context.moveTo(-width / 2, centerHeight / 2);
    context.lineTo(width / 2, centerHeight / 2);
    context.lineTo(width / 2 - bottomInset, centerHeight / 2 + bottomHeight);
    context.lineTo(-width / 2 + bottomInset, centerHeight / 2 + bottomHeight);
    context.closePath();
    context.fill();
  }

  context.strokeStyle = 'rgba(126,86,51,0.34)';
  context.lineWidth = 2;
  context.beginPath();
  if (state.foldTop > 0.02) {
    context.moveTo(-306, -75);
    context.lineTo(306, -75);
  }
  if (state.foldBottom > 0.02) {
    context.moveTo(-306, 75);
    context.lineTo(306, 75);
  }
  context.stroke();

  const centerReadable = clamp01((state.paperRise - 0.3) / 0.5);
  const topReadable = clamp01((state.foldTop - 0.42) / 0.48);
  const bottomReadable = clamp01((state.foldBottom - 0.42) / 0.48);
  context.save();
  context.globalAlpha *= topReadable;
  drawInvitationOwlCrest(context, 0, -158);
  context.fillStyle = '#4d342b';
  context.textAlign = 'center';
  context.font = '700 28px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('HOGWARTS SCHOOL', 0, -111);
  context.font = '700 17px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('OF WITCHCRAFT AND WIZARDRY', 0, -84);
  context.restore();

  context.save();
  context.globalAlpha *= centerReadable;
  context.fillStyle = '#4d342b';
  context.textAlign = 'left';
  context.font = '700 31px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('Dear Violet,', -270, -25);
  context.font = '700 23px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('We are delighted to offer you a place', -270, 21);
  context.fillText('at Hogwarts. Term begins 1 September.', -270, 55);
  context.restore();

  context.save();
  context.globalAlpha *= bottomReadable;
  context.fillStyle = '#4d342b';
  context.textAlign = 'left';
  context.font = '700 23px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('Bring this letter — and your owl post.', -270, 105);
  context.textAlign = 'right';
  context.font = '700 21px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('We await your owl.', 270, 157);
  context.restore();
}

function traceInvitation(context, width, centerHeight, topHeight, bottomHeight, topInset, bottomInset, xOffset = 0, yOffset = 0) {
  const halfWidth = width / 2;
  const halfCenter = centerHeight / 2;
  const cut = 7;
  context.beginPath();
  context.moveTo(-halfWidth + xOffset, -halfCenter + cut + yOffset);
  if (topHeight > 0.5) {
    context.lineTo(-halfWidth + topInset + xOffset, -halfCenter - topHeight + cut + yOffset);
    context.lineTo(-halfWidth + topInset + cut + xOffset, -halfCenter - topHeight + yOffset);
    context.lineTo(halfWidth - topInset - cut + xOffset, -halfCenter - topHeight + yOffset);
    context.lineTo(halfWidth - topInset + xOffset, -halfCenter - topHeight + cut + yOffset);
  } else {
    context.lineTo(-halfWidth + cut + xOffset, -halfCenter + yOffset);
    context.lineTo(halfWidth - cut + xOffset, -halfCenter + yOffset);
  }
  context.lineTo(halfWidth + xOffset, -halfCenter + cut + yOffset);
  context.lineTo(halfWidth + xOffset, halfCenter + yOffset);
  if (bottomHeight > 0.5) {
    context.lineTo(halfWidth - bottomInset + xOffset, halfCenter + bottomHeight - cut + yOffset);
    context.lineTo(halfWidth - bottomInset - cut + xOffset, halfCenter + bottomHeight + yOffset);
    context.lineTo(-halfWidth + bottomInset + cut + xOffset, halfCenter + bottomHeight + yOffset);
    context.lineTo(-halfWidth + bottomInset + xOffset, halfCenter + bottomHeight - cut + yOffset);
  } else {
    context.lineTo(halfWidth - cut + xOffset, halfCenter + yOffset);
    context.lineTo(-halfWidth + cut + xOffset, halfCenter + yOffset);
  }
  context.lineTo(-halfWidth + xOffset, halfCenter - cut + yOffset);
  context.closePath();
}

export function drawReadableInvitation(context, { x = 640, y = 340, scale = 1.03 } = {}) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  drawInvitation(context, {
    paperRise: 1,
    foldTop: 1,
    foldBottom: 1,
  });
  context.restore();
}

function deckledPanel(context, x, y, width, height, radius) {
  roundRect(context, x, y, width, Math.max(1, height), Math.min(radius, Math.max(0.5, height / 2)));
}

function drawInvitationOwlCrest(context, x, y) {
  context.save();
  context.translate(x, y);
  context.fillStyle = '#7a2940';
  context.beginPath();
  context.moveTo(-25, 12);
  context.quadraticCurveTo(-31, -12, -13, -25);
  context.lineTo(-4, -11);
  context.lineTo(0, -29);
  context.lineTo(5, -11);
  context.lineTo(14, -25);
  context.quadraticCurveTo(32, -12, 25, 12);
  context.quadraticCurveTo(20, 30, 0, 34);
  context.quadraticCurveTo(-20, 30, -25, 12);
  context.fill();
  context.strokeStyle = '#542237';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = '#f4d58d';
  context.beginPath();
  context.ellipse(-10, 1, 8, 10, -0.2, 0, Math.PI * 2);
  context.ellipse(10, 1, 8, 10, 0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#542237';
  context.beginPath();
  context.arc(-9, 1, 3.2, 0, Math.PI * 2);
  context.arc(9, 1, 3.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f4d58d';
  context.beginPath();
  context.moveTo(-4, 11);
  context.lineTo(0, 17);
  context.lineTo(4, 11);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(244,213,141,0.72)';
  context.lineWidth = 2;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * 9, 17);
    context.quadraticCurveTo(side * 15, 22, side * 13, 29);
    context.stroke();
  }
  context.restore();
}

function drawStreetReveal(context, image, zoom = 0) {
  if (image) {
    const scale = 1 + zoom;
    const width = WORLD.width * scale;
    const height = WORLD.height * scale;
    drawImageCover(context, image, (WORLD.width - width) / 2, (WORLD.height - height) / 2, width, height);
    return;
  }
  context.fillStyle = '#315d73';
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.fillStyle = '#d49a4b';
  for (let index = 0; index < 9; index += 1) {
    const x = index * 160 - 40;
    const height = 350 + (index % 3) * 55;
    context.fillStyle = ['#774d4d', '#41616b', '#715b3f'][index % 3];
    context.fillRect(x, 590 - height, 142, height);
    context.fillStyle = '#f0c775';
    context.fillRect(x + 30, 590 - height + 70, 36, 48);
    context.fillRect(x + 83, 590 - height + 70, 36, 48);
  }
  context.fillStyle = '#6e604e';
  context.fillRect(0, 590, WORLD.width, 130);
}

function drawBrickDust(context, state) {
  const dust = Math.sin(clamp01(state.progress / 0.58) * Math.PI);
  if (dust <= 0) return;
  for (let index = 0; index < 3; index += 1) {
    const angle = state.index * 1.91 + index * 2.1;
    const radius = 12 + state.progress * (18 + index * 8);
    context.globalAlpha = dust * (0.34 + index * 0.08);
    context.fillStyle = index % 2 ? '#d4b88c' : '#a98868';
    context.beginPath();
    context.arc(
      state.centerX + Math.cos(angle) * radius,
      state.centerY + Math.sin(angle) * radius,
      3 + index * 1.4,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawPaperChaos(context, time, duration, { reducedMotion = false } = {}) {
  for (let index = 0; index < 16; index += 1) {
    const delay = index * 0.035;
    const progress = clamp01((time - delay) / Math.max(0.1, duration - delay));
    if (progress <= 0) continue;
    const swirl = reducedMotion ? 0 : Math.sin(progress * Math.PI) * (120 + index * 9);
    const x = 660 + Math.cos(index * 2.1) * swirl;
    const y = lerp(370, 584 - (index % 4) * 5, easeInOutCubic(progress)) + Math.sin(index * 1.7) * Math.sin(progress * Math.PI) * 110;
    context.save();
    context.translate(x, y);
    context.rotate(reducedMotion ? 0 : index + progress * 7);
    context.globalAlpha = progress > 0.92 ? 1 - (progress - 0.92) / 0.08 : 1;
    context.fillStyle = index % 2 ? PALETTE.parchment : '#d9c5a2';
    context.fillRect(-20, -14, 40, 28);
    context.strokeStyle = '#8b7152';
    context.lineWidth = 2;
    context.strokeRect(-20, -14, 40, 28);
    context.restore();
  }
}

function drawVase(context) {
  context.fillStyle = '#7e72aa';
  context.strokeStyle = '#403958';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-22, -55);
  context.lineTo(22, -55);
  context.lineTo(19, -36);
  context.bezierCurveTo(48, -17, 44, 38, 24, 57);
  context.quadraticCurveTo(0, 70, -24, 57);
  context.bezierCurveTo(-44, 38, -48, -17, -19, -36);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#a99bc7';
  context.beginPath();
  context.ellipse(0, -54, 23, 8, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = '#d3b86e';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-34, 1);
  context.bezierCurveTo(-12, -14, 12, 18, 35, 0);
  context.moveTo(-30, 27);
  context.bezierCurveTo(-8, 12, 10, 44, 31, 26);
  context.stroke();
}

function drawVaseShard(context, shard, pose) {
  context.save();
  context.translate(pose.x, pose.y);
  context.rotate(pose.rotation);
  context.fillStyle = shard.color;
  context.strokeStyle = '#403958';
  context.lineWidth = 3;
  context.beginPath();
  shard.points.forEach(([x, y], index) => {
    const localX = x - shard.offset[0];
    const localY = y - shard.offset[1];
    if (index === 0) context.moveTo(localX, localY);
    else context.lineTo(localX, localY);
  });
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawShardPlinks(context, time, { reducedMotion = false } = {}) {
  if (reducedMotion) return;
  const progress = clamp01((time - 1.05) / 0.55);
  if (progress <= 0 || progress >= 1) return;
  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.399;
    const radius = progress * (42 + index * 5);
    drawStar(context, VASE_ORIGIN.x + Math.cos(angle) * radius, VASE_ORIGIN.y + Math.sin(angle) * radius, 4 + index % 3, '#f5d978', 1 - progress);
  }
}

function drawGoldenRays(context, state) {
  const reach = 80 + state.crescendo * 430;
  context.save();
  context.globalAlpha = state.burst * (1 - state.settle * 0.65);
  for (let index = 0; index < 18; index += 1) {
    const angle = index * Math.PI / 9 + 0.08;
    const inner = 35 + (index % 3) * 8;
    const outer = reach * (0.58 + (index % 4) * 0.11);
    context.fillStyle = index % 2 ? 'rgba(255,232,141,0.18)' : 'rgba(255,195,73,0.13)';
    context.beginPath();
    context.moveTo(Math.cos(angle - 0.025) * inner, Math.sin(angle - 0.025) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.lineTo(Math.cos(angle + 0.025) * inner, Math.sin(angle + 0.025) * inner);
    context.closePath();
    context.fill();
  }
  context.restore();
}

function drawGoldenRings(context, state) {
  context.save();
  context.globalAlpha = state.burst * (1 - state.settle * 0.72);
  for (let index = 0; index < 3; index += 1) {
    const radius = 68 + state.crescendo * (105 + index * 65);
    context.strokeStyle = index === 1 ? '#fff0ad' : '#e8b44f';
    context.lineWidth = 5 - index;
    context.beginPath();
    context.ellipse(0, 0, radius, radius * (0.42 + index * 0.06), index * 0.55, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function drawGoldenColumn(context, time, state, { reducedMotion = false } = {}) {
  const count = reducedMotion ? 22 : 44;
  for (let index = 0; index < count; index += 1) {
    const phase = reducedMotion ? (index * 0.173) % 1 : (index * 0.173 + time * (0.18 + (index % 4) * 0.018)) % 1;
    const y = lerp(260, -350, phase);
    const radius = 30 + ((index * 47) % 190) * state.crescendo;
    const x = Math.sin(index * 2.7 + phase * 7) * radius;
    const alpha = Math.sin(phase * Math.PI) * state.wandGlow * (1 - state.settle * 0.55);
    drawStar(context, x, y, 3 + index % 4, index % 3 ? '#ffd76a' : '#fff4c1', alpha);
  }
}

function drawChosenWand(context, state) {
  context.save();
  context.translate(640, 382);
  context.rotate(-0.75);
  context.globalAlpha = 0.82 + state.wandGlow * 0.18;
  context.strokeStyle = '#3d251e';
  context.lineWidth = 16;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(-118, 0);
  context.quadraticCurveTo(-8, -5, 152, 0);
  context.stroke();
  context.strokeStyle = '#8a5635';
  context.lineWidth = 9;
  context.stroke();
  context.strokeStyle = '#d39b54';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-105, -3);
  context.quadraticCurveTo(20, -6, 143, -3);
  context.stroke();
  context.fillStyle = '#5b3427';
  roundRect(context, -148, -16, 56, 32, 14);
  context.fill();
  context.strokeStyle = '#c28a47';
  context.lineWidth = 3;
  for (let x = -139; x < -97; x += 10) {
    context.beginPath();
    context.moveTo(x, -11);
    context.lineTo(x + 7, 11);
    context.stroke();
  }
  context.restore();
  drawStar(context, 744, 278, 18 + state.crescendo * 9, '#fff7cf', state.wandGlow);
  drawStar(context, 744, 278, 36 + state.crescendo * 22, '#ffd76a', state.wandGlow * 0.46);
}

function drawGoldenRibbons(context, state) {
  context.save();
  context.globalAlpha = state.crescendo * (1 - state.settle * 0.7);
  context.strokeStyle = '#ffe696';
  context.lineWidth = 6;
  for (let index = 0; index < 3; index += 1) {
    context.beginPath();
    context.moveTo(744, 278);
    context.bezierCurveTo(
      625 - index * 90,
      170 + index * 110,
      480 + index * 280,
      520 - index * 90,
      250 + index * 390,
      190 + index * 100,
    );
    context.stroke();
  }
  context.restore();
}

function ticketPath(context) {
  context.beginPath();
  context.moveTo(-282, -134);
  context.lineTo(282, -134);
  context.quadraticCurveTo(296, -134, 296, -120);
  context.lineTo(296, -38);
  context.arc(296, 0, 38, -Math.PI / 2, Math.PI / 2, true);
  context.lineTo(296, 120);
  context.quadraticCurveTo(296, 134, 282, 134);
  context.lineTo(-282, 134);
  context.quadraticCurveTo(-296, 134, -296, 120);
  context.lineTo(-296, 38);
  context.arc(-296, 0, 38, Math.PI / 2, -Math.PI / 2, true);
  context.lineTo(-296, -120);
  context.quadraticCurveTo(-296, -134, -282, -134);
  context.closePath();
}

function drawTicketOwl(context, x, y) {
  context.save();
  context.translate(x, y);
  context.fillStyle = 'rgba(93,61,46,0.19)';
  context.beginPath();
  context.moveTo(-34, 13);
  context.quadraticCurveTo(-40, -22, -18, -47);
  context.lineTo(-3, -26);
  context.lineTo(0, -53);
  context.lineTo(5, -26);
  context.lineTo(20, -47);
  context.quadraticCurveTo(41, -22, 34, 13);
  context.quadraticCurveTo(27, 52, 0, 58);
  context.quadraticCurveTo(-27, 52, -34, 13);
  context.fill();
  context.fillStyle = '#694737';
  context.beginPath();
  context.arc(-13, -7, 6, 0, Math.PI * 2);
  context.arc(13, -7, 6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#d39b54';
  context.beginPath();
  context.moveTo(-6, 4);
  context.lineTo(0, 13);
  context.lineTo(6, 4);
  context.closePath();
  context.fill();
  context.restore();
}

function drawDeliveryEnvelope(context, progress, { reducedMotion = false } = {}) {
  context.fillStyle = PALETTE.parchment;
  context.strokeStyle = '#72543b';
  context.lineWidth = 6;
  roundRect(context, -180, -105, 360, 210, 18);
  context.fill();
  context.stroke();

  context.fillStyle = 'rgba(205,169,105,0.2)';
  context.beginPath();
  context.moveTo(-174, 95);
  context.lineTo(0, -8);
  context.lineTo(174, 95);
  context.closePath();
  context.fill();

  context.strokeStyle = '#8e704c';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-175, -98);
  context.lineTo(0, 25);
  context.lineTo(175, -98);
  context.moveTo(-174, 96);
  context.lineTo(-34, 15);
  context.moveTo(174, 96);
  context.lineTo(34, 15);
  context.stroke();

  context.fillStyle = '#7a2940';
  context.beginPath();
  for (let index = 0; index < 16; index += 1) {
    const angle = index * Math.PI / 8;
    const radius = index % 2 === 0 ? 35 : 30;
    const x = Math.cos(angle) * radius;
    const y = 34 + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
  context.strokeStyle = '#4e2630';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = PALETTE.candle;
  context.textAlign = 'center';
  context.font = '700 52px "Andika", "Trebuchet MS", sans-serif';
  context.globalAlpha = deliveryLetteringAlpha(progress, { reducedMotion });
  context.fillText('VIOLET', 0, -25);
  context.globalAlpha = 1;
  context.fillStyle = '#f1d898';
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('✦', 0, 44);
}

export function deliveryLetteringAlpha(progress, { reducedMotion = false } = {}) {
  return reducedMotion ? 0.9 : 0.82 + Math.sin(progress * Math.PI * 8) * 0.14;
}

function drawStar(context, x, y, size, color, alpha = 1) {
  if (alpha <= 0) return;
  context.save();
  context.translate(x, y);
  context.globalAlpha *= alpha;
  context.fillStyle = color;
  context.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const radius = index % 2 === 0 ? size : size * 0.28;
    const angle = -Math.PI / 2 + index * Math.PI / 4;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function drawImageCover(context, image, x, y, width, height) {
  const source = coverSourceRect(image, width / height);
  context.drawImage(image, source.x, source.y, source.width, source.height, x, y, width, height);
}

function coverSourceRect(image, destinationAspect) {
  const imageAspect = image.naturalWidth / image.naturalHeight;
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  if (imageAspect > destinationAspect) width = image.naturalHeight * destinationAspect;
  else height = image.naturalWidth / destinationAspect;
  return {
    x: (image.naturalWidth - width) / 2,
    y: (image.naturalHeight - height) / 2,
    width,
    height,
  };
}

function defaultImageFactory() {
  return typeof globalThis.Image === 'function' ? new globalThis.Image() : null;
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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
