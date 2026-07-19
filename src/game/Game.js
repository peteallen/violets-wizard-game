import { cards, cardsById } from './content/cards.js';
import { INPUT, PALETTE, WORLD } from './config.js';
import { conditionMatches } from './core/conditions.js';
import { cleanPetName, PetNameDialog } from './core/PetNameDialog.js';
import { SaveTransferDialog } from './core/SaveTransferDialog.js';
import { SoundEngine } from './core/SoundEngine.js';
import { clamp, distance, easeInOutCubic, lerp } from './core/math.js';
import { SeededRandom } from './core/rng.js';
import {
  CHAPTER_PREVIEW_ACTIONS,
  ChapterPreviewRenderer,
  chapterPreviewActionAt,
  chapterPreviewLayout,
} from './render/ChapterPreviewRenderer.js';
import { GuideFootprintRenderer } from './render/GuideFootprintRenderer.js';
import { Particles } from './render/Particles.js';
import { RoomRenderer } from './render/RoomRenderer.js';
import { RoomEffectsRenderer } from './render/RoomEffectsRenderer.js';
import { SetPieceRenderer } from './render/SetPieceRenderer.js';
import {
  UIRenderer,
  UI_RECTS,
  chapterCardLayout,
  dialogueSceneContext,
  dialogueScrollLayout,
  pointInUiRect,
  robePickerLayout,
} from './render/UIRenderer.js';
import { WorldAffordanceRenderer } from './render/WorldAffordanceRenderer.js';
import { WorldPropRenderer } from './render/WorldPropRenderer.js';
import {
  productionPresentationRegistry,
} from './presentation/productionRoomVariantOverlays.js';
import { Save, YEARBOOK_MAX_BYTES, createSave } from './systems/Save.js';
import { World } from './world/World.js';

const FIXED_HARNESS_TIME = '2000-01-01T00:00:00.000Z';
function letterNarrationClips(chapter) {
  const nodes = chapter?.dialogues?.['ch1.letter.read']?.nodes ?? {};
  return Object.freeze(
    ['invitation', 'waiting']
      .map((nodeId) => nodes[nodeId])
      .filter(Boolean)
      .map((node) => Object.freeze({ voice: node.voice, text: node.text })),
  );
}

function isChapterTwoPreview(world, state) {
  return Boolean(
    world?.chapter?.id === 'ch2'
    && state?.roomId === 'ch2.previewRoom',
  );
}

function activeChapterMap(chapterRuntime, world, state) {
  return chapterRuntime?.getChapterMap(
    world?.chapter?.id ?? state?.chapterId,
    state?.sceneId,
  ) ?? null;
}

export class Game {
  constructor(canvas, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Game requires a canvas element.');
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    if (!this.context) throw new Error('Canvas 2D is unavailable.');

    this.harness = Boolean(options.harness);
    this.harnessScene = typeof options.harnessScene === 'string' ? options.harnessScene : null;
    this.debug = Boolean(options.debug);
    this.promptForText = options.promptForText ?? null;
    this.clock = options.clock ?? (() => this.harness ? FIXED_HARNESS_TIME : new Date().toISOString());
    this.running = false;
    this.destroyed = false;
    this.accumulator = 0;
    this.simTime = 0;
    this.lastFrame = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;
    this.pointer = null;
    this.transitionAlpha = 0;
    this.roomTransition = null;
    this.lastTapPoint = { x: WORLD.width / 2, y: WORLD.height / 2 };
    this.nextTransitionEffect = null;
    this.deferredTransitionAudio = [];
    this.deferredSetPieceEvents = [];
    this.lastRenderState = null;
    this.parentGateProgress = 0;
    this.replayMode = false;
    this.canonicalSave = null;
    this.resumeRecap = null;
    this.letterNarrationRequest = null;
    this.sessionGeneration = 0;
    this.sessionTransitioning = false;
    this.deferCompositionMusic = false;
    this.titleComposition = {
      status: this.harness || options.startImmediately ? 'ready' : 'idle',
      attempt: 0,
      promise: null,
      error: null,
    };
    this.sessionComposition = null;
    this.setPieceComposition = null;
    this.presentationFailure = null;
    this.frameCharacterResults = [];
    this.observedRendererLoadings = new WeakSet();
    this.presentationReadinessGeneration = 0;

    if (
      !options.chapterRuntime
      || typeof options.chapterRuntime.prepare !== 'function'
      || typeof options.chapterRuntime.getChapter !== 'function'
      || typeof options.chapterRuntime.getChapterMap !== 'function'
      || !options.chapterRuntime.chapters
    ) {
      throw new TypeError('Game requires an injected chapter runtime registry.');
    }
    if (
      !options.assetRegistry
      || typeof options.assetRegistry.getAsset !== 'function'
      || typeof options.assetRegistry.resolveAsset !== 'function'
      || typeof options.assetRegistry.registerChapterPackage !== 'function'
    ) {
      throw new TypeError('Game requires an injected asset registry.');
    }
    this.chapterRuntime = options.chapterRuntime;
    this.assetRegistry = options.assetRegistry;
    const resolveAsset = (key) => this.assetRegistry.resolveAsset(key);

    const storage = options.storage ?? safeStorage();
    this.saveManager = options.saveManager ?? new Save({
      storage,
      clock: this.clock,
      migrationOptions: options.saveMigrationOptions,
    });
    const loaded = options.saveData
      ? {
          ok: true,
          status: 'provided',
          save: typeof this.saveManager.prepare === 'function'
            ? this.saveManager.prepare(options.saveData)
            : structuredClone(options.saveData),
        }
      : this.saveManager.load();
    this.loadStatus = loaded;
    this.saveData = loaded.ok && loaded.save
      ? loaded.save
      : createSave({ now: this.clock(), appVersion: import.meta.env.VITE_BUILD_SHA ?? 'development', worldSeed: 12072026 });
    this.hasStoredSave = Boolean(loaded.ok && loaded.save && hasMeaningfulProgress(this.saveData));
    this.motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = options.reducedMotion
      ?? (this.motionQuery.matches || Boolean(this.saveData.settings.reducedMotion));
    this.selectSetPieceFallback = options.selectSetPieceFallback ?? (({ descriptor }) => (
      descriptor.fallback
      && (descriptor.assets ?? []).some((assetKey) => !resolveAsset(assetKey))
        ? true
        : null
    ));

    this.sound = new SoundEngine({
      resolveAsset,
      muted: this.saveData.settings.muted,
      volumes: this.saveData.settings.volumes,
    });
    this.presentationRegistry = options.presentationRegistry ?? productionPresentationRegistry;
    this.roomRenderer = new RoomRenderer({
      resolveAsset,
      presentationRegistry: this.presentationRegistry,
    });
    this.worldPropRenderer = new WorldPropRenderer();
    if (!options.characterRenderer || typeof options.characterRenderer.draw !== 'function') {
      throw new TypeError('Game requires an injected character renderer with draw().');
    }
    this.characterRenderer = options.characterRenderer;
    this.characterReviewRenderer = options.characterReviewRenderer ?? null;
    const characterScopeMethods = [
      'activateTitle',
      'activateChapter',
      'releaseTitle',
      'releaseChapter',
    ];
    if (!options.characterScopes || characterScopeMethods.some((method) => typeof options.characterScopes[method] !== 'function')) {
      throw new TypeError('Game requires an injected character scope controller.');
    }
    this.characterScopes = options.characterScopes;
    this.titleCharacterDependencies = Object.freeze([
      ...(options.titleCharacterDependencies ?? this.characterScopes.titleCharacterIds ?? []),
    ]);
    this.chapterPreviewRenderer = options.chapterPreviewRenderer ?? new ChapterPreviewRenderer();
    this.guideFootprintRenderer = new GuideFootprintRenderer();
    this.uiRenderer = new UIRenderer({
      resolveAsset,
      resolveMapVignetteAsset: (request) => this.presentationRegistry
        .resolveMapVignetteAsset(request),
      characterRenderer: this.characterRenderer,
      reviewMap: options.reviewMap ?? null,
    });
    this.setPieceRenderer = new SetPieceRenderer({
      resolveAsset,
      characterRenderer: this.characterRenderer,
      presentationRegistry: this.presentationRegistry,
    });
    this.worldAffordanceRenderer = new WorldAffordanceRenderer();
    this.roomEffectsRenderer = new RoomEffectsRenderer();
    this.particles = new Particles(new SeededRandom(this.saveData.worldSeed).fork('particles'), { reducedMotion: this.reducedMotion });
    this.world = null;
    this.screen = options.startImmediately ? 'playing' : 'title';
    this.saveTransferDialog = options.saveTransferDialog === null || (this.harness && !options.enableSaveTransfer)
      ? null
      : options.saveTransferDialog ?? new SaveTransferDialog({
        onImport: ({ raw }) => this.importSaveData(raw),
        onResult: (result) => this.handleSaveTransferResult(result),
        onClose: () => this.render(),
      });
    this.petNameDialog = options.petNameDialog === null || (this.harness && !options.enablePetNameDialog)
      ? null
      : options.petNameDialog ?? new PetNameDialog({ onClose: () => this.render() });

    this.boundResize = () => this.resize();
    this.boundFrame = (time) => this.frame(time);
    this.boundPointerDown = (event) => this.onPointerDown(event);
    this.boundPointerMove = (event) => this.onPointerMove(event);
    this.boundPointerUp = (event) => this.onPointerUp(event);
    this.boundPointerCancel = (event) => this.onPointerCancel(event);
    this.boundKeyDown = (event) => this.onKeyDown(event);
    this.boundVisibility = () => this.onVisibilityChanged();
    this.boundMotionChanged = (event) => {
      this.reducedMotion = event.matches || Boolean(this.saveData.settings.reducedMotion);
      this.particles.reducedMotion = this.reducedMotion;
      if (this.world?.setPieces) this.world.setPieces.reducedMotion = this.reducedMotion;
    };

    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibility);
    this.motionQuery.addEventListener?.('change', this.boundMotionChanged);
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    canvas.addEventListener('pointermove', this.boundPointerMove);
    canvas.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('pointercancel', this.boundPointerCancel);
    if (this.debug) window.addEventListener('keydown', this.boundKeyDown);
    this.resize(options.width, options.height, options.dpr);

    this.updateStatus(this.hasStoredSave
      ? 'Continue Violet\u2019s saved adventure.'
      : 'Violet\u2019s letter is waiting. Open the letter to begin.');

