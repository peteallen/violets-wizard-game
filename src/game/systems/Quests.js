import { conditionMatches } from '../core/conditions.js';

export class Quests {
  constructor({ quests = {}, save, emit = () => {} } = {}) {
    this.quests = quests;
    this.save = save;
    this.emit = emit;
    this.lastObjectiveKey = null;
  }

  active() {
    for (const quest of Object.values(this.quests)) {
      if (!conditionMatches(quest.startWhen, this.save)) continue;
      let stepId = quest.startStep;
      const visited = new Set();
      while (stepId && !visited.has(stepId)) {
        visited.add(stepId);
        const step = quest.steps[stepId];
        if (!step) break;
        if (!conditionMatches(step.doneWhen, this.save)) return { quest, step, stepId };
        stepId = step.next;
      }
    }
    return null;
  }

  objective() {
    return this.active()?.step?.objective ?? null;
  }

  update() {
    const active = this.active();
    const key = active ? `${active.quest.id}:${active.stepId}` : null;
    if (key !== this.lastObjectiveKey) {
      this.lastObjectiveKey = key;
      if (active) this.emit('quest.objectiveChanged', { quest: active.quest.id, step: active.stepId });
    }
    return active;
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
