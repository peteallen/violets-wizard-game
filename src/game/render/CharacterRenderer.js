import { PALETTE } from '../config.js';

const OUTLINE = '#3a2d22';
const RIM_LIGHT = 'rgba(255, 231, 168, 0.72)';
const SHADOW_WASH = 'rgba(37, 26, 35, 0.22)';

const CHARACTER_COLORS = Object.freeze({
  guide: {
    robe: '#5d4938', robeShadow: '#3f322b', accent: '#a9865a', hair: '#34261f', hairLight: '#654536', skin: '#bd7d5e', cheek: '#b76858',
  },
  wandmaker: {
    robe: '#34364d', robeShadow: '#242638', accent: '#c6b681', hair: '#ddd4bc', hairLight: '#f3ead3', skin: '#d3a17d', cheek: '#c27d73',
  },
  tailor: {
    robe: '#81486f', robeShadow: '#58324e', accent: '#efbd78', hair: '#3c2923', hairLight: '#6a4536', skin: '#b97657', cheek: '#a95859',
  },
  keeper: {
    robe: '#496653', robeShadow: '#32483d', accent: '#d5bd68', hair: '#9a6038', hairLight: '#c38250', skin: '#cc916c', cheek: '#b76561',
  },
});

export class CharacterRenderer {
  draw(context, character, time = 0) {
    if (character.kind === 'violet') this.drawViolet(context, character, time);
    else this.drawNpc(context, character, time);
  }

  drawViolet(context, character, time) {
    const scale = character.scale ?? 1;
    const direction = character.facing === 'left' ? -1 : 1;
    const walking = Boolean(character.walking);
    const stride = walking ? Math.sin(time * 10.5) : 0;
    const bob = walking ? -Math.abs(stride) * 3.4 : Math.sin(time * 2.1) * 1.6;
    const idleSway = walking ? 0 : Math.sin(time * 1.35) * 0.018;
    const trim = character.robeTrim ?? PALETTE.violet;
    const blinking = isBlinking(time, 0.1);

    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.rotate(idleSway);
    prepare(context, 3.2);

    drawVioletLeg(context, -15, stride * 8, true);
    drawVioletLeg(context, 15, -stride * 8, false);
    drawVioletBackHair(context);
    drawVioletBackArm(context, stride, trim);
    drawVioletRobe(context, trim);
    drawVioletFrontArm(context, stride, trim, Boolean(character.wand), time);
    drawVioletHead(context, blinking, time);
    drawVioletCollar(context, trim);
    drawUpperLeftRim(context, [
      [-43, -163], [-34, -183], [-10, -194], [12, -191], [34, -176], [43, -151],
    ], 3.1);

    context.restore();
  }

  drawNpc(context, character, time) {
    const kind = character.kind in CHARACTER_COLORS ? character.kind : 'guide';
    const palette = CHARACTER_COLORS[kind];
    const scale = (character.scale ?? 1) * (kind === 'guide' ? 1.55 : 1.04);
    const direction = character.facing === 'left' ? -1 : 1;
    const phase = character.phase ?? kind.length * 0.37;
    const bob = Math.sin(time * 1.65 + phase) * 1.5;
    const sway = Math.sin(time * 1.15 + phase) * 0.012;
    const blinking = isBlinking(time, phase);

    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.rotate(sway);
    prepare(context, 3.1);

    drawNpcBackDetails(context, kind, palette);
    drawNpcBody(context, kind, palette);
    drawNpcArms(context, kind, palette, time + phase);
    drawNpcHead(context, kind, palette, blinking, time + phase);
    drawNpcAccessory(context, kind, palette);
    drawUpperLeftRim(context, kind === 'guide'
      ? [[-55, -129], [-54, -161], [-37, -185], [-10, -197], [17, -192], [42, -174]]
      : [[-39, -132], [-34, -164], [-13, -182], [14, -180], [35, -160]], 2.8);

    context.restore();
  }

