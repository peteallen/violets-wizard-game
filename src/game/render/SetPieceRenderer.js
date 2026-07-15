import { easeInOutCubic, easeOutBack, easeOutCubic, lerp } from '../core/math.js';
import { PALETTE, WORLD } from '../config.js';
import { chapter1LetterLines } from '../content/chapters/ch1-letter.js';
import {
  LETTER_ENVELOPE_POSE,
  LETTER_READING_POSE,
  drawClosedLetterEnvelope,
  drawLetterEnvelopeBack,
  drawLetterEnvelopeFront,
  envelopeWorldBounds,
} from './LetterRenderer.js';

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

// The owl follows this scene-owned flight path; the character package owns
// only how the canonical post-owl identity looks at each requested pose.
function sampleLetterDelivery(time, { reducedMotion = false } = {}) {
  const t = Math.max(0, time);
  if (reducedMotion) {
    const settle = easeOutCubic(clamp01(t / 1.15));
    return Object.freeze({
      owl: Object.freeze({
        x: lerp(1060, 980, settle),
        y: lerp(290, 275, settle),
        rotation: -0.025 * settle,
        scale: 1.04,
        opacity: 1 - clamp01((t - 1.3) / 0.5),
        pose: t < 0.35 ? 'takeoff' : 'settle',
      }),
      letter: Object.freeze({
        x: lerp(925, LETTER_ENVELOPE_POSE.x, easeInOutCubic(clamp01((t - 0.35) / 1.45))),
        y: lerp(310, LETTER_ENVELOPE_POSE.y, easeOutCubic(clamp01((t - 0.35) / 1.45))),
        rotation: lerp(-0.04, LETTER_ENVELOPE_POSE.rotation, clamp01(t / 1.8)),
        scale: lerp(0.34, LETTER_ENVELOPE_POSE.scale, easeOutCubic(clamp01((t - 0.35) / 1.45))),
      }),
    });
  }

  const launchStart = 0.16;
  const releaseAt = 1.16;
  let owlX = 1060;
  let owlY = 290;
  let owlRotation = 0;
  let owlPose = 'takeoff';
  let owlOpacity = 1;
  if (t >= launchStart && t < releaseAt) {
    const progress = easeInOutCubic((t - launchStart) / (releaseAt - launchStart));
    owlX = cubicBezier(1060, 1015, 860, 780, progress);
    owlY = cubicBezier(290, 180, 205, 275, progress);
    owlRotation = lerp(-0.12, 0.08, progress);
    owlPose = 'delivery';
  } else if (t >= releaseAt) {
    const progress = clamp01((t - releaseAt) / 0.95);
    owlX = cubicBezier(780, 900, 1110, 1225, progress);
    owlY = cubicBezier(275, 185, 125, 70, progress);
    owlRotation = lerp(0.08, -0.16, progress);
    owlPose = 'flight';
    owlOpacity = 1 - clamp01((progress - 0.72) / 0.28);
  }

  let letterX;
  let letterY;
  let letterRotation;
  let letterScale;
  if (t < releaseAt) {
    letterX = owlX - 4;
    letterY = owlY + 45;
    letterRotation = owlRotation * 0.35;
    letterScale = 0.3;
  } else {
    const progress = easeOutCubic(clamp01((t - releaseAt) / 1.05));
    letterX = lerp(776, LETTER_ENVELOPE_POSE.x, progress)
      + Math.sin(progress * Math.PI * 2) * (1 - progress) * 18;
    letterY = cubicBezier(320, 300, 270, LETTER_ENVELOPE_POSE.y, progress);
    letterRotation = LETTER_ENVELOPE_POSE.rotation
      + Math.sin(progress * Math.PI * 2.4) * (1 - progress) * 0.12;
    letterScale = lerp(0.3, LETTER_ENVELOPE_POSE.scale, progress);
  }

  return Object.freeze({
    owl: Object.freeze({
      x: owlX,
      y: owlY,
      rotation: owlRotation,
      scale: 1.04,
      opacity: owlOpacity,
      pose: owlPose,
    }),
    letter: Object.freeze({
      x: letterX,
      y: letterY,
      rotation: letterRotation,
      scale: letterScale,
    }),
  });
}

function cubicBezier(a, b, c, d, time) {
  const inverse = 1 - time;
  return inverse ** 3 * a
    + 3 * inverse ** 2 * time * b
    + 3 * inverse * time ** 2 * c
    + time ** 3 * d;
}

export class SetPieceRenderer {
  constructor({
    resolveAsset = () => null,
    imageFactory = defaultImageFactory,
    characterRenderer,
  } = {}) {
    this.resolveAsset = resolveAsset;
    this.imageFactory = imageFactory;
    this.characterRenderer = requireCharacterRenderer(characterRenderer);
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
    if (normalized.includes('letter')) {
      this.drawLetter(context, active, {
        reducedMotion,
        lightSide: worldState?.keyLight,
      });
    }
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

  drawLetter(context, active, { reducedMotion = false, lightSide = 'left' } = {}) {
    const variant = active.params?.variant ?? active.descriptor?.params?.variant;
    const id = String(active.requestedId ?? active.id ?? '').toLowerCase();
    if (variant === 'open-invitation' || id.includes('letteropen')) {
      this.drawLetterOpen(context, active, { reducedMotion });
      return;
    }
    this.drawLetterDelivery(context, active, { reducedMotion, lightSide });
  }

  drawLetterDelivery(context, active, { reducedMotion = false, lightSide = 'left' } = {}) {
    const t = active.time;
    const delivery = sampleLetterDelivery(t, { reducedMotion });
    context.fillStyle = 'rgba(20,17,38,0.16)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    if (delivery.owl.opacity > 0) {
      this.characterRenderer.draw(context, {
        ...delivery.owl,
        characterId: 'character.post-owl',
        surface: 'world',
        appearance: 'post',
        facing: 'left',
        lightSide: lightSide === 'right' ? 'right' : 'left',
        reducedMotion,
        lookX: -0.25,
        lookY: 0.2,
      }, t);
    }

    context.save();
    context.translate(delivery.letter.x, delivery.letter.y);
    context.rotate(delivery.letter.rotation);
    context.scale(delivery.letter.scale, delivery.letter.scale);
    drawClosedLetterEnvelope(context, { time: t, reducedMotion });
    context.restore();
  }

