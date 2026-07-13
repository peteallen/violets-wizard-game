import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import {
  CHAPTER_PREVIEW_ACTIONS,
  ChapterPreviewRenderer,
  chapterPreviewActionAt,
  chapterPreviewLayout,
} from '../src/game/render/ChapterPreviewRenderer.js';
import { UI_RECTS } from '../src/game/render/UIRenderer.js';
import { createSaveV1 } from '../src/game/systems/Save.js';

const NOW = '2026-07-13T20:00:00.000Z';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function overlaps(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function contains(outer, inner) {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}

function recordingContext() {
  const calls = [];
  const texts = [];
  let depth = 0;
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'closePath', 'fill', 'fillRect', 'lineTo',
    'moveTo', 'quadraticCurveTo', 'restore', 'save', 'setLineDash', 'stroke',
  ]);
  const target = {
    calls,
    texts,
    font: '700 24px "Andika"',
    globalAlpha: 1,
    get depth() { return depth; },
  };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') return (text) => ({ width: String(text).length * 11 });
      if (property === 'fillText') {
        return (text, ...position) => {
          texts.push(String(text));
          calls.push(['fillText', String(text), ...position]);
        };
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
      object[property] = value;
      return true;
    },
  });
}

function previewState({ dialogueType = 'choice', overlay = null, setPiece = null } = {}) {
  const dialogue = dialogueType
    ? {
        type: dialogueType,
        speaker: 'npc.narrator',
        choices: dialogueType === 'choice'
          ? [
              { id: 'explore', icon: 'map', caption: 'Explore' },
              { id: 'playAgain', icon: 'page-turn', caption: 'Play again' },
            ]
          : undefined,
      }
    : null;
  return {
    roomId: 'ch2.previewRoom',
    cameraX: 0,
    targets: [],
    dialogue,
    overlay,
    setPiece,
  };
}

function previewGame({ state = previewState(), save = null } = {}) {
  const world = {
    chapter: { id: 'ch2' },
    overlay: state.overlay,
    advanceDialogue: vi.fn(),
    closeOverlay: vi.fn(function closeOverlay() { this.overlay = null; }),
    snapshot: vi.fn(() => ({ ...state, overlay: world.overlay })),
  };
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    debug: false,
    screen: 'playing',
    replayMode: false,
    canonicalSave: null,
    resumeRecap: null,
    roomTransition: null,
    lastRenderState: null,
    parentGateProgress: 0,
    world,
    saveData: save ?? createSaveV1({ now: NOW, appVersion: 'chapter-preview-test', worldSeed: 42 }),
    sound: {
      unlock: vi.fn(() => Promise.resolve()),
      playSfx: vi.fn(),
    },
    processWorldEvents: vi.fn(),
    render: vi.fn(),
  });
  game.shouldShowDebugReset = () => false;
  game.shouldShowReplayExit = () => false;
  return { game, world, state };
}

describe('Chapter Two preview composition', () => {
  it('keeps a compact title above two large, non-overlapping actions', () => {
    const layout = chapterPreviewLayout();
    const [explore, replay] = layout.choices;

    expect(layout.titlePlaque.y + layout.titlePlaque.height).toBeLessThan(720 / 3);
    expect(overlaps(layout.titlePlaque, layout.shelf)).toBe(false);
    expect(overlaps(layout.startFresh, layout.titlePlaque)).toBe(false);
    expect(overlaps(layout.startFresh, layout.shelf)).toBe(false);
    expect(overlaps(explore.rect, replay.rect)).toBe(false);
    expect(contains(layout.shelf, explore.rect)).toBe(true);
    expect(contains(layout.shelf, replay.rect)).toBe(true);

    for (const target of [layout.startFresh, explore.rect, replay.rect]) {
      expect(target.width).toBeGreaterThanOrEqual(88);
      expect(target.height).toBeGreaterThanOrEqual(88);
    }
  });

  it('maps the dedicated controls without relying on mutated dialogue rectangles', () => {
    const layout = chapterPreviewLayout();
    expect(chapterPreviewActionAt(center(layout.startFresh), layout)).toBe(CHAPTER_PREVIEW_ACTIONS.startFresh);
    for (const choice of layout.choices) {
      expect(chapterPreviewActionAt(center(choice.rect), layout)).toBe(choice.id);
    }
    expect(chapterPreviewActionAt({ x: 640, y: 330 }, layout)).toBeNull();
  });

  it('draws the title, two choices, and Start fresh deterministically without owl ornaments', () => {
    const renderer = new ChapterPreviewRenderer();
    const choices = previewState().dialogue.choices;
    const first = recordingContext();
    const second = recordingContext();

    renderer.draw(first, { choices, showChoices: true });
    renderer.draw(second, { choices, showChoices: true });

    expect(first.texts).toEqual([
      'Chapter Two',
      'Platform Nine and Three-Quarters',
      'Start fresh',
      'Explore',
      'Play again',
    ]);
    expect(first.texts.some((text) => text.toLowerCase().includes('owl'))).toBe(false);
    expect(first.calls.some(([method]) => method === 'arc' || method === 'ellipse')).toBe(false);
    expect(first.calls).toEqual(second.calls);
    expect(first.depth).toBe(0);
    expect(second.depth).toBe(0);
  });

  it('keeps the hero painting and suppresses the generic choice overlay', () => {
    const state = previewState();
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      world: {
        chapter: { id: 'ch2' },
        room: { id: 'ch2.previewRoom' },
        snapshot: () => state,
      },
      simTime: 0,
      reducedMotion: false,
      roomRenderer: { draw: vi.fn() },
      chapterPreviewRenderer: { draw: vi.fn() },
      uiRenderer: {
        drawChapterCard: vi.fn(), drawDialogue: vi.fn(), drawHud: vi.fn(),
      },
      setPieceRenderer: { draw: vi.fn() },
      particles: { draw: vi.fn() },
      resumeRecap: null,
      saveData: { settings: { muted: false } },
      transitionAlpha: 0,
      roomTransition: null,
    });

    game.renderWorld({});

    expect(game.roomRenderer.draw).toHaveBeenCalledOnce();
    expect(game.chapterPreviewRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ choices: state.dialogue.choices, showChoices: true }),
    );
    expect(game.uiRenderer.drawChapterCard).not.toHaveBeenCalled();
    expect(game.uiRenderer.drawDialogue).not.toHaveBeenCalled();
  });
});

