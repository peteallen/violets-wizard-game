import { afterEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { chapter1 } from '../src/game/content/chapters/ch1.js';
import { contentRegistry } from '../src/game/content/index.js';
import {
  ROBE_TRIMS,
  normalizeRobeTrim,
  robeTrimColor,
} from '../src/game/core/RobeTrims.js';
import {
  UI_REVIEW_SCENES,
  UIRenderer,
  robePickerLayout,
} from '../src/game/render/UIRenderer.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function rectsOverlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function rectContains(container, child) {
  return child.x >= container.x
    && child.y >= container.y
    && child.x + child.width <= container.x + container.width
    && child.y + child.height <= container.y + container.height;
}

function recordingContext() {
  const calls = [];
  const assignments = [];
  const texts = [];
  let depth = 0;
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'ellipse', 'fill',
    'drawImage', 'fillRect', 'lineTo', 'moveTo', 'quadraticCurveTo', 'restore', 'rotate', 'save',
    'scale', 'stroke', 'translate',
  ]);
  const target = {
    calls,
    assignments,
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
      assignments.push([property, value]);
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
  afterEach(() => vi.unstubAllGlobals());

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
        characterId: 'character.violet',
        surface: 'world',
        appearance: 'robes',
        ...layout.previewCharacter,
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

  it('layers the decoded tailoring folio and three-sliced action note under live content', () => {
    vi.stubGlobal('Image', class TestImage {});
    const characterRenderer = { draw: vi.fn() };
    const renderer = new UIRenderer({ characterRenderer });
    const folio = { complete: true, naturalWidth: 2560, naturalHeight: 1440 };
    const actionNote = { complete: true, naturalWidth: 1200, naturalHeight: 400 };
    renderer.images.set('ui/story/robe-folio-v2', folio);
    renderer.images.set('ui/story/action-note-v2', actionNote);
    const context = recordingContext();

    const layout = renderer.drawRobePicker(context, {
      overlay: { surface: 'robe-picker', selectedTrim: 'gold' },
    }, 8.4, true);

    const imageCalls = context.calls.filter(([name]) => name === 'drawImage');
    expect(imageCalls[0]).toEqual(['drawImage', folio, 0, 0, 1280, 720]);
    expect(imageCalls.slice(1)).toHaveLength(3);
    expect(imageCalls.slice(1).every(([, image]) => image === actionNote)).toBe(true);
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        characterId: 'character.violet',
        ...layout.previewCharacter,
        robeTrim: '#d4a944',
      }),
      0,
    );
    expect(new Set(context.texts)).toEqual(new Set([
      'Choose a colour',
      ...ROBE_TRIMS.map(({ label }) => label),
      'That one!',
    ]));
    expect([...new Set(layout.swatches.map(({ rect }) => rect.x))]).toEqual([723, 827, 931, 1035]);
    expect([...new Set(layout.swatches.map(({ rect }) => rect.y))]).toEqual([156, 270, 384]);
    expect(layout.confirm).toEqual({ x: 754, y: 500, width: 338, height: 102 });
    expect(context.depth).toBe(0);
  });

  it('keeps the declared hair-to-shoes figure wholly inside the dressing-mirror glass', () => {
    const layout = robePickerLayout('purple');
    const figureBottom = layout.previewFigure.y + layout.previewFigure.height;
    const glassBottom = layout.previewGlass.y + layout.previewGlass.height;
    expect(rectContains(layout.previewGlass, layout.previewFigure)).toBe(true);
    expect(layout.previewFigure.width).toBeGreaterThan(0);
    expect(layout.previewFigure.height).toBeGreaterThan(0);
    expect(layout.previewFigure.y).toBeLessThan(layout.previewCharacter.y);
    expect(figureBottom).toBeGreaterThan(layout.previewCharacter.y);
    expect(glassBottom - figureBottom).toBeGreaterThanOrEqual(6);
    expect(Object.isFrozen(layout.previewGlass)).toBe(true);
    expect(Object.isFrozen(layout.previewCharacter)).toBe(true);
    expect(Object.isFrozen(layout.previewFigure)).toBe(true);
  });

  it('registers a deterministic real-picker review with a hue-independent selected state', () => {
    const characterRenderer = { draw: vi.fn() };
    const renderer = new UIRenderer({ characterRenderer });
    const context = recordingContext();
    const gradient = { addColorStop: vi.fn() };
    context.createLinearGradient = vi.fn(() => gradient);

    expect(UI_REVIEW_SCENES).toContain('ui-robe-picker-review');
    expect(renderer.drawReviewScene(context, 'ui-robe-picker-review', 3.25, {
      reducedMotion: true,
    })).toBe(true);
    expect(characterRenderer.draw).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        characterId: 'character.violet',
        surface: 'world',
        appearance: 'robes',
        pose: 'wonder',
        ...robePickerLayout('gold').previewCharacter,
        robeTrim: '#d4a944',
      }),
      0,
    );

    const selectedOutline = context.assignments.findIndex(([property, value], index, entries) => (
      property === 'strokeStyle'
      && value === '#382a24'
      && entries[index + 1]?.[0] === 'lineWidth'
      && entries[index + 1]?.[1] === 10
      && entries[index + 2]?.[0] === 'strokeStyle'
      && entries[index + 2]?.[1] === '#ffd76a'
      && entries[index + 3]?.[0] === 'lineWidth'
      && entries[index + 3]?.[1] === 4.5
    ));
    expect(selectedOutline).toBeGreaterThanOrEqual(0);

    const layout = robePickerLayout('gold');
    expect(layout.swatches).toHaveLength(12);
    for (let first = 0; first < layout.swatches.length; first += 1) {
      for (let second = first + 1; second < layout.swatches.length; second += 1) {
        expect(rectsOverlap(layout.swatches[first].rect, layout.swatches[second].rect)).toBe(false);
      }
      expect(rectsOverlap(layout.swatches[first].rect, layout.preview)).toBe(false);
      expect(rectsOverlap(layout.swatches[first].rect, layout.confirm)).toBe(false);
    }
    expect(rectsOverlap(layout.preview, layout.confirm)).toBe(false);
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
