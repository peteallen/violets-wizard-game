import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { UI_RECTS } from '../src/game/render/UIRenderer.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function gameStub(state) {
  const game = Object.create(Game.prototype);
  game.screen = 'playing';
  game.debug = false;
  game.replayMode = false;
  game.resumeRecap = null;
  game.roomTransition = null;
  game.lastRenderState = state;
  game.processWorldEvents = vi.fn();
  game.sound = {
    unlock: vi.fn(() => Promise.resolve()),
    playSfx: vi.fn(),
    speak: vi.fn(),
  };
  game.world = {
    flags: {},
    overlay: null,
    objective: null,
    chapter: { id: state.roomId.split('.')[0], dialogues: {} },
    dialogue: { open: vi.fn() },
    tap: vi.fn(),
    snapshot: () => state,
  };
  return game;
}

describe('earned HUD availability', () => {
  it('publishes only the quest compass before Violet receives her satchel and wand', () => {
    const state = {
      targets: [],
      cameraX: 0,
      roomId: 'ch1.bedroom',
      screen: 'playing',
      dialogue: null,
      setPiece: null,
      overlay: null,
      hasSatchel: false,
      hasWand: false,
    };
    const game = gameStub(state);

    const targetIds = game.semanticTargets().map(({ id }) => id);
    expect(targetIds).toContain('hud.quest');
    expect(targetIds).not.toContain('hud.satchel');
    expect(targetIds).not.toContain('hud.wand');

    game.handleTap(center(UI_RECTS.satchel));
    game.handleTap(center(UI_RECTS.wand));
    expect(game.world.overlay).toBeNull();
    expect(game.world.dialogue.open).not.toHaveBeenCalled();
    expect(game.world.tap).toHaveBeenCalledTimes(2);
  });

  it('publishes and routes each diegetic object after Violet earns it', () => {
    const state = {
      targets: [],
      cameraX: 0,
      roomId: 'ch1.diagonStreet',
      screen: 'playing',
      dialogue: null,
      setPiece: null,
      overlay: null,
      hasSatchel: true,
      hasWand: true,
    };
    const game = gameStub(state);

    const targetIds = game.semanticTargets().map(({ id }) => id);
    expect(targetIds).toEqual(expect.arrayContaining([
      'hud.quest', 'hud.satchel', 'hud.wand',
    ]));

    game.handleTap(center(UI_RECTS.satchel));
    expect(game.world.overlay).toEqual({ surface: 'satchel', tab: 'map' });
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/parchment', 'chime');

    game.world.overlay = null;
    game.handleTap(center(UI_RECTS.wand));
    expect(game.sound.playSfx).toHaveBeenLastCalledWith('sfx/ui/locked', 'fizzle');
    expect(game.world.dialogue.open).not.toHaveBeenCalled();
  });
});