  drawPet(context, pet, time = 0) {
    if (!pet?.type) return;
    const bounce = Math.sin(time * 3.7 + (pet.type?.length ?? 0)) * 1.8;
    const scale = pet.scale ?? 1;
    context.save();
    context.translate(pet.x, pet.y + bounce);
    context.scale(scale, scale);
    prepare(context, 2.8);

    if (pet.type === 'cat') drawCat(context, time);
    else if (pet.type === 'owl') drawOwl(context, time);
    else drawToad(context, time);

    context.restore();
  }
}

function prepare(context, lineWidth) {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = OUTLINE;
  context.lineWidth = lineWidth;
}

function drawVioletLeg(context, x, stride, behind) {
  context.save();
  context.globalAlpha = behind ? 0.9 : 1;
  context.strokeStyle = '#493b55';
  context.lineWidth = 11;
  context.beginPath();
  context.moveTo(x, -8);
  context.quadraticCurveTo(x + stride * 0.25, 10, x + stride, 24);
  context.stroke();

  context.strokeStyle = OUTLINE;
  context.lineWidth = 14;
  context.beginPath();
  context.moveTo(x + stride - 4, 25);
  context.lineTo(x + stride + 16, 25);
  context.stroke();
  context.strokeStyle = '#6f4caf';
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x + stride - 3, 24);
  context.lineTo(x + stride + 15, 24);
  context.stroke();
  context.strokeStyle = '#ae8de0';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(x + stride + 2, 20);
  context.lineTo(x + stride + 12, 20);
  context.stroke();
  context.restore();
}

function drawVioletBackHair(context) {
  context.fillStyle = '#826044';
  context.beginPath();
  context.moveTo(-34, -168);
  context.bezierCurveTo(-50, -151, -45, -111, -39, -79);
  context.quadraticCurveTo(-29, -63, -17, -77);
  context.quadraticCurveTo(-5, -59, 7, -77);
  context.quadraticCurveTo(23, -61, 35, -82);
  context.bezierCurveTo(47, -119, 45, -151, 31, -170);
  context.closePath();
  fillStroke(context);
  context.fillStyle = 'rgba(246, 211, 143, 0.2)';
  context.beginPath();
  context.moveTo(-29, -162);
  context.bezierCurveTo(-40, -133, -35, -103, -30, -84);
  context.quadraticCurveTo(-23, -78, -19, -87);
  context.bezierCurveTo(-24, -112, -19, -145, -8, -170);
  context.closePath();
  context.fill();
}

function drawVioletBackArm(context, stride, trim) {
  const swing = stride * 7;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 18;
  context.beginPath();
  context.moveTo(-34, -91);
  context.quadraticCurveTo(-49, -61 + swing * 0.2, -45 - swing * 0.25, -34 + swing);
  context.stroke();
  context.strokeStyle = '#292532';
  context.lineWidth = 12;
  context.stroke();
  context.strokeStyle = trim;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-49 - swing * 0.25, -40 + swing);
  context.lineTo(-42 - swing * 0.25, -35 + swing);
  context.stroke();
  drawHand(context, -43 - swing * 0.25, -27 + swing, '#d9a17b', 8);
}

function drawVioletRobe(context, trim) {
  context.fillStyle = '#2b2733';
  context.beginPath();
  context.moveTo(-30, -101);
  context.quadraticCurveTo(-47, -92, -45, -70);
  context.bezierCurveTo(-46, -43, -55, -14, -59, 1);
  context.quadraticCurveTo(-27, 14, 0, 8);
  context.quadraticCurveTo(27, 14, 59, 1);
  context.bezierCurveTo(55, -17, 45, -46, 45, -71);
  context.quadraticCurveTo(46, -93, 29, -101);
  context.closePath();
  fillStroke(context);

  context.fillStyle = SHADOW_WASH;
  context.beginPath();
  context.moveTo(7, -94);
  context.quadraticCurveTo(38, -80, 39, -50);
  context.quadraticCurveTo(40, -18, 51, 1);
  context.quadraticCurveTo(28, 9, 5, 6);
  context.closePath();
  context.fill();

  context.strokeStyle = trim;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(-51, 0);
  context.quadraticCurveTo(0, 15, 51, 0);
  context.stroke();
  context.strokeStyle = 'rgba(255,255,255,0.22)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-48, -1);
  context.quadraticCurveTo(-20, 5, 0, 5);
  context.stroke();
}

