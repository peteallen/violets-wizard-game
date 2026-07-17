import { describe, expect, it, vi } from 'vitest';
import {
  conductorCharacterDefinition,
  conductorCharacterModule,
  conductorFullFrameCharacterDefinition,
  loadConductorCharacterRuntime,
} from '../src/game/characters/conductor/index.js';
import {
  deputyHeadCharacterDefinition,
  deputyHeadCharacterModule,
  deputyHeadFullFrameCharacterDefinition,
  loadDeputyHeadCharacterRuntime,
} from '../src/game/characters/deputy-head/index.js';
import {
  harryPotterCharacterDefinition,
  harryPotterCharacterModule,
  harryPotterFullFrameCharacterDefinition,
  loadHarryPotterCharacterRuntime,
} from '../src/game/characters/harry-potter/index.js';
import {
  headmasterCharacterDefinition,
  headmasterCharacterModule,
  headmasterFullFrameCharacterDefinition,
  loadHeadmasterCharacterRuntime,
} from '../src/game/characters/headmaster/index.js';
import {
  hermioneGrangerCharacterDefinition,
  hermioneGrangerCharacterModule,
  hermioneGrangerFullFrameCharacterDefinition,
  loadHermioneGrangerCharacterRuntime,
} from '../src/game/characters/hermione-granger/index.js';
import {
  loadRonWeasleyCharacterRuntime,
  ronWeasleyCharacterDefinition,
  ronWeasleyCharacterModule,
  ronWeasleyFullFrameCharacterDefinition,
} from '../src/game/characters/ron-weasley/index.js';
import {
  loadSortingHatCharacterRuntime,
  sortingHatCharacterDefinition,
  sortingHatCharacterModule,
  sortingHatFullFrameCharacterDefinition,
} from '../src/game/characters/sorting-hat/index.js';
import {
  loadTrolleyWitchCharacterRuntime,
  trolleyWitchCharacterDefinition,
  trolleyWitchCharacterModule,
  trolleyWitchFullFrameCharacterDefinition,
} from '../src/game/characters/trolley-witch/index.js';
import {
  createFullFrameCharacterManifest,
  resolveFullFrameCharacterAnimation,
} from '../src/game/render/FullFrameCharacterRig.js';

const PACKAGES = Object.freeze([
  Object.freeze({
    id: 'character.conductor',
    slug: 'conductor',
    definition: conductorCharacterDefinition,
    source: conductorFullFrameCharacterDefinition,
    module: conductorCharacterModule,
    loadRuntime: loadConductorCharacterRuntime,
    poses: ['idle', 'talk', 'speaking'],
  }),
  Object.freeze({
    id: 'character.trolley-witch',
    slug: 'trolley-witch',
    definition: trolleyWitchCharacterDefinition,
    source: trolleyWitchFullFrameCharacterDefinition,
    module: trolleyWitchCharacterModule,
    loadRuntime: loadTrolleyWitchCharacterRuntime,
    poses: ['idle', 'talk', 'speaking'],
  }),
  Object.freeze({
    id: 'character.harry-potter',
    slug: 'harry-potter',
    definition: harryPotterCharacterDefinition,
    source: harryPotterFullFrameCharacterDefinition,
    module: harryPotterCharacterModule,
    loadRuntime: loadHarryPotterCharacterRuntime,
    poses: ['idle', 'talk', 'speaking', 'seated'],
  }),
  Object.freeze({
    id: 'character.ron-weasley',
    slug: 'ron-weasley',
    definition: ronWeasleyCharacterDefinition,
    source: ronWeasleyFullFrameCharacterDefinition,
    module: ronWeasleyCharacterModule,
    loadRuntime: loadRonWeasleyCharacterRuntime,
    poses: ['idle', 'talk', 'speaking', 'seated'],
  }),
  Object.freeze({
    id: 'character.hermione-granger',
    slug: 'hermione-granger',
    definition: hermioneGrangerCharacterDefinition,
    source: hermioneGrangerFullFrameCharacterDefinition,
    module: hermioneGrangerCharacterModule,
    loadRuntime: loadHermioneGrangerCharacterRuntime,
    poses: ['idle', 'talk', 'speaking', 'seated'],
  }),
  Object.freeze({
    id: 'character.sorting-hat',
    slug: 'sorting-hat',
    definition: sortingHatCharacterDefinition,
    source: sortingHatFullFrameCharacterDefinition,
    module: sortingHatCharacterModule,
    loadRuntime: loadSortingHatCharacterRuntime,
    poses: ['idle', 'talk', 'speaking', 'waiting'],
  }),
  Object.freeze({
    id: 'character.deputy-head',
    slug: 'deputy-head',
    definition: deputyHeadCharacterDefinition,
    source: deputyHeadFullFrameCharacterDefinition,
    module: deputyHeadCharacterModule,
    loadRuntime: loadDeputyHeadCharacterRuntime,
    poses: ['idle', 'talk', 'speaking'],
  }),
  Object.freeze({
    id: 'character.headmaster',
    slug: 'headmaster',
    definition: headmasterCharacterDefinition,
    source: headmasterFullFrameCharacterDefinition,
    module: headmasterCharacterModule,
    loadRuntime: loadHeadmasterCharacterRuntime,
    poses: ['idle', 'talk', 'speaking', 'seated'],
  }),
]);

