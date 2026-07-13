import { describe, expect, it } from 'vitest';
import {
  WorldAffordanceRenderer,
  worldAffordanceState,
} from '../src/game/render/WorldAffordanceRenderer.js';
import { hudGoldenThreadPresentation } from '../src/game/render/UIRenderer.js';

function wandTarget(salience) {
  return Object.freeze({
    id: 'ollivanders.wand1',
    semanticId: 'wand.first',
    kind: 'action',
    hitArea: { shape: 'circle', x: 690, y: 345, radius: 75 },
    presentation: { icon: 'wand', glow: 'objective' },
    salience,
  });
}

function recordingContext() {
  const calls = [];
  let depth = 0;
  const methods = new Set([
    'beginPath', 'closePath', 'fill', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo',
    'restore', 'rotate', 'save', 'setLineDash', 'stroke', 'translate',
  ]);
  const target = { calls, globalAlpha: 1, get depth() { return depth; } };
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
      object[property] = value;
      return true;
    },
  });
}

describe('world interaction salience rendering', () => {
  it('renders the one golden thread deterministically and only strengthens that thread for hints', () => {
    const normalTarget = wandTarget({ tier: 'thread', visible: 'thread', intensity: 'normal', glint: null });
    const hintTarget = wandTarget({ tier: 'thread', visible: 'thread', intensity: 'hint', glint: null });
    const normal = worldAffordanceState(normalTarget, 3.25);
    const replayed = worldAffordanceState(normalTarget, 3.25);
    const hinted = worldAffordanceState(hintTarget, 3.25);

    expect(normal).toEqual(replayed);
    expect(normal).toMatchObject({ kind: 'gold-shimmer', intensity: 'normal' });
    expect(normal.bounds).toMatchObject({ shape: 'wand' });
    expect(normal.bounds.width).toBeGreaterThan(normal.bounds.height * 5);
    expect(normal.motes).toHaveLength(2);
    expect(hinted).toMatchObject({ kind: 'gold-shimmer', intensity: 'hint' });
    expect(hinted.motes).toHaveLength(3);
    expect(hinted.haloAlpha).toBeGreaterThan(normal.haloAlpha);
  });

  it('renders no advertisement for a quiet or spent target', () => {
    expect(worldAffordanceState(wandTarget({
      tier: 'thread', visible: 'none', intensity: 'normal', glint: null,
    }), 2)).toBeNull();
    expect(worldAffordanceState(wandTarget({
      tier: 'none', visible: 'none', intensity: 'quiet', glint: null,
    }), 2)).toBeNull();
    expect(worldAffordanceState(wandTarget({
      tier: 'discoverable', visible: 'none', intensity: 'quiet', glint: null,
    }), 2, {
      pressedTargetId: 'ollivanders.wand1',
      quiet: true,
    })).toBeNull();

    const renderer = new WorldAffordanceRenderer();
    const context = recordingContext();
    renderer.draw(context, {
      affordances: { quiet: true },
      targets: [wandTarget({
        tier: 'discoverable', visible: 'none', intensity: 'quiet', glint: null,
      })],
    }, 2, { pressedTargetId: 'ollivanders.wand1' });
    expect(context.calls).toEqual([]);
  });

  it('carries the active HUD thread onto the satchel and silences it while walking', () => {
    const active = {
      affordances: {
        quiet: false,
        thread: { targetId: 'hud.satchel', channel: 'hud', intensity: 'normal' },
      },
    };
    expect(hudGoldenThreadPresentation(active, 1.5)).toMatchObject({
      kind: 'gold-shimmer',
      intensity: 'normal',
    });
    expect(hudGoldenThreadPresentation({
      affordances: { ...active.affordances, quiet: true },
    }, 1.5)).toBeNull();
    expect(hudGoldenThreadPresentation({
      affordances: {
        quiet: false,
        thread: { targetId: 'hud.quest', channel: 'hud', intensity: 'normal' },
      },
    }, 1.5)).toBeNull();
  });

  it('keeps reduced-motion thread motes still while the full-motion motes orbit slowly', () => {
    const target = wandTarget({ tier: 'thread', visible: 'thread', intensity: 'normal', glint: null });
    const reducedStart = worldAffordanceState(target, 0, { reducedMotion: true });
    const reducedLater = worldAffordanceState(target, 5, { reducedMotion: true });
    const fullStart = worldAffordanceState(target, 0);
    const fullLater = worldAffordanceState(target, 5);

    expect(reducedLater.motes).toEqual(reducedStart.motes);
    expect(reducedLater.haloAlpha).toBe(reducedStart.haloAlpha);
    expect(fullLater.motes).not.toEqual(fullStart.motes);
  });

  it('lights a discoverable only while its scheduled glint or press feedback is active', () => {
    const glintTarget = wandTarget({
      tier: 'discoverable',
      visible: 'glint',
      intensity: 'quiet',
      glint: { targetId: 'ollivanders.wand1', tier: 'discoverable', progress: 0.5, alpha: 0.58 },
    });
    const quietTarget = wandTarget({ tier: 'discoverable', visible: 'none', intensity: 'quiet', glint: null });

    expect(worldAffordanceState(glintTarget, 1)).toMatchObject({
      kind: 'glint', tier: 'discoverable', alpha: 0.58,
    });
    expect(worldAffordanceState(quietTarget, 1)).toBeNull();
    expect(worldAffordanceState(quietTarget, 1, { pressedTargetId: 'ollivanders.wand1' })).toMatchObject({
      kind: 'gold-shimmer', intensity: 'press',
    });
  });

  it('draws painted washes and glints without dashed rings, glyph badges, or leaked canvas state', () => {
    const renderer = new WorldAffordanceRenderer();
    const context = recordingContext();
    renderer.draw(context, {
      cameraX: 0,
      targets: [
        wandTarget({ tier: 'thread', visible: 'thread', intensity: 'normal', glint: null }),
        {
          id: 'ollivanders.cardMorgana',
          kind: 'collectible',
          hitArea: { shape: 'circle', x: 1060, y: 170, radius: 60 },
          presentation: { icon: 'frog-card', glow: 'hidden' },
          salience: {
            tier: 'secret', visible: 'glint', intensity: 'quiet',
            glint: { targetId: 'ollivanders.cardMorgana', tier: 'secret', progress: 0.5, alpha: 0.34 },
          },
        },
      ],
    }, 1);

    expect(context.calls.filter(([name]) => name === 'fill').length).toBeGreaterThan(10);
    expect(context.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThanOrEqual(3);
    expect(context.calls.some(([name]) => name === 'setLineDash')).toBe(false);
    expect(context.calls.some(([name]) => name === 'fillText')).toBe(false);
    expect(context.depth).toBe(0);
  });
});
