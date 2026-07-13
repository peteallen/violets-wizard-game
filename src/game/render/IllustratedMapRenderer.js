import { PALETTE, WORLD } from '../config.js';
import { MAP_FOG_STATES } from '../core/MapState.js';
import {
  drawAffordancePresentation,
  worldAffordanceState,
} from './WorldAffordanceRenderer.js';

const TAU = Math.PI * 2;
const ARTBOARD = Object.freeze({ x: 0, y: 0, width: WORLD.width, height: WORLD.height });
const MAP_FIELD = Object.freeze({ x: 88, y: 218, width: 1104, height: 412 });
const VIGNETTE_KINDS = new Set(['street', 'wand-shop', 'robes-shop', 'pet-shop']);

// This is the deterministic, code-only layer for VU-05. It deliberately does
// not claim that the paused painted-map asset or its review has been completed.
export const ILLUSTRATED_MAP_RENDERER_STATUS = 'code-only-foundation';

export class IllustratedMapRenderer {
  draw(context, mapState, worldSnapshot, time = 0, options = {}) {
    const presentation = createIllustratedMapPresentation(
      mapState,
      worldSnapshot,
      time,
      options,
    );
    drawIllustratedMapPresentation(context, presentation);
    return presentation;
  }
}

export function createIllustratedMapPresentation(
  mapState,
  worldSnapshot = {},
  time = 0,
  {
    frame = ARTBOARD,
    reducedMotion = false,
    quiet = false,
  } = {},
) {
  if (!mapState || !Array.isArray(mapState.locations) || !Array.isArray(mapState.routes)) {
    throw new TypeError('createIllustratedMapPresentation requires a built MapState.');
  }
  const normalizedFrame = frozenRect(frame);
  const transform = coordinateTransform(normalizedFrame);
  const field = transformRect(MAP_FIELD, transform);
  const locations = mapState.locations.map((location) => locationPresentation(location, transform));
  const routes = mapState.routes.map((route) => routePresentation(route, transform));
  const hitTargets = locations.map((location) => Object.freeze({
    id: location.id,
    hitArea: Object.freeze({ shape: 'rect', ...location.vignette }),
    enabled: location.unlocked,
    travelIntent: location.travelIntent
      ? Object.freeze({ ...location.travelIntent })
      : null,
  }));
  const objective = quiet
    ? null
    : objectivePresentation(locations, worldSnapshot?.affordances?.thread, time, {
        reducedMotion,
      });

  return Object.freeze({
    kind: ILLUSTRATED_MAP_RENDERER_STATUS,
    mapId: mapState.id,
    frame: normalizedFrame,
    field,
    locations: Object.freeze(locations),
    routes: Object.freeze(routes),
    hitTargets: Object.freeze(hitTargets),
    objective,
  });
}

export function drawIllustratedMapPresentation(context, presentation) {
  context.save();
  drawParchmentField(context, presentation.field, stablePhase(presentation.mapId));
  for (const route of presentation.routes) drawQuillRoute(context, route);
  for (const location of presentation.locations) drawLocationVignette(context, location);
  if (presentation.objective) {
    drawPaintedObjectiveStar(context, presentation.objective.marker);
    drawAffordancePresentation(context, presentation.objective.affordance);
  }
  context.restore();
}

function locationPresentation(location, transform) {
  const vignette = transformRect(location.vignette, transform);
  const phase = stablePhase(location.id);
  return Object.freeze({
    id: location.id,
    icon: location.icon,
    caption: location.caption,
    kind: VIGNETTE_KINDS.has(location.icon) ? location.icon : 'street',
    objectiveTarget: location.objectiveTarget
      ? Object.freeze({ ...location.objectiveTarget })
      : null,
    vignette,
    unlocked: location.unlocked,
    fogState: location.fogState,
    travelIntent: location.travelIntent
      ? Object.freeze({ ...location.travelIntent })
      : null,
    phase,
    fogWisps: Object.freeze(
      location.fogState === MAP_FOG_STATES.soft
        ? createFogWisps(vignette, phase)
        : [],
    ),
  });
}

