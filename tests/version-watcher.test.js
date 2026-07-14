import { describe, expect, it, vi } from 'vitest';
import {
  VersionWatcher,
  resolveVersionUrl,
  shouldRevealVersionOffer,
  validateVersionPayload,
} from '../src/game/core/VersionWatcher.js';
import {
  createBuildIdentity,
  productionHtmlInputs,
  versionFilePlugin,
} from '../vite.config.js';

const CURRENT_SHA = 'a'.repeat(40);
const NEXT_SHA = 'b'.repeat(40);
const LATER_SHA = 'c'.repeat(40);
const BUILT_AT = '2026-07-12T18:00:00.000Z';

function response(version, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => version };
}

async function nextTask() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('deployed build identity', () => {
  it('ships the deterministic review harness beside the playable game', () => {
    expect(productionHtmlInputs()).toEqual({
      game: expect.stringMatching(/\/index\.html$/),
      harness: expect.stringMatching(/\/harness\.html$/),
    });
  });

  it('emits version.json from the same strict identity used by the bundle', () => {
    const identity = createBuildIdentity({ sha: CURRENT_SHA, builtAt: BUILT_AT });
    const emitFile = vi.fn();
    versionFilePlugin(identity).generateBundle.call({ emitFile });
    expect(emitFile).toHaveBeenCalledOnce();
    const asset = emitFile.mock.calls[0][0];
    expect(asset).toMatchObject({ type: 'asset', fileName: 'version.json' });
    expect(JSON.parse(asset.source)).toEqual(identity);
  });

  it('rejects shortened SHAs and malformed timestamps', () => {
    expect(() => createBuildIdentity({ sha: CURRENT_SHA.slice(0, 7), builtAt: BUILT_AT })).toThrow(/full lowercase/);
    expect(() => createBuildIdentity({ sha: CURRENT_SHA, builtAt: 'today' })).toThrow(/ISO UTC/);
  });
});

describe('VersionWatcher', () => {
  it('defers update offers until a calm story surface', () => {
    expect(shouldRevealVersionOffer({ screen: 'title' })).toBe(true);
    expect(shouldRevealVersionOffer({ screen: 'playing', state: { roomId: 'ch1.bedroom' } })).toBe(false);
    expect(shouldRevealVersionOffer({
      screen: 'playing',
      state: { roomId: 'ch1.bedroom', dialogue: { type: 'line' }, overlay: { surface: 'satchel' } },
    })).toBe(false);
    expect(shouldRevealVersionOffer({
      screen: 'playing', state: { roomId: 'ch1.bedroom', overlay: { surface: 'satchel' } },
    })).toBe(true);
    expect(shouldRevealVersionOffer({
      screen: 'playing', state: { chapterId: 'ch2', roomId: 'ch2.previewRoom' },
    })).toBe(true);
  });

  it('resolves version.json beneath BASE_URL and bypasses caches', async () => {
    expect(resolveVersionUrl('./', 'https://example.test/wizard/index.html')).toBe(
      'https://example.test/wizard/version.json',
    );
    expect(resolveVersionUrl('/violets-wizard-game/', 'https://example.test/anything')).toBe(
      'https://example.test/violets-wizard-game/version.json',
    );
    const fetcher = vi.fn(async () => response({ sha: CURRENT_SHA, builtAt: BUILT_AT }));
    const watcher = new VersionWatcher({
      currentSha: CURRENT_SHA,
      baseUrl: './',
      locationHref: 'https://example.test/wizard/index.html',
      fetcher,
      onUpdate: vi.fn(),
    });
    await expect(watcher.check()).resolves.toMatchObject({ status: 'current' });
    expect(fetcher).toHaveBeenCalledWith('https://example.test/wizard/version.json', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
  });

  it('reports a different deployed SHA exactly once', async () => {
    const onUpdate = vi.fn();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response({ sha: NEXT_SHA, builtAt: BUILT_AT }))
      .mockResolvedValueOnce(response({ sha: LATER_SHA, builtAt: BUILT_AT }));
    const watcher = new VersionWatcher({
      currentSha: CURRENT_SHA,
      baseUrl: './',
      locationHref: 'https://example.test/wizard/',
      fetcher,
      onUpdate,
    });

    await expect(watcher.check()).resolves.toMatchObject({ status: 'update-available' });
    await expect(watcher.check()).resolves.toMatchObject({ status: 'already-reported' });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onUpdate.mock.calls[0][0]).toMatchObject({ sha: NEXT_SHA, builtAt: BUILT_AT });
  });

  it('continues polling after transient errors and stops after finding an update', async () => {
    const scheduled = [];
    const errors = [];
    const onUpdate = vi.fn();
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response({ sha: NEXT_SHA, builtAt: BUILT_AT }));
    const watcher = new VersionWatcher({
      currentSha: CURRENT_SHA,
      baseUrl: './',
      locationHref: 'https://example.test/wizard/',
      fetcher,
      intervalMs: 10,
      onUpdate,
      onError: (error) => errors.push(error.message),
      setTimer: (callback, delay) => { scheduled.push({ callback, delay }); return scheduled.length; },
      clearTimer: () => {},
    });

    watcher.start();
    await nextTask();
    expect(errors).toEqual(['offline']);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].delay).toBe(10);
    scheduled[0].callback();
    await nextTask();
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(scheduled).toHaveLength(1);
  });

  it('does not report an in-flight response after cleanup', async () => {
    let resolveFetch;
    const fetcher = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    const onUpdate = vi.fn();
    const watcher = new VersionWatcher({
      currentSha: CURRENT_SHA,
      baseUrl: './',
      locationHref: 'https://example.test/wizard/',
      fetcher,
      onUpdate,
      setTimer: vi.fn(),
      clearTimer: vi.fn(),
    });

    watcher.start();
    watcher.stop();
    resolveFetch(response({ sha: NEXT_SHA, builtAt: BUILT_AT }));
    await nextTask();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(watcher.timer).toBeNull();
  });

  it('rejects malformed version metadata instead of offering a reload', async () => {
    expect(() => validateVersionPayload({ sha: 'short', builtAt: BUILT_AT })).toThrow(/full lowercase/);
    const onUpdate = vi.fn();
    const watcher = new VersionWatcher({
      currentSha: CURRENT_SHA,
      baseUrl: './',
      locationHref: 'https://example.test/wizard/',
      fetcher: async () => response({ sha: NEXT_SHA, builtAt: BUILT_AT, surprise: true }),
      onUpdate,
    });
    await expect(watcher.check()).rejects.toThrow(/unsupported fields/);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
