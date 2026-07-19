import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  BootAttemptController,
  SupersededBootAttemptError,
} from '../src/boot/BootAttemptController.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('replaceable boot attempts', () => {
  it('shows a rejected attempt and lets Retry reach one ready runtime', async () => {
    const first = deferred();
    const second = deferred();
    const onFailure = vi.fn();
    const onReady = vi.fn();
    const runAttempt = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const controller = new BootAttemptController({ runAttempt, onFailure, onReady });

    const firstOutcome = controller.start();
    const failure = new Error('fonts unavailable');
    first.reject(failure);
    await expect(firstOutcome).resolves.toEqual({ status: 'failed', error: failure });
    expect(onFailure).toHaveBeenCalledWith(failure);

    const secondOutcome = controller.retry();
    const runtime = { game: 'ready' };
    second.resolve(runtime);
    await expect(secondOutcome).resolves.toEqual({ status: 'ready', result: runtime });
    expect(onReady).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledWith(runtime);
  });

  it('disposes a late result from a superseded attempt instead of publishing it', async () => {
    const first = deferred();
    const second = deferred();
    const disposeResult = vi.fn();
    const onReady = vi.fn();
    const controller = new BootAttemptController({
      runAttempt: vi.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
      disposeResult,
      onReady,
    });

    const firstOutcome = controller.start();
    const secondOutcome = controller.retry();
    const currentRuntime = { id: 'current' };
    second.resolve(currentRuntime);
    await expect(secondOutcome).resolves.toEqual({ status: 'ready', result: currentRuntime });

    const lateRuntime = { id: 'late' };
    first.resolve(lateRuntime);
    await expect(firstOutcome).resolves.toEqual({ status: 'superseded' });
    expect(disposeResult).toHaveBeenCalledOnce();
    expect(disposeResult).toHaveBeenCalledWith(lateRuntime);
    expect(onReady).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledWith(currentRuntime);
  });

  it('ignores a rejected late attempt and stops its stale stage updates', async () => {
    const first = deferred();
    const second = deferred();
    const stages = [];
    const onFailure = vi.fn();
    let firstAttempt;
    let secondAttempt;
    const controller = new BootAttemptController({
      runAttempt: vi.fn()
        .mockImplementationOnce((attempt) => {
          firstAttempt = attempt;
          return first.promise;
        })
        .mockImplementationOnce((attempt) => {
          secondAttempt = attempt;
          return second.promise;
        }),
      onStage: (stage) => stages.push(stage),
      onFailure,
    });

    const firstOutcome = controller.start();
    firstAttempt.stage('fonts');
    const secondOutcome = controller.retry();
    firstAttempt.stage('presentation');
    secondAttempt.stage('title');
    first.reject(new Error('late presentation failure'));
    second.resolve({ id: 'ready' });

    await expect(firstOutcome).resolves.toEqual({ status: 'superseded' });
    await expect(secondOutcome).resolves.toMatchObject({ status: 'ready' });
    expect(stages).toEqual(['fonts', 'title']);
    expect(onFailure).not.toHaveBeenCalled();
    expect(() => firstAttempt.assertCurrent()).toThrow(SupersededBootAttemptError);
  });

  it('does not run or publish another Game after an attempt succeeds', async () => {
    const runtime = { game: 'the only game' };
    const runAttempt = vi.fn().mockResolvedValue(runtime);
    const onReady = vi.fn();
    const controller = new BootAttemptController({ runAttempt, onReady });

    await expect(controller.start()).resolves.toEqual({ status: 'ready', result: runtime });
    await expect(controller.retry()).resolves.toEqual({ status: 'ready', result: runtime });
    expect(runAttempt).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledOnce();
  });

  it('disposes the ready runtime during hot-module cleanup', async () => {
    const runtime = { game: 'ready' };
    const disposeResult = vi.fn().mockResolvedValue(undefined);
    const controller = new BootAttemptController({
      runAttempt: vi.fn().mockResolvedValue(runtime),
      disposeResult,
    });

    await controller.start();
    controller.dispose();
    await Promise.resolve();
    expect(disposeResult).toHaveBeenCalledOnce();
    expect(disposeResult).toHaveBeenCalledWith(runtime);
  });
});

describe('pre-module boot surface', () => {
  it('ships meaningful status and a reload-capable Retry control before main.js', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const surface = html.indexOf('id="boot-surface"');
    const retry = html.indexOf('id="boot-retry"');
    const module = html.indexOf('<script type="module" src="/src/main.js"></script>');

    expect(surface).toBeGreaterThan(-1);
    expect(retry).toBeGreaterThan(surface);
    expect(module).toBeGreaterThan(retry);
    expect(html).toContain('id="boot-status" class="boot-status" role="status" aria-live="polite" aria-atomic="true"');
    expect(html).toContain('window.location.reload()');
    expect(html).toContain('data-state="loading"');
    expect(html).toContain('data-stage="starting"');
  });

  it('keeps staged announcements outside the busy game and mutes Game status until ready', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const gameRoot = html.match(/<main\b[^>]*\bid="game-root"[\s\S]*?<\/main>/u)?.[0] ?? '';
    const gameStatus = html.match(/<p\b[^>]*\bid="game-status"[^>]*>/u)?.[0] ?? '';

    expect(gameRoot).not.toBe('');
    expect(gameRoot).toContain('aria-busy="true"');
    expect(gameRoot).not.toContain('id="boot-status"');
    expect(gameStatus).toContain('aria-hidden="true"');
    expect(html).toContain("gameStatus.removeAttribute('aria-hidden')");
    expect(html).toContain("attributeFilter: ['data-boot-ready']");
  });
});