    if (options.startImmediately) this.createWorld(this.saveData);
  }

  start() {
    if (this.running || this.destroyed) return;
    this.running = true;
    if (!this.harness && this.screen === 'title' && this.titleComposition.status !== 'ready') {
      void this.prepareTitleComposition().catch(() => {});
    }
    this.render();
    if (!this.harness) requestAnimationFrame(this.boundFrame);
  }

  createWorld(save = this.saveData, {
    preserveSave = false,
    reveal = true,
    deferMusic = false,
  } = {}) {
    this.saveData = save;
    const preservedSave = preserveSave ? structuredClone(save) : null;
    let initializing = true;
    this.world = new World({
      chapters: this.chapterRuntime.chapters,
      save,
      seed: save.worldSeed,
      clock: this.clock,
      selectSetPieceFallback: this.selectSetPieceFallback,
      onDirty: ({ flush, save: nextSave, rollbackSave = null }) => {
        if (preserveSave && initializing) return { ok: true, status: 'preserved', save: nextSave };
        return this.persistSave(nextSave, flush, { rollbackSave });
      },
    });
    initializing = false;
    if (preservedSave) {
      replaceObjectContents(save, preservedSave);
      // World initialization silently adopts historical quest progress. Once
      // those temporary receipts are removed, rebuild the adoption marker from
      // the restored save so the next update does not treat old steps as new.
      this.world.quests.silentAdoptions = null;
      this.world.quests.initialize();
    }
    this.world.setPieces.reducedMotion = this.reducedMotion;
    this.deferCompositionMusic = Boolean(deferMusic);
    if (reveal) this.screen = 'playing';
    this.processWorldEvents();
    if (!deferMusic) this.updateMusic();
    if (!deferMusic && this.world.roomId === 'ch1.courtyard') {
      void Promise.resolve(this.setPieceRenderer.preloadBrickWall()).catch((error) => {
        this.roomRenderer?.logger?.warn?.('The courtyard set-piece paintings could not be warmed.', error);
      });
    }
    if (!deferMusic) void this.preloadCurrentRoomSetPieceVariants();
  }

  beginSessionTransition() {
    if (this.destroyed || this.sessionTransitioning) return null;
    this.invalidateRendererPresentation();
    this.sessionTransitioning = true;
    this.sessionGeneration += 1;
    return this.sessionGeneration;
  }

  isCurrentSessionTransition(generation) {
    return !this.destroyed && generation === this.sessionGeneration;
  }

  finishSessionTransition(generation) {
    if (generation === this.sessionGeneration) this.sessionTransitioning = false;
  }

  isSetPieceCompositionBlocking() {
    const composition = this.setPieceComposition;
    if (!composition || composition.status === 'ready') return false;
    const active = this.world?.setPieces?.active;
    return Boolean(active && composition.active === active);
  }

  isCompositionLoading() {
    if (this.screen === 'title') {
      if (this.sessionComposition?.status === 'loading') return true;
      if (this.titleComposition?.status === 'idle' || this.titleComposition?.status === 'loading') return true;
    }
    if (this.presentationFailure?.status === 'loading') return true;
    return this.isSetPieceCompositionBlocking()
      && this.setPieceComposition.status === 'loading';
  }

  hasRetryableCompositionFailure() {
    return Boolean(
      (this.screen === 'title' && this.sessionComposition?.status === 'failed')
      || (this.screen === 'title' && this.titleComposition?.status === 'failed')
      || this.roomTransition?.failed
      || (this.isSetPieceCompositionBlocking() && this.setPieceComposition.status === 'failed')
      || this.presentationFailure?.status === 'failed',
    );
  }

  async retryComposition() {
    if (this.screen === 'title' && this.sessionComposition?.status === 'failed') {
      return this.startAdventure({ retry: true });
    }
    if (this.screen === 'title' && this.titleComposition?.status === 'failed') {
      try {
        await this.prepareTitleComposition({ retry: true });
        return true;
      } catch {
        return false;
      }
    }
    if (this.roomTransition?.failed) {
      try {
        await this.prepareRoomTransitionDestination(this.roomTransition, { retry: true });
        return true;
      } catch {
        return false;
      }
    }
    if (this.isSetPieceCompositionBlocking() && this.setPieceComposition.status === 'failed') {
      try {
        await this.prepareSetPieceComposition(this.world.setPieces.active, { retry: true });
        return true;
      } catch {
        return false;
      }
    }
    const failure = this.presentationFailure;
    if (failure?.status === 'failed' && typeof failure.retry === 'function') {
      const retrying = {
        ...failure,
        status: 'loading',
        retrying: true,
        generation: this.nextPresentationReadinessGeneration(),
        sessionGeneration: this.sessionGeneration,
        world: this.world,
        error: null,
        pending: new Set(),
      };
      this.presentationFailure = retrying;
      this.cancelPointerInteraction();
      this.updateStatus('Trying that picture again…');
      this.render?.();
      try {
        await failure.retry();
        if (!this.isCurrentRendererPresentation(retrying)) return false;
        this.presentationFailure = null;
        this.updateStatus(this.world?.dialoguePresentation?.text ?? this.world?.objective?.text ?? 'Continue Violet’s adventure.');
        this.render?.();
        return true;
      } catch (error) {
        if (!this.isCurrentRendererPresentation(retrying)) return false;
        retrying.status = 'failed';
        retrying.retrying = false;
        retrying.error = error;
        this.updateStatus('A picture could not finish loading. Tap to try again.');
        this.render?.();
      }
    }
    return false;
  }

  async activateSessionCharacterScope({ chapterId, toTitle = false, source }) {
    if (toTitle) {
      if (this.titleCharacterDependencies.length === 0) {
        throw new Error('The title character dependency scope is not configured.');
      }
      return this.characterScopes.activateTitle(this.titleCharacterDependencies, { source });
    }
    return this.characterScopes.activateChapter(chapterId, { source });
  }

  async activateChapterPresentation(chapterId) {
    if (typeof this.presentationRegistry?.activateChapter !== 'function') return null;
    return this.presentationRegistry.activateChapter(chapterId);
  }

  async prepareChapterRuntime(chapterId) {
    const prepared = await this.chapterRuntime.prepare(chapterId);
    for (const chapterPackage of prepared.packages) {
      this.assetRegistry.registerChapterPackage(chapterPackage);
    }
    return prepared;
  }

  prepareTitleComposition({ retry = false } = {}) {
    if (this.destroyed) return Promise.reject(new Error('The game has been destroyed.'));
    if (this.harness) {
      this.titleComposition.status = 'ready';
      return Promise.resolve(Object.freeze({ status: 'ready', harness: true }));
    }
    const current = this.titleComposition;
    if (!retry && current.status === 'ready') {
      return Promise.resolve(Object.freeze({ status: 'ready' }));
    }
    if (!retry && current.status === 'loading' && current.promise) return current.promise;

    const attempt = (current.attempt ?? 0) + 1;
    current.status = 'loading';
    current.attempt = attempt;
    current.error = null;
    this.updateStatus('Preparing Violet’s letter…');
    this.render?.();

    const pending = Promise.resolve().then(async () => {
      if (typeof this.uiRenderer?.prepareTitle === 'function') {
        await this.uiRenderer.prepareTitle({
          time: this.simTime,
          reducedMotion: this.reducedMotion,
          retry,
        });
      }
      if (this.destroyed || current.attempt !== attempt) return { status: 'superseded' };
      current.status = 'ready';
      current.error = null;
      this.presentationFailure = null;
      this.updateStatus(this.hasStoredSave
        ? 'Continue Violet’s saved adventure.'
        : 'Violet’s letter is waiting. Open the letter to begin.');
      this.render?.();
      return Object.freeze({ status: 'ready' });
    }).catch((error) => {
      if (!this.destroyed && current.attempt === attempt) {
        current.status = 'failed';
        current.error = error;
        this.updateStatus('Violet’s letter could not finish loading. Tap to try again.');
        this.render?.();
      }
      throw error;
    });
    current.promise = pending;
    return pending;
  }

  async prepareVisibleActorFrames(state = this.world?.snapshot?.(), {
    retry = false,
    extraRequests = [],
  } = {}) {
    if (!state || typeof this.characterRenderer?.prepare !== 'function') return [];
    const cameraX = Number.isFinite(state.cameraX) ? state.cameraX : 0;
    const requests = (state.actors ?? [])
      .filter((actor) => {
        const x = actor?.renderState?.x;
        return Number.isFinite(x) && x >= cameraX - 360 && x <= cameraX + WORLD.width + 360;
      })
      .map((actor) => ({
        ...actor.renderState,
        characterId: actor.characterId,
        surface: 'world',
        x: actor.renderState.x - cameraX,
        reducedMotion: this.reducedMotion,
        lightSide: state.keyLight,
        loadPriority: 'visible',
      }));

    if (state.dialogue?.type !== 'choice' && state.dialogue?.portraitCharacterId) {
      const scene = dialogueSceneContext(state);
      requests.push({
        ...scene.portraitRenderState,
        characterId: state.dialogue.portraitCharacterId,
        surface: 'portrait',
        pose: state.dialogue.portraitPose === undefined || state.dialogue.portraitPose === 'talk'
          ? 'speaking'
          : state.dialogue.portraitPose,
        reducedMotion: this.reducedMotion,
        lightSide: scene.lightSide,
        loadPriority: 'visible',
      });
    }
    if (state.dialogue?.type === 'choice') {
      for (const choice of state.dialogue.choices ?? []) {
        if (!choice.characterId) continue;
        requests.push({
          characterId: choice.characterId,
          surface: 'world',
          ...(choice.characterAppearance ? { appearance: choice.characterAppearance } : {}),
          reducedMotion: this.reducedMotion,
          loadPriority: 'visible',
        });
      }
    }
    requests.push(...extraRequests.map((request) => ({
      ...request,
      reducedMotion: this.reducedMotion,
      loadPriority: 'visible',
    })));

    await Promise.all(requests.map((request) => this.characterRenderer.prepare(
      request,
      this.simTime + (request.timeOffset ?? 0),
      { retry },
    )));
    return requests.map(({ characterId }) => characterId);
  }

  async prepareCurrentComposition({ retry = false, extraCharacterRequests = [] } = {}) {
    if (!this.world) return Object.freeze({ status: 'ready', empty: true });
    const chapterId = this.world.chapter?.id;
    if (chapterId) await this.activateChapterPresentation(chapterId);
    const state = this.world.snapshot();
    const scale = (this.dpr ?? 1) * (this.scale ?? 1);
    const roomPreparation = typeof this.roomRenderer?.prepareRoomRequired === 'function'
      ? this.roomRenderer.prepareRoomRequired(this.world.room, state, { scale, retry })
      : this.roomRenderer?.preloadRoom?.(this.world.room, state, { scale });
    await Promise.all([
      roomPreparation ?? Promise.resolve(null),
      this.prepareVisibleActorFrames(state, { retry, extraRequests: extraCharacterRequests }),
    ]);
    return Object.freeze({ status: 'ready', chapterId, roomId: state.roomId });
  }

  async startAdventure({ retry = false } = {}) {
    if (this.titleComposition && this.titleComposition.status !== 'ready' && !retry) return false;
    const reuseWorld = Boolean(retry && this.world && this.screen === 'title');
    const generation = this.beginSessionTransition();
    if (generation === null) return false;
    const composition = {
      status: 'loading',
      generation,
      error: null,
      retry,
    };
    this.sessionComposition = composition;
    this.updateStatus(retry ? 'Trying Violet’s adventure again…' : 'Opening Violet’s adventure…');
    this.render?.();
    try {
      await this.sound.unlock();
      if (!this.isCurrentSessionTransition(generation)) return;
      const chapterId = this.saveData.resume.chapter;
      await Promise.all([
        this.prepareChapterRuntime(chapterId),
        this.activateChapterPresentation(chapterId),
        this.characterScopes.activateChapter(chapterId, {
          source: retry ? 'retry-adventure' : 'start-adventure',
        }),
      ]);
      if (!this.isCurrentSessionTransition(generation)) return;
      const recap = this.hasStoredSave
        ? selectResumeRecap(
            this.saveData,
            this.chapterRuntime.chapters,
            this.chapterRuntime.resumeRecaps,
          )
        : null;
      if (!reuseWorld) {
        this.createWorld(this.saveData, { reveal: false, deferMusic: true });
      }
      this.updateStatus(retry ? 'Trying Violet’s adventure again…' : 'Opening Violet’s adventure…');
      await this.prepareCurrentComposition({
        retry,
        extraCharacterRequests: recap
          ? [{
            characterId: 'character.narrator',
            surface: 'portrait',
            pose: 'speaking',
          }]
          : [],
      });
      if (!this.isCurrentSessionTransition(generation)) return false;
      try {
        await this.characterScopes.releaseTitle();
      } catch (error) {
        this.roomRenderer?.logger?.warn?.('The title character scope could not be released.', error);
      }
      if (!this.isCurrentSessionTransition(generation)) return;
      this.screen = 'playing';
      this.deferCompositionMusic = false;
      composition.status = 'ready';
      composition.error = null;
      this.render?.();
      this.updateMusic();
      this.flushDeferredCompositionAudio();
      void this.preloadCurrentRoomSetPieceVariants();
      if (recap) {
        this.beginResumeRecap(recap);
        return true;
      }
      this.particles.emit('sparkle', WORLD.width / 2, WORLD.height / 2, 28);
      this.updateStatus(this.hasStoredSave
        ? this.world?.dialoguePresentation?.text
          ?? this.world?.objective?.text
          ?? 'Continue Violet’s adventure.'
        : 'Violet’s letter is waiting by the window.');
      return true;
    } catch (error) {
      if (this.isCurrentSessionTransition(generation)) {
        composition.status = 'failed';
        composition.error = error;
        this.roomRenderer?.logger?.warn?.('The adventure composition could not be prepared.', error);
        this.updateStatus('Violet’s adventure could not open. Tap to try again.');
        this.render?.();
      }
      return false;
    } finally {
      this.finishSessionTransition(generation);
    }
  }

  frame(timestamp) {
    if (!this.running || this.destroyed) return;
    if (document.hidden) {
      this.lastFrame = timestamp;
      requestAnimationFrame(this.boundFrame);
      return;
    }
    const elapsed = this.lastFrame === null ? 0 : clamp((timestamp - this.lastFrame) / 1000, 0, WORLD.maxFrameSeconds);
    this.lastFrame = timestamp;
    this.accumulator += elapsed;
    while (this.accumulator >= WORLD.step) {
      this.update(WORLD.step);
      this.accumulator -= WORLD.step;
    }
    this.render();
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    this.simTime += dt;
    this.updateParentGate(dt);
    this.particles.update(dt);
    if (!this.roomTransition || this.roomTransition.ready) {
      this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 2.8);
    }
    const transitionWasActive = Boolean(this.roomTransition);
    this.updateRoomTransition(dt);
    if (
      !transitionWasActive
      && !this.sessionTransitioning
      && !this.isSetPieceCompositionBlocking()
      && this.presentationFailure?.status !== 'loading'
      && this.presentationFailure?.status !== 'failed'
      && this.screen === 'playing'
      && this.world
      && !this.resumeRecap
    ) {
      this.world.update(dt);
      this.processWorldEvents();
    }
  }

  stepTo(seconds) {
    if (seconds < this.simTime) throw new Error('Game.stepTo cannot rewind a live game; create a fresh harness instance.');
    while (this.simTime + WORLD.step <= seconds + 1e-9) this.update(WORLD.step);
    this.render();
  }

  stepFrames(count = 1) {
    for (let index = 0; index < count; index += 1) this.update(WORLD.step);
    this.render();
  }

  resize(forcedWidth, forcedHeight, forcedDpr) {
    const transition = this.roomTransition;
    const cssWidth = forcedWidth ?? this.canvas.clientWidth ?? window.innerWidth;
    const cssHeight = forcedHeight ?? this.canvas.clientHeight ?? window.innerHeight;
    this.dpr = clamp(forcedDpr ?? window.devicePixelRatio ?? 1, 1, WORLD.maxDpr);
    this.canvas.width = Math.max(1, Math.round(cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * this.dpr));
    const fit = Math.min(cssWidth / WORLD.width, cssHeight / WORLD.height);
    this.scale = fit;
    this.offsetX = (cssWidth - WORLD.width * fit) / 2;
    this.offsetY = (cssHeight - WORLD.height * fit) / 2;
    const renderScale = this.dpr * this.scale;
    if (transition && Math.abs((transition.preparedScale ?? renderScale) - renderScale) > 1e-6) {
      this.roomRenderer?.clear?.();
      void this.prepareRoomTransitionDestination(transition).catch(() => {});
    }
    this.render();
  }

  toWorld(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - this.offsetX) / this.scale,
      y: (event.clientY - rect.top - this.offsetY) / this.scale,
    };
  }

  onPointerDown(event) {
    if (
      this.pointer !== null
      || this.sessionTransitioning
      || (this.roomTransition && !this.roomTransition.failed)
      || this.isCompositionLoading()
    ) return;
    this.canvas.setPointerCapture?.(event.pointerId);
    const point = this.toWorld(event);
    const holdsParentKeyhole = this.isParentKeyholeAvailable()
      && pointInUiRect(point, UI_RECTS.satchelKeyhole);
    const worldState = this.world?.snapshot?.() ?? null;
    this.pointer = {
      id: event.pointerId,
      point,
      latestPoint: point,
      holdTarget: holdsParentKeyhole ? 'parent-panel' : null,
      holdTriggered: false,
      holdCancelled: false,
      worldTargetId: !holdsParentKeyhole
        && this.world
        && !this.world.blocked
        && !worldState?.affordances?.quiet
        ? this.world.targetAt(point)?.id ?? null
        : null,
    };
    if (holdsParentKeyhole) {
      this.parentGateProgress = 0;
      this.sound.unlock().catch(() => {});
    }
  }

  onPointerMove(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    this.pointer.latestPoint = this.toWorld(event);
    if (distance(this.pointer.point, this.pointer.latestPoint) > INPUT.tapSlop) {
      this.pointer.worldTargetId = null;
    }
    if (
      this.pointer.holdTarget === 'parent-panel'
      && (
        distance(this.pointer.point, this.pointer.latestPoint) > INPUT.tapSlop
        || !pointInUiRect(this.pointer.latestPoint, UI_RECTS.satchelKeyhole)
      )
    ) {
      this.pointer.holdCancelled = true;
      this.parentGateProgress = 0;
    }
  }

  onPointerUp(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    const activePointer = this.pointer;
    const start = activePointer.point;
    const point = this.toWorld(event);
    this.pointer = null;
    if (activePointer.holdTarget === 'parent-panel') {
      this.parentGateProgress = 0;
      return;
    }
    if (distance(start, point) <= 24) this.handleTap(point);
  }

  onPointerCancel(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    this.pointer = null;
    this.parentGateProgress = 0;
  }

  updateParentGate(dt) {
    const pointer = this.pointer;
    if (
      !pointer
      || pointer.holdTarget !== 'parent-panel'
      || pointer.holdTriggered
      || pointer.holdCancelled
      || !this.isParentKeyholeAvailable()
    ) return;

    this.parentGateProgress = clamp(this.parentGateProgress + dt / INPUT.parentHoldSeconds, 0, 1);
    if (this.parentGateProgress + 1e-9 < 1) return;
    this.parentGateProgress = 1;
    pointer.holdTriggered = true;
    this.openParentPanel();
    this.sound.playSfx('sfx/ui/parchment', 'chime');
  }

  isParentKeyholeAvailable() {
    return Boolean(this.world?.overlay?.surface === 'satchel');
  }

  handleTap(point) {
    if (this.isCompositionLoading()) return;
    this.lastTapPoint = { x: point.x, y: point.y };
    if (this.shouldShowDebugReset() && pointInUiRect(point, UI_RECTS.debugReset)) {
      this.resetGame();
      return;
    }
    this.sound.unlock().catch(() => {});
    if (this.hasRetryableCompositionFailure()) {
      this.sound.playSfx?.('sfx/ui/tap', 'tap');
      void this.retryComposition();
      return;
    }
    if (this.replayMode && this.shouldShowReplayExit() && pointInUiRect(point, UI_RECTS.replayExit)) {
      this.exitReplay();
      return;
    }
    if (this.screen === 'title') {
      if (!this.titleComposition || this.titleComposition.status === 'ready') {
        void this.startAdventure();
      }
      return;
    }
    if (this.resumeRecap) {
      const recapState = this.lastRenderState ?? this.world?.snapshot?.() ?? {};
      const recapLayout = dialogueScrollLayout(dialogueSceneContext(recapState, this.resumeRecap));
      if (pointInUiRect(point, recapLayout.replayRect)) {
        this.sound.playSfx('sfx/ui/tap', 'tap');
        this.sound.speak(this.resumeRecap.voice, this.resumeRecap.text);
        this.updateStatus(this.resumeRecap.text);
        return;
      }
      this.dismissResumeRecap();
      return;
    }
    if (!this.world) return;
    const state = this.lastRenderState ?? this.world.snapshot();

    if (this.roomTransition) {
      this.sound.playSfx('sfx/ui/tap', 'tap');
      return;
    }

    if (state.overlay?.surface === 'parent') {
      this.handleOverlayTap(point, state);
      return;
    }

    if (isChapterTwoPreview(this.world, state) && !state.setPiece) {
      const actionId = chapterPreviewActionAt(point);
      if (actionId === CHAPTER_PREVIEW_ACTIONS.startFresh) {
        this.sound.playSfx('sfx/ui/parchment', 'chime');
        this.openParentPanel('confirm-start-over', null, { returnTo: 'chapter-preview' });
        return;
      }
      if (state.dialogue?.type === 'choice') {
        const choice = state.dialogue.choices.find((candidate) => candidate.id === actionId);
        if (!choice) return;
        this.sound.playSfx('sfx/ui/choice', 'chime');
        this.world.advanceDialogue(choice.id);
        this.processWorldEvents();
        return;
      }
    }

    if (state.setPiece) {
      if (
        isSkippableChapterCardSetPiece(state)
        && pointInUiRect(point, chapterCardLayout().action)
      ) {
        this.sound.playSfx('sfx/ui/page', 'tap');
        this.world.setPieces.skip();
        this.processWorldEvents();
        return;
      }
      const inputLockSeconds = (this.presentationRegistry ?? productionPresentationRegistry)
        .setPieceInputLockSeconds(state.setPiece, state);
      if (
        inputLockSeconds !== null
        && (state.setPiece.time ?? 0) + Number.EPSILON >= inputLockSeconds
      ) {
        this.sound.playSfx('sfx/ui/page', 'tap');
        this.world.setPieces.skip();
        this.processWorldEvents();
        return;
      }
      this.sound.playSfx('sfx/ui/tap', 'tap');
      return;
    }

    if (state.dialogue) {
      if (state.dialogue.type === 'choice') {
        const choice = state.dialogue.choices.find((candidate) => candidate.__rect && pointInUiRect(point, candidate.__rect));
        if (!choice) return;
        if (choice.id === 'nameCustom') {
          void this.completeCustomPetNameChoice(choice.id);
          return;
        }
        this.sound.playSfx('sfx/ui/choice', 'chime');
        this.world.advanceDialogue(choice.id);
      } else if (pointInUiRect(
        point,
        dialogueScrollLayout(dialogueSceneContext(state)).replayRect,
      )) {
        this.sound.playSfx('sfx/ui/tap', 'tap');
        this.world.dialogue.replay();
      } else {
        this.sound.playSfx('sfx/ui/page', 'tap');
        this.world.advanceDialogue();
      }
      this.processWorldEvents();
      return;
    }

    if (state.overlay) {
      this.handleOverlayTap(point, state);
      return;
    }

    if (state.learning) {
      this.handleLearningTap(point, state);
      return;
    }

    if (state.spellbook?.state && state.spellbook.state !== 'closed') {
      this.handleSpellbookTap(point, state);
      return;
    }

    if (pointInUiRect(point, UI_RECTS.quest)) {
      this.world.overlay = { surface: 'objective' };
      const objective = this.world.objective;
      if (objective) this.sound.speak(objective.voice, objective.text);
      return;
    }
    if (state.hasSatchel && pointInUiRect(point, UI_RECTS.satchel)) {
      const map = activeChapterMap(this.chapterRuntime, this.world, state);
      this.world.overlay = {
        surface: 'satchel',
        tab: map ? 'map' : 'cards',
      };
      this.sound.playSfx('sfx/ui/parchment', 'chime');
      return;
    }
    if (state.hasWand && pointInUiRect(point, UI_RECTS.wand)) {
      if ((state.spellbook?.known?.length ?? 0) === 0 || typeof this.world.openSpellbook !== 'function') {
        this.sound.playSfx('sfx/ui/locked', 'fizzle');
        this.updateStatus('Spells come later.');
        return;
      }
      this.world.openSpellbook();
      this.sound.playSfx('sfx/ui/parchment', 'chime');
      this.processWorldEvents();
      return;
    }

    this.world.tap(point);
    this.processWorldEvents();
  }

  handleLearningTap(point, state) {
    const presentation = this.uiRenderer.learningPresentation(state);
    const target = presentation.targets.find(
      (candidate) => pointInUiRect(point, candidate.hitArea),
    );
    if (!target) {
      this.sound.playSfx('sfx/ui/tap', 'tap');
      return false;
    }
    const tile = state.learning.tiles?.find(({ id }) => id === target.unitId) ?? null;
    if (tile?.voice) this.sound.speak(tile.voice, tile.glyph ?? '');
    const selected = this.world.chooseLearningUnit?.(target.unitId);
    if (selected === false) {
      this.sound.playSfx('sfx/ui/locked', 'fizzle');
      return false;
    }
    this.processWorldEvents();
    return true;
  }

  handleSpellbookTap(point, state) {
    const spellbook = state.spellbook;
    if (pointInUiRect(point, UI_RECTS.wand)) {
      this.world.cancelSpellbook?.();
      if (spellbook.state === 'targeting') this.world.cancelSpellbook?.();
      this.sound.playSfx('sfx/ui/close', 'tap');
      this.processWorldEvents();
      return true;
    }
    const presentation = this.uiRenderer.spellbookFanPresentation(state);
    const fanTarget = presentation.targets.find(
      (candidate) => pointInUiRect(point, candidate.hitArea),
    );
    if (fanTarget?.kind === 'close') {
      this.world.cancelSpellbook?.();
      if (spellbook.state === 'targeting') this.world.cancelSpellbook?.();
      this.sound.playSfx('sfx/ui/close', 'tap');
      this.processWorldEvents();
      return true;
    }
    if (fanTarget?.kind === 'spell-card') {
      const selected = this.world.selectSpell?.(fanTarget.spellId);
      this.sound.playSfx(
        selected === false ? 'sfx/ui/locked' : 'sfx/ui/choice',
        selected === false ? 'fizzle' : 'chime',
      );
      this.processWorldEvents();
      return selected !== false;
    }
    if (spellbook.state === 'targeting') {
      const target = this.world.targetAt(point);
      if (target && (spellbook.validTargetIds ?? []).includes(target.id)) {
        const cast = this.world.castSpellAt?.(target.id);
        if (cast !== false) {
          this.sound.playSfx('sfx/ui/choice', 'sparkle');
          this.processWorldEvents();
          return true;
        }
      }
    }
    if (spellbook.state !== 'casting') {
      this.world.cancelSpellbook?.();
      this.sound.playSfx(
        spellbook.state === 'targeting' ? 'sfx/ui/page' : 'sfx/ui/close',
        'tap',
      );
      this.processWorldEvents();
    } else this.sound.playSfx('sfx/ui/tap', 'tap');
    return false;
  }

  onKeyDown(event) {
    if (!this.debug || event.repeat || event.ctrlKey || event.metaKey) return;
    if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== 'r') return;
    event.preventDefault();
    this.resetGame();
  }

  async completeCustomPetNameChoice(choiceId = 'nameCustom') {
    const customName = await this.requestCustomPetName();
    if (!customName || this.destroyed || !this.world) return false;
    const state = this.world.snapshot();
    if (state.dialogue?.type !== 'choice' || !state.dialogue.choices?.some((choice) => choice.id === choiceId)) return false;
    if (!this.world.setPetName(customName)) return false;
    this.sound.playSfx('sfx/ui/choice', 'chime');
    this.world.advanceDialogue(choiceId);
    this.processWorldEvents();
    return true;
  }

  async requestCustomPetName() {
    let response;
    try {
      response = this.promptForText
        ? await this.promptForText('A grown-up can type a name for Violet’s pet:', '')
        : await this.petNameDialog?.open('');
    } catch {
      this.updateStatus('The name keyboard could not open. Choose one of the name cards instead.');
      return null;
    }
    if (response === null || response === undefined) return null;
    const name = cleanPetName(response);
    if (!name) {
      this.updateStatus('Type a name, or choose one of the name cards.');
      return null;
    }
    return name;
  }

  shouldShowDebugReset() {
    if (!this.debug) return false;
    if (this.screen === 'title' || !this.world) return true;
    return !this.world.overlay;
  }

  shouldShowReplayExit() {
    if (!this.replayMode || this.screen !== 'playing' || !this.world) return false;
    return !['parent', 'yearbook'].includes(this.world.overlay?.surface);
  }

  beginResumeRecap(recap) {
    this.resumeRecap = recap;
    this.recordResumeRecapReceipt(recap);
    this.sound.speak(recap.voice, recap.text);
    this.updateStatus(recap.text);
  }

  recordResumeRecapReceipt(recap) {
    const receipt = resumeRecapReceiptId(this.saveData?.resume?.chapter, recap);
    const receipts = this.saveData?.progress?.storyReceipts;
    if (!receipt || !Array.isArray(receipts) || receipts.includes(receipt)) return false;
    receipts.push(receipt);
    this.persistSave(this.saveData, true);
    return true;
  }

  dismissResumeRecap() {
    if (!this.resumeRecap) return;
    this.resumeRecap = null;
    this.sound.stopVoice();
    this.sound.playSfx('sfx/ui/page', 'tap');
    const dialogue = this.world?.dialoguePresentation;
    if (dialogue?.voice) this.sound.speak(dialogue.voice, dialogue.text);
    this.updateStatus(dialogue?.text ?? 'Continue Violet’s adventure.');
  }

  startLetterNarration() {
    if (this.world?.overlay?.surface !== 'letter-reading') return false;
    this.stopLetterNarration();
    const request = Object.freeze({ world: this.world });
    this.letterNarrationRequest = request;
    this.playLetterNarrationClip(request, 0);
    return true;
  }

  playLetterNarrationClip(request, index) {
    if (!this.isLetterNarrationCurrent(request)) return;
    const clips = letterNarrationClips(request.world?.chapter);
    const clip = clips[index];
    if (!clip) {
      this.letterNarrationRequest = null;
      return;
    }
    this.sound.speak(clip.voice, clip.text, {
      onEnded: () => {
        if (!this.isLetterNarrationCurrent(request)) return;
        if (index + 1 >= clips.length) {
          this.letterNarrationRequest = null;
          return;
        }
        this.playLetterNarrationClip(request, index + 1);
      },
    });
  }

  isLetterNarrationCurrent(request) {
    return Boolean(
      request
      && this.letterNarrationRequest === request
      && !this.destroyed
      && this.world === request.world
      && this.world?.overlay?.surface === 'letter-reading',
    );
  }

  stopLetterNarration() {
    this.letterNarrationRequest = null;
    this.sound.stopVoice();
  }

  handleOverlayTap(point, state) {
    if (state.overlay.surface === 'letter-reading') {
      if (pointInUiRect(point, UI_RECTS.letterHear)) {
        this.sound.playSfx('sfx/ui/tap', 'tap');
        this.startLetterNarration();
        return;
      }
      if (!pointInUiRect(point, UI_RECTS.letterContinue)) return;
      this.stopLetterNarration();
      this.world.closeOverlay();
      this.sound.playSfx('sfx/ui/page', 'tap');
      this.world.setFlag('ch1.letterRead', true);
      this.processWorldEvents();
      return;
    }
    if (state.overlay.surface === 'robe-picker') {
      const layout = robePickerLayout(state.overlay.selectedTrim);
      const swatch = layout.swatches.find((candidate) => pointInUiRect(point, candidate.rect));
      if (swatch) {
        if (this.world.selectRobeTrim(swatch.id)) {
          this.sound.playSfx('sfx/ui/choice', 'chime');
          this.processWorldEvents();
        }
        return;
      }
      if (pointInUiRect(point, layout.confirm) && this.world.confirmRobeTrim()) {
        this.sound.playSfx('sfx/ui/page', 'tap');
        this.processWorldEvents();
      }
      return;
    }
    if (state.overlay.surface === 'spellbook') {
      const presentation = this.uiRenderer.spellbookPresentation(state);
      const target = presentation.targets.find(
        (candidate) => pointInUiRect(point, candidate.hitArea),
      );
      if (!target) return;
      if (target.kind === 'close') {
        this.world.closeOverlay();
        this.sound.playSfx('sfx/ui/close', 'tap');
        return;
      }
      if (target.kind === 'spell-detail') {
        this.world.overlay = { surface: 'spellbook', tab: target.spellId };
        this.sound.playSfx('sfx/ui/page', 'tap');
        return;
      }
      if (target.kind === 'spell-practice') {
        this.world.closeOverlay();
        const opened = this.world.openSpellbook?.();
        const selected = opened === false ? false : this.world.selectSpell?.(target.spellId);
        this.sound.playSfx(
          selected === false ? 'sfx/ui/locked' : 'sfx/ui/choice',
          selected === false ? 'fizzle' : 'chime',
        );
        this.processWorldEvents();
      }
      return;
    }
    const closeRect = state.overlay.surface === 'satchel'
      ? UI_RECTS.satchelClose
      : UI_RECTS.close;
    if (pointInUiRect(point, closeRect)) {
      if (state.overlay.surface === 'yearbook') this.openParentPanel('play');
      else this.world.closeOverlay();
      this.sound.playSfx('sfx/ui/close', 'tap');
      return;
    }
    if (state.overlay.surface === 'objective') {
      this.world.closeOverlay();
      return;
    }
    if (state.overlay.surface === 'parent') {
      this.handleParentPanelTap(point, state.overlay);
      return;
    }
    if (state.overlay.surface === 'yearbook') {
      this.handleYearbookTap(point, state.overlay);
      return;
    }
    if (state.overlay.surface === 'satchel') {
      const map = activeChapterMap(this.chapterRuntime, this.world, state);
      const mapAvailable = Boolean(map);
      if (pointInUiRect(point, UI_RECTS.satchelStartOver)) {
        this.sound.playSfx('sfx/ui/parchment', 'chime');
        this.openParentPanel('confirm-start-over', null, {
          returnTo: 'satchel',
          returnTab: state.overlay.tab,
          returnPage: state.overlay.page,
        });
        return;
      }
      if (mapAvailable && pointInUiRect(point, UI_RECTS.satchelMapTab)) {
        this.world.overlay = { surface: 'satchel', tab: 'map' };
        this.sound.playSfx('sfx/ui/parchment', 'tap');
        return;
      }
      const cardsTabRect = mapAvailable
        ? UI_RECTS.satchelCardsTab
        : UI_RECTS.satchelCardsOnlyTab;
      if (pointInUiRect(point, cardsTabRect)) {
        this.world.overlay = { surface: 'satchel', tab: 'cards' };
        this.sound.playSfx('sfx/ui/parchment', 'tap');
        return;
      }
      if (state.overlay.tab === 'cards') {
        const album = state.__cardAlbum;
        if (album?.pageCount > 1 && pointInUiRect(point, UI_RECTS.satchelCardsPrevious)) {
          this.world.overlay = {
            surface: 'satchel',
            tab: 'cards',
            page: (album.page - 1 + album.pageCount) % album.pageCount,
          };
          this.sound.playSfx('sfx/ui/page', 'tap');
          this.render();
          return;
        }
        if (album?.pageCount > 1 && pointInUiRect(point, UI_RECTS.satchelCardsNext)) {
          this.world.overlay = {
            surface: 'satchel',
            tab: 'cards',
            page: (album.page + 1) % album.pageCount,
          };
          this.sound.playSfx('sfx/ui/page', 'tap');
          this.render();
          return;
        }
        const slot = state.__cardSlots?.find((candidate) => candidate.__rect && pointInUiRect(point, candidate.__rect));
        if (!slot) return;
        if (!slot.earned) {
          this.sound.playSfx('sfx/ui/locked', 'fizzle');
          return;
        }
        const card = cardsById[slot.id];
        if (!card) return;
        this.sound.speak(card.voice, card.text);
        this.updateStatus(card.text);
        return;
      }
      if (!mapAvailable) {
        this.world.overlay = { surface: 'satchel', tab: 'cards' };
        this.sound.playSfx('sfx/ui/locked', 'fizzle');
        return;
      }
      const mapPresentation = this.uiRenderer.mapPresentation(
        state,
        this.simTime,
        { map, reducedMotion: this.reducedMotion },
      );
      const location = mapPresentation.hitTargets.find(
        (candidate) => pointInUiRect(point, candidate.hitArea),
      );
      if (!location) return;
      if (!location.enabled) {
        this.sound.playSfx('sfx/ui/locked', 'fizzle');
        return;
      }
      const contentLocation = map.locations.find((candidate) => candidate.id === location.id);
      if (!contentLocation) return;
      this.world.closeOverlay();
      this.nextTransitionEffect = 'sparkle';
      this.world.runActions(contentLocation.onSelect);
      this.sound.playSfx('sfx/ui/travel', 'flourish');
      this.processWorldEvents();
    }
  }

  openParentPanel(page = 'play', notice = null, {
    returnTo = null,
    returnTab = null,
    returnPage = null,
  } = {}) {
    if (!this.world) return false;
    this.parentGateProgress = 0;
    this.world.overlay = { surface: 'parent', page, notice };
    if (returnTo) this.world.overlay.returnTo = returnTo;
    if (returnTab) this.world.overlay.returnTab = returnTab;
    if (Number.isInteger(returnPage)) this.world.overlay.returnPage = returnPage;
    this.render();
    return true;
  }

  setParentNotice(text, kind = 'success') {
    if (this.world?.overlay?.surface !== 'parent') return;
    this.world.overlay = {
      ...this.world.overlay,
      notice: text ? { text, kind } : null,
    };
    this.updateStatus(text);
    this.render();
  }

  handleParentPanelTap(point, overlay) {
    if (overlay.page === 'confirm-start-over' || overlay.page === 'confirm-restore') {
      if (pointInUiRect(point, UI_RECTS.parentCancelConfirm)) {
        if (overlay.returnTo === 'chapter-preview') {
          this.world.closeOverlay();
          this.render();
        } else if (overlay.returnTo === 'satchel') {
          this.world.overlay = { surface: 'satchel', tab: overlay.returnTab ?? 'cards' };
          if (Number.isInteger(overlay.returnPage)) this.world.overlay.page = overlay.returnPage;
          this.render();
        } else this.openParentPanel('save');
        this.sound.playSfx('sfx/ui/page', 'tap');
        return;
      }
      if (!pointInUiRect(point, UI_RECTS.parentAcceptConfirm)) return;
      if (overlay.page === 'confirm-start-over') this.startOverPreservingSettings();
      else this.restoreBackupSave();
      return;
    }

    for (const [page, rect] of [
      ['play', UI_RECTS.parentPlayTab],
      ['settings', UI_RECTS.parentSettingsTab],
      ['save', UI_RECTS.parentSaveTab],
    ]) {
      if (!pointInUiRect(point, rect)) continue;
      this.openParentPanel(page);
      this.sound.playSfx('sfx/ui/page', 'tap');
      return;
    }

    if (overlay.page === 'play') {
      if (pointInUiRect(point, UI_RECTS.parentReplay)) {
        if (this.replayMode) this.exitReplay();
        else {
          const chapterId = latestReplayChapterId(
            this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData,
            this.chapterRuntime.descriptors,
          );
          if (chapterId) this.beginReplay(chapterId);
          else this.setParentNotice('A finished chapter unlocks replay.', 'error');
        }
        return;
      }
      if (pointInUiRect(point, UI_RECTS.parentYearbook)) {
        this.world.overlay = { surface: 'yearbook', index: 0 };
        this.sound.playSfx('sfx/ui/page', 'chime');
        this.render();
      }
      return;
    }

    if (overlay.page === 'settings') {
      if (pointInUiRect(point, UI_RECTS.parentMute)) {
        this.updateDeviceSettings((settings) => { settings.muted = !settings.muted; });
        return;
      }
      if (pointInUiRect(point, UI_RECTS.parentReducedMotion)) {
        this.updateDeviceSettings((settings) => { settings.reducedMotion = !settings.reducedMotion; });
        return;
      }
      for (const [level, rect] of [
        ['off', UI_RECTS.parentLearningOff],
        ['gentle', UI_RECTS.parentLearningGentle],
        ['stretchy', UI_RECTS.parentLearningStretchy],
      ]) {
        if (!pointInUiRect(point, rect)) continue;
        this.updateDeviceSettings((settings) => { settings.learning = level; });
        return;
      }
      for (const [channel, delta, rect] of [
        ['master', -0.1, UI_RECTS.parentMasterMinus],
        ['master', 0.1, UI_RECTS.parentMasterPlus],
        ['voice', -0.1, UI_RECTS.parentVoiceMinus],
        ['voice', 0.1, UI_RECTS.parentVoicePlus],
        ['music', -0.1, UI_RECTS.parentMusicMinus],
        ['music', 0.1, UI_RECTS.parentMusicPlus],
        ['sfx', -0.1, UI_RECTS.parentSfxMinus],
        ['sfx', 0.1, UI_RECTS.parentSfxPlus],
      ]) {
        if (!pointInUiRect(point, rect)) continue;
        this.updateDeviceSettings((settings) => {
          settings.volumes[channel] = Math.round(clamp(settings.volumes[channel] + delta, 0, 1) * 10) / 10;
        });
        return;
      }
      return;
    }

    if (overlay.page === 'save') {
      if (pointInUiRect(point, UI_RECTS.parentExport)) {
        this.openSaveExport();
        return;
      }
      if (pointInUiRect(point, UI_RECTS.parentImport)) {
        this.openSaveImport();
        return;
      }
      if (pointInUiRect(point, UI_RECTS.parentRestore)) {
        this.openParentPanel('confirm-restore');
        return;
      }
      if (pointInUiRect(point, UI_RECTS.parentStartOver)) this.openParentPanel('confirm-start-over');
    }
  }

  handleYearbookTap(point, overlay) {
    const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
    const count = durableSave.yearbook.entries.length;
    if (count < 2) return;
    if (pointInUiRect(point, UI_RECTS.yearbookPrevious)) {
      this.world.overlay = { ...overlay, index: (overlay.index - 1 + count) % count };
      this.sound.playSfx('sfx/ui/page', 'tap');
      this.render();
      return;
    }
    if (pointInUiRect(point, UI_RECTS.yearbookNext)) {
      this.world.overlay = { ...overlay, index: (overlay.index + 1) % count };
      this.sound.playSfx('sfx/ui/page', 'tap');
      this.render();
    }
  }

  updateDeviceSettings(change) {
    if (typeof change !== 'function') throw new TypeError('Game.updateDeviceSettings requires a change function.');
    const nextSettings = structuredClone(this.saveData.settings);
    change(nextSettings);
    this.saveData.settings = nextSettings;
    if (this.world) this.world.save.settings = nextSettings;
    if (this.replayMode && this.canonicalSave) this.canonicalSave.settings = structuredClone(nextSettings);
    this.applyDeviceSettings(nextSettings);

    const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
    const result = this.saveManager.write(durableSave);
    if (result.ok && this.replayMode) this.canonicalSave = result.save;
    if (!result.ok) this.setParentNotice('This device could not save that setting.', 'error');
    this.sound.playSfx('sfx/ui/tap', 'tap');
    this.render();
    return result;
  }

  applyDeviceSettings(settings = this.saveData.settings) {
    this.sound.setMuted(settings.muted);
    this.sound.setVolumes(settings.volumes);
    this.reducedMotion = this.motionQuery.matches || Boolean(settings.reducedMotion);
    this.particles.reducedMotion = this.reducedMotion;
    if (this.world?.setPieces) this.world.setPieces.reducedMotion = this.reducedMotion;
  }

  processWorldEvents() {
    if (!this.world) return;
    for (const event of this.world.drainEvents()) this.handleWorldEvent(event);
  }

  handleWorldEvent(event) {
    if (
      this.isSetPieceCompositionBlocking()
      && ['audio.command', 'feedback.command'].includes(event.type)
    ) {
      this.deferredSetPieceEvents.push(event);
      return;
    }
    switch (event.type) {
      case 'dialogue.lineChanged': {
        const line = this.world.dialoguePresentation;
        if (line?.voice) this.playOrDeferTransitionAudio({ type: 'voice', key: line.voice, text: line.text });
        this.updateStatus(line?.text ?? '');
        break;
      }
      case 'dialogue.closed':
        if (!this.world.dialogue.active || this.world.dialogue.scriptId === event.payload.script) {
          this.sound.stopVoice();
        }
        break;
      case 'hint.lookRequested':
        this.emitHintPath(event.payload.target, { steps: 3, particlesPerStep: 2 });
        this.updateStatus(this.world.objective?.text ?? '');
        break;
      case 'hint.voiceRequested':
        this.playOrDeferTransitionAudio({
          type: 'voice',
          key: event.payload.voice,
          text: event.payload.text,
        });
        this.updateStatus(event.payload.text);
        break;
      case 'hint.trailRequested':
        this.emitHintPath(event.payload.target, { steps: 8, particlesPerStep: 3 });
        this.updateStatus(this.world.objective?.text ?? '');
        break;
      case 'hint.assistTriggered': {
        const target = this.hintTargetPosition(event.payload.target);
        if (target) this.particles.emit('sparkle', target.x, target.y, 18, { size: 9, speed: 55 });
        this.sound.playSfx('sfx/ui/choice', 'chime');
        this.updateStatus(this.world.objective?.text ?? '');
        break;
      }
      case 'hint.cleared':
        this.sound.stopVoice();
        break;
      case 'learning.started':
        this.updateStatus('Magic is ready. Tap the glowing piece.');
        break;
      case 'learning.attempted': {
        const successful = event.payload.outcome !== 'wrong';
        this.sound.playSfx(
          successful ? 'sfx/ui/choice' : 'sfx/ui/locked',
          successful ? 'chime' : 'fizzle',
        );
        break;
      }
      case 'learning.hintChanged':
        this.updateStatus(
          event.payload.stage === 'focus' || event.payload.stage === 'complete'
            ? 'Tap the glowing piece.'
            : 'Continue making magic.',
        );
        break;
      case 'learning.completed':
        this.particles.emit('sparkle', WORLD.width / 2, 300, 30, { size: 9, speed: 60 });
        this.sound.playSfx('sfx/ui/choice', 'flourish');
        this.updateStatus('The spell is complete.');
        break;
      case 'spellbook.stateChanged':
        this.updateStatus(spellbookStatusText(event.payload));
        break;
      case 'spell.cast': {
        const spellId = event.payload.spellId ?? event.payload.spell;
        const card = this.world.snapshot().spellbook?.known?.find(({ id }) => id === spellId);
        const audioKey = card?.audio?.cast ?? card?.audio?.success ?? null;
        const activeSetPieceAssets = this.world.setPieces.active?.descriptor?.assets ?? [];
        if (audioKey && !activeSetPieceAssets.includes(audioKey)) {
          this.sound.playSfx(audioKey, 'sparkle');
        }
        const target = this.hintTargetPosition(event.payload.targetId ?? event.payload.target);
        if (target) this.particles.emit('sparkle', target.x, target.y, 22, { size: 8, speed: 52 });
        this.updateStatus(`${card?.incantation ?? card?.label ?? 'Magic'}!`);
        break;
      }
      case 'setPiece.started':
        void this.prepareSetPieceComposition(this.world.setPieces.active).catch(() => {});
        if (event.payload.id.includes('previewTicket')) {
          this.playOrDeferTransitionAudio({
            type: 'sfx',
            key: 'sfx/ch2/trainWhistle',
            fallback: 'flourish',
          });
        }
        break;
      case 'setPiece.completed': {
        const composition = this.setPieceComposition;
        if (composition) {
          this.releaseCompositionSource(composition.source);
          this.setPieceRenderer.releaseImages?.(composition.assetKeys ?? []);
          this.setPieceComposition = null;
        }
        this.deferredSetPieceEvents = [];
        break;
      }
      case 'audio.command':
        this.playOrDeferTransitionAudio({ type: 'command', command: { ...event.payload } });
        break;
      case 'feedback.command':
        this.particles.emit('sparkle', event.payload.x, event.payload.y, 5, { size: 4 });
        this.sound.playSfx('sfx/ui/tap', 'tap');
        break;
      case 'reward.granted':
        this.particles.emit('sparkle', WORLD.width / 2, 250, 24);
        this.sound.playSfx('sfx/ch1/coin', 'flourish');
        break;
      case 'yearbook.captureRequested':
        this.captureYearbook(event.payload.moment, event.payload.caption);
        break;
      case 'room.transitionRequested':
        this.beginRoomTransition(this.nextTransitionEffect ?? event.payload.effect);
        this.nextTransitionEffect = null;
        break;
      case 'room.entered':
        this.particles.clear();
        this.updateMusic();
        if (!this.deferCompositionMusic && event.payload.room === 'ch1.courtyard') {
          void Promise.resolve(this.setPieceRenderer.preloadBrickWall()).catch((error) => {
            this.roomRenderer?.logger?.warn?.('The courtyard set-piece paintings could not be warmed.', error);
          });
        }
        if (!this.deferCompositionMusic) void this.preloadCurrentRoomSetPieceVariants();
        break;
      case 'ui.openRequested':
        if (event.payload.surface === 'chapter-replay') this.beginReplay();
        else if (event.payload.surface === 'letter-reading') {
          this.updateStatus('Dear Violet, You are invited to Hogwarts School of Witchcraft and Wizardry. Your place is waiting. Choose Hear the letter to listen, or Let’s go to continue.');
        }
        break;
      case 'chapter.completed':
        void this.prepareChapterRuntime(event.payload.nextChapter).catch((error) => {
          this.roomRenderer?.logger?.warn?.('The following chapter could not be prepared.', error);
        });
        if (this.world.chapter.id !== event.payload.nextChapter) {
          this.world.adoptPersistedResume(event.payload.nextChapter);
          this.processWorldEvents();
        }
        break;
      default:
        break;
    }
  }

  handleAudioCommand(command) {
    if (command.command === 'sfx') {
      if (command.pan === undefined) this.sound.playSfx(command.key, 'chime');
      else this.sound.playSfx(command.key, 'chime', { pan: command.pan });
    }
    else if (command.command === 'voice') this.sound.speak(command.key);
    else if (command.command === 'stopVoice') this.sound.stopVoice();
    else if (command.command === 'music' && command.mode === 'stop') this.sound.stopMusic();
    else if (command.command === 'music') {
      const options = { mode: command.mode };
      if (command.fadeSeconds !== undefined) options.fadeSeconds = command.fadeSeconds;
      this.sound.playMusic(command.key, options);
    }
  }

  hintTargetPosition(targetId) {
    const state = this.world.snapshot();
    const targets = this.semanticTargets(state);
    const thread = state.affordances?.thread;
    const resolvedTargetId = thread?.worldTargetId ?? thread?.targetId ?? null;
    const mapTarget = state.objective?.mapStar?.hotspot;
    const target = targets.find((candidate) => candidate.id === resolvedTargetId)
      ?? targets.find((candidate) => candidate.id === targetId)
      ?? targets.find((candidate) => candidate.id === mapTarget)
      ?? targets.find((candidate) => candidate.id === 'hud.quest');
    if (!target) return null;
    return {
      x: clamp(target.x, 40, WORLD.width - 40),
      y: clamp(target.y, 40, WORLD.height - 40),
    };
  }

  emitHintPath(targetId, { steps, particlesPerStep }) {
    const target = this.hintTargetPosition(targetId);
    if (!target) return;
    const state = this.lastRenderState ?? this.world.snapshot();
    const guide = state.pet ?? state.player;
    const origin = {
      x: clamp(guide.x - state.cameraX, 40, WORLD.width - 40),
      y: clamp(guide.y - (state.pet ? 45 : 90), 40, WORLD.height - 40),
    };
    const visibleSteps = this.reducedMotion ? Math.min(steps, 2) : steps;
    for (let index = 1; index <= visibleSteps; index += 1) {
      const progress = index / visibleSteps;
      this.particles.emit(
        'sparkle',
        origin.x + (target.x - origin.x) * progress,
        origin.y + (target.y - origin.y) * progress,
        particlesPerStep,
        { size: 6, speed: 28, gravity: 0, life: 1.5 },
      );
    }
  }

  updateMusic() {
    if (!this.world || this.deferCompositionMusic || (this.roomTransition && !this.roomTransition.ready)) return;
    const key = (this.presentationRegistry ?? productionPresentationRegistry).resolveRoomMusic({
      chapterId: this.world.chapter?.id,
      roomId: this.world.roomId,
    });
    if (!key) return;
    this.sound.playMusic(key, { mode: 'crossfade', fadeSeconds: 0.8 });
  }

  preloadCurrentRoomSetPieceVariants() {
    if (!this.world || this.roomTransition || this.deferCompositionMusic) return Promise.resolve([]);
    const variants = [...new Set(Object.values(this.world.chapter?.setPieces ?? {})
      .map((descriptor) => descriptor.params?.preloadRoomVariant)
      .filter((variant) => roomHasVariant(this.world.room, variant)))];
    return Promise.all(variants.map((variant) => this.preloadRoomVariant(variant).catch((error) => {
      this.roomRenderer?.logger?.warn?.(`Set-piece room variant ${variant} could not be warmed.`, error);
      return null;
    })));
  }

  preloadSetPieceAssets(active, { retry = false } = {}) {
    const keys = this.setPieceImageKeys(active);
    if (typeof this.setPieceRenderer?.prepareImages === 'function') {
      return this.setPieceRenderer.prepareImages(keys, { retry });
    }
    return Promise.all(keys.map((key) => this.setPieceRenderer.loadImage(key, { retry })));
  }

  setPieceImageKeys(active) {
    return [...new Set([
      ...(active?.descriptor?.assets ?? []),
      ...(active?.logicalDescriptor?.assets ?? []),
    ])].filter((key) => this.assetRegistry.getAsset(key)?.kind === 'image');
  }

  preloadSetPieceRoomVariant(active, { retry = false } = {}) {
    const variant = setPieceParam(active, 'preloadRoomVariant');
    if (!roomHasVariant(this.world?.room, variant)) {
      return Promise.resolve(null);
    }
    return this.preloadRoomVariant(variant, { required: true, retry });
  }

  preloadRoomVariant(variant, { required = false, retry = false } = {}) {
    if (!this.world || typeof this.roomRenderer?.preloadRoom !== 'function') {
      return Promise.resolve(null);
    }
    const state = { ...this.world.snapshot(), roomVariant: variant };
    const scale = (this.dpr ?? 1) * (this.scale ?? 1);
    return Promise.resolve().then(() => {
      if (required && typeof this.roomRenderer.prepareRoomRequired === 'function') {
        return this.roomRenderer.prepareRoomRequired(this.world.room, state, { scale, retry });
      }
      return this.roomRenderer.preloadRoom(this.world.room, state, { scale });
    });
  }

  prepareSetPieceComposition(active, { retry = false } = {}) {
    if (!active || active !== this.world?.setPieces?.active) return Promise.resolve(null);
    const current = this.setPieceComposition;
    if (!retry && current?.active === active && current.status === 'loading') return current.promise;
    if (!retry && current?.active === active && current.status === 'ready') return Promise.resolve(active);

    let source = null;
    if (retry && current?.active === active) source = current.source;
    else {
      if (current?.source) this.releaseCompositionSource(current.source);
      if (!this.roomTransition) source = this.captureRoomTransitionSource();
    }
    const attempt = (current?.active === active ? current.attempt : 0) + 1;
    const composition = {
      active,
      status: 'loading',
      attempt,
      source,
      assetKeys: this.setPieceImageKeys(active),
      error: null,
      promise: null,
    };
    this.setPieceComposition = composition;
    this.updateStatus(retry ? 'Trying that scene again…' : 'Preparing the next magical moment…');

    const pending = Promise.all([
      this.preloadSetPieceAssets(active, { retry }),
      this.preloadSetPieceRoomVariant(active, { retry }),
      this.prepareVisibleActorFrames(this.world.snapshot(), { retry }),
    ]).then(() => {
      if (this.setPieceComposition !== composition || this.world?.setPieces?.active !== active) return null;
      composition.status = 'ready';
      composition.error = null;
      this.releaseCompositionSource(composition.source);
      composition.source = null;
      const deferred = this.deferredSetPieceEvents;
      this.deferredSetPieceEvents = [];
      for (const event of deferred) this.handleWorldEvent(event);
      this.flushDeferredCompositionAudio();
      this.render?.();
      return active;
    }).catch((error) => {
      if (this.setPieceComposition === composition && this.world?.setPieces?.active === active) {
        composition.status = 'failed';
        composition.error = error;
        this.roomRenderer?.logger?.warn?.('Set-piece composition failed before its timeline became visible.', error);
        this.updateStatus('This magical moment could not finish loading. Tap to try again.');
        this.render?.();
      }
      throw error;
    });
    composition.promise = pending;
    return pending;
  }

  releaseCompositionSource(source) {
    if (!source) return;
    source.width = 1;
    source.height = 1;
  }

  beginRoomTransition(effect = 'ink') {
    this.invalidateRendererPresentation();
    this.releaseRoomTransition();
    if (effect === 'none') return false;
    this.cancelPointerInteraction();
    const source = this.captureRoomTransitionSource();
    if (!source) {
      this.transitionAlpha = 0;
      const transition = {
        effect: 'crossfade',
        elapsed: 0,
        origin: { ...this.lastTapPoint },
        source: null,
        fallback: true,
        ready: false,
        readiness: null,
        readinessAttempt: 0,
        readinessTimer: null,
        cancelReadiness: null,
        preparedScale: null,
      };
      this.roomTransition = transition;
      void this.prepareRoomTransitionDestination(transition).catch(() => {});
      return false;
    }
    const transition = {
      effect,
      elapsed: 0,
      origin: { ...this.lastTapPoint },
      source,
      ready: false,
      readiness: null,
      readinessAttempt: 0,
      readinessTimer: null,
      cancelReadiness: null,
      preparedScale: null,
    };
    this.roomTransition = transition;
    void this.prepareRoomTransitionDestination(transition).catch(() => {});
    return true;
  }

  prepareRoomTransitionDestination(transition = this.roomTransition, { retry = false } = {}) {
    if (!transition) return Promise.resolve(null);
    this.cancelRoomTransitionReadiness(transition);
    const attempt = (transition.readinessAttempt ?? 0) + 1;
    transition.readinessAttempt = attempt;
    transition.ready = false;
    transition.failed = false;
    transition.error = null;
    transition.elapsed = 0;
    transition.preparedScale = this.dpr * this.scale;
    const prepared = Promise.resolve().then(async () => {
      if (!this.world) return { result: null, cancelled: false };
      await Promise.all([
        this.activateChapterPresentation(this.world.chapter.id),
        this.characterScopes.activateChapter(this.world.chapter.id, {
          source: retry ? 'room-transition-retry' : 'room-transition',
          roomId: this.world.roomId,
        }),
      ]);
      const result = await this.prepareCurrentComposition({ retry });
      return { result, cancelled: false };
    });
    let cancelReadiness = null;
    const cancellation = new Promise((resolve) => {
      cancelReadiness = () => resolve({ result: null, cancelled: true });
      transition.cancelReadiness = cancelReadiness;
    });

    transition.readiness = Promise.race([prepared, cancellation]).then((outcome) => {
      if (transition.cancelReadiness === cancelReadiness) transition.cancelReadiness = null;
      if (outcome.cancelled) return null;
      if (this.roomTransition === transition && transition.readinessAttempt === attempt) {
        transition.ready = true;
        transition.failed = false;
        transition.error = null;
        this.updateStatus(this.world?.dialoguePresentation?.text ?? this.world?.objective?.text ?? 'Continue Violet’s adventure.');
        this.render?.();
      }
      return outcome.result;
    }).catch((error) => {
      if (transition.cancelReadiness === cancelReadiness) transition.cancelReadiness = null;
      if (this.roomTransition === transition && transition.readinessAttempt === attempt) {
        transition.ready = false;
        transition.failed = true;
        transition.error = error;
        this.roomRenderer?.logger?.warn?.('Destination composition failed; keeping the outgoing room visible.', error);
        this.updateStatus('The next room could not finish loading. Tap to try again.');
        this.render?.();
      }
      throw error;
    });
    return transition.readiness;
  }

  cancelRoomTransitionReadiness(transition = this.roomTransition) {
    if (!transition) return;
    if (transition.readinessTimer !== null) clearTimeout(transition.readinessTimer);
    transition.readinessTimer = null;
    const cancel = transition.cancelReadiness;
    transition.cancelReadiness = null;
    cancel?.();
  }

  waitForRoomTransitionReady() {
    return this.roomTransition?.readiness ?? Promise.resolve(null);
  }

  captureRoomTransitionSource(retry = true) {
    if (!this.canvas || typeof document === 'undefined') return null;
    const source = worldViewportSourceRect(this);
    let canvas = null;
    try {
      canvas = document.createElement('canvas');
      canvas.width = WORLD.width;
      canvas.height = WORLD.height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Transition scratch canvas returned no 2D context.');
      context.drawImage(
        this.canvas,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        WORLD.width,
        WORLD.height,
      );
      return canvas;
    } catch (error) {
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
      const logger = this.roomRenderer?.logger ?? globalThis.console;
      if (retry) {
        logger?.warn?.('Transition scratch canvas failed; evicting room caches before one retry.', error);
        this.roomRenderer?.emergencyEvict?.('transition-scratch');
        return this.captureRoomTransitionSource(false);
      }
      logger?.warn?.('Transition scratch canvas retry failed; using the safe fade fallback.', error);
      return null;
    }
  }

  updateRoomTransition(dt) {
    if (!this.roomTransition?.ready) return;
    this.roomTransition.elapsed += dt;
    const state = roomTransitionState(this.roomTransition.elapsed, {
      effect: this.roomTransition.effect,
      origin: this.roomTransition.origin,
      reducedMotion: this.reducedMotion,
    });
    if (state.linearProgress >= 1) this.finishRoomTransition();
  }

  drawRoomTransition(context) {
    const transition = this.roomTransition;
    if (!transition) return;
    const state = roomTransitionState(transition.elapsed, {
      effect: transition.effect,
      origin: transition.origin,
      reducedMotion: this.reducedMotion,
    });
    if (transition.fallback) {
      const alpha = transition.ready ? 1 - state.progress : 1;
      context.fillStyle = `rgba(20,17,38,${alpha})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
      return;
    }
    if (!transition.source) return;
    context.save();
    if (state.kind === 'crossfade') {
      context.globalAlpha = 1 - state.progress;
      context.drawImage(transition.source, 0, 0, WORLD.width, WORLD.height);
      context.restore();
      return;
    }

    if (state.kind === 'ink') {
      // The cover half always starts from the captured outgoing room. The
      // reveal half deliberately omits that capture, leaving only the already
      // prepared destination beneath the authored brush sweep.
      if (state.phase === 'cover') {
        context.drawImage(transition.source, 0, 0, WORLD.width, WORLD.height);
      }
      drawInkBrushSweep(context, state);
      context.restore();
      return;
    }

    context.beginPath();
    context.rect(0, 0, WORLD.width, WORLD.height);
    appendOrganicBlob(context, state.points);
    context.clip('evenodd');
    context.drawImage(transition.source, 0, 0, WORLD.width, WORLD.height);
    context.restore();

    if (state.kind === 'sparkle') drawTransitionSparkles(context, state);
  }

  releaseRoomTransition() {
    this.cancelRoomTransitionReadiness();
    if (this.roomTransition?.source) {
      this.roomTransition.source.width = 1;
      this.roomTransition.source.height = 1;
    }
    this.roomTransition = null;
    this.deferredTransitionAudio = [];
  }

  finishRoomTransition() {
    const deferred = [...this.deferredTransitionAudio];
    this.releaseRoomTransition();
    if (this.destroyed) return;
    this.updateMusic();
    void this.preloadCurrentRoomSetPieceVariants();
    for (const entry of deferred) this.playTransitionAudio(entry);
  }

  playOrDeferTransitionAudio(entry) {
    if (
      this.roomTransition
      || this.sessionComposition?.status === 'loading'
      || (this.isSetPieceCompositionBlocking() && this.setPieceComposition.status !== 'ready')
    ) {
      this.deferredTransitionAudio ??= [];
      this.deferredTransitionAudio.push(entry);
      return false;
    }
    this.playTransitionAudio(entry);
    return true;
  }

  flushDeferredCompositionAudio() {
    if (
      this.roomTransition
      || this.sessionComposition?.status === 'loading'
      || (this.isSetPieceCompositionBlocking() && this.setPieceComposition.status !== 'ready')
    ) return false;
    const deferred = this.deferredTransitionAudio ?? [];
    this.deferredTransitionAudio = [];
    for (const entry of deferred) this.playTransitionAudio(entry);
    return true;
  }

  playTransitionAudio(entry) {
    if (entry.type === 'voice') this.sound.speak(entry.key, entry.text ?? '');
    else if (entry.type === 'sfx') this.sound.playSfx(entry.key, entry.fallback ?? 'chime');
    else if (entry.type === 'command') this.handleAudioCommand(entry.command);
  }

  cancelPointerInteraction() {
    if (this.pointer && this.canvas.hasPointerCapture?.(this.pointer.id)) {
      this.canvas.releasePointerCapture?.(this.pointer.id);
    }
    this.pointer = null;
    this.parentGateProgress = 0;
  }

  persistSave(save, flush = false, { rollbackSave = null } = {}) {
    if (this.replayMode) return { ok: true, status: 'replay-not-saved', save };
    const result = flush ? this.saveManager.write(save) : this.saveManager.queue(save);
    if (!result.ok) {
      if (rollbackSave && typeof this.saveManager.queue === 'function') {
        this.saveManager.queue(rollbackSave);
      }
      this.updateStatus('Your adventure is safe for now, but this device could not save the latest moment.');
    }
    return result;
  }

  exportSaveData() {
    const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
    return this.saveManager.export(durableSave);
  }

  async importSaveData(raw) {
    const previousSave = structuredClone(this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData);
    const result = this.saveManager.import(raw);
    if (!result.ok) return result;
    const adopted = await this.adoptSave(result.save, { status: 'Imported Violet’s save.', preserveSave: true });
    if (!adopted) {
      this.saveManager.write(previousSave);
      return { ok: false, status: 'character-scope-error', save: null };
    }
    return result;
  }

  openSaveExport() {
    if (!this.saveTransferDialog) {
      this.setParentNotice('Save transfer is unavailable in this preview.', 'error');
      return false;
    }
    try {
      this.saveTransferDialog.openExport(this.exportSaveData());
      return true;
    } catch {
      this.setParentNotice('Violet’s save could not be prepared for export.', 'error');
      return false;
    }
  }

  openSaveImport() {
    if (!this.saveTransferDialog) {
      this.setParentNotice('Save transfer is unavailable in this preview.', 'error');
      return false;
    }
    this.saveTransferDialog.openImport();
    return true;
  }

  handleSaveTransferResult(result) {
    if (result?.operation === 'copy' && result.ok) this.setParentNotice('Save copied. Keep it somewhere safe.');
    else if (result?.operation === 'copy' && !result.ok) this.updateStatus('Copy was blocked. The save text is selected for manual copying.');
    else if (result?.operation === 'import' && !result.ok) this.updateStatus('That save could not replace Violet’s adventure.');
  }

  async restoreBackupSave() {
    const previousSave = structuredClone(this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData);
    const result = this.saveManager.restoreBackup();
    if (!result.ok) {
      const message = result.status === 'missing-backup'
        ? 'There is no safety copy on this device yet.'
        : 'The safety copy could not be restored.';
      this.openParentPanel('save', { text: message, kind: 'error' });
      return result;
    }
    const adopted = await this.adoptSave(result.save, { status: 'Violet’s safety copy has been restored.', preserveSave: true });
    if (!adopted) {
      this.saveManager.write(previousSave);
      return { ok: false, status: 'character-scope-error', save: null };
    }
    return result;
  }

  async startOverPreservingSettings() {
    const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
    const settings = structuredClone(durableSave.settings);
    const cleared = this.saveManager.clear();
    if (!cleared.ok) {
      this.openParentPanel('save', { text: 'This device could not safely clear Violet’s current story.', kind: 'error' });
      return cleared;
    }

    const fresh = createSave({
      now: this.clock(),
      appVersion: import.meta.env.VITE_BUILD_SHA ?? 'development',
      worldSeed: 12072026,
      name: durableSave.character.name,
    });
    fresh.settings = settings;
    const saved = this.saveManager.write(fresh);
    const adopted = await this.adoptSave(saved.ok ? saved.save : fresh, {
      status: 'Violet is back at the beginning. Her device settings stayed the same.',
      toTitle: true,
      hasStoredSave: false,
    });
    if (!adopted) {
      this.saveManager.write(durableSave);
      return { ok: false, status: 'character-scope-error', save: null };
    }
    return saved.ok
      ? { ...saved, status: 'started-over' }
      : saved;
  }

  async adoptSave(save, { status, toTitle = false, hasStoredSave = hasMeaningfulProgress(save), preserveSave = false } = {}) {
    const generation = this.beginSessionTransition();
    if (generation === null) return null;
    const nextSave = structuredClone(save);
    try {
      await Promise.all([
        toTitle
          ? Promise.resolve(null)
          : this.prepareChapterRuntime(nextSave.resume.chapter),
        this.activateSessionCharacterScope({
          chapterId: nextSave.resume.chapter,
          toTitle,
          source: toTitle ? 'return-to-title' : 'adopt-save',
        }),
      ]);
      if (!this.isCurrentSessionTransition(generation)) return null;

      this.petNameDialog?.close?.(null, 'game-changed');
      this.cancelPointerInteraction();
      this.resumeRecap = null;
      this.sound.stopAll();
      this.replayMode = false;
      this.canonicalSave = null;
      this.world = null;
      this.saveData = nextSave;
      this.hasStoredSave = Boolean(hasStoredSave);
      this.particles = new Particles(
        new SeededRandom(this.saveData.worldSeed).fork('particles'),
        { reducedMotion: this.motionQuery.matches || Boolean(this.saveData.settings.reducedMotion) },
      );
      this.applyDeviceSettings(this.saveData.settings);
      this.accumulator = 0;
      this.simTime = 0;
      this.lastFrame = null;
      this.transitionAlpha = 0;
      this.releaseRoomTransition();
      this.nextTransitionEffect = null;
      this.lastRenderState = null;
      if (toTitle) this.screen = 'title';
      else this.createWorld(this.saveData, { preserveSave });
      if (status) this.updateStatus(status);
      this.render();

      try {
        if (toTitle) await this.characterScopes.releaseChapter();
        else await this.characterScopes.releaseTitle();
      } catch (error) {
        this.roomRenderer?.logger?.warn?.('The outgoing character scope could not be released.', error);
      }
      return this.saveData;
    } catch (error) {
      if (this.isCurrentSessionTransition(generation)) {
        this.roomRenderer?.logger?.warn?.('The requested character scope could not be activated.', error);
        this.updateStatus('That part of Violet’s adventure could not open. Her current place is unchanged.');
        this.render();
      }
      return null;
    } finally {
      this.finishSessionTransition(generation);
    }
  }

  async resetGame() {
    if (!this.debug) return { ok: false, status: 'debug-disabled', save: null };

    const previousSave = structuredClone(this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData);
    const result = this.saveManager.clear();
    if (!result.ok) {
      this.updateStatus('The development reset could not clear this browser’s saved game.');
      return result;
    }

    const fresh = createSave({
      now: this.clock(),
      appVersion: import.meta.env.VITE_BUILD_SHA ?? 'development',
      worldSeed: 12072026,
    });
    this.loadStatus = { ok: true, status: 'reset', save: null };
    const adopted = await this.adoptSave(fresh, { toTitle: true, hasStoredSave: false });
    if (!adopted) {
      this.saveManager.write(previousSave);
      return { ok: false, status: 'character-scope-error', save: null };
    }
    this.simTime = 0;
    this.updateStatus('Development reset complete. Violet is back at the beginning.');
    this.render();
    return { ...result, save: structuredClone(this.saveData) };
  }

  captureYearbook(moment, caption = 'My wand') {
    if (this.replayMode) return;
    if (this.saveData.yearbook.entries.some((entry) => entry.id === moment)) return;
    const thumbnail = document.createElement('canvas');
    thumbnail.width = 480;
    thumbnail.height = 270;
    const context = thumbnail.getContext('2d');
    if (!context) return;
    const source = worldViewportSourceRect(this);
    context.drawImage(
      this.canvas,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      480,
      270,
    );
    let dataUrl = thumbnail.toDataURL('image/jpeg', 0.58);
    let byteLength = dataUrlBytes(dataUrl);
    if (byteLength > YEARBOOK_MAX_BYTES) {
      dataUrl = thumbnail.toDataURL('image/jpeg', 0.35);
      byteLength = dataUrlBytes(dataUrl);
    }
    thumbnail.width = 1;
    thumbnail.height = 1;
    if (byteLength > YEARBOOK_MAX_BYTES) return;
    this.saveData.yearbook.entries.push({
      id: moment,
      chapter: this.world?.chapter?.id ?? this.saveData.resume.chapter,
      caption,
      mime: 'image/jpeg',
      width: 480,
      height: 270,
      byteLength,
      dataUrl,
      capturedAt: this.clock(),
    });
    this.persistSave(this.saveData, true);
  }

  async beginReplay(chapterId = null) {
    if (this.replayMode) return { ok: false, status: 'already-replaying' };
    const requestedChapterId = chapterId ?? latestReplayChapterId(
      this.saveData,
      this.chapterRuntime.descriptors,
    );
    const descriptor = requestedChapterId
      ? this.chapterRuntime.getDescriptor(requestedChapterId)
      : null;
    if (!descriptor || !this.saveData.progress.completedChapters.includes(requestedChapterId)) {
      return { ok: false, status: 'chapter-locked' };
    }
    const generation = this.beginSessionTransition();
    if (generation === null) return { ok: false, status: 'session-transitioning' };
    const saved = this.saveManager.write(this.saveData);
    const canonicalSave = structuredClone(saved.ok ? saved.save : this.saveData);
    const chapterLabel = chapterReplayLabel(descriptor);
    try {
      await Promise.all([
        this.prepareChapterRuntime(requestedChapterId),
        this.activateSessionCharacterScope({ chapterId: requestedChapterId, source: 'chapter-replay' }),
      ]);
      if (!this.isCurrentSessionTransition(generation)) return { ok: false, status: 'superseded' };
      const chapter = this.chapterRuntime.getChapter(requestedChapterId);
      if (!chapter) throw new Error(`Chapter ${requestedChapterId} did not load for replay.`);
      const replay = createReplaySave(
        canonicalSave,
        chapter,
        this.clock(),
        this.chapterRuntime.descriptors,
      );
      this.canonicalSave = canonicalSave;
      this.replayMode = true;
      this.createWorld(replay);
      this.updateStatus(`${chapterLabel} replay. Violet’s saved adventure is safe.`);
      this.render();
      return { ok: true, status: 'replay-started', save: replay };
    } catch (error) {
      if (this.isCurrentSessionTransition(generation)) {
        this.roomRenderer?.logger?.warn?.('The replay character scope could not be activated.', error);
        this.updateStatus(`${chapterLabel} replay could not open. Violet’s saved adventure is still safe.`);
        this.render();
      }
      return { ok: false, status: 'character-scope-error', error };
    } finally {
      this.finishSessionTransition(generation);
    }
  }

  async exitReplay() {
    if (!this.replayMode || !this.canonicalSave) return { ok: false, status: 'not-replaying' };
    const generation = this.beginSessionTransition();
    if (generation === null) return { ok: false, status: 'session-transitioning' };
    let canonical = structuredClone(this.canonicalSave);
    const foundNewKeepsake = mergeReplayCollections(canonical, this.saveData);
    try {
      await Promise.all([
        this.prepareChapterRuntime(canonical.resume.chapter),
        this.activateSessionCharacterScope({
          chapterId: canonical.resume.chapter,
          source: 'exit-replay',
        }),
      ]);
      if (!this.isCurrentSessionTransition(generation)) return { ok: false, status: 'superseded' };
      this.replayMode = false;
      this.canonicalSave = null;
      this.sound.stopVoice();
      if (foundNewKeepsake) {
        const saved = this.saveManager.write(canonical);
        if (saved.ok) canonical = saved.save;
      }
      this.saveData = canonical;
      this.applyDeviceSettings(canonical.settings);
      this.createWorld(canonical, { preserveSave: true });
      this.hasStoredSave = hasMeaningfulProgress(canonical);
      this.updateStatus('Back to Violet’s saved adventure.');
      this.render();
      return { ok: true, status: 'replay-exited', save: canonical };
    } catch (error) {
      if (this.isCurrentSessionTransition(generation)) {
        this.roomRenderer?.logger?.warn?.('The saved-adventure character scope could not be activated.', error);
        this.updateStatus('Violet’s saved adventure could not reopen. Her replay is unchanged.');
        this.render();
      }
      return { ok: false, status: 'character-scope-error', error };
    } finally {
      this.finishSessionTransition(generation);
    }
  }

  render() {
    if (this.destroyed || !this.context) return;
    this.frameCharacterResults = [];
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.ink;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.withWorldTransform((ctx) => {
      if (this.harness && this.characterReviewRenderer?.drawReviewScene(
        ctx,
        this.harnessScene,
        this.simTime,
        { reducedMotion: this.reducedMotion },
      )) return;
      if (this.harness && this.uiRenderer.drawReviewScene(
        ctx,
        this.harnessScene,
        this.simTime,
        { reducedMotion: this.reducedMotion },
      )) return;
      if (this.screen === 'title' || !this.world) {
        this.uiRenderer.drawTitle(ctx, this.simTime, this.hasStoredSave, this.reducedMotion);
      } else this.renderWorld(ctx);
      if (this.shouldShowDebugReset()) this.uiRenderer.drawDebugReset(ctx);
      this.observeRendererResults([
        ...this.frameCharacterResults,
        ...(this.uiRenderer.consumeCharacterResults?.() ?? []),
        ...(this.setPieceRenderer.consumeCharacterResults?.() ?? []),
      ]);
      const composition = this.visibleCompositionStatus();
      if (composition) this.uiRenderer.drawCompositionStatus(ctx, composition);
    });
  }

  visibleCompositionStatus() {
    if (this.screen === 'title') {
      if (this.sessionComposition?.status === 'failed') {
        return { status: 'failed', message: 'Violet’s adventure could not open.' };
      }
      if (this.sessionComposition?.status === 'loading') {
        return { status: 'loading', message: 'Opening Violet’s adventure…' };
      }
      if (this.titleComposition?.status === 'failed') {
        return { status: 'failed', message: 'Violet’s letter could not finish loading.' };
      }
      if (this.titleComposition?.status !== 'ready') {
        return { status: 'loading', message: 'Preparing Violet’s letter…' };
      }
    }
    if (this.roomTransition?.failed) {
      return { status: 'failed', message: 'The next room could not finish loading.' };
    }
    if (this.isSetPieceCompositionBlocking()) {
      return this.setPieceComposition.status === 'failed'
        ? { status: 'failed', message: 'This magical moment could not finish loading.' }
        : { status: 'loading', message: 'Preparing the next magical moment…' };
    }
    if (this.presentationFailure?.status === 'failed') {
      return { status: 'failed', message: 'A picture could not finish loading.' };
    }
    if (this.presentationFailure?.status === 'loading') {
      return {
        status: 'loading',
        message: this.presentationFailure.retrying
          ? 'Trying that picture again…'
          : 'Preparing that picture…',
      };
    }
    return null;
  }

  nextPresentationReadinessGeneration() {
    this.presentationReadinessGeneration = (this.presentationReadinessGeneration ?? 0) + 1;
    return this.presentationReadinessGeneration;
  }

  invalidateRendererPresentation() {
    this.nextPresentationReadinessGeneration();
    if (this.presentationFailure?.kind === 'renderer') this.presentationFailure = null;
  }

  isCurrentRendererPresentation(presentation) {
    return Boolean(
      presentation
      && !this.destroyed
      && this.presentationFailure === presentation
      && this.presentationReadinessGeneration === presentation.generation
      && this.sessionGeneration === presentation.sessionGeneration
      && this.world === presentation.world,
    );
  }

  canObserveRendererPresentation() {
    return Boolean(
      !this.destroyed
      && !this.sessionTransitioning
      && !this.roomTransition
      && !this.isSetPieceCompositionBlocking()
      && this.screen === 'playing'
      && this.world,
    );
  }

  rendererResultRetry(result) {
    return result.retry
      ?? (() => this.prepareVisibleActorFrames(this.world?.snapshot?.(), { retry: true }));
  }

  failRendererPresentation(result) {
    const presentation = {
      kind: 'renderer',
      status: 'failed',
      retrying: false,
      generation: this.nextPresentationReadinessGeneration(),
      sessionGeneration: this.sessionGeneration,
      world: this.world,
      pending: new Set(),
      error: result.error ?? new Error('A character frame failed to render.'),
      retry: this.rendererResultRetry(result),
    };
    this.presentationFailure = presentation;
    this.cancelPointerInteraction();
    this.updateStatus('A picture could not finish loading. Tap to try again.');
    return presentation;
  }

  settleRendererPresentation(presentation, ticket, error = null) {
    presentation.pending.delete(ticket);
    if (
      !this.isCurrentRendererPresentation(presentation)
      || presentation.status !== 'loading'
      || presentation.retrying
    ) return;

    if (error) {
      presentation.status = 'failed';
      presentation.error = error;
      presentation.retry = ticket.retry;
      presentation.pending.clear();
      this.updateStatus('A picture could not finish loading. Tap to try again.');
      this.render?.();
      return;
    }
    if (presentation.pending.size > 0) return;

    this.presentationFailure = null;
    this.updateStatus(this.world?.dialoguePresentation?.text ?? this.world?.objective?.text ?? 'Continue Violet’s adventure.');
    this.render?.();
  }

  observeRendererResults(results) {
    for (const result of results) {
      if (!result || typeof result !== 'object') continue;
      if (result.status === 'failed') {
        if (this.canObserveRendererPresentation()) this.failRendererPresentation(result);
        continue;
      }
      if (result.status !== 'loading' || !this.canObserveRendererPresentation()) continue;
      const loading = result.loading;
      if (!loading || typeof loading.then !== 'function' || this.observedRendererLoadings.has(loading)) continue;
      const current = this.presentationFailure;
      if (current?.status === 'failed' || current?.retrying) continue;
      this.observedRendererLoadings.add(loading);
      const presentation = current?.kind === 'renderer'
        && current.status === 'loading'
        && this.isCurrentRendererPresentation(current)
        ? current
        : {
            kind: 'renderer',
            status: 'loading',
            retrying: false,
            generation: this.nextPresentationReadinessGeneration(),
            sessionGeneration: this.sessionGeneration,
            world: this.world,
            pending: new Set(),
            error: null,
            retry: this.rendererResultRetry(result),
          };
      if (presentation !== current) {
        this.presentationFailure = presentation;
        this.cancelPointerInteraction();
        this.updateStatus('Preparing that picture…');
      }
      const ticket = {
        loading,
        retry: this.rendererResultRetry(result),
      };
      presentation.pending.add(ticket);
      loading.then(
        () => this.settleRendererPresentation(presentation, ticket),
        (error) => this.settleRendererPresentation(presentation, ticket, error),
      );
    }
  }

  renderWorld(context) {
    if (this.roomTransition && !this.roomTransition.ready) {
      this.drawRoomTransition(context);
      return;
    }
    const state = this.world.snapshot();
    this.lastRenderState = state;
    if (this.isSetPieceCompositionBlocking()) {
      const source = this.setPieceComposition.source;
      if (source?.width > 1 && source?.height > 1) {
        context.drawImage(source, 0, 0, WORLD.width, WORLD.height);
      } else {
        context.fillStyle = PALETTE.ink;
        context.fillRect(0, 0, WORLD.width, WORLD.height);
      }
      return;
    }
    const room = this.world.room;
    const presentedState = roomStateDuringSetPiece(state, room);
    const setPieceId = String(state.setPiece?.requestedId ?? state.setPiece?.id ?? '').toLowerCase();
    const brickWallActive = setPieceId.includes('brick');
    const behindCastSetPieceActive = brickWallActive || setPieceId.includes('wandchaos') || setPieceId.includes('wand-chaos');

    const chapterTwoPreview = isChapterTwoPreview(this.world, state);
    if (chapterTwoPreview || state.roomId === 'ch1.chapterCardRoom') {
      this.roomRenderer.draw(
        context,
        room,
        presentedState,
        this.simTime,
        { x: 0 },
        { reducedMotion: this.reducedMotion },
      );
      if (chapterTwoPreview && !state.setPiece) {
        this.chapterPreviewRenderer.draw(context, {
          choices: state.dialogue?.choices ?? [],
          showChoices: state.dialogue?.type === 'choice',
        });
      } else if (!chapterTwoPreview) {
        this.uiRenderer.drawChapterCard(context, {
          eyebrow: 'Chapter One Complete',
          title: 'Platform Nine and Three-Quarters',
          subtitle: 'Next time: the Hogwarts Express!',
        }, this.simTime, {
          paintedBackground: true,
          reducedMotion: this.reducedMotion,
        });
      }
    } else {
      this.roomRenderer.draw(
        context,
        room,
        presentedState,
        this.simTime,
        { x: state.cameraX },
        { reducedMotion: this.reducedMotion },
      );
      this.worldPropRenderer.draw(context, presentedState, this.simTime, { reducedMotion: this.reducedMotion });
      this.guideFootprintRenderer.draw(context, presentedState, this.simTime, { reducedMotion: this.reducedMotion });
      if (behindCastSetPieceActive) {
        this.setPieceRenderer.draw(context, state.setPiece, presentedState, { reducedMotion: this.reducedMotion });
      }
      if (!state.setPiece) {
        this.drawWorldTargets(context, presentedState);
        this.uiRenderer.drawCastingAffordances?.(
          context,
          presentedState,
          this.simTime,
          { reducedMotion: this.reducedMotion },
        );
      }
      this.drawCharacters(context, presentedState);
      (this.presentationRegistry ?? productionPresentationRegistry).drawWorldEffects(context, {
        chapterId: state.chapterId,
        layer: 'front-effects',
        state: presentedState,
        time: this.simTime,
        reducedMotion: this.reducedMotion,
        cameraX: state.cameraX,
        effectsRenderer: this.roomEffectsRenderer,
        imageFor: (key) => this.uiRenderer.imageFor(key),
      });
      this.particles.draw(context);
      if (brickWallActive) {
        this.setPieceRenderer.drawBrickWallCover(
          context,
          state.setPiece,
          { reducedMotion: this.reducedMotion },
        );
      }
    }

    if (!behindCastSetPieceActive) {
      this.setPieceRenderer.draw(context, state.setPiece, presentedState, { reducedMotion: this.reducedMotion });
    }
    (this.presentationRegistry ?? productionPresentationRegistry).drawWorldEffects(context, {
      chapterId: state.chapterId,
      layer: 'lighting',
      state: presentedState,
      time: this.simTime,
      reducedMotion: this.reducedMotion,
      cameraX: state.cameraX,
      effectsRenderer: this.roomEffectsRenderer,
      imageFor: (key) => this.uiRenderer.imageFor(key),
    });
    if (!state.setPiece) this.uiRenderer.drawHud(context, state, this.simTime, this.reducedMotion);
    if (this.resumeRecap) {
      this.uiRenderer.drawResumeRecap(
        context,
        this.resumeRecap,
        this.simTime,
        this.saveData.settings.muted,
        this.reducedMotion,
        dialogueSceneContext(state, this.resumeRecap),
      );
    } else {
      if (state.dialogue && !(chapterTwoPreview && state.dialogue.type === 'choice')) {
        this.uiRenderer.drawDialogue(
          context,
          state.dialogue,
          this.simTime,
          this.saveData.settings.muted,
          this.reducedMotion,
          dialogueSceneContext(state),
        );
      }
      if (state.learning && state.learning.status !== 'completed') {
        this.uiRenderer.drawLearning(
          context,
          state,
          this.simTime,
          { reducedMotion: this.reducedMotion },
        );
      } else if (state.spellbook?.state && state.spellbook.state !== 'closed') {
        this.uiRenderer.drawSpellbookFan(
          context,
          state,
          this.simTime,
          { reducedMotion: this.reducedMotion },
        );
      }
      if (state.overlay?.surface === 'satchel') {
        const map = activeChapterMap(this.chapterRuntime, this.world, state);
        this.uiRenderer.drawSatchel(context, state, cards, {
          map,
          parentGateProgress: this.parentGateProgress,
          time: this.simTime,
          reducedMotion: this.reducedMotion,
        });
      }
      if (state.overlay?.surface === 'letter-reading') this.uiRenderer.drawLetterReading(context);
      if (state.overlay?.surface === 'robe-picker') {
        this.uiRenderer.drawRobePicker(context, state, this.simTime, this.reducedMotion);
      }
      if (state.overlay?.surface === 'objective') {
        this.uiRenderer.drawQuestJournal(
          context,
          state,
          this.simTime,
          { reducedMotion: this.reducedMotion },
        );
      }
      if (state.overlay?.surface === 'spellbook') {
        this.uiRenderer.drawSpellbook(
          context,
          state,
          this.simTime,
          { reducedMotion: this.reducedMotion },
        );
      }
      if (state.overlay?.surface === 'parent') this.uiRenderer.drawParentPanel(context, this.parentPanelModel(state.overlay));
      if (state.overlay?.surface === 'yearbook') {
        const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
        this.uiRenderer.drawYearbook(context, durableSave.yearbook.entries, state.overlay.index ?? 0);
      }
    }

    if (this.roomTransition) this.drawRoomTransition(context);
    if (this.transitionAlpha > 0) {
      context.fillStyle = `rgba(20,17,38,${this.transitionAlpha})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    if (this.shouldShowReplayExit()) this.uiRenderer.drawReplayExit(context);
  }

  parentPanelModel(overlay = this.world?.overlay) {
    const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
    const replayChapterId = latestReplayChapterId(durableSave, this.chapterRuntime.descriptors);
    const replayChapter = replayChapterId
      ? this.chapterRuntime.getDescriptor(replayChapterId)
      : null;
    return {
      overlay,
      settings: this.saveData.settings,
      replayMode: this.replayMode,
      replayChapterId,
      replayChapterLabel: replayChapter ? chapterReplayLabel(replayChapter) : null,
      replayChapterDetail: replayChapter ? chapterReplayDetail(replayChapter) : null,
      yearbookCount: durableSave.yearbook.entries.length,
      effectiveReducedMotion: this.reducedMotion,
      systemReducedMotion: this.motionQuery.matches,
    };
  }

  drawWorldTargets(context, state) {
    this.worldAffordanceRenderer.draw(context, state, this.simTime, {
      reducedMotion: this.reducedMotion,
      pressedTargetId: this.pointer?.worldTargetId ?? null,
    });
  }

  drawCharacters(context, state) {
    if (!Array.isArray(state?.actors)) throw new TypeError('World snapshot requires an actors array.');
    const actors = [...state.actors].sort((left, right) => left.depth - right.depth);
    for (const actor of actors) {
      const renderState = actor?.renderState;
      if (!renderState || !Number.isFinite(renderState.x)) {
        throw new TypeError(`Actor ${actor?.actorId ?? '(unknown)'} requires a finite renderState.x.`);
      }
      const result = this.characterRenderer.draw(context, {
        ...renderState,
        characterId: actor.characterId,
        surface: 'world',
        x: renderState.x - state.cameraX,
        reducedMotion: this.reducedMotion,
        lightSide: state.keyLight,
      }, this.simTime + (renderState.timeOffset ?? 0));
      if (result && typeof result === 'object' && typeof result.status === 'string') {
        this.frameCharacterResults.push(result);
      }
    }
  }

  withWorldTransform(draw) {
    const context = this.context;
    context.save();
    context.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, this.dpr * this.offsetX, this.dpr * this.offsetY);
    draw(context);
    context.restore();
  }

  semanticTargets(stateOverride = null) {
    const debugTargets = this.shouldShowDebugReset()
      ? [{ id: 'debug.reset', x: UI_RECTS.debugReset.x + UI_RECTS.debugReset.width / 2, y: UI_RECTS.debugReset.y + UI_RECTS.debugReset.height / 2 }]
      : [];
    if (this.screen === 'title') return [{ id: 'foundation.start', x: 640, y: 460 }, ...debugTargets];
    if (!this.world) return debugTargets;
    if (this.resumeRecap) {
      const state = stateOverride ?? this.lastRenderState ?? this.world.snapshot();
      const layout = dialogueScrollLayout(dialogueSceneContext(state, this.resumeRecap));
      return [
        semanticRect('resume.continue', layout.advanceRect),
        semanticRect('dialogue.replay', layout.replayRect),
      ];
    }
    const state = stateOverride ?? this.lastRenderState ?? this.world.snapshot();
    if (state.overlay?.surface === 'spellbook') {
      const spellbook = this.uiRenderer.spellbookPresentation(state);
      return [
        ...spellbook.targets.map(({ id, x, y }) => ({ id, x, y })),
        ...debugTargets,
      ];
    }
    if (state.learning && state.learning.status !== 'completed') {
      const learning = this.uiRenderer.learningPresentation(state);
      return [
        ...learning.targets.map(({ id, x, y }) => ({ id, x, y })),
        ...debugTargets,
      ];
    }
    if (state.spellbook?.state && state.spellbook.state !== 'closed') {
      const spellbook = this.uiRenderer.spellbookFanPresentation(state);
      const validTargetIds = new Set(state.spellbook.validTargetIds ?? []);
      const castingTargets = state.spellbook.state === 'targeting'
        ? state.targets.filter(({ id }) => validTargetIds.has(id)).map((target) => ({
            id: target.id,
            x: (target.hitArea.x ?? 0) - state.cameraX
              + (target.hitArea.shape === 'rect' ? target.hitArea.width / 2 : 0),
            y: (target.hitArea.y ?? 0)
              + (target.hitArea.shape === 'rect' ? target.hitArea.height / 2 : 0),
          }))
        : [];
      return [
        ...spellbook.targets.map(({ id, x, y }) => ({ id, x, y })),
        ...castingTargets,
        { id: 'hud.wand', x: 1198, y: 638 },
        ...debugTargets,
      ];
    }
    const targets = state.targets.map((target) => ({
      id: target.id,
      x: (target.hitArea.x ?? 0) - state.cameraX + (target.hitArea.shape === 'rect' ? target.hitArea.width / 2 : 0),
      y: (target.hitArea.y ?? 0) + (target.hitArea.shape === 'rect' ? target.hitArea.height / 2 : 0),
    }));
    if (isSkippableChapterCardSetPiece(state)) {
      targets.push(semanticRect('chapter.card.continue', chapterCardLayout().action));
    }
    const inputLockSeconds = (this.presentationRegistry ?? productionPresentationRegistry)
      .setPieceInputLockSeconds(state.setPiece, state);
    if (
      inputLockSeconds !== null
      && (state.setPiece?.time ?? 0) + Number.EPSILON >= inputLockSeconds
    ) {
      targets.push({ id: 'setPiece.continue', x: WORLD.width / 2, y: WORLD.height / 2 });
    }
    targets.push({ id: 'hud.quest', x: 80, y: 80 });
    if (state.hasSatchel) targets.push({ id: 'hud.satchel', x: 82, y: 638 });
    if (state.hasWand) targets.push({ id: 'hud.wand', x: 1198, y: 638 });
    if (this.shouldShowReplayExit()) targets.push(semanticRect('replay.exit', UI_RECTS.replayExit));
    const chapterTwoPreview = isChapterTwoPreview(this.world, state);
    if (chapterTwoPreview && !state.setPiece && !state.overlay) {
      const previewLayout = chapterPreviewLayout();
      targets.push(semanticRect('chapter.preview.startFresh', previewLayout.startFresh));
      if (state.dialogue?.type === 'choice') {
        for (const action of previewLayout.choices) {
          targets.push(semanticRect(`chapter.preview.${action.id}`, action.rect));
        }
      }
    }
    if (state.dialogue?.type === 'line' && !state.overlay) {
      const layout = dialogueScrollLayout(dialogueSceneContext(state));
      targets.push(
        semanticRect('dialogue.replay', layout.replayRect),
        semanticRect('dialogue.advance', layout.advanceRect),
      );
    }
    for (const choice of state.dialogue?.choices ?? []) {
      if (!chapterTwoPreview && choice.__rect) targets.push({ id: `dialogue.${choice.id}`, x: choice.__rect.x + choice.__rect.width / 2, y: choice.__rect.y + choice.__rect.height / 2 });
    }
    if (state.overlay?.surface === 'satchel') {
      const map = activeChapterMap(this.chapterRuntime, this.world, state);
      const mapAvailable = Boolean(map);
      if (mapAvailable) {
        targets.push({
          id: 'satchel.map',
          x: UI_RECTS.satchelMapTab.x + UI_RECTS.satchelMapTab.width / 2,
          y: UI_RECTS.satchelMapTab.y + UI_RECTS.satchelMapTab.height / 2,
        });
      }
      const cardsTabRect = mapAvailable
        ? UI_RECTS.satchelCardsTab
        : UI_RECTS.satchelCardsOnlyTab;
      targets.push(
        { id: 'satchel.cards', x: cardsTabRect.x + cardsTabRect.width / 2, y: cardsTabRect.y + cardsTabRect.height / 2 },
        semanticRect('satchel.grownups', UI_RECTS.satchelKeyhole),
        semanticRect('satchel.startOver', UI_RECTS.satchelStartOver),
        semanticRect('overlay.close', UI_RECTS.satchelClose),
      );
      if (state.overlay.tab === 'cards') {
        if (state.__cardAlbum?.pageCount > 1) {
          targets.push(
            semanticRect('satchel.cards.previous', UI_RECTS.satchelCardsPrevious),
            semanticRect('satchel.cards.next', UI_RECTS.satchelCardsNext),
          );
        }
        for (const slot of state.__cardSlots ?? []) {
          targets.push({ id: `satchel.card.${slot.id}`, x: slot.__rect.x + slot.__rect.width / 2, y: slot.__rect.y + slot.__rect.height / 2 });
        }
      } else if (mapAvailable) {
        const mapPresentation = this.uiRenderer.mapPresentation(
          state,
          this.simTime,
          { map, reducedMotion: this.reducedMotion },
        );
        for (const location of mapPresentation.hitTargets) {
          targets.push({
            id: `satchel.map.${location.id.replace(/^map\./, '')}`,
            x: location.hitArea.x + location.hitArea.width / 2,
            y: location.hitArea.y + location.hitArea.height / 2,
          });
        }
      }
    }
    if (state.overlay?.surface === 'letter-reading') {
      targets.push(
        semanticRect('letter.hear', UI_RECTS.letterHear),
        semanticRect('letter.continue', UI_RECTS.letterContinue),
      );
    }
    if (state.overlay?.surface === 'objective') {
      targets.push(semanticRect('overlay.close', UI_RECTS.close));
    }
    if (state.overlay?.surface === 'robe-picker') {
      const layout = robePickerLayout(state.overlay.selectedTrim);
      for (const swatch of layout.swatches) {
        targets.push(semanticRect(`robe.trim.${swatch.id}`, swatch.rect));
      }
      targets.push(semanticRect('robe.confirm', layout.confirm));
    }
    if (state.overlay?.surface === 'parent') {
      targets.push(semanticRect('overlay.close', UI_RECTS.close));
      const page = state.overlay.page ?? 'play';
      if (!page.startsWith('confirm-')) {
        targets.push(
          semanticRect('parent.tab.play', UI_RECTS.parentPlayTab),
          semanticRect('parent.tab.settings', UI_RECTS.parentSettingsTab),
          semanticRect('parent.tab.save', UI_RECTS.parentSaveTab),
        );
      }
      if (page === 'play') {
        targets.push(
          semanticRect('parent.play.replay', UI_RECTS.parentReplay),
          semanticRect('parent.play.yearbook', UI_RECTS.parentYearbook),
        );
      } else if (page === 'settings') {
        for (const [id, rect] of [
          ['parent.settings.master.minus', UI_RECTS.parentMasterMinus],
          ['parent.settings.master.plus', UI_RECTS.parentMasterPlus],
          ['parent.settings.voice.minus', UI_RECTS.parentVoiceMinus],
          ['parent.settings.voice.plus', UI_RECTS.parentVoicePlus],
          ['parent.settings.music.minus', UI_RECTS.parentMusicMinus],
          ['parent.settings.music.plus', UI_RECTS.parentMusicPlus],
          ['parent.settings.sfx.minus', UI_RECTS.parentSfxMinus],
          ['parent.settings.sfx.plus', UI_RECTS.parentSfxPlus],
          ['parent.settings.mute', UI_RECTS.parentMute],
          ['parent.settings.motion', UI_RECTS.parentReducedMotion],
          ['parent.settings.learning.off', UI_RECTS.parentLearningOff],
          ['parent.settings.learning.gentle', UI_RECTS.parentLearningGentle],
          ['parent.settings.learning.stretchy', UI_RECTS.parentLearningStretchy],
        ]) targets.push(semanticRect(id, rect));
      } else if (page === 'save') {
        targets.push(
          semanticRect('parent.save.export', UI_RECTS.parentExport),
          semanticRect('parent.save.import', UI_RECTS.parentImport),
          semanticRect('parent.save.restore', UI_RECTS.parentRestore),
          semanticRect('parent.save.start', UI_RECTS.parentStartOver),
        );
      } else if (page.startsWith('confirm-')) {
        targets.push(
          semanticRect('parent.confirm.cancel', UI_RECTS.parentCancelConfirm),
          semanticRect('parent.confirm.accept', UI_RECTS.parentAcceptConfirm),
        );
      }
    }
    if (state.overlay?.surface === 'yearbook') {
      targets.push(semanticRect('overlay.close', UI_RECTS.close));
      const durableSave = this.replayMode && this.canonicalSave ? this.canonicalSave : this.saveData;
      if (durableSave.yearbook.entries.length > 1) {
        targets.push(
          semanticRect('yearbook.previous', UI_RECTS.yearbookPrevious),
          semanticRect('yearbook.next', UI_RECTS.yearbookNext),
        );
      }
    }
    targets.push(...debugTargets);
    return targets;
  }

  tapSemantic(id) {
    const aliases = {
      'letter.owl': 'bedroom.owl',
      'letter.envelope': 'bedroom.letter',
      'letter.seal': 'bedroom.letter',
    };
    const resolved = aliases[id] ?? id;
    const target = this.semanticTargets().find((candidate) => candidate.id === resolved);
    if (!target) throw new Error(`Semantic target ${id} is not available.`);
    this.handleTap({ x: target.x, y: target.y });
  }

  holdSemantic(id, seconds = INPUT.parentHoldSeconds) {
    this.beginSemanticHold(id);
    const frames = Math.max(0, Math.round(seconds / WORLD.step));
    for (let index = 0; index < frames; index += 1) this.update(WORLD.step);
    return this.endSemanticHold();
  }

  beginSemanticHold(id) {
    const target = this.semanticTargets().find((candidate) => candidate.id === id);
    if (!target) throw new Error(`Semantic target ${id} is not available.`);
    if (id !== 'satchel.grownups') throw new Error(`Semantic target ${id} does not support holding.`);
    const point = { x: target.x, y: target.y };
    this.pointer = {
      id: -1,
      point,
      latestPoint: point,
      holdTarget: 'parent-panel',
      holdTriggered: false,
      holdCancelled: false,
    };
    this.parentGateProgress = 0;
    return true;
  }

  endSemanticHold() {
    const triggered = Boolean(this.pointer?.holdTriggered);
    this.pointer = null;
    this.parentGateProgress = 0;
    this.render();
    return triggered;
  }

  updateStatus(text) {
    const status = globalThis.document?.querySelector?.('#game-status');
    if (status && text) status.textContent = text;
  }

  onVisibilityChanged() {
    this.lastFrame = null;
    if (document.hidden) {
      this.saveManager.flush();
      this.sound.pause();
    } else this.sound.resume();
  }

  destroy() {
    this.running = false;
    this.destroyed = true;
    this.sessionGeneration += 1;
    this.saveManager.destroy();
    this.sound.destroy();
    this.roomRenderer.destroy?.();
    this.setPieceRenderer.destroy?.();
    this.roomEffectsRenderer?.destroy?.();
    this.releaseCompositionSource(this.setPieceComposition?.source);
    if (this.setPieceComposition) this.setPieceComposition.source = null;
    this.releaseRoomTransition();
    this.saveTransferDialog?.destroy?.();
    this.petNameDialog?.destroy?.();
    const characterRelease = this.characterScopes.destroy?.() ?? Promise.resolve();
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.motionQuery.removeEventListener?.('change', this.boundMotionChanged);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundPointerCancel);
    if (this.debug) window.removeEventListener('keydown', this.boundKeyDown);
    return characterRelease;
  }
}

