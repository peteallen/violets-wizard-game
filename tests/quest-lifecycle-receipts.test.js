import { describe, expect, it, vi } from 'vitest';
import { Quests } from '../src/game/systems/Quests.js';

function save({ receipts = undefined, flags = {} } = {}) {
  return {
    progress: {
      questFlags: { ...flags },
      ...(receipts === undefined ? {} : { questReceipts: [...receipts] }),
    },
  };
}

function questDefinition({ firstComplete = [], secondEnter = [], secondComplete = [], complete = [] } = {}) {
  return {
    id: 'ch1.shoppingTrip',
    startWhen: {},
    startStep: 'first',
    steps: {
      first: {
        objective: { caption: 'First task' },
        doneWhen: { allFlags: ['ch1.firstDone'] },
        onEnter: [{ type: 'first.entered' }],
        onComplete: firstComplete,
        next: 'second',
      },
      second: {
        objective: { caption: 'Second task' },
        doneWhen: { allFlags: ['ch1.secondDone'] },
        onEnter: secondEnter,
        onComplete: secondComplete,
        next: null,
      },
    },
    onComplete: complete,
  };
}

function receiptIds() {
  return {
    adopted: 'ch1.shoppingTrip.quest.v1.adopted',
    firstEntered: 'ch1.shoppingTrip.quest.v1.step.first.entered',
    firstCompleted: 'ch1.shoppingTrip.quest.v1.step.first.completed',
    secondEntered: 'ch1.shoppingTrip.quest.v1.step.second.entered',
    secondCompleted: 'ch1.shoppingTrip.quest.v1.step.second.completed',
    completed: 'ch1.shoppingTrip.quest.v1.completed',
  };
}

