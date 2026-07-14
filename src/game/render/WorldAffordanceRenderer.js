import { PALETTE, WORLD } from '../config.js';

const TAU = Math.PI * 2;
const VISUAL_PROFILES = Object.freeze({
  owl: Object.freeze([0.78, 1.1, 0, 'owl']),
  letter: Object.freeze([0.95, 0.56, 0, 'letter']),
  door: Object.freeze([0.52, 1, 0, 'door']),
  sparkle: Object.freeze([0.86, 0.86, 0, 'circle']),
  wand: Object.freeze([0.62, 0.11, -0.025, 'wand']),
  robes: Object.freeze([0.72, 0.72, 0.08, 'robes']),
  look: Object.freeze([0.9, 0.34, 0, 'circle']),
  'frog-card': Object.freeze([0.46, 0.58, 0, 'letter']),
});
const DEFAULT_VISUAL_PROFILE = Object.freeze([0.82, 0.82, 0, 'circle']);
// Hagrid's authored puppet occupies approximately x -79…79 and y -211…29,
// and CharacterRenderer applies its 1.5 world scale. The authored talk
// circle is 190 pixels square, so these ratios put the guide bounds on that
// live silhouette instead of on the smaller circle around his face and chest.
const GUIDE_VISUAL_PROFILE = Object.freeze([1.25, 1.9, 0.1, 'guide']);
const FIGURE_VISUAL_PROFILE = Object.freeze([0.68, 1.45, 0.16, 'figure']);
const HALO_CONTOURS = Object.freeze([
  Object.freeze({ padding: 25, width: 9, alpha: 0.48, color: PALETTE.interactive }),
  Object.freeze({ padding: 18, width: 7, alpha: 0.65, color: PALETTE.interactive }),
  Object.freeze({ padding: 12, width: 5, alpha: 0.82, color: PALETTE.honey }),
]);

export class WorldAffordanceRenderer {
  draw(context, state, time, {
    reducedMotion = false,
    pressedTargetId = null,
  } = {}) {
    const quiet = Boolean(
      state?.affordances?.quiet || state?.affordances?.worldSuppressed,
    );
    if (quiet) return;
    for (const target of state?.targets ?? []) {
      const presentation = worldAffordanceState(target, time, {
        cameraX: state?.cameraX ?? 0,
        reducedMotion,
        pressedTargetId,
        quiet,
      });
      if (!presentation || !isOnScreen(presentation.bounds)) continue;
      drawAffordancePresentation(context, presentation);
    }
  }
}

export function worldAffordanceState(target, time, {
  cameraX = 0,
  reducedMotion = false,
  pressedTargetId = null,
  quiet = false,
} = {}) {
  if (quiet || !target?.hitArea) return null;
  const hitBounds = boundsForHitArea(target.hitArea, cameraX);
  if (!hitBounds) return null;
  const bounds = visualBoundsForTarget(target, hitBounds);
  const phase = stablePhase(target.id ?? target.semanticId ?? 'target');
  const salience = target.salience;

  if (salience?.visible === 'glint' && salience.glint?.alpha > 0) {
    const travel = reducedMotion ? 0.5 : salience.glint.progress;
    return Object.freeze({
      kind: 'glint',
      bounds,
      phase,
      tier: salience.tier,
      alpha: salience.glint.alpha,
      progress: salience.glint.progress,
      x: bounds.x + bounds.width * (0.34 + travel * 0.32),
      y: bounds.y + bounds.height * (0.58 - travel * 0.16),
    });
  }

  const pressed = pressedTargetId === target.id && ['discoverable', 'secret'].includes(salience?.tier);
  if (salience?.visible !== 'thread' && !pressed) return null;
  const intensity = pressed ? 'press' : salience.intensity;
  const hinted = intensity === 'hint';
  const breath = reducedMotion ? 0.5 : 0.5 + Math.sin(time * 0.78 + phase * TAU) * 0.5;
  const strength = hinted ? 1 : pressed ? 0.7 : 0.84;
  const moteCount = hinted ? 3 : 2;
  const rotation = phase * TAU + (reducedMotion ? 0 : time * (hinted ? 0.32 : 0.24));
  const orbitX = bounds.width * 0.52 + 8;
  const orbitY = bounds.height * 0.52 + 8;
  const motes = Array.from({ length: moteCount }, (_, index) => {
    const angle = rotation + index * TAU / moteCount;
    return Object.freeze({
      x: bounds.x + bounds.width / 2 + Math.cos(angle) * orbitX,
      y: bounds.y + bounds.height / 2 + Math.sin(angle) * orbitY,
      size: (hinted ? 5.8 : 4.7) + Math.sin(phase * 19 + index * 2.1) * 0.55,
      alpha: strength * (0.72 + Math.sin(angle * 1.7 + phase) * 0.12),
      angle,
    });
  });

  return Object.freeze({
    kind: 'gold-shimmer',
    bounds,
    phase,
    intensity,
    haloAlpha: strength * (0.11 + breath * 0.055),
    edgeAlpha: strength * (0.11 + breath * 0.045),
    motes: Object.freeze(motes),
  });
}

