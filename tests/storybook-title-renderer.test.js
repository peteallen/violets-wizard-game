import { describe, expect, it } from 'vitest';
import {
  createStorybookTitlePresentation,
  drawStorybookTitlePresentation,
  STORYBOOK_TITLE_MAJOR_REGIONS,
  STORYBOOK_TITLE_PAINTED_ASSET_STATUS,
  STORYBOOK_TITLE_RENDERER_STATUS,
  StorybookTitleRenderer,
} from '../src/game/render/StorybookTitleRenderer.js';
import {
  titleForegroundLayout,
  UIRenderer,
} from '../src/game/render/UIRenderer.js';

function recordingContext() {
  const calls = [];
  const assignments = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore',
    'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'stroke', 'strokeRect',
    'strokeText', 'translate',
  ]);
  const target = {
    assignments,
    calls,
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createLinearGradient') {
        return (...args) => {
          calls.push(['createLinearGradient', ...args]);
          return {
            addColorStop: (...stopArgs) => calls.push(['addColorStop', ...stopArgs]),
          };
        };
      }
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

function numericArgumentsAreFinite(calls) {
  return calls
    .flatMap(([, ...args]) => args)
    .filter((value) => typeof value === 'number')
    .every(Number.isFinite);
}

function collectNumbers(value, numbers = []) {
  if (typeof value === 'number') numbers.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectNumbers(item, numbers));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectNumbers(item, numbers));
  }
  return numbers;
}