function routePresentation(route, transform) {
  return Object.freeze({
    id: route.id,
    from: route.from,
    to: route.to,
    unlocked: route.unlocked,
    fogState: route.fogState,
    phase: stablePhase(route.id),
    points: Object.freeze(route.points.map((point) => Object.freeze(transformPoint(point, transform)))),
  });
}

function objectivePresentation(locations, thread, time, { reducedMotion }) {
  const mapTargetId = thread?.mapTargetId ?? null;
  if (!mapTargetId) return null;
  const location = locations.find(
    (candidate) => candidate.objectiveTarget?.hotspot === mapTargetId,
  );
  if (!location) return null;

  const shortSide = Math.min(location.vignette.width, location.vignette.height);
  const marker = Object.freeze({
    x: location.vignette.x + location.vignette.width * 0.82,
    y: location.vignette.y + location.vignette.height * 0.19,
    radius: shortSide * 0.105,
    phase: stablePhase(mapTargetId),
  });
  const target = Object.freeze({
    id: mapTargetId,
    semanticId: mapTargetId,
    kind: 'map-objective',
    hitArea: Object.freeze({
      shape: 'circle',
      x: marker.x,
      y: marker.y,
      radius: marker.radius * 1.25,
    }),
    presentation: Object.freeze({ icon: 'sparkle', glow: 'objective' }),
    salience: Object.freeze({
      tier: 'thread',
      visible: 'thread',
      intensity: thread.intensity ?? 'normal',
      glint: null,
    }),
  });

  // Opening the satchel quiets the world by design. The visible map is its own
  // active surface, so its assigned D31 thread remains visible here. Callers
  // can still suppress it with createIllustratedMapPresentation({ quiet:true })
  // during a transition or another genuinely quiet UI state.
  const affordance = worldAffordanceState(target, time, {
    reducedMotion,
    quiet: false,
  });
  return Object.freeze({
    targetId: mapTargetId,
    locationId: location.id,
    marker,
    target,
    affordance,
  });
}

function drawParchmentField(context, field, phase) {
  context.save();

  context.fillStyle = 'rgba(39, 26, 25, 0.35)';
  traceOrganicRect(context, offsetRect(field, 9, 12), phase + 0.31, 12);
  context.fill();

  context.fillStyle = '#d8bc83';
  traceOrganicRect(context, field, phase, 13);
  context.fill();
  context.strokeStyle = '#5f402b';
  context.lineWidth = 6;
  context.lineJoin = 'round';
  context.stroke();

  context.save();
  traceOrganicRect(context, insetRect(field, 5), phase + 0.09, 10);
  context.clip();

  context.fillStyle = '#ecd7aa';
  traceUpperWash(context, field, phase);
  context.fill();
  context.fillStyle = '#b78958';
  traceLowerWash(context, field, phase);
  context.fill();
  context.fillStyle = 'rgba(250, 229, 173, 0.34)';
  traceLightWash(context, field, phase);
  context.fill();

  drawPaperFibres(context, field, phase);
  drawMapLandforms(context, field, phase);
  context.restore();

  context.strokeStyle = '#9a6d3f';
  context.lineWidth = 2.2;
  traceOrganicRect(context, insetRect(field, 13), phase + 0.17, 7);
  context.stroke();
  context.restore();
}

function drawPaperFibres(context, field, phase) {
  context.save();
  context.strokeStyle = 'rgba(91, 58, 38, 0.16)';
  context.lineCap = 'round';
  context.lineWidth = 1.2;
  for (let index = 0; index < 18; index += 1) {
    const x = field.x + field.width * (0.05 + ((index * 0.173 + phase * 0.11) % 0.9));
    const y = field.y + field.height * (0.08 + ((index * 0.287 + phase * 0.19) % 0.84));
    const length = field.width * (0.018 + (index % 4) * 0.006);
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + length * 0.48, y - 2 + (index % 3), x + length, y + 1.5);
    context.stroke();
  }
  context.restore();
}

