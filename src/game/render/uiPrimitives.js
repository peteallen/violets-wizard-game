import { PALETTE } from '../config.js';

const INK = '#382a24';
const MUTED_INK = '#6b5744';
const PAGE_EDGE = '#b68b55';
const PAGE_SHADOW = '#2b2034';
const WAX_DARK = '#4d2430';
const PAGE_HIGHLIGHT = 'rgba(255,244,210,0.42)';
const PAGE_SHADE = 'rgba(93,58,39,0.18)';
const PAGE_GRAIN = Object.freeze([
  [0.07, 0.18, 0.19, -0.012], [0.16, 0.34, 0.14, 0.015], [0.1, 0.53, 0.23, -0.009],
  [0.3, 0.72, 0.17, 0.013], [0.42, 0.24, 0.2, -0.014], [0.51, 0.47, 0.15, 0.011],
  [0.62, 0.63, 0.22, -0.012], [0.73, 0.16, 0.16, 0.014], [0.79, 0.39, 0.14, -0.01],
  [0.71, 0.82, 0.21, 0.009],
]);
const CONTROL_GRAIN = Object.freeze([
  [0.08, 0.22, 0.2, -0.018], [0.17, 0.68, 0.14, 0.016], [0.29, 0.42, 0.19, -0.012],
  [0.43, 0.78, 0.16, 0.014], [0.56, 0.19, 0.18, -0.015], [0.67, 0.54, 0.2, 0.012],
  [0.79, 0.31, 0.13, -0.013], [0.84, 0.73, 0.1, 0.011],
]);

export function traceRoundedRect(context, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const wobble = Math.min(r * 0.14, width * 0.018, height * 0.026, 3.2);
  context.beginPath();
  context.moveTo(x + r * 0.9, y + wobble * 0.3);
  context.bezierCurveTo(
    x + width * 0.3,
    y,
    x + width * 0.69,
    y + wobble * 0.76,
    x + width - r * 0.96,
    y + wobble * 0.22,
  );
  context.bezierCurveTo(
    x + width - r * 0.36,
    y,
    x + width,
    y + r * 0.4,
    x + width - wobble * 0.08,
    y + r * 1.03,
  );
  context.bezierCurveTo(
    x + width,
    y + height * 0.33,
    x + width - wobble * 0.7,
    y + height * 0.68,
    x + width - wobble * 0.18,
    y + height - r * 0.92,
  );
  context.bezierCurveTo(
    x + width,
    y + height - r * 0.34,
    x + width - r * 0.42,
    y + height,
    x + width - r * 1.04,
    y + height - wobble * 0.18,
  );
  context.bezierCurveTo(
    x + width * 0.7,
    y + height,
    x + width * 0.31,
    y + height - wobble * 0.66,
    x + r * 0.94,
    y + height - wobble * 0.12,
  );
  context.bezierCurveTo(
    x + r * 0.34,
    y + height,
    x,
    y + height - r * 0.43,
    x + wobble * 0.12,
    y + height - r * 1.01,
  );
  context.bezierCurveTo(
    x,
    y + height * 0.69,
    x + wobble * 0.58,
    y + height * 0.32,
    x + wobble * 0.16,
    y + r * 0.96,
  );
  context.bezierCurveTo(
    x,
    y + r * 0.35,
    x + r * 0.39,
    y,
    x + r * 0.9,
    y + wobble * 0.3,
  );
  context.closePath();
}

