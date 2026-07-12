import { afterEach, describe, expect, it, vi } from 'vitest';
import { clamp, easeInOutCubic, pointInCircle } from '../src/game/core/math.js';
import { SeededRandom } from '../src/game/core/rng.js';
import { SoundEngine } from '../src/game/core/SoundEngine.js';
import { Game } from '../src/game/Game.js';
import { UI_RECTS } from '../src/game/render/UIRenderer.js';

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

    sound.stopMusic();
    expect(sound.music).toBeNull();
    expect(sound.musicKey).toBeNull();
  });
});

describe('Game audio commands', () => {
  it('routes authored timeline cues into the appropriate sound channel', () => {
    const game = Object.create(Game.prototype);
    game.sound = {
      playSfx: vi.fn(),
      speak: vi.fn(),
      stopVoice: vi.fn(),
      playMusic: vi.fn(),
      stopMusic: vi.fn(),
    };

    game.handleAudioCommand({ command: 'sfx', key: 'sfx/ch1/brickClack' });
    game.handleAudioCommand({ command: 'voice', key: 'voice/ch1/guide/arrival' });
    game.handleAudioCommand({ command: 'music', key: 'music/ch1/chapterTriumph', mode: 'crossfade' });
    game.handleAudioCommand({ command: 'music', key: 'music/ch1/chapterTriumph', mode: 'stop' });
    game.handleAudioCommand({ command: 'stopVoice' });

    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ch1/brickClack', 'chime');
    expect(game.sound.speak).toHaveBeenCalledWith('voice/ch1/guide/arrival');
    expect(game.sound.playMusic).toHaveBeenCalledWith('music/ch1/chapterTriumph');
    expect(game.sound.stopMusic).toHaveBeenCalledOnce();
    expect(game.sound.stopVoice).toHaveBeenCalledOnce();
  });
});

describe('Game dialogue controls', () => {
  it('replays the current voiced line without advancing the story', () => {
    const game = Object.create(Game.prototype);
    game.shouldShowDebugReset = () => false;
    game.shouldShowReplayExit = () => false;
    game.sound = { unlock: vi.fn(() => Promise.resolve()), playSfx: vi.fn() };
    game.replayMode = false;
    game.screen = 'playing';
    game.resumeRecap = null;
    game.lastRenderState = { setPiece: null, dialogue: { type: 'line' }, overlay: null };
    game.world = {
      dialogue: { replay: vi.fn() },
      advanceDialogue: vi.fn(),
    };
    game.processWorldEvents = vi.fn();

    game.handleTap({
      x: UI_RECTS.dialogueReplay.x + UI_RECTS.dialogueReplay.width / 2,
      y: UI_RECTS.dialogueReplay.y + UI_RECTS.dialogueReplay.height / 2,
    });

    expect(game.world.dialogue.replay).toHaveBeenCalledOnce();
    expect(game.world.advanceDialogue).not.toHaveBeenCalled();
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });
});

describe('Game lifecycle', () => {
  it('releases the room renderer when the game is destroyed', () => {
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      running: true,
      destroyed: false,
      sessionGeneration: 0,
      saveManager: { destroy: vi.fn() },
      sound: { destroy: vi.fn() },
      roomRenderer: { destroy: vi.fn() },
      saveTransferDialog: { destroy: vi.fn() },
      motionQuery: { removeEventListener: vi.fn() },
      canvas: { removeEventListener: vi.fn() },
      debug: false,
      boundResize: vi.fn(),
      boundVisibility: vi.fn(),
      boundMotionChanged: vi.fn(),
      boundPointerDown: vi.fn(),
      boundPointerMove: vi.fn(),
      boundPointerUp: vi.fn(),
      boundPointerCancel: vi.fn(),
      boundKeyDown: vi.fn(),
    });
    vi.stubGlobal('window', { removeEventListener: vi.fn() });
    vi.stubGlobal('document', { removeEventListener: vi.fn() });

    game.destroy();

    expect(game.roomRenderer.destroy).toHaveBeenCalledOnce();
    expect(game.destroyed).toBe(true);
    expect(game.running).toBe(false);
  });
});