export function roomStateDuringSetPiece(state, room = null) {
  const active = state?.setPiece;
  const variant = setPieceParam(active, 'preloadRoomVariant');
  const revealAt = setPieceParam(active, 'revealRoomVariantAt');
  if (typeof variant !== 'string' || !variant || !Number.isFinite(revealAt)) return state;
  const duration = Math.max(0.1, active?.descriptor?.duration ?? 1);
  const progress = clamp((active?.time ?? 0) / duration, 0, 1);
  if (progress + Number.EPSILON < clamp(revealAt, 0, 1)) return state;
  const revealed = { ...state, roomVariant: variant };
  const revealSpawn = setPieceParam(active, 'revealSpawn');
  const spawn = typeof revealSpawn === 'string' ? room?.spawns?.[revealSpawn] : null;
  return spawn ? projectCompanionsToRevealSpawn(revealed, spawn) : revealed;
}

function projectCompanionsToRevealSpawn(state, spawn) {
  if (!state?.player || !Number.isFinite(spawn?.x) || !Number.isFinite(spawn?.y)) return state;
  const deltaX = spawn.x - state.player.x;
  const deltaY = spawn.y - state.player.y;
  const facing = spawn.facing ?? state.player.facing;
  const pet = state.pet ? {
    ...state.pet,
    x: state.pet.x + deltaX,
    y: state.pet.y + deltaY,
    facing,
  } : null;
  const petActorSuffix = state.pet?.type ? `.npc.pet.${state.pet.type}` : null;
  const actors = Array.isArray(state.actors) ? state.actors.map((actor) => {
    if (actor.characterId === 'character.violet') {
      return {
        ...actor,
        depth: actor.depth + deltaY,
        renderState: {
          ...actor.renderState,
          x: spawn.x,
          y: spawn.y,
          facing,
        },
      };
    }
    const isPet = petActorSuffix
      && (actor.actorId === petActorSuffix.slice(1) || actor.actorId.endsWith(petActorSuffix));
    if (!isPet) return actor;
    return {
      ...actor,
      depth: actor.depth + deltaY,
      renderState: {
        ...actor.renderState,
        x: actor.renderState.x + deltaX,
        y: actor.renderState.y + deltaY,
        facing,
      },
    };
  }) : state.actors;
  return {
    ...state,
    player: {
      ...state.player,
      x: spawn.x,
      y: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      facing,
    },
    pet,
    actors,
  };
}

