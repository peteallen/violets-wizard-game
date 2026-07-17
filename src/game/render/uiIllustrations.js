import { PALETTE } from '../config.js';
import { STORYBOOK_INK, STORYBOOK_LINE_WEIGHT } from './storybookInk.js';
import { traceRoundedRect } from './uiPrimitives.js';

const TAU = Math.PI * 2;
const INK = STORYBOOK_INK.deep;
const OUTLINE = STORYBOOK_INK.primary;
const BRASS = '#c89d45';
const BRASS_LIGHT = '#f4d58d';
const BRASS_DARK = '#76522c';
const LEATHER = '#6d452d';
const LEATHER_DARK = '#3f2b23';
const HUD_CONTACT_SHADOW_SOFT = 'rgba(27, 18, 28, 0.17)';
const HUD_CONTACT_SHADOW_CORE = 'rgba(27, 18, 28, 0.34)';
const HUD_GLASS_LIGHT = 'rgba(222, 241, 239, 0.34)';
const PAINTED_HUD_ARTBOARD_SIZE = 512;
const PAINTED_COMPASS_BASE_CENTER = Object.freeze({ x: 254.5, y: 290.5 });
const PAINTED_COMPASS_NEEDLE_BOSS = Object.freeze({ x: 255.4, y: 307 });
const PAINTED_COMPASS_NEEDLE_SCALE = 0.54;
const COMPASS_NEEDLE_ANGLE = -0.12;
const WAND_HOLSTER_ANGLE = -0.57;
const PAINTED_WAND_PROTRUSION = 0.16;
const ICON_CREAM = '#f7e7c2';
const ICON_LIGHT = '#ffe3a0';
const ICON_MID = '#b98448';
const ICON_SHADOW = '#684936';
const PAPER_GRAIN = Object.freeze([
  [0.08, 0.23, 0.055, -0.012], [0.15, 0.71, 0.072, 0.016], [0.23, 0.42, 0.044, -0.018],
  [0.31, 0.82, 0.061, 0.011], [0.38, 0.18, 0.052, 0.014], [0.46, 0.58, 0.067, -0.013],
  [0.54, 0.29, 0.046, 0.018], [0.61, 0.76, 0.058, -0.012], [0.69, 0.47, 0.073, 0.015],
  [0.77, 0.16, 0.049, -0.014], [0.84, 0.66, 0.064, 0.012], [0.91, 0.35, 0.052, -0.017],
]);
const KEYHOLE_PROGRESS_MARKS = Object.freeze([
  [-0.11, 0.43, -0.08, 0.92], [-0.3, 0.35, -0.42, 1.04], [-0.42, 0.19, -0.78, 0.9],
  [-0.44, -0.03, -1.03, 1.05], [-0.36, -0.25, -1.22, 0.94], [-0.19, -0.41, -1.43, 1.01],
  [0.04, -0.46, -1.66, 0.91], [0.25, -0.38, -1.9, 1.08], [0.39, -0.21, -2.14, 0.93],
  [0.44, 0.02, -2.31, 1.05], [0.36, 0.25, -2.55, 0.96], [0.2, 0.39, -2.82, 1.03],
]);
const WAX_EDGE_PROFILE = Object.freeze([
  [1.02, -0.022], [0.93, 0.018], [1.05, -0.014], [0.9, 0.026],
  [1.01, -0.019], [0.95, 0.012], [1.07, -0.027], [0.92, 0.021],
  [1.03, -0.011], [0.91, 0.025], [1.06, -0.018], [0.94, 0.014],
  [1, -0.024], [0.9, 0.019], [1.04, -0.013],
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
  const size = Math.min(rect.width, rect.height);
  const plateWidth = size * 0.64;
  const plateHeight = size * 0.79;
  const clampedProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(1, progress))
    : 0;
  context.save();

  context.fillStyle = 'rgba(42, 27, 25, 0.42)';
  traceBrassEscutcheon(
    context,
    centerX + size * 0.045,
    centerY + size * 0.058,
    plateWidth * 1.08,
    plateHeight * 1.04,
    0.73,
  );
  context.fill();

  context.fillStyle = BRASS_DARK;
  traceBrassEscutcheon(context, centerX, centerY, plateWidth, plateHeight, 0.18);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = Math.max(3, size * 0.044);
  context.stroke();

  context.fillStyle = BRASS;
  traceBrassEscutcheon(
    context,
    centerX - size * 0.012,
    centerY - size * 0.016,
    plateWidth * 0.84,
    plateHeight * 0.86,
    0.61,
  );
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = Math.max(1.8, size * 0.024);
  context.stroke();

  context.fillStyle = '#e2b95f';
  traceEscutcheonUpperLight(context, centerX, centerY, plateWidth, plateHeight);
  context.fill();

  context.fillStyle = '#9b7136';
  traceEscutcheonLowerShade(context, centerX, centerY, plateWidth, plateHeight);
  context.fill();

  drawEscutcheonHammerMarks(context, centerX, centerY, size);
  drawEscutcheonOwlEngraving(context, centerX, centerY, size);

  context.save();
  context.globalAlpha = clampedProgress * 0.36;
  context.fillStyle = PALETTE.interactive;
  traceKeyholeWarmth(context, centerX, centerY + size * 0.012, size * 0.35);
  context.fill();
  context.restore();

  context.fillStyle = '#6b482b';
  traceKeyholeCutout(context, centerX, centerY + size * 0.015, size * 0.34);
  context.fill();
  context.strokeStyle = '#4a3225';
  context.lineWidth = Math.max(2, size * 0.027);
  context.stroke();

  context.fillStyle = '#2f2724';
  traceKeyholeCutout(context, centerX + size * 0.005, centerY + size * 0.018, size * 0.275);
  context.fill();

  context.fillStyle = '#f2d382';
  traceKeyholeReflectedEdge(context, centerX, centerY, size);
  context.fill();

  drawBrassHoldProgress(context, centerX, centerY, size, clampedProgress);
  context.restore();
}

function traceBrassEscutcheon(context, x, y, width, height, variant) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const lean = (variant - 0.5) * halfWidth * 0.08;
  context.beginPath();
  context.moveTo(x - halfWidth * 0.09 + lean, y - halfHeight * 0.98);
  context.bezierCurveTo(
    x + halfWidth * 0.14,
    y - halfHeight * 1.04,
    x + halfWidth * 0.34 + lean,
    y - halfHeight * 0.9,
    x + halfWidth * 0.28,
    y - halfHeight * 0.72,
  );
  context.bezierCurveTo(
    x + halfWidth * 0.62,
    y - halfHeight * 0.72,
    x + halfWidth * 0.94,
    y - halfHeight * 0.49,
    x + halfWidth * 0.86,
    y - halfHeight * 0.24,
  );
  context.bezierCurveTo(
    x + halfWidth * 1.04,
    y - halfHeight * 0.02,
    x + halfWidth * 0.88,
    y + halfHeight * 0.18,
    x + halfWidth * 0.66,
    y + halfHeight * 0.28,
  );
  context.bezierCurveTo(
    x + halfWidth * 0.72,
    y + halfHeight * 0.54,
    x + halfWidth * 0.42,
    y + halfHeight * 0.81,
    x + halfWidth * 0.11,
    y + halfHeight * 0.95,
  );
  context.bezierCurveTo(
    x - halfWidth * 0.05,
    y + halfHeight * 1.02,
    x - halfWidth * 0.18 - lean,
    y + halfHeight * 0.98,
    x - halfWidth * 0.26,
    y + halfHeight * 0.87,
  );
  context.bezierCurveTo(
    x - halfWidth * 0.57,
    y + halfHeight * 0.75,
    x - halfWidth * 0.79,
    y + halfHeight * 0.51,
    x - halfWidth * 0.64,
    y + halfHeight * 0.27,
  );
  context.bezierCurveTo(
    x - halfWidth * 0.91,
    y + halfHeight * 0.15,
    x - halfWidth * 1.02,
    y - halfHeight * 0.06,
    x - halfWidth * 0.8,
    y - halfHeight * 0.25,
  );
  context.bezierCurveTo(
    x - halfWidth * 0.88,
    y - halfHeight * 0.49,
    x - halfWidth * 0.54,
    y - halfHeight * 0.7,
    x - halfWidth * 0.27,
    y - halfHeight * 0.69,
  );
  context.bezierCurveTo(
    x - halfWidth * 0.35,
    y - halfHeight * 0.88,
    x - halfWidth * 0.24,
    y - halfHeight * 0.98,
    x - halfWidth * 0.09 + lean,
    y - halfHeight * 0.98,
  );
  context.closePath();
}

function traceEscutcheonUpperLight(context, x, y, width, height) {
  context.beginPath();
  context.moveTo(x - width * 0.29, y - height * 0.25);
  context.bezierCurveTo(
    x - width * 0.17,
    y - height * 0.4,
    x + width * 0.1,
    y - height * 0.42,
    x + width * 0.27,
    y - height * 0.25,
  );
  context.bezierCurveTo(
    x + width * 0.08,
    y - height * 0.3,
    x - width * 0.09,
    y - height * 0.22,
    x - width * 0.29,
    y - height * 0.25,
  );
  context.closePath();
}

function traceEscutcheonLowerShade(context, x, y, width, height) {
  context.beginPath();
  context.moveTo(x - width * 0.27, y + height * 0.18);
  context.bezierCurveTo(
    x - width * 0.06,
    y + height * 0.25,
    x + width * 0.18,
    y + height * 0.14,
    x + width * 0.29,
    y + height * 0.08,
  );
  context.bezierCurveTo(
    x + width * 0.23,
    y + height * 0.32,
    x + width * 0.07,
    y + height * 0.41,
    x - width * 0.09,
    y + height * 0.43,
  );
  context.bezierCurveTo(
    x - width * 0.16,
    y + height * 0.36,
    x - width * 0.22,
    y + height * 0.25,
    x - width * 0.27,
    y + height * 0.18,
  );
  context.closePath();
}

function drawEscutcheonHammerMarks(context, x, y, size) {
  const marks = [
    [-0.2, -0.2, 0.055, 0.032, -1], [0.22, -0.13, 0.043, 0.029, 1],
    [-0.24, 0.08, 0.048, 0.027, 1], [0.23, 0.17, 0.052, 0.031, -1],
    [-0.08, 0.31, 0.039, 0.025, 1], [0.1, -0.33, 0.045, 0.026, -1],
  ];
  for (let index = 0; index < marks.length; index += 1) {
    const [offsetX, offsetY, width, height, lean] = marks[index];
    context.fillStyle = index % 2 === 0 ? '#80572e' : '#efd083';
    traceHammerMark(
      context,
      x + size * offsetX,
      y + size * offsetY,
      size * width,
      size * height,
      lean,
    );
    context.fill();
  }
}

function traceHammerMark(context, x, y, width, height, lean) {
  context.beginPath();
  context.moveTo(x - width * 0.52, y + height * 0.08 * lean);
  context.bezierCurveTo(
    x - width * 0.24,
    y - height * 0.68,
    x + width * 0.34,
    y - height * 0.47 * lean,
    x + width * 0.51,
    y - height * 0.05,
  );
  context.bezierCurveTo(
    x + width * 0.23,
    y + height * 0.62,
    x - width * 0.36,
    y + height * 0.45 * lean,
    x - width * 0.52,
    y + height * 0.08 * lean,
  );
  context.closePath();
}

function drawEscutcheonOwlEngraving(context, x, y, size) {
  context.strokeStyle = '#79532c';
  context.lineWidth = Math.max(1.1, size * 0.015);
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x - size * 0.215, y - size * 0.105);
  context.bezierCurveTo(
    x - size * 0.155,
    y - size * 0.17,
    x - size * 0.075,
    y - size * 0.16,
    x - size * 0.025,
    y - size * 0.095,
  );
  context.moveTo(x + size * 0.025, y - size * 0.095);
  context.bezierCurveTo(
    x + size * 0.085,
    y - size * 0.165,
    x + size * 0.17,
    y - size * 0.145,
    x + size * 0.21,
    y - size * 0.075,
  );
  context.stroke();

  context.strokeStyle = '#f0ce7e';
  context.lineWidth = Math.max(0.9, size * 0.01);
  context.beginPath();
  context.moveTo(x - size * 0.205, y - size * 0.12);
  context.bezierCurveTo(
    x - size * 0.145,
    y - size * 0.18,
    x - size * 0.078,
    y - size * 0.17,
    x - size * 0.035,
    y - size * 0.11,
  );
  context.moveTo(x + size * 0.035, y - size * 0.11);
  context.bezierCurveTo(
    x + size * 0.09,
    y - size * 0.17,
    x + size * 0.16,
    y - size * 0.15,
    x + size * 0.2,
    y - size * 0.09,
  );
  context.stroke();
}

function traceKeyholeWarmth(context, x, y, size) {
  context.beginPath();
  context.moveTo(x - size * 0.43, y - size * 0.13);
  context.bezierCurveTo(
    x - size * 0.47,
    y - size * 0.52,
    x + size * 0.02,
    y - size * 0.67,
    x + size * 0.38,
    y - size * 0.26,
  );
  context.bezierCurveTo(
    x + size * 0.55,
    y + size * 0.08,
    x + size * 0.28,
    y + size * 0.58,
    x - size * 0.12,
    y + size * 0.51,
  );
  context.bezierCurveTo(
    x - size * 0.37,
    y + size * 0.37,
    x - size * 0.44,
    y + size * 0.1,
    x - size * 0.43,
    y - size * 0.13,
  );
  context.closePath();
}

function traceKeyholeCutout(context, x, y, size) {
  context.beginPath();
  context.moveTo(x - size * 0.025, y - size * 0.29);
  context.bezierCurveTo(
    x - size * 0.18,
    y - size * 0.3,
    x - size * 0.245,
    y - size * 0.16,
    x - size * 0.19,
    y - size * 0.035,
  );
  context.bezierCurveTo(
    x - size * 0.155,
    y + size * 0.035,
    x - size * 0.105,
    y + size * 0.055,
    x - size * 0.09,
    y + size * 0.1,
  );
  context.bezierCurveTo(
    x - size * 0.11,
    y + size * 0.19,
    x - size * 0.155,
    y + size * 0.31,
    x - size * 0.17,
    y + size * 0.39,
  );
  context.quadraticCurveTo(x, y + size * 0.44, x + size * 0.16, y + size * 0.38);
  context.bezierCurveTo(
    x + size * 0.14,
    y + size * 0.29,
    x + size * 0.095,
    y + size * 0.18,
    x + size * 0.085,
    y + size * 0.1,
  );
  context.bezierCurveTo(
    x + size * 0.105,
    y + size * 0.055,
    x + size * 0.16,
    y + size * 0.025,
    x + size * 0.19,
    y - size * 0.045,
  );
  context.bezierCurveTo(
    x + size * 0.25,
    y - size * 0.18,
    x + size * 0.14,
    y - size * 0.3,
    x - size * 0.025,
    y - size * 0.29,
  );
  context.closePath();
}

