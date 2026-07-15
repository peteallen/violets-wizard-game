import { describe, expect, it, vi } from 'vitest';
import { CharacterScopeController } from '../src/game/characters/CharacterScopeController.js';

function harness({ releaseFailure = null } = {}) {
  const log = [];
  const activations = [];
  const catalog = {
    resolveDependencies(dependencies) {
      return Object.freeze([...new Set(dependencies)]);
    },
    async activate(dependencies, context) {
      const characterIds = Object.freeze([...dependencies]);
      const label = `${context.scope}:${context.chapterId ?? 'title'}:${characterIds.join(',')}`;
      log.push(`activate:${label}`);
      const scope = {
        characterIds,
        release: vi.fn(async () => {
          log.push(`release:${label}`);
          if (releaseFailure === label) throw new Error(`failed ${label}`);
        }),
      };
      activations.push(scope);
      return Object.freeze(scope);
    },
  };
  const packages = {
    ch1: { id: 'ch1', characterDependencies: ['character.violet', 'character.hagrid'] },
    ch2: { id: 'ch2', characterDependencies: ['character.violet', 'character.narrator'] },
  };
  const loadChapterPackage = vi.fn(async (chapterId, kind) => {
    log.push(`load:${chapterId}:${kind}`);
    return { default: packages[chapterId] };
  });
  const controller = new CharacterScopeController({ catalog, loadChapterPackage });
  return { activations, controller, loadChapterPackage, log };
}

describe('CharacterScopeController', () => {
  it('loads an incoming chapter before releasing the outgoing cast', async () => {
    const fixture = harness();

    await fixture.controller.activateChapter('ch1');
    await fixture.controller.activateChapter('ch2');

    expect(fixture.log).toEqual([
      'load:ch1:content',
      'activate:chapter:ch1:character.violet,character.hagrid',
      'load:ch2:content',
      'activate:chapter:ch2:character.violet,character.narrator',
      'release:chapter:ch1:character.violet,character.hagrid',
    ]);
    expect(fixture.controller.chapterId).toBe('ch2');
    expect(fixture.controller.chapterCharacterIds).toEqual([
      'character.violet',
      'character.narrator',
    ]);
  });

  it('does not churn scopes while rooms change inside one chapter', async () => {
    const fixture = harness();

    const first = await fixture.controller.activateChapter('ch1', { roomId: 'ch1.bedroom' });
    const repeated = await fixture.controller.activateChapter('ch1', { roomId: 'ch1.courtyard' });

    expect(repeated).toBe(first);
    expect(fixture.loadChapterPackage).toHaveBeenCalledOnce();
    expect(fixture.activations).toHaveLength(1);
    expect(fixture.activations[0].release).not.toHaveBeenCalled();
  });

  it('keeps independent overlapping title and chapter scopes reference-counted', async () => {
    const fixture = harness();

    await fixture.controller.activateTitle(['character.violet', 'character.post-owl']);
    await fixture.controller.activateChapter('ch2');
    await fixture.controller.releaseTitle();

    expect(fixture.controller.titleCharacterIds).toEqual([]);
    expect(fixture.controller.chapterCharacterIds).toEqual([
      'character.violet',
      'character.narrator',
    ]);
    expect(fixture.log).toEqual([
      'activate:title:title:character.violet,character.post-owl',
      'load:ch2:content',
      'activate:chapter:ch2:character.violet,character.narrator',
      'release:title:title:character.violet,character.post-owl',
    ]);
  });

  it('releases each live scope exactly once on destroy', async () => {
    const fixture = harness();
    await fixture.controller.activateTitle(['character.violet']);
    await fixture.controller.activateChapter('ch1');

    await fixture.controller.destroy();
    await fixture.controller.destroy();

    expect(fixture.activations.map(({ release }) => release.mock.calls.length)).toEqual([1, 1]);
    await expect(fixture.controller.activateChapter('ch2')).rejects.toThrow(/destroyed/);
  });

  it('rolls back an incoming scope when the outgoing release fails', async () => {
    const failingLabel = 'chapter:ch1:character.violet,character.hagrid';
    const fixture = harness({ releaseFailure: failingLabel });
    await fixture.controller.activateChapter('ch1');

    await expect(fixture.controller.activateChapter('ch2')).rejects.toThrow(`failed ${failingLabel}`);

    expect(fixture.controller.chapterId).toBe('ch1');
    expect(fixture.log.at(-1)).toBe('release:chapter:ch2:character.violet,character.narrator');
  });
});
