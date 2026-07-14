import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { WORLD } from '../src/game/config.js';
import { contentRegistry } from '../src/game/content/index.js';
import { CharacterRenderer } from '../src/game/render/CharacterRenderer.js';
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

function rectsOverlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function dialogueState({
  speaker = 'npc.guide',
  playerX = 1040,
  roomVariant = 'base',
  keyLight = 'left',
} = {}) {
  return {
    cameraX: 0,
    keyLight,
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
  const assignments = [];
  const target = { assignments, calls, texts, font: '700 42px "Andika"', globalAlpha: 1 };
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
      assignments.push([property, value]);
      object[property] = value;
      return true;
    },
  });
}

describe('adaptive dialogue card', () => {
  it('uses the canonical character cameo when an injected renderer lacks portrait support', () => {
    const drawPortrait = vi.spyOn(CharacterRenderer.prototype, 'drawPortrait').mockImplementation(() => {});
    try {
      const renderer = new UIRenderer({ characterRenderer: { draw: vi.fn() } });
      const context = recordingDialogueContext();
      renderer.drawDialogue(context, {
        type: 'line', speaker: 'npc.guide', portraitPose: 'talk', caption: 'This way!',
      }, 1.25, true, false);

      expect(drawPortrait).toHaveBeenCalledWith(
        context,
        expect.objectContaining({ speaker: 'npc.guide', pose: 'talk' }),
        1.25,
      );
      expect(context.calls.some(([name]) => name === 'ellipse')).toBe(false);
    } finally {
      drawPortrait.mockRestore();
    }
  });

  it('keeps the two synthetic pre-Malkin Violet review scenes in her casual clothes', () => {
    const characterRenderer = { draw: vi.fn(), drawPortrait: vi.fn() };
    const renderer = new UIRenderer({ characterRenderer });

    for (const scene of ['ui-broom-caption-review', 'ui-dialogue-center-review']) {
      const context = recordingDialogueContext();
      context.createLinearGradient = () => ({ addColorStop: () => {} });
      characterRenderer.draw.mockClear();
      characterRenderer.drawPortrait.mockClear();

      expect(renderer.drawReviewScene(context, scene, 0, { reducedMotion: true })).toBe(true);
      expect(characterRenderer.draw).toHaveBeenCalledWith(
        context,
        expect.objectContaining({ kind: 'violet', outfit: 'casual' }),
        0,
      );
      expect(characterRenderer.drawPortrait).toHaveBeenCalledWith(
        context,
        expect.objectContaining({ speaker: 'npc.violet', outfit: 'casual' }),
        0,
      );
    }
  });

  it('derives the visible active speaker from deterministic world state', () => {
    const guideState = dialogueState();
    const guide = dialogueSceneContext(guideState);
    expect(guide.speakerPosition).toEqual({ x: 230, y: 620 });
    expect(guide.speakerBounds).toMatchObject({ left: 108, right: 352, bottom: 655 });
    expect(guide.night).toBe(false);
    expect(guide.lightSide).toBe('left');

    const violetState = dialogueState({ speaker: 'npc.violet', playerX: 1030, roomVariant: 'dusk' });
    violetState.player.outfit = 'casual';
    violetState.player.robeTrim = '#a779c8';
    const violet = dialogueSceneContext(violetState);
    expect(violet.speakerPosition).toEqual({ x: 1030, y: 620 });
    expect(violet.speakerBounds).toMatchObject({ left: 956, right: 1104 });
    expect(violet.night).toBe(true);
    expect(violet.violetOutfit).toBe('casual');
    expect(violet.violetRobeTrim).toBe('#a779c8');
    expect(violet.lightSide).toBe('left');

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

  it('places one stable card opposite every speaker with the portrait attached toward them', () => {
    const cases = [
      { left: 95, right: 355, top: 280, bottom: 680, expectedSide: 'right' },
      { left: 925, right: 1165, top: 300, bottom: 680, expectedSide: 'left' },
      { left: 518, right: 762, top: 280, bottom: 680, expectedSide: 'right' },
    ];

    for (const speakerBounds of cases) {
      const layout = dialogueScrollLayout({ speakerBounds });
      expect(layout.side).toBe(speakerBounds.expectedSide);
      expect(overlaps(layout.frame, speakerBounds)).toBe(false);
      expect(layout.frame.y + layout.frame.height).toBeLessThan(WORLD.height);
      expect(layout.frame.height).toBe(182);
      expect(layout.rotation).toBe(0);
      expect(layout.captionRect.width).toBeGreaterThanOrEqual(210);
      expect(layout.replayRect.width).toBeGreaterThanOrEqual(88);
      expect(layout.replayRect.height).toBeGreaterThanOrEqual(88);
      expect(layout.advanceRect.width).toBeGreaterThanOrEqual(88);
      expect(layout.advanceRect.height).toBeGreaterThanOrEqual(88);
      expect(rectsOverlap(layout.replayRect, layout.advanceRect)).toBe(false);

      const portraitRadius = 55 * layout.portrait.scale;
      const portraitBounds = {
        x: layout.portrait.x - portraitRadius,
        y: layout.portrait.y - portraitRadius,
        width: portraitRadius * 2,
        height: portraitRadius * 2,
      };
      expect(overlaps(portraitBounds, speakerBounds)).toBe(false);
      if (layout.side === 'right') {
        expect(layout.portraitSide).toBe('left');
        expect(layout.portrait.x).toBe(layout.frame.x);
        expect(layout.controlsSide).toBe('right');
        expect(layout.replayRect.x).toBeGreaterThan(layout.captionRect.x);
      } else {
        expect(layout.portraitSide).toBe('right');
        expect(layout.portrait.x).toBe(layout.frame.x + layout.frame.width);
        expect(layout.controlsSide).toBe('left');
        expect(layout.replayRect.x).toBeLessThan(layout.captionRect.x);
      }
    }
  });

  it('keeps a centered scroll when the speaker is absent or entirely above the dialogue band', () => {
    const centered = dialogueScrollLayout();
    expect(centered.side).toBe('center');
    expect(centered.portraitSide).toBe('left');
    expect(centered.captionRect.width).toBeGreaterThanOrEqual(210);
    expect(centered.rotation).toBe(0);
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
    expect(first.assignments).toEqual(second.assignments);
    // One clip belongs to the single parchment material and one to the wax
    // replay seal; there is still no nested caption panel.
    expect(first.calls.filter(([name]) => name === 'clip')).toHaveLength(2);
    expect(first.calls.some(([name]) => name === 'rotate')).toBe(false);
  });

  it('keeps day and night materials distinct while full motion only animates the advance medallion', () => {
    const renderer = new UIRenderer({ characterRenderer: { drawPortrait: vi.fn() } });
    const dialogue = {
      type: 'line', speaker: 'npc.guide', caption: 'This way!', text: 'Come along.',
    };
    const day = recordingDialogueContext();
    const night = recordingDialogueContext();
    const later = recordingDialogueContext();

    renderer.drawDialogue(day, dialogue, 0, true, false, { night: false });
    renderer.drawDialogue(night, dialogue, 0, true, false, { night: true });
    renderer.drawDialogue(later, dialogue, 0.31, true, false, { night: false });

    expect(day.assignments).not.toEqual(night.assignments);
    expect(day.calls).not.toEqual(later.calls);
    expect(day.texts).toEqual(['This way!', 'Again']);
    expect(night.texts).toEqual(['This way!', 'Again']);
  });

  it('keeps Violet’s current outfit in her dialogue portrait', () => {
    const drawPortrait = vi.fn();
    const renderer = new UIRenderer({ characterRenderer: { drawPortrait } });
    const state = dialogueState({ speaker: 'npc.violet', keyLight: 'right' });
    state.player.outfit = 'casual';
    state.player.robeTrim = '#7a4fc9';

    renderer.drawDialogue(
      recordingDialogueContext(),
      state.dialogue,
      0,
      true,
      true,
      dialogueSceneContext(state),
    );

    expect(drawPortrait).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        speaker: 'npc.violet',
        outfit: 'casual',
        robeTrim: '#7a4fc9',
        lightSide: 'right',
      }),
      0,
    );
  });

  it('keeps the bedroom key light on Hagrid’s adjacent dialogue portrait', () => {
    const drawPortrait = vi.fn();
    const renderer = new UIRenderer({ characterRenderer: { drawPortrait } });
    const state = dialogueState({ speaker: 'npc.guide', keyLight: 'right' });

    const scene = dialogueSceneContext(state);
    expect(scene.lightSide).toBe('right');
    renderer.drawDialogue(
      recordingDialogueContext(),
      state.dialogue,
      0,
      true,
      true,
      scene,
    );

    expect(drawPortrait).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ speaker: 'npc.guide', lightSide: 'right' }),
      0,
    );
  });
});