function drawVioletFrontArm(context, stride, trim, hasWand, time) {
  const swing = -stride * 7;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 19;
  context.beginPath();
  context.moveTo(34, -91);
  context.quadraticCurveTo(48, -62 + swing * 0.15, 43 + swing * 0.25, -34 + swing);
  context.stroke();
  context.strokeStyle = '#302b38';
  context.lineWidth = 12.5;
  context.stroke();
  context.strokeStyle = trim;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(39 + swing * 0.25, -43 + swing);
  context.lineTo(47 + swing * 0.25, -40 + swing);
  context.stroke();
  const handX = 43 + swing * 0.25;
  const handY = -27 + swing;
  drawHand(context, handX, handY, '#d9a17b', 8.5);

  if (hasWand) {
    context.strokeStyle = OUTLINE;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(handX + 1, handY - 2);
    context.lineTo(handX + 39, handY - 55);
    context.stroke();
    context.strokeStyle = '#68442e';
    context.lineWidth = 3.5;
    context.stroke();
    context.fillStyle = PALETTE.interactive;
    context.globalAlpha = 0.78 + Math.sin(time * 4.5) * 0.16;
    context.beginPath();
    context.arc(handX + 40, handY - 57, 4.3, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }
}

function drawVioletHead(context, blinking, time) {
  drawEar(context, -37, -142, '#d9a17b');
  drawEar(context, 37, -142, '#d9a17b');

  context.fillStyle = '#d9a17b';
  context.beginPath();
  context.ellipse(0, -142, 37, 42, 0, 0, Math.PI * 2);
  fillStroke(context);

  context.fillStyle = 'rgba(189, 82, 91, 0.22)';
  context.beginPath();
  context.ellipse(-24, -128, 9, 5, -0.12, 0, Math.PI * 2);
  context.ellipse(24, -128, 9, 5, 0.12, 0, Math.PI * 2);
  context.fill();

  drawStorybookEyes(context, -13, -145, 13, -145, '#5a3d28', blinking);
  context.strokeStyle = '#6d4736';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -142);
  context.quadraticCurveTo(-2, -132, 3, -133);
  context.stroke();
  drawSmile(context, 0, -119, 12, '#9b565d');

  context.fillStyle = '#8b6b4a';
  context.beginPath();
  context.moveTo(-36, -154);
  context.bezierCurveTo(-39, -180, -20, -193, 3, -192);
  context.bezierCurveTo(27, -192, 40, -176, 37, -151);
  context.quadraticCurveTo(29, -169, 16, -169);
  context.quadraticCurveTo(5, -157, -4, -170);
  context.quadraticCurveTo(-17, -156, -28, -167);
  context.quadraticCurveTo(-31, -158, -36, -154);
  context.closePath();
  fillStroke(context);

  context.strokeStyle = '#8b6b4a';
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(-30, -160);
  context.quadraticCurveTo(-43, -137, -32, -112);
  context.moveTo(31, -158);
  context.quadraticCurveTo(42, -136, 31, -111);
  context.stroke();
  context.strokeStyle = 'rgba(244,213,141,0.42)';
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(-28, -179);
  context.quadraticCurveTo(-13, -188, 2, -186);
  context.stroke();

  drawFlyaway(context, -22, -188, -42, -202 + Math.sin(time * 3.1) * 3);
  drawFlyaway(context, -7, -193, -5, -211 + Math.sin(time * 3.5) * 4);
  drawFlyaway(context, 8, -191, 18, -207 + Math.sin(time * 2.8) * 3);
  drawFlyaway(context, 25, -183, 44, -194 + Math.sin(time * 3.3) * 3);
}

function drawVioletCollar(context, trim) {
  context.fillStyle = '#efe3cc';
  context.beginPath();
  context.moveTo(-25, -100);
  context.lineTo(-3, -81);
  context.lineTo(0, -99);
  context.lineTo(3, -81);
  context.lineTo(25, -100);
  context.quadraticCurveTo(0, -111, -25, -100);
  context.closePath();
  fillStroke(context, 2.4);
  context.strokeStyle = trim;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-25, -96);
  context.quadraticCurveTo(0, -77, 25, -96);
  context.stroke();
}

