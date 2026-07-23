import { describe, expect, it } from 'vitest';
import { chapter2V2 } from '../src/game/chapters/ch2/content-v2/index.js';
import { createSaveV3 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-23T18:00:00.000Z';
const STEP_SECONDS = 1 / 60;

function createPlatformSave() {
  const save = createSaveV3({
    now: NOW,
    appVersion: 'chapter-two-platform-resume-test',
    worldSeed: 42,
  });
  save.resume = {
    chapter: 'ch2',
    scene: 'ch2.scene.barrierPlatform',
    room: 'ch2.kingsCross',
    spawn: 'platform',
    dialogue: null,
  };
  save.progress.highestUnlockedChapter = 2;
  save.progress.completedChapters = ['ch1'];
  Object.assign(save.progress.questFlags, {
    'ch1.complete': true,
    'ch2.barrierCrossed': true,
  });
  save.character.wandId = 'violet-first-wand';
  save.character.appearance.robeTrim = 'lavender';
  save.character.pet = { type: 'owl', name: 'Juniper' };
  return save;
}

function createWorld(save) {
  return new World({
    chapters: { ch2: chapter2V2 },
    save,
    seed: 42,
    clock: () => NOW,
  });
}

function settleUntil(world, predicate, maximumSeconds = 12) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += STEP_SECONDS) {
    if (predicate()) return;
    world.update(STEP_SECONDS);
  }
  if (!predicate()) throw new Error(`Platform interaction did not settle after ${maximumSeconds} seconds.`);
}

describe('Chapter Two platform conductor recovery', () => {
  it('survives reloads during the approach and visible welcome, then boards exactly once', () => {
    const approaching = createWorld(createPlatformSave());

    expect(approaching.tap({ x: 900, y: 500 })).toMatchObject({
      id: 'ch2.platform.conductor',
      kind: 'action',
    });
    expect(approaching.pendingInteraction).toMatchObject({
      chapterId: 'ch2',
      roomId: 'ch2.kingsCross',
      targetId: 'ch2.platform.conductor',
      kind: 'action',
      approach: { x: 780, y: 620, facing: 'right' },
    });

    approaching.update(0.5);
    expect(approaching.player.x).toBeGreaterThan(220);
    expect(approaching.player.x).toBeLessThan(780);
    expect(approaching.pendingInteraction?.targetId).toBe('ch2.platform.conductor');

    const afterApproachReload = createWorld(structuredClone(approaching.save));
    expect(afterApproachReload.currentSceneId).toBe('ch2.scene.barrierPlatform');
    expect(afterApproachReload.roomId).toBe('ch2.kingsCross');
    expect(afterApproachReload.targets()).toContainEqual(expect.objectContaining({
      id: 'ch2.platform.conductor',
      kind: 'action',
    }));
    expect(afterApproachReload.snapshot().occupants).toContainEqual(expect.objectContaining({
      npc: 'ch2.npc.conductor',
    }));

    expect(afterApproachReload.tap({ x: 900, y: 500 })).toMatchObject({
      id: 'ch2.platform.conductor',
    });
    settleUntil(afterApproachReload, () => afterApproachReload.dialogue.active);

    const welcomeCursor = {
      script: 'ch2.dialogue.platformWelcome',
      node: 'welcome',
    };
    expect(afterApproachReload.dialogue.presentation()).toMatchObject({
      type: 'line',
      scriptId: welcomeCursor.script,
      nodeId: welcomeCursor.node,
    });
    expect(afterApproachReload.save.resume.dialogue).toEqual(welcomeCursor);

    const restoredWelcome = createWorld(structuredClone(afterApproachReload.save));
    expect(restoredWelcome.currentSceneId).toBe('ch2.scene.barrierPlatform');
    expect(restoredWelcome.roomId).toBe('ch2.kingsCross');
    expect(restoredWelcome.dialogue.presentation()).toMatchObject({
      type: 'line',
      scriptId: welcomeCursor.script,
      nodeId: welcomeCursor.node,
    });
    expect(restoredWelcome.save.resume.dialogue).toEqual(welcomeCursor);

    restoredWelcome.advanceDialogue();

    expect(restoredWelcome.flags['ch2.boardedTrain']).toBe(true);
    expect(restoredWelcome.currentSceneId).toBe('ch2.scene.trainFriends');
    expect(restoredWelcome.roomId).toBe('ch2.trainCompartment');
    expect(restoredWelcome.save.resume).toEqual({
      chapter: 'ch2',
      scene: 'ch2.scene.trainFriends',
      room: 'ch2.trainCompartment',
      spawn: 'door',
      dialogue: null,
    });
    expect(restoredWelcome.save.progress.storyReceipts).toEqual([
      'ch2.dialogue.platformWelcome',
    ]);

    const afterBoardingReload = createWorld(structuredClone(restoredWelcome.save));
    expect(afterBoardingReload.flags['ch2.boardedTrain']).toBe(true);
    expect(afterBoardingReload.currentSceneId).toBe('ch2.scene.trainFriends');
    expect(afterBoardingReload.roomId).toBe('ch2.trainCompartment');
    expect(afterBoardingReload.save.resume).toEqual({
      chapter: 'ch2',
      scene: 'ch2.scene.trainFriends',
      room: 'ch2.trainCompartment',
      spawn: 'door',
      dialogue: null,
    });
    expect(afterBoardingReload.save.progress.storyReceipts).toEqual([
      'ch2.dialogue.platformWelcome',
    ]);
  });
});
