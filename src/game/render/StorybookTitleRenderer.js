import { WORLD } from '../config.js';

const ARTBOARD = Object.freeze({ x: 0, y: 0, width: WORLD.width, height: WORLD.height });
const TAU = Math.PI * 2;
const OUTLINE = '#3a2d22';

// The deterministic VU-06 composition is integrated into the live title. The
// shared painted lake-vista asset remains paused for Pete's review, so this
// status describes the code-only title rather than claiming that painting.
export const STORYBOOK_TITLE_RENDERER_STATUS = 'code-only-integrated';
export const STORYBOOK_TITLE_PAINTED_ASSET_STATUS = 'paused-for-pete-review';

export const STORYBOOK_TITLE_MAJOR_REGIONS = Object.freeze([
  region('sky', '#191a35', '#111126', '#354767'),
  region('moon', '#d9bd78', '#927a5d', '#f4e1a8'),
  region('castle', '#655e61', '#353544', '#9a856e'),
  region('lake', '#1c2c49', '#11172d', '#48617a'),
  region('mist', 'rgba(151,160,171,0.18)', 'rgba(43,45,65,0.25)', 'rgba(224,214,186,0.16)'),
  region('shore', '#24232d', '#121522', '#615044'),
]);

const TITLE_SAFE_AREAS = Object.freeze({
  masthead: Object.freeze({ x: 270, y: 52, width: 650, height: 244 }),
  envelope: Object.freeze({ x: 430, y: 372, width: 420, height: 180 }),
});

const STARS = Object.freeze([
  [54, 67, 2.6, 0.3], [279, 74, 2.1, 1.6], [386, 122, 2.8, 2.9],
  [485, 53, 1.9, 4.2], [603, 103, 2.4, 5.5], [742, 62, 2.2, 0.8],
  [858, 128, 2.9, 2.1], [958, 73, 1.8, 3.4], [1096, 94, 2.5, 4.7],
  [1217, 56, 2.1, 6], [1178, 231, 1.8, 1.25], [1010, 259, 2.2, 2.55],
  [335, 245, 1.7, 3.85], [74, 281, 2.1, 5.15],
]);

const TOWERS = Object.freeze([
  Object.freeze({ x: 190, baseY: 451, width: 74, topY: 302, roof: 51, phase: 0.35, rows: 3 }),
  Object.freeze({ x: 371, baseY: 458, width: 86, topY: 266, roof: 64, phase: 1.45, rows: 4 }),
  Object.freeze({ x: 615, baseY: 461, width: 112, topY: 226, roof: 78, phase: 2.7, rows: 5 }),
  Object.freeze({ x: 893, baseY: 456, width: 82, topY: 289, roof: 57, phase: 4.05, rows: 3 }),
  Object.freeze({ x: 1053, baseY: 452, width: 69, topY: 318, roof: 47, phase: 5.3, rows: 3 }),
]);

const HALLS = Object.freeze([
  Object.freeze({ x: 231, y: 350, width: 191, height: 108, peakX: 0.42, phase: 0.8, columns: 4 }),
  Object.freeze({ x: 433, y: 332, width: 194, height: 129, peakX: 0.56, phase: 2.1, columns: 4 }),
  Object.freeze({ x: 700, y: 323, width: 211, height: 137, peakX: 0.39, phase: 3.35, columns: 4 }),
  Object.freeze({ x: 956, y: 366, width: 132, height: 91, peakX: 0.61, phase: 4.7, columns: 3 }),
]);

export class StorybookTitleRenderer {
  constructor({ characterRenderer } = {}) {
    this.characterRenderer = requireCharacterRenderer(characterRenderer);
  }

  draw(context, time = 0, options = {}) {
    const presentation = createStorybookTitlePresentation(time, options);
    drawStorybookTitlePresentation(context, presentation, {
      characterRenderer: this.characterRenderer,
    });
    return presentation;
  }
}

export function createStorybookTitlePresentation(
  time = 0,
  { frame = ARTBOARD, reducedMotion = false } = {},
) {
  const normalizedFrame = normalizeFrame(frame);
  const sceneTime = reducedMotion ? 0 : normalizeTime(time);
  const mistOffsets = [
    Math.sin(sceneTime * 0.11 + 0.4) * 11,
    Math.sin(sceneTime * 0.085 + 2.2) * 15,
    Math.sin(sceneTime * 0.13 + 4.1) * 9,
  ];
  const stars = STARS.map(([x, y, radius, phase], index) => Object.freeze({
    x,
    y,
    radius,
    phase,
    opacity: reducedMotion
      ? 0.52
      : 0.39 + (Math.sin(sceneTime * 0.74 + phase + index * 0.17) + 1) * 0.12,
  }));
  const moon = Object.freeze({
    x: 145 + Math.sin(sceneTime * 0.09) * 1.8,
    y: 119 + Math.sin(sceneTime * 0.07 + 1.4) * 1.2,
    radius: 72,
    phase: 0.73,
  });
  const hero = Object.freeze({
    violet: Object.freeze({
      characterId: 'character.violet',
      surface: 'world',
      x: 1081,
      y: 704,
      scale: 0.78,
      facing: 'left',
      pose: 'wonder',
      wand: false,
      appearance: 'casual',
    }),
    owl: Object.freeze({
      characterId: 'character.post-owl',
      surface: 'world',
      appearance: 'post',
      pose: 'perch',
      x: 1181,
      y: 625,
      scale: 0.54,
      facing: 'left',
      phase: 4.9,
      lookX: reducedMotion ? -0.56 : -0.56 + Math.sin(sceneTime * 0.31) * 0.08,
      lookY: reducedMotion ? 0.12 : 0.12 + Math.sin(sceneTime * 0.23 + 0.8) * 0.05,
      reducedMotion,
    }),
    bounds: Object.freeze({ x: 1005, y: 500, width: 232, height: 212 }),
  });

  return Object.freeze({
    kind: STORYBOOK_TITLE_RENDERER_STATUS,
    paintedAssetStatus: STORYBOOK_TITLE_PAINTED_ASSET_STATUS,
    frame: normalizedFrame,
    sceneTime,
    reducedMotion: Boolean(reducedMotion),
    safeAreas: Object.freeze({
      masthead: transformRect(TITLE_SAFE_AREAS.masthead, normalizedFrame),
      envelope: transformRect(TITLE_SAFE_AREAS.envelope, normalizedFrame),
    }),
    majorRegions: STORYBOOK_TITLE_MAJOR_REGIONS,
    moon,
    stars: Object.freeze(stars),
    mistOffsets: Object.freeze(mistOffsets),
    waterShift: Math.sin(sceneTime * 0.17 + 1.1) * 3.2,
    hero,
  });
}

