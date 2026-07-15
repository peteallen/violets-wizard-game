import { describe, expect, it, vi } from 'vitest';
import {
  CharacterCatalogError,
  buildCharacterCatalog,
  defineCharacter,
  defineCharacterModule,
} from '../src/game/characters/index.js';

function characterDefinition(id, {
  assetKey = null,
  assetPath = null,
} = {}) {
  return defineCharacter({
    id,
    metadata: {
      displayName: id.replace('character.', ''),
      kind: 'test',
      voiceRole: 'silent',
    },
    surfaces: ['world'],
    defaults: { appearance: 'default', pose: 'idle' },
    capabilities: {
      appearances: ['default'],
      poses: ['idle'],
      actions: [],
      supportsReducedMotion: true,
    },
    bounds: {
      world: { x: 0, y: 0, width: 64, height: 96 },
    },
    assets: assetKey ? {
      [assetKey]: {
        path: assetPath ?? `assets/art/${id.replace('character.', '')}.png`,
        kind: 'image',
      },
    } : {},
  });
}

function characterModule(id, {
  assetKey = null,
  assetPath = null,
  reviewScene = null,
  loadRuntime = null,
} = {}) {
  const preload = vi.fn();
  const release = vi.fn();
  const loader = loadRuntime ?? vi.fn(async () => ({
    renderers: { world: vi.fn() },
    preload,
    release,
  }));
  return {
    module: defineCharacterModule({
      definition: characterDefinition(id, { assetKey, assetPath }),
      loadRuntime: loader,
      reviews: reviewScene ? [{
        sceneId: reviewScene,
        captureProfiles: [{ width: 1280, height: 720 }],
      }] : [],
    }),
    loader,
    preload,
    release,
  };
}

describe('CharacterModule', () => {
  it('combines one pure definition, one untouched lazy loader, and immutable review registrations', () => {
    const loader = vi.fn();
    const reviews = [{
      sceneId: 'review.test-character',
      descriptor: { label: 'Test character' },
    }];
    const character = defineCharacterModule({
      definition: characterDefinition('character.test'),
      loadRuntime: loader,
      reviews,
    });

    reviews[0].descriptor.label = 'Changed outside';
    expect(character.id).toBe('character.test');
    expect(character.loadRuntime).toBe(loader);
    expect(loader).not.toHaveBeenCalled();
    expect(character.reviews).toEqual([{
      sceneId: 'review.test-character',
      descriptor: { label: 'Test character' },
    }]);
    expect(Object.isFrozen(character)).toBe(true);
    expect(Object.isFrozen(character.reviews)).toBe(true);
    expect(Object.isFrozen(character.reviews[0].descriptor)).toBe(true);
  });
});

describe('CharacterCatalog construction', () => {
  it('builds a sealed side-effect-free registry and merged explicit fragments', () => {
    const violet = characterModule('character.test-violet', {
      assetKey: 'characters/test-violet/idle',
      assetPath: 'assets/art/characters/test-violet/idle.png',
      reviewScene: 'review.test-violet',
    });
    const guide = characterModule('character.test-guide', {
      assetKey: 'characters/test-guide/idle',
      assetPath: 'assets/art/characters/test-guide/idle.png',
      reviewScene: 'review.test-guide',
    });
    const catalog = buildCharacterCatalog([violet.module, guide.module], {
      aliases: { 'npc.testGuide': 'character.test-guide' },
    });

    expect(catalog.registry.sealed).toBe(true);
    expect(catalog.ids()).toEqual(['character.test-violet', 'character.test-guide']);
    expect(catalog.getModule('npc.testGuide')).toBe(guide.module);
    expect(catalog.assets).toEqual({
      'characters/test-violet/idle': {
        path: 'assets/art/characters/test-violet/idle.png',
        kind: 'image',
      },
      'characters/test-guide/idle': {
        path: 'assets/art/characters/test-guide/idle.png',
        kind: 'image',
      },
    });
    expect(catalog.getReview('review.test-guide')).toBe(guide.module.reviews[0]);
    expect(Object.isFrozen(catalog.assets)).toBe(true);
    expect(Object.isFrozen(catalog.reviews)).toBe(true);
    expect(violet.loader).not.toHaveBeenCalled();
    expect(guide.loader).not.toHaveBeenCalled();
  });

  it.each([
    [
      'character IDs',
      () => [
        characterModule('character.duplicate').module,
        characterModule('character.duplicate').module,
      ],
      /duplicates character\.duplicate/,
    ],
    [
      'asset keys',
      () => [
        characterModule('character.first', { assetKey: 'characters/shared/idle' }).module,
        characterModule('character.second', { assetKey: 'characters/shared/idle' }).module,
      ],
      /duplicates asset key characters\/shared\/idle/,
    ],
    [
      'review scene IDs',
      () => [
        characterModule('character.first', { reviewScene: 'review.shared' }).module,
        characterModule('character.second', { reviewScene: 'review.shared' }).module,
      ],
      /duplicates review scene review\.shared/,
    ],
  ])('rejects duplicate %s before constructing a usable catalog', (_label, modules, message) => {
    expect(() => buildCharacterCatalog(modules())).toThrow(CharacterCatalogError);
    expect(() => buildCharacterCatalog(modules())).toThrow(message);
  });
});

