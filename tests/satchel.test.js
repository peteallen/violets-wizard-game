import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { cards } from '../src/game/content/cards.js';
import { chapter1Map } from '../src/game/content/chapters/ch1.js';
import { resolveAsset } from '../src/game/core/assetManifest.js';
import { buildMapState, MAP_FOG_STATES } from '../src/game/core/MapState.js';
import { buildCardAlbumEntries, UI_RECTS } from '../src/game/render/UIRenderer.js';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function gameStub() {
  const game = Object.create(Game.prototype);
  game.world = {
    overlay: { surface: 'satchel', tab: 'map' },
    closeOverlay: vi.fn(),
    drainEvents: () => [],
    runActions: vi.fn(),
  };
  game.sound = { playSfx: vi.fn(), speak: vi.fn() };
  game.updateStatus = vi.fn();
  return game;
}

describe('satchel card album', () => {
  it('lays out earned and locked production cards as large touch targets', () => {
    const entries = buildCardAlbumEntries(cards, ['morgana']);
    expect(entries.map(({ id, earned }) => ({ id, earned }))).toEqual([
      { id: 'morgana', earned: true },
      { id: 'dumbledore', earned: false },
    ]);
    for (const entry of entries) {
      expect(entry.__rect.width).toBeGreaterThanOrEqual(88);
      expect(entry.__rect.height).toBeGreaterThanOrEqual(88);
      expect(resolveAsset(entry.portraitAsset)).toContain('/assets/art/cards/');
    }
    expect(UI_RECTS.satchelMapTab.height).toBeGreaterThanOrEqual(88);
    expect(UI_RECTS.satchelCardsTab.height).toBeGreaterThanOrEqual(88);
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

  it('preserves unlocked map travel from the map tab', () => {
    const game = gameStub();
    const locationRect = { x: 225, y: 285, width: 210, height: 180 };
    const state = {
      overlay: { surface: 'satchel', tab: 'map' },
      unlockedRooms: ['ch1.ollivanders'],
      __mapLocations: [{ id: 'ch1.ollivanders', __rect: locationRect }],
    };
    game.handleOverlayTap(center(locationRect), state);
    expect(game.world.closeOverlay).toHaveBeenCalledOnce();
    expect(game.world.runActions).toHaveBeenCalledWith(chapter1Map.locations[1].onSelect);
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/travel', 'flourish');
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
