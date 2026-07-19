import { describe, expect, it } from 'vitest';
import {
  ChapterCatalogError,
  buildChapterCatalog,
} from '../src/game/content/chapterCatalog.js';
import { defineChapterDescriptor } from '../src/game/content/chapterDescriptor.js';
import {
  ChapterRuntimeRegistry,
  loadChapterRuntimeRegistry,
} from '../src/game/chapters/catalog.js';
import {
  chapter1,
  chapter1AssetKeys,
  chapter1CharacterIds,
  chapter1Map,
  chapter1ResumeRecaps,
} from '../src/game/content/chapters/ch1.js';
import {
  chapter2,
  chapter2AssetKeys,
  chapter2CharacterIds,
} from '../src/game/content/chapters/ch2.js';
import { chapter3 } from '../src/game/content/chapters/ch3.js';
import { chapter4 } from '../src/game/content/chapters/ch4.js';
import {
  chapterAvailability,
  chapterCatalog,
  chapterDescriptors,
  chapterMaps,
  contentRegistry,
  getChapter,
  getChapterMap,
  isChapterPlayable,
  loadChapterPackage,
  resolveOwnedChapterMap,
} from '../src/game/content/index.js';
import { chapter1SceneDefinitions } from '../src/game/chapters/ch1/content/scenes/index.js';

function descriptor(number, overrides = {}) {
  const id = `ch${number}`;
  return defineChapterDescriptor({
    id,
    number,
    title: `Chapter ${number}`,
    availability: 'planned',
    loaders: {
      content: async () => ({ default: `${id}-content` }),
      presentation: async () => ({ default: `${id}-presentation` }),
      harness: async () => ({ default: `${id}-harness` }),
    },
    ...overrides,
  });
}