function traceKeyholeReflectedEdge(context, x, y, size) {
  context.beginPath();
  context.moveTo(x - size * 0.07, y - size * 0.083);
  context.bezierCurveTo(
    x - size * 0.048,
    y - size * 0.13,
    x - size * 0.016,
    y - size * 0.145,
    x + size * 0.008,
    y - size * 0.143,
  );
  context.bezierCurveTo(
    x - size * 0.032,
    y - size * 0.115,
    x - size * 0.042,
    y - size * 0.078,
    x - size * 0.052,
    y - size * 0.035,
  );
  context.bezierCurveTo(
    x - size * 0.073,
    y - size * 0.045,
    x - size * 0.078,
    y - size * 0.061,
    x - size * 0.07,
    y - size * 0.083,
  );
  context.closePath();
}

function drawBrassHoldProgress(context, x, y, size, progress) {
  for (let index = 0; index < KEYHOLE_PROGRESS_MARKS.length; index += 1) {
    const [offsetX, offsetY, rotation, scale] = KEYHOLE_PROGRESS_MARKS[index];
    context.save();
    context.translate(x + size * offsetX, y + size * offsetY);
    context.rotate(rotation);
    context.fillStyle = '#604027';
    traceBrassProgressLeaf(context, size * 0.063 * scale, index);
    context.fill();
    context.strokeStyle = '#3f2d23';
    context.lineWidth = Math.max(1.1, size * 0.014);
    context.stroke();
    context.restore();
  }

  const progressAcrossMarks = progress * KEYHOLE_PROGRESS_MARKS.length;
  const litMarks = Math.ceil(progressAcrossMarks);
  for (let index = 0; index < litMarks; index += 1) {
    const [offsetX, offsetY, rotation, scale] = KEYHOLE_PROGRESS_MARKS[index];
    const markProgress = Math.max(0, Math.min(1, progressAcrossMarks - index));
    context.save();
    context.translate(x + size * offsetX, y + size * offsetY);
    context.rotate(rotation);
    context.globalAlpha = 0.28 + markProgress * 0.72;
    context.fillStyle = PALETTE.interactive;
    traceBrassProgressLeaf(context, size * 0.052 * scale, index);
    context.fill();
    context.strokeStyle = BRASS_LIGHT;
    context.lineWidth = Math.max(0.85, size * 0.01);
    context.stroke();
    context.restore();
  }
}

function traceBrassProgressLeaf(context, size, index) {
  const lean = index % 2 === 0 ? 1 : -1;
  context.beginPath();
  context.moveTo(-size * 0.72, size * 0.04 * lean);
  context.quadraticCurveTo(-size * 0.08, -size * (0.53 + lean * 0.07), size * 0.79, 0);
  context.quadraticCurveTo(-size * 0.03, size * (0.46 - lean * 0.05), -size * 0.72, size * 0.04 * lean);
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

function traceOrganicWaxSeal(context, x, y, radius, phase = 0) {
  const points = WAX_EDGE_PROFILE.map(([radiusScale, angleDrift], index) => {
    const angle = -Math.PI / 2
      + (index * TAU) / WAX_EDGE_PROFILE.length
      + angleDrift
      + Math.sin(phase + index * 1.37) * 0.009;
    const softenedRipple = Math.sin(phase * 2.3 + index * 1.91) * 0.014;
    return {
      x: x + Math.cos(angle) * radius * (radiusScale + softenedRipple),
      y: y + Math.sin(angle) * radius * (radiusScale - softenedRipple * 0.38),
    };
  });
  traceSoftLoop(context, points);
}

function traceWaxSealShade(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x + radius * 0.76, y - radius * 0.22);
  context.bezierCurveTo(
    x + radius * 0.9,
    y + radius * 0.17,
    x + radius * 0.58,
    y + radius * 0.76,
    x + radius * 0.08,
    y + radius * 0.86,
  );
  context.bezierCurveTo(
    x + radius * 0.31,
    y + radius * 0.54,
    x + radius * 0.42,
    y + radius * 0.08,
    x + radius * 0.76,
    y - radius * 0.22,
  );
  context.closePath();
}

function traceWaxSealLight(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.73, y - radius * 0.08);
  context.bezierCurveTo(
    x - radius * 0.58,
    y - radius * 0.65,
    x + radius * 0.04,
    y - radius * 0.82,
    x + radius * 0.42,
    y - radius * 0.5,
  );
  context.bezierCurveTo(
    x + radius * 0.04,
    y - radius * 0.54,
    x - radius * 0.38,
    y - radius * 0.23,
    x - radius * 0.73,
    y - radius * 0.08,
  );
  context.closePath();
}

export function drawWaxIcon(context, x, y, radius, icon, {
  danger = false,
  selected = false,
  iconColor = '#fff8e8',
} = {}) {
  context.save();
  context.fillStyle = 'rgba(40, 24, 30, 0.38)';
  traceOrganicWaxSeal(context, x + radius * 0.09, y + radius * 0.12, radius, 0.71);
  context.fill();

  context.fillStyle = danger ? '#642a35' : selected ? '#5e365d' : '#4d2430';
  traceOrganicWaxSeal(context, x, y, radius, 0.23);
  context.fill();

  context.save();
  traceOrganicWaxSeal(context, x, y, radius, 0.23);
  context.clip();
  context.fillStyle = danger
    ? 'rgba(66, 20, 31, 0.5)'
    : selected ? 'rgba(54, 29, 50, 0.48)' : 'rgba(48, 20, 29, 0.5)';
  traceWaxSealShade(context, x, y, radius);
  context.fill();
  context.fillStyle = danger
    ? 'rgba(234, 158, 163, 0.28)'
    : selected ? 'rgba(229, 174, 213, 0.24)' : 'rgba(239, 181, 148, 0.25)';
  traceWaxSealLight(context, x, y, radius);
  context.fill();
  context.restore();

  context.strokeStyle = danger ? '#d1848f' : selected ? '#d3a0c5' : BRASS_LIGHT;
  context.lineWidth = Math.max(2, radius * 0.09);
  traceOrganicWaxSeal(context, x, y, radius, 0.23);
  context.stroke();
  context.strokeStyle = danger
    ? 'rgba(239, 176, 176, 0.34)'
    : selected ? 'rgba(239, 194, 225, 0.32)' : 'rgba(244, 209, 141, 0.34)';
  context.lineWidth = Math.max(1.1, radius * 0.04);
  traceOrganicWaxSeal(context, x, y, radius * 0.77, 1.03);
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
  else if (normalized === 'biscuit' || normalized === 'name') drawBiscuitIcon(context, color, secondary);
  else if (normalized === 'pip') drawPipIcon(context, color, secondary);
  else if (normalized === 'heart') drawHeartIcon(context, color);
  else if (normalized === 'rose') drawRoseIcon(context, color, secondary);
  else if (normalized === 'circle') drawOrbIcon(context, color, secondary);
  else if (normalized === 'beans') drawBeansIcon(context, color, secondary);
  else if (normalized === 'chocolate-frog') drawToadIcon(context, color, secondary);
  else if (normalized === 'cauldron-cake') drawCauldronCakeIcon(context, color, secondary);
  else if (normalized === 'shield-heart') drawShieldHeartIcon(context, color, secondary);
  else if (normalized === 'mystery-map') drawMapIcon(context, color, secondary);
  else if (normalized === 'helping-hand') drawHelpingHandIcon(context, color, secondary);
  else if (normalized === 'step-forward') drawStepForwardIcon(context, color, secondary);
  else if (normalized === 'tell-truth') drawSpeakerIcon(context, color, secondary);
  else if (normalized === 'stay-close') drawStayCloseIcon(context, color, secondary);
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

export function drawLeatherSatchel(context, rect, {
  open = false,
  muted = false,
  image = null,
} = {}) {
  context.save();
  context.globalAlpha = muted ? 0.55 : 1;

  drawHudContactShadow(context, rect, {
    centerY: 0.91,
    radiusX: 0.43,
    radiusY: 0.072,
    phase: 0.68,
  });

  if (!open && isReadyPaintedHudImage(image)) {
    drawPaintedHudArtboard(context, image, rect);
    context.restore();
    return;
  }

  context.fillStyle = LEATHER_DARK;
  traceSatchelHandle(context, rect, 0.21);
  context.fill();
  context.strokeStyle = '#2f211d';
  context.lineWidth = Math.max(2.5, rect.width * 0.032);
  context.stroke();

  context.fillStyle = '#946641';
  traceSatchelHandleLight(context, rect);
  context.fill();

  context.fillStyle = LEATHER;
  traceSatchelBody(context, rect, 0.34);
  context.fill();
  context.strokeStyle = '#39271e';
  context.lineWidth = Math.max(3, rect.width * 0.042);
  context.stroke();

  context.fillStyle = '#583725';
  traceSatchelBodyShade(context, rect);
  context.fill();

  context.fillStyle = '#a16e47';
  traceSatchelUpperLight(context, rect);
  context.fill();

  context.fillStyle = '#7d5134';
  traceSatchelRightGusset(context, rect);
  context.fill();

  if (open) {
    context.fillStyle = '#2d2020';
    traceSatchelMouth(context, rect);
    context.fill();
    context.strokeStyle = '#b47b49';
    context.lineWidth = Math.max(2, rect.width * 0.025);
    context.stroke();
  }

  context.fillStyle = open ? '#9b6c42' : '#805333';
  traceSatchelFlap(context, rect, open);
  context.fill();
  context.strokeStyle = '#3a281f';
  context.lineWidth = Math.max(2.5, rect.width * 0.035);
  context.stroke();

  context.fillStyle = 'rgba(247, 218, 151, 0.29)';
  traceSatchelFlapLight(context, rect, open);
  context.fill();

  context.fillStyle = open ? '#6f472e' : '#68412a';
  traceSatchelLatchStrap(context, rect, open);
  context.fill();
  context.strokeStyle = '#3a281f';
  context.lineWidth = Math.max(1.5, rect.width * 0.018);
  context.stroke();

  context.fillStyle = 'rgba(240, 190, 119, 0.32)';
  traceSatchelLatchStrapLight(context, rect, open);
  context.fill();

  drawSatchelStitches(context, rect, open);
  drawSatchelGrain(context, rect);

  context.fillStyle = '#c99b43';
  traceSatchelClasp(context, rect, open, 0.37);
  context.fill();
  context.strokeStyle = BRASS_DARK;
  context.lineWidth = Math.max(1.8, rect.width * 0.022);
  context.stroke();

  context.fillStyle = '#f6d58a';
  traceSatchelClaspLight(context, rect, open);
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = Math.max(1.2, rect.width * 0.014);
  traceSatchelClasp(context, rect, open, 0.81);
  context.stroke();
  drawSatchelClaspOwl(context, rect, open);
  context.restore();
}

export function drawCompassQuest(context, rect, time = 0, {
  pulse = false,
  baseImage = null,
  needleImage = null,
} = {}) {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.39;
  const breathe = pulse ? 1.025 + Math.sin(time * 3.5) * 0.025 : 1;
  context.save();
  drawHudContactShadow(context, rect, {
    centerY: 0.89,
    radiusX: 0.4,
    radiusY: 0.065,
    phase: 0.36,
  });
  context.translate(x, y);
  context.scale(breathe, breathe);

  if (
    isReadyPaintedHudImage(baseImage)
    && isReadyPaintedHudImage(needleImage)
  ) {
    const artboardSize = Math.min(rect.width, rect.height);
    context.drawImage(
      baseImage,
      -(PAINTED_COMPASS_BASE_CENTER.x / PAINTED_HUD_ARTBOARD_SIZE) * artboardSize,
      -(PAINTED_COMPASS_BASE_CENTER.y / PAINTED_HUD_ARTBOARD_SIZE) * artboardSize,
      artboardSize,
      artboardSize,
    );
    const needleSize = artboardSize * PAINTED_COMPASS_NEEDLE_SCALE;
    context.save();
    context.rotate(COMPASS_NEEDLE_ANGLE);
    context.drawImage(
      needleImage,
      -(PAINTED_COMPASS_NEEDLE_BOSS.x / PAINTED_HUD_ARTBOARD_SIZE) * needleSize,
      -(PAINTED_COMPASS_NEEDLE_BOSS.y / PAINTED_HUD_ARTBOARD_SIZE) * needleSize,
      needleSize,
      needleSize,
    );
    context.restore();
    context.restore();
    return;
  }

  context.fillStyle = BRASS_DARK;
  traceCompassBail(context, radius);
  context.fill();
  context.strokeStyle = '#49331f';
  context.lineWidth = 2.2;
  context.stroke();
  context.fillStyle = '#32251e';
  traceCompassBailOpening(context, radius);
  context.fill();

  context.fillStyle = BRASS_DARK;
  traceCompassCase(context, 0, 0, radius, 0.19);
  context.fill();
  context.strokeStyle = '#49331f';
  context.lineWidth = STORYBOOK_LINE_WEIGHT.emphasis;
  context.stroke();

  context.fillStyle = BRASS;
  traceCompassCase(context, -1.5, -1.7, radius * 0.9, 0.58);
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 3.3;
  context.stroke();

  context.fillStyle = '#f7d992';
  traceCompassRimGleam(context, radius);
  context.fill();

  context.fillStyle = '#f3e6ca';
  traceCompassFace(context, radius - 9);
  context.fill();
  context.strokeStyle = '#7b5c37';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = 'rgba(255, 248, 218, 0.58)';
  traceCompassFaceLight(context, radius);
  context.fill();
  context.fillStyle = 'rgba(110, 72, 42, 0.16)';
  traceCompassFaceShade(context, radius);
  context.fill();

  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    context.strokeStyle = index % 2 === 0 ? BRASS_DARK : '#ae8e60';
    context.lineWidth = index % 2 === 0 ? 3 : 2;
    const inner = radius - (index % 2 === 0 ? 21 : 18);
    const outer = radius - 13;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.quadraticCurveTo(
      Math.cos(angle + 0.018 * (index % 2 ? 1 : -1)) * ((inner + outer) / 2),
      Math.sin(angle + 0.018 * (index % 2 ? 1 : -1)) * ((inner + outer) / 2),
      Math.cos(angle) * outer,
      Math.sin(angle) * outer,
    );
    context.stroke();
  }

  context.save();
  context.rotate(COMPASS_NEEDLE_ANGLE);
  context.fillStyle = '#a86f36';
  traceCompassSouthNeedle(context, radius);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = STORYBOOK_LINE_WEIGHT.contour;
  context.stroke();

  context.fillStyle = '#70416e';
  traceCompassNorthNeedle(context, radius);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = STORYBOOK_LINE_WEIGHT.contour;
  context.stroke();

  context.fillStyle = '#b987b0';
  traceCompassNeedleLight(context, radius);
  context.fill();

  context.fillStyle = PALETTE.interactive;
  traceCompassBoss(context, radius * 0.13);
  context.fill();
  context.strokeStyle = BRASS_DARK;
  context.lineWidth = 1.6;
  context.stroke();
  context.restore();

  context.fillStyle = HUD_GLASS_LIGHT;
  traceCompassGlassReflection(context, radius);
  context.fill();
  context.strokeStyle = 'rgba(246, 255, 244, 0.62)';
  context.lineWidth = 1.4;
  traceCompassGlassEdge(context, radius);
  context.stroke();
  context.restore();
}

