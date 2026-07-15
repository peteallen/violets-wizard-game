import { clamp, lerp } from '../../core/math.js';
import { STORYBOOK_INK, STORYBOOK_LINE_WEIGHT } from '../../render/storybookInk.js';

const OUTLINE = STORYBOOK_INK.primary;

const PALETTE_KEYS = Object.freeze([
  'body', 'bodyLight', 'bodyShadow', 'wing', 'wingDark', 'facial', 'facialShadow',
  'iris', 'beak', 'foot', 'fleck', 'accent', 'rim',
]);

function finiteNumber(value, path) {
  if (!Number.isFinite(value)) throw new TypeError(`${path} must be a finite number.`);
  return value;
}

function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

/**
 * Defines the visual grammar supplied by one owl identity. The drawing helper
 * knows only anatomy and motion fields; it never selects a concrete owl.
 */
export function defineOwlDrawingProfile(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new TypeError('Owl drawing profile must be an object.');
  }
  if (typeof source.defaultPose !== 'string' || source.defaultPose.length === 0) {
    throw new TypeError('Owl drawing profile defaultPose must be a non-empty string.');
  }
  finiteNumber(source.defaultScale, 'Owl drawing profile defaultScale');
  if (source.defaultScale <= 0) throw new TypeError('Owl drawing profile defaultScale must be greater than zero.');
  for (const key of PALETTE_KEYS) {
    if (typeof source.palette?.[key] !== 'string' || source.palette[key].length === 0) {
      throw new TypeError(`Owl drawing profile palette.${key} must be a non-empty string.`);
    }
  }
  const motion = source.motion;
  for (const key of [
    'blinkPhase', 'bodyTiltAmplitude', 'idleHeadTiltAmplitude', 'baseTailFan',
  ]) finiteNumber(motion?.[key], `Owl drawing profile motion.${key}`);
  if (motion.idleFlick !== null) {
    for (const key of [
      'timeOffset', 'period', 'start', 'end', 'amount', 'reducedAmount',
      'headTilt', 'beakThreshold', 'beakOpen',
    ]) finiteNumber(motion.idleFlick?.[key], `Owl drawing profile motion.idleFlick.${key}`);
  }
  const geometry = source.geometry;
  if (!Number.isInteger(geometry?.bodyFeatherRows) || geometry.bodyFeatherRows <= 0) {
    throw new TypeError('Owl drawing profile geometry.bodyFeatherRows must be a positive integer.');
  }
  for (const [key, value] of Object.entries(geometry.head ?? {})) {
    if (key === 'flecks') continue;
    finiteNumber(value, `Owl drawing profile geometry.head.${key}`);
  }
  if (!Array.isArray(geometry.head?.flecks) || geometry.head.flecks.length === 0) {
    throw new TypeError('Owl drawing profile geometry.head.flecks must contain points.');
  }
  for (const [index, point] of geometry.head.flecks.entries()) {
    if (!Array.isArray(point) || point.length !== 2) {
      throw new TypeError(`Owl drawing profile geometry.head.flecks[${index}] must be an x/y pair.`);
    }
    finiteNumber(point[0], `Owl drawing profile geometry.head.flecks[${index}][0]`);
    finiteNumber(point[1], `Owl drawing profile geometry.head.flecks[${index}][1]`);
  }
  return deepFreeze(structuredClone(source));
}

