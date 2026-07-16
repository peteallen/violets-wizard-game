import { describe, expect, it } from 'vitest';
import {
  composeSceneRoom,
  resolveChapterSceneState,
  selectRuntimeScene,
} from '../src/game/world/chapterSceneRuntime.js';

function save(flags = {}) {
  return {
    progress: { questFlags: flags },
    character: { house: null },
  };
}

const room = Object.freeze({
  id: 'ch2.greatHall',
  occupants: Object.freeze([{ npc: 'npc.violet', x: 200, y: 610 }]),
  hotspots: Object.freeze([{ id: 'ch2.greatHall.card' }]),
  exits: Object.freeze([]),
  ambientSetPieces: Object.freeze(['ch2.candles']),
});

const early = Object.freeze({
  id: 'ch2.scene.arrival',
  order: 10,
  room: room.id,
  when: { allFlags: ['ch2.arrived'] },
});

const sorting = Object.freeze({
  id: 'ch2.scene.sorting',
  order: 20,
  room: room.id,
  when: { allFlags: ['ch2.arrived'], noFlags: ['ch2.sorted'] },
  roomVariant: 'sorting',
  layer: Object.freeze({
    occupants: Object.freeze([{ npc: 'npc.sortingHat', x: 650, y: 390 }]),
    hotspots: Object.freeze([{ id: 'ch2.greatHall.hat' }]),
    exits: Object.freeze([]),
    ambientSetPieces: Object.freeze(['ch2.sortingGlow']),
  }),
});

const chapterV2 = Object.freeze({
  contractVersion: 2,
  scenes: Object.freeze({ [early.id]: early, [sorting.id]: sorting }),
  rooms: Object.freeze({ [room.id]: room }),
});

describe('chapter scene runtime', () => {
  it('uses explicit order for a version-two room with multiple eligible scenes', () => {
    expect(selectRuntimeScene({
      chapter: chapterV2,
      roomId: room.id,
      save: save({ 'ch2.arrived': true }),
    })).toBe(sorting);
  });

  it('preserves an eligible saved scene instead of skipping ahead after reload', () => {
    expect(selectRuntimeScene({
      chapter: chapterV2,
      roomId: room.id,
      savedSceneId: early.id,
      save: save({ 'ch2.arrived': true }),
    })).toBe(early);
  });

  it('merges story-layer elements without changing the physical room', () => {
    const effective = composeSceneRoom(room, sorting);

    expect(effective.occupants.map(({ npc }) => npc)).toEqual(['npc.violet', 'npc.sortingHat']);
    expect(effective.hotspots.map(({ id }) => id)).toEqual(['ch2.greatHall.card', 'ch2.greatHall.hat']);
    expect(effective.ambientSetPieces).toEqual(['ch2.candles', 'ch2.sortingGlow']);
    expect(room.occupants).toHaveLength(1);
    expect(Object.isFrozen(effective.occupants)).toBe(true);
  });

  it('retains legacy insertion-order selection and derives the v2 room variant', () => {
    const legacy = {
      contractVersion: 1,
      scenes: { first: early, second: sorting },
      rooms: { [room.id]: room },
    };
    const currentSave = save({ 'ch2.arrived': true });

    expect(selectRuntimeScene({ chapter: legacy, roomId: room.id, save: currentSave })).toBe(early);
    expect(resolveChapterSceneState({
      chapter: chapterV2,
      roomId: room.id,
      save: currentSave,
      legacyRoomVariant: 'base',
    })).toMatchObject({ scene: sorting, roomVariant: 'sorting' });
  });
});
