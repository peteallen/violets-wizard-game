import { WORLD } from '../config.js';
import { childFacingUiText } from '../content/playerVisibleCopy.js';

const INK = '#382a24';
const DEEP_INK = '#2d2220';
const PARCHMENT = '#ead8b3';
const PARCHMENT_LIGHT = '#f7e9c9';
const PARCHMENT_SHADOW = '#b9905f';
const LEATHER = '#5b3a2d';
const LEATHER_LIGHT = '#8a6042';
const LEATHER_SHADOW = '#352526';
const BRASS = '#c79a45';
const BRASS_LIGHT = '#f2d184';
const BRASS_SHADOW = '#72502d';
const VIOLET_WAX = '#5e365d';

export const CHAPTER_PREVIEW_ACTIONS = Object.freeze({
  explore: 'explore',
  playAgain: 'playAgain',
  startFresh: 'startFresh',
});

export function chapterPreviewLayout({ width = WORLD.width, height = WORLD.height } = {}) {
  const scaleX = width / WORLD.width;
  const scaleY = height / WORLD.height;
  const rect = (x, y, rectWidth, rectHeight) => Object.freeze({
    x: x * scaleX,
    y: y * scaleY,
    width: rectWidth * scaleX,
    height: rectHeight * scaleY,
  });

  const titlePlaque = rect(300, 54, 680, 150);
  const startFresh = rect(32, 54, 220, 96);
  const shelf = rect(188, 508, 904, 176);
  const choices = Object.freeze([
    Object.freeze({ id: CHAPTER_PREVIEW_ACTIONS.explore, rect: rect(236, 536, 360, 120) }),
    Object.freeze({ id: CHAPTER_PREVIEW_ACTIONS.playAgain, rect: rect(684, 536, 360, 120) }),
  ]);

  return Object.freeze({
    titlePlaque,
    startFresh,
    shelf,
    choices,
  });
}

export function chapterPreviewActionAt(point, layout = chapterPreviewLayout()) {
  if (pointInRect(point, layout.startFresh)) return CHAPTER_PREVIEW_ACTIONS.startFresh;
  return layout.choices.find((choice) => pointInRect(point, choice.rect))?.id ?? null;
}

export class ChapterPreviewRenderer {
  draw(context, {
    choices = [],
    showChoices = false,
    title = 'Platform Nine and Three-Quarters',
  } = {}) {
    const layout = chapterPreviewLayout();
    drawTitlePlaque(context, layout.titlePlaque, title);
    drawStartFresh(context, layout.startFresh);

    if (showChoices) {
      drawActionShelf(context, layout.shelf);
      const authoredChoices = new Map(choices.map((choice) => [choice.id, choice]));
      for (const action of layout.choices) {
        const choice = authoredChoices.get(action.id);
        const fallback = action.id === CHAPTER_PREVIEW_ACTIONS.explore ? 'Explore' : 'Play again';
        drawChoiceAction(context, action.rect, {
          id: action.id,
          label: choice?.caption ?? fallback,
        });
      }
    }

    return layout;
  }
}

function drawTitlePlaque(context, rect, title) {
  drawDeckledSurface(context, rect, {
    fill: PARCHMENT,
    light: PARCHMENT_LIGHT,
    shadow: PARCHMENT_SHADOW,
    edge: LEATHER,
    offset: 8,
  });

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = LEATHER;
  context.font = '700 23px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(
    childFacingUiText('Chapter Two', 'proper-name'),
    rect.x + rect.width / 2,
    rect.y + 38,
    rect.width - 70,
  );
  context.fillStyle = INK;
  context.font = '700 39px "Almendra", Georgia, serif';
  context.fillText(
    childFacingUiText(title, 'proper-name'),
    rect.x + rect.width / 2,
    rect.y + 96,
    rect.width - 62,
  );

  context.strokeStyle = 'rgba(120,79,43,0.5)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(rect.x + 86, rect.y + 125);
  context.bezierCurveTo(
    rect.x + rect.width * 0.37,
    rect.y + 120,
    rect.x + rect.width * 0.62,
    rect.y + 131,
    rect.x + rect.width - 86,
    rect.y + 124,
  );
  context.stroke();
  context.restore();
}

