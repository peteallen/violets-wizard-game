import { describe, expect, it, vi } from 'vitest';
import { Dialogue } from '../src/game/systems/Dialogue.js';
import { Quests } from '../src/game/systems/Quests.js';

const save = { progress: { questFlags: {} }, character: { pet: {}, appearance: {} }, spellbook: { known: [] }, settings: { learning: 'gentle' } };

describe('Dialogue', () => {
  it('runs line, choice, and end nodes deterministically', () => {
    const runActions = vi.fn();
    const dialogue = new Dialogue({
      save,
      runActions,
      scripts: {
        hello: {
          start: 'line',
          nodes: {
            line: { type: 'line', text: 'Hello', caption: 'Hello!', next: 'choice' },
            choice: { type: 'choice', choices: [{ id: 'yes', icon: 'star', caption: 'Yes!', actions: [{ type: 'flag.set', flag: 'yes' }], next: 'end' }] },
            end: { type: 'end', actions: [{ type: 'flag.set', flag: 'done' }] },
          },
        },
      },
    });
    expect(dialogue.open('hello').text).toBe('Hello');
    expect(dialogue.advance().type).toBe('choice');
    dialogue.advance('yes');
    expect(dialogue.active).toBe(false);
    expect(runActions).toHaveBeenCalledTimes(2);
  });
});

describe('Quests', () => {
  it('derives the current step from persistent completion flags', () => {
    const quests = new Quests({
      save,
      quests: {
        shopping: {
          id: 'shopping',
          startWhen: {},
          startStep: 'wand',
          steps: {
            wand: { objective: { caption: 'Find wand' }, doneWhen: { allFlags: ['wand'] }, next: 'pet' },
            pet: { objective: { caption: 'Find pet' }, doneWhen: { allFlags: ['pet'] }, next: null },
          },
        },
      },
    });
    expect(quests.objective().caption).toBe('Find wand');
    save.progress.questFlags.wand = true;
    expect(quests.objective().caption).toBe('Find pet');
  });
});
