import { describe, expect, it } from 'vitest';
import { AssetRegistry } from '../src/game/core/AssetRegistry.js';
import { baseAssetManifest } from '../src/game/core/baseAssetManifest.js';

describe('scoped production asset registry', () => {
  it('keeps persistent collection and spellbook art available before chapter content loads', () => {
    const registry = new AssetRegistry();

    for (const key of [
      'cards/morgana/portrait',
      'voice/ch2/card/merlin',
      'cards/bertie-bott/portrait',
      'ui/spells/spellbook-spread',
      'sfx/ch3/lumos-bloom',
    ]) {
      expect(registry.getAsset(key), key).toEqual(baseAssetManifest[key]);
      expect(registry.resolveAsset(key), key).toContain(baseAssetManifest[key].path);
    }
  });

  it('registers a loaded package once, tolerates an identical durable duplicate, and rejects conflicts', () => {
    const registry = new AssetRegistry({
      baseAssets: {
        'cards/example/portrait': {
          path: 'assets/art/cards/example.webp',
          kind: 'image',
        },
      },
    });
    const chapterPackage = Object.freeze({
      id: 'ch12',
      assets: Object.freeze([
        Object.freeze({
          key: 'cards/example/portrait',
          path: 'assets/art/cards/example.webp',
          kind: 'image',
        }),
        Object.freeze({
          key: 'music/ch12/castle',
          path: 'assets/audio/music/ch12/castle.mp3',
          kind: 'music',
        }),
      ]),
    });

    expect(registry.registerChapterPackage(chapterPackage)).toEqual(['music/ch12/castle']);
    expect(registry.registerChapterPackage(chapterPackage)).toEqual([]);
    expect(registry.getAsset('cards/example/portrait').chapter).toBeNull();
    expect(registry.getAsset('music/ch12/castle')).toEqual({
      path: 'assets/audio/music/ch12/castle.mp3',
      kind: 'music',
      chapter: 'ch12',
      volume: 0.55,
    });
    expect(() => registry.registerChapterPackage({
      id: 'ch13',
      assets: [{
        key: 'music/ch12/castle',
        path: 'assets/audio/music/ch13/different.mp3',
        kind: 'music',
      }],
    })).toThrow(/conflicts with an existing asset/);
  });
});
