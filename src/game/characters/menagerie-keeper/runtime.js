import { STORYBOOK_INK } from '../../render/storybookInk.js';
import {
  drawHand,
  drawVectorGroundShadow,
  fillStroke,
  isBlinking,
  prepareVectorContext,
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
  menagerieKeeperPresentation,
  menagerieKeeperStyle,
} from './definition.js';

const OUTLINE = STORYBOOK_INK.primary;
const DEEP_OUTLINE = STORYBOOK_INK.deep;
const WARM_BOUNCE = 'rgba(229, 170, 93, 0.18)';
const KEEPER_STYLE = menagerieKeeperStyle;

export function sampleKeeperMotion({
  time = 0,
  pose = 'idle',
  reducedMotion = false,
} = {}) {
  const safeTime = Number.isFinite(time) ? time : 0;
  const energy = reducedMotion ? 0.3 : 1;
  const speaking = pose === 'speaking' || pose === 'talk';
  const proud = pose === 'proud';
  const breath = Math.sin(safeTime * 1.55 + 0.8);
  const livelyBeat = speaking
    ? Math.sin(safeTime * 4.7 + 0.45)
    : proud ? 0.55 : Math.sin(safeTime * 1.2 + 0.25) * 0.22;
  return Object.freeze({
    breath: breath * energy,
    gloveLift: (speaking ? 9 + livelyBeat * 3.8 : proud ? 7.5 : 2 + livelyBeat * 1.5) * energy,
    brushTilt: (speaking ? livelyBeat * 0.16 : proud ? -0.08 : livelyBeat * 0.05) * energy,
    brushBob: (speaking ? livelyBeat * 2.4 : breath * 0.5) * energy,
    pouchSway: (livelyBeat * 1.4 + breath * 0.35) * energy,
    curlSway: (livelyBeat * 0.65 + breath * 0.28) * energy,
    headTilt: (speaking ? livelyBeat * 0.016 : proud ? -0.012 : breath * 0.005) * energy,
    browLift: (speaking ? 1.25 + livelyBeat * 0.7 : proud ? 1.4 : 0.4 + breath * 0.18) * energy,
    mouthOpen: speaking ? 2.7 + Math.abs(Math.sin(safeTime * 8 + 0.15)) * 3.2 : 0,
  });
}

export function drawMenagerieKeeper(context, character = {}, time = 0) {
  const scale = character.scale * menagerieKeeperPresentation.world.scaleMultiplier;
  const direction = character.facing === 'left' ? -1 : 1;
  const phase = character.phase ?? menagerieKeeperPresentation.world.phase;
  const pose = character.pose;
  const walking = pose === 'walking';
  const walkCycle = Math.sin(time * 7.6 + phase);
  const bob = walking ? -Math.abs(walkCycle) * 2.3 : Math.sin(time * 1.65 + phase) * 1.5;
  const sway = walking ? walkCycle * 0.009 : Math.sin(time * 1.15 + phase) * 0.012;
  const blinking = isBlinking(time, phase);

  context.save();
  context.translate(character.x, character.y);
  context.scale(direction * scale, scale);
  prepareVectorContext(context, 2.1);
  drawVectorGroundShadow(context, {
    width: 54,
    height: 10,
    primary: 'rgba(27,18,24,0.28)',
    secondary: 'rgba(45,27,22,0.25)',
    tertiary: 'rgba(24,17,21,0.17)',
  });
  context.restore();

  context.save();
  context.translate(character.x, character.y + bob);
  context.scale(direction * scale, scale);
  context.rotate(sway);
  prepareVectorContext(context, 2.1);
  drawKeeperLegs(context, pose, time + phase);
  drawKeeperBackDetails(context);
  drawKeeperBody(context);
  drawKeeperArms(context, time + phase, pose, {
    reducedMotion: character.reducedMotion,
  });
  drawKeeperHead(context, blinking, time + phase, pose, {
    reducedMotion: character.reducedMotion,
  });
  drawKeeperAccessories(context, time + phase, pose, {
    reducedMotion: character.reducedMotion,
  });
  drawKeeperWarmRim(context, direction);
  context.restore();
}

function renderKeeper(surface, request) {
  const portrait = surface === 'portrait';
  const normalized = normalizeVectorRenderRequest(request, {
    surface,
    x: 0,
    y: portrait ? menagerieKeeperPresentation.portrait.y : 0,
    scale: portrait ? menagerieKeeperPresentation.portrait.scale : 1,
    pose: portrait ? 'speaking' : 'idle',
  });
  return drawMenagerieKeeper(normalized.context, normalized.state, normalized.time);
}

export function drawMenagerieKeeperPortraitFigure(request) {
  return renderKeeper('portrait', request);
}

