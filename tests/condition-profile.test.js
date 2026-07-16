import { describe, expect, it } from 'vitest';
import { conditionMatches } from '../src/game/core/conditions.js';

const save = Object.freeze({
  progress: { questFlags: {} },
  character: {
    house: 'gryffindor',
    wandId: 'wand.violet',
    appearance: { robeTrim: 'violet' },
    pet: { type: 'cat', name: 'Biscuit' },
  },
  settings: { learning: 'gentle' },
  spellbook: { known: [] },
});

describe('profile conditions', () => {
  it('evaluates the character-relative paths accepted by the v2 contract', () => {
    expect(conditionMatches({
      profileEquals: {
        house: 'gryffindor',
        'pet.type': 'cat',
        'appearance.robeTrim': 'violet',
        wandId: 'wand.violet',
      },
    }, save)).toBe(true);
  });

  it('keeps compatible fully-qualified selectors while rejecting unknown paths', () => {
    expect(conditionMatches({ profileEquals: { 'character.house': 'gryffindor' } }, save)).toBe(true);
    expect(conditionMatches({ profileEquals: { 'character.unknown': true } }, save)).toBe(false);
  });
});