export function drawStorybookSpread(context, rect, {
  title,
  subtitle = null,
  cornerFlourishes = true,
} = {}) {
  const { x, y, width, height } = rect;
  const middle = x + width / 2;

  context.save();
  context.fillStyle = 'rgba(20,17,38,0.82)';
  context.fillRect(0, 0, 1280, 720);

  context.fillStyle = PAGE_SHADOW;
  traceRoundedRect(context, x - 14, y + 15, width + 28, height + 8, 48);
  context.fill();

  context.fillStyle = '#60442f';
  traceRoundedRect(context, x - 8, y - 7, width + 16, height + 14, 46);
  context.fill();
  drawBookCoverLight(context, x - 2, y - 1, width + 4, height + 2);
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  traceRoundedRect(context, x - 8, y - 7, width + 16, height + 14, 46);
  context.stroke();

  drawOpenBookPage(context, x, y, width / 2 + 10, height, 'left', '#f3e6ca');
  drawOpenBookPage(context, middle - 10, y, width / 2 + 10, height, 'right', PALETTE.parchment);

  context.fillStyle = 'rgba(73,45,33,0.13)';
  context.beginPath();
  context.moveTo(middle - 7, y + 22);
  context.bezierCurveTo(
    middle - 23,
    y + height * 0.31,
    middle - 20,
    y + height * 0.72,
    middle - 6,
    y + height - 25,
  );
  context.bezierCurveTo(
    middle + 2,
    y + height * 0.76,
    middle + 2,
    y + height * 0.25,
    middle - 7,
    y + 22,
  );
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(92,62,42,0.34)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(middle - 5, y + 28);
  context.bezierCurveTo(middle - 18, y + height * 0.34, middle - 18, y + height * 0.68, middle - 4, y + height - 28);
  context.moveTo(middle + 5, y + 28);
  context.bezierCurveTo(middle + 18, y + height * 0.34, middle + 18, y + height * 0.68, middle + 4, y + height - 28);
  context.stroke();

  if (cornerFlourishes) {
    drawCornerFlourish(context, x + 42, y + 42, 1);
    drawCornerFlourish(context, x + width - 42, y + 42, -1);
  }

  context.textAlign = 'center';
  context.fillStyle = INK;
  context.font = '700 38px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(title ?? 'Grown-up book', middle, y + 62);
  if (subtitle) {
    context.fillStyle = MUTED_INK;
    context.font = '22px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(subtitle, middle, y + 94);
  }
  context.restore();
}

function drawBookCoverLight(context, x, y, width, height) {
  context.fillStyle = 'rgba(226,174,103,0.2)';
  context.beginPath();
  context.moveTo(x + 34, y + 9);
  context.bezierCurveTo(
    x + width * 0.29,
    y + 2,
    x + width * 0.57,
    y + 8,
    x + width * 0.7,
    y + height * 0.12,
  );
  context.bezierCurveTo(
    x + width * 0.52,
    y + height * 0.17,
    x + width * 0.25,
    y + height * 0.2,
    x + 18,
    y + height * 0.34,
  );
  context.bezierCurveTo(x + 12, y + height * 0.2, x + 16, y + 24, x + 34, y + 9);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(37,24,29,0.2)';
  context.beginPath();
  context.moveTo(x + width * 0.44, y + height * 0.87);
  context.bezierCurveTo(
    x + width * 0.68,
    y + height * 0.82,
    x + width * 0.89,
    y + height * 0.69,
    x + width - 15,
    y + height * 0.6,
  );
  context.bezierCurveTo(
    x + width - 10,
    y + height * 0.79,
    x + width - 22,
    y + height - 10,
    x + width - 42,
    y + height - 7,
  );
  context.bezierCurveTo(
    x + width * 0.78,
    y + height - 3,
    x + width * 0.58,
    y + height - 7,
    x + width * 0.44,
    y + height * 0.87,
  );
  context.closePath();
  context.fill();
}

function drawOpenBookPage(context, x, y, width, height, side, fill) {
  traceOpenBookPage(context, x, y, width, height, side);
  context.fillStyle = fill;
  context.fill();

  context.save();
  traceOpenBookPage(context, x, y, width, height, side);
  context.clip();
  context.fillStyle = PAGE_HIGHLIGHT;
  context.beginPath();
  context.moveTo(x - 4, y - 3);
  context.bezierCurveTo(
    x + width * 0.28,
    y + 2,
    x + width * 0.58,
    y - 1,
    x + width * 0.69,
    y + height * 0.14,
  );
  context.bezierCurveTo(
    x + width * 0.56,
    y + height * 0.25,
    x + width * 0.23,
    y + height * 0.3,
    x - 4,
    y + height * 0.38,
  );
  context.closePath();
  context.fill();

  context.fillStyle = PAGE_SHADE;
  context.beginPath();
  context.moveTo(x - 3, y + height * 0.73);
  context.bezierCurveTo(
    x + width * 0.31,
    y + height * 0.68,
    x + width * 0.7,
    y + height * 0.79,
    x + width + 4,
    y + height * 0.64,
  );
  context.bezierCurveTo(
    x + width + 3,
    y + height * 0.87,
    x + width * 0.74,
    y + height + 5,
    x - 3,
    y + height + 3,
  );
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(111,75,43,0.12)';
  context.lineWidth = 1.2;
  context.lineCap = 'round';
  for (const [grainX, grainY, grainLength, grainBend] of PAGE_GRAIN) {
    const startX = x + width * grainX;
    const startY = y + height * grainY;
    const length = width * grainLength;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      startX + length * 0.48,
      startY + height * grainBend,
      startX + length,
      startY + height * grainBend * 0.36,
    );
    context.stroke();
  }
  context.restore();

  context.strokeStyle = PAGE_EDGE;
  context.lineWidth = 4;
  traceOpenBookPage(context, x, y, width, height, side);
  context.stroke();
}