function drawKeeperLegs(context, pose, time) {
  const stride = pose === 'walking' ? Math.sin(time * 7.1) * 5 : 0;
  for (const side of [-1, 1]) {
    const hipX = side * 18;
    const ankleX = hipX + side * stride;
    context.fillStyle = side < 0 ? KEEPER_STYLE.coatMid : KEEPER_STYLE.coatShadow;
    context.beginPath();
    context.moveTo(hipX - 6, -9);
    context.bezierCurveTo(hipX - 7, 2, ankleX - 7, 13, ankleX - 6, 21);
    context.bezierCurveTo(ankleX - 1, 25, ankleX + 6, 24, ankleX + 7, 19);
    context.bezierCurveTo(ankleX + 6, 9, hipX + 7, 1, hipX + 6, -9);
    context.closePath();
    fillStroke(context, 1.7);

    context.fillStyle = KEEPER_STYLE.shoe;
    context.beginPath();
    context.moveTo(ankleX - 8, 15);
    context.bezierCurveTo(ankleX - 1, 13, ankleX + side * 9, 16, ankleX + side * 18, 21);
    context.bezierCurveTo(ankleX + side * 22, 25, ankleX + side * 16, 30, ankleX + side * 7, 30);
    context.bezierCurveTo(ankleX - side * 6, 31, ankleX - side * 11, 26, ankleX - 8, 15);
    context.closePath();
    fillStroke(context, 2.05);
    context.strokeStyle = KEEPER_STYLE.gauntletLight;
    context.lineWidth = 1.15;
    context.beginPath();
    context.moveTo(ankleX - side * 3, 22);
    context.bezierCurveTo(ankleX + side * 6, 20, ankleX + side * 13, 22, ankleX + side * 18, 24);
    context.stroke();
  }
}

function drawKeeperBackDetails(context) {
  context.fillStyle = KEEPER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(-20, -174);
  context.bezierCurveTo(-38, -165, -42, -141, -34, -119);
  context.bezierCurveTo(-31, -106, -22, -98, -15, -104);
  context.bezierCurveTo(-22, -125, -17, -151, -8, -176);
  context.bezierCurveTo(-12, -178, -17, -177, -20, -174);
  context.closePath();
  fillStroke(context, 1.75);

  context.fillStyle = KEEPER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(15, -178);
  context.bezierCurveTo(35, -167, 40, -144, 33, -122);
  context.bezierCurveTo(31, -108, 24, -100, 17, -104);
  context.bezierCurveTo(24, -128, 20, -154, 7, -180);
  context.bezierCurveTo(10, -181, 13, -180, 15, -178);
  context.closePath();
  fillStroke(context, 1.75);

  context.fillStyle = KEEPER_STYLE.hairMid;
  context.beginPath();
  context.moveTo(21, -154);
  context.bezierCurveTo(38, -149, 43, -132, 36, -117);
  context.bezierCurveTo(30, -105, 20, -101, 15, -109);
  context.bezierCurveTo(23, -124, 25, -141, 21, -154);
  context.closePath();
  context.fill();

  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-29, -160);
  context.bezierCurveTo(-36, -140, -31, -117, -22, -105);
  context.moveTo(24, -164);
  context.bezierCurveTo(34, -147, 31, -121, 22, -107);
  context.stroke();

  const braid = [
    [29, -133, -1], [32, -120, 1], [29, -107, -1], [31, -95, 1],
  ];
  for (const [x, y, turn] of braid) drawKeeperBraidLobe(context, x, y, turn);
  context.fillStyle = KEEPER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(26, -86);
  context.bezierCurveTo(29, -93, 35, -93, 37, -87);
  context.bezierCurveTo(35, -79, 29, -78, 26, -86);
  context.closePath();
  fillStroke(context, 1.1);
}

function drawKeeperBraidLobe(context, x, y, turn) {
  context.fillStyle = turn < 0 ? KEEPER_STYLE.hairBase : KEEPER_STYLE.hairMid;
  context.beginPath();
  context.moveTo(x - 6, y - 5);
  context.bezierCurveTo(x - 2, y - 10 - turn, x + 7, y - 7 + turn, x + 7, y);
  context.bezierCurveTo(x + 5, y + 7, x - 3, y + 8 + turn, x - 7, y + 1);
  context.bezierCurveTo(x - 8, y - 1, x - 7, y - 3, x - 6, y - 5);
  context.closePath();
  fillStroke(context, 1.05);
  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(x - 3, y - 5);
  context.quadraticCurveTo(x + 2, y - 7, x + 5, y - 1);
  context.stroke();
}

