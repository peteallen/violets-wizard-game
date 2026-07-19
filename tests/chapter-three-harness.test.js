import { describe, expect, it, vi } from 'vitest';

import { visualReviewChecklist } from '../src/game/content/visualVerification.js';
import { contentRegistry, loadChapterPackage } from '../src/game/content/index.js';
import { World } from '../src/game/world/World.js';
import {
  SET_PIECE_REVIEW_SCENES,
  parseHarnessRequest,
  preloadHarnessChapterImages,
  resolveHarnessScenario,
} from '../src/harness/boot.js';
import {
  getActionFixture,
} from '../src/harness/actionFixtures.js';
import { productionCharacterReviewCatalog } from '../src/harness/productionCharacterReviewCatalog.js';
import {
  cloneStateFixture,
  getStateFixture,
} from '../src/harness/stateFixtures.js';

const CHAPTER_THREE_SCENES = Object.freeze([
  'sp-ch3-spellbook-reveal-review',
  'learning-ch3-lumos-review',
  'ui-ch3-spellbook-review',
  'sp-ch3-lumos-bloom-review',
  'learning-ch3-leviosa-review',
  'sp-ch3-leviosa-feather-review',
  'ui-ch3-map-review',
  'sp-ch3-corridor-one-reveal-review',
  'ui-ch3-corridor-two-lumos-review',
  'ui-ch3-corridor-three-lumos-review',
  'sp-ch3-trevor-reveal-review',
  'sp-ch3-trevor-found-review',
  'sp-ch3-trevor-reunion-review',
  'room-ch3-friendly-ghost-review',
  'ui-ch3-quest-journal-review',
  'ui-ch3-cards-review',
  'sp-ch3-chapter-close-review',
]);

const CHAPTER_THREE_SET_PIECES = Object.freeze({
  'sp-ch3-spellbook-reveal-review': 'ch3.setPiece.spellbookReveal',
  'sp-ch3-lumos-bloom-review': 'ch3.setPiece.lumosBloom',
  'sp-ch3-leviosa-feather-review': 'ch3.setPiece.leviosaFeather',
  'sp-ch3-corridor-one-reveal-review': 'ch3.setPiece.corridorOneReveal',
  'sp-ch3-trevor-reveal-review': 'ch3.setPiece.trevorReveal',
  'sp-ch3-trevor-found-review': 'ch3.setPiece.trevorFound',
  'sp-ch3-trevor-reunion-review': 'ch3.setPiece.trevorReunion',
  'sp-ch3-chapter-close-review': 'ch3.setPiece.chapterClose',
});

const CHAPTER_THREE_CHARACTER_SCENES = Object.freeze([
  'flitwick-sprite-review',
  'neville-sprite-review',
  'trevor-sprite-review',
  'friendly-ghost-sprite-review',
]);

function replayWorldActions(sceneId) {
  const state = cloneStateFixture(sceneId);
  const world = new World({ chapters: contentRegistry, save: state.save, seed: 42 });
  let frame = 0;
  const stepTo = (targetFrame) => {
    while (frame < targetFrame) {
      world.update(1 / 60);
      frame += 1;
    }
  };
  for (const action of getActionFixture(sceneId).actions) {
    stepTo(action.frame);
    if (action.target === 'dialogue.advance') world.advanceDialogue();
    else if (action.target === 'dialogue.replay') world.dialogue.replay();
    else if (action.target.startsWith('learning.tile.')) {
      world.chooseLearningUnit(action.target.replace('learning.tile.', ''));
    } else world.interactSemantic(action.target);
    world.update(0);
  }
  return world;
}

