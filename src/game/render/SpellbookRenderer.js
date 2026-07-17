import { INPUT, PALETTE, WORLD } from '../config.js';
import { childFacingUiText } from '../content/playerVisibleCopy.js';
import {
  drawParchmentAction,
  drawStorybookSpread,
  traceRoundedRect,
} from './uiPrimitives.js';

const FULL_BOOK = Object.freeze({ x: 72, y: 32, width: 1136, height: 652 });
const FULL_BOOK_CLOSE = Object.freeze({ x: 1088, y: 56, width: 88, height: 88 });
const FAN_CLOSE = Object.freeze({ x: 1148, y: 382, width: 88, height: 88 });
const CARD_SIZE = Object.freeze({ width: 160, height: 222 });
const FAN_CARD_BOTTOM = 704;
const FULL_CARD_SIZE = Object.freeze({ width: 190, height: 224 });
const SPELLBOOK_ASSETS = Object.freeze({
  spread: 'ui/spells/spellbook-spread',
  card: 'ui/spells/card-shell',
  selectedCard: 'ui/spells/card-shell-selected',
  ribbon: 'ui/spells/incantation-ribbon',
});

export const SPELLBOOK_SEMANTICS = Object.freeze({
  close: 'spellbook.close',
  castPrefix: 'spellbook.cast.',
  detailPrefix: 'spellbook.detail.',
  practicePrefix: 'spellbook.practice.',
});

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

