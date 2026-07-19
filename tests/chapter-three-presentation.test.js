import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game/Game.js';
import { chapter3PresentationPackage } from '../src/game/chapters/ch3/presentation.js';
import { chapter3CastleMap } from '../src/game/chapters/ch3/content-v2/map.js';
import { chapter3SetPieceDefinitions } from '../src/game/chapters/ch3/content-v2/setPieces.js';
import { buildMapState } from '../src/game/core/MapState.js';
import { SoundEngine, normalizePan } from '../src/game/core/SoundEngine.js';
import {
  ProductionPresentationRegistry,
} from '../src/game/presentation/ProductionPresentationRegistry.js';
import {
  loadProductionPresentationRegistry,
  productionPresentationRegistry,
  resolveProductionMapVignetteAsset,
} from '../src/game/presentation/productionRoomVariantOverlays.js';
import {
  createIllustratedMapPresentation,
  IllustratedMapRenderer,
} from '../src/game/render/IllustratedMapRenderer.js';
import { LearningRenderer, learningLayout } from '../src/game/render/LearningRenderer.js';
import { questJournalLayout } from '../src/game/render/QuestJournalRenderer.js';
import {
  CHAPTER_THREE_PROP_ASSET_KEYS,
  drawChapterThreeTargetProps,
} from '../src/game/render/ChapterThreePropRenderer.js';
import {
  LIGHT_MASK_RESOLUTION,
  RoomEffectsRenderer,
} from '../src/game/render/RoomEffectsRenderer.js';
import {
  compactSpellFanLayout,
  fullSpellbookLayout,
  SpellbookRenderer,
} from '../src/game/render/SpellbookRenderer.js';
import {
  drawChapterClose,
  drawCorridorOneReveal,
  drawLumosBloom,
  drawTrevorReveal,
} from '../src/game/render/ChapterThreeSetPieceRenderer.js';

const SPELLS = Object.freeze([
  Object.freeze({
    id: 'lumos', label: 'Lumos', incantation: 'Lumos', shortIncantation: 'Lumos',
    icon: 'light', color: '#fff1c2', effect: { kind: 'light', color: '#fff1c2' },
    audio: { cast: 'sfx/lumos', success: 'sfx/lumos', fizzle: 'sfx/fizzle' },
  }),
  Object.freeze({
    id: 'leviosa', label: 'Leviosa', incantation: 'Wingardium Leviosa', shortIncantation: 'Leviosa',
    icon: 'feather', color: '#c6a5e9', effect: { kind: 'lift', color: '#c6a5e9' },
    audio: { cast: 'sfx/leviosa', success: 'sfx/leviosa', fizzle: 'sfx/fizzle' },
  }),
]);

function expectTouchTargets(targets) {
  for (const target of targets) {
    expect(target.hitArea.width, target.id).toBeGreaterThanOrEqual(88);
    expect(target.hitArea.height, target.id).toBeGreaterThanOrEqual(88);
  }
}

function overlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function expectNoOverlap(targets) {
  for (let first = 0; first < targets.length; first += 1) {
    for (let second = first + 1; second < targets.length; second += 1) {
      expect(
        overlap(targets[first].hitArea, targets[second].hitArea),
        `${targets[first].id} overlaps ${targets[second].id}`,
      ).toBe(false);
    }
  }
}

function recordingContext() {
  const calls = [];
  const methods = new Set([
    'arc', 'beginPath', 'bezierCurveTo', 'clearRect', 'clip', 'closePath', 'drawImage',
    'ellipse', 'fill', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'quadraticCurveTo',
    'rect', 'restore', 'rotate', 'roundRect', 'save', 'scale', 'setLineDash',
    'setTransform', 'stroke', 'strokeRect', 'translate',
  ]);
  const target = { calls, globalAlpha: 1, globalCompositeOperation: 'source-over' };
  return new Proxy(target, {
    get(object, property) {
      if (property === 'createRadialGradient' || property === 'createLinearGradient') {
        return (...args) => {
          calls.push([property, ...args]);
          return { addColorStop: (...stop) => calls.push(['addColorStop', ...stop]) };
        };
      }
      if (property === 'measureText') {
        return (value) => ({ width: String(value).length * 16 });
      }
      if (methods.has(property)) return (...args) => calls.push([property, ...args]);
      return object[property];
    },
    set(object, property, value) {
      object[property] = value;
      calls.push(['set', property, value]);
      return true;
    },
  });
}

