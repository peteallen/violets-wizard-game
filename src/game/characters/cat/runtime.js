import { STORYBOOK_INK } from '../../render/storybookInk.js';
import {
  drawCompanionEye,
  drawVectorCompanionShadow,
  fillStroke,
  isBlinking,
  prepareVectorContext,
  traceOrganicPatch,
} from '../vectorPrimitives.js';
import {
  createVectorCharacterRuntime,
  normalizeVectorRenderRequest,
} from '../vectorRuntime.js';
import {
  createCharacterPortraitRenderer,
  defineCharacterPortraitPresentation,
} from '../portraitRuntime.js';
import {
  catPresentation,
  catStyle,
} from './definition.js';

const OUTLINE = STORYBOOK_INK.primary;
const CAT_STYLE = catStyle;

export function sampleCatMotion({
  pose = 'idle',
  time = 0,
  reducedMotion = false,
} = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const phase = 0.4;
  const energy = reducedMotion ? 0.32 : 1;
  const stepWave = Math.sin(safeTime * 6.1 + phase);
  const following = pose === 'follow' || pose === 'pet-follow';
  const pawing = pose === 'paw';
  const hopWave = following ? Math.max(0, stepWave) ** 2 : 0;
  const breath = Math.sin(safeTime * 2.05 + phase);
  const quickBeat = Math.sin(safeTime * 7.3 + phase * 0.7);
  const attention = pawing ? 1 : following ? 0.58 : 0.18;
  return Object.freeze({
    bob: breath * 1.65 * energy,
    hop: hopWave * 5.5 * energy,
    tilt: following ? stepWave * 0.045 * energy : breath * 0.008 * energy,
    step: following ? stepWave : 0,
    breathScale: 1 + breath * 0.012 * energy,
    tailSway: Math.sin(safeTime * 2.7 + phase) * (following ? 0.34 : 0.2) * energy,
    throatPulse: 0,
    pawLift: pawing ? (0.58 + Math.sin(safeTime * 4.2) * 0.18) * energy : 0,
    foreLift: following ? Math.max(0, stepWave) * 0.24 * energy : 0,
    hindLift: following ? Math.max(0, -stepWave) * 0.18 * energy : 0,
    headNod: (breath * 0.7 + quickBeat * attention * 0.45) * energy,
    headTilt: quickBeat * attention * 0.035 * energy,
    earTwitch: quickBeat * (0.45 + attention * 0.55) * energy,
    eyeFocusX: (following ? 1.1 : 0.45) * Math.sin(safeTime * 0.53 + phase) * energy,
    eyeFocusY: 0.35 * Math.sin(safeTime * 0.37 + phase * 1.4) * energy,
    bodySquash: 1 - hopWave * 0.015 * energy,
  });
}

export function drawCatCharacter(context, cat = {}, time = 0) {
  const motion = sampleCatMotion({
    pose: cat.pose,
    time,
    reducedMotion: cat.reducedMotion,
  });
  const direction = cat.facing === 'left' ? -1 : 1;
  const lightSide = cat.lightSide === 'right' ? 'right' : 'left';
  const lightDirection = (lightSide === 'right' ? 1 : -1) * direction;

  context.save();
  context.translate(cat.x, cat.y);
  context.scale(direction * cat.scale, cat.scale);
  prepareVectorContext(context, 2.8);
  drawVectorCompanionShadow(context, motion, {
    primaryRadiusX: 31,
    primaryRadiusY: 7,
    primaryTurn: 0.12,
    secondaryRadiusX: 22,
    secondaryRadiusY: 4,
    secondaryTurn: -0.14,
    hopDivisor: 15,
  });
  context.restore();

  context.save();
  context.translate(cat.x, cat.y + motion.bob - motion.hop);
  context.rotate(motion.tilt);
  context.scale(direction * cat.scale, cat.scale * motion.breathScale * motion.bodySquash);
  prepareVectorContext(context, 2.8);
  drawCat(context, time, motion, lightDirection);
  context.restore();
}

function renderCat(surface, request) {
  const portrait = surface === 'portrait';
  const normalized = normalizeVectorRenderRequest(request, {
    surface,
    x: 0,
    y: portrait ? catPresentation.portrait.y : 0,
    scale: portrait ? catPresentation.portrait.scale : 1,
    pose: 'idle',
  });
  return drawCatCharacter(normalized.context, normalized.state, normalized.time);
}

export function drawCatPortraitFigure(request) {
  return renderCat('portrait', request);
}

