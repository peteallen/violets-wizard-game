import { PALETTE } from '../config.js';

export const LETTER_ENVELOPE_POSE = Object.freeze({ x: 650, y: 246, scale: 0.72, rotation: -0.035 });
export const LETTER_READING_POSE = Object.freeze({ x: 640, y: 318, scale: 0.87 });
export const LETTER_ENVELOPE_LOCAL_BOUNDS = Object.freeze({ x: -184, y: -109, width: 368, height: 218 });

const LETTER_PAINTS = new WeakMap();

export function envelopeWorldBounds(pose = LETTER_ENVELOPE_POSE) {
  const halfWidth = LETTER_ENVELOPE_LOCAL_BOUNDS.width * pose.scale / 2;
  const halfHeight = LETTER_ENVELOPE_LOCAL_BOUNDS.height * pose.scale / 2;
  const cosine = Math.abs(Math.cos(pose.rotation ?? 0));
  const sine = Math.abs(Math.sin(pose.rotation ?? 0));
  const rotatedHalfWidth = halfWidth * cosine + halfHeight * sine;
  const rotatedHalfHeight = halfWidth * sine + halfHeight * cosine;
  return Object.freeze({
    x: pose.x - rotatedHalfWidth,
    y: pose.y - rotatedHalfHeight,
    width: rotatedHalfWidth * 2,
    height: rotatedHalfHeight * 2,
  });
}

export function drawClosedLetterEnvelope(context, {
  time = 0, reducedMotion = false, flap = 0, sealCrack = 0, sealPart = 0,
} = {}) {
  const state = { time, reducedMotion, flap, sealCrack, sealPart };
  drawLetterEnvelopeBack(context, state);
  drawLetterEnvelopeFront(context, state);
}

export function drawLetterEnvelopeBack(context, state = {}) {
  const flap = clamp01(state.flap ?? 0);
  const paints = letterPaints(context);

  context.save();
  context.translate(7, 11);
  context.fillStyle = 'rgba(35,23,31,0.22)';
  traceEnvelopeSilhouette(context);
  context.fill();
  context.restore();

  context.fillStyle = paints.paper;
  traceEnvelopeSilhouette(context);
  context.fill();
  context.strokeStyle = '#684a38';
  context.lineWidth = 5.5;
  context.stroke();

  context.save();
  traceEnvelopeSilhouette(context);
  context.clip();
  context.fillStyle = 'rgba(255,248,216,0.3)';
  context.beginPath();
  context.moveTo(-174, -101);
  context.bezierCurveTo(-112, -111, -52, -104, 12, -106);
  context.bezierCurveTo(-20, -57, -88, 2, -178, 72);
  context.bezierCurveTo(-181, 11, -180, -53, -174, -101);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(102,61,42,0.09)';
  context.beginPath();
  context.moveTo(12, -106);
  context.bezierCurveTo(84, -105, 138, -109, 176, -99);
  context.bezierCurveTo(181, -28, 177, 39, 174, 91);
  context.bezierCurveTo(103, 61, 53, 25, 12, -106);
  context.closePath();
  context.fill();
  context.restore();

  const flapTipY = mix(28, -154, flap);
  context.fillStyle = paints.flap;
  traceEnvelopeFlap(context, flapTipY);
  context.fill();
  context.strokeStyle = '#76543d';
  context.lineWidth = 4;
  context.stroke();

  context.strokeStyle = 'rgba(255,247,218,0.58)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-163, -94);
  context.bezierCurveTo(-91, -101, -34, flapTipY - 5, 0, flapTipY - 3);
  context.bezierCurveTo(40, flapTipY - 4, 101, -99, 163, -93);
  context.stroke();
}

export function drawLetterEnvelopeFront(context, state = {}) {
  const flap = clamp01(state.flap ?? 0);
  const paints = letterPaints(context);
  context.fillStyle = paints.pocket;
  traceEnvelopePocket(context);
  context.fill();
  context.strokeStyle = '#72503a';
  context.lineWidth = 4.5;
  context.stroke();

  context.strokeStyle = 'rgba(105,70,48,0.48)';
  context.lineWidth = 2.7;
  context.beginPath();
  context.moveTo(-169, 89);
  context.bezierCurveTo(-123, 69, -67, 29, -3, 2);
  context.bezierCurveTo(54, 30, 119, 72, 170, 90);
  context.stroke();

  drawOrganicPostmark(context);
  if (flap < 0.72) drawEnvelopeName(context, state.time ?? 0, Boolean(state.reducedMotion), flap);
  drawOpeningWaxSeal(context, clamp01(state.sealCrack ?? 0), clamp01(state.sealPart ?? 0));
}