export function drawAffordancePresentation(context, presentation) {
  if (!presentation) return;
  if (presentation.kind === 'glint') drawScheduledGlint(context, presentation);
  else drawGoldShimmer(context, presentation);
}

function drawGoldShimmer(context, presentation) {
  const { bounds, haloAlpha, edgeAlpha, phase } = presentation;
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  // Nested translucent contours keep every brush mark outside the authored
  // target instead of washing gold across its face, coat, or painted details.
  // World targets are composited beneath code-drawn actors in Game, so a
  // figure naturally masks the inside half of each soft contour.
  for (let layer = 0; layer < HALO_CONTOURS.length; layer += 1) {
    const contour = HALO_CONTOURS[layer];
    context.globalAlpha = haloAlpha * contour.alpha;
    context.strokeStyle = contour.color;
    context.lineWidth = contour.width;
    traceTargetShape(context, bounds, contour.padding, phase + layer * 0.19);
    context.stroke();
  }

  context.globalAlpha = edgeAlpha;
  context.strokeStyle = PALETTE.honey;
  context.lineWidth = 3.5;
  traceTargetShape(context, bounds, 7, phase);
  context.stroke();

  for (const mote of presentation.motes) drawPaintedMote(context, mote);
  context.restore();
}

function drawPaintedMote(context, mote) {
  context.save();
  context.translate(mote.x, mote.y);
  context.rotate(mote.angle * 0.12);
  context.globalAlpha = mote.alpha * 0.34;
  context.fillStyle = PALETTE.interactive;
  organicMotePath(context, mote.size * 1.85, mote.angle);
  context.fill();
  context.globalAlpha = mote.alpha;
  context.fillStyle = PALETTE.candle;
  organicMotePath(context, mote.size, mote.angle + 0.8);
  context.fill();
  context.globalAlpha = mote.alpha * 0.8;
  context.fillStyle = PALETTE.parchment;
  organicMotePath(context, mote.size * 0.43, mote.angle + 1.7, -mote.size * 0.15, -mote.size * 0.18);
  context.fill();
  context.restore();
}

function drawScheduledGlint(context, presentation) {
  const shortSide = Math.min(presentation.bounds.width, presentation.bounds.height);
  const halfLength = Math.min(24, shortSide * 0.26);
  const tierAlpha = presentation.tier === 'secret' ? 0.72 : 1;
  context.save();
  context.translate(presentation.x, presentation.y);
  context.rotate(-0.42);
  context.lineCap = 'round';

  context.globalAlpha = presentation.alpha * tierAlpha * 0.28;
  context.strokeStyle = PALETTE.interactive;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(-halfLength, 2);
  context.quadraticCurveTo(0, -3, halfLength, 1);
  context.stroke();

  context.globalAlpha = presentation.alpha * tierAlpha;
  context.strokeStyle = PALETTE.honey;
  context.lineWidth = 3.5;
  context.beginPath();
  context.moveTo(-halfLength * 0.75, 1);
  context.quadraticCurveTo(0, -2, halfLength * 0.75, 0);
  context.stroke();

  context.globalAlpha = presentation.alpha * tierAlpha * 0.78;
  context.fillStyle = PALETTE.parchment;
  organicMotePath(context, 3.4, presentation.phase * TAU, halfLength * 0.12, -2);
  context.fill();
  context.restore();
}

