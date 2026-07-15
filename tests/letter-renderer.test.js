import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LETTER_ENVELOPE_POSE,
  drawClosedLetterEnvelope,
} from '../src/game/render/LetterRenderer.js';
import { SetPieceRenderer } from '../src/game/render/SetPieceRenderer.js';
import { drawDeliveredEnvelope } from '../src/game/render/WorldPropRenderer.js';

const source = readFileSync(new URL('../src/game/render/LetterRenderer.js', import.meta.url), 'utf8');

function recordingContext() {
  const calls = [];
  let depth = 0;
  const gradient = { addColorStop: (...args) => calls.push(['addColorStop', ...args]) };
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'fill', 'fillRect', 'fillText',
    'moveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'strokeText', 'translate',
  ]);
  const target = { calls, globalAlpha: 1, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient') {
        return (...args) => {
          calls.push([property, ...args]);
          return gradient;
        };
      }
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

function materialCalls(context) {
  const transforms = new Set(['save', 'restore', 'translate', 'rotate', 'scale', 'fillRect']);
  return context.calls.filter(([name]) => !transforms.has(name));
}

describe('canonical illustrated letter prop', () => {
  it('uses one deterministic organic construction without perfect geometry primitives', () => {
    const first = recordingContext();
    const second = recordingContext();
    drawClosedLetterEnvelope(first, { time: 1.25 });
    drawClosedLetterEnvelope(second, { time: 1.25 });

    expect(first.calls).toEqual(second.calls);
    expect(first.calls).toContainEqual(['fillText', 'VIOLET', 0, -27]);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(70);
    expect(first.depth).toBe(0);
    for (const forbidden of ['arc', 'ellipse', 'rect', 'roundRect', 'lineTo']) {
      expect(source).not.toMatch(new RegExp(`context\\.${forbidden}\\(`));
    }
  });

  it('hands the owl-delivered prop into opening frame zero without changing its material drawing', () => {
    const delivered = recordingContext();
    drawDeliveredEnvelope(delivered, LETTER_ENVELOPE_POSE, 0);

    const opening = recordingContext();
    const renderer = new SetPieceRenderer({ characterRenderer: { draw: () => {} } });
    renderer.drawLetterOpen(opening, {
      time: 0,
      descriptor: { duration: 4.6 },
    });

    expect(materialCalls(opening)).toEqual(materialCalls(delivered));
    expect(opening.depth).toBe(0);
  });
});