function drawNpcBackDetails(context, kind, palette) {
  if (kind === 'tailor') {
    context.fillStyle = palette.hair;
    context.beginPath();
    context.arc(23, -166, 17, 0, Math.PI * 2);
    fillStroke(context);
  }
  if (kind === 'keeper') {
    context.fillStyle = palette.hair;
    context.beginPath();
    context.ellipse(27, -137, 16, 30, -0.2, 0, Math.PI * 2);
    fillStroke(context);
  }
}

function drawNpcBody(context, kind, palette) {
  const broad = kind === 'guide';
  const shoulder = broad ? 47 : 34;
  const hem = broad ? 66 : 52;
  const top = broad ? -111 : -99;
  context.fillStyle = palette.robe;
  context.beginPath();
  context.moveTo(-shoulder, top);
  context.quadraticCurveTo(-hem + 6, -70, -hem, 0);
  context.quadraticCurveTo(0, 12, hem, 0);
  context.quadraticCurveTo(hem - 6, -70, shoulder, top);
  context.closePath();
  fillStroke(context);

  context.strokeStyle = palette.accent;
  context.lineWidth = broad ? 8 : 6;
  context.beginPath();
  context.moveTo(-shoulder + 3, top + 11);
  context.quadraticCurveTo(0, top + 22, shoulder - 3, top + 11);
  context.stroke();

  context.fillStyle = SHADOW_WASH;
  context.beginPath();
  context.moveTo(6, top + 6);
  context.quadraticCurveTo(shoulder + 5, -70, hem - 8, -2);
  context.quadraticCurveTo(30, 6, 6, 5);
  context.closePath();
  context.fill();
}

function drawNpcArms(context, kind, palette, time) {
  const broad = kind === 'guide';
  const shoulderX = broad ? 45 : 34;
  const handY = broad ? -39 : -31;
  const sway = Math.sin(time * 1.4) * 2;
  for (const side of [-1, 1]) {
    context.strokeStyle = OUTLINE;
    context.lineWidth = broad ? 22 : 17;
    context.beginPath();
    context.moveTo(side * shoulderX, broad ? -104 : -93);
    context.quadraticCurveTo(side * (shoulderX + 12), -64, side * (shoulderX + 6 + sway), handY);
    context.stroke();
    context.strokeStyle = palette.robe;
    context.lineWidth = broad ? 15 : 11;
    context.stroke();
    context.strokeStyle = palette.accent;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(side * (shoulderX + 11 + sway), handY - 8);
    context.lineTo(side * (shoulderX + 4 + sway), handY - 4);
    context.stroke();
    drawHand(context, side * (shoulderX + 7 + sway), handY + 7, palette.skin, broad ? 9 : 7.5);
  }
}