function drawMapLandforms(context, field, phase) {
  const baseline = field.y + field.height * 0.73;
  context.save();
  context.globalAlpha = 0.2;
  context.fillStyle = '#7a744a';
  context.beginPath();
  context.moveTo(field.x - 12, baseline);
  for (let index = 0; index <= 8; index += 1) {
    const x = field.x + field.width * index / 8;
    const y = baseline - field.height * (0.055 + 0.04 * Math.sin(index * 1.7 + phase * TAU));
    context.quadraticCurveTo(x - field.width / 32, y - 9, x, y);
  }
  context.lineTo(field.x + field.width + 12, field.y + field.height + 12);
  context.lineTo(field.x - 12, field.y + field.height + 12);
  context.closePath();
  context.fill();
  context.restore();
}

function drawQuillRoute(context, route) {
  if (route.points.length < 2) return;
  context.save();
  context.globalAlpha = route.fogState === MAP_FOG_STATES.soft ? 0.36 : 0.78;
  for (const mark of sampleQuillRouteMarks(route.points, route.phase)) {
    drawQuillMark(context, mark);
  }
  context.restore();
}

export function sampleQuillRouteMarks(points, phase = 0) {
  if (!Array.isArray(points) || points.length < 2) return Object.freeze([]);
  const safePhase = Number.isFinite(phase) ? phase : 0;
  const marks = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const wobble = Math.sin(safePhase * 31 + index * 2.17) * Math.min(9, length * 0.065);
    const controlX = (previous.x + point.x) / 2 - dy / length * wobble;
    const controlY = (previous.y + point.y) / 2 + dx / length * wobble;
    const curveLength = Math.hypot(controlX - previous.x, controlY - previous.y)
      + Math.hypot(point.x - controlX, point.y - controlY);
    const markCount = Math.max(2, Math.round(curveLength / 24));
    for (let markIndex = 0; markIndex < markCount; markIndex += 1) {
      const t = (markIndex + 0.5) / markCount;
      const inverse = 1 - t;
      const curveX = inverse * inverse * previous.x
        + 2 * inverse * t * controlX
        + t * t * point.x;
      const curveY = inverse * inverse * previous.y
        + 2 * inverse * t * controlY
        + t * t * point.y;
      const tangentX = 2 * inverse * (controlX - previous.x) + 2 * t * (point.x - controlX);
      const tangentY = 2 * inverse * (controlY - previous.y) + 2 * t * (point.y - controlY);
      const tangentLength = Math.max(1, Math.hypot(tangentX, tangentY));
      const rhythm = safePhase * 43 + index * 5.17 + markIndex * 1.91;
      const offset = Math.sin(rhythm) * 1.15;
      marks.push(Object.freeze({
        x: curveX - tangentY / tangentLength * offset,
        y: curveY + tangentX / tangentLength * offset,
        angle: Math.atan2(tangentY, tangentX) + Math.sin(rhythm * 0.71) * 0.045,
        length: 9.2 + (Math.sin(rhythm * 1.13) + 1) * 1.25,
        width: 4.1 + (Math.cos(rhythm * 0.83) + 1) * 0.55,
      }));
    }
  }
  return Object.freeze(marks);
}

function drawQuillMark(context, mark) {
  const halfLength = mark.length / 2;
  const halfWidth = mark.width / 2;
  context.save();
  context.translate(mark.x, mark.y);
  context.rotate(mark.angle);

  context.fillStyle = '#5a3827';
  context.beginPath();
  context.moveTo(-halfLength, -halfWidth * 0.38);
  context.bezierCurveTo(
    -halfLength * 0.42,
    -halfWidth,
    halfLength * 0.48,
    -halfWidth * 0.74,
    halfLength,
    -halfWidth * 0.08,
  );
  context.bezierCurveTo(
    halfLength * 0.52,
    halfWidth * 0.82,
    -halfLength * 0.5,
    halfWidth * 0.72,
    -halfLength,
    -halfWidth * 0.38,
  );
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(211,164,83,0.5)';
  context.beginPath();
  context.moveTo(-halfLength * 0.48, -halfWidth * 0.2);
  context.bezierCurveTo(
    -halfLength * 0.12,
    -halfWidth * 0.48,
    halfLength * 0.42,
    -halfWidth * 0.36,
    halfLength * 0.62,
    -halfWidth * 0.06,
  );
  context.bezierCurveTo(
    halfLength * 0.24,
    halfWidth * 0.18,
    -halfLength * 0.22,
    halfWidth * 0.16,
    -halfLength * 0.48,
    -halfWidth * 0.2,
  );
  context.closePath();
  context.fill();
  context.restore();
}

