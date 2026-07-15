import { STORYBOOK_INK } from '../../render/storybookInk.js';
import { drawFourPointStar } from '../vectorPrimitives.js';
import {
  createVectorCharacterRuntime,
  normalizeVectorRenderRequest,
} from '../vectorRuntime.js';
import { narratorStyle } from './definition.js';

const OUTLINE = STORYBOOK_INK.primary;

export function drawNarratorPortrait(context, state, time) {
  context.save();
  context.translate(state.x, state.y);
  context.scale(state.scale, state.scale);
  context.translate(0, 5);
  context.rotate(Math.sin(time * 0.7) * 0.012);
  context.fillStyle = narratorStyle.page;
  context.strokeStyle = OUTLINE;
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(-43, -28);
  context.quadraticCurveTo(-20, -36, 0, -18);
  context.quadraticCurveTo(20, -36, 43, -28);
  context.lineTo(40, 30);
  context.quadraticCurveTo(18, 20, 0, 37);
  context.quadraticCurveTo(-18, 20, -40, 30);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = narratorStyle.pageLine;
  context.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row += 1) {
      const y = -14 + row * 9;
      context.beginPath();
      context.moveTo(side * 6, y);
      context.quadraticCurveTo(side * 21, y - 3, side * 34, y);
      context.stroke();
    }
  }
  context.strokeStyle = narratorStyle.ribbon;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(16, 23);
  context.quadraticCurveTo(35, -2, 30, -36);
  context.stroke();
  context.strokeStyle = narratorStyle.ribbonLight;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = narratorStyle.star;
  drawFourPointStar(context, 30, -38, 4.2);
  context.restore();
}

function renderNarrator(request) {
  const normalized = normalizeVectorRenderRequest(request, {
    surface: 'portrait',
    x: 0,
    y: 0,
    scale: 1,
    pose: 'idle',
  });
  return drawNarratorPortrait(normalized.context, normalized.state, normalized.time);
}

export const narratorCharacterRuntime = createVectorCharacterRuntime({
  drawPortrait: renderNarrator,
});
