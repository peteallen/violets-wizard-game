import { PALETTE } from '../config.js';
import { traceRoundedRect } from './uiPrimitives.js';

const TAU = Math.PI * 2;
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
  context.moveTo(
    (points[0][0] + points[1][0]) / 2,
    (points[0][1] + points[1][1]) / 2,
  );
  for (let index = 1; index <= points.length; index += 1) {
    const point = points[index % points.length];
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

export function drawDeckledParchment(context, rect, {
  fill = '#f3e6ca',
  edge = '#a87942',
  shadow = 'rgba(31,20,28,0.5)',
  ornament = true,
  lighting = 'light',
} = {}) {
  const { x, y, width, height } = rect;
  context.save();
  context.fillStyle = shadow;
  traceDeckledRect(context, x + 10, y + 14, width, height, 9);
  context.fill();
  context.fillStyle = fill;
  traceDeckledRect(context, x, y, width, height, 9);
  context.fill();

  context.save();
  traceDeckledRect(context, x, y, width, height, 9);
  context.clip();
  drawParchmentLight(context, x, y, width, height, lighting);
  drawParchmentGrain(context, x, y, width, height);
  context.restore();

  context.strokeStyle = edge;
  context.lineWidth = 5;
  traceDeckledRect(context, x, y, width, height, 9);
  context.stroke();
  context.strokeStyle = 'rgba(126,86,45,0.42)';
  context.lineWidth = 2;
  traceDeckledRect(context, x + 15, y + 15, width - 30, height - 30, 5);
  context.stroke();
  if (ornament) {
    drawPaperFlourish(context, x + 43, y + 40, 1);
    drawPaperFlourish(context, x + width - 43, y + 40, -1);
  }
  context.restore();
}

function drawParchmentLight(context, x, y, width, height, lighting) {
  const dark = lighting === 'dark';
  context.fillStyle = dark ? 'rgba(244,213,141,0.12)' : 'rgba(255,244,210,0.38)';
  context.beginPath();
  context.moveTo(x - 5, y - 4);
  context.bezierCurveTo(
    x + width * 0.27,
    y + 1,
    x + width * 0.56,
    y - 2,
    x + width * 0.68,
    y + height * 0.15,
  );
  context.bezierCurveTo(
    x + width * 0.52,
    y + height * 0.24,
    x + width * 0.24,
    y + height * 0.3,
    x - 5,
    y + height * 0.39,
  );
  context.closePath();
  context.fill();

  context.fillStyle = dark ? 'rgba(18,14,24,0.26)' : 'rgba(105,65,38,0.17)';
  context.beginPath();
  context.moveTo(x - 4, y + height * 0.72);
  context.bezierCurveTo(
    x + width * 0.29,
    y + height * 0.67,
    x + width * 0.68,
    y + height * 0.8,
    x + width + 5,
    y + height * 0.63,
  );
  context.bezierCurveTo(
    x + width + 4,
    y + height * 0.86,
    x + width * 0.76,
    y + height + 5,
    x - 4,
    y + height + 4,
  );
  context.closePath();
  context.fill();

  context.fillStyle = dark ? 'rgba(219,183,126,0.07)' : 'rgba(126,82,44,0.1)';
  context.beginPath();
  context.moveTo(x + width * 0.79, y + height * 0.06);
  context.bezierCurveTo(
    x + width * 0.94,
    y + height * 0.18,
    x + width * 0.96,
    y + height * 0.48,
    x + width * 0.9,
    y + height * 0.7,
  );
  context.bezierCurveTo(
    x + width * 0.84,
    y + height * 0.53,
    x + width * 0.82,
    y + height * 0.29,
    x + width * 0.79,
    y + height * 0.06,
  );
  context.closePath();
  context.fill();
}

function drawParchmentGrain(context, x, y, width, height) {
  context.strokeStyle = 'rgba(111,75,43,0.13)';
  context.lineWidth = 1.25;
  context.lineCap = 'round';
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
}

export function drawDialogueScroll(context, rect, { night = false, portraitSide = 'left' } = {}) {
  const { x, y, width, height } = rect;
  const attachedSide = portraitSide === 'right' ? 'right' : 'left';
  const colors = night
    ? {
        top: '#806447', middle: '#69503d', bottom: '#4d392f', edge: '#d4aa5b', ink: '#2f2422',
        highlight: 'rgba(250,221,154,0.2)', grain: 'rgba(244,210,139,0.13)', shadow: 'rgba(15,10,22,0.58)',
      }
    : {
        top: '#f7e9c8', middle: '#e6ce9f', bottom: '#c9a978', edge: '#9a6938', ink: '#49352a',
        highlight: 'rgba(255,246,210,0.48)', grain: 'rgba(112,75,43,0.13)', shadow: 'rgba(28,18,27,0.46)',
      };

  context.save();
  context.fillStyle = colors.shadow;
  traceDialogueCard(context, x + 8, y + 11, width, height, attachedSide, 0.74);
  context.fill();

  context.fillStyle = colors.middle;
  traceDialogueCard(context, x, y, width, height, attachedSide, 0.31);
  context.fill();
  context.strokeStyle = colors.ink;
  context.lineWidth = 6;
  context.stroke();
  context.strokeStyle = colors.edge;
  context.lineWidth = 3;
  traceDialogueCard(context, x + 4, y + 3, width - 8, height - 7, attachedSide, 0.53);
  context.stroke();

  context.save();
  traceDialogueCard(context, x + 7, y + 7, width - 14, height - 14, attachedSide, 0.88);
  context.clip();
  context.fillStyle = colors.top;
  context.beginPath();
  context.moveTo(x - 8, y - 5);
  context.bezierCurveTo(x + width * 0.28, y + 3, x + width * 0.72, y - 3, x + width + 8, y + 2);
  context.bezierCurveTo(
    x + width * 0.82,
    y + height * 0.3,
    x + width * 0.58,
    y + height * 0.43,
    x - 8,
    y + height * 0.4,
  );
  context.bezierCurveTo(x - 2, y + height * 0.21, x - 5, y + height * 0.08, x - 8, y - 5);
  context.closePath();
  context.fill();
  context.fillStyle = colors.bottom;
  context.beginPath();
  context.moveTo(x - 6, y + height * 0.75);
  context.bezierCurveTo(
    x + width * 0.31,
    y + height * 0.68,
    x + width * 0.68,
    y + height * 0.84,
    x + width,
    y + height * 0.72,
  );
  context.bezierCurveTo(x + width * 0.77, y + height * 1.04, x + width * 0.26, y + height * 0.96, x - 6, y + height + 4);
  context.bezierCurveTo(x - 2, y + height * 0.91, x - 5, y + height * 0.83, x - 6, y + height * 0.75);
  context.closePath();
  context.fill();
  context.fillStyle = colors.highlight;
  context.beginPath();
  context.moveTo(x + width * 0.08, y + height * 0.13);
  context.bezierCurveTo(
    x + width * 0.19,
    y + height * 0.01,
    x + width * 0.43,
    y + height * 0.04,
    x + width * 0.49,
    y + height * 0.17,
  );
  context.bezierCurveTo(
    x + width * 0.37,
    y + height * 0.22,
    x + width * 0.17,
    y + height * 0.31,
    x + width * 0.08,
    y + height * 0.13,
  );
  context.closePath();
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
  context.strokeStyle = colors.grain;
  context.lineWidth = 1.2;
  traceDialogueCard(context, x + 12, y + 11, width - 24, height - 22, attachedSide, 1.17);
  context.stroke();
  context.restore();
}

function traceDialogueCard(context, x, y, width, height, portraitSide, phase) {
  const portraitOnLeft = portraitSide === 'left';
  const leftWaist = portraitOnLeft ? 17 : -2;
  const rightWaist = portraitOnLeft ? 2 : -17;
  const points = [
    [x + 18, y + 1],
    [x + width * 0.18, y - 2 + Math.sin(phase) * 2],
    [x + width * 0.39, y + 2],
    [x + width * 0.63, y - 1],
    [x + width * 0.83, y + 3 - Math.cos(phase) * 2],
    [x + width - 14, y + 1],
    [x + width + 1, y + height * 0.16],
    [x + width + rightWaist, y + height * 0.39],
    [x + width + (portraitOnLeft ? 1 : -10), y + height * 0.52],
    [x + width + rightWaist, y + height * 0.68],
    [x + width - 2, y + height * 0.86],
    [x + width - 17, y + height - 1],
    [x + width * 0.8, y + height + 2],
    [x + width * 0.58, y + height - 2],
    [x + width * 0.34, y + height + 3],
    [x + width * 0.14, y + height - 1],
    [x + 13, y + height + 1],
    [x - 2, y + height * 0.84],
    [x - leftWaist, y + height * 0.66],
    [x + (portraitOnLeft ? 10 : -1), y + height * 0.51],
    [x - leftWaist, y + height * 0.36],
    [x + 1, y + height * 0.15],
  ];
  context.beginPath();
  context.moveTo((points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2);
  for (let index = 1; index <= points.length; index += 1) {
    const point = points[index % points.length];
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

export function drawBrassKeyhole(context, rect, { progress = 0 } = {}) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.37;
  const phase = 0.314159;
  context.save();

  context.fillStyle = 'rgba(42, 27, 25, 0.42)';
  traceBrassKeyholePlate(context, centerX + 5, centerY + 7, radius * 1.12, phase + 0.2);
  context.fill();

  context.fillStyle = BRASS_DARK;
  traceBrassKeyholePlate(context, centerX, centerY, radius * 1.12, phase);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 4.6;
  context.stroke();

  context.fillStyle = BRASS;
  traceBrassKeyholePlate(context, centerX, centerY - 1, radius * 0.94, phase + 0.13);
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 2.5;
  context.stroke();

  context.fillStyle = 'rgba(248, 218, 139, 0.38)';
  context.beginPath();
  context.moveTo(centerX - radius * 0.62, centerY - radius * 0.46);
  context.bezierCurveTo(
    centerX - radius * 0.24,
    centerY - radius * 0.9,
    centerX + radius * 0.45,
    centerY - radius * 0.72,
    centerX + radius * 0.62,
    centerY - radius * 0.28,
  );
  context.bezierCurveTo(
    centerX + radius * 0.15,
    centerY - radius * 0.43,
    centerX - radius * 0.21,
    centerY - radius * 0.24,
    centerX - radius * 0.62,
    centerY - radius * 0.46,
  );
  context.closePath();
  context.fill();

  context.fillStyle = '#342823';
  traceKeyholeCutout(context, centerX, centerY, radius * 0.72);
  context.fill();
  context.strokeStyle = '#6f4b29';
  context.lineWidth = 2.4;
  context.stroke();

  context.fillStyle = 'rgba(240, 207, 121, 0.24)';
  traceKeyholeCutout(context, centerX - radius * 0.08, centerY - radius * 0.09, radius * 0.33);
  context.fill();

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const litPetals = Math.ceil(clampedProgress * 10);
  for (let index = 0; index < litPetals; index += 1) {
    const petalProgress = Math.max(0, Math.min(1, clampedProgress * 10 - index));
    const angle = -Math.PI / 2 + index * TAU / 10;
    context.save();
    context.translate(
      centerX + Math.cos(angle) * radius * 1.28,
      centerY + Math.sin(angle) * radius * 1.28,
    );
    context.rotate(angle);
    context.globalAlpha = 0.4 + petalProgress * 0.6;
    context.fillStyle = PALETTE.interactive;
    traceBrassProgressPetal(context, radius * 0.19, index);
    context.fill();
    context.restore();
  }
  context.restore();
}

function traceBrassKeyholePlate(context, x, y, radius, phase) {
  const points = [];
  for (let index = 0; index < 14; index += 1) {
    const angle = index * TAU / 14;
    const wobble = 0.94 + Math.sin(phase * 17 + index * 1.93) * 0.045;
    points.push({
      x: x + Math.cos(angle) * radius * wobble,
      y: y + Math.sin(angle) * radius * 1.08 * (2 - wobble),
    });
  }
  traceSoftLoop(context, points);
}

function traceKeyholeCutout(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x, y - radius * 0.78);
  context.bezierCurveTo(
    x - radius * 0.62,
    y - radius * 0.76,
    x - radius * 0.67,
    y - radius * 0.05,
    x - radius * 0.22,
    y + radius * 0.08,
  );
  context.quadraticCurveTo(x - radius * 0.33, y + radius * 0.55, x - radius * 0.39, y + radius);
  context.quadraticCurveTo(x, y + radius * 0.88, x + radius * 0.39, y + radius);
  context.quadraticCurveTo(x + radius * 0.33, y + radius * 0.55, x + radius * 0.22, y + radius * 0.08);
  context.bezierCurveTo(
    x + radius * 0.67,
    y - radius * 0.05,
    x + radius * 0.62,
    y - radius * 0.76,
    x,
    y - radius * 0.78,
  );
  context.closePath();
}

function traceBrassProgressPetal(context, size, index) {
  const lean = index % 2 === 0 ? 1 : -1;
  context.beginPath();
  context.moveTo(-size * 0.7, 0);
  context.quadraticCurveTo(-size * 0.1, -size * (0.55 + lean * 0.08), size * 0.78, 0);
  context.quadraticCurveTo(-size * 0.05, size * (0.48 - lean * 0.06), -size * 0.7, 0);
  context.closePath();
}

function traceSoftLoop(context, points) {
  const first = {
    x: (points.at(-1).x + points[0].x) / 2,
    y: (points.at(-1).y + points[0].y) / 2,
  };
  context.beginPath();
  context.moveTo(first.x, first.y);
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
  else if (normalized === 'name') drawNameIcon(context, color, secondary);
  else if (normalized === 'heart') drawHeartIcon(context, color);
  else if (normalized === 'rose') drawRoseIcon(context, color, secondary);
  else if (normalized === 'circle') drawOrbIcon(context, color, secondary);
  else drawStarIcon(context, color, secondary);
  context.restore();
}

export function drawLeatherBookmark(context, rect, { active = false } = {}) {
  const phase = active ? 0.41 : 0.17;
  context.save();

  context.fillStyle = 'rgba(42, 26, 25, 0.4)';
  traceLeatherBookmark(context, {
    ...rect,
    x: rect.x + 5,
    y: rect.y + 7,
  }, phase + 0.23);
  context.fill();

  context.fillStyle = active ? '#593846' : '#60432f';
  traceLeatherBookmark(context, rect, phase);
  context.fill();
  context.strokeStyle = '#382820';
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = active ? '#765064' : '#805c3d';
  traceBookmarkUpperHide(context, rect, phase);
  context.fill();
  context.fillStyle = active ? '#432d39' : '#493326';
  traceBookmarkFold(context, rect, phase);
  context.fill();

  context.strokeStyle = active ? BRASS_LIGHT : '#c59a59';
  context.lineWidth = active ? 3.2 : 2.2;
  traceLeatherBookmark(context, {
    x: rect.x + 5,
    y: rect.y + 5,
    width: rect.width - 10,
    height: rect.height - 10,
  }, phase + 0.09);
  context.stroke();

  drawBookmarkStitches(context, rect, active);
  context.restore();
}

function traceLeatherBookmark(context, rect, phase) {
  const wobble = (index) => Math.sin(phase * 31 + index * 1.89) * 2.2;
  const notch = Math.min(rect.width * 0.09, rect.height * 0.25);
  context.beginPath();
  context.moveTo(rect.x + 13, rect.y + wobble(0));
  context.quadraticCurveTo(
    rect.x + rect.width * 0.33,
    rect.y + wobble(1),
    rect.x + rect.width * 0.63,
    rect.y + wobble(2),
  );
  context.quadraticCurveTo(
    rect.x + rect.width - 12,
    rect.y + wobble(3),
    rect.x + rect.width + wobble(4),
    rect.y + rect.height * 0.28,
  );
  context.quadraticCurveTo(
    rect.x + rect.width + wobble(5),
    rect.y + rect.height * 0.73,
    rect.x + rect.width - notch,
    rect.y + rect.height + wobble(6),
  );
  context.quadraticCurveTo(
    rect.x + rect.width - notch * 1.34,
    rect.y + rect.height - notch * 0.18,
    rect.x + rect.width - notch * 1.75,
    rect.y + rect.height - notch * 0.5,
  );
  context.quadraticCurveTo(
    rect.x + rect.width * 0.56,
    rect.y + rect.height + wobble(7),
    rect.x + rect.width * 0.28,
    rect.y + rect.height + wobble(8),
  );
  context.quadraticCurveTo(
    rect.x + wobble(9),
    rect.y + rect.height + wobble(10),
    rect.x + wobble(11),
    rect.y + rect.height * 0.54,
  );
  context.quadraticCurveTo(
    rect.x + wobble(12),
    rect.y + rect.height * 0.12,
    rect.x + 13,
    rect.y + wobble(0),
  );
  context.closePath();
}

function traceBookmarkUpperHide(context, rect, phase) {
  const drift = Math.sin(phase * 23) * 2;
  context.beginPath();
  context.moveTo(rect.x + 8, rect.y + 7);
  context.quadraticCurveTo(
    rect.x + rect.width * 0.37,
    rect.y - 2 + drift,
    rect.x + rect.width * 0.72,
    rect.y + 5 - drift,
  );
  context.quadraticCurveTo(
    rect.x + rect.width * 0.92,
    rect.y + 8,
    rect.x + rect.width * 0.91,
    rect.y + rect.height * 0.33,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.66,
    rect.y + rect.height * 0.24,
    rect.x + rect.width * 0.38,
    rect.y + rect.height * 0.39,
    rect.x + 8,
    rect.y + rect.height * 0.29,
  );
  context.closePath();
}

function traceBookmarkFold(context, rect, phase) {
  const drift = Math.cos(phase * 19) * 2;
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.05, rect.y + rect.height * 0.73);
  context.bezierCurveTo(
    rect.x + rect.width * 0.31,
    rect.y + rect.height * 0.65 + drift,
    rect.x + rect.width * 0.56,
    rect.y + rect.height * 0.86 - drift,
    rect.x + rect.width * 0.87,
    rect.y + rect.height * 0.69,
  );
  context.quadraticCurveTo(
    rect.x + rect.width * 0.88,
    rect.y + rect.height * 0.8,
    rect.x + rect.width * 0.82,
    rect.y + rect.height * 0.87,
  );
  context.quadraticCurveTo(
    rect.x + rect.width * 0.48,
    rect.y + rect.height * 0.93,
    rect.x + rect.width * 0.06,
    rect.y + rect.height * 0.89,
  );
  context.closePath();
}

function drawBookmarkStitches(context, rect, active) {
  context.save();
  context.strokeStyle = active ? '#e0bc76' : '#d2ad70';
  context.lineWidth = 1.8;
  context.lineCap = 'round';
  for (let index = 0; index < 9; index += 1) {
    const x = rect.x + 19 + index * (rect.width - 48) / 8;
    const y = rect.y + 13 + (index % 3 - 1) * 1.2;
    context.beginPath();
    context.moveTo(x - 4, y);
    context.quadraticCurveTo(x, y - 1.5, x + 4, y + 0.5);
    context.stroke();
  }
  for (let index = 0; index < 8; index += 1) {
    const x = rect.x + 19 + index * (rect.width - 62) / 7;
    const y = rect.y + rect.height - 14 + (index % 2 ? 1 : -1);
    context.beginPath();
    context.moveTo(x - 3.5, y);
    context.quadraticCurveTo(x, y + 1.5, x + 3.5, y);
    context.stroke();
  }
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

function drawPaperFlourish(context, x, y, direction) {
  context.save();
  context.strokeStyle = 'rgba(105,72,43,0.46)';
  context.lineWidth = 2.4;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x, y + 18);
  context.bezierCurveTo(x + direction * 32, y + 15, x + direction * 30, y - 16, x + direction * 5, y - 9);
  context.bezierCurveTo(x - direction * 11, y - 4, x - direction * 11, y + 10, x, y + 11);
  context.stroke();
  context.fillStyle = 'rgba(211,172,105,0.3)';
  context.beginPath();
  context.moveTo(x + direction * 13, y + 8);
  context.bezierCurveTo(
    x + direction * 28,
    y - 4,
    x + direction * 33,
    y + 4,
    x + direction * 18,
    y + 12,
  );
  context.bezierCurveTo(
    x + direction * 13,
    y + 14,
    x + direction * 10,
    y + 12,
    x + direction * 13,
    y + 8,
  );
  context.closePath();
  context.fill();
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