function drawLocationVignette(context, location) {
  const rect = location.vignette;
  context.save();
  context.fillStyle = 'rgba(55, 35, 29, 0.31)';
  traceVignetteShape(context, offsetRect(rect, 5, 8), location.phase + 0.11);
  context.fill();

  context.fillStyle = '#caa66c';
  traceVignetteShape(context, rect, location.phase);
  context.fill();
  context.strokeStyle = '#523629';
  context.lineWidth = 5.4;
  context.stroke();

  context.save();
  traceVignetteShape(context, insetRect(rect, 5), location.phase + 0.07);
  context.clip();
  drawVignetteSkyAndGround(context, rect, location.phase);
  if (location.kind === 'wand-shop') drawWandShop(context, rect, location.phase);
  else if (location.kind === 'robes-shop') drawRobesShop(context, rect, location.phase);
  else if (location.kind === 'pet-shop') drawPetShop(context, rect, location.phase);
  else drawStreet(context, rect, location.phase);
  context.restore();

  context.strokeStyle = '#b48145';
  context.lineWidth = 2;
  traceVignetteShape(context, insetRect(rect, 10), location.phase + 0.19);
  context.stroke();

  for (const wisp of location.fogWisps) drawFogWisp(context, wisp);
  context.restore();
}

function drawVignetteSkyAndGround(context, rect, phase) {
  context.fillStyle = '#d8c795';
  traceOrganicRect(context, insetRect(rect, 2), phase + 0.43, 5);
  context.fill();

  context.fillStyle = '#eddcae';
  context.beginPath();
  context.moveTo(rect.x - 5, rect.y - 5);
  context.lineTo(rect.x + rect.width + 5, rect.y - 5);
  context.lineTo(rect.x + rect.width + 5, rect.y + rect.height * 0.52);
  context.bezierCurveTo(
    rect.x + rect.width * 0.68,
    rect.y + rect.height * 0.43,
    rect.x + rect.width * 0.36,
    rect.y + rect.height * 0.58,
    rect.x - 5,
    rect.y + rect.height * 0.48,
  );
  context.closePath();
  context.fill();

  context.fillStyle = '#98724b';
  context.beginPath();
  context.moveTo(rect.x - 5, rect.y + rect.height * 0.65);
  context.bezierCurveTo(
    rect.x + rect.width * 0.28,
    rect.y + rect.height * (0.59 + Math.sin(phase * TAU) * 0.02),
    rect.x + rect.width * 0.68,
    rect.y + rect.height * 0.76,
    rect.x + rect.width + 5,
    rect.y + rect.height * 0.62,
  );
  context.lineTo(rect.x + rect.width + 5, rect.y + rect.height + 5);
  context.lineTo(rect.x - 5, rect.y + rect.height + 5);
  context.closePath();
  context.fill();
}

function drawStreet(context, rect, phase) {
  const baseY = rect.y + rect.height * 0.75;
  drawCrookedShop(context, {
    x: rect.x + rect.width * 0.12,
    y: rect.y + rect.height * 0.25,
    width: rect.width * 0.31,
    height: rect.height * 0.52,
  }, '#75533a', '#4b352d', '#d9ad5d', phase);
  drawCrookedShop(context, {
    x: rect.x + rect.width * 0.48,
    y: rect.y + rect.height * 0.18,
    width: rect.width * 0.36,
    height: rect.height * 0.58,
  }, '#8b5f42', '#573c31', '#efc36c', phase + 0.29);
  context.strokeStyle = '#4b3429';
  context.lineCap = 'round';
  context.lineWidth = 4.2;
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.08, baseY);
  context.bezierCurveTo(
    rect.x + rect.width * 0.38,
    baseY - 10,
    rect.x + rect.width * 0.63,
    baseY + 7,
    rect.x + rect.width * 0.92,
    baseY - 3,
  );
  context.stroke();
}