  drawLetterOpen(context, active, { reducedMotion = false } = {}) {
    const state = letterOpenState(active.time, { reducedMotion });
    context.fillStyle = `rgba(20,17,38,${0.2 + state.push * 0.18})`;
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    if (state.showEnvelope) {
      context.save();
      context.translate(state.envelopeX, state.envelopeY);
      context.rotate(state.envelopeRotation);
      context.scale(state.envelopeScale, state.envelopeScale);
      drawLetterEnvelopeBack(context, state);
      context.restore();
    }

    if (state.paperRise > 0.001) {
      context.save();
      context.translate(state.paperX, state.paperY);
      context.scale(state.paperScale, state.paperScale);
      drawInvitation(context, state);
      context.restore();
    }

    if (state.showEnvelope && state.frontInFront) {
      context.save();
      context.translate(state.envelopeX, state.envelopeY);
      context.rotate(state.envelopeRotation);
      context.scale(state.envelopeScale, state.envelopeScale);
      drawLetterEnvelopeFront(context, state);
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

    const states = brickTileStates(t);
    drawStreetReveal(context, reveal, 0);

    const shivering = t >= 0.4 && t < 0.8;
    if (shivering) {
      for (const state of states) this.drawBrickTile(context, state, t, courtyard, { shiver: true });
    } else {
      for (const state of states) {
        if (state.progress >= 1) continue;
        this.drawBrickTile(context, state, t, courtyard);
        if (state.progress > 0 && state.index % 3 === 0) drawBrickDust(context, state);
      }
    }
  }

  drawBrickWallCover(context, active, { reducedMotion = false } = {}) {
    if (!active || reducedMotion) return;
    const id = String(active.requestedId ?? active.id ?? '').toLowerCase();
    if (!id.includes('brick')) return;
    const progress = easeInOutCubic(clamp01((active.time - 1.45) / 0.7));
    if (progress <= 0) return;
    const reveal = this.readyImage('rooms/ch1/diagon/day');
    context.save();
    context.beginPath();
    appendBrickPortal(context, progress);
    context.clip();
    drawStreetReveal(context, reveal, 0);
    context.restore();
    const courtyard = this.readyImage('rooms/ch1/courtyard/base');
    for (const state of brickTileStates(active.time)) {
      if (state.progress <= 0 || state.progress >= 1) continue;
      this.drawBrickTile(context, state, active.time, courtyard);
    }
    context.fillStyle = `rgba(255,221,142,${Math.sin(progress * Math.PI) * 0.13})`;
    context.fillRect(0, 0, WORLD.width, WORLD.height);
  }

  drawBrickTile(context, state, t, courtyardImage, { shiver = false } = {}) {
    const jitterX = shiver ? Math.sin(t * 48 + state.index * 1.7) * 2 : 0;
    const jitterY = shiver ? Math.cos(t * 43 + state.index * 2.3) * 1.5 : 0;
    context.save();
    context.translate(state.centerX + state.offsetX + jitterX, state.centerY + state.offsetY + jitterY);
    context.rotate(state.rotation);
    context.scale(1.025, 1.025);
    context.globalAlpha = state.alpha;
    if (courtyardImage) {
      if (!shiver && state.progress > 0) {
        const face = brickTileFaceBounds(state);
        roundRect(
          context,
          face.x,
          face.y,
          face.width,
          face.height,
          8,
        );
        context.clip();
        const source = brickFaceSourceRect(courtyardImage, state);
        context.drawImage(
          courtyardImage,
          source.x,
          source.y,
          source.width,
          source.height,
          face.x,
          face.y,
          face.width,
          face.height,
        );
      } else {
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
      }
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
    drawTicketMaterialPlanes(context);
    context.strokeStyle = '#5d3d2e';
    context.lineWidth = 8;
    ticketPath(context);
    context.stroke();
    context.strokeStyle = 'rgba(255,244,181,0.72)';
    context.lineWidth = 3;
    ticketInsetPath(context);
    context.stroke();

    drawTicketPerforation(context);
    drawTicketRailVignette(context, -228, 1);
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
    context.restore();
  }
}

export function letterOpenState(time, { reducedMotion = false } = {}) {
  const t = Math.max(0, time);
  if (reducedMotion) {
    const invitation = t >= 0.48;
    return Object.freeze({
      sealCrack: t >= 0.2 ? 1 : 0,
      sealPart: 0,
      flap: 0,
      paperRise: invitation ? 1 : 0,
      foldTop: invitation ? 1 : 0,
      foldBottom: invitation ? 1 : 0,
      push: 0,
      envelopeX: LETTER_ENVELOPE_POSE.x,
      envelopeY: LETTER_ENVELOPE_POSE.y,
      envelopeScale: LETTER_ENVELOPE_POSE.scale,
      envelopeRotation: LETTER_ENVELOPE_POSE.rotation,
      paperX: LETTER_READING_POSE.x,
      paperY: LETTER_READING_POSE.y,
      paperScale: LETTER_READING_POSE.scale,
      showEnvelope: !invitation,
      frontInFront: !invitation,
      reducedMotion: true,
    });
  }
  const lift = easeInOutCubic(clamp01(t / 0.34));
  const sealCrack = easeOutCubic(clamp01((t - 0.28) / 0.34));
  const sealPart = easeOutCubic(clamp01((t - 0.62) / 0.34));
  const flap = easeInOutCubic(clamp01((t - 0.86) / 0.56));
  const paperRise = easeOutBack(clamp01((t - 1.16) / 0.7));
  const foldTop = easeInOutCubic(clamp01((t - 1.62) / 0.68));
  const foldBottom = easeInOutCubic(clamp01((t - 2.04) / 0.72));
  const push = easeInOutCubic(clamp01((t - 2.72) / 1.08));
  return Object.freeze({
    sealCrack,
    sealPart,
    flap,
    paperRise,
    foldTop,
    foldBottom,
    push,
    envelopeX: LETTER_ENVELOPE_POSE.x,
    envelopeY: lerp(LETTER_ENVELOPE_POSE.y, 220, lift),
    envelopeScale: lerp(LETTER_ENVELOPE_POSE.scale, 0.76, lift),
    envelopeRotation: lerp(LETTER_ENVELOPE_POSE.rotation, -0.01, lift),
    paperX: lerp(LETTER_ENVELOPE_POSE.x, LETTER_READING_POSE.x, push),
    paperY: lerp(404, LETTER_READING_POSE.y, paperRise),
    paperScale: lerp(0.56, LETTER_READING_POSE.scale, push),
    showEnvelope: t < 2.5,
    frontInFront: paperRise < 0.88,
    reducedMotion: false,
  });
}

export function letterOpeningBounds(state) {
  const envelope = state.showEnvelope
    ? envelopeWorldBounds({
        x: state.envelopeX,
        y: state.envelopeY,
        scale: state.envelopeScale,
        rotation: state.envelopeRotation,
      })
    : null;
  const paperHeight = 150 + 138 * state.foldTop + 142 * state.foldBottom;
  const paper = state.paperRise > 0
    ? Object.freeze({
        x: state.paperX - 325 * state.paperScale,
        y: state.paperY - paperHeight * state.paperScale / 2,
        width: 650 * state.paperScale,
        height: paperHeight * state.paperScale,
      })
    : null;
  return Object.freeze({ envelope, paper });
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
  const travel = 80 + gridDistance * 5;
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
    offsetY: directionY * progress * travel * 0.58 - Math.sin(progress * Math.PI) * 18,
    rotation: directionX * progress * (0.25 + (row % 3) * 0.04),
    alpha: linearProgress >= 0.97 ? 0 : 1,
    fallbackColor: ['#8d5144', '#9b5b4a', '#74463f'][(row + column) % 3],
  });
}

