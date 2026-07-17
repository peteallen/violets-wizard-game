import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { cards } from '../src/game/content/cards.js';
import { chapter1Map } from '../src/game/content/chapters/ch1.js';
import { contentRegistry } from '../src/game/content/index.js';
import { resolveAsset } from '../src/game/core/assetManifest.js';
import { buildMapState, MAP_FOG_STATES } from '../src/game/core/MapState.js';
import { buildCardAlbumEntries, UIRenderer, UI_RECTS } from '../src/game/render/UIRenderer.js';
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

function gameStub() {
  const game = Object.create(Game.prototype);
  game.world = {
    chapter: { id: 'ch1' },
    overlay: { surface: 'satchel', tab: 'map' },
    closeOverlay: vi.fn(),
    drainEvents: () => [],
    runActions: vi.fn(),
  };
  game.sound = { playSfx: vi.fn(), speak: vi.fn() };
  game.updateStatus = vi.fn();
  game.uiRenderer = new UIRenderer({ characterRenderer: { draw: () => {} } });
  game.simTime = 0;
  game.reducedMotion = false;
  game.parentGateProgress = 0;
  game.render = vi.fn();
  return game;
}

describe('satchel card album', () => {
  it('lays out earned and locked production cards as large touch targets', () => {
    const entries = buildCardAlbumEntries(cards, ['morgana']);
    expect(entries.map(({ id, earned }) => ({ id, earned }))).toEqual([
      { id: 'morgana', earned: true },
      { id: 'dumbledore', earned: false },
      { id: 'merlin', earned: false },
      { id: 'jocunda-sykes', earned: false },
    ]);
    for (const entry of entries) {
      expect(entry.__rect.width).toBeGreaterThanOrEqual(88);
      expect(entry.__rect.height).toBeGreaterThanOrEqual(88);
      expect(entry.__rect.y + entry.__rect.height).toBeLessThanOrEqual(652);
      expect(resolveAsset(entry.portraitAsset)).toContain('/assets/art/cards/');
    }
    expect(entries.slice(0, 2).every((entry) => entry.__rect.x + entry.__rect.width < 640)).toBe(true);
    expect(entries.slice(2).every((entry) => entry.__rect.x > 640)).toBe(true);
    expect(UI_RECTS.satchelMapTab.height).toBeGreaterThanOrEqual(88);
    expect(UI_RECTS.satchelCardsTab.height).toBeGreaterThanOrEqual(88);
    expect(UI_RECTS.satchelStartOver.width).toBeGreaterThanOrEqual(88);
    expect(UI_RECTS.satchelStartOver.height).toBeGreaterThanOrEqual(88);
  });

  it('switches tabs before interpreting map or card content', () => {
    const game = gameStub();
    const state = { overlay: { surface: 'satchel', tab: 'map' } };
    game.handleOverlayTap(center(UI_RECTS.satchelCardsTab), state);
    expect(game.world.overlay).toEqual({ surface: 'satchel', tab: 'cards' });

    state.overlay.tab = 'cards';
    game.handleOverlayTap(center(UI_RECTS.satchelMapTab), state);
    expect(game.world.overlay).toEqual({ surface: 'satchel', tab: 'map' });
  });

  it('reads an earned card aloud and keeps a locked portrait hidden', () => {
    const game = gameStub();
    const slots = buildCardAlbumEntries(cards, ['morgana']);
    const state = { overlay: { surface: 'satchel', tab: 'cards' }, __cardSlots: slots };

    game.handleOverlayTap(center(slots[0].__rect), state);
    expect(game.sound.speak).toHaveBeenCalledWith(cards[0].voice, cards[0].text);
    expect(game.updateStatus).toHaveBeenCalledWith(cards[0].text);

    game.handleOverlayTap(center(slots[1].__rect), state);
    expect(game.sound.speak).toHaveBeenCalledTimes(1);
    expect(game.sound.playSfx).toHaveBeenLastCalledWith('sfx/ui/locked', 'fizzle');
  });

  it('offers Start fresh on every satchel tab and resets only after confirmation', () => {
    const game = gameStub();
    game.startOverPreservingSettings = vi.fn();

    game.handleOverlayTap(center(UI_RECTS.satchelStartOver), {
      overlay: { surface: 'satchel', tab: 'map' },
    });

    expect(game.startOverPreservingSettings).not.toHaveBeenCalled();
    expect(game.world.overlay).toMatchObject({
      surface: 'parent',
      page: 'confirm-start-over',
      returnTo: 'satchel',
      returnTab: 'map',
    });

    game.handleParentPanelTap(center(UI_RECTS.parentCancelConfirm), game.world.overlay);
    expect(game.world.overlay).toEqual({ surface: 'satchel', tab: 'map' });
    expect(game.startOverPreservingSettings).not.toHaveBeenCalled();

    game.handleOverlayTap(center(UI_RECTS.satchelStartOver), {
      overlay: { surface: 'satchel', tab: 'cards' },
    });
    game.handleParentPanelTap(center(UI_RECTS.parentAcceptConfirm), game.world.overlay);
    expect(game.startOverPreservingSettings).toHaveBeenCalledTimes(1);
  });

  it('preserves unlocked map travel from the map tab', () => {
    const game = gameStub();
    const state = {
      overlay: { surface: 'satchel', tab: 'map' },
      roomId: 'ch1.diagonStreet',
      unlockedRooms: ['ch1.ollivanders'],
    };
    const originalState = structuredClone(state);
    const presentation = game.uiRenderer.mapPresentation(state);
    const location = presentation.hitTargets.find(({ id }) => id === 'map.ch1.ollivanders');

    game.handleOverlayTap(center(location.hitArea), state);

    expect(game.world.closeOverlay).toHaveBeenCalledOnce();
    expect(game.world.runActions).toHaveBeenCalledWith(chapter1Map.locations[1].onSelect);
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/travel', 'flourish');
    expect(state).toEqual(originalState);
  });

  it('keeps the map field and generous location targets beneath every visible satchel control', () => {
    const game = gameStub();
    const state = {
      overlay: { surface: 'satchel', tab: 'map' },
      roomId: 'ch1.diagonStreet',
      unlockedRooms: ['ch1.ollivanders'],
    };
    const presentation = game.uiRenderer.mapPresentation(state);
    const controls = [
      UI_RECTS.satchelMapTab,
      UI_RECTS.satchelCardsTab,
      UI_RECTS.satchelKeyhole,
      UI_RECTS.satchelStartOver,
      UI_RECTS.close,
    ];
    const headerBottom = Math.max(...controls.map((rect) => rect.y + rect.height));

    expect(presentation.field.y).toBeGreaterThan(headerBottom);
    for (const control of controls) {
      expect(rectsOverlap(presentation.field, control)).toBe(false);
    }
    for (const target of presentation.hitTargets) {
      expect(target.hitArea.width).toBeGreaterThanOrEqual(88);
      expect(target.hitArea.height).toBeGreaterThanOrEqual(88);
      for (const control of controls) {
        expect(rectsOverlap(target.hitArea, control)).toBe(false);
      }
    }
  });

  it('keeps softly fogged map destinations non-travelling but still tappable', () => {
    const game = gameStub();
    const state = {
      overlay: { surface: 'satchel', tab: 'map' },
      roomId: 'ch1.diagonStreet',
      unlockedRooms: ['ch1.ollivanders'],
    };
    const presentation = game.uiRenderer.mapPresentation(state);
    const location = presentation.hitTargets.find(({ id }) => id === 'map.ch1.menagerie');

    expect(location.enabled).toBe(false);
    game.handleOverlayTap(center(location.hitArea), state);

    expect(game.world.runActions).not.toHaveBeenCalled();
    expect(game.world.closeOverlay).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/locked', 'fizzle');
  });

  it('exposes the frozen map layout through stable harness semantic targets', () => {
    const game = gameStub();
    const state = {
      overlay: { surface: 'satchel', tab: 'map' },
      roomId: 'ch1.diagonStreet',
      unlockedRooms: ['ch1.ollivanders'],
      targets: [],
      cameraX: 0,
      dialogue: null,
    };
    game.screen = 'playing';
    game.lastRenderState = state;
    game.resumeRecap = null;
    game.world.snapshot = () => state;
    game.shouldShowDebugReset = () => false;
    game.shouldShowReplayExit = () => false;

    const mapTargets = game.semanticTargets()
      .filter(({ id }) => id.startsWith('satchel.map.ch1.'));

    expect(mapTargets.map(({ id }) => id)).toEqual([
      'satchel.map.ch1.diagonStreet',
      'satchel.map.ch1.ollivanders',
      'satchel.map.ch1.malkins',
      'satchel.map.ch1.menagerie',
    ]);
    expect(mapTargets.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
  });

  it('keeps a Chapter Two save in Chapter Two even when stale input points at the Chapter One map', () => {
    const save = createSaveV1({
      now: '2026-07-16T18:00:00.000Z',
      appVersion: 'chapter-two-satchel-test',
      worldSeed: 42,
    });
    save.resume = {
      chapter: 'ch2',
      scene: 'ch2.scene.kingsCross',
      room: 'ch2.kingsCross',
      spawn: 'start',
    };
    save.progress.highestUnlockedChapter = 2;
    save.progress.completedChapters = ['ch1'];
    save.progress.questFlags['ch1.complete'] = true;
    save.progress.questFlags['ch1.satchelReceived'] = true;
    save.character.wandId = 'violet-first-wand';

    const world = new World({ chapters: contentRegistry, save, seed: 42 });
    const game = Object.create(Game.prototype);
    game.screen = 'playing';
    game.debug = false;
    game.replayMode = false;
    game.resumeRecap = null;
    game.roomTransition = null;
    game.lastRenderState = null;
    game.simTime = 0;
    game.reducedMotion = false;
    game.world = world;
    game.sound = {
      unlock: vi.fn(() => Promise.resolve()),
      playSfx: vi.fn(),
      speak: vi.fn(),
    };
    game.updateStatus = vi.fn();
    game.processWorldEvents = vi.fn();
    game.shouldShowDebugReset = () => false;
    game.shouldShowReplayExit = () => false;
    game.uiRenderer = new UIRenderer({ characterRenderer: { draw: () => {} } });

    game.handleTap(center(UI_RECTS.satchel));
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'cards' });

    game.handleOverlayTap(center(UI_RECTS.satchelMapTab), world.snapshot());
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'cards' });
    expect(game.sound.playSfx).toHaveBeenCalledTimes(1);
    expect(game.sound.playSfx).toHaveBeenLastCalledWith('sfx/ui/parchment', 'chime');

    world.overlay = { surface: 'satchel', tab: 'map' };
    const staleMapState = world.snapshot();
    const staleLocation = game.uiRenderer.mapPresentation(staleMapState)
      .hitTargets.find(({ id }) => id === 'map.ch1.diagonStreet');
    const chapterBeforeTap = world.chapter.id;
    const roomBeforeTap = world.roomId;

    game.handleOverlayTap(center(staleLocation.hitArea), staleMapState);

    expect(world.chapter.id).toBe(chapterBeforeTap);
    expect(world.roomId).toBe(roomBeforeTap);
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'cards' });
    expect(game.sound.playSfx).toHaveBeenLastCalledWith('sfx/ui/locked', 'fizzle');

    world.overlay = { surface: 'satchel', tab: 'map' };
    const semanticIds = game.semanticTargets(world.snapshot()).map(({ id }) => id);
    expect(semanticIds).not.toContain('satchel.map');
    expect(semanticIds.some((id) => id.startsWith('satchel.map.ch1.'))).toBe(false);
  });
});