function drawWandShop(context, rect, phase) {
  drawCrookedShop(context, {
    x: rect.x + rect.width * 0.2,
    y: rect.y + rect.height * 0.17,
    width: rect.width * 0.6,
    height: rect.height * 0.61,
  }, '#684634', '#3f2e28', '#efb95f', phase);
  context.save();
  context.translate(rect.x + rect.width * 0.52, rect.y + rect.height * 0.42);
  context.rotate(-0.27 + Math.sin(phase * 19) * 0.03);
  context.strokeStyle = '#30251f';
  context.lineCap = 'round';
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-rect.width * 0.19, 5);
  context.quadraticCurveTo(0, -3, rect.width * 0.2, -6);
  context.stroke();
  context.strokeStyle = '#d9a750';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(-rect.width * 0.16, 3);
  context.quadraticCurveTo(0, -1, rect.width * 0.17, -5);
  context.stroke();
  context.restore();
}

function drawRobesShop(context, rect, phase) {
  drawCrookedShop(context, {
    x: rect.x + rect.width * 0.16,
    y: rect.y + rect.height * 0.19,
    width: rect.width * 0.68,
    height: rect.height * 0.59,
  }, '#76506a', '#483444', '#d5a459', phase);
  const centerX = rect.x + rect.width * 0.5;
  const top = rect.y + rect.height * 0.33;
  const bottom = rect.y + rect.height * 0.73;
  const half = rect.width * 0.17;
  context.fillStyle = '#5b365f';
  context.beginPath();
  context.moveTo(centerX - half * 0.28, top);
  context.quadraticCurveTo(centerX, top + 10, centerX + half * 0.28, top);
  context.bezierCurveTo(centerX + half * 0.62, top + 14, centerX + half, bottom - 8, centerX + half * 0.86, bottom);
  context.quadraticCurveTo(centerX, bottom - 10, centerX - half * 0.86, bottom);
  context.bezierCurveTo(centerX - half, bottom - 8, centerX - half * 0.62, top + 14, centerX - half * 0.28, top);
  context.closePath();
  context.fill();
  context.strokeStyle = '#372936';
  context.lineWidth = 3.2;
  context.stroke();
  context.strokeStyle = '#bd8fc2';
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(centerX - 2, top + 12);
  context.quadraticCurveTo(centerX + 8, (top + bottom) / 2, centerX - 5, bottom - 8);
  context.stroke();
}

function drawPetShop(context, rect, phase) {
  drawCrookedShop(context, {
    x: rect.x + rect.width * 0.15,
    y: rect.y + rect.height * 0.22,
    width: rect.width * 0.7,
    height: rect.height * 0.56,
  }, '#55705f', '#34493e', '#e1b661', phase);
  const centerX = rect.x + rect.width * 0.5;
  const centerY = rect.y + rect.height * 0.5;
  const size = Math.min(rect.width, rect.height) * 0.18;
  context.fillStyle = '#6b4938';
  context.beginPath();
  context.moveTo(centerX, centerY - size * 0.72);
  context.lineTo(centerX - size * 0.56, centerY - size);
  context.quadraticCurveTo(centerX - size, centerY - size * 0.34, centerX - size * 0.84, centerY + size * 0.32);
  context.quadraticCurveTo(centerX, centerY + size, centerX + size * 0.84, centerY + size * 0.32);
  context.quadraticCurveTo(centerX + size, centerY - size * 0.34, centerX + size * 0.56, centerY - size);
  context.closePath();
  context.fill();
  context.strokeStyle = '#382a24';
  context.lineWidth = 3.2;
  context.stroke();
  context.fillStyle = '#d8b668';
  traceOrganicSpot(context, centerX - size * 0.28, centerY - size * 0.08, size * 0.13, phase);
  context.fill();
  traceOrganicSpot(context, centerX + size * 0.28, centerY - size * 0.08, size * 0.13, phase + 0.4);
  context.fill();
}

