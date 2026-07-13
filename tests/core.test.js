import { afterEach, describe, expect, it, vi } from 'vitest';
import { clamp, easeInOutCubic, pointInCircle } from '../src/game/core/math.js';
import { SeededRandom } from '../src/game/core/rng.js';
import { SoundEngine } from '../src/game/core/SoundEngine.js';
import { Game, roomTransitionState } from '../src/game/Game.js';
import { UI_RECTS } from '../src/game/render/UIRenderer.js';

afterEach(() => {
  vi.useRealTimers();
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

  it('crossfades two music elements and keeps the mix correct through runtime controls', async () => {
    vi.useFakeTimers();
    const createdAudio = [];
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.muted = false;
        this.currentTime = 12;
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
      volumes: { master: 1, music: 1 },
    });

    await sound.playMusic('music/bedroom');
    await sound.playMusic('music/diagon', { mode: 'crossfade', fadeSeconds: 0.8 });

    const [bedroom, diagon] = createdAudio;
    expect(sound.music).toBe(diagon);
    expect(sound.outgoingMusic).toBe(bedroom);
    expect(bedroom.volume).toBe(1);
    expect(diagon.volume).toBe(0);

    await vi.advanceTimersByTimeAsync(400);
    expect(bedroom.volume).toBeCloseTo(0.5);
    expect(diagon.volume).toBeCloseTo(0.5);

    sound.setVolumes({ music: 0.5 });
    expect(bedroom.volume).toBeCloseTo(0.25);
    expect(diagon.volume).toBeCloseTo(0.25);

    sound.duckMusic(true);
    expect(bedroom.volume).toBeCloseTo(0.1);
    expect(diagon.volume).toBeCloseTo(0.1);

    sound.setMuted(true);
    expect(bedroom.muted).toBe(true);
    expect(diagon.muted).toBe(true);
    expect(bedroom.volume).toBe(0);
    expect(diagon.volume).toBe(0);

    sound.setMuted(false);
    sound.pause();
    await vi.advanceTimersByTimeAsync(1000);
    expect(bedroom.volume).toBeCloseTo(0.1);
    expect(diagon.volume).toBeCloseTo(0.1);

    await sound.resume();
    await vi.advanceTimersByTimeAsync(400);
    expect(sound.outgoingMusic).toBeNull();
    expect(sound.musicFade).toBeNull();
    expect(bedroom.pauseCalls).toBeGreaterThan(0);
    expect(bedroom.currentTime).toBe(0);
    expect(diagon.volume).toBeCloseTo(0.2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves hard replacement and releases every music element through stop and destroy', async () => {
    vi.useFakeTimers();
    const createdAudio = [];
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.currentTime = 7;
        this.pauseCalls = 0;
        createdAudio.push(this);
      }

      play() {
        return Promise.resolve();
      }

      pause() {
        this.pauseCalls += 1;
      }
    }
    vi.stubGlobal('Audio', FakeAudio);

    const sound = new SoundEngine({ resolveAsset: (key) => `/assets/${key}.mp3` });
    await sound.playMusic('music/one');
    await sound.playMusic('music/two');
    expect(createdAudio[0].pauseCalls).toBe(1);
    expect(createdAudio[0].currentTime).toBe(0);
    expect(sound.outgoingMusic).toBeNull();

    await sound.playMusic('music/three', { mode: 'crossfade', fadeSeconds: 1 });
    sound.stopAll();

    expect(createdAudio[1].pauseCalls).toBe(1);
    expect(createdAudio[1].currentTime).toBe(0);
    expect(createdAudio[2].pauseCalls).toBe(1);
    expect(createdAudio[2].currentTime).toBe(0);
    expect(sound.music).toBeNull();
    expect(sound.outgoingMusic).toBeNull();
    expect(sound.musicFade).toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    await sound.playMusic('music/four');
    await sound.playMusic('music/five', { mode: 'crossfade', fadeSeconds: 1 });
    sound.destroy();

    expect(createdAudio[3].pauseCalls).toBe(1);
    expect(createdAudio[3].currentTime).toBe(0);
    expect(createdAudio[4].pauseCalls).toBe(1);
    expect(createdAudio[4].currentTime).toBe(0);
    expect(sound.music).toBeNull();
    expect(sound.outgoingMusic).toBeNull();
    expect(sound.musicFade).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retries a rejected replacement on resume even while the old track remains active', async () => {
    const createdAudio = [];
    let rejectReplacementOnce = true;
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.currentTime = 0;
        this.pauseCalls = 0;
        this.playCalls = 0;
        createdAudio.push(this);
      }

      play() {
        this.playCalls += 1;
        if (this.source.endsWith('/new.mp3') && rejectReplacementOnce) {
          rejectReplacementOnce = false;
          return Promise.reject(new Error('autoplay interrupted'));
        }
        return Promise.resolve();
      }

      pause() {
        this.pauseCalls += 1;
      }
    }
    vi.stubGlobal('Audio', FakeAudio);

    const sound = new SoundEngine({ resolveAsset: (key) => `/assets/${key}.mp3` });
    await sound.playMusic('old');
    await sound.playMusic('new', { mode: 'crossfade', fadeSeconds: 0.8 });

    expect(sound.music).toBe(createdAudio[0]);
    expect(sound.musicKey).toBe('old');
    expect(sound.pendingMusic).toBe('new');

    await sound.resume();

    expect(createdAudio).toHaveLength(3);
    expect(createdAudio[0].playCalls).toBe(2);
    expect(sound.music).toBe(createdAudio[2]);
    expect(sound.musicKey).toBe('new');
    expect(sound.pendingMusic).toBeNull();
    expect(sound.outgoingMusic).toBe(createdAudio[0]);
    sound.destroy();
  });

  it('keeps only the latest overlapping asynchronous music request', async () => {
    const createdAudio = [];
    const deferred = new Map();
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.currentTime = 4;
        this.pauseCalls = 0;
        createdAudio.push(this);
      }

      play() {
        if (this.source.endsWith('/old.mp3')) return Promise.resolve();
        return new Promise((resolve) => deferred.set(this.source, resolve));
      }

      pause() {
        this.pauseCalls += 1;
      }
    }
    vi.stubGlobal('Audio', FakeAudio);

    const sound = new SoundEngine({ resolveAsset: (key) => `/assets/${key}.mp3` });
    await sound.playMusic('old');
    const firstRequest = sound.playMusic('first');
    const latestRequest = sound.playMusic('latest');

    deferred.get('/assets/latest.mp3')();
    await latestRequest;
    deferred.get('/assets/first.mp3')();
    await firstRequest;

    expect(sound.music).toBe(createdAudio[2]);
    expect(sound.musicKey).toBe('latest');
    expect(createdAudio[1].pauseCalls).toBe(1);
    expect(createdAudio[1].currentTime).toBe(0);

    sound.pendingMusic = 'stale';
    sound.pendingMusicOptions = { mode: 'crossfade', fadeSeconds: 1 };
    await sound.playMusic('latest');
    expect(sound.pendingMusic).toBeNull();
    expect(sound.pendingMusicOptions).toBeNull();
    sound.destroy();
  });

  it('keeps a crossfade paused when resume play promises settle after a later pause', async () => {
    vi.useFakeTimers();
    const createdAudio = [];
    const completePlay = new Map();
    let deferPlayback = false;
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.currentTime = 0;
        this.playing = false;
        createdAudio.push(this);
      }

      play() {
        if (!deferPlayback) {
          this.playing = true;
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          completePlay.set(this.source, () => {
            this.playing = true;
            resolve();
          });
        });
      }

      pause() {
        this.playing = false;
      }
    }
    vi.stubGlobal('Audio', FakeAudio);

    const sound = new SoundEngine({ resolveAsset: (key) => `/assets/${key}.mp3` });
    await sound.playMusic('old');
    await sound.playMusic('new', { mode: 'crossfade', fadeSeconds: 1 });
    sound.pause();
    deferPlayback = true;

    const resuming = sound.resume();
    completePlay.get('/assets/old.mp3')();
    await Promise.resolve();
    await Promise.resolve();
    expect(completePlay.has('/assets/new.mp3')).toBe(true);

    sound.pause();
    completePlay.get('/assets/new.mp3')();
    await resuming;

    expect(sound.paused).toBe(true);
    expect(createdAudio[0].playing).toBe(false);
    expect(createdAudio[1].playing).toBe(false);
    expect(sound.musicFade.startedAt).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    sound.destroy();
  });

  it.each(['stopAll', 'destroy'])('cancels a pending resume when %s runs first', async (action) => {
    let completePlay;
    let deferPlayback = false;
    class FakeAudio {
      constructor(source) {
        this.source = source;
        this.volume = 1;
        this.currentTime = 0;
        this.playing = false;
      }

      play() {
        if (!deferPlayback) {
          this.playing = true;
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          completePlay = () => {
            this.playing = true;
            resolve();
          };
        });
      }

      pause() {
        this.playing = false;
      }
    }
    vi.stubGlobal('Audio', FakeAudio);

    const sound = new SoundEngine({ resolveAsset: (key) => `/assets/${key}.mp3` });
    await sound.playMusic('theme');
    const music = sound.music;
    sound.pause();
    deferPlayback = true;

    const resuming = sound.resume();
    sound[action]();
    completePlay();
    await resuming;

    expect(music.playing).toBe(false);
    expect(sound.music).toBeNull();
    expect(sound.musicFade).toBeNull();
    if (action !== 'destroy') sound.destroy();
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
    game.handleAudioCommand({ command: 'music', key: 'music/ch1/chapterTriumph', mode: 'crossfade', fadeSeconds: 1.2 });
    game.handleAudioCommand({ command: 'music', key: 'music/ch1/violetTheme', mode: 'play' });
    game.handleAudioCommand({ command: 'music', key: 'music/ch1/chapterTriumph', mode: 'stop' });
    game.handleAudioCommand({ command: 'stopVoice' });

    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ch1/brickClack', 'chime');
    expect(game.sound.speak).toHaveBeenCalledWith('voice/ch1/guide/arrival');
    expect(game.sound.playMusic).toHaveBeenNthCalledWith(
      1,
      'music/ch1/chapterTriumph',
      { mode: 'crossfade', fadeSeconds: 1.2 },
    );
    expect(game.sound.playMusic).toHaveBeenNthCalledWith(2, 'music/ch1/violetTheme', { mode: 'play' });
    expect(game.sound.stopMusic).toHaveBeenCalledOnce();
    expect(game.sound.stopVoice).toHaveBeenCalledOnce();
  });

  it('uses a short crossfade when ordinary room music changes', () => {
    const game = Object.create(Game.prototype);
    game.sound = { playMusic: vi.fn() };
    game.world = { roomId: 'ch1.diagonStreet' };

    game.updateMusic();
    game.world.roomId = 'ch1.ollivanders';
    game.updateMusic();

    expect(game.sound.playMusic).toHaveBeenNthCalledWith(
      1,
      'music/ch1/diagonAlley',
      { mode: 'crossfade', fadeSeconds: 0.8 },
    );
    expect(game.sound.playMusic).toHaveBeenNthCalledWith(
      2,
      'music/ch1/violetTheme',
      { mode: 'crossfade', fadeSeconds: 0.8 },
    );
  });
});