export function sampleOwlMotionWithProfile(profile, {
  time = 0,
  phase = 0,
  pose = profile.defaultPose,
  lookX = null,
  lookY = null,
  reducedMotion = false,
} = {}) {
  const t = Math.max(0, time + phase);
  const automaticLookX = Math.sin(t * 0.77 + 0.8) * 0.52 + Math.sin(t * 0.19 + 1.7) * 0.2;
  const automaticLookY = Math.sin(t * 0.43 + 2.2) * 0.22;
  const trackedX = clamp(lookX ?? automaticLookX, -1, 1);
  const trackedY = clamp(lookY ?? automaticLookY, -1, 1);
  const blinkCycle = (t * 0.91 + profile.motion.blinkPhase) % 5.2;
  const blink = blinkCycle > 4.92 ? Math.sin(((blinkCycle - 4.92) / 0.28) * Math.PI) : 0;
  const breath = Math.sin(t * 1.72 + phase * 0.5);
  const curiosity = Math.sin(t * 0.71 + 0.4) * 0.055 + trackedX * 0.13;
  const idleHeadTilt = Math.sin(t * 0.58 + 1.2) * profile.motion.idleHeadTiltAmplitude;

  const motion = {
    bodyBob: breath * (reducedMotion ? 0.55 : 1.35),
    bodyScaleY: 1 + breath * (reducedMotion ? 0.004 : 0.012),
    bodyTilt: Math.sin(t * 0.49 + phase) * profile.motion.bodyTiltAmplitude,
    headTurn: clamp(curiosity, -0.22, 0.22),
    headTilt: clamp(idleHeadTilt + trackedY * 0.045, -0.14, 0.14),
    eyeX: trackedX * 2.8,
    eyeY: trackedY * 1.7,
    blink,
    wingSpread: 0,
    wingBeat: 0,
    wingFlick: 0,
    hop: 0,
    tailFan: profile.motion.baseTailFan,
    beakOpen: 0,
  };

  if (pose === 'takeoff') {
    const launch = clamp(t / 0.55, 0, 1);
    motion.hop = Math.sin(launch * Math.PI) * (reducedMotion ? 4 : 16);
    motion.bodyTilt = -0.08 * launch;
    motion.wingSpread = reducedMotion ? 0.22 : 0.72 * launch;
    motion.wingBeat = reducedMotion ? 0.08 : Math.sin(t * 11.5) * 0.72;
    motion.tailFan = 0.65 * launch;
  } else if (pose === 'flight' || pose === 'delivery') {
    motion.bodyBob = reducedMotion ? 0 : Math.sin(t * 5.4) * 2.4;
    motion.bodyTilt = reducedMotion ? -0.025 : -0.08 + Math.sin(t * 1.8) * 0.035;
    motion.wingSpread = reducedMotion ? 0.25 : 0.92;
    motion.wingBeat = reducedMotion ? 0.08 : Math.sin(t * 13.2) * 0.88;
    motion.tailFan = reducedMotion ? 0.18 : 0.78;
    motion.headTurn *= 0.35;
  } else if (pose === 'settle') {
    const settle = Math.exp(-t * 2.8);
    motion.hop = Math.abs(Math.sin(t * 7.5)) * settle * (reducedMotion ? 2 : 9);
    motion.wingSpread = settle * (reducedMotion ? 0.12 : 0.62);
    motion.wingBeat = Math.sin(t * 10.5) * settle * (reducedMotion ? 0.08 : 0.4);
    motion.tailFan = settle * 0.45;
  } else if (pose === 'follow' || pose === 'pet-follow') {
    const step = Math.max(0, Math.sin(t * 5.3));
    motion.hop = step * step * (reducedMotion ? 2.5 : 8);
    motion.bodyTilt = Math.sin(t * 5.3) * (reducedMotion ? 0.012 : 0.045);
    motion.wingSpread = reducedMotion ? 0.05 : 0.16 + step * 0.16;
    motion.wingBeat = reducedMotion ? 0 : Math.sin(t * 10.6) * 0.24;
    motion.tailFan = 0.18 + step * 0.2;
  } else if (profile.motion.idleFlick) {
    const idleFlick = profile.motion.idleFlick;
    const flickCycle = (t + idleFlick.timeOffset) % idleFlick.period;
    const flick = flickCycle > idleFlick.start && flickCycle < idleFlick.end
      ? Math.sin(((flickCycle - idleFlick.start) / (idleFlick.end - idleFlick.start)) * Math.PI)
      : 0;
    motion.wingFlick = flick * (reducedMotion ? idleFlick.reducedAmount : idleFlick.amount);
    motion.wingSpread = motion.wingFlick;
    motion.headTilt += flick * idleFlick.headTilt;
    motion.beakOpen = flick > idleFlick.beakThreshold ? idleFlick.beakOpen : 0;
  }

  return Object.freeze(motion);
}