function setPieceParam(active, key) {
  return active?.params?.[key] ?? active?.descriptor?.params?.[key];
}

function roomHasVariant(room, variant) {
  return typeof variant === 'string'
    && Array.isArray(room?.background?.variants?.[variant])
    && room.background.variants[variant].length > 0;
}

export function roomTransitionState(elapsed, {
  effect = 'ink',
  origin = { x: WORLD.width / 2, y: WORLD.height / 2 },
  reducedMotion = false,
} = {}) {
  const duration = reducedMotion ? 0.25 : effect === 'sparkle' ? 0.55 : 0.8;
  const linearProgress = clamp(elapsed / duration, 0, 1);
  const progress = easeInOutCubic(linearProgress);
  if (reducedMotion || effect === 'crossfade') {
    return Object.freeze({ kind: 'crossfade', duration, linearProgress, progress, origin: { ...origin }, points: [] });
  }
  if (effect === 'ink') {
    const phase = linearProgress >= 0.5 ? 'reveal' : 'cover';
    const phaseLinearProgress = phase === 'cover'
      ? clamp(linearProgress / 0.5, 0, 1)
      : clamp((linearProgress - 0.5) / 0.5, 0, 1);
    const phaseProgress = phase === 'cover'
      ? phaseLinearProgress ** 2.35
      : 1 - (1 - phaseLinearProgress) ** 2.2;
    return Object.freeze({
      kind: 'ink',
      duration,
      linearProgress,
      progress,
      phase,
      phaseLinearProgress,
      phaseProgress,
      brushDirection: origin.x > WORLD.width * 0.52 ? -1 : 1,
      origin: { ...origin },
      points: Object.freeze([]),
    });
  }
  const corners = [[0, 0], [WORLD.width, 0], [WORLD.width, WORLD.height], [0, WORLD.height]];
  const farthest = Math.max(...corners.map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)));
  const phaseLinearProgress = linearProgress;
  const phaseProgress = easeInOutCubic(phaseLinearProgress);
  const coverageRadius = (farthest + 850) * phaseProgress;
  const pointCount = 64;
  const points = [];
  for (let index = 0; index < pointCount; index += 1) {
    // Sparkle travel retains a soft organic bloom so its particles can ride
    // one coherent edge. Doorway ink uses the authored brush sweep above.
    const radiusNoiseRaw = Math.sin((index + 1) * 91.345 + 17.13) * 47453.5453;
    const angleNoiseRaw = Math.sin((index + 1) * 37.719 + 4.87) * 19341.713;
    const radiusNoise = radiusNoiseRaw - Math.floor(radiusNoiseRaw);
    const angleNoise = angleNoiseRaw - Math.floor(angleNoiseRaw);
    const angle = (index / pointCount) * Math.PI * 2
      + (angleNoise - 0.5) * 0.038;
    const broadLobe = Math.sin(index * 0.43 + 0.43) * 0.075;
    const dryBite = index % 9 === 0 ? -0.09 : index % 13 === 0 ? 0.1 : 0;
    const radius = coverageRadius * (0.84 + radiusNoise * 0.25 + broadLobe + dryBite);
    points.push({
      x: origin.x + Math.cos(angle) * radius,
      y: origin.y + Math.sin(angle) * radius,
    });
  }
  return Object.freeze({
    kind: effect === 'sparkle' ? 'sparkle' : 'ink',
    duration,
    linearProgress,
    progress,
    coverageRadius,
    origin: { ...origin },
    points: Object.freeze(points.map((point) => Object.freeze(point))),
  });
}