describe('Chapter Three deterministic review harness', () => {
  it('publishes the complete ordered Chapter Three scene package through its lazy loader', async () => {
    const harnessModule = await loadChapterPackage('ch3', 'harness');
    const harnessPackage = harnessModule.default;

    expect(harnessPackage.chapterId).toBe('ch3');
    expect(harnessPackage.registrations.map(({ sceneId }) => sceneId))
      .toEqual(CHAPTER_THREE_SCENES);
    expect(Object.isFrozen(harnessPackage)).toBe(true);
    expect(Object.isFrozen(harnessPackage.registrations)).toBe(true);

    for (const registration of harnessPackage.registrations) {
      const { sceneId, state, actions } = registration;
      expect(state).toBe(getStateFixture(sceneId));
      expect(actions).toBe(getActionFixture(sceneId));
      expect(state.entry.chapter, sceneId).toBe(3);
      expect(state.save.resume.chapter, sceneId).toBe('ch3');
      expect(parseHarnessRequest(`?scene=${sceneId}`)).toMatchObject({
        scene: sceneId,
        state: sceneId,
        actions: sceneId,
      });
      expect(visualReviewChecklist(sceneId), sceneId).not.toBeNull();
      expect(Object.isFrozen(registration), sceneId).toBe(true);
    }
  });

  it('covers every authored room painting with real player-visible state', async () => {
    const harnessModule = await loadChapterPackage('ch3', 'harness');
    const rooms = new Set(harnessModule.default.registrations.map(
      ({ state }) => state.save.resume.room,
    ));

    expect(rooms).toEqual(new Set([
      'ch3.commonRoom',
      'ch3.charmsClassroom',
      'ch3.corridorOne',
      'ch3.corridorTwo',
      'ch3.corridorThree',
    ]));
  });

  it('stages all eight Chapter Three set pieces directly from valid pre-performance saves', () => {
    expect(Object.fromEntries(Object.keys(CHAPTER_THREE_SET_PIECES).map((sceneId) => [
      sceneId,
      SET_PIECE_REVIEW_SCENES[sceneId],
    ]))).toEqual(CHAPTER_THREE_SET_PIECES);

    for (const sceneId of Object.keys(CHAPTER_THREE_SET_PIECES)) {
      expect(getActionFixture(sceneId).actions, sceneId).toEqual([]);
      expect(resolveHarnessScenario(parseHarnessRequest(`?scene=${sceneId}`)))
        .toMatchObject({
          stateFixture: { entry: { chapter: 3, scene: sceneId } },
          actionFixture: { actions: [] },
        });
    }

    expect(getStateFixture('sp-ch3-spellbook-reveal-review').save.progress.questFlags)
      .not.toHaveProperty('ch3.spellbookOpened');
    expect(getStateFixture('sp-ch3-lumos-bloom-review').save).toMatchObject({
      resume: { scene: 'ch3.scene.lumosClass', room: 'ch3.charmsClassroom' },
      progress: { questFlags: { 'ch3.lumosLearned': true } },
      spellbook: { known: ['lumos'] },
    });
    expect(getStateFixture('sp-ch3-leviosa-feather-review').save).toMatchObject({
      resume: { scene: 'ch3.scene.trevorMissing', room: 'ch3.charmsClassroom' },
      progress: { questFlags: { 'ch3.leviosaLearned': true } },
      spellbook: { known: ['lumos', 'leviosa'] },
    });
    expect(getStateFixture('sp-ch3-leviosa-feather-review').characterDependencies)
      .toContain('character.neville');
    expect(getStateFixture('sp-ch3-trevor-reveal-review')).toMatchObject({
      characterDependencies: ['character.violet', 'character.toad', 'character.trevor'],
      save: { character: { pet: { type: 'toad', name: 'Pebble' } } },
    });
    expect(getStateFixture('sp-ch3-trevor-found-review').save.progress.questFlags)
      .toMatchObject({ 'ch3.toadRevealed': true });
    expect(getStateFixture('sp-ch3-trevor-found-review').save.progress.questFlags)
      .not.toHaveProperty('ch3.toadFound');
    expect(getStateFixture('sp-ch3-chapter-close-review').save.progress.questFlags)
      .not.toHaveProperty('ch3.chapterCardSeen');
  });

  it('reaches the learning, spellbook, map, targeting, journal, and new-card surfaces through semantic input', () => {
    expect(getActionFixture('learning-ch3-lumos-review').actions.map(({ target }) => target))
      .toEqual([
        'ch3.charms.flitwickLumos',
        'dialogue.advance',
        'dialogue.advance',
        'learning.tile.l',
      ]);
    expect(getActionFixture('ui-ch3-spellbook-review').actions.map(({ target }) => target))
      .toEqual([
        'ch3.charms.flitwickLumos',
        'dialogue.advance',
        'dialogue.advance',
        'learning.tile.l',
        'learning.tile.u',
        'learning.tile.m',
        'learning.tile.o',
        'learning.tile.s',
      ]);
    expect(getActionFixture('learning-ch3-leviosa-review').actions.map(({ target }) => target))
      .toEqual([
        'ch3.charms.flitwickLeviosa',
        'dialogue.advance',
        'dialogue.advance',
        'learning.tile.win',
        'learning.tile.gar',
        'learning.tile.dium',
      ]);
    expect(getActionFixture('ui-ch3-map-review').actions)
      .toEqual([{ frame: 30, type: 'tap', target: 'hud.satchel' }]);
    for (const sceneId of [
      'ui-ch3-corridor-two-lumos-review',
      'ui-ch3-corridor-three-lumos-review',
    ]) {
      expect(getActionFixture(sceneId).actions.map(({ target }) => target))
        .toEqual(['hud.wand', 'spellbook.cast.lumos']);
      expect(getStateFixture(sceneId).save.spellbook.known).toEqual(['lumos', 'leviosa']);
    }
    expect(getActionFixture('ui-ch3-quest-journal-review').actions)
      .toEqual([{ frame: 30, type: 'tap', target: 'hud.quest' }]);
    expect(getStateFixture('ui-ch3-quest-journal-review').save.progress.questFlags)
      .toMatchObject({
        'ch3.toadReturned': true,
        'ch3.ghostBookAccepted': true,
      });
    expect(getActionFixture('ui-ch3-cards-review').actions.map(({ target }) => target))
      .toEqual(['hud.satchel', 'satchel.cards', 'satchel.cards.next']);
    expect(getStateFixture('ui-ch3-cards-review').save.collections.cards)
      .toEqual(expect.arrayContaining(['circe', 'bertie-bott']));
  });

  it('executes the arrival-safe learning and ghost timelines against the real World', () => {
    expect(replayWorldActions('learning-ch3-lumos-review').learning.snapshot())
      .toMatchObject({
        beatId: 'ch3.learning.lumos',
        completedUnitIds: ['l'],
        expectedUnitId: 'u',
      });
    expect(replayWorldActions('ui-ch3-spellbook-review').snapshot()).toMatchObject({
      overlay: { surface: 'spellbook', tab: 'lumos' },
      spellbook: { known: [{ id: 'lumos' }] },
    });
    expect(replayWorldActions('learning-ch3-leviosa-review').learning.snapshot())
      .toMatchObject({
        beatId: 'ch3.learning.leviosa',
        completedUnitIds: ['win', 'gar', 'dium'],
        expectedUnitId: 'levi',
      });
    expect(replayWorldActions('room-ch3-friendly-ghost-review').dialogue.presentation())
      .toMatchObject({
        scriptId: 'ch3.dialogue.ghostBook',
        caption: 'Fix the book',
      });
  });

  it('registers every new character package as a generic two-size review scene', () => {
    for (const sceneId of CHAPTER_THREE_CHARACTER_SCENES) {
      const descriptor = productionCharacterReviewCatalog.get(sceneId);
      expect(descriptor.sceneId).toBe(sceneId);
      expect(new Set(descriptor.entries.map(({ surface }) => surface)))
        .toEqual(new Set(['world', 'portrait']));
      expect(getStateFixture(sceneId).entry.chapter).toBe(0);
      expect(getStateFixture(sceneId).characterDependencies)
        .toEqual(descriptor.characterDependencies);
      expect(getActionFixture(sceneId).actions).toEqual([]);
      expect(visualReviewChecklist(sceneId), sceneId).not.toBeNull();
    }
  });

  it('preloads Chapter Three UI, prop, map, card, and active set-piece images before capture', async () => {
    const decode = vi.fn(async () => {});
    const imageFor = vi.fn(() => ({ decode }));
    const loadImage = vi.fn(async () => ({}));
    const game = {
      world: {
        chapter: {
          assets: {
            'ui/spells/rune-tile': { kind: 'image' },
            'props/ch3/lantern': { kind: 'image' },
            'sfx/ch3/lumos-bloom': { kind: 'sfx' },
          },
        },
        setPieces: {
          active: {
            descriptor: {
              assets: [],
            },
            logicalDescriptor: {
              assets: [
                'props/ch3/lantern',
                'sfx/ch3/lumos-bloom',
                'chapterCards/ch4/flying-lesson',
              ],
            },
          },
        },
      },
      uiRenderer: { imageFor },
      setPieceRenderer: { loadImage },
      assetRegistry: {
        getAsset: (key) => (
          key === 'chapterCards/ch4/flying-lesson' ? { kind: 'image' } : null
        ),
      },
    };

    await expect(preloadHarnessChapterImages(game)).resolves.toEqual({
      ui: ['ui/spells/rune-tile', 'props/ch3/lantern'],
      setPiece: ['props/ch3/lantern', 'chapterCards/ch4/flying-lesson'],
    });
    expect(imageFor.mock.calls.map(([key]) => key)).toEqual([
      'ui/spells/rune-tile',
      'props/ch3/lantern',
    ]);
    expect(decode).toHaveBeenCalledTimes(2);
    expect(loadImage).toHaveBeenCalledWith('props/ch3/lantern');
    expect(loadImage).toHaveBeenCalledWith('chapterCards/ch4/flying-lesson');
  });
});