describe('Chapter Three spellbook and learning presentation', () => {
  it('keeps compact and full spellbook targets stable, separate, and at least 88 pixels', () => {
    const spellbook = {
      state: 'fan',
      known: SPELLS,
      selectedSpellId: 'lumos',
      validTargetIds: [],
      cast: null,
    };
    const fan = compactSpellFanLayout(spellbook);
    const full = fullSpellbookLayout(spellbook, { selectedSpellId: 'leviosa' });

    expect(fan.targets.map(({ id }) => id)).toEqual([
      'spellbook.cast.lumos',
      'spellbook.cast.leviosa',
      'spellbook.close',
    ]);
    expect(full.targets.map(({ id }) => id)).toEqual([
      'spellbook.detail.lumos',
      'spellbook.detail.leviosa',
      'spellbook.practice.leviosa',
      'spellbook.close',
    ]);
    expect(full.selectedCard.incantation).toBe('Wingardium Leviosa');
    expectTouchTargets(fan.targets);
    expectTouchTargets(full.targets);
    expectNoOverlap(fan.targets);
    expectNoOverlap(full.targets);
    expect(fan.entries.every(({ rect }) => rect.height > rect.width)).toBe(true);
    expect(fan.entries.every(({ rect }) => rect.width / rect.height === 160 / 222)).toBe(true);
    expect(Math.max(...fan.entries.map(({ rect }) => rect.y + rect.height))).toBeLessThanOrEqual(704);
    expect(compactSpellFanLayout({ ...spellbook, state: 'targeting', validTargetIds: [] }).noTargets)
      .toBe(true);

    const shell = { complete: true, naturalWidth: 720, naturalHeight: 1000 };
    const context = recordingContext();
    new SpellbookRenderer({ imageFor: () => shell }).drawFan(
      context,
      spellbook,
      0,
      { reducedMotion: true },
    );
    expect(context.calls.filter(([method]) => method === 'drawImage').map((call) => call.slice(-2)))
      .toEqual([[160, 222], [160, 222]]);
  });

  it('lays out runtime-owned rune and chant snapshots without importing chapter content', () => {
    const lumosLearning = {
      beatId: 'any.learning.light', kind: 'assembly', skill: 'phonics', mode: 'gentle',
      stepIndex: 2, stepCount: 5, completedUnitIds: ['l', 'u'],
      slots: [
        { id: 'l', glyph: 'L', landed: true, expected: false, hidden: false },
        { id: 'u', glyph: 'U', landed: true, expected: false, hidden: false },
        { id: 'm', glyph: 'M', landed: false, expected: true, hidden: false },
        { id: 'o', glyph: 'O', landed: false, expected: false, hidden: false },
        { id: 's', glyph: 'S', landed: false, expected: false, hidden: false },
      ],
      tiles: [
        { id: 'm', glyph: 'M', landed: false, expected: true, dimmed: false, highlighted: true },
        { id: 'n', glyph: 'N', landed: false, expected: false, dimmed: true, highlighted: false },
      ],
      hintStage: 'focus', featherLift: 0,
    };
    const leviosaLearning = {
      beatId: 'any.learning.feather', kind: 'sequence', skill: 'phonics', mode: 'off',
      stepIndex: 3, stepCount: 6, completedUnitIds: ['win', 'gar', 'dium'],
      slots: ['win', 'gar', 'dium', 'levi', 'o', 'sa'].map((id, index) => ({
        id, glyph: id, landed: index < 3, expected: index === 3, hidden: false,
      })),
      tiles: [{ id: 'levi', glyph: 'LEVI', landed: false, expected: true, dimmed: false, highlighted: true }],
      hintStage: 'ready', featherLift: 0.5,
    };
    const lumos = learningLayout(lumosLearning);
    const leviosa = learningLayout(leviosaLearning);

    expect(lumos.kind).toBe('runes');
    expect(lumos.targets.map(({ id }) => id)).toEqual(['learning.tile.m', 'learning.tile.n']);
    expect(leviosa.kind).toBe('chant');
    expect(leviosa.slots.map(({ slot }) => slot.glyph)).toEqual(['win', 'gar', 'dium', 'levi', 'o', 'sa']);
    expect(leviosa.featherLift).toBe(0.5);
    expectTouchTargets(lumos.targets);
    expectTouchTargets(leviosa.targets);
    expectNoOverlap(lumos.targets);

    const imageFor = vi.fn(() => null);
    const renderer = new LearningRenderer({ imageFor });
    renderer.draw(recordingContext(), lumosLearning, 0, { reducedMotion: true });
    expect(imageFor.mock.calls.map(([key]) => key)).toContain('ui/spells/rune-tile');
    expect(imageFor.mock.calls.map(([key]) => key)).not.toEqual(expect.arrayContaining([
      'ui/spells/chant-tile',
      'ui/spells/incantation-ribbon',
    ]));

    imageFor.mockClear();
    renderer.draw(recordingContext(), leviosaLearning, 0, { reducedMotion: true });
    expect(imageFor.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
      'ui/spells/chant-tile',
      'ui/spells/incantation-ribbon',
    ]));
  });

  it('keeps the sleeping side quest visually separate from the active main quest', () => {
    const journal = questJournalLayout({
      main: { id: 'main', kind: 'main', status: 'active', caption: 'Find Trevor', mapStar: null },
      side: [{ id: 'book', kind: 'side', status: 'sleeping', caption: 'Fix the book', mapStar: null }],
    });

    expect(journal.main.entry.status).toBe('active');
    expect(journal.side[0].entry.status).toBe('sleeping');
    expect(overlap(journal.main.rect, journal.side[0].rect)).toBe(false);
  });
});

