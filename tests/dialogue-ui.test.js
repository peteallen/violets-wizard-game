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

function rectsOverlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function rectFromBounds(bounds) {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
  };
}

function dialogueState({
  speaker = 'npc.guide',
  playerX = 1040,
  roomVariant = 'base',
  keyLight = 'left',
} = {}) {
  const player = actor('npc.violet', 'character.violet', {
    x: playerX,
    y: 620,
    facing: 'left',
    appearance: 'robes',
    robeTrim: '#7a4fc9',
    layoutBounds: { x: -74, y: -228, width: 148, height: 260 },
  });
  const guide = actor('npc.guide', 'character.hagrid', {
    x: 230,
    y: 620,
    facing: 'right',
    layoutBounds: { x: -122, y: -340, width: 244, height: 375 },
  });
  const portraitCharacterId = speaker === 'npc.violet'
    ? 'character.violet'
    : speaker === 'npc.narrator'
      ? 'character.narrator'
      : 'character.hagrid';
  return {
    cameraX: 0,
    keyLight,
    roomVariant,
    player: { x: playerX, y: 620, facing: 'left' },
    occupants: [{ npc: 'npc.guide', x: 230, y: 620, facing: 'right' }],
    actors: [player, guide],
    targets: [],
    setPiece: null,
    overlay: null,
    dialogue: { type: 'line', speaker, portraitCharacterId, caption: 'This way!' },
  };
}

