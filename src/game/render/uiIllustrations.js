import { PALETTE } from '../config.js';
import { traceRoundedRect } from './uiPrimitives.js';

const INK = '#382a24';
const OUTLINE = '#3a2d22';
const BRASS = '#c89d45';
const BRASS_LIGHT = '#f4d58d';
const BRASS_DARK = '#76522c';
const LEATHER = '#6d452d';
const LEATHER_DARK = '#3f2b23';
const PAPER_GRAIN = Object.freeze([
  [0.08, 0.23, 0.055, -0.012], [0.15, 0.71, 0.072, 0.016], [0.23, 0.42, 0.044, -0.018],
  [0.31, 0.82, 0.061, 0.011], [0.38, 0.18, 0.052, 0.014], [0.46, 0.58, 0.067, -0.013],
  [0.54, 0.29, 0.046, 0.018], [0.61, 0.76, 0.058, -0.012], [0.69, 0.47, 0.073, 0.015],
  [0.77, 0.16, 0.049, -0.014], [0.84, 0.66, 0.064, 0.012], [0.91, 0.35, 0.052, -0.017],
]);

export function traceDeckledRect(context, x, y, width, height, depth = 7) {
  const top = [0, 0.16, -0.08, 0.12, -0.05, 0.1, 0];
  const side = [0, -0.12, 0.08, -0.1, 0.05, -0.08, 0];
  const points = [];
  for (let index = 0; index < top.length; index += 1) {
    points.push([x + (width * index) / (top.length - 1), y + top[index] * depth]);
  }
  for (let index = 1; index < side.length; index += 1) {
    points.push([x + width + side[index] * depth, y + (height * index) / (side.length - 1)]);
  }
  for (let index = top.length - 2; index >= 0; index -= 1) {
    points.push([x + (width * index) / (top.length - 1), y + height - top[index] * depth]);
  }
  for (let index = side.length - 2; index > 0; index -= 1) {
    points.push([x - side[index] * depth, y + (height * index) / (side.length - 1)]);
  }
  context.beginPath();
  points.forEach(([pointX, pointY], index) => {
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  });
  context.closePath();
}

export function drawDeckledParchment(context, rect, {
  fill = '#f3e6ca',
  edge = '#a87942',
  shadow = 'rgba(31,20,28,0.5)',
  ornament = true,
} = {}) {
  const { x, y, width, height } = rect;
  context.save();
  context.fillStyle = shadow;
  traceDeckledRect(context, x + 10, y + 14, width, height, 9);
  context.fill();
  context.fillStyle = fill;
  traceDeckledRect(context, x, y, width, height, 9);
  context.fill();
  context.strokeStyle = edge;
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = 'rgba(126,86,45,0.42)';
  context.lineWidth = 2;
  traceDeckledRect(context, x + 15, y + 15, width - 30, height - 30, 5);
  context.stroke();
  if (ornament) {
    drawQuillFlourish(context, x + 43, y + 40, 1);
    drawQuillFlourish(context, x + width - 43, y + 40, -1);
  }
  context.restore();
}