describe('Chapter Three set-piece visual contracts', () => {
  function descriptor(id) {
    return chapter3SetPieceDefinitions.find((candidate) => candidate.id === id);
  }

  function request(id, time = 1) {
    const setPiece = descriptor(id);
    return {
      active: { descriptor: setPiece, logicalDescriptor: setPiece, params: setPiece.params, time },
      imageFor: () => null,
      reducedMotion: false,
    };
  }

  it('anchors each Lumos reveal to the authored live target instead of a screen default', () => {
    const bloomContext = recordingContext();
    const trailContext = recordingContext();
    const trevorContext = recordingContext();

    drawLumosBloom(bloomContext, request('ch3.setPiece.lumosBloom'));
    drawCorridorOneReveal(trailContext, request('ch3.setPiece.corridorOneReveal'));
    drawTrevorReveal(trevorContext, request('ch3.setPiece.trevorReveal'));

    expect(descriptor('ch3.setPiece.lumosBloom').params).toMatchObject({ x: 550, y: 430 });
    expect(descriptor('ch3.setPiece.corridorOneReveal').params)
      .toMatchObject({ x: 1025, y: 385 });
    expect(descriptor('ch3.setPiece.trevorReveal').params).toMatchObject({ x: 1010, y: 385 });
    expect(bloomContext.calls.find(([method]) => method === 'createRadialGradient')?.slice(1, 6))
      .toEqual([550, 430, 0, 550, 430]);
    expect(trailContext.calls.find(([method]) => method === 'createRadialGradient')?.slice(1, 6))
      .toEqual([1025, 385, 0, 1025, 385]);
    expect(trevorContext.calls.filter(([method]) => method === 'ellipse').every(
      ([, x, y]) => x === 1010 && y === 385,
    )).toBe(true);
  });

  it('finishes the chapter close on its authored Chapter Four preview', () => {
    const close = descriptor('ch3.setPiece.chapterClose');
    const chapterImage = { key: close.params.art, complete: true, naturalWidth: 2560, naturalHeight: 1440 };
    const previewImage = { key: close.params.preview, complete: true, naturalWidth: 2560, naturalHeight: 1440 };
    const imageFor = vi.fn((key) => ({
      [chapterImage.key]: chapterImage,
      [previewImage.key]: previewImage,
    })[key] ?? null);
    const opening = recordingContext();
    const ending = recordingContext();

    drawChapterClose(opening, { ...request(close.id, 0), imageFor });
    drawChapterClose(ending, { ...request(close.id, close.duration), imageFor });

    expect(close.assets).toContain('chapterCards/ch4/flying-lesson');
    expect(opening.calls.filter(([method]) => method === 'drawImage').map(([, image]) => image.key))
      .toEqual(['chapterCards/ch3/first-spells']);
    expect(opening.calls.filter(([method]) => method === 'fillText').map(([, text]) => text))
      .toEqual(expect.arrayContaining(['Violet’s First Spells', 'Lumos', 'Leviosa']));
    expect(ending.calls.filter(([method]) => method === 'drawImage').map(([, image]) => image.key))
      .toEqual(['chapterCards/ch3/first-spells', 'chapterCards/ch4/flying-lesson']);
    expect(ending.calls.filter(([method]) => method === 'fillText').map(([, text]) => text))
      .toEqual(expect.arrayContaining(['COMING SOON', 'Flying Lesson']));
    expect(close.params).toMatchObject({
      preview: 'chapterCards/ch4/flying-lesson',
      previewEyebrow: 'Coming soon',
      previewTitle: 'Flying Lesson',
    });
    expect(imageFor).toHaveBeenCalledWith('chapterCards/ch4/flying-lesson');
  });

  it('preloads active set-piece images, including a cross-chapter preview', async () => {
    const close = descriptor('ch3.setPiece.chapterClose');
    const loadImage = vi.fn(async (key) => ({ key }));

    await expect(Game.prototype.preloadSetPieceAssets.call({
      setPieceRenderer: { loadImage },
      setPieceImageKeys: Game.prototype.setPieceImageKeys,
      assetRegistry: {
        getAsset: (key) => ({ kind: key.startsWith('chapterCards/') ? 'image' : 'audio' }),
      },
    }, {
      descriptor: close,
      logicalDescriptor: close,
    })).resolves.toEqual([
      { key: 'chapterCards/ch3/first-spells' },
      { key: 'chapterCards/ch4/flying-lesson' },
    ]);
    expect(loadImage.mock.calls.map(([key]) => key)).toEqual([
      'chapterCards/ch3/first-spells',
      'chapterCards/ch4/flying-lesson',
    ]);
  });
});

