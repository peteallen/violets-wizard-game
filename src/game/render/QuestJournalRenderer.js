import { PALETTE, WORLD } from '../config.js';
import { childFacingUiText } from '../content/playerVisibleCopy.js';
import { drawDeckledParchment } from './uiIllustrations.js';
import { traceRoundedRect } from './uiPrimitives.js';

const PANEL = Object.freeze({ x: 238, y: 104, width: 804, height: 512 });
const MAIN = Object.freeze({ x: 320, y: 208, width: 640, height: 132 });

export function questJournalLayout(journal = {}, objective = null) {
  const main = normalizeEntry(journal?.main, objective, 'main');
  const side = (Array.isArray(journal?.side) ? journal.side : [])
    .map((entry) => normalizeEntry(entry, null, 'side'))
    .filter(Boolean);
  const gap = 18;
  const width = side.length <= 1 ? 520 : 300;
  const total = side.length * width + Math.max(0, side.length - 1) * gap;
  const startX = WORLD.width / 2 - total / 2;
  const sideEntries = side.map((entry, index) => Object.freeze({
    entry,
    rect: Object.freeze({
      x: startX + index * (width + gap),
      y: 398,
      width,
      height: 132,
    }),
  }));
  return Object.freeze({
    panel: PANEL,
    main: main ? Object.freeze({ entry: main, rect: MAIN }) : null,
    side: Object.freeze(sideEntries),
  });
}

export class QuestJournalRenderer {
  constructor({ imageFor = () => null } = {}) {
    this.imageFor = imageFor;
  }

  draw(context, journal, objective = null, time = 0, { reducedMotion = false } = {}) {
    const layout = questJournalLayout(journal, objective);
    context.save();
    context.fillStyle = 'rgba(20,17,38,0.34)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawDeckledParchment(context, layout.panel, { ornament: true });
    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.font = '700 42px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(childFacingUiText('Your magic', 'caption'), WORLD.width / 2, 164);
    if (layout.main) drawQuestEntry(context, layout.main, time, {
      reducedMotion,
      active: true,
    });
    if (layout.side.length > 0) {
      context.fillStyle = '#6b5744';
      context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(childFacingUiText('Help someone', 'caption'), WORLD.width / 2, 382);
      for (const entry of layout.side) drawQuestEntry(context, entry, time, {
        reducedMotion,
        active: false,
        sleepingImage: this.imageFor('props/ch3/sleeping-star'),
      });
    }
    context.restore();
    return layout;
  }
}

function normalizeEntry(entry, objective, fallbackKind) {
  if (!entry && !objective) return null;
  const source = entry ?? objective;
  const caption = source?.caption ?? objective?.caption ?? '';
  if (!caption) return null;
  return Object.freeze({
    id: source.id ?? `journal.${fallbackKind}`,
    kind: source.kind ?? fallbackKind,
    status: source.status ?? (fallbackKind === 'main' ? 'active' : 'sleeping'),
    caption: String(caption),
    mapStar: source.mapStar ?? null,
  });
}

function drawQuestEntry(context, item, time, { reducedMotion, active, sleepingImage = null }) {
  const { rect, entry } = item;
  const sleeping = entry.status === 'sleeping';
  const complete = entry.status === 'complete';
  context.save();
  context.globalAlpha = complete ? 0.58 : 1;
  context.fillStyle = active ? 'rgba(244,213,141,0.44)' : 'rgba(126,132,151,0.2)';
  traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, 34);
  context.fill();
  context.strokeStyle = active ? '#c99531' : '#8d91a2';
  context.lineWidth = active ? 5 : 4;
  context.stroke();
  const pulse = reducedMotion || sleeping ? 1 : 1 + Math.sin(Math.max(0, time) * 3.2) * 0.08;
  if (sleeping && readyImage(sleepingImage)) {
    const size = 70 * pulse;
    context.drawImage(
      sleepingImage,
      rect.x + 62 - size / 2,
      rect.y + rect.height / 2 - size / 2,
      size,
      size,
    );
  } else {
    drawStar(context, rect.x + 62, rect.y + rect.height / 2, 29 * pulse, {
      fill: active ? PALETTE.interactive : '#b7baca',
      stroke: active ? '#7d5428' : '#64697d',
      sleeping,
    });
  }
  context.fillStyle = '#382a24';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.font = `700 ${active ? 34 : 28}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(
    context,
    childFacingUiText(entry.caption, 'caption'),
    rect.x + 112,
    rect.y + rect.height / 2,
    rect.width - 142,
  );
  context.restore();
}

function drawStar(context, x, y, radius, { fill, stroke, sleeping }) {
  context.save();
  context.translate(x, y);
  context.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const length = index % 2 === 0 ? radius : radius * 0.43;
    const pointX = Math.cos(angle) * length;
    const pointY = Math.sin(angle) * length;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 3;
  context.stroke();
  if (sleeping) {
    context.fillStyle = '#4f5365';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '700 18px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('z', 0, 1);
  }
  context.restore();
}

function fitText(context, text, x, y, maxWidth) {
  if (!text) return;
  let size = Number.parseInt(context.font, 10) || 28;
  while (size > 18 && context.measureText(String(text)).width > maxWidth) {
    size -= 1;
    context.font = context.font.replace(/\d+px/u, `${size}px`);
  }
  context.fillText(String(text), x, y);
}

function readyImage(image) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}
