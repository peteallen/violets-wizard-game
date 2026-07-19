import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function rendererReadinessGame(worldOverride = null) {
  const world = worldOverride ?? {
    setPieces: { active: null },
    objective: { text: 'Follow the story.' },
    snapshot: vi.fn(() => ({ actors: [], cameraX: 0 })),
    update: vi.fn(),
  };
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    world,
    screen: 'playing',
    simTime: 0,
    transitionAlpha: 0,
    roomTransition: null,
    sessionTransitioning: false,
    sessionGeneration: 7,
    resumeRecap: null,
    setPieceComposition: null,
    presentationFailure: null,
    presentationReadinessGeneration: 0,
    observedRendererLoadings: new WeakSet(),
    pointer: { id: 12 },
    parentGateProgress: 0.5,
    canvas: {
      hasPointerCapture: vi.fn(() => false),
      releasePointerCapture: vi.fn(),
    },
    destroyed: false,
    particles: { update: vi.fn() },
    updateStatus: vi.fn(),
    render: vi.fn(),
    updateParentGate: vi.fn(),
    updateRoomTransition: vi.fn(),
    processWorldEvents: vi.fn(),
  });
  return game;
}

describe('production composition readiness', () => {
  it('shows a retryable title failure and rejects the public boot preparation', async () => {
    const first = deferred();
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      destroyed: false,
      harness: false,
      screen: 'title',
      simTime: 0,
      reducedMotion: false,
      hasStoredSave: false,
      titleComposition: { status: 'idle', attempt: 0, promise: null, error: null },
      uiRenderer: { prepareTitle: vi.fn(() => first.promise) },
      updateStatus: vi.fn(),
      render: vi.fn(),
    });

    const preparation = game.prepareTitleComposition();
    expect(game.titleComposition.status).toBe('loading');
    expect(game.visibleCompositionStatus()).toEqual({
      status: 'loading',
      message: 'Preparing Violet’s letter…',
    });

    const error = new Error('backdrop decode failed');
    first.reject(error);
    await expect(preparation).rejects.toBe(error);
    expect(game.titleComposition.status).toBe('failed');
    expect(game.hasRetryableCompositionFailure()).toBe(true);
    expect(game.visibleCompositionStatus()).toEqual({
      status: 'failed',
      message: 'Violet’s letter could not finish loading.',
    });

    game.uiRenderer.prepareTitle.mockResolvedValue({ status: 'ready' });
    await expect(game.prepareTitleComposition({ retry: true })).resolves.toEqual({ status: 'ready' });
    expect(game.titleComposition.status).toBe('ready');
    expect(game.uiRenderer.prepareTitle).toHaveBeenLastCalledWith(expect.objectContaining({ retry: true }));
  });

  it('keeps the busy title and defers room music until room and visible actor frames are ready', async () => {
    const room = deferred();
    const actor = deferred();
    const save = { resume: { chapter: 'ch1' } };
    const state = {
      roomId: 'ch1.bedroom',
      cameraX: 0,
      keyLight: 'left',
      actors: [{
        characterId: 'character.violet',
        renderState: { x: 640, y: 650, pose: 'idle', appearance: 'casual' },
      }],
      dialogue: null,
    };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      destroyed: false,
      harness: false,
      screen: 'title',
      simTime: 0,
      dpr: 1,
      scale: 1,
      reducedMotion: false,
      sessionGeneration: 0,
      sessionTransitioning: false,
      hasStoredSave: false,
      saveData: save,
      titleComposition: { status: 'ready', attempt: 1, promise: null, error: null },
      deferredTransitionAudio: [],
      prepareChapterRuntime: vi.fn().mockResolvedValue(null),
      presentationRegistry: { activateChapter: vi.fn().mockResolvedValue(null) },
      characterScopes: {
        activateChapter: vi.fn().mockResolvedValue(['character.violet']),
        releaseTitle: vi.fn().mockResolvedValue([]),
      },
      characterRenderer: { prepare: vi.fn(() => actor.promise) },
      roomRenderer: {
        prepareRoomRequired: vi.fn(() => room.promise),
        logger: { warn: vi.fn() },
      },
      sound: { unlock: vi.fn().mockResolvedValue(), playTransitionAudio: vi.fn() },
      particles: { emit: vi.fn() },
      updateStatus: vi.fn(),
      render: vi.fn(),
      updateMusic: vi.fn(),
      preloadCurrentRoomSetPieceVariants: vi.fn().mockResolvedValue([]),
      createWorld: vi.fn(function createWorld(_save, options) {
        this.world = {
          chapter: { id: 'ch1', setPieces: {} },
          room: { id: 'ch1.bedroom', background: { layers: ['rooms/ch1/bedroom/base'] } },
          snapshot: () => state,
        };
        this.deferCompositionMusic = options.deferMusic;
      }),
    });

    const starting = game.startAdventure();
    while (!game.roomRenderer.prepareRoomRequired.mock.calls.length) await Promise.resolve();

    expect(game.screen).toBe('title');
    expect(game.sessionComposition.status).toBe('loading');
    expect(game.updateMusic).not.toHaveBeenCalled();
    expect(game.characterScopes.releaseTitle).not.toHaveBeenCalled();

    room.resolve({ status: 'ready' });
    await Promise.resolve();
    expect(game.screen).toBe('title');
    actor.resolve({ status: 'ready' });
    await expect(starting).resolves.toBe(true);

    expect(game.screen).toBe('playing');
    expect(game.characterScopes.releaseTitle).toHaveBeenCalledOnce();
    expect(game.updateMusic).toHaveBeenCalledOnce();
    expect(game.createWorld).toHaveBeenCalledWith(save, { reveal: false, deferMusic: true });
  });

  it('holds set-piece time at zero until its required prop images are decoded', async () => {
    const props = deferred();
    const active = {
      id: 'sp.test',
      requestedId: 'sp.test',
      time: 0,
      descriptor: { assets: ['rooms/ch1/courtyard/base'], params: {} },
      logicalDescriptor: { assets: [], params: {} },
    };
    const world = {
      setPieces: { active },
      room: { id: 'ch1.courtyard', background: { layers: [] }, backgroundVariants: {} },
      chapter: { id: 'ch1' },
      snapshot: vi.fn(() => ({ actors: [], setPiece: active, cameraX: 0 })),
      update: vi.fn((dt) => { active.time += dt; }),
    };
    const source = { width: 1280, height: 720 };
    const game = Object.create(Game.prototype);
    Object.assign(game, {
      world,
      screen: 'playing',
      simTime: 0,
      transitionAlpha: 0,
      roomTransition: null,
      sessionTransitioning: false,
      resumeRecap: null,
      presentationFailure: null,
      deferredSetPieceEvents: [],
      deferredTransitionAudio: [],
      reducedMotion: false,
      destroyed: false,
      particles: { update: vi.fn() },
      assetRegistry: { getAsset: vi.fn(() => ({ kind: 'image' })) },
      setPieceRenderer: { prepareImages: vi.fn(() => props.promise) },
      characterRenderer: {},
      roomRenderer: { logger: { warn: vi.fn() } },
      captureRoomTransitionSource: vi.fn(() => source),
      updateStatus: vi.fn(),
      render: vi.fn(),
      processWorldEvents: vi.fn(),
      updateParentGate: vi.fn(),
    });

    const preparing = game.prepareSetPieceComposition(active);
    game.update(1);
    expect(active.time).toBe(0);
    expect(world.update).not.toHaveBeenCalled();
    expect(game.setPieceComposition.status).toBe('loading');

    props.resolve([]);
    await preparing;
    expect(game.setPieceComposition.status).toBe('ready');
    expect([source.width, source.height]).toEqual([1, 1]);

    game.update(1);
    expect(active.time).toBe(1);
    expect(world.update).toHaveBeenCalledOnce();
  });

  it('immediately covers and freezes a genuinely blank character frame until it resolves', async () => {
    const firstFrame = deferred();
    const retry = vi.fn();
    const game = rendererReadinessGame();

    game.observeRendererResults([{ status: 'loading', loading: firstFrame.promise, retry }]);

    expect(game.pointer).toBeNull();
    expect(game.parentGateProgress).toBe(0);
    expect(game.presentationFailure).toMatchObject({
      kind: 'renderer',
      status: 'loading',
      retrying: false,
      retry,
    });
    expect(game.visibleCompositionStatus()).toEqual({
      status: 'loading',
      message: 'Preparing that picture…',
    });

    game.update(1);
    expect(game.world.update).not.toHaveBeenCalled();

    firstFrame.resolve();
    await firstFrame.promise;
    await Promise.resolve();

    expect(game.presentationFailure).toBeNull();
    game.update(1);
    expect(game.world.update).toHaveBeenCalledOnce();
  });

  it('keeps playing when a drawn character retains its last frame during a pose swap', () => {
    const nextPose = deferred();
    const game = rendererReadinessGame();

    game.observeRendererResults([{
      status: 'drawn',
      pending: true,
      loading: nextPose.promise,
      displayedAnimation: { pose: 'idle' },
    }]);

    expect(game.presentationFailure).toBeNull();
    expect(game.visibleCompositionStatus()).toBeNull();
    game.update(1);
    expect(game.world.update).toHaveBeenCalledOnce();
  });

  it('waits for every simultaneous blank frame and ignores an older completion after failure', async () => {
    const violet = deferred();
    const hagrid = deferred();
    const game = rendererReadinessGame();

    game.observeRendererResults([
      { status: 'loading', loading: violet.promise, retry: vi.fn() },
      { status: 'loading', loading: hagrid.promise, retry: vi.fn() },
    ]);
    const loadingPresentation = game.presentationFailure;
    expect(loadingPresentation.pending.size).toBe(2);

    violet.resolve();
    await violet.promise;
    await Promise.resolve();
    expect(game.presentationFailure).toBe(loadingPresentation);
    expect(loadingPresentation.pending.size).toBe(1);

    const error = new Error('Hagrid frame decode failed');
    const retry = vi.fn();
    game.observeRendererResults([{ status: 'failed', error, retry }]);
    const failedPresentation = game.presentationFailure;
    expect(failedPresentation).toMatchObject({ status: 'failed', error, retry });

    hagrid.resolve();
    await hagrid.promise;
    await Promise.resolve();
    expect(game.presentationFailure).toBe(failedPresentation);
  });

  it('keeps an older session promise from clearing a newer blank-frame generation', async () => {
    const oldFrame = deferred();
    const newFrame = deferred();
    const firstWorld = { setPieces: { active: null }, snapshot: vi.fn(), update: vi.fn() };
    const game = rendererReadinessGame(firstWorld);

    game.observeRendererResults([{ status: 'loading', loading: oldFrame.promise }]);
    const oldPresentation = game.presentationFailure;
    const transition = game.beginSessionTransition();
    expect(game.presentationFailure).toBeNull();

    game.finishSessionTransition(transition);
    game.world = { setPieces: { active: null }, snapshot: vi.fn(), update: vi.fn() };
    game.observeRendererResults([{ status: 'loading', loading: newFrame.promise }]);
    const newPresentation = game.presentationFailure;
    expect(newPresentation).not.toBe(oldPresentation);

    oldFrame.resolve();
    await oldFrame.promise;
    await Promise.resolve();
    expect(game.presentationFailure).toBe(newPresentation);

    newFrame.resolve();
    await newFrame.promise;
    await Promise.resolve();
    expect(game.presentationFailure).toBeNull();
  });

  it('turns a matching rejection into the same retryable failure and clears it only after retry', async () => {
    const firstFrame = deferred();
    const retriedFrame = deferred();
    const retry = vi.fn(() => retriedFrame.promise);
    const game = rendererReadinessGame();
    const error = new Error('first frame decode failed');

    game.observeRendererResults([{ status: 'loading', loading: firstFrame.promise, retry }]);
    firstFrame.reject(error);
    await expect(firstFrame.promise).rejects.toBe(error);
    await Promise.resolve();

    expect(game.presentationFailure).toMatchObject({ status: 'failed', error, retry });
    expect(game.visibleCompositionStatus()).toEqual({
      status: 'failed',
      message: 'A picture could not finish loading.',
    });

    const retrying = game.retryComposition();
    expect(retry).toHaveBeenCalledOnce();
    expect(game.presentationFailure).toMatchObject({ status: 'loading', retrying: true });
    retriedFrame.resolve();
    await expect(retrying).resolves.toBe(true);
    expect(game.presentationFailure).toBeNull();
  });

  it('covers Hagrid when reading the Chapter One letter adds his first world frame', () => {
    const save = createSaveV1({
      now: '2026-07-19T17:00:00.000Z',
      appVersion: 'composition-readiness-test',
      worldSeed: 42,
    });
    save.resume = {
      chapter: 'ch1',
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      spawn: 'bedroom.start',
    };
    const world = new World({ chapters: contentRegistry, save, seed: 42 });
    expect(world.snapshot().actors.some(({ characterId }) => characterId === 'character.hagrid')).toBe(false);

    world.setFlag('ch1.letterRead', true);
    const revealed = world.snapshot();
    expect(revealed.actors.some(({ characterId }) => characterId === 'character.hagrid')).toBe(true);

    const hagridFrame = deferred();
    const game = rendererReadinessGame(world);
    game.reducedMotion = false;
    game.frameCharacterResults = [];
    game.characterRenderer = {
      draw: vi.fn((_context, character) => character.characterId === 'character.hagrid'
        ? { status: 'loading', loading: hagridFrame.promise, retry: vi.fn() }
        : { status: 'drawn' }),
    };

    game.drawCharacters({}, revealed);
    game.observeRendererResults(game.frameCharacterResults);

    expect(game.characterRenderer.draw).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ characterId: 'character.hagrid', surface: 'world' }),
      expect.any(Number),
    );
    expect(game.visibleCompositionStatus()).toEqual({
      status: 'loading',
      message: 'Preparing that picture…',
    });
  });
});
