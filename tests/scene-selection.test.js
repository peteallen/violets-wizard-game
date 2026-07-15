import { describe, expect, it } from 'vitest';
import { selectChapterScene } from '../src/game/world/sceneSelection.js';

const scenes = Object.freeze({
  'ch1.early': Object.freeze({
    id: 'ch1.early', room: 'ch1.street', order: 10, when: { allFlags: ['ch1.arrived'] },
  }),
  'ch1.late': Object.freeze({
    id: 'ch1.late', room: 'ch1.street', order: 30, when: { allFlags: ['ch1.arrived'] },
  }),
  'ch1.shop': Object.freeze({
    id: 'ch1.shop', room: 'ch1.shop', order: 20, when: { allFlags: ['ch1.arrived'] },
  }),
  'ch1.locked': Object.freeze({
    id: 'ch1.locked', room: 'ch1.street', order: 40, when: { allFlags: ['ch1.complete'] },
  }),
});

function save(flags = {}) {
  return { progress: { questFlags: flags }, character: {} };
}

describe('explicit chapter scene selection', () => {
  it('retains a saved scene that still matches the room and eligibility', () => {
    expect(selectChapterScene({
      scenes,
      roomId: 'ch1.street',
      savedSceneId: 'ch1.early',
      save: save({ 'ch1.arrived': true }),
    })).toBe(scenes['ch1.early']);
  });

  it('selects the highest-order eligible scene when the saved scene belongs to another room', () => {
    expect(selectChapterScene({
      scenes,
      roomId: 'ch1.street',
      savedSceneId: 'ch1.shop',
      save: save({ 'ch1.arrived': true }),
    })).toBe(scenes['ch1.late']);
  });

  it('selects the highest-order eligible scene when the saved scene is no longer eligible', () => {
    expect(selectChapterScene({
      scenes,
      roomId: 'ch1.street',
      savedSceneId: 'ch1.locked',
      save: save({ 'ch1.arrived': true }),
    })).toBe(scenes['ch1.late']);
  });

  it('returns null when the room has no eligible authored scene', () => {
    expect(selectChapterScene({
      scenes,
      roomId: 'ch1.street',
      savedSceneId: 'ch1.missing',
      save: save(),
    })).toBeNull();
  });
});