function traceTargetShape(context, bounds, padding, phase) {
  if (bounds.shape === 'wand') traceOrganicWand(context, bounds, padding, phase);
  else if (bounds.shape === 'door') traceOrganicDoor(context, bounds, padding, phase);
  else if (bounds.shape === 'guide') traceOrganicGuide(context, bounds, padding, phase);
  else if (bounds.shape === 'figure') traceOrganicFigure(context, bounds, padding, phase);
  else if (bounds.shape === 'robes') traceOrganicRobes(context, bounds, padding, phase);
  else if (bounds.shape === 'owl') traceOrganicOwl(context, bounds, padding, phase);
  else if (bounds.shape === 'rect' || bounds.shape === 'letter') {
    traceOrganicRect(context, bounds, padding, phase);
  } else traceOrganicEllipse(context, bounds, padding, phase);
}

function traceOrganicGuide(context, bounds, padding, phase) {
  const left = bounds.x - padding;
  const right = bounds.x + bounds.width + padding;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;
  const width = right - left;
  const height = bottom - top;
  const wobble = Math.sin(phase * 23) * 1.6;

  // The contour follows Hagrid's broad hair, shoulders, coat, and planted
  // boots. It deliberately stays a little irregular instead of collapsing
  // his half-giant silhouette into a generic oval or perfect capsule.
  context.beginPath();
  context.moveTo(left + width * 0.48, top - wobble);
  context.bezierCurveTo(
    left + width * 0.27,
    top - wobble * 0.35,
    left + width * 0.12,
    top + height * 0.07,
    left + width * 0.1,
    top + height * 0.18,
  );
  context.bezierCurveTo(
    left + width * 0.03,
    top + height * 0.25,
    left + width * 0.03,
    top + height * 0.4,
    left + width * 0.1,
    top + height * 0.48,
  );
  context.bezierCurveTo(
    left + width * 0.01,
    top + height * 0.58,
    left - wobble,
    top + height * 0.78,
    left + width * 0.04,
    top + height * 0.9,
  );
  context.bezierCurveTo(
    left + width * 0.13,
    top + height * 0.95,
    left + width * 0.21,
    top + height * 0.94,
    left + width * 0.29,
    top + height * 0.95,
  );
  context.bezierCurveTo(
    left + width * 0.25,
    top + height * 0.98,
    left + width * 0.31,
    bottom + wobble * 0.3,
    left + width * 0.4,
    bottom,
  );
  context.bezierCurveTo(
    left + width * 0.45,
    bottom - height * 0.01,
    left + width * 0.47,
    bottom - height * 0.03,
    left + width * 0.5,
    bottom - height * 0.035,
  );
  context.bezierCurveTo(
    left + width * 0.54,
    bottom - height * 0.03,
    left + width * 0.56,
    bottom - height * 0.01,
    left + width * 0.61,
    bottom,
  );
  context.bezierCurveTo(
    left + width * 0.7,
    bottom - wobble * 0.25,
    left + width * 0.75,
    top + height * 0.98,
    left + width * 0.71,
    top + height * 0.95,
  );
  context.bezierCurveTo(
    left + width * 0.79,
    top + height * 0.94,
    left + width * 0.88,
    top + height * 0.95,
    left + width * 0.96,
    top + height * 0.89,
  );
  context.bezierCurveTo(
    right + wobble,
    top + height * 0.76,
    right - width * 0.01,
    top + height * 0.57,
    right - width * 0.1,
    top + height * 0.47,
  );
  context.bezierCurveTo(
    right - width * 0.03,
    top + height * 0.38,
    right - width * 0.04,
    top + height * 0.24,
    right - width * 0.11,
    top + height * 0.16,
  );
  context.bezierCurveTo(
    right - width * 0.16,
    top + height * 0.06,
    right - width * 0.31,
    top + wobble * 0.25,
    left + width * 0.48,
    top - wobble,
  );
  context.closePath();
}

function traceOrganicWand(context, bounds, padding, phase) {
  const left = bounds.x - padding;
  const right = bounds.x + bounds.width + padding;
  const centerY = bounds.y + bounds.height / 2;
  const half = bounds.height / 2 + padding * 0.38;
  const tilt = Math.sin(phase * 17) * 1.8;
  context.beginPath();
  context.moveTo(left + half, centerY + half + tilt);
  context.quadraticCurveTo(
    bounds.x + bounds.width * 0.46,
    centerY + half * 0.72 - tilt,
    right - half,
    centerY - half,
  );
  context.quadraticCurveTo(right + half * 0.35, centerY, right - half, centerY + half);
  context.quadraticCurveTo(
    bounds.x + bounds.width * 0.53,
    centerY - half * 0.64 + tilt,
    left + half,
    centerY - half - tilt,
  );
  context.quadraticCurveTo(left - half * 0.35, centerY, left + half, centerY + half + tilt);
  context.closePath();
}

