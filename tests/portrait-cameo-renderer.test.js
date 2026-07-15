import { describe, expect, it, vi } from 'vitest';
import {
  PORTRAIT_CAMEO_STYLE,
  PortraitCameoRenderer,
  definePortraitCameoFigure,
  drawPortraitCameo,
  tracePortraitCameoSilhouette,
} from '../src/game/render/PortraitCameoRenderer.js';

function recordingContext() {
  const calls = [];
  let depth = 0;
  let minimumDepth = 0;
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'fill', 'lineTo', 'moveTo',
    'quadraticCurveTo', 'restore', 'save', 'scale', 'stroke', 'translate',
  ]);
  const target = {
    calls,
    globalAlpha: 1,
    get depth() { return depth; },
    get minimumDepth() { return minimumDepth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'save') depth += 1;
          if (property === 'restore') {
            depth -= 1;
            minimumDepth = Math.min(minimumDepth, depth);
          }
        };
      }
      return object[property];
    },
    set(object, property, value) {
      calls.push(['set', property, value]);
      object[property] = value;
      return true;
    },
  });
}

const BACKDROP = Object.freeze({ dark: '#302642', light: '#8b63aa' });

function testFigure(drawFigure = (context) => {
  context.beginPath();
  context.moveTo(-8, 8);
  context.bezierCurveTo(-5, -8, 5, -8, 8, 8);
  context.closePath();
  context.fill();
}) {
  return definePortraitCameoFigure({
    placement: { x: 3, y: 17, scale: 0.82 },
    drawFigure,
  });
}

function render({ time = 1.375, reducedMotion = false } = {}) {
  const context = recordingContext();
  const result = drawPortraitCameo(context, {
    x: 80,
    y: 90,
    scale: 1.2,
    backdrop: BACKDROP,
    reducedMotion,
    figure: testFigure(),
  }, time);
  return { context, result };
}

describe('shared portrait cameo renderer', () => {
  it('wraps a package-owned figure callback with package-owned placement', () => {
    const context = recordingContext();
    const drawFigure = vi.fn((_context, state) => {
      expect(_context).toBe(context);
      expect(state).toEqual({ time: 2.25, reducedMotion: true });
      return Object.freeze({ status: 'drawn' });
    });
    const figure = definePortraitCameoFigure({
      placement: { x: -4, y: 58, scale: 0.92 },
      drawFigure,
    });
    expect(Object.isFrozen(figure)).toBe(true);
    expect(Object.isFrozen(figure.placement)).toBe(true);

    const renderer = new PortraitCameoRenderer();
    const result = renderer.draw(context, {
      x: 14,
      y: 21,
      scale: 1.4,
      backdrop: BACKDROP,
      reducedMotion: true,
      figure,
    }, 2.25);

    expect(result).toEqual({ status: 'drawn' });
    expect(drawFigure).toHaveBeenCalledOnce();
    expect(context.calls).toContainEqual(['translate', 14, 21]);
    expect(context.calls).toContainEqual(['scale', 1.4, 1.4]);
    expect(context.calls).toContainEqual(['translate', -4, 58]);
    expect(context.calls).toContainEqual(['scale', 0.92, 0.92]);
    expect(context.calls.findIndex(([name]) => name === 'clip')).toBeLessThan(
      context.calls.findIndex((call) => call[0] === 'translate' && call[1] === -4),
    );
    expect(context.depth).toBe(0);
    expect(context.minimumDepth).toBe(0);
  });

  it('draws deterministic animated output and freezes all frame motion when reduced', () => {
    const first = render({ time: 1.375 });
    const replayed = render({ time: 1.375 });
    const later = render({ time: 4.25 });
    expect(first.context.calls).toEqual(replayed.context.calls);
    expect(first.context.calls).not.toEqual(later.context.calls);

    const reducedStart = render({ time: 0, reducedMotion: true });
    const reducedLater = render({ time: 99, reducedMotion: true });
    expect(reducedStart.context.calls).toEqual(reducedLater.context.calls);

    for (const { context } of [first, replayed, later, reducedStart, reducedLater]) {
      expect(context.calls.every(([, ...values]) => values.every(
        (value) => typeof value !== 'number' || Number.isFinite(value),
      ))).toBe(true);
      expect(context.calls.filter(([name]) => name === 'save')).toHaveLength(
        context.calls.filter(([name]) => name === 'restore').length,
      );
      expect(context.calls.filter(([name]) => name === 'clip').length).toBeGreaterThanOrEqual(4);
      expect(context.depth).toBe(0);
      expect(context.minimumDepth).toBe(0);
    }
  });

  it('retains the organic brass-and-parchment frame and restores state after a figure error', () => {
    const silhouette = recordingContext();
    tracePortraitCameoSilhouette(silhouette, 55);
    expect(silhouette.calls.map(([name]) => name)).toEqual([
      'beginPath', 'moveTo',
      'bezierCurveTo', 'bezierCurveTo', 'bezierCurveTo',
      'bezierCurveTo', 'bezierCurveTo', 'bezierCurveTo',
      'closePath',
    ]);

    const { context } = render({ reducedMotion: true });
    const assignedColors = context.calls
      .filter(([name, property]) => name === 'set' && ['fillStyle', 'strokeStyle'].includes(property))
      .map(([, , value]) => value);
    for (const color of Object.values(PORTRAIT_CAMEO_STYLE)) {
      expect(assignedColors).toContain(color);
    }
    expect(context.calls.some(([name]) => ['arc', 'ellipse', 'roundRect'].includes(name))).toBe(false);

    const failingContext = recordingContext();
    expect(() => drawPortraitCameo(failingContext, {
      backdrop: BACKDROP,
      figure: testFigure(() => { throw new Error('figure failed'); }),
    }, 1)).toThrow('figure failed');
    expect(failingContext.depth).toBe(0);
    expect(failingContext.minimumDepth).toBe(0);
  });

  it('rejects incomplete presentation and invalid figure placement at the boundary', () => {
    expect(() => definePortraitCameoFigure({ drawFigure: null })).toThrow(/drawFigure/);
    expect(() => definePortraitCameoFigure({
      placement: { scale: 0 },
      drawFigure() {},
    })).toThrow(/greater than zero/);
    expect(() => drawPortraitCameo(recordingContext(), {
      backdrop: { dark: 'purple', light: '#8b63aa' },
      figure: testFigure(),
    })).toThrow(/six-digit hexadecimal/);
  });
});