export function drawStorybookTitlePresentation(
  context,
  presentation,
  { characterRenderer } = {},
) {
  if (!presentation || presentation.kind !== STORYBOOK_TITLE_RENDERER_STATUS) {
    throw new TypeError('drawStorybookTitlePresentation requires a storybook title presentation.');
  }
  const renderer = requireCharacterRenderer(characterRenderer);

  const scaleX = presentation.frame.width / WORLD.width;
  const scaleY = presentation.frame.height / WORLD.height;
  context.save();
  context.translate(presentation.frame.x, presentation.frame.y);
  context.scale(scaleX, scaleY);

  drawLayeredSky(context);
  drawStars(context, presentation.stars);
  drawMoon(context, presentation.moon);
  drawDistantHills(context);
  drawLayeredLake(context, presentation.waterShift);
  drawReflections(context, presentation.waterShift);
  drawCastle(context);
  drawMist(context, presentation.mistOffsets);
  drawForegroundShore(context);
  drawHeroPerch(context);

  renderer.draw(context, presentation.hero.violet, presentation.sceneTime);
  renderer.draw(context, presentation.hero.owl, presentation.sceneTime);
  context.restore();
}

function requireCharacterRenderer(characterRenderer) {
  if (!characterRenderer || typeof characterRenderer.draw !== 'function') {
    throw new TypeError('StorybookTitleRenderer requires an injected character renderer with draw().');
  }
  return characterRenderer;
}

function drawLayeredSky(context) {
  context.fillStyle = '#191a35';
  traceBackdrop(context, -24, -28, WORLD.width + 48, WORLD.height + 56, 0.2);
  context.fill();

  context.fillStyle = '#111126';
  traceSkyWash(context, 656, -60, 710, 468, 2.4);
  context.fill();

  context.fillStyle = '#354767';
  traceSkyWash(context, -125, -46, 705, 454, 0.7);
  context.fill();

  context.fillStyle = 'rgba(71,50,92,0.38)';
  traceSkyWash(context, 337, 126, 807, 303, 4.1);
  context.fill();

  context.strokeStyle = 'rgba(233,205,145,0.07)';
  context.lineWidth = 3.2;
  for (let index = 0; index < 5; index += 1) {
    const y = 89 + index * 53;
    context.beginPath();
    context.moveTo(-35, y + index * 2);
    context.bezierCurveTo(242, y - 19, 431, y + 26, 697, y + 1);
    context.bezierCurveTo(891, y - 17, 1089, y + 15, 1318, y - 6);
    context.stroke();
  }
}

function drawStars(context, stars) {
  for (const star of stars) {
    context.save();
    context.globalAlpha = star.opacity;
    context.fillStyle = '#d8b965';
    traceBrushStar(context, star.x, star.y, star.radius * 1.8, star.phase);
    context.fill();
    context.fillStyle = '#f2dfad';
    traceBrushStar(context, star.x - 0.3, star.y - 0.4, star.radius * 0.72, star.phase + 0.4);
    context.fill();
    context.restore();
  }
}

function drawMoon(context, moon) {
  context.fillStyle = 'rgba(218,195,132,0.07)';
  traceOrganicBlob(context, moon.x, moon.y, moon.radius * 1.72, moon.radius * 1.63, moon.phase + 0.2, 0.075);
  context.fill();
  context.fillStyle = 'rgba(228,205,142,0.12)';
  traceOrganicBlob(context, moon.x - 3, moon.y + 1, moon.radius * 1.28, moon.radius * 1.22, moon.phase + 0.6, 0.062);
  context.fill();

  context.fillStyle = '#d9bd78';
  traceOrganicBlob(context, moon.x, moon.y, moon.radius, moon.radius * 0.97, moon.phase, 0.045);
  context.fill();
  context.strokeStyle = '#7e6854';
  context.lineWidth = 3.4;
  context.stroke();

  context.fillStyle = 'rgba(105,82,70,0.27)';
  traceOrganicBlob(context, moon.x + 21, moon.y + 14, 22, 18, 1.8, 0.14);
  context.fill();
  traceOrganicBlob(context, moon.x - 27, moon.y - 12, 14, 12, 3.2, 0.16);
  context.fill();
  context.fillStyle = 'rgba(244,225,168,0.66)';
  traceMoonHighlight(context, moon.x, moon.y, moon.radius);
  context.fill();
}