function drawCrookedShop(context, rect, wall, shadow, windowLight, phase) {
  context.fillStyle = shadow;
  traceCrookedFacade(context, offsetRect(rect, 4, 5), phase + 0.21);
  context.fill();
  context.fillStyle = wall;
  traceCrookedFacade(context, rect, phase);
  context.fill();
  context.strokeStyle = '#392a24';
  context.lineWidth = 3.4;
  context.stroke();

  const window = {
    x: rect.x + rect.width * 0.26,
    y: rect.y + rect.height * 0.38,
    width: rect.width * 0.48,
    height: rect.height * 0.32,
  };
  context.fillStyle = '#5a3a2c';
  traceOrganicRect(context, window, phase + 0.31, 3);
  context.fill();
  context.fillStyle = windowLight;
  traceOrganicRect(context, insetRect(window, 4), phase + 0.43, 2);
  context.fill();
  context.fillStyle = 'rgba(250, 227, 168, 0.52)';
  traceLightWash(context, window, phase + 0.51);
  context.fill();
}

function traceCrookedFacade(context, rect, phase) {
  const wobble = Math.sin(phase * 29) * rect.width * 0.025;
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.07, rect.y + rect.height);
  context.lineTo(rect.x + rect.width * 0.03 - wobble, rect.y + rect.height * 0.22);
  context.lineTo(rect.x + rect.width * 0.32, rect.y + rect.height * 0.04 + wobble);
  context.quadraticCurveTo(rect.x + rect.width * 0.54, rect.y - rect.height * 0.12, rect.x + rect.width * 0.78, rect.y + rect.height * 0.05);
  context.lineTo(rect.x + rect.width * 0.97 + wobble, rect.y + rect.height * 0.24);
  context.lineTo(rect.x + rect.width * 0.91, rect.y + rect.height);
  context.quadraticCurveTo(rect.x + rect.width * 0.48, rect.y + rect.height * 0.94, rect.x + rect.width * 0.07, rect.y + rect.height);
  context.closePath();
}

function createFogWisps(rect, phase) {
  return Array.from({ length: 4 }, (_, index) => {
    const lane = (index + 0.5) / 4;
    const drift = Math.sin(phase * 37 + index * 1.83) * rect.width * 0.055;
    return Object.freeze({
      x: rect.x - rect.width * 0.08 + drift,
      y: rect.y + rect.height * (0.14 + lane * 0.7),
      width: rect.width * (1.13 - (index % 2) * 0.08),
      height: rect.height * (0.18 + (index % 3) * 0.025),
      alpha: 0.64 + (index % 2) * 0.1,
      phase: phase + index * 0.17,
    });
  });
}

function drawFogWisp(context, wisp) {
  context.save();
  context.globalAlpha = wisp.alpha * 0.32;
  context.fillStyle = '#8f806d';
  traceFogShape(context, offsetRect(wisp, 3, 5), wisp.phase + 0.21);
  context.fill();
  context.globalAlpha = wisp.alpha;
  context.fillStyle = '#eadfc5';
  traceFogShape(context, wisp, wisp.phase);
  context.fill();
  context.globalAlpha = wisp.alpha * 0.52;
  context.fillStyle = '#f5e9c9';
  traceFogShape(context, insetRect(wisp, Math.max(2, wisp.height * 0.16)), wisp.phase + 0.37);
  context.fill();
  context.restore();
}

