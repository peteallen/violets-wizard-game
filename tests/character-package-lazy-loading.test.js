import { describe, expect, it, vi } from 'vitest';

const runtimeLoads = vi.hoisted(() => ({
  violet: 0,
  hagrid: 0,
  wandmaker: 0,
  madamMalkin: 0,
}));

vi.mock('../src/game/characters/violet/runtime.js', () => {
  runtimeLoads.violet += 1;
  return { violetCharacterRuntime: Object.freeze({ identity: 'character.violet' }) };
});

vi.mock('../src/game/characters/hagrid/runtime.js', () => {
  runtimeLoads.hagrid += 1;
  return { hagridCharacterRuntime: Object.freeze({ identity: 'character.hagrid' }) };
});

vi.mock('../src/game/characters/wandmaker/runtime.js', () => {
  runtimeLoads.wandmaker += 1;
  return { wandmakerCharacterRuntime: Object.freeze({ identity: 'character.wandmaker' }) };
});

vi.mock('../src/game/characters/madam-malkin/runtime.js', () => {
  runtimeLoads.madamMalkin += 1;
  return { madamMalkinCharacterRuntime: Object.freeze({ identity: 'character.madam-malkin' }) };
});

import {
  hagridCharacterDefinition,
  loadHagridCharacterRuntime,
  loadMadamMalkinCharacterRuntime,
  loadVioletCharacterRuntime,
  loadWandmakerCharacterRuntime,
  madamMalkinCharacterDefinition,
  violetCharacterDefinition,
  wandmakerCharacterDefinition,
} from '../src/game/characters/index.js';

describe('identity package loading boundary', () => {
  it('imports every pure definition without evaluating any runtime module', () => {
    expect([
      violetCharacterDefinition,
      hagridCharacterDefinition,
      wandmakerCharacterDefinition,
      madamMalkinCharacterDefinition,
    ].map(({ id }) => id)).toEqual([
      'character.violet',
      'character.hagrid',
      'character.wandmaker',
      'character.madam-malkin',
    ]);
    expect(runtimeLoads).toEqual({
      violet: 0,
      hagrid: 0,
      wandmaker: 0,
      madamMalkin: 0,
    });
  });

  it('evaluates only the requested runtime and lets module caching reuse it', async () => {
    const first = await loadVioletCharacterRuntime();
    const second = await loadVioletCharacterRuntime();

    expect(first).toBe(second);
    expect(first.identity).toBe('character.violet');
    expect(runtimeLoads).toEqual({
      violet: 1,
      hagrid: 0,
      wandmaker: 0,
      madamMalkin: 0,
    });

    await Promise.all([
      loadHagridCharacterRuntime(),
      loadWandmakerCharacterRuntime(),
      loadMadamMalkinCharacterRuntime(),
    ]);
    expect(runtimeLoads).toEqual({
      violet: 1,
      hagrid: 1,
      wandmaker: 1,
      madamMalkin: 1,
    });
  });
});