function drawKeeperBody(context) {
  context.fillStyle = KEEPER_STYLE.coatBase;
  context.beginPath();
  context.moveTo(-33, -103);
  context.bezierCurveTo(-46, -100, -49, -84, -45, -69);
  context.bezierCurveTo(-48, -46, -56, -18, -59, 1);
  context.bezierCurveTo(-39, 9, -18, 12, 1, 7);
  context.bezierCurveTo(21, 13, 43, 9, 59, -1);
  context.bezierCurveTo(56, -21, 49, -48, 45, -70);
  context.bezierCurveTo(48, -86, 43, -100, 32, -104);
  context.bezierCurveTo(14, -111, -15, -110, -33, -103);
  context.closePath();
  fillStroke(context, 2.05);

  context.fillStyle = KEEPER_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(5, -106);
  context.bezierCurveTo(28, -106, 43, -92, 42, -70);
  context.bezierCurveTo(47, -47, 55, -20, 58, -1);
  context.bezierCurveTo(42, 8, 24, 11, 5, 7);
  context.bezierCurveTo(13, -25, 12, -73, 5, -106);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.coatMid;
  context.beginPath();
  context.moveTo(-31, -99);
  context.bezierCurveTo(-41, -82, -40, -60, -40, -46);
  context.bezierCurveTo(-44, -27, -49, -10, -52, -2);
  context.bezierCurveTo(-41, 4, -31, 7, -21, 7);
  context.bezierCurveTo(-25, -27, -19, -74, -11, -98);
  context.bezierCurveTo(-18, -104, -26, -103, -31, -99);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.coatLight;
  context.beginPath();
  context.moveTo(-32, -96);
  context.bezierCurveTo(-40, -79, -36, -58, -39, -39);
  context.bezierCurveTo(-43, -24, -46, -10, -48, -3);
  context.bezierCurveTo(-41, 0, -35, 3, -30, 3);
  context.bezierCurveTo(-33, -28, -25, -70, -32, -96);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.apronBase;
  context.beginPath();
  context.moveTo(-23, -85);
  context.bezierCurveTo(-29, -67, -28, -44, -31, -27);
  context.bezierCurveTo(-35, -15, -38, -6, -40, 0);
  context.bezierCurveTo(-24, 6, -8, 8, 2, 5);
  context.bezierCurveTo(15, 9, 29, 5, 39, 0);
  context.bezierCurveTo(35, -17, 31, -39, 29, -57);
  context.bezierCurveTo(29, -70, 25, -81, 21, -86);
  context.bezierCurveTo(8, -91, -10, -90, -23, -85);
  context.closePath();
  fillStroke(context, 1.35);

  context.fillStyle = KEEPER_STYLE.apronShadow;
  context.beginPath();
  context.moveTo(3, -89);
  context.bezierCurveTo(19, -87, 27, -77, 27, -58);
  context.bezierCurveTo(30, -38, 35, -16, 39, 0);
  context.bezierCurveTo(28, 5, 15, 8, 3, 5);
  context.bezierCurveTo(8, -22, 8, -61, 3, -89);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.apronMid;
  context.beginPath();
  context.moveTo(-21, -81);
  context.bezierCurveTo(-27, -64, -25, -43, -28, -27);
  context.bezierCurveTo(-31, -15, -34, -6, -35, -1);
  context.bezierCurveTo(-27, 3, -19, 5, -12, 5);
  context.bezierCurveTo(-15, -20, -11, -58, -6, -84);
  context.bezierCurveTo(-12, -86, -17, -85, -21, -81);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.apronLight;
  context.beginPath();
  context.moveTo(-21, -77);
  context.bezierCurveTo(-26, -62, -23, -44, -26, -31);
  context.bezierCurveTo(-28, -21, -32, -10, -33, -4);
  context.bezierCurveTo(-28, -1, -23, 1, -19, 1);
  context.bezierCurveTo(-20, -26, -15, -58, -21, -77);
  context.closePath();
  context.fill();

  context.strokeStyle = KEEPER_STYLE.apronShadow;
  context.lineWidth = 5.5;
  context.beginPath();
  context.moveTo(-31, -62);
  context.bezierCurveTo(-14, -57, 12, -57, 32, -63);
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.apronLight;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-29, -64);
  context.bezierCurveTo(-12, -60, 11, -60, 29, -65);
  context.stroke();

  context.strokeStyle = 'rgba(236, 207, 161, 0.3)';
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-17, -53);
  context.bezierCurveTo(-22, -35, -21, -15, -25, 2);
  context.moveTo(0, -56);
  context.bezierCurveTo(-3, -35, -2, -15, -4, 5);
  context.moveTo(17, -54);
  context.bezierCurveTo(22, -34, 22, -15, 27, 2);
  context.stroke();

  context.fillStyle = KEEPER_STYLE.bristle;
  context.beginPath();
  context.moveTo(-22, -102);
  context.bezierCurveTo(-14, -106, -7, -105, 0, -100);
  context.bezierCurveTo(7, -106, 15, -106, 22, -102);
  context.bezierCurveTo(15, -95, 8, -89, 1, -87);
  context.bezierCurveTo(-6, -89, -15, -95, -22, -102);
  context.closePath();
  fillStroke(context, 1.4);
  context.fillStyle = KEEPER_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(-15, -101);
  context.bezierCurveTo(-9, -103, -4, -102, 0, -98);
  context.bezierCurveTo(5, -102, 10, -103, 16, -101);
  context.bezierCurveTo(10, -96, 5, -92, 1, -90);
  context.bezierCurveTo(-4, -92, -10, -96, -15, -101);
  context.closePath();
  context.fill();

  context.fillStyle = WARM_BOUNCE;
  context.beginPath();
  context.moveTo(-56, -8);
  context.bezierCurveTo(-36, -1, -16, 8, 1, 7);
  context.bezierCurveTo(-18, 13, -41, 9, -59, 1);
  context.quadraticCurveTo(-60, -3, -56, -8);
  context.closePath();
  context.fill();
}