function traceOrganicDoor(context, bounds, padding, phase) {
  const left = bounds.x - padding;
  const right = bounds.x + bounds.width + padding;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;
  const shoulder = Math.min(bounds.width * 0.34, bounds.height * 0.2);
  const wobble = Math.sin(phase * 19) * 2;
  context.beginPath();
  context.moveTo(left + wobble, bottom);
  context.lineTo(left - wobble, top + shoulder);
  context.quadraticCurveTo(left + bounds.width * 0.12, top, bounds.x + bounds.width / 2, top - wobble);
  context.quadraticCurveTo(right - bounds.width * 0.12, top, right + wobble, top + shoulder);
  context.lineTo(right - wobble, bottom);
  context.closePath();
}

function traceOrganicFigure(context, bounds, padding, phase) {
  const centerX = bounds.x + bounds.width / 2;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;
  const headRadius = bounds.width * 0.3 + padding * 0.35;
  const shoulder = bounds.width * 0.58 + padding;
  const wobble = Math.sin(phase * 23) * 1.7;
  context.beginPath();
  context.moveTo(centerX, top);
  context.bezierCurveTo(
    centerX - headRadius * 1.15,
    top + headRadius * 0.18,
    centerX - headRadius,
    top + headRadius * 1.8,
    centerX - headRadius * 0.45,
    top + headRadius * 2,
  );
  context.bezierCurveTo(centerX - shoulder, top + headRadius * 2.35, centerX - shoulder, bottom, centerX, bottom + wobble);
  context.bezierCurveTo(centerX + shoulder, bottom, centerX + shoulder, top + headRadius * 2.35, centerX + headRadius * 0.45, top + headRadius * 2);
  context.bezierCurveTo(centerX + headRadius, top + headRadius * 1.8, centerX + headRadius * 1.15, top + headRadius * 0.18, centerX, top);
  context.closePath();
}

function traceOrganicRobes(context, bounds, padding, phase) {
  const centerX = bounds.x + bounds.width / 2;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;
  const half = bounds.width / 2 + padding;
  const wobble = Math.sin(phase * 13) * 2;
  context.beginPath();
  context.moveTo(centerX - half * 0.24, top);
  context.quadraticCurveTo(centerX, top + bounds.height * 0.16, centerX + half * 0.24, top);
  context.lineTo(centerX + half * 0.5, top + bounds.height * 0.2);
  context.quadraticCurveTo(centerX + half * 0.72, bottom * 0.72 + top * 0.28, centerX + half + wobble, bottom);
  context.quadraticCurveTo(centerX, bottom - bounds.height * 0.08, centerX - half - wobble, bottom);
  context.quadraticCurveTo(centerX - half * 0.72, bottom * 0.72 + top * 0.28, centerX - half * 0.5, top + bounds.height * 0.2);
  context.closePath();
}

function traceOrganicOwl(context, bounds, padding, phase) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const halfWidth = bounds.width / 2 + padding;
  const halfHeight = bounds.height / 2 + padding;
  const ear = halfHeight * 0.16;
  const wobble = Math.sin(phase * 29) * 1.5;
  context.beginPath();
  context.moveTo(centerX, centerY - halfHeight + ear);
  context.lineTo(centerX - halfWidth * 0.54, centerY - halfHeight - wobble);
  context.quadraticCurveTo(centerX - halfWidth, centerY - halfHeight * 0.35, centerX - halfWidth, centerY + halfHeight * 0.24);
  context.quadraticCurveTo(centerX - halfWidth * 0.75, centerY + halfHeight * 0.9, centerX, centerY + halfHeight);
  context.quadraticCurveTo(centerX + halfWidth * 0.75, centerY + halfHeight * 0.9, centerX + halfWidth, centerY + halfHeight * 0.24);
  context.quadraticCurveTo(centerX + halfWidth, centerY - halfHeight * 0.35, centerX + halfWidth * 0.54, centerY - halfHeight - wobble);
  context.closePath();
}

