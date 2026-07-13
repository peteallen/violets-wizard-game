import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { WORLD } from '../src/game/config.js';
import { contentRegistry } from '../src/game/content/index.js';
import {
  UIRenderer,
  dialogueSceneContext,
  dialogueScrollLayout,
} from '../src/game/render/UIRenderer.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function overlaps(first, second) {
  return first.x < second.right
    && first.x + first.width > second.left
    && first.y < second.bottom
    && first.y + first.height > second.top;
}

function dialogueState({ speaker = 'npc.guide', playerX = 1040, roomVariant = 'base' } = {}) {
  return {
    cameraX: 0,
    roomVariant,
    player: { kind: 'violet', x: playerX, y: 620, facing: 'left' },
    occupants: [{ npc: 'npc.guide', x: 230, y: 620, facing: 'right' }],
    targets: [],
    setPiece: null,
    overlay: null,
    dialogue: { type: 'line', speaker, caption: 'This way!' },
  };
}

function recordingDialogueContext() {
  const calls = [];
  const texts = [];
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill', 'fillRect',
    'lineTo', 'moveTo', 'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'translate',
  ]);
  const target = { calls, texts, font: '700 42px "Andika"', globalAlpha: 1 };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') return (text) => ({ width: String(text).length * 18 });
      if (property === 'fillText') {
        return (text, ...position) => {
          texts.push(String(text));
          calls.push(['fillText', String(text), ...position]);
        };
      }
      if (methods.has(property)) return (...args) => calls.push([property, ...args]);
      return object[property];
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