export function drawOwlWithProfile(context, owl = {}, time = 0, profile) {
  const { palette } = profile;
  const pose = owl.pose ?? profile.defaultPose;
  const scale = owl.scale ?? profile.defaultScale;
  const direction = owl.facing === 'left' ? -1 : 1;
  const lightSide = owl.lightSide === 'right' ? 'right' : 'left';
  const lightDirection = (lightSide === 'right' ? 1 : -1) * direction;
  const motion = sampleOwlMotionWithProfile(profile, {
    time,
    phase: owl.phase ?? 0,
    pose,
    lookX: owl.lookX,
    lookY: owl.lookY,
    reducedMotion: Boolean(owl.reducedMotion),
  });

  context.save();
  context.globalAlpha *= owl.opacity ?? 1;
  context.translate(owl.x ?? 0, owl.y ?? 0);
  context.scale(direction * scale, scale);
  drawOwlShadow(context, pose, motion);
  context.restore();

  context.save();
  context.globalAlpha *= owl.opacity ?? 1;
  context.translate(owl.x ?? 0, (owl.y ?? 0) - motion.hop + motion.bodyBob);
  context.rotate((owl.rotation ?? 0) + motion.bodyTilt);
  context.scale(direction * scale, scale);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = OUTLINE;
  context.lineWidth = STORYBOOK_LINE_WEIGHT.bold;

  drawTail(context, palette, motion);
  drawFarWing(context, palette, motion);

  context.save();
  context.scale(1, motion.bodyScaleY);
  drawBody(context, palette, profile.geometry, lightDirection);
  context.restore();

  drawNearWing(context, palette, motion);
  drawFeet(context, palette, pose);

  context.save();
  context.translate(motion.headTurn * 22, -1);
  context.rotate(motion.headTilt + motion.headTurn * 0.12);
  context.scale(1 - Math.abs(motion.headTurn) * 0.08, 1);
  drawHead(context, palette, profile.geometry.head, motion, lightDirection);
  context.restore();

  context.restore();
}

function drawOwlShadow(context, pose, motion) {
  if (pose === 'flight' || pose === 'delivery' || pose === 'takeoff') return;
  const lift = Math.min(0.46, motion.hop / 18);
  context.save();
  context.globalAlpha *= 1 - lift;
  context.fillStyle = 'rgba(25,17,24,0.22)';
  traceOrganicOval(context, 2, 7, 34 - lift * 7, 7 - lift * 1.5, 0.28);
  context.fill();
  context.fillStyle = 'rgba(121,77,43,0.1)';
  traceOrganicOval(context, -3, 5, 23 - lift * 5, 3.5, -0.34);
  context.fill();
  context.restore();
}

