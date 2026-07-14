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
  context.strokeStyle = 'rgba(238,199,116,0.5)';
  context.lineWidth = 2;
  context.setLineDash?.([7, 8]);
  context.beginPath();
  context.moveTo(rect.x + 28, rect.y + 24);
  context.bezierCurveTo(
    rect.x + rect.width * 0.3,
    rect.y + 17,
    rect.x + rect.width * 0.7,
    rect.y + 30,
    rect.x + rect.width - 28,
    rect.y + 22,
  );
  context.stroke();
  context.setLineDash?.([]);
  context.restore();
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
  context.lineTo(rect.x + rect.width - 16, rect.y + rect.height * 0.37);
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
  context.lineTo(rect.x + rect.width - 8, rect.y + rect.height - 9);
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
  context.fillStyle = VIOLET_WAX;
  context.beginPath();
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const ripple = index % 2 === 0 ? 1 : 0.88;
    const pointX = x + Math.cos(angle) * radius * ripple;
    const pointY = y + Math.sin(angle) * radius * ripple;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 3;
  context.stroke();
  context.restore();
}

function drawKeyhole(context, x, y, size) {
  context.save();
  context.fillStyle = BRASS;
  context.beginPath();
  context.moveTo(x, y - size);
  context.bezierCurveTo(x - size * 0.75, y - size, x - size, y - size * 0.38, x - size * 0.62, y + size * 0.08);
  context.lineTo(x - size * 0.35, y + size);
  context.quadraticCurveTo(x, y + size * 1.18, x + size * 0.35, y + size);
  context.lineTo(x + size * 0.62, y + size * 0.08);
  context.bezierCurveTo(x + size, y - size * 0.38, x + size * 0.75, y - size, x, y - size);
  context.closePath();
  context.fill();
  context.strokeStyle = BRASS_LIGHT;
  context.lineWidth = 2.5;
  context.stroke();
  context.fillStyle = DEEP_INK;
  context.beginPath();
  context.moveTo(x, y - size * 0.48);
  context.bezierCurveTo(x - size * 0.33, y - size * 0.47, x - size * 0.36, y - size * 0.08, x - size * 0.12, y + size * 0.05);
  context.lineTo(x - size * 0.18, y + size * 0.58);
  context.lineTo(x + size * 0.18, y + size * 0.58);
  context.lineTo(x + size * 0.12, y + size * 0.05);
  context.bezierCurveTo(x + size * 0.36, y - size * 0.08, x + size * 0.33, y - size * 0.47, x, y - size * 0.48);
  context.closePath();
  context.fill();
  context.restore();
}

function drawMapMark(context, x, y, size) {
  context.save();
  context.strokeStyle = '#fff1cf';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x - size, y - size * 0.55);
  context.quadraticCurveTo(x - size * 0.48, y - size * 0.83, x, y - size * 0.5);
  context.quadraticCurveTo(x + size * 0.5, y - size * 0.82, x + size, y - size * 0.52);
  context.lineTo(x + size * 0.82, y + size * 0.65);
  context.quadraticCurveTo(x + size * 0.43, y + size * 0.42, x, y + size * 0.72);
  context.quadraticCurveTo(x - size * 0.45, y + size * 0.42, x - size * 0.82, y + size * 0.66);
  context.closePath();
  context.stroke();
  context.beginPath();
  context.moveTo(x, y - size * 0.48);
  context.quadraticCurveTo(x - 4, y, x, y + size * 0.7);
  context.stroke();
  context.restore();
}

function drawReplayMark(context, x, y, size) {
  context.save();
  context.strokeStyle = '#fff1cf';
  context.fillStyle = '#fff1cf';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x + size * 0.7, y + size * 0.36);
  context.bezierCurveTo(
    x + size * 0.95,
    y - size * 0.5,
    x + size * 0.1,
    y - size * 0.92,
    x - size * 0.56,
    y - size * 0.4,
  );
  context.stroke();
  context.beginPath();
  context.moveTo(x - size * 0.78, y - size * 0.68);
  context.lineTo(x - size * 0.56, y - size * 0.4);
  context.lineTo(x - size * 0.25, y - size * 0.61);
  context.closePath();
  context.fill();
  context.restore();
}

function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}