export function drawBrassWandHolster(context, rect, {
  enabled = true,
  time = 0,
  holsterImage = null,
  wandImage = null,
} = {}) {
  const { x, y, width, height } = rect;
  const size = Math.min(width, height);
  context.save();
  context.globalAlpha = enabled ? 1 : 0.62;
  drawHudContactShadow(context, rect, {
    centerY: 0.89,
    radiusX: 0.41,
    radiusY: 0.068,
    phase: 0.83,
  });
  context.translate(x + width / 2, y + height / 2);

  if (
    isReadyPaintedHudImage(holsterImage)
    && isReadyPaintedHudImage(wandImage)
  ) {
    if (enabled) {
      context.save();
      context.rotate(WAND_HOLSTER_ANGLE);
      context.translate(0, -size * PAINTED_WAND_PROTRUSION);
      context.drawImage(wandImage, -width / 2, -height / 2, width, height);
      context.restore();
    }
    context.drawImage(holsterImage, -width / 2, -height / 2, width, height);
    context.save();
    context.rotate(WAND_HOLSTER_ANGLE);
    if (enabled) drawWandSparkEffect(context, size, time, PAINTED_WAND_PROTRUSION);
    else {
      context.strokeStyle = '#a5977f';
      context.lineWidth = Math.max(1.8, size * 0.022);
      traceEmptyHolsterMark(context, size);
      context.stroke();
    }
    context.restore();
    context.restore();
    return;
  }

  context.fillStyle = BRASS_DARK;
  traceHolsterBackplate(context, 0, 0, width * 0.42, height * 0.43, 0.16);
  context.fill();
  context.strokeStyle = '#46321f';
  context.lineWidth = 3.8;
  context.stroke();

  context.fillStyle = enabled ? '#b9893f' : '#716453';
  traceHolsterBackplate(context, -1.4, -1.8, width * 0.35, height * 0.36, 0.53);
  context.fill();
  context.strokeStyle = enabled ? BRASS_LIGHT : '#a89a82';
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = enabled ? 'rgba(255, 225, 157, 0.38)' : 'rgba(219, 207, 181, 0.2)';
  traceHolsterPlateLight(context, width, height);
  context.fill();

  context.fillStyle = enabled ? 'rgba(79, 48, 31, 0.24)' : 'rgba(52, 48, 45, 0.28)';
  traceHolsterPlateShade(context, width, height);
  context.fill();

  context.rotate(WAND_HOLSTER_ANGLE);

  if (enabled) {
    context.fillStyle = '#3c2822';
    traceHolsteredWand(context, size, 2.5, 3);
    context.fill();

    context.fillStyle = '#a96f47';
    traceHolsteredWand(context, size);
    context.fill();
    context.strokeStyle = '#4a3027';
    context.lineWidth = Math.max(1.8, size * 0.022);
    context.stroke();

    context.fillStyle = '#e0b07b';
    traceWandWoodLight(context, size);
    context.fill();
    drawWandCarving(context, size);
  }

  context.fillStyle = '#30221f';
  traceWandSheath(context, size, 3, 4);
  context.fill();

  context.fillStyle = enabled ? '#4b3025' : '#433b35';
  traceWandSheath(context, size, 0, 0);
  context.fill();
  context.strokeStyle = enabled ? '#aa7942' : '#817462';
  context.lineWidth = Math.max(2.5, size * 0.035);
  context.stroke();

  context.fillStyle = enabled ? '#7f5334' : '#574f47';
  traceWandSheathLight(context, size);
  context.fill();

  context.fillStyle = enabled ? '#3a2721' : '#393532';
  traceWandSheathShade(context, size);
  context.fill();

  context.fillStyle = '#281d1c';
  traceWandSheathMouth(context, size);
  context.fill();
  context.strokeStyle = enabled ? '#c39457' : '#776c5e';
  context.lineWidth = Math.max(1.5, size * 0.02);
  context.stroke();

  drawWandSheathStitches(context, size, enabled);

  context.fillStyle = enabled ? '#d0a450' : '#766c5f';
  traceWandSheathBand(context, size);
  context.fill();
  context.strokeStyle = enabled ? '#6f4b2a' : '#4e4841';
  context.lineWidth = Math.max(1.2, size * 0.016);
  context.stroke();

  context.fillStyle = enabled ? '#f4d58d' : '#a89a82';
  traceWandSheathBandLight(context, size);
  context.fill();

  if (enabled) drawWandSparkEffect(context, size, time);
  else {
    context.strokeStyle = '#a5977f';
    context.lineWidth = Math.max(1.8, size * 0.022);
    traceEmptyHolsterMark(context, size);
    context.stroke();
  }
  context.restore();
}

function isReadyPaintedHudImage(image) {
  return Boolean(
    image?.complete
    && image.naturalWidth > 0
    && image.naturalHeight > 0
  );
}

function drawPaintedHudArtboard(context, image, rect) {
  const size = Math.min(rect.width, rect.height);
  context.drawImage(
    image,
    rect.x + (rect.width - size) / 2,
    rect.y + (rect.height - size) / 2,
    size,
    size,
  );
}

function drawWandSparkEffect(context, size, time, protrusion = 0) {
  const glow = size * (0.062 + (Math.sin(time * 3.1) + 1) * 0.009);
  context.fillStyle = PALETTE.interactive;
  traceWandSpark(context, 0, -size * (0.455 + protrusion), glow, time * 0.17);
  context.fill();
  context.fillStyle = '#fff1b8';
  traceWandSpark(
    context,
    -size * 0.012,
    -size * (0.465 + protrusion),
    glow * 0.48,
    0.63,
  );
  context.fill();
}

function drawHudContactShadow(context, rect, {
  centerY = 0.9,
  radiusX = 0.4,
  radiusY = 0.07,
  phase = 0.5,
} = {}) {
  const centerX = rect.x + rect.width * 0.5;
  const shadowY = rect.y + rect.height * centerY;
  const width = rect.width * radiusX;
  const height = rect.height * radiusY;

  context.fillStyle = HUD_CONTACT_SHADOW_SOFT;
  traceHudContactShadow(context, centerX + rect.width * 0.012, shadowY, width, height, phase);
  context.fill();

  context.fillStyle = HUD_CONTACT_SHADOW_CORE;
  traceHudContactShadow(
    context,
    centerX - rect.width * 0.018,
    shadowY - rect.height * 0.005,
    width * 0.73,
    height * 0.56,
    phase + 0.37,
  );
  context.fill();
}

function traceHudContactShadow(context, x, y, radiusX, radiusY, phase) {
  const drift = Math.sin(phase * 17) * radiusY * 0.24;
  context.beginPath();
  context.moveTo(x - radiusX, y + drift * 0.15);
  context.bezierCurveTo(
    x - radiusX * 0.66,
    y - radiusY * 0.94,
    x + radiusX * 0.35,
    y - radiusY * 0.82 + drift,
    x + radiusX * 0.98,
    y - drift * 0.1,
  );
  context.bezierCurveTo(
    x + radiusX * 0.62,
    y + radiusY * 0.88,
    x - radiusX * 0.45,
    y + radiusY * 0.76 - drift,
    x - radiusX,
    y + drift * 0.15,
  );
  context.closePath();
}

function traceSatchelHandle(context, rect, phase) {
  const { x, y, width, height } = rect;
  const drift = Math.sin(phase * 13) * width * 0.008;
  context.beginPath();
  context.moveTo(x + width * 0.2, y + height * 0.36);
  context.bezierCurveTo(
    x + width * 0.19,
    y + height * 0.12,
    x + width * 0.34 + drift,
    y + height * 0.045,
    x + width * 0.49,
    y + height * 0.05,
  );
  context.bezierCurveTo(
    x + width * 0.68 - drift,
    y + height * 0.035,
    x + width * 0.82,
    y + height * 0.15,
    x + width * 0.8,
    y + height * 0.37,
  );
  context.bezierCurveTo(
    x + width * 0.75,
    y + height * 0.39,
    x + width * 0.7,
    y + height * 0.36,
    x + width * 0.7,
    y + height * 0.33,
  );
  context.bezierCurveTo(
    x + width * 0.7,
    y + height * 0.2,
    x + width * 0.61,
    y + height * 0.15,
    x + width * 0.49,
    y + height * 0.16,
  );
  context.bezierCurveTo(
    x + width * 0.37,
    y + height * 0.15,
    x + width * 0.29,
    y + height * 0.22,
    x + width * 0.3,
    y + height * 0.34,
  );
  context.bezierCurveTo(
    x + width * 0.29,
    y + height * 0.38,
    x + width * 0.24,
    y + height * 0.39,
    x + width * 0.2,
    y + height * 0.36,
  );
  context.closePath();
}

function traceSatchelHandleLight(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + width * 0.23, y + height * 0.28);
  context.bezierCurveTo(
    x + width * 0.25,
    y + height * 0.1,
    x + width * 0.43,
    y + height * 0.075,
    x + width * 0.52,
    y + height * 0.085,
  );
  context.bezierCurveTo(
    x + width * 0.43,
    y + height * 0.105,
    x + width * 0.31,
    y + height * 0.15,
    x + width * 0.28,
    y + height * 0.29,
  );
  context.bezierCurveTo(
    x + width * 0.27,
    y + height * 0.31,
    x + width * 0.24,
    y + height * 0.31,
    x + width * 0.23,
    y + height * 0.28,
  );
  context.closePath();
}

function traceSatchelBody(context, rect, phase) {
  const { x, y, width, height } = rect;
  const drift = Math.sin(phase * 17) * width * 0.009;
  context.beginPath();
  context.moveTo(x + width * 0.1, y + height * 0.34);
  context.bezierCurveTo(
    x + width * 0.28,
    y + height * 0.28 + drift,
    x + width * 0.68,
    y + height * 0.3 - drift,
    x + width * 0.9,
    y + height * 0.35,
  );
  context.bezierCurveTo(
    x + width * 0.95,
    y + height * 0.52,
    x + width * 0.93,
    y + height * 0.78,
    x + width * 0.85,
    y + height * 0.91,
  );
  context.bezierCurveTo(
    x + width * 0.65,
    y + height * 0.96,
    x + width * 0.31,
    y + height * 0.95,
    x + width * 0.13,
    y + height * 0.89,
  );
  context.bezierCurveTo(
    x + width * 0.06,
    y + height * 0.73,
    x + width * 0.055,
    y + height * 0.48,
    x + width * 0.1,
    y + height * 0.34,
  );
  context.closePath();
}

function traceSatchelUpperLight(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + width * 0.12, y + height * 0.38);
  context.bezierCurveTo(
    x + width * 0.29,
    y + height * 0.31,
    x + width * 0.55,
    y + height * 0.32,
    x + width * 0.62,
    y + height * 0.4,
  );
  context.bezierCurveTo(
    x + width * 0.48,
    y + height * 0.46,
    x + width * 0.27,
    y + height * 0.49,
    x + width * 0.12,
    y + height * 0.44,
  );
  context.bezierCurveTo(
    x + width * 0.1,
    y + height * 0.42,
    x + width * 0.1,
    y + height * 0.4,
    x + width * 0.12,
    y + height * 0.38,
  );
  context.closePath();
}

function traceSatchelBodyShade(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + width * 0.11, y + height * 0.58);
  context.bezierCurveTo(
    x + width * 0.24,
    y + height * 0.72,
    x + width * 0.55,
    y + height * 0.82,
    x + width * 0.87,
    y + height * 0.7,
  );
  context.bezierCurveTo(
    x + width * 0.87,
    y + height * 0.79,
    x + width * 0.82,
    y + height * 0.88,
    x + width * 0.72,
    y + height * 0.92,
  );
  context.bezierCurveTo(
    x + width * 0.51,
    y + height * 0.96,
    x + width * 0.28,
    y + height * 0.94,
    x + width * 0.13,
    y + height * 0.88,
  );
  context.bezierCurveTo(
    x + width * 0.09,
    y + height * 0.78,
    x + width * 0.08,
    y + height * 0.67,
    x + width * 0.11,
    y + height * 0.58,
  );
  context.closePath();
}

function traceSatchelRightGusset(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + width * 0.76, y + height * 0.43);
  context.bezierCurveTo(
    x + width * 0.87,
    y + height * 0.43,
    x + width * 0.92,
    y + height * 0.54,
    x + width * 0.9,
    y + height * 0.66,
  );
  context.bezierCurveTo(
    x + width * 0.9,
    y + height * 0.77,
    x + width * 0.86,
    y + height * 0.84,
    x + width * 0.8,
    y + height * 0.88,
  );
  context.bezierCurveTo(
    x + width * 0.82,
    y + height * 0.69,
    x + width * 0.8,
    y + height * 0.54,
    x + width * 0.76,
    y + height * 0.43,
  );
  context.closePath();
}

function traceSatchelMouth(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + width * 0.14, y + height * 0.39);
  context.bezierCurveTo(
    x + width * 0.33,
    y + height * 0.3,
    x + width * 0.69,
    y + height * 0.31,
    x + width * 0.87,
    y + height * 0.4,
  );
  context.bezierCurveTo(
    x + width * 0.69,
    y + height * 0.52,
    x + width * 0.32,
    y + height * 0.51,
    x + width * 0.14,
    y + height * 0.39,
  );
  context.closePath();
}

function traceSatchelFlap(context, rect, open) {
  const { x, y, width, height } = rect;
  context.beginPath();
  if (open) {
    context.moveTo(x + width * 0.15, y + height * 0.36);
    context.bezierCurveTo(
      x + width * 0.19,
      y + height * 0.18,
      x + width * 0.37,
      y + height * 0.11,
      x + width * 0.51,
      y + height * 0.12,
    );
    context.bezierCurveTo(
      x + width * 0.67,
      y + height * 0.11,
      x + width * 0.84,
      y + height * 0.2,
      x + width * 0.87,
      y + height * 0.37,
    );
    context.bezierCurveTo(
      x + width * 0.68,
      y + height * 0.31,
      x + width * 0.34,
      y + height * 0.3,
      x + width * 0.15,
      y + height * 0.36,
    );
  } else {
    context.moveTo(x + width * 0.1, y + height * 0.37);
    context.bezierCurveTo(
      x + width * 0.3,
      y + height * 0.3,
      x + width * 0.7,
      y + height * 0.3,
      x + width * 0.9,
      y + height * 0.36,
    );
    context.bezierCurveTo(
      x + width * 0.83,
      y + height * 0.55,
      x + width * 0.68,
      y + height * 0.68,
      x + width * 0.5,
      y + height * 0.73,
    );
    context.bezierCurveTo(
      x + width * 0.31,
      y + height * 0.68,
      x + width * 0.17,
      y + height * 0.55,
      x + width * 0.1,
      y + height * 0.37,
    );
  }
  context.closePath();
}

