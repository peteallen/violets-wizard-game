import { STORYBOOK_INK, STORYBOOK_LINE_WEIGHT } from '../render/storybookInk.js';

const OUTLINE = STORYBOOK_INK.primary;

export function prepareVectorContext(context, lineWidth) {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = OUTLINE;
  context.lineWidth = lineWidth;
}

export function drawVectorGroundShadow(context, {
  width,
  height,
  primary,
  secondary,
  tertiary,
} = {}) {
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new TypeError('Vector ground shadow requires positive finite width and height.');
  }
  context.save();
  context.fillStyle = primary;
  traceOrganicGroundShadow(context, 4, 26, width, height, 0.08);
  context.fill();
  context.fillStyle = secondary;
  traceOrganicGroundShadow(context, -2, 23, width * 0.72, height * 0.55, -0.11);
  context.fill();
  context.fillStyle = tertiary;
  traceOrganicGroundShadow(context, 1, 21.5, width * 0.43, height * 0.35, 0.13);
  context.fill();
  context.restore();
}

export function drawVectorCompanionShadow(context, motion, {
  primaryRadiusX,
  primaryRadiusY,
  primaryTurn,
  secondaryRadiusX,
  secondaryRadiusY,
  secondaryTurn,
  hopDivisor,
} = {}) {
  const hopLift = Math.min(0.42, motion.hop / hopDivisor);
  context.save();
  context.globalAlpha = 1 - hopLift;
  context.fillStyle = 'rgba(25,17,24,0.24)';
  traceOrganicPatch(context, 2, primaryRadiusY > 7 ? 4 : 5, primaryRadiusX, primaryRadiusY, primaryTurn);
  context.fill();
  context.fillStyle = 'rgba(92,54,36,0.12)';
  traceOrganicPatch(context, -3, secondaryRadiusY > 4 ? 2 : 3, secondaryRadiusX, secondaryRadiusY, secondaryTurn);
  context.fill();
  context.restore();
}

export function traceOrganicGroundShadow(context, x, y, radiusX, radiusY, wobble) {
  context.beginPath();
  context.moveTo(x - radiusX * (0.96 + wobble), y - radiusY * 0.08);
  context.bezierCurveTo(
    x - radiusX * 0.63,
    y - radiusY * (1.02 - wobble),
    x + radiusX * 0.38,
    y - radiusY * (0.88 + wobble),
    x + radiusX * (1.01 - wobble),
    y + radiusY * 0.05,
  );
  context.bezierCurveTo(
    x + radiusX * 0.57,
    y + radiusY * (0.93 - wobble),
    x - radiusX * 0.42,
    y + radiusY * (1.04 + wobble),
    x - radiusX * (0.96 + wobble),
    y - radiusY * 0.08,
  );
  context.closePath();
}


export function drawHand(context, x, y, color, radius) {
  const side = x < 0 ? -1 : 1;
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-side * radius * 0.7, -radius * 0.65);
  context.bezierCurveTo(-side * radius * 0.28, -radius, side * radius * 0.38, -radius, side * radius * 0.7, -radius * 0.7);
  context.bezierCurveTo(side * radius * 1.02, -radius * 0.56, side * radius * 1.04, -radius * 0.28, side * radius * 0.77, -radius * 0.17);
  context.bezierCurveTo(side * radius * 1.14, -radius * 0.08, side * radius * 1.17, radius * 0.2, side * radius * 0.84, radius * 0.31);
  context.bezierCurveTo(side * radius * 1.11, radius * 0.46, side * radius, radius * 0.7, side * radius * 0.63, radius * 0.78);
  context.quadraticCurveTo(0, radius * 1.05, -side * radius * 0.72, radius * 0.52);
  context.quadraticCurveTo(-side * radius, 0, -side * radius * 0.7, -radius * 0.65);
  context.closePath();
  fillStroke(context, STORYBOOK_LINE_WEIGHT.contour);

  context.fillStyle = 'rgba(255, 218, 174, 0.3)';
  context.beginPath();
  context.moveTo(-side * radius * 0.18, -radius * 0.08);
  context.bezierCurveTo(side * radius * 0.2, -radius * 0.18, side * radius * 0.7, -radius * 0.08, side * radius * 0.82, radius * 0.17);
  context.bezierCurveTo(side * radius * 0.58, radius * 0.38, side * radius * 0.18, radius * 0.32, -side * radius * 0.18, -radius * 0.08);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(104,60,46,0.42)';
  context.lineWidth = 1.05;
  context.stroke();

  context.strokeStyle = 'rgba(255,231,168,0.4)';
  context.lineWidth = STORYBOOK_LINE_WEIGHT.feature;
  context.beginPath();
  context.moveTo(-radius * 0.62, -radius * 0.18);
  context.bezierCurveTo(
    -radius * 0.58,
    -radius * 0.58,
    -radius * 0.12,
    -radius * 0.78,
    radius * 0.28,
    -radius * 0.56,
  );
  context.stroke();
  context.strokeStyle = 'rgba(87,52,42,0.35)';
  context.lineWidth = STORYBOOK_LINE_WEIGHT.detail;
  context.beginPath();
  for (const fingerY of [-0.38, -0.04, 0.3]) {
    context.moveTo(side * radius * 0.55, radius * fingerY);
    context.bezierCurveTo(
      side * radius * 0.7,
      radius * (fingerY + 0.07),
      side * radius * 0.77,
      radius * (fingerY + 0.13),
      side * radius * 0.82,
      radius * (fingerY + 0.2),
    );
  }
  context.moveTo(-side * radius * 0.22, radius * 0.18);
  context.quadraticCurveTo(side * radius * 0.08, radius * 0.42, side * radius * 0.43, radius * 0.32);
  context.stroke();
  context.restore();
}