function drawDistantHills(context) {
  context.fillStyle = '#1b2139';
  traceHillBand(context, 321, 486, 0.4);
  context.fill();
  context.fillStyle = '#2c3650';
  traceHillBand(context, 348, 482, 2.2);
  context.fill();
  context.fillStyle = 'rgba(107,105,109,0.18)';
  traceHillHighlight(context, 331, 3.1);
  context.fill();
}

function drawLayeredLake(context, waterShift) {
  context.fillStyle = '#1c2c49';
  traceLakeBand(context, 409, 748, 0.3);
  context.fill();
  context.fillStyle = '#11172d';
  traceLakeBand(context, 536, 760, 2.1);
  context.fill();
  context.fillStyle = 'rgba(72,97,122,0.46)';
  traceLakeBand(context, 426 + waterShift * 0.18, 525, 3.8);
  context.fill();

  for (let index = 0; index < 13; index += 1) {
    const y = 443 + index * 15.2;
    const drift = Math.sin(index * 1.73) * 18 + waterShift * (index % 2 ? -0.4 : 0.5);
    context.fillStyle = index % 3 === 0
      ? 'rgba(103,123,139,0.18)'
      : 'rgba(44,67,94,0.24)';
    traceBrushStroke(context, 62 + drift, y, 1110 - index * 17, 5.2 + index * 0.12, index * 0.67);
    context.fill();
  }
}

function drawReflections(context, waterShift) {
  context.fillStyle = 'rgba(51,48,61,0.36)';
  const reflectedMasses = [
    [170, 457, 110, 116, 0.5], [335, 456, 136, 154, 1.4],
    [556, 459, 184, 183, 2.6], [805, 458, 142, 139, 3.7],
    [987, 455, 118, 108, 4.8],
  ];
  for (const [x, y, width, height, phase] of reflectedMasses) {
    traceReflectionWash(context, x, y, width, height, phase, waterShift);
    context.fill();
  }

  for (let index = 0; index < 11; index += 1) {
    const progress = index / 10;
    const y = 448 + progress * 188;
    const width = 17 + progress * 96 + Math.sin(index * 1.4) * 8;
    const x = 145 - width / 2 + Math.sin(index * 2.1) * 13 + waterShift;
    context.fillStyle = index % 3 === 0
      ? 'rgba(244,225,168,0.32)'
      : 'rgba(205,176,108,0.19)';
    traceBrushStroke(context, x, y, width, 5 + progress * 4, index * 0.83);
    context.fill();
  }

  const windowReflections = [
    [205, 471], [246, 486], [380, 469], [412, 491], [613, 470], [666, 481],
    [724, 499], [889, 476], [928, 493], [1046, 478],
  ];
  for (let index = 0; index < windowReflections.length; index += 1) {
    const [x, y] = windowReflections[index];
    context.fillStyle = 'rgba(217,138,61,0.2)';
    traceBrushStroke(context, x - 4 + waterShift * 0.25, y, 11 + index % 3 * 4, 14 + index % 2 * 7, index * 0.91);
    context.fill();
    context.fillStyle = 'rgba(244,213,141,0.24)';
    traceBrushStroke(context, x - 2 + waterShift * 0.2, y + 3, 6 + index % 2 * 3, 8 + index % 3 * 3, index + 0.4);
    context.fill();
  }
}

function drawCastle(context) {
  drawCastleTerrace(context);
  for (const hall of HALLS) drawCastleHall(context, hall);
  for (const tower of TOWERS) drawCastleTower(context, tower);
  drawCastleBridge(context);
}

function drawCastleTerrace(context) {
  context.fillStyle = '#494650';
  traceCastleTerrace(context, 128, 412, 1005, 61, 0.6);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 5.4;
  context.stroke();

  context.fillStyle = '#2e303f';
  traceCastleTerrace(context, 153, 438, 954, 34, 2.2);
  context.fill();
  context.fillStyle = 'rgba(154,133,110,0.35)';
  traceBrushStroke(context, 151, 416, 576, 11, 1.7);
  context.fill();
}

function drawCastleTower(context, tower) {
  context.fillStyle = '#2a2938';
  traceTowerBody(context, { ...tower, x: tower.x + 7, baseY: tower.baseY + 8 }, 0.14);
  context.fill();

  context.fillStyle = '#655e61';
  traceTowerBody(context, tower, 0);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 4.1 + (tower.phase % 1) * 1.1;
  context.stroke();

  context.fillStyle = '#3a3947';
  traceTowerShadow(context, tower);
  context.fill();
  context.fillStyle = 'rgba(174,151,120,0.36)';
  traceTowerHighlight(context, tower);
  context.fill();
  drawTowerRoof(context, tower);
  drawTowerWindows(context, tower);
  drawStoneSeams(context, tower);
}

function drawTowerRoof(context, tower) {
  context.fillStyle = '#29263a';
  traceTowerRoof(context, tower, 7, 9);
  context.fill();
  context.fillStyle = '#4d4052';
  traceTowerRoof(context, tower, 0, 0);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 4.3;
  context.stroke();
  context.fillStyle = 'rgba(166,128,108,0.3)';
  traceRoofHighlight(context, tower);
  context.fill();
}