export function brickTileStates(time) {
  const states = [];
  for (let row = 0; row < BRICK_GRID.rows; row += 1) {
    for (let column = 0; column < BRICK_GRID.columns; column += 1) {
      const state = brickTileState(row, column, time);
      if (state) states.push(state);
    }
  }
  return Object.freeze(states);
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

const BRICK_FACE_SAMPLES = Object.freeze([
  { x: 375, y: 99, width: 52, height: 23 },
  { x: 432, y: 99, width: 54, height: 23 },
  { x: 491, y: 99, width: 52, height: 23 },
  { x: 549, y: 99, width: 52, height: 23 },
  { x: 606, y: 99, width: 51, height: 23 },
  { x: 662, y: 99, width: 53, height: 23 },
  { x: 719, y: 99, width: 53, height: 23 },
  { x: 776, y: 99, width: 53, height: 23 },
  { x: 833, y: 99, width: 54, height: 23 },
  { x: 891, y: 99, width: 53, height: 23 },
  { x: 948, y: 99, width: 53, height: 23 },
]);

export function brickTileFaceBounds(state) {
  const width = state.width * 0.84;
  const height = state.height * 0.48;
  return Object.freeze({
    x: -width / 2,
    y: -height / 2,
    width,
    height,
  });
}

export function brickFaceSourceRect(image, state) {
  const source = coverSourceRect(image, WORLD.width / WORLD.height);
  const sample = BRICK_FACE_SAMPLES[state.index % BRICK_FACE_SAMPLES.length];
  return Object.freeze({
    x: source.x + (sample.x / WORLD.width) * source.width,
    y: source.y + (sample.y / WORLD.height) * source.height,
    width: (sample.width / WORLD.width) * source.width,
    height: (sample.height / WORLD.height) * source.height,
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
    context.bezierCurveTo(-width / 2 + 4, top + 20, -width / 2 + topInset - 7, top + 4, -width / 2 + topInset, top);
    context.bezierCurveTo(-90, top - 3, 92, top + 3, width / 2 - topInset, top);
    context.bezierCurveTo(width / 2 - topInset + 8, top + 5, width / 2 - 4, -centerHeight / 2 - 18, width / 2, -centerHeight / 2);
    context.bezierCurveTo(108, -centerHeight / 2 + 4, -109, -centerHeight / 2 - 4, -width / 2, -centerHeight / 2);
    context.closePath();
    context.fill();
  }
  if (state.foldBottom < 0.98 && bottomHeight > 1) {
    context.fillStyle = `rgba(255,252,226,${(1 - state.foldBottom) * 0.28})`;
    context.beginPath();
    context.moveTo(-width / 2, centerHeight / 2);
    context.bezierCurveTo(-110, centerHeight / 2 - 4, 112, centerHeight / 2 + 4, width / 2, centerHeight / 2);
    context.bezierCurveTo(width / 2 - 3, centerHeight / 2 + bottomHeight - 18, width / 2 - bottomInset + 8, centerHeight / 2 + bottomHeight - 5, width / 2 - bottomInset, centerHeight / 2 + bottomHeight);
    context.bezierCurveTo(98, centerHeight / 2 + bottomHeight + 3, -100, centerHeight / 2 + bottomHeight - 3, -width / 2 + bottomInset, centerHeight / 2 + bottomHeight);
    context.bezierCurveTo(-width / 2 + bottomInset - 8, centerHeight / 2 + bottomHeight - 5, -width / 2 + 3, centerHeight / 2 + 18, -width / 2, centerHeight / 2);
    context.closePath();
    context.fill();
  }

  context.strokeStyle = 'rgba(126,86,51,0.34)';
  context.lineWidth = 2;
  context.beginPath();
  if (state.foldTop > 0.02) {
    context.moveTo(-306, -75);
    context.bezierCurveTo(-102, -78, 103, -72, 306, -75);
  }
  if (state.foldBottom > 0.02) {
    context.moveTo(-306, 75);
    context.bezierCurveTo(-104, 72, 101, 78, 306, 75);
  }
  context.stroke();

  const centerReadable = clamp01((state.paperRise - 0.3) / 0.5);
  const topReadable = clamp01((state.foldTop - 0.42) / 0.48);
  const bottomReadable = clamp01((state.foldBottom - 0.42) / 0.48);
  context.save();
  context.globalAlpha *= topReadable;
  drawInvitationOwlCrest(context, 0, -158);
  context.fillStyle = '#4d342b';
  context.textAlign = 'left';
  context.font = '700 28px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(chapter1LetterLines[0], -270, -97);
  context.restore();

  context.save();
  context.globalAlpha *= centerReadable;
  context.fillStyle = '#4d342b';
  context.textAlign = 'left';
  context.font = '700 23px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(chapter1LetterLines[1], -270, -38);
  context.fillText(chapter1LetterLines[2], -270, -2);
  context.fillText(chapter1LetterLines[3], -270, 49);
  context.restore();

  context.save();
  context.globalAlpha *= bottomReadable;
  context.fillStyle = '#4d342b';
  context.textAlign = 'left';
  context.font = '700 23px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(chapter1LetterLines[4], -270, 115);
  context.restore();
}

function traceInvitation(context, width, centerHeight, topHeight, bottomHeight, topInset, bottomInset, xOffset = 0, yOffset = 0) {
  const halfWidth = width / 2;
  const halfCenter = centerHeight / 2;
  const left = -halfWidth + xOffset;
  const right = halfWidth + xOffset;
  const topY = -halfCenter - topHeight + yOffset;
  const bottomY = halfCenter + bottomHeight + yOffset;
  const topLeft = left + (topHeight > 0.5 ? topInset : 7);
  const topRight = right - (topHeight > 0.5 ? topInset : 7);
  const bottomLeft = left + (bottomHeight > 0.5 ? bottomInset : 7);
  const bottomRight = right - (bottomHeight > 0.5 ? bottomInset : 7);
  context.beginPath();
  context.moveTo(left, -halfCenter + 8 + yOffset);
  context.bezierCurveTo(left - 3, -halfCenter - 17 + yOffset, topLeft - 8, topY + 10, topLeft, topY + 5);
  context.bezierCurveTo(topLeft + width * 0.24, topY - 4, topRight - width * 0.24, topY + 4, topRight, topY + 2);
  context.bezierCurveTo(topRight + 8, topY + 8, right + 3, -halfCenter - 13 + yOffset, right, -halfCenter + 9 + yOffset);
  context.bezierCurveTo(right + 4, -halfCenter * 0.2 + yOffset, right - 3, halfCenter * 0.35 + yOffset, right, halfCenter + yOffset);
  context.bezierCurveTo(right + 2, halfCenter + 18 + yOffset, bottomRight + 8, bottomY - 10, bottomRight, bottomY - 4);
  context.bezierCurveTo(bottomRight - width * 0.23, bottomY + 4, bottomLeft + width * 0.23, bottomY - 4, bottomLeft, bottomY);
  context.bezierCurveTo(bottomLeft - 8, bottomY - 8, left - 2, halfCenter + 15 + yOffset, left, halfCenter - 6 + yOffset);
  context.bezierCurveTo(left - 4, halfCenter * 0.34 + yOffset, left + 3, -halfCenter * 0.24 + yOffset, left, -halfCenter + 8 + yOffset);
  context.closePath();
}

export function drawReadableInvitation(context, {
  x = LETTER_READING_POSE.x,
  y = LETTER_READING_POSE.y,
  scale = LETTER_READING_POSE.scale,
} = {}) {
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
  context.fillStyle = 'rgba(84,34,55,0.22)';
  traceOrganicOval(context, 2, 5, 31, 34, 0.46);
  context.fill();
  drawInvitationOwlBookplate(context, 0, 0, 1.12, {
    color: '#7a2940',
    accent: '#f4d58d',
  });
  context.strokeStyle = 'rgba(255,235,179,0.55)';
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(-18, -19);
  context.bezierCurveTo(-13, -27, -7, -30, -1, -30);
  context.stroke();
  context.restore();
}

function drawInvitationOwlBookplate(
  context,
  x,
  y,
  scale = 1,
  { color = '#5e4634', accent = '#e8b44f' } = {},
) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = color;
  context.strokeStyle = accent;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(-22, -12);
  context.bezierCurveTo(-20, -20, -17, -29, -12, -27);
  context.quadraticCurveTo(0, -34, 14, -26);
  context.bezierCurveTo(18, -28, 21, -18, 22, -11);
  context.quadraticCurveTo(25, 8, 1, 25);
  context.quadraticCurveTo(-24, 9, -22, -12);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#fff8e8';
  traceInvitationOwlOval(context, -8, -9, 7.5, 9, 0.34);
  context.fill();
  traceInvitationOwlOval(context, 8, -9, 7.5, 9, -0.28);
  context.fill();
  context.fillStyle = '#241b18';
  traceInvitationOwlOval(context, -7, -8, 3, 3.2, -0.25);
  context.fill();
  traceInvitationOwlOval(context, 7, -8, 3, 3.2, 0.31);
  context.fill();
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(-3, 0);
  context.quadraticCurveTo(-1, 4, 0, 6);
  context.quadraticCurveTo(2, 3, 3, 0);
  context.quadraticCurveTo(0, 1, -3, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function traceInvitationOwlOval(
  context,
  centerX,
  centerY,
  radiusX,
  radiusY,
  asymmetry = 0,
) {
  const wobble = Math.max(-1, Math.min(1, asymmetry));
  context.beginPath();
  context.moveTo(centerX - radiusX * (1 + wobble * 0.025), centerY + radiusY * 0.04);
  context.bezierCurveTo(
    centerX - radiusX * 1.02,
    centerY - radiusY * (0.52 + wobble * 0.04),
    centerX - radiusX * (0.55 - wobble * 0.05),
    centerY - radiusY * (1.01 + wobble * 0.025),
    centerX + radiusX * (0.03 + wobble * 0.035),
    centerY - radiusY * (0.98 - wobble * 0.02),
  );
  context.bezierCurveTo(
    centerX + radiusX * (0.59 + wobble * 0.035),
    centerY - radiusY * (0.96 - wobble * 0.04),
    centerX + radiusX * (1 - wobble * 0.018),
    centerY - radiusY * 0.46,
    centerX + radiusX * (0.98 - wobble * 0.02),
    centerY + radiusY * (0.06 - wobble * 0.025),
  );
  context.bezierCurveTo(
    centerX + radiusX * 0.96,
    centerY + radiusY * (0.57 + wobble * 0.04),
    centerX + radiusX * (0.48 - wobble * 0.04),
    centerY + radiusY * (1 + wobble * 0.018),
    centerX - radiusX * (0.05 - wobble * 0.03),
    centerY + radiusY * (0.97 + wobble * 0.025),
  );
  context.bezierCurveTo(
    centerX - radiusX * (0.57 + wobble * 0.025),
    centerY + radiusY * (0.94 - wobble * 0.035),
    centerX - radiusX * 0.99,
    centerY + radiusY * 0.5,
    centerX - radiusX * (1 + wobble * 0.025),
    centerY + radiusY * 0.04,
  );
  context.closePath();
}

function appendBrickPortal(context, progress) {
  const x = lerp(BRICK_GRID.x - 24, -110, progress);
  const y = lerp(BRICK_GRID.y - 24, -90, progress);
  const right = lerp(BRICK_GRID.x + BRICK_GRID.width + 24, WORLD.width + 110, progress);
  const bottom = lerp(BRICK_GRID.y + BRICK_GRID.height + 24, WORLD.height + 90, progress);
  const width = right - x;
  const height = bottom - y;
  const wobble = 12 + progress * 22;

  context.moveTo(x - wobble, y + height * 0.5);
  context.bezierCurveTo(
    x - wobble * 0.8,
    y + height * 0.2,
    x - wobble * 0.45,
    y - wobble * 0.65,
    x + wobble,
    y - wobble,
  );
  context.bezierCurveTo(
    x + width * 0.28,
    y - wobble * 0.45,
    x + width * 0.68,
    y - wobble * 1.2,
    right - wobble * 0.55,
    y - wobble * 0.7,
  );
  context.bezierCurveTo(
    right + wobble * 0.7,
    y - wobble * 0.25,
    right + wobble,
    y + height * 0.28,
    right + wobble * 0.8,
    y + height * 0.52,
  );
  context.bezierCurveTo(
    right + wobble * 0.55,
    y + height * 0.78,
    right + wobble * 0.2,
    bottom + wobble * 0.45,
    right - wobble,
    bottom + wobble * 0.75,
  );
  context.bezierCurveTo(
    x + width * 0.7,
    bottom + wobble * 1.1,
    x + width * 0.3,
    bottom + wobble * 0.5,
    x + wobble * 0.4,
    bottom + wobble,
  );
  context.bezierCurveTo(
    x - wobble * 0.7,
    bottom + wobble * 0.35,
    x - wobble,
    y + height * 0.72,
    x - wobble,
    y + height * 0.5,
  );
  context.closePath();
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

function traceOrganicOval(context, x, y, radiusX, radiusY, phase = 0) {
  const lean = Math.sin(phase * 7.3 + 0.4) * 0.045;
  const lift = Math.cos(phase * 5.1 + 0.8) * 0.035;
  context.beginPath();
  context.moveTo(x + radiusX * (0.03 + lean), y - radiusY);
  context.bezierCurveTo(
    x + radiusX * 0.63,
    y - radiusY * (1.03 - lift),
    x + radiusX * (1.03 + lean),
    y - radiusY * 0.44,
    x + radiusX,
    y + radiusY * lift,
  );
  context.bezierCurveTo(
    x + radiusX * (0.98 - lean),
    y + radiusY * 0.64,
    x + radiusX * 0.43,
    y + radiusY * (1.03 + lift),
    x - radiusX * (0.03 - lean),
    y + radiusY,
  );
  context.bezierCurveTo(
    x - radiusX * 0.66,
    y + radiusY * (0.98 - lift),
    x - radiusX * (1.03 - lean),
    y + radiusY * 0.39,
    x - radiusX,
    y - radiusY * lift,
  );
  context.bezierCurveTo(
    x - radiusX * (0.97 + lean),
    y - radiusY * 0.67,
    x - radiusX * 0.42,
    y - radiusY * (1.02 - lift),
    x + radiusX * (0.03 + lean),
    y - radiusY,
  );
  context.closePath();
}

function traceLoosePaper(context, offsetX, offsetY, phase) {
  const topDrift = Math.sin(phase * 2.1) * 1.4;
  const sideDrift = Math.cos(phase * 1.7) * 1.2;
  const bottomDrift = Math.sin(phase * 2.7 + 0.8) * 1.3;
  context.beginPath();
  context.moveTo(-19 + offsetX, -13 + topDrift + offsetY);
  context.bezierCurveTo(
    -9 + offsetX,
    -16 - topDrift * 0.3 + offsetY,
    8 + offsetX,
    -12 + topDrift * 0.25 + offsetY,
    20 + sideDrift * 0.25 + offsetX,
    -13 + offsetY,
  );
  context.bezierCurveTo(
    22 + sideDrift + offsetX,
    -5 + offsetY,
    18 - sideDrift * 0.3 + offsetX,
    6 + offsetY,
    20 + offsetX,
    13 + bottomDrift + offsetY,
  );
  context.bezierCurveTo(
    7 + offsetX,
    15 - bottomDrift * 0.25 + offsetY,
    -8 + offsetX,
    12 + bottomDrift * 0.35 + offsetY,
    -20 - sideDrift * 0.2 + offsetX,
    14 + offsetY,
  );
  context.bezierCurveTo(
    -22 - sideDrift + offsetX,
    6 + offsetY,
    -18 + sideDrift * 0.2 + offsetX,
    -5 + offsetY,
    -19 + offsetX,
    -13 + topDrift + offsetY,
  );
  context.closePath();
}

function traceVaseBody(context) {
  context.beginPath();
  context.moveTo(-20, -47);
  context.bezierCurveTo(-21, -36, -40, -25, -43, -2);
  context.bezierCurveTo(-47, 27, -34, 52, -12, 63);
  context.bezierCurveTo(-3, 68, 12, 66, 25, 57);
  context.bezierCurveTo(44, 39, 47, 8, 35, -18);
  context.bezierCurveTo(30, -31, 21, -37, 20, -47);
  context.bezierCurveTo(8, -51, -8, -50, -20, -47);
  context.closePath();
}

function traceSoftLoop(context, points) {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);
  context.beginPath();
  context.moveTo(
    (lastPoint.x + firstPoint.x) / 2,
    (lastPoint.y + firstPoint.y) / 2,
  );
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2,
    );
  }
  context.closePath();
}

function pointBounds(points) {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return Object.freeze({
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  });
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
    const phase = index * 0.73 + progress * 0.19;
    context.fillStyle = 'rgba(45,31,36,0.24)';
    traceLoosePaper(context, 3, 4, phase + 0.41);
    context.fill();
    context.fillStyle = index % 2 ? PALETTE.parchment : '#d9c5a2';
    traceLoosePaper(context, 0, 0, phase);
    context.fill();
    context.strokeStyle = '#8b7152';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = 'rgba(255,247,218,0.32)';
    context.beginPath();
    context.moveTo(-16, -10 + Math.sin(phase) * 0.8);
    context.bezierCurveTo(-7, -14, 7, -12, 17, -8 + Math.cos(phase) * 0.7);
    context.bezierCurveTo(7, -6, -5, -7, -16, -5);
    context.bezierCurveTo(-18, -7, -18, -9, -16, -10 + Math.sin(phase) * 0.8);
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(91,66,51,0.38)';
    context.lineWidth = 1.05;
    for (let mark = 0; mark < 2; mark += 1) {
      const markY = 2 + mark * 5;
      context.beginPath();
      context.moveTo(-13 + mark * 2, markY + Math.sin(phase + mark) * 0.7);
      context.bezierCurveTo(-5, markY - 1, 5, markY + 1.4, 13 - mark * 3, markY - 0.5);
      context.stroke();
    }
    context.restore();
  }
}

