import { drawFourPointStar } from '../game/characters/vectorPrimitives.js';

function requireContext(value) {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    throw new TypeError('Character review rendering requires a drawing context.');
  }
  return value;
}

function requireRenderer(value) {
  if (!value || typeof value.draw !== 'function') {
    throw new TypeError('RegisteredCharacterReviewRenderer requires a character renderer.');
  }
  return value;
}

function requireCatalog(value) {
  if (!value || typeof value.get !== 'function') {
    throw new TypeError('RegisteredCharacterReviewRenderer requires a review descriptor catalog.');
  }
  return value;
}

function drawReviewBackground(context, title) {
  context.fillStyle = '#181526';
  context.fillRect(0, 0, 1280, 720);
  const gradient = context.createLinearGradient(0, 0, 0, 720);
  gradient.addColorStop(0, '#352b49');
  gradient.addColorStop(0.62, '#252039');
  gradient.addColorStop(1, '#17131f');
  context.fillStyle = gradient;
  context.fillRect(22, 22, 1236, 676);
  context.strokeStyle = '#b88c48';
  context.lineWidth = 4;
  context.strokeRect(31, 31, 1218, 658);
  context.strokeStyle = 'rgba(243,216,154,0.42)';
  context.lineWidth = 1.5;
  context.strokeRect(41, 41, 1198, 638);
  context.fillStyle = '#f0dcae';
  context.textAlign = 'center';
  context.font = '700 32px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(title, 640, 77);
  context.fillStyle = 'rgba(225,183,89,0.68)';
  for (let index = 0; index < 11; index += 1) {
    drawFourPointStar(context, 80 + index * 112, 111, index % 2 ? 2.2 : 3.2);
  }
}

function drawReviewLabel(context, label) {
  if (label.plinth) {
    context.fillStyle = 'rgba(13,11,21,0.52)';
    context.beginPath();
    context.ellipse(label.plinth.x, label.plinth.y - 6, 82, 18, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = '#f0dcae';
  context.textAlign = 'center';
  context.font = '700 22px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label.text, label.x, label.y);
}

function dynamicState(entry, time, baseTime, reducedMotion) {
  if (!entry.stateAtTime) return null;
  const value = entry.stateAtTime(Object.freeze({ time, baseTime, reducedMotion }));
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Character review entry ${entry.id} stateAtTime must return an object.`);
  }
  return value;
}

export class RegisteredCharacterReviewRenderer {
  constructor({ characterRenderer, descriptors } = {}) {
    this.characterRenderer = requireRenderer(characterRenderer);
    this.descriptors = requireCatalog(descriptors);
  }

  drawReviewScene(context, sceneId, time = 0, { reducedMotion = false } = {}) {
    requireContext(context);
    const descriptor = this.descriptors.get(sceneId);
    if (!descriptor) return false;
    const baseTime = Number.isFinite(time) ? time : 0;
    const safeReducedMotion = Boolean(reducedMotion);
    drawReviewBackground(context, descriptor.title);

    for (const entry of descriptor.entries) {
      if (entry.label?.order === 'before') drawReviewLabel(context, entry.label);
      const renderTime = baseTime + entry.timeOffset;
      entry.surround?.beforeDraw(context);
      try {
        this.characterRenderer.draw(context, {
          characterId: entry.characterId,
          surface: entry.surface,
          ...entry.state,
          ...dynamicState(entry, renderTime, baseTime, safeReducedMotion),
          ...(entry.inheritReducedMotion ? { reducedMotion: safeReducedMotion } : {}),
        }, renderTime);
      } finally {
        entry.surround?.afterDraw(context);
      }
      if (entry.label?.order === 'after') drawReviewLabel(context, entry.label);
    }
    return true;
  }
}