describe('Chapter Three production presentation registration', () => {
  it('loads music, effects, and every set-piece renderer through the chapter package', () => {
    const registrations = chapter3PresentationPackage.registrations;
    expect(chapter3PresentationPackage.roomMusic.rooms).toMatchObject({
      'ch3.commonRoom': 'music/ch2/common-room',
      'ch3.charmsClassroom': 'music/ch3/classroom-brightness',
      'ch3.corridorThree': 'music/ch3/night-corridors',
    });
    expect(registrations.filter(({ kind }) => kind === 'world-effect').map(({ layer }) => layer).sort())
      .toEqual(['front-effects', 'front-effects', 'lighting']);
    expect(CHAPTER_THREE_PROP_ASSET_KEYS).toEqual([
      'props/ch3/spellbook-parcel',
      'props/ch3/lantern',
      'props/ch3/feather',
      'props/ch3/wet-footprints',
      'props/ch3/ribbon-clue',
      'props/ch3/reflected-eyes',
      'props/ch3/torn-book',
      'props/ch3/toad-token',
    ]);
    expect(registrations.filter(({ kind }) => kind === 'set-piece').map(({ renderer }) => renderer))
      .toEqual([
        'setPiece.ch3.spellbookReveal',
        'setPiece.ch3.lumosBloom',
        'setPiece.ch3.leviosaFeather',
        'setPiece.ch3.corridorOneReveal',
        'setPiece.ch3.trevorReveal',
        'setPiece.ch3.trevorFound',
        'setPiece.ch3.trevorReunion',
        'setPiece.ch3.chapterClose',
      ]);
    expect(registrations.filter(({ kind }) => kind === 'set-piece').every(
      ({ inputLockSeconds }) => inputLockSeconds === 1,
    )).toBe(true);
    expect(productionPresentationRegistry.resolveRoomMusic({
      chapterId: 'ch3', roomId: 'ch3.corridorTwo',
    })).toBe('music/ch3/night-corridors');
  });

  it('dispatches registered set pieces without adding chapter branches to the game shell', () => {
    const draw = vi.fn();
    const registry = new ProductionPresentationRegistry([{
      chapterId: 'ch9',
      registrations: [{
        id: 'ch9.presentation.magic', kind: 'set-piece', renderer: 'setPiece.ch9.magic',
        inputLockSeconds: 1, draw,
      }],
    }]);
    const active = { descriptor: { renderer: 'setPiece.ch9.magic' }, time: 0 };

    expect(registry.drawSetPiece({}, active, { chapterId: 'ch9' }, { reducedMotion: true })).toBe(true);
    expect(draw).toHaveBeenCalledWith({}, expect.objectContaining({ active, reducedMotion: true }));
    expect(registry.drawSetPiece({}, active, { chapterId: 'ch8' })).toBe(false);
    expect(registry.setPieceInputLockSeconds(active, { chapterId: 'ch9' })).toBe(1);
  });

  it('keeps presentation packages out of startup and activates only the requested chapter', async () => {
    const loadChapterPackage = vi.fn(async (chapterId, kind) => ({
      default: { chapterId, registrations: [], roomMusic: { default: `${chapterId}-music` } },
    }));
    const registry = await loadProductionPresentationRegistry({
      chapterDescriptors: [
        { id: 'ch7', loaders: { presentation: () => {} } },
        { id: 'ch8', loaders: { presentation: null } },
      ],
      loadChapterPackage,
    });

    expect(loadChapterPackage).not.toHaveBeenCalled();
    await registry.activateChapter('ch7');
    expect(loadChapterPackage).toHaveBeenCalledWith('ch7', 'presentation');
    expect(loadChapterPackage).toHaveBeenCalledTimes(1);
    expect(registry.resolveRoomMusic({ chapterId: 'ch7', roomId: 'any' })).toBe('ch7-music');
  });

  it('lets map content supply a textless vignette asset key directly', () => {
    const mapState = {
      id: 'maps/ch3/castle',
      locations: [{
        id: 'map.ch3.charms', icon: 'maps/ch3/destination-charms', caption: 'Charms',
        objectiveTarget: null, vignette: { x: 120, y: 220, width: 160, height: 120 },
        isCurrent: true, isObjective: false, completed: false, unlocked: true,
        fogState: 'clear', travelIntent: { type: 'travel.request', room: 'room', spawn: 'start' },
      }],
      routes: [],
    };
    const presentation = createIllustratedMapPresentation(
      mapState,
      { chapterId: 'ch3', affordances: { quiet: true } },
      0,
      { resolveVignetteAsset: resolveProductionMapVignetteAsset },
    );

    expect(presentation.locations[0].assetKey).toBe('maps/ch3/destination-charms');
  });

  it('keeps later objectives attached to their one castle location and current hotspot', () => {
    const objectives = [
      ['ch3.charmsClassroom', 'ch3.charms.flitwickLeviosa', 'ch3.map.charmsClassroom'],
      ['ch3.charmsClassroom', 'ch3.charms.neville', 'ch3.map.charmsClassroom'],
      ['ch3.corridorOne', 'ch3.corridorOne.neville', 'ch3.map.corridorOne'],
      ['ch3.commonRoom', 'ch3.commonRoom.spellbook', 'ch3.map.commonRoom'],
    ];

    for (const [room, hotspot, locationId] of objectives) {
      const mapState = buildMapState(chapter3CastleMap, {
        roomId: room,
        objective: { mapStar: { room, hotspot } },
        conditionState: {
          progress: { questFlags: {} }, character: {}, spellbook: { known: [] }, settings: {},
        },
      });
      const presentation = createIllustratedMapPresentation(mapState, {
        chapterId: 'ch3',
        affordances: {
          quiet: false,
          thread: { mapTargetId: hotspot, intensity: 'normal' },
        },
      });

      expect(mapState.objectiveLocationId, hotspot).toBe(locationId);
      expect(mapState.locations.find(({ id }) => id === locationId)?.activeObjectiveTarget)
        .toEqual({ room, hotspot });
      expect(presentation.objective, hotspot).toMatchObject({
        targetId: hotspot,
        locationId,
        target: { id: hotspot },
      });
    }
  });

  it('carries the authored castle painting through MapState and draws it under the route', () => {
    const mapState = buildMapState(chapter3CastleMap, {
      roomId: 'ch3.commonRoom',
      conditionState: {
        progress: { questFlags: {} }, character: {}, spellbook: { known: [] }, settings: {},
      },
    });
    const castle = {
      key: 'maps/ch3/castle', complete: true, naturalWidth: 2048, naturalHeight: 1152,
    };
    const context = recordingContext();
    const presentation = new IllustratedMapRenderer().draw(
      context,
      mapState,
      { chapterId: 'ch3', affordances: { quiet: true } },
      0,
      {
        imageFor: (key) => key === castle.key ? castle : null,
        showParchmentField: false,
      },
    );

    expect(mapState.asset).toBe('maps/ch3/castle');
    expect(presentation.backgroundAssetKey).toBe('maps/ch3/castle');
    expect(context.calls.find(([method]) => method === 'drawImage')?.[1]).toBe(castle);
  });

  it('draws package-authored transparent props from live target icons', () => {
    const context = recordingContext();
    const image = { complete: true, naturalWidth: 200, naturalHeight: 200 };
    const drawn = drawChapterThreeTargetProps(context, {
      cameraX: 100,
      state: {
        targets: [{
          id: 'room.lantern',
          presentation: { icon: 'props/ch3/lantern' },
          hitArea: { shape: 'rect', x: 500, y: 300, width: 88, height: 88 },
        }],
      },
      imageFor: (key) => key === 'props/ch3/lantern' ? image : null,
    });

    expect(drawn).toBe(true);
    expect(context.calls.some(([method]) => method === 'drawImage')).toBe(true);
    expect(context.calls).toContainEqual(['translate', -100, 0]);
  });
});

