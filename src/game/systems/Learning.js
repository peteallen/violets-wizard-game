const LEARNING_MODES = new Set(['off', 'gentle', 'stretchy']);
const HINT_STAGES = Object.freeze(['ready', 'nudge', 'focus', 'complete']);
const HINT_THRESHOLDS = Object.freeze({ nudge: 3, focus: 6, complete: 9 });
const CELEBRATION_DURATION = 0.9;

function normalizedMode(value) {
  return LEARNING_MODES.has(value) ? value : 'gentle';
}

function unitRecord(value) {
  if (typeof value === 'string') return { id: value, glyph: value, voice: null };
  return value;
}

function cloneActive(active) {
  if (!active) return null;
  return {
    ...active,
    completedUnitIds: [...active.completedUnitIds],
  };
}

function stageIndex(stage) {
  return HINT_STAGES.indexOf(stage);
}

function stageFor(active) {
  if (active.failedAttempts >= 3 || active.elapsed >= HINT_THRESHOLDS.complete) return 'complete';
  if (active.failedAttempts >= 2 || active.elapsed >= HINT_THRESHOLDS.focus) return 'focus';
  if (active.failedAttempts >= 1 || active.elapsed >= HINT_THRESHOLDS.nudge) return 'nudge';
  return 'ready';
}

function distractorLimit(beat, mode) {
  if (mode === 'off') return 0;
  const configured = beat.modes?.[mode]?.distractorCount;
  if (Number.isSafeInteger(configured) && configured >= 0) return configured;
  return mode === 'stretchy' ? 2 : 1;
}

function correctUnits(beat) {
  const byId = new Map(beat.content.units.map((unit) => [unit.id, unit]));
  return beat.content.order.map((unitId) => byId.get(unitId));
}

function offeredUnits(beat, active) {
  const ordered = correctUnits(beat);
  const expected = ordered[active.stepIndex];
  if (!expected) return [];

  if (beat.kind === 'sequence') {
    return ordered.filter((unit) => !active.completedUnitIds.includes(unit.id));
  }
  if (active.mode === 'off' || active.stepIndex === 0) return [expected];

  const distractors = (beat.content.distractors ?? []).map(unitRecord);
  const count = Math.min(distractorLimit(beat, active.mode), distractors.length);
  const selected = [];
  for (let offset = 0; offset < distractors.length && selected.length < count; offset += 1) {
    const candidate = distractors[(active.stepIndex + offset - 1) % distractors.length];
    if (candidate.id !== expected.id && !selected.some((unit) => unit.id === candidate.id)) {
      selected.push(candidate);
    }
  }
  const insertAt = active.stepIndex % (selected.length + 1);
  return [...selected.slice(0, insertAt), expected, ...selected.slice(insertAt)];
}

function adaptiveSlotHidden(beat, active, slotIndex) {
  if (slotIndex !== active.stepIndex || active.mode !== 'stretchy' || active.stepIndex < 2) return false;
  const tileFace = beat.modes?.stretchy?.tileFace;
  if (tileFace === 'hidden') return true;
  return tileFace === 'adaptive' && active.failedAttempts === 0 && active.elapsed < HINT_THRESHOLDS.nudge;
}

export class Learning {
  constructor({
    beats = {},
    save,
    emit = () => {},
    onComplete = () => true,
  } = {}) {
    if (!save?.learning || !save?.settings) {
      throw new TypeError('Learning requires the existing save learning and settings records.');
    }
    this.beats = beats;
    this.save = save;
    this.emit = emit;
    this.onComplete = onComplete;
    this.active = null;
  }

  get isActive() {
    return Boolean(this.active);
  }

  start(beatId) {
    const beat = this.beats[beatId];
    if (!beat) throw new Error(`Unknown learning beat ${beatId}.`);
    if (this.active?.beatId === beatId) return { started: false, reason: 'already-active' };
    if (this.active) return false;
    if (!beat.replayable && this.save.learning.completedBeats.includes(beatId)) {
      return { started: false, reason: 'completed' };
    }
    this.active = {
      beatId,
      mode: normalizedMode(this.save.settings.learning),
      stepIndex: 0,
      completedUnitIds: [],
      failedAttempts: 0,
      elapsed: 0,
      hintStage: 'ready',
      status: 'active',
      celebrationElapsed: 0,
    };
    this.emit('learning.started', { beat: beatId });
    return { started: true, reason: 'started' };
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new TypeError('Learning.update requires a non-negative finite delta.');
    if (!this.active) return;
    if (this.active.status === 'completed') {
      this.active.celebrationElapsed += dt;
      if (this.active.celebrationElapsed >= CELEBRATION_DURATION) this.active = null;
      return;
    }
    this.active.elapsed += dt;
    this.updateHintStage();
  }

