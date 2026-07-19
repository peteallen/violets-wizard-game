import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { productionPresentationRegistry } from '../src/game/presentation/productionRoomVariantOverlays.js';
import { learningLayout } from '../src/game/render/LearningRenderer.js';
import { compactSpellFanLayout } from '../src/game/render/SpellbookRenderer.js';

function inputGame({ world = {}, uiRenderer = {} } = {}) {
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    screen: 'playing',
    world: {
      snapshot: vi.fn(),
      drainEvents: vi.fn(() => []),
      ...world,
    },
    uiRenderer,
    sound: {
      unlock: vi.fn(async () => true),
      playSfx: vi.fn(),
      speak: vi.fn(),
    },
    particles: { emit: vi.fn() },
    processWorldEvents: vi.fn(),
    updateStatus: vi.fn(),
    shouldShowDebugReset: vi.fn(() => false),
    shouldShowReplayExit: vi.fn(() => false),
    replayMode: false,
    resumeRecap: null,
    debug: false,
    simTime: 0,
    reducedMotion: false,
    lastRenderState: null,
    roomTransition: null,
  });
  return game;
}

function learningState() {
  return {
    learning: {
      beatId: 'learning.magic', kind: 'assembly', skill: 'letters', mode: 'gentle',
      stepIndex: 0, stepCount: 2, completedUnitIds: [],
      slots: [
        { id: 'a', glyph: 'A', voice: 'voice/a', landed: false, expected: true, hidden: false },
        { id: 'b', glyph: 'B', voice: 'voice/b', landed: false, expected: false, hidden: false },
      ],
      tiles: [
        { id: 'a', glyph: 'A', voice: 'voice/a', landed: false, expected: true, dimmed: false, highlighted: true },
        { id: 'x', glyph: 'X', voice: 'voice/x', landed: false, expected: false, dimmed: false, highlighted: false },
      ],
      hintStage: 'ready', failedAttempts: 0, featherLift: 0,
    },
  };
}

function spell(id) {
  return {
    id,
    label: id === 'lumos' ? 'Lumos' : 'Leviosa',
    incantation: id === 'lumos' ? 'Lumos' : 'Wingardium Leviosa',
    shortIncantation: id === 'lumos' ? 'Lumos' : 'Leviosa',
    icon: id === 'lumos' ? 'light' : 'feather',
    color: '#ffd76a',
    effect: { kind: 'magic', color: '#ffd76a' },
    audio: { cast: `sfx/${id}`, success: `sfx/${id}`, fizzle: 'sfx/fizzle' },
  };
}