function appendOrganicBlob(context, points) {
  if (!points.length) return;
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const first = midpoint(points.at(-1), points[0]);
  context.moveTo(first.x, first.y);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    const middle = midpoint(point, next);
    context.quadraticCurveTo(point.x, point.y, middle.x, middle.y);
  }
  context.closePath();
}

const INK_BRUSH_BANDS = Object.freeze([
  Object.freeze({ top: -70, bottom: 110, delay: 0.02, seed: 1 }),
  Object.freeze({ top: 35, bottom: 205, delay: 0.07, seed: 4 }),
  Object.freeze({ top: 130, bottom: 300, delay: 0.035, seed: 7 }),
  Object.freeze({ top: 225, bottom: 395, delay: 0.085, seed: 2 }),
  Object.freeze({ top: 320, bottom: 490, delay: 0, seed: 8 }),
  Object.freeze({ top: 415, bottom: 585, delay: 0.055, seed: 5 }),
  Object.freeze({ top: 510, bottom: 680, delay: 0.025, seed: 9 }),
  Object.freeze({ top: 605, bottom: 775, delay: 0.075, seed: 3 }),
  Object.freeze({ top: 700, bottom: 865, delay: 0.045, seed: 6 }),
]);
const INK_BRUSH_COLORS = Object.freeze(['#151225', '#171327', '#141122', '#181428']);
const INK_FRONT_PROFILE = Object.freeze([-7, 4, -3, 8, -5, 3, -9, 5, -2]);

