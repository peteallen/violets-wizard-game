import { describe, expect, it } from 'vitest';
import {
  productionCharacterCatalog,
  productionCharacterModules,
  titleCharacterDependencies,
} from '../src/game/characters/productionCatalog.js';
import { chapter1CharacterIds } from '../src/game/content/chapters/ch1.js';
import { chapter2CharacterIds } from '../src/game/content/chapters/ch2.js';
import { chapter3CharacterIds } from '../src/game/content/chapters/ch3.js';
import { assetManifest } from '../src/game/core/assetManifest.js';

describe('production character catalog', () => {
  it('contains every declared identity once without loading a runtime', () => {
    const chapterCharacterIds = [
      ...new Set([...chapter1CharacterIds, ...chapter2CharacterIds, ...chapter3CharacterIds]),
    ];
    expect(productionCharacterCatalog.ids()).toEqual(chapterCharacterIds);
    expect(productionCharacterModules.map(({ id }) => id)).toEqual(chapterCharacterIds);
    expect(new Set(productionCharacterCatalog.ids()).size).toBe(22);
    expect(chapter2CharacterIds.every((id) => productionCharacterCatalog.registry.has(id))).toBe(true);
    expect(chapter3CharacterIds.every((id) => productionCharacterCatalog.registry.has(id))).toBe(true);
    expect(titleCharacterDependencies).toEqual(['character.violet', 'character.post-owl']);
    expect(productionCharacterCatalog.ids().every(
      (id) => !productionCharacterCatalog.registry.isLoaded(id),
    )).toBe(true);
  });

  it('publishes every package-owned character image through the production asset gate', () => {
    for (const [key, asset] of Object.entries(productionCharacterCatalog.assets)) {
      expect(assetManifest[key], key).toEqual({ ...asset, chapter: null });
    }
  });

  it('keeps shared review participation separate from unique registration ownership', () => {
    expect(Object.keys(productionCharacterCatalog.reviews).sort()).toEqual([
      'flitwick-sprite-review',
      'friendly-ghost-sprite-review',
      'hagrid-sprite-review',
      'madam-malkin-sprite-review',
      'menagerie-keeper-sprite-review',
      'neville-sprite-review',
      'owl-motion-review',
      'trevor-sprite-review',
      'violet-expression-review',
      'wandmaker-sprite-review',
    ]);
  });

  it('activates only the current chapter dependencies and releases that scope', async () => {
    const scope = await productionCharacterCatalog.activate(chapter2CharacterIds, {
      chapterId: 'ch2',
    });

    expect(scope.characterIds).toEqual(chapter2CharacterIds);
    for (const id of chapter2CharacterIds) {
      expect(productionCharacterCatalog.registry.isLoaded(id)).toBe(true);
    }
    for (const id of chapter1CharacterIds.filter((candidate) => !chapter2CharacterIds.includes(candidate))) {
      expect(productionCharacterCatalog.registry.isLoaded(id)).toBe(false);
    }

    await scope.release();
  });
});