function drawTowerWindows(context, tower) {
  const rowGap = (tower.baseY - tower.topY - 38) / Math.max(1, tower.rows);
  for (let row = 0; row < tower.rows; row += 1) {
    const y = tower.topY + 28 + row * rowGap;
    const pair = tower.width > 82 && row % 2 === 1;
    const positions = pair ? [-tower.width * 0.2, tower.width * 0.2] : [0];
    for (let column = 0; column < positions.length; column += 1) {
      const x = tower.x + positions[column] + Math.sin(tower.phase + row * 1.8 + column) * 1.7;
      drawLitWindow(context, x, y, 9.5, 17, tower.phase + row * 0.8 + column * 1.3);
    }
  }
}

function drawCastleHall(context, hall) {
  context.fillStyle = '#2a2938';
  traceHallBody(context, { ...hall, x: hall.x + 7, y: hall.y + 8 }, 0.1);
  context.fill();
  context.fillStyle = '#5c575d';
  traceHallBody(context, hall, 0);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 4.4;
  context.stroke();

  context.fillStyle = '#343443';
  traceHallShadow(context, hall);
  context.fill();
  context.fillStyle = 'rgba(169,145,116,0.31)';
  traceHallHighlight(context, hall);
  context.fill();
  drawHallRoof(context, hall);

  const gap = hall.width / (hall.columns + 1);
  for (let column = 0; column < hall.columns; column += 1) {
    const x = hall.x + gap * (column + 1) + Math.sin(hall.phase + column * 1.6) * 2;
    const y = hall.y + hall.height * 0.48 + Math.cos(hall.phase + column) * 2;
    drawLitWindow(context, x, y, 10.5, 18, hall.phase + column * 0.77);
    if (hall.height > 115 && column % 2 === 0) {
      drawLitWindow(context, x + 3, y + 39, 8.2, 14, hall.phase + column + 2.1);
    }
  }
}

function drawHallRoof(context, hall) {
  context.fillStyle = '#242337';
  traceHallRoof(context, { ...hall, x: hall.x + 6, y: hall.y + 7 });
  context.fill();
  context.fillStyle = '#514353';
  traceHallRoof(context, hall);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 4.2;
  context.stroke();
  context.fillStyle = 'rgba(184,142,113,0.27)';
  traceHallRoofHighlight(context, hall);
  context.fill();
}

function drawLitWindow(context, x, y, width, height, phase) {
  context.fillStyle = '#352e31';
  traceOrganicWindow(context, x + 1.5, y + 2, width + 6, height + 6, phase + 0.2);
  context.fill();
  context.fillStyle = '#d98a3d';
  traceOrganicWindow(context, x, y, width, height, phase);
  context.fill();
  context.strokeStyle = '#4a3528';
  context.lineWidth = 1.7;
  context.stroke();
  context.fillStyle = 'rgba(244,213,141,0.76)';
  traceOrganicWindow(context, x - width * 0.12, y - height * 0.14, width * 0.48, height * 0.56, phase + 1.4);
  context.fill();
}

function drawStoneSeams(context, tower) {
  context.strokeStyle = 'rgba(45,42,49,0.31)';
  context.lineWidth = 1.4;
  const height = tower.baseY - tower.topY;
  for (let index = 1; index < 4; index += 1) {
    const y = tower.topY + height * index / 4;
    context.beginPath();
    context.moveTo(tower.x - tower.width * 0.42, y);
    context.bezierCurveTo(
      tower.x - tower.width * 0.12,
      y + Math.sin(tower.phase + index) * 2.5,
      tower.x + tower.width * 0.19,
      y - Math.cos(tower.phase + index) * 2,
      tower.x + tower.width * 0.42,
      y + 1,
    );
    context.stroke();
  }
}

function drawCastleBridge(context) {
  context.fillStyle = '#2e2e3c';
  traceBridge(context, 467, 409, 181, 50, 0.6);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = 'rgba(149,126,104,0.34)';
  traceBridgeHighlight(context, 475, 411, 165, 18, 1.3);
  context.fill();
}

function drawMist(context, offsets) {
  const layers = [
    { y: 382, height: 43, offset: offsets[0], phase: 0.5 },
    { y: 447, height: 54, offset: offsets[1], phase: 2.3 },
    { y: 525, height: 61, offset: offsets[2], phase: 4.1 },
  ];
  for (const layer of layers) {
    context.fillStyle = 'rgba(43,45,65,0.25)';
    traceMistRibbon(context, layer.y + 9, layer.height, layer.offset + 10, layer.phase + 0.5);
    context.fill();
    context.fillStyle = 'rgba(151,160,171,0.18)';
    traceMistRibbon(context, layer.y, layer.height, layer.offset, layer.phase);
    context.fill();
    context.fillStyle = 'rgba(224,214,186,0.16)';
    traceMistRibbon(context, layer.y - 6, layer.height * 0.38, layer.offset - 7, layer.phase + 1.1);
    context.fill();
  }
}

function drawForegroundShore(context) {
  context.fillStyle = '#24232d';
  traceShore(context, 635, 0.8);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 5.2;
  context.stroke();

  context.fillStyle = '#121522';
  traceShore(context, 685, 2.4);
  context.fill();
  context.fillStyle = 'rgba(97,80,68,0.68)';
  traceShoreHighlight(context, 638, 3.7);
  context.fill();

  for (let index = 0; index < 13; index += 1) {
    const x = 34 + index * 96 + Math.sin(index * 1.4) * 18;
    const y = 664 + Math.cos(index * 0.9) * 8;
    drawShoreStone(context, x, y, 17 + index % 4 * 4, index * 0.73);
  }
  drawReeds(context);
}

