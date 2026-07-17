import { Timeline } from './Timeline.js';

function noReceipt() {
  return false;
}

function noOp() {}

function noFallback() {
  return null;
}

/**
 * Runs the visual performance for a logical set piece.  The descriptor asked
 * for by the action always owns durable completion; reduced-motion and
 * fallback descriptors only describe an alternate way to present it.
 */
export class SetPieces {
  constructor({
    descriptors = {},
    emit = noOp,
    runActions = noOp,
    reducedMotion = false,
    hasReceipt = noReceipt,
    recordReceipt = noOp,
    selectFallback = noFallback,
    completionFinalizer = noOp,
  } = {}) {
    this.descriptors = descriptors;
    this.emit = emit;
    this.runActions = runActions;
    this.reducedMotion = reducedMotion;
    this.hasReceipt = hasReceipt;
    this.recordReceipt = recordReceipt;
    this.selectFallback = selectFallback;
    this.completionFinalizer = completionFinalizer;
    this.active = null;
    this.pendingCompletion = null;
    this.completingId = null;
  }

  get blocked() {
    return Boolean(this.active || this.pendingCompletion);
  }

  start(id, params = {}) {
    const logicalDescriptor = this.descriptorFor(id, 'set piece');
    this.discardActive();

    // A receipt represents the logical story transition, not a particular
    // animation. Replaying an already-completed action still applies its
    // idempotent logical consequences, but never replays presentation events.
    if (this.hasReceipt(id)) {
      const logicalResult = this.runActions(logicalDescriptor.onComplete ?? []);
      return logicalResult === false || logicalResult === 'terminal' ? logicalResult : null;
    }

    const descriptor = this.presentationDescriptorFor(id, logicalDescriptor, params);
    const resolvedParams = { ...(descriptor.params ?? {}), ...params };
    this.active = {
      id: descriptor.id,
      requestedId: id,
      descriptor,
      logicalDescriptor,
      params: resolvedParams,
      time: 0,
      completed: false,
      receiptRecorded: false,
      actionTail: [],
      completionCallbacks: [],
      timeline: new Timeline(descriptor.timeline, { params: resolvedParams }),
    };
    this.emit('setPiece.started', { id, startedAt: 0 });
    this.emitTimelineCues(this.active.timeline.advance(-Infinity, 0));
    return this.active;
  }

  update(dt) {
    if (this.pendingCompletion) {
      this.retryPendingCompletion();
      return;
    }
    if (!this.active || this.active.completed) return;
    const performance = this.active;
    const previousTime = performance.time;
    performance.time = Math.min(performance.descriptor.duration, performance.time + dt);
    this.emitTimelineCues(performance.timeline.advance(previousTime, performance.time));
    if (performance.time >= performance.descriptor.duration) this.finalizeCompletion(performance, 'completed');
  }

  skip() {
    if (this.pendingCompletion) {
      this.retryPendingCompletion();
      return;
    }
    if (!this.active) return;
    const performance = this.active;
    performance.time = performance.descriptor.duration;
    this.finalizeCompletion(performance, 'skipped');
  }

  reset() {
    this.discardActive();
    if (this.pendingCompletion) {
      this.pendingCompletion.performance.completed = true;
      this.pendingCompletion.performance.actionTail.length = 0;
      this.pendingCompletion.performance.completionCallbacks.length = 0;
      this.pendingCompletion = null;
    }
    this.completingId = null;
  }

  /**
   * Binds actions which followed setPiece.play to this specific performance.
   * The return value lets a caller continue normally when no animation was
   * started, such as when the set piece already had its durable receipt.
   */
  bindActionTail(actions = []) {
    if (!this.active || this.active.completed) return false;
    this.active.actionTail.push(...actions);
    return true;
  }

  // Short aliases make the hand-off seam pleasant for callers without making
  // them depend on the active object's internal array.
  bindActions(actions = []) {
    return this.bindActionTail(actions);
  }

  bindTail(actions = []) {
    return this.bindActionTail(actions);
  }

  /**
   * Queues work that must happen after logical completion and the action tail.
   * Dialogue can use this for a receipt/cursor update without racing a set
   * piece's own completion actions.
   */
  deferCompletion(callback) {
    if (typeof callback !== 'function') throw new TypeError('Set-piece completion callback must be a function.');
    if (!this.active || this.active.completed) return false;
    this.active.completionCallbacks.push(callback);
    return true;
  }

