import { describe, expect, it } from 'vitest';
import {
  drawBrassCameoFrame,
  drawBrassWandHolster,
  drawCompassQuest,
  drawDeckledParchment,
  drawLeatherSatchel,
  drawVectorIcon,
  drawWaxIcon,
  traceDeckledRect,
} from '../src/game/render/uiIllustrations.js';

function recordingContext() {
  const calls = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill', 'fillRect',
    'lineTo', 'moveTo', 'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'setLineDash',
    'stroke', 'translate',
  ]);
  const target = { calls, globalAlpha: 1, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

describe('illustrated interface primitives', () => {
  it('draws every authored choice icon deterministically without text glyph stand-ins', () => {
    const icons = [
      'owl', 'cat', 'toad', 'wand', 'eyes', 'map', 'cards', 'replay', 'quill', 'satchel',
      'quest', 'close', 'check', 'speaker', 'gear', 'name-biscuit', 'name-pip', 'name-star',
      'heart', 'rose', 'circle', 'star',
    ];
    for (const icon of icons) {
      const first = recordingContext();
      const second = recordingContext();
      drawVectorIcon(first, icon, 60, 70, 88);
      drawVectorIcon(second, icon, 60, 70, 88);
      expect(first.calls).toEqual(second.calls);
      expect(first.calls.length).toBeGreaterThan(5);
      expect(first.calls.some(([name]) => name === 'fillText')).toBe(false);
      expect(first.depth).toBe(0);
    }
  });

  it('keeps the parchment, wax, brass, leather, compass, and holster drawings balanced', () => {
    const context = recordingContext();
    traceDeckledRect(context, 10, 12, 300, 160);
    drawDeckledParchment(context, { x: 10, y: 12, width: 300, height: 160 });
    drawWaxIcon(context, 80, 80, 38, 'owl');
    drawBrassCameoFrame(context, 100, 100, 70);
    drawLeatherSatchel(context, { x: 20, y: 20, width: 108, height: 108 });
    drawCompassQuest(context, { x: 20, y: 20, width: 104, height: 104 }, 1.25, { pulse: true });
    drawBrassWandHolster(context, { x: 20, y: 20, width: 108, height: 108 }, { time: 1.25 });
    expect(context.calls.length).toBeGreaterThan(150);
    expect(context.depth).toBe(0);
  });
});