function drawInkBrushSweep(context, state) {
  const direction = state.brushDirection;
  const cover = state.phase === 'cover';
  context.save();
  context.lineCap = 'butt';
  context.lineJoin = 'round';

  for (let index = 0; index < INK_BRUSH_BANDS.length; index += 1) {
    const band = INK_BRUSH_BANDS[index];
    const centerY = (band.top + band.bottom) / 2;
    const distanceDelay = Math.abs(centerY - state.origin.y) / WORLD.height * 0.055;
    const delay = Math.min(0.14, band.delay + distanceDelay);
    const localProgress = clamp((state.phaseProgress - delay) / (1 - delay), 0, 1);
    const travel = lerp(-145, WORLD.width + 145, localProgress);
    const frontX = direction > 0 ? travel : WORLD.width - travel;
    const front = inkBrushFront(band, index, frontX, direction);

    context.fillStyle = INK_BRUSH_COLORS[(index + band.seed) % INK_BRUSH_COLORS.length];
    context.globalAlpha = 1;
    traceInkBrushBand(context, band, front, direction, cover);
    context.fill();
    drawInkBrushBandTexture(context, band, front, direction, cover, index);

    if (localProgress > 0.008 && localProgress < 0.992) {
      drawInkBrushFront(context, front, direction, cover, index);
    }
  }
  const fullInkHandoff = cover
    ? state.phaseProgress > 0.995
    : state.phaseProgress < 0.012;
  if (fullInkHandoff) drawFullFrameInkGrain(context);
  context.restore();
}