function drawKeeperArms(context, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleKeeperMotion({ time, pose, reducedMotion });
  const leftWristX = -47 - motion.gloveLift * 0.08;
  const leftWristY = -26 - motion.gloveLift;
  context.fillStyle = KEEPER_STYLE.coatBase;
  context.beginPath();
  context.moveTo(-30, -100);
  context.bezierCurveTo(-45, -98, -51, -76, -50, -61);
  context.bezierCurveTo(-52, -50, leftWristX - 4, leftWristY - 8, leftWristX + 1, leftWristY - 5);
  context.bezierCurveTo(-41, -58, -33, -82, -30, -100);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = KEEPER_STYLE.coatLight;
  context.beginPath();
  context.moveTo(-35, -92);
  context.bezierCurveTo(-46, -72, -49, -55, leftWristX - 2, leftWristY - 8);
  context.bezierCurveTo(leftWristX + 1, leftWristY - 6, leftWristX + 2, leftWristY - 5, leftWristX + 3, leftWristY - 4);
  context.bezierCurveTo(-42, -69, -37, -84, -35, -92);
  context.closePath();
  context.fill();
  drawKeeperGauntlet(context, leftWristX, leftWristY + 4);

  const rightHandX = 45 + motion.brushBob * 0.3;
  const rightHandY = -26 + motion.brushBob;
  context.fillStyle = KEEPER_STYLE.coatMid;
  context.beginPath();
  context.moveTo(29, -100);
  context.bezierCurveTo(44, -98, 50, -76, 49, -61);
  context.bezierCurveTo(51, -49, rightHandX + 5, rightHandY - 8, rightHandX + 6, rightHandY - 3);
  context.bezierCurveTo(rightHandX + 2, rightHandY + 2, rightHandX - 4, rightHandY + 2, rightHandX - 8, rightHandY - 3);
  context.bezierCurveTo(42, -58, 34, -81, 29, -100);
  context.closePath();
  fillStroke(context, 1.85);
  context.fillStyle = KEEPER_STYLE.coatShadow;
  context.beginPath();
  context.moveTo(35, -92);
  context.bezierCurveTo(46, -76, 48, -57, rightHandX + 2, rightHandY - 6);
  context.bezierCurveTo(47, -57, 39, -77, 35, -92);
  context.closePath();
  context.fill();
  context.strokeStyle = KEEPER_STYLE.apronMid;
  context.lineWidth = 2.7;
  context.beginPath();
  context.moveTo(rightHandX + 5, rightHandY - 4);
  context.bezierCurveTo(rightHandX + 1, rightHandY - 1, rightHandX - 4, rightHandY, rightHandX - 7, rightHandY - 3);
  context.stroke();
  drawHand(context, rightHandX, rightHandY + 7, KEEPER_STYLE.skin, 8);
}

function drawKeeperGauntlet(context, x, y) {
  context.fillStyle = KEEPER_STYLE.gauntletBase;
  context.beginPath();
  context.moveTo(x - 10, y - 11);
  context.bezierCurveTo(x - 7, y - 17, x + 6, y - 17, x + 10, y - 10);
  context.bezierCurveTo(x + 8, y - 4, x + 7, y + 3, x + 9, y + 10);
  context.bezierCurveTo(x + 5, y + 16, x - 5, y + 16, x - 9, y + 9);
  context.bezierCurveTo(x - 7, y + 2, x - 8, y - 5, x - 10, y - 11);
  context.closePath();
  fillStroke(context, 1.65);

  context.fillStyle = KEEPER_STYLE.gauntletShadow;
  context.beginPath();
  context.moveTo(x + 1, y - 15);
  context.bezierCurveTo(x + 8, y - 14, x + 10, y - 7, x + 8, y - 1);
  context.bezierCurveTo(x + 6, y + 4, x + 7, y + 10, x + 7, y + 12);
  context.bezierCurveTo(x + 2, y + 14, x, y + 10, x + 1, y - 15);
  context.closePath();
  context.fill();
  context.strokeStyle = KEEPER_STYLE.gauntletLight;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(x - 7, y - 9);
  context.bezierCurveTo(x - 2, y - 14, x + 4, y - 13, x + 7, y - 9);
  context.moveTo(x - 8, y + 6);
  context.bezierCurveTo(x - 3, y + 10, x + 3, y + 10, x + 7, y + 7);
  context.stroke();
  context.strokeStyle = 'rgba(233, 190, 130, 0.34)';
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(x - 5, y - 4);
  context.quadraticCurveTo(x, y - 1, x + 5, y - 4);
  context.moveTo(x - 5, y + 1);
  context.quadraticCurveTo(x, y + 4, x + 5, y + 1);
  context.stroke();
}

function drawKeeperHead(context, blinking, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleKeeperMotion({ time, pose, reducedMotion });
  context.save();
  context.translate(0, -140);
  context.rotate(motion.headTilt);
  context.translate(0, 140);

  drawKeeperEar(context, -35, -140, -1);
  drawKeeperEar(context, 36, -139, 1);

  context.fillStyle = KEEPER_STYLE.skin;
  context.beginPath();
  context.moveTo(-4, -181);
  context.bezierCurveTo(-24, -183, -36, -168, -35, -148);
  context.bezierCurveTo(-38, -127, -25, -106, -7, -99);
  context.bezierCurveTo(3, -95, 14, -99, 22, -108);
  context.bezierCurveTo(34, -121, 37, -140, 34, -154);
  context.bezierCurveTo(35, -171, 18, -183, -4, -181);
  context.closePath();
  fillStroke(context, 1.9);

  context.fillStyle = KEEPER_STYLE.skinShadow;
  context.globalAlpha = 0.3;
  context.beginPath();
  context.moveTo(5, -180);
  context.bezierCurveTo(25, -177, 35, -164, 33, -149);
  context.bezierCurveTo(35, -132, 28, -114, 20, -107);
  context.bezierCurveTo(14, -101, 7, -99, 3, -103);
  context.bezierCurveTo(11, -126, 11, -158, 5, -180);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = KEEPER_STYLE.skinLight;
  context.beginPath();
  context.moveTo(-27, -168);
  context.bezierCurveTo(-20, -179, -8, -182, 1, -177);
  context.bezierCurveTo(-10, -169, -15, -157, -16, -145);
  context.bezierCurveTo(-25, -146, -32, -158, -27, -168);
  context.closePath();
  context.fill();

  drawKeeperCheek(context, -24, -126, -1);
  drawKeeperCheek(context, 24, -125, 1);
  drawKeeperEyes(context, blinking, time, pose, motion);
  drawKeeperNose(context);
  drawKeeperMouth(context, pose, motion);
  drawKeeperFreckles(context);
  drawKeeperFrontHair(context, motion);

  context.restore();
}