function drawStartFresh(context, rect) {
  drawDeckledSurface(context, rect, {
    fill: LEATHER,
    light: LEATHER_LIGHT,
    shadow: LEATHER_SHADOW,
    edge: BRASS_SHADOW,
    offset: 6,
  });
  drawKeyhole(context, rect.x + 48, rect.y + rect.height / 2, 23);

  context.save();
  context.fillStyle = '#f8e8c5';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(
    childFacingUiText('Start fresh', 'action'),
    rect.x + 143,
    rect.y + rect.height / 2,
    126,
  );
  context.restore();
}

function drawActionShelf(context, rect) {
  drawDeckledSurface(context, rect, {
    fill: 'rgba(67,43,38,0.94)',
    light: 'rgba(139,94,61,0.88)',
    shadow: 'rgba(35,25,29,0.96)',
    edge: BRASS_SHADOW,
    offset: 9,
  });

  context.save();
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(32,21,25,0.72)';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(rect.x + 28, rect.y + 24);
  context.bezierCurveTo(
    rect.x + rect.width * 0.24,
    rect.y + 15,
    rect.x + rect.width * 0.42,
    rect.y + 31,
    rect.x + rect.width * 0.52,
    rect.y + 22,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.66,
    rect.y + 13,
    rect.x + rect.width * 0.78,
    rect.y + 31,
    rect.x + rect.width - 28,
    rect.y + 22,
  );
  context.stroke();

  context.strokeStyle = 'rgba(248,218,151,0.58)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(rect.x + 29, rect.y + 21);
  context.bezierCurveTo(
    rect.x + rect.width * 0.25,
    rect.y + 12,
    rect.x + rect.width * 0.42,
    rect.y + 28,
    rect.x + rect.width * 0.52,
    rect.y + 19,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.66,
    rect.y + 10,
    rect.x + rect.width * 0.79,
    rect.y + 28,
    rect.x + rect.width - 29,
    rect.y + 19,
  );
  context.stroke();

  drawTooledLeaf(context, rect.x + rect.width * 0.49, rect.y + 21, -1);
  drawTooledLeaf(context, rect.x + rect.width * 0.55, rect.y + 20, 1);
  context.restore();
}

function drawTooledLeaf(context, x, y, direction) {
  const tipX = x + direction * 18;
  context.fillStyle = 'rgba(114,71,48,0.92)';
  context.beginPath();
  context.moveTo(x, y + 1);
  context.bezierCurveTo(
    x + direction * 4,
    y - 11,
    x + direction * 15,
    y - 10,
    tipX,
    y - 2,
  );
  context.bezierCurveTo(
    x + direction * 13,
    y + 5,
    x + direction * 5,
    y + 7,
    x,
    y + 1,
  );
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(245,208,132,0.5)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(x + direction * 2, y);
  context.quadraticCurveTo(
    x + direction * 10,
    y - 3,
    x + direction * 16,
    y - 2,
  );
  context.stroke();
}

function drawChoiceAction(context, rect, { id, label }) {
  drawDeckledSurface(context, rect, {
    fill: PARCHMENT,
    light: PARCHMENT_LIGHT,
    shadow: PARCHMENT_SHADOW,
    edge: BRASS_SHADOW,
    offset: 6,
  });

  const sealX = rect.x + 62;
  const sealY = rect.y + rect.height / 2;
  drawWaxSeal(context, sealX, sealY, 35);
  if (id === CHAPTER_PREVIEW_ACTIONS.explore) drawMapMark(context, sealX, sealY, 27);
  else drawReplayMark(context, sealX, sealY, 27);

  context.save();
  context.fillStyle = INK;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 30px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(
    childFacingUiText(label, 'action'),
    rect.x + 226,
    rect.y + rect.height / 2,
    220,
  );
  context.restore();
}

