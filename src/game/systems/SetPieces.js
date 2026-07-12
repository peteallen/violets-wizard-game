export class SetPieces {
  constructor({ descriptors = {}, emit = () => {}, runActions = () => {}, reducedMotion = false } = {}) {
    this.descriptors = descriptors;
    this.emit = emit;
    this.runActions = runActions;
    this.reducedMotion = reducedMotion;
    this.active = null;
  }

  start(id, params = {}) {
    const base = this.descriptors[id] ?? { id, duration: 1, onComplete: [] };
    const descriptor = this.reducedMotion && base.reducedMotion && this.descriptors[base.reducedMotion]
      ? this.descriptors[base.reducedMotion]
      : base;
    this.active = {
      id: descriptor.id,
      requestedId: id,
      descriptor,
      params: { ...(descriptor.params ?? {}), ...params },
      time: 0,
      completed: false,
    };
    this.emit('setPiece.started', { id, startedAt: 0 });
    return this.active;
  }

  update(dt) {
    if (!this.active || this.active.completed) return;
    this.active.time = Math.min(this.active.descriptor.duration, this.active.time + dt);
    if (this.active.time >= this.active.descriptor.duration) {
      const finished = this.active;
      finished.completed = true;
      this.active = null;
      this.emit('setPiece.completed', { id: finished.requestedId });
      this.runActions(finished.descriptor.onComplete ?? []);
    }
  }

  skip() {
    if (!this.active) return;
    this.active.time = this.active.descriptor.duration;
    this.update(0);
  }

  reset() {
    this.active = null;
  }
}