function drawNpcHead(context, kind, palette, blinking, time) {
  const broad = kind === 'guide';
  const headY = broad ? -151 : -137;
  const rx = broad ? 41 : 34;
  const ry = broad ? 43 : 38;
  drawEar(context, -rx, headY, palette.skin, broad ? 8 : 6.5);
  drawEar(context, rx, headY, palette.skin, broad ? 8 : 6.5);

  context.fillStyle = palette.skin;
  context.beginPath();
  context.ellipse(0, headY, rx, ry, 0, 0, Math.PI * 2);
  fillStroke(context);

  context.fillStyle = palette.cheek;
  context.globalAlpha = 0.22;
  context.beginPath();
  context.ellipse(-rx * 0.62, headY + 13, broad ? 10 : 8, 4.5, -0.1, 0, Math.PI * 2);
  context.ellipse(rx * 0.62, headY + 13, broad ? 10 : 8, 4.5, 0.1, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  const eyeY = headY - 4;
  drawStorybookEyes(context, broad ? -15 : -12, eyeY, broad ? 15 : 12, eyeY, '#493228', blinking, broad ? 4.2 : 3.8);
  context.strokeStyle = darken(palette.skin, 0.28);
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(0, headY - 1);
  context.quadraticCurveTo(-2, headY + 9, 3, headY + 9);
  context.stroke();
  drawSmile(context, 0, headY + 20, broad ? 11 : 9, darken(palette.cheek, 0.13));

  drawNpcHair(context, kind, palette, headY, rx, ry, time);
}

function drawNpcHair(context, kind, palette, headY, rx, ry, time) {
  context.fillStyle = palette.hair;

  if (kind === 'wandmaker') {
    context.beginPath();
    context.moveTo(-rx + 2, headY - 13);
    context.bezierCurveTo(-31, headY - 43, -13, headY - ry - 5, 2, headY - ry + 3);
    context.quadraticCurveTo(18, headY - ry - 8, rx - 2, headY - 12);
    context.quadraticCurveTo(20, headY - 25, 9, headY - 23);
    context.quadraticCurveTo(-5, headY - 33, -17, headY - 19);
    context.quadraticCurveTo(-27, headY - 27, -rx + 2, headY - 13);
    context.closePath();
    fillStroke(context);
    drawFlyaway(context, -19, headY - ry + 3, -30, headY - ry - 10 + Math.sin(time * 2.6) * 2, palette.hair);
    return;
  }

  if (kind === 'tailor') {
    context.beginPath();
    context.arc(0, headY - 9, rx + 1, Math.PI, Math.PI * 2);
    context.quadraticCurveTo(28, headY - 22, 17, headY - 14);
    context.quadraticCurveTo(3, headY - 29, -8, headY - 15);
    context.quadraticCurveTo(-23, headY - 24, -rx, headY - 9);
    context.closePath();
    fillStroke(context);
    return;
  }

  if (kind === 'keeper') {
    context.beginPath();
    context.moveTo(-rx + 1, headY - 8);
    context.bezierCurveTo(-31, headY - 40, -8, headY - ry - 8, 15, headY - ry + 1);
    context.bezierCurveTo(32, headY - 34, rx + 2, headY - 17, rx - 1, headY - 4);
    context.quadraticCurveTo(21, headY - 22, 7, headY - 15);
    context.quadraticCurveTo(-9, headY - 28, -rx + 1, headY - 8);
    context.closePath();
    fillStroke(context);
    return;
  }

  context.beginPath();
  context.moveTo(-rx + 1, headY - 8);
  context.bezierCurveTo(-37, headY - 40, -18, headY - ry - 7, 2, headY - ry - 1);
  context.bezierCurveTo(27, headY - ry - 8, rx + 2, headY - 22, rx - 1, headY - 8);
  context.quadraticCurveTo(25, headY - 27, 12, headY - 20);
  context.quadraticCurveTo(1, headY - 35, -11, headY - 20);
  context.quadraticCurveTo(-24, headY - 30, -rx + 1, headY - 8);
  context.closePath();
  fillStroke(context);
}

function drawNpcAccessory(context, kind, palette) {
  if (kind === 'guide') {
    context.fillStyle = palette.hair;
    context.beginPath();
    context.moveTo(-30, -143);
    context.quadraticCurveTo(-27, -102, 0, -91);
    context.quadraticCurveTo(27, -102, 30, -143);
    context.quadraticCurveTo(18, -118, 0, -124);
    context.quadraticCurveTo(-18, -118, -30, -143);
    context.closePath();
    fillStroke(context, 2.6);
    context.strokeStyle = palette.hairLight;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-16, -130);
    context.quadraticCurveTo(-12, -105, 0, -99);
    context.moveTo(12, -128);
    context.quadraticCurveTo(9, -108, 0, -99);
    context.stroke();
  } else if (kind === 'tailor') {
    context.strokeStyle = palette.accent;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-22, -96);
    context.quadraticCurveTo(0, -68, 22, -96);
    context.stroke();
    context.fillStyle = '#f0e3c8';
    context.beginPath();
    context.arc(0, -77, 4.5, 0, Math.PI * 2);
    context.fill();
  } else if (kind === 'keeper') {
    context.fillStyle = 'rgba(240,227,200,0.32)';
    context.beginPath();
    context.moveTo(-22, -88);
    context.lineTo(22, -88);
    context.lineTo(30, -16);
    context.quadraticCurveTo(0, -7, -30, -16);
    context.closePath();
    context.fill();
  } else if (kind === 'wandmaker') {
    context.strokeStyle = palette.accent;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-19, -139);
    context.quadraticCurveTo(-12, -146, -5, -139);
    context.moveTo(5, -139);
    context.quadraticCurveTo(12, -146, 19, -139);
    context.stroke();
  }
}