export function drawDialogueScroll(context, rect, { night = false } = {}) {
  const { x, y, width, height } = rect;
  const colors = night
    ? {
        top: '#806447', middle: '#69503d', bottom: '#4d392f', edge: '#d4aa5b', ink: '#2f2422',
        highlight: 'rgba(250,221,154,0.2)', grain: 'rgba(244,210,139,0.13)', shadow: 'rgba(15,10,22,0.58)',
        rollLight: '#9a794f', rollMiddle: '#765b42', rollDark: '#47332b',
      }
    : {
        top: '#f7e9c8', middle: '#e6ce9f', bottom: '#c9a978', edge: '#9a6938', ink: '#49352a',
        highlight: 'rgba(255,246,210,0.48)', grain: 'rgba(112,75,43,0.13)', shadow: 'rgba(28,18,27,0.46)',
        rollLight: '#f3dfb8', rollMiddle: '#e4c999', rollDark: '#b58f60',
      };

  context.save();
  context.fillStyle = colors.shadow;
  traceDeckledRect(context, x + 8, y + 11, width, height, 11);
  context.fill();

  context.fillStyle = colors.middle;
  traceDeckledRect(context, x, y, width, height, 11);
  context.fill();
  context.strokeStyle = colors.ink;
  context.lineWidth = 6;
  context.stroke();
  context.strokeStyle = colors.edge;
  context.lineWidth = 3;
  traceDeckledRect(context, x + 4, y + 3, width - 8, height - 7, 8);
  context.stroke();

  context.save();
  traceDeckledRect(context, x + 7, y + 7, width - 14, height - 14, 7);
  context.clip();
  context.fillStyle = colors.top;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  context.lineTo(x + width, y + height * 0.34);
  context.bezierCurveTo(
    x + width * 0.73,
    y + height * 0.43,
    x + width * 0.34,
    y + height * 0.3,
    x,
    y + height * 0.4,
  );
  context.closePath();
  context.fill();
  context.fillStyle = colors.bottom;
  context.beginPath();
  context.moveTo(x, y + height * 0.75);
  context.bezierCurveTo(
    x + width * 0.31,
    y + height * 0.68,
    x + width * 0.68,
    y + height * 0.84,
    x + width,
    y + height * 0.72,
  );
  context.lineTo(x + width, y + height);
  context.lineTo(x, y + height);
  context.closePath();
  context.fill();
  context.fillStyle = colors.highlight;
  context.beginPath();
  context.ellipse(x + width * 0.21, y + height * 0.19, width * 0.24, height * 0.16, -0.05, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = colors.grain;
  context.lineCap = 'round';
  context.lineWidth = 1.4;
  for (const [grainX, grainY, grainLength, grainBend] of PAPER_GRAIN) {
    const startX = x + width * grainX;
    const startY = y + height * grainY;
    const length = width * grainLength;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      startX + length * 0.48,
      startY + height * grainBend,
      startX + length,
      startY + height * grainBend * 0.4,
    );
    context.stroke();
  }

  context.strokeStyle = night ? 'rgba(244,210,139,0.1)' : 'rgba(103,68,39,0.1)';
  context.lineWidth = 2.2;
  for (const progress of [0.21, 0.53, 0.78]) {
    context.beginPath();
    context.moveTo(x + 28, y + height * progress);
    context.bezierCurveTo(
      x + width * 0.32,
      y + height * (progress - 0.018),
      x + width * 0.69,
      y + height * (progress + 0.024),
      x + width - 30,
      y + height * progress,
    );
    context.stroke();
  }
  context.restore();

  drawScrollRoll(context, x + 20, y + height / 2, height, -1, colors);
  drawScrollRoll(context, x + width - 20, y + height / 2, height, 1, colors);
  context.restore();
}

function drawScrollRoll(context, x, y, height, direction, colors) {
  const halfHeight = height * 0.42;
  const outerX = x + direction * 16;
  const innerX = x - direction * 14;
  context.fillStyle = colors.rollMiddle;
  context.beginPath();
  context.moveTo(innerX, y - halfHeight + 4);
  context.bezierCurveTo(outerX, y - halfHeight - 3, outerX + direction * 4, y - halfHeight * 0.34, outerX, y);
  context.bezierCurveTo(outerX + direction * 5, y + halfHeight * 0.36, outerX, y + halfHeight + 2, innerX, y + halfHeight - 4);
  context.quadraticCurveTo(x - direction * 3, y + halfHeight * 0.24, innerX, y - halfHeight + 4);
  context.closePath();
  context.fill();
  context.strokeStyle = colors.ink;
  context.lineWidth = 3.4;
  context.stroke();
  context.fillStyle = colors.rollDark;
  context.beginPath();
  context.moveTo(innerX, y - halfHeight + 5);
  context.quadraticCurveTo(x - direction * 4, y, innerX, y + halfHeight - 5);
  context.quadraticCurveTo(x + direction * 2, y + halfHeight * 0.31, x + direction * 2, y - halfHeight * 0.28);
  context.closePath();
  context.fill();
  context.fillStyle = colors.rollLight;
  context.beginPath();
  context.moveTo(outerX - direction * 5, y - halfHeight * 0.72);
  context.quadraticCurveTo(outerX + direction * 2, y - halfHeight * 0.08, outerX - direction * 4, y + halfHeight * 0.5);
  context.quadraticCurveTo(outerX - direction * 8, y, outerX - direction * 5, y - halfHeight * 0.72);
  context.closePath();
  context.fill();
  context.strokeStyle = colors.edge;
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(outerX - direction * 3, y - halfHeight * 0.75);
  context.quadraticCurveTo(outerX + direction * 3, y, outerX - direction * 2, y + halfHeight * 0.72);
  context.stroke();
}

