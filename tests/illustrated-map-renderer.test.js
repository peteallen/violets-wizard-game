import { describe, expect, it } from 'vitest';
import { chapter1Map } from '../src/game/content/chapters/ch1.js';
import { buildMapState, MAP_FOG_STATES } from '../src/game/core/MapState.js';
import {
  createIllustratedMapPresentation,
  ILLUSTRATED_MAP_PAINTED_ASSET_STATUS,
  ILLUSTRATED_MAP_RENDERER_STATUS,
  IllustratedMapRenderer,
  sampleQuillRouteMarks,
} from '../src/game/render/IllustratedMapRenderer.js';

function recordingContext() {
  const calls = [];
  const assignments = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
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

function mapSnapshot({
  hotspot = 'street.malkinsDoor',
  room = 'ch1.diagonStreet',
  unlockedRooms = ['ch1.diagonStreet', 'ch1.ollivanders'],
} = {}) {
  return {
    roomId: 'ch1.diagonStreet',
    unlockedRooms,
    objective: { mapStar: { room, hotspot } },
  };
}

function worldSnapshot({
  mapTargetId = 'street.malkinsDoor',
  intensity = 'normal',
  quiet = false,
  worldSuppressed = true,
} = {}) {
  return {
    overlay: { surface: 'satchel', tab: 'map' },
    affordances: {
      quiet,
      worldSuppressed,
      thread: {
        targetId: 'hud.satchel',
        worldTargetId: null,
        mapTargetId,
        channel: 'hud',
        intensity,
      },
    },
  };
}

describe('code-only illustrated map renderer foundation', () => {
  it('builds a deterministic frozen presentation and stable hit targets without snapshot mutation', () => {
    const snapshot = mapSnapshot();
    const originalSnapshot = structuredClone(snapshot);
    const model = buildMapState(chapter1Map, snapshot);
    const replayedModel = buildMapState(chapter1Map, snapshot);
    const state = worldSnapshot();
    const originalState = structuredClone(state);

    const first = createIllustratedMapPresentation(model, state, 3.25);
    const replayed = createIllustratedMapPresentation(model, state, 3.25);

    expect(ILLUSTRATED_MAP_RENDERER_STATUS).toBe('code-only-integrated');
    expect(ILLUSTRATED_MAP_PAINTED_ASSET_STATUS).toBe('paused-for-pete-review');
    expect(first).toEqual(replayed);
    expect(first.kind).toBe('code-only-integrated');
    expect(first.paintedAssetStatus).toBe('paused-for-pete-review');
    expect(first.locations).toHaveLength(chapter1Map.locations.length);
    expect(first.routes).toHaveLength(chapter1Map.routes.length);
    expect(new Set(first.locations.map(({ kind }) => kind))).toEqual(
      new Set(['street', 'wand-shop', 'robes-shop', 'pet-shop']),
    );
    expect(first.hitTargets).toHaveLength(first.locations.length);
    for (const target of first.hitTargets) {
      const location = first.locations.find(({ id }) => id === target.id);
      expect(target.hitArea).toEqual({ shape: 'rect', ...location.vignette });
      expect(target.enabled).toBe(location.unlocked);
      expect(target.travelIntent).toEqual(location.travelIntent);
      expect(Object.isFrozen(target)).toBe(true);
      expect(Object.isFrozen(target.hitArea)).toBe(true);
    }
    expect(first.locations
      .filter(({ fogState }) => fogState === MAP_FOG_STATES.soft)
      .every(({ fogWisps }) => fogWisps.length === 4)).toBe(true);
    expect(first.locations
      .filter(({ fogState }) => fogState === MAP_FOG_STATES.clear)
      .every(({ fogWisps }) => fogWisps.length === 0)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.locations)).toBe(true);
    expect(Object.isFrozen(first.routes[0].points)).toBe(true);
    expect(snapshot).toEqual(originalSnapshot);
    expect(state).toEqual(originalState);
    expect(model).toEqual(replayedModel);
  });

  it('uses the exact D31 map target and intensity on an explicitly active map surface', () => {
    const model = buildMapState(chapter1Map, mapSnapshot());
    const state = worldSnapshot({ intensity: 'hint' });
    const presentation = createIllustratedMapPresentation(model, state, 4.5);

    expect(state.affordances).toMatchObject({ quiet: false, worldSuppressed: true });

    expect(presentation.objective).toMatchObject({
      targetId: 'street.malkinsDoor',
      locationId: 'map.ch1.malkins',
      target: {
        id: 'street.malkinsDoor',
        salience: { tier: 'thread', visible: 'thread', intensity: 'hint' },
      },
      affordance: { kind: 'gold-shimmer', intensity: 'hint' },
    });
    expect(presentation.objective.affordance.motes).toHaveLength(6);

    const noMapThread = createIllustratedMapPresentation(
      model,
      worldSnapshot({ mapTargetId: null }),
      4.5,
    );
    expect(model.objectiveLocationId).toBe('map.ch1.malkins');
    expect(noMapThread.objective).toBeNull();

    const unknownMapThread = createIllustratedMapPresentation(
      model,
      worldSnapshot({ mapTargetId: 'street.notTheObjective' }),
      4.5,
    );
    expect(unknownMapThread.objective).toBeNull();

    const d31Quiet = createIllustratedMapPresentation(
      model,
      worldSnapshot({ quiet: true }),
      4.5,
    );
    expect(d31Quiet.objective).toBeNull();

    const callerQuiet = createIllustratedMapPresentation(model, state, 4.5, { quiet: true });
    expect(callerQuiet.objective).toBeNull();
  });

  it('keeps reduced-motion D31 shimmer stable while full motion uses the shared time-based treatment', () => {
    const model = buildMapState(chapter1Map, mapSnapshot());
    const state = worldSnapshot();
    const reducedStart = createIllustratedMapPresentation(model, state, 0, { reducedMotion: true });
    const reducedLater = createIllustratedMapPresentation(model, state, 9, { reducedMotion: true });
    const fullStart = createIllustratedMapPresentation(model, state, 0);
    const fullLater = createIllustratedMapPresentation(model, state, 9);

    expect(reducedLater.objective.affordance).toEqual(reducedStart.objective.affordance);
    expect(fullLater.objective.affordance).not.toEqual(fullStart.objective.affordance);
  });

  it('samples deterministic, finite, individually shaped quill marks along authored routes', () => {
    const points = [
      { x: 110, y: 430 },
      { x: 330, y: 292 },
      { x: 594, y: 412 },
    ];
    const first = sampleQuillRouteMarks(points, 0.37);
    const replayed = sampleQuillRouteMarks(points, 0.37);
    const sanitized = sampleQuillRouteMarks(points, Number.NaN);

    expect(first).toEqual(replayed);
    expect(first.length).toBeGreaterThan(16);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.every(Object.isFrozen)).toBe(true);
    expect(first.every((mark) => Object.values(mark).every(Number.isFinite))).toBe(true);
    expect(sanitized.every((mark) => Object.values(mark).every(Number.isFinite))).toBe(true);
    expect(sampleQuillRouteMarks([], 0.4)).toEqual([]);
    expect(sampleQuillRouteMarks([{ x: 40, y: 40 }, { x: 40, y: 40 }], 0.4)).toEqual([]);
    expect(new Set(first.map(({ length }) => length)).size).toBeGreaterThan(6);
    expect(new Set(first.map(({ width }) => width)).size).toBeGreaterThan(6);

    const veryShort = sampleQuillRouteMarks([{ x: 0, y: 0 }, { x: 2, y: 0 }], 0.2);
    expect(veryShort).toHaveLength(1);
    expect(veryShort[0].length).toBeLessThan(2.5);

    const halfPoints = points.map(({ x, y }) => ({ x: x * 0.5, y: y * 0.5 }));
    const halfScale = sampleQuillRouteMarks(halfPoints, 0.37, { scale: 0.5 });
    expect(Math.abs(halfScale.length - first.length)).toBeLessThanOrEqual(1);
    expect(halfScale[0].length).toBeCloseTo(first[0].length * 0.5);
    expect(halfScale[0].width).toBeCloseTo(first[0].width * 0.5);
  });

  it('draws organic multi-tone vignettes, dotted quill routes, and warm fog without geometry badges', () => {
    const lockedModel = buildMapState(chapter1Map, mapSnapshot());
    const unlockedModel = buildMapState(chapter1Map, mapSnapshot({
      unlockedRooms: chapter1Map.locations.map(({ to }) => to.room),
    }));
    const state = worldSnapshot();
    const lockedContext = recordingContext();
    const replayedContext = recordingContext();
    const unlockedContext = recordingContext();
    const renderer = new IllustratedMapRenderer();

    const lockedPresentation = renderer.draw(lockedContext, lockedModel, state, 2.75);
    renderer.draw(replayedContext, lockedModel, state, 2.75);
    renderer.draw(unlockedContext, unlockedModel, state, 2.75);

    expect(lockedContext.calls).toEqual(replayedContext.calls);
    expect(lockedContext.assignments).toEqual(replayedContext.assignments);
    expect(lockedPresentation.hitTargets).toHaveLength(4);
    expect(lockedContext.calls.filter(([name]) => name === 'fill').length).toBeGreaterThan(45);
    expect(lockedContext.calls.filter(([name]) => name === 'quadraticCurveTo').length)
      .toBeGreaterThan(120);
    expect(lockedContext.calls.some(([name]) => name === 'bezierCurveTo')).toBe(true);
    expect(lockedContext.calls.filter(([name]) => name === 'translate').length).toBeGreaterThan(35);
    expect(lockedContext.calls.filter(([name]) => name === 'rotate').length).toBeGreaterThan(35);
    expect(lockedContext.calls.filter(([name]) => name === 'fill').length)
      .toBeGreaterThan(unlockedContext.calls.filter(([name]) => name === 'fill').length);

    const forbidden = new Set([
      'arc', 'ellipse', 'fillRect', 'fillText', 'rect', 'roundRect', 'setLineDash', 'strokeRect',
    ]);
    expect(lockedContext.calls.some(([name]) => forbidden.has(name))).toBe(false);
    expect(lockedContext.calls
      .flatMap(([, ...args]) => args)
      .filter((value) => typeof value === 'number')
      .every(Number.isFinite)).toBe(true);
    expect(lockedContext.depth).toBe(0);
    expect(replayedContext.depth).toBe(0);
    expect(unlockedContext.depth).toBe(0);
  });

  it('scales authored hit layouts without changing their identity or travel intent', () => {
    const model = buildMapState(chapter1Map, mapSnapshot());
    const full = createIllustratedMapPresentation(model, worldSnapshot(), 1);
    const inset = createIllustratedMapPresentation(model, worldSnapshot(), 1, {
      frame: { x: 64, y: 36, width: 640, height: 360 },
    });

    expect(full.routes.every(({ markScale }) => markScale === 1)).toBe(true);
    expect(inset.routes.every(({ markScale }) => markScale === 0.5)).toBe(true);

    for (let index = 0; index < full.hitTargets.length; index += 1) {
      const original = full.hitTargets[index];
      const scaled = inset.hitTargets[index];
      expect(scaled.id).toBe(original.id);
      expect(scaled.enabled).toBe(original.enabled);
      expect(scaled.travelIntent).toEqual(original.travelIntent);
      expect(scaled.hitArea.x).toBeCloseTo(64 + original.hitArea.x * 0.5);
      expect(scaled.hitArea.y).toBeCloseTo(36 + original.hitArea.y * 0.5);
      expect(scaled.hitArea.width).toBeCloseTo(original.hitArea.width * 0.5);
      expect(scaled.hitArea.height).toBeCloseTo(original.hitArea.height * 0.5);
    }
  });
});
