import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { chapter1 } from '../src/game/content/chapters/ch1.js';
import { envelopeWorldBounds } from '../src/game/render/LetterRenderer.js';
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
    hitArea: { shape: 'circle', x: 535, y: 382, radius: 90 },
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
    expect(normal.bounds).toMatchObject({ shape: 'wand-case' });
    expect(normal.bounds.width).toBeGreaterThan(normal.bounds.height * 2.7);
    expect(normal.bounds.width).toBeLessThan(normal.bounds.height * 3);
    expect(normal.motes).toHaveLength(4);
    expect(hinted).toMatchObject({ kind: 'gold-shimmer', intensity: 'hint' });
    expect(hinted.motes).toHaveLength(7);
    expect(new Set(hinted.motes.map(({ shape }) => shape))).toEqual(new Set([
      'dust', 'spark', 'dash',
    ]));
    expect(hinted.haloAlpha).toBeGreaterThan(normal.haloAlpha);
  });

  it('centers every Ollivanders wand target and case shimmer on the painted displays', () => {
    const wands = chapter1.rooms['ch1.ollivanders'].hotspots
      .filter(({ id }) => id.startsWith('ollivanders.wand'));
    expect(wands.map(({ hitArea }) => ({
      x: hitArea.x, y: hitArea.y, radius: hitArea.radius,
    }))).toEqual([
      { x: 535, y: 382, radius: 90 },
      { x: 782, y: 382, radius: 90 },
      { x: 1054, y: 382, radius: 100 },
    ]);

    for (const target of wands) {
      const presentation = worldAffordanceState({
        ...target,
        salience: { tier: 'thread', visible: 'thread', intensity: 'hint', glint: null },
      }, 1.25);
      expect(presentation.bounds.shape).toBe('wand-case');
      expect(presentation.bounds.x + presentation.bounds.width / 2).toBe(target.hitArea.x);
      expect(presentation.bounds.y + presentation.bounds.height / 2).toBe(target.hitArea.y);
      expect(presentation.bounds.width).toBeGreaterThanOrEqual(176);
      expect(presentation.bounds.width / presentation.bounds.height).toBeGreaterThan(2.7);
      expect(presentation.bounds.width / presentation.bounds.height).toBeLessThan(3);
    }
  });

  it('keeps Chapter One object hints on their painted envelope, wall, stool, and doors', () => {
    const thread = { tier: 'thread', visible: 'thread', intensity: 'hint', glint: null };
    const presentationFor = (target) => worldAffordanceState({ ...target, salience: thread }, 1.25);

    const letter = chapter1.rooms['ch1.bedroom'].hotspots.find(({ id }) => id === 'bedroom.letter');
    const letterBounds = presentationFor(letter).bounds;
    const envelopeBounds = envelopeWorldBounds();
    expect(Math.abs(letterBounds.x - envelopeBounds.x)).toBeLessThan(2);
    expect(Math.abs(letterBounds.y - envelopeBounds.y)).toBeLessThan(2);
    expect(Math.abs(letterBounds.width - envelopeBounds.width)).toBeLessThan(2);
    expect(Math.abs(letterBounds.height - envelopeBounds.height)).toBeLessThan(2);

    const wall = chapter1.rooms['ch1.courtyard'].hotspots.find(({ id }) => id === 'courtyard.brickWall');
    expect(wall.hitArea).toMatchObject({ x: 700, y: 330, radius: 180 });
    expect(presentationFor(wall).bounds).toMatchObject({ shape: 'circle' });

    const stool = chapter1.rooms['ch1.malkins'].hotspots.find(({ id }) => id === 'malkins.stool');
    const stoolBounds = presentationFor(stool).bounds;
    expect(stool.hitArea).toMatchObject({ x: 670, y: 555, radius: 90 });
    expect(stoolBounds.shape).toBe('circle');
    expect(stoolBounds.width).toBeCloseTo(176.4);
    expect(stoolBounds.height).toBeCloseTo(99);
    expect(stoolBounds.x + stoolBounds.width / 2).toBe(670);
    expect(stoolBounds.y + stoolBounds.height / 2).toBe(555);

    const bedroomExit = chapter1.rooms['ch1.bedroom'].hotspots
      .find(({ id }) => id === 'bedroom.exit');
    const malkinsExit = chapter1.rooms['ch1.malkins'].exits
      .find(({ id }) => id === 'malkins.exit');
    const exitPresentation = (exit) => presentationFor({
      ...exit,
      kind: 'exit',
      presentation: { icon: exit.icon ?? exit.presentation?.icon, glow: 'objective' },
    });
    const bedroomDoorBounds = exitPresentation(bedroomExit).bounds;
    expect(bedroomDoorBounds).toMatchObject({ shape: 'door', y: 120, height: 460 });
    expect(bedroomDoorBounds.x).toBeCloseTo(40.8);
    expect(bedroomDoorBounds.width).toBeCloseTo(88.4);
    const malkinsDoorBounds = exitPresentation(malkinsExit).bounds;
    expect(malkinsDoorBounds).toMatchObject({ shape: 'door', y: 160, height: 420 });
    expect(malkinsDoorBounds.x).toBeCloseTo(303.2);
    expect(malkinsDoorBounds.width).toBeCloseTo(93.6);
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

  it('pauses unrelated scheduled glints while the active thread is escalated', () => {
    const renderer = new WorldAffordanceRenderer();
    const context = recordingContext();
    renderer.draw(context, {
      targets: [
        wandTarget({ tier: 'thread', visible: 'thread', intensity: 'hint', glint: null }),
        {
          id: 'ollivanders.exit',
          kind: 'door',
          hitArea: { shape: 'circle', x: 50, y: 390, radius: 64 },
          presentation: { icon: 'door', glow: 'discoverable' },
          salience: {
            tier: 'discoverable', visible: 'glint', intensity: 'quiet',
            glint: { targetId: 'ollivanders.exit', tier: 'discoverable', progress: 0.5, alpha: 0.8 },
          },
        },
      ],
    }, 1);

    expect(context.calls.filter(([name]) => name === 'translate')).toHaveLength(7);
  });

  it('draws localized wand-case shimmer and glints without rings, glyph badges, or leaked canvas state', () => {
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

    expect(context.calls.filter(([name]) => name === 'fill')).toHaveLength(20);
    expect(context.calls.filter(([name]) => name === 'stroke')).toHaveLength(0);
    expect(context.calls.filter(([name]) => name === 'closePath').length).toBeGreaterThanOrEqual(9);
    expect(context.calls.some(([name]) => name === 'setLineDash')).toBe(false);
    expect(context.calls.some(([name]) => name === 'fillText')).toBe(false);
    expect(context.depth).toBe(0);
  });

  it('keeps Hagrid free of interior gold washes while preserving one organic halo and its motes', () => {
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
    expect(presentation.motes).toHaveLength(4);
    expect(context.paints.map(({ method }) => method)).toEqual([
      'stroke', 'stroke',
      'fill', 'fill', 'fill', 'fill', 'fill', 'fill',
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

  it('draws the barrier destination painting, cast, and effect from one projected reveal state', () => {
    const state = {
      roomId: 'ch2.kingsCross',
      roomVariant: 'base',
      cameraX: 0,
      setPiece: {
        requestedId: 'ch2.setPiece.barrierRun',
        time: 1.4 * 0.68,
        descriptor: { duration: 1.4 },
        params: {
          preloadRoomVariant: 'platform',
          revealRoomVariantAt: 0.68,
          revealSpawn: 'platform',
        },
      },
      occupants: [],
      player: { x: 760, y: 620, targetX: 760, targetY: 620, facing: 'right' },
      pet: { type: 'cat', x: 695, y: 620, facing: 'right' },
      actors: [{
        actorId: 'ch2.npc.violet',
        characterId: 'character.violet',
        depth: 620,
        renderState: { x: 760, y: 620, facing: 'right' },
      }],
      targets: [],
      overlay: null,
      dialogue: null,
      screen: 'playing',
    };
    const room = { spawns: { platform: { x: 220, y: 620, facing: 'right' } } };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      world: { chapter: { id: 'ch2' }, room, flags: {}, snapshot: () => state },
      simTime: 0,
      reducedMotion: false,
      roomRenderer: { draw: vi.fn() },
      worldPropRenderer: { draw: vi.fn() },
      guideFootprintRenderer: { draw: vi.fn() },
      setPieceRenderer: { draw: vi.fn() },
      drawWorldTargets: vi.fn(),
      drawCharacters: vi.fn(),
      particles: { draw: vi.fn() },
      uiRenderer: { drawHud: vi.fn() },
      resumeRecap: null,
      saveData: { settings: { muted: true } },
      roomTransition: null,
      transitionAlpha: 0,
    });
    game.shouldShowReplayExit = () => false;

    game.renderWorld({});

    const presentedState = game.drawCharacters.mock.calls[0][1];
    expect(presentedState).toMatchObject({
      roomVariant: 'platform',
      player: { x: 220, y: 620 },
      pet: { x: 155, y: 620 },
    });
    expect(game.roomRenderer.draw.mock.calls[0][2]).toBe(presentedState);
    expect(game.worldPropRenderer.draw.mock.calls[0][1]).toBe(presentedState);
    expect(game.setPieceRenderer.draw.mock.calls[0][2]).toBe(presentedState);
  });
});
