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

  // A save may only point at a page the player can actually see. Automatic
  // nodes can grant rewards, change flags, or finish a chapter, so restoring
  // one of them would repeat hidden story work during a reload.
  get cursor() {
    if (!this.active || !isVisibleDialogueNode(this.node)) return null;
    return { script: this.scriptId, node: this.nodeId };
  }

  isCursorRestorable(cursor) {
    if (!isDialogueCursor(cursor)) return false;
    const script = this.scripts[cursor.script];
    if (!script || this.isCompletedNonReplayableScript(cursor.script)) return false;
    if (script.resumePolicy === 'restart-script') return true;
    return isVisibleDialogueNode(script.nodes?.[cursor.node]);
  }

  openAtCursor(cursor) {
    if (!this.isCursorRestorable(cursor)) return null;
    const script = this.scripts[cursor.script];
    if (script.resumePolicy === 'restart-script') return this.open(cursor.script);

    const checkpoint = this.checkpoint();
    this.scriptId = cursor.script;
    this.nodeId = cursor.node;
    this.history = [];
    this.emit('dialogue.opened', { script: this.scriptId, node: this.nodeId });
    if (!this.emitNodeChanged()) {
      this.restoreCheckpoint(checkpoint);
      return false;
    }
    return this.presentation();
  }

  open(scriptId) {
    const script = this.scripts[scriptId];
    if (!script) throw new Error(`Unknown dialogue script: ${scriptId}`);
    if (this.isCompletedNonReplayableScript(scriptId)) return null;
    const checkpoint = this.checkpoint();
    this.scriptId = scriptId;
    this.nodeId = script.start;
    this.history = [];
    const resolution = this.resolveAutomaticNodes();
    if (resolution === false) {
      this.restoreCheckpoint(checkpoint);
      return false;
    }
    if (!this.active) return null;
    this.emit('dialogue.opened', { script: scriptId, node: this.nodeId });
    if (!this.emitNodeChanged()) {
      this.restoreCheckpoint(checkpoint);
      return false;
    }
    return this.presentation();
  }

  isCompletedNonReplayableScript(scriptId) {
    const script = this.scripts[scriptId];
    const receipts = this.save?.progress?.storyReceipts;
    return script?.replayable === false
      && Array.isArray(receipts)
      && receipts.includes(scriptId);
  }

  advance(choiceId = null) {
    if (!this.active) return null;
    const node = this.node;
    if (!node) return this.close('invalid-node');
    const checkpoint = this.checkpoint();

    if (node.type === 'line') {
      this.history.push(this.nodeId);
      this.nodeId = node.next;
    } else if (node.type === 'choice') {
      const choice = node.choices.find((candidate) => candidate.id === choiceId);
      if (!choice) return this.presentation();
      const actionResult = this.runActions(choice.actions ?? []);
      if (actionResult === false) {
        this.restoreCheckpoint(checkpoint);
        return false;
      }
      if (actionResult === 'terminal') return this.close('completed');
      this.history.push(this.nodeId);
      this.nodeId = choice.next;
    } else if (node.type === 'end') {
      if (this.runActions(node.actions ?? []) === false) {
        this.restoreCheckpoint(checkpoint);
        return false;
      }
      return this.close('completed');
    }

    if (!this.nodeId) return this.close('completed');

    const resolution = this.resolveAutomaticNodes();
    if (resolution === false) {
      this.restoreCheckpoint(checkpoint);
      return false;
    }
    if (resolution === 'terminal') return null;
    if (resolution === 'closed') return this.presentation();
    if (!this.active) return null;
    if (!this.emitNodeChanged()) {
      this.restoreCheckpoint(checkpoint);
      return false;
    }
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
        return 'closed';
      }
      if (node.type === 'action') {
        const actionResult = this.runActions(node.actions ?? []);
        if (actionResult === false) return false;
        if (actionResult === 'terminal') {
          this.close('completed');
          return 'terminal';
        }
        this.nodeId = node.next;
        if (!this.nodeId) {
          this.close('completed');
          return 'closed';
        }
        continue;
      }
      if (node.type === 'branch') {
        const branch = node.cases.find((candidate) => conditionMatches(candidate.when, this.save));
        this.nodeId = branch?.next ?? node.fallback;
        if (!this.nodeId) {
          this.close('completed');
          return 'closed';
        }
        continue;
      }
      if (node.type === 'end') {
        if (this.runActions(node.actions ?? []) === false) return false;
        this.close('completed');
        return 'closed';
      }
      return true;
    }
    if (guard >= 100) throw new Error(`Dialogue ${this.scriptId} exceeded the automatic-node guard.`);
    return true;
  }

  checkpoint() {
    return {
      scriptId: this.scriptId,
      nodeId: this.nodeId,
      history: [...this.history],
    };
  }

  restoreCheckpoint(checkpoint) {
    this.scriptId = checkpoint.scriptId;
    this.nodeId = checkpoint.nodeId;
    this.history = [...checkpoint.history];
  }

  emitNodeChanged() {
    const type = this.node?.type === 'choice' ? 'dialogue.choicesChanged' : 'dialogue.lineChanged';
    return this.emit(type, { script: this.scriptId, node: this.nodeId }) !== false;
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
        choices: node.choices.map(({
          id,
          icon,
          caption,
          characterId,
          characterScale,
        }) => ({
          id,
          icon,
          caption,
          ...(characterId !== undefined ? { characterId } : {}),
          ...(characterScale !== undefined ? { characterScale } : {}),
        })),
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

function isDialogueCursor(cursor) {
  return cursor !== null
    && typeof cursor === 'object'
    && !Array.isArray(cursor)
    && typeof cursor.script === 'string'
    && cursor.script.length > 0
    && typeof cursor.node === 'string'
    && cursor.node.length > 0;
}

function isVisibleDialogueNode(node) {
  return node?.type === 'line' || node?.type === 'choice';
}
