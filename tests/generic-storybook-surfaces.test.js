import { describe, expect, it } from 'vitest';
import {
  chapterCardLayout,
  objectiveOverlayLayout,
  UIRenderer,
} from '../src/game/render/UIRenderer.js';

const FORBIDDEN_PLAYER_GEOMETRY = new Set([
  'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
]);

function recordingContext() {
  const assignments = [];
  const calls = [];
  const texts = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
    'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'stroke', 'strokeRect',
    'strokeText', 'translate',
  ]);
  const target = {
    assignments,
    calls,
    texts,
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') {
        return (value) => ({ width: String(value).length * 14 });
      }
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'fillText') texts.push(String(args[0]));
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

function overlaps(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function expectOrganicFiniteSurface(context, minimumBezierCurves = 25) {
  expect(context.calls.some(([name]) => FORBIDDEN_PLAYER_GEOMETRY.has(name))).toBe(false);
  expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length)
    .toBeGreaterThan(minimumBezierCurves);
  expect(context.calls
    .flatMap(([, ...args]) => args)
    .filter((value) => typeof value === 'number')
    .every(Number.isFinite)).toBe(true);
  expect(context.depth).toBe(0);
}

describe('remaining generic Storybook UI surfaces', () => {
  it('renders one organic compass and caption without decorative owl filler', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const first = recordingContext();
    const replayed = recordingContext();
    const reducedStart = recordingContext();
    const reducedLater = recordingContext();

    expect(renderer.drawObjective(first, { caption: 'Choose a pet' }, 3.75)).toEqual(
      objectiveOverlayLayout(),
    );
    renderer.drawObjective(replayed, { caption: 'Choose a pet' }, 3.75);
    renderer.drawObjective(reducedStart, { caption: 'Choose a pet' }, 0, { reducedMotion: true });
    renderer.drawObjective(reducedLater, { caption: 'Choose a pet' }, 18, { reducedMotion: true });

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(reducedStart.calls).toEqual(reducedLater.calls);
    expect(first.calls.filter(([name]) => name === 'fillRect')).toEqual([
      ['fillRect', 0, 0, 1280, 720],
    ]);
    expect(new Set(first.texts)).toEqual(new Set(['Choose a pet']));
    expectOrganicFiniteSurface(first);
  });

  it('composes Chapter One as a platform ticket with a separate generous action', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const first = recordingContext();
    const replayed = recordingContext();
    const reducedStart = recordingContext();
    const reducedLater = recordingContext();
    const card = { title: 'Platform Nine and Three-Quarters', buttonLabel: 'Continue' };

    expect(renderer.drawChapterCard(first, card, 4.25, { paintedBackground: true })).toEqual(
      chapterCardLayout(),
    );
    renderer.drawChapterCard(replayed, card, 4.25, { paintedBackground: true });
    renderer.drawChapterCard(reducedStart, card, 0, {
      paintedBackground: true,
      reducedMotion: true,
    });
    renderer.drawChapterCard(reducedLater, card, 22, {
      paintedBackground: true,
      reducedMotion: true,
    });

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(reducedStart.calls).toEqual(reducedLater.calls);
    expect(first.calls.filter(([name]) => name === 'fillRect')).toEqual([
      ['fillRect', 0, 0, 1280, 720],
    ]);
    expect(first.texts.join(' ')).toContain('Platform Nine and Three-Quarters');
    expect(first.texts).toContain('Continue');

    const layout = chapterCardLayout();
    expect(layout.action.width).toBeGreaterThanOrEqual(88);
    expect(layout.action.height).toBeGreaterThanOrEqual(88);
    expect(overlaps(layout.action, layout.ticket)).toBe(false);
    expect(overlaps(layout.action, layout.title)).toBe(false);
    expect(overlaps(layout.illustration, layout.title)).toBe(false);
    expect(first.calls.some(([name]) => name === 'lineTo')).toBe(false);
    expectOrganicFiniteSurface(first, 70);
  });
});
