import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { chapter1LetterNarration } from '../src/game/content/chapters/ch1-letter.js';
import {
  UI_RECTS,
  dialogueSceneContext,
  letterReadingLayout,
} from '../src/game/render/UIRenderer.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function overlapsBounds(rect, bounds) {
  return rect.x < bounds.right
    && rect.x + rect.width > bounds.left
    && rect.y < bounds.bottom
    && rect.y + rect.height > bounds.top;
}

function gameStub() {
  const game = Object.create(Game.prototype);
  const overlay = { surface: 'letter-reading', tab: null };
  game.world = {
    overlay,
    closeOverlay: vi.fn(() => { game.world.overlay = null; }),
    runAction: vi.fn(),
    setFlag: vi.fn(),
  };
  game.sound = {
    playSfx: vi.fn(),
    speak: vi.fn(),
    stopVoice: vi.fn(),
  };
  game.processWorldEvents = vi.fn();
  game.letterNarrationRequest = null;
  game.destroyed = false;
  return { game, state: { overlay } };
}

function endedCallback(game, callIndex) {
  const options = game.sound.speak.mock.calls[callIndex]?.[2];
  expect(options).toEqual({ onEnded: expect.any(Function) });
  return options.onEnded;
}

describe('optional invitation narration', () => {
  it('keeps the settled paper and both reading actions clear of live Violet', () => {
    const layout = letterReadingLayout();
    const violet = dialogueSceneContext({
      cameraX: 0,
      actors: [{
        actorId: 'npc.violet',
        characterId: 'character.violet',
        depth: 610,
        renderState: {
          x: 760,
          y: 610,
          layoutBounds: { width: 148, height: 228, ground: 32 },
        },
      }],
      targets: [],
    }, {
      speaker: 'npc.violet',
      portraitCharacterId: 'character.violet',
    }).speakerBounds;
    const invitation = {
      x: layout.invitationBounds.left,
      y: layout.invitationBounds.top,
      width: layout.invitationBounds.right - layout.invitationBounds.left,
      height: layout.invitationBounds.bottom - layout.invitationBounds.top,
    };

    expect(overlapsBounds(invitation, violet)).toBe(false);
    expect(overlapsBounds(layout.hear, violet)).toBe(false);
    expect(overlapsBounds(layout.continue, violet)).toBe(false);
    expect(overlapsBounds(layout.hear, {
      left: layout.continue.x,
      right: layout.continue.x + layout.continue.width,
      top: layout.continue.y,
      bottom: layout.continue.y + layout.continue.height,
    })).toBe(false);
    for (const action of [layout.hear, layout.continue]) {
      expect(action.width).toBeGreaterThanOrEqual(88);
      expect(action.height).toBeGreaterThanOrEqual(88);
    }
  });

  it('keeps the readable invitation open while the two existing clips play sequentially', () => {
    const { game, state } = gameStub();

    game.handleOverlayTap({ x: 20, y: 20 }, state);
    expect(game.sound.speak).not.toHaveBeenCalled();

    game.handleOverlayTap(center(UI_RECTS.letterHear), state);

    expect(game.world.overlay).toBe(state.overlay);
    expect(game.world.closeOverlay).not.toHaveBeenCalled();
    expect(game.world.setFlag).not.toHaveBeenCalled();
    expect(game.world.runAction).not.toHaveBeenCalled();
    expect(game.processWorldEvents).not.toHaveBeenCalled();
    expect(game.sound.speak).toHaveBeenNthCalledWith(
      1,
      'voice/ch1/narrator/letterInvitation',
      chapter1LetterNarration[0],
      { onEnded: expect.any(Function) },
    );

    endedCallback(game, 0)();
    expect(game.sound.speak).toHaveBeenNthCalledWith(
      2,
      'voice/ch1/narrator/letterWaiting',
      chapter1LetterNarration[1],
      { onEnded: expect.any(Function) },
    );

    endedCallback(game, 1)();
    expect(game.sound.speak).toHaveBeenCalledTimes(2);
    expect(game.world.overlay).toBe(state.overlay);
    expect(game.world.setFlag).not.toHaveBeenCalled();
    expect(game.letterNarrationRequest).toBeNull();
  });

  it('restarts safely and ignores completion callbacks from an interrupted playback', () => {
    const { game, state } = gameStub();

    game.handleOverlayTap(center(UI_RECTS.letterHear), state);
    const staleCompletion = endedCallback(game, 0);

    game.handleOverlayTap(center(UI_RECTS.letterHear), state);
    expect(game.sound.speak).toHaveBeenCalledTimes(2);
    expect(game.sound.speak.mock.calls[1][0]).toBe('voice/ch1/narrator/letterInvitation');

    staleCompletion();
    expect(game.sound.speak).toHaveBeenCalledTimes(2);

    endedCallback(game, 1)();
    expect(game.sound.speak).toHaveBeenCalledTimes(3);
    expect(game.sound.speak.mock.calls[2][0]).toBe('voice/ch1/narrator/letterWaiting');
    expect(game.world.overlay).toBe(state.overlay);
    expect(game.world.runAction).not.toHaveBeenCalled();
  });

  it('lets Violet continue without listening and preserves the existing save flag', () => {
    const { game, state } = gameStub();

    game.handleOverlayTap(center(UI_RECTS.letterContinue), state);

    expect(game.sound.speak).not.toHaveBeenCalled();
    expect(game.sound.stopVoice).toHaveBeenCalledOnce();
    expect(game.world.closeOverlay).toHaveBeenCalledOnce();
    expect(game.world.setFlag).toHaveBeenCalledWith('ch1.letterRead', true);
    expect(game.world.runAction).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/page', 'tap');
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });

  it('stops in-flight narration before continuing and ignores its stale callback', () => {
    const { game, state } = gameStub();

    game.handleOverlayTap(center(UI_RECTS.letterHear), state);
    const staleCompletion = endedCallback(game, 0);
    game.handleOverlayTap(center(UI_RECTS.letterContinue), state);

    expect(game.sound.stopVoice).toHaveBeenCalledTimes(2);
    expect(game.world.closeOverlay).toHaveBeenCalledOnce();
    expect(game.world.setFlag).toHaveBeenCalledWith('ch1.letterRead', true);
    staleCompletion();
    expect(game.sound.speak).toHaveBeenCalledTimes(1);
  });

  it('publishes separate semantic targets for listening and continuing', () => {
    const { game, state } = gameStub();
    game.screen = 'playing';
    game.debug = false;
    game.replayMode = false;
    game.resumeRecap = null;
    game.lastRenderState = {
      targets: [],
      cameraX: 0,
      dialogue: null,
      overlay: state.overlay,
    };

    const targets = game.semanticTargets();
    const targetIds = targets.map(({ id }) => id);

    expect(targets).toContainEqual({ id: 'letter.hear', ...center(UI_RECTS.letterHear) });
    expect(targets).toContainEqual({ id: 'letter.continue', ...center(UI_RECTS.letterContinue) });
    expect(targetIds).not.toContain('dialogue.advance');
    expect(targetIds).not.toContain('dialogue.replay');
  });
});