function drawDeckledSurface(context, rect, { fill, light, shadow, edge, offset }) {
  context.save();
  context.fillStyle = 'rgba(26,18,24,0.46)';
  traceDeckled(context, {
    x: rect.x + offset,
    y: rect.y + offset + 3,
    width: rect.width,
    height: rect.height,
  });
  context.fill();

  context.fillStyle = fill;
  traceDeckled(context, rect);
  context.fill();
  context.strokeStyle = edge;
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = light;
  context.beginPath();
  context.moveTo(rect.x + 11, rect.y + 13);
  context.bezierCurveTo(
    rect.x + rect.width * 0.3,
    rect.y + 2,
    rect.x + rect.width * 0.71,
    rect.y + 20,
    rect.x + rect.width - 10,
    rect.y + 11,
  );
  context.bezierCurveTo(
    rect.x + rect.width - 12,
    rect.y + rect.height * 0.16,
    rect.x + rect.width - 20,
    rect.y + rect.height * 0.27,
    rect.x + rect.width - 16,
    rect.y + rect.height * 0.37,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.68,
    rect.y + rect.height * 0.3,
    rect.x + rect.width * 0.35,
    rect.y + rect.height * 0.42,
    rect.x + 15,
    rect.y + rect.height * 0.32,
  );
  context.closePath();
  context.fill();

  context.fillStyle = shadow;
  context.beginPath();
  context.moveTo(rect.x + 12, rect.y + rect.height * 0.72);
  context.bezierCurveTo(
    rect.x + rect.width * 0.32,
    rect.y + rect.height * 0.64,
    rect.x + rect.width * 0.69,
    rect.y + rect.height * 0.82,
    rect.x + rect.width - 11,
    rect.y + rect.height * 0.7,
  );
  context.bezierCurveTo(
    rect.x + rect.width - 5,
    rect.y + rect.height * 0.81,
    rect.x + rect.width - 14,
    rect.y + rect.height * 0.91,
    rect.x + rect.width - 8,
    rect.y + rect.height - 9,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.66,
    rect.y + rect.height + 1,
    rect.x + rect.width * 0.34,
    rect.y + rect.height - 8,
    rect.x + 8,
    rect.y + rect.height - 10,
  );
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(255,238,190,0.32)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(rect.x + 24, rect.y + 19);
  context.bezierCurveTo(
    rect.x + rect.width * 0.36,
    rect.y + 12,
    rect.x + rect.width * 0.65,
    rect.y + 25,
    rect.x + rect.width - 25,
    rect.y + 17,
  );
  context.stroke();
  context.restore();
}

function traceDeckled(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + 13, y + 2);
  context.quadraticCurveTo(x + width * 0.2, y - 3, x + width * 0.38, y + 3);
  context.quadraticCurveTo(x + width * 0.67, y - 2, x + width - 12, y + 2);
  context.quadraticCurveTo(x + width + 3, y + height * 0.27, x + width - 2, y + height * 0.53);
  context.quadraticCurveTo(x + width + 4, y + height * 0.79, x + width - 11, y + height - 2);
  context.quadraticCurveTo(x + width * 0.71, y + height + 4, x + width * 0.49, y + height - 2);
  context.quadraticCurveTo(x + width * 0.22, y + height + 3, x + 10, y + height - 2);
  context.quadraticCurveTo(x - 3, y + height * 0.73, x + 2, y + height * 0.46);
  context.quadraticCurveTo(x - 4, y + height * 0.19, x + 13, y + 2);
  context.closePath();
}

function drawWaxSeal(context, x, y, radius) {
  context.save();
  context.fillStyle = 'rgba(42,25,39,0.38)';
  traceWaxSeal(context, x + 2, y + 4, radius);
  context.fill();

  context.fillStyle = VIOLET_WAX;
  traceWaxSeal(context, x, y, radius);
  context.fill();
  context.strokeStyle = '#472a48';
  context.lineWidth = 2.5;
  context.stroke();

  context.fillStyle = '#42273f';
  context.beginPath();
  context.moveTo(x - radius * 0.91, y + radius * 0.18);
  context.bezierCurveTo(
    x - radius * 0.62,
    y + radius * 0.76,
    x - radius * 0.08,
    y + radius * 1.02,
    x + radius * 0.58,
    y + radius * 0.72,
  );
  context.bezierCurveTo(
    x + radius * 0.86,
    y + radius * 0.58,
    x + radius * 0.96,
    y + radius * 0.27,
    x + radius * 0.86,
    y + radius * 0.1,
  );
  context.bezierCurveTo(
    x + radius * 0.32,
    y + radius * 0.39,
    x - radius * 0.33,
    y + radius * 0.42,
    x - radius * 0.91,
    y + radius * 0.18,
  );
  context.closePath();
  context.fill();

  context.fillStyle = '#8b5a83';
  context.beginPath();
  context.moveTo(x - radius * 0.7, y - radius * 0.43);
  context.bezierCurveTo(
    x - radius * 0.53,
    y - radius * 0.82,
    x + radius * 0.07,
    y - radius * 0.94,
    x + radius * 0.42,
    y - radius * 0.63,
  );
  context.bezierCurveTo(
    x + radius * 0.09,
    y - radius * 0.48,
    x - radius * 0.35,
    y - radius * 0.27,
    x - radius * 0.7,
    y - radius * 0.43,
  );
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(235,190,221,0.42)';
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(x - radius * 0.58, y - radius * 0.33);
  context.bezierCurveTo(
    x - radius * 0.29,
    y - radius * 0.67,
    x + radius * 0.27,
    y - radius * 0.68,
    x + radius * 0.57,
    y - radius * 0.34,
  );
  context.stroke();
  context.restore();
}