function drawHeroPerch(context) {
  context.fillStyle = '#292633';
  traceOrganicBlob(context, 1184, 643, 58, 25, 2.1, 0.15);
  context.fill();
  context.fillStyle = '#6d5e53';
  traceOrganicBlob(context, 1178, 635, 51, 22, 1.6, 0.12);
  context.fill();
  context.strokeStyle = OUTLINE;
  context.lineWidth = 3.8;
  context.stroke();
  context.fillStyle = 'rgba(184,151,112,0.42)';
  traceBrushStroke(context, 1148, 625, 45, 7, 4.3);
  context.fill();
}

function drawShoreStone(context, x, y, radius, phase) {
  context.fillStyle = '#171823';
  traceOrganicBlob(context, x + 3, y + 5, radius * 1.1, radius * 0.59, phase + 0.4, 0.18);
  context.fill();
  context.fillStyle = '#50443e';
  traceOrganicBlob(context, x, y, radius, radius * 0.55, phase, 0.16);
  context.fill();
  context.fillStyle = 'rgba(190,155,112,0.24)';
  traceOrganicBlob(context, x - radius * 0.24, y - radius * 0.16, radius * 0.45, radius * 0.18, phase + 2, 0.19);
  context.fill();
}

function drawReeds(context) {
  context.strokeStyle = '#3f4635';
  context.lineCap = 'round';
  for (let index = 0; index < 9; index += 1) {
    const x = 83 + index * 22 + Math.sin(index * 2.1) * 5;
    const height = 27 + index % 4 * 8;
    context.lineWidth = 2.4 + index % 3 * 0.35;
    context.beginPath();
    context.moveTo(x, 670);
    context.bezierCurveTo(x - 5, 657, x + 8, 643, x + Math.sin(index) * 7, 670 - height);
    context.stroke();
    context.strokeStyle = index % 2 ? '#786642' : '#5e563b';
    context.beginPath();
    context.moveTo(x + Math.sin(index) * 7, 670 - height);
    context.bezierCurveTo(x + 8, 665 - height, x + 11, 670 - height, x + 7, 676 - height);
    context.stroke();
    context.strokeStyle = '#3f4635';
  }
}

function traceBackdrop(context, x, y, width, height, phase) {
  context.beginPath();
  context.moveTo(x + 8, y + 2);
  context.bezierCurveTo(x + width * 0.3, y - 8 + phase, x + width * 0.71, y + 9, x + width - 3, y + 3);
  context.bezierCurveTo(x + width + 8, y + height * 0.26, x + width - 7, y + height * 0.73, x + width + 2, y + height - 5);
  context.bezierCurveTo(x + width * 0.69, y + height + 7, x + width * 0.31, y + height - 6, x + 2, y + height + 2);
  context.bezierCurveTo(x - 7, y + height * 0.7, x + 8, y + height * 0.27, x + 8, y + 2);
  context.closePath();
}

function traceSkyWash(context, x, y, width, height, phase) {
  context.beginPath();
  context.moveTo(x + width * 0.08, y);
  context.bezierCurveTo(x + width * 0.45, y + Math.sin(phase) * 14, x + width * 0.92, y - 4, x + width, y + height * 0.18);
  context.bezierCurveTo(x + width * 0.89, y + height * 0.58, x + width * 0.62, y + height * 0.88, x + width * 0.19, y + height);
  context.bezierCurveTo(x - width * 0.04, y + height * 0.67, x + width * 0.01, y + height * 0.23, x + width * 0.08, y);
  context.closePath();
}

function traceOrganicBlob(context, centerX, centerY, radiusX, radiusY, phase, wobble) {
  const pointCount = 12;
  const points = [];
  for (let index = 0; index < pointCount; index += 1) {
    const angle = index * TAU / pointCount;
    const variation = 1 + Math.sin(phase + index * 1.73) * wobble
      + Math.cos(phase * 0.7 + index * 2.31) * wobble * 0.38;
    points.push([
      centerX + Math.cos(angle) * radiusX * variation,
      centerY + Math.sin(angle) * radiusY * variation,
    ]);
  }
  context.beginPath();
  context.moveTo((points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2);
  for (let index = 1; index <= pointCount; index += 1) {
    const point = points[index % pointCount];
    const next = points[(index + 1) % pointCount];
    context.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
  }
  context.closePath();
}

function traceMoonHighlight(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.62, y - radius * 0.45);
  context.bezierCurveTo(x - radius * 0.4, y - radius * 0.82, x + radius * 0.2, y - radius * 0.91, x + radius * 0.57, y - radius * 0.52);
  context.bezierCurveTo(x + radius * 0.08, y - radius * 0.55, x - radius * 0.22, y - radius * 0.28, x - radius * 0.62, y - radius * 0.45);
  context.closePath();
}

function traceBrushStar(context, x, y, radius, phase) {
  const points = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 4;
    const spoke = index % 2 === 0 ? 1 : 0.23 + Math.sin(phase + index) * 0.035;
    const skew = 1 + Math.cos(phase * 0.8 + index * 1.4) * 0.08;
    points.push([x + Math.cos(angle) * radius * spoke * skew, y + Math.sin(angle) * radius * spoke / skew]);
  }
  context.beginPath();
  context.moveTo((points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2);
  for (let index = 1; index <= points.length; index += 1) {
    const point = points[index % points.length];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
  }
  context.closePath();
}

