import { INPUT, PALETTE, WORLD } from '../config.js';
import { childFacingUiText } from '../content/playerVisibleCopy.js';
import { traceRoundedRect } from './uiPrimitives.js';

const PANEL = Object.freeze({ x: 82, y: 42, width: 1116, height: 636 });
const RUNE_ASSETS = Object.freeze({
  runeTile: 'ui/spells/rune-tile',
  chantTile: 'ui/spells/chant-tile',
  ribbon: 'ui/spells/incantation-ribbon',
});

export const LEARNING_SEMANTIC_PREFIX = 'learning.tile.';

function readyImage(image) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}

function freezeRect(rect) {
  return Object.freeze({
    x: rect.x,
    y: rect.y,
    width: Math.max(INPUT.minimumTarget, rect.width),
    height: Math.max(INPUT.minimumTarget, rect.height),
  });
}

function normalizeTiles(learning) {
  return (Array.isArray(learning?.tiles) ? learning.tiles : [])
    .filter((tile) => tile && typeof tile.id === 'string')
    .map((tile) => Object.freeze({
      id: tile.id,
      glyph: String(tile.glyph ?? ''),
      voice: tile.voice ?? null,
      landed: Boolean(tile.landed),
      expected: Boolean(tile.expected),
      dimmed: Boolean(tile.dimmed),
      highlighted: Boolean(tile.highlighted),
      distractor: Boolean(tile.distractor),
    }));
}

function normalizeSlots(learning, tiles) {
  const supplied = Array.isArray(learning?.slots) ? learning.slots : null;
  if (supplied) {
    return supplied.map((slot, index) => Object.freeze({
      id: String(slot.id ?? `slot-${index}`),
      glyph: String(slot.glyph ?? ''),
      landed: Boolean(slot.landed),
      expected: Boolean(slot.expected),
      hidden: Boolean(slot.hidden),
    }));
  }
  const landed = tiles.filter((tile) => tile.landed);
  const count = Math.max(
    Number.isSafeInteger(learning?.stepCount) ? learning.stepCount : 0,
    landed.length,
    1,
  );
  const completedIds = new Set(learning?.completedUnitIds ?? []);
  return Array.from({ length: count }, (_, index) => {
    const tile = landed[index] ?? null;
    return Object.freeze({
      id: tile?.id ?? `slot-${index}`,
      glyph: tile?.glyph ?? '',
      landed: Boolean(tile || completedIds.has(tile?.id)),
      expected: index === (learning?.stepIndex ?? landed.length),
      hidden: false,
    });
  });
}

function learningKind(learning) {
  return String(learning?.kind ?? '').toLowerCase() === 'sequence'
    ? 'chant'
    : 'runes';
}

export function learningLayout(learning = {}) {
  const tiles = normalizeTiles(learning);
  const slots = normalizeSlots(learning, tiles);
  const kind = learningKind(learning);
  const slotGap = kind === 'chant' ? 10 : 18;
  const slotWidth = Math.max(94, Math.min(kind === 'chant' ? 142 : 124,
    (PANEL.width - 176 - (slots.length - 1) * slotGap) / slots.length));
  const slotHeight = kind === 'chant' ? 106 : 126;
  const totalSlotWidth = slots.length * slotWidth + Math.max(0, slots.length - 1) * slotGap;
  const slotStartX = PANEL.x + (PANEL.width - totalSlotWidth) / 2;
  const slotEntries = slots.map((slot, index) => Object.freeze({
    slot,
    rect: freezeRect({
      x: slotStartX + index * (slotWidth + slotGap),
      y: kind === 'chant' ? 184 : 158,
      width: slotWidth,
      height: slotHeight,
    }),
  }));

  const offered = tiles.filter((tile) => !tile.landed);
  const tileGap = 24;
  const tileWidth = kind === 'chant' ? 154 : 128;
  const tileHeight = kind === 'chant' ? 100 : 118;
  const totalTileWidth = offered.length * tileWidth + Math.max(0, offered.length - 1) * tileGap;
  const tileStartX = PANEL.x + (PANEL.width - totalTileWidth) / 2;
  const tileEntries = offered.map((tile, index) => {
    const rect = freezeRect({
      x: tileStartX + index * (tileWidth + tileGap),
      y: 510,
      width: tileWidth,
      height: tileHeight,
    });
    return Object.freeze({
      tile,
      rect,
      semanticId: `${LEARNING_SEMANTIC_PREFIX}${tile.id}`,
    });
  });
  const targets = tileEntries.map((entry) => Object.freeze({
    id: entry.semanticId,
    kind: 'learning-tile',
    unitId: entry.tile.id,
    hitArea: entry.rect,
    x: entry.rect.x + entry.rect.width / 2,
    y: entry.rect.y + entry.rect.height / 2,
  }));
  return Object.freeze({
    kind,
    panel: PANEL,
    slots: Object.freeze(slotEntries),
    tiles: Object.freeze(tileEntries),
    targets: Object.freeze(targets),
    progress: Object.freeze({
      stepIndex: learning.stepIndex ?? slots.filter(({ slot }) => slot.landed).length,
      stepCount: learning.stepCount ?? slots.length,
    }),
    hintStage: learning.hintStage ?? 'ready',
    featherLift: clamp01(learning.featherLift ?? 0),
  });
}