function traceWaxSeal(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.08, y - radius * 0.98);
  context.bezierCurveTo(
    x + radius * 0.18,
    y - radius * 1.05,
    x + radius * 0.3,
    y - radius * 0.84,
    x + radius * 0.51,
    y - radius * 0.79,
  );
  context.bezierCurveTo(
    x + radius * 0.78,
    y - radius * 0.79,
    x + radius * 0.74,
    y - radius * 0.56,
    x + radius * 0.92,
    y - radius * 0.41,
  );
  context.bezierCurveTo(
    x + radius * 1.08,
    y - radius * 0.2,
    x + radius * 0.86,
    y - radius * 0.02,
    x + radius * 0.96,
    y + radius * 0.2,
  );
  context.bezierCurveTo(
    x + radius * 1.02,
    y + radius * 0.47,
    x + radius * 0.73,
    y + radius * 0.51,
    x + radius * 0.62,
    y + radius * 0.74,
  );
  context.bezierCurveTo(
    x + radius * 0.47,
    y + radius * 0.99,
    x + radius * 0.2,
    y + radius * 0.83,
    x - radius * 0.02,
    y + radius * 0.96,
  );
  context.bezierCurveTo(
    x - radius * 0.28,
    y + radius * 1.05,
    x - radius * 0.41,
    y + radius * 0.79,
    x - radius * 0.65,
    y + radius * 0.76,
  );
  context.bezierCurveTo(
    x - radius * 0.94,
    y + radius * 0.7,
    x - radius * 0.8,
    y + radius * 0.41,
    x - radius * 0.99,
    y + radius * 0.22,
  );
  context.bezierCurveTo(
    x - radius * 1.09,
    y - radius * 0.02,
    x - radius * 0.84,
    y - radius * 0.18,
    x - radius * 0.94,
    y - radius * 0.42,
  );
  context.bezierCurveTo(
    x - radius * 0.99,
    y - radius * 0.67,
    x - radius * 0.7,
    y - radius * 0.71,
    x - radius * 0.54,
    y - radius * 0.83,
  );
  context.bezierCurveTo(
    x - radius * 0.37,
    y - radius * 1.02,
    x - radius * 0.24,
    y - radius * 0.89,
    x - radius * 0.08,
    y - radius * 0.98,
  );
  context.closePath();
}

function drawKeyhole(context, x, y, size) {
  context.save();
  context.fillStyle = 'rgba(31,22,24,0.42)';
  traceKeyholePlate(context, x + 2, y + 3, size);
  context.fill();

  context.fillStyle = BRASS;
  traceKeyholePlate(context, x, y, size);
  context.fill();
  context.strokeStyle = BRASS_SHADOW;
  context.lineWidth = 2.25;
  context.stroke();

  context.fillStyle = BRASS_LIGHT;
  context.beginPath();
  context.moveTo(x - size * 0.62, y - size * 0.43);
  context.bezierCurveTo(
    x - size * 0.47,
    y - size * 0.83,
    x + size * 0.13,
    y - size * 1.04,
    x + size * 0.54,
    y - size * 0.57,
  );
  context.bezierCurveTo(
    x + size * 0.15,
    y - size * 0.61,
    x - size * 0.29,
    y - size * 0.36,
    x - size * 0.62,
    y - size * 0.43,
  );
  context.closePath();
  context.fill();

  context.fillStyle = BRASS_SHADOW;
  context.beginPath();
  context.moveTo(x - size * 0.48, y + size * 0.18);
  context.bezierCurveTo(
    x - size * 0.31,
    y + size * 0.92,
    x + size * 0.18,
    y + size * 1.12,
    x + size * 0.48,
    y + size * 0.25,
  );
  context.bezierCurveTo(
    x + size * 0.13,
    y + size * 0.46,
    x - size * 0.14,
    y + size * 0.42,
    x - size * 0.48,
    y + size * 0.18,
  );
  context.closePath();
  context.fill();

  context.fillStyle = DEEP_INK;
  traceKeyholeOpening(context, x, y, size);
  context.fill();

  context.strokeStyle = 'rgba(255,238,190,0.52)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(x - size * 0.55, y - size * 0.54);
  context.bezierCurveTo(
    x - size * 0.24,
    y - size * 0.94,
    x + size * 0.27,
    y - size * 0.89,
    x + size * 0.5,
    y - size * 0.52,
  );
  context.stroke();
  context.restore();
}