function traceHillBand(context, y, bottom, phase) {
  context.beginPath();
  context.moveTo(-40, bottom + 18);
  context.bezierCurveTo(-22, y + 29, 77, y - 18, 188, y + 4);
  context.bezierCurveTo(321, y + 33 + Math.sin(phase) * 8, 430, y - 38, 568, y - 3);
  context.bezierCurveTo(736, y + 37, 861, y - 31 + Math.cos(phase) * 7, 1004, y + 5);
  context.bezierCurveTo(1118, y + 31, 1231, y - 13, 1324, y + 16);
  context.bezierCurveTo(1341, bottom, 1300, bottom + 18, 1248, bottom + 16);
  context.bezierCurveTo(858, bottom - 8, 423, bottom + 11, -40, bottom + 18);
  context.closePath();
}

function traceHillHighlight(context, y, phase) {
  context.beginPath();
  context.moveTo(-20, y + 25);
  context.bezierCurveTo(132, y - 21, 241, y + 14, 386, y - 4);
  context.bezierCurveTo(502, y - 21, 603, y + 7, 718, y - 8 + Math.sin(phase) * 4);
  context.bezierCurveTo(534, y + 19, 252, y + 36, -20, y + 25);
  context.closePath();
}

function traceLakeBand(context, top, bottom, phase) {
  context.beginPath();
  context.moveTo(-35, top + Math.sin(phase) * 5);
  context.bezierCurveTo(236, top - 13, 411, top + 16, 653, top - 2);
  context.bezierCurveTo(858, top - 17, 1081, top + 15, 1318, top - 5);
  context.bezierCurveTo(1337, bottom - 11, 1288, bottom + 14, 1217, bottom + 10);
  context.bezierCurveTo(825, bottom - 5, 397, bottom + 9, -35, bottom + 16);
  context.bezierCurveTo(-51, bottom * 0.69, -44, top * 1.08, -35, top + Math.sin(phase) * 5);
  context.closePath();
}

function traceBrushStroke(context, x, y, width, height, phase) {
  const leftLift = Math.sin(phase) * height * 0.22;
  const rightLift = Math.cos(phase * 1.3) * height * 0.28;
  context.beginPath();
  context.moveTo(x + 2, y + leftLift);
  context.bezierCurveTo(x + width * 0.29, y - height * 0.72, x + width * 0.72, y + height * 0.52, x + width - 1, y + rightLift);
  context.bezierCurveTo(x + width * 0.74, y + height, x + width * 0.25, y + height * 0.69, x + 2, y + leftLift);
  context.closePath();
}

function traceReflectionWash(context, x, y, width, height, phase, shift) {
  context.beginPath();
  context.moveTo(x + Math.sin(phase) * 5 + shift * 0.2, y);
  context.bezierCurveTo(x + width * 0.29, y + height * 0.14, x + width * 0.72, y + height * 0.07, x + width, y + 3);
  context.bezierCurveTo(x + width * 0.83, y + height * 0.45, x + width * 0.66, y + height * 0.78, x + width * 0.58, y + height);
  context.bezierCurveTo(x + width * 0.35, y + height * 0.85, x + width * 0.2, y + height * 0.44, x + Math.sin(phase) * 5 + shift * 0.2, y);
  context.closePath();
}

function traceCastleTerrace(context, x, y, width, height, phase) {
  context.beginPath();
  context.moveTo(x, y + height * 0.18);
  context.bezierCurveTo(x + width * 0.17, y - 8 + Math.sin(phase) * 4, x + width * 0.32, y + 7, x + width * 0.49, y - 2);
  context.bezierCurveTo(x + width * 0.65, y - 11, x + width * 0.83, y + 8, x + width, y + height * 0.09);
  context.bezierCurveTo(x + width * 0.97, y + height * 0.7, x + width * 0.72, y + height, x + width * 0.49, y + height * 0.91);
  context.bezierCurveTo(x + width * 0.25, y + height * 1.05, x + width * 0.02, y + height * 0.79, x, y + height * 0.18);
  context.closePath();
}

function traceTowerBody(context, tower, phaseOffset) {
  const halfWidth = tower.width / 2;
  const x = tower.x;
  const top = tower.topY;
  const base = tower.baseY;
  context.beginPath();
  context.moveTo(x - halfWidth * 0.92, base);
  context.bezierCurveTo(x - halfWidth * 1.04, base * 0.8, x - halfWidth * 0.91, top + 45, x - halfWidth * 0.82, top + 9 + phaseOffset);
  context.quadraticCurveTo(x - halfWidth * 0.31, top + 2, x + Math.sin(tower.phase) * 2, top + 5);
  context.quadraticCurveTo(x + halfWidth * 0.32, top + 1, x + halfWidth * 0.84, top + 10);
  context.bezierCurveTo(x + halfWidth * 0.94, top + 51, x + halfWidth * 1.03, base * 0.82, x + halfWidth * 0.91, base);
  context.bezierCurveTo(x + halfWidth * 0.46, base + 6, x - halfWidth * 0.48, base - 3, x - halfWidth * 0.92, base);
  context.closePath();
}

function traceTowerShadow(context, tower) {
  const half = tower.width / 2;
  context.beginPath();
  context.moveTo(tower.x + half * 0.06, tower.topY + 6);
  context.bezierCurveTo(tower.x + half * 0.52, tower.topY + 4, tower.x + half * 0.91, tower.topY + 17, tower.x + half * 0.9, tower.baseY);
  context.bezierCurveTo(tower.x + half * 0.57, tower.baseY + 4, tower.x + half * 0.31, tower.baseY + 1, tower.x + half * 0.11, tower.baseY - 2);
  context.bezierCurveTo(tower.x + half * 0.26, tower.baseY * 0.8, tower.x + half * 0.05, tower.topY + 65, tower.x + half * 0.06, tower.topY + 6);
  context.closePath();
}

