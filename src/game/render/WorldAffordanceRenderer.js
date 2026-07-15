import { PALETTE, WORLD } from '../config.js';

const TAU = Math.PI * 2;
const VISUAL_PROFILES = Object.freeze({
  owl: Object.freeze([0.78, 1.1, 0, 'owl']),
  letter: Object.freeze([0.95, 0.56, 0, 'letter']),
  door: Object.freeze([0.52, 1, 0, 'door']),
  sparkle: Object.freeze([0.86, 0.86, 0, 'circle']),
  // Ollivanders' tappable objects are the three painted wand cases. The hit
  // areas stay generously round for touch, while the visible shimmer follows
  // each long, shallow case instead of drawing a tiny wand-shaped bow tie in
  // the empty space above the display.
  wand: Object.freeze([0.98, 0.34, 0, 'wand-case']),
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
// One broad translucent brush band plus one bright edge reads as a magical
// shimmer. Several evenly spaced outline copies read as concentric UI rings,
// especially around small targets, so the soft band deliberately stays single.
const HALO_CONTOUR = Object.freeze({
  padding: 11,
  width: 18,
  alpha: 0.34,
  color: PALETTE.interactive,
});

export class WorldAffordanceRenderer {
  draw(context, state, time, {
    reducedMotion = false,
    pressedTargetId = null,
  } = {}) {
    const quiet = Boolean(
      state?.affordances?.quiet || state?.affordances?.worldSuppressed,
    );
    if (quiet) return;
    const hintEscalated = (state?.targets ?? []).some(({ salience }) => (
      salience?.visible === 'thread' && salience.intensity === 'hint'
    ));
    for (const target of state?.targets ?? []) {
      const presentation = worldAffordanceState(target, time, {
        cameraX: state?.cameraX ?? 0,
        reducedMotion,
        pressedTargetId,
        quiet,
      });
      if (!presentation || !isOnScreen(presentation.bounds)) continue;
      // Once Violet asks for stronger help, unrelated scheduled glints pause
      // so the strengthened object is the only plausible next step.
      if (hintEscalated && presentation.kind === 'glint') continue;
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
  const strength = hinted ? 1 : pressed ? 0.78 : 0.9;
  const wandCase = bounds.shape === 'wand-case';
  const moteCount = wandCase ? (hinted ? 7 : 4) : (hinted ? 6 : 4);
  const rotation = phase * TAU + (reducedMotion ? 0 : time * (hinted ? 0.32 : 0.24));
  const orbitX = bounds.width * 0.52 + 8;
  const orbitY = bounds.height * 0.52 + 8;
  const caseAnchors = Object.freeze([
    Object.freeze({ x: 0.08, y: 0.5, shape: 'dust' }),
    Object.freeze({ x: 0.23, y: 0.23, shape: 'spark' }),
    Object.freeze({ x: 0.39, y: 0.63, shape: 'dash' }),
    Object.freeze({ x: 0.54, y: 0.34, shape: 'dust' }),
    Object.freeze({ x: 0.68, y: 0.67, shape: 'spark' }),
    Object.freeze({ x: 0.82, y: 0.22, shape: 'dash' }),
    Object.freeze({ x: 0.94, y: 0.51, shape: 'dust' }),
  ]);
  const motes = Array.from({ length: moteCount }, (_, index) => {
    const angle = rotation + index * TAU / moteCount;
    const anchor = caseAnchors[index];
    return Object.freeze({
      x: wandCase
        ? bounds.x + bounds.width * anchor.x + Math.cos(angle) * (reducedMotion ? 0 : 3.2)
        : bounds.x + bounds.width / 2 + Math.cos(angle) * orbitX,
      y: wandCase
        ? bounds.y + bounds.height * anchor.y + Math.sin(angle * 1.3) * (reducedMotion ? 0 : 2.6)
        : bounds.y + bounds.height / 2 + Math.sin(angle) * orbitY,
      size: (hinted ? 6.8 : 5.5) + Math.sin(phase * 19 + index * 2.1) * 0.65,
      alpha: strength * (0.72 + Math.sin(angle * 1.7 + phase) * 0.12),
      angle,
      shape: wandCase ? anchor.shape : 'spark',
    });
  });

  return Object.freeze({
    kind: 'gold-shimmer',
    bounds,
    phase,
    intensity,
    haloAlpha: strength * (0.24 + breath * 0.1),
    edgeAlpha: strength * (0.36 + breath * 0.12),
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

  if (bounds.shape === 'wand-case') {
    // Wand hints live on the painted case itself: scattered dry-brush flecks
    // and mixed gold-dust shapes make the object shimmer without enclosing it
    // in a ring or pointing at it with an arrow.
    drawWandCaseShimmer(context, presentation);
  } else {
    // A single broad translucent contour keeps the brush mark outside the
    // authored target without washing gold across its face, coat, or details.
    // World targets are composited beneath code-drawn actors in Game, so a
    // figure naturally masks the inside half of the soft contour.
    context.globalAlpha = haloAlpha * HALO_CONTOUR.alpha;
    context.strokeStyle = HALO_CONTOUR.color;
    context.lineWidth = HALO_CONTOUR.width;
    traceTargetShape(context, bounds, HALO_CONTOUR.padding, phase);
    context.stroke();

    context.globalAlpha = edgeAlpha;
    context.strokeStyle = PALETTE.honey;
    context.lineWidth = 3.2;
    traceTargetShape(context, bounds, 4.5, phase);
    context.stroke();
  }

  for (const mote of presentation.motes) drawPaintedMote(context, mote);
  context.restore();
}

function drawWandCaseShimmer(context, { bounds, haloAlpha, edgeAlpha, phase }) {
  const left = bounds.x;
  const top = bounds.y;
  const flecks = [
    { x: left + bounds.width * 0.04, y: top + bounds.height * 0.39, length: 23, width: 3.1, skew: -2 },
    { x: left + bounds.width * 0.27, y: top + bounds.height * 0.72, length: 16, width: 2.4, skew: -5 },
    { x: left + bounds.width * 0.48, y: top + bounds.height * 0.16, length: 28, width: 2.8, skew: 2 },
    { x: left + bounds.width * 0.69, y: top + bounds.height * 0.57, length: 19, width: 2.2, skew: -4 },
    { x: left + bounds.width * 0.86, y: top + bounds.height * 0.34, length: 13, width: 1.8, skew: 3 },
  ];
  context.fillStyle = PALETTE.interactive;
  flecks.forEach((fleck, index) => {
    context.globalAlpha = (index % 2 === 0 ? edgeAlpha : haloAlpha) * (0.52 - index * 0.035);
    traceBrushFleck(context, fleck, phase + index * 0.23);
    context.fill();
  });
}

function traceBrushFleck(context, { x, y, length, width, skew }, phase) {
  const wobble = Math.sin(phase * 17) * 1.2;
  context.beginPath();
  context.moveTo(x, y + wobble);
  context.lineTo(x + length, y + skew - width * 0.35);
  context.lineTo(x + length * 0.74, y + skew + width * 0.48);
  context.lineTo(x + length * 0.16, y + width + wobble * 0.3);
  context.closePath();
}

function drawPaintedMote(context, mote) {
  context.save();
  context.translate(mote.x, mote.y);
  context.rotate(mote.angle * 0.12);
  context.globalAlpha = mote.alpha * 0.34;
  context.fillStyle = PALETTE.interactive;
  traceMoteShape(context, mote, mote.size * 1.85, mote.angle);
  context.fill();
  context.globalAlpha = mote.alpha;
  context.fillStyle = PALETTE.candle;
  traceMoteShape(context, mote, mote.size, mote.angle + 0.8);
  context.fill();
  context.globalAlpha = mote.alpha * 0.8;
  context.fillStyle = PALETTE.parchment;
  traceMoteShape(
    context,
    mote,
    mote.size * 0.43,
    mote.angle + 1.7,
    -mote.size * 0.15,
    -mote.size * 0.18,
  );
  context.fill();
  context.restore();
}

function traceMoteShape(context, mote, radius, phase, offsetX = 0, offsetY = 0) {
  if (mote.shape === 'dash') {
    traceBrushFleck(context, {
      x: offsetX - radius,
      y: offsetY,
      length: radius * 2.15,
      width: Math.max(1, radius * 0.34),
      skew: -radius * 0.28,
    }, phase);
  } else if (mote.shape === 'dust') {
    organicMotePath(context, radius * 0.58, phase, offsetX, offsetY);
  } else paintedSparkPath(context, radius, phase, offsetX, offsetY);
}

function drawScheduledGlint(context, presentation) {
  const shortSide = Math.min(presentation.bounds.width, presentation.bounds.height);
  const radius = Math.min(12, shortSide * 0.2);
  const tierAlpha = presentation.tier === 'secret' ? 0.72 : 1;
  context.save();
  context.translate(presentation.x, presentation.y);
  context.rotate(-0.42);

  context.globalAlpha = presentation.alpha * tierAlpha * 0.28;
  context.fillStyle = PALETTE.interactive;
  paintedSparkPath(context, radius * 1.8, presentation.phase * TAU);
  context.fill();

  context.globalAlpha = presentation.alpha * tierAlpha;
  context.fillStyle = PALETTE.honey;
  paintedSparkPath(context, radius, presentation.phase * TAU + 0.8);
  context.fill();

  context.globalAlpha = presentation.alpha * tierAlpha * 0.78;
  context.fillStyle = PALETTE.parchment;
  paintedSparkPath(context, radius * 0.36, presentation.phase * TAU + 1.7, radius * 0.08, -1.2);
  context.fill();
  context.restore();
}

function traceTargetShape(context, bounds, padding, phase) {
  if (bounds.shape === 'wand-case') traceOrganicWandCase(context, bounds, padding, phase);
  else if (bounds.shape === 'wand') traceOrganicWand(context, bounds, padding, phase);
  else if (bounds.shape === 'door') traceOrganicDoor(context, bounds, padding, phase);
  else if (bounds.shape === 'guide') traceOrganicGuide(context, bounds, padding, phase);
  else if (bounds.shape === 'figure') traceOrganicFigure(context, bounds, padding, phase);
  else if (bounds.shape === 'robes') traceOrganicRobes(context, bounds, padding, phase);
  else if (bounds.shape === 'owl') traceOrganicOwl(context, bounds, padding, phase);
  else if (bounds.shape === 'rect' || bounds.shape === 'letter') {
    traceOrganicRect(context, bounds, padding, phase);
  } else traceOrganicEllipse(context, bounds, padding, phase);
}

function traceOrganicWandCase(context, bounds, padding, phase) {
  const left = bounds.x - padding;
  const right = bounds.x + bounds.width + padding;
  const top = bounds.y - padding;
  const bottom = bounds.y + bounds.height + padding;
  const lip = Math.min(bounds.width * 0.08, bounds.height * 0.28 + padding * 0.2);
  const wobble = Math.sin(phase * 19) * 1.7;

  // The painted cases are subtly wider at their upholstered base. This loose
  // six-sided contour follows that silhouette without turning the hint into a
  // ruler-perfect UI rectangle.
  context.beginPath();
  context.moveTo(left + lip, top + wobble);
  context.quadraticCurveTo((left + right) / 2, top - wobble, right - lip, top + wobble * 0.35);
  context.quadraticCurveTo(right + wobble, top + lip * 0.55, right, bottom - lip * 0.34);
  context.quadraticCurveTo(right - lip * 0.2, bottom + wobble, right - lip, bottom);
  context.quadraticCurveTo((left + right) / 2, bottom - wobble * 0.45, left + lip, bottom);
  context.quadraticCurveTo(left + wobble * 0.35, bottom - lip * 0.18, left, top + lip * 0.62);
  context.quadraticCurveTo(left + lip * 0.18, top + wobble * 0.25, left + lip, top + wobble);
  context.closePath();
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

function paintedSparkPath(context, radius, phase, offsetX = 0, offsetY = 0) {
  const points = [];
  const rayScale = [1, 0.7, 0.9, 0.62, 0.82];
  const hollowScale = [0.2, 0.3, 0.23, 0.27, 0.18];
  for (let index = 0; index < 10; index += 1) {
    const angle = index * TAU / 10 + phase * 0.07 - Math.PI / 2;
    const longRay = index % 2 === 0;
    const ray = Math.floor(index / 2);
    const distance = radius * (longRay ? rayScale[ray] : hollowScale[ray]);
    points.push({
      x: offsetX + Math.cos(angle) * distance,
      y: offsetY + Math.sin(angle) * distance * (ray % 2 === 0 ? 1.08 : 0.86),
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