function drawKeeperEar(context, x, y, side) {
  context.fillStyle = KEEPER_STYLE.skin;
  context.beginPath();
  context.moveTo(x - side * 2, y - 8);
  context.bezierCurveTo(x + side * 8, y - 10, x + side * 10, y + 4, x + side * 3, y + 10);
  context.bezierCurveTo(x - side * 5, y + 8, x - side * 7, y - 3, x - side * 2, y - 8);
  context.closePath();
  fillStroke(context, 1.55);
  context.strokeStyle = 'rgba(116, 62, 54, 0.36)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(x + side, y - 4);
  context.bezierCurveTo(x + side * 6, y - 2, x + side * 5, y + 5, x, y + 6);
  context.stroke();
}

function drawKeeperCheek(context, x, y, side) {
  context.fillStyle = KEEPER_STYLE.cheek;
  context.beginPath();
  context.moveTo(x - 8, y - 1);
  context.bezierCurveTo(x - 5, y - 5 - side, x + 5, y - 5 + side, x + 8, y);
  context.bezierCurveTo(x + 5, y + 4, x - 5, y + 5 + side, x - 8, y - 1);
  context.closePath();
  context.fill();
}

function drawKeeperEyes(context, blinking, time, pose, motion) {
  const gazeX = Math.sin(time * 0.64 + 3.2) * 1.15;
  const gazeY = Math.sin(time * 0.41 + 1.8) * 0.48;
  const eyes = [
    { x: -12.8, y: -145.2, side: -1, width: 6.8, height: 5 },
    { x: 12.5, y: -144.5, side: 1, width: 6.4, height: 4.7 },
  ];
  for (const eye of eyes) {
    if (blinking) {
      context.fillStyle = KEEPER_STYLE.skinShadow;
      context.globalAlpha = 0.4;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 3, eye.y - 2, eye.x + 3, eye.y - 1.7, eye.x + eye.width, eye.y);
      context.bezierCurveTo(eye.x + 3, eye.y + 2.4, eye.x - 3, eye.y + 2.5, eye.x - eye.width, eye.y + 0.2);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = DEEP_OUTLINE;
      context.lineWidth = 1.45;
      context.beginPath();
      context.moveTo(eye.x - eye.width, eye.y + 0.2);
      context.bezierCurveTo(eye.x - 2.5, eye.y + 2.1, eye.x + 3, eye.y + 2.1, eye.x + eye.width, eye.y);
      context.stroke();
      continue;
    }

    context.fillStyle = '#f3e8d4';
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3, eye.y - eye.height, eye.x + 3.2, eye.y - eye.height + eye.side * 0.2, eye.x + eye.width, eye.y - 0.25);
    context.bezierCurveTo(eye.x + 3, eye.y + eye.height * 0.72, eye.x - 3.2, eye.y + eye.height * 0.8, eye.x - eye.width, eye.y + 0.2);
    context.closePath();
    fillStroke(context, 1.35);

    const irisX = eye.x + gazeX;
    const irisY = eye.y + gazeY;
    context.fillStyle = KEEPER_STYLE.iris;
    context.beginPath();
    context.moveTo(irisX - 0.3, irisY - 3.7);
    context.bezierCurveTo(irisX + 3.2, irisY - 3.1, irisX + 3.5, irisY + 1.8, irisX + 0.2, irisY + 3.55);
    context.bezierCurveTo(irisX - 3.1, irisY + 2.9, irisX - 3.4, irisY - 2.4, irisX - 0.3, irisY - 3.7);
    context.closePath();
    context.fill();
    context.fillStyle = '#221a17';
    context.beginPath();
    context.moveTo(irisX, irisY - 2);
    context.bezierCurveTo(irisX + 1.65, irisY - 1.55, irisX + 1.75, irisY + 1.25, irisX + 0.1, irisY + 2);
    context.bezierCurveTo(irisX - 1.6, irisY + 1.5, irisX - 1.7, irisY - 1.3, irisX, irisY - 2);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(255, 247, 220, 0.93)';
    context.beginPath();
    context.moveTo(irisX - 1.7, irisY - 2.2);
    context.quadraticCurveTo(irisX - 0.5, irisY - 2.9, irisX + 0.15, irisY - 1.75);
    context.quadraticCurveTo(irisX - 0.7, irisY - 0.7, irisX - 1.7, irisY - 2.2);
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(72, 49, 43, 0.58)';
    context.lineWidth = 1.05;
    context.beginPath();
    context.moveTo(eye.x - eye.width, eye.y + 0.2);
    context.bezierCurveTo(eye.x - 3, eye.y - eye.height, eye.x + 3.2, eye.y - eye.height + eye.side * 0.2, eye.x + eye.width, eye.y - 0.25);
    context.stroke();
  }

  const proud = pose === 'proud';
  const leftLift = motion.browLift + (proud ? 0.7 : 0.2);
  const rightLift = motion.browLift * 0.6 - (proud ? 0.4 : 0);
  context.strokeStyle = KEEPER_STYLE.hairShadow;
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(-21, -157 - leftLift);
  context.bezierCurveTo(-16, -161.5 - leftLift, -10, -161.5 - leftLift, -6, -157 - leftLift * 0.8);
  context.moveTo(6, -157 - rightLift);
  context.bezierCurveTo(10, -160.5 - rightLift, 16, -160.5 - rightLift, 21, -156.5 - rightLift * 0.7);
  context.stroke();
}

