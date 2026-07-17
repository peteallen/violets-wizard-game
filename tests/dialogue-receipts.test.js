import { describe, expect, it, vi } from 'vitest';
import { Dialogue } from '../src/game/systems/Dialogue.js';

function saveWith(receipts = []) {
  return { progress: { storyReceipts: receipts } };
}

function script({
  resumePolicy = 'restart-current-node',
  replayable = true,
  start = 'first',
  nodes = {
    first: { type: 'line', text: 'First', caption: 'First', next: 'second' },
    second: { type: 'line', text: 'Second', caption: 'Second', next: null },
  },
} = {}) {
  return { start, resumePolicy, replayable, nodes };
}

describe('Dialogue durable cursors', () => {
  it('only exposes and restores visible line and choice pages', () => {
    const runActions = vi.fn();
    const dialogue = new Dialogue({
      save: saveWith(),
      runActions,
      scripts: {
        story: script({
          start: 'prepare',
          nodes: {
            prepare: { type: 'action', actions: [{ type: 'flag.set', flag: 'prepared' }], next: 'page' },
            page: { type: 'line', text: 'Ready', caption: 'Ready', next: 'decide' },
            decide: {
              type: 'choice',
              choices: [
                { id: 'one', icon: 'one', caption: 'One', next: 'finish' },
                { id: 'two', icon: 'two', caption: 'Two', next: 'finish' },
              ],
            },
            finish: { type: 'end', actions: [] },
          },
        }),
      },
    });

    expect(dialogue.isCursorRestorable({ script: 'story', node: 'prepare' })).toBe(false);
    expect(dialogue.isCursorRestorable({ script: 'story', node: 'finish' })).toBe(false);
    expect(dialogue.openAtCursor({ script: 'story', node: 'prepare' })).toBeNull();
    expect(runActions).not.toHaveBeenCalled();

    expect(dialogue.open('story').nodeId).toBe('page');
    expect(dialogue.cursor).toEqual({ script: 'story', node: 'page' });
    dialogue.close();

    expect(dialogue.openAtCursor({ script: 'story', node: 'decide' })).toMatchObject({
      type: 'choice',
      nodeId: 'decide',
    });
    expect(dialogue.cursor).toEqual({ script: 'story', node: 'decide' });
    expect(runActions).toHaveBeenCalledTimes(1);
  });

  it('restarts from the saved visible page or the script start according to resume policy', () => {
    const runActions = vi.fn();
    const dialogue = new Dialogue({
      save: saveWith(),
      runActions,
      scripts: {
        continueHere: script(),
        restart: script({
          resumePolicy: 'restart-script',
          start: 'prepare',
          nodes: {
            prepare: { type: 'action', actions: [{ type: 'flag.set', flag: 'started' }], next: 'first' },
            first: { type: 'line', text: 'First', caption: 'First', next: 'second' },
            second: { type: 'line', text: 'Second', caption: 'Second', next: null },
          },
        }),
      },
    });

    expect(dialogue.openAtCursor({ script: 'continueHere', node: 'second' }).nodeId).toBe('second');
    dialogue.close();
    expect(dialogue.openAtCursor({ script: 'restart', node: 'second' }).nodeId).toBe('first');
    dialogue.close();
    expect(dialogue.openAtCursor({ script: 'restart', node: 'retired-page' }).nodeId).toBe('first');
    expect(runActions).toHaveBeenCalledWith([{ type: 'flag.set', flag: 'started' }]);
  });
});

describe('Dialogue story receipts', () => {
  it('does not reopen completed non-replayable scripts or run their automatic actions', () => {
    const runActions = vi.fn();
    const dialogue = new Dialogue({
      save: saveWith(['story']),
      runActions,
      scripts: {
        story: script({
          replayable: false,
          start: 'grant',
          nodes: {
            grant: { type: 'action', actions: [{ type: 'reward.grant', receipt: 'story.reward' }], next: 'page' },
            page: { type: 'line', text: 'Already done', caption: 'Already done', next: null },
          },
        }),
      },
    });

    expect(dialogue.isCursorRestorable({ script: 'story', node: 'page' })).toBe(false);
    expect(dialogue.open('story')).toBeNull();
    expect(dialogue.openAtCursor({ script: 'story', node: 'page' })).toBeNull();
    expect(dialogue.active).toBe(false);
    expect(runActions).not.toHaveBeenCalled();
  });

  it('keeps legacy scripts and saves usable when replay metadata or receipts are absent', () => {
    const runActions = vi.fn();
    const dialogue = new Dialogue({
      save: { progress: {} },
      runActions,
      scripts: {
        legacy: {
          start: 'prepare',
          nodes: {
            prepare: { type: 'action', actions: [{ type: 'flag.set', flag: 'prepared' }], next: 'page' },
            page: { type: 'line', text: 'Welcome', caption: 'Welcome', next: null },
          },
        },
      },
    });

    expect(dialogue.open('legacy').nodeId).toBe('page');
    expect(runActions).toHaveBeenCalledTimes(1);
    dialogue.close();
    expect(dialogue.openAtCursor({ script: 'legacy', node: 'page' }).nodeId).toBe('page');
  });
});
