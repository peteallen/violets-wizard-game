import { describe, expect, it } from 'vitest';
import { chapter3V2 } from '../src/game/chapters/ch3/content-v2/index.js';
import { chapter4 } from '../src/game/chapters/ch4/content.js';
import { createSaveV3 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-17T19:00:00.000Z';
const STEP_SECONDS = 1 / 60;

function createChapterThreeSave({ learning = 'gentle' } = {}) {
  const save = createSaveV3({
    now: NOW,
    appVersion: 'chapter-three-walkthrough-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch3',
    scene: chapter3V2.start.scene,
    room: chapter3V2.start.room,
    spawn: chapter3V2.start.spawn,
    dialogue: null,
  };
  save.progress.highestUnlockedChapter = 3;
  save.progress.completedChapters = ['ch1', 'ch2'];
  Object.assign(save.progress.questFlags, {
    'ch1.complete': true,
    'ch1.satchelReceived': true,
    'ch2.complete': true,
  });
  save.character.house = 'gryffindor';
  save.character.wandId = 'violet-first-wand';
  save.character.appearance.robeTrim = 'purple';
  save.character.pet = { type: 'cat', name: 'Biscuit' };
  save.settings.learning = learning;
  return save;
}

function worldFor(save = createChapterThreeSave()) {
  return new World({
    chapters: { ch3: chapter3V2, ch4: chapter4 },
    save,
    seed: 42,
    clock: () => NOW,
  });
}

function settle(world, predicate, label, maximumSeconds = 12) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += STEP_SECONDS) {
    if (predicate()) return;
    world.update(STEP_SECONDS);
  }
  throw new Error(`${label} did not settle after ${maximumSeconds} seconds.`);
}

function interact(world, targetId) {
  world.interactSemantic(targetId);
  settle(world, () => !world.pendingInteraction, `interaction ${targetId}`);
}

function advanceLine(world, expectedScript = null) {
  const presentation = world.dialogue.presentation();
  expect(presentation?.type).toBe('line');
  if (expectedScript) expect(presentation.scriptId).toBe(expectedScript);
  world.advanceDialogue();
  world.update(0);
}

function completeLearning(world, beatId, order) {
  expect(world.learning.snapshot()).toMatchObject({ beatId, status: 'active' });
  for (const unitId of order) {
    expect(world.learning.snapshot().expectedUnitId).toBe(unitId);
    expect(world.chooseLearningUnit(unitId)).toMatchObject({ accepted: true, correct: true });
  }
  expect(world.learning.snapshot()).toMatchObject({ beatId, status: 'completed' });
}

function castLumos(world, targetId) {
  expect(world.openSpellbook()).toBe(true);
  expect(world.selectSpell('lumos')).toBe(true);
  expect(world.spellbook.snapshot(world.targets())).toMatchObject({
    state: 'targeting',
    selectedSpellId: 'lumos',
  });
  expect(world.spellbook.snapshot(world.targets()).validTargetIds).toContain(targetId);
  expect(world.castSpellAt(targetId)).toMatchObject({ ok: true });
}

function travelByMap(world, locationId) {
  if (world.overlay) world.closeOverlay();
  const map = chapter3V2.maps['ch3.map.castle'];
  const location = map.locations.find(({ id }) => id === locationId);
  expect(location).toBeTruthy();
  expect(world.runActions(location.onSelect)).not.toBe(false);
  expect(world.roomId).toBe(location.to.room);
}

function expectDurableScene(world, sceneId, roomId) {
  expect(world.currentSceneId).toBe(sceneId);
  expect(world.roomId).toBe(roomId);
  expect(world.save.resume).toMatchObject({
    chapter: 'ch3', scene: sceneId, room: roomId, dialogue: null,
  });
}

