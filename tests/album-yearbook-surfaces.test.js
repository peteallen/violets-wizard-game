import { afterEach, describe, expect, it, vi } from 'vitest';
import { cards } from '../src/game/content/cards.js';
import {
  albumCardLayout,
  buildCardAlbumEntries,
  drawYearbookPageDots,
  UIRenderer,
  UI_RECTS,
  yearbookLayout,
} from '../src/game/render/UIRenderer.js';

const FORBIDDEN_CONTENT_GEOMETRY = new Set([
  'arc', 'arcTo', 'ellipse', 'rect', 'roundRect',
]);

afterEach(() => vi.unstubAllGlobals());

function recordingContext() {
  const assignments = [];
  const calls = [];
  const texts = [];
  let depth = 0;
  let minimumDepth = 0;
  const methods = new Set([
    'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'drawImage',
    'ellipse', 'fill', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo',
    'rect', 'restore', 'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'stroke',
    'strokeRect', 'strokeText', 'transform', 'translate',
  ]);
  const target = {
    assignments,
    calls,
    texts,
    globalAlpha: 1,
    get depth() { return depth; },
    get minimumDepth() { return minimumDepth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') {
        return (value) => ({ width: String(value).length * 12 });
      }
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'fillText' || property === 'strokeText') texts.push(String(args[0]));
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

function expectGenerousDisjointTargets(rects) {
  for (const rect of rects) {
    expect(rect.width).toBeGreaterThanOrEqual(88);
    expect(rect.height).toBeGreaterThanOrEqual(88);
  }
  for (let first = 0; first < rects.length; first += 1) {
    for (let second = first + 1; second < rects.length; second += 1) {
      expect(overlaps(rects[first], rects[second])).toBe(false);
    }
  }
}

function expectOrganicFiniteBalanced(context, minimumBezierCurves = 30) {
  expect(context.calls.some(([name]) => FORBIDDEN_CONTENT_GEOMETRY.has(name))).toBe(false);
  expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length)
    .toBeGreaterThan(minimumBezierCurves);
  expect(context.calls
    .flatMap(([, ...args]) => args)
    .filter((value) => typeof value === 'number')
    .every(Number.isFinite)).toBe(true);
  expect(context.minimumDepth).toBe(0);
  expect(context.depth).toBe(0);
}

function assignedStyles(context, property) {
  return context.assignments
    .filter(([name]) => name === property)
    .map(([, value]) => value);
}

function loadedImage({ width = 1280, height = 720, src = '' } = {}) {
  return { complete: true, naturalWidth: width, naturalHeight: height, src };
}

describe('storybook satchel card album', () => {
  it('keeps the exact earned entries and large card targets clear of satchel controls', () => {
    const entries = buildCardAlbumEntries(cards, ['morgana']);
    expect(entries.map(({ id, earned }) => ({ id, earned }))).toEqual([
      { id: 'morgana', earned: true },
      { id: 'dumbledore', earned: false },
    ]);

    const cardTargets = entries.map(({ __rect }) => __rect);
    expectGenerousDisjointTargets(cardTargets);
    for (const entry of entries) {
      const layout = albumCardLayout(entry);
      expect(layout.card).toEqual(entry.__rect);
      expect(overlaps(layout.portrait, layout.nameplate)).toBe(false);
      for (const control of [
        UI_RECTS.satchelMapTab,
        UI_RECTS.satchelCardsTab,
        UI_RECTS.satchelKeyhole,
        UI_RECTS.close,
      ]) {
        expect(overlaps(layout.card, control)).toBe(false);
      }
    }
  });

  it('renders earned and closed-pocket states as deterministic, visibly different materials', () => {
    vi.stubGlobal('Image', class TestImage {});
    const renderer = new UIRenderer({ characterRenderer: {} });
    const [earnedEntry, lockedEntry] = buildCardAlbumEntries(cards, ['morgana']);
    const portrait = loadedImage({ width: 800, height: 1000 });
    renderer.images.set(earnedEntry.portraitAsset, portrait);

    const earned = recordingContext();
    const replayed = recordingContext();
    const locked = recordingContext();
    renderer.drawAlbumCard(earned, earnedEntry);
    renderer.drawAlbumCard(replayed, earnedEntry);
    renderer.drawAlbumCard(locked, lockedEntry);

    expect(earned.calls).toEqual(replayed.calls);
    expect(earned.assignments).toEqual(replayed.assignments);
    expect(earned.texts).toEqual(['Morgana']);
    expect(locked.texts).toEqual([]);
    expect(earned.calls.filter(([name]) => name === 'drawImage')).toHaveLength(1);
    expect(locked.calls.some(([name]) => name === 'drawImage')).toBe(false);
    expect(earned.calls.some(([name]) => name === 'translate' || name === 'scale')).toBe(false);
    expect(locked.calls.some(([name]) => name === 'translate' || name === 'scale')).toBe(false);

    const earnedFills = assignedStyles(earned, 'fillStyle');
    const lockedFills = assignedStyles(locked, 'fillStyle');
    expect(earnedFills).toContain('#704a31');
    expect(earnedFills).toContain('rgba(255,229,159,0.24)');
    expect(earnedFills).toContain('rgba(40,25,34,0.3)');
    expect(lockedFills).toContain('#50445b');
    expect(lockedFills).toContain('#3f354a');
    expect(lockedFills).toContain('#c99d4c');
    expect(lockedFills).not.toContain('#704a31');
    expectOrganicFiniteBalanced(earned, 55);
    expectOrganicFiniteBalanced(locked, 55);
  });

  it('uses an abstract developing wash while an earned portrait image is unavailable', () => {
    const renderer = new UIRenderer({ characterRenderer: {} });
    const [entry] = buildCardAlbumEntries(cards, ['morgana']);
    const context = recordingContext();

    renderer.drawAlbumCard(context, entry);

    expect(context.calls.some(([name]) => name === 'drawImage')).toBe(false);
    expect(assignedStyles(context, 'fillStyle')).toContain('#746774');
    expect(context.texts).toEqual(['Morgana']);
    expectOrganicFiniteBalanced(context, 65);
  });
});