describe('ChapterCatalog', () => {
  it('is immutable and rejects duplicate chapter identities', () => {
    const catalog = buildChapterCatalog([descriptor(1), descriptor(12)]);

    expect(catalog.ids()).toEqual(['ch1', 'ch12']);
    expect(catalog.getDescriptor('ch12')).toBe(catalog.descriptors[1]);
    expect(catalog.getDescriptor(12)).toBe(catalog.descriptors[1]);
    expect(catalog.getDescriptor('ch99')).toBeNull();
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.descriptors)).toBe(true);

    expect(() => buildChapterCatalog([descriptor(12), descriptor(12)])).toThrow(ChapterCatalogError);
    expect(() => buildChapterCatalog([descriptor(12), descriptor(12)])).toThrow(/duplicates ch12/);
  });

  it('does not execute any loader while constructing the catalog', async () => {
    const calls = [];
    const chapterTwelve = defineChapterDescriptor({
      id: 'ch12',
      number: 12,
      title: 'The Returning Stars',
      availability: 'planned',
      loaders: {
        content: async () => { calls.push('content'); return { default: 'content' }; },
        presentation: async () => { calls.push('presentation'); return { default: 'presentation' }; },
        harness: async () => { calls.push('harness'); return { default: 'harness' }; },
      },
    });

    const catalog = buildChapterCatalog([chapterTwelve]);
    expect(calls).toEqual([]);
    expect(catalog.ids()).toEqual(['ch12']);

    await expect(catalog.load(12, 'presentation')).resolves.toEqual({ default: 'presentation' });
    expect(calls).toEqual(['presentation']);
    await expect(catalog.load('ch12', 'content')).resolves.toEqual({ default: 'content' });
    await expect(catalog.load('ch12', 'harness')).resolves.toEqual({ default: 'harness' });
    expect(calls).toEqual(['presentation', 'content', 'harness']);
    expect(() => catalog.load('ch99')).toThrow(/does not contain chapter ch99/);
  });

  it('selects only maps owned by the active scene, with a legacy single-map fallback', () => {
    const castleMap = { id: 'ch12.map.castle' };
    const villageMap = { id: 'ch12.map.village' };
    const ownedMaps = {
      [castleMap.id]: castleMap,
      [villageMap.id]: villageMap,
    };
    const chapter = {
      contractVersion: 2,
      scenes: {
        'ch12.scene.castle': { mapId: castleMap.id },
        'ch12.scene.indoors': {},
      },
    };

    expect(resolveOwnedChapterMap(chapter, ownedMaps, 'ch12.scene.castle')).toBe(castleMap);
    expect(resolveOwnedChapterMap(chapter, ownedMaps, 'ch12.scene.indoors')).toBeNull();
    expect(resolveOwnedChapterMap(
      { contractVersion: 1, scenes: {} },
      { [villageMap.id]: villageMap },
    )).toBe(villageMap);
  });

  it('loads a resumed chapter and explicit transition targets into a synchronous World registry', async () => {
    const calls = [];
    const packageDescriptor = (number) => {
      const id = `ch${number}`;
      const map = { id: `${id}.map.castle` };
      const sceneId = `${id}.scene.arrival`;
      const chapter = {
        id,
        number,
        contractVersion: 2,
        scenes: { [sceneId]: { mapId: map.id } },
        maps: { [map.id]: map },
        recaps: [],
        assets: {},
      };
      return defineChapterDescriptor({
        id,
        number,
        title: `Chapter ${number}`,
        availability: 'planned',
        loaders: {
          content: async () => {
            calls.push(id);
            return {
              default: {
                id,
                chapter,
                maps: chapter.maps,
                resumeRecaps: chapter.recaps,
                assetKeys: [],
              },
            };
          },
          presentation: null,
          harness: null,
        },
      });
    };
    const catalog = buildChapterCatalog([
      packageDescriptor(12),
      packageDescriptor(13),
      packageDescriptor(14),
    ]);

    const runtime = await loadChapterRuntimeRegistry('ch13', {
      catalog,
      preloadChapterIds: [14],
    });

    expect(calls).toEqual(['ch13', 'ch14']);
    expect(runtime.activeChapterId).toBe('ch13');
    expect(Object.keys(runtime.chapters)).toEqual(['ch13', 'ch14']);
    expect(runtime.contentRegistry).toBe(runtime.chapters);
    expect(runtime.getChapter(13)).toBe(runtime.chapters.ch13);
    expect(runtime.getChapter('ch12')).toBeNull();
    expect(runtime.getChapterMap('ch13', 'ch13.scene.arrival'))
      .toBe(runtime.chapterMaps.ch13['ch13.map.castle']);
    expect(Object.isFrozen(runtime)).toBe(true);
    expect(Object.isFrozen(runtime.chapters)).toBe(true);
  });

  it('keeps one World-facing dictionary while preparing each active chapter and its successor', async () => {
    const calls = [];
    const packageDescriptor = (number, nextChapterId = null) => {
      const id = `ch${number}`;
      const map = { id: `${id}.map.castle` };
      const chapter = {
        id,
        number,
        contractVersion: 2,
        scenes: {},
        maps: { [map.id]: map },
        recaps: [],
        assets: {
          [`rooms/${id}/castle`]: {
            key: `rooms/${id}/castle`,
            path: `assets/art/rooms/${id}-castle.webp`,
            kind: 'image',
          },
        },
      };
      return defineChapterDescriptor({
        id,
        number,
        title: `Chapter ${number}`,
        availability: 'planned',
        nextChapterId,
        loaders: {
          content: async () => {
            calls.push(id);
            return { default: { id, chapter, maps: chapter.maps } };
          },
          presentation: null,
          harness: null,
        },
      });
    };
    const catalog = buildChapterCatalog([
      packageDescriptor(12, 'ch13'),
      packageDescriptor(13, 'ch14'),
      packageDescriptor(14),
    ]);
    const runtime = new ChapterRuntimeRegistry({ catalog });
    const worldChapters = runtime.chapters;

    const [first, duplicate] = await Promise.all([
      runtime.prepare('ch12'),
      runtime.prepare(12),
    ]);
    expect(calls).toEqual(['ch12', 'ch13']);
    expect(first.chapterIds).toEqual(['ch12', 'ch13']);
    expect(duplicate.chapterIds).toEqual(['ch12', 'ch13']);
    expect(runtime.chapters).toBe(worldChapters);
    expect(Object.keys(worldChapters)).toEqual(['ch12', 'ch13']);
    expect(runtime.chapterAssets.ch12).toEqual([
      {
        key: 'rooms/ch12/castle',
        path: 'assets/art/rooms/ch12-castle.webp',
        kind: 'image',
      },
    ]);

    await runtime.prepare('ch13');
    expect(calls).toEqual(['ch12', 'ch13', 'ch14']);
    expect(runtime.chapters).toBe(worldChapters);
    expect(Object.keys(worldChapters)).toEqual(['ch12', 'ch13', 'ch14']);
    expect(runtime.getChapter('ch14')).toBe(worldChapters.ch14);
  });
});