describe('Chapter Three headless walkthrough', () => {
  it('plays the full route, preserves every boundary, and hands off to the flying preview', () => {
    const world = worldFor();
    const sceneTrace = [];
    const recordScene = (sceneId, roomId) => {
      expectDurableScene(world, sceneId, roomId);
      sceneTrace.push(sceneId);
    };

    recordScene('ch3.scene.spellbookParcel', 'ch3.commonRoom');
    interact(world, 'ch3.commonRoom.postOwl');
    advanceLine(world, 'ch3.dialogue.homeLetter');
    settle(world, () => !world.setPieces.active && world.flags['ch3.spellbookOpened'] === true,
      'spellbook reveal');
    expect(world.overlay).toEqual({ surface: 'spellbook', tab: null });
    world.closeOverlay();

    travelByMap(world, 'ch3.map.charmsClassroom');
    recordScene('ch3.scene.lumosClass', 'ch3.charmsClassroom');
    interact(world, 'ch3.charms.flitwickLumos');
    advanceLine(world, 'ch3.dialogue.lumosLesson');
    advanceLine(world, 'ch3.dialogue.lumosLesson');
    completeLearning(world, 'ch3.learning.lumos', ['l', 'u', 'm', 'o', 's']);
    expect(world.save.learning).toMatchObject({ phonicsSkill: 1 });
    expect(world.save.learning.completedBeats).toEqual(['ch3.learning.lumos']);
    expect(world.save.spellbook.known).toEqual(['lumos']);
    expect(world.overlay).toEqual({ surface: 'spellbook', tab: 'lumos' });
    world.closeOverlay();
    settle(world, () => !world.learning.isActive, 'Lumos learning celebration');

    castLumos(world, 'ch3.charms.lantern');
    settle(world, () => !world.setPieces.active && world.spellbook.state === 'closed', 'Lumos bloom');
    expect(world.flags['ch3.lumosProved']).toBe(true);
    expect(world.save.spellbook.stats.lumos.casts).toBe(1);
    advanceLine(world, 'ch3.dialogue.lumosSuccess');
    recordScene('ch3.scene.leviosaClass', 'ch3.charmsClassroom');

    interact(world, 'ch3.charms.flitwickLeviosa');
    advanceLine(world, 'ch3.dialogue.leviosaLesson');
    advanceLine(world, 'ch3.dialogue.leviosaLesson');
    completeLearning(world, 'ch3.learning.leviosa', ['win', 'gar', 'dium', 'levi', 'o', 'sa']);
    settle(world, () => !world.learning.isActive && !world.setPieces.active, 'Leviosa feather');
    expect(world.save.learning).toMatchObject({ phonicsSkill: 2 });
    expect(world.save.learning.completedBeats).toEqual([
      'ch3.learning.lumos', 'ch3.learning.leviosa',
    ]);
    expect(world.save.spellbook.known).toEqual(['lumos', 'leviosa']);
    expect(world.flags['ch3.leviosaLearned']).toBe(true);
    advanceLine(world, 'ch3.dialogue.leviosaSuccess');
    recordScene('ch3.scene.trevorMissing', 'ch3.charmsClassroom');

    interact(world, 'ch3.charms.neville');
    advanceLine(world, 'ch3.dialogue.trevorMissing');
    advanceLine(world, 'ch3.dialogue.trevorMissing');
    advanceLine(world, 'ch3.dialogue.trevorMissing');
    expect(world.flags['ch3.toadQuestAccepted']).toBe(true);
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'map' });

    travelByMap(world, 'ch3.map.corridorOne');
    recordScene('ch3.scene.corridorOne', 'ch3.corridorOne');
    castLumos(world, 'ch3.corridorOne.alcove');
    settle(world, () => !world.setPieces.active && world.spellbook.state === 'closed', 'first trail');
    expect(world.flags['ch3.trailFound']).toBe(true);

    travelByMap(world, 'ch3.map.corridorTwo');
    recordScene('ch3.scene.corridorTwo', 'ch3.corridorTwo');
    castLumos(world, 'ch3.corridorTwo.cardAlcove');
    settle(world, () => world.spellbook.state === 'closed', 'Circe clue');
    expect(world.flags).toMatchObject({
      'ch3.corridorCardFound': true,
      'ch3.corridorClueFound': true,
    });
    expect(world.save.collections.cards).toContain('circe');
    castLumos(world, 'ch3.corridorTwo.ribbonAlcove');
    settle(world, () => world.spellbook.state === 'closed', 'ribbon clue');
    expect(world.flags['ch3.corridorRibbonFound']).toBe(true);
    expect(world.targets().some(({ id }) => id === 'ch3.corridorTwo.toCorridorThree')).toBe(true);

    interact(world, 'ch3.corridorTwo.toCorridorThree');
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'map' });
    travelByMap(world, 'ch3.map.corridorThree');
    recordScene('ch3.scene.corridorThree', 'ch3.corridorThree');

    castLumos(world, 'ch3.corridorThree.armor');
    settle(world, () => world.spellbook.state === 'closed', 'armor reaction');
    expect(world.flags['ch3.toadRevealed']).not.toBe(true);
    advanceLine(world, 'ch3.dialogue.armorReaction');
    castLumos(world, 'ch3.corridorThree.alcove');
    settle(world, () => !world.setPieces.active && world.spellbook.state === 'closed', 'Trevor reveal');
    expect(world.flags).toMatchObject({ 'ch3.toadRevealed': true });
    expect(world.flags['ch3.toadFound']).not.toBe(true);
    expect(world.targets().some(({ id }) => id === 'ch3.corridorThree.trevor')).toBe(true);

    interact(world, 'ch3.corridorThree.trevor');
    advanceLine(world, 'ch3.dialogue.trevorFound');
    settle(world, () => !world.setPieces.active && world.flags['ch3.toadFound'] === true,
      'Trevor pickup');
    expect(world.overlay).toEqual({ surface: 'satchel', tab: 'map' });

    travelByMap(world, 'ch3.map.corridorOne');
    recordScene('ch3.scene.returnTrevor', 'ch3.corridorOne');
    expect(world.snapshot().actors).toEqual(expect.arrayContaining([
      expect.objectContaining({ actorId: 'ch3.npc.neville', characterId: 'character.neville' }),
      expect.objectContaining({ actorId: 'ch3.npc.trevor', characterId: 'character.trevor' }),
    ]));
    interact(world, 'ch3.corridorOne.neville');
    advanceLine(world, 'ch3.dialogue.trevorReturned');
    world.update(0.25);
    expect(world.snapshot().actors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actorId: 'ch3.npc.neville',
        renderState: expect.objectContaining({ action: 'reunion' }),
      }),
      expect.objectContaining({
        actorId: 'ch3.npc.trevor',
        characterId: 'character.trevor',
        renderState: expect.objectContaining({ action: 'reunion' }),
      }),
    ]));
    settle(world, () => !world.setPieces.active && world.flags['ch3.toadReturned'] === true,
      'Trevor reunion');
    expect(world.save.collections).toMatchObject({ housePoints: 10 });
    expect(world.save.collections.treasures).toContain('treasure.ch3.toad-token');

    interact(world, 'ch3.corridorOne.friendlyGhost');
    advanceLine(world, 'ch3.dialogue.ghostBook');
    advanceLine(world, 'ch3.dialogue.ghostBook');
    expect(world.flags['ch3.ghostBookAccepted']).toBe(true);
    expect(world.save.collections.cards).toEqual(expect.arrayContaining(['circe', 'bertie-bott']));
    expect(world.snapshot().journal.side).toContainEqual(expect.objectContaining({
      id: 'ch3.quest.fixBook', status: 'sleeping', caption: 'Fix the book',
    }));

    interact(world, 'ch3.corridorOne.toCommonRoom');
    travelByMap(world, 'ch3.map.commonRoom');
    recordScene('ch3.scene.chapterClose', 'ch3.commonRoom');
    interact(world, 'ch3.commonRoom.spellbook');
    settle(world, () => !world.setPieces.active && world.flags['ch3.chapterCardSeen'] === true,
      'chapter close');
    advanceLine(world, 'ch3.dialogue.chapterClose');
    advanceLine(world, 'ch3.dialogue.chapterClose');

    expect(sceneTrace).toEqual(chapter3V2.sceneOrder);
    expect(world.chapter.id).toBe('ch4');
    expect(world.currentSceneId).toBe('ch4.scene.preview');
    expect(world.roomId).toBe('ch4.previewRoom');
    expect(world.flags['ch3.complete']).toBe(true);
    expect(world.save.progress.completedChapters).toContain('ch3');
    expect(world.save.progress.highestUnlockedChapter).toBe(4);
    expect(world.save.resume).toEqual({
      chapter: 'ch4',
      scene: 'ch4.scene.preview',
      room: 'ch4.previewRoom',
      spawn: 'start',
      dialogue: null,
    });
  });

  it('resumes the revealed-toad beat with only Trevor available and no false light pools', () => {
    const save = createChapterThreeSave();
    Object.assign(save.progress.questFlags, {
      'ch3.spellbookOpened': true,
      'ch3.lumosLearned': true,
      'ch3.lumosProved': true,
      'ch3.leviosaLearned': true,
      'ch3.toadQuestAccepted': true,
      'ch3.trailFound': true,
      'ch3.corridorClueFound': true,
      'ch3.toadRevealed': true,
    });
    save.spellbook.known = ['lumos', 'leviosa'];
    save.spellbook.stats = {
      lumos: { casts: 4, masteryTier: 2 },
      leviosa: { casts: 0, masteryTier: 0 },
    };
    save.learning.completedBeats = ['ch3.learning.lumos', 'ch3.learning.leviosa'];
    save.resume = {
      chapter: 'ch3',
      scene: 'ch3.scene.corridorThree',
      room: 'ch3.corridorThree',
      spawn: 'map',
      dialogue: null,
    };

    const state = worldFor(save).snapshot();

    expect(state.sceneId).toBe('ch3.scene.corridorThree');
    expect(state.targets.map(({ id }) => id)).toEqual(['ch3.corridorThree.trevor']);
    expect(state.occupants.map(({ npc }) => npc)).toEqual(['ch3.npc.trevor']);
    expect(state.roomEffects.lightMask).toMatchObject({
      darkness: 0.8,
      lights: [],
      revealedTargetIds: [],
    });
  });

  it('lets either corridor-two clue unlock corridor three without consuming the other', () => {
    for (const first of ['card', 'ribbon']) {
      const save = createChapterThreeSave();
      Object.assign(save.progress.questFlags, {
        'ch3.spellbookOpened': true,
        'ch3.lumosLearned': true,
        'ch3.lumosProved': true,
        'ch3.leviosaLearned': true,
        'ch3.toadQuestAccepted': true,
        'ch3.trailFound': true,
      });
      save.spellbook.known = ['lumos', 'leviosa'];
      save.spellbook.stats = {
        lumos: { casts: 1, masteryTier: 1 },
        leviosa: { casts: 0, masteryTier: 0 },
      };
      save.learning.completedBeats = ['ch3.learning.lumos', 'ch3.learning.leviosa'];
      save.resume = {
        chapter: 'ch3',
        scene: 'ch3.scene.corridorTwo',
        room: 'ch3.corridorTwo',
        spawn: 'map',
        dialogue: null,
      };
      const world = worldFor(save);
      const firstTarget = first === 'card'
        ? 'ch3.corridorTwo.cardAlcove'
        : 'ch3.corridorTwo.ribbonAlcove';
      const otherTarget = first === 'card'
        ? 'ch3.corridorTwo.ribbonAlcove'
        : 'ch3.corridorTwo.cardAlcove';

      castLumos(world, firstTarget);
      settle(world, () => world.spellbook.state === 'closed', `${first} first clue`);

      expect(world.flags['ch3.corridorClueFound']).toBe(true);
      expect(world.targets().some(({ id }) => id === otherTarget)).toBe(true);
      expect(world.targets().some(({ id }) => id === 'ch3.corridorTwo.toCorridorThree')).toBe(true);
    }
  });
});
