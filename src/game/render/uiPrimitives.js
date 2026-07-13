import { PALETTE } from '../config.js';

const INK = '#382a24';
const MUTED_INK = '#6b5744';
const PAGE_EDGE = '#b68b55';
const PAGE_SHADOW = '#2b2034';
const WAX_DARK = '#4d2430';

export function traceRoundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export function drawStorybookSpread(context, rect, { title, subtitle = null } = {}) {
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
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();

  traceOpenBookPage(context, x, y, width / 2 + 10, height, 'left');
  context.fillStyle = '#f3e6ca';
  context.fill();
  context.strokeStyle = PAGE_EDGE;
  context.lineWidth = 4;
  context.stroke();

  traceOpenBookPage(context, middle - 10, y, width / 2 + 10, height, 'right');
  context.fillStyle = PALETTE.parchment;
  context.fill();
  context.strokeStyle = PAGE_EDGE;
  context.lineWidth = 4;
  context.stroke();

  context.strokeStyle = 'rgba(92,62,42,0.34)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(middle - 5, y + 28);
  context.bezierCurveTo(middle - 18, y + height * 0.34, middle - 18, y + height * 0.68, middle - 4, y + height - 28);
  context.moveTo(middle + 5, y + 28);
  context.bezierCurveTo(middle + 18, y + height * 0.34, middle + 18, y + height * 0.68, middle + 4, y + height - 28);
  context.stroke();

  drawCornerFlourish(context, x + 42, y + 42, 1);
  drawCornerFlourish(context, x + width - 42, y + 42, -1);

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

export function drawRibbonTab(context, rect, label, { icon = '', active = false } = {}) {
  const { x, y, width, height } = rect;
  context.save();
  context.fillStyle = active ? '#66405f' : '#8c765d';
  traceRibbon(context, x, y + (active ? 0 : 7), width, height - (active ? 0 : 7));
  context.fill();
  context.strokeStyle = active ? PALETTE.interactive : '#5f4d3e';
  context.lineWidth = active ? 5 : 3;
  context.stroke();
  context.fillStyle = active ? '#fff8e8' : '#30261f';
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

  context.fillStyle = '#8b6845';
  traceClippedCard(context, x + 5, y + 8, width, height);
  context.fill();

  context.fillStyle = selected ? '#fff1c3' : '#ead9b7';
  traceClippedCard(context, x, y, width, height);
  context.fill();
  context.strokeStyle = selected ? PALETTE.interactive : '#8a6b44';
  context.lineWidth = selected ? 6 : 4;
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
  context.fillStyle = '#35233f';
  traceRibbon(context, x, y, width, height);
  context.fill();
  context.strokeStyle = PALETTE.interactive;
  context.lineWidth = 5;
  context.stroke();
  drawWaxMedallion(context, x + 52, y + height / 2, 31, '↩');
  context.fillStyle = '#fff8e8';
  context.textAlign = 'center';
  context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, x + width / 2 + 24, y + height / 2 + 9);
  context.restore();
}

export function drawWaxMedallion(context, x, y, radius, glyph, { danger = false } = {}) {
  context.save();
  context.fillStyle = danger ? '#642a35' : WAX_DARK;
  context.beginPath();
  for (let index = 0; index < 16; index += 1) {
    const angle = index * Math.PI / 8;
    const r = radius * (index % 2 === 0 ? 1 : 0.88);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.strokeStyle = danger ? '#bd7580' : PALETTE.candle;
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = '#fff8e8';
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
    context.lineTo(x + 7, y + height - 35);
    context.quadraticCurveTo(x + 12, y + height, x + 42, y + height);
    context.quadraticCurveTo(inner - 48, y + height - 18, inner, y + height - 2);
    context.lineTo(inner, y + 18);
    context.quadraticCurveTo(inner - 52, y + 3, x + 28, y);
  } else {
    context.moveTo(inner, y + 18);
    context.quadraticCurveTo(x + 52, y + 3, x + width - 28, y);
    context.quadraticCurveTo(x + width - 8, y + 5, x + width, y + 30);
    context.lineTo(x + width - 7, y + height - 35);
    context.quadraticCurveTo(x + width - 12, y + height, x + width - 42, y + height);
    context.quadraticCurveTo(x + 48, y + height - 18, inner, y + height - 2);
  }
  context.closePath();
}

function traceRibbon(context, x, y, width, height) {
  const notch = Math.min(18, height * 0.24);
  context.beginPath();
  context.moveTo(x + notch, y);
  context.lineTo(x + width - notch, y);
  context.lineTo(x + width, y + height / 2);
  context.lineTo(x + width - notch, y + height);
  context.lineTo(x + notch, y + height);
  context.lineTo(x, y + height / 2);
  context.closePath();
}

function traceClippedCard(context, x, y, width, height) {
  const cut = Math.min(18, height * 0.18);
  context.beginPath();
  context.moveTo(x + cut, y);
  context.lineTo(x + width - cut, y);
  context.lineTo(x + width, y + cut);
  context.lineTo(x + width, y + height - cut);
  context.lineTo(x + width - cut, y + height);
  context.lineTo(x + cut, y + height);
  context.lineTo(x, y + height - cut);
  context.lineTo(x, y + cut);
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