function traceSatchelFlapLight(context, rect, open) {
  const { x, y, width, height } = rect;
  const top = open ? 0.18 : 0.37;
  const bottom = open ? 0.27 : 0.51;
  context.beginPath();
  context.moveTo(x + width * 0.16, y + height * top);
  context.bezierCurveTo(
    x + width * 0.3,
    y + height * (top - 0.06),
    x + width * 0.53,
    y + height * (top - 0.045),
    x + width * 0.61,
    y + height * (top + 0.015),
  );
  context.bezierCurveTo(
    x + width * 0.48,
    y + height * bottom,
    x + width * 0.28,
    y + height * bottom,
    x + width * 0.16,
    y + height * top,
  );
  context.closePath();
}

function traceSatchelLatchStrap(context, rect, open) {
  const { x, y, width, height } = rect;
  const top = open ? 0.17 : 0.42;
  const bottom = open ? 0.31 : 0.7;
  context.beginPath();
  context.moveTo(x + width * 0.455, y + height * top);
  context.bezierCurveTo(
    x + width * 0.475,
    y + height * (top - 0.012),
    x + width * 0.535,
    y + height * (top - 0.008),
    x + width * 0.552,
    y + height * (top + 0.008),
  );
  context.bezierCurveTo(
    x + width * 0.56,
    y + height * (top + (bottom - top) * 0.45),
    x + width * 0.548,
    y + height * (bottom - 0.018),
    x + width * 0.522,
    y + height * bottom,
  );
  context.bezierCurveTo(
    x + width * 0.49,
    y + height * (bottom + 0.012),
    x + width * 0.46,
    y + height * (bottom - 0.002),
    x + width * 0.446,
    y + height * (bottom - 0.025),
  );
  context.bezierCurveTo(
    x + width * 0.438,
    y + height * (top + (bottom - top) * 0.52),
    x + width * 0.444,
    y + height * (top + 0.035),
    x + width * 0.455,
    y + height * top,
  );
  context.closePath();
}

function traceSatchelLatchStrapLight(context, rect, open) {
  const { x, y, width, height } = rect;
  const top = open ? 0.19 : 0.44;
  const bottom = open ? 0.27 : 0.61;
  context.beginPath();
  context.moveTo(x + width * 0.468, y + height * top);
  context.bezierCurveTo(
    x + width * 0.482,
    y + height * (top - 0.008),
    x + width * 0.508,
    y + height * (top - 0.004),
    x + width * 0.518,
    y + height * (top + 0.008),
  );
  context.bezierCurveTo(
    x + width * 0.517,
    y + height * (top + (bottom - top) * 0.5),
    x + width * 0.506,
    y + height * (bottom - 0.006),
    x + width * 0.492,
    y + height * bottom,
  );
  context.bezierCurveTo(
    x + width * 0.475,
    y + height * (bottom - 0.025),
    x + width * 0.468,
    y + height * (top + 0.05),
    x + width * 0.468,
    y + height * top,
  );
  context.closePath();
}

function drawSatchelStitches(context, rect, open) {
  const { x, y, width, height } = rect;
  context.save();
  context.strokeStyle = '#dfb878';
  context.lineWidth = Math.max(1.2, width * 0.016);
  context.lineCap = 'round';
  for (let index = 0; index < 8; index += 1) {
    const t = index / 7;
    const stitchX = x + width * (0.2 + t * 0.6);
    const stitchY = open
      ? y + height * (0.315 - Math.sin(t * Math.PI) * 0.035)
      : y + height * (0.62 + Math.sin(t * Math.PI) * 0.07);
    context.beginPath();
    context.moveTo(stitchX - width * 0.025, stitchY);
    context.quadraticCurveTo(
      stitchX,
      stitchY + (index % 2 ? 1 : -1) * height * 0.008,
      stitchX + width * 0.025,
      stitchY,
    );
    context.stroke();
  }
  context.restore();
}

function drawSatchelGrain(context, rect) {
  const { x, y, width, height } = rect;
  context.save();
  context.strokeStyle = 'rgba(49, 31, 25, 0.28)';
  context.lineWidth = Math.max(1, width * 0.012);
  context.lineCap = 'round';
  const marks = [
    [0.19, 0.79, 0.35, 0.76],
    [0.58, 0.83, 0.77, 0.8],
    [0.25, 0.88, 0.45, 0.89],
  ];
  for (const [startX, startY, endX, endY] of marks) {
    context.beginPath();
    context.moveTo(x + width * startX, y + height * startY);
    context.bezierCurveTo(
      x + width * ((startX * 2 + endX) / 3),
      y + height * (startY - 0.015),
      x + width * ((startX + endX * 2) / 3),
      y + height * (endY + 0.012),
      x + width * endX,
      y + height * endY,
    );
    context.stroke();
  }
  context.restore();
}

function claspCenter(rect, open) {
  return {
    x: rect.x + rect.width * 0.5,
    y: rect.y + rect.height * (open ? 0.225 : 0.61),
  };
}

function traceSatchelClasp(context, rect, open, phase) {
  const center = claspCenter(rect, open);
  const radiusX = rect.width * 0.105;
  const radiusY = rect.height * 0.102;
  const drift = Math.sin(phase * 19) * rect.width * 0.006;
  context.beginPath();
  context.moveTo(center.x - drift, center.y - radiusY);
  context.bezierCurveTo(
    center.x + radiusX * 0.72,
    center.y - radiusY * 1.08,
    center.x + radiusX * 1.04,
    center.y - radiusY * 0.35,
    center.x + radiusX,
    center.y + radiusY * 0.08,
  );
  context.bezierCurveTo(
    center.x + radiusX * 0.9,
    center.y + radiusY * 0.82,
    center.x + radiusX * 0.27,
    center.y + radiusY,
    center.x - drift,
    center.y + radiusY * 0.93,
  );
  context.bezierCurveTo(
    center.x - radiusX * 0.79,
    center.y + radiusY,
    center.x - radiusX * 1.02,
    center.y + radiusY * 0.35,
    center.x - radiusX,
    center.y - radiusY * 0.04,
  );
  context.bezierCurveTo(
    center.x - radiusX * 0.94,
    center.y - radiusY * 0.7,
    center.x - radiusX * 0.34,
    center.y - radiusY,
    center.x - drift,
    center.y - radiusY,
  );
  context.closePath();
}

function traceSatchelClaspLight(context, rect, open) {
  const center = claspCenter(rect, open);
  context.beginPath();
  context.moveTo(center.x - rect.width * 0.055, center.y - rect.height * 0.035);
  context.bezierCurveTo(
    center.x - rect.width * 0.035,
    center.y - rect.height * 0.075,
    center.x + rect.width * 0.035,
    center.y - rect.height * 0.07,
    center.x + rect.width * 0.045,
    center.y - rect.height * 0.035,
  );
  context.bezierCurveTo(
    center.x + rect.width * 0.015,
    center.y - rect.height * 0.012,
    center.x - rect.width * 0.025,
    center.y,
    center.x - rect.width * 0.055,
    center.y - rect.height * 0.035,
  );
  context.closePath();
}

function drawSatchelClaspOwl(context, rect, open) {
  const center = claspCenter(rect, open);
  const eyeWidth = rect.width * 0.026;
  const eyeHeight = rect.height * 0.024;
  context.save();
  context.fillStyle = '#4d2430';
  for (const side of [-1, 1]) {
    const eyeX = center.x + side * rect.width * 0.032;
    const eyeY = center.y - rect.height * 0.014;
    context.beginPath();
    context.moveTo(eyeX - eyeWidth, eyeY);
    context.bezierCurveTo(
      eyeX - eyeWidth * 0.45,
      eyeY - eyeHeight,
      eyeX + eyeWidth * 0.5,
      eyeY - eyeHeight * 0.86,
      eyeX + eyeWidth,
      eyeY,
    );
    context.bezierCurveTo(
      eyeX + eyeWidth * 0.42,
      eyeY + eyeHeight,
      eyeX - eyeWidth * 0.5,
      eyeY + eyeHeight * 0.86,
      eyeX - eyeWidth,
      eyeY,
    );
    context.closePath();
    context.fill();
  }

  context.strokeStyle = '#4d2430';
  context.lineWidth = Math.max(1.2, rect.width * 0.014);
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(center.x - rect.width * 0.071, center.y - rect.height * 0.043);
  context.bezierCurveTo(
    center.x - rect.width * 0.04,
    center.y - rect.height * 0.065,
    center.x - rect.width * 0.013,
    center.y - rect.height * 0.052,
    center.x,
    center.y - rect.height * 0.029,
  );
  context.bezierCurveTo(
    center.x + rect.width * 0.016,
    center.y - rect.height * 0.052,
    center.x + rect.width * 0.045,
    center.y - rect.height * 0.063,
    center.x + rect.width * 0.071,
    center.y - rect.height * 0.039,
  );
  context.stroke();

  context.fillStyle = '#4d2430';
  context.beginPath();
  context.moveTo(center.x, center.y + rect.height * 0.005);
  context.bezierCurveTo(
    center.x + rect.width * 0.018,
    center.y + rect.height * 0.008,
    center.x + rect.width * 0.011,
    center.y + rect.height * 0.034,
    center.x,
    center.y + rect.height * 0.041,
  );
  context.bezierCurveTo(
    center.x - rect.width * 0.011,
    center.y + rect.height * 0.034,
    center.x - rect.width * 0.018,
    center.y + rect.height * 0.008,
    center.x,
    center.y + rect.height * 0.005,
  );
  context.closePath();
  context.fill();
  context.restore();
}

function traceCompassCase(context, x, y, radius, phase) {
  const drift = Math.sin(phase * 23) * radius * 0.025;
  context.beginPath();
  context.moveTo(x - radius * 0.08, y - radius * 1.01);
  context.bezierCurveTo(
    x + radius * 0.52 + drift,
    y - radius * 1.03,
    x + radius * 1.01,
    y - radius * 0.56,
    x + radius * 0.99,
    y - radius * 0.03,
  );
  context.bezierCurveTo(
    x + radius * 1.02,
    y + radius * 0.5,
    x + radius * 0.54 - drift,
    y + radius * 1.02,
    x - radius * 0.04,
    y + radius * 0.99,
  );
  context.bezierCurveTo(
    x - radius * 0.58,
    y + radius * 1.01,
    x - radius * 1.03,
    y + radius * 0.53,
    x - radius,
    y - radius * 0.07,
  );
  context.bezierCurveTo(
    x - radius * 0.99,
    y - radius * 0.58,
    x - radius * 0.56 - drift,
    y - radius * 0.99,
    x - radius * 0.08,
    y - radius * 1.01,
  );
  context.closePath();
}

function traceCompassBail(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.24, -radius * 0.87);
  context.bezierCurveTo(
    -radius * 0.3,
    -radius * 1.08,
    -radius * 0.18,
    -radius * 1.18,
    radius * 0.02,
    -radius * 1.2,
  );
  context.bezierCurveTo(
    radius * 0.22,
    -radius * 1.18,
    radius * 0.31,
    -radius * 1.07,
    radius * 0.24,
    -radius * 0.87,
  );
  context.bezierCurveTo(
    radius * 0.15,
    -radius * 0.91,
    radius * 0.08,
    -radius * 0.94,
    -radius * 0.02,
    -radius * 0.93,
  );
  context.bezierCurveTo(
    -radius * 0.1,
    -radius * 0.95,
    -radius * 0.18,
    -radius * 0.92,
    -radius * 0.24,
    -radius * 0.87,
  );
  context.closePath();
}

function traceCompassBailOpening(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.12, -radius * 1.06);
  context.bezierCurveTo(
    -radius * 0.09,
    -radius * 1.12,
    radius * 0.1,
    -radius * 1.13,
    radius * 0.13,
    -radius * 1.06,
  );
  context.bezierCurveTo(
    radius * 0.1,
    -radius * 0.99,
    -radius * 0.08,
    -radius * 0.98,
    -radius * 0.12,
    -radius * 1.06,
  );
  context.closePath();
}

function traceCompassRimGleam(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.78, -radius * 0.46);
  context.bezierCurveTo(
    -radius * 0.62,
    -radius * 0.78,
    -radius * 0.25,
    -radius * 0.95,
    radius * 0.08,
    -radius * 0.88,
  );
  context.bezierCurveTo(
    -radius * 0.18,
    -radius * 0.76,
    -radius * 0.47,
    -radius * 0.6,
    -radius * 0.68,
    -radius * 0.34,
  );
  context.bezierCurveTo(
    -radius * 0.75,
    -radius * 0.31,
    -radius * 0.83,
    -radius * 0.37,
    -radius * 0.78,
    -radius * 0.46,
  );
  context.closePath();
}

function traceCompassFace(context, radius) {
  traceCompassCase(context, 0, 0, radius, 0.83);
}

function traceCompassFaceLight(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.64, -radius * 0.38);
  context.bezierCurveTo(
    -radius * 0.43,
    -radius * 0.82,
    radius * 0.26,
    -radius * 0.87,
    radius * 0.5,
    -radius * 0.5,
  );
  context.bezierCurveTo(
    radius * 0.1,
    -radius * 0.43,
    -radius * 0.3,
    -radius * 0.18,
    -radius * 0.64,
    -radius * 0.38,
  );
  context.closePath();
}

function traceCompassFaceShade(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.72, radius * 0.42);
  context.bezierCurveTo(
    -radius * 0.22,
    radius * 0.57,
    radius * 0.38,
    radius * 0.48,
    radius * 0.76,
    radius * 0.23,
  );
  context.bezierCurveTo(
    radius * 0.51,
    radius * 0.78,
    -radius * 0.25,
    radius * 0.86,
    -radius * 0.72,
    radius * 0.42,
  );
  context.closePath();
}

function traceCompassGlassReflection(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.58, -radius * 0.52);
  context.bezierCurveTo(
    -radius * 0.34,
    -radius * 0.72,
    radius * 0.13,
    -radius * 0.71,
    radius * 0.41,
    -radius * 0.46,
  );
  context.bezierCurveTo(
    radius * 0.15,
    -radius * 0.44,
    -radius * 0.18,
    -radius * 0.29,
    -radius * 0.43,
    -radius * 0.08,
  );
  context.bezierCurveTo(
    -radius * 0.52,
    -radius * 0.19,
    -radius * 0.62,
    -radius * 0.36,
    -radius * 0.58,
    -radius * 0.52,
  );
  context.closePath();
}

