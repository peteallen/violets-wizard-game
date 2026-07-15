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
  toadPresentation,
  toadStyle,
} from './definition.js';

const OUTLINE = STORYBOOK_INK.primary;
const TOAD_STYLE = toadStyle;

export function sampleToadMotion({
  pose = 'idle',
  time = 0,
  reducedMotion = false,
} = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const phase = 1.7;
  const energy = reducedMotion ? 0.32 : 1;
  const stepWave = Math.sin(safeTime * 4.2 + phase);
  const following = pose === 'follow' || pose === 'pet-follow';
  const hopWave = following ? Math.max(0, stepWave) ** 2 : 0;
  const breath = Math.sin(safeTime * 1.45 + phase);
  const quickBeat = Math.sin(safeTime * 5.1 + phase * 0.7);
  const attention = following ? 0.58 : 0.18;
  return Object.freeze({
    bob: breath * 1.1 * energy,
    hop: hopWave * 7 * energy,
    tilt: following ? stepWave * 0.025 * energy : breath * 0.008 * energy,
    step: following ? stepWave : 0,
    breathScale: 1 + breath * 0.022 * energy,
    tailSway: Math.sin(safeTime * 2.7 + phase) * (following ? 0.34 : 0.2) * energy,
    throatPulse: Math.max(0, Math.sin(safeTime * 1.33 + 0.8)) * energy,
    pawLift: 0,
    foreLift: following ? Math.max(0, stepWave) * 0.16 * energy : 0,
    hindLift: following ? Math.max(0, -stepWave) * 0.1 * energy : 0,
    headNod: (breath * 0.7 + quickBeat * attention * 0.45) * energy,
    headTilt: quickBeat * attention * 0.018 * energy,
    earTwitch: 0,
    eyeFocusX: (following ? 1.1 : 0.45) * Math.sin(safeTime * 0.53 + phase) * energy,
    eyeFocusY: 0.35 * Math.sin(safeTime * 0.37 + phase * 1.4) * energy,
    bodySquash: 1 - hopWave * 0.035 * energy,
  });
}

export function drawToadCharacter(context, toad = {}, time = 0) {
  const motion = sampleToadMotion({
    pose: toad.pose,
    time,
    reducedMotion: toad.reducedMotion,
  });
  const direction = toad.facing === 'left' ? -1 : 1;
  const lightSide = toad.lightSide === 'right' ? 'right' : 'left';
  const lightDirection = (lightSide === 'right' ? 1 : -1) * direction;

  context.save();
  context.translate(toad.x, toad.y);
  context.scale(direction * toad.scale, toad.scale);
  prepareVectorContext(context, 2.8);
  drawVectorCompanionShadow(context, motion, {
    primaryRadiusX: 43,
    primaryRadiusY: 8,
    primaryTurn: -0.1,
    secondaryRadiusX: 30,
    secondaryRadiusY: 4.5,
    secondaryTurn: 0.16,
    hopDivisor: 18,
  });
  context.restore();

  context.save();
  context.translate(toad.x, toad.y + motion.bob - motion.hop);
  context.rotate(motion.tilt);
  context.scale(direction * toad.scale, toad.scale * motion.breathScale * motion.bodySquash);
  prepareVectorContext(context, 2.8);
  drawToad(context, time, motion, lightDirection);
  context.restore();
}

function renderToad(surface, request) {
  const portrait = surface === 'portrait';
  const normalized = normalizeVectorRenderRequest(request, {
    surface,
    x: 0,
    y: portrait ? toadPresentation.portrait.y : 0,
    scale: portrait ? toadPresentation.portrait.scale : 1,
    pose: 'idle',
  });
  return drawToadCharacter(normalized.context, normalized.state, normalized.time);
}

export function drawToadPortraitFigure(request) {
  return renderToad('portrait', request);
}

function drawToad(context, time, motion, lightDirection = -1) {
  drawToadHindLeg(context, -1, motion, lightDirection);
  drawToadHindLeg(context, 1, motion, lightDirection);
  drawToadBody(context, motion, lightDirection);
  drawToadEyeTurret(context, -1, motion, lightDirection);
  drawToadEyeTurret(context, 1, motion, lightDirection);
  drawToadFace(context, time, motion);
  drawToadSkinDetail(context, motion);
  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.strokeStyle = TOAD_STYLE.rim;
  context.lineWidth = 2.15;
  context.beginPath();
  context.moveTo(-34, -24);
  context.bezierCurveTo(-31, -39, -23, -52, -13, -56);
  context.bezierCurveTo(-8, -61, -1, -62, 5, -59);
  context.stroke();
  context.restore();
}