describe('storybook yearbook', () => {
  const entries = [
    { id: 'first', caption: 'First wand', dataUrl: 'memory:first' },
    { id: 'second', caption: 'New friend', dataUrl: 'memory:second' },
  ];

  it('preserves fixed page-turn hit rectangles and separates every control from content', () => {
    const layout = yearbookLayout(entries.length, 1);
    expect(layout.safeIndex).toBe(1);
    expect(layout.previous).toEqual(UI_RECTS.yearbookPrevious);
    expect(layout.next).toEqual(UI_RECTS.yearbookNext);
    expectGenerousDisjointTargets([layout.previous, layout.next, layout.close]);

    for (const control of [layout.previous, layout.next, layout.close]) {
      expect(overlaps(control, layout.photoMount)).toBe(false);
      expect(overlaps(control, layout.caption)).toBe(false);
      expect(overlaps(control, layout.empty)).toBe(false);
    }
    expect(overlaps(layout.photo, layout.caption)).toBe(false);
  });

  it('draws a deterministic mounted memory, leaf position marks, and labelled page turns', () => {
    vi.stubGlobal('Image', class TestImage {});
    const renderer = new UIRenderer({ characterRenderer: {} });
    const image = loadedImage({ src: entries[0].dataUrl });
    renderer.yearbookImages.set(entries[0].id, image);
    const first = recordingContext();
    const replayed = recordingContext();

    const layout = renderer.drawYearbook(first, entries, 0);
    renderer.drawYearbook(replayed, entries, 0);

    expect(layout).toEqual(yearbookLayout(entries.length, 0));
    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.texts).toEqual(['Violet’s Yearbook', 'First wand', 'Back', 'Next']);
    expect(first.calls.filter(([name]) => name === 'drawImage')).toHaveLength(1);
    // The one transformed vector is the permitted global close control; the
    // memory, frame, page marks, and turn controls add no mascot/icon filler.
    expect(first.calls.filter(([name]) => name === 'translate')).toHaveLength(1);
    expect(first.calls.filter(([name]) => name === 'scale')).toHaveLength(1);
    const fills = assignedStyles(first, 'fillStyle');
    expect(fills).toContain('#63432e');
    expect(fills).toContain('rgba(255,226,153,0.24)');
    expect(fills).toContain('rgba(39,24,31,0.31)');
    expect(fills).toContain('#b7793b');
    expect(fills).toContain('#9b8769');
    expectOrganicFiniteBalanced(first, 125);
  });

  it('clamps the requested page index without changing entry order or captions', () => {
    const renderer = new UIRenderer({ characterRenderer: {} });
    const beforeFirst = recordingContext();
    const afterLast = recordingContext();

    const firstLayout = renderer.drawYearbook(beforeFirst, entries, -8);
    const lastLayout = renderer.drawYearbook(afterLast, entries, 99);

    expect(firstLayout.safeIndex).toBe(0);
    expect(lastLayout.safeIndex).toBe(1);
    expect(beforeFirst.texts).toContain('First wand');
    expect(beforeFirst.texts).not.toContain('New friend');
    expect(afterLast.texts).toContain('New friend');
    expect(afterLast.texts).not.toContain('First wand');
    expectOrganicFiniteBalanced(beforeFirst, 125);
    expectOrganicFiniteBalanced(afterLast, 125);
  });

  it('renders the empty yearbook as a lit paper folio with no filler mascot or helper copy', () => {
    const renderer = new UIRenderer({ characterRenderer: {} });
    const first = recordingContext();
    const replayed = recordingContext();

    expect(renderer.drawYearbook(first, [])).toEqual(yearbookLayout(0, 0));
    renderer.drawYearbook(replayed, []);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.texts).toEqual(['Violet’s Yearbook']);
    expect(first.calls.some(([name]) => name === 'drawImage')).toBe(false);
    expect(first.calls.filter(([name]) => name === 'translate')).toHaveLength(1);
    expect(first.calls.filter(([name]) => name === 'scale')).toHaveLength(1);
    const fills = assignedStyles(first, 'fillStyle');
    expect(fills).toContain('#5c5068');
    expect(fills).toContain('#d9c59b');
    expect(fills).toContain('rgba(255,244,210,0.44)');
    expect(fills).toContain('#714158');
    expectOrganicFiniteBalanced(first, 105);
  });

  it('uses organic multi-tone leaves for page position instead of circular UI dots', () => {
    const first = recordingContext();
    const replayed = recordingContext();

    drawYearbookPageDots(first, 3, 1);
    drawYearbookPageDots(replayed, 3, 1);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(assignedStyles(first, 'fillStyle')).toEqual([
      '#9b8769',
      'rgba(242,214,151,0.22)',
      '#b7793b',
      'rgba(255,231,163,0.48)',
      '#9b8769',
      'rgba(242,214,151,0.22)',
    ]);
    expectOrganicFiniteBalanced(first, 11);
  });
});