describe('Chapter Three room effects and stereo cues', () => {
  it('builds the darkness mask at half resolution and punches soft light holes', () => {
    const maskContext = recordingContext();
    const outputContext = recordingContext();
    const created = [];
    const renderer = new RoomEffectsRenderer({
      canvasFactory: (width, height) => {
        created.push([width, height]);
        return { width, height, getContext: () => maskContext };
      },
    });

    const result = renderer.drawLightMask(outputContext, {
      darkness: 0.8,
      lights: [{ targetId: 'alcove', x: 900, y: 320, radius: 180, intensity: 1 }],
      revealedTargetIds: ['alcove'],
    });

    expect(LIGHT_MASK_RESOLUTION).toEqual({ width: 640, height: 360, scale: 0.5 });
    expect(created).toEqual([[640, 360]]);
    expect(maskContext.calls.some(([method]) => method === 'createRadialGradient')).toBe(true);
    expect(maskContext.calls).toContainEqual(['set', 'globalCompositeOperation', 'destination-out']);
    expect(outputContext.calls.some(([method]) => method === 'drawImage')).toBe(true);
    expect(result.lights[0].targetId).toBe('alcove');
  });

  it('clamps optional panning while preserving the legacy unpanned event shape', () => {
    const sound = new SoundEngine({ muted: true });
    sound.playSfx('sfx/croak/left', 'tap', { pan: -2 });
    sound.playSfx('sfx/croak/center', 'tap');

    expect(normalizePan(Number.NaN)).toBe(0);
    expect(normalizePan(2)).toBe(1);
    expect(sound.eventLog).toEqual([
      { type: 'sfx', key: 'sfx/croak/left', pan: -1 },
      { type: 'sfx', key: 'sfx/croak/center' },
    ]);
  });
});