describe('Chapter Three Canvas input integration', () => {
  it('routes only tile taps into learning and leaves empty taps harmless', () => {
    const state = learningState();
    const presentation = learningLayout(state.learning);
    const chooseLearningUnit = vi.fn(() => true);
    const game = inputGame({
      world: { chooseLearningUnit },
      uiRenderer: { learningPresentation: () => presentation },
    });
    const correct = presentation.targets.find(({ unitId }) => unitId === 'a');

    expect(game.handleLearningTap({ x: correct.x, y: correct.y }, state)).toBe(true);
    expect(chooseLearningUnit).toHaveBeenCalledWith('a');
    expect(game.sound.speak).toHaveBeenCalledWith('voice/a', 'A');

    expect(game.handleLearningTap({ x: 10, y: 10 }, state)).toBe(false);
    expect(chooseLearningUnit).toHaveBeenCalledTimes(1);
  });

  it('selects a fan card, casts only at a valid target, and cancels freely elsewhere', () => {
    const chooseSpell = vi.fn(() => true);
    const castSpellAt = vi.fn(() => true);
    const cancelSpellbook = vi.fn();
    const targetAt = vi.fn(() => ({ id: 'world.lantern' }));
    const game = inputGame({
      world: { selectSpell: chooseSpell, castSpellAt, cancelSpellbook, targetAt },
      uiRenderer: { spellbookFanPresentation: (state) => compactSpellFanLayout(state.spellbook) },
    });
    const fanState = {
      spellbook: {
        state: 'fan', known: [spell('lumos'), spell('leviosa')],
        selectedSpellId: null, validTargetIds: [], cast: null,
      },
    };
    const card = compactSpellFanLayout(fanState.spellbook).targets.find(({ spellId }) => spellId === 'lumos');
    game.handleSpellbookTap({ x: card.x, y: card.y }, fanState);
    expect(chooseSpell).toHaveBeenCalledWith('lumos');

    const targeting = {
      spellbook: {
        ...fanState.spellbook,
        state: 'targeting',
        selectedSpellId: 'lumos',
        validTargetIds: ['world.lantern'],
      },
    };
    game.handleSpellbookTap({ x: 400, y: 300 }, targeting);
    expect(castSpellAt).toHaveBeenCalledWith('world.lantern');
    expect(cancelSpellbook).not.toHaveBeenCalled();

    targetAt.mockReturnValue({ id: 'world.book' });
    game.handleSpellbookTap({ x: 400, y: 300 }, targeting);
    expect(castSpellAt).toHaveBeenCalledTimes(1);
    expect(cancelSpellbook).toHaveBeenCalledOnce();
  });

  it('turns full-book practice into the normal targeting flow', () => {
    const closeOverlay = vi.fn();
    const openSpellbook = vi.fn(() => true);
    const selectSpell = vi.fn(() => true);
    const game = inputGame({
      world: { closeOverlay, openSpellbook, selectSpell },
      uiRenderer: {
        spellbookPresentation: () => ({
          targets: [{
            id: 'spellbook.practice.lumos', kind: 'spell-practice', spellId: 'lumos',
            hitArea: { x: 100, y: 100, width: 100, height: 100 },
          }],
        }),
      },
    });
    game.handleOverlayTap({ x: 150, y: 150 }, {
      overlay: { surface: 'spellbook', tab: 'lumos' },
      spellbook: { state: 'closed', known: [spell('lumos')] },
    });

    expect(closeOverlay).toHaveBeenCalledOnce();
    expect(openSpellbook).toHaveBeenCalledOnce();
    expect(selectSpell).toHaveBeenCalledWith('lumos');
  });

  it('exposes learning and targeting semantics without leaking covered world targets', () => {
    const learning = learningState();
    const game = inputGame({
      world: { snapshot: vi.fn(() => learning) },
      uiRenderer: { learningPresentation: (state) => learningLayout(state.learning) },
    });
    game.lastRenderState = learning;
    expect(game.semanticTargets().map(({ id }) => id)).toEqual([
      'learning.tile.a',
      'learning.tile.x',
    ]);

    const targeting = {
      chapterId: 'ch3', cameraX: 40, overlay: null, learning: null,
      spellbook: {
        state: 'targeting', known: [spell('lumos')], selectedSpellId: 'lumos',
        validTargetIds: ['world.lantern'], cast: null,
      },
      targets: [
        { id: 'world.lantern', hitArea: { shape: 'rect', x: 300, y: 200, width: 88, height: 88 } },
        { id: 'world.book', hitArea: { shape: 'rect', x: 500, y: 200, width: 88, height: 88 } },
      ],
    };
    game.lastRenderState = targeting;
    game.uiRenderer = {
      spellbookFanPresentation: (state) => compactSpellFanLayout(state.spellbook),
    };
    const ids = game.semanticTargets().map(({ id }) => id);
    expect(ids).toContain('world.lantern');
    expect(ids).not.toContain('world.book');
    expect(ids).toContain('spellbook.cast.lumos');
    expect(ids).toContain('hud.wand');
  });

  it('turns a Chapter Three blocking celebration into a tappable continue after one second', async () => {
    await productionPresentationRegistry.activateChapter('ch3');
    const skip = vi.fn();
    const state = {
      chapterId: 'ch3',
      setPiece: {
        time: 1,
        requestedId: 'ch3.setPiece.lumosBloom',
        descriptor: { renderer: 'setPiece.ch3.lumosBloom', duration: 2.4 },
      },
      overlay: null,
      dialogue: null,
      targets: [],
    };
    const game = inputGame({
      world: {
        chapter: { id: 'ch3' },
        snapshot: vi.fn(() => state),
        setPieces: { skip },
      },
    });
    game.lastRenderState = state;

    expect(game.semanticTargets().map(({ id }) => id)).toContain('setPiece.continue');
    game.handleTap({ x: 640, y: 360 });
    expect(skip).toHaveBeenCalledOnce();
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });

  it('keeps a learned-card spellbook overlay interactive during the learning settle frame', () => {
    const state = {
      learning: { ...learningState().learning, status: 'completed', tiles: [] },
      overlay: { surface: 'spellbook', tab: 'lumos' },
      spellbook: { state: 'closed', known: [spell('lumos')], selectedSpellId: null },
      targets: [],
    };
    const game = inputGame({
      world: { snapshot: vi.fn(() => state) },
      uiRenderer: {
        spellbookPresentation: () => ({
          targets: [{ id: 'spellbook.detail.lumos', x: 300, y: 300 }],
        }),
        learningPresentation: vi.fn(),
      },
    });
    game.lastRenderState = state;

    expect(game.semanticTargets()).toEqual([{ id: 'spellbook.detail.lumos', x: 300, y: 300 }]);
    expect(game.uiRenderer.learningPresentation).not.toHaveBeenCalled();
  });
});
