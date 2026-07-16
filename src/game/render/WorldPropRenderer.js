import {
  LETTER_ENVELOPE_POSE,
  drawClosedLetterEnvelope,
} from './LetterRenderer.js';

export class WorldPropRenderer {
  draw(context, state, time, { reducedMotion = false } = {}) {
    if (
      state?.setPiece
      || state?.overlay?.surface === 'letter-reading'
      || state?.dialogue?.scriptId === 'ch1.letter.read'
    ) return;
    const letter = state?.targets?.find((target) => target.id === 'bedroom.letter');
    if (!letter?.hitArea) return;
    drawDeliveredEnvelope(context, {
      x: letter.hitArea.x - (state.cameraX ?? 0),
      y: LETTER_ENVELOPE_POSE.y,
      scale: LETTER_ENVELOPE_POSE.scale,
      rotation: LETTER_ENVELOPE_POSE.rotation,
      reducedMotion,
    }, time);
  }
}

export function drawDeliveredEnvelope(context, {
  x = LETTER_ENVELOPE_POSE.x,
  y = LETTER_ENVELOPE_POSE.y,
  scale = LETTER_ENVELOPE_POSE.scale,
  rotation = LETTER_ENVELOPE_POSE.rotation,
  reducedMotion = false,
} = {}, time = 0) {
  const float = reducedMotion ? 0 : Math.sin(time * 1.7) * 1.2;
  context.save();
  context.translate(x, y + float);
  context.rotate(rotation);
  context.scale(scale, scale);
  drawClosedLetterEnvelope(context, { time, reducedMotion });
  context.restore();
}