function drawToadHindLeg(context, side, motion, lightDirection = -1) {
  const step = motion.step * 2.4;
  const lift = (side < 0 ? motion.hindLift : motion.foreLift) * 9;
  const outer = side * (43 + step);
  context.fillStyle = side === lightDirection ? TOAD_STYLE.skinMid : TOAD_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(side * 7, -28);
  context.bezierCurveTo(side * 21, -25, side * 28, -15, outer, -8 - lift);
  context.bezierCurveTo(side * 51, -5 - lift, side * 52, 1 - lift, side * 43, 3 - lift);
  context.bezierCurveTo(side * 32, 7 - lift, side * 22, 1 - lift, side * 13, -5);
  context.bezierCurveTo(side * 5, -10, side * 3, -20, side * 7, -28);
  context.closePath();
  fillStroke(context, 1.8);

  context.strokeStyle = TOAD_STYLE.skinDeep;
  context.lineWidth = 1.7;
  context.beginPath();
  for (let toe = -1; toe <= 1; toe += 1) {
    const startX = side * (39 + step) + toe * 1.2;
    context.moveTo(startX, -1 - lift);
    context.bezierCurveTo(
      startX + side * 5,
      1 - lift,
      startX + side * (9 + Math.abs(toe)),
      3 + Math.abs(toe) - lift,
      startX + side * (13 + toe * 1.5),
      2 + Math.abs(toe) - lift,
    );
  }
  context.stroke();
}

function drawToadBody(context, motion, lightDirection = -1) {
  context.fillStyle = TOAD_STYLE.skinBase;
  context.beginPath();
  context.moveTo(-3, -57);
  context.bezierCurveTo(-24, -59, -38, -43, -37, -24);
  context.bezierCurveTo(-39, -8, -25, 2, -6, 1);
  context.bezierCurveTo(10, 5, 31, -2, 36, -19);
  context.bezierCurveTo(41, -36, 27, -55, 8, -57);
  context.bezierCurveTo(4, -59, 0, -59, -3, -57);
  context.closePath();
  fillStroke(context, 2.05);

  context.save();
  if (lightDirection > 0) context.scale(-1, 1);
  context.fillStyle = TOAD_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(7, -57);
  context.bezierCurveTo(28, -52, 40, -35, 36, -19);
  context.bezierCurveTo(31, -3, 17, 3, 5, 1);
  context.bezierCurveTo(13, -14, 15, -39, 7, -57);
  context.closePath();
  context.fill();

  context.fillStyle = TOAD_STYLE.skinMid;
  context.beginPath();
  context.moveTo(-24, -48);
  context.bezierCurveTo(-34, -38, -35, -22, -28, -12);
  context.bezierCurveTo(-24, -7, -19, -9, -17, -16);
  context.bezierCurveTo(-13, -29, -15, -42, -24, -48);
  context.closePath();
  context.fill();
  context.restore();

  const throatWidth = 19 + motion.throatPulse * 2.2;
  const throatHeight = 12 + motion.throatPulse * 2.8;
  context.fillStyle = TOAD_STYLE.belly;
  traceOrganicPatch(context, 0, -17, throatWidth, throatHeight, -0.12);
  context.fill();
  context.fillStyle = TOAD_STYLE.bellyLight;
  context.beginPath();
  context.moveTo(-13, -23);
  context.bezierCurveTo(-8, -29, 2, -31, 10, -25);
  context.bezierCurveTo(5, -22, -3, -21, -13, -23);
  context.closePath();
  context.fill();
}

function drawToadEyeTurret(context, side, motion, lightDirection = -1) {
  const x = side * 15;
  const y = -51 + motion.headNod * 0.25;
  context.fillStyle = side === lightDirection ? TOAD_STYLE.skinLight : TOAD_STYLE.skinMid;
  traceOrganicPatch(context, x, y, 12.2, 11.6, side * 0.12);
  fillStroke(context, 1.75);
  context.fillStyle = TOAD_STYLE.skinShadow;
  context.beginPath();
  context.moveTo(x + side * 1, y - 10);
  context.bezierCurveTo(x + side * 10, y - 7, x + side * 12, y + 2, x + side * 7, y + 8);
  context.bezierCurveTo(x + side * 4, y + 5, x + side * 2, y - 3, x + side * 1, y - 10);
  context.closePath();
  context.fill();
}