function traceTowerHighlight(context, tower) {
  const half = tower.width / 2;
  context.beginPath();
  context.moveTo(tower.x - half * 0.74, tower.topY + 19);
  context.bezierCurveTo(tower.x - half * 0.61, tower.topY + 11, tower.x - half * 0.33, tower.topY + 10, tower.x - half * 0.22, tower.topY + 15);
  context.bezierCurveTo(tower.x - half * 0.35, tower.topY + 79, tower.x - half * 0.41, tower.baseY * 0.82, tower.x - half * 0.51, tower.baseY - 9);
  context.bezierCurveTo(tower.x - half * 0.73, tower.baseY * 0.8, tower.x - half * 0.8, tower.topY + 58, tower.x - half * 0.74, tower.topY + 19);
  context.closePath();
}

function traceTowerRoof(context, tower, offsetX, offsetY) {
  const half = tower.width * 0.62;
  const x = tower.x + offsetX;
  const eave = tower.topY + 12 + offsetY;
  const peakY = tower.topY - tower.roof + offsetY;
  context.beginPath();
  context.moveTo(x - half, eave + 2);
  context.bezierCurveTo(x - half * 0.66, eave - tower.roof * 0.46, x - half * 0.22, peakY + 8, x + Math.sin(tower.phase) * 3, peakY);
  context.bezierCurveTo(x + half * 0.28, peakY + 9, x + half * 0.7, eave - tower.roof * 0.45, x + half, eave + 3);
  context.quadraticCurveTo(x + half * 0.38, eave + 15, x - half, eave + 2);
  context.closePath();
}

function traceRoofHighlight(context, tower) {
  const half = tower.width * 0.62;
  const peakY = tower.topY - tower.roof;
  context.beginPath();
  context.moveTo(tower.x - half * 0.86, tower.topY + 9);
  context.bezierCurveTo(tower.x - half * 0.58, tower.topY - tower.roof * 0.42, tower.x - half * 0.18, peakY + 10, tower.x - 2, peakY + 4);
  context.bezierCurveTo(tower.x - half * 0.27, peakY + 23, tower.x - half * 0.5, tower.topY - tower.roof * 0.12, tower.x - half * 0.86, tower.topY + 9);
  context.closePath();
}

function traceHallBody(context, hall, phaseOffset) {
  const bottom = hall.y + hall.height;
  context.beginPath();
  context.moveTo(hall.x + 4, bottom - 1);
  context.bezierCurveTo(hall.x - 3, hall.y + hall.height * 0.65, hall.x + 2, hall.y + hall.height * 0.27, hall.x + 8, hall.y + 8 + phaseOffset);
  context.bezierCurveTo(hall.x + hall.width * 0.32, hall.y + 2, hall.x + hall.width * 0.68, hall.y + 11, hall.x + hall.width - 7, hall.y + 5);
  context.bezierCurveTo(hall.x + hall.width + 2, hall.y + hall.height * 0.34, hall.x + hall.width - 2, hall.y + hall.height * 0.72, hall.x + hall.width - 4, bottom);
  context.bezierCurveTo(hall.x + hall.width * 0.68, bottom + 3, hall.x + hall.width * 0.29, bottom - 4, hall.x + 4, bottom - 1);
  context.closePath();
}

function traceHallShadow(context, hall) {
  const startX = hall.x + hall.width * 0.56;
  context.beginPath();
  context.moveTo(startX, hall.y + 8);
  context.bezierCurveTo(hall.x + hall.width * 0.78, hall.y + 6, hall.x + hall.width * 0.93, hall.y + 13, hall.x + hall.width - 5, hall.y + hall.height);
  context.bezierCurveTo(hall.x + hall.width * 0.82, hall.y + hall.height + 2, hall.x + hall.width * 0.64, hall.y + hall.height - 4, startX, hall.y + hall.height - 2);
  context.bezierCurveTo(startX + 8, hall.y + hall.height * 0.69, startX - 5, hall.y + hall.height * 0.31, startX, hall.y + 8);
  context.closePath();
}

function traceHallHighlight(context, hall) {
  context.beginPath();
  context.moveTo(hall.x + 12, hall.y + 15);
  context.bezierCurveTo(hall.x + hall.width * 0.12, hall.y + 5, hall.x + hall.width * 0.31, hall.y + 8, hall.x + hall.width * 0.36, hall.y + 16);
  context.bezierCurveTo(hall.x + hall.width * 0.28, hall.y + hall.height * 0.48, hall.x + hall.width * 0.25, hall.y + hall.height * 0.78, hall.x + hall.width * 0.2, hall.y + hall.height - 7);
  context.bezierCurveTo(hall.x + hall.width * 0.08, hall.y + hall.height * 0.87, hall.x + 9, hall.y + hall.height * 0.43, hall.x + 12, hall.y + 15);
  context.closePath();
}

function traceHallRoof(context, hall) {
  const peakX = hall.x + hall.width * hall.peakX;
  const peakY = hall.y - hall.height * 0.42;
  context.beginPath();
  context.moveTo(hall.x - 8, hall.y + 9);
  context.bezierCurveTo(hall.x + hall.width * 0.14, hall.y - hall.height * 0.09, peakX - hall.width * 0.16, peakY + 9, peakX, peakY);
  context.bezierCurveTo(peakX + hall.width * 0.19, peakY + 12, hall.x + hall.width * 0.78, hall.y - hall.height * 0.08, hall.x + hall.width + 8, hall.y + 7);
  context.quadraticCurveTo(hall.x + hall.width * 0.55, hall.y + 23, hall.x - 8, hall.y + 9);
  context.closePath();
}

