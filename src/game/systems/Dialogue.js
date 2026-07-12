import { conditionMatches } from '../core/conditions.js';

export class Dialogue {
  constructor({ scripts = {}, save, emit = () => {}, runActions = () => {} } = {}) {
    this.scripts = scripts;
    this.save = save;
    this.emit = emit;
    this.runActions = runActions;
    this.scriptId = null;
    this.nodeId = null;
    this.history = [];
  }

  get active() {
    return Boolean(this.scriptId && this.nodeId);
  }

  get script() {
    return this.scripts[this.scriptId] ?? null;
  }

  get node() {
    return this.script?.nodes?.[this.nodeId] ?? null;
  }

  open(scriptId) {
    const script = this.scripts[scriptId];
    if (!script) throw new Error(`Unknown dialogue script: ${scriptId}`);
    this.scriptId = scriptId;
    this.nodeId = script.start;
    this.history = [];
    this.resolveAutomaticNodes();
    this.emit('dialogue.opened', { script: scriptId, node: this.nodeId });
    this.emitNodeChanged();
    return this.presentation();
  }

  advance(choiceId = null) {
    if (!this.active) return null;
    const node = this.node;
    if (!node) return this.close('invalid-node');

    if (node.type === 'line') {
      this.history.push(this.nodeId);
      this.nodeId = node.next;
    } else if (node.type === 'choice') {
      const choice = node.choices.find((candidate) => candidate.id === choiceId);
      if (!choice) return this.presentation();
      this.runActions(choice.actions ?? []);
      this.history.push(this.nodeId);
      this.nodeId = choice.next;
    } else if (node.type === 'end') {
      this.runActions(node.actions ?? []);
      return this.close('completed');
    }

    this.resolveAutomaticNodes();
    if (!this.active) return null;
    this.emitNodeChanged();
    return this.presentation();
  }

  replay() {
    if (!this.active || this.node?.type !== 'line') return null;
    this.emit('dialogue.lineChanged', { script: this.scriptId, node: this.nodeId, replay: true });
    return this.presentation();
  }

  resolveAutomaticNodes() {
    let guard = 0;
    while (this.active && guard < 100) {
      guard += 1;
      const node = this.node;
      if (!node) {
        this.close('invalid-node');
        return;
      }
      if (node.type === 'action') {
        this.runActions(node.actions ?? []);
        this.nodeId = node.next;
        continue;
      }
      if (node.type === 'branch') {
        const branch = node.cases.find((candidate) => conditionMatches(candidate.when, this.save));
        this.nodeId = branch?.next ?? node.fallback;
        continue;
      }
      if (node.type === 'end') {
        this.runActions(node.actions ?? []);
        this.close('completed');
      }
      return;
    }
    if (guard >= 100) throw new Error(`Dialogue ${this.scriptId} exceeded the automatic-node guard.`);
  }

  emitNodeChanged() {
    const type = this.node?.type === 'choice' ? 'dialogue.choicesChanged' : 'dialogue.lineChanged';
    this.emit(type, { script: this.scriptId, node: this.nodeId });
  }

  presentation() {
    if (!this.active) return null;
    const node = this.node;
    if (node.type === 'line') {
      return {
        scriptId: this.scriptId,
        nodeId: this.nodeId,
        type: 'line',
        speaker: node.speaker,
        speakerLabel: node.speakerLabel,
        voice: node.voice,
        text: node.text,
        caption: node.caption,
        portraitPose: node.portraitPose,
      };
    }
    if (node.type === 'choice') {
      return {
        scriptId: this.scriptId,
        nodeId: this.nodeId,
        type: 'choice',
        choices: node.choices.map(({ id, icon, caption }) => ({ id, icon, caption })),
      };
    }
    return null;
  }

  close(reason = 'dismissed') {
    const script = this.scriptId;
    this.scriptId = null;
    this.nodeId = null;
    this.history = [];
    this.emit('dialogue.closed', { script, reason });
    return null;
  }
}
