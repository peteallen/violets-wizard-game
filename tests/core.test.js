import { afterEach, describe, expect, it, vi } from 'vitest';
import { clamp, easeInOutCubic, pointInCircle } from '../src/game/core/math.js';
import { SeededRandom } from '../src/game/core/rng.js';
import { SoundEngine } from '../src/game/core/SoundEngine.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

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

describe('SoundEngine', () => {
  it('keeps dialogue at full voice volume while ducking and restoring music', async () => {
    const createdAudio = [];
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.currentTime = 0;
        this.playCalls = 0;
        this.pauseCalls = 0;
        createdAudio.push(this);
      }

      play() {
        this.playCalls += 1;
        return Promise.resolve();
      }

      pause() {
        this.pauseCalls += 1;
      }
    }
    vi.stubGlobal('Audio', FakeAudio);

    const sound = new SoundEngine({
      resolveAsset: (key) => `/assets/${key}.mp3`,
      volumes: { master: 1, voice: 1, music: 1 },
    });

    await sound.playMusic('music/ch1/bedroom');
    expect(sound.music.volume).toBe(1);

    await sound.speak('voice/ch1/guide/arrival', 'Come with me!');
    expect(createdAudio).toHaveLength(2);
    expect(sound.voice.volume).toBe(1);
    expect(sound.music.volume).toBeCloseTo(0.4);

    sound.voice.onended();
    expect(sound.voice).toBeNull();
    expect(sound.music.volume).toBe(1);
  });
});
