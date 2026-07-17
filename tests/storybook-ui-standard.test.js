import { describe, expect, it } from 'vitest';
import {
  drawParchmentAction,
  drawReplayRibbon,
  drawRibbonTab,
  drawStorybookSpread,
  drawWaxMedallion,
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
    'drawImage', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
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

  it('preserves dark custom paper with restrained gold light instead of a cream wash', () => {
    const earned = recordingContext();
    const locked = recordingContext();
    const rect = { x: 84, y: 102, width: 292, height: 386 };

    drawDeckledParchment(earned, rect, {
      fill: '#6a4c35',
      edge: '#e8b44f',
      ornament: false,
      lighting: 'dark',
    });
    drawDeckledParchment(locked, rect, {
      fill: '#5a5264',
      edge: '#9a8fa2',
      ornament: false,
      lighting: 'dark',
    });

    for (const context of [earned, locked]) {
      const fills = assignedStyles(context, 'fillStyle');
      expect(fills).toContain('rgba(244,213,141,0.12)');
      expect(fills).toContain('rgba(18,14,24,0.26)');
      expect(fills).not.toContain('rgba(255,244,210,0.38)');
      expect(context.depth).toBe(0);
    }
    expect(assignedStyles(earned, 'fillStyle')).toContain('#6a4c35');
    expect(assignedStyles(locked, 'fillStyle')).toContain('#5a5264');
  });

  it('builds shared actions, tabs, replay ribbons, and wax seals from organic layered materials', () => {
    const action = recordingContext();
    const actionReplay = recordingContext();
    const tab = recordingContext();
    const replay = recordingContext();
    const wax = recordingContext();
    const actionRect = { x: 120, y: 180, width: 430, height: 118 };

    drawParchmentAction(action, actionRect, { label: 'Hear the letter', detail: 'A safe detail' });
    drawParchmentAction(actionReplay, actionRect, { label: 'Hear the letter', detail: 'A safe detail' });
    drawRibbonTab(tab, { x: 180, y: 120, width: 230, height: 88 }, 'Play', { active: true });
    drawReplayRibbon(replay, { x: 430, y: 18, width: 420, height: 88 });
    drawWaxMedallion(wax, 90, 90, 42, '✓');

    expect(action.calls).toEqual(actionReplay.calls);
    expect(action.assignments).toEqual(actionReplay.assignments);
    for (const [label, context, minimumCurves, minimumTones] of [
      ['parchment action', action, 100, 10],
      ['leather tab', tab, 60, 7],
      ['replay ribbon', replay, 120, 10],
      ['wax seal', wax, 70, 7],
    ]) {
      expect(context.calls.some(([name]) => [
        ...FORBIDDEN_SURFACE_GEOMETRY,
        'lineTo',
        'setLineDash',
      ].includes(name)), label).toBe(false);
      expect(context.calls.filter(([name]) => name === 'quadraticCurveTo').length, label)
        .toBeGreaterThanOrEqual(minimumCurves);
      expect(new Set([
        ...assignedStyles(context, 'fillStyle'),
        ...assignedStyles(context, 'strokeStyle'),
      ]).size, label)
        .toBeGreaterThanOrEqual(minimumTones);
      expect(numericArgumentsAreFinite(context.calls), label).toBe(true);
      expect(context.depth, label).toBe(0);
    }

    expect(assignedStyles(action, 'fillStyle')).toEqual(expect.arrayContaining([
      '#ead9b7',
      'rgba(255,244,210,0.42)',
      'rgba(93,58,39,0.18)',
    ]));
  });

  it('three-slices a decoded painted action note while preserving both end caps', () => {
    const narrow = recordingContext();
    const wide = recordingContext();
    const image = { complete: true, naturalWidth: 1200, naturalHeight: 400 };
    const narrowRect = { x: 60, y: 594, width: 280, height: 96 };
    const wideRect = { x: 120, y: 180, width: 430, height: 96 };

    drawParchmentAction(narrow, narrowRect, { label: 'Hear the letter', image });
    drawParchmentAction(wide, wideRect, { label: 'Hear the letter', image });

    const narrowSlices = narrow.calls.filter(([name]) => name === 'drawImage');
    const wideSlices = wide.calls.filter(([name]) => name === 'drawImage');
    expect(narrowSlices).toHaveLength(3);
    expect(wideSlices).toHaveLength(3);
    expect(narrowSlices).toEqual([
      ['drawImage', image, 0, 0, 240, 400, 60, 594, 57.6, 96],
      ['drawImage', image, 240, 0, 720, 400, 117.6, 594, 164.8, 96],
      ['drawImage', image, 960, 0, 240, 400, 282.4, 594, 57.6, 96],
    ]);
    expect(wideSlices[0].slice(1, 6)).toEqual(narrowSlices[0].slice(1, 6));
    expect(wideSlices[2].slice(1, 6)).toEqual(narrowSlices[2].slice(1, 6));
    expect(wideSlices[0].slice(-2)).toEqual(narrowSlices[0].slice(-2));
    expect(wideSlices[2].slice(-2)).toEqual(narrowSlices[2].slice(-2));
    expect(wideSlices[1][8] - narrowSlices[1][8]).toBe(wideRect.width - narrowRect.width);
  });

  it('keeps live action semantics above painted notes and uses the exact vector fallback until decode', () => {
    const painted = recordingContext();
    const fallback = recordingContext();
    const vector = recordingContext();
    const rect = { x: 120, y: 180, width: 430, height: 118 };
    const iconCalls = [];
    const icon = (...args) => iconCalls.push(args);
    const options = {
      label: 'Start over',
      detail: 'Keeps sound settings',
      icon,
      disabled: true,
      danger: true,
      compact: true,
    };

    drawParchmentAction(painted, rect, {
      ...options,
      image: { complete: true, naturalWidth: 1200, naturalHeight: 400 },
    });
    drawParchmentAction(fallback, rect, {
      ...options,
      image: { complete: false, naturalWidth: 1200, naturalHeight: 400 },
    });
    drawParchmentAction(vector, rect, options);

    expect(painted.assignments).toContainEqual(['globalAlpha', 0.48]);
    expect(assignedStyles(painted, 'fillStyle')).toContain('#4d2430');
    expect(painted.calls).toContainEqual(['fillText', 'Start over', 202, 236]);
    expect(painted.calls).toContainEqual(['fillText', 'Keeps sound settings', 224, 266]);
    expect(iconCalls).toHaveLength(3);
    expect(fallback.calls).toEqual(vector.calls);
    expect(fallback.assignments).toEqual(vector.assignments);
    expect(fallback.calls.some(([name]) => name === 'drawImage')).toBe(false);
  });
});