function traceFogShape(context, rect, phase) {
  const wobble = Math.sin(phase * 31) * rect.height * 0.13;
  context.beginPath();
  context.moveTo(rect.x, rect.y + rect.height * 0.55);
  context.bezierCurveTo(
    rect.x + rect.width * 0.13,
    rect.y + wobble,
    rect.x + rect.width * 0.3,
    rect.y + rect.height * 0.42,
    rect.x + rect.width * 0.42,
    rect.y + rect.height * 0.22,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.56,
    rect.y - wobble,
    rect.x + rect.width * 0.72,
    rect.y + rect.height * 0.48,
    rect.x + rect.width,
    rect.y + rect.height * 0.36,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.84,
    rect.y + rect.height * 1.08,
    rect.x + rect.width * 0.55,
    rect.y + rect.height * 0.68,
    rect.x + rect.width * 0.36,
    rect.y + rect.height * 0.84,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.21,
    rect.y + rect.height * 1.05,
    rect.x + rect.width * 0.08,
    rect.y + rect.height * 0.72,
    rect.x,
    rect.y + rect.height * 0.55,
  );
  context.closePath();
}

function drawPaintedObjectiveStar(context, marker) {
  context.save();
  context.fillStyle = '#76502b';
  traceOrganicStar(context, marker.x + 3, marker.y + 5, marker.radius * 1.08, marker.phase + 0.19);
  context.fill();
  context.fillStyle = PALETTE.candle;
  traceOrganicStar(context, marker.x, marker.y, marker.radius, marker.phase);
  context.fill();
  context.strokeStyle = '#5c3c27';
  context.lineWidth = 2.8;
  context.stroke();
  context.fillStyle = PALETTE.honey;
  traceOrganicStar(context, marker.x - marker.radius * 0.12, marker.y - marker.radius * 0.14, marker.radius * 0.46, marker.phase + 0.37);
  context.fill();
  context.restore();
}

function traceOrganicStar(context, x, y, radius, phase) {
  const points = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * TAU / 10;
    const baseRadius = index % 2 === 0 ? radius : radius * 0.44;
    const wobble = 1 + Math.sin(phase * 41 + index * 2.33) * 0.075;
    points.push({
      x: x + Math.cos(angle) * baseRadius * wobble,
      y: y + Math.sin(angle) * baseRadius * (2 - wobble),
    });
  }
  traceOrganicLoop(context, points);
}

function traceVignetteShape(context, rect, phase) {
  const points = [];
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  for (let index = 0; index < 14; index += 1) {
    const angle = index * TAU / 14;
    const wobble = 0.96 + Math.sin(phase * 23 + index * 1.73) * 0.045;
    points.push({
      x: centerX + Math.cos(angle) * rect.width * 0.5 * wobble,
      y: centerY + Math.sin(angle) * rect.height * 0.5 * (2 - wobble),
    });
  }
  traceOrganicLoop(context, points);
}

function traceOrganicSpot(context, x, y, radius, phase) {
  const points = [];
  for (let index = 0; index < 7; index += 1) {
    const angle = index * TAU / 7;
    const wobble = 0.84 + ((index + Math.floor(phase * 9)) % 3) * 0.08;
    points.push({
      x: x + Math.cos(angle) * radius * wobble,
      y: y + Math.sin(angle) * radius * (1.08 - (wobble - 0.84) * 0.25),
    });
  }
  traceOrganicLoop(context, points);
}

function traceOrganicRect(context, rect, phase, depth) {
  const corner = Math.min(rect.width, rect.height) * 0.07;
  const wobble = (index) => Math.sin(phase * 29 + index * 1.67) * depth;
  traceOrganicLoop(context, [
    { x: rect.x + corner, y: rect.y + wobble(0) },
    { x: rect.x + rect.width * 0.35, y: rect.y + wobble(1) },
    { x: rect.x + rect.width * 0.68, y: rect.y + wobble(2) },
    { x: rect.x + rect.width - corner, y: rect.y + wobble(3) },
    { x: rect.x + rect.width + wobble(4), y: rect.y + corner },
    { x: rect.x + rect.width + wobble(5), y: rect.y + rect.height * 0.5 },
    { x: rect.x + rect.width + wobble(6), y: rect.y + rect.height - corner },
    { x: rect.x + rect.width - corner, y: rect.y + rect.height + wobble(7) },
    { x: rect.x + rect.width * 0.63, y: rect.y + rect.height + wobble(8) },
    { x: rect.x + rect.width * 0.29, y: rect.y + rect.height + wobble(9) },
    { x: rect.x + corner, y: rect.y + rect.height + wobble(10) },
    { x: rect.x + wobble(11), y: rect.y + rect.height - corner },
    { x: rect.x + wobble(12), y: rect.y + rect.height * 0.47 },
    { x: rect.x + wobble(13), y: rect.y + corner },
  ]);
}

