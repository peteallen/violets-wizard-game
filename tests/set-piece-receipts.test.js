import { describe, expect, it, vi } from 'vitest';
import { SetPieces } from '../src/game/systems/SetPieces.js';

function descriptors() {
  return {
    'sp.logical': {
      id: 'sp.logical',
      duration: 2,
      params: { source: 'logical' },
      fallback: 'sp.fallback',
      reducedMotion: 'sp.reduced',
      timeline: { tracks: [{ type: 'cue', at: 0, event: 'audio.command', payload: { command: 'sfx', key: 'logical' } }] },
      onComplete: [{ type: 'logical.complete' }],
    },
    'sp.fallback': {
      id: 'sp.fallback',
      duration: 1,
      params: { source: 'fallback' },
      fallback: null,
      reducedMotion: null,
      timeline: { tracks: [{ type: 'cue', at: 0, event: 'audio.command', payload: { command: 'sfx', key: 'fallback' } }] },
      onComplete: [{ type: 'fallback.complete' }],
    },
    'sp.reduced': {
      id: 'sp.reduced',
      duration: 0.5,
      params: { source: 'reduced' },
      fallback: null,
      reducedMotion: null,
      timeline: { tracks: [{ type: 'cue', at: 0, event: 'audio.command', payload: { command: 'sfx', key: 'reduced' } }] },
      onComplete: [{ type: 'reduced.complete' }],
    },
  };
}

function system(options = {}) {
  const events = [];
  const actions = [];
  const receipts = new Set();
  const setPieces = new SetPieces({
    descriptors: descriptors(),
    emit: (type, payload) => events.push({ type, payload }),
    runActions: (batch) => actions.push(...batch),
    hasReceipt: (id) => receipts.has(id),
    recordReceipt: (id) => receipts.add(id),
    ...options,
  });
  return { setPieces, events, actions, receipts };
}