function drawCat(context, time, motion, lightDirection = -1) {
  drawCatTail(context, motion);
  drawCatHindquarters(context, motion);
  drawCatBody(context, motion, lightDirection);
  drawCatForelegs(context, motion, lightDirection);
  drawCatPaws(context, motion);

  context.save();
  context.translate(0, motion.headNod);
  context.rotate(motion.headTilt);
  drawCatHead(context, time, motion, lightDirection);
  context.restore();
  drawCatCollar(context);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = CAT_STYLE.rim;
  context.lineWidth = 2.25;
  context.beginPath();
  context.moveTo(-24, -44);
  context.bezierCurveTo(-29, -58, -27, -70, -20, -79);
  context.moveTo(-23, -78 + motion.headNod);
  context.bezierCurveTo(-19, -96, -8, -104, 5, -101);
  context.stroke();
  context.restore();
}

function drawCatTail(context, motion) {
  const sway = motion.tailSway;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(18, -28);
  context.bezierCurveTo(45, -31, 49 + sway * 13, -58, 34 + sway * 9, -76);
  context.bezierCurveTo(29 + sway * 8, -82, 21 + sway * 5, -80, 20 + sway * 4, -73);
  context.stroke();
  context.strokeStyle = CAT_STYLE.furShadow;
  context.lineWidth = 6.6;
  context.stroke();
  context.strokeStyle = CAT_STYLE.furMid;
  context.lineWidth = 3.6;
  context.beginPath();
  context.moveTo(19, -29);
  context.bezierCurveTo(43, -35, 45 + sway * 12, -57, 32 + sway * 8, -75);
  context.stroke();
  context.strokeStyle = 'rgba(74, 48, 40, 0.58)';
  context.lineWidth = 1.55;
  for (let index = 0; index < 4; index += 1) {
    const y = -43 - index * 8;
    context.beginPath();
    context.moveTo(37 + sway * 5, y + 4);
    context.bezierCurveTo(42 + sway * 8, y + 1, 43 + sway * 8, y - 3, 41 + sway * 7, y - 6);
    context.stroke();
  }
}

function drawCatHindquarters(context, motion) {
  const rearX = -18 - motion.step * 2.2;
  const rearLift = motion.hindLift * 14;
  context.fillStyle = CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(-21, -48);
  context.bezierCurveTo(-38, -43, -40, -21, -31, -8);
  context.bezierCurveTo(-28, -3 - rearLift, rearX - 9, 2 - rearLift, rearX - 1, 2 - rearLift);
  context.bezierCurveTo(rearX + 6, 1 - rearLift, rearX + 8, -4 - rearLift, rearX + 4, -9);
  context.bezierCurveTo(-11, -20, -8, -36, -21, -48);
  context.closePath();
  fillStroke(context, 1.75);
  context.fillStyle = CAT_STYLE.furMid;
  context.beginPath();
  context.moveTo(-29, -36);
  context.bezierCurveTo(-35, -25, -32, -11, -24, -7);
  context.bezierCurveTo(-21, -4, -17, -4, -15, -8);
  context.bezierCurveTo(-21, -17, -19, -29, -29, -36);
  context.closePath();
  context.fill();
}

function drawCatBody(context, motion, lightDirection = -1) {
  context.fillStyle = CAT_STYLE.furBase;
  context.beginPath();
  context.moveTo(-13, -65);
  context.bezierCurveTo(-28, -62, -34, -46, -30, -28);
  context.bezierCurveTo(-28, -12, -19, -3, -4, -4);
  context.bezierCurveTo(8, -1, 25, -6, 28, -23);
  context.bezierCurveTo(32, -40, 23, -59, 11, -65);
  context.bezierCurveTo(2, -70, -4, -67, -13, -65);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(7, -66);
  context.bezierCurveTo(25, -58, 32, -40, 27, -22);
  context.bezierCurveTo(23, -8, 12, -3, 3, -4);
  context.bezierCurveTo(12, -18, 14, -47, 7, -66);
  context.closePath();
  context.fill();

  context.fillStyle = CAT_STYLE.furMid;
  context.beginPath();
  context.moveTo(-17, -60);
  context.bezierCurveTo(-28, -50, -28, -33, -23, -23);
  context.bezierCurveTo(-19, -16, -12, -17, -10, -25);
  context.bezierCurveTo(-7, -40, -9, -53, -17, -60);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = CAT_STYLE.chest;
  context.beginPath();
  context.moveTo(-11, -60);
  context.bezierCurveTo(-7, -55, -5, -50, -2, -54);
  context.bezierCurveTo(1, -49, 5, -50, 9, -57);
  context.bezierCurveTo(13, -43, 10, -28, 5, -15);
  context.bezierCurveTo(2, -10, -1, -13, -2, -18);
  context.bezierCurveTo(-5, -12, -9, -14, -10, -21);
  context.bezierCurveTo(-14, -33, -16, -47, -11, -60);
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(86, 57, 46, 0.42)';
  context.lineWidth = 1.3;
  context.beginPath();
  context.moveTo(-17, -50);
  context.bezierCurveTo(-11, -46, -8, -43, -6, -37);
  context.moveTo(18, -54);
  context.bezierCurveTo(12, -46, 13, -39, 20, -34);
  context.moveTo(21, -44);
  context.bezierCurveTo(14, -37, 15, -30, 23, -26);
  context.stroke();
}

