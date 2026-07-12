import { PALETTE } from '../config.js';

export class WorldPropRenderer {
  draw(context, state, time, { reducedMotion = false } = {}) {
    if (state?.setPiece || state?.dialogue?.scriptId === 'ch1.letter.read') return;
    const letter = state?.targets?.find((target) => target.id === 'bedroom.letter');
    if (!letter?.hitArea) return;
    const x = letter.hitArea.x - (state.cameraX ?? 0);
    const y = letter.hitArea.y;
    drawDeliveredEnvelope(context, { x, y, scale: 0.84, reducedMotion }, time);
  }
}

export function drawDeliveredEnvelope(context, {
  x,
  y,
  scale = 1,
  reducedMotion = false,
} = {}, time = 0) {
  const shimmer = reducedMotion ? 0.5 : 0.5 + Math.sin(time * 2.4) * 0.5;
  const float = reducedMotion ? 0 : Math.sin(time * 1.7) * 1.5;
  context.save();
  context.translate(x, y + float);
  context.rotate(-0.045);
  context.scale(scale, scale);

  context.save();
  context.translate(7, 11);
  context.fillStyle = 'rgba(35, 23, 31, 0.24)';
  envelopePath(context);
  context.fill();
  context.restore();

  context.fillStyle = '#f2dfb6';
  envelopePath(context);
  context.fill();
  context.strokeStyle = '#6c4b36';
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = 'rgba(255, 250, 218, 0.42)';
  context.beginPath();
  context.moveTo(-164, -98);
  context.lineTo(25, -98);
  context.lineTo(-40, 10);
  context.lineTo(-172, 84);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(118, 72, 43, 0.14)';
  context.beginPath();
  context.moveTo(25, -98);
  context.lineTo(171, -96);
  context.lineTo(171, 87);
  context.lineTo(28, 21);
  context.closePath();
  context.fill();

  context.strokeStyle = 'rgba(117, 79, 49, 0.72)';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-174, -98);
  context.lineTo(0, 25);
  context.lineTo(174, -98);
  context.moveTo(-174, 96);
  context.lineTo(-38, 16);
  context.moveTo(174, 96);
  context.lineTo(38, 16);
  context.stroke();

  context.strokeStyle = 'rgba(255, 250, 224, 0.68)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-165, -90);
  context.lineTo(0, 18);
  context.lineTo(165, -90);
  context.stroke();

  drawPostMarks(context);
  drawWaxOwlSeal(context);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 52px "Andika", "Trebuchet MS", sans-serif';
  context.lineWidth = 7;
  context.strokeStyle = 'rgba(83, 49, 35, 0.72)';
  context.strokeText('VIOLET', 0, -27);
  context.fillStyle = '#c48225';
  context.fillText('VIOLET', 0, -27);
  context.globalAlpha = 0.72;
  context.fillStyle = '#ffe58a';
  context.fillText('VIOLET', -1.5, -29);
  context.globalAlpha = 1;

  context.globalAlpha = 0.22 + shimmer * 0.48;
  context.strokeStyle = '#fff4ac';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-112 + shimmer * 165, -67);
  context.lineTo(-84 + shimmer * 165, -54);
  context.stroke();
  context.globalAlpha = 1;

  context.restore();
}

function envelopePath(context) {
  context.beginPath();
  context.moveTo(-166, -105);
  context.quadraticCurveTo(-181, -103, -180, -87);
  context.lineTo(-178, 86);
  context.quadraticCurveTo(-177, 103, -160, 104);
  context.lineTo(161, 103);
  context.quadraticCurveTo(179, 103, 179, 85);
  context.lineTo(180, -87);
  context.quadraticCurveTo(180, -104, 163, -105);
  context.closePath();
}

function drawPostMarks(context) {
  context.save();
  context.translate(118, -62);
  context.rotate(0.08);
  context.strokeStyle = 'rgba(82, 67, 82, 0.55)';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, 28, 0, Math.PI * 2);
  context.arc(0, 0, 19, 0, Math.PI * 2);
  context.stroke();
  for (let index = -2; index <= 2; index += 1) {
    context.beginPath();
    context.moveTo(28, index * 7);
    context.quadraticCurveTo(44, index * 7 - 5, 59, index * 7);
    context.stroke();
  }
  context.restore();
}

function drawWaxOwlSeal(context) {
  context.save();
  context.translate(0, 38);
  context.fillStyle = '#8d2f47';
  context.strokeStyle = '#542237';
  context.lineWidth = 4;
  context.beginPath();
  for (let index = 0; index < 20; index += 1) {
    const angle = index * Math.PI / 10;
    const radius = index % 2 === 0 ? 36 : 31;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = 'rgba(73, 16, 36, 0.28)';
  context.beginPath();
  context.arc(0, 0, 29, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(255, 196, 184, 0.46)';
  context.beginPath();
  context.arc(-9, -10, 10, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = 'rgba(255, 220, 198, 0.36)';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(-2, -2, 24, Math.PI * 1.08, Math.PI * 1.65);
  context.stroke();

  context.fillStyle = PALETTE.candle;
  context.globalAlpha = 0.74;
  context.beginPath();
  context.moveTo(-17, 5);
  context.quadraticCurveTo(-18, -10, -9, -17);
  context.lineTo(-2, -7);
  context.lineTo(0, -19);
  context.lineTo(3, -7);
  context.lineTo(10, -17);
  context.quadraticCurveTo(19, -10, 17, 5);
  context.quadraticCurveTo(15, 18, 0, 20);
  context.quadraticCurveTo(-15, 18, -17, 5);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = '#542237';
  context.beginPath();
  context.arc(-7, 0, 2.5, 0, Math.PI * 2);
  context.arc(7, 0, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}