function letterPaints(context) {
  const cached = LETTER_PAINTS.get(context);
  if (cached) return cached;
  const fallback = Object.freeze({ paper: '#f1dfb8', flap: '#ead3a7', pocket: '#ddbe89', wax: '#8d2f47' });
  if (typeof context.createLinearGradient !== 'function') return fallback;
  const paper = context.createLinearGradient(-180, -105, 180, 105);
  paper.addColorStop(0, '#fff0ca');
  paper.addColorStop(0.42, '#eed9ac');
  paper.addColorStop(1, '#cfae78');
  const flap = context.createLinearGradient(0, -160, 0, 45);
  flap.addColorStop(0, '#f8e9c1');
  flap.addColorStop(1, '#d5b27d');
  const pocket = context.createLinearGradient(0, -5, 0, 108);
  pocket.addColorStop(0, '#e8ca94');
  pocket.addColorStop(1, '#c39d67');
  const wax = context.createLinearGradient(-30, -30, 32, 34);
  wax.addColorStop(0, '#b34a5c');
  wax.addColorStop(0.55, '#842d46');
  wax.addColorStop(1, '#5c2236');
  const paints = Object.freeze({ paper, flap, pocket, wax });
  LETTER_PAINTS.set(context, paints);
  return paints;
}

function traceEnvelopeSilhouette(context) {
  context.beginPath();
  context.moveTo(-164, -103);
  context.bezierCurveTo(-126, -109, -87, -100, -49, -105);
  context.bezierCurveTo(-10, -101, 31, -108, 67, -102);
  context.bezierCurveTo(108, -107, 143, -100, 165, -103);
  context.bezierCurveTo(179, -101, 181, -91, 178, -75);
  context.bezierCurveTo(182, -25, 176, 34, 179, 84);
  context.bezierCurveTo(179, 99, 168, 106, 151, 102);
  context.bezierCurveTo(98, 107, 50, 100, 3, 105);
  context.bezierCurveTo(-48, 101, -99, 108, -159, 103);
  context.bezierCurveTo(-175, 104, -181, 95, -178, 78);
  context.bezierCurveTo(-182, 27, -176, -30, -180, -82);
  context.bezierCurveTo(-181, -96, -176, -104, -164, -103);
  context.closePath();
}

function traceEnvelopeFlap(context, tipY) {
  context.beginPath();
  context.moveTo(-169, -93);
  context.bezierCurveTo(-113, -102, -57, -96, -4, -100);
  context.bezierCurveTo(54, -96, 111, -102, 169, -92);
  context.bezierCurveTo(121, -45, 60, tipY - 6, 1, tipY);
  context.bezierCurveTo(-55, tipY - 5, -118, -45, -169, -93);
  context.closePath();
}

function traceEnvelopePocket(context) {
  context.beginPath();
  context.moveTo(-177, -8);
  context.bezierCurveTo(-124, 3, -69, 24, -3, 43);
  context.bezierCurveTo(57, 24, 119, 2, 177, -9);
  context.bezierCurveTo(177, 26, 175, 57, 178, 86);
  context.bezierCurveTo(177, 100, 164, 105, 149, 102);
  context.bezierCurveTo(94, 107, 43, 101, 0, 105);
  context.bezierCurveTo(-48, 101, -99, 108, -158, 103);
  context.bezierCurveTo(-173, 103, -179, 94, -177, 79);
  context.bezierCurveTo(-179, 50, -176, 19, -177, -8);
  context.closePath();
}

function drawEnvelopeName(context, time, reducedMotion, flap) {
  const shimmer = reducedMotion ? 0.5 : 0.5 + Math.sin(time * 2.2) * 0.5;
  const y = mix(-27, -54, flap);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 49px "Andika", "Trebuchet MS", sans-serif';
  context.lineWidth = 6;
  context.strokeStyle = 'rgba(80,47,35,0.7)';
  context.strokeText('VIOLET', 0, y);
  context.fillStyle = '#b97125';
  context.fillText('VIOLET', 0, y);
  context.globalAlpha = 0.3 + shimmer * 0.42;
  context.fillStyle = '#ffe89c';
  context.fillText('VIOLET', -1.5, y - 2);
  context.globalAlpha = 1;
}

function drawOrganicPostmark(context) {
  context.save();
  context.translate(119, -62);
  context.rotate(0.07);
  context.strokeStyle = 'rgba(74,63,78,0.5)';
  context.lineWidth = 2.5;
  for (const inset of [0, 8]) {
    const radius = 27 - inset;
    context.beginPath();
    context.moveTo(radius, -2);
    context.bezierCurveTo(radius + 1, 14, 13, radius, -2, radius - 1);
    context.bezierCurveTo(-17, radius + 1, -radius, 12, -radius + 1, -3);
    context.bezierCurveTo(-radius - 1, -17, -12, -radius, 2, -radius + 1);
    context.bezierCurveTo(17, -radius - 1, radius, -16, radius, -2);
    context.stroke();
  }
  for (let index = -2; index <= 2; index += 1) {
    context.beginPath();
    context.moveTo(24, index * 7);
    context.bezierCurveTo(35, index * 7 - 5, 47, index * 7 + 4, 60, index * 7 - 1);
    context.stroke();
  }
  context.restore();
}

