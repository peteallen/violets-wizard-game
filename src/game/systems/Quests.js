import { conditionMatches } from '../core/conditions.js';

export class Quests {
  /**
   * `claimReceipt(receipt)` is the persistence boundary for quest lifecycle
   * actions. It must durably add `receipt` to `save.progress.questReceipts`
   * before returning true. Returning false means another update already owns
   * that receipt, so its action batch must not be run again. Controller-only
   * callers may omit it; an existing receipt array is then claimed in memory.
   */
  constructor({
    quests = {},
    save,
    emit = () => {},
    claimReceipt = null,
    runActions = () => {},
    lifecycleBlocked = () => false,
    commitTransition = null,
    durableLifecycle = false,
  } = {}) {
    this.quests = quests;
    this.save = save;
    this.emit = emit;
    this.claimReceipt = claimReceipt;
    this.runActions = runActions;
    this.lifecycleBlocked = lifecycleBlocked;
    this.commitTransition = commitTransition;
    this.durableLifecycle = durableLifecycle;
    this.lastObjectiveKey = null;
    this.silentAdoptions = null;
    this.settling = false;
    this.lastSettlementStatus = 'idle';
  }

  active() {
    const durableLifecycle = this.durableLifecycle
      && Array.isArray(this.save?.progress?.questReceipts);
    for (const quest of Object.values(this.quests)) {
      if (!conditionMatches(quest.startWhen, this.save)) continue;
      let stepId = quest.startStep;
      const visited = new Set();
      while (stepId && !visited.has(stepId)) {
        visited.add(stepId);
        const step = quest.steps[stepId];
        if (!step) break;
        if (durableLifecycle) {
          if (!this.hasReceipt(this.stepEnteredReceipt(quest, stepId))) return null;
          if (!this.hasReceipt(this.stepCompletedReceipt(quest, stepId))) {
            return { quest, step, stepId };
          }
        } else if (!conditionMatches(step.doneWhen, this.save)) {
          return { quest, step, stepId };
        }
        stepId = step.next;
      }
      if (durableLifecycle && !stepId && !this.hasReceipt(this.questCompletedReceipt(quest))) {
        return null;
      }
    }
    return null;
  }

  objective() {
    return this.active()?.step?.objective ?? null;
  }

  initialize({ historical = true } = {}) {
    if (this.silentAdoptions !== null) return;
    this.silentAdoptions = historical
      ? new Set(Object.values(this.quests)
        .filter((quest) => conditionMatches(quest.startWhen, this.save))
        .map((quest) => quest.id))
      : new Set();
  }

  update({ ignoreBlock = false } = {}) {
    this.initialize();
    this.lastSettlementStatus = this.settleLifecycle({ ignoreBlock });
    const active = this.active();
    const key = active ? `${active.quest.id}:${active.stepId}` : null;
    if (key !== this.lastObjectiveKey) {
      this.lastObjectiveKey = key;
      if (active) this.emit('quest.objectiveChanged', { quest: active.quest.id, step: active.stepId });
    }
    return active;
  }

  settleLifecycle({ ignoreBlock = false } = {}) {
    // v1 saves predate lifecycle receipts. They must continue to derive an
    // objective without creating a new field or replaying old story actions.
    if (!this.durableLifecycle || !Array.isArray(this.save?.progress?.questReceipts)) {
      return 'legacy';
    }
    if (this.settling) return 'reentrant';

    this.settling = true;
    try {
      const transitionLimit = this.lifecycleTransitionLimit();
      for (let attempts = 0; attempts < transitionLimit; attempts += 1) {
        if (!ignoreBlock && this.lifecycleBlocked()) return 'blocked';
        if (!this.settleOneLifecycleTransition()) {
          return this.hasPendingLifecycleTransition() ? 'failed' : 'settled';
        }
      }
      if (!ignoreBlock && this.lifecycleBlocked()) return 'blocked';
      if (!this.hasPendingLifecycleTransition()) return 'settled';
      throw new Error(`Quest lifecycle did not settle after ${transitionLimit} transitions.`);
    } finally {
      this.settling = false;
    }
  }

  hasPendingLifecycleTransition() {
    for (const quest of Object.values(this.quests)) {
      if (!conditionMatches(quest.startWhen, this.save)) continue;
      if (!this.hasReceipt(this.adoptedReceipt(quest)) || this.nextTransition(quest)) return true;
    }
    return false;
  }