export function drawCompanionEye(context, {
  x,
  y,
  width,
  height,
  gazeX,
  gazeY,
  iris,
  pupil,
  eyeWhite,
  catchlight,
  lid,
  blinking,
  turn,
}) {
  if (blinking) {
    context.fillStyle = lid;
    traceOrganicPatch(context, x, y, width, Math.max(1.6, height * 0.28), turn);
    context.fill();
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - width, y);
    context.bezierCurveTo(x - width * 0.36, y + 2.3, x + width * 0.4, y + 2.1, x + width, y - 0.2);
    context.stroke();
    return;
  }

  context.fillStyle = eyeWhite;
  context.beginPath();
  context.moveTo(x - width, y + turn * height);
  context.bezierCurveTo(x - width * 0.46, y - height, x + width * 0.37, y - height * 0.92, x + width, y - turn * height * 0.4);
  context.bezierCurveTo(x + width * 0.42, y + height * 0.82, x - width * 0.45, y + height * 0.94, x - width, y + turn * height);
  context.closePath();
  fillStroke(context, 1.45);

  const irisX = x + gazeX;
  const irisY = y + gazeY;
  context.fillStyle = iris;
  traceOrganicPatch(context, irisX, irisY, width * 0.5, height * 0.66, -turn * 0.7);
  context.fill();
  context.fillStyle = pupil;
  context.beginPath();
  context.moveTo(irisX - width * 0.1, irisY - height * 0.48);
  context.bezierCurveTo(irisX + width * 0.17, irisY - height * 0.28, irisX + width * 0.15, irisY + height * 0.3, irisX + width * 0.02, irisY + height * 0.5);
  context.bezierCurveTo(irisX - width * 0.17, irisY + height * 0.28, irisX - width * 0.16, irisY - height * 0.3, irisX - width * 0.1, irisY - height * 0.48);
  context.closePath();
  context.fill();
  context.fillStyle = catchlight;
  context.beginPath();
  context.moveTo(irisX - width * 0.28, irisY - height * 0.4);
  context.bezierCurveTo(irisX - width * 0.12, irisY - height * 0.56, irisX + width * 0.04, irisY - height * 0.44, irisX + width * 0.01, irisY - height * 0.24);
  context.bezierCurveTo(irisX - width * 0.14, irisY - height * 0.15, irisX - width * 0.31, irisY - height * 0.23, irisX - width * 0.28, irisY - height * 0.4);
  context.closePath();
  context.fill();

  context.strokeStyle = lid;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x - width, y + turn * height);
  context.bezierCurveTo(x - width * 0.42, y - height * 1.04, x + width * 0.4, y - height, x + width, y - turn * height * 0.4);
  context.stroke();
  context.strokeStyle = 'rgba(78, 55, 43, 0.46)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(x - width * 0.76, y + height * 0.45);
  context.bezierCurveTo(x - width * 0.25, y + height * 0.86, x + width * 0.35, y + height * 0.76, x + width * 0.78, y + height * 0.33);
  context.stroke();
}


export function traceOrganicPatch(context, x, y, radiusX, radiusY, turn = 0) {
  context.beginPath();
  context.moveTo(x - radiusX * (1 + turn * 0.08), y + radiusY * turn * 0.18);
  context.bezierCurveTo(
    x - radiusX * (0.82 - turn * 0.08),
    y - radiusY * (0.78 + turn * 0.06),
    x - radiusX * (0.22 + turn * 0.08),
    y - radiusY * (1.06 - turn * 0.05),
    x + radiusX * (0.28 - turn * 0.05),
    y - radiusY * (0.91 + turn * 0.08),
  );
  context.bezierCurveTo(
    x + radiusX * (0.84 + turn * 0.04),
    y - radiusY * (0.7 - turn * 0.08),
    x + radiusX * (1.04 - turn * 0.05),
    y - radiusY * (0.14 + turn * 0.08),
    x + radiusX * (0.91 + turn * 0.06),
    y + radiusY * (0.36 - turn * 0.05),
  );
  context.bezierCurveTo(
    x + radiusX * (0.72 - turn * 0.05),
    y + radiusY * (0.94 + turn * 0.05),
    x + radiusX * (0.08 + turn * 0.06),
    y + radiusY * (1.04 - turn * 0.03),
    x - radiusX * (0.42 - turn * 0.05),
    y + radiusY * (0.87 + turn * 0.06),
  );
  context.bezierCurveTo(
    x - radiusX * (0.92 + turn * 0.04),
    y + radiusY * (0.66 - turn * 0.06),
    x - radiusX * (1.03 - turn * 0.04),
    y + radiusY * (0.18 + turn * 0.05),
    x - radiusX * (1 + turn * 0.08),
    y + radiusY * turn * 0.18,
  );
  context.closePath();
}


export function drawFourPointStar(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.lineTo(x + radius * 0.33, y - radius * 0.33);
  context.lineTo(x + radius, y);
  context.lineTo(x + radius * 0.33, y + radius * 0.33);
  context.lineTo(x, y + radius);
  context.lineTo(x - radius * 0.33, y + radius * 0.33);
  context.lineTo(x - radius, y);
  context.lineTo(x - radius * 0.33, y - radius * 0.33);
  context.closePath();
  context.fill();
}


export function fillStroke(context, lineWidth = null) {
  context.fill();
  const previous = context.lineWidth;
  if (lineWidth !== null) context.lineWidth = lineWidth;
  context.strokeStyle = OUTLINE;
  context.stroke();
  context.lineWidth = previous;
}

export function isBlinking(time, phase) {
  const cycle = (time * 0.72 + phase) % 4.7;
  return cycle > 4.47;
}