export function drawBrassCameoFrame(context, x, y, radius, { active = true } = {}) {
  context.save();
  context.fillStyle = 'rgba(35,23,31,0.5)';
  context.beginPath();
  context.ellipse(x + 7, y + 10, radius + 11, radius + 17, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = BRASS_DARK;
  context.beginPath();
  context.ellipse(x, y, radius + 12, radius + 16, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = '#30283a';
  context.beginPath();
  context.ellipse(x, y, radius, radius + 4, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = active ? PALETTE.interactive : '#a98956';
  context.lineWidth = 3;
  context.stroke();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    drawBrassLeaf(
      context,
      x + Math.cos(angle) * (radius + 15),
      y + Math.sin(angle) * (radius + 19),
      angle,
      radius * 0.18,
    );
  }
  context.restore();
}

export function drawWaxIcon(context, x, y, radius, icon, {
  danger = false,
  selected = false,
  iconColor = '#fff8e8',
} = {}) {
  context.save();
  context.fillStyle = danger ? '#642a35' : selected ? '#5e365d' : '#4d2430';
  context.beginPath();
  for (let index = 0; index < 20; index += 1) {
    const angle = (index * Math.PI) / 10;
    const ripple = index % 2 === 0 ? 1 : index % 4 === 1 ? 0.88 : 0.93;
    const px = x + Math.cos(angle) * radius * ripple;
    const py = y + Math.sin(angle) * radius * ripple;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.strokeStyle = danger ? '#d1848f' : BRASS_LIGHT;
  context.lineWidth = Math.max(2, radius * 0.09);
  context.stroke();
  drawVectorIcon(context, icon, x, y, radius * 1.22, { color: iconColor, secondary: BRASS_LIGHT });
  context.restore();
}

export function drawVectorIcon(context, icon, x, y, size, {
  color = INK,
  secondary = BRASS_LIGHT,
  fill = null,
} = {}) {
  const normalized = normalizeIcon(icon);
  context.save();
  context.translate(x, y);
  context.scale(size / 100, size / 100);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = color;
  context.fillStyle = fill ?? color;
  context.lineWidth = 7;

  if (normalized === 'owl') drawOwlIcon(context, color, secondary);
  else if (normalized === 'cat') drawCatIcon(context, color, secondary);
  else if (normalized === 'toad') drawToadIcon(context, color, secondary);
  else if (normalized === 'wand') drawWandIcon(context, color, secondary);
  else if (normalized === 'eyes') drawEyesIcon(context, color, secondary);
  else if (normalized === 'map') drawMapIcon(context, color, secondary);
  else if (normalized === 'cards') drawCardsIcon(context, color, secondary);
  else if (normalized === 'replay') drawReplayIcon(context, color, secondary);
  else if (normalized === 'quill') drawQuillIcon(context, color, secondary);
  else if (normalized === 'satchel') drawSatchelIcon(context, color, secondary);
  else if (normalized === 'quest') drawCompassIcon(context, color, secondary);
  else if (normalized === 'close') drawCloseIcon(context, color, secondary);
  else if (normalized === 'check') drawCheckIcon(context, color, secondary);
  else if (normalized === 'speaker') drawSpeakerIcon(context, color, secondary);
  else if (normalized === 'gear') drawGearIcon(context, color, secondary);
  else if (normalized === 'name') drawNameIcon(context, color, secondary);
  else if (normalized === 'heart') drawHeartIcon(context, color);
  else if (normalized === 'rose') drawRoseIcon(context, color, secondary);
  else if (normalized === 'circle') drawOrbIcon(context, color, secondary);
  else drawStarIcon(context, color, secondary);
  context.restore();
}

export function drawLeatherSatchel(context, rect, { open = false, muted = false } = {}) {
  const { x, y, width, height } = rect;
  const centerX = x + width / 2;
  context.save();
  context.globalAlpha = muted ? 0.55 : 1;
  context.strokeStyle = LEATHER_DARK;
  context.lineWidth = Math.max(5, width * 0.075);
  context.beginPath();
  context.arc(centerX, y + height * 0.34, width * 0.29, Math.PI, 0);
  context.stroke();
  context.fillStyle = LEATHER;
  traceRoundedRect(context, x + width * 0.08, y + height * 0.27, width * 0.84, height * 0.67, width * 0.15);
  context.fill();
  context.strokeStyle = '#39271e';
  context.lineWidth = Math.max(3, width * 0.045);
  context.stroke();
  context.fillStyle = open ? '#8f623a' : '#7d5131';
  context.beginPath();
  context.moveTo(x + width * 0.1, y + height * 0.35);
  context.quadraticCurveTo(centerX, y + height * 0.63, x + width * 0.9, y + height * 0.35);
  context.lineTo(x + width * 0.86, y + height * 0.66);
  context.quadraticCurveTo(centerX, y + height * 0.78, x + width * 0.14, y + height * 0.66);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = 'rgba(244,213,141,0.5)';
  context.lineWidth = 2.5;
  context.setLineDash([5, 5]);
  context.beginPath();
  context.moveTo(x + width * 0.18, y + height * 0.73);
  context.quadraticCurveTo(centerX, y + height * 0.85, x + width * 0.82, y + height * 0.73);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = BRASS;
  traceRoundedRect(context, centerX - width * 0.09, y + height * 0.58, width * 0.18, height * 0.18, width * 0.035);
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 2;
  context.stroke();
  drawVectorIcon(context, 'owl', centerX, y + height * 0.665, width * 0.12, { color: '#4d2430', secondary: '#4d2430' });
  context.restore();
}

export function drawCompassQuest(context, rect, time = 0, { pulse = false } = {}) {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.43;
  const breathe = pulse ? 1 + Math.sin(time * 3.5) * 0.06 : 1;
  context.save();
  context.translate(x, y);
  context.scale(breathe, breathe);
  context.fillStyle = 'rgba(20,17,38,0.42)';
  context.beginPath();
  context.arc(5, 7, radius + 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = BRASS_DARK;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = '#f3e6ca';
  context.beginPath();
  context.arc(0, 0, radius - 9, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#7b5c37';
  context.lineWidth = 2;
  context.stroke();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    context.strokeStyle = index % 2 === 0 ? BRASS_DARK : '#ae8e60';
    context.lineWidth = index % 2 === 0 ? 3 : 2;
    context.beginPath();
    context.moveTo(Math.cos(angle) * (radius - 20), Math.sin(angle) * (radius - 20));
    context.lineTo(Math.cos(angle) * (radius - 13), Math.sin(angle) * (radius - 13));
    context.stroke();
  }
  context.fillStyle = PALETTE.violet;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(0, -radius + 18);
  context.lineTo(8, -5);
  context.lineTo(0, 12);
  context.lineTo(-8, -5);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = PALETTE.interactive;
  context.beginPath();
  context.arc(0, 0, 5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawBrassWandHolster(context, rect, { enabled = true, time = 0 } = {}) {
  const { x, y, width, height } = rect;
  context.save();
  context.globalAlpha = enabled ? 1 : 0.58;
  context.translate(x + width / 2, y + height / 2);
  context.fillStyle = 'rgba(20,17,38,0.42)';
  context.beginPath();
  context.ellipse(4, 7, width * 0.42, height * 0.43, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = BRASS_DARK;
  context.beginPath();
  context.ellipse(0, 0, width * 0.42, height * 0.43, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = enabled ? BRASS_LIGHT : '#8a7a66';
  context.lineWidth = 5;
  context.stroke();
  context.rotate(-0.73);
  context.fillStyle = '#3f2b23';
  traceRoundedRect(context, -13, -39, 26, 82, 12);
  context.fill();
  context.strokeStyle = '#9f773f';
  context.lineWidth = 4;
  context.stroke();
  if (enabled) {
    context.strokeStyle = '#9a6745';
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(0, 29);
    context.lineTo(0, -38);
    context.stroke();
    context.strokeStyle = '#d6a271';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-2, 27);
    context.lineTo(-2, -34);
    context.stroke();
    const glow = 5 + (Math.sin(time * 3.1) + 1) * 2;
    context.fillStyle = PALETTE.interactive;
    context.beginPath();
    context.arc(0, -41, glow, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function normalizeIcon(icon) {
  const value = String(icon ?? '').toLowerCase();
  if (value === 'name-biscuit') return 'name';
  if (value === 'name-pip') return 'circle';
  if (value === 'name-star') return 'star';
  if (value.includes('owl')) return 'owl';
  if (value.includes('cat')) return 'cat';
  if (value.includes('toad')) return 'toad';
  if (value.includes('wand')) return 'wand';
  if (value.includes('eyes')) return 'eyes';
  if (value.includes('map') || value === 'explore') return 'map';
  if (value.includes('card')) return 'cards';
  if (value.includes('replay') || value === '↻' || value === '↩') return 'replay';
  if (value.includes('custom') || value.includes('quill') || value === '✎') return 'quill';
  if (value.includes('satchel')) return 'satchel';
  if (value.includes('quest')) return 'quest';
  if (value.includes('close') || value === '×') return 'close';
  if (value.includes('check') || value === '✓') return 'check';
  if (value.includes('speaker') || value.includes('listen')) return 'speaker';
  if (value.includes('gear') || value === '⚙') return 'gear';
  if (value.includes('biscuit') || value.includes('name')) return 'name';
  if (value === 'rose' || value.includes('heart')) return 'heart';
  if (value === 'teal' || value === 'circle') return 'circle';
  return value;
}

function drawOwlIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-35, -28);
  context.lineTo(-15, -43);
  context.quadraticCurveTo(0, -51, 15, -43);
  context.lineTo(35, -28);
  context.quadraticCurveTo(42, 6, 27, 35);
  context.quadraticCurveTo(0, 51, -27, 35);
  context.quadraticCurveTo(-42, 6, -35, -28);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.fillStyle = '#fff8e8';
  for (const eyeX of [-15, 15]) {
    context.beginPath();
    context.arc(eyeX, -13, 13, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = color;
    context.beginPath();
    context.arc(eyeX, -12, 5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fff8e8';
  }
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-7, 5);
  context.lineTo(7, 5);
  context.lineTo(0, 14);
  context.closePath();
  context.fill();
  context.lineWidth = 4;
  for (let row = 0; row < 2; row += 1) {
    for (let column = -1; column <= 1; column += 1) {
      const featherX = column * 14 + (row % 2 ? 7 : 0);
      context.beginPath();
      context.arc(featherX, 22 + row * 11, 8, 0.18, Math.PI - 0.18);
      context.stroke();
    }
  }
}

function drawCatIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-34, -31);
  context.lineTo(-28, -48);
  context.lineTo(-10, -37);
  context.quadraticCurveTo(0, -41, 10, -37);
  context.lineTo(28, -48);
  context.lineTo(34, -31);
  context.quadraticCurveTo(42, 1, 27, 29);
  context.quadraticCurveTo(0, 45, -27, 29);
  context.quadraticCurveTo(-42, 1, -34, -31);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.fillStyle = color;
  for (const eyeX of [-13, 13]) {
    context.beginPath();
    context.ellipse(eyeX, -8, 4, 8, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.beginPath();
  context.moveTo(-5, 8);
  context.lineTo(5, 8);
  context.lineTo(0, 14);
  context.closePath();
  context.fill();
  context.lineWidth = 4;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * 8, 15);
    context.lineTo(side * 43, 9);
    context.moveTo(side * 8, 19);
    context.lineTo(side * 43, 23);
    context.stroke();
  }
}

function drawToadIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.ellipse(0, 14, 42, 29, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  for (const eyeX of [-22, 22]) {
    context.fillStyle = secondary;
    context.beginPath();
    context.arc(eyeX, -13, 14, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = color;
    context.beginPath();
    context.arc(eyeX, -13, 5, 0, Math.PI * 2);
    context.fill();
  }
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-13, 22);
  context.quadraticCurveTo(0, 31, 13, 22);
  context.stroke();
  context.beginPath();
  context.moveTo(-35, 30);
  context.lineTo(-49, 42);
  context.moveTo(35, 30);
  context.lineTo(49, 42);
  context.stroke();
}

function drawWandIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 11;
  context.beginPath();
  context.moveTo(-36, 36);
  context.lineTo(25, -28);
  context.stroke();
  context.strokeStyle = secondary;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-31, 31);
  context.lineTo(27, -30);
  context.stroke();
  drawStarIconAt(context, 32, -35, 15, secondary, color);
}

function drawEyesIcon(context, color, secondary) {
  context.fillStyle = secondary;
  for (const eyeX of [-22, 22]) {
    context.beginPath();
    context.ellipse(eyeX, 0, 19, 27, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = color;
    context.stroke();
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(eyeX, 2, 7, 14, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = secondary;
  }
}

function drawMapIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-42, -31);
  context.lineTo(-13, -39);
  context.lineTo(14, -29);
  context.lineTo(42, -38);
  context.lineTo(42, 32);
  context.lineTo(14, 40);
  context.lineTo(-13, 30);
  context.lineTo(-42, 39);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-13, -39);
  context.lineTo(-13, 30);
  context.moveTo(14, -29);
  context.lineTo(14, 40);
  context.stroke();
  context.setLineDash([7, 6]);
  context.beginPath();
  context.moveTo(-31, 18);
  context.quadraticCurveTo(-3, -21, 27, 5);
  context.stroke();
  context.setLineDash([]);
  drawStarIconAt(context, 28, 5, 10, color, secondary);
}

function drawCardsIcon(context, color, secondary) {
  context.save();
  context.rotate(-0.16);
  context.fillStyle = secondary;
  traceRoundedRect(context, -35, -37, 56, 74, 7);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.restore();
  context.save();
  context.rotate(0.13);
  context.fillStyle = '#fff8e8';
  traceRoundedRect(context, -17, -37, 56, 74, 7);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  drawOwlIconMini(context, 11, 1, color, secondary);
  context.restore();
}

function drawReplayIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 9;
  context.beginPath();
  context.arc(2, 2, 31, -0.8, Math.PI * 1.45);
  context.stroke();
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-39, -13);
  context.lineTo(-12, -17);
  context.lineTo(-27, 5);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();
}

function drawQuillIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(-33, 37);
  context.bezierCurveTo(-28, -3, -5, -39, 38, -43);
  context.bezierCurveTo(39, -9, 14, 27, -33, 37);
  context.closePath();
  context.fill();
  context.stroke();
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-39, 45);
  context.lineTo(26, -28);
  context.stroke();
  for (const offset of [-18, -3, 12]) {
    context.beginPath();
    context.moveTo(offset, -offset * 0.8 - 4);
    context.lineTo(offset + 20, -offset * 0.8 - 9);
    context.stroke();
  }
}

function drawSatchelIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 8;
  context.beginPath();
  context.arc(0, -22, 25, Math.PI, 0);
  context.stroke();
  context.fillStyle = secondary;
  traceRoundedRect(context, -39, -25, 78, 64, 12);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(-36, -15);
  context.quadraticCurveTo(0, 18, 36, -15);
  context.stroke();
  drawOwlIconMini(context, 0, 13, color, '#fff8e8');
}

function drawCompassIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.arc(0, 0, 42, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, -34);
  context.lineTo(10, -7);
  context.lineTo(0, 31);
  context.lineTo(-10, -7);
  context.closePath();
  context.fill();
  context.fillStyle = '#fff8e8';
  context.beginPath();
  context.arc(0, 0, 5, 0, Math.PI * 2);
  context.fill();
}

function drawCloseIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(-28, -28);
  context.quadraticCurveTo(0, 0, 28, 28);
  context.moveTo(28, -28);
  context.quadraticCurveTo(0, 0, -28, 28);
  context.stroke();
  context.fillStyle = secondary;
  context.beginPath();
  context.arc(0, 0, 5, 0, Math.PI * 2);
  context.fill();
}

function drawCheckIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 12;
  context.beginPath();
  context.moveTo(-32, 0);
  context.lineTo(-8, 27);
  context.lineTo(36, -29);
  context.stroke();
  context.fillStyle = secondary;
  context.beginPath();
  context.arc(-8, 27, 4, 0, Math.PI * 2);
  context.fill();
}

function drawSpeakerIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(-39, -15);
  context.lineTo(-17, -15);
  context.lineTo(8, -36);
  context.lineTo(8, 36);
  context.lineTo(-17, 15);
  context.lineTo(-39, 15);
  context.closePath();
  context.fill();
  context.stroke();
  context.lineWidth = 7;
  context.beginPath();
  context.arc(9, 0, 20, -0.85, 0.85);
  context.moveTo(16, -31);
  context.arc(14, 0, 34, -0.85, 0.85);
  context.stroke();
}

function drawGearIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.fillStyle = secondary;
  context.lineWidth = 10;
  for (let index = 0; index < 10; index += 1) {
    const angle = (index * Math.PI) / 5;
    context.beginPath();
    context.moveTo(Math.cos(angle) * 29, Math.sin(angle) * 29);
    context.lineTo(Math.cos(angle) * 43, Math.sin(angle) * 43);
    context.stroke();
  }
  context.beginPath();
  context.arc(0, 0, 31, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.arc(0, 0, 11, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#fff8e8';
  context.beginPath();
  context.arc(-4, -4, 3, 0, Math.PI * 2);
  context.fill();
}

function drawNameIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.ellipse(0, 0, 39, 30, 0.2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-24, -7);
  context.quadraticCurveTo(0, -22, 24, -4);
  context.moveTo(-27, 7);
  context.quadraticCurveTo(0, -8, 27, 10);
  context.stroke();
  for (const spot of [[-16, 14], [10, 15], [18, -15], [-4, -13]]) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(spot[0], spot[1], 3, 0, Math.PI * 2);
    context.fill();
  }
}

