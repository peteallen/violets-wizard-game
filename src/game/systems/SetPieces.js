import { Timeline } from './Timeline.js';

export class SetPieces {
  constructor({ descriptors = {}, emit = () => {}, runActions = () => {}, reducedMotion = false } = {}) {
    this.descriptors = descriptors;
    this.emit = emit;
    this.runActions = runActions;
    this.reducedMotion = reducedMotion;
    this.active = null;
  }

  start(id, params = {}) {
    const base = this.descriptors[id] ?? { id, duration: 1, params: {}, timeline: { tracks: [] }, onComplete: [] };
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
      timeline: new Timeline(descriptor.timeline, { params: { ...(descriptor.params ?? {}), ...params } }),
    };
    this.emit('setPiece.started', { id, startedAt: 0 });
    this.emitTimelineCues(this.active.timeline.advance(-Infinity, 0));
    return this.active;
  }

  update(dt) {
    if (!this.active || this.active.completed) return;
    const previousTime = this.active.time;
    this.active.time = Math.min(this.active.descriptor.duration, this.active.time + dt);
    this.emitTimelineCues(this.active.timeline.advance(previousTime, this.active.time));
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

  emitTimelineCues(cues) {
    for (const cue of cues) this.emit(cue.type, cue.payload);
  }
}
