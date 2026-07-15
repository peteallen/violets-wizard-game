import { describe, expect, it } from 'vitest';
import { validateSaveV1 } from '../src/game/systems/Save.js';
import {
  LEGACY_SAVE_FIXTURES,
  cloneLegacySaveFixture,
} from './fixtures/saveFixtures.js';

describe('frozen pre-refactor save fixtures', () => {
  it('preserves the four player-visible resume meanings as valid schema-v1 data', () => {
    expect(Object.keys(LEGACY_SAVE_FIXTURES)).toEqual([
      'freshChapterOne',
      'midChapterOne',
      'completedChapterOne',
      'chapterTwoPreview',
    ]);

    for (const fixture of Object.values(LEGACY_SAVE_FIXTURES)) {
      expect(validateSaveV1(structuredClone(fixture))).toEqual(fixture);
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(Object.isFrozen(fixture.progress.questFlags)).toBe(true);
    }
  });

  it('keeps the historical letter alias and returns mutable migration inputs', () => {
    expect(LEGACY_SAVE_FIXTURES.freshChapterOne.resume.scene).toBe('ch1.letterScene');

    const copy = cloneLegacySaveFixture('midChapterOne');
    copy.resume.scene = 'migration-test';

    expect(copy.resume.scene).toBe('migration-test');
    expect(LEGACY_SAVE_FIXTURES.midChapterOne.resume.scene).toBe('ch1.robeShopping');
    expect(() => cloneLegacySaveFixture('missing')).toThrow(/Unknown legacy save fixture/);
  });
});