function traceCompassGlassEdge(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.55, -radius * 0.62);
  context.bezierCurveTo(
    -radius * 0.28,
    -radius * 0.84,
    radius * 0.21,
    -radius * 0.82,
    radius * 0.51,
    -radius * 0.57,
  );
}

function traceCompassNorthNeedle(context, radius) {
  context.beginPath();
  context.moveTo(0, -radius + 10);
  context.bezierCurveTo(
    radius * 0.04,
    -radius * 0.72,
    radius * 0.095,
    -radius * 0.23,
    radius * 0.075,
    -radius * 0.055,
  );
  context.bezierCurveTo(radius * 0.045, radius * 0.02, radius * 0.025, radius * 0.08, 0, radius * 0.14);
  context.bezierCurveTo(-radius * 0.03, radius * 0.07, -radius * 0.055, 0, -radius * 0.078, -radius * 0.055);
  context.bezierCurveTo(
    -radius * 0.09,
    -radius * 0.25,
    -radius * 0.045,
    -radius * 0.75,
    0,
    -radius + 10,
  );
  context.closePath();
}

function traceCompassSouthNeedle(context, radius) {
  context.beginPath();
  context.moveTo(0, radius - 12);
  context.bezierCurveTo(
    radius * 0.04,
    radius * 0.68,
    radius * 0.085,
    radius * 0.22,
    radius * 0.072,
    radius * 0.05,
  );
  context.bezierCurveTo(radius * 0.04, -radius * 0.02, radius * 0.025, -radius * 0.08, 0, -radius * 0.14);
  context.bezierCurveTo(-radius * 0.03, -radius * 0.07, -radius * 0.055, 0, -radius * 0.075, radius * 0.05);
  context.bezierCurveTo(
    -radius * 0.082,
    radius * 0.24,
    -radius * 0.042,
    radius * 0.72,
    0,
    radius - 12,
  );
  context.closePath();
}

function traceCompassNeedleLight(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.014, -radius * 0.75);
  context.bezierCurveTo(
    radius * 0.02,
    -radius * 0.51,
    radius * 0.032,
    -radius * 0.29,
    radius * 0.027,
    -radius * 0.15,
  );
  context.bezierCurveTo(radius * 0.015, -radius * 0.11, -radius * 0.015, -radius * 0.1, -radius * 0.02, -radius * 0.14);
  context.bezierCurveTo(
    -radius * 0.024,
    -radius * 0.34,
    -radius * 0.022,
    -radius * 0.57,
    -radius * 0.014,
    -radius * 0.75,
  );
  context.closePath();
}

function traceCompassBoss(context, radius) {
  traceCompassCase(context, 0, 0, radius, 0.46);
}

function traceHolsterBackplate(context, x, y, radiusX, radiusY, phase) {
  const drift = Math.sin(phase * 29) * radiusX * 0.03;
  context.beginPath();
  context.moveTo(x - radiusX * 0.07, y - radiusY);
  context.bezierCurveTo(
    x + radiusX * 0.54 + drift,
    y - radiusY * 1.02,
    x + radiusX * 0.99,
    y - radiusY * 0.54,
    x + radiusX * 0.96,
    y - radiusY * 0.02,
  );
  context.bezierCurveTo(
    x + radiusX * 0.95,
    y + radiusY * 0.46,
    x + radiusX * 0.47 - drift,
    y + radiusY * 1.02,
    x - radiusX * 0.04,
    y + radiusY * 0.98,
  );
  context.bezierCurveTo(
    x - radiusX * 0.58,
    y + radiusY,
    x - radiusX,
    y + radiusY * 0.52,
    x - radiusX * 0.97,
    y - radiusY * 0.07,
  );
  context.bezierCurveTo(
    x - radiusX * 0.96,
    y - radiusY * 0.59,
    x - radiusX * 0.53 - drift,
    y - radiusY * 1.01,
    x - radiusX * 0.07,
    y - radiusY,
  );
  context.closePath();
}

function traceHolsterPlateLight(context, width, height) {
  context.beginPath();
  context.moveTo(-width * 0.27, -height * 0.2);
  context.bezierCurveTo(
    -width * 0.16,
    -height * 0.36,
    width * 0.1,
    -height * 0.35,
    width * 0.2,
    -height * 0.23,
  );
  context.bezierCurveTo(
    width * 0.05,
    -height * 0.18,
    -width * 0.13,
    -height * 0.08,
    -width * 0.27,
    -height * 0.2,
  );
  context.closePath();
}

function traceHolsterPlateShade(context, width, height) {
  context.beginPath();
  context.moveTo(-width * 0.24, height * 0.2);
  context.bezierCurveTo(
    -width * 0.05,
    height * 0.28,
    width * 0.2,
    height * 0.21,
    width * 0.3,
    height * 0.08,
  );
  context.bezierCurveTo(
    width * 0.2,
    height * 0.35,
    -width * 0.08,
    height * 0.37,
    -width * 0.24,
    height * 0.2,
  );
  context.closePath();
}

function traceWandSheath(context, size, offsetX = 0, offsetY = 0) {
  context.beginPath();
  context.moveTo(offsetX - size * 0.12, offsetY - size * 0.255);
  context.bezierCurveTo(
    offsetX - size * 0.07,
    offsetY - size * 0.305,
    offsetX + size * 0.075,
    offsetY - size * 0.3,
    offsetX + size * 0.12,
    offsetY - size * 0.25,
  );
  context.bezierCurveTo(
    offsetX + size * 0.115,
    offsetY - size * 0.04,
    offsetX + size * 0.095,
    offsetY + size * 0.22,
    offsetX + size * 0.045,
    offsetY + size * 0.37,
  );
  context.bezierCurveTo(
    offsetX + size * 0.015,
    offsetY + size * 0.405,
    offsetX - size * 0.02,
    offsetY + size * 0.405,
    offsetX - size * 0.05,
    offsetY + size * 0.37,
  );
  context.bezierCurveTo(
    offsetX - size * 0.1,
    offsetY + size * 0.16,
    offsetX - size * 0.12,
    offsetY - size * 0.09,
    offsetX - size * 0.115,
    offsetY - size * 0.29,
  );
  context.closePath();
}

function traceWandSheathLight(context, size) {
  context.beginPath();
  context.moveTo(-size * 0.078, -size * 0.22);
  context.bezierCurveTo(
    -size * 0.03,
    -size * 0.255,
    size * 0.015,
    -size * 0.245,
    size * 0.035,
    -size * 0.205,
  );
  context.bezierCurveTo(
    -size * 0.005,
    -size * 0.05,
    -size * 0.01,
    size * 0.13,
    -size * 0.025,
    size * 0.22,
  );
  context.bezierCurveTo(
    -size * 0.055,
    size * 0.08,
    -size * 0.07,
    -size * 0.12,
    -size * 0.075,
    -size * 0.22,
  );
  context.closePath();
}

function traceWandSheathShade(context, size) {
  context.beginPath();
  context.moveTo(size * 0.036, -size * 0.19);
  context.bezierCurveTo(
    size * 0.092,
    -size * 0.12,
    size * 0.105,
    size * 0.12,
    size * 0.055,
    size * 0.34,
  );
  context.bezierCurveTo(
    size * 0.035,
    size * 0.39,
    size * 0.002,
    size * 0.405,
    -size * 0.018,
    size * 0.37,
  );
  context.bezierCurveTo(
    size * 0.012,
    size * 0.18,
    size * 0.025,
    -size * 0.07,
    size * 0.036,
    -size * 0.19,
  );
  context.closePath();
}

function traceWandSheathMouth(context, size) {
  context.beginPath();
  context.moveTo(-size * 0.118, -size * 0.255);
  context.bezierCurveTo(
    -size * 0.07,
    -size * 0.305,
    size * 0.075,
    -size * 0.3,
    size * 0.118,
    -size * 0.25,
  );
  context.bezierCurveTo(
    size * 0.07,
    -size * 0.208,
    -size * 0.065,
    -size * 0.212,
    -size * 0.112,
    -size * 0.255,
  );
  context.closePath();
}

function drawWandSheathStitches(context, size, enabled) {
  context.save();
  context.strokeStyle = enabled ? '#d3a56b' : '#918574';
  context.lineWidth = Math.max(1.1, size * 0.014);
  context.lineCap = 'round';
  for (let index = 0; index < 6; index += 1) {
    const y = -size * 0.14 + index * size * 0.085;
    context.beginPath();
    context.moveTo(-size * 0.09, y);
    context.quadraticCurveTo(
      -size * 0.075,
      y + (index % 2 ? size * 0.006 : -size * 0.006),
      -size * 0.055,
      y,
    );
    context.stroke();
  }
  context.restore();
}

function traceWandSheathBand(context, size) {
  context.beginPath();
  context.moveTo(-size * 0.118, -size * 0.205);
  context.bezierCurveTo(
    -size * 0.055,
    -size * 0.226,
    size * 0.06,
    -size * 0.221,
    size * 0.118,
    -size * 0.198,
  );
  context.bezierCurveTo(
    size * 0.12,
    -size * 0.163,
    size * 0.107,
    -size * 0.133,
    size * 0.091,
    -size * 0.116,
  );
  context.bezierCurveTo(
    size * 0.035,
    -size * 0.137,
    -size * 0.059,
    -size * 0.14,
    -size * 0.105,
    -size * 0.12,
  );
  context.bezierCurveTo(
    -size * 0.119,
    -size * 0.142,
    -size * 0.126,
    -size * 0.178,
    -size * 0.118,
    -size * 0.205,
  );
  context.closePath();
}

function traceWandSheathBandLight(context, size) {
  context.beginPath();
  context.moveTo(-size * 0.085, -size * 0.194);
  context.bezierCurveTo(
    -size * 0.036,
    -size * 0.208,
    size * 0.045,
    -size * 0.205,
    size * 0.084,
    -size * 0.189,
  );
  context.bezierCurveTo(
    size * 0.067,
    -size * 0.175,
    -size * 0.049,
    -size * 0.177,
    -size * 0.085,
    -size * 0.194,
  );
  context.closePath();
}

function traceHolsteredWand(context, size, offsetX = 0, offsetY = 0) {
  context.beginPath();
  context.moveTo(offsetX - size * 0.04, offsetY + size * 0.26);
  context.bezierCurveTo(
    offsetX - size * 0.048,
    offsetY + size * 0.08,
    offsetX - size * 0.04,
    offsetY - size * 0.24,
    offsetX - size * 0.024,
    offsetY - size * 0.455,
  );
  context.bezierCurveTo(
    offsetX - size * 0.004,
    offsetY - size * 0.477,
    offsetX + size * 0.014,
    offsetY - size * 0.473,
    offsetX + size * 0.026,
    offsetY - size * 0.448,
  );
  context.bezierCurveTo(
    offsetX + size * 0.045,
    offsetY - size * 0.19,
    offsetX + size * 0.048,
    offsetY + size * 0.08,
    offsetX + size * 0.04,
    offsetY + size * 0.27,
  );
  context.bezierCurveTo(
    offsetX + size * 0.018,
    offsetY + size * 0.3,
    offsetX - size * 0.018,
    offsetY + size * 0.3,
    offsetX - size * 0.04,
    offsetY + size * 0.26,
  );
  context.closePath();
}

function traceWandWoodLight(context, size) {
  context.beginPath();
  context.moveTo(-size * 0.018, size * 0.19);
  context.bezierCurveTo(
    -size * 0.02,
    size * 0.01,
    -size * 0.017,
    -size * 0.27,
    -size * 0.006,
    -size * 0.425,
  );
  context.bezierCurveTo(
    size * 0.005,
    -size * 0.36,
    size * 0.008,
    -size * 0.01,
    size * 0.006,
    size * 0.17,
  );
  context.bezierCurveTo(
    size * 0.001,
    size * 0.21,
    -size * 0.012,
    size * 0.22,
    -size * 0.018,
    size * 0.19,
  );
  context.closePath();
}

function drawWandCarving(context, size) {
  context.save();
  context.strokeStyle = '#5b372a';
  context.lineWidth = Math.max(1, size * 0.012);
  context.lineCap = 'round';
  for (let index = 0; index < 3; index += 1) {
    const y = -size * (0.31 + index * 0.052);
    context.beginPath();
    context.moveTo(-size * 0.025, y - size * 0.008);
    context.quadraticCurveTo(
      0,
      y + (index % 2 ? size * 0.008 : -size * 0.005),
      size * 0.025,
      y + size * 0.006,
    );
    context.stroke();
  }
  context.restore();
}

function traceWandSpark(context, x, y, size, phase) {
  const lean = Math.sin(phase * 11) * size * 0.08;
  context.beginPath();
  context.moveTo(x, y - size);
  context.bezierCurveTo(
    x + size * 0.12,
    y - size * 0.35,
    x + size * 0.34,
    y - size * 0.17,
    x + size + lean,
    y,
  );
  context.bezierCurveTo(
    x + size * 0.35,
    y + size * 0.13,
    x + size * 0.17,
    y + size * 0.33,
    x,
    y + size * 0.92,
  );
  context.bezierCurveTo(
    x - size * 0.13,
    y + size * 0.34,
    x - size * 0.34,
    y + size * 0.17,
    x - size + lean,
    y,
  );
  context.bezierCurveTo(
    x - size * 0.34,
    y - size * 0.13,
    x - size * 0.15,
    y - size * 0.35,
    x,
    y - size,
  );
  context.closePath();
}

function traceEmptyHolsterMark(context, size) {
  context.beginPath();
  context.moveTo(-size * 0.036, -size * 0.03);
  context.bezierCurveTo(
    -size * 0.015,
    -size * 0.01,
    size * 0.015,
    size * 0.01,
    size * 0.035,
    size * 0.035,
  );
  context.moveTo(size * 0.035, -size * 0.03);
  context.bezierCurveTo(
    size * 0.012,
    -size * 0.005,
    -size * 0.012,
    size * 0.015,
    -size * 0.035,
    size * 0.04,
  );
}

function normalizeIcon(icon) {
  const value = String(icon ?? '').toLowerCase();
  if (value.includes('every-flavor-beans')) return 'beans';
  if (value.includes('chocolate-frog')) return 'chocolate-frog';
  if (value.includes('cauldron-cake')) return 'cauldron-cake';
  if (value.includes('protect-friends')) return 'shield-heart';
  if (value.includes('explore-mysteries')) return 'mystery-map';
  if (value.includes('help-someone')) return 'helping-hand';
  if (value.includes('step-forward')) return 'step-forward';
  if (value.includes('tell-truth')) return 'tell-truth';
  if (value.includes('stay-close')) return 'stay-close';
  if (value === 'name-biscuit') return 'biscuit';
  if (value === 'name-pip') return 'pip';
  if (value === 'name-custom') return 'quill';
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
  if (value.includes('biscuit')) return 'biscuit';
  if (value === 'pip') return 'pip';
  if (value.includes('name')) return 'name';
  if (value === 'rose' || value.includes('heart')) return 'heart';
  if (value === 'teal' || value === 'circle') return 'circle';
  return value;
}

