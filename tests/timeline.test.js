import { describe, expect, it } from 'vitest';
import { Timeline, TimelineError } from '../src/game/systems/Timeline.js';

describe('deterministic timeline', () => {
  it('samples declarative channels as pure functions of time', () => {
    const timeline = new Timeline({
      tracks: [
        { type: 'set', target: 'camera.zoom', at: 0, value: 1 },
        { type: 'tween', target: 'camera.zoom', start: 1, end: 3, from: 1, to: 2, easing: 'linear' },
      ],
    });

    expect(timeline.sample(2)).toEqual({ 'camera.zoom': 1.5 });
    expect(timeline.sample(0.5)).toEqual({ 'camera.zoom': 1 });
    expect(timeline.sample(2)).toEqual({ 'camera.zoom': 1.5 });
    expect(timeline.sample(9)).toEqual({ 'camera.zoom': 2 });
  });

  it('returns only cues crossed by an explicit range', () => {
    const timeline = new Timeline({
      tracks: [
        { type: 'cue', at: 0, event: 'audio.command', payload: { command: 'sfx', key: 'sfx.start' } },
        { type: 'cue', at: 1, event: 'particles.emit', payload: { preset: 'spark', x: 1, y: 2, count: 3 } },
      ],
    });

    expect(timeline.advance(-Infinity, 0)).toEqual([
      { at: 0, type: 'audio.command', payload: { command: 'sfx', key: 'sfx.start' } },
    ]);
    expect(timeline.advance(0, 1)).toEqual([
      { at: 1, type: 'particles.emit', payload: { preset: 'spark', x: 1, y: 2, count: 3 } },
    ]);
    const events = timeline.advance(0, 1);
    events[0].payload.count = 99;
    expect(timeline.advance(0, 1)[0].payload.count).toBe(3);
  });

  it('expands distance-ordered stagger tracks deterministically', () => {
    const timeline = new Timeline({
      tracks: [{
        type: 'stagger',
        start: 0,
        interval: 1,
        items: 'params.tiles',
        order: { by: 'distance', origin: { x: 0, y: 0 } },
        child: {
          type: 'tween', target: 'tiles.$item.departure', duration: 1,
          from: 0, to: 1, easing: 'linear',
        },
      }],
    }, {
      params: {
        tiles: [
          { id: 'far', x: 20, y: 0 },
          { id: 'near', x: 2, y: 0 },
        ],
      },
    });

    expect(timeline.sample(0.5)).toEqual({ 'tiles.near.departure': 0.5 });
    expect(timeline.sample(1.5)).toEqual({
      'tiles.near.departure': 1,
      'tiles.far.departure': 0.5,
    });
  });

  it('fails loudly for invalid time ranges and unresolved stagger data', () => {
    const unresolved = {
      tracks: [{
        type: 'stagger', start: 0, interval: 1, items: 'params.tiles', order: { by: 'source' },
        child: { type: 'tween', target: '$item.x', duration: 1, from: 0, to: 1, easing: 'linear' },
      }],
    };
    expect(() => new Timeline(unresolved)).toThrow(TimelineError);

    const timeline = new Timeline({ tracks: [] });
    expect(() => timeline.sample(-1)).toThrow(TimelineError);
    expect(() => timeline.advance(2, 1)).toThrow(TimelineError);
  });
});