function drawVase(context) {
  context.fillStyle = 'rgba(35,28,48,0.22)';
  traceOrganicOval(context, 3, 63, 39, 8, 0.62);
  context.fill();

  context.fillStyle = '#7e72aa';
  context.strokeStyle = '#403958';
  context.lineWidth = 5;
  traceVaseBody(context);
  context.fill();
  context.stroke();

  context.save();
  traceVaseBody(context);
  context.clip();
  context.fillStyle = 'rgba(51,43,82,0.32)';
  context.beginPath();
  context.moveTo(8, -46);
  context.bezierCurveTo(34, -28, 45, -1, 35, 32);
  context.bezierCurveTo(30, 49, 18, 61, 5, 65);
  context.bezierCurveTo(18, 29, 18, -10, 8, -46);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(225,215,247,0.28)';
  context.beginPath();
  context.moveTo(-17, -42);
  context.bezierCurveTo(-34, -24, -35, 7, -26, 29);
  context.bezierCurveTo(-21, 39, -16, 43, -12, 38);
  context.bezierCurveTo(-19, 8, -17, -19, -7, -39);
  context.bezierCurveTo(-9, -44, -13, -45, -17, -42);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = '#a99bc7';
  traceOrganicOval(context, 0, -52, 24, 8.5, 0.34);
  context.fill();
  context.stroke();
  context.fillStyle = '#514768';
  traceOrganicOval(context, 1, -53, 17, 4.8, 0.91);
  context.fill();
  context.strokeStyle = 'rgba(235,220,248,0.5)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-17, -55);
  context.bezierCurveTo(-8, -60, 5, -59, 15, -55);
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
  const points = shard.points.map(([x, y]) => ({
    x: x - shard.offset[0],
    y: y - shard.offset[1],
  }));
  traceSoftLoop(context, points);
  context.fill();
  context.stroke();

  const bounds = pointBounds(points);
  context.save();
  traceSoftLoop(context, points);
  context.clip();
  context.fillStyle = 'rgba(43,34,69,0.2)';
  context.beginPath();
  context.moveTo(bounds.minX - 4, bounds.centerY);
  context.bezierCurveTo(
    bounds.centerX - 2,
    bounds.centerY - 5,
    bounds.maxX + 5,
    bounds.maxY - 2,
    bounds.maxX + 7,
    bounds.maxY + 5,
  );
  context.bezierCurveTo(bounds.centerX, bounds.maxY + 8, bounds.minX - 5, bounds.maxY + 3, bounds.minX - 4, bounds.centerY);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(237,225,255,0.34)';
  context.lineWidth = 1.35;
  context.beginPath();
  context.moveTo(bounds.minX + 4, bounds.minY + 7);
  context.bezierCurveTo(bounds.centerX - 2, bounds.minY + 2, bounds.centerX + 5, bounds.centerY, bounds.maxX - 4, bounds.centerY - 3);
  context.stroke();
  context.restore();
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

function polarPoint(angle, radius) {
  return Object.freeze({
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  });
}

function drawGoldenRays(context, state) {
  const reach = 80 + state.crescendo * 430;
  context.save();
  context.globalAlpha = state.burst * (1 - state.settle * 0.65);
  for (let index = 0; index < 18; index += 1) {
    const angle = index * Math.PI / 9 + 0.08;
    const inner = 35 + (index % 3) * 8;
    const outer = reach * (0.58 + (index % 4) * 0.11);
    const halfWidth = 0.026 + (index % 3) * 0.004;
    const tipDrift = Math.sin(index * 2.37) * 0.012;
    const startLeft = polarPoint(angle - halfWidth, inner);
    const startRight = polarPoint(angle + halfWidth, inner * 0.96);
    const tip = polarPoint(angle + tipDrift, outer);
    const leftControl = polarPoint(angle - halfWidth * 0.68, inner + (outer - inner) * 0.58);
    const rightControl = polarPoint(angle + halfWidth * 0.74, inner + (outer - inner) * 0.55);
    context.fillStyle = index % 2 ? 'rgba(255,232,141,0.18)' : 'rgba(255,195,73,0.13)';
    context.beginPath();
    context.moveTo(startLeft.x, startLeft.y);
    context.bezierCurveTo(
      leftControl.x,
      leftControl.y,
      tip.x - Math.sin(angle) * 3.5,
      tip.y + Math.cos(angle) * 3.5,
      tip.x,
      tip.y,
    );
    context.bezierCurveTo(
      tip.x + Math.sin(angle) * 3.2,
      tip.y - Math.cos(angle) * 3.2,
      rightControl.x,
      rightControl.y,
      startRight.x,
      startRight.y,
    );
    context.quadraticCurveTo(
      Math.cos(angle) * inner * 0.76,
      Math.sin(angle) * inner * 0.76,
      startLeft.x,
      startLeft.y,
    );
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
    const radiusY = radius * (0.42 + index * 0.06);
    context.save();
    context.rotate(index * 0.55);
    context.strokeStyle = 'rgba(104,66,37,0.26)';
    context.lineWidth = 7 - index;
    traceOrganicOval(context, 2.5, 3.5, radius, radiusY, index * 0.73 + 0.24);
    context.stroke();
    context.strokeStyle = index === 1 ? '#fff0ad' : '#e8b44f';
    context.lineWidth = 5 - index;
    traceOrganicOval(context, 0, 0, radius, radiusY, index * 0.73);
    context.stroke();
    context.restore();
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

function traceWandShaft(context, startX, endX, halfWidth, phase) {
  const rise = Math.sin(phase * 7.1) * 1.2;
  const taper = halfWidth * 0.38;
  context.beginPath();
  context.moveTo(startX, -halfWidth * 0.62 + rise);
  context.bezierCurveTo(
    startX + (endX - startX) * 0.31,
    -halfWidth - rise,
    startX + (endX - startX) * 0.72,
    -taper + rise * 0.3,
    endX,
    -taper,
  );
  context.bezierCurveTo(endX + 6, -2, endX + 6, 2, endX, taper * 0.72);
  context.bezierCurveTo(
    startX + (endX - startX) * 0.7,
    halfWidth * 0.48 - rise * 0.25,
    startX + (endX - startX) * 0.28,
    halfWidth + rise,
    startX,
    halfWidth * 0.7,
  );
  context.bezierCurveTo(startX - 5, halfWidth * 0.28, startX - 5, -halfWidth * 0.27, startX, -halfWidth * 0.62 + rise);
  context.closePath();
}

function traceWandHandle(context) {
  context.beginPath();
  context.moveTo(-146, -14);
  context.bezierCurveTo(-132, -19, -108, -17, -94, -10);
  context.bezierCurveTo(-90, -6, -91, 7, -97, 11);
  context.bezierCurveTo(-111, 17, -134, 18, -147, 13);
  context.bezierCurveTo(-154, 8, -155, -8, -146, -14);
  context.closePath();
}

function drawChosenWand(context, state) {
  context.save();
  context.translate(640, 382);
  context.rotate(-0.75);
  context.globalAlpha = 0.82 + state.wandGlow * 0.18;
  context.fillStyle = '#3d251e';
  traceWandShaft(context, -121, 154, 9.5, 0.17);
  context.fill();
  context.strokeStyle = '#2b1d1a';
  context.lineWidth = 2.4;
  context.stroke();

  context.fillStyle = '#8a5635';
  traceWandShaft(context, -117, 151, 5.8, 0.61);
  context.fill();
  context.strokeStyle = '#d39b54';
  context.lineWidth = 2.6;
  context.beginPath();
  context.moveTo(-105, -3);
  context.bezierCurveTo(-42, -7, 64, -6, 143, -2);
  context.stroke();

  context.fillStyle = '#5b3427';
  traceWandHandle(context);
  context.fill();
  context.strokeStyle = '#34231f';
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = 'rgba(166,101,58,0.42)';
  context.beginPath();
  context.moveTo(-144, -9);
  context.bezierCurveTo(-130, -15, -108, -13, -96, -7);
  context.bezierCurveTo(-111, -4, -130, -3, -143, 1);
  context.bezierCurveTo(-148, -2, -149, -6, -144, -9);
  context.closePath();
  context.fill();

  context.strokeStyle = '#c28a47';
  context.lineWidth = 2.6;
  for (let x = -140; x < -99; x += 10) {
    context.beginPath();
    context.moveTo(x, -10 + Math.sin(x) * 0.5);
    context.bezierCurveTo(x + 1, -3, x + 6, 4, x + 7, 10 + Math.cos(x) * 0.4);
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
  context.moveTo(-275, -134);
  context.bezierCurveTo(-166, -137, -52, -131, 54, -135);
  context.bezierCurveTo(151, -138, 240, -132, 281, -134);
  context.bezierCurveTo(293, -130, 298, -119, 295, -105);
  context.bezierCurveTo(293, -82, 297, -57, 294, -39);
  context.bezierCurveTo(283, -29, 279, -14, 292, -3);
  context.bezierCurveTo(280, 10, 283, 27, 295, 38);
  context.bezierCurveTo(297, 59, 292, 91, 296, 113);
  context.bezierCurveTo(297, 126, 290, 135, 278, 134);
  context.bezierCurveTo(172, 131, 71, 137, -45, 133);
  context.bezierCurveTo(-143, 130, -235, 137, -280, 133);
  context.bezierCurveTo(-293, 133, -299, 124, -296, 111);
  context.bezierCurveTo(-292, 86, -297, 58, -294, 38);
  context.bezierCurveTo(-282, 27, -280, 11, -292, 1);
  context.bezierCurveTo(-280, -13, -283, -29, -295, -39);
  context.bezierCurveTo(-298, -61, -292, -88, -296, -111);
  context.bezierCurveTo(-298, -124, -289, -134, -275, -134);
  context.closePath();
}

function ticketInsetPath(context) {
  context.beginPath();
  context.moveTo(-265, -119);
  context.bezierCurveTo(-157, -121, -47, -116, 54, -120);
  context.bezierCurveTo(148, -123, 230, -117, 275, -119);
  context.bezierCurveTo(282, -107, 279, -75, 281, -48);
  context.bezierCurveTo(267, -30, 267, -14, 280, 0);
  context.bezierCurveTo(267, 16, 269, 32, 281, 47);
  context.bezierCurveTo(279, 74, 282, 105, 274, 118);
  context.bezierCurveTo(174, 115, 73, 121, -41, 117);
  context.bezierCurveTo(-142, 114, -229, 121, -266, 117);
  context.bezierCurveTo(-275, 101, -270, 72, -273, 47);
  context.bezierCurveTo(-260, 31, -259, 15, -272, 1);
  context.bezierCurveTo(-259, -15, -261, -32, -274, -48);
  context.bezierCurveTo(-271, -78, -275, -105, -265, -119);
  context.closePath();
}

function drawTicketMaterialPlanes(context) {
  context.save();
  ticketPath(context);
  context.clip();

  context.fillStyle = 'rgba(255,245,190,0.3)';
  context.beginPath();
  context.moveTo(-283, -128);
  context.bezierCurveTo(-147, -120, -31, -129, 96, -124);
  context.bezierCurveTo(172, -120, 235, -121, 287, -111);
  context.bezierCurveTo(214, -96, 128, -101, 42, -93);
  context.bezierCurveTo(-62, -84, -166, -96, -286, -79);
  context.bezierCurveTo(-293, -97, -291, -116, -283, -128);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(98,61,43,0.18)';
  context.beginPath();
  context.moveTo(-292, 67);
  context.bezierCurveTo(-170, 88, -69, 76, 47, 88);
  context.bezierCurveTo(139, 97, 222, 84, 294, 72);
  context.bezierCurveTo(294, 94, 296, 119, 279, 134);
  context.bezierCurveTo(164, 131, 69, 137, -45, 133);
  context.bezierCurveTo(-153, 130, -250, 137, -281, 132);
  context.bezierCurveTo(-293, 117, -294, 91, -292, 67);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(119,73,47,0.14)';
  context.beginPath();
  context.moveTo(-286, -123);
  context.bezierCurveTo(-250, -119, -208, -122, -181, -116);
  context.bezierCurveTo(-174, -59, -177, 54, -181, 119);
  context.bezierCurveTo(-216, 126, -252, 120, -285, 128);
  context.bezierCurveTo(-292, 74, -286, 28, -293, 1);
  context.bezierCurveTo(-286, -39, -292, -79, -286, -123);
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(103,64,42,0.16)';
  context.lineWidth = 1.4;
  for (let index = 0; index < 13; index += 1) {
    const y = -101 + index * 16.7;
    const start = -263 + (index % 3) * 21;
    const end = 260 - (index % 4) * 18;
    context.beginPath();
    context.moveTo(start, y + (index % 2 ? 1.5 : -1));
    context.bezierCurveTo(
      start + (end - start) * 0.31,
      y - 2 + (index % 3),
      start + (end - start) * 0.69,
      y + 2 - (index % 2),
      end,
      y + (index % 3 - 1) * 1.2,
    );
    context.stroke();
  }
  context.restore();
}

function drawTicketPerforation(context) {
  context.strokeStyle = 'rgba(93,61,46,0.55)';
  context.lineWidth = 3;
  context.lineCap = 'round';
  for (let index = 0; index < 8; index += 1) {
    const y = -101 + index * 29;
    const drift = index % 2 ? 1.5 : -1.2;
    context.beginPath();
    context.moveTo(-181 + drift, y - 7);
    context.bezierCurveTo(-177 - drift, y - 3, -174 + drift, y + 3, -179 - drift, y + 8);
    context.stroke();
  }
}

function drawTicketRailVignette(context, x, y) {
  context.save();
  context.translate(x, y);
  context.fillStyle = 'rgba(93,61,46,0.2)';
  context.beginPath();
  context.moveTo(-43, 24);
  context.bezierCurveTo(-42, 3, -32, -10, -15, -13);
  context.bezierCurveTo(-12, -33, 1, -46, 18, -40);
  context.bezierCurveTo(30, -35, 33, -18, 31, -6);
  context.bezierCurveTo(45, 0, 48, 13, 43, 25);
  context.bezierCurveTo(20, 31, -18, 31, -43, 24);
  context.closePath();
  context.fill();

  context.fillStyle = '#694737';
  context.beginPath();
  context.moveTo(-38, 13);
  context.bezierCurveTo(-34, -1, -20, -8, -5, -7);
  context.bezierCurveTo(6, -5, 21, -8, 36, 1);
  context.bezierCurveTo(42, 7, 42, 16, 36, 20);
  context.bezierCurveTo(15, 24, -17, 24, -38, 19);
  context.bezierCurveTo(-41, 17, -41, 15, -38, 13);
  context.closePath();
  context.fill();

  context.fillStyle = '#8d623f';
  context.beginPath();
  context.moveTo(-10, -8);
  context.bezierCurveTo(-7, -23, 2, -34, 15, -34);
  context.bezierCurveTo(24, -30, 25, -18, 23, -7);
  context.bezierCurveTo(12, -3, 1, -3, -10, -8);
  context.closePath();
  context.fill();

  context.fillStyle = '#4d352b';
  context.beginPath();
  context.moveTo(8, -34);
  context.bezierCurveTo(7, -42, 10, -49, 16, -52);
  context.bezierCurveTo(21, -49, 23, -41, 21, -33);
  context.bezierCurveTo(17, -31, 12, -31, 8, -34);
  context.closePath();
  context.fill();

  for (const [wheelX, phase] of [[-22, 0.2], [24, 0.7]]) {
    traceTicketWheel(context, wheelX, 24, 12, phase);
    context.fillStyle = '#4d352b';
    context.fill();
    context.strokeStyle = '#d39b54';
    context.lineWidth = 2.2;
    context.stroke();
    traceTicketWheel(context, wheelX + 0.5, 23.5, 5, phase + 0.31);
    context.fillStyle = '#d39b54';
    context.fill();
  }

  context.strokeStyle = 'rgba(244,213,141,0.66)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-35, 6);
  context.bezierCurveTo(-15, 1, 10, 2, 34, 8);
  context.stroke();

  context.strokeStyle = 'rgba(93,61,46,0.48)';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(-49, 39);
  context.bezierCurveTo(-19, 35, 17, 36, 49, 40);
  context.moveTo(-45, 46);
  context.bezierCurveTo(-17, 42, 20, 43, 46, 47);
  context.stroke();
  context.restore();
}

function traceTicketWheel(context, x, y, radius, phase) {
  const wobble = Math.sin(phase * 17) * radius * 0.05;
  context.beginPath();
  context.moveTo(x - wobble, y - radius);
  context.bezierCurveTo(
    x + radius * 0.63,
    y - radius * 1.01,
    x + radius * 1.02,
    y - radius * 0.45,
    x + radius,
    y + wobble,
  );
  context.bezierCurveTo(
    x + radius * 0.98,
    y + radius * 0.62,
    x + radius * 0.43,
    y + radius * 1.03,
    x - wobble,
    y + radius,
  );
  context.bezierCurveTo(
    x - radius * 0.66,
    y + radius * 0.99,
    x - radius * 1.03,
    y + radius * 0.42,
    x - radius,
    y - wobble,
  );
  context.bezierCurveTo(
    x - radius * 0.98,
    y - radius * 0.62,
    x - radius * 0.42,
    y - radius * 1.01,
    x - wobble,
    y - radius,
  );
  context.closePath();
}

export function deliveryLetteringAlpha(progress, { reducedMotion = false } = {}) {
  return reducedMotion ? 0.9 : 0.82 + Math.sin(progress * Math.PI * 8) * 0.14;
}

function drawStar(context, x, y, size, color, alpha = 1) {
  if (alpha <= 0) return;
  context.save();
  context.translate(x, y);
  context.globalAlpha *= alpha;
  const points = [];
  const outerScale = [1, 0.93, 1.04, 0.96];
  const innerScale = [0.3, 0.25, 0.32, 0.27];
  for (let index = 0; index < 8; index += 1) {
    const outer = index % 2 === 0;
    const scale = outer
      ? outerScale[index / 2]
      : innerScale[(index - 1) / 2];
    const angle = -Math.PI / 2 + index * Math.PI / 4 + Math.sin(index * 2.31) * 0.025;
    points.push({
      x: Math.cos(angle) * size * scale,
      y: Math.sin(angle) * size * scale,
    });
  }

  context.fillStyle = 'rgba(91,57,36,0.2)';
  context.save();
  context.translate(size * 0.08, size * 0.11);
  traceSoftLoop(context, points);
  context.fill();
  context.restore();

  context.fillStyle = color;
  traceSoftLoop(context, points);
  context.fill();

  context.fillStyle = 'rgba(255,249,215,0.48)';
  traceOrganicOval(context, -size * 0.08, -size * 0.12, size * 0.13, size * 0.1, size * 0.07);
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

function requireCharacterRenderer(characterRenderer) {
  if (!characterRenderer || typeof characterRenderer.draw !== 'function') {
    throw new TypeError('SetPieceRenderer requires an injected character renderer with draw().');
  }
  return characterRenderer;
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