function traceOrganicOval(context, x, y, radiusX, radiusY, phase = 0) {
  const lean = Math.sin(phase * 7.3 + 0.4) * 0.045;
  const lift = Math.cos(phase * 5.1 + 0.8) * 0.035;
  context.beginPath();
  context.moveTo(x + radiusX * (0.03 + lean), y - radiusY);
  context.bezierCurveTo(
    x + radiusX * 0.61,
    y - radiusY * (1.03 - lift),
    x + radiusX * 1.03,
    y - radiusY * 0.48,
    x + radiusX * (0.97 + lean * 0.25),
    y + radiusY * 0.08,
  );
  context.bezierCurveTo(
    x + radiusX * 0.93,
    y + radiusY * 0.68,
    x + radiusX * 0.43,
    y + radiusY * 1.02,
    x - radiusX * (0.08 - lean),
    y + radiusY * 0.98,
  );
  context.bezierCurveTo(
    x - radiusX * 0.64,
    y + radiusY * 0.94,
    x - radiusX * 1.02,
    y + radiusY * 0.47,
    x - radiusX * (0.96 - lean * 0.2),
    y - radiusY * 0.09,
  );
  context.bezierCurveTo(
    x - radiusX * 0.9,
    y - radiusY * 0.65,
    x - radiusX * 0.45,
    y - radiusY * (0.98 + lift),
    x + radiusX * (0.03 + lean),
    y - radiusY,
  );
  context.closePath();
}

function traceOrganicCard(context, x, y, width, height, phase = 0) {
  const drift = Math.sin(phase * 9.7 + 0.2) * 1.8;
  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  context.beginPath();
  context.moveTo(left + 8, top + drift);
  context.bezierCurveTo(
    x - width * 0.15,
    top - 1.6,
    x + width * 0.19,
    top + 1.4,
    right - 7,
    top + 2 - drift * 0.25,
  );
  context.quadraticCurveTo(right + 1.5, top + 5, right - 0.5, top + 13);
  context.bezierCurveTo(
    right + 1.3,
    y - height * 0.08,
    right - 1.8,
    y + height * 0.23,
    right - 2 + drift * 0.2,
    bottom - 8,
  );
  context.quadraticCurveTo(right - 5, bottom + 1.5, right - 13, bottom - 0.5);
  context.bezierCurveTo(
    x + width * 0.17,
    bottom + 1.4,
    x - width * 0.2,
    bottom - 1.2,
    left + 7,
    bottom - 2 + drift * 0.2,
  );
  context.quadraticCurveTo(left - 1.3, bottom - 5, left + 0.5, bottom - 13);
  context.bezierCurveTo(
    left - 1.5,
    y + height * 0.12,
    left + 1.4,
    y - height * 0.22,
    left + 1.5,
    top + 8,
  );
  context.quadraticCurveTo(left + 4, top + 1, left + 8, top + drift);
  context.closePath();
}

function traceCloseArm(context) {
  context.beginPath();
  context.moveTo(-34, -27);
  context.quadraticCurveTo(-31, -34, -25, -33);
  context.bezierCurveTo(-13, -23, -4, -13, 3, -5);
  context.bezierCurveTo(13, 5, 24, 18, 34, 27);
  context.quadraticCurveTo(35, 33, 28, 35);
  context.bezierCurveTo(18, 27, 7, 14, -2, 5);
  context.bezierCurveTo(-11, -5, -22, -16, -34, -27);
  context.closePath();
}

function traceCheckMark(context, offsetX = 0, offsetY = 0) {
  context.beginPath();
  context.moveTo(-38 + offsetX, -2 + offsetY);
  context.quadraticCurveTo(-34 + offsetX, -10 + offsetY, -27 + offsetX, -6 + offsetY);
  context.bezierCurveTo(
    -20 + offsetX,
    1 + offsetY,
    -14 + offsetX,
    9 + offsetY,
    -8 + offsetX,
    15 + offsetY,
  );
  context.bezierCurveTo(
    2 + offsetX,
    3 + offsetY,
    20 + offsetX,
    -21 + offsetY,
    33 + offsetX,
    -34 + offsetY,
  );
  context.quadraticCurveTo(40 + offsetX, -37 + offsetY, 42 + offsetX, -29 + offsetY);
  context.bezierCurveTo(
    27 + offsetX,
    -12 + offsetY,
    6 + offsetX,
    17 + offsetY,
    -6 + offsetX,
    31 + offsetY,
  );
  context.quadraticCurveTo(-12 + offsetX, 34 + offsetY, -17 + offsetX, 28 + offsetY);
  context.bezierCurveTo(
    -24 + offsetX,
    18 + offsetY,
    -32 + offsetX,
    8 + offsetY,
    -38 + offsetX,
    -2 + offsetY,
  );
  context.closePath();
}

function traceSpeakerBody(context, offsetX = 0, offsetY = 0) {
  context.beginPath();
  context.moveTo(-42 + offsetX, -16 + offsetY);
  context.quadraticCurveTo(-39 + offsetX, -21 + offsetY, -33 + offsetX, -20 + offsetY);
  context.quadraticCurveTo(-25 + offsetX, -18 + offsetY, -18 + offsetX, -20 + offsetY);
  context.bezierCurveTo(
    -10 + offsetX,
    -28 + offsetY,
    -2 + offsetX,
    -36 + offsetY,
    7 + offsetX,
    -41 + offsetY,
  );
  context.quadraticCurveTo(13 + offsetX, -42 + offsetY, 14 + offsetX, -35 + offsetY);
  context.bezierCurveTo(
    12 + offsetX,
    -13 + offsetY,
    15 + offsetX,
    14 + offsetY,
    13 + offsetX,
    36 + offsetY,
  );
  context.quadraticCurveTo(10 + offsetX, 43 + offsetY, 4 + offsetX, 39 + offsetY);
  context.bezierCurveTo(
    -4 + offsetX,
    32 + offsetY,
    -11 + offsetX,
    24 + offsetY,
    -18 + offsetX,
    19 + offsetY,
  );
  context.quadraticCurveTo(-27 + offsetX, 21 + offsetY, -36 + offsetX, 19 + offsetY);
  context.quadraticCurveTo(-42 + offsetX, 18 + offsetY, -42 + offsetX, 12 + offsetY);
  context.quadraticCurveTo(-45 + offsetX, -2 + offsetY, -42 + offsetX, -16 + offsetY);
  context.closePath();
}

function traceSoundRibbon(context, x, halfHeight, width, phase = 0) {
  const drift = Math.sin(phase * 11.3) * 1.4;
  context.beginPath();
  context.moveTo(x, -halfHeight + drift);
  context.bezierCurveTo(
    x + width * 0.72,
    -halfHeight * 0.72,
    x + width,
    -halfHeight * 0.32,
    x + width,
    0,
  );
  context.bezierCurveTo(
    x + width,
    halfHeight * 0.35,
    x + width * 0.72,
    halfHeight * 0.75,
    x,
    halfHeight - drift,
  );
  context.quadraticCurveTo(x - 3.5, halfHeight - 3, x + 1.5, halfHeight - 8);
  context.bezierCurveTo(
    x + width * 0.5,
    halfHeight * 0.58,
    x + width * 0.7,
    halfHeight * 0.25,
    x + width * 0.69,
    0,
  );
  context.bezierCurveTo(
    x + width * 0.68,
    -halfHeight * 0.24,
    x + width * 0.49,
    -halfHeight * 0.58,
    x + 1.5,
    -halfHeight + 8,
  );
  context.quadraticCurveTo(x - 3, -halfHeight + 3, x, -halfHeight + drift);
  context.closePath();
}

function drawOwlIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-36, -26);
  context.quadraticCurveTo(-28, -36, -17, -44);
  context.quadraticCurveTo(-6, -39, 1, -45);
  context.quadraticCurveTo(11, -39, 19, -44);
  context.quadraticCurveTo(31, -36, 36, -25);
  context.bezierCurveTo(43, -6, 40, 20, 26, 37);
  context.bezierCurveTo(10, 49, -10, 48, -28, 35);
  context.bezierCurveTo(-42, 18, -43, -8, -36, -26);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = 'rgba(104, 73, 54, 0.3)';
  context.beginPath();
  context.moveTo(2, 42);
  context.bezierCurveTo(22, 36, 34, 18, 35, -5);
  context.bezierCurveTo(29, 19, 17, 33, 2, 42);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(255, 229, 166, 0.52)';
  context.beginPath();
  context.moveTo(-31, -27);
  context.bezierCurveTo(-24, -36, -13, -39, -3, -41);
  context.bezierCurveTo(-13, -27, -24, -17, -36, -8);
  context.bezierCurveTo(-36, -17, -34, -24, -31, -27);
  context.closePath();
  context.fill();

  for (const [eyeX, phase] of [[-15, 0.17], [15, 0.53]]) {
    context.fillStyle = ICON_CREAM;
    traceOrganicOval(context, eyeX, -12, 13.5, 14, phase);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 3.8;
    context.stroke();
    context.fillStyle = ICON_SHADOW;
    traceOrganicOval(context, eyeX + 0.8, -11, 5.2, 6.5, phase + 0.4);
    context.fill();
    context.fillStyle = ICON_LIGHT;
    traceOrganicOval(context, eyeX - 1.2, -14.2, 1.7, 2.1, phase + 0.8);
    context.fill();
  }

  context.fillStyle = ICON_MID;
  context.beginPath();
  context.moveTo(-7, 4);
  context.quadraticCurveTo(0, 7, 7, 4.5);
  context.quadraticCurveTo(3, 12, -0.5, 15);
  context.quadraticCurveTo(-4, 11, -7, 4);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2.4;
  context.stroke();

  context.strokeStyle = ICON_SHADOW;
  context.lineWidth = 3.3;
  for (const [offsetX, offsetY, bend] of [
    [-17, 21, -2], [-2, 20, 2], [14, 22, -2], [-10, 31, 2], [7, 32, -1],
  ]) {
    context.beginPath();
    context.moveTo(offsetX - 6, offsetY - 1);
    context.quadraticCurveTo(offsetX + bend, offsetY + 7, offsetX + 7, offsetY);
    context.stroke();
  }
}

function drawCatIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-35, -29);
  context.quadraticCurveTo(-34, -43, -28, -49);
  context.quadraticCurveTo(-18, -44, -10, -36);
  context.quadraticCurveTo(0, -41, 11, -36);
  context.quadraticCurveTo(21, -44, 29, -48);
  context.quadraticCurveTo(35, -39, 35, -28);
  context.bezierCurveTo(43, -8, 40, 18, 27, 31);
  context.bezierCurveTo(11, 44, -12, 43, -28, 29);
  context.bezierCurveTo(-41, 15, -43, -10, -35, -29);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = 'rgba(100, 66, 48, 0.28)';
  context.beginPath();
  context.moveTo(2, 38);
  context.bezierCurveTo(22, 34, 35, 16, 36, -9);
  context.bezierCurveTo(28, 20, 16, 32, 2, 38);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(255, 228, 165, 0.48)';
  context.beginPath();
  context.moveTo(-31, -30);
  context.quadraticCurveTo(-27, -40, -24, -42);
  context.quadraticCurveTo(-17, -37, -12, -31);
  context.bezierCurveTo(-20, -26, -27, -18, -34, -8);
  context.quadraticCurveTo(-35, -20, -31, -30);
  context.closePath();
  context.fill();

  for (const [eyeX, phase] of [[-13, 0.1], [13, 0.7]]) {
    context.fillStyle = ICON_LIGHT;
    traceOrganicOval(context, eyeX, -8, 7.5, 10.5, phase);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 2.6;
    context.stroke();
    context.fillStyle = ICON_SHADOW;
    traceOrganicOval(context, eyeX + 0.4, -7, 2.7, 7, phase + 0.3);
    context.fill();
  }

  context.fillStyle = ICON_MID;
  context.beginPath();
  context.moveTo(-5, 8);
  context.quadraticCurveTo(0, 6, 5, 8);
  context.quadraticCurveTo(2, 13, 0, 14);
  context.quadraticCurveTo(-3, 12, -5, 8);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2.2;
  context.stroke();

  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-7, 15);
  context.quadraticCurveTo(0, 21, 7, 15);
  context.stroke();
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * 8, 15);
    context.quadraticCurveTo(side * 27, 9, side * 43, 11);
    context.moveTo(side * 8, 19);
    context.quadraticCurveTo(side * 27, 25, side * 43, 22);
    context.stroke();
  }
}

function drawToadIcon(context, color, secondary) {
  context.fillStyle = secondary;
  traceOrganicOval(context, 0, 15, 42, 29, 0.21);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = 'rgba(91, 65, 45, 0.31)';
  context.beginPath();
  context.moveTo(-2, 40);
  context.bezierCurveTo(20, 38, 36, 28, 41, 11);
  context.bezierCurveTo(31, 27, 16, 35, -2, 40);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(255, 231, 167, 0.5)';
  context.beginPath();
  context.moveTo(-35, 8);
  context.bezierCurveTo(-28, -1, -14, -5, -2, 0);
  context.bezierCurveTo(-15, 5, -25, 12, -35, 19);
  context.quadraticCurveTo(-38, 13, -35, 8);
  context.closePath();
  context.fill();

  for (const [eyeX, phase] of [[-22, 0.31], [22, 0.74]]) {
    context.fillStyle = secondary;
    traceOrganicOval(context, eyeX, -12, 14.5, 15, phase);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = ICON_SHADOW;
    traceOrganicOval(context, eyeX + 0.7, -11, 5, 6, phase + 0.2);
    context.fill();
    context.fillStyle = ICON_LIGHT;
    traceOrganicOval(context, eyeX - 1, -14, 1.6, 2.1, phase + 0.6);
    context.fill();
  }

  context.strokeStyle = color;
  context.lineWidth = 3.5;
  context.beginPath();
  context.moveTo(-13, 22);
  context.quadraticCurveTo(0, 30, 14, 21);
  context.stroke();

  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * 32, 29);
    context.quadraticCurveTo(side * 43, 33, side * 49, 42);
    context.quadraticCurveTo(side * 40, 41, side * 34, 38);
    context.stroke();
  }

  context.fillStyle = ICON_MID;
  for (const [spotX, spotY, radius] of [[-17, 9, 3.2], [12, 7, 2.7], [25, 20, 2.5]]) {
    traceOrganicOval(context, spotX, spotY, radius, radius * 0.78, spotX * 0.04);
    context.fill();
  }
}