describe('Game chapter handoff', () => {
  it('does not initialize a chapter twice when the authored travel already changed it', () => {
    const game = Object.create(Game.prototype);
    game.world = {
      chapter: { id: 'ch2' },
      changeChapter: vi.fn(),
    };
    game.processWorldEvents = vi.fn();

    game.handleWorldEvent({
      type: 'chapter.completed',
      payload: { chapter: 'ch1', nextChapter: 'ch2' },
    });

    expect(game.world.changeChapter).not.toHaveBeenCalled();
    expect(game.processWorldEvents).not.toHaveBeenCalled();
  });
});

describe('room transition choreography', () => {
  function transitionGame({ source = { width: 1280, height: 720 } } = {}) {
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      simTime: 0,
      transitionAlpha: 0,
      roomTransition: {
        effect: 'ink',
        elapsed: 0,
        origin: { x: 640, y: 360 },
        source,
        ready: true,
        readiness: Promise.resolve(null),
        readinessAttempt: 0,
        readinessTimer: null,
        cancelReadiness: null,
        preparedScale: 1,
      },
      deferredTransitionAudio: [],
      reducedMotion: false,
      destroyed: false,
      screen: 'playing',
      resumeRecap: null,
      pointer: null,
      parentGateProgress: 0,
      particles: { update: vi.fn() },
      sound: { speak: vi.fn(), playSfx: vi.fn() },
      processWorldEvents: vi.fn(),
    });
    game.updateParentGate = vi.fn();
    return { game, source };
  }

  it('grows an eight-point organic reveal far enough to uncover every corner', () => {
    const origin = { x: 1120, y: 470 };
    const start = roomTransitionState(0, { origin, effect: 'ink' });
    const middle = roomTransitionState(0.3, { origin, effect: 'ink' });
    const finish = roomTransitionState(0.6, { origin, effect: 'ink' });

    expect(start.points).toHaveLength(8);
    expect(start.coverageRadius).toBe(0);
    expect(middle.coverageRadius).toBeGreaterThan(0);
    expect(finish.linearProgress).toBe(1);
    expect(finish.coverageRadius).toBeGreaterThan(Math.hypot(origin.x, origin.y));
    expect(new Set(middle.points.map((point) => Math.round(Math.hypot(point.x - origin.x, point.y - origin.y)))).size).toBeGreaterThan(3);
  });

  it('uses a short calm crossfade when reduced motion is enabled', () => {
    const reduced = roomTransitionState(0.125, { effect: 'ink', reducedMotion: true });
    expect(reduced.kind).toBe('crossfade');
    expect(reduced.duration).toBe(0.25);
    expect(reduced.progress).toBeCloseTo(0.5);
  });

  it('freezes world and set-piece time until the transition has fully completed', () => {
    const { game, source } = transitionGame();
    const setPiece = { time: 1.25 };
    game.world = {
      setPieces: { active: setPiece },
      update: vi.fn((dt) => { setPiece.time += dt; }),
    };

    game.update(0.3);
    game.update(0.31);

    expect(game.world.update).not.toHaveBeenCalled();
    expect(setPiece.time).toBe(1.25);
    expect(game.roomTransition).toBeNull();
    expect([source.width, source.height]).toEqual([1, 1]);

    game.update(1 / 60);

    expect(game.world.update).toHaveBeenCalledOnce();
    expect(setPiece.time).toBeCloseTo(1.25 + 1 / 60);
    expect(game.processWorldEvents).toHaveBeenCalledOnce();
  });

  it('holds the complete source frame until the destination room is ready', () => {
    const { game } = transitionGame();
    game.world = { update: vi.fn() };
    game.roomTransition.ready = false;

    game.update(0.3);

    expect(game.roomTransition.elapsed).toBe(0);
    expect(game.world.update).not.toHaveBeenCalled();

    game.roomTransition.ready = true;
    game.update(0.1);

    expect(game.roomTransition.elapsed).toBeCloseTo(0.1);
    expect(game.world.update).not.toHaveBeenCalled();
  });

  it('uses a bounded fallback when destination decoding never settles', async () => {
    vi.useFakeTimers();
    const { game } = transitionGame();
    game.dpr = 1;
    game.scale = 1;
    game.world = { room: { id: 'ch1.courtyard' }, snapshot: vi.fn(() => ({ roomId: 'ch1.courtyard' })) };
    game.roomRenderer = {
      preloadRoom: vi.fn(() => new Promise(() => {})),
      logger: { warn: vi.fn() },
    };

    const readiness = game.prepareRoomTransitionDestination();
    await vi.advanceTimersByTimeAsync(2500);
    await readiness;

    expect(game.roomTransition.ready).toBe(true);
    expect(game.roomRenderer.logger.warn).toHaveBeenCalledWith(
      'Destination room preparation timed out; revealing the procedural fallback.',
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets only the current scale preparation mark a transition ready', async () => {
    const { game } = transitionGame();
    game.dpr = 1;
    game.scale = 1;
    game.world = { room: { id: 'ch1.courtyard' }, snapshot: vi.fn(() => ({ roomId: 'ch1.courtyard' })) };
    const completions = [];
    game.roomRenderer = {
      preloadRoom: vi.fn(() => new Promise((resolve) => completions.push(resolve))),
      logger: { warn: vi.fn() },
    };

    const first = game.prepareRoomTransitionDestination();
    game.scale = 0.8;
    const second = game.prepareRoomTransitionDestination();
    completions[0]('stale-cache');
    await first;
    expect(game.roomTransition.ready).toBe(false);

    completions[1]('current-cache');
    await second;
    expect(game.roomTransition.ready).toBe(true);
    expect(game.roomTransition.preparedScale).toBe(0.8);
  });

  it('defers a destination voice line and flushes it only after releasing the source canvas', () => {
    const { game, source } = transitionGame();
    game.sound.speak.mockImplementation(() => {
      expect([source.width, source.height]).toEqual([1, 1]);
    });
    game.world = {
      dialoguePresentation: {
        voice: 'voice/ch1/guide/wall',
        text: 'Three taps on the bricks, Violet.',
      },
    };
    game.updateStatus = vi.fn();

    game.handleWorldEvent({ type: 'dialogue.lineChanged', payload: {} });

    expect(game.sound.speak).not.toHaveBeenCalled();
    expect(game.deferredTransitionAudio).toEqual([{
      type: 'voice',
      key: 'voice/ch1/guide/wall',
      text: 'Three taps on the bricks, Violet.',
    }]);

    game.updateRoomTransition(0.61);

    expect(game.roomTransition).toBeNull();
    expect(game.deferredTransitionAudio).toEqual([]);
    expect([source.width, source.height]).toEqual([1, 1]);
    expect(game.sound.speak).toHaveBeenCalledOnce();
    expect(game.sound.speak).toHaveBeenCalledWith(
      'voice/ch1/guide/wall',
      'Three taps on the bricks, Violet.',
    );
  });

  it('does not arm a pointer that begins while a transition is active', () => {
    const { game } = transitionGame();
    game.canvas = { setPointerCapture: vi.fn() };
    game.toWorld = vi.fn(() => ({ x: 640, y: 360 }));

    game.onPointerDown({ pointerId: 17 });

    expect(game.pointer).toBeNull();
    expect(game.canvas.setPointerCapture).not.toHaveBeenCalled();
    expect(game.toWorld).not.toHaveBeenCalled();
  });

  it.each(['null', 'throw'])('shrinks a %s-context scratch canvas, evicts, and retries once', (failureMode) => {
    const failedCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => {
        if (failureMode === 'throw') throw new Error('WebKit allocation failure');
        return null;
      }),
    };
    const recoveredContext = { drawImage: vi.fn() };
    const recoveredCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => recoveredContext),
    };
    const createElement = vi.fn()
      .mockReturnValueOnce(failedCanvas)
      .mockReturnValueOnce(recoveredCanvas);
    vi.stubGlobal('document', { createElement });
    const logger = { warn: vi.fn() };
    const mainCanvas = { width: 1280, height: 720 };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      canvas: mainCanvas,
      dpr: 1,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      roomRenderer: { logger, emergencyEvict: vi.fn() },
    });

    const result = game.captureRoomTransitionSource();

    expect(result).toBe(recoveredCanvas);
    expect(createElement).toHaveBeenCalledTimes(2);
    expect([failedCanvas.width, failedCanvas.height]).toEqual([1, 1]);
    expect([recoveredCanvas.width, recoveredCanvas.height]).toEqual([1280, 720]);
    expect(game.roomRenderer.emergencyEvict).toHaveBeenCalledOnce();
    expect(game.roomRenderer.emergencyEvict).toHaveBeenCalledWith('transition-scratch');
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(recoveredContext.drawImage).toHaveBeenCalledWith(
      mainCanvas,
      0,
      0,
      1280,
      720,
      0,
      0,
      1280,
      720,
    );
  });

  it('keeps the safe-fade fallback input-blocking after both scratch attempts fail', () => {
    const failedCanvases = [0, 1].map(() => ({
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    }));
    vi.stubGlobal('document', {
      createElement: vi.fn()
        .mockReturnValueOnce(failedCanvases[0])
        .mockReturnValueOnce(failedCanvases[1]),
    });
    const state = { setPiece: null, dialogue: null, overlay: null };
    const world = { snapshot: vi.fn(() => state), tap: vi.fn() };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      canvas: { width: 1280, height: 720 },
      dpr: 1,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      roomRenderer: { logger: { warn: vi.fn() }, emergencyEvict: vi.fn() },
      roomTransition: null,
      deferredTransitionAudio: [],
      lastTapPoint: { x: 900, y: 420 },
      nextTransitionEffect: null,
      transitionAlpha: 0,
      reducedMotion: false,
      pointer: null,
      parentGateProgress: 0,
      destroyed: false,
      debug: false,
      replayMode: false,
      screen: 'playing',
      resumeRecap: null,
      world,
      lastRenderState: state,
      sound: { unlock: vi.fn(() => Promise.resolve()), playSfx: vi.fn() },
    });
    game.shouldShowDebugReset = () => false;

    expect(game.beginRoomTransition('ink')).toBe(false);
    expect(game.roomTransition).toMatchObject({ fallback: true, source: null });
    expect(game.transitionAlpha).toBe(0);
    expect(game.roomTransition.ready).toBe(true);
    for (const canvas of failedCanvases) {
      expect([canvas.width, canvas.height]).toEqual([1, 1]);
    }

    const context = { fillStyle: '', fillRect: vi.fn() };
    game.drawRoomTransition(context);
    expect(context.fillStyle).toBe('rgba(20,17,38,1)');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1280, 720);

    game.handleTap({ x: 640, y: 360 });

    expect(world.tap).not.toHaveBeenCalled();
    expect(game.sound.playSfx).toHaveBeenCalledWith('sfx/ui/tap', 'tap');
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

describe('Game development reset', () => {
  it('returns to the beginning from Alt+Shift+R in debug mode', () => {
    const game = Object.create(Game.prototype);
    game.debug = true;
    game.resetGame = vi.fn();
    const event = {
      repeat: false,
      ctrlKey: false,
      metaKey: false,
      altKey: true,
      shiftKey: true,
      key: 'R',
      preventDefault: vi.fn(),
    };

    game.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(game.resetGame).toHaveBeenCalledOnce();
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
      setPieceRenderer: { destroy: vi.fn() },
      saveTransferDialog: { destroy: vi.fn() },
      petNameDialog: { destroy: vi.fn() },
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
    expect(game.setPieceRenderer.destroy).toHaveBeenCalledOnce();
    expect(game.petNameDialog.destroy).toHaveBeenCalledOnce();
    expect(game.destroyed).toBe(true);
    expect(game.running).toBe(false);
  });
});
