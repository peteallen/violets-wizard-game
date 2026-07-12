import { INPUT, PALETTE, WORLD } from '../config.js';

export const UI_RECTS = Object.freeze({
  quest: { x: 28, y: 28, width: 104, height: 104 },
  satchel: { x: 28, y: 584, width: 108, height: 108 },
  wand: { x: 1144, y: 584, width: 108, height: 108 },
  debugReset: { x: 510, y: 18, width: 260, height: 88 },
  dialogueAdvance: { x: 0, y: 0, width: WORLD.width, height: WORLD.height },
});

export class UIRenderer {
  drawHud(context, state, time) {
    if (state.overlay || state.dialogue || state.screen !== 'playing') return;
    drawQuestButton(context, UI_RECTS.quest, time, Boolean(state.newObjective));
    drawSatchelButton(context, UI_RECTS.satchel);
    drawWandButton(context, UI_RECTS.wand, Boolean(state.hasWand));
  }

  drawDialogue(context, dialogue, time, muted = false) {
    if (!dialogue) return;
    context.fillStyle = 'rgba(20,17,38,0.34)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    const frame = { x: 150, y: 480, width: 980, height: 205 };
    parchmentPanel(context, frame.x, frame.y, frame.width, frame.height, 34);

    context.fillStyle = PALETTE.oak;
    context.beginPath();
    context.arc(244, 570, 68, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 6;
    context.stroke();
    context.fillStyle = PALETTE.parchment;
    context.textAlign = 'center';
    context.font = '700 25px "Trebuchet MS", sans-serif';
    fitText(context, dialogue.speakerLabel ?? 'Friend', 244, 578, 110);

    context.textAlign = 'left';
    context.fillStyle = '#382a24';
    context.font = '700 28px "Trebuchet MS", sans-serif';
    context.fillText(dialogue.caption ?? '', 335, 535);
    context.font = '25px "Trebuchet MS", sans-serif';
    const shownText = muted ? dialogue.text : dialogue.text;
    wrapText(context, shownText ?? '', 335, 580, 690, 32, 2);

    const pulse = 1 + Math.sin(time * 4) * 0.08;
    context.save();
    context.translate(1065, 630);
    context.scale(pulse, pulse);
    context.fillStyle = PALETTE.violet;
    context.beginPath();
    context.moveTo(-18, -12);
    context.lineTo(18, 0);
    context.lineTo(-18, 12);
    context.closePath();
    context.fill();
    context.restore();

    if (dialogue.choices?.length) this.drawChoices(context, dialogue.choices);
  }

  drawChoices(context, choices) {
    const width = 250;
    const gap = 28;
    const total = choices.length * width + (choices.length - 1) * gap;
    const startX = (WORLD.width - total) / 2;
    choices.forEach((choice, index) => {
      const rect = { x: startX + index * (width + gap), y: 245, width, height: 150 };
      choice.__rect = rect;
      parchmentPanel(context, rect.x, rect.y, rect.width, rect.height, 28);
      context.fillStyle = PALETTE.violet;
      context.textAlign = 'center';
      context.font = '50px "Trebuchet MS", sans-serif';
      context.fillText(iconGlyph(choice.icon), rect.x + width / 2, rect.y + 67);
      context.fillStyle = '#382a24';
      context.font = '700 29px "Trebuchet MS", sans-serif';
      context.fillText(choice.caption, rect.x + width / 2, rect.y + 118);
    });
  }

  drawMap(context, state) {
    context.fillStyle = 'rgba(20,17,38,0.78)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    parchmentPanel(context, 130, 65, 1020, 590, 42);
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 46px "Trebuchet MS", sans-serif';
    context.fillText('Diagon Alley Map', WORLD.width / 2, 135);

    const locations = [
      { id: 'ch1.ollivanders', label: 'Wands', icon: '✦', x: 330, y: 340 },
      { id: 'ch1.malkins', label: 'Robes', icon: '♢', x: 640, y: 270 },
      { id: 'ch1.menagerie', label: 'Pets', icon: '♥', x: 950, y: 390 },
    ];
    for (const location of locations) {
      const unlocked = state.unlockedRooms?.includes(location.id);
      const current = state.objectiveRoom === location.id;
      const rect = { x: location.x - 105, y: location.y - 90, width: 210, height: 180 };
      location.__rect = rect;
      context.globalAlpha = unlocked ? 1 : 0.42;
      context.fillStyle = current ? PALETTE.interactive : PALETTE.oak;
      roundRect(context, rect.x, rect.y, rect.width, rect.height, 28);
      context.fill();
      context.strokeStyle = PALETTE.candle;
      context.lineWidth = current ? 8 : 4;
      context.stroke();
      context.fillStyle = PALETTE.parchment;
      context.font = '54px "Trebuchet MS", sans-serif';
      context.fillText(location.icon, location.x, location.y - 10);
      context.font = '700 28px "Trebuchet MS", sans-serif';
      context.fillText(location.label, location.x, location.y + 48);
      context.globalAlpha = 1;
    }
    state.__mapLocations = locations;
    drawClose(context);
  }

  drawSelection(context, selection) {
    context.fillStyle = 'rgba(20,17,38,0.74)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    parchmentPanel(context, 150, 85, 980, 550, 42);
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 48px "Trebuchet MS", sans-serif';
    context.fillText(selection.title, WORLD.width / 2, 170);
    if (selection.subtitle) {
      context.font = '26px "Trebuchet MS", sans-serif';
      context.fillText(selection.subtitle, WORLD.width / 2, 212);
    }
    const count = selection.options.length;
    const width = Math.min(230, (860 - (count - 1) * 24) / count);
    const total = count * width + (count - 1) * 24;
    const x = (WORLD.width - total) / 2;
    selection.options.forEach((option, index) => {
      const rect = { x: x + index * (width + 24), y: 285, width, height: 210 };
      option.__rect = rect;
      context.fillStyle = option.color ?? PALETTE.oak;
      roundRect(context, rect.x, rect.y, rect.width, rect.height, 28);
      context.fill();
      context.strokeStyle = PALETTE.candle;
      context.lineWidth = 5;
      context.stroke();
      context.fillStyle = PALETTE.parchment;
      context.font = '64px "Trebuchet MS", sans-serif';
      context.fillText(iconGlyph(option.icon), rect.x + width / 2, rect.y + 92);
      context.font = '700 29px "Trebuchet MS", sans-serif';
      fitText(context, option.label, rect.x + width / 2, rect.y + 159, width - 22);
    });
    drawClose(context);
  }

  drawObjective(context, objective) {
    context.fillStyle = 'rgba(20,17,38,0.74)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    parchmentPanel(context, 250, 190, 780, 340, 45);
    context.textAlign = 'center';
    context.fillStyle = PALETTE.candle;
    context.font = '70px "Trebuchet MS", sans-serif';
    context.fillText('★', WORLD.width / 2, 300);
    context.fillStyle = '#382a24';
    context.font = '700 42px "Trebuchet MS", sans-serif';
    context.fillText(objective?.caption ?? 'Explore!', WORLD.width / 2, 380);
    context.font = '28px "Trebuchet MS", sans-serif';
    wrapText(context, objective?.text ?? '', 360, 432, 560, 34, 2, 'center');
    drawClose(context);
  }

  drawChapterCard(context, card, time, { paintedBackground = false } = {}) {
    if (!paintedBackground) {
      const gradient = context.createLinearGradient(0, 0, 0, WORLD.height);
      gradient.addColorStop(0, '#1b2a4a');
      gradient.addColorStop(0.55, '#3a2d5e');
      gradient.addColorStop(1, '#141126');
      context.fillStyle = gradient;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    } else {
      context.fillStyle = 'rgba(20,17,38,0.36)';
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    const drift = Math.sin(time * 0.7) * 8;
    context.fillStyle = 'rgba(244,213,141,0.22)';
    context.beginPath();
    context.arc(980 + drift, 190, 90, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 12;
    context.strokeRect(170, 105, 940, 510);
    context.textAlign = 'center';
    context.fillStyle = PALETTE.parchment;
    context.font = '700 36px "Trebuchet MS", sans-serif';
    context.fillText(card?.eyebrow ?? 'Chapter One Complete', WORLD.width / 2, 190);
    context.font = '700 64px "Trebuchet MS", sans-serif';
    wrapText(context, card?.title ?? 'Platform Nine and Three-Quarters', 250, 300, 780, 76, 2, 'center');
    context.fillStyle = PALETTE.honey;
    context.font = '31px "Trebuchet MS", sans-serif';
    context.fillText(card?.subtitle ?? 'Next time: the Hogwarts Express!', WORLD.width / 2, 475);
    drawBigButton(context, card?.buttonLabel ?? 'See what is next', 440, 525, 400, 90);
  }

  drawTitle(context, time, hasSave) {
    const gradient = context.createLinearGradient(0, 0, 0, WORLD.height);
    gradient.addColorStop(0, PALETTE.night);
    gradient.addColorStop(0.68, PALETTE.twilight);
    gradient.addColorStop(1, PALETTE.ink);
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.fillStyle = PALETTE.interactive;
    for (let index = 0; index < 28; index += 1) {
      const x = ((index * 197) % WORLD.width) + Math.sin(time * 0.6 + index) * 7;
      const y = 60 + ((index * 83) % 410);
      const alpha = 0.22 + (Math.sin(time * 2 + index) + 1) * 0.18;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, 2 + (index % 3), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.textAlign = 'center';
    context.fillStyle = PALETTE.parchment;
    context.font = '700 76px "Trebuchet MS", sans-serif';
    context.fillText("Violet's Wizard Game", WORLD.width / 2, 255);
    context.fillStyle = PALETTE.honey;
    context.font = '34px "Trebuchet MS", sans-serif';
    context.fillText('Your letter is waiting.', WORLD.width / 2, 320);
    drawBigButton(context, hasSave ? 'Continue' : 'Open the letter', 420, 405, 440, 105);
    context.fillStyle = 'rgba(240,227,200,0.78)';
    context.font = '24px "Trebuchet MS", sans-serif';
    context.fillText('Best with sound on', WORLD.width / 2, 565);
  }

  drawDebugReset(context) {
    const rect = UI_RECTS.debugReset;
    context.save();
    context.globalAlpha = 0.94;
    context.fillStyle = '#4d2430';
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 24);
    context.fill();
    context.strokeStyle = '#f0d58d';
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = '#fff8e8';
    context.textAlign = 'center';
    context.font = '700 26px "Trebuchet MS", sans-serif';
    context.fillText('DEV: Reset game', rect.x + rect.width / 2, rect.y + rect.height / 2 + 9);
    context.restore();
  }
}

function drawQuestButton(context, rect, time, pulse) {
  const scale = pulse ? 1 + Math.sin(time * 4) * 0.08 : 1;
  context.save();
  context.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
  context.scale(scale, scale);
  context.fillStyle = PALETTE.oak;
  context.beginPath();
  context.arc(0, 0, 48, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = PALETTE.interactive;
  context.textAlign = 'center';
  context.font = '54px "Trebuchet MS", sans-serif';
  context.fillText('★', 0, 19);
  context.restore();
}

function drawSatchelButton(context, rect) {
  context.fillStyle = '#6e4b32';
  roundRect(context, rect.x + 8, rect.y + 19, rect.width - 16, rect.height - 27, 21);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();
  context.beginPath();
  context.arc(rect.x + rect.width / 2, rect.y + 32, 32, Math.PI, 0);
  context.stroke();
  context.fillStyle = PALETTE.candle;
  context.fillRect(rect.x + rect.width / 2 - 7, rect.y + 55, 14, 18);
}

function drawWandButton(context, rect, enabled) {
  context.fillStyle = enabled ? '#59402d' : '#3d3743';
  context.beginPath();
  context.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, 49, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = enabled ? PALETTE.candle : '#77717f';
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = enabled ? '#aa7655' : '#716b73';
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(rect.x + 34, rect.y + 77);
  context.lineTo(rect.x + 79, rect.y + 30);
  context.stroke();
  if (enabled) {
    context.fillStyle = PALETTE.interactive;
    context.beginPath();
    context.arc(rect.x + 81, rect.y + 28, 7, 0, Math.PI * 2);
    context.fill();
  }
}

function parchmentPanel(context, x, y, width, height, radius) {
  context.fillStyle = PALETTE.parchment;
  roundRect(context, x, y, width, height, radius);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 7;
  context.stroke();
  context.strokeStyle = '#8a6b44';
  context.lineWidth = 2;
  roundRect(context, x + 13, y + 13, width - 26, height - 26, Math.max(8, radius - 10));
  context.stroke();
}

function drawClose(context) {
  context.fillStyle = PALETTE.violet;
  context.beginPath();
  context.arc(1090, 120, 45, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = PALETTE.parchment;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(1075, 105);
  context.lineTo(1105, 135);
  context.moveTo(1105, 105);
  context.lineTo(1075, 135);
  context.stroke();
}

function drawBigButton(context, label, x, y, width, height) {
  context.fillStyle = PALETTE.oak;
  roundRect(context, x, y, width, height, height / 2);
  context.fill();
  context.strokeStyle = PALETTE.interactive;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = PALETTE.parchment;
  context.textAlign = 'center';
  context.font = '700 34px "Trebuchet MS", sans-serif';
  context.fillText(label, x + width / 2, y + height / 2 + 12);
}

function iconGlyph(icon) {
  return ({ wand: '✦', eyes: '◉', cat: '♛', owl: '◉', toad: '●', replay: '↻', explore: '⌁', purple: '◆', rose: '♥', teal: '●', gold: '★' })[icon] ?? '✦';
}

function fitText(context, text, x, y, maxWidth) {
  let size = Number.parseInt(context.font, 10) || 28;
  while (size > 18 && context.measureText(text).width > maxWidth) {
    size -= 1;
    context.font = context.font.replace(/\d+px/, `${size}px`);
  }
  context.fillText(text, x, y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3, align = 'left') {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && context.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  context.textAlign = align;
  const drawX = align === 'center' ? x + maxWidth / 2 : x;
  lines.slice(0, maxLines).forEach((entry, index) => context.fillText(entry, drawX, y + index * lineHeight));
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

export function pointInUiRect(point, rect) {
  const padding = Math.max(0, (INPUT.minimumTarget - Math.min(rect.width, rect.height)) / 2);
  return point.x >= rect.x - padding && point.x <= rect.x + rect.width + padding && point.y >= rect.y - padding && point.y <= rect.y + rect.height + padding;
}