function drawCatForelegs(context, motion, lightDirection = -1) {
  const leftLift = motion.hindLift * 8;
  context.fillStyle = lightDirection < 0 ? CAT_STYLE.furMid : CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(-12, -36);
  context.bezierCurveTo(-20, -27, -21, -12, -18 - motion.step * 1.2, -3 - leftLift);
  context.bezierCurveTo(-13, 2 - leftLift, -6, 1 - leftLift, -5, -5 - leftLift);
  context.bezierCurveTo(-7, -18, -5, -29, -12, -36);
  context.closePath();
  fillStroke(context, 1.6);

  if (motion.pawLift > 0) return;
  const rightLift = motion.foreLift * 15;
  context.fillStyle = lightDirection > 0 ? CAT_STYLE.furMid : CAT_STYLE.furBase;
  context.beginPath();
  context.moveTo(7, -37);
  context.bezierCurveTo(16, -27, 17, -12, 18 + motion.step * 1.5, -3 - rightLift);
  context.bezierCurveTo(14, 2 - rightLift, 7, 1 - rightLift, 6, -5 - rightLift);
  context.bezierCurveTo(8, -17, 3, -29, 7, -37);
  context.closePath();
  fillStroke(context, 1.6);
}

function drawCatCollar(context) {
  context.fillStyle = CAT_STYLE.collar;
  context.beginPath();
  context.moveTo(-20, -53);
  context.bezierCurveTo(-8, -48, 8, -48, 21, -54);
  context.bezierCurveTo(21, -50, 20, -46, 17, -43);
  context.bezierCurveTo(7, -39, -8, -39, -18, -44);
  context.bezierCurveTo(-20, -47, -21, -50, -20, -53);
  context.closePath();
  fillStroke(context, 1.7);
  context.fillStyle = CAT_STYLE.brass;
  traceOrganicPatch(context, 0, -41, 4.5, 4.1, 0.18);
  fillStroke(context, 1.15);
  context.strokeStyle = 'rgba(255, 238, 174, 0.65)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-1.8, -43.2);
  context.bezierCurveTo(-0.5, -44.2, 1.2, -43.7, 2.1, -42.5);
  context.stroke();
}

function drawCatHead(context, time, motion, lightDirection = -1) {
  const twitch = motion.earTwitch;
  drawCatEar(context, -1, twitch, lightDirection);
  drawCatEar(context, 1, -twitch * 0.65, lightDirection);

  context.fillStyle = CAT_STYLE.furBase;
  context.beginPath();
  context.moveTo(-2, -96);
  context.bezierCurveTo(-20, -98, -30, -87, -30, -70);
  context.bezierCurveTo(-31, -57, -23, -47, -10, -44);
  context.bezierCurveTo(-3, -40, 5, -41, 12, -44);
  context.bezierCurveTo(25, -47, 31, -58, 29, -72);
  context.bezierCurveTo(28, -88, 17, -98, -2, -96);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(5, -96);
  context.bezierCurveTo(21, -93, 29, -83, 29, -70);
  context.bezierCurveTo(30, -56, 22, -47, 11, -44);
  context.bezierCurveTo(15, -60, 13, -82, 5, -96);
  context.closePath();
  context.fill();

  context.fillStyle = CAT_STYLE.furLight;
  context.beginPath();
  context.moveTo(-16, -91);
  context.bezierCurveTo(-22, -84, -24, -72, -20, -62);
  context.bezierCurveTo(-17, -56, -13, -58, -11, -65);
  context.bezierCurveTo(-8, -76, -9, -86, -16, -91);
  context.closePath();
  context.fill();
  context.restore();

  drawCatFace(context, time, motion);
  drawCatFurMarks(context, lightDirection);
}