  deferUntilCompleted(callback) {
    return this.deferCompletion(callback);
  }

  /**
   * All successful paths meet here: a normal finish, a reduced/fallback
   * finish, and an explicit skip.  Cancelled performances never call it.
   */
  finalizeCompletion(performance = this.active, reason = 'completed') {
    if (!performance || performance.completed || performance !== this.active) return false;
    if (!performance.receiptRecorded) {
      if (this.recordReceipt(performance.requestedId) === false) return false;
      performance.receiptRecorded = true;
      this.emit('setPiece.completed', { id: performance.requestedId });
    }
    this.active = null;
    performance.completionReason = reason;
    performance.callbackIndex ??= 0;
    return this.finishCompletion(performance, 'actions');
  }

  finishCompletion(performance, stage) {
    if (stage === 'actions') {
      this.completingId = performance.requestedId;
      let completionResult;
      try {
        completionResult = this.runActions([
          ...(performance.logicalDescriptor.onComplete ?? []),
          ...performance.actionTail,
        ]);
      } finally {
        this.completingId = null;
      }
      if (completionResult === false) {
        return this.deferCompletionRetry(performance, 'actions');
      }
      performance.actionsCompleted = true;
    }

    const completion = {
      id: performance.requestedId,
      descriptor: performance.descriptor,
      logicalDescriptor: performance.logicalDescriptor,
      reason: performance.completionReason,
      ok: true,
    };
    while (performance.callbackIndex < performance.completionCallbacks.length) {
      const callback = performance.completionCallbacks[performance.callbackIndex];
      if (callback(completion) === false) {
        return this.deferCompletionRetry(performance, 'callbacks');
      }
      performance.callbackIndex += 1;
    }

    performance.completed = true;
    this.pendingCompletion = null;
    this.completionFinalizer(completion);
    return true;
  }

  deferCompletionRetry(performance, stage) {
    // A failed action batch is rolled back as a unit, so a set piece it
    // started cannot survive that failed attempt. Once the actions have
    // succeeded, however, a callback retry must not discard the next set
    // piece which those actions legitimately started.
    if (stage === 'actions' && this.active) this.discardActive();
    this.pendingCompletion = { performance, stage };
    this.completionFinalizer({
      id: performance.requestedId,
      descriptor: performance.descriptor,
      logicalDescriptor: performance.logicalDescriptor,
      reason: performance.completionReason,
      ok: false,
    });
    return false;
  }

  retryPendingCompletion() {
    if (!this.pendingCompletion) return false;
    const { performance, stage } = this.pendingCompletion;
    this.pendingCompletion = null;
    return this.finishCompletion(performance, stage);
  }

  discardActive() {
    if (!this.active) return false;
    this.active.completed = true;
    this.active.actionTail.length = 0;
    this.active.completionCallbacks.length = 0;
    this.active = null;
    return true;
  }

  descriptorFor(id, kind) {
    const descriptor = this.descriptors[id];
    if (!descriptor) throw new Error(`Unknown ${kind}: ${id}`);
    return descriptor;
  }

  presentationDescriptorFor(id, logicalDescriptor, params) {
    const fallbackId = this.selectedFallbackId(id, logicalDescriptor, params);
    if (fallbackId && this.descriptors[fallbackId]) return this.descriptors[fallbackId];
    if (this.reducedMotion && this.descriptors[logicalDescriptor.reducedMotion]) {
      return this.descriptors[logicalDescriptor.reducedMotion];
    }
    return logicalDescriptor;
  }

  selectedFallbackId(id, logicalDescriptor, params) {
    const selection = this.selectFallback({
      id,
      descriptor: logicalDescriptor,
      params,
      descriptors: this.descriptors,
      reducedMotion: this.reducedMotion,
    });
    if (selection === true) return logicalDescriptor.fallback;
    if (typeof selection === 'string') return selection;
    if (selection && typeof selection.id === 'string') return selection.id;
    return null;
  }

  emitTimelineCues(cues) {
    for (const cue of cues) this.emit(cue.type, cue.payload);
  }
}
