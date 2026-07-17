import { describe, expect, it } from 'vitest';
import { createCoreActionRegistry } from '../src/game/actions/index.js';
import { productionCharacterCatalog } from '../src/game/characters/index.js';
import {
  chapter3ContentPackageV2,
  chapter3NextChapterId,
  chapter3V2,
  chapter3V2Flags,
} from '../src/game/chapters/ch3/content-v2/index.js';
import { chapter3SceneOrder } from '../src/game/chapters/ch3/content-v2/scenes.js';
import { chapter3SetPieceRendererIds } from '../src/game/chapters/ch3/content-v2/setPieces.js';
import { chapter4 } from '../src/game/chapters/ch4/content.js';
import { chapterCatalog } from '../src/game/chapters/catalog.js';
import { linkChapterPackage } from '../src/game/content/chapterLinker.js';
import { cardsById } from '../src/game/content/cards.js';
import { isSupportedCaption } from '../src/game/content/vocabulary.js';
import { assetManifest } from '../src/game/core/assetManifest.js';
import {
  validateAction,
  validateChapterV2,
  validateDialogue,
  validateLearningBeatV2,
  validateNpc,
  validateQuest,
  validateRoom,
} from '../src/game/contracts.js';

function actionArrays(value, result = [], visited = new WeakSet()) {
  if (value === null || typeof value !== 'object' || visited.has(value)) return result;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => actionArrays(entry, result, visited));
    return result;
  }
  for (const [key, entry] of Object.entries(value)) {
    if ([
      'actions', 'assistActions', 'onComplete', 'onEnter', 'onInteract', 'onSelect',
    ].includes(key) && Array.isArray(entry)) {
      result.push(...entry);
    }
    actionArrays(entry, result, visited);
  }
  return result;
}

function captions(value, result = [], visited = new WeakSet()) {
  if (value === null || typeof value !== 'object' || visited.has(value)) return result;
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => captions(entry, result, visited));
    return result;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'caption' && typeof entry === 'string') result.push(entry);
    captions(entry, result, visited);
  }
  return result;
}