function drawFullFrameInkGrain(context) {
  context.save();
  context.lineCap = 'butt';
  context.lineJoin = 'round';
  const washColors = ['#392942', '#090a16', '#4a3248', '#21182f'];
  for (let stroke = 0; stroke < 12; stroke += 1) {
    const startY = 35 + stroke * 61 + Math.sin(stroke * 2.31) * 29;
    context.globalAlpha = 0.13 + (stroke % 4) * 0.025;
    context.strokeStyle = washColors[stroke % washColors.length];
    context.lineWidth = 20 + (stroke % 5) * 9;
    context.beginPath();
    context.moveTo(-90, startY + 18);
    context.bezierCurveTo(
      260 + (stroke % 3) * 45,
      startY - 58,
      830 - (stroke % 4) * 37,
      startY + 47,
      WORLD.width + 90,
      startY - 12,
    );
    context.stroke();
  }

  context.strokeStyle = '#9a7261';
  for (let fiber = 0; fiber < 54; fiber += 1) {
    const rawX = Math.sin((fiber + 5) * 71.337) * 28613.741;
    const rawY = Math.sin((fiber + 11) * 39.719) * 17321.319;
    const unitX = rawX - Math.floor(rawX);
    const unitY = rawY - Math.floor(rawY);
    const x = unitX * WORLD.width;
    const y = unitY * WORLD.height;
    const length = 20 + (fiber % 9) * 8;
    context.globalAlpha = 0.09 + (fiber % 4) * 0.025;
    context.lineWidth = 0.8 + (fiber % 3) * 0.45;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + length, y - 4 - (fiber % 5) * 2);
    context.stroke();
  }
  context.restore();
}