function traceHallRoofHighlight(context, hall) {
  const peakX = hall.x + hall.width * hall.peakX;
  const peakY = hall.y - hall.height * 0.42;
  context.beginPath();
  context.moveTo(hall.x + 2, hall.y + 5);
  context.bezierCurveTo(hall.x + hall.width * 0.2, hall.y - hall.height * 0.12, peakX - hall.width * 0.14, peakY + 8, peakX - 3, peakY + 4);
  context.bezierCurveTo(peakX - hall.width * 0.17, peakY + 25, hall.x + hall.width * 0.23, hall.y + 2, hall.x + 2, hall.y + 5);
  context.closePath();
}

function traceOrganicWindow(context, x, y, width, height, phase) {
  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  const wobble = Math.sin(phase) * 1.1;
  context.beginPath();
  context.moveTo(left + 1, bottom - 2);
  context.bezierCurveTo(left - wobble, y + height * 0.12, left + 1.2, top + 3, x - 1, top - 1);
  context.bezierCurveTo(right - 1.5, top + 2, right + wobble, y + height * 0.1, right - 1, bottom - 1);
  context.quadraticCurveTo(x + Math.cos(phase) * 1.2, bottom + 1.5, left + 1, bottom - 2);
  context.closePath();
}

function traceBridge(context, x, y, width, height, phase) {
  context.beginPath();
  context.moveTo(x, y + height * 0.35);
  context.bezierCurveTo(x + width * 0.24, y - 5, x + width * 0.72, y + Math.sin(phase) * 5, x + width, y + height * 0.3);
  context.bezierCurveTo(x + width * 0.85, y + height * 0.23, x + width * 0.69, y + height * 0.35, x + width * 0.62, y + height);
  context.bezierCurveTo(x + width * 0.45, y + height * 0.78, x + width * 0.26, y + height * 0.82, x, y + height * 0.35);
  context.closePath();
}

function traceBridgeHighlight(context, x, y, width, height, phase) {
  context.beginPath();
  context.moveTo(x, y + height * 0.5);
  context.bezierCurveTo(x + width * 0.28, y - 2 + Math.sin(phase) * 2, x + width * 0.71, y + 3, x + width, y + height * 0.45);
  context.bezierCurveTo(x + width * 0.72, y + height, x + width * 0.24, y + height * 0.86, x, y + height * 0.5);
  context.closePath();
}

function traceMistRibbon(context, y, height, offset, phase) {
  context.beginPath();
  context.moveTo(-105 + offset, y + height * 0.45);
  context.bezierCurveTo(122 + offset, y - height * 0.24, 313 + offset, y + height * 0.71, 509 + offset, y + height * 0.17);
  context.bezierCurveTo(720 + offset, y - height * 0.34, 938 + offset, y + height * 0.75, 1384 + offset, y + height * 0.19);
  context.bezierCurveTo(1120 + offset, y + height * 1.15, 829 + offset, y + height * 0.49 + Math.sin(phase) * 4, 607 + offset, y + height * 0.91);
  context.bezierCurveTo(373 + offset, y + height * 1.27, 120 + offset, y + height * 0.52, -105 + offset, y + height * 0.45);
  context.closePath();
}

function traceShore(context, y, phase) {
  context.beginPath();
  context.moveTo(-35, y + 9);
  context.bezierCurveTo(129, y - 18, 243, y + 26, 385, y + 5);
  context.bezierCurveTo(548, y - 21, 672, y + 22, 821, y + 4 + Math.sin(phase) * 5);
  context.bezierCurveTo(986, y - 19, 1137, y + 23, 1325, y - 3);
  context.bezierCurveTo(1343, 733, 1264, 748, 1182, 742);
  context.bezierCurveTo(815, 731, 418, 747, -35, 741);
  context.bezierCurveTo(-51, 706, -44, 669, -35, y + 9);
  context.closePath();
}

function traceShoreHighlight(context, y, phase) {
  context.beginPath();
  context.moveTo(-24, y + 9);
  context.bezierCurveTo(159, y - 14, 302, y + 19, 461, y + 1);
  context.bezierCurveTo(641, y - 12, 791, y + 21 + Math.sin(phase) * 3, 934, y + 5);
  context.bezierCurveTo(729, y + 31, 411, y + 22, -24, y + 9);
  context.closePath();
}

function region(id, base, shadow, highlight) {
  return Object.freeze({ id, tones: Object.freeze({ base, shadow, highlight }) });
}

function normalizeFrame(frame) {
  if (!frame || ![frame.x, frame.y, frame.width, frame.height].every(Number.isFinite)
    || frame.width <= 0 || frame.height <= 0) {
    throw new TypeError('Storybook title frame must contain finite coordinates and positive dimensions.');
  }
  return Object.freeze({ x: frame.x, y: frame.y, width: frame.width, height: frame.height });
}

function normalizeTime(time) {
  return Number.isFinite(time) ? Math.max(0, time) : 0;
}

function transformRect(rect, frame) {
  const scaleX = frame.width / WORLD.width;
  const scaleY = frame.height / WORLD.height;
  return Object.freeze({
    x: frame.x + rect.x * scaleX,
    y: frame.y + rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  });
}