describe('quest lifecycle receipts', () => {
  it('keeps legacy saves derive-only without creating a receipt bucket or replaying actions', () => {
    const currentSave = save({ flags: { 'ch1.firstDone': true } });
    const runActions = vi.fn();
    const quests = new Quests({
      save: currentSave,
      durableLifecycle: true,
      quests: { shopping: questDefinition() },
      runActions,
    });

    expect(quests.update().stepId).toBe('second');
    expect(currentSave.progress.questReceipts).toBeUndefined();
    expect(runActions).not.toHaveBeenCalled();
  });

  it('adopts existing progress silently before later transitions execute once', () => {
    const ids = receiptIds();
    const currentSave = save({ receipts: [], flags: { 'ch1.firstDone': true } });
    const actions = [];
    const quests = new Quests({
      save: currentSave,
      durableLifecycle: true,
      quests: {
        shopping: questDefinition({
          secondEnter: [{ type: 'second.entered' }],
          secondComplete: [{ type: 'second.completed' }],
          complete: [{ type: 'quest.completed' }],
        }),
      },
      runActions: (batch) => actions.push(...batch.map(({ type }) => type)),
    });

    expect(quests.update().stepId).toBe('second');
    expect(actions).toEqual([]);
    expect(currentSave.progress.questReceipts).toEqual([
      ids.firstEntered,
      ids.firstCompleted,
      ids.secondEntered,
      ids.adopted,
    ]);

    currentSave.progress.questFlags['ch1.secondDone'] = true;
    expect(quests.update()).toBeNull();
    expect(actions).toEqual(['second.completed', 'quest.completed']);
    expect(currentSave.progress.questReceipts).toEqual([
      ids.firstEntered,
      ids.firstCompleted,
      ids.secondEntered,
      ids.adopted,
      ids.secondCompleted,
      ids.completed,
    ]);

    quests.update();
    expect(actions).toEqual(['second.completed', 'quest.completed']);
  });

  it('persists each receipt before its action batch and settles chained transitions in one update', () => {
    const ids = receiptIds();
    const currentSave = save({ receipts: [] });
    const timeline = [];
    const claimReceipt = vi.fn((receipt) => {
      if (currentSave.progress.questReceipts.includes(receipt)) return false;
      currentSave.progress.questReceipts.push(receipt);
      timeline.push(`claim:${receipt}`);
      return true;
    });
    const quests = new Quests({
      save: currentSave,
      durableLifecycle: true,
      quests: {
        shopping: questDefinition({
          firstComplete: [{ type: 'first.completed' }],
          secondEnter: [{ type: 'second.entered' }],
          secondComplete: [{ type: 'second.completed' }],
          complete: [{ type: 'quest.completed' }],
        }),
      },
      claimReceipt,
      runActions: (batch) => {
        for (const { type } of batch) {
          timeline.push(`action:${type}`);
          if (type === 'first.completed') currentSave.progress.questFlags['ch1.secondDone'] = true;
        }
      },
    });

    quests.update(); // Fresh saves silently adopt the initial objective.
    timeline.length = 0;
    claimReceipt.mockClear();
    currentSave.progress.questFlags['ch1.firstDone'] = true;

    expect(quests.update()).toBeNull();
    expect(timeline).toEqual([
      `claim:${ids.firstCompleted}`,
      'action:first.completed',
      `claim:${ids.secondEntered}`,
      'action:second.entered',
      `claim:${ids.secondCompleted}`,
      'action:second.completed',
      `claim:${ids.completed}`,
      'action:quest.completed',
    ]);
    expect(claimReceipt).toHaveBeenCalledTimes(4);
  });

  it('does not adopt past a failed historical receipt claim or replay its actions later', () => {
    const ids = receiptIds();
    const currentSave = save({ receipts: [], flags: { 'ch1.firstDone': true } });
    const runActions = vi.fn();
    let failSecondEntry = true;
    const quests = new Quests({
      save: currentSave,
      durableLifecycle: true,
      quests: {
        shopping: questDefinition({ secondEnter: [{ type: 'second.entered' }] }),
      },
      claimReceipt: (receipt) => {
        if (receipt === ids.secondEntered && failSecondEntry) return false;
        if (currentSave.progress.questReceipts.includes(receipt)) return false;
        currentSave.progress.questReceipts.push(receipt);
        return true;
      },
      runActions,
    });

    quests.update();
    expect(currentSave.progress.questReceipts).not.toContain(ids.adopted);
    expect(runActions).not.toHaveBeenCalled();

    failSecondEntry = false;
    quests.update();
    expect(currentSave.progress.questReceipts).toEqual(expect.arrayContaining([
      ids.secondEntered,
      ids.adopted,
    ]));
    expect(runActions).not.toHaveBeenCalled();
  });

  it('runs the first entry batch when a quest becomes eligible during live play', () => {
    const currentSave = save({ receipts: [] });
    const runActions = vi.fn();
    const quest = questDefinition();
    quest.startWhen = { allFlags: ['ch1.questStarted'] };
    const quests = new Quests({
      save: currentSave,
      durableLifecycle: true,
      quests: { shopping: quest },
      runActions,
    });

    expect(quests.update()).toBeNull();
    currentSave.progress.questFlags['ch1.questStarted'] = true;
    expect(quests.update()?.stepId).toBe('first');

    expect(runActions).toHaveBeenCalledExactlyOnceWith([{ type: 'first.entered' }]);
    expect(currentSave.progress.questReceipts).toEqual(expect.arrayContaining([
      'ch1.shoppingTrip.quest.v1.adopted',
      'ch1.shoppingTrip.quest.v1.step.first.entered',
    ]));
  });

  it('settles every receipt in a valid sixty-four-step live quest', () => {
    const steps = Object.fromEntries(Array.from({ length: 64 }, (_, index) => {
      const stepId = `step${index}`;
      return [stepId, {
        objective: { caption: stepId },
        doneWhen: { allFlags: [`ch1.done${index}`] },
        onEnter: [],
        onComplete: [],
        next: index === 63 ? null : `step${index + 1}`,
      }];
    }));
    const currentSave = save({
      receipts: [],
      flags: Object.fromEntries(Array.from({ length: 64 }, (_, index) => [`ch1.done${index}`, true])),
    });
    const quests = new Quests({
      save: currentSave,
      durableLifecycle: true,
      quests: {
        long: {
          id: 'ch1.longQuest',
          startWhen: {},
          startStep: 'step0',
          steps,
          onComplete: [],
        },
      },
    });
    quests.initialize({ historical: false });

    expect(() => quests.update()).not.toThrow();
    expect(currentSave.progress.questReceipts).toHaveLength(130);
    expect(currentSave.progress.questReceipts).toContain('ch1.longQuest.quest.v1.completed');
  });
});