function overlaps(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

describe('code-only storybook title illustration', () => {
  it('publishes a deterministic frozen scene with clear masthead and envelope regions', () => {
    const first = createStorybookTitlePresentation(3.75);
    const replayed = createStorybookTitlePresentation(3.75);

    expect(STORYBOOK_TITLE_RENDERER_STATUS).toBe('code-only-integrated');
    expect(STORYBOOK_TITLE_PAINTED_ASSET_STATUS).toBe('paused-for-pete-review');
    expect(first).toEqual(replayed);
    expect(first.kind).toBe('code-only-integrated');
    expect(first.paintedAssetStatus).toBe('paused-for-pete-review');
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.stars)).toBe(true);
    expect(first.stars.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(first.hero)).toBe(true);
    expect(Object.isFrozen(first.hero.violet)).toBe(true);
    expect(Object.isFrozen(first.hero.owl)).toBe(true);
    expect(first.hero.violet).toMatchObject({
      characterId: 'character.violet',
      surface: 'world',
      appearance: 'casual',
      facing: 'left',
      pose: 'wonder',
      wand: false,
    });
    expect(first.hero.violet).not.toHaveProperty('kind');
    expect(first.hero.violet).not.toHaveProperty('outfit');
    expect(first.hero.violet).not.toHaveProperty('robeTrim');
    expect(first.hero.owl).toMatchObject({
      characterId: 'character.post-owl',
      surface: 'world',
      appearance: 'post',
      pose: 'perch',
      facing: 'left',
    });
    expect(first.hero.owl).not.toHaveProperty('variant');
    expect(overlaps(first.hero.bounds, first.safeAreas.masthead)).toBe(false);
    expect(overlaps(first.hero.bounds, first.safeAreas.envelope)).toBe(false);
    const action = titleForegroundLayout(first).action;
    expect(action).toMatchObject({
      x: 420,
      y: 340,
      width: 440,
    });
    expect(action.height).toBeCloseTo(244);
    expect(collectNumbers(first).every(Number.isFinite)).toBe(true);

    expect(STORYBOOK_TITLE_MAJOR_REGIONS.map(({ id }) => id)).toEqual([
      'sky', 'moon', 'castle', 'lake', 'mist', 'shore',
    ]);
    for (const majorRegion of STORYBOOK_TITLE_MAJOR_REGIONS) {
      expect(Object.keys(majorRegion.tones)).toEqual(['base', 'shadow', 'highlight']);
      expect(Object.values(majorRegion.tones).every(Boolean)).toBe(true);
      expect(Object.values(majorRegion.tones)).not.toContain('#000');
      expect(Object.values(majorRegion.tones)).not.toContain('#fff');
    }
  });

  it('scales the two integration-safe regions while preserving the authored scene', () => {
    const full = createStorybookTitlePresentation(1);
    const inset = createStorybookTitlePresentation(1, {
      frame: { x: 64, y: 36, width: 640, height: 360 },
    });

    expect(inset.safeAreas.masthead.x).toBeCloseTo(64 + full.safeAreas.masthead.x * 0.5);
    expect(inset.safeAreas.masthead.y).toBeCloseTo(36 + full.safeAreas.masthead.y * 0.5);
    expect(inset.safeAreas.masthead.width).toBeCloseTo(full.safeAreas.masthead.width * 0.5);
    expect(inset.safeAreas.envelope.height).toBeCloseTo(full.safeAreas.envelope.height * 0.5);
    expect(inset.hero).toEqual(full.hero);

    expect(() => createStorybookTitlePresentation(0, {
      frame: { x: 0, y: 0, width: 0, height: 720 },
    })).toThrow(TypeError);
  });

  it('freezes all ambient motion for reduced motion while retaining deterministic full motion', () => {
    const reducedStart = createStorybookTitlePresentation(0, { reducedMotion: true });
    const reducedLater = createStorybookTitlePresentation(19, { reducedMotion: true });
    const fullStart = createStorybookTitlePresentation(0);
    const fullLater = createStorybookTitlePresentation(19);

    expect(reducedLater).toEqual(reducedStart);
    expect(fullLater).not.toEqual(fullStart);
    expect(createStorybookTitlePresentation(Number.NaN)).toEqual(fullStart);
    expect(createStorybookTitlePresentation(Number.POSITIVE_INFINITY)).toEqual(fullStart);
  });

  it('draws the authored scene with finite balanced organic geometry and no geometric shortcuts', () => {
    const actorCalls = [];
    const collaborators = {
      characterRenderer: {
        draw: (_context, character, time) => actorCalls.push([
          character.characterId,
          character.surface,
          character,
          time,
        ]),
      },
    };
    const first = recordingContext();
    const replayed = recordingContext();
    const renderer = new StorybookTitleRenderer(collaborators);

    const presentation = renderer.draw(first, 2.75);
    renderer.draw(replayed, 2.75);

    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(actorCalls.map(([characterId, surface]) => [characterId, surface])).toEqual([
      ['character.violet', 'world'],
      ['character.post-owl', 'world'],
      ['character.violet', 'world'],
      ['character.post-owl', 'world'],
    ]);
    expect(actorCalls[0][2]).toBe(presentation.hero.violet);
    expect(actorCalls[1][2]).toBe(presentation.hero.owl);
    expect(actorCalls[0][3]).toBe(presentation.sceneTime);
    expect(actorCalls[1][3]).toBe(presentation.sceneTime);

    expect(first.calls.filter(([name]) => name === 'fill').length).toBeGreaterThan(115);
    expect(first.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThan(25);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(175);
    expect(first.calls.filter(([name]) => name === 'quadraticCurveTo').length).toBeGreaterThan(250);
    expect(first.calls.filter(([name]) => name === 'lineTo')).toHaveLength(0);

    const forbidden = new Set([
      'arc', 'ellipse', 'fillRect', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
    ]);
    expect(first.calls.some(([name]) => forbidden.has(name))).toBe(false);
    expect(numericArgumentsAreFinite(first.calls)).toBe(true);
    expect(first.depth).toBe(0);
    expect(replayed.depth).toBe(0);

    const pureExtremes = new Set(['#000', '#000000', '#fff', '#ffffff']);
    expect(first.assignments
      .filter(([property]) => property === 'fillStyle' || property === 'strokeStyle')
      .some(([, value]) => pureExtremes.has(String(value).toLowerCase()))).toBe(false);
  });

  it('requires the generic character boundary instead of silently constructing a concrete renderer', () => {
    expect(() => new StorybookTitleRenderer()).toThrow(/injected character renderer/);
    expect(() => drawStorybookTitlePresentation(
      recordingContext(),
      createStorybookTitlePresentation(4.25),
    )).toThrow(/injected character renderer/);
  });

  it('rejects a non-title presentation before touching the canvas', () => {
    const context = recordingContext();
    expect(() => drawStorybookTitlePresentation(context, { kind: 'other' })).toThrow(TypeError);
    expect(context.calls).toEqual([]);
    expect(context.depth).toBe(0);
  });

  it('integrates the illustration with safe-area foregrounds and deterministic reduced motion', () => {
    const presentation = Object.freeze({
      safeAreas: Object.freeze({
        masthead: Object.freeze({ x: 100, y: 20, width: 325, height: 122 }),
        envelope: Object.freeze({ x: 200, y: 300, width: 275, height: 98 }),
      }),
    });
    const titleDraws = [];
    const titleRenderer = {
      draw: (_context, time, options) => {
        titleDraws.push({ time, options });
        return presentation;
      },
    };
    const renderer = new UIRenderer({
      characterRenderer: { draw: () => {} },
      titleRenderer,
    });
    const first = recordingContext();
    const replayed = recordingContext();

    expect(renderer.drawTitle(first, 17, false, true)).toBe(presentation);
    expect(renderer.drawTitle(replayed, 0, false, true)).toBe(presentation);

    expect(titleDraws).toEqual([
      { time: 0, options: { reducedMotion: true } },
      { time: 0, options: { reducedMotion: true } },
    ]);
    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
    expect(first.assignments.some(([property]) => property === 'shadowBlur' || property === 'filter')).toBe(false);
    expect(first.calls.some(([name]) => [
      'arc', 'ellipse', 'lineTo', 'rect', 'roundRect', 'setLineDash',
      'createLinearGradient', 'createRadialGradient',
    ].includes(name))).toBe(false);
    expect(first.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(35);
    expect(titleForegroundLayout(presentation)).toEqual({
      masthead: presentation.safeAreas.masthead,
      action: {
        x: 200,
        y: 300,
        width: 275,
        height: 98,
      },
    });

    const visibleText = [...new Set(first.calls
      .filter(([name]) => name === 'fillText')
      .map(([, value]) => value))];
    expect(visibleText).toEqual(['Violet', 'at Hogwarts', 'Open Violet’s letter']);
    expect(first.calls).toContainEqual(['fillText', 'Violet', 262.5, 85.5]);
    expect(first.calls).toContainEqual(['fillText', 'at Hogwarts', 262.5, 123]);
    const actionTextCall = first.calls.find(
      ([name, value]) => name === 'fillText' && value === 'Open Violet’s letter',
    );
    expect(actionTextCall[2]).toBeGreaterThan(presentation.safeAreas.envelope.x);
    expect(actionTextCall[2]).toBeLessThan(
      presentation.safeAreas.envelope.x + presentation.safeAreas.envelope.width,
    );
    expect(actionTextCall[3]).toBeGreaterThan(presentation.safeAreas.envelope.y);
    expect(actionTextCall[3]).toBeLessThan(
      presentation.safeAreas.envelope.y + presentation.safeAreas.envelope.height,
    );

    const storedSave = recordingContext();
    renderer.drawTitle(storedSave, 28, true, true);
    expect([...new Set(storedSave.calls
      .filter(([name]) => name === 'fillText')
      .map(([, value]) => value))]).toEqual([
      'Violet',
      'at Hogwarts',
      'Return to Hogwarts',
    ]);
    expect(titleDraws.at(-1)).toEqual({ time: 0, options: { reducedMotion: true } });
  });
});