describe('Chapter Two first-pass character packages', () => {
  it('publishes one immutable identity module per speaking character', () => {
    expect(PACKAGES.map(({ id }) => id)).toEqual([
      'character.conductor',
      'character.trolley-witch',
      'character.harry-potter',
      'character.ron-weasley',
      'character.hermione-granger',
      'character.sorting-hat',
      'character.deputy-head',
      'character.headmaster',
    ]);

    for (const characterPackage of PACKAGES) {
      const {
        id, slug, definition, source, module, loadRuntime, poses,
      } = characterPackage;
      expect(definition.id).toBe(id);
      expect(definition.surfaces).toEqual(['world', 'portrait']);
      expect(definition.capabilities).toMatchObject({
        appearances: ['default'],
        poses,
        actions: [],
        supportsReducedMotion: true,
      });
      expect(definition.assets).toEqual({
        [`characters/${slug}/default/neutral`]: {
          path: `assets/art/characters/${slug}/default/neutral.png`,
          kind: 'image',
        },
      });
      expect(source.canvas).toEqual({
        width: 896,
        height: 1200,
        ground: { x: 448, y: 1132 },
      });
      expect(source.appearances.default.clips.idle.frames).toEqual([
        'default/neutral.png',
      ]);
      expect(source.appearances.default.aliases).toEqual(Object.fromEntries(
        poses.slice(1).map((pose) => [pose, 'idle']),
      ));
      expect(module.definition).toBe(definition);
      expect(module.loadRuntime).toBe(loadRuntime);
      expect(module.reviews).toEqual([]);
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(source.appearances.default.aliases)).toBe(true);
    }
  });

  it('resolves every authored pose to the same intentional first-pass still', () => {
    for (const {
      id, slug, source, poses,
    } of PACKAGES) {
      const manifest = createFullFrameCharacterManifest(source, {
        resolveFrame: (path) => path,
      });
      expect(manifest.fullFrame.assetFiles).toEqual([
        `assets/art/characters/${slug}/default/neutral.png`,
      ]);
      for (const pose of poses) {
        expect(resolveFullFrameCharacterAnimation(manifest, {
          pose,
          reducedMotion: true,
        })).toMatchObject({
          semantic: 'idle',
          pose: 'default/idle',
          reducedMotion: true,
        });
      }
      expect(manifest.id).toBe(id);
    }
  });

  it('lazy-loads registry-shaped runtimes without constructing an image', async () => {
    let imageConstructions = 0;
    vi.stubGlobal('Image', class {
      constructor() {
        imageConstructions += 1;
      }
    });

    try {
      expect(imageConstructions).toBe(0);
      const runtimes = await Promise.all(PACKAGES.map(({ loadRuntime }) => loadRuntime()));
      expect(imageConstructions).toBe(0);
      for (const runtime of runtimes) {
        expect(runtime).toMatchObject({
          renderers: {
            world: expect.any(Function),
            portrait: expect.any(Function),
          },
          preload: expect.any(Function),
          release: expect.any(Function),
        });
        expect(Object.isFrozen(runtime)).toBe(true);
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