function drawWandIcon(context, color, secondary) {
  context.fillStyle = 'rgba(72, 48, 38, 0.34)';
  context.beginPath();
  context.moveTo(-37, 41);
  context.bezierCurveTo(-32, 33, 13, -22, 26, -31);
  context.quadraticCurveTo(31, -31, 32, -25);
  context.bezierCurveTo(19, -12, -24, 38, -32, 44);
  context.quadraticCurveTo(-36, 45, -37, 41);
  context.closePath();
  context.fill();

  context.fillStyle = ICON_MID;
  context.beginPath();
  context.moveTo(-41, 35);
  context.bezierCurveTo(-33, 27, 12, -27, 24, -35);
  context.quadraticCurveTo(29, -34, 30, -29);
  context.bezierCurveTo(17, -16, -26, 33, -36, 39);
  context.quadraticCurveTo(-40, 40, -41, 35);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = 'rgba(255, 229, 165, 0.66)';
  context.beginPath();
  context.moveTo(-33, 30);
  context.bezierCurveTo(-21, 15, 6, -17, 20, -29);
  context.quadraticCurveTo(16, -21, 5, -7, -7, 7);
  context.bezierCurveTo(-18, 19, -27, 28, -33, 30);
  context.closePath();
  context.fill();

  context.fillStyle = ICON_SHADOW;
  context.beginPath();
  context.moveTo(-42, 34);
  context.quadraticCurveTo(-37, 35, -33, 39);
  context.quadraticCurveTo(-36, 45, -42, 42);
  context.quadraticCurveTo(-45, 39, -42, 34);
  context.closePath();
  context.fill();
  drawStarIconAt(context, 32, -35, 15, secondary, color);

  context.fillStyle = ICON_LIGHT;
  for (const [sparkX, sparkY, radius, phase] of [
    [11, -37, 3.4, 0.2], [39, -13, 4.1, 0.6], [47, -37, 2.8, 0.9],
  ]) {
    traceOrganicOval(context, sparkX, sparkY, radius, radius * 0.72, phase);
    context.fill();
  }
}

function drawEyesIcon(context, color, secondary) {
  for (const [eyeX, phase] of [[-22, 0.15], [22, 0.61]]) {
    context.fillStyle = 'rgba(86, 58, 43, 0.3)';
    traceOrganicOval(context, eyeX + 2, 4, 20, 28, phase + 0.2);
    context.fill();
    context.fillStyle = secondary;
    traceOrganicOval(context, eyeX, 0, 19, 27, phase);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = 'rgba(255, 232, 171, 0.5)';
    context.beginPath();
    context.moveTo(eyeX - 13, -13);
    context.bezierCurveTo(eyeX - 8, -23, eyeX + 2, -25, eyeX + 8, -19);
    context.bezierCurveTo(eyeX + 1, -14, eyeX - 7, -10, eyeX - 13, -13);
    context.closePath();
    context.fill();
    context.fillStyle = ICON_SHADOW;
    traceOrganicOval(context, eyeX + 0.7, 2, 7, 14, phase + 0.35);
    context.fill();
    context.fillStyle = ICON_LIGHT;
    traceOrganicOval(context, eyeX - 1.4, -4, 2.1, 3.7, phase + 0.7);
    context.fill();
  }
}

function drawMapIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-43, -31);
  context.quadraticCurveTo(-28, -35, -13, -39);
  context.quadraticCurveTo(1, -35, 14, -29);
  context.quadraticCurveTo(29, -34, 42, -38);
  context.bezierCurveTo(44, -17, 41, 10, 43, 32);
  context.quadraticCurveTo(29, 35, 14, 40);
  context.quadraticCurveTo(0, 35, -13, 30);
  context.quadraticCurveTo(-28, 35, -42, 39);
  context.bezierCurveTo(-44, 18, -41, -8, -43, -31);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 5.5;
  context.stroke();

  context.fillStyle = 'rgba(104, 73, 48, 0.24)';
  context.beginPath();
  context.moveTo(14, -29);
  context.quadraticCurveTo(29, -34, 42, -38);
  context.bezierCurveTo(44, -12, 41, 13, 43, 32);
  context.quadraticCurveTo(29, 35, 14, 40);
  context.bezierCurveTo(17, 18, 12, -7, 14, -29);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(255, 234, 176, 0.52)';
  context.beginPath();
  context.moveTo(-39, -27);
  context.quadraticCurveTo(-27, -31, -15, -34);
  context.bezierCurveTo(-16, -24, -18, -13, -17, -4);
  context.quadraticCurveTo(-29, -1, -40, 3);
  context.bezierCurveTo(-41, -8, -40, -19, -39, -27);
  context.closePath();
  context.fill();

  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-13, -38);
  context.bezierCurveTo(-15, -18, -11, 9, -13, 30);
  context.moveTo(14, -29);
  context.bezierCurveTo(12, -8, 17, 18, 14, 40);
  context.stroke();

  context.strokeStyle = ICON_MID;
  context.lineWidth = 4.5;
  context.beginPath();
  context.moveTo(-31, 18);
  context.bezierCurveTo(-22, 4, -12, -16, 1, -13);
  context.bezierCurveTo(12, -11, 17, 1, 27, 5);
  context.stroke();
  drawStarIconAt(context, 28, 5, 10, color, secondary);
}

function drawCardsIcon(context, color, secondary) {
  context.save();
  context.rotate(-0.16);
  context.fillStyle = 'rgba(78, 52, 40, 0.3)';
  traceOrganicCard(context, -4, 3, 56, 74, 0.12);
  context.fill();
  context.fillStyle = secondary;
  traceOrganicCard(context, -7, -1, 56, 74, 0.34);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = 'rgba(255, 232, 171, 0.5)';
  context.beginPath();
  context.moveTo(-28, -31);
  context.bezierCurveTo(-17, -35, -5, -34, 4, -31);
  context.quadraticCurveTo(-8, -24, -27, -20);
  context.quadraticCurveTo(-30, -25, -28, -31);
  context.closePath();
  context.fill();
  context.restore();

  context.save();
  context.rotate(0.13);
  context.fillStyle = 'rgba(78, 52, 40, 0.32)';
  traceOrganicCard(context, 13, 3, 56, 74, 0.68);
  context.fill();
  context.fillStyle = ICON_CREAM;
  traceOrganicCard(context, 10, -1, 56, 74, 0.83);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = 'rgba(255, 238, 190, 0.72)';
  context.beginPath();
  context.moveTo(-11, -30);
  context.bezierCurveTo(0, -35, 13, -34, 22, -30);
  context.quadraticCurveTo(9, -24, -9, -20);
  context.quadraticCurveTo(-13, -25, -11, -30);
  context.closePath();
  context.fill();
  drawOwlIconMini(context, 11, 1, color, secondary);
  context.restore();
}

function drawReplayIcon(context, color, secondary) {
  context.strokeStyle = 'rgba(74, 49, 38, 0.34)';
  context.lineWidth = 13;
  context.beginPath();
  context.moveTo(-28, -19);
  context.bezierCurveTo(-10, -43, 24, -37, 34, -13);
  context.bezierCurveTo(44, 11, 27, 38, 2, 40);
  context.bezierCurveTo(-18, 42, -34, 29, -37, 13);
  context.stroke();

  context.strokeStyle = color;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(-29, -22);
  context.bezierCurveTo(-10, -42, 21, -36, 32, -14);
  context.bezierCurveTo(42, 8, 27, 34, 3, 37);
  context.bezierCurveTo(-17, 39, -32, 27, -35, 12);
  context.stroke();

  context.strokeStyle = ICON_LIGHT;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-18, -29);
  context.bezierCurveTo(-1, -39, 19, -31, 27, -16);
  context.stroke();

  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-39, -16);
  context.quadraticCurveTo(-26, -19, -12, -18);
  context.quadraticCurveTo(-20, -7, -28, 6);
  context.quadraticCurveTo(-31, -6, -39, -16);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = ICON_LIGHT;
  context.beginPath();
  context.moveTo(-34, -14);
  context.quadraticCurveTo(-27, -15, -20, -15);
  context.quadraticCurveTo(-26, -10, -29, -5);
  context.quadraticCurveTo(-31, -10, -34, -14);
  context.closePath();
  context.fill();
}

function drawQuillIcon(context, color, secondary) {
  context.fillStyle = 'rgba(76, 50, 39, 0.33)';
  context.beginPath();
  context.moveTo(-30, 41);
  context.bezierCurveTo(-25, 0, -1, -36, 40, -40);
  context.bezierCurveTo(38, -7, 16, 29, -30, 41);
  context.closePath();
  context.fill();

  context.fillStyle = secondary;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(-33, 37);
  context.bezierCurveTo(-28, -3, -5, -39, 38, -43);
  context.bezierCurveTo(39, -9, 14, 27, -33, 37);
  context.closePath();
  context.fill();
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = 'rgba(255, 232, 171, 0.54)';
  context.beginPath();
  context.moveTo(-25, 26);
  context.bezierCurveTo(-18, -2, 2, -29, 29, -37);
  context.bezierCurveTo(13, -20, -1, -2, -12, 17);
  context.quadraticCurveTo(-19, 24, -25, 26);
  context.closePath();
  context.fill();

  context.strokeStyle = color;
  context.lineWidth = 4.5;
  context.beginPath();
  context.moveTo(-39, 45);
  context.bezierCurveTo(-20, 25, 5, -4, 27, -29);
  context.stroke();
  for (const offset of [-18, -3, 12]) {
    context.beginPath();
    context.moveTo(offset, -offset * 0.8 - 4);
    context.quadraticCurveTo(
      offset + 10,
      -offset * 0.8 - 3,
      offset + 20,
      -offset * 0.8 - 9,
    );
    context.stroke();
  }

  context.fillStyle = ICON_MID;
  context.beginPath();
  context.moveTo(-42, 47);
  context.quadraticCurveTo(-36, 39, -31, 36);
  context.quadraticCurveTo(-34, 44, -38, 49);
  context.quadraticCurveTo(-41, 51, -42, 47);
  context.closePath();
  context.fill();
}

function drawSatchelIcon(context, color, secondary) {
  context.fillStyle = 'rgba(72, 48, 38, 0.34)';
  context.beginPath();
  context.moveTo(-29, -17);
  context.bezierCurveTo(-31, -39, -17, -48, 1, -47);
  context.bezierCurveTo(20, -47, 31, -37, 29, -16);
  context.quadraticCurveTo(23, -12, 18, -17);
  context.bezierCurveTo(19, -30, 12, -36, 1, -36);
  context.bezierCurveTo(-11, -37, -18, -30, -18, -17);
  context.quadraticCurveTo(-23, -12, -29, -17);
  context.closePath();
  context.fill();

  context.fillStyle = ICON_SHADOW;
  context.beginPath();
  context.moveTo(-30, -21);
  context.bezierCurveTo(-31, -41, -16, -49, 1, -48);
  context.bezierCurveTo(19, -48, 30, -38, 29, -18);
  context.quadraticCurveTo(24, -14, 19, -18);
  context.bezierCurveTo(19, -31, 12, -38, 1, -38);
  context.bezierCurveTo(-11, -38, -19, -31, -19, -19);
  context.quadraticCurveTo(-24, -15, -30, -21);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4.5;
  context.stroke();

  context.fillStyle = 'rgba(255, 226, 157, 0.42)';
  context.beginPath();
  context.moveTo(-25, -24);
  context.bezierCurveTo(-24, -37, -13, -44, -2, -43);
  context.bezierCurveTo(-11, -39, -17, -31, -17, -22);
  context.quadraticCurveTo(-21, -20, -25, -24);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(71, 47, 37, 0.34)';
  context.beginPath();
  context.moveTo(-39, -19);
  context.bezierCurveTo(-44, -2, -42, 25, -34, 42);
  context.bezierCurveTo(-13, 49, 17, 49, 37, 41);
  context.bezierCurveTo(44, 23, 44, -2, 39, -18);
  context.bezierCurveTo(19, -25, -19, -26, -39, -19);
  context.closePath();
  context.fill();

  context.fillStyle = secondary;
  context.beginPath();
  context.moveTo(-39, -24);
  context.bezierCurveTo(-45, -5, -42, 22, -35, 39);
  context.bezierCurveTo(-15, 46, 17, 47, 36, 39);
  context.bezierCurveTo(43, 21, 44, -4, 38, -23);
  context.bezierCurveTo(19, -29, -19, -30, -39, -24);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = 'rgba(98, 68, 48, 0.3)';
  context.beginPath();
  context.moveTo(-38, -20);
  context.bezierCurveTo(-19, -28, 18, -27, 38, -21);
  context.quadraticCurveTo(24, 9, 0, 19);
  context.quadraticCurveTo(-24, 8, -38, -20);
  context.closePath();
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = 'rgba(255, 234, 178, 0.5)';
  context.beginPath();
  context.moveTo(-34, -21);
  context.bezierCurveTo(-23, -25, -10, -25, 2, -24);
  context.quadraticCurveTo(-12, -17, -29, -11);
  context.quadraticCurveTo(-34, -15, -34, -21);
  context.closePath();
  context.fill();

  drawOwlIconMini(context, 0, 13, color, ICON_CREAM);
}

function drawCompassIcon(context, color, secondary) {
  context.fillStyle = 'rgba(72, 48, 38, 0.34)';
  traceOrganicOval(context, 3, 5, 43, 43, 0.31);
  context.fill();
  context.fillStyle = secondary;
  traceOrganicOval(context, 0, 0, 42, 42, 0.12);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = ICON_CREAM;
  traceOrganicOval(context, -1, 0, 33, 34, 0.65);
  context.fill();
  context.strokeStyle = ICON_SHADOW;
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = 'rgba(255, 238, 189, 0.7)';
  context.beginPath();
  context.moveTo(-26, -20);
  context.bezierCurveTo(-17, -31, -4, -34, 8, -30);
  context.bezierCurveTo(-2, -23, -14, -17, -26, -12);
  context.quadraticCurveTo(-29, -16, -26, -20);
  context.closePath();
  context.fill();

  context.strokeStyle = ICON_MID;
  context.lineWidth = 2.5;
  for (const [startX, startY, controlX, controlY, endX, endY] of [
    [0, -31, 1.5, -27, 1, -23],
    [30, 0, 26, 1, 23, 0],
    [0, 31, -1, 27, 0, 23],
    [-30, 0, -26, -1, -23, 1],
  ]) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(controlX, controlY, endX, endY);
    context.stroke();
  }

  context.fillStyle = ICON_SHADOW;
  context.beginPath();
  context.moveTo(-1, 31);
  context.quadraticCurveTo(-9, 8, -8, -4);
  context.quadraticCurveTo(-4, -7, 1, -5);
  context.quadraticCurveTo(7, 8, -1, 31);
  context.closePath();
  context.fill();

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(1, -33);
  context.quadraticCurveTo(10, -10, 8, 4);
  context.quadraticCurveTo(3, 7, -2, 5);
  context.quadraticCurveTo(-8, -10, 1, -33);
  context.closePath();
  context.fill();

  context.fillStyle = ICON_MID;
  traceOrganicOval(context, 0, 0, 6, 6.5, 0.44);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = ICON_LIGHT;
  traceOrganicOval(context, -1.8, -2, 1.8, 1.5, 0.83);
  context.fill();
}

