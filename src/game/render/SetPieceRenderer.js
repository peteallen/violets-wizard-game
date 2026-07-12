import { easeInOutCubic, easeOutBack, easeOutCubic } from '../core/math.js';
import { PALETTE, WORLD } from '../config.js';

export class SetPieceRenderer {
  draw(context, active, worldState) {
    if (!active) return;
    const id = active.requestedId ?? active.id;
    if (id.includes('letter')) this.drawLetter(context, active);
    else if (id.includes('brick')) this.drawBrickWall(context, active);
    else if (id.includes('wandChaos') || id.includes('wand-chaos')) this.drawWandChaos(context, active);
    else if (id.includes('wandChosen') || id.includes('wand-chosen')) this.drawWandChosen(context, active, worldState);
    else if (id.includes('ticket')) this.drawTicket(context, active);
  }

  drawLetter(context, active) {
    const progress = active.time / active.descriptor.duration;
    context.fillStyle = 'rgba(20,17,38,0.24)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    const drop = easeOutCubic(Math.min(1, progress * 2.2));
    const x = 650 + Math.sin(progress * Math.PI * 3) * (1 - drop) * 110;
    const y = -110 + drop * 460;
    const scale = progress > 0.52 ? 1 + easeOutBack(Math.min(1, (progress - 0.52) * 2.1)) * 0.35 : 1;
    context.save();
    context.translate(x, y);
    context.rotate((1 - drop) * 0.35);
    context.scale(scale, scale);
    context.fillStyle = PALETTE.parchment;
    context.strokeStyle = '#8e704c';
    context.lineWidth = 6;
    roundRect(context, -180, -105, 360, 210, 18);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(-175, -98);
    context.lineTo(0, 25);
    context.lineTo(175, -98);
    context.stroke();
    context.fillStyle = '#8f273f';
    context.beginPath();
    context.arc(0, 32, 33, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.candle;
    context.textAlign = 'center';
    context.font = '700 52px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('VIOLET', 0, -25);
    context.restore();
  }

  drawBrickWall(context, active) {
    const t = active.time;
    const start = 0.35;
    const stagger = 0.024;
    const duration = 1.1;
    const columns = 12;
    const rows = 8;
    const tileWidth = 106.8;
    const tileHeight = 66;
    const originX = 640;
    const originY = 340;

    context.save();
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * tileWidth + (row % 2 ? -tileWidth / 2 : 0);
        const y = 75 + row * tileHeight;
        const centerX = x + tileWidth / 2;
        const centerY = y + tileHeight / 2;
        const distance = Math.hypot(centerX - originX, centerY - originY);
        const delay = start + (distance / 110) * stagger;
        const progress = Math.max(0, Math.min(1, (t - delay) / duration));
        if (progress >= 1) continue;
        const eased = easeInOutCubic(progress);
        const directionX = (centerX - originX) / Math.max(1, distance);
        const directionY = (centerY - originY) / Math.max(1, distance);
        context.save();
        context.translate(centerX + directionX * eased * 170, centerY + directionY * eased * 90 - eased * 25);
        context.rotate(directionX * eased * 0.65);
        context.globalAlpha = 1 - Math.max(0, (progress - 0.72) / 0.28);
        context.fillStyle = (row + column) % 3 === 0 ? '#8a644f' : (row + column) % 3 === 1 ? '#98705a' : '#765747';
        context.fillRect(-tileWidth / 2 + 1, -tileHeight / 2 + 1, tileWidth, tileHeight);
        context.strokeStyle = '#b29a82';
        context.lineWidth = 4;
        context.strokeRect(-tileWidth / 2 + 1, -tileHeight / 2 + 1, tileWidth, tileHeight);
        context.restore();
      }
    }
    context.restore();

    if (t > 2.05) {
      const fade = Math.min(1, (t - 2.05) / 0.65);
      context.fillStyle = `rgba(255,245,210,${Math.sin(fade * Math.PI) * 0.8})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
  }

  drawWandChaos(context, active) {
    const t = active.time;
    const golden = active.params?.variant === 'chosen' || active.requestedId.includes('chosen');
    if (golden) return this.drawWandChosen(context, active);
    for (let index = 0; index < 16; index += 1) {
      const delay = index * 0.035;
      const progress = Math.max(0, Math.min(1, (t - delay) / 1.1));
      if (progress <= 0) continue;
      const x = 660 + Math.cos(index * 2.1) * progress * (100 + index * 16);
      const y = 370 + Math.sin(index * 1.7) * progress * 170 + progress * progress * 80;
      context.save();
      context.translate(x, y);
      context.rotate(index + progress * 7);
      context.globalAlpha = 1 - Math.max(0, (progress - 0.75) / 0.25);
      context.fillStyle = index % 2 ? PALETTE.parchment : '#d9c5a2';
      context.fillRect(-20, -14, 40, 28);
      context.restore();
    }
  }

  drawWandChosen(context, active) {
    const progress = Math.min(1, active.time / active.descriptor.duration);
    const alpha = Math.sin(progress * Math.PI) * 0.58;
    context.fillStyle = `rgba(255,215,106,${alpha})`;
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    context.translate(640, 350);
    context.strokeStyle = '#5e3827';
    context.lineWidth = 12;
    context.beginPath();
    context.moveTo(-120, 90);
    context.lineTo(95, -105);
    context.stroke();
    context.fillStyle = '#fff5cb';
    for (let index = 0; index < 28; index += 1) {
      const angle = index * 2.399;
      const radius = 35 + ((index * 37) % 180) * easeOutCubic(progress);
      const size = 3 + (index % 4);
      context.beginPath();
      context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, size, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  drawTicket(context, active) {
    const progress = easeOutBack(Math.min(1, active.time / Math.max(0.1, active.descriptor.duration * 0.65)));
    context.fillStyle = 'rgba(20,17,38,0.38)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.save();
    context.translate(640, 360);
    context.scale(progress, progress);
    context.rotate(-0.035);
    context.fillStyle = '#d8b76d';
    roundRect(context, -265, -120, 530, 240, 24);
    context.fill();
    context.strokeStyle = '#6e4b32';
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = '#4e3428';
    context.textAlign = 'center';
    context.font = '700 38px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('HOGWARTS EXPRESS', 0, -32);
    context.font = '700 58px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('9 ¾', 0, 55);
    context.restore();
  }
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}
