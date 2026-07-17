import { describe, expect, it } from 'vitest';
import { createCoreActionRegistry } from '../src/game/actions/index.js';
import { productionCharacterCatalog } from '../src/game/characters/index.js';
import {
  chapter2ContentPackageV2,
  chapter2NextChapterId,
  chapter2V2,
} from '../src/game/chapters/ch2/content-v2/index.js';
import { chapterCatalog } from '../src/game/chapters/catalog.js';
import { chapter2SceneOrder } from '../src/game/chapters/ch2/content-v2/scenes.js';
import { chapter2SetPieceRendererIds } from '../src/game/chapters/ch2/content-v2/setPieces.js';
import { linkChapterPackage } from '../src/game/content/chapterLinker.js';
import { cardsById } from '../src/game/content/cards.js';
import { assetManifest } from '../src/game/core/assetManifest.js';
import {
  validateChapterV2,
  validateDialogue,
  validateNpc,
  validateQuest,
  validateRoom,
} from '../src/game/contracts.js';

function productionLinkRegistries() {
  return {
    actions: createCoreActionRegistry(),
    assets: assetManifest,
    cards: cardsById,
    chapters: chapterCatalog,
    characters: productionCharacterCatalog.registry,
    setPieceRenderers: new Set(chapter2SetPieceRendererIds),
  };
}

function actionArrays(value, result = [], visited = new WeakSet()) {
  if (value === null || typeof value !== 'object' || visited.has(value)) return result;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => actionArrays(entry, result, visited));
    return result;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (['actions', 'assistActions', 'onComplete', 'onEnter', 'onInteract'].includes(key)
      && Array.isArray(entry)) {
      result.push(...entry);
    }
    actionArrays(entry, result, visited);
  }
  return result;
}

describe('Chapter Two native v2 grey-box package', () => {
  it('composes a frozen, contract-valid, explicitly ordered story spine', () => {
    expect(validateChapterV2(chapter2V2)).toBe(chapter2V2);
    expect(chapter2V2.contractVersion).toBe(2);
    expect(chapter2V2.sceneOrder).toEqual([
      'ch2.scene.kingsCross',
      'ch2.scene.barrierPlatform',
      'ch2.scene.trainFriends',
      'ch2.scene.trolleySweets',
      'ch2.scene.lakeVista',
      'ch2.scene.greatHall',
      'ch2.scene.sorting',
      'ch2.scene.feast',
      'ch2.scene.commonRoomArrival',
      'ch2.scene.chapterCard',
    ]);
    expect(chapter2V2.sceneOrder).toEqual(chapter2SceneOrder);
    Object.values(chapter2V2.rooms).forEach((room) => expect(validateRoom(room)).toBe(room));
    Object.values(chapter2V2.npcs).forEach((npc) => expect(validateNpc(npc)).toBe(npc));
    Object.values(chapter2V2.dialogues).forEach((dialogue) => (
      expect(validateDialogue(dialogue)).toBe(dialogue)
    ));
    Object.values(chapter2V2.quests).forEach((quest) => expect(validateQuest(quest)).toBe(quest));
    expect(Object.isFrozen(chapter2V2)).toBe(true);
    expect(Object.isFrozen(chapter2V2.scenes['ch2.scene.sorting'])).toBe(true);
    expect(chapter2ContentPackageV2.chapter).toBe(chapter2V2);
  });

  it('links the production package through the real action, chapter, asset, character, and card registries', () => {
    expect(chapterCatalog.getDescriptor('ch3')?.availability).toBe('placeholder');
    expect(linkChapterPackage(chapter2V2, productionLinkRegistries())).toEqual({
      ok: true,
      issues: [],
    });
  });

  it('keeps Violet silent while the Hat personalizes one fixed Gryffindor outcome', () => {
    expect(chapter2V2.npcs['ch2.npc.violet'].voiceRole).toBe('silent');
    expect(Object.values(chapter2V2.npcs).every(({ defaultTalk }) => defaultTalk === null)).toBe(true);
    const spokenLines = Object.values(chapter2V2.dialogues).flatMap(({ nodes }) => (
      Object.values(nodes).filter(({ type }) => type === 'line')
    ));
    expect(spokenLines.some(({ speaker }) => speaker === 'ch2.npc.violet')).toBe(false);

    const sorting = chapter2V2.dialogues['ch2.dialogue.sorting'];
    expect(sorting.nodes.careChoice.choices).toHaveLength(3);
    expect(sorting.nodes.courageChoice.choices).toHaveLength(3);
    expect(sorting.nodes.reason.type).toBe('branch');

    const actions = actionArrays(chapter2V2);
    expect(actions).toContainEqual({
      type: 'character.set',
      field: 'house',
      value: 'gryffindor',
    });
    expect(actions).not.toContainEqual(expect.objectContaining({
      type: 'character.set',
      field: 'house',
      value: expect.not.stringMatching(/^gryffindor$/u),
    }));
    expect(actions).toContainEqual({
      type: 'yearbook.capture',
      moment: 'ch2.yearbook.sorting',
    });
  });

  it('authors the platform and Gryffindor paintings into their opaque set-piece handoffs', () => {
    expect(chapter2V2.setPieces['ch2.setPiece.barrierRun'].params).toMatchObject({
      preloadRoomVariant: 'platform',
      revealRoomVariantAt: 0.68,
      revealSpawn: 'platform',
    });
    expect(chapter2V2.setPieces['ch2.setPiece.sortingReveal'].params).toMatchObject({
      preloadRoomVariant: 'gryffindor',
      revealRoomVariantAt: 0.62,
    });
  });

  it('declares a single linear quest, two optional cards, first house points, and the Chapter Three handoff', () => {
    expect(Object.keys(chapter2V2.quests)).toEqual(['ch2.quest.belonging']);
    const quest = chapter2V2.quests['ch2.quest.belonging'];
    const walkedSteps = [];
    let stepId = quest.startStep;
    while (stepId !== null) {
      expect(walkedSteps).not.toContain(stepId);
      walkedSteps.push(stepId);
      stepId = quest.steps[stepId].next;
    }
    expect(walkedSteps).toEqual(Object.keys(quest.steps));

    const actions = actionArrays(chapter2V2);
    const cardRewards = actions.filter((action) => (
      action.type === 'reward.grant' && action.cards.length > 0
    ));
    expect(cardRewards).toEqual([
      {
        type: 'reward.grant',
        receipt: 'ch2.reward.card.train',
        points: 0,
        cards: ['merlin'],
        treasures: [],
      },
      {
        type: 'reward.grant',
        receipt: 'ch2.reward.card.greatHall',
        points: 0,
        cards: ['jocunda-sykes'],
        treasures: [],
      },
    ]);
    expect(actions).toContainEqual({
      type: 'reward.grant',
      receipt: 'ch2.reward.firstHousePoints',
      points: 10,
      cards: [],
      treasures: [],
    });
    expect(chapter2NextChapterId).toBe('ch3');
    expect(actions).toContainEqual({
      type: 'chapter.complete',
      chapter: 'ch2',
      nextChapter: 'ch3',
    });
  });
});
