import { describe, expect, it, vi } from 'vitest';
import { ROOM_MEMORY_LIMITS, RoomRenderer } from '../src/game/render/RoomRenderer.js';

function room(id, layers = [`asset/${id}`]) {
  return {
    id,
    size: { width: 1280, height: 720 },
    background: {
      layers,
      variants: {},
      fit: 'cover',
      focalPoint: { x: 0.5, y: 0.5 },
    },
  };
}

function imageFactory(decodeLog, { width = 1672, height = 941, gate = null } = {}) {
  return () => ({
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    decoding: '',
    src: '',
    async decode() {
      if (gate) await gate.promise;
      decodeLog.push(this.src);
    },
  });
}

function fakeCanvasFactory(contextResults = []) {
  const canvases = [];
  const factory = vi.fn((width, height) => {
    const drawCalls = [];
    const supplied = contextResults.length ? contextResults.shift() : 'context';
    const context = supplied === null ? null : {
      drawCalls,
      drawImage: (...args) => drawCalls.push(args),
    };
    const canvas = {
      width,
      height,
      drawCalls,
      getContext: vi.fn(() => context),
    };
    canvases.push(canvas);
    return canvas;
  });
  return { factory, canvases };
}

function outputContext(scale = 1) {
  const drawCalls = [];
  return {
    drawCalls,
    getTransform: () => ({ a: scale, d: scale }),
    drawImage: (...args) => drawCalls.push(args),
  };
}

function createRenderer({ canvasResults = [], gate = null } = {}) {
  const decodeLog = [];
  const canvases = fakeCanvasFactory(canvasResults);
  const logger = { warn: vi.fn() };
  const renderer = new RoomRenderer({
    resolveAsset: (key) => `/resolved/${key}.webp`,
    imageFactory: imageFactory(decodeLog, { gate }),
    canvasFactory: canvases.factory,
    logger,
  });
  return { renderer, decodeLog, logger, ...canvases };
}