function traceKeyholePlate(context, x, y, size) {
  context.beginPath();
  context.moveTo(x - size * 0.05, y - size * 1.04);
  context.bezierCurveTo(
    x + size * 0.45,
    y - size * 1.08,
    x + size * 0.87,
    y - size * 0.69,
    x + size * 0.82,
    y - size * 0.2,
  );
  context.bezierCurveTo(
    x + size * 0.79,
    y + size * 0.13,
    x + size * 0.53,
    y + size * 0.25,
    x + size * 0.45,
    y + size * 0.63,
  );
  context.bezierCurveTo(
    x + size * 0.36,
    y + size * 1.08,
    x + size * 0.11,
    y + size * 1.16,
    x - size * 0.11,
    y + size * 1.08,
  );
  context.bezierCurveTo(
    x - size * 0.38,
    y + size * 1.01,
    x - size * 0.4,
    y + size * 0.68,
    x - size * 0.49,
    y + size * 0.39,
  );
  context.bezierCurveTo(
    x - size * 0.58,
    y + size * 0.1,
    x - size * 0.86,
    y - size * 0.16,
    x - size * 0.8,
    y - size * 0.49,
  );
  context.bezierCurveTo(
    x - size * 0.73,
    y - size * 0.88,
    x - size * 0.37,
    y - size * 1.01,
    x - size * 0.05,
    y - size * 1.04,
  );
  context.closePath();
}

function traceKeyholeOpening(context, x, y, size) {
  context.beginPath();
  context.moveTo(x - size * 0.03, y - size * 0.53);
  context.bezierCurveTo(
    x - size * 0.35,
    y - size * 0.55,
    x - size * 0.43,
    y - size * 0.15,
    x - size * 0.15,
    y + size * 0.02,
  );
  context.bezierCurveTo(
    x - size * 0.2,
    y + size * 0.18,
    x - size * 0.27,
    y + size * 0.42,
    x - size * 0.22,
    y + size * 0.62,
  );
  context.bezierCurveTo(
    x - size * 0.09,
    y + size * 0.72,
    x + size * 0.12,
    y + size * 0.69,
    x + size * 0.21,
    y + size * 0.57,
  );
  context.bezierCurveTo(
    x + size * 0.24,
    y + size * 0.38,
    x + size * 0.13,
    y + size * 0.17,
    x + size * 0.13,
    y + size * 0.01,
  );
  context.bezierCurveTo(
    x + size * 0.42,
    y - size * 0.18,
    x + size * 0.3,
    y - size * 0.51,
    x - size * 0.03,
    y - size * 0.53,
  );
  context.closePath();
}

