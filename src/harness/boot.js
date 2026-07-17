import '../style.css';
import { Game } from '../game/Game.js';
import { CharacterScopeController } from '../game/characters/CharacterScopeController.js';
import {
  productionCharacterCatalog,
  titleCharacterDependencies,
} from '../game/characters/productionCatalog.js';
import { loadChapterPackage } from '../game/content/index.js';
import { loadGameFonts } from '../game/core/loadFonts.js';
import { validateSaveV1 } from '../game/systems/Save.js';
import { RegisteredCharacterRenderer } from '../game/render/RegisteredCharacterRenderer.js';
import {
  ACTION_FIXTURE_IDS,
  cloneActionFixture,
} from './actionFixtures.js';
import { assertRegistryId } from './registry.js';
import {
  STATE_FIXTURE_IDS,
  cloneStateFixture,
  getStateFixture,
  validateStateFixture,
} from './stateFixtures.js';
import { RegisteredCharacterReviewRenderer } from './RegisteredCharacterReviewRenderer.js';
import { productionCharacterReviewCatalog } from './productionCharacterReviewCatalog.js';

const UINT32_MAX = 0xffffffff;
const FIXED_STEP = 1 / 60;

export const SET_PIECE_REVIEW_SCENES = Object.freeze({
  'sp-letter-open-review': 'sp.letterOpen',
  'sp-brick-wall-review': 'sp.brickWall',
  'sp-wand-vase-review': 'sp.wandChaos2',
  'sp-wand-chosen-review': 'sp.wandChosen',
  'sp-ch2-barrier-run-review': 'ch2.setPiece.barrierRun',
  'sp-ch2-sweet-reaction-review': 'ch2.setPiece.sweetReaction',
  'sp-ch2-lake-vista-review': 'ch2.setPiece.lakeVista',
  'sp-ch2-sorting-reveal-review': 'ch2.setPiece.sortingReveal',
  'sp-ch2-common-room-arrival-review': 'ch2.setPiece.commonRoomArrival',
  'sp-ch2-chapter-card-review': 'ch2.setPiece.chapterCard',
});

export const WORLD_AFFORDANCE_REVIEW_SCENES = Object.freeze({
  'world-shimmer-review': null,
  'world-shimmer-hint-review': 'ollivanders.wand1',
  'world-secret-pet-review': null,
});

export const GUIDE_WALK_REVIEW_SCENES = Object.freeze([
  'ch1-follow-hagrid-review',
  'ch1-follow-hagrid-leaky-review',
]);

function integer(value, path, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new TypeError(`${path} must be an integer from ${min} through ${max}.`);
  }
  return parsed;
}

function frameFromSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) throw new TypeError('t must be a non-negative number.');
  const frame = Math.round(seconds / FIXED_STEP);
  if (Math.abs(frame * FIXED_STEP - seconds) > 1e-9) throw new TypeError('t must land on the 60 fps simulation grid.');
  return frame;
}

function parseSize(value) {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) throw new TypeError('size must look like 640x360.');
  return {
    width: integer(match[1], 'width', { min: 1, max: 4096 }),
    height: integer(match[2], 'height', { min: 1, max: 4096 }),
  };
}

export function parseHarnessRequest(search = '') {
  const params = new URLSearchParams(search);
  const scene = params.get('scene') ?? 'foundation';
  assertRegistryId(scene, 'scene');
  const defaultState = STATE_FIXTURE_IDS.includes(scene) ? scene : 'foundation';
  const state = params.get('state') ?? defaultState;
  const defaultActions = ACTION_FIXTURE_IDS.includes(state) ? state : 'foundation';
  const actions = params.get('actions') ?? defaultActions;
  assertRegistryId(state, 'state fixture');
  assertRegistryId(actions, 'action fixture');
  const { width, height } = parseSize(params.get('size') ?? '640x360');
  const dpr = integer(params.get('dpr') ?? 1, 'dpr', { min: 1, max: 2 });
  const seed = integer(params.get('seed') ?? 42, 'seed', { min: 1, max: UINT32_MAX });
  const motion = params.get('motion') ?? 'full';
  if (!['full', 'reduced'].includes(motion)) throw new TypeError('motion must be full or reduced.');
  const learning = params.get('learning') ?? 'gentle';
  if (!['off', 'gentle', 'stretchy'].includes(learning)) throw new TypeError('learning must be off, gentle, or stretchy.');
  const frame = params.has('frame')
    ? integer(params.get('frame'), 'frame')
    : frameFromSeconds(params.get('t') ?? 0);
  return { scene, state, actions, frame, seed, width, height, dpr, motion, learning };
}

