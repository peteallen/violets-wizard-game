import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { chapter1 } from '../src/game/content/chapters/ch1.js';
import { contentRegistry } from '../src/game/content/index.js';
import {
  ROBE_TRIMS,
  normalizeRobeTrim,
  robeTrimColor,
} from '../src/game/core/RobeTrims.js';
import {
  UIRenderer,
  robePickerLayout,
} from '../src/game/render/UIRenderer.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function recordingContext() {
  const calls = [];
  const texts = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'fillRect', 'lineTo', 'moveTo', 'quadraticCurveTo', 'restore', 'rotate', 'save',
    'scale', 'stroke', 'translate',
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
      if (property === 'measureText') return (text) => ({ width: String(text).length * 10 });
      if (property === 'fillText' || property === 'strokeText') {
        return (text, ...position) => {
          texts.push(String(text));
          calls.push([property, String(text), ...position]);
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

function createRobeWorld(existingTrim = 'rose') {
  const save = createSaveV1({
    now: '2026-07-13T18:30:00.000Z',
    appVersion: 'robe-picker-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch1',
    scene: 'ch1.robeShopping',
    room: 'ch1.malkins',
    spawn: 'malkins.entry',
  };
  Object.assign(save.progress.questFlags, {
    'ch1.letterRead': true,
    'ch1.wallOpened': true,
    'ch1.diagonReached': true,
    'ch1.satchelReceived': true,
    'ch1.mapUsed': true,
    'ch1.wandChosen': true,
  });
  save.character.wandId = 'violet-first-wand';
  save.character.appearance.robeTrim = existingTrim;
  return { save, world: new World({ chapters: contentRegistry, save, seed: 42 }) };
}

describe('touch-first robe picker', () => {
  it('offers twelve named, visually distinct trims while preserving the legacy save strings', () => {
    expect(ROBE_TRIMS).toHaveLength(12);
    expect(new Set(ROBE_TRIMS.map(({ id }) => id)).size).toBe(12);
    expect(new Set(ROBE_TRIMS.map(({ label }) => label)).size).toBe(12);
    expect(new Set(ROBE_TRIMS.map(({ color }) => color)).size).toBe(12);
    expect(ROBE_TRIMS.map(({ id }) => id)).toEqual(expect.arrayContaining([
      'purple', 'rose', 'teal', 'gold',
    ]));
    expect(robeTrimColor('purple')).toBe('#7a4fc9');
    expect(robeTrimColor('rose')).toBe('#b95873');
    expect(robeTrimColor('teal')).toBe('#3f8c88');
    expect(robeTrimColor('gold')).toBe('#d4a944');
    expect(normalizeRobeTrim('missing')).toBe('purple');
  });

  it('replaces the old dialogue cards with an overlay and delays progression until confirmation', () => {
    const fitting = chapter1.dialogues['ch1.tailor.fitting'];
    expect(fitting.nodes.trim).toEqual({
      type: 'end',
      actions: [{ type: 'ui.open', surface: 'robe-picker' }],
    });
    expect(Object.values(fitting.nodes).some(({ type }) => type === 'choice')).toBe(false);

    const { save, world } = createRobeWorld('rose');
    world.runAction({ type: 'dialogue.start', script: 'ch1.tailor.fitting' });
    world.advanceDialogue();

    expect(world.dialogue.active).toBe(false);
    expect(world.overlay).toEqual({
      surface: 'robe-picker',
      tab: null,
      selectedTrim: 'rose',
    });
    expect(world.flags['ch1.trimChosen']).not.toBe(true);

    expect(world.selectRobeTrim('emerald')).toBe(true);
    expect(world.overlay.selectedTrim).toBe('emerald');
    expect(save.character.appearance.robeTrim).toBe('rose');
    expect(world.player.robeTrim).toBe('#b95873');
    expect(world.player.outfit).toBe('robes');
    expect(world.flags['ch1.trimChosen']).not.toBe(true);

    expect(world.confirmRobeTrim()).toBe(true);
    expect(world.overlay).toBeNull();
    expect(world.flags['ch1.trimChosen']).toBe(true);
    expect(save.character.appearance.robeTrim).toBe('emerald');
    expect(world.dialogue.presentation()).toMatchObject({
      scriptId: 'ch1.tailor.done',
      speaker: 'npc.tailor',
      caption: 'Lovely!',
    });
  });

  it('keeps Violet in normal clothes while she previews and gives her robes only on confirmation', () => {
    const { save, world } = createRobeWorld(null);
    expect(save.character.appearance.robeTrim).toBeNull();
    expect(world.player.outfit).toBe('casual');

    world.runAction({ type: 'ui.open', surface: 'robe-picker' });
    expect(world.player.outfit).toBe('casual');
    world.selectRobeTrim('lavender');

    expect(world.overlay.selectedTrim).toBe('lavender');
    expect(save.character.appearance.robeTrim).toBeNull();
    expect(world.player.outfit).toBe('casual');

    world.confirmRobeTrim();

    expect(save.character.appearance.robeTrim).toBe('lavender');
    expect(world.player.outfit).toBe('robes');
  });

  it('draws a live full-body preview and twelve generous organic swatches', () => {
    const characterRenderer = { draw: vi.fn() };
    const renderer = new UIRenderer({ characterRenderer });
    const context = recordingContext();
    const state = { overlay: { surface: 'robe-picker', selectedTrim: 'sky' } };

    const layout = renderer.drawRobePicker(context, state, 4.2, false);

    expect(layout).toEqual(robePickerLayout('sky'));
    expect(layout.swatches).toHaveLength(12);
    expect(layout.swatches.filter(({ selected }) => selected).map(({ id }) => id)).toEqual(['sky']);
    expect(layout.swatches.every(({ rect }) => rect.width >= 80 && rect.height >= 100)).toBe(true);
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        kind: 'violet',
        outfit: 'robes',
        scale: 1.68,
        robeTrim: '#4e83b7',
      }),
      4.2,
    );
    expect(new Set(context.texts)).toEqual(new Set([
      'Choose a colour',
      ...ROBE_TRIMS.map(({ label }) => label),
      'That one!',
    ]));
    expect(context.calls.filter(([name]) => name === 'bezierCurveTo').length).toBeGreaterThan(120);
    expect(context.depth).toBe(0);
  });

  it('routes swatch and confirmation taps without advancing an abstract dialogue choice', () => {
    const game = Object.create(Game.prototype);
    const state = {
      targets: [],
      cameraX: 0,
      dialogue: null,
      overlay: { surface: 'robe-picker', selectedTrim: 'purple' },
    };
    game.world = {
      selectRobeTrim: vi.fn(() => true),
      confirmRobeTrim: vi.fn(() => true),
      advanceDialogue: vi.fn(),
    };
    game.sound = { playSfx: vi.fn() };
    game.processWorldEvents = vi.fn();

    const layout = robePickerLayout('purple');
    const emerald = layout.swatches.find(({ id }) => id === 'emerald');
    game.handleOverlayTap(center(emerald.rect), state);

    expect(game.world.selectRobeTrim).toHaveBeenCalledWith('emerald');
    expect(game.world.advanceDialogue).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/choice', 'chime');

    game.handleOverlayTap(center(layout.confirm), state);
    expect(game.world.confirmRobeTrim).toHaveBeenCalledOnce();
    expect(game.world.advanceDialogue).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenLastCalledWith('sfx/ui/page', 'tap');
    expect(game.processWorldEvents).toHaveBeenCalledTimes(2);
  });

  it('publishes one semantic target for every swatch and one for confirmation', () => {
    const game = Object.create(Game.prototype);
    const state = {
      targets: [],
      cameraX: 0,
      dialogue: null,
      overlay: { surface: 'robe-picker', selectedTrim: 'gold' },
    };
    game.screen = 'playing';
    game.world = { snapshot: () => state };
    game.lastRenderState = state;
    game.debug = false;
    game.replayMode = false;
    game.resumeRecap = null;

    const targets = game.semanticTargets();
    const robeTargets = targets.filter(({ id }) => id.startsWith('robe.'));

    expect(robeTargets).toHaveLength(13);
    for (const swatch of robePickerLayout('gold').swatches) {
      expect(robeTargets).toContainEqual({ id: `robe.trim.${swatch.id}`, ...center(swatch.rect) });
    }
    expect(robeTargets).toContainEqual({ id: 'robe.confirm', ...center(robePickerLayout('gold').confirm) });
    expect(targets.map(({ id }) => id)).not.toContain('dialogue.advance');
  });
});