describe('production chapter packages', () => {
  it('publishes playable Chapter Two plus the Chapter Three and Four handoff destinations', () => {
    expect(chapterCatalog.ids()).toEqual(['ch1', 'ch2', 'ch3', 'ch4']);
    expect(chapterDescriptors.map(({ id, number, title, availability }) => ({
      id, number, title, availability,
    }))).toEqual([
      { id: 'ch1', number: 1, title: chapter1.title, availability: 'playable' },
      { id: 'ch2', number: 2, title: chapter2.title, availability: 'playable' },
      { id: 'ch3', number: 3, title: chapter3.title, availability: 'placeholder' },
      { id: 'ch4', number: 4, title: chapter4.title, availability: 'placeholder' },
    ]);
    expect(contentRegistry).toEqual({
      ch1: chapter1, ch2: chapter2, ch3: chapter3, ch4: chapter4,
    });
    expect(chapterMaps.ch1).toEqual({ [chapter1Map.id]: chapter1Map });
    expect(getChapterMap('ch1')).toBe(chapter1Map);
    expect(getChapterMap('ch2')).toBeNull();
    expect(getChapterMap('ch3', 'ch3.scene.spellbookParcel'))
      .toBe(chapter3.maps['ch3.map.castle']);
    expect(getChapterMap('ch99')).toBeNull();
    expect(getChapter('ch1')).toBe(chapter1);
    expect(getChapter(2)).toBe(chapter2);
    expect(chapterAvailability).toEqual({
      ch1: 'playable', ch2: 'playable', ch3: 'placeholder', ch4: 'placeholder',
    });
    expect(isChapterPlayable(1)).toBe(true);
    expect(isChapterPlayable('ch2')).toBe(true);
    expect(isChapterPlayable('ch3')).toBe(false);
    expect(isChapterPlayable('ch4')).toBe(false);
  });

  it('loads exact existing content and character dependencies through each package', async () => {
    const chapterOneModule = await loadChapterPackage('ch1');
    const chapterTwoModule = await loadChapterPackage(2);
    const chapterThreeModule = await loadChapterPackage(3);
    const chapterFourModule = await loadChapterPackage(4);
    const chapterOnePackage = chapterOneModule.default;
    const chapterTwoPackage = chapterTwoModule.default;
    const chapterThreePackage = chapterThreeModule.default;
    const chapterFourPackage = chapterFourModule.default;

    expect(chapterOnePackage.chapter).toBe(chapter1);
    expect(chapterOnePackage.maps).toEqual({ [chapter1Map.id]: chapter1Map });
    expect(chapterOnePackage.resumeRecaps).toEqual(chapter1ResumeRecaps);
    expect(chapterOnePackage.assetKeys).toEqual(chapter1AssetKeys);
    expect(chapterOnePackage.characterDependencies).toBe(chapter1CharacterIds);
    expect(chapterTwoPackage.chapter).toBe(chapter2);
    expect(chapterTwoPackage.assetKeys).toEqual(chapter2AssetKeys);
    expect(chapterTwoPackage.characterDependencies).toEqual(chapter2CharacterIds);
    expect(chapterThreePackage.chapter).toBe(chapter3);
    expect(chapterThreePackage.status).toBe('placeholder');
    expect(chapterFourPackage.chapter).toBe(chapter4);
    expect(chapterFourPackage.status).toBe('placeholder');
    expect(Object.isFrozen(chapterOnePackage)).toBe(true);
    expect(Object.isFrozen(chapterTwoPackage)).toBe(true);
    expect(Object.isFrozen(chapterThreePackage)).toBe(true);
    expect(Object.isFrozen(chapterFourPackage)).toBe(true);
  });

  it('authors Chapter One scenes with explicit immutable order while preserving the v1 view', () => {
    const ordered = [...chapter1SceneDefinitions].sort((left, right) => left.order - right.order);
    expect(new Set(ordered.map(({ order }) => order)).size).toBe(ordered.length);
    expect(Object.keys(chapter1.scenes)).toEqual(ordered.map(({ id }) => id));
    expect(ordered.every((scene) => Object.isFrozen(scene))).toBe(true);
    expect(Object.values(chapter1.scenes).every((scene) => !Object.hasOwn(scene, 'order'))).toBe(true);
  });

  it('loads Chapter Two presentation registration independently from its content', async () => {
    const presentationModule = await loadChapterPackage('ch2', 'presentation');
    const presentation = presentationModule.default;

    expect(presentation.chapterId).toBe('ch2');
    expect(presentation.registrations).toEqual([]);
    expect(Object.isFrozen(presentation)).toBe(true);
    expect(Object.isFrozen(presentation.registrations)).toBe(true);
  });

  it('keeps the Chapter Two set-piece review URLs behind its independent loader', async () => {
    const harnessModule = await loadChapterPackage('ch2', 'harness');
    expect(harnessModule.default.registrations.map(({ sceneId }) => sceneId)).toEqual([
      'sp-ch2-barrier-run-review',
      'sp-ch2-sweet-reaction-review',
      'sp-ch2-lake-vista-review',
      'sp-ch2-sorting-reveal-review',
      'sp-ch2-common-room-arrival-review',
      'sp-ch2-chapter-card-review',
    ]);
    expect(Object.isFrozen(harnessModule.default.registrations)).toBe(true);
  });
});