function drawKeeperNose(context) {
  context.fillStyle = 'rgba(154, 88, 71, 0.2)';
  context.beginPath();
  context.moveTo(-1, -143);
  context.bezierCurveTo(-4, -136, -5, -128, -2, -124);
  context.bezierCurveTo(1, -121, 7, -123, 7, -127);
  context.bezierCurveTo(4, -132, 3, -140, -1, -143);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(104, 63, 55, 0.52)';
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(-1, -141);
  context.bezierCurveTo(-3, -133, -3, -126, 3, -125);
  context.quadraticCurveTo(6, -124, 7, -127);
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.skinLight;
  context.lineWidth = 0.75;
  context.beginPath();
  context.moveTo(-1, -138);
  context.quadraticCurveTo(-2, -132, 0, -129);
  context.stroke();
}

function drawKeeperMouth(context, pose, motion) {
  const speaking = pose === 'speaking' || pose === 'talk';
  const y = -112.5;
  if (speaking) {
    context.fillStyle = '#804a50';
    context.beginPath();
    context.moveTo(-7.5, y);
    context.bezierCurveTo(-3, y - 2.4, 3.5, y - 2.2, 8, y + 0.2);
    context.bezierCurveTo(5, y + motion.mouthOpen, -3, y + motion.mouthOpen + 0.7, -7.5, y);
    context.closePath();
    fillStroke(context, 1.15);
    context.fillStyle = 'rgba(232, 144, 143, 0.62)';
    context.beginPath();
    context.moveTo(-4.5, y + motion.mouthOpen * 0.55);
    context.quadraticCurveTo(0, y + motion.mouthOpen + 0.5, 4.8, y + motion.mouthOpen * 0.52);
    context.quadraticCurveTo(0.4, y + motion.mouthOpen * 0.34, -4.5, y + motion.mouthOpen * 0.55);
    context.closePath();
    context.fill();
    return;
  }

  context.strokeStyle = '#805057';
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(-8, y + 0.5);
  if (pose === 'proud') context.bezierCurveTo(-3, y + 4.7, 4, y + 4.2, 9, y - 0.4);
  else context.bezierCurveTo(-3, y + 3.7, 3.5, y + 3.4, 8.5, y - 0.2);
  context.stroke();
  context.strokeStyle = 'rgba(255, 216, 193, 0.3)';
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(-5, y + 0.9);
  context.quadraticCurveTo(-1, y + 2.6, 3, y + 1.5);
  context.stroke();
}

function drawKeeperFreckles(context) {
  context.fillStyle = 'rgba(112, 63, 46, 0.52)';
  for (const [x, y, turn] of [
    [-24, -128, -1], [-19, -126, 1], [-14, -128, -1], [15, -127, 1], [20, -125, -1], [25, -128, 1],
  ]) {
    context.beginPath();
    context.moveTo(x - 1.1, y);
    context.bezierCurveTo(x - 0.5, y - 1.1, x + 1, y - 0.8 + turn * 0.15, x + 1.2, y + 0.2);
    context.bezierCurveTo(x + 0.5, y + 1, x - 0.8, y + 0.8, x - 1.1, y);
    context.closePath();
    context.fill();
  }
}

function drawKeeperFrontHair(context, motion) {
  context.fillStyle = KEEPER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(-34, -151);
  context.bezierCurveTo(-38, -171, -24, -185, -8, -185);
  context.bezierCurveTo(7, -192, 26, -184, 32, -169);
  context.bezierCurveTo(37, -157, 33, -145, 28, -140);
  context.bezierCurveTo(24, -154, 17, -159, 10, -156);
  context.bezierCurveTo(3, -153, -2, -149, -9, -154);
  context.bezierCurveTo(-17, -159, -25, -158, -34, -151);
  context.closePath();
  fillStroke(context, 1.8);

  context.fillStyle = KEEPER_STYLE.hairShadow;
  context.beginPath();
  context.moveTo(4, -187);
  context.bezierCurveTo(20, -187, 32, -177, 33, -163);
  context.bezierCurveTo(36, -154, 32, -145, 28, -140);
  context.bezierCurveTo(23, -153, 17, -158, 10, -156);
  context.bezierCurveTo(14, -169, 11, -181, 4, -187);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.hairMid;
  context.beginPath();
  context.moveTo(-31, -158);
  context.bezierCurveTo(-30, -174, -17, -184, -4, -185);
  context.bezierCurveTo(-16, -179, -21, -168, -19, -157);
  context.bezierCurveTo(-24, -160, -28, -159, -31, -158);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.hairLight;
  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(-27, -169);
  context.bezierCurveTo(-20, -181, -7, -187, 2, -183);
  context.bezierCurveTo(-9, -178, -15, -168, -16, -157);
  context.bezierCurveTo(-24, -158, -31, -163, -27, -169);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 1.15;
  context.beginPath();
  context.moveTo(-28, -171);
  context.bezierCurveTo(-18, -185, -4, -187, 8, -182);
  context.moveTo(-25, -162);
  context.bezierCurveTo(-14, -176, 2, -181, 17, -174);
  context.moveTo(-15, -156);
  context.bezierCurveTo(-3, -166, 13, -170, 26, -160);
  context.stroke();

  for (const [x, y, turn] of [[-30, -154, -1], [-24, -146, 1], [27, -153, 1], [30, -145, -1]]) {
    drawKeeperCurl(context, x + motion.curlSway * turn * 0.35, y, turn);
  }
}