function drawHeartIcon(context, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 38);
  context.bezierCurveTo(-52, 5, -43, -34, -18, -37);
  context.bezierCurveTo(-6, -39, 0, -29, 0, -21);
  context.bezierCurveTo(0, -29, 6, -39, 18, -37);
  context.bezierCurveTo(43, -34, 52, 5, 0, 38);
  context.fill();
}

function drawRoseIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(0, 40);
  context.quadraticCurveTo(5, 14, 0, -2);
  context.stroke();
  context.fillStyle = secondary;
  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 3;
    context.beginPath();
    context.ellipse(Math.cos(angle) * 15, -15 + Math.sin(angle) * 13, 16, 10, angle, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.fillStyle = color;
  context.beginPath();
  context.arc(0, -15, 8, 0, Math.PI * 2);
  context.fill();
}

function drawOrbIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.arc(0, 0, 35, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.fillStyle = '#fff8e8';
  context.globalAlpha = 0.7;
  context.beginPath();
  context.ellipse(-12, -14, 9, 6, -0.6, 0, Math.PI * 2);
  context.fill();
}

function drawStarIcon(context, color, secondary) {
  drawStarIconAt(context, 0, 0, 40, secondary, color);
}

function drawStarIconAt(context, x, y, radius, fill, stroke) {
  context.fillStyle = fill;
  context.strokeStyle = stroke;
  context.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 4;
    const currentRadius = index % 2 === 0 ? radius : radius * 0.34;
    const pointX = x + Math.cos(angle) * currentRadius;
    const pointY = y + Math.sin(angle) * currentRadius;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fill();
  context.lineWidth = Math.max(2, radius * 0.14);
  context.stroke();
}

function drawOwlIconMini(context, x, y, color, secondary) {
  context.save();
  context.translate(x, y);
  context.scale(0.34, 0.34);
  context.lineWidth = 7;
  drawOwlIcon(context, color, secondary);
  context.restore();
}

function drawQuillFlourish(context, x, y, direction) {
  context.save();
  context.strokeStyle = 'rgba(105,72,43,0.46)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x, y + 18);
  context.bezierCurveTo(x + direction * 32, y + 15, x + direction * 30, y - 16, x + direction * 5, y - 9);
  context.bezierCurveTo(x - direction * 11, y - 4, x - direction * 11, y + 10, x, y + 11);
  context.stroke();
  drawOwlIconMini(context, x + direction * 25, y + 8, 'rgba(105,72,43,0.46)', 'rgba(211,172,105,0.38)');
  context.restore();
}

function drawBrassLeaf(context, x, y, angle, size) {
  context.save();
  context.translate(x, y);
  context.rotate(angle + Math.PI / 2);
  context.fillStyle = BRASS;
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(0, -size);
  context.quadraticCurveTo(size * 0.75, 0, 0, size);
  context.quadraticCurveTo(-size * 0.75, 0, 0, -size);
  context.fill();
  context.stroke();
  context.restore();
}
