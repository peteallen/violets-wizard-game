export const SPELLBOOK_STATES = Object.freeze({
  closed: 'closed',
  fan: 'fan',
  targeting: 'targeting',
  casting: 'casting',
});

const CASTING_DURATION = 0.75;

function cloneCast(cast) {
  return cast ? { ...cast } : null;
}

export class Spellbook {
  constructor({
    spells = {},
    save,
    emit = () => {},
    onCast = () => false,
    now = () => 0,
  } = {}) {
    if (!save?.spellbook) throw new TypeError('Spellbook requires the existing save spellbook record.');
    this.spells = spells;
    this.save = save;
    this.emit = emit;
    this.onCast = onCast;
    this.now = now;
    this.state = SPELLBOOK_STATES.closed;
    this.selectedSpellId = null;
    this.cast = null;
    this.castingElapsed = 0;
    this.busy = false;
  }

  get blocksWorldInput() {
    return this.state === SPELLBOOK_STATES.fan || this.state === SPELLBOOK_STATES.casting;
  }

  open() {
    if (this.state === SPELLBOOK_STATES.casting) return false;
    this.state = SPELLBOOK_STATES.fan;
    this.selectedSpellId = null;
    this.cast = null;
    this.emitState();
    return true;
  }

  select(spellId) {
    if (![SPELLBOOK_STATES.fan, SPELLBOOK_STATES.targeting].includes(this.state)) return false;
    if (!this.save.spellbook.known.includes(spellId) || !this.spells[spellId]) return false;
    this.state = SPELLBOOK_STATES.targeting;
    this.selectedSpellId = spellId;
    this.cast = null;
    this.emitState();
    return true;
  }

  cancel() {
    if (this.state === SPELLBOOK_STATES.casting) return false;
    if (this.state === SPELLBOOK_STATES.targeting) {
      this.state = SPELLBOOK_STATES.fan;
      this.selectedSpellId = null;
    } else if (this.state === SPELLBOOK_STATES.fan) {
      this.state = SPELLBOOK_STATES.closed;
      this.selectedSpellId = null;
    } else {
      return false;
    }
    this.cast = null;
    this.emitState();
    return true;
  }

  castAt(target) {
    if (this.busy || this.state !== SPELLBOOK_STATES.targeting || !this.selectedSpellId) return false;
    if (!target || target.kind !== 'spellTarget' || target.requiredSpell !== this.selectedSpellId) return false;
    const spell = this.spells[this.selectedSpellId];
    if (!spell || !this.save.spellbook.known.includes(spell.id)) return false;

    this.busy = true;
    let result;
    try {
      result = this.onCast({ spell, target });
    } finally {
      this.busy = false;
    }
    if (result === false || result?.ok === false) return result;

    this.state = SPELLBOOK_STATES.casting;
    this.cast = {
      spellId: spell.id,
      targetId: target.id,
      startedAt: this.now(),
    };
    this.castingElapsed = 0;
    this.emitState();
    return result ?? true;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new TypeError('Spellbook.update requires a non-negative finite delta.');
    if (this.state !== SPELLBOOK_STATES.casting) return;
    this.castingElapsed += dt;
    if (this.castingElapsed < CASTING_DURATION) return;
    this.state = SPELLBOOK_STATES.closed;
    this.selectedSpellId = null;
    this.cast = null;
    this.castingElapsed = 0;
    this.emitState();
  }

  snapshot(validTargets = []) {
    const known = this.save.spellbook.known
      .map((spellId) => this.spells[spellId])
      .filter(Boolean);
    const validTargetIds = this.state === SPELLBOOK_STATES.targeting
      ? validTargets
        .filter((target) => target.kind === 'spellTarget' && target.requiredSpell === this.selectedSpellId)
        .map((target) => target.id)
      : [];
    return Object.freeze({
      state: this.state,
      known: Object.freeze([...known]),
      selectedSpellId: this.selectedSpellId,
      validTargetIds: Object.freeze(validTargetIds),
      cast: this.cast ? Object.freeze(cloneCast(this.cast)) : null,
    });
  }

  emitState() {
    this.emit('spellbook.stateChanged', {
      state: this.state,
      selectedSpellId: this.selectedSpellId,
    });
  }

  capture() {
    return {
      state: this.state,
      selectedSpellId: this.selectedSpellId,
      cast: cloneCast(this.cast),
      castingElapsed: this.castingElapsed,
    };
  }

  restore(snapshot) {
    this.state = snapshot?.state ?? SPELLBOOK_STATES.closed;
    this.selectedSpellId = snapshot?.selectedSpellId ?? null;
    this.cast = cloneCast(snapshot?.cast);
    this.castingElapsed = snapshot?.castingElapsed ?? 0;
    this.busy = false;
  }
}
