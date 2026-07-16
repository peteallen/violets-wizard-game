import { describe, expect, it } from 'vitest';
import {
  ContractValidationError,
  validateAction,
} from '../src/game/contracts.js';

describe('chapter completion action', () => {
  it('declares an explicit next chapter without relying on a Chapter One default', () => {
    const action = {
      type: 'chapter.complete',
      chapter: 'ch2',
      nextChapter: 'ch3',
    };

    expect(validateAction(action)).toBe(action);
  });

  it('rejects an invalid next chapter identity', () => {
    expect(() => validateAction({
      type: 'chapter.complete',
      chapter: 'ch2',
      nextChapter: 'chapter-three',
    })).toThrow(ContractValidationError);
  });
});