describe('adaptive dialogue scroll', () => {
  it('derives the visible active speaker from deterministic world state', () => {
    const guideState = dialogueState();
    const guide = dialogueSceneContext(guideState);
    expect(guide.speakerPosition).toEqual({ x: 230, y: 620 });
    expect(guide.speakerBounds).toMatchObject({ left: 108, right: 352, bottom: 655 });
    expect(guide.night).toBe(false);

    const violetState = dialogueState({ speaker: 'npc.violet', playerX: 1030, roomVariant: 'dusk' });
    const violet = dialogueSceneContext(violetState);
    expect(violet.speakerPosition).toEqual({ x: 1030, y: 620 });
    expect(violet.speakerBounds).toMatchObject({ left: 956, right: 1104 });
    expect(violet.night).toBe(true);

    expect(dialogueSceneContext(dialogueState({ speaker: 'npc.narrator' })).speakerBounds).toBeNull();
  });

  it('uses daytime parchment for dialogue when revisiting a day-only shop after dusk', () => {
    const save = createSaveV1({
      now: '2026-07-13T18:00:00.000Z',
      appVersion: 'dialogue-palette-test',
      worldSeed: 42,
    });
    save.resume = {
      chapter: 'ch1',
      scene: 'ch1.ticket',
      room: 'ch1.diagonStreet',
      spawn: 'west',
    };
    Object.assign(save.progress.questFlags, {
      'ch1.wallOpened': true,
      'ch1.diagonReached': true,
      'ch1.satchelReceived': true,
      'ch1.mapUsed': true,
      'ch1.wandChosen': true,
      'ch1.trimChosen': true,
      'ch1.petChosen': true,
      'ch1.petNamed': true,
    });
    save.character.wandId = 'violet-first-wand';
    save.character.appearance.robeTrim = 'purple';
    save.character.pet = { type: 'cat', name: 'Biscuit' };

    const world = new World({ chapters: contentRegistry, save, seed: 42 });
    const street = world.snapshot();
    expect(street.roomVariant).toBe('dusk');
    expect(dialogueSceneContext(street, { speaker: 'npc.guide' }).night).toBe(true);

    world.interactSemantic('street.malkinsDoor');
    world.interactSemantic('malkins.mirror');
    for (let frame = 0; frame < 240 && !world.dialogue.active; frame += 1) {
      world.update(1 / 60);
    }

    const shop = world.snapshot();
    expect(shop.roomId).toBe('ch1.malkins');
    expect(shop.roomVariant).toBe('base');
    expect(shop.dialogue).toMatchObject({ speaker: 'npc.violet', caption: 'A witch!' });
    expect(dialogueSceneContext(shop).night).toBe(false);
  });

  it('places and narrows the scroll opposite every speaker without covering the puppet', () => {
    const cases = [
      { left: 95, right: 355, top: 280, bottom: 680, expectedSide: 'right' },
      { left: 925, right: 1165, top: 300, bottom: 680, expectedSide: 'left' },
      { left: 518, right: 762, top: 280, bottom: 680, expectedSide: 'right' },
    ];

    for (const speakerBounds of cases) {
      const layout = dialogueScrollLayout({ speakerBounds });
      expect(layout.side).toBe(speakerBounds.expectedSide);
      expect(overlaps(layout.frame, speakerBounds)).toBe(false);
      expect(layout.frame.y).toBeGreaterThanOrEqual(WORLD.height * 0.75);
      expect(layout.frame.height / WORLD.height).toBeCloseTo(0.22, 1);
      expect(layout.captionRect.width).toBeGreaterThan(180);
      expect(layout.replayRect.width).toBeGreaterThanOrEqual(88);
      expect(layout.advanceRect.width).toBeGreaterThanOrEqual(86);
    }
  });

  it('keeps a centered scroll when the speaker is absent or entirely above the dialogue band', () => {
    expect(dialogueScrollLayout().side).toBe('center');
    expect(dialogueScrollLayout({
      speakerBounds: { left: 560, right: 720, top: 40, bottom: 300 },
    }).side).toBe('center');
  });

  it('routes replay and advance semantics through the shifted controls', () => {
    const state = dialogueState({ speaker: 'npc.violet', playerX: 1050 });
    const layout = dialogueScrollLayout(dialogueSceneContext(state));
    const game = Object.create(Game.prototype);
    game.shouldShowDebugReset = () => false;
    game.shouldShowReplayExit = () => false;
    game.sound = { unlock: vi.fn(() => Promise.resolve()), playSfx: vi.fn() };
    game.replayMode = false;
    game.screen = 'playing';
    game.resumeRecap = null;
    game.lastRenderState = state;
    game.world = {
      snapshot: vi.fn(() => state),
      dialogue: { replay: vi.fn() },
      advanceDialogue: vi.fn(),
    };
    game.processWorldEvents = vi.fn();

    const targets = game.semanticTargets();
    expect(targets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'dialogue.replay' }),
      expect.objectContaining({ id: 'dialogue.advance' }),
    ]));

    game.handleTap({
      x: layout.replayRect.x + layout.replayRect.width / 2,
      y: layout.replayRect.y + layout.replayRect.height / 2,
    });
    expect(game.world.dialogue.replay).toHaveBeenCalledOnce();
    expect(game.world.advanceDialogue).not.toHaveBeenCalled();

    game.handleTap({
      x: layout.advanceRect.x + layout.advanceRect.width / 2,
      y: layout.advanceRect.y + layout.advanceRect.height / 2,
    });
    expect(game.world.advanceDialogue).toHaveBeenCalledOnce();
  });

  it('renders only the short caption and controls, with a static reduced-motion arrow', () => {
    const renderer = new UIRenderer({ characterRenderer: { drawPortrait: vi.fn() } });
    const dialogue = {
      type: 'line', speaker: 'npc.guide', speakerLabel: 'Hagrid', caption: 'This way!',
      text: 'Come along, Violet. Diagon Alley is waiting for you.',
    };
    const first = recordingDialogueContext();
    const second = recordingDialogueContext();
    renderer.drawDialogue(first, dialogue, 0, true, true);
    renderer.drawDialogue(second, dialogue, 2.4, true, true);

    expect(first.texts).toEqual(['This way!', 'Again']);
    expect(first.texts).not.toContain('Hagrid');
    expect(first.texts).not.toContain(dialogue.text);
    expect(first.texts.some((text) => text.includes('Tap the page'))).toBe(false);
    expect(first.calls).toEqual(second.calls);
  });
});