export function drawOwlBookplate(context, x, y, scale = 1, { color = '#5e4634', accent = '#e8b44f' } = {}) {
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
  traceOrganicOval(context, -8, -9, 7.5, 9, 0.34);
  context.fill();
  traceOrganicOval(context, 8, -9, 7.5, 9, -0.28);
  context.fill();
  context.fillStyle = '#241b18';
  traceOrganicOval(context, -7, -8, 3, 3.2, -0.25);
  context.fill();
  traceOrganicOval(context, 7, -8, 3, 3.2, 0.31);
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

function drawTail(context, palette, motion) {
  const fan = motion.tailFan;
  for (let index = -2; index <= 2; index += 1) {
    const spread = index * (5 + fan * 4);
    context.save();
    context.translate(spread, -15);
    context.rotate(index * fan * 0.08);
    context.fillStyle = index % 2 === 0 ? palette.wing : palette.wingDark;
    context.beginPath();
    context.moveTo(-7, -12);
    context.quadraticCurveTo(-8, 11, 0, 25 + Math.abs(index) * 2);
    context.quadraticCurveTo(8, 11, 7, -12);
    context.closePath();
    fillStroke(context, 2.2);
    context.restore();
  }
}

function drawFarWing(context, palette, motion) {
  drawWing(context, -1, palette, motion, true);
}

function drawNearWing(context, palette, motion) {
  drawWing(context, 1, palette, motion, false);
}

function drawWing(context, side, palette, motion, far) {
  const spread = motion.wingSpread;
  const beat = motion.wingBeat + (side > 0 ? motion.wingFlick : motion.wingFlick * 0.35);
  const shoulderX = side * 25;
  const angle = side * (0.11 + spread * 0.36) + side * beat * 0.52;
  context.save();
  context.globalAlpha *= far ? 0.94 : 1;
  context.translate(shoulderX, -73);
  context.rotate(angle);
  context.scale(side, 1);
  const reach = 31 + spread * 55;
  const lift = beat * 26 - spread * 17;

  context.fillStyle = far ? palette.wingDark : palette.wing;
  context.beginPath();
  context.moveTo(0, -14);
  context.bezierCurveTo(reach * 0.52, -25 + lift, reach, -12 + lift, reach + 4, 5 + lift);
  context.bezierCurveTo(reach * 0.88, 17 + lift, reach * 0.72, 28 + lift, reach * 0.52, 35 + lift);
  context.quadraticCurveTo(23, 45, 4, 29);
  context.closePath();
  fillStroke(context, 2.8);

  for (let index = 0; index < 5; index += 1) {
    const p = index / 4;
    const featherX = lerp(12, reach * 0.78, p);
    const featherY = lerp(18, 6 + lift, p) + Math.sin(p * Math.PI) * 10;
    context.fillStyle = index % 2 ? palette.bodyShadow : palette.wingDark;
    context.beginPath();
    context.moveTo(featherX - 5, featherY - 12);
    context.quadraticCurveTo(featherX + 7, featherY - 1, featherX + 2, featherY + 15 + p * 6);
    context.quadraticCurveTo(featherX - 6, featherY + 6, featherX - 5, featherY - 12);
    context.closePath();
    context.fill();
  }
  context.strokeStyle = palette.bodyLight;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(5, -5);
  context.quadraticCurveTo(reach * 0.48, 5 + lift, reach * 0.82, 2 + lift);
  context.stroke();
  context.restore();
}

function drawBody(context, palette, geometry, lightDirection = -1) {
  context.fillStyle = palette.body;
  context.beginPath();
  context.moveTo(-25, -87);
  context.bezierCurveTo(-43, -72, -42, -25, -28, -5);
  context.quadraticCurveTo(0, 12, 28, -5);
  context.bezierCurveTo(42, -25, 43, -72, 25, -87);
  context.quadraticCurveTo(0, -102, -25, -87);
  context.closePath();
  fillStroke(context, 3.2);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = palette.bodyLight;
  context.beginPath();
  context.moveTo(-18, -70);
  context.bezierCurveTo(-29, -56, -26, -25, -16, -7);
  context.quadraticCurveTo(1, 6, 18, -8);
  context.bezierCurveTo(27, -28, 27, -58, 13, -73);
  context.quadraticCurveTo(-2, -82, -18, -70);
  context.closePath();
  context.fill();

  context.fillStyle = palette.bodyShadow;
  context.globalAlpha = 0.2;
  context.beginPath();
  context.moveTo(4, -78);
  context.bezierCurveTo(24, -68, 29, -27, 22, -6);
  context.quadraticCurveTo(12, 1, 4, 2);
  context.quadraticCurveTo(12, -37, 4, -78);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.restore();

  context.fillStyle = 'rgba(245,199,119,0.14)';
  context.beginPath();
  context.moveTo(-22, -17);
  context.quadraticCurveTo(0, 5, 22, -17);
  context.quadraticCurveTo(17, -4, 0, 3);
  context.quadraticCurveTo(-17, -4, -22, -17);
  context.closePath();
  context.fill();

  const rows = geometry.bodyFeatherRows;
  for (let row = 0; row < rows; row += 1) {
    const count = row % 2 === 0 ? 4 : 3;
    const y = -62 + row * 13;
    for (let column = 0; column < count; column += 1) {
      const x = (column - (count - 1) / 2) * 11;
      context.fillStyle = row % 2 ? palette.bodyShadow : palette.body;
      context.globalAlpha = 0.46;
      context.beginPath();
      context.moveTo(x - 5, y - 4);
      context.quadraticCurveTo(x, y + 8, x + 5, y - 4);
      context.quadraticCurveTo(x, y, x - 5, y - 4);
      context.fill();
      context.strokeStyle = row % 2 ? 'rgba(48,39,52,0.18)' : 'rgba(255,244,218,0.16)';
      context.lineWidth = 0.85;
      context.stroke();
    }
  }
  context.globalAlpha = 1;
  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = palette.accent;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-17, -70);
  context.quadraticCurveTo(-6, -79, 0, -68);
  context.stroke();

  context.strokeStyle = 'rgba(255,242,205,0.28)';
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-18, -73);
  context.bezierCurveTo(-27, -53, -25, -26, -18, -9);
  context.stroke();

  context.strokeStyle = palette.rim;
  context.globalAlpha = 0.72;
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(-24, -84);
  context.bezierCurveTo(-39, -67, -36, -31, -24, -12);
  context.stroke();
  context.globalAlpha = 1;
  context.restore();
}

