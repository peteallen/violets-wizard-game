import { describe, expect, it } from 'vitest';
import { clamp, easeInOutCubic, pointInCircle } from '../src/game/core/math.js';
import { SeededRandom } from '../src/game/core/rng.js';

describe('math helpers', () => {
  it('clamps and detects circular hit targets', () => {
    expect(clamp(14, 0, 10)).toBe(10);
    expect(pointInCircle({ x: 4, y: 3 }, { x: 0, y: 0, r: 5 })).toBe(true);
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });
});

describe('SeededRandom', () => {
  it('replays the same sequence and isolates named streams', () => {
    const first = new SeededRandom('violet');
    const second = new SeededRandom('violet');
    expect([first.next(), first.next(), first.next()]).toEqual([second.next(), second.next(), second.next()]);
    expect(first.fork('sparkles').next()).toBe(second.fork('sparkles').next());
  });
});