function drawCat(context, time) {
  context.strokeStyle = OUTLINE;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(18, -24);
  context.bezierCurveTo(47, -34, 43, -66, 28, -64);
  context.stroke();
  context.strokeStyle = '#936d51';
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = '#a77c5b';
  context.beginPath();
  context.ellipse(0, -29, 25, 31, 0, 0, Math.PI * 2);
  fillStroke(context);
  context.beginPath();
  context.arc(0, -65, 26, 0, Math.PI * 2);
  fillStroke(context);

  context.beginPath();
  context.moveTo(-21, -79);
  context.lineTo(-10, -95);
  context.lineTo(-3, -79);
  context.moveTo(21, -79);
  context.lineTo(10, -95);
  context.lineTo(3, -79);
  context.fill();
  context.stroke();
  context.fillStyle = '#d7a9a0';
  context.beginPath();
  context.moveTo(-16, -81);
  context.lineTo(-10, -90);
  context.lineTo(-7, -80);
  context.moveTo(16, -81);
  context.lineTo(10, -90);
  context.lineTo(7, -80);
  context.fill();

  const blink = isBlinking(time, 0.8);
  drawStorybookEyes(context, -9, -67, 9, -67, '#4b3b22', blink, 3.8);
  context.fillStyle = '#865a58';
  context.beginPath();
  context.moveTo(-3, -57);
  context.lineTo(3, -57);
  context.lineTo(0, -53);
  context.closePath();
  context.fill();
  context.strokeStyle = '#5f4438';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(-4, -52);
  context.lineTo(-19, -48);
  context.moveTo(4, -52);
  context.lineTo(19, -48);
  context.stroke();
  drawPetPaws(context, '#a98061');
  drawUpperLeftRim(context, [[-23, -76], [-15, -90], [-3, -92], [8, -87]], 2.2);
}

function drawOwl(context, time) {
  context.fillStyle = '#c3a979';
  context.beginPath();
  context.ellipse(0, -34, 27, 36, 0, 0, Math.PI * 2);
  fillStroke(context);

  context.fillStyle = '#8f7452';
  context.beginPath();
  context.ellipse(-19, -33, 12, 28, -0.18, 0, Math.PI * 2);
  context.ellipse(19, -33, 12, 28, 0.18, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = '#c3a979';
  context.beginPath();
  context.arc(0, -73, 28, 0, Math.PI * 2);
  fillStroke(context);
  context.fillStyle = '#eee1bd';
  context.beginPath();
  context.ellipse(-10, -74, 13, 16, 0.12, 0, Math.PI * 2);
  context.ellipse(10, -74, 13, 16, -0.12, 0, Math.PI * 2);
  context.fill();
  const blink = isBlinking(time, 1.3);
  drawStorybookEyes(context, -10, -75, 10, -75, '#46341f', blink, 4.2);
  context.fillStyle = '#d5a43d';
  context.beginPath();
  context.moveTo(-6, -64);
  context.lineTo(0, -56);
  context.lineTo(6, -64);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = '#9b773a';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-14, -2);
  context.lineTo(-14, 5);
  context.moveTo(14, -2);
  context.lineTo(14, 5);
  context.stroke();
  drawUpperLeftRim(context, [[-26, -77], [-17, -94], [1, -100], [16, -93]], 2.2);
}