function drawFeet(context, palette, pose) {
  const tucked = pose === 'flight' || pose === 'delivery';
  const footY = tucked ? -15 : 0;
  for (const side of [-1, 1]) {
    context.strokeStyle = palette.foot;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(side * 13, -15);
    context.bezierCurveTo(side * 12.2, -10, side * 13.8, footY - 4, side * 13, footY);
    if (!tucked) {
      context.moveTo(side * 13, footY);
      context.quadraticCurveTo(side * 20, 4, side * 25, 1);
      context.moveTo(side * 13, footY);
      context.quadraticCurveTo(side * 9, 5, side * 5, 2);
    }
    context.stroke();
  }
}

function drawHead(context, palette, head, motion, lightDirection = -1) {
  context.fillStyle = palette.body;
  context.beginPath();
  context.moveTo(-35, -91);
  context.bezierCurveTo(-34, -101, -32, head.leftOuterControlY, head.leftPeakX, head.leftPeakY);
  context.quadraticCurveTo(head.leftInnerX, head.leftInnerY, -12, -111);
  context.quadraticCurveTo(0, head.centerY, 14, -110);
  context.quadraticCurveTo(head.rightInnerX, head.rightInnerY, head.rightPeakX, head.rightPeakY);
  context.bezierCurveTo(head.rightOuterControlX, head.rightOuterControlY, 35, -100, 35, -91);
  context.quadraticCurveTo(32, -68, 0, -61);
  context.quadraticCurveTo(-32, -68, -35, -91);
  context.closePath();
  fillStroke(context, 3.2);

  context.fillStyle = palette.facialShadow;
  context.beginPath();
  context.moveTo(-29, -95);
  context.bezierCurveTo(-25, -115, -6, -114, 0, -98);
  context.bezierCurveTo(7, -114, 26, -114, 29, -94);
  context.bezierCurveTo(24, -72, 8, -68, 0, -59);
  context.bezierCurveTo(-8, -68, -24, -73, -29, -95);
  context.closePath();
  context.fill();

  context.fillStyle = palette.facial;
  context.beginPath();
  context.moveTo(-25, -94);
  context.bezierCurveTo(-21, -109, -6, -109, 0, -94);
  context.bezierCurveTo(6, -109, 21, -109, 25, -94);
  context.bezierCurveTo(21, -78, 7, -74, 0, -64);
  context.bezierCurveTo(-7, -74, -21, -78, -25, -94);
  context.closePath();
  context.fill();

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = 'rgba(255,250,229,0.28)';
  context.beginPath();
  context.moveTo(-22, -99);
  context.bezierCurveTo(-16, -110, -6, -108, -2, -96);
  context.quadraticCurveTo(-10, -89, -20, -91, -22, -99);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(71,57,68,0.16)';
  context.beginPath();
  context.moveTo(2, -96);
  context.bezierCurveTo(8, -108, 20, -108, 24, -94);
  context.quadraticCurveTo(20, -78, 7, -74, 1, -65);
  context.quadraticCurveTo(8, -84, 2, -96, 2, -96);
  context.closePath();
  context.fill();
  context.restore();

  for (const side of [-1, 1]) {
    context.strokeStyle = palette.fleck;
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(side * 6, -105);
    context.quadraticCurveTo(side * 14, -111 + side, side * 21, -104);
    context.stroke();
  }

  drawOwlEye(context, -11, -91, palette, motion);
  drawOwlEye(context, 11, -91, palette, motion);

  context.fillStyle = palette.beak;
  context.beginPath();
  context.moveTo(-5, -81);
  context.quadraticCurveTo(0, -74 + motion.beakOpen * 5, 5, -81);
  context.bezierCurveTo(4, -77, 2, -70, 0, -66 - motion.beakOpen * 2);
  context.quadraticCurveTo(-3, -71, -5, -81);
  context.closePath();
  fillStroke(context, 1.8);

  context.fillStyle = palette.fleck;
  context.globalAlpha = 0.5;
  for (const [x, y] of head.flecks) {
    traceOrganicOval(context, x, y, 2.2, 4.2, x < 0 ? -0.55 : 0.46);
    context.fill();
  }
  context.globalAlpha = 1;
  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = 'rgba(255,241,201,0.65)';
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(-29, -103);
  context.quadraticCurveTo(-18, -119, -5, -112);
  context.stroke();

  context.strokeStyle = palette.rim;
  context.globalAlpha = 0.76;
  context.lineWidth = STORYBOOK_LINE_WEIGHT.contour;
  context.beginPath();
  context.moveTo(-32, -96);
  context.bezierCurveTo(-31, -108, -27, head.rimOuterY, -22, head.rimPeakY);
  context.quadraticCurveTo(-16, -111, -11, -110);
  context.stroke();
  context.globalAlpha = 1;
  context.restore();
}