function drawCloseIcon(context, color, secondary) {
  context.save();
  context.translate(3, 4);
  context.fillStyle = 'rgba(72, 48, 38, 0.4)';
  traceCloseArm(context);
  context.fill();
  context.scale(1, -1);
  traceCloseArm(context);
  context.fill();
  context.restore();

  context.fillStyle = secondary;
  traceCloseArm(context);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();
  context.save();
  context.scale(1, -1);
  traceCloseArm(context);
  context.fill();
  context.stroke();
  context.restore();

  context.strokeStyle = 'rgba(255, 235, 180, 0.78)';
  context.lineWidth = 2.6;
  for (const direction of [-1, 1]) {
    context.beginPath();
    context.moveTo(-25, direction * -25);
    context.bezierCurveTo(-15, direction * -16, -7, direction * -7, 1, direction * 1);
    context.stroke();
  }

  context.fillStyle = ICON_MID;
  traceOrganicOval(context, 0, 0, 5.5, 5, 0.41);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
}

function drawCheckIcon(context, color, secondary) {
  context.fillStyle = 'rgba(72, 48, 38, 0.4)';
  traceCheckMark(context, 3, 4);
  context.fill();

  context.fillStyle = secondary;
  traceCheckMark(context);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();

  context.strokeStyle = 'rgba(255, 235, 180, 0.82)';
  context.lineWidth = 2.8;
  context.beginPath();
  context.moveTo(-31, -3);
  context.quadraticCurveTo(-22, 7, -10, 21);
  context.bezierCurveTo(2, 7, 19, -17, 34, -31);
  context.stroke();

  context.fillStyle = ICON_MID;
  traceOrganicOval(context, -9, 24, 4.5, 4.2, 0.27);
  context.fill();
}

function drawSpeakerIcon(context, color, secondary) {
  context.fillStyle = 'rgba(72, 48, 38, 0.38)';
  traceSpeakerBody(context, 3, 4);
  context.fill();

  context.fillStyle = secondary;
  context.strokeStyle = color;
  traceSpeakerBody(context);
  context.fill();
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = 'rgba(255, 235, 180, 0.6)';
  context.beginPath();
  context.moveTo(-36, -15);
  context.quadraticCurveTo(-27, -16, -19, -17);
  context.bezierCurveTo(-12, -24, -5, -31, 4, -36);
  context.quadraticCurveTo(1, -22, 2, -9);
  context.bezierCurveTo(-10, -3, -23, -1, -37, -3);
  context.quadraticCurveTo(-40, -9, -36, -15);
  context.closePath();
  context.fill();

  context.fillStyle = ICON_SHADOW;
  traceSoundRibbon(context, 17, 22, 14, 0.24);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.stroke();

  context.fillStyle = ICON_MID;
  traceSoundRibbon(context, 22, 36, 22, 0.67);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2.8;
  context.stroke();

  context.fillStyle = ICON_LIGHT;
  context.beginPath();
  context.moveTo(24, -27);
  context.bezierCurveTo(33, -20, 37, -11, 38, -2);
  context.quadraticCurveTo(34, -12, 25, -19, 24, -27);
  context.closePath();
  context.fill();
}

function traceBiscuitShape(context, offsetX = 0, offsetY = 0) {
  traceSoftLoop(context, [
    { x: 1 + offsetX, y: -44 + offsetY },
    { x: 18 + offsetX, y: -42 + offsetY },
    { x: 34 + offsetX, y: -31 + offsetY },
    { x: 42 + offsetX, y: -15 + offsetY },
    { x: 40 + offsetX, y: 2 + offsetY },
    { x: 44 + offsetX, y: 18 + offsetY },
    { x: 31 + offsetX, y: 34 + offsetY },
    { x: 14 + offsetX, y: 42 + offsetY },
    { x: -5 + offsetX, y: 40 + offsetY },
    { x: -23 + offsetX, y: 43 + offsetY },
    { x: -38 + offsetX, y: 29 + offsetY },
    { x: -43 + offsetX, y: 10 + offsetY },
    { x: -40 + offsetX, y: -11 + offsetY },
    { x: -32 + offsetX, y: -29 + offsetY },
    { x: -16 + offsetX, y: -40 + offsetY },
  ]);
}

function drawBiscuitIcon(context, color, secondary) {
  context.fillStyle = 'rgba(74, 48, 38, 0.38)';
  traceBiscuitShape(context, 4, 5);
  context.fill();

  context.fillStyle = secondary;
  traceBiscuitShape(context);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = 'rgba(255, 237, 187, 0.66)';
  context.beginPath();
  context.moveTo(-31, -20);
  context.bezierCurveTo(-19, -34, 4, -38, 20, -29);
  context.bezierCurveTo(8, -23, -10, -15, -28, -8);
  context.quadraticCurveTo(-34, -12, -31, -20);
  context.closePath();
  context.fill();

  const crumbs = [
    [-17, 14, 6, 5, 0.12], [9, 17, 5.5, 6.5, 0.38],
    [21, -12, 5, 4.5, 0.71], [-5, -11, 4.5, 5, 1.04],
  ];
  for (let index = 0; index < crumbs.length; index += 1) {
    const [crumbX, crumbY, radiusX, radiusY, phase] = crumbs[index];
    context.fillStyle = index % 2 === 0 ? ICON_SHADOW : ICON_MID;
    traceOrganicOval(context, crumbX, crumbY, radiusX, radiusY, phase);
    context.fill();
  }

  context.strokeStyle = 'rgba(102, 70, 43, 0.72)';
  context.lineWidth = 2.8;
  context.beginPath();
  context.moveTo(-27, 5);
  context.quadraticCurveTo(-20, 1, -14, 3);
  context.moveTo(18, 3);
  context.quadraticCurveTo(23, 7, 27, 13);
  context.stroke();
}

function tracePipSeed(context, offsetX = 0, offsetY = 0) {
  context.beginPath();
  context.moveTo(4 + offsetX, -18 + offsetY);
  context.bezierCurveTo(
    29 + offsetX,
    -12 + offsetY,
    39 + offsetX,
    12 + offsetY,
    27 + offsetX,
    31 + offsetY,
  );
  context.bezierCurveTo(
    16 + offsetX,
    47 + offsetY,
    -12 + offsetX,
    46 + offsetY,
    -27 + offsetX,
    31 + offsetY,
  );
  context.bezierCurveTo(
    -42 + offsetX,
    15 + offsetY,
    -31 + offsetX,
    -9 + offsetY,
    4 + offsetX,
    -18 + offsetY,
  );
  context.closePath();
}

function tracePipLeaf(context, x, y, direction) {
  context.beginPath();
  context.moveTo(x, y);
  context.bezierCurveTo(
    x + direction * 8,
    y - 20,
    x + direction * 24,
    y - 27,
    x + direction * 34,
    y - 23,
  );
  context.bezierCurveTo(
    x + direction * 31,
    y - 8,
    x + direction * 16,
    y - 2,
    x,
    y,
  );
  context.closePath();
}

function drawPipIcon(context, color, secondary) {
  context.strokeStyle = STORYBOOK_INK.soft;
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(3, -14);
  context.bezierCurveTo(4, -24, 1, -34, -5, -42);
  context.stroke();

  context.strokeStyle = '#667345';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(0, -16);
  context.bezierCurveTo(2, -26, 0, -36, -5, -44);
  context.stroke();

  context.fillStyle = '#53653d';
  tracePipLeaf(context, -4, -37, -1);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 3.5;
  context.stroke();
  context.fillStyle = '#8fa45f';
  tracePipLeaf(context, -3, -39, 1);
  context.fill();
  context.stroke();

  context.fillStyle = 'rgba(74, 48, 38, 0.38)';
  tracePipSeed(context, 4, 5);
  context.fill();
  context.fillStyle = secondary;
  tracePipSeed(context);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = ICON_LIGHT;
  context.beginPath();
  context.moveTo(-19, 4);
  context.bezierCurveTo(-14, -7, -3, -12, 8, -10);
  context.bezierCurveTo(-1, -3, -7, 9, -9, 20);
  context.quadraticCurveTo(-18, 16, -19, 4);
  context.closePath();
  context.fill();

  context.fillStyle = ICON_MID;
  traceOrganicOval(context, 14, 24, 5, 4, 0.62);
  context.fill();
}

function drawBeansIcon(context, color, secondary) {
  const beans = [
    { x: -24, y: 12, rotation: -0.38, fill: secondary },
    { x: 4, y: -18, rotation: 0.2, fill: '#b56f75' },
    { x: 28, y: 17, rotation: 0.46, fill: '#75907a' },
  ];
  for (const bean of beans) {
    context.save();
    context.translate(bean.x, bean.y);
    context.rotate(bean.rotation);
    context.fillStyle = bean.fill;
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-18, -31);
    context.bezierCurveTo(17, -42, 36, -13, 26, 18);
    context.bezierCurveTo(17, 46, -20, 41, -29, 15);
    context.bezierCurveTo(-38, -10, -33, -27, -18, -31);
    context.closePath();
    context.fill();
    context.stroke();
    context.strokeStyle = 'rgba(255,244,210,0.58)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-12, -18);
    context.bezierCurveTo(-1, -25, 10, -18, 13, -9);
    context.stroke();
    context.restore();
  }
}

function drawCauldronCakeIcon(context, color, secondary) {
  context.fillStyle = '#7d5a45';
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-38, -9);
  context.bezierCurveTo(-35, 23, -24, 42, 0, 45);
  context.bezierCurveTo(24, 42, 35, 23, 38, -9);
  context.bezierCurveTo(18, -20, -18, -20, -38, -9);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = secondary;
  traceOrganicOval(context, 0, -11, 38, 12, 0.42);
  context.fill();
  context.stroke();
  context.fillStyle = '#c9827f';
  context.beginPath();
  context.moveTo(-27, -14);
  context.bezierCurveTo(-31, -38, -14, -48, -2, -37);
  context.bezierCurveTo(7, -52, 30, -40, 26, -14);
  context.bezierCurveTo(10, -4, -12, -5, -27, -14);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = 'rgba(255,238,188,0.62)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-18, -28);
  context.bezierCurveTo(-7, -35, 7, -34, 18, -27);
  context.stroke();
}

function drawShieldHeartIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(0, -45);
  context.bezierCurveTo(18, -35, 31, -31, 40, -32);
  context.bezierCurveTo(41, 4, 27, 31, 0, 46);
  context.bezierCurveTo(-27, 31, -41, 4, -40, -32);
  context.bezierCurveTo(-30, -31, -17, -35, 0, -45);
  context.closePath();
  context.fill();
  context.stroke();
  context.save();
  context.scale(0.48, 0.48);
  drawHeartIcon(context, '#8a3145');
  context.restore();
  context.strokeStyle = 'rgba(255,244,210,0.58)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-25, -26);
  context.bezierCurveTo(-19, -33, -10, -37, -2, -38);
  context.moveTo(-29, -16);
  context.bezierCurveTo(-30, 2, -23, 18, -10, 29);
  context.moveTo(29, -16);
  context.bezierCurveTo(30, 2, 23, 18, 10, 29);
  context.stroke();
}

function drawHelpingHandIcon(context, color, secondary) {
  context.fillStyle = secondary;
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-37, 30);
  context.bezierCurveTo(-28, 5, -20, -17, -14, -39);
  context.bezierCurveTo(-6, -45, -1, -35, -4, -19);
  context.bezierCurveTo(2, -43, 13, -44, 12, -19);
  context.bezierCurveTo(19, -38, 30, -34, 25, -11);
  context.bezierCurveTo(39, -24, 47, -13, 36, 7);
  context.bezierCurveTo(25, 31, 5, 44, -18, 43);
  context.bezierCurveTo(-28, 42, -34, 38, -37, 30);
  context.closePath();
  context.fill();
  context.stroke();
  context.save();
  context.translate(10, 8);
  context.scale(0.27, 0.27);
  drawHeartIcon(context, '#8a3145');
  context.restore();
  context.strokeStyle = 'rgba(255,244,210,0.62)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-24, 25);
  context.bezierCurveTo(-10, 31, 5, 28, 16, 18);
  context.stroke();
}

function drawStepForwardIcon(context, color, secondary) {
  const footprint = (x, y, rotation, fill) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = fill;
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-12, 31);
    context.bezierCurveTo(-27, 17, -25, -8, -17, -29);
    context.bezierCurveTo(-9, -48, 10, -48, 18, -29);
    context.bezierCurveTo(27, -8, 26, 18, 11, 32);
    context.bezierCurveTo(4, 40, -5, 39, -12, 31);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = 'rgba(255,244,210,0.6)';
    traceOrganicOval(context, -3, -27, 7, 12, 0.74);
    context.fill();
    context.restore();
  };
  footprint(-22, 17, -0.2, secondary);
  footprint(23, -14, 0.22, '#b97572');
}

function drawStayCloseIcon(context, color, secondary) {
  context.strokeStyle = color;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-35, 24);
  context.bezierCurveTo(-17, 4, 17, 4, 35, 24);
  context.bezierCurveTo(22, 39, -22, 39, -35, 24);
  context.stroke();
  context.save();
  context.translate(-22, -11);
  context.scale(0.46, 0.46);
  drawHeartIcon(context, '#8a3145');
  context.restore();
  context.save();
  context.translate(22, -11);
  context.scale(0.46, 0.46);
  drawHeartIcon(context, secondary);
  context.restore();
  context.strokeStyle = 'rgba(255,244,210,0.58)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-31, -20);
  context.bezierCurveTo(-24, -27, -16, -28, -10, -22);
  context.moveTo(13, -20);
  context.bezierCurveTo(20, -27, 28, -27, 33, -19);
  context.stroke();
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
  const radii = [1, 0.35, 0.92, 0.38, 1.04, 0.33, 0.95, 0.37, 0.98, 0.34];
  const angleDrift = [-0.02, 0.025, -0.035, 0.018, 0.03, -0.025, 0.022, -0.03, 0.015, -0.018];
  const points = radii.map((scale, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5 + angleDrift[index];
    return {
      x: x + Math.cos(angle) * radius * scale,
      y: y + Math.sin(angle) * radius * scale,
    };
  });
  const last = points.at(-1);
  const first = points[0];
  context.beginPath();
  context.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  context.closePath();
  context.fill();
  context.lineWidth = Math.max(2, radius * 0.14);
  context.stroke();

  context.fillStyle = 'rgba(255, 235, 180, 0.72)';
  context.beginPath();
  context.moveTo(x - radius * 0.18, y - radius * 0.5);
  context.quadraticCurveTo(x - radius * 0.03, y - radius * 0.68, x + radius * 0.08, y - radius * 0.43);
  context.quadraticCurveTo(x - radius * 0.05, y - radius * 0.22, x - radius * 0.18, y - radius * 0.5);
  context.closePath();
  context.fill();
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
