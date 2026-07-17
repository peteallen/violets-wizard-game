import { describe, expect, it, vi } from 'vitest';
import { Game, worldViewportSourceRect } from '../src/game/Game.js';
import { INPUT, WORLD } from '../src/game/config.js';
import { UI_RECTS } from '../src/game/render/UIRenderer.js';
import { createSaveV1 } from '../src/game/systems/Save.js';

const NOW = '2026-07-12T20:00:00.000Z';

function center(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function deferred() {
  let resolve;
  const promise = new Promise((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

function saveFixture({ complete = false } = {}) {
  const save = createSaveV1({ now: NOW, appVersion: 'parent-test', worldSeed: 42, name: 'Violet' });
  if (complete) {
    save.progress.completedChapters = ['ch1'];
    save.progress.highestUnlockedChapter = 2;
    save.progress.questFlags['ch1.complete'] = true;
    save.resume = { chapter: 'ch2', scene: 'ch2.placeholder', room: 'ch2.previewRoom', spawn: 'start' };
    save.character.wandId = 'violet-first-wand';
    save.character.appearance.robeTrim = 'purple';
    save.character.pet = { type: 'cat', name: 'Biscuit' };
    save.yearbook.entries.push({
      id: 'ch1.wandChosen', chapter: 'ch1', caption: 'My wand', mime: 'image/jpeg',
      width: 480, height: 270, byteLength: 0, dataUrl: 'data:image/jpeg;base64,', capturedAt: NOW,
    });
  }
  return save;
}

function soundStub() {
  return {
    playSfx: vi.fn(),
    setMuted: vi.fn(),
    setVolumes: vi.fn(),
    stopAll: vi.fn(),
    stopVoice: vi.fn(),
  };
}

function parentGame(save = saveFixture()) {
  const game = Object.create(Game.prototype);
  game.clock = () => NOW;
  game.saveData = save;
  game.destroyed = false;
  game.sessionGeneration = 0;
  game.sessionTransitioning = false;
  game.titleCharacterDependencies = Object.freeze(['character.violet', 'character.post-owl']);
  game.world = {
    save,
    overlay: { surface: 'parent', page: 'play', notice: null },
    setPieces: { reducedMotion: false },
  };
  game.sound = soundStub();
  game.particles = { reducedMotion: false };
  game.motionQuery = { matches: false };
  game.replayMode = false;
  game.canonicalSave = null;
  game.parentGateProgress = 0;
  game.render = vi.fn();
  game.updateStatus = vi.fn();
  game.roomRenderer = { logger: { warn: vi.fn() } };
  game.characterScopes = {
    activateTitle: vi.fn().mockResolvedValue(['character.violet', 'character.post-owl']),
    activateChapter: vi.fn().mockResolvedValue(['character.violet']),
    releaseTitle: vi.fn().mockResolvedValue([]),
    releaseChapter: vi.fn().mockResolvedValue([]),
  };
  game.saveManager = {
    write: vi.fn((value) => ({ ok: true, status: 'saved', save: structuredClone(value) })),
    export: vi.fn((value) => JSON.stringify(value)),
  };
  return game;
}

describe('grown-up long-press gate', () => {
  it('opens only after a deterministic three-second uninterrupted hold', () => {
    const game = parentGame();
    game.world.overlay = { surface: 'satchel', tab: 'map' };
    game.pointer = {
      id: 1,
      point: center(UI_RECTS.satchelKeyhole),
      latestPoint: center(UI_RECTS.satchelKeyhole),
      holdTarget: 'parent-panel',
      holdTriggered: false,
      holdCancelled: false,
    };

    for (let frame = 0; frame < INPUT.parentHoldSeconds / WORLD.step - 1; frame += 1) {
      game.updateParentGate(WORLD.step);
    }
    expect(game.world.overlay.surface).toBe('satchel');
    expect(game.parentGateProgress).toBeGreaterThan(0.98);

    game.updateParentGate(WORLD.step);
    expect(game.world.overlay).toEqual({ surface: 'parent', page: 'play', notice: null });
    expect(game.pointer.holdTriggered).toBe(true);
    expect(game.sound.playSfx).toHaveBeenCalledTimes(1);

    game.updateParentGate(WORLD.step);
    expect(game.sound.playSfx).toHaveBeenCalledTimes(1);
  });

  it('cancels progress when the finger drifts beyond tap slop', () => {
    const game = parentGame();
    game.world.overlay = { surface: 'satchel', tab: 'map' };
    const start = center(UI_RECTS.satchelKeyhole);
    game.pointer = {
      id: 7, point: start, latestPoint: start, holdTarget: 'parent-panel',
      holdTriggered: false, holdCancelled: false,
    };
    game.toWorld = () => ({ x: start.x + INPUT.tapSlop + 1, y: start.y });

    game.updateParentGate(1);
    expect(game.parentGateProgress).toBeCloseTo(1 / 3);
    game.onPointerMove({ pointerId: 7 });
    expect(game.pointer.holdCancelled).toBe(true);
    expect(game.parentGateProgress).toBe(0);
    game.updateParentGate(5);
    expect(game.world.overlay.surface).toBe('satchel');
  });
});

describe('parent settings', () => {
  it('applies and persists audio, motion, and learning choices', () => {
    const game = parentGame();
    game.world.overlay.page = 'settings';

    game.handleParentPanelTap(center(UI_RECTS.parentVoiceMinus), game.world.overlay);
    expect(game.saveData.settings.volumes.voice).toBe(0.9);
    expect(game.sound.setVolumes).toHaveBeenLastCalledWith(game.saveData.settings.volumes);

    game.handleParentPanelTap(center(UI_RECTS.parentMute), game.world.overlay);
    expect(game.saveData.settings.muted).toBe(true);
    expect(game.sound.setMuted).toHaveBeenLastCalledWith(true);

    game.handleParentPanelTap(center(UI_RECTS.parentReducedMotion), game.world.overlay);
    expect(game.saveData.settings.reducedMotion).toBe(true);
    expect(game.particles.reducedMotion).toBe(true);
    expect(game.world.setPieces.reducedMotion).toBe(true);

    game.handleParentPanelTap(center(UI_RECTS.parentLearningStretchy), game.world.overlay);
    expect(game.saveData.settings.learning).toBe('stretchy');
    expect(game.saveManager.write).toHaveBeenCalledTimes(4);
  });

  it('keeps device settings durable when changed during replay', () => {
    const game = parentGame();
    game.replayMode = true;
    game.canonicalSave = saveFixture({ complete: true });
    game.world.overlay.page = 'settings';

    game.handleParentPanelTap(center(UI_RECTS.parentMusicMinus), game.world.overlay);

    expect(game.saveData.settings.volumes.music).toBe(0.9);
    expect(game.canonicalSave.settings.volumes.music).toBe(0.9);
    expect(game.saveManager.write).toHaveBeenCalledWith(expect.objectContaining({
      progress: expect.objectContaining({ completedChapters: ['ch1'] }),
    }));
  });
});

describe('chapter replay isolation', () => {
  it('starts fresh with only Violet’s name and parent settings, then restores the exact canonical save', async () => {
    const canonical = saveFixture({ complete: true });
    canonical.settings.volumes.music = 0.4;
    const expected = structuredClone(canonical);
    const game = parentGame(canonical);
    game.createWorld = vi.fn(function createWorld(save, options) {
      this.saveData = save;
      this.lastCreateWorldOptions = options;
    });

    const started = await game.beginReplay('ch1');
    expect(started).toMatchObject({ ok: true, status: 'replay-started' });
    expect(game.replayMode).toBe(true);
    expect(game.canonicalSave).toEqual(expected);
    expect(game.saveData.character).toMatchObject({
      name: 'Violet', wandId: null, appearance: { robeTrim: null }, pet: { type: null, name: null },
    });
    expect(game.saveData.settings).toEqual(expected.settings);

    game.saveData.progress.questFlags['ch1.letterRead'] = true;
    game.saveData.character.wandId = 'replay-only-wand';
    const exited = await game.exitReplay();

    expect(exited).toMatchObject({ ok: true, status: 'replay-exited' });
    expect(game.replayMode).toBe(false);
    expect(game.canonicalSave).toBeNull();
    expect(game.saveData).toEqual(expected);
    expect(game.lastCreateWorldOptions).toEqual({ preserveSave: true });
    expect(game.characterScopes.activateChapter).toHaveBeenNthCalledWith(1, 'ch1', {
      source: 'chapter-replay',
    });
    expect(game.characterScopes.activateChapter).toHaveBeenNthCalledWith(2, 'ch2', {
      source: 'exit-replay',
    });
  });

  it('rejects replay until Chapter One is complete and never captures replay yearbook frames', async () => {
    const game = parentGame();
    game.createWorld = vi.fn();
    await expect(game.beginReplay('ch1')).resolves.toEqual({ ok: false, status: 'chapter-locked' });

    game.replayMode = true;
    game.captureYearbook('ch1.wandChosen');
    expect(game.saveData.yearbook.entries).toEqual([]);
  });

  it('keeps cards found during replay while discarding replay-only story changes', async () => {
    const canonical = saveFixture({ complete: true });
    canonical.collections.cards = ['morgana'];
    const game = parentGame(canonical);
    game.createWorld = vi.fn(function createWorld(save) { this.saveData = save; });

    await game.beginReplay('ch1');
    game.saveData.collections.cards.push('merlin');
    game.saveData.progress.questFlags['ch1.replayOnly'] = true;
    game.saveData.character.wandId = 'replay-only-wand';
    const exited = await game.exitReplay();

    expect(exited.save.collections.cards).toEqual(['morgana', 'merlin']);
    expect(exited.save.progress.questFlags['ch1.replayOnly']).toBeUndefined();
    expect(exited.save.character.wandId).toBe('violet-first-wand');
    expect(game.saveManager.write).toHaveBeenCalledTimes(2);
  });

  it('replays Chapter Two from King’s Cross with Violet’s established character choices', async () => {
    const canonical = saveFixture({ complete: true });
    canonical.progress.completedChapters.push('ch2');
    canonical.progress.highestUnlockedChapter = 3;
    canonical.progress.questFlags['ch2.complete'] = true;
    canonical.progress.storyChoices['ch2.choice.sortingCare'] = 'protect-friends';
    canonical.character.house = 'gryffindor';
    canonical.character.commonRoomPassword = ['lion', 'torch', 'star'];
    canonical.resume = {
      chapter: 'ch3', scene: 'ch3.scene.preview', room: 'ch3.previewRoom', spawn: 'start',
    };
    const game = parentGame(canonical);
    game.createWorld = vi.fn(function createWorld(save) { this.saveData = save; });

    const started = await game.beginReplay('ch2');

    expect(started).toMatchObject({ ok: true, status: 'replay-started' });
    expect(game.saveData.resume).toEqual({
      chapter: 'ch2',
      scene: 'ch2.scene.kingsCross',
      room: 'ch2.kingsCross',
      spawn: 'start',
    });
    expect(game.saveData.character).toMatchObject({
      name: 'Violet',
      wandId: 'violet-first-wand',
      appearance: { robeTrim: 'purple' },
      pet: { type: 'cat', name: 'Biscuit' },
      house: null,
      commonRoomPassword: [],
    });
    expect(game.saveData.progress.completedChapters).toEqual(['ch1']);
    expect(game.saveData.progress.questFlags['ch1.complete']).toBe(true);
    expect(game.saveData.progress.questFlags['ch2.complete']).toBeUndefined();
    expect(game.saveData.progress.storyChoices['ch2.choice.sortingCare']).toBeUndefined();
    expect(game.characterScopes.activateChapter).toHaveBeenCalledWith('ch2', {
      source: 'chapter-replay',
    });
    expect(game.updateStatus).toHaveBeenCalledWith(
      'Chapter Two replay. Violet’s saved adventure is safe.',
    );
  });

  it('offers the latest completed chapter in the grown-up book', () => {
    const save = saveFixture({ complete: true });
    const game = parentGame(save);
    expect(game.parentPanelModel()).toMatchObject({
      replayChapterId: 'ch1',
      replayChapterLabel: 'Chapter One',
    });

    save.progress.completedChapters.push('ch2');
    save.progress.highestUnlockedChapter = 3;
    expect(game.parentPanelModel()).toMatchObject({
      replayChapterId: 'ch2',
      replayChapterLabel: 'Chapter Two',
    });
  });

  it('exports canonical progress rather than temporary replay progress', () => {
    const game = parentGame();
    game.replayMode = true;
    game.canonicalSave = saveFixture({ complete: true });
    game.saveData.progress.questFlags['ch1.replayOnly'] = true;

    const raw = game.exportSaveData();
    const exported = JSON.parse(raw);
    expect(exported.progress.completedChapters).toEqual(['ch1']);
    expect(exported.progress.questFlags['ch1.replayOnly']).toBeUndefined();
  });
});

describe('session character scope transitions', () => {
  it('activates an imported chapter before constructing or rendering its world', async () => {
    const game = parentGame();
    const previousWorld = game.world;
    const incoming = saveFixture({ complete: true });
    const activation = deferred();
    game.characterScopes.activateChapter = vi.fn(() => activation.promise);
    game.createWorld = vi.fn(function createWorld(save, options) {
      this.saveData = save;
      this.world = { save };
      this.screen = 'playing';
      this.lastCreateWorldOptions = options;
    });

    const adoption = game.adoptSave(incoming, { preserveSave: true });

    expect(game.characterScopes.activateChapter).toHaveBeenCalledWith('ch2', {
      source: 'adopt-save',
    });
    expect(game.world).toBe(previousWorld);
    expect(game.createWorld).not.toHaveBeenCalled();
    expect(game.render).not.toHaveBeenCalled();

    activation.resolve(['character.violet', 'character.narrator']);
    await adoption;

    expect(game.createWorld).toHaveBeenCalledWith(expect.objectContaining({
      resume: expect.objectContaining({ chapter: 'ch2' }),
    }), { preserveSave: true });
    expect(game.render).toHaveBeenCalledOnce();
    expect(game.characterScopes.releaseTitle).toHaveBeenCalledOnce();
    expect(game.sessionTransitioning).toBe(false);
  });

  it('restores the title cast before rendering the title and then releases the chapter cast', async () => {
    const game = parentGame(saveFixture({ complete: true }));
    const previousWorld = game.world;
    game.screen = 'playing';
    const activation = deferred();
    game.characterScopes.activateTitle = vi.fn(() => activation.promise);

    const adoption = game.adoptSave(saveFixture(), {
      toTitle: true,
      hasStoredSave: false,
    });

    expect(game.characterScopes.activateTitle).toHaveBeenCalledWith(
      ['character.violet', 'character.post-owl'],
      { source: 'return-to-title' },
    );
    expect(game.screen).toBe('playing');
    expect(game.world).toBe(previousWorld);
    expect(game.render).not.toHaveBeenCalled();

    activation.resolve(['character.violet', 'character.post-owl']);
    await adoption;

    expect(game.screen).toBe('title');
    expect(game.world).toBeNull();
    expect(game.render).toHaveBeenCalledOnce();
    expect(game.characterScopes.releaseChapter).toHaveBeenCalledOnce();
    expect(game.render.mock.invocationCallOrder[0]).toBeLessThan(
      game.characterScopes.releaseChapter.mock.invocationCallOrder[0],
    );
    expect(game.sessionTransitioning).toBe(false);
  });

  it('keeps the current world intact when incoming character activation fails', async () => {
    const game = parentGame();
    const previousSave = game.saveData;
    const previousWorld = game.world;
    const error = new Error('runtime import failed');
    game.characterScopes.activateChapter = vi.fn().mockRejectedValue(error);
    game.createWorld = vi.fn();

    await expect(game.adoptSave(saveFixture({ complete: true }))).resolves.toBeNull();

    expect(game.saveData).toBe(previousSave);
    expect(game.world).toBe(previousWorld);
    expect(game.createWorld).not.toHaveBeenCalled();
    expect(game.characterScopes.releaseTitle).not.toHaveBeenCalled();
    expect(game.roomRenderer.logger.warn).toHaveBeenCalledWith(
      'The requested character scope could not be activated.',
      error,
    );
    expect(game.sessionTransitioning).toBe(false);
  });
});

describe('guarded recovery and Start Over', () => {
  it('rehydrates an imported save only after the save layer accepts it', async () => {
    const imported = saveFixture({ complete: true });
    const game = parentGame();
    game.saveManager.import = vi.fn(() => ({ ok: true, status: 'imported', save: imported }));
    game.adoptSave = vi.fn().mockResolvedValue(imported);

    await expect(game.importSaveData('{valid}')).resolves.toMatchObject({ ok: true, status: 'imported' });
    expect(game.adoptSave).toHaveBeenCalledWith(imported, expect.objectContaining({ preserveSave: true }));

    game.saveManager.import.mockReturnValue({ ok: false, status: 'invalid-import', save: null });
    game.adoptSave.mockClear();
    await expect(game.importSaveData('{broken')).resolves.toMatchObject({ ok: false, status: 'invalid-import' });
    expect(game.adoptSave).not.toHaveBeenCalled();
  });

  it('requires a separate confirmation before Start Over', () => {
    const game = parentGame(saveFixture({ complete: true }));
    game.world.overlay.page = 'save';
    game.startOverPreservingSettings = vi.fn();

    game.handleParentPanelTap(center(UI_RECTS.parentStartOver), game.world.overlay);
    expect(game.startOverPreservingSettings).not.toHaveBeenCalled();
    expect(game.world.overlay.page).toBe('confirm-start-over');

    game.handleParentPanelTap(center(UI_RECTS.parentAcceptConfirm), game.world.overlay);
    expect(game.startOverPreservingSettings).toHaveBeenCalledTimes(1);
  });

  it('clears story and yearbook while preserving name and device settings', async () => {
    const save = saveFixture({ complete: true });
    save.settings = {
      muted: true,
      volumes: { master: 0.8, voice: 1, music: 0.3, sfx: 0.7 },
      reducedMotion: true,
      learning: 'stretchy',
    };
    const game = parentGame(save);
    game.clock = () => NOW;
    game.saveManager.clear = vi.fn(() => ({ ok: true, status: 'cleared', save: null }));
    game.adoptSave = vi.fn(async (nextSave) => nextSave);

    const result = await game.startOverPreservingSettings();
    const fresh = game.saveManager.write.mock.calls.at(-1)[0];

    expect(result).toMatchObject({ ok: true, status: 'started-over' });
    expect(game.saveManager.clear).toHaveBeenCalledTimes(1);
    expect(fresh.settings).toEqual(save.settings);
    expect(fresh.character.name).toBe('Violet');
    expect(fresh.progress.completedChapters).toEqual([]);
    expect(fresh.progress.questFlags).toEqual({});
    expect(fresh.character.wandId).toBeNull();
    expect(fresh.yearbook.entries).toEqual([]);
    expect(game.adoptSave).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      toTitle: true, hasStoredSave: false,
    }));
  });

  it('rehydrates a successfully restored backup', async () => {
    const restored = saveFixture({ complete: true });
    const game = parentGame();
    game.saveManager.restoreBackup = vi.fn(() => ({ ok: true, status: 'restored-backup', save: restored }));
    game.adoptSave = vi.fn().mockResolvedValue(restored);

    await expect(game.restoreBackupSave()).resolves.toMatchObject({ ok: true, status: 'restored-backup' });
    expect(game.adoptSave).toHaveBeenCalledWith(restored, expect.objectContaining({ preserveSave: true }));
  });
});

describe('yearbook viewport framing', () => {
  it('crops a 4:3 iPad canvas to the centered 16:9 game viewport', () => {
    expect(worldViewportSourceRect({
      canvas: { width: 2048, height: 1536 },
      dpr: 2,
      scale: 0.8,
      offsetX: 0,
      offsetY: 96,
    })).toEqual({ x: 0, y: 192, width: 2048, height: 1152 });
  });
});

describe('parent surface geometry', () => {
  it('keeps every interactive rectangle at least 88 pixels in both dimensions', () => {
    for (const [id, rect] of Object.entries(UI_RECTS)) {
      if (id === 'dialogueAdvance') continue;
      expect(rect.width, `${id} width`).toBeGreaterThanOrEqual(88);
      expect(rect.height, `${id} height`).toBeGreaterThanOrEqual(88);
    }
  });
});