function drawOpeningWaxSeal(context, crack, separation) {
  const paints = letterPaints(context);
  context.save();
  context.translate(0, 38);
  if (separation <= 0.001) {
    drawWaxSeal(context, paints.wax);
    if (crack > 0.02) drawSealCrack(context, crack);
  } else {
    drawSealFragment(context, -1, separation, paints.wax);
    drawSealFragment(context, 1, separation, paints.wax);
    drawWaxChips(context, separation, paints.wax);
  }
  context.restore();
}

function drawSealFragment(context, side, amount, waxPaint) {
  context.save();
  context.translate(side * amount * 17, side * amount * 3);
  context.rotate(side * amount * 0.055);
  traceSealHalfClip(context, side);
  context.clip();
  drawWaxSeal(context, waxPaint);
  context.restore();
}

function traceSealHalfClip(context, side) {
  context.beginPath();
  context.moveTo(side < 0 ? -44 : 2, -43);
  if (side < 0) {
    context.bezierCurveTo(-21, -46, -7, -43, 1, -35);
    context.bezierCurveTo(-4, -27, 5, -19, -1, -10);
    context.bezierCurveTo(-7, -2, 5, 6, 0, 14);
    context.bezierCurveTo(-4, 22, 4, 31, -2, 43);
    context.bezierCurveTo(-18, 47, -35, 45, -45, 38);
    context.bezierCurveTo(-48, 9, -48, -18, -44, -43);
  } else {
    context.bezierCurveTo(17, -46, 35, -44, 44, -37);
    context.bezierCurveTo(48, -10, 47, 17, 44, 42);
    context.bezierCurveTo(24, 47, 8, 46, -2, 43);
    context.bezierCurveTo(4, 31, -4, 22, 0, 14);
    context.bezierCurveTo(5, 6, -7, -2, -1, -10);
    context.bezierCurveTo(5, -19, -4, -27, 2, -43);
  }
  context.closePath();
}

function drawWaxSeal(context, waxPaint) {
  context.fillStyle = waxPaint;
  context.strokeStyle = '#542237';
  context.lineWidth = 3.2;
  traceWaxBlob(context);
  context.fill();
  context.stroke();
  context.strokeStyle = 'rgba(255,212,191,0.32)';
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-25, -13);
  context.bezierCurveTo(-15, -29, 11, -32, 25, -14);
  context.stroke();
  drawSealOwl(context);
}

function traceWaxBlob(context) {
  context.beginPath();
  context.moveTo(34, -5);
  context.bezierCurveTo(38, 7, 27, 15, 30, 24);
  context.bezierCurveTo(20, 23, 15, 35, 5, 31);
  context.bezierCurveTo(-4, 38, -12, 29, -21, 31);
  context.bezierCurveTo(-23, 21, -36, 18, -31, 7);
  context.bezierCurveTo(-38, -1, -30, -10, -32, -19);
  context.bezierCurveTo(-21, -21, -19, -34, -7, -30);
  context.bezierCurveTo(2, -37, 10, -28, 20, -30);
  context.bezierCurveTo(22, -21, 36, -17, 31, -8);
  context.bezierCurveTo(34, -7, 35, -6, 34, -5);
  context.closePath();
}

function drawSealOwl(context) {
  context.fillStyle = PALETTE.candle;
  context.globalAlpha = 0.73;
  context.beginPath();
  context.moveTo(-17, 5);
  context.bezierCurveTo(-20, -8, -15, -17, -8, -20);
  context.bezierCurveTo(-5, -15, -3, -10, 0, -17);
  context.bezierCurveTo(3, -10, 6, -15, 10, -20);
  context.bezierCurveTo(18, -15, 20, -7, 17, 5);
  context.bezierCurveTo(15, 17, 7, 21, 0, 19);
  context.bezierCurveTo(-8, 21, -16, 16, -17, 5);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = '#542237';
  for (const x of [-7, 7]) {
    context.beginPath();
    context.moveTo(x - 2.5, -2);
    context.bezierCurveTo(x - 1, -4, x + 2, -4, x + 2.5, -1);
    context.bezierCurveTo(x + 2, 2, x - 2, 2, x - 2.5, -2);
    context.fill();
  }
}

function drawSealCrack(context, crack) {
  context.strokeStyle = '#451a2d';
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(1, -31);
  context.bezierCurveTo(-3, -23, 4, -16, -1, -9);
  context.bezierCurveTo(-6, -1, 5, 6, 0, 14);
  context.bezierCurveTo(-3, 20, 2, 25, -2, -31 + crack * 68);
  context.stroke();
}

function drawWaxChips(context, amount, waxPaint) {
  const chips = [[-6, -5, -18, -23], [8, 4, 19, -15], [-3, 12, -13, 24], [11, 13, 23, 22]];
  context.fillStyle = waxPaint;
  for (const [x, y, dx, dy] of chips) {
    const px = x + dx * amount;
    const py = y + dy * amount;
    context.beginPath();
    context.moveTo(px - 3, py - 2);
    context.bezierCurveTo(px + 1, py - 5, px + 5, py - 1, px + 3, py + 3);
    context.bezierCurveTo(px - 1, py + 5, px - 5, py + 2, px - 3, py - 2);
    context.fill();
  }
}

function mix(start, end, amount) {
  return start + (end - start) * clamp01(amount);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