export function learningTargetAt(presentation, point) {
  if (!presentation || !point) return null;
  return presentation.targets.find(({ hitArea }) => pointInRect(point, hitArea)) ?? null;
}

export class LearningRenderer {
  constructor({ imageFor = () => null } = {}) {
    this.imageFor = imageFor;
  }

  draw(context, learning, time = 0, { reducedMotion = false } = {}) {
    if (!learning) return null;
    const layout = learningLayout(learning);
    const animationTime = reducedMotion ? 0 : Math.max(0, time);
    drawLearningSurface(context, layout, null);
    drawProgressDots(context, layout.progress);
    if (layout.kind === 'chant') {
      drawChantRibbon(context, layout, this.imageFor(RUNE_ASSETS.ribbon));
    }
    for (const entry of layout.slots) {
      drawLearningSlot(context, entry, layout.kind, null);
    }
    for (const [index, entry] of layout.tiles.entries()) {
      drawLearningTile(context, entry, layout.kind, animationTime + index * 0.17, {
        reducedMotion,
        image: this.imageFor(layout.kind === 'chant'
          ? RUNE_ASSETS.chantTile
          : RUNE_ASSETS.runeTile),
      });
    }
    if (layout.kind === 'chant') {
      drawLearningFeather(context, layout.featherLift, animationTime, { reducedMotion });
    } else {
      drawWandCharge(context, layout.progress, animationTime, { reducedMotion });
    }
    drawLearningCue(context, layout);
    return layout;
  }
}

function drawLearningSurface(context, layout, image) {
  context.save();
  context.fillStyle = 'rgba(18,14,34,0.58)';
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  if (readyImage(image)) {
    context.drawImage(image, layout.panel.x, layout.panel.y, layout.panel.width, layout.panel.height);
  } else {
    context.fillStyle = '#ead9b7';
    traceRoundedRect(
      context,
      layout.panel.x,
      layout.panel.y,
      layout.panel.width,
      layout.panel.height,
      52,
    );
    context.fill();
    context.strokeStyle = '#8a6b44';
    context.lineWidth = 6;
    context.stroke();
    context.fillStyle = 'rgba(122,79,201,0.08)';
    traceRoundedRect(
      context,
      layout.panel.x + 18,
      layout.panel.y + 18,
      layout.panel.width - 36,
      layout.panel.height - 36,
      42,
    );
    context.fill();
  }
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = '700 36px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(childFacingUiText('Magic', 'caption'), WORLD.width / 2, 108);
  context.restore();
}