  lifecycleTransitionLimit() {
    return Object.values(this.quests).reduce(
      (total, quest) => total + Object.keys(quest.steps ?? {}).length * 2 + 2,
      1,
    );
  }

  settleOneLifecycleTransition() {
    for (const quest of Object.values(this.quests)) {
      if (!conditionMatches(quest.startWhen, this.save)) continue;
      if (!this.hasReceipt(this.adoptedReceipt(quest))) {
        if (this.silentAdoptions.has(quest.id)) {
          const changed = this.adoptQuestSilently(quest);
          if (this.hasReceipt(this.adoptedReceipt(quest))) this.silentAdoptions.delete(quest.id);
          return changed;
        }
        return this.claim(this.adoptedReceipt(quest));
      }
      this.silentAdoptions.delete(quest.id);
      const transition = this.nextTransition(quest);
      if (!transition) continue;
      return this.runTransition(transition);
    }
    return false;
  }

  adoptQuestSilently(quest) {
    const receipts = [];
    let stepId = quest.startStep;
    const visited = new Set();

    // Store every receipt that describes the already-reached prefix before
    // writing adoption. An interrupted migration therefore remains silent on
    // its next update instead of replaying any historical action batch.
    while (stepId && !visited.has(stepId)) {
      visited.add(stepId);
      const step = quest.steps[stepId];
      if (!step) break;
      receipts.push(this.stepEnteredReceipt(quest, stepId));
      if (!conditionMatches(step.doneWhen, this.save)) break;
      receipts.push(this.stepCompletedReceipt(quest, stepId));
      stepId = step.next;
    }
    if (!stepId) receipts.push(this.questCompletedReceipt(quest));

    let changed = false;
    for (const receipt of receipts) {
      if (this.hasReceipt(receipt)) continue;
      if (!this.claim(receipt)) return changed;
      changed = true;
    }
    if (!this.hasReceipt(this.adoptedReceipt(quest))) {
      if (!this.claim(this.adoptedReceipt(quest))) return changed;
      changed = true;
    }
    return changed;
  }

  nextTransition(quest) {
    let stepId = quest.startStep;
    const visited = new Set();

    while (stepId && !visited.has(stepId)) {
      visited.add(stepId);
      const step = quest.steps[stepId];
      if (!step) return null;

      if (!this.hasReceipt(this.stepEnteredReceipt(quest, stepId))) {
        return {
          receipt: this.stepEnteredReceipt(quest, stepId),
          actions: step.onEnter ?? [],
        };
      }
      if (!this.hasReceipt(this.stepCompletedReceipt(quest, stepId))) {
        if (!conditionMatches(step.doneWhen, this.save)) return null;
        return {
          receipt: this.stepCompletedReceipt(quest, stepId),
          actions: step.onComplete ?? [],
        };
      }
      stepId = step.next;
    }

    if (!stepId && !this.hasReceipt(this.questCompletedReceipt(quest))) {
      return {
        receipt: this.questCompletedReceipt(quest),
        actions: quest.onComplete ?? [],
      };
    }
    return null;
  }

  runTransition({ receipt, actions }) {
    if (this.hasReceipt(receipt)) return false;
    if (typeof this.commitTransition === 'function') {
      return this.commitTransition(receipt, actions) === true;
    }
    if (!this.claim(receipt)) return false;
    this.runActions(actions);
    return true;
  }

  claim(receipt) {
    if (this.hasReceipt(receipt)) return false;
    if (typeof this.claimReceipt === 'function') return this.claimReceipt(receipt) === true;
    this.save.progress.questReceipts.push(receipt);
    return true;
  }

  hasReceipt(receipt) {
    return this.save.progress.questReceipts.includes(receipt);
  }

  adoptedReceipt(quest) {
    return `${quest.id}.quest.v1.adopted`;
  }

  stepEnteredReceipt(quest, stepId) {
    return `${quest.id}.quest.v1.step.${stepId}.entered`;
  }

  stepCompletedReceipt(quest, stepId) {
    return `${quest.id}.quest.v1.step.${stepId}.completed`;
  }

  questCompletedReceipt(quest) {
    return `${quest.id}.quest.v1.completed`;
  }

  canReachAllSteps(quest) {
    const visited = new Set();
    const visit = (id) => {
      if (!id || visited.has(id)) return;
      visited.add(id);
      const step = quest.steps[id];
      if (step) visit(step.next);
    };
    visit(quest.startStep);
    return Object.keys(quest.steps).every((id) => visited.has(id));
  }
}