export function drawRibbonTab(context, rect, label, { icon = '', active = false } = {}) {
  const { x, y, width, height } = rect;
  const placed = {
    x,
    y: y + (active ? 0 : 7),
    width,
    height: height - (active ? 0 : 7),
  };
  context.save();
  drawLeatherRibbonMaterial(context, placed, { active, phase: active ? 0.37 : 0.81 });
  context.fillStyle = active ? '#f8e9c8' : '#30261f';
  context.textAlign = 'center';
  context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
  if (typeof icon === 'function') {
    icon(context, x + 42, y + height / 2, Math.min(46, height * 0.55));
    context.fillText(label, x + width / 2 + 20, y + height / 2 + 9);
  } else context.fillText(`${icon ? `${icon}  ` : ''}${label}`, x + width / 2, y + height / 2 + 9);
  context.restore();
}

export function drawParchmentAction(context, rect, {
  label,
  detail = null,
  icon = '✦',
  selected = false,
  disabled = false,
  danger = false,
  compact = false,
} = {}) {
  const { x, y, width, height } = rect;
  context.save();
  context.globalAlpha = disabled ? 0.48 : 1;

  context.fillStyle = 'rgba(47,30,31,0.38)';
  traceClippedCard(context, x + 5, y + 8, width, height);
  context.fill();

  context.fillStyle = selected ? '#f2dfae' : '#ead9b7';
  traceClippedCard(context, x, y, width, height);
  context.fill();

  context.save();
  traceClippedCard(context, x + 3, y + 3, width - 6, height - 6);
  context.clip();
  drawControlPaperLight(context, rect, selected);
  drawControlPaperShade(context, rect);
  drawControlGrain(context, rect, selected ? 'rgba(116,77,40,0.16)' : 'rgba(111,75,43,0.13)');
  context.restore();

  context.strokeStyle = selected ? PALETTE.interactive : '#8a6b44';
  context.lineWidth = selected ? 6 : 4.2;
  traceClippedCard(context, x, y, width, height);
  context.stroke();
  context.strokeStyle = selected ? 'rgba(255,242,193,0.62)' : 'rgba(121,82,45,0.38)';
  context.lineWidth = 1.5;
  traceClippedCard(context, x + 9, y + 8, width - 18, height - 16);
  context.stroke();

  const sealX = x + (compact ? 44 : 56);
  const sealY = y + height / 2;
  drawWaxMedallion(context, sealX, sealY, compact ? 28 : 34, icon, { danger });

  context.textAlign = 'left';
  context.fillStyle = danger ? WAX_DARK : INK;
  context.font = `700 ${compact ? 24 : 27}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(context, label ?? '', x + (compact ? 82 : 104), y + height / 2 + (detail ? -3 : 10), width - (compact ? 104 : 130));
  if (detail) {
    context.fillStyle = MUTED_INK;
    context.font = '20px "Andika", "Trebuchet MS", sans-serif';
    fitText(context, detail, x + 104, y + height / 2 + 27, width - 130);
  }
  context.restore();
}

export function drawStepper(context, { label, valueLabel, minusRect, plusRect }) {
  const centerX = (minusRect.x + minusRect.width + plusRect.x) / 2;
  const centerY = minusRect.y + minusRect.height / 2;
  context.save();
  context.textAlign = 'center';
  context.fillStyle = INK;
  context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, centerX, centerY - 5);
  context.fillStyle = '#765d48';
  context.font = '20px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(valueLabel, centerX, centerY + 25);
  drawWaxMedallion(context, minusRect.x + minusRect.width / 2, centerY, 34, '−');
  drawWaxMedallion(context, plusRect.x + plusRect.width / 2, centerY, 34, '+');
  context.restore();
}

export function drawReplayRibbon(context, rect, label = 'Return') {
  const { x, y, width, height } = rect;
  context.save();
  drawLeatherRibbonMaterial(context, rect, { active: true, phase: 1.27, replay: true });
  drawWaxMedallion(context, x + 52, y + height / 2, 31, '↩');
  context.fillStyle = '#f8e9c8';
  context.textAlign = 'center';
  context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, x + width / 2 + 24, y + height / 2 + 9);
  context.restore();
}

export function drawWaxMedallion(context, x, y, radius, glyph, { danger = false } = {}) {
  context.save();
  context.fillStyle = 'rgba(40,24,30,0.36)';
  traceWaxMedallion(context, x + radius * 0.09, y + radius * 0.12, radius, 0.63);
  context.fill();
  context.fillStyle = danger ? '#642a35' : WAX_DARK;
  traceWaxMedallion(context, x, y, radius, 0.19);
  context.fill();

  context.fillStyle = danger ? 'rgba(122,42,56,0.46)' : 'rgba(113,48,62,0.46)';
  traceWaxShade(context, x, y, radius);
  context.fill();
  context.fillStyle = danger ? 'rgba(226,151,154,0.28)' : 'rgba(235,177,146,0.26)';
  traceWaxLight(context, x, y, radius);
  context.fill();

  context.strokeStyle = danger ? '#bd7580' : PALETTE.candle;
  context.lineWidth = 3;
  traceWaxMedallion(context, x, y, radius, 0.19);
  context.stroke();
  context.strokeStyle = danger ? 'rgba(239,176,176,0.3)' : 'rgba(244,209,141,0.34)';
  context.lineWidth = 1.3;
  traceWaxMedallion(context, x, y, radius * 0.78, 0.91);
  context.stroke();
  context.fillStyle = '#f8e9c8';
  context.textAlign = 'center';
  if (typeof glyph === 'function') glyph(context, x, y, radius * 1.18);
  else {
    context.font = `700 ${Math.round(radius * 1.05)}px "Andika", "Trebuchet MS", sans-serif`;
    context.fillText(glyph, x, y + radius * 0.36);
  }
  context.restore();
}

function traceOpenBookPage(context, x, y, width, height, side) {
  const inner = side === 'left' ? x + width : x;
  context.beginPath();
  if (side === 'left') {
    context.moveTo(x + 28, y);
    context.quadraticCurveTo(x + 8, y + 5, x, y + 30);
    context.quadraticCurveTo(x - 1, y + height * 0.48, x + 7, y + height - 35);
    context.quadraticCurveTo(x + 12, y + height, x + 42, y + height);
    context.quadraticCurveTo(inner - 48, y + height - 18, inner, y + height - 2);
    context.quadraticCurveTo(inner - 5, y + height * 0.5, inner, y + 18);
    context.quadraticCurveTo(inner - 52, y + 3, x + 28, y);
  } else {
    context.moveTo(inner, y + 18);
    context.quadraticCurveTo(x + 52, y + 3, x + width - 28, y);
    context.quadraticCurveTo(x + width - 8, y + 5, x + width, y + 30);
    context.quadraticCurveTo(x + width + 1, y + height * 0.48, x + width - 7, y + height - 35);
    context.quadraticCurveTo(x + width - 12, y + height, x + width - 42, y + height);
    context.quadraticCurveTo(x + 48, y + height - 18, inner, y + height - 2);
    context.quadraticCurveTo(inner + 5, y + height * 0.5, inner, y + 18);
  }
  context.closePath();
}

function drawControlPaperLight(context, rect, selected) {
  const { x, y, width, height } = rect;
  context.fillStyle = selected ? 'rgba(255,245,202,0.52)' : 'rgba(255,244,210,0.42)';
  context.beginPath();
  context.moveTo(x - 4, y + height * 0.04);
  context.bezierCurveTo(
    x + width * 0.24,
    y - 2,
    x + width * 0.54,
    y + height * 0.04,
    x + width * 0.69,
    y + height * 0.22,
  );
  context.bezierCurveTo(
    x + width * 0.51,
    y + height * 0.34,
    x + width * 0.22,
    y + height * 0.39,
    x - 4,
    y + height * 0.46,
  );
  context.closePath();
  context.fill();
}

function drawControlPaperShade(context, rect) {
  const { x, y, width, height } = rect;
  context.fillStyle = 'rgba(93,58,39,0.18)';
  context.beginPath();
  context.moveTo(x - 3, y + height * 0.7);
  context.bezierCurveTo(
    x + width * 0.31,
    y + height * 0.63,
    x + width * 0.68,
    y + height * 0.82,
    x + width + 4,
    y + height * 0.61,
  );
  context.bezierCurveTo(
    x + width + 3,
    y + height * 0.86,
    x + width * 0.72,
    y + height + 5,
    x - 3,
    y + height + 2,
  );
  context.closePath();
  context.fill();
}

function drawControlGrain(context, rect, color) {
  const { x, y, width, height } = rect;
  context.strokeStyle = color;
  context.lineWidth = 1.15;
  context.lineCap = 'round';
  for (const [grainX, grainY, grainLength, grainBend] of CONTROL_GRAIN) {
    const startX = x + width * grainX;
    const startY = y + height * grainY;
    const length = width * grainLength;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      startX + length * 0.47,
      startY + height * grainBend,
      startX + length,
      startY + height * grainBend * 0.34,
    );
    context.stroke();
  }
}

function drawLeatherRibbonMaterial(context, rect, { active = false, phase = 0, replay = false } = {}) {
  const { x, y, width, height } = rect;
  context.fillStyle = 'rgba(34,22,29,0.4)';
  traceRibbon(context, x + 5, y + 8, width, height, phase + 0.31);
  context.fill();

  context.fillStyle = replay ? '#35233f' : active ? '#66405f' : '#80694f';
  traceRibbon(context, x, y, width, height, phase);
  context.fill();

  context.save();
  traceRibbon(context, x + 3, y + 3, width - 6, height - 6, phase + 0.17);
  context.clip();
  context.fillStyle = replay ? 'rgba(158,112,151,0.3)' : active ? 'rgba(191,139,171,0.27)' : 'rgba(229,187,123,0.26)';
  context.beginPath();
  context.moveTo(x - 4, y + height * 0.05);
  context.bezierCurveTo(x + width * 0.28, y - 2, x + width * 0.59, y + 4, x + width * 0.72, y + height * 0.25);
  context.bezierCurveTo(x + width * 0.49, y + height * 0.34, x + width * 0.19, y + height * 0.42, x - 4, y + height * 0.46);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(30,21,28,0.25)';
  context.beginPath();
  context.moveTo(x - 2, y + height * 0.69);
  context.bezierCurveTo(x + width * 0.3, y + height * 0.62, x + width * 0.69, y + height * 0.82, x + width + 3, y + height * 0.66);
  context.bezierCurveTo(x + width * 0.82, y + height * 1.03, x + width * 0.31, y + height * 0.96, x - 2, y + height + 3);
  context.closePath();
  context.fill();
  drawControlGrain(context, rect, replay ? 'rgba(230,190,218,0.12)' : 'rgba(238,199,125,0.12)');
  context.restore();

  context.strokeStyle = active || replay ? PALETTE.interactive : '#5f4d3e';
  context.lineWidth = active || replay ? 5 : 3.4;
  traceRibbon(context, x, y, width, height, phase);
  context.stroke();
  context.strokeStyle = active || replay ? 'rgba(255,231,163,0.36)' : 'rgba(239,199,122,0.26)';
  context.lineWidth = 1.3;
  traceRibbon(context, x + 9, y + 8, width - 18, height - 16, phase + 0.43);
  context.stroke();
}

function traceRibbon(context, x, y, width, height, phase = 0) {
  const notch = Math.min(18, height * 0.24);
  const wobble = Math.sin(phase * 3.7) * Math.min(2.4, height * 0.035);
  traceSoftClosedPath(context, [
    [x + notch * 0.82, y + 1 + wobble * 0.2],
    [x + width * 0.29, y - 1 - wobble],
    [x + width * 0.66, y + 2 + wobble * 0.5],
    [x + width - notch * 0.68, y + 0.5 - wobble * 0.2],
    [x + width + 1, y + height * 0.4],
    [x + width - 2, y + height * 0.6 + wobble * 0.2],
    [x + width - notch * 1.06, y + height - 1],
    [x + width * 0.7, y + height + 1 + wobble * 0.3],
    [x + width * 0.34, y + height - 2 - wobble * 0.4],
    [x + notch * 0.72, y + height + 1],
    [x - 1, y + height * 0.57],
    [x + 2, y + height * 0.38 - wobble * 0.2],
  ]);
}

function traceClippedCard(context, x, y, width, height) {
  const cut = Math.min(18, height * 0.18);
  const wobble = Math.min(2.8, height * 0.035);
  traceSoftClosedPath(context, [
    [x + cut * 0.83, y + 1],
    [x + width * 0.28, y - wobble * 0.55],
    [x + width * 0.61, y + wobble * 0.72],
    [x + width - cut * 0.77, y],
    [x + width + wobble * 0.22, y + cut * 0.88],
    [x + width - wobble * 0.45, y + height * 0.44],
    [x + width + wobble * 0.16, y + height - cut * 0.93],
    [x + width - cut * 1.08, y + height - 1],
    [x + width * 0.69, y + height + wobble * 0.46],
    [x + width * 0.31, y + height - wobble * 0.58],
    [x + cut * 0.91, y + height],
    [x - wobble * 0.2, y + height - cut * 1.07],
    [x + wobble * 0.48, y + height * 0.57],
    [x - wobble * 0.12, y + cut * 0.82],
  ]);
}

function traceWaxMedallion(context, x, y, radius, phase) {
  const points = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = (index * Math.PI) / 9;
    const ripple = 0.9 + ((index * 7) % 5) * 0.022 + Math.sin(phase + index * 1.73) * 0.028;
    points.push([
      x + Math.cos(angle) * radius * ripple,
      y + Math.sin(angle) * radius * ripple,
    ]);
  }
  traceSoftClosedPath(context, points);
}

function traceWaxLight(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.62, y - radius * 0.2);
  context.bezierCurveTo(
    x - radius * 0.51,
    y - radius * 0.69,
    x + radius * 0.08,
    y - radius * 0.82,
    x + radius * 0.39,
    y - radius * 0.48,
  );
  context.bezierCurveTo(
    x + radius * 0.06,
    y - radius * 0.38,
    x - radius * 0.27,
    y - radius * 0.13,
    x - radius * 0.62,
    y - radius * 0.2,
  );
  context.closePath();
}

function traceWaxShade(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.68, y + radius * 0.36);
  context.bezierCurveTo(
    x - radius * 0.14,
    y + radius * 0.53,
    x + radius * 0.43,
    y + radius * 0.33,
    x + radius * 0.73,
    y + radius * 0.16,
  );
  context.bezierCurveTo(
    x + radius * 0.62,
    y + radius * 0.72,
    x - radius * 0.25,
    y + radius * 0.86,
    x - radius * 0.68,
    y + radius * 0.36,
  );
  context.closePath();
}

function traceSoftClosedPath(context, points) {
  const previous = points.at(-1);
  const first = points[0];
  context.beginPath();
  context.moveTo((previous[0] + first[0]) / 2, (previous[1] + first[1]) / 2);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(
      point[0],
      point[1],
      (point[0] + next[0]) / 2,
      (point[1] + next[1]) / 2,
    );
  }
  context.closePath();
}

function drawCornerFlourish(context, x, y, direction) {
  context.save();
  context.strokeStyle = 'rgba(91,62,43,0.48)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x, y + 22);
  context.bezierCurveTo(x + direction * 28, y + 20, x + direction * 28, y - 6, x + direction * 4, y - 4);
  context.bezierCurveTo(x - direction * 12, y - 2, x - direction * 12, y + 13, x, y + 13);
  context.stroke();
  context.restore();
}

function fitText(context, text, x, y, maxWidth) {
  let size = Number.parseInt(context.font, 10) || 24;
  while (size > 17 && context.measureText(text).width > maxWidth) {
    size -= 1;
    context.font = context.font.replace(/\d+px/, `${size}px`);
  }
  context.fillText(text, x, y);
}