function drawMapMark(context, x, y, size) {
  context.save();
  context.fillStyle = 'rgba(48,28,45,0.4)';
  traceMapPaper(context, x + 1.5, y + 2.5, size);
  context.fill();

  context.fillStyle = '#f8e8c5';
  traceMapPaper(context, x, y, size);
  context.fill();
  context.strokeStyle = '#3e283c';
  context.lineWidth = 1.5;
  context.stroke();

  context.fillStyle = '#fff5dc';
  context.beginPath();
  context.moveTo(x - size * 0.86, y - size * 0.5);
  context.bezierCurveTo(
    x - size * 0.68,
    y - size * 0.64,
    x - size * 0.47,
    y - size * 0.67,
    x - size * 0.2,
    y - size * 0.54,
  );
  context.bezierCurveTo(
    x - size * 0.26,
    y - size * 0.15,
    x - size * 0.23,
    y + size * 0.25,
    x - size * 0.18,
    y + size * 0.54,
  );
  context.bezierCurveTo(
    x - size * 0.43,
    y + size * 0.39,
    x - size * 0.64,
    y + size * 0.4,
    x - size * 0.75,
    y + size * 0.52,
  );
  context.bezierCurveTo(
    x - size * 0.83,
    y + size * 0.17,
    x - size * 0.91,
    y - size * 0.16,
    x - size * 0.86,
    y - size * 0.5,
  );
  context.closePath();
  context.fill();

  context.fillStyle = '#c99d61';
  context.beginPath();
  context.moveTo(x + size * 0.12, y - size * 0.48);
  context.bezierCurveTo(
    x + size * 0.38,
    y - size * 0.62,
    x + size * 0.67,
    y - size * 0.65,
    x + size * 0.88,
    y - size * 0.5,
  );
  context.bezierCurveTo(
    x + size * 0.91,
    y - size * 0.14,
    x + size * 0.82,
    y + size * 0.19,
    x + size * 0.79,
    y + size * 0.5,
  );
  context.bezierCurveTo(
    x + size * 0.6,
    y + size * 0.38,
    x + size * 0.34,
    y + size * 0.4,
    x + size * 0.1,
    y + size * 0.54,
  );
  context.bezierCurveTo(
    x + size * 0.17,
    y + size * 0.21,
    x + size * 0.18,
    y - size * 0.18,
    x + size * 0.12,
    y - size * 0.48,
  );
  context.closePath();
  context.fill();

  context.strokeStyle = '#5a3655';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(x - size * 0.16, y - size * 0.51);
  context.bezierCurveTo(
    x - size * 0.24,
    y - size * 0.08,
    x - size * 0.18,
    y + size * 0.25,
    x - size * 0.14,
    y + size * 0.55,
  );
  context.moveTo(x + size * 0.12, y - size * 0.49);
  context.bezierCurveTo(
    x + size * 0.2,
    y - size * 0.08,
    x + size * 0.15,
    y + size * 0.24,
    x + size * 0.11,
    y + size * 0.52,
  );
  context.stroke();

  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x - size * 0.62, y + size * 0.22);
  context.bezierCurveTo(
    x - size * 0.38,
    y - size * 0.18,
    x - size * 0.04,
    y + size * 0.29,
    x + size * 0.23,
    y - size * 0.12,
  );
  context.bezierCurveTo(
    x + size * 0.36,
    y - size * 0.3,
    x + size * 0.52,
    y - size * 0.2,
    x + size * 0.63,
    y - size * 0.37,
  );
  context.stroke();

  context.fillStyle = '#5a3655';
  context.beginPath();
  context.moveTo(x + size * 0.62, y - size * 0.5);
  context.bezierCurveTo(
    x + size * 0.78,
    y - size * 0.39,
    x + size * 0.72,
    y - size * 0.17,
    x + size * 0.61,
    y - size * 0.08,
  );
  context.bezierCurveTo(
    x + size * 0.5,
    y - size * 0.2,
    x + size * 0.47,
    y - size * 0.4,
    x + size * 0.62,
    y - size * 0.5,
  );
  context.closePath();
  context.fill();
  context.restore();
}

function traceMapPaper(context, x, y, size) {
  context.beginPath();
  context.moveTo(x - size * 0.88, y - size * 0.5);
  context.bezierCurveTo(
    x - size * 0.63,
    y - size * 0.7,
    x - size * 0.4,
    y - size * 0.66,
    x - size * 0.16,
    y - size * 0.51,
  );
  context.bezierCurveTo(
    x - size * 0.02,
    y - size * 0.61,
    x + size * 0.03,
    y - size * 0.59,
    x + size * 0.13,
    y - size * 0.49,
  );
  context.bezierCurveTo(
    x + size * 0.41,
    y - size * 0.68,
    x + size * 0.67,
    y - size * 0.65,
    x + size * 0.89,
    y - size * 0.48,
  );
  context.bezierCurveTo(
    x + size * 0.91,
    y - size * 0.12,
    x + size * 0.83,
    y + size * 0.22,
    x + size * 0.8,
    y + size * 0.52,
  );
  context.bezierCurveTo(
    x + size * 0.55,
    y + size * 0.37,
    x + size * 0.34,
    y + size * 0.43,
    x + size * 0.1,
    y + size * 0.57,
  );
  context.bezierCurveTo(
    x - size * 0.05,
    y + size * 0.46,
    x - size * 0.1,
    y + size * 0.45,
    x - size * 0.16,
    y + size * 0.56,
  );
  context.bezierCurveTo(
    x - size * 0.39,
    y + size * 0.39,
    x - size * 0.61,
    y + size * 0.41,
    x - size * 0.77,
    y + size * 0.54,
  );
  context.bezierCurveTo(
    x - size * 0.82,
    y + size * 0.18,
    x - size * 0.91,
    y - size * 0.13,
    x - size * 0.88,
    y - size * 0.5,
  );
  context.closePath();
}

