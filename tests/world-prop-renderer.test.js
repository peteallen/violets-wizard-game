import { describe, expect, it } from 'vitest';
import { WorldPropRenderer, drawDeliveredEnvelope } from '../src/game/render/WorldPropRenderer.js';

function recordingContext() {
  const calls = [];
  let depth = 0;
  const gradient = { addColorStop: (...args) => calls.push(['addColorStop', ...args]) };
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'fill', 'fillText', 'lineTo', 'moveTo',
    'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'strokeText', 'translate',
  ]);
  const target = { calls, globalAlpha: 1, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return (...args) => {
          calls.push([property, ...args]);
          return gradient;
        };
      }
      if (methods.has(property)) {
        return (...args) => {
          calls.push(property === 'fill' ? [property, object.globalAlpha] : [property, ...args]);
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

const deliveredState = {
  cameraX: 0,
  dialogue: null,
  setPiece: null,
  targets: [{
    id: 'bedroom.letter',
    hitArea: { shape: 'circle', x: 650, y: 350, radius: 160 },
  }],
};

describe('world prop renderer', () => {
  it('draws the delivered envelope deterministically with Violet and an owl seal', () => {
    const first = recordingContext();
    const second = recordingContext();

    drawDeliveredEnvelope(first, { x: 650, y: 350, scale: 0.84 }, 1.25);
    drawDeliveredEnvelope(second, { x: 650, y: 350, scale: 0.84 }, 1.25);

    expect(first.calls).toEqual(second.calls);
    expect(first.calls.length).toBeGreaterThan(90);
    expect(first.calls).toContainEqual(['fillText', 'VIOLET', 0, -27]);
    expect(first.calls.filter(([name]) => name === 'fill').at(-1)).toEqual(['fill', 1]);
    expect(first.depth).toBe(0);
  });

  it('shows the envelope after delivery, but not over its set piece or reading dialogue', () => {
    const renderer = new WorldPropRenderer();
    const delivered = recordingContext();
    renderer.draw(delivered, deliveredState, 2);
    expect(delivered.calls.length).toBeGreaterThan(90);

    const duringDelivery = recordingContext();
    renderer.draw(duringDelivery, { ...deliveredState, setPiece: { requestedId: 'sp.letter' } }, 2);
    expect(duringDelivery.calls).toEqual([]);

    const whileReading = recordingContext();
    renderer.draw(whileReading, {
      ...deliveredState,
      dialogue: { scriptId: 'ch1.letter.read' },
    }, 2);
    expect(whileReading.calls).toEqual([]);
  });
});