function traceOrganicEllipse(context, bounds, padding, phase) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const radiusX = bounds.width / 2 + padding;
  const radiusY = bounds.height / 2 + padding;
  const points = [];
  for (let index = 0; index < 14; index += 1) {
    const angle = index * TAU / 14;
    const wobble = 1 + Math.sin(index * 2.37 + phase * 13.1) * 0.025;
    points.push({
      x: centerX + Math.cos(angle) * radiusX * wobble,
      y: centerY + Math.sin(angle) * radiusY * (2 - wobble),
    });
  }
  traceSmoothedLoop(context, points);
}

function traceOrganicRect(context, bounds, padding, phase) {
  const left = bounds.x - padding;
  const right = bounds.x + bounds.width + padding;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;
  const corner = Math.min(22, bounds.width * 0.18, bounds.height * 0.18) + padding * 0.35;
  const wobble = (index) => Math.sin(phase * 17 + index * 1.91) * 2.2;
  const points = [
    { x: left + corner, y: top + wobble(0) },
    { x: (left + right) / 2, y: top + wobble(1) },
    { x: right - corner, y: top + wobble(2) },
    { x: right + wobble(3), y: top + corner },
    { x: right + wobble(4), y: (top + bottom) / 2 },
    { x: right + wobble(5), y: bottom - corner },
    { x: right - corner, y: bottom + wobble(6) },
    { x: (left + right) / 2, y: bottom + wobble(7) },
    { x: left + corner, y: bottom + wobble(8) },
    { x: left + wobble(9), y: bottom - corner },
    { x: left + wobble(10), y: (top + bottom) / 2 },
    { x: left + wobble(11), y: top + corner },
  ];
  traceSmoothedLoop(context, points);
}

function traceSmoothedLoop(context, points) {
  const first = midpoint(points.at(-1), points[0]);
  context.beginPath();
  context.moveTo(first.x, first.y);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    const middle = midpoint(point, next);
    context.quadraticCurveTo(point.x, point.y, middle.x, middle.y);
  }
  context.closePath();
}

function organicMotePath(context, radius, phase, offsetX = 0, offsetY = 0) {
  const points = [];
  for (let index = 0; index < 7; index += 1) {
    const angle = index * TAU / 7;
    const wobble = 0.78 + ((index + Math.round(phase * 10)) % 3) * 0.11;
    points.push({
      x: offsetX + Math.cos(angle) * radius * wobble,
      y: offsetY + Math.sin(angle) * radius * (1.04 - (wobble - 0.78) * 0.45),
    });
  }
  traceSmoothedLoop(context, points);
}

function boundsForHitArea(area, cameraX) {
  if (area.shape === 'rect') {
    if (![area.x, area.y, area.width, area.height].every(Number.isFinite)) return null;
    return Object.freeze({
      shape: 'rect',
      x: area.x - cameraX,
      y: area.y,
      width: area.width,
      height: area.height,
    });
  }
  const radius = area.radius ?? area.r;
  if (![area.x, area.y, radius].every(Number.isFinite)) return null;
  return Object.freeze({
    shape: 'circle',
    x: area.x - cameraX - radius,
    y: area.y - radius,
    width: radius * 2,
    height: radius * 2,
  });
}

export function visualBoundsForTarget(target, hitBounds) {
  const icon = target.presentation?.icon;
  if (target.kind === 'talk') {
    const identity = String(target.id ?? target.semanticId ?? '').toLowerCase();
    const profile = identity.includes('guide') ? GUIDE_VISUAL_PROFILE : FIGURE_VISUAL_PROFILE;
    return resizedBounds(hitBounds, ...profile);
  }
  if (hitBounds.shape === 'rect' && icon !== 'door') return hitBounds;
  const profile = VISUAL_PROFILES[icon] ?? DEFAULT_VISUAL_PROFILE;
  return resizedBounds(hitBounds, ...profile);
}

function resizedBounds(bounds, widthScale, heightScale, centerYOffsetScale = 0, shape = 'rect') {
  const width = bounds.width * widthScale;
  const height = bounds.height * heightScale;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2 + bounds.height * centerYOffsetScale;
  return Object.freeze({
    shape,
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  });
}

function isOnScreen(bounds) {
  return bounds.x + bounds.width >= -40
    && bounds.x <= WORLD.width + 40
    && bounds.y + bounds.height >= -40
    && bounds.y <= WORLD.height + 40;
}

function stablePhase(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function midpoint(first, second) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}