export function resolveHarnessScenario(request) {
  const stateFixture = cloneStateFixture(request.state);
  const actionFixture = cloneActionFixture(request.actions);
  const sceneFixture = STATE_FIXTURE_IDS.includes(request.scene)
    ? getStateFixture(request.scene)
    : stateFixture;
  stateFixture.save.worldSeed = request.seed;
  stateFixture.save.settings.reducedMotion = request.motion === 'reduced';
  stateFixture.save.settings.learning = request.learning;
  validateStateFixture(stateFixture);
  validateSaveV1(stateFixture.save);
  const reviewDescriptor = productionCharacterReviewCatalog.get(request.scene);
  return {
    stateFixture,
    actionFixture,
    characterDependencies: reviewDescriptor?.characterDependencies
      ?? Object.freeze([...sceneFixture.characterDependencies]),
  };
}

export function actionsThroughFrame(actionFixture, frame) {
  integer(frame, 'frame');
  return actionFixture.actions.filter((action) => action.frame <= frame);
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function harnessSound(log, currentFrame) {
  const record = (type, detail = {}) => log.push({ type, frame: currentFrame(), ...detail });
  return {
    eventLog: log,
    unlock: async () => { record('audio.unlock'); return true; },
    setMuted: () => {},
    setVolumes: () => {},
    playSfx: (key) => { record('audio.sfx', { key }); return null; },
    speak: async (key, text = '') => { record('audio.voice', { key, text }); },
    playMusic: async (key) => { record('audio.music', { key }); },
    stopVoice: () => record('audio.stopVoice'),
    pause: () => record('audio.pause'),
    resume: async () => record('audio.resume'),
    stopAll: () => record('audio.stopAll'),
    destroy: () => {},
  };
}

async function settleAsyncAction() {
  await Promise.resolve();
  await Promise.resolve();
}

async function stepGameTo(game, seconds) {
  if (seconds < game.simTime) {
    throw new Error('Harness stepping cannot rewind a live game; create a fresh harness instance.');
  }
  while (game.simTime + FIXED_STEP <= seconds + 1e-9) {
    game.update(FIXED_STEP);
    if (game.roomTransition && !game.roomTransition.ready) {
      await game.waitForRoomTransitionReady();
    }
  }
  game.render();
}

async function preloadVisibleRoom(game) {
  if (!game.world) return;
  if (typeof game.roomRenderer.preloadRoom === 'function') {
    await game.roomRenderer.preloadRoom(
      game.world.room,
      game.world.snapshot(),
      { scale: game.dpr * game.scale },
    );
    return;
  }
  const background = game.world.room?.background;
  const keys = [
    ...(background?.layers ?? []),
    ...Object.values(background?.variants ?? {}).flat(),
  ];
  await game.roomRenderer.preload([...new Set(keys)]);
}

export async function prepareSetPieceReview(game, scene) {
  const setPieceId = SET_PIECE_REVIEW_SCENES[scene];
  if (!setPieceId || !game.world) return false;
  if (scene === 'sp-brick-wall-review') await game.setPieceRenderer.preloadBrickWall();
  if (game.world.dialogue.active) game.world.dialogue.close('harness-set-piece-review');
  game.world.afterSetPieceActions.length = 0;
  const stagedPlayer = {
    'sp-wand-vase-review': { x: 910, facing: 'right' },
    'sp-wand-chosen-review': { x: 1080, facing: 'right' },
    'sp-ch2-barrier-run-review': { x: 760, facing: 'right' },
    'sp-ch2-sweet-reaction-review': { x: 410, facing: 'left' },
    'sp-ch2-sorting-reveal-review': { x: 640, facing: 'right' },
    'sp-ch2-common-room-arrival-review': { x: 590, facing: 'right' },
  }[scene];
  if (stagedPlayer) {
    game.world.player.x = stagedPlayer.x;
    game.world.player.targetX = stagedPlayer.x;
    game.world.player.facing = stagedPlayer.facing;
    game.world.player.walking = false;
  }
  if (game.world.setPieces.active?.requestedId !== setPieceId) game.world.setPieces.start(setPieceId);
  game.processWorldEvents();
  return true;
}

export function prepareWorldAffordanceReview(game, scene) {
  if (!Object.hasOwn(WORLD_AFFORDANCE_REVIEW_SCENES, scene) || !game.world) return false;
  if (game.world.dialogue.active) game.world.dialogue.close('harness-world-affordance-review');
  if (WORLD_AFFORDANCE_REVIEW_SCENES[scene]) {
    const active = game.world.quests.active();
    game.world.hintObjective = active ? { quest: active.quest.id, step: active.stepId } : null;
    game.world.hintTrailShown = true;
  }
  game.processWorldEvents();
  return true;
}

export function prepareGuideWalkReview(game, scene) {
  if (!GUIDE_WALK_REVIEW_SCENES.includes(scene) || !game.world) return false;
  if (game.world.dialogue.active) game.world.dialogue.close('harness-guide-walk-review');
  const leaky = scene === 'ch1-follow-hagrid-leaky-review';
  const playerX = leaky ? 160 : 360;
  game.world.player.x = playerX;
  game.world.player.targetX = playerX;
  game.world.player.y = 610;
  game.world.player.facing = leaky ? 'right' : 'left';
  game.world.player.walking = false;
  game.world.startGuideWalkCue({ restart: true });
  game.processWorldEvents();
  return true;
}

export async function bootHarness({
  search = globalThis.location?.search ?? '',
  canvas = globalThis.document?.querySelector('#game'),
  targetWindow = globalThis.window,
} = {}) {
  if (!canvas || !targetWindow) throw new Error('Harness requires a canvas and window.');
  const request = parseHarnessRequest(search);
  canvas.style.width = `${request.width}px`;
  canvas.style.height = `${request.height}px`;
  targetWindow.__ready = false;
  await loadGameFonts(globalThis.document);

  let current = null;

  const runAt = async (frame) => {
    integer(frame, 'frame');
    await current?.game.destroy();
    const {
      stateFixture,
      actionFixture,
      characterDependencies,
    } = resolveHarnessScenario(request);
    const eventLog = [];
    const characterScopes = new CharacterScopeController({
      catalog: productionCharacterCatalog,
      loadChapterPackage,
    });
    // Game construction synchronously paints during resize: ordinary scenes
    // show the title, while shared review scenes can render immediately. Keep
    // both declared casts alive until the final scope can replace them.
    const constructionDependencies = Object.freeze([...new Set([
      ...titleCharacterDependencies,
      ...characterDependencies,
    ])]);
    await characterScopes.activateTitle(constructionDependencies, {
      harness: true,
      review: true,
      sceneId: request.scene,
      source: 'harness-construction',
    });
    const characterRenderer = new RegisteredCharacterRenderer({
      registry: productionCharacterCatalog.registry,
    });
    const characterReviewRenderer = new RegisteredCharacterReviewRenderer({
      characterRenderer,
      descriptors: productionCharacterReviewCatalog,
    });
    let game;
    game = new Game(canvas, {
      harness: true,
      harnessScene: request.scene,
      width: request.width,
      height: request.height,
      dpr: request.dpr,
      reducedMotion: request.motion === 'reduced',
      saveData: stateFixture.save,
      storage: memoryStorage(),
      characterRenderer,
      characterReviewRenderer,
      characterScopes,
      enableSaveTransfer: request.scene === 'save-transfer',
      enablePetNameDialog: request.scene === 'pet-name-dialog',
    });
    game.sound.destroy();
    game.sound = harnessSound(eventLog, () => Math.round(game.simTime / FIXED_STEP));
    const handleWorldEvent = game.handleWorldEvent.bind(game);
    game.handleWorldEvent = (event) => {
      eventLog.push({ type: 'world.event', frame: Math.round(game.simTime / FIXED_STEP), event: structuredClone(event) });
      handleWorldEvent(event);
    };
    if (stateFixture.entry.chapter > 0) {
      await characterScopes.activateChapter(stateFixture.save.resume.chapter, {
        harness: true,
        review: true,
        sceneId: request.scene,
      });
      game.createWorld(stateFixture.save);
      await characterScopes.releaseTitle();
      await prepareSetPieceReview(game, request.scene);
      prepareWorldAffordanceReview(game, request.scene);
      prepareGuideWalkReview(game, request.scene);
    } else {
      await characterScopes.activateTitle(characterDependencies, {
        harness: true,
        review: true,
        sceneId: request.scene,
        source: 'harness-scene',
      });
    }
    game.start();
    if (request.scene.startsWith('ui-satchel-') || game.world?.snapshot().hasSatchel) {
      await game.uiRenderer.preloadSatchelImages();
    }
    if (request.scene === 'pet-name-dialog') void game.petNameDialog?.open('Moonbeam');
    await preloadVisibleRoom(game);
    game.render();

    const appliedActions = actionsThroughFrame(actionFixture, frame);
    for (const action of appliedActions) {
      await stepGameTo(game, action.frame * FIXED_STEP);
      eventLog.push({ type: 'harness.action', frame: action.frame, action: structuredClone(action) });
      if (action.type === 'hold') {
        game.beginSemanticHold(action.target);
        const holdEndFrame = Math.min(frame, action.frame + action.durationFrames);
        await stepGameTo(game, holdEndFrame * FIXED_STEP);
        if (holdEndFrame === action.frame + action.durationFrames) game.endSemanticHold();
      } else game.tapSemantic(action.target);
      await settleAsyncAction();
      await game.waitForRoomTransitionReady();
    }
    const targetTime = frame * FIXED_STEP;
    if (targetTime > game.simTime + 1e-9) await stepGameTo(game, targetTime);
    else game.render();
    await settleAsyncAction();
    await globalThis.document?.fonts?.ready;
    await preloadVisibleRoom(game);
    game.render();
    current = { game, eventLog, frame, stateFixture, actionFixture, appliedActions };
    return describe();
  };

  const describe = () => {
    const world = current?.game.world?.snapshot();
    return {
      scene: request.scene,
      state: request.state,
      actions: request.actions,
      frame: current?.frame ?? request.frame,
      seed: request.seed,
      width: request.width,
      height: request.height,
      dpr: request.dpr,
      motion: request.motion,
      learning: request.learning,
      screen: current?.game.screen ?? 'loading',
      chapter: world?.chapterId ?? null,
      room: world?.roomId ?? null,
      storyScene: world?.sceneId ?? current?.stateFixture.entry.scene ?? null,
      appliedActions: current?.appliedActions.length ?? 0,
    };
  };

  targetWindow.__harness = {
    describe,
    renderAt: async ({ frame }) => runAt(frame),
    snapshot: () => canvas.toDataURL('image/png'),
    eventLog: () => structuredClone(current?.eventLog ?? []),
  };
  targetWindow.__snapshot = targetWindow.__harness.snapshot;
  targetWindow.__renderAt = async (time) => runAt(frameFromSeconds(time));

  await runAt(request.frame);
  targetWindow.__ready = true;
  return targetWindow.__harness;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') await bootHarness();