function center(rect) {
  return Object.freeze({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
}

function semanticTarget(id, rect, extras = {}) {
  const hitArea = freezeRect(rect);
  return Object.freeze({ id, hitArea, ...center(hitArea), ...extras });
}

function normalizedCards(spellbook) {
  const cards = Array.isArray(spellbook?.known) ? spellbook.known : [];
  return cards.filter((card) => card && typeof card.id === 'string').map((card) => Object.freeze({
    id: card.id,
    label: String(card.label ?? card.shortIncantation ?? card.incantation ?? card.id),
    incantation: String(card.incantation ?? card.label ?? card.id),
    shortIncantation: String(card.shortIncantation ?? card.label ?? card.incantation ?? card.id),
    icon: card.icon ?? 'sparkle',
    color: card.color ?? PALETTE.violet,
    effect: card.effect ?? null,
    audio: card.audio ?? null,
  }));
}

export function compactSpellFanLayout(spellbook = {}) {
  const cards = normalizedCards(spellbook);
  const count = Math.max(1, cards.length);
  const gap = 18;
  const totalWidth = cards.length * CARD_SIZE.width + Math.max(0, cards.length - 1) * gap;
  const startX = Math.max(340, WORLD.width - 44 - totalWidth);
  const restingY = FAN_CARD_BOTTOM - CARD_SIZE.height;
  const entries = cards.map((card, index) => {
    const distanceFromEnd = cards.length - 1 - index;
    const rect = freezeRect({
      x: startX + index * (CARD_SIZE.width + gap),
      y: restingY - Math.min(42, distanceFromEnd * 18),
      ...CARD_SIZE,
    });
    return Object.freeze({
      card,
      rect,
      selected: spellbook.selectedSpellId === card.id,
      semanticId: `${SPELLBOOK_SEMANTICS.castPrefix}${card.id}`,
    });
  });
  const emptyRect = freezeRect({
    x: WORLD.width - 44 - CARD_SIZE.width,
    y: restingY,
    ...CARD_SIZE,
  });
  const targets = entries.map((entry) => semanticTarget(entry.semanticId, entry.rect, {
    kind: 'spell-card',
    spellId: entry.card.id,
  }));
  targets.push(semanticTarget(SPELLBOOK_SEMANTICS.close, FAN_CLOSE, { kind: 'close' }));
  return Object.freeze({
    kind: 'compact-spell-fan',
    state: spellbook.state ?? 'closed',
    selectedSpellId: spellbook.selectedSpellId ?? null,
    entries: Object.freeze(entries),
    emptyRect,
    closeRect: FAN_CLOSE,
    targets: Object.freeze(targets),
    count,
    noTargets: spellbook.state === 'targeting'
      && (spellbook.validTargetIds?.length ?? 0) === 0,
  });
}

export function fullSpellbookLayout(spellbook = {}, { selectedSpellId = null } = {}) {
  const cards = normalizedCards(spellbook);
  const selectedId = cards.some(({ id }) => id === selectedSpellId)
    ? selectedSpellId
    : cards[0]?.id ?? null;
  const selectedCard = cards.find(({ id }) => id === selectedId) ?? null;
  const entries = cards.map((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const rect = freezeRect({
      x: 118 + column * 214,
      y: 170 + row * 244,
      ...FULL_CARD_SIZE,
    });
    return Object.freeze({
      card,
      rect,
      selected: card.id === selectedId,
      semanticId: `${SPELLBOOK_SEMANTICS.detailPrefix}${card.id}`,
    });
  });
  const practiceRect = selectedCard
    ? freezeRect({ x: 746, y: 544, width: 300, height: 96 })
    : null;
  const targets = entries.map((entry) => semanticTarget(entry.semanticId, entry.rect, {
    kind: 'spell-detail',
    spellId: entry.card.id,
  }));
  if (selectedCard && practiceRect) {
    targets.push(semanticTarget(
      `${SPELLBOOK_SEMANTICS.practicePrefix}${selectedCard.id}`,
      practiceRect,
      { kind: 'spell-practice', spellId: selectedCard.id },
    ));
  }
  targets.push(semanticTarget(SPELLBOOK_SEMANTICS.close, FULL_BOOK_CLOSE, { kind: 'close' }));
  return Object.freeze({
    kind: 'full-spellbook',
    bookRect: FULL_BOOK,
    closeRect: FULL_BOOK_CLOSE,
    entries: Object.freeze(entries),
    selectedSpellId: selectedId,
    selectedCard,
    practiceRect,
    targets: Object.freeze(targets),
  });
}

export function spellbookTargetAt(presentation, point) {
  if (!presentation || !point) return null;
  return presentation.targets.find(({ hitArea }) => pointInRect(point, hitArea)) ?? null;
}

export class SpellbookRenderer {
  constructor({ imageFor = () => null } = {}) {
    this.imageFor = imageFor;
  }

  drawFan(context, spellbook, time = 0, { reducedMotion = false } = {}) {
    const layout = compactSpellFanLayout(spellbook);
    const animationTime = reducedMotion ? 0 : Math.max(0, time);
    context.save();
    context.fillStyle = 'rgba(20,17,38,0.18)';
    context.fillRect(0, 430, WORLD.width, WORLD.height - 430);
    if (layout.entries.length === 0) {
      drawEmptyFan(context, layout.emptyRect);
    } else {
      layout.entries.forEach((entry, index) => {
        const rise = reducedMotion ? 0 : Math.sin(animationTime * 2.4 + index * 0.8) * 3;
        drawSpellCard(context, entry.card, {
          ...entry.rect,
          y: entry.rect.y + rise,
        }, {
          selected: entry.selected,
          unavailable: layout.noTargets && entry.selected,
          compact: true,
          image: this.imageFor(entry.selected
            ? SPELLBOOK_ASSETS.selectedCard
            : SPELLBOOK_ASSETS.card),
        });
      });
    }
    if (layout.noTargets) {
      context.fillStyle = '#f8e6ba';
      context.textAlign = 'right';
      context.font = '700 24px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(childFacingUiText('Magic later', 'caption'), 1128, 476);
    }
    drawCloseSeal(context, layout.closeRect);
    context.restore();
    return layout;
  }

  drawBook(context, spellbook, time = 0, {
    selectedSpellId = null,
    reducedMotion = false,
  } = {}) {
    const layout = fullSpellbookLayout(spellbook, { selectedSpellId });
    const spread = this.imageFor(SPELLBOOK_ASSETS.spread);
    if (readyImage(spread)) {
      context.save();
      context.fillStyle = 'rgba(20,17,38,0.8)';
      context.fillRect(0, 0, WORLD.width, WORLD.height);
      context.drawImage(spread, FULL_BOOK.x, FULL_BOOK.y, FULL_BOOK.width, FULL_BOOK.height);
      context.restore();
    } else {
      drawStorybookSpread(context, FULL_BOOK, {
        title: '',
        cornerFlourishes: true,
      });
    }

    context.save();
    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.font = '700 38px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Violet’s Spellbook', WORLD.width / 2, 94);

    if (layout.entries.length === 0) {
      drawEmptyBookPage(context);
    } else {
      for (const entry of layout.entries) {
        drawSpellCard(context, entry.card, entry.rect, {
          selected: entry.selected,
          image: this.imageFor(entry.selected
            ? SPELLBOOK_ASSETS.selectedCard
            : SPELLBOOK_ASSETS.card),
        });
      }
      drawSpellDetail(context, layout.selectedCard, layout.practiceRect, {
        reducedMotion,
        time,
        ribbonImage: this.imageFor(SPELLBOOK_ASSETS.ribbon),
      });
    }
    drawCloseSeal(context, layout.closeRect);
    context.restore();
    return layout;
  }

  drawCastingAffordances(context, state, time = 0, { reducedMotion = false } = {}) {
    const spellbook = state?.spellbook;
    if (spellbook?.state !== 'targeting') return Object.freeze([]);
    const valid = new Set(spellbook.validTargetIds ?? []);
    const targets = (state.targets ?? []).filter((target) => valid.has(target.id));
    const pulse = reducedMotion ? 0.72 : 0.58 + (Math.sin(Math.max(0, time) * 4.2) + 1) * 0.16;
    context.save();
    context.translate(-(state.cameraX ?? 0), 0);
    context.lineCap = 'round';
    for (const target of targets) drawCastingTarget(context, target.hitArea, pulse);
    context.restore();
    return Object.freeze(targets.map(({ id }) => id));
  }
}

function drawSpellCard(context, card, rect, {
  selected = false,
  unavailable = false,
  compact = false,
  image = null,
} = {}) {
  context.save();
  context.globalAlpha = unavailable ? 0.62 : 1;
  context.fillStyle = 'rgba(30,20,31,0.35)';
  traceRoundedRect(context, rect.x + 5, rect.y + 7, rect.width, rect.height, compact ? 24 : 30);
  context.fill();
  if (readyImage(image)) {
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  } else {
    context.fillStyle = selected ? '#f5e4b6' : '#ead9b7';
    traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, compact ? 24 : 30);
    context.fill();
    context.strokeStyle = selected ? PALETTE.interactive : '#8a6b44';
    context.lineWidth = selected ? 6 : 4;
    context.stroke();
    context.fillStyle = `${card.color}22`;
    traceRoundedRect(context, rect.x + 9, rect.y + 9, rect.width - 18, rect.height - 18, compact ? 18 : 22);
    context.fill();
  }
  const iconRadius = compact ? 30 : 42;
  drawSpellIcon(
    context,
    card.icon,
    rect.x + rect.width / 2,
    rect.y + (compact ? rect.height * 0.37 : 72),
    iconRadius,
    card.color,
  );
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = `700 ${compact ? 25 : 29}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(
    context,
    card.label,
    rect.x + rect.width / 2,
    rect.y + (compact ? rect.height * 0.82 : rect.height - 28),
    rect.width - 24,
  );
  context.restore();
}

function drawSpellDetail(context, card, practiceRect, {
  reducedMotion = false,
  time = 0,
  ribbonImage = null,
} = {}) {
  if (!card) return;
  const panel = { x: 650, y: 162, width: 442, height: 346 };
  context.fillStyle = 'rgba(139,100,58,0.1)';
  traceRoundedRect(context, panel.x, panel.y, panel.width, panel.height, 34);
  context.fill();
  drawSpellIcon(context, card.icon, panel.x + panel.width / 2, panel.y + 88, 60, card.color);
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = '700 36px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, card.label, panel.x + panel.width / 2, panel.y + 174, panel.width - 54);
  const ribbon = { x: panel.x + 34, y: panel.y + 201, width: panel.width - 68, height: 94 };
  if (readyImage(ribbonImage)) context.drawImage(ribbonImage, ribbon.x, ribbon.y, ribbon.width, ribbon.height);
  else {
    context.fillStyle = '#6b3151';
    traceRoundedRect(context, ribbon.x, ribbon.y, ribbon.width, ribbon.height, 24);
    context.fill();
    context.strokeStyle = '#d9ad55';
    context.lineWidth = 4;
    context.stroke();
  }
  context.fillStyle = '#fff1c9';
  context.font = '700 28px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, card.incantation, ribbon.x + ribbon.width / 2, ribbon.y + 58, ribbon.width - 36);
  const breathe = reducedMotion ? false : Math.sin(Math.max(0, time) * 2.5) > 0.55;
  drawParchmentAction(context, practiceRect, {
    label: childFacingUiText('Try this magic', 'action'),
    icon: breathe ? '✦' : '★',
    selected: false,
  });
}

function drawSpellIcon(context, icon, x, y, radius, color) {
  const semantic = String(icon ?? '').toLowerCase();
  context.save();
  context.translate(x, y);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(3, radius * 0.1);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (semantic.includes('feather') || semantic.includes('leviosa')) {
    context.beginPath();
    context.moveTo(-radius * 0.58, radius * 0.62);
    context.quadraticCurveTo(radius * 0.05, radius * 0.02, radius * 0.46, -radius * 0.72);
    context.quadraticCurveTo(radius * 0.7, -radius * 0.12, radius * 0.18, radius * 0.34);
    context.quadraticCurveTo(-radius * 0.08, radius * 0.55, -radius * 0.58, radius * 0.62);
    context.stroke();
    context.beginPath();
    context.moveTo(-radius * 0.46, radius * 0.5);
    context.lineTo(radius * 0.38, -radius * 0.55);
    context.stroke();
  } else {
    const rays = 8;
    context.beginPath();
    context.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    context.fill();
    for (let index = 0; index < rays; index += 1) {
      const angle = index * Math.PI * 2 / rays;
      context.beginPath();
      context.moveTo(Math.cos(angle) * radius * 0.45, Math.sin(angle) * radius * 0.45);
      context.lineTo(Math.cos(angle) * radius * 0.75, Math.sin(angle) * radius * 0.75);
      context.stroke();
    }
  }
  context.restore();
}

function drawEmptyFan(context, rect) {
  context.fillStyle = 'rgba(240,227,200,0.94)';
  traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, 24);
  context.fill();
  context.strokeStyle = '#8a6b44';
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = '#6b5744';
  context.textAlign = 'center';
  context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(
    childFacingUiText('Spells later', 'caption'),
    rect.x + rect.width / 2,
    rect.y + 74,
  );
}

function drawEmptyBookPage(context) {
  const slots = [
    { x: 164, y: 192, width: 260, height: 330 },
    { x: 856, y: 192, width: 260, height: 330 },
  ];
  for (const slot of slots) {
    context.fillStyle = 'rgba(118,83,47,0.08)';
    traceRoundedRect(context, slot.x, slot.y, slot.width, slot.height, 38);
    context.fill();
    context.strokeStyle = 'rgba(108,75,43,0.38)';
    context.lineWidth = 4;
    context.setLineDash?.([12, 10]);
    context.stroke();
    context.setLineDash?.([]);
  }
  context.fillStyle = '#6b5744';
  context.textAlign = 'center';
  context.font = '700 31px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(childFacingUiText('Spells later', 'caption'), WORLD.width / 2, 366);
}

function drawCloseSeal(context, rect) {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  context.fillStyle = 'rgba(43,25,31,0.38)';
  context.beginPath();
  context.arc(x + 3, y + 5, rect.width * 0.37, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#7d3041';
  context.beginPath();
  context.arc(x, y, rect.width * 0.35, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#f0cc72';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = '#fff1c9';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 32px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('×', x, y - 1);
}

function drawCastingTarget(context, hitArea, pulse) {
  if (!hitArea) return;
  const color = `rgba(255,215,106,${pulse})`;
  context.strokeStyle = color;
  context.shadowColor = 'rgba(255,225,142,0.82)';
  context.shadowBlur = 18;
  context.lineWidth = 6;
  context.beginPath();
  if (hitArea.shape === 'rect') {
    traceRoundedRect(
      context,
      hitArea.x - 8,
      hitArea.y - 8,
      hitArea.width + 16,
      hitArea.height + 16,
      Math.min(34, Math.min(hitArea.width, hitArea.height) * 0.24),
    );
  } else {
    context.arc(hitArea.x, hitArea.y, (hitArea.radius ?? 44) + 10, 0, Math.PI * 2);
  }
  context.stroke();
  context.shadowBlur = 0;
}

function fitText(context, text, x, y, maxWidth) {
  let size = Number.parseInt(context.font, 10) || 26;
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