function drawToadFace(context, time, motion) {
  const blink = isBlinking(time, 2.1);
  drawCompanionEye(context, {
    x: -15,
    y: -52 + motion.headNod * 0.25,
    width: 7.3,
    height: 6.8,
    gazeX: motion.eyeFocusX * 0.78,
    gazeY: motion.eyeFocusY,
    iris: TOAD_STYLE.iris,
    pupil: TOAD_STYLE.pupil,
    eyeWhite: TOAD_STYLE.eyeWhite,
    catchlight: TOAD_STYLE.catchlight,
    lid: TOAD_STYLE.skinDeep,
    blinking: blink,
    turn: -0.12,
  });
  drawCompanionEye(context, {
    x: 15,
    y: -52.5 + motion.headNod * 0.25,
    width: 7.1,
    height: 6.6,
    gazeX: motion.eyeFocusX * 0.78,
    gazeY: motion.eyeFocusY,
    iris: TOAD_STYLE.iris,
    pupil: TOAD_STYLE.pupil,
    eyeWhite: TOAD_STYLE.eyeWhite,
    catchlight: TOAD_STYLE.catchlight,
    lid: TOAD_STYLE.skinDeep,
    blinking: blink,
    turn: 0.14,
  });

  context.strokeStyle = TOAD_STYLE.skinDeep;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-8, -38);
  context.bezierCurveTo(-6, -40, -4, -40, -2, -38.5);
  context.moveTo(2, -38.5);
  context.bezierCurveTo(4, -40, 6, -39.8, 8, -38);
  context.stroke();

  context.strokeStyle = TOAD_STYLE.mouth;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-13, -29);
  context.bezierCurveTo(-6, -25, 2, -24, 11, -29.5);
  context.stroke();
  context.strokeStyle = 'rgba(235, 223, 157, 0.35)';
  context.lineWidth = 0.9;
  context.beginPath();
  context.moveTo(-9, -29);
  context.bezierCurveTo(-3, -27, 3, -27, 8, -30);
  context.stroke();
}

function drawToadSkinDetail(context, motion) {
  context.fillStyle = 'rgba(224, 211, 129, 0.38)';
  for (const [x, y, rx, ry, turn] of [
    [-12, -27, 4.1, 3.1, -0.15],
    [16, -20, 3.3, 2.5, 0.18],
    [2, -35, 2.6, 2.1, -0.11],
    [-25, -34, 3, 2.4, 0.16],
    [25, -31, 2.4, 2, -0.2],
  ]) {
    traceOrganicPatch(context, x, y, rx, ry, turn);
    context.fill();
  }
  context.fillStyle = 'rgba(43, 61, 38, 0.42)';
  for (const [x, y, rx, ry, turn] of [
    [-20, -17, 2.8, 2.2, 0.14],
    [20, -37, 2.4, 1.9, -0.17],
    [9, -9, 2, 1.6, 0.1],
    [-5, -42, 1.8, 1.5, -0.12],
  ]) {
    traceOrganicPatch(context, x, y, rx, ry, turn);
    context.fill();
  }

  context.strokeStyle = 'rgba(43, 59, 37, 0.46)';
  context.lineWidth = 1.1;
  context.beginPath();
  context.moveTo(-31, -19);
  context.bezierCurveTo(-23, -15, -18, -10, -14, -5 - motion.hindLift * 3);
  context.moveTo(30, -20);
  context.bezierCurveTo(23, -15, 18, -10, 14, -5 - motion.foreLift * 3);
  context.moveTo(-8, -5);
  context.bezierCurveTo(-3, -2, 3, -2, 8, -5);
  context.stroke();
}


export const toadPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: {
    dark: toadPresentation.portrait.backdrop[0],
    light: toadPresentation.portrait.backdrop[1],
  },
  figure: {
    x: 0,
    y: toadPresentation.portrait.y,
    scale: toadPresentation.portrait.scale,
  },
});

const drawToadPortrait = createCharacterPortraitRenderer({
  presentation: toadPortraitPresentation,
  drawFigure: drawToadPortraitFigure,
  prepareFigureState: (state) => ({
    facing: state.facing,
    lightSide: state.lightSide,
    pose: (state.pose ?? 'speaking') === 'talk' ? 'speaking' : (state.pose ?? 'speaking'),
    reducedMotion: state.reducedMotion,
  }),
});

export const toadCharacterRuntime = createVectorCharacterRuntime({
  drawWorld: (request) => renderToad('world', request),
  drawPortrait: drawToadPortrait,
});