describe('RoomRenderer WebKit memory lifecycle', () => {
  it('keeps the procedural room visible while first entry prepares the painted cache', async () => {
    const { renderer } = createRenderer();
    const enteredRoom = room('room.entered');
    const output = outputContext();
    renderer.drawProcedural = vi.fn();

    renderer.draw(output, enteredRoom, { roomVariant: 'base' }, 0);
    expect(renderer.drawProcedural).toHaveBeenCalledWith(output, 'room.entered', 'base', 0, 0);

    await renderer.preload(['asset/room.entered']);
    expect(renderer.memorySnapshot().roomCanvasCount).toBe(1);
    const cache = await renderer.prepareRoom(enteredRoom, { roomVariant: 'base' });
    renderer.draw(output, enteredRoom, { roomVariant: 'base' }, 1);

    expect(cache).not.toBeNull();
    expect(output.drawCalls.at(-1)[0]).toBe(cache.canvas);
  });

  it('promotes a legacy key preload into the room cache without decoding it twice', async () => {
    const { renderer, decodeLog } = createRenderer();
    const enteredRoom = room('room.legacy', ['asset/legacy']);

    await renderer.preload(['asset/legacy']);
    const cache = await renderer.prepareRoom(enteredRoom, { roomVariant: 'base' });

    expect(cache).not.toBeNull();
    expect(decodeLog).toEqual(['/resolved/asset/legacy.webp']);
    expect(renderer.images.size).toBe(0);
  });

  it('decodes each layer into one device-resolution composite and drops the image references', async () => {
    const { renderer, decodeLog, factory, canvases } = createRenderer();
    const layeredRoom = room('room.layered', ['asset/base', 'asset/dressing']);

    const cache = await renderer.preloadRoom(layeredRoom, { roomVariant: 'base' }, { scale: 2 });

    expect(decodeLog).toEqual(['/resolved/asset/base.webp', '/resolved/asset/dressing.webp']);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(cache).toMatchObject({ width: 2560, height: 1440, roomId: 'room.layered' });
    expect(canvases[0].drawCalls).toHaveLength(2);
    expect(renderer.images.size).toBe(0);
    expect(renderer.memorySnapshot()).toMatchObject({
      globalCanvasLimit: 5,
      reservedCanvasSlots: 3,
      roomCanvasLimit: 2,
      roomCanvasCount: 1,
      fullScreenCanvasEquivalentCount: 4,
      decodedImageLimit: 3,
      decodedImageCount: 0,
    });

    const output = outputContext(2);
    renderer.draw(output, layeredRoom, { roomVariant: 'base' }, 0);
    renderer.draw(output, layeredRoom, { roomVariant: 'base' }, 1);
    expect(output.drawCalls).toHaveLength(2);
    expect(output.drawCalls[0][0]).toBe(cache.canvas);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('never retains more than three decoded room images', async () => {
    const { renderer } = createRenderer();

    await renderer.preload(['asset/a', 'asset/b', 'asset/c', 'asset/d', 'asset/e']);

    expect(renderer.memorySnapshot()).toMatchObject({
      decodedImageLimit: ROOM_MEMORY_LIMITS.decodedImageCount,
      decodedImageCount: 3,
      decodedImageKeys: ['asset/c', 'asset/d', 'asset/e'],
    });
  });

  it('keeps only the active room and one neighbor, forcing LRU backing stores to 1 by 1', async () => {
    const { renderer, canvases } = createRenderer();
    const first = room('room.first');
    const second = room('room.second');
    const third = room('room.third');

    const firstCache = await renderer.preloadRoom(first);
    const secondCache = await renderer.preloadRoom(second);
    renderer.draw(outputContext(), first, { roomVariant: 'base' }, 0);
    const thirdCache = await renderer.preloadRoom(third);

    expect(firstCache.canvas.width).toBe(1280);
    expect(firstCache.canvas.height).toBe(720);
    expect(secondCache.canvas.width).toBe(1);
    expect(secondCache.canvas.height).toBe(1);
    expect(thirdCache.canvas.width).toBe(1280);
    expect(renderer.memorySnapshot()).toMatchObject({
      roomCanvasCount: 2,
      fullScreenCanvasEquivalentCount: 5,
    });
    expect(canvases).toHaveLength(3);
  });

  it('treats a null 2D context as a canary, evicts immediately, logs, and retries once', async () => {
    const { renderer, logger, canvases } = createRenderer({ canvasResults: ['context', null, 'context'] });
    const firstCache = await renderer.preloadRoom(room('room.first'));

    const recovered = await renderer.preloadRoom(room('room.recovered'));

    expect(recovered).not.toBeNull();
    expect(firstCache.canvas.width).toBe(1);
    expect(firstCache.canvas.height).toBe(1);
    expect(canvases[1].width).toBe(1);
    expect(canvases[1].height).toBe(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('evicting cached rooms'),
      expect.any(Error),
    );
    expect(renderer.memorySnapshot()).toMatchObject({ roomCanvasCount: 1, decodedImageCount: 0 });
  });

  it('falls back safely when the canary still fails after emergency eviction', async () => {
    const { renderer, logger, canvases } = createRenderer({ canvasResults: [null, null] });

    await expect(renderer.preloadRoom(room('room.unavailable'))).resolves.toBeNull();

    expect(canvases).toHaveLength(2);
    for (const canvas of canvases) expect([canvas.width, canvas.height]).toEqual([1, 1]);
    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(renderer.memorySnapshot()).toMatchObject({ roomCanvasCount: 0, decodedImageCount: 0 });
  });

  it('destroy sizes every composite down and prevents an in-flight decode from reviving the cache', async () => {
    const settled = createRenderer();
    const first = await settled.renderer.preloadRoom(room('room.first'));
    const second = await settled.renderer.preloadRoom(room('room.second'));
    await settled.renderer.preload(['asset/a', 'asset/b']);

    settled.renderer.destroy();

    expect([first.canvas.width, first.canvas.height]).toEqual([1, 1]);
    expect([second.canvas.width, second.canvas.height]).toEqual([1, 1]);
    expect(settled.renderer.memorySnapshot()).toMatchObject({ roomCanvasCount: 0, decodedImageCount: 0 });

    let releaseDecode;
    const gate = { promise: new Promise((resolve) => { releaseDecode = resolve; }) };
    const pending = createRenderer({ gate });
    const preparation = pending.renderer.preloadRoom(room('room.pending'));
    pending.renderer.destroy();
    releaseDecode();

    await expect(preparation).resolves.toBeNull();
    expect(pending.factory).not.toHaveBeenCalled();
    expect(pending.renderer.memorySnapshot()).toMatchObject({ roomCanvasCount: 0, decodedImageCount: 0 });
  });
});