function drawProgressDots(context, progress) {
  const count = Math.max(1, progress.stepCount);
  const gap = 24;
  const startX = WORLD.width / 2 - (count - 1) * gap / 2;
  context.save();
  for (let index = 0; index < count; index += 1) {
    context.fillStyle = index < progress.stepIndex ? PALETTE.interactive : 'rgba(83,58,43,0.24)';
    context.beginPath();
    context.arc(startX + index * gap, 130, index < progress.stepIndex ? 7 : 5, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawLearningSlot(context, entry, kind, image) {
  const { rect, slot } = entry;
  context.save();
  if (readyImage(image)) context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  else {
    context.fillStyle = slot.landed ? '#f4d58d' : 'rgba(121,82,45,0.11)';
    traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, kind === 'chant' ? 24 : 30);
    context.fill();
    context.strokeStyle = slot.expected ? PALETTE.interactive : 'rgba(103,72,46,0.52)';
    context.lineWidth = slot.expected ? 6 : 4;
    context.setLineDash?.(slot.landed ? [] : [10, 8]);
    context.stroke();
    context.setLineDash?.([]);
  }
  if (slot.glyph && !slot.hidden) {
    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `700 ${kind === 'chant' ? 29 : 48}px "Andika", "Trebuchet MS", sans-serif`;
    fitText(context, slot.glyph.toLocaleUpperCase('en-US'),
      rect.x + rect.width / 2, rect.y + rect.height / 2 + 1, rect.width - 20);
  }
  context.restore();
}

function drawLearningTile(context, entry, kind, time, { reducedMotion, image }) {
  const { rect, tile } = entry;
  const highlighted = tile.highlighted;
  const bob = reducedMotion ? 0 : Math.sin(time * 3.1) * (highlighted ? 5 : 2);
  context.save();
  context.globalAlpha = tile.dimmed ? 0.34 : 1;
  context.translate(0, bob);
  context.fillStyle = 'rgba(37,24,34,0.28)';
  traceRoundedRect(context, rect.x + 5, rect.y + 7, rect.width, rect.height, 28);
  context.fill();
  if (readyImage(image)) context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  else {
    context.fillStyle = highlighted ? '#f5e6b9' : '#e5d0a8';
    traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, 28);
    context.fill();
    context.strokeStyle = highlighted ? PALETTE.interactive : '#805b42';
    context.lineWidth = highlighted ? 7 : 4;
    context.shadowColor = highlighted ? 'rgba(255,215,106,0.75)' : 'transparent';
    context.shadowBlur = highlighted ? 16 : 0;
    context.stroke();
  }
  context.shadowBlur = 0;
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `700 ${kind === 'chant' ? 31 : 54}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(context, tile.glyph.toLocaleUpperCase('en-US'),
    rect.x + rect.width / 2, rect.y + rect.height / 2 + 2, rect.width - 22);
  context.restore();
}

function drawChantRibbon(context, layout, image) {
  const first = layout.slots[0]?.rect;
  const last = layout.slots.at(-1)?.rect;
  if (!first || !last) return;
  const rect = {
    x: first.x - 22,
    y: first.y - 18,
    width: last.x + last.width - first.x + 44,
    height: first.height + 36,
  };
  context.save();
  if (readyImage(image)) context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  else {
    context.strokeStyle = 'rgba(107,49,81,0.68)';
    context.lineWidth = 15;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(rect.x + 15, rect.y + rect.height / 2);
    context.bezierCurveTo(
      rect.x + rect.width * 0.3,
      rect.y + rect.height / 2 - 18,
      rect.x + rect.width * 0.7,
      rect.y + rect.height / 2 + 18,
      rect.x + rect.width - 15,
      rect.y + rect.height / 2,
    );
    context.stroke();
  }
  context.restore();
}

function drawWandCharge(context, progress, time, { reducedMotion }) {
  const ratio = clamp01(progress.stepCount > 0 ? progress.stepIndex / progress.stepCount : 0);
  const x = 1036;
  const y = 432;
  context.save();
  context.translate(x, y);
  context.rotate(-0.68);
  context.strokeStyle = '#5b382c';
  context.lineWidth = 14;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(-70, 0);
  context.lineTo(58, 0);
  context.stroke();
  context.strokeStyle = '#d7ad65';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(-68, -2);
  context.lineTo(56, -2);
  context.stroke();
  const pulse = reducedMotion ? 1 : 0.88 + Math.sin(time * 4.4) * 0.12;
  context.fillStyle = `rgba(255,242,198,${0.22 + ratio * 0.72})`;
  context.shadowColor = '#fff2c6';
  context.shadowBlur = 12 + ratio * 34 * pulse;
  context.beginPath();
  context.arc(65, 0, 8 + ratio * 15, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawLearningFeather(context, lift, time = 0, { reducedMotion = false, x = 640, y = 430 } = {}) {
  const amount = clamp01(lift);
  const sway = reducedMotion ? 0 : Math.sin(Math.max(0, time) * 2.2) * (4 + amount * 12);
  const rise = amount * 142;
  context.save();
  context.translate(x + sway, y - rise);
  context.rotate(-0.38 + amount * 0.74 + (reducedMotion ? 0 : Math.sin(time * 1.7) * 0.07));
  context.fillStyle = 'rgba(50,35,38,0.24)';
  context.beginPath();
  context.ellipse(5, 32 + amount * 74, 58 - amount * 18, 12 - amount * 5, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f8f1dc';
  context.strokeStyle = '#866f59';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-58, 11);
  context.bezierCurveTo(-34, -31, 27, -42, 65, -5);
  context.bezierCurveTo(29, 20, -13, 33, -58, 11);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = '#b39a78';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-64, 17);
  context.lineTo(57, -7);
  context.stroke();
  context.restore();
}

function drawLearningCue(context, layout) {
  if (layout.tiles.length === 0) return;
  const cue = layout.hintStage === 'focus' || layout.hintStage === 'complete'
    ? childFacingUiText('Tap this', 'action')
    : childFacingUiText('Tap', 'action');
  context.save();
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = '700 24px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(cue, WORLD.width / 2, 480);
  context.restore();
}

function fitText(context, text, x, y, maxWidth) {
  let size = Number.parseInt(context.font, 10) || 30;
  while (size > 17 && context.measureText(String(text)).width > maxWidth) {
    size -= 1;
    context.font = context.font.replace(/\d+px/u, `${size}px`);
  }
  context.fillText(String(text), x, y);
}

function pointInRect(point, rect) {
  return point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height;
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}