function inkBrushFront(band, bandIndex, frontX, direction) {
  return Object.freeze(INK_FRONT_PROFILE.map((offset, pointIndex) => {
    const progress = pointIndex / (INK_FRONT_PROFILE.length - 1);
    const y = lerp(band.top - 8, band.bottom + 8, progress)
      + Math.sin((pointIndex + 1) * (band.seed + 1.7)) * 3.5;
    const authoredWobble = Math.sin((bandIndex + 2) * (pointIndex + 1) * 1.31) * 3.2;
    return Object.freeze({
      x: frontX + direction * (offset + authoredWobble),
      y,
    });
  }));
}

function traceInkBrushBand(context, band, front, direction, cover) {
  const startEdge = direction > 0 ? -170 : WORLD.width + 170;
  const farEdge = direction > 0 ? WORLD.width + 170 : -170;
  const inkEdge = cover ? startEdge : farEdge;
  context.beginPath();
  context.moveTo(inkEdge, band.top - 18);
  context.lineTo(front[0].x, front[0].y);
  for (let index = 1; index < front.length - 1; index += 1) {
    const point = front[index];
    const next = front[index + 1];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2,
    );
  }
  context.lineTo(front.at(-1).x, front.at(-1).y);
  context.lineTo(inkEdge, band.bottom + 18);
  context.closePath();
}

function drawInkBrushBandTexture(context, band, front, direction, cover, bandIndex) {
  context.save();
  traceInkBrushBand(context, band, front, direction, cover);
  context.clip();

  const inkDirection = cover ? -direction : direction;
  for (let stripe = 0; stripe < 3; stripe += 1) {
    const y = lerp(band.top + 24, band.bottom - 22, (stripe + 0.5) / 3)
      + Math.sin((bandIndex + 1) * (stripe + 2)) * 8;
    context.globalAlpha = 0.065 + stripe * 0.018;
    context.strokeStyle = stripe === 1 ? '#493348' : '#090b17';
    context.lineWidth = 17 + ((bandIndex + stripe) % 4) * 7;
    context.beginPath();
    context.moveTo(-190, y + 5);
    context.bezierCurveTo(280, y - 16, 870, y + 19, WORLD.width + 190, y - 7);
    context.stroke();
  }

  context.strokeStyle = '#8a6758';
  for (let fiber = 0; fiber < 6; fiber += 1) {
    const point = front[(fiber + bandIndex) % front.length];
    const length = 19 + ((fiber * 11 + bandIndex * 7) % 38);
    context.globalAlpha = 0.08 + (fiber % 3) * 0.035;
    context.lineWidth = 0.7 + (fiber % 3) * 0.45;
    context.beginPath();
    context.moveTo(point.x + inkDirection * 4, point.y + (fiber % 2 ? 3 : -4));
    context.lineTo(point.x + inkDirection * length, point.y + (fiber % 3 - 1) * 6);
    context.stroke();
  }
  context.restore();
}

function drawInkBrushFront(context, front, direction, cover, bandIndex) {
  context.strokeStyle = '#493448';
  context.globalAlpha = 0.28;
  for (let index = 0; index < front.length - 1; index += 1) {
    if ((index + bandIndex) % 3 !== 0) continue;
    context.lineWidth = 1.8 + ((index + bandIndex) % 4) * 0.7;
    context.beginPath();
    context.moveTo(front[index].x, front[index].y);
    context.lineTo(front[index + 1].x, front[index + 1].y);
    context.stroke();
  }

  const bristleDirection = cover ? direction : -direction;
  context.strokeStyle = '#171220';
  for (let index = 1; index < front.length - 1; index += 1) {
    const point = front[index];
    const length = 9 + ((index * 5 + bandIndex * 3) % 24);
    context.globalAlpha = 0.22 + (index % 3) * 0.07;
    context.lineWidth = 0.7 + ((index + bandIndex) % 3) * 0.45;
    context.beginPath();
    context.moveTo(point.x - bristleDirection * 2, point.y);
    context.lineTo(point.x + bristleDirection * length, point.y + ((index + bandIndex) % 3 - 1) * 4);
    context.stroke();
  }
}

function drawTransitionSparkles(context, state) {
  const alpha = Math.sin(state.progress * Math.PI);
  if (alpha <= 0.01) return;
  context.save();
  context.globalAlpha = alpha;
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 + state.progress * 0.35;
    const radius = state.coverageRadius * (0.9 + (index % 3) * 0.035);
    const x = state.origin.x + Math.cos(angle) * radius;
    const y = state.origin.y + Math.sin(angle) * radius;
    const size = 5 + (index % 3) * 2;
    context.fillStyle = index % 2 ? '#fff2a8' : '#d5a8ff';
    context.beginPath();
    context.moveTo(x, y - size);
    context.lineTo(x + size * 0.36, y - size * 0.36);
    context.lineTo(x + size, y);
    context.lineTo(x + size * 0.36, y + size * 0.36);
    context.lineTo(x, y + size);
    context.lineTo(x - size * 0.36, y + size * 0.36);
    context.lineTo(x - size, y);
    context.lineTo(x - size * 0.36, y - size * 0.36);
    context.closePath();
    context.fill();
  }
  context.restore();
}

export function worldViewportSourceRect(game) {
  const dpr = Number.isFinite(game?.dpr) && game.dpr > 0 ? game.dpr : 1;
  const scale = Number.isFinite(game?.scale) && game.scale > 0 ? game.scale : 1;
  const canvasWidth = Math.max(1, game?.canvas?.width ?? WORLD.width);
  const canvasHeight = Math.max(1, game?.canvas?.height ?? WORLD.height);
  const x = clamp((game?.offsetX ?? 0) * dpr, 0, canvasWidth - 1);
  const y = clamp((game?.offsetY ?? 0) * dpr, 0, canvasHeight - 1);
  const width = clamp(WORLD.width * scale * dpr, 1, canvasWidth - x);
  const height = clamp(WORLD.height * scale * dpr, 1, canvasHeight - y);
  return Object.freeze({ x, y, width, height });
}

function safeStorage() {
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
  } catch {
    // Fall through to the in-memory adapter. Save surfaces storage failures separately.
  }
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function dataUrlBytes(dataUrl) {
  const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  return encoded.length * 3 / 4 - padding;
}

function semanticRect(id, rect) {
  return { id, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function replaceObjectContents(target, source) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, structuredClone(source));
  return target;
}

function isSkippableChapterCardSetPiece(state) {
  return state?.setPiece?.descriptor?.params?.specification === 'chapter-card';
}

function hasMeaningfulProgress(save) {
  if (!save) return false;
  if (Object.keys(save.progress?.questFlags ?? {}).length > 0) return true;
  if ((save.progress?.completedChapters ?? []).length > 0) return true;
  if ((save.collections?.cards ?? []).length > 0 || (save.collections?.treasures ?? []).length > 0) return true;
  if ((save.yearbook?.entries ?? []).length > 0) return true;
  if (save.character?.wandId || save.character?.pet?.type || save.character?.appearance?.robeTrim) return true;
  if (save.resume?.chapter !== 'ch1' || save.resume?.room !== 'ch1.bedroom') return true;
  return !['ch1.letter', 'ch1.letterScene'].includes(save.resume?.scene);
}

export function selectChapter1ResumeRecap(save, recaps = []) {
  if (save?.resume?.chapter !== 'ch1') return null;
  if (save.progress?.completedChapters?.includes('ch1')) return null;

  const flags = save.progress?.questFlags ?? {};
  let step = 'openLetter';
  if (flags['ch1.letterRead']) step = 'followGuide';
  if (flags['ch1.wallOpened']) step = 'useMap';
  if (flags['ch1.wandChosen']) step = 'chooseRobes';
  if (flags['ch1.trimChosen']) step = 'choosePet';
  if (flags['ch1.petNamed']) step = 'returnToGuide';
  if (flags['ch1.ticketReceived'] || flags['ch1.complete']) return null;
  const recap = recaps.find((candidate) => candidate.step === step) ?? null;
  return resumeRecapWasPresented(save, save.resume.chapter, recap) ? null : recap;
}

export function selectResumeRecap(
  save,
  chaptersById,
  recapsByChapter,
) {
  const chapterId = save?.resume?.chapter;
  const chapter = chaptersById?.[chapterId];
  const recaps = recapsByChapter?.[chapterId] ?? chapter?.recaps ?? [];
  if (!chapter || recaps.length === 0) return null;
  if (save.progress?.completedChapters?.includes(chapterId)) return null;
  if (chapter.contractVersion === 1) return selectChapter1ResumeRecap(save, recaps);

  const active = activeQuestStep(chapter, save);
  if (!active) return null;
  const activeIndex = active.order.indexOf(active.stepId);
  if (activeIndex < 0) return null;

  let selected = null;
  let selectedIndex = -1;
  for (const recap of recaps) {
    const recapIndex = active.order.indexOf(recap.step);
    if (recapIndex < 0 || recapIndex > activeIndex || recapIndex < selectedIndex) continue;
    selected = recap;
    selectedIndex = recapIndex;
  }
  return resumeRecapWasPresented(save, chapterId, selected) ? null : selected;
}

function resumeRecapReceiptId(chapterId, recap) {
  if (typeof chapterId !== 'string' || !recap) return null;
  if (typeof recap.id === 'string' && recap.id.startsWith(`${chapterId}.`)) return recap.id;
  if (typeof recap.step === 'string' && recap.step.length > 0) {
    return `${chapterId}.recap.${recap.step}`;
  }
  return null;
}

function resumeRecapWasPresented(save, chapterId, recap) {
  const receipt = resumeRecapReceiptId(chapterId, recap);
  return Boolean(receipt && save?.progress?.storyReceipts?.includes(receipt));
}

function activeQuestStep(chapter, save) {
  for (const quest of Object.values(chapter.quests ?? {})) {
    if (!conditionMatches(quest.startWhen, save)) continue;
    const order = [];
    const visited = new Set();
    let stepId = quest.startStep;
    while (stepId && !visited.has(stepId)) {
      visited.add(stepId);
      order.push(stepId);
      const step = quest.steps[stepId];
      if (!step) break;
      if (!conditionMatches(step.doneWhen, save)) return { quest, stepId, order };
      stepId = step.next;
    }
  }
  return null;
}

function latestReplayChapterId(save, descriptors = []) {
  const descriptorById = new Map(descriptors.map((descriptor) => [descriptor.id, descriptor]));
  return [...(save?.progress?.completedChapters ?? [])]
    .filter((chapterId) => descriptorById.has(chapterId))
    .sort((left, right) => (
      descriptorById.get(right).number - descriptorById.get(left).number
    ))[0] ?? null;
}

function spellbookStatusText(payload = {}) {
  if (payload.state === 'fan') return 'Choose a spell.';
  if (payload.state === 'targeting') return 'Tap something glowing, or tap the wand to close the spellbook.';
  if (payload.state === 'casting') return 'Violet is casting the spell.';
  return 'Continue Violet’s adventure.';
}

export function mergeReplayCollections(canonical, replay) {
  let changed = false;
  for (const field of ['cards', 'treasures']) {
    const durable = canonical?.collections?.[field];
    const discovered = replay?.collections?.[field];
    if (!Array.isArray(durable) || !Array.isArray(discovered)) continue;
    for (const id of discovered) {
      if (durable.includes(id)) continue;
      durable.push(id);
      changed = true;
    }
  }
  return changed;
}

function createReplaySave(canonicalSave, chapter, now, descriptors = []) {
  const replay = createSave({
    now,
    appVersion: canonicalSave.appVersion,
    worldSeed: canonicalSave.worldSeed,
    name: canonicalSave.character.name,
  });
  replay.settings = structuredClone(canonicalSave.settings);
  replay.collections.cards = [...canonicalSave.collections.cards];
  replay.collections.treasures = [...canonicalSave.collections.treasures];
  if (chapter.number > 1) {
    replay.character = structuredClone(canonicalSave.character);
    replay.character.house = null;
    replay.character.commonRoomPassword = [];

    const descriptorById = new Map(descriptors.map((descriptor) => [descriptor.id, descriptor]));
    const priorChapterIds = canonicalSave.progress.completedChapters.filter((chapterId) => (
      descriptorById.get(chapterId)?.number < chapter.number
    ));
    replay.progress.completedChapters = [...priorChapterIds];
    replay.progress.highestUnlockedChapter = chapter.number;
    for (const chapterId of priorChapterIds) replay.progress.questFlags[`${chapterId}.complete`] = true;
    for (const [flag, value] of Object.entries(canonicalSave.progress.questFlags)) {
      const owner = flag.split('.')[0];
      if (priorChapterIds.includes(owner)) replay.progress.questFlags[flag] = value;
    }
    for (const [choice, value] of Object.entries(canonicalSave.progress.storyChoices)) {
      const owner = choice.split('.')[0];
      if (priorChapterIds.includes(owner)) replay.progress.storyChoices[choice] = structuredClone(value);
    }
    replay.resume = {
      chapter: chapter.id,
      scene: chapter.start.scene,
      room: chapter.start.room,
      spawn: chapter.start.spawn,
      dialogue: null,
    };
  }
  return replay;
}

function chapterReplayLabel(chapter) {
  const words = { 1: 'One', 2: 'Two', 3: 'Three' };
  return `Chapter ${words[chapter.number] ?? chapter.number}`;
}

function chapterReplayDetail(chapter) {
  if (chapter.number === 1) return 'Play from the letter again';
  if (chapter.number === 2) return 'Return to King’s Cross';
  return 'Play this chapter again';
}