function drawReplayMark(context, x, y, size) {
  context.save();
  context.fillStyle = 'rgba(47,27,44,0.42)';
  traceReplayRibbon(context, x + 1.5, y + 2.5, size);
  context.fill();

  context.fillStyle = '#f8e8c5';
  traceReplayRibbon(context, x, y, size);
  context.fill();
  context.strokeStyle = '#3e283c';
  context.lineWidth = 1.5;
  context.stroke();

  context.strokeStyle = '#fff6de';
  context.lineWidth = 1.5;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x + size * 0.63, y + size * 0.22);
  context.bezierCurveTo(
    x + size * 0.74,
    y - size * 0.39,
    x + size * 0.06,
    y - size * 0.77,
    x - size * 0.46,
    y - size * 0.35,
  );
  context.stroke();

  context.fillStyle = '#c99d61';
  context.beginPath();
  context.moveTo(x - size * 0.77, y - size * 0.66);
  context.bezierCurveTo(
    x - size * 0.59,
    y - size * 0.6,
    x - size * 0.36,
    y - size * 0.55,
    x - size * 0.18,
    y - size * 0.62,
  );
  context.bezierCurveTo(
    x - size * 0.33,
    y - size * 0.42,
    x - size * 0.47,
    y - size * 0.2,
    x - size * 0.58,
    y - size * 0.03,
  );
  context.bezierCurveTo(
    x - size * 0.66,
    y - size * 0.24,
    x - size * 0.72,
    y - size * 0.48,
    x - size * 0.77,
    y - size * 0.66,
  );
  context.closePath();
  context.fill();

  context.fillStyle = '#fff6de';
  context.beginPath();
  context.moveTo(x - size * 0.68, y - size * 0.57);
  context.bezierCurveTo(
    x - size * 0.55,
    y - size * 0.51,
    x - size * 0.43,
    y - size * 0.48,
    x - size * 0.32,
    y - size * 0.5,
  );
  context.bezierCurveTo(
    x - size * 0.43,
    y - size * 0.39,
    x - size * 0.52,
    y - size * 0.25,
    x - size * 0.58,
    y - size * 0.16,
  );
  context.bezierCurveTo(
    x - size * 0.61,
    y - size * 0.31,
    x - size * 0.65,
    y - size * 0.46,
    x - size * 0.68,
    y - size * 0.57,
  );
  context.closePath();
  context.fill();
  context.restore();
}

function traceReplayRibbon(context, x, y, size) {
  context.beginPath();
  context.moveTo(x + size * 0.78, y + size * 0.42);
  context.bezierCurveTo(
    x + size * 0.99,
    y - size * 0.22,
    x + size * 0.72,
    y - size * 0.76,
    x + size * 0.17,
    y - size * 0.91,
  );
  context.bezierCurveTo(
    x - size * 0.12,
    y - size * 1.01,
    x - size * 0.42,
    y - size * 0.82,
    x - size * 0.62,
    y - size * 0.61,
  );
  context.bezierCurveTo(
    x - size * 0.7,
    y - size * 0.54,
    x - size * 0.76,
    y - size * 0.5,
    x - size * 0.83,
    y - size * 0.53,
  );
  context.bezierCurveTo(
    x - size * 0.68,
    y - size * 0.26,
    x - size * 0.53,
    y - size * 0.03,
    x - size * 0.44,
    y + size * 0.18,
  );
  context.bezierCurveTo(
    x - size * 0.35,
    y + size * 0.02,
    x - size * 0.24,
    y - size * 0.12,
    x - size * 0.08,
    y - size * 0.2,
  );
  context.bezierCurveTo(
    x + size * 0.28,
    y - size * 0.4,
    x + size * 0.61,
    y - size * 0.08,
    x + size * 0.48,
    y + size * 0.27,
  );
  context.bezierCurveTo(
    x + size * 0.4,
    y + size * 0.5,
    x + size * 0.57,
    y + size * 0.57,
    x + size * 0.78,
    y + size * 0.42,
  );
  context.closePath();
}

function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}