function drawKeeperCurl(context, x, y, turn) {
  context.fillStyle = turn < 0 ? KEEPER_STYLE.hairMid : KEEPER_STYLE.hairBase;
  context.beginPath();
  context.moveTo(x - 5, y - 4);
  context.bezierCurveTo(x - 2, y - 9, x + 6, y - 7, x + 7, y - 1);
  context.bezierCurveTo(x + 6, y + 5, x - 2, y + 7, x - 6, y + 1);
  context.bezierCurveTo(x - 7, y - 1, x - 6, y - 3, x - 5, y - 4);
  context.closePath();
  fillStroke(context, 0.95);
  context.strokeStyle = KEEPER_STYLE.hairLight;
  context.lineWidth = 0.65;
  context.beginPath();
  context.moveTo(x - 2, y - 4);
  context.quadraticCurveTo(x + 3, y - 6, x + 5, y - 1);
  context.stroke();
}

function drawKeeperAccessories(context, time, pose, { reducedMotion = false } = {}) {
  const motion = sampleKeeperMotion({ time, pose, reducedMotion });
  const sway = motion.pouchSway;

  context.strokeStyle = DEEP_OUTLINE;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-25, -97);
  context.bezierCurveTo(-5, -79, 15, -61, 34 + sway * 0.25, -38);
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.pouchBase;
  context.lineWidth = 4.5;
  context.stroke();
  context.strokeStyle = KEEPER_STYLE.pouchLight;
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-24, -98);
  context.bezierCurveTo(-5, -81, 15, -63, 33 + sway * 0.25, -40);
  context.stroke();

  const pouchX = 39 + sway * 0.45;
  const pouchY = -30;
  drawKeeperFeather(context, pouchX + 6, pouchY - 13, motion.curlSway * 0.012);
  context.fillStyle = KEEPER_STYLE.pouchBase;
  context.beginPath();
  context.moveTo(pouchX - 16, pouchY - 16);
  context.bezierCurveTo(pouchX - 7, pouchY - 21, pouchX + 10, pouchY - 20, pouchX + 16, pouchY - 13);
  context.bezierCurveTo(pouchX + 18, pouchY - 3, pouchX + 15, pouchY + 10, pouchX + 9, pouchY + 15);
  context.bezierCurveTo(pouchX - 2, pouchY + 19, pouchX - 13, pouchY + 14, pouchX - 17, pouchY + 5);
  context.bezierCurveTo(pouchX - 18, pouchY - 4, pouchX - 19, pouchY - 11, pouchX - 16, pouchY - 16);
  context.closePath();
  fillStroke(context, 1.65);
  context.fillStyle = KEEPER_STYLE.pouchShadow;
  context.beginPath();
  context.moveTo(pouchX + 1, pouchY - 18);
  context.bezierCurveTo(pouchX + 11, pouchY - 17, pouchX + 17, pouchY - 10, pouchX + 15, pouchY - 2);
  context.bezierCurveTo(pouchX + 15, pouchY + 7, pouchX + 11, pouchY + 13, pouchX + 7, pouchY + 15);
  context.bezierCurveTo(pouchX + 4, pouchY + 4, pouchX + 4, pouchY - 8, pouchX + 1, pouchY - 18);
  context.closePath();
  context.fill();
  context.fillStyle = KEEPER_STYLE.pouchLight;
  context.globalAlpha = 0.42;
  context.beginPath();
  context.moveTo(pouchX - 13, pouchY - 13);
  context.bezierCurveTo(pouchX - 7, pouchY - 18, pouchX + 1, pouchY - 17, pouchX + 4, pouchY - 13);
  context.bezierCurveTo(pouchX - 3, pouchY - 10, pouchX - 7, pouchY - 3, pouchX - 8, pouchY + 5);
  context.bezierCurveTo(pouchX - 14, pouchY + 1, pouchX - 16, pouchY - 7, pouchX - 13, pouchY - 13);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = KEEPER_STYLE.gauntletLight;
  context.lineWidth = 1.05;
  context.beginPath();
  context.moveTo(pouchX - 13, pouchY - 9);
  context.bezierCurveTo(pouchX - 4, pouchY - 4, pouchX + 6, pouchY - 5, pouchX + 13, pouchY - 10);
  context.stroke();
  drawKeeperPawClasp(context, pouchX - 1, pouchY + 3);

  const handX = 45 + motion.brushBob * 0.3;
  const handY = -19 + motion.brushBob;
  drawKeeperBrush(context, handX, handY, motion.brushTilt);
}

function drawKeeperFeather(context, x, y, rotation) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = KEEPER_STYLE.featherBase;
  context.beginPath();
  context.moveTo(0, 5);
  context.bezierCurveTo(-8, -3, -9, -17, -2, -28);
  context.bezierCurveTo(5, -19, 8, -6, 0, 5);
  context.closePath();
  fillStroke(context, 1.05);
  context.fillStyle = KEEPER_STYLE.featherLight;
  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(-1, 2);
  context.bezierCurveTo(-5, -7, -5, -17, -2, -24);
  context.bezierCurveTo(0, -15, 1, -6, -1, 2);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = KEEPER_STYLE.featherLight;
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(0, 7);
  context.bezierCurveTo(-1, -5, -1, -17, -2, -27);
  context.moveTo(-1, -7);
  context.quadraticCurveTo(-5, -11, -7, -13);
  context.moveTo(-1, -13);
  context.quadraticCurveTo(3, -16, 5, -19);
  context.stroke();
  context.restore();
}

