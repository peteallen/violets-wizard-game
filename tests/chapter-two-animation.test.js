import { describe, expect, it, vi } from 'vitest';
import {
  chapter2PresentationPackage,
  drawGryffindorGreatHallBanners,
  drawSortingCeremonyAtmosphere,
  drawTrainCompartmentMotion,
  sortingCeremonyMotionState,
  trainCompartmentMotionState,
} from '../src/game/chapters/ch2/presentation.js';
import { chapter2V2 } from '../src/game/chapters/ch2/content-v2/index.js';
import { sortingHatSpeechMotionState } from '../src/game/characters/sorting-hat/runtime.js';
import { drawProductionRoomVariantBackground } from '../src/game/presentation/productionRoomVariantOverlays.js';
import {
  chapterTwoLakeMotionState,
  chapterTwoSortingCeremonyState,
} from '../src/game/render/SetPieceRenderer.js';

function recordingContext() {
  const calls = [];
  const assignments = [];
  const methods = new Set([
    'beginPath', 'bezierCurveTo', 'clip', 'closePath', 'fill', 'lineTo', 'moveTo',
    'fillRect', 'quadraticCurveTo', 'restore', 'rotate', 'save', 'scale', 'stroke', 'translate',
  ]);
  const target = { calls, assignments };
  return new Proxy(target, {
    get(object, property) {
      if (methods.has(property)) {
        return (...args) => calls.push([property, ...args]);
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

describe('Chapter Two deterministic set-piece motion', () => {
  it('registers the train and Sorting atmospheres with their owning chapter', () => {
    expect(chapter2PresentationPackage.roomVariantOverlays.map(({ id }) => id)).toEqual([
      'ch2.presentation.trainCompartment',
      'ch2.presentation.sortingGreatHall',
      'ch2.presentation.greatHallGryffindor',
    ]);
  });

  it('moves the train painting and passing scenery only in full motion', () => {
    const first = trainCompartmentMotionState(1.25);
    const replayed = trainCompartmentMotionState(1.25);
    expect(first).toEqual(replayed);
    expect(Math.abs(first.carriageY)).toBeGreaterThan(0);
    expect(Math.abs(first.carriageRoll)).toBeGreaterThan(0);
    expect(first.sceneryTravel).toBeGreaterThan(0);

    expect(trainCompartmentMotionState(9, { reducedMotion: true })).toMatchObject({
      sceneryTravel: 0,
      carriageY: 0,
      carriageRoll: 0,
      reducedMotion: true,
    });

    const context = recordingContext();
    const drawBackground = vi.fn();
    expect(drawProductionRoomVariantBackground(context, {
      roomId: 'ch2.trainCompartment',
      variant: 'base',
      time: 1.25,
      reducedMotion: false,
    }, drawBackground)).toBe(true);
    expect(drawBackground).toHaveBeenCalledOnce();
    expect(context.calls.some(([method, amount]) => method === 'rotate' && amount !== 0)).toBe(true);
  });

  it('freezes the complete train overlay for reduced motion', () => {
    const first = recordingContext();
    const later = recordingContext();
    drawTrainCompartmentMotion(first, { time: 1, reducedMotion: true });
    drawTrainCompartmentMotion(later, { time: 8, reducedMotion: true });
    expect(first.calls).toEqual(later.calls);
    expect(first.assignments).toEqual(later.assignments);
  });

  it('uses wider motion for near lake layers and freezes the boat when requested', () => {
    const state = chapterTwoLakeMotionState(1, 3.2);
    expect(Math.abs(state.nearParallax)).toBeGreaterThan(Math.abs(state.midParallax));
    expect(Math.abs(state.midParallax)).toBeGreaterThan(Math.abs(state.farParallax));
    expect(Math.abs(state.boatBob)).toBeGreaterThan(0);
    expect(Math.abs(state.boatYaw)).toBeGreaterThan(0);

    expect(chapterTwoLakeMotionState(2, 3.2, { reducedMotion: true })).toMatchObject({
      boatBob: 0,
      boatYaw: 0,
      farParallax: 0,
      midParallax: 0,
      nearParallax: 0,
      reducedMotion: true,
    });
  });

  it('stages Sorting as candle response, announcement, banners, then cheer', () => {
    expect(chapterTwoSortingCeremonyState(0, 3.6)).toMatchObject({
      candleResponse: 0,
      announcement: 0,
      banner: 0,
      cheer: 0,
    });
    const middle = chapterTwoSortingCeremonyState(2, 3.6);
    expect(middle.candleResponse).toBeGreaterThan(0.9);
    expect(middle.announcement).toBe(1);
    expect(middle.banner).toBe(1);
    expect(middle.cheer).toBeGreaterThan(0);
    expect(chapterTwoSortingCeremonyState(0, 3.6, { reducedMotion: true })).toMatchObject({
      announcement: 1,
      banner: 1,
      hatPulse: 0,
      reducedMotion: true,
    });
  });

  it('hangs the persistent Gryffindor identity as shaped cloth without flat fill strips', () => {
    const context = recordingContext();

    drawGryffindorGreatHallBanners(context, { cameraX: 0 });

    expect(context.calls.some(([method]) => method === 'fillRect')).toBe(false);
    expect(context.calls.filter(([method]) => method === 'bezierCurveTo').length)
      .toBeGreaterThan(30);
    expect(context.calls.filter(([method]) => method === 'fill').length)
      .toBeGreaterThanOrEqual(10);
  });

  it('lets candlelight answer the speaking Hat without moving in reduced motion', () => {
    const speaking = sortingCeremonyMotionState(1.2, { speaking: true });
    const silent = sortingCeremonyMotionState(1.2, { speaking: false });
    expect(speaking.candleResponse).toBeGreaterThan(silent.candleResponse);
    expect(speaking.hatPulse).toBeGreaterThan(silent.hatPulse);

    const first = recordingContext();
    const replayed = recordingContext();
    const request = {
      time: 1.2,
      reducedMotion: false,
      state: {
        sceneId: 'ch2.scene.sorting',
        dialogue: { type: 'line', speaker: 'ch2.npc.sortingHat' },
      },
    };
    drawSortingCeremonyAtmosphere(first, request);
    drawSortingCeremonyAtmosphere(replayed, request);
    expect(first.calls).toEqual(replayed.calls);
    expect(first.assignments).toEqual(replayed.assignments);
  });

  it('keeps the Hat ground-anchored while adding a restrained speaking pulse', () => {
    const first = sortingHatSpeechMotionState(0.3, { speaking: true });
    const later = sortingHatSpeechMotionState(0.7, { speaking: true });
    expect(first).not.toEqual(later);
    expect(Math.abs(first.scale - 1)).toBeLessThanOrEqual(0.012);
    expect(Math.abs(later.scale - 1)).toBeLessThanOrEqual(0.012);
    expect(sortingHatSpeechMotionState(4, { speaking: true, reducedMotion: true }))
      .toEqual({ scale: 1, y: 0, reducedMotion: true });
  });

  it('captures the true final frame of every Chapter Two set piece', () => {
    for (const setPiece of Object.values(chapter2V2.setPieces)) {
      expect(setPiece.verification.keyframes, setPiece.id).toContain(0.5);
      expect(setPiece.verification.keyframes, setPiece.id).toContain(1);
      expect(setPiece.verification.keyframes.at(-1), setPiece.id).toBe(setPiece.duration);
    }
    const sorting = chapter2V2.setPieces['ch2.setPiece.sortingReveal'];
    expect(sorting.duration).toBe(3.6);
    expect(sorting.timeline.tracks).toContainEqual(expect.objectContaining({
      type: 'cue',
      at: 0.88,
      payload: expect.objectContaining({ key: 'sfx/ch2/gryffindor-cheer' }),
    }));
  });
});