function drawCatEar(context, side, twitch, lightDirection = -1) {
  const innerX = side * 7;
  const outerX = side * (25 + twitch * 1.2);
  const tipY = -108 - Math.abs(twitch) * 1.5;
  context.fillStyle = side === lightDirection ? CAT_STYLE.furMid : CAT_STYLE.furShadow;
  context.beginPath();
  context.moveTo(side * 4, -82);
  context.bezierCurveTo(side * 8, -91, side * 14, -103, outerX, tipY);
  context.bezierCurveTo(side * 27, -95, side * 27, -84, side * 21, -76);
  context.bezierCurveTo(side * 15, -75, side * 8, -77, side * 4, -82);
  context.closePath();
  fillStroke(context, 1.75);
  context.fillStyle = CAT_STYLE.ear;
  context.beginPath();
  context.moveTo(innerX, -83);
  context.bezierCurveTo(side * 12, -92, side * 16, -99, side * (22 + twitch * 0.8), tipY + 2);
  context.bezierCurveTo(side * 22, -91, side * 21, -84, side * 18, -79);
  context.bezierCurveTo(side * 14, -78, side * 10, -79, innerX, -83);
  context.closePath();
  context.fill();
  context.strokeStyle = side === lightDirection ? CAT_STYLE.rim : 'rgba(71, 47, 40, 0.35)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(innerX, -86);
  context.bezierCurveTo(side * 12, -96, side * 17, -103, outerX, tipY);
  context.stroke();
}

function drawCatFace(context, time, motion) {
  const blink = isBlinking(time, 0.8);
  drawCompanionEye(context, {
    x: -10,
    y: -70,
    width: 7.7,
    height: 6.3,
    gazeX: motion.eyeFocusX,
    gazeY: motion.eyeFocusY,
    iris: CAT_STYLE.iris,
    pupil: CAT_STYLE.pupil,
    eyeWhite: CAT_STYLE.eyeWhite,
    catchlight: CAT_STYLE.catchlight,
    lid: CAT_STYLE.furDeep,
    blinking: blink,
    turn: -0.13,
  });
  drawCompanionEye(context, {
    x: 10,
    y: -70.5,
    width: 7.5,
    height: 6.2,
    gazeX: motion.eyeFocusX,
    gazeY: motion.eyeFocusY,
    iris: CAT_STYLE.iris,
    pupil: CAT_STYLE.pupil,
    eyeWhite: CAT_STYLE.eyeWhite,
    catchlight: CAT_STYLE.catchlight,
    lid: CAT_STYLE.furDeep,
    blinking: blink,
    turn: 0.12,
  });

  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-19, -80);
  context.bezierCurveTo(-15, -84, -10, -84, -5, -80.5);
  context.moveTo(5, -80.5);
  context.bezierCurveTo(10, -84, 15, -83.5, 19, -79.5);
  context.stroke();

  context.fillStyle = CAT_STYLE.muzzle;
  traceOrganicPatch(context, -7.5, -56, 10.4, 8, -0.15);
  context.fill();
  traceOrganicPatch(context, 7.5, -56, 10.2, 7.7, 0.14);
  context.fill();

  context.fillStyle = CAT_STYLE.nose;
  context.beginPath();
  context.moveTo(-4.2, -61);
  context.bezierCurveTo(-1.8, -63.2, 2.5, -63, 4.4, -60.5);
  context.bezierCurveTo(3.2, -56.8, 0.8, -55.2, -0.2, -55.1);
  context.bezierCurveTo(-1.8, -55.8, -3.6, -57.7, -4.2, -61);
  context.closePath();
  fillStroke(context, 1.05);

  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(0, -55.5);
  context.bezierCurveTo(-0.4, -51.6, -3.3, -49.3, -7.3, -49.8);
  context.moveTo(0, -55.5);
  context.bezierCurveTo(0.6, -51.7, 3.7, -49.3, 7.6, -50.2);
  context.stroke();

  context.fillStyle = 'rgba(76, 48, 41, 0.44)';
  for (const [x, y, turn] of [[-13, -57, -0.1], [-9, -53, 0.2], [9, -53.5, -0.16], [13, -57, 0.13]]) {
    traceOrganicPatch(context, x, y, 0.85, 0.72, turn);
    context.fill();
  }
  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-6, -57);
  context.bezierCurveTo(-13, -56, -19, -52, -23, -48);
  context.moveTo(-6, -53.5);
  context.bezierCurveTo(-14, -51.5, -20, -47, -24, -42.5);
  context.moveTo(6, -57);
  context.bezierCurveTo(13, -56, 19, -52, 23, -48.5);
  context.moveTo(6, -53.5);
  context.bezierCurveTo(14, -51.2, 20, -47, 24, -42.8);
  context.stroke();
}