  chooseUnit(unitId) {
    if (!this.active || this.active.status !== 'active') {
      return { accepted: false, reason: 'inactive' };
    }
    const beat = this.beats[this.active.beatId];
    const units = correctUnits(beat);
    const expected = units[this.active.stepIndex];
    const offered = offeredUnits(beat, this.active);
    if (!offered.some((unit) => unit.id === unitId)) {
      return { accepted: false, reason: 'not-offered' };
    }

    const assisted = this.active.hintStage === 'complete';
    const offAssembly = this.active.mode === 'off' && beat.kind === 'assembly';
    const correct = unitId === expected.id || assisted || offAssembly;
    if (!correct) {
      this.active.failedAttempts += 1;
      this.emit('learning.attempted', {
        beat: beat.id,
        unit: unitId,
        outcome: 'wrong',
        step: this.active.stepIndex,
        ...(beat.feedback ? {
          voice: beat.feedback.wrongVoice,
          caption: beat.feedback.wrongCaption,
        } : {}),
      });
      this.updateHintStage();
      return {
        accepted: true,
        correct: false,
        completed: false,
        expectedUnitId: expected.id,
      };
    }

    const completedUnitIds = [...this.active.completedUnitIds, expected.id];
    const completed = completedUnitIds.length === units.length;
    if (completed && this.onComplete(beat) === false) return false;

    this.active.completedUnitIds = completedUnitIds;
    this.active.stepIndex += 1;
    this.emit('learning.attempted', {
      beat: beat.id,
      unit: expected.id,
      outcome: assisted || offAssembly ? 'assisted' : 'correct',
      step: this.active.stepIndex - 1,
    });
    if (completed) {
      this.active.status = 'completed';
      this.active.celebrationElapsed = 0;
      this.active.elapsed = 0;
      this.active.failedAttempts = 0;
      this.active.hintStage = 'ready';
      this.emit('learning.completed', { beat: beat.id });
    } else {
      this.active.elapsed = 0;
      this.active.failedAttempts = 0;
      this.setHintStage('ready');
    }
    return {
      accepted: true,
      correct: true,
      completed,
      expectedUnitId: expected.id,
    };
  }

  updateHintStage() {
    if (!this.active || this.active.status !== 'active') return;
    this.setHintStage(stageFor(this.active));
  }

  setHintStage(stage) {
    if (!this.active || this.active.hintStage === stage) return;
    if (stageIndex(stage) < 0) throw new Error(`Unknown learning hint stage ${stage}.`);
    this.active.hintStage = stage;
    this.emit('learning.hintChanged', { beat: this.active.beatId, stage });
  }

  snapshot() {
    if (!this.active) return null;
    const beat = this.beats[this.active.beatId];
    const ordered = correctUnits(beat);
    const expected = ordered[this.active.stepIndex] ?? null;
    const focused = this.active.hintStage === 'focus' || this.active.hintStage === 'complete';
    const completedCount = this.active.completedUnitIds.length;
    const progress = ordered.length ? completedCount / ordered.length : 0;
    const slots = ordered.map((unit, index) => Object.freeze({
      id: unit.id,
      glyph: unit.glyph,
      voice: unit.voice,
      landed: this.active.completedUnitIds.includes(unit.id),
      expected: index === this.active.stepIndex,
      hidden: adaptiveSlotHidden(beat, this.active, index),
    }));
    const tiles = offeredUnits(beat, this.active).map((unit) => Object.freeze({
      id: unit.id,
      glyph: unit.glyph,
      voice: unit.voice,
      landed: false,
      expected: unit.id === expected?.id,
      dimmed: focused && unit.id !== expected?.id,
      highlighted: this.active.hintStage !== 'ready' && unit.id === expected?.id,
    }));
    return Object.freeze({
      beatId: beat.id,
      kind: beat.kind,
      skill: beat.skill,
      mode: this.active.mode,
      status: this.active.status,
      stepIndex: this.active.stepIndex,
      stepCount: ordered.length,
      expectedUnitId: expected?.id ?? null,
      completedUnitIds: Object.freeze([...this.active.completedUnitIds]),
      slots: Object.freeze(slots),
      tiles: Object.freeze(tiles),
      hintStage: this.active.hintStage,
      failedAttempts: this.active.failedAttempts,
      elapsed: this.active.elapsed,
      wandCharge: beat.kind === 'assembly' ? progress : 0,
      featherLift: beat.kind === 'sequence' ? progress : 0,
    });
  }

  capture() {
    return cloneActive(this.active);
  }

  restore(snapshot) {
    this.active = cloneActive(snapshot);
  }
}

export const LEARNING_HINT_THRESHOLDS = HINT_THRESHOLDS;
