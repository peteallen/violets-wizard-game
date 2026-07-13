import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { UI_RECTS } from '../src/game/render/UIRenderer.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function gameStub() {
  const game = Object.create(Game.prototype);
  game.world = {
    closeOverlay: vi.fn(),
    runAction: vi.fn(),
  };
  game.sound = { playSfx: vi.fn() };
  game.processWorldEvents = vi.fn();
  return game;
}

describe('tap-controlled letter reading', () => {
  it('keeps the invitation open until the hear-the-letter action is tapped', () => {
    const game = gameStub();
    const state = { overlay: { surface: 'letter-reading', tab: null } };

    game.handleOverlayTap({ x: 20, y: 20 }, state);

    expect(game.world.closeOverlay).not.toHaveBeenCalled();
    expect(game.world.runAction).not.toHaveBeenCalled();

    game.handleOverlayTap(center(UI_RECTS.letterContinue), state);

    expect(game.world.closeOverlay).toHaveBeenCalledOnce();
    expect(game.world.runAction).toHaveBeenCalledWith({
      type: 'dialogue.start',
      script: 'ch1.letter.read',
    });
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/page', 'tap');
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });
});
