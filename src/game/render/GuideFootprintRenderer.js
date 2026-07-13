import { PALETTE } from '../config.js';

const FOOTPRINT_SPACING = 52;
const MIN_FOOTPRINTS = 3;
const MAX_FOOTPRINTS = 10;

export class GuideFootprintRenderer {
  draw(context, state, time = 0, { reducedMotion = false } = {}) {
    const presentation = guideFootprintPresentation(state?.tapToWalkCue, time, {
      cameraX: state?.cameraX ?? 0,
      reducedMotion,
    });
    if (!presentation) return;
    for (const footprint of presentation.footprints) drawSparkleFootprint(context, footprint);
  }
}

export function guideFootprintPresentation(cue, time = 0, {
  cameraX = 0,
  reducedMotion = false,
} = {}) {
  const route = cue?.footprints;
  if (!route || route.progress <= 0) return null;
  const dx = route.to.x - route.from.x;
  const dy = route.to.y - route.from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return null;
  const count = Math.max(
    MIN_FOOTPRINTS,
    Math.min(MAX_FOOTPRINTS, Math.round(distance / FOOTPRINT_SPACING)),
  );
  const routeAngle = Math.atan2(dy, dx);
  const normalX = -Math.sin(routeAngle);
  const normalY = Math.cos(routeAngle);
  const visibleCount = Math.min(count, Math.ceil(route.progress * count - 1e-9));
  const footprints = [];

  for (let index = 0; index < visibleCount; index += 1) {
    const pathProgress = (index + 0.72) / (count + 0.44);
    const side = index % 2 === 0 ? -1 : 1;
    const reveal = clamp01(route.progress * count - index);
    const twinkle = reducedMotion ? 0.72 : 0.72 + Math.sin(time * 2.4 + index * 1.73) * 0.13;
    footprints.push(Object.freeze({
      x: route.from.x + dx * pathProgress + normalX * side * 7 - cameraX,
      y: route.from.y + dy * pathProgress + normalY * side * 7,
      angle: routeAngle + side * 0.1,
      side,
      alpha: reveal * twinkle,
      scale: 0.9 + (index % 3) * 0.055,
    }));
  }

  return Object.freeze({
    id: cue.id,
    progress: route.progress,
    footprints: Object.freeze(footprints),
  });
}

function drawSparkleFootprint(context, footprint) {
  context.save();
  context.translate(footprint.x, footprint.y);
  context.rotate(footprint.angle);
  context.scale(footprint.scale, footprint.scale);
  context.globalAlpha = footprint.alpha;

  context.fillStyle = 'rgba(242, 196, 82, 0.18)';
  traceFootprintWash(context, footprint.side);
  context.fill();

  context.fillStyle = PALETTE.interactive;
  traceFootprintSole(context, footprint.side);
  context.fill();

  context.globalAlpha = footprint.alpha * 0.78;
  context.fillStyle = PALETTE.candle;
  drawFourPointSparkle(context, footprint.side * 2, -8, 4.6);
  context.globalAlpha = footprint.alpha * 0.62;
  drawFourPointSparkle(context, -footprint.side * 10, 2, 2.8);
  context.restore();
}

function traceFootprintWash(context, side) {
  context.beginPath();
  context.moveTo(-18, 1 + side);
  context.bezierCurveTo(-17, -7, -8, -11 - side, 2, -9);
  context.bezierCurveTo(12, -8 + side, 20, -4, 18, 3);
  context.bezierCurveTo(15, 10, 5, 11 + side, -5, 9);
  context.bezierCurveTo(-14, 8 - side, -20, 6, -18, 1 + side);
  context.closePath();
}

function traceFootprintSole(context, side) {
  context.beginPath();
  context.moveTo(-13, 2);
  context.bezierCurveTo(-13, -3 - side, -8, -6, -2, -5);
  context.bezierCurveTo(4, -4, 6, 0, 4, 4 + side);
  context.bezierCurveTo(1, 8, -6, 8, -11, 6);
  context.quadraticCurveTo(-14, 5, -13, 2);
  context.closePath();
  context.moveTo(3, -3);
  context.bezierCurveTo(5, -7, 12, -7 + side, 15, -3);
  context.bezierCurveTo(18, 1, 14, 5, 9, 6);
  context.bezierCurveTo(4, 6 - side, 1, 2, 3, -3);
  context.closePath();
}

function drawFourPointSparkle(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.quadraticCurveTo(x + radius * 0.22, y - radius * 0.22, x + radius, y);
  context.quadraticCurveTo(x + radius * 0.22, y + radius * 0.22, x, y + radius);
  context.quadraticCurveTo(x - radius * 0.22, y + radius * 0.22, x - radius, y);
  context.quadraticCurveTo(x - radius * 0.22, y - radius * 0.22, x, y - radius);
  context.closePath();
  context.fill();
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