function traceOrganicLoop(context, points) {
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

function traceUpperWash(context, rect, phase) {
  const wobble = Math.sin(phase * 17) * rect.height * 0.025;
  context.beginPath();
  context.moveTo(rect.x - 12, rect.y - 12);
  context.lineTo(rect.x + rect.width + 12, rect.y - 12);
  context.lineTo(rect.x + rect.width + 12, rect.y + rect.height * 0.38);
  context.bezierCurveTo(
    rect.x + rect.width * 0.72,
    rect.y + rect.height * 0.31 + wobble,
    rect.x + rect.width * 0.29,
    rect.y + rect.height * 0.45 - wobble,
    rect.x - 12,
    rect.y + rect.height * 0.36,
  );
  context.closePath();
}

function traceLowerWash(context, rect, phase) {
  const wobble = Math.cos(phase * 23) * rect.height * 0.025;
  context.beginPath();
  context.moveTo(rect.x - 12, rect.y + rect.height * 0.73);
  context.bezierCurveTo(
    rect.x + rect.width * 0.27,
    rect.y + rect.height * 0.65 + wobble,
    rect.x + rect.width * 0.66,
    rect.y + rect.height * 0.82 - wobble,
    rect.x + rect.width + 12,
    rect.y + rect.height * 0.69,
  );
  context.lineTo(rect.x + rect.width + 12, rect.y + rect.height + 12);
  context.lineTo(rect.x - 12, rect.y + rect.height + 12);
  context.closePath();
}

function traceLightWash(context, rect, phase) {
  const inset = Math.min(rect.width, rect.height) * 0.1;
  context.beginPath();
  context.moveTo(rect.x + inset, rect.y + inset * 0.7);
  context.bezierCurveTo(
    rect.x + rect.width * 0.35,
    rect.y + inset * (0.18 + phase % 0.2),
    rect.x + rect.width * 0.66,
    rect.y + inset * 0.82,
    rect.x + rect.width - inset,
    rect.y + rect.height * 0.26,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.62,
    rect.y + rect.height * 0.31,
    rect.x + rect.width * 0.34,
    rect.y + rect.height * 0.37,
    rect.x + inset,
    rect.y + inset * 0.7,
  );
  context.closePath();
}

function coordinateTransform(frame) {
  return Object.freeze({
    scaleX: frame.width / ARTBOARD.width,
    scaleY: frame.height / ARTBOARD.height,
    offsetX: frame.x,
    offsetY: frame.y,
  });
}

function transformPoint(point, transform) {
  return {
    x: transform.offsetX + point.x * transform.scaleX,
    y: transform.offsetY + point.y * transform.scaleY,
  };
}

function transformRect(rect, transform) {
  const point = transformPoint(rect, transform);
  return Object.freeze({
    x: point.x,
    y: point.y,
    width: rect.width * transform.scaleX,
    height: rect.height * transform.scaleY,
  });
}

function frozenRect(rect) {
  if (![rect?.x, rect?.y, rect?.width, rect?.height].every(Number.isFinite)) {
    throw new TypeError('Illustrated map frame must contain finite x, y, width, and height.');
  }
  if (rect.width <= 0 || rect.height <= 0) {
    throw new RangeError('Illustrated map frame dimensions must be positive.');
  }
  return Object.freeze({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
}

function insetRect(rect, amount) {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: Math.max(1, rect.width - amount * 2),
    height: Math.max(1, rect.height - amount * 2),
  };
}

function offsetRect(rect, x, y) {
  return { ...rect, x: rect.x + x, y: rect.y + y };
}

function midpoint(first, second) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function stablePhase(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}