describe('satchel map model', () => {
  it('derives objective, fog, routes, and travel intent without mutating the world snapshot', () => {
    const snapshot = {
      roomId: 'ch1.ollivanders',
      unlockedRooms: ['ch1.ollivanders', 'ch1.malkins'],
      objective: {
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.malkinsDoor' },
      },
    };
    const originalSnapshot = structuredClone(snapshot);

    const model = buildMapState(chapter1Map, snapshot);
    const locations = Object.fromEntries(model.locations.map((location) => [location.id, location]));

    expect(snapshot).toEqual(originalSnapshot);
    expect(model.objectiveLocationId).toBe('map.ch1.malkins');
    expect(locations['map.ch1.diagonStreet'].fogState).toBe(MAP_FOG_STATES.clear);
    expect(locations['map.ch1.malkins']).toMatchObject({
      unlocked: true,
      isObjective: true,
      fogState: MAP_FOG_STATES.clear,
      travelIntent: { type: 'travel.request', room: 'ch1.malkins', spawn: 'entry' },
    });
    expect(locations['map.ch1.menagerie']).toMatchObject({
      unlocked: false,
      isObjective: false,
      fogState: MAP_FOG_STATES.soft,
      travelIntent: null,
    });
    expect(locations['map.ch1.malkins'].vignette).toEqual(
      chapter1Map.locations.find((location) => location.id === 'map.ch1.malkins').vignette,
    );
    expect(model.routes.at(-1)).toMatchObject({ unlocked: false, fogState: MAP_FOG_STATES.soft });
    expect(model).not.toHaveProperty('asset');
    expect(Object.isFrozen(model.locations)).toBe(true);
    expect(buildMapState(chapter1Map, snapshot)).toEqual(model);
  });

  it('matches objective markers by both room and hotspot', () => {
    const model = buildMapState(chapter1Map, {
      unlockedRooms: [],
      objective: {
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.notAMapTarget' },
      },
    });

    expect(model.objectiveLocationId).toBeNull();
    expect(model.locations.every((location) => !location.isObjective)).toBe(true);
  });
});
