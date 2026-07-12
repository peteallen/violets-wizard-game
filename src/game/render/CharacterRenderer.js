import { PALETTE } from '../config.js';

const CHARACTER_COLORS = Object.freeze({
  guide: { robe: '#66513d', accent: '#9b7a52', hair: '#33251e', skin: '#c98c68' },
  wandmaker: { robe: '#2f3148', accent: '#b8a67b', hair: '#d8d1bd', skin: '#d6aa87' },
  tailor: { robe: '#7d4169', accent: '#e0aa70', hair: '#36251e', skin: '#b97554' },
  keeper: { robe: '#46624d', accent: '#ceb55f', hair: '#9a6038', skin: '#d19a72' },
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
    const bob = walking ? Math.sin(time * 11) * 4 : Math.sin(time * 2.2) * 1.5;
    const step = walking ? Math.sin(time * 11) * 10 : 0;
    const trim = character.robeTrim ?? PALETTE.violet;

    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#3a2d22';
    context.lineWidth = 3;

    drawLeg(context, -13, step, '#563b7e');
    drawLeg(context, 13, -step, '#563b7e');

    context.fillStyle = '#26222e';
    context.beginPath();
    context.moveTo(-35, -88);
    context.quadraticCurveTo(-48, -32, -54, 0);
    context.quadraticCurveTo(0, 18, 54, 0);
    context.quadraticCurveTo(48, -32, 35, -88);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = trim;
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(-28, -82);
    context.quadraticCurveTo(0, -55, 28, -82);
    context.stroke();
    context.strokeStyle = '#3a2d22';
    context.lineWidth = 3;

    context.fillStyle = '#d9a37b';
    context.beginPath();
    context.ellipse(0, -122, 38, 42, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = '#8b6b4a';
    context.beginPath();
    context.arc(0, -134, 39, Math.PI, Math.PI * 2);
    context.lineTo(40, -102);
    context.quadraticCurveTo(34, -76, 24, -68);
    context.lineTo(17, -104);
    context.quadraticCurveTo(0, -90, -17, -104);
    context.lineTo(-24, -68);
    context.quadraticCurveTo(-38, -80, -40, -106);
    context.closePath();
    context.fill();
    context.stroke();

    drawFlyaway(context, -18, -166, -35, -179 + Math.sin(time * 3) * 3);
    drawFlyaway(context, -2, -169, 2, -186 + Math.sin(time * 3.4) * 4);
    drawFlyaway(context, 17, -164, 33, -178 + Math.sin(time * 2.8) * 3);

    context.fillStyle = '#5a3d28';
    context.beginPath();
    context.arc(-13, -124, 4.5, 0, Math.PI * 2);
    context.arc(13, -124, 4.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#a65e5e';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, -109, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    context.stroke();

    if (character.wand) {
      context.strokeStyle = '#4d2e22';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(35, -67);
      context.lineTo(73, -111);
      context.stroke();
      context.fillStyle = PALETTE.interactive;
      context.beginPath();
      context.arc(74, -113, 4 + Math.sin(time * 4), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  drawNpc(context, character, time) {
    const palette = CHARACTER_COLORS[character.kind] ?? CHARACTER_COLORS.guide;
    const scale = (character.scale ?? 1) * (character.kind === 'guide' ? 1.45 : 1);
    const direction = character.facing === 'left' ? -1 : 1;
    const bob = Math.sin(time * 1.8 + (character.phase ?? 0)) * 1.5;
    context.save();
    context.translate(character.x, character.y + bob);
    context.scale(direction * scale, scale);
    context.strokeStyle = '#3a2d22';
    context.lineWidth = 3;
    context.lineJoin = 'round';

    context.fillStyle = palette.robe;
    context.beginPath();
    context.moveTo(-38, -95);
    context.quadraticCurveTo(-53, -36, -58, 0);
    context.lineTo(58, 0);
    context.quadraticCurveTo(53, -36, 38, -95);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = palette.accent;
    context.fillRect(-34, -91, 68, 10);

    context.fillStyle = palette.skin;
    context.beginPath();
    context.ellipse(0, -132, 38, 40, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = palette.hair;
    context.beginPath();
    context.arc(0, -145, 39, Math.PI, Math.PI * 2);
    context.lineTo(35, -127);
    context.quadraticCurveTo(0, -155, -35, -127);
    context.closePath();
    context.fill();

    if (character.kind === 'guide') {
      context.beginPath();
      context.moveTo(-31, -126);
      context.quadraticCurveTo(0, -82, 31, -126);
      context.quadraticCurveTo(28, -93, 0, -85);
      context.quadraticCurveTo(-28, -93, -31, -126);
      context.fill();
    }

    context.fillStyle = '#493228';
    context.beginPath();
    context.arc(-12, -133, 3.5, 0, Math.PI * 2);
    context.arc(12, -133, 3.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#6b3d35';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, -117, 9, 0.12 * Math.PI, 0.88 * Math.PI);
    context.stroke();
    context.restore();
  }

  drawPet(context, pet, time = 0) {
    if (!pet?.type) return;
    const bounce = Math.sin(time * 4) * 2;
    context.save();
    context.translate(pet.x, pet.y + bounce);
    context.strokeStyle = '#3a2d22';
    context.lineWidth = 3;
    context.fillStyle = pet.type === 'cat' ? '#9d7658' : pet.type === 'owl' ? '#c9ad78' : '#77925d';
    if (pet.type === 'toad') {
      context.beginPath();
      context.ellipse(0, -14, 30, 20, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(-13, -31, 9, 0, Math.PI * 2);
      context.arc(13, -31, 9, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    } else {
      context.beginPath();
      context.ellipse(0, -28, 24, 31, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(0, -62, 25, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      if (pet.type === 'cat') {
        context.beginPath();
        context.moveTo(-20, -78);
        context.lineTo(-8, -92);
        context.lineTo(-3, -76);
        context.moveTo(20, -78);
        context.lineTo(8, -92);
        context.lineTo(3, -76);
        context.fill();
        context.stroke();
      } else {
        context.fillStyle = '#e6c36b';
        context.beginPath();
        context.moveTo(-7, -57);
        context.lineTo(0, -50);
        context.lineTo(7, -57);
        context.closePath();
        context.fill();
      }
      context.fillStyle = '#30251e';
      context.beginPath();
      context.arc(-9, -64, 4, 0, Math.PI * 2);
      context.arc(9, -64, 4, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

function drawLeg(context, x, step, shoeColor) {
  context.strokeStyle = '#3a2d22';
  context.lineWidth = 12;
  context.beginPath();
  context.moveTo(x, -5);
  context.lineTo(x + step * 0.35, 30);
  context.stroke();
  context.strokeStyle = shoeColor;
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(x + step * 0.35 - 3, 31);
  context.lineTo(x + step * 0.35 + 13, 31);
  context.stroke();
}

function drawFlyaway(context, x1, y1, x2, y2) {
  context.strokeStyle = '#8b6b4a';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x1, y1);
  context.quadraticCurveTo((x1 + x2) / 2, y2 - 5, x2, y2);
  context.stroke();
}