function drawOwlEye(context, x, y, palette, motion) {
  context.save();
  context.translate(x, y);
  context.fillStyle = '#fff8e8';
  traceOrganicOval(context, 0, 0, 10, 11, x < 0 ? -0.24 : 0.31);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.2;
  context.stroke();

  context.fillStyle = palette.iris;
  traceOrganicOval(context, motion.eyeX, motion.eyeY, 6.8, 7.1, x < 0 ? 0.18 : -0.21);
  context.fill();
  context.strokeStyle = STORYBOOK_INK.soft;
  context.lineWidth = 1.4;
  context.stroke();
  context.fillStyle = STORYBOOK_INK.deep;
  traceOrganicOval(context, motion.eyeX, motion.eyeY, 3.7, 4.1, x < 0 ? -0.16 : 0.22);
  context.fill();
  context.fillStyle = 'rgba(255,244,218,0.92)';
  traceOrganicOval(context, motion.eyeX - 2.2, motion.eyeY - 2.7, 1.8, 1.55, 0.34);
  context.fill();

  if (motion.blink > 0) {
    const cover = clamp(motion.blink, 0, 1);
    const upperSeam = -9.5 + cover * 9.6;
    const lowerSeam = 9.7 - cover * 9.4;
    context.fillStyle = palette.facialShadow;
    context.beginPath();
    context.moveTo(-9.8, upperSeam);
    context.bezierCurveTo(-10.6, -6.2, -7.4, -11.2, 0.6, -10.9);
    context.bezierCurveTo(7.2, -10.7, 10.5, -5.8, 9.6, upperSeam + 0.2);
    context.quadraticCurveTo(0.4, upperSeam + 1.4, -9.8, upperSeam);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(-9.5, lowerSeam);
    context.quadraticCurveTo(0.3, lowerSeam - 1.1, 9.7, lowerSeam + 0.1);
    context.bezierCurveTo(10.2, 6.6, 6.9, 11.1, -0.5, 10.8);
    context.bezierCurveTo(-7.2, 10.4, -10.4, 6.3, -9.5, lowerSeam);
    context.closePath();
    context.fill();
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-8.4, (upperSeam + lowerSeam) * 0.5);
    context.quadraticCurveTo(0.2, 1.7, 8.3, (upperSeam + lowerSeam) * 0.5 + 0.1);
    context.globalAlpha = cover;
    context.stroke();
  }
  context.restore();
}

function traceOrganicOval(context, centerX, centerY, radiusX, radiusY, asymmetry = 0) {
  const wobble = clamp(asymmetry, -1, 1);
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

function fillStroke(context, lineWidth = null) {
  context.fill();
  const previous = context.lineWidth;
  if (lineWidth !== null) context.lineWidth = lineWidth;
  context.strokeStyle = OUTLINE;
  context.stroke();
  context.lineWidth = previous;
}