describe('Chapter Two preview input', () => {
  it.each([
    ['Explore', 'explore'],
    ['Play again', 'playAgain'],
  ])('routes %s through the authored dialogue action', (_label, actionId) => {
    const { game, world } = previewGame();
    const action = chapterPreviewLayout().choices.find((choice) => choice.id === actionId);

    game.handleTap(center(action.rect));

    expect(world.advanceDialogue).toHaveBeenCalledWith(actionId);
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/choice', 'chime');
  });

  it('opens the existing Start Over confirmation without advancing the active choice', () => {
    const { game, world } = previewGame();

    game.handleTap(center(chapterPreviewLayout().startFresh));

    expect(world.overlay).toEqual({
      surface: 'parent',
      page: 'confirm-start-over',
      notice: null,
      returnTo: 'chapter-preview',
    });
    expect(world.advanceDialogue).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/parchment', 'chime');
  });

  it('gives the parent confirmation input priority and cancel returns to the choices', () => {
    const { game, world } = previewGame();
    game.handleTap(center(chapterPreviewLayout().startFresh));

    game.handleTap(center(UI_RECTS.parentCancelConfirm));

    expect(world.closeOverlay).toHaveBeenCalledOnce();
    expect(world.overlay).toBeNull();
    expect(world.advanceDialogue).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenLastCalledWith('sfx/ui/page', 'tap');
  });

  it('confirms through the existing safe reset and creates a fresh Chapter One save', () => {
    const save = createSaveV1({ now: NOW, appVersion: 'chapter-preview-test', worldSeed: 42 });
    save.progress.completedChapters = ['ch1'];
    save.progress.highestUnlockedChapter = 2;
    save.progress.questFlags['ch1.complete'] = true;
    save.resume = { chapter: 'ch2', scene: 'ch2.placeholder', room: 'ch2.previewRoom', spawn: 'start' };
    save.character.wandId = 'violet-first-wand';
    const { game, world } = previewGame({ save });
    game.clock = () => NOW;
    game.saveManager = {
      clear: vi.fn(() => ({ ok: true, status: 'cleared', save: null })),
      write: vi.fn((value) => ({ ok: true, status: 'saved', save: structuredClone(value) })),
    };
    game.adoptSave = vi.fn();

    game.handleTap(center(chapterPreviewLayout().startFresh));
    game.handleTap(center(UI_RECTS.parentAcceptConfirm));

    const fresh = game.saveManager.write.mock.calls.at(-1)[0];
    expect(game.saveManager.clear).toHaveBeenCalledOnce();
    expect(fresh.resume.chapter).toBe('ch1');
    expect(fresh.progress.completedChapters).toEqual([]);
    expect(fresh.progress.questFlags).toEqual({});
    expect(fresh.character.wandId).toBeNull();
    expect(game.adoptSave).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      toTitle: true,
      hasStoredSave: false,
    }));
    expect(world.advanceDialogue).not.toHaveBeenCalled();
  });

  it('publishes dedicated semantic targets only while the preview is interactive', () => {
    const { game, world } = previewGame();
    const targetIds = game.semanticTargets().map(({ id }) => id);
    expect(targetIds).toEqual(expect.arrayContaining([
      'chapter.preview.startFresh',
      'chapter.preview.explore',
      'chapter.preview.playAgain',
    ]));
    expect(targetIds).not.toContain('dialogue.explore');
    expect(targetIds).not.toContain('dialogue.playAgain');

    world.overlay = {
      surface: 'parent', page: 'confirm-start-over', notice: null, returnTo: 'chapter-preview',
    };
    const parentTargetIds = game.semanticTargets().map(({ id }) => id);
    expect(parentTargetIds).not.toContain('chapter.preview.startFresh');
    expect(parentTargetIds).not.toContain('chapter.preview.explore');
    expect(parentTargetIds).not.toContain('chapter.preview.playAgain');
    expect(parentTargetIds).toEqual(expect.arrayContaining([
      'parent.confirm.cancel',
      'parent.confirm.accept',
    ]));
  });

  it('keeps the existing replay-mode event route intact', () => {
    const game = Object.create(Game.prototype);
    game.beginReplay = vi.fn();

    game.handleWorldEvent({
      type: 'ui.openRequested',
      payload: { surface: 'chapter-replay', tab: 'ch1' },
    });

    expect(game.beginReplay).toHaveBeenCalledOnce();
  });
});