describe('dependency-scoped character activation', () => {
  it('does not load any member of a hundred-character catalog for an unrelated scene', async () => {
    const characters = Array.from({ length: 100 }, (_, index) => (
      characterModule(`character.synthetic-${String(index).padStart(3, '0')}`)
    ));
    const catalog = buildCharacterCatalog(characters.map(({ module }) => module));
    const unrelatedScene = Object.freeze({
      id: 'scene.unrelated',
      characterDependencies: Object.freeze([]),
    });

    const scope = await catalog.activate(unrelatedScene.characterDependencies, {
      sceneId: unrelatedScene.id,
    });

    expect(scope.characterIds).toEqual([]);
    expect(characters.every(({ loader }) => loader.mock.calls.length === 0)).toBe(true);
    await scope.release();
    expect(characters.every(({ release }) => release.mock.calls.length === 0)).toBe(true);
  });

  it('adds and activates a test character using only its module and one dependency reference', async () => {
    const guest = characterModule('character.chapter-guest', {
      assetKey: 'characters/chapter-guest/idle',
      reviewScene: 'review.chapter-guest',
    });
    const catalog = buildCharacterCatalog([guest.module]);
    const scene = Object.freeze({
      id: 'scene.test-guest',
      characterDependencies: Object.freeze(['character.chapter-guest']),
    });

    const scope = await catalog.activate(scene.characterDependencies, { sceneId: scene.id });

    expect(scope.characterIds).toEqual(['character.chapter-guest']);
    expect(guest.loader).toHaveBeenCalledOnce();
    expect(guest.loader).toHaveBeenCalledWith(guest.module.definition);
    expect(guest.preload).toHaveBeenCalledWith(expect.objectContaining({
      characterId: 'character.chapter-guest',
      context: { sceneId: 'scene.test-guest' },
    }));
    expect(catalog.assets).toHaveProperty('characters/chapter-guest/idle');
    expect(catalog.getReview('review.chapter-guest')).toBe(guest.module.reviews[0]);

    await scope.release();
    expect(guest.release).toHaveBeenCalledOnce();
    await expect(scope.release()).rejects.toThrow(/already been released/);
  });

  it('activates and releases exactly the supplied dependency list', async () => {
    const first = characterModule('character.first');
    const second = characterModule('character.second');
    const third = characterModule('character.third');
    const catalog = buildCharacterCatalog([first.module, second.module, third.module]);

    expect(await catalog.activateDependencies(['character.second'])).toEqual(['character.second']);
    expect(first.loader).not.toHaveBeenCalled();
    expect(second.loader).toHaveBeenCalledOnce();
    expect(third.loader).not.toHaveBeenCalled();

    await catalog.releaseDependencies(['character.second']);
    expect(first.release).not.toHaveBeenCalled();
    expect(second.release).toHaveBeenCalledOnce();
    expect(third.release).not.toHaveBeenCalled();
  });
});