describe('Chapter Three native v2 package', () => {
  it('composes the accepted nine-beat, five-room story spine and stays placeholder-gated', () => {
    expect(validateChapterV2(chapter3V2)).toBe(chapter3V2);
    expect(chapter3V2.sceneOrder).toEqual([
      'ch3.scene.spellbookParcel',
      'ch3.scene.lumosClass',
      'ch3.scene.leviosaClass',
      'ch3.scene.trevorMissing',
      'ch3.scene.corridorOne',
      'ch3.scene.corridorTwo',
      'ch3.scene.corridorThree',
      'ch3.scene.returnTrevor',
      'ch3.scene.chapterClose',
    ]);
    expect(chapter3V2.sceneOrder).toEqual(chapter3SceneOrder);
    expect(Object.keys(chapter3V2.rooms)).toEqual([
      'ch3.commonRoom',
      'ch3.charmsClassroom',
      'ch3.corridorOne',
      'ch3.corridorTwo',
      'ch3.corridorThree',
    ]);
    expect(chapterCatalog.getDescriptor('ch3')).toMatchObject({ availability: 'placeholder' });
    expect(chapter3ContentPackageV2.status).toBe('placeholder');
    expect(chapter3NextChapterId).toBe('ch4');
    expect(chapterCatalog.getDescriptor('ch4')).toMatchObject({ availability: 'placeholder' });
    expect(chapter4.start).toEqual({
      scene: 'ch4.scene.preview', room: 'ch4.previewRoom', spawn: 'start',
    });
  });

  it('validates every authored contract and links all production references', () => {
    Object.values(chapter3V2.rooms).forEach((room) => expect(validateRoom(room)).toBe(room));
    Object.values(chapter3V2.npcs).forEach((npc) => expect(validateNpc(npc)).toBe(npc));
    Object.values(chapter3V2.dialogues).forEach((dialogue) => (
      expect(validateDialogue(dialogue)).toBe(dialogue)
    ));
    Object.values(chapter3V2.quests).forEach((quest) => (
      expect(validateQuest(quest, 'quest', { durableLifecycle: true })).toBe(quest)
    ));
    Object.values(chapter3V2.learningBeats).forEach((beat) => (
      expect(validateLearningBeatV2(beat)).toBe(beat)
    ));
    actionArrays(chapter3V2).forEach((action) => expect(validateAction(action)).toBe(action));

    const linked = linkChapterPackage(chapter3V2, {
      actions: createCoreActionRegistry(),
      assets: assetManifest,
      cards: cardsById,
      chapters: chapterCatalog,
      characters: productionCharacterCatalog.registry,
      setPieceRenderers: new Set(chapter3SetPieceRendererIds),
    });
    expect(linked).toEqual({ ok: true, issues: [] });
  });

  it('keeps Violet silent and Trevor distinct from Violet’s selectable toad', () => {
    expect(chapter3V2.npcs['ch3.npc.violet']).toMatchObject({
      characterId: 'character.violet', voiceRole: 'silent',
    });
    expect(chapter3V2.npcs['ch3.npc.trevor'].characterId).toBe('character.trevor');
    expect(chapter3V2.npcs['ch3.npc.pet.toad'].characterId).toBe('character.toad');
    expect(chapter3V2.npcs['ch3.npc.trevor'].characterId)
      .not.toBe(chapter3V2.npcs['ch3.npc.pet.toad'].characterId);
    expect(Object.values(chapter3V2.dialogues).flatMap(({ nodes }) => Object.values(nodes))
      .filter(({ type }) => type === 'line')
      .some(({ speaker }) => speaker === 'ch3.npc.violet')).toBe(false);
  });

  it('pins the exact durable story flags and separates clues, reveal, pickup, and return', () => {
    expect(chapter3V2Flags).toEqual([
      'ch3.spellbookOpened',
      'ch3.lumosLearned',
      'ch3.lumosProved',
      'ch3.leviosaLearned',
      'ch3.toadQuestAccepted',
      'ch3.trailFound',
      'ch3.corridorCardFound',
      'ch3.corridorRibbonFound',
      'ch3.corridorClueFound',
      'ch3.toadRevealed',
      'ch3.toadFound',
      'ch3.toadReturned',
      'ch3.ghostBookAccepted',
      'ch3.chapterCardSeen',
      'ch3.complete',
    ]);
    expect(chapter3V2.quests['ch3.quest.firstSpells'].steps.revealTrevor.doneWhen)
      .toEqual({ allFlags: ['ch3.toadRevealed'] });
    expect(chapter3V2.quests['ch3.quest.firstSpells'].steps.findTrevor.doneWhen)
      .toEqual({ allFlags: ['ch3.toadFound'] });
  });

  it('declares permanent spells, one-time learning ceremonies, exact rewards, and sleeping side quest', () => {
    expect(Object.keys(chapter3V2.learningBeats)).toEqual([
      'ch3.learning.lumos', 'ch3.learning.leviosa',
    ]);
    expect(Object.values(chapter3V2.learningBeats).map(({ replayable }) => replayable))
      .toEqual([false, false]);
    expect(Object.values(chapter3V2.learningBeats).map(({ content }) => content.spell))
      .toEqual(['lumos', 'leviosa']);
    expect(chapter3V2.learningBeats['ch3.learning.lumos'].feedback).toEqual({
      wrongVoice: 'voice/ch3/flitwick/letters-into-magic',
      wrongCaption: 'Lumos',
    });
    expect(chapter3V2.learningBeats['ch3.learning.leviosa'].feedback).toEqual({
      wrongVoice: 'voice/ch3/flitwick/swish-and-flick',
      wrongCaption: 'Swish! Flick!',
    });

    const actions = actionArrays(chapter3V2);
    expect(actions).toContainEqual({
      type: 'reward.grant',
      receipt: 'ch3.reward.trevorReturned',
      points: 10,
      cards: [],
      treasures: ['treasure.ch3.toad-token'],
    });
    expect(actions).toContainEqual({
      type: 'reward.grant',
      receipt: 'ch3.reward.card.circe',
      points: 0,
      cards: ['circe'],
      treasures: [],
    });
    expect(actions).toContainEqual({
      type: 'reward.grant',
      receipt: 'ch3.reward.ghostCard',
      points: 0,
      cards: ['bertie-bott'],
      treasures: [],
    });
    expect(chapter3V2.quests['ch3.quest.fixBook']).toMatchObject({
      kind: 'side',
      startWhen: { allFlags: ['ch3.ghostBookAccepted'] },
      steps: {
        rememberBook: {
          objective: { caption: 'Fix the book', mapStar: null },
          doneWhen: {
            allFlags: ['ch3.ghostBookMended'],
            knownSpells: ['reparo'],
          },
        },
      },
    });
  });

  it('registers Circe, Bertie Bott, readable captions, and the exact close', () => {
    expect(cardsById.circe).toMatchObject({ chapter: 3, portraitAsset: 'cards/circe/portrait' });
    expect(cardsById['bertie-bott']).toMatchObject({
      chapter: 3, portraitAsset: 'cards/bertie-bott/portrait',
    });
    expect(captions(chapter3V2).every((caption) => isSupportedCaption(caption))).toBe(true);
    expect(chapter3V2.chapterCard.title).toBe('Violet’s First Spells');
    expect(chapter3V2.dialogues['ch3.dialogue.chapterClose'].nodes.finish.actions)
      .toEqual([{ type: 'chapter.complete', chapter: 'ch3', nextChapter: 'ch4' }]);
  });
});
