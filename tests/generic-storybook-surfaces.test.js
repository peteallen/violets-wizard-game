import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
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
    'drawImage', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
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
  afterEach(() => vi.unstubAllGlobals());

  it('renders one detailed compass and live caption in a compact upper-edge reminder', () => {
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
    expect(first.calls.some(([name]) => name === 'drawImage')).toBe(false);

    const layout = objectiveOverlayLayout();
    expect(layout.panel).toEqual({ x: 160, y: 8, width: 960, height: 300 });
    expect(layout.compass.width).toBe(200);
    expect(layout.compass.height).toBe(200);
    expect(overlaps(layout.compass, layout.caption)).toBe(false);
    expectOrganicFiniteSurface(first);
  });

  it('uses the painted reminder prop when its decoded image is ready', () => {
    vi.stubGlobal('Image', class TestImage {});
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const image = {
      complete: true,
      naturalWidth: 1840,
      naturalHeight: 620,
    };
    renderer.images.set('ui/objective/reminder-v2', image);
    const context = recordingContext();

    renderer.drawObjective(context, { caption: 'Find your wand!' }, 2.5);

    const { panel } = objectiveOverlayLayout();
    expect(context.calls.filter(([name]) => name === 'drawImage')).toEqual([
      ['drawImage', image, panel.x, panel.y, panel.width, panel.height],
    ]);
    expect(new Set(context.texts)).toEqual(new Set(['Find your wand!']));
  });

  it('keeps the Chapter One fallback compact, deterministic, and separate from its action', () => {
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
    expect(first.calls.some(([name]) => name === 'drawImage')).toBe(false);

    const layout = chapterCardLayout();
    expect(layout.plaque).toEqual({ x: 60, y: 24, width: 720, height: 306 });
    expect(layout.title).toEqual({ x: 152, y: 92, width: 536, height: 128 });
    expect(layout.action).toEqual({ x: 72, y: 592, width: 360, height: 96 });
    expect(layout.action.width).toBeGreaterThanOrEqual(88);
    expect(layout.action.height).toBeGreaterThanOrEqual(88);
    expect(overlaps(layout.action, layout.plaque)).toBe(false);
    expect(overlaps(layout.action, layout.title)).toBe(false);
    expect(layout.plaque.x + layout.plaque.width).toBeLessThanOrEqual(800);
    expect(layout.action.x + layout.action.width).toBeLessThanOrEqual(450);
    expect(first.calls.some(([name]) => name === 'lineTo')).toBe(false);
    expectOrganicFiniteSurface(first, 20);
  });

  it('layers the decoded railway plaque and action note over live code-owned text', () => {
    vi.stubGlobal('Image', class TestImage {});
    const renderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
    const plaque = { complete: true, naturalWidth: 1600, naturalHeight: 680 };
    const actionNote = { complete: true, naturalWidth: 1200, naturalHeight: 400 };
    renderer.images.set('ui/story/chapter-one-plaque-v2', plaque);
    renderer.images.set('ui/story/action-note-v2', actionNote);
    const context = recordingContext();
    const card = { title: 'Platform Nine and Three-Quarters', buttonLabel: 'Continue' };

    const layout = renderer.drawChapterCard(context, card, 19, {
      paintedBackground: true,
      reducedMotion: true,
    });

    expect(context.calls.filter(([name]) => name === 'drawImage')).toEqual([
      ['drawImage', plaque, 60, 24, 720, 306],
      ['drawImage', actionNote, 0, 0, 240, 400, 72, 592, 57.6, 96],
      ['drawImage', actionNote, 240, 0, 720, 400, 129.6, 592, 244.8, 96],
      ['drawImage', actionNote, 960, 0, 240, 400, 374.4, 592, 57.6, 96],
    ]);
    expect(context.texts.join(' ')).toContain('Platform Nine and Three-Quarters');
    expect(context.texts).toContain('Continue');
    expect(overlaps(layout.title, layout.action)).toBe(false);
    expect(context.depth).toBe(0);
  });
});