function actor(actorId, characterId, renderState) {
  return { actorId, characterId, depth: renderState.y, renderState };
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
  it('requires one injected renderer and an exact canonical portrait identity', () => {
    expect(() => new UIRenderer()).toThrow('requires an injected character renderer with draw()');
    const draw = vi.fn();
    const renderer = new UIRenderer({ characterRenderer: { draw } });
    const context = recordingDialogueContext();
    expect(() => renderer.drawDialogue(context, {
      type: 'line', speaker: 'npc.guide', portraitPose: 'talk', caption: 'This way!',
    }, 1.25, true, false)).toThrow('require an exact portraitCharacterId');

    renderer.drawDialogue(context, {
      type: 'line', speaker: 'npc.guide', portraitCharacterId: 'character.hagrid',
      portraitPose: 'talk', caption: 'This way!',
    }, 1.25, true, false);

    expect(draw).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        characterId: 'character.hagrid', surface: 'portrait', pose: 'speaking',
      }),
      1.25,
    );
    expect(context.calls.some(([name]) => name === 'ellipse')).toBe(false);
  });

  it('keeps the silent pre-Malkin Violet beside a narrator-owned review caption', () => {
    const characterRenderer = { draw: vi.fn() };
    const renderer = new UIRenderer({ characterRenderer });

    for (const scene of ['ui-dialogue-center-review']) {
      const context = recordingDialogueContext();
      context.createLinearGradient = () => ({ addColorStop: () => {} });
      characterRenderer.draw.mockClear();

      expect(renderer.drawReviewScene(context, scene, 0, { reducedMotion: true })).toBe(true);
      expect(characterRenderer.draw).toHaveBeenCalledWith(
        context,
        expect.objectContaining({
          characterId: 'character.violet', surface: 'world', appearance: 'casual',
        }),
        0,
      );
      expect(characterRenderer.draw).toHaveBeenCalledWith(
        context,
        expect.objectContaining({
          characterId: 'character.narrator', surface: 'portrait', pose: 'speaking',
        }),
        0,
      );
    }
  });

  it('derives the visible active speaker from deterministic world state', () => {
    const guideState = dialogueState();
    const guide = dialogueSceneContext(guideState);
    expect(guide.speakerPosition).toEqual({ x: 230, y: 620 });
    expect(guide.speakerBounds).toMatchObject({ left: 108, right: 352, bottom: 655 });
    expect(guide.characterBounds.map(({ id }) => id)).toEqual(['npc.violet', 'npc.guide']);
    expect(guide.night).toBe(false);
    expect(guide.lightSide).toBe('left');

    const violetState = dialogueState({ speaker: 'npc.violet', playerX: 1030, roomVariant: 'dusk' });
    Object.assign(violetState.actors[0].renderState, {
      appearance: 'casual',
      robeTrim: '#a779c8',
    });
    const violet = dialogueSceneContext(violetState);
    expect(violet.speakerPosition).toEqual({ x: 1030, y: 620 });
    expect(violet.speakerBounds).toMatchObject({ left: 956, right: 1104 });
    expect(violet.night).toBe(true);
    expect(violet.portraitRenderState).toMatchObject({
      appearance: 'casual',
      robeTrim: '#a779c8',
    });
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
    world.update(2);
    world.runAction({ type: 'dialogue.start', script: 'ch1.tailor.done' });

    const shop = world.snapshot();
    expect(shop.roomId).toBe('ch1.malkins');
    expect(shop.roomVariant).toBe('base');
    expect(shop.dialogue).toMatchObject({ speaker: 'npc.tailor', caption: 'Lovely!' });
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

      const portraitBounds = rectFromBounds(layout.portraitBounds);
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

  it('keeps the live bedroom card, real cameo, and controls clear of Hagrid, Violet, and the objective scenery', () => {
    const state = {
      cameraX: 0,
      roomId: 'ch1.bedroom',
      sceneId: 'ch1.guideArrival',
      roomVariant: 'base',
      player: { kind: 'violet', x: 360, y: 610, facing: 'left' },
      occupants: [{ npc: 'npc.guide', x: 250, y: 610, facing: 'right' }],
      actors: [
        actor('npc.violet', 'character.violet', {
          x: 360, y: 610, facing: 'left',
          layoutBounds: { x: -74, y: -228, width: 148, height: 260 },
        }),
        actor('npc.guide', 'character.hagrid', {
          x: 250, y: 610, facing: 'right',
          layoutBounds: { x: -122, y: -340, width: 244, height: 375 },
        }),
      ],
      pet: null,
      targets: [{
        id: 'bedroom.guide',
        hitArea: { shape: 'circle', x: 250, y: 455, radius: 95 },
        salience: { tier: 'thread' },
      }],
      dialogue: {
        type: 'line', speaker: 'npc.guide', portraitCharacterId: 'character.hagrid',
        caption: 'Come with me!',
      },
    };
    const scene = dialogueSceneContext(state);
    const layout = dialogueScrollLayout(scene);
    const surfaces = [layout.frame, rectFromBounds(layout.portraitBounds), layout.replayRect, layout.advanceRect];

    expect(scene.characterBounds.map(({ id }) => id)).toEqual(['npc.violet', 'npc.guide']);
    expect(scene.sceneryBounds.map(({ id }) => id)).toEqual(['scenery:bedroom.guide']);
    expect(layout.side).toBe('right');
    expect(layout.frame.x).toBe(526);
    for (const surface of surfaces) {
      for (const bounds of scene.avoidBounds) expect(overlaps(surface, bounds)).toBe(false);
    }
  });

  it('moves the same one-card design above a crowded live cast when neither bottom side is clear', () => {
    const state = {
      cameraX: 0,
      roomId: 'ch1.menagerie',
      sceneId: 'ch1.petShopping',
      roomVariant: 'base',
      player: { kind: 'violet', x: 390, y: 610, facing: 'left' },
      occupants: [{ npc: 'npc.menagerieKeeper', x: 270, y: 610, facing: 'right' }],
      actors: [
        actor('npc.violet', 'character.violet', { x: 390, y: 610, facing: 'left' }),
        actor('npc.menagerieKeeper', 'character.menagerie-keeper', {
          x: 270, y: 610, facing: 'right',
        }),
        actor('npc.pet.cat', 'character.cat', { x: 650, y: 585, facing: 'right' }),
        actor('npc.pet.owl', 'character.pet-owl', { x: 900, y: 520, facing: 'right' }),
        actor('npc.pet.toad', 'character.toad', { x: 1110, y: 595, facing: 'right' }),
      ],
      pet: null,
      targets: [],
      dialogue: {
        type: 'line', speaker: 'npc.menagerieKeeper',
        portraitCharacterId: 'character.menagerie-keeper', caption: 'Choose a pet!',
      },
    };
    const scene = dialogueSceneContext(state);
    const layout = dialogueScrollLayout(scene);
    const surfaces = [layout.frame, rectFromBounds(layout.portraitBounds), layout.replayRect, layout.advanceRect];

    expect(scene.characterBounds.map(({ id }) => id)).toEqual([
      'npc.violet',
      'npc.menagerieKeeper',
      'npc.pet.cat',
      'npc.pet.owl',
      'npc.pet.toad',
    ]);
    expect(layout.side).toBe('center');
    expect(layout.frame.y).toBe(32);
    for (const surface of surfaces) {
      for (const bounds of scene.characterBounds) expect(overlaps(surface, bounds)).toBe(false);
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
    const renderer = new UIRenderer({ characterRenderer: { draw: vi.fn() } });
    const dialogue = {
      type: 'line', speaker: 'npc.guide', portraitCharacterId: 'character.hagrid',
      speakerLabel: 'Hagrid', caption: 'This way!',
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

  it('renders a runtime pet name without allowing unsupported authored captions', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: vi.fn() } });
    const dialogue = {
      type: 'line', speaker: 'npc.guide', portraitCharacterId: 'character.hagrid',
      caption: 'Juniper!',
    };
    const namedPet = recordingDialogueContext();
    const authoredCaption = recordingDialogueContext();

    renderer.drawDialogue(namedPet, { ...dialogue, captionRole: 'proper-name' }, 0, true, true);
    renderer.drawDialogue(authoredCaption, dialogue, 0, true, true);

    expect(namedPet.texts).toEqual(['Juniper!', 'Again']);
    expect(authoredCaption.texts).toEqual(['Again']);
  });

  it('keeps day and night materials distinct while full motion only animates the advance medallion', () => {
    const renderer = new UIRenderer({ characterRenderer: { draw: vi.fn() } });
    const dialogue = {
      type: 'line', speaker: 'npc.guide', portraitCharacterId: 'character.hagrid',
      caption: 'This way!', text: 'Come along.',
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
    const draw = vi.fn();
    const renderer = new UIRenderer({ characterRenderer: { draw } });
    const state = dialogueState({ speaker: 'npc.violet', keyLight: 'right' });
    Object.assign(state.actors[0].renderState, {
      appearance: 'casual',
      robeTrim: '#7a4fc9',
    });

    renderer.drawDialogue(
      recordingDialogueContext(),
      state.dialogue,
      0,
      true,
      true,
      dialogueSceneContext(state),
    );

    expect(draw).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        characterId: 'character.violet',
        surface: 'portrait',
        appearance: 'casual',
        robeTrim: '#7a4fc9',
        lightSide: 'right',
      }),
      0,
    );
  });

  it('keeps the bedroom key light on Hagrid’s adjacent dialogue portrait', () => {
    const draw = vi.fn();
    const renderer = new UIRenderer({ characterRenderer: { draw } });
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

    expect(draw).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        characterId: 'character.hagrid', surface: 'portrait', lightSide: 'right',
      }),
      0,
    );
  });
});
