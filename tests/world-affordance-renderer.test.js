import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
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
  const paints = [];
  const effects = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'closePath', 'ellipse', 'fill', 'fillText',
    'lineTo', 'moveTo', 'quadraticCurveTo', 'rect', 'restore', 'rotate', 'roundRect',
    'save', 'setLineDash', 'stroke', 'translate',
  ]);
  const target = { calls, paints, effects, globalAlpha: 1, get depth() { return depth; } };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => {
          calls.push([property, ...args]);
          if (property === 'fill' || property === 'stroke') {
            paints.push({
              method: property,
              alpha: object.globalAlpha,
              fillStyle: object.fillStyle,
              strokeStyle: object.strokeStyle,
              lineWidth: object.lineWidth,
            });
          }
          if (property === 'save') depth += 1;
          if (property === 'restore') depth -= 1;
        };
      }
      return object[property];
    },
    set(object, property, value) {
      object[property] = value;
      if (['filter', 'globalCompositeOperation', 'shadowBlur'].includes(property)) {
        effects.push([property, value]);
      }
      return true;
    },
  });
}

function guideTarget(salience) {
  return Object.freeze({
    id: 'bedroom.guide',
    kind: 'talk',
    hitArea: { shape: 'circle', x: 250, y: 455, radius: 95 },
    presentation: { icon: 'talk', glow: 'objective' },
    salience,
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

    renderer.draw(context, {
      affordances: { quiet: false, worldSuppressed: true },
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
      affordances: { ...active.affordances, worldSuppressed: true },
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

  it('draws contour shimmer and glints without dashed rings, glyph badges, or leaked canvas state', () => {
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

    expect(context.calls.filter(([name]) => name === 'fill')).toHaveLength(7);
    expect(context.calls.filter(([name]) => name === 'stroke').length).toBeGreaterThanOrEqual(6);
    expect(context.calls.some(([name]) => name === 'setLineDash')).toBe(false);
    expect(context.calls.some(([name]) => name === 'fillText')).toBe(false);
    expect(context.depth).toBe(0);
  });

  it('keeps Hagrid free of interior gold washes while preserving organic halo contours and motes', () => {
    const renderer = new WorldAffordanceRenderer();
    const context = recordingContext();
    const target = guideTarget({
      tier: 'thread', visible: 'thread', intensity: 'normal', glint: null,
    });
    const presentation = worldAffordanceState(target, 2.5);

    renderer.draw(context, {
      cameraX: 0,
      targets: [target],
      affordances: { quiet: false, worldSuppressed: false },
    }, 2.5);

    expect(presentation.bounds).toEqual({
      shape: 'guide', x: 131.25, y: 293.5, width: 237.5, height: 361,
    });
    expect(presentation.motes).toHaveLength(2);
    expect(context.paints.map(({ method }) => method)).toEqual([
      'stroke', 'stroke', 'stroke', 'stroke',
      'fill', 'fill', 'fill', 'fill', 'fill', 'fill',
    ]);
    expect(context.paints.every(({ alpha }) => alpha > 0 && alpha < 1)).toBe(true);
    expect(context.calls.filter(([name]) => name === 'translate')).toEqual(
      presentation.motes.map((mote) => ['translate', mote.x, mote.y]),
    );

    const curveCalls = context.calls.filter(([name]) => (
      name === 'bezierCurveTo' || name === 'quadraticCurveTo'
    ));
    expect(curveCalls.length).toBeGreaterThan(12);
    expect(curveCalls.every(([, ...values]) => values.every(Number.isFinite))).toBe(true);
    expect(context.calls.some(([name]) => (
      name === 'arc' || name === 'ellipse' || name === 'rect' || name === 'roundRect'
    ))).toBe(false);
    expect(context.calls.some(([name]) => name === 'setLineDash')).toBe(false);
    expect(context.effects).toEqual([]);
    expect(context.depth).toBe(0);
  });

  it('composites world shimmer before actors so figure bodies mask the contour interior', () => {
    const order = [];
    const state = {
      roomId: 'ch1.bedroom',
      cameraX: 0,
      setPiece: null,
      occupants: [],
      player: { x: 500, y: 610 },
      pet: null,
      targets: [],
      overlay: null,
      dialogue: null,
      screen: 'playing',
    };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      world: { chapter: { id: 'ch1' }, room: {}, flags: {}, snapshot: () => state },
      simTime: 0,
      reducedMotion: false,
      roomRenderer: { draw: vi.fn(() => order.push('room')) },
      worldPropRenderer: { draw: vi.fn(() => order.push('props')) },
      guideFootprintRenderer: { draw: vi.fn(() => order.push('footprints')) },
      setPieceRenderer: { draw: vi.fn(() => order.push('set-piece')) },
      drawWorldTargets: vi.fn(() => order.push('affordances')),
      drawCharacters: vi.fn(() => order.push('actors')),
      particles: { draw: vi.fn(() => order.push('particles')) },
      uiRenderer: { drawHud: vi.fn(() => order.push('hud')) },
      resumeRecap: null,
      saveData: { settings: { muted: true } },
      roomTransition: null,
      transitionAlpha: 0,
    });
    game.shouldShowReplayExit = () => false;

    game.renderWorld({});

    expect(order.indexOf('affordances')).toBeGreaterThan(order.indexOf('props'));
    expect(order.indexOf('affordances')).toBeLessThan(order.indexOf('actors'));
  });
});