function drawKeeperPawClasp(context, x, y) {
  context.fillStyle = KEEPER_STYLE.gauntletLight;
  context.beginPath();
  context.moveTo(x - 5, y + 1);
  context.bezierCurveTo(x - 4, y - 4, x + 3, y - 5, x + 5, y);
  context.bezierCurveTo(x + 5, y + 5, x - 3, y + 6, x - 5, y + 1);
  context.closePath();
  context.fill();
  for (const [dx, dy, turn] of [[-5, -5, -1], [0, -7, 1], [5, -5, -1]]) {
    context.beginPath();
    context.moveTo(x + dx - 2, y + dy);
    context.bezierCurveTo(x + dx - 1, y + dy - 3, x + dx + 2, y + dy - 3 + turn * 0.15, x + dx + 2, y + dy);
    context.bezierCurveTo(x + dx + 1, y + dy + 2, x + dx - 1, y + dy + 2, x + dx - 2, y + dy);
    context.closePath();
    context.fill();
  }
  context.strokeStyle = KEEPER_STYLE.pouchShadow;
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(x - 5, y + 1);
  context.bezierCurveTo(x - 4, y - 4, x + 3, y - 5, x + 5, y);
  context.stroke();
}

function drawKeeperBrush(context, x, y, rotation) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = KEEPER_STYLE.brushWood;
  context.beginPath();
  context.moveTo(-3, 5);
  context.bezierCurveTo(-2, -8, -1, -24, -3, -38);
  context.bezierCurveTo(-1, -43, 5, -43, 7, -38);
  context.bezierCurveTo(5, -23, 5, -7, 4, 6);
  context.bezierCurveTo(2, 10, -1, 9, -3, 5);
  context.closePath();
  fillStroke(context, 1.35);
  context.fillStyle = KEEPER_STYLE.brushLight;
  context.beginPath();
  context.moveTo(0, 2);
  context.bezierCurveTo(1, -10, 2, -25, 1, -37);
  context.bezierCurveTo(3, -39, 5, -39, 5, -36);
  context.bezierCurveTo(4, -22, 4, -7, 3, 3);
  context.bezierCurveTo(2, 5, 1, 5, 0, 2);
  context.closePath();
  context.fill();

  context.fillStyle = KEEPER_STYLE.bristle;
  context.beginPath();
  context.moveTo(-12, -39);
  context.bezierCurveTo(-8, -48, 10, -51, 15, -42);
  context.bezierCurveTo(17, -35, 11, -30, 2, -29);
  context.bezierCurveTo(-8, -29, -14, -33, -12, -39);
  context.closePath();
  fillStroke(context, 1.4);
  context.fillStyle = KEEPER_STYLE.bristleShadow;
  context.beginPath();
  context.moveTo(3, -48);
  context.bezierCurveTo(11, -48, 16, -44, 15, -39);
  context.bezierCurveTo(14, -34, 9, -31, 3, -30);
  context.bezierCurveTo(7, -36, 7, -42, 3, -48);
  context.closePath();
  context.fill();
  context.strokeStyle = 'rgba(248, 227, 181, 0.42)';
  context.lineWidth = 0.8;
  context.beginPath();
  for (const offset of [-8, -3, 2, 7, 12]) {
    context.moveTo(offset, -42 + Math.abs(offset) * 0.08);
    context.bezierCurveTo(offset - 1, -38, offset - 1, -34, offset - 2, -31);
  }
  context.stroke();
  context.restore();
}


function drawKeeperWarmRim(context, facingDirection) {
  context.save();
  if (facingDirection < 0) context.scale(-1, 1);
  context.strokeStyle = KEEPER_STYLE.rim;
  context.lineWidth = 1.65;
  context.beginPath();
  context.moveTo(-34, -151);
  context.bezierCurveTo(-38, -170, -24, -185, -8, -187);
  context.bezierCurveTo(-3, -190, 2, -189, 7, -187);
  context.moveTo(-35, -98);
  context.bezierCurveTo(-48, -88, -49, -70, -46, -58);
  context.bezierCurveTo(-51, -38, -56, -17, -58, -2);
  context.bezierCurveTo(-48, 3, -38, 7, -28, 9);
  context.stroke();

  context.strokeStyle = 'rgba(255, 238, 192, 0.23)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-30, -169);
  context.bezierCurveTo(-22, -182, -9, -187, 2, -184);
  context.moveTo(-40, -88);
  context.bezierCurveTo(-46, -67, -48, -36, -53, -7);
  context.stroke();
  context.restore();
}

export const menagerieKeeperPortraitPresentation = defineCharacterPortraitPresentation({
  backdrop: {
    dark: menagerieKeeperPresentation.portrait.backdrop[0],
    light: menagerieKeeperPresentation.portrait.backdrop[1],
  },
  figure: {
    x: 0,
    y: menagerieKeeperPresentation.portrait.y,
    scale: menagerieKeeperPresentation.portrait.scale,
  },
});

const drawMenagerieKeeperPortrait = createCharacterPortraitRenderer({
  presentation: menagerieKeeperPortraitPresentation,
  drawFigure: drawMenagerieKeeperPortraitFigure,
  prepareFigureState: (state) => ({
    facing: state.facing,
    lightSide: state.lightSide,
    pose: (state.pose ?? 'speaking') === 'talk' ? 'speaking' : (state.pose ?? 'speaking'),
    reducedMotion: state.reducedMotion,
  }),
});

export const menagerieKeeperCharacterRuntime = createVectorCharacterRuntime({
  drawWorld: (request) => renderKeeper('world', request),
  drawPortrait: drawMenagerieKeeperPortrait,
});
