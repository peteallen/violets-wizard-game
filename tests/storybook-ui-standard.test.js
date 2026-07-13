import { describe, expect, it } from 'vitest';
import {
  drawStorybookSpread,
  traceRoundedRect,
} from '../src/game/render/uiPrimitives.js';
import { drawDeckledParchment } from '../src/game/render/uiIllustrations.js';

const FORBIDDEN_SURFACE_GEOMETRY = new Set([
  'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'strokeRect',
]);

function recordingContext() {
  const assignments = [];
  const calls = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
    'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'stroke', 'strokeRect',
    'translate',
  ]);
  const target = {
    assignments,
    calls,
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') {
        return (value) => ({ width: String(value).length * 10 });
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
      assignments.push([property, value]);
      object[property] = value;
      return true;
    },
  });
}

function pathPoints(calls) {
  const points = [];
  for (const [name, ...args] of calls) {
    if (name === 'moveTo' || name === 'lineTo') points.push(args.slice(0, 2));
    if (name === 'quadraticCurveTo') {
      points.push(args.slice(0, 2), args.slice(2, 4));
    }
    if (name === 'bezierCurveTo') {
      points.push(args.slice(0, 2), args.slice(2, 4), args.slice(4, 6));
    }
  }
  return points;
}

function assignedStyles(context, property) {
  return context.assignments
    .filter(([name]) => name === property)
    .map(([, value]) => value);
}

function numericArgumentsAreFinite(calls) {
  return calls
    .flatMap(([, ...args]) => args)
    .filter((value) => typeof value === 'number')
    .every(Number.isFinite);
}

describe('shared Storybook Standard paper surfaces', () => {
  it('keeps rounded callers inside the same bounds while tracing a deterministic hand-wobbled path', () => {
    const first = recordingContext();
    const replayed = recordingContext();
    traceRoundedRect(first, 10, 20, 200, 100, 24);
    traceRoundedRect(replayed, 10, 20, 200, 100, 24);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo')).toHaveLength(8);
    expect(first.calls.some(([name]) => FORBIDDEN_SURFACE_GEOMETRY.has(name))).toBe(false);
    expect(first.calls.some(([name]) => name === 'lineTo')).toBe(false);

    const points = pathPoints(first.calls);
    const xValues = points.map(([x]) => x);
    const yValues = points.map(([, y]) => y);
    expect(Math.min(...xValues)).toBe(10);
    expect(Math.max(...xValues)).toBe(210);
    expect(Math.min(...yValues)).toBe(20);
    expect(Math.max(...yValues)).toBe(120);
    expect(first.depth).toBe(0);
  });

  it('builds the open-book surface from organic, multi-tone, upper-left-lit paper', () => {
    const first = recordingContext();
    const replayed = recordingContext();
    const rect = { x: 72, y: 32, width: 1136, height: 652 };
    const options = { title: 'Violet’s Satchel', subtitle: 'Grown-ups only' };
    drawStorybookSpread(first, rect, options);
    drawStorybookSpread(replayed, rect, options);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.calls.filter(([name]) => name === 'fillRect')).toEqual([
      ['fillRect', 0, 0, 1280, 720],
    ]);
    expect(first.calls.some(([name]) => FORBIDDEN_SURFACE_GEOMETRY.has(name))).toBe(false);
    expect(first.calls.some(([name]) => name === 'lineTo')).toBe(false);
    expect(first.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(50);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(25);

    const fills = assignedStyles(first, 'fillStyle');
    expect(new Set(fills).size).toBeGreaterThanOrEqual(9);
    expect(fills).toContain('rgba(255,244,210,0.42)');
    expect(fills).toContain('rgba(93,58,39,0.18)');
    expect(first.calls).toContainEqual(['fillText', 'Violet’s Satchel', 640, 94]);
    expect(first.calls).toContainEqual(['fillText', 'Grown-ups only', 640, 126]);
    expect(numericArgumentsAreFinite(first.calls)).toBe(true);
    expect(first.depth).toBe(0);
    expect(replayed.depth).toBe(0);
  });

  it('renders default deckled parchment as layered paper without generic owl ornaments', () => {
    const first = recordingContext();
    const replayed = recordingContext();
    const rect = { x: 156, y: 82, width: 968, height: 550 };
    drawDeckledParchment(first, rect);
    drawDeckledParchment(replayed, rect);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.calls.some(([name]) => FORBIDDEN_SURFACE_GEOMETRY.has(name))).toBe(false);
    expect(first.calls.some(([name]) => name === 'lineTo')).toBe(false);
    expect(first.calls.some(([name]) => name === 'translate' || name === 'scale')).toBe(false);
    expect(first.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(100);
    expect(first.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThan(14);

    const fills = assignedStyles(first, 'fillStyle');
    expect(new Set(fills).size).toBeGreaterThanOrEqual(6);
    expect(fills).toContain('rgba(255,244,210,0.38)');
    expect(fills).toContain('rgba(105,65,38,0.17)');
    expect(fills).toContain('rgba(126,82,44,0.1)');
    expect(numericArgumentsAreFinite(first.calls)).toBe(true);
    expect(first.depth).toBe(0);
    expect(replayed.depth).toBe(0);
  });
});