function drawToad(context, time) {
  context.fillStyle = '#63794e';
  context.beginPath();
  context.ellipse(-25, -5, 20, 9, -0.18, 0, Math.PI * 2);
  context.ellipse(25, -5, 20, 9, 0.18, 0, Math.PI * 2);
  fillStroke(context);
  context.fillStyle = '#7e935f';
  context.beginPath();
  context.ellipse(0, -22, 34, 25, 0, 0, Math.PI * 2);
  fillStroke(context);
  context.beginPath();
  context.arc(-15, -45, 11, 0, Math.PI * 2);
  context.arc(15, -45, 11, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  const blink = isBlinking(time, 2.1);
  drawStorybookEyes(context, -15, -47, 15, -47, '#3f3525', blink, 4.1);
  context.fillStyle = 'rgba(225, 208, 120, 0.34)';
  context.beginPath();
  context.arc(-12, -24, 4, 0, Math.PI * 2);
  context.arc(15, -17, 3, 0, Math.PI * 2);
  context.arc(2, -33, 2.5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#39442f';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-10, -12);
  context.quadraticCurveTo(0, -6, 10, -12);
  context.stroke();
  drawUpperLeftRim(context, [[-31, -28], [-24, -44], [-15, -55], [0, -51]], 2.1);
}

function drawPetPaws(context, color) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(-14, -2, 12, 6, 0, 0, Math.PI * 2);
  context.ellipse(14, -2, 12, 6, 0, 0, Math.PI * 2);
  fillStroke(context, 2.2);
}

function drawStorybookEyes(context, leftX, leftY, rightX, rightY, iris, blinking, radius = 4) {
  if (blinking) {
    context.strokeStyle = OUTLINE;
    context.lineWidth = 2.4;
    context.beginPath();
    context.moveTo(leftX - radius, leftY);
    context.quadraticCurveTo(leftX, leftY + 2, leftX + radius, leftY);
    context.moveTo(rightX - radius, rightY);
    context.quadraticCurveTo(rightX, rightY + 2, rightX + radius, rightY);
    context.stroke();
    return;
  }

  for (const [x, y] of [[leftX, leftY], [rightX, rightY]]) {
    context.fillStyle = '#fff8e8';
    context.beginPath();
    context.ellipse(x, y, radius + 1.6, radius + 2.1, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = OUTLINE;
    context.lineWidth = 1.6;
    context.stroke();
    context.fillStyle = iris;
    context.beginPath();
    context.arc(x + 0.7, y + 0.7, radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#231b18';
    context.beginPath();
    context.arc(x + 0.8, y + 0.8, radius * 0.52, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.88)';
    context.beginPath();
    context.arc(x - radius * 0.25, y - radius * 0.35, Math.max(1.1, radius * 0.24), 0, Math.PI * 2);
    context.fill();
  }
}

function drawSmile(context, x, y, radius, color) {
  context.strokeStyle = color;
  context.lineWidth = 2.3;
  context.beginPath();
  context.arc(x, y - radius * 0.18, radius, 0.15 * Math.PI, 0.85 * Math.PI);
  context.stroke();
}

function drawHand(context, x, y, color, radius) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  fillStroke(context, 2.2);
  context.strokeStyle = 'rgba(255,231,168,0.4)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(x - 1.5, y - 1.5, Math.max(2, radius - 3), Math.PI, 1.5 * Math.PI);
  context.stroke();
}

function drawEar(context, x, y, color, radius = 7) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(x, y, radius, radius + 2, 0, 0, Math.PI * 2);
  fillStroke(context, 2.2);
}

function drawFlyaway(context, x1, y1, x2, y2, color = '#8b6b4a') {
  context.strokeStyle = OUTLINE;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x1, y1);
  context.quadraticCurveTo((x1 + x2) / 2, y2 - 5, x2, y2);
  context.stroke();
  context.strokeStyle = color;
  context.lineWidth = 2.6;
  context.stroke();
}

function drawUpperLeftRim(context, points, width) {
  if (!points.length) return;
  context.strokeStyle = RIM_LIGHT;
  context.lineWidth = width;
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

function fillStroke(context, lineWidth = null) {
  context.fill();
  const previous = context.lineWidth;
  if (lineWidth !== null) context.lineWidth = lineWidth;
  context.strokeStyle = OUTLINE;
  context.stroke();
  context.lineWidth = previous;
}

function isBlinking(time, phase) {
  const cycle = (time * 0.72 + phase) % 4.7;
  return cycle > 4.47;
}

function darken(hex, amount) {
  return shiftColor(hex, -Math.abs(amount));
}

function shiftColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const delta = Math.round(255 * amount);
  const r = Math.max(0, Math.min(255, (value >> 16) + delta));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + delta));
  const b = Math.max(0, Math.min(255, (value & 0xff) + delta));
  return `rgb(${r}, ${g}, ${b})`;
}