function drawCatFurMarks(context, lightDirection = -1) {
  context.strokeStyle = CAT_STYLE.furDeep;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-12, -91);
  context.bezierCurveTo(-9, -85, -7, -82, -4, -79);
  context.moveTo(-1, -96);
  context.bezierCurveTo(-1, -88, 0, -83, 1, -79);
  context.moveTo(11, -91);
  context.bezierCurveTo(8, -85, 6, -82, 4, -79);
  context.stroke();
  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = 'rgba(255, 231, 178, 0.46)';
  context.lineWidth = 1.3;
  context.beginPath();
  context.moveTo(-23, -83);
  context.bezierCurveTo(-18, -91, -10, -96, -2, -96);
  context.moveTo(-22, -62);
  context.bezierCurveTo(-18, -55, -15, -51, -10, -49);
  context.stroke();
  context.restore();
}

function drawCatPaws(context, motion) {
  context.fillStyle = CAT_STYLE.furLight;
  traceOrganicPatch(context, -14 - motion.step * 0.8, -1 - motion.hindLift * 7, 12, 6.2, -0.14);
  fillStroke(context, 1.75);

  if (motion.pawLift <= 0) {
    traceOrganicPatch(context, 14 + motion.step, -1 - motion.foreLift * 12, 11.8, 6, 0.16);
    fillStroke(context, 1.75);
    context.strokeStyle = 'rgba(91, 59, 48, 0.48)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(11, -3 - motion.foreLift * 12);
    context.bezierCurveTo(12, -0.5 - motion.foreLift * 12, 12, 1 - motion.foreLift * 12, 10, 3 - motion.foreLift * 12);
    context.moveTo(17, -3 - motion.foreLift * 12);
    context.bezierCurveTo(18, -0.5 - motion.foreLift * 12, 18, 1 - motion.foreLift * 12, 16, 3 - motion.foreLift * 12);
    context.stroke();
    return;
  }

  const pawY = -12 - motion.pawLift * 49;
  context.fillStyle = CAT_STYLE.furMid;
  context.beginPath();
  context.moveTo(7, -31);
  context.bezierCurveTo(12, -35, 15, pawY + 18, 22, pawY + 10);
  context.bezierCurveTo(27, pawY + 2, 35, pawY - 1, 40, pawY + 3);
  context.bezierCurveTo(45, pawY + 8, 42, pawY + 15, 36, pawY + 16);
  context.bezierCurveTo(32, pawY + 20, 27, pawY + 17, 25, pawY + 14);
  context.bezierCurveTo(20, pawY + 22, 18, -23, 14, -10);
  context.bezierCurveTo(9, -10, 6, -21, 7, -31);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = CAT_STYLE.furLight;
  context.beginPath();
  context.moveTo(27, pawY + 8);
  context.bezierCurveTo(31, pawY + 3, 37, pawY + 2, 40, pawY + 6);
  context.bezierCurveTo(41, pawY + 11, 36, pawY + 15, 30, pawY + 14);
  context.bezierCurveTo(27, pawY + 13, 26, pawY + 10, 27, pawY + 8);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(82, 52, 44, 0.54)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(32, pawY + 4);
  context.bezierCurveTo(34, pawY + 7, 33, pawY + 11, 31, pawY + 13);
  context.moveTo(38, pawY + 4.5);
  context.bezierCurveTo(40, pawY + 8, 38, pawY + 12, 35.5, pawY + 14);
  context.stroke();
}


export const catPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: {
    dark: catPresentation.portrait.backdrop[0],
    light: catPresentation.portrait.backdrop[1],
  },
  figure: {
    x: 0,
    y: catPresentation.portrait.y,
    scale: catPresentation.portrait.scale,
  },
});

const drawCatPortrait = createCharacterPortraitRenderer({
  presentation: catPortraitPresentation,
  drawFigure: drawCatPortraitFigure,
  prepareFigureState: (state) => ({
    facing: state.facing,
    lightSide: state.lightSide,
    pose: (state.pose ?? 'speaking') === 'talk' ? 'speaking' : (state.pose ?? 'speaking'),
    reducedMotion: state.reducedMotion,
  }),
});

export const catCharacterRuntime = createVectorCharacterRuntime({
  drawWorld: (request) => renderCat('world', request),
  drawPortrait: drawCatPortrait,
});