describe('set-piece receipts', () => {
  it('keeps logical completion with a reduced presentation and records it first', () => {
    const completionFinalizer = vi.fn();
    const { setPieces, actions, receipts } = system({ reducedMotion: true, completionFinalizer });

    setPieces.start('sp.logical');
    expect(setPieces.active).toMatchObject({
      id: 'sp.reduced',
      requestedId: 'sp.logical',
      params: { source: 'reduced' },
    });
    setPieces.update(0.5);

    expect(receipts).toEqual(new Set(['sp.logical']));
    expect(actions).toEqual([{ type: 'logical.complete' }]);
    expect(completionFinalizer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'sp.logical', reason: 'completed',
    }));
  });

  it('uses an explicitly selected fallback only for presentation', () => {
    const { setPieces, events, actions, receipts } = system({ selectFallback: () => true });

    setPieces.start('sp.logical');
    expect(setPieces.active).toMatchObject({ id: 'sp.fallback', requestedId: 'sp.logical' });
    expect(events).toContainEqual({
      type: 'audio.command', payload: { command: 'sfx', key: 'fallback' },
    });
    setPieces.update(1);

    expect(receipts).toEqual(new Set(['sp.logical']));
    expect(actions).toEqual([{ type: 'logical.complete' }]);
  });

  it('skips an already receipted performance without emitting animation events', () => {
    const { setPieces, events, actions, receipts } = system();
    receipts.add('sp.logical');

    expect(setPieces.start('sp.logical')).toBeNull();
    expect(setPieces.active).toBeNull();
    expect(events).toEqual([]);
    expect(actions).toEqual([{ type: 'logical.complete' }]);
  });

  it.each([
    { result: false, outcome: 'failure' },
    { result: 'terminal', outcome: 'terminal completion' },
  ])('propagates a reconstructed logical $outcome to its caller', ({ result }) => {
    const runActions = vi.fn(() => result);
    const setPieces = new SetPieces({
      descriptors: descriptors(),
      hasReceipt: () => true,
      runActions,
    });

    expect(setPieces.start('sp.logical')).toBe(result);
    expect(setPieces.active).toBeNull();
    expect(runActions).toHaveBeenCalledWith([{ type: 'logical.complete' }]);
  });

  it('runs receipt, logical completion, the bound tail, and deferred work in order', () => {
    const order = [];
    const setPieces = new SetPieces({
      descriptors: descriptors(),
      hasReceipt: () => false,
      recordReceipt: () => order.push('receipt'),
      runActions: (actions) => order.push(...actions.map(({ type }) => type)),
    });
    const deferred = vi.fn(() => order.push('deferred'));

    setPieces.start('sp.logical');
    expect(setPieces.bindActionTail([{ type: 'tail' }])).toBe(true);
    expect(setPieces.deferCompletion(deferred)).toBe(true);
    setPieces.skip();

    expect(order).toEqual(['receipt', 'logical.complete', 'tail', 'deferred']);
    expect(deferred).toHaveBeenCalledWith(expect.objectContaining({ id: 'sp.logical', reason: 'skipped' }));
  });

  it('discards a replaced or reset performance without its receipt, tail, or deferred work', () => {
    const { setPieces, actions, receipts } = system();
    const deferred = vi.fn();

    setPieces.start('sp.logical');
    setPieces.bindActions([{ type: 'discarded.tail' }]);
    setPieces.deferUntilCompleted(deferred);
    setPieces.start('sp.fallback');
    setPieces.reset();

    expect(receipts).toEqual(new Set());
    expect(actions).toEqual([]);
    expect(deferred).not.toHaveBeenCalled();
  });

  it.each([
    { failedType: 'logical.complete', label: 'logical completion' },
    { failedType: 'tail.fails', label: 'bound action tail' },
  ])('retries the full completion batch after a failed $label', ({ failedType }) => {
    const deferred = vi.fn(() => true);
    const completionFinalizer = vi.fn();
    const recordReceipt = vi.fn(() => true);
    let shouldFail = true;
    const runActions = vi.fn((actions) => {
      if (shouldFail && actions.some(({ type }) => type === failedType)) return false;
      return true;
    });
    const setPieces = new SetPieces({
      descriptors: descriptors(),
      recordReceipt,
      runActions,
      completionFinalizer,
    });
    setPieces.start('sp.logical');
    setPieces.bindActionTail([{ type: 'tail.fails' }]);
    setPieces.deferCompletion(deferred);

    expect(setPieces.finalizeCompletion()).toBe(false);
    expect(setPieces.active).toBeNull();
    expect(setPieces.pendingCompletion).toMatchObject({
      stage: 'actions',
      performance: {
        requestedId: 'sp.logical', receiptRecorded: true, completed: false,
      },
    });
    expect(setPieces.blocked).toBe(true);
    expect(deferred).not.toHaveBeenCalled();
    expect(recordReceipt).toHaveBeenCalledOnce();
    expect(runActions).toHaveBeenCalledOnce();
    expect(runActions).toHaveBeenCalledWith([
      { type: 'logical.complete' },
      { type: 'tail.fails' },
    ]);
    expect(completionFinalizer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'sp.logical', ok: false,
    }));

    shouldFail = false;
    setPieces.update(0);

    expect(setPieces.active).toBeNull();
    expect(setPieces.pendingCompletion).toBeNull();
    expect(setPieces.blocked).toBe(false);
    expect(recordReceipt).toHaveBeenCalledOnce();
    expect(runActions).toHaveBeenCalledTimes(2);
    expect(runActions).toHaveBeenLastCalledWith([
      { type: 'logical.complete' },
      { type: 'tail.fails' },
    ]);
    expect(deferred).toHaveBeenCalledOnce();
  });

  it('retries only the failed completion callback without rewriting durable work', () => {
    const recordReceipt = vi.fn(() => true);
    const runActions = vi.fn(() => true);
    const firstCallback = vi.fn(() => true);
    const retryingCallback = vi.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const completionFinalizer = vi.fn();
    const setPieces = new SetPieces({
      descriptors: descriptors(),
      recordReceipt,
      runActions,
      completionFinalizer,
    });
    setPieces.start('sp.logical');
    setPieces.bindActionTail([{ type: 'tail' }]);
    setPieces.deferCompletion(firstCallback);
    setPieces.deferCompletion(retryingCallback);

    expect(setPieces.finalizeCompletion()).toBe(false);
    expect(setPieces.pendingCompletion).toMatchObject({
      stage: 'callbacks',
      performance: { callbackIndex: 1, actionsCompleted: true },
    });
    expect(setPieces.blocked).toBe(true);
    expect(recordReceipt).toHaveBeenCalledOnce();
    expect(runActions).toHaveBeenCalledOnce();
    expect(firstCallback).toHaveBeenCalledOnce();
    expect(retryingCallback).toHaveBeenCalledOnce();

    setPieces.update(0);

    expect(setPieces.pendingCompletion).toBeNull();
    expect(setPieces.blocked).toBe(false);
    expect(recordReceipt).toHaveBeenCalledOnce();
    expect(runActions).toHaveBeenCalledOnce();
    expect(firstCallback).toHaveBeenCalledOnce();
    expect(retryingCallback).toHaveBeenCalledTimes(2);
    expect(completionFinalizer).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'sp.logical', ok: true,
    }));
  });

  it('preserves the next set piece while a completion callback retries', () => {
    let setPieces;
    const retryingCallback = vi.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const runActions = vi.fn(() => {
      setPieces.start('sp.fallback');
      return true;
    });
    setPieces = new SetPieces({
      descriptors: descriptors(),
      recordReceipt: () => true,
      runActions,
    });
    setPieces.start('sp.logical');
    setPieces.deferCompletion(retryingCallback);

    expect(setPieces.finalizeCompletion()).toBe(false);
    expect(setPieces.pendingCompletion).toMatchObject({ stage: 'callbacks' });
    expect(setPieces.active).toMatchObject({ requestedId: 'sp.fallback' });
    expect(setPieces.blocked).toBe(true);

    setPieces.update(0);

    expect(setPieces.pendingCompletion).toBeNull();
    expect(setPieces.active).toMatchObject({ requestedId: 'sp.fallback' });
    expect(setPieces.blocked).toBe(true);
    expect(runActions).toHaveBeenCalledOnce();
    expect(retryingCallback).toHaveBeenCalledTimes(2);
  });

  it('keeps the performance retryable when its logical receipt cannot be saved', () => {
    const recordReceipt = vi.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const runActions = vi.fn(() => true);
    const events = [];
    const setPieces = new SetPieces({
      descriptors: descriptors(),
      recordReceipt,
      runActions,
      emit: (type, payload) => events.push({ type, payload }),
    });
    setPieces.start('sp.logical');

    expect(setPieces.finalizeCompletion()).toBe(false);
    expect(setPieces.active).toMatchObject({ requestedId: 'sp.logical', completed: false });
    expect(runActions).not.toHaveBeenCalled();
    expect(events.some(({ type }) => type === 'setPiece.completed')).toBe(false);

    expect(setPieces.finalizeCompletion()).toBe(true);
    expect(setPieces.active).toBeNull();
    expect(runActions).toHaveBeenCalledWith([{ type: 'logical.complete' }]);
    expect(recordReceipt).toHaveBeenCalledTimes(2);
  });

  it('rejects an unknown logical id instead of inventing a completion path', () => {
    const { setPieces } = system();
    expect(() => setPieces.start('sp.missing')).toThrow('Unknown set piece: sp.missing');
  });
});
