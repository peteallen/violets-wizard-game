import { INPUT, PALETTE, WORLD } from '../config.js';
import { chapter1Map } from '../content/chapters/ch1.js';
import { childFacingUiText } from '../content/playerVisibleCopy.js';
import { buildMapState } from '../core/MapState.js';
import { ROBE_TRIMS, normalizeRobeTrim, robeTrimColor } from '../core/RobeTrims.js';
import {
  drawParchmentAction,
  drawReplayRibbon,
  drawRibbonTab,
  drawStepper,
  drawStorybookSpread,
  drawWaxMedallion,
  traceRoundedRect,
} from './uiPrimitives.js';
import {
  drawBrassKeyhole,
  drawBrassWandHolster,
  drawCompassQuest,
  drawDeckledParchment,
  drawDialogueScroll,
  drawLeatherBookmark,
  drawLeatherSatchel,
  drawVectorIcon,
  drawWaxIcon,
} from './uiIllustrations.js';
import { drawReadableInvitation } from './SetPieceRenderer.js';
import { StorybookTitleRenderer } from './StorybookTitleRenderer.js';
import {
  drawAffordancePresentation,
  worldAffordanceState,
} from './WorldAffordanceRenderer.js';
import {
  createIllustratedMapPresentation,
  IllustratedMapRenderer,
} from './IllustratedMapRenderer.js';

export { isAllowedChildFacingUiText } from '../content/playerVisibleCopy.js';

const STORY_GRADIENTS = new WeakMap();
const NIGHT_DIALOGUE_GRADIENTS = new WeakMap();
const TITLE_IMAGE_KEYS = Object.freeze([
  'ui/title/backdrop-v2',
  'ui/title/return-envelope-v2',
]);
const HUD_IMAGE_KEYS = Object.freeze([
  'ui/objective/reminder-v2',
  'ui/hud/satchel-closed',
  'ui/hud/quest-compass-base',
  'ui/hud/quest-compass-needle',
  'ui/hud/wand-holster',
  'ui/hud/wands/violet-first-wand',
]);
const SATCHEL_IMAGE_KEYS = Object.freeze([
  'ui/satchel/spread-v2',
  'ui/satchel/card-frame-v2',
  'ui/satchel/card-pocket-v2',
  'ui/satchel/map-tab',
  'ui/satchel/cards-tab',
  'ui/satchel/grown-ups',
  'ui/satchel/start-fresh',
  'ui/satchel/close-seal',
  'ui/satchel/destination-diagon-alley',
  'ui/satchel/destination-ollivanders',
  'ui/satchel/destination-malkins',
  'ui/satchel/destination-menagerie',
  'cards/morgana/portrait',
  'cards/dumbledore/portrait',
  'cards/merlin/portrait',
  'cards/jocunda-sykes/portrait',
]);
const CHOICE_IMAGE_KEYS = Object.freeze([
  'ui/story/choice-tag-v2',
]);

export const UI_REVIEW_SCENES = Object.freeze([
  'ui-dialogue-review',
  'ui-dialogue-night-review',
  'ui-dialogue-center-review',
  'ui-letter-reading-review',
  'ui-robe-picker-review',
  'ui-satchel-map-early-review',
  'ui-satchel-map-review',
  'ui-satchel-cards-review',
  'ui-satchel-ch2-cards-review',
  'ui-satchel-ch3-cards-review',
  'ui-chapter-card-review',
]);

export const UI_RECTS = Object.freeze({
  quest: { x: 28, y: 28, width: 104, height: 104 },
  satchel: { x: 28, y: 584, width: 108, height: 108 },
  wand: { x: 1144, y: 584, width: 108, height: 108 },
  dialogueReplay: { x: 998, y: 522, width: 88, height: 88 },
  letterHear: { x: 60, y: 594, width: 280, height: 96 },
  letterContinue: { x: 360, y: 594, width: 280, height: 96 },
  robeConfirm: { x: 742, y: 548, width: 338, height: 102 },
  debugReset: { x: 510, y: 18, width: 260, height: 88 },
  satchelMapTab: { x: 112, y: 112, width: 250, height: 94 },
  satchelCardsTab: { x: 378, y: 112, width: 250, height: 94 },
  satchelCardsOnlyTab: { x: 245, y: 112, width: 250, height: 94 },
  satchelKeyhole: { x: 112, y: 586, width: 220, height: 88 },
  satchelStartOver: { x: 936, y: 586, width: 232, height: 88 },
  satchelClose: { x: 1092, y: 54, width: 88, height: 88 },
  close: { x: 1046, y: 76, width: 88, height: 88 },
  replayExit: { x: 430, y: 18, width: 420, height: 88 },
  parentPlayTab: { x: 175, y: 142, width: 230, height: 88 },
  parentSettingsTab: { x: 425, y: 142, width: 260, height: 88 },
  parentSaveTab: { x: 705, y: 142, width: 230, height: 88 },
  parentReplay: { x: 170, y: 275, width: 430, height: 118 },
  parentYearbook: { x: 680, y: 275, width: 430, height: 118 },
  parentMute: { x: 145, y: 465, width: 300, height: 92 },
  parentReducedMotion: { x: 475, y: 465, width: 390, height: 92 },
  parentLearningOff: { x: 338, y: 570, width: 190, height: 88 },
  parentLearningGentle: { x: 548, y: 570, width: 190, height: 88 },
  parentLearningStretchy: { x: 758, y: 570, width: 190, height: 88 },
  parentMasterMinus: { x: 140, y: 245, width: 88, height: 88 },
  parentMasterPlus: { x: 500, y: 245, width: 88, height: 88 },
  parentVoiceMinus: { x: 690, y: 245, width: 88, height: 88 },
  parentVoicePlus: { x: 1050, y: 245, width: 88, height: 88 },
  parentMusicMinus: { x: 140, y: 355, width: 88, height: 88 },
  parentMusicPlus: { x: 500, y: 355, width: 88, height: 88 },
  parentSfxMinus: { x: 690, y: 355, width: 88, height: 88 },
  parentSfxPlus: { x: 1050, y: 355, width: 88, height: 88 },
  parentExport: { x: 155, y: 265, width: 440, height: 108 },
  parentImport: { x: 685, y: 265, width: 440, height: 108 },
  parentRestore: { x: 155, y: 420, width: 440, height: 108 },
  parentStartOver: { x: 685, y: 420, width: 440, height: 108 },
  parentCancelConfirm: { x: 215, y: 470, width: 360, height: 108 },
  parentAcceptConfirm: { x: 705, y: 470, width: 360, height: 108 },
  yearbookPrevious: { x: 125, y: 565, width: 230, height: 96 },
  yearbookNext: { x: 925, y: 565, width: 230, height: 96 },
  dialogueAdvance: { x: 998, y: 612, width: 88, height: 88 },
});

const DIALOGUE_FRAME = Object.freeze({
  y: 520,
  topY: 32,
  middleY: 270,
  height: 182,
  maximumWidth: 900,
  minimumWidth: 384,
  margin: 32,
  speakerGap: 30,
  portraitOverhang: 62,
});
const LETTER_READING_INVITATION = Object.freeze({
  x: 350,
  y: 318,
  scale: 0.87,
  localWidth: 650,
  localHeight: 430,
});
// Conservative painted bounds for Violet's wispiest hair, shoes, and grounding
// shadow across the robe-preview idle motion.
const ROBE_PREVIEW_VIOLET_LOCAL_BOUNDS = Object.freeze({
  x: -68,
  y: -204,
  width: 136,
  height: 245,
});
const DEFAULT_ACTOR_LAYOUT_BOUNDS = Object.freeze({
  x: -74,
  y: -236,
  width: 148,
  height: 268,
});
export function dialogueSceneContext(state, dialogue = state?.dialogue) {
  const night = state?.roomVariant === 'dusk' || state?.roomVariant === 'night';
  const lightSide = state?.keyLight === 'right' ? 'right' : 'left';
  const cameraX = state?.cameraX ?? 0;
  const characterBounds = visibleCharacterBounds(state, cameraX);
  const sceneryBounds = visibleObjectiveSceneryBounds(state, cameraX);
  const avoidance = Object.freeze([...characterBounds, ...sceneryBounds]);
  const actor = (state?.actors ?? []).find(({ actorId }) => actorId === dialogue?.speaker) ?? null;
  const portraitActor = actor?.characterId === dialogue?.portraitCharacterId ? actor : null;
  const portraitRenderState = portraitAppearanceState(portraitActor?.renderState);
  if (!actor) {
    return {
      night,
      lightSide,
      speakerPosition: null,
      speakerBounds: null,
      characterBounds,
      sceneryBounds,
      avoidBounds: avoidance,
      portraitRenderState,
    };
  }

  const position = {
    x: actor.renderState.x - cameraX,
    y: actor.renderState.y,
  };
  return {
    night,
    lightSide,
    portraitRenderState,
    speakerPosition: position,
    speakerBounds: characterLayoutBounds(actor, cameraX),
    characterBounds,
    sceneryBounds,
    avoidBounds: avoidance,
  };
}

export function dialogueScrollLayout(scene = {}) {
  const speakerBounds = validLayoutBounds(scene?.speakerBounds) ? scene.speakerBounds : null;
  const suppliedAvoidance = [
    ...(Array.isArray(scene?.characterBounds) ? scene.characterBounds : []),
    ...(Array.isArray(scene?.sceneryBounds) ? scene.sceneryBounds : []),
    ...(Array.isArray(scene?.avoidBounds) ? scene.avoidBounds : []),
  ].filter(validLayoutBounds);
  const avoidBounds = uniqueLayoutBounds([
    ...suppliedAvoidance,
    ...(speakerBounds ? [speakerBounds] : []),
  ]);
  const speakerCenter = speakerBounds ? (speakerBounds.left + speakerBounds.right) / 2 : null;
  const preferredSide = speakerCenter === null || speakerCenter <= WORLD.width / 2 ? 'right' : 'left';
  const yCandidates = [DIALOGUE_FRAME.y, DIALOGUE_FRAME.topY, DIALOGUE_FRAME.middleY];
  let placement = null;

  for (const y of yCandidates) {
    const bandBounds = avoidBounds.filter((bounds) => boundsOverlapVerticalBand(
      bounds,
      y,
      DIALOGUE_FRAME.height,
    ));
    if (bandBounds.length === 0) {
      placement = centeredDialoguePlacement(y, speakerCenter);
      break;
    }

    const candidates = dialogueSidePlacements(y, bandBounds);
    placement = candidates.find((candidate) => candidate.side === preferredSide)
      ?? candidates.sort((first, second) => second.frame.width - first.frame.width)[0]
      ?? null;
    if (placement) break;
  }

  placement ??= centeredDialoguePlacement(DIALOGUE_FRAME.topY, speakerCenter);
  const { frame, side, portraitSide } = placement;
  const controlsSide = portraitSide === 'left' ? 'right' : 'left';
  const portrait = {
    x: portraitSide === 'left' ? frame.x : frame.x + frame.width,
    y: frame.y + frame.height / 2,
    scale: 1,
  };
  const controlX = controlsSide === 'right' ? frame.x + frame.width - 48 : frame.x + 48;
  const replayRect = { x: controlX - 44, y: frame.y + 2, width: 88, height: 88 };
  const advanceRect = { x: controlX - 44, y: frame.y + 92, width: 88, height: 88 };
  const captionLeft = portraitSide === 'left' ? frame.x + 64 : replayRect.x + replayRect.width + 18;
  const captionRight = portraitSide === 'left' ? replayRect.x - 18 : frame.x + frame.width - 64;

  return {
    side,
    portraitSide,
    controlsSide,
    frame,
    portrait,
    portraitBounds: {
      left: portrait.x - DIALOGUE_FRAME.portraitOverhang,
      right: portrait.x + DIALOGUE_FRAME.portraitOverhang,
      top: portrait.y - DIALOGUE_FRAME.portraitOverhang,
      bottom: portrait.y + DIALOGUE_FRAME.portraitOverhang,
    },
    captionRect: {
      x: captionLeft,
      y: frame.y + 18,
      width: Math.max(1, captionRight - captionLeft),
      height: frame.height - 36,
    },
    controlX,
    replayRect,
    advanceRect,
    avoidBounds,
    rotation: 0,
  };
}

export function letterReadingLayout() {
  const { x, y, scale, localWidth, localHeight } = LETTER_READING_INVITATION;
  return Object.freeze({
    invitationPose: Object.freeze({ x, y, scale }),
    invitationBounds: Object.freeze({
      left: x - localWidth * scale / 2,
      right: x + localWidth * scale / 2,
      top: y - localHeight * scale / 2,
      bottom: y + localHeight * scale / 2,
    }),
    hear: Object.freeze({ ...UI_RECTS.letterHear }),
    continue: Object.freeze({ ...UI_RECTS.letterContinue }),
  });
}

function visibleCharacterBounds(state, cameraX) {
  return Object.freeze((state?.actors ?? []).map((actor) => characterLayoutBounds(actor, cameraX)));
}

function characterLayoutBounds(actor, cameraX) {
  const renderState = actor?.renderState ?? {};
  const authoredLocal = normalizeLocalLayoutBounds(renderState.layoutBounds);
  const local = authoredLocal ?? DEFAULT_ACTOR_LAYOUT_BOUNDS;
  const scale = authoredLocal
    ? 1
    : Number.isFinite(renderState.scale) ? Math.abs(renderState.scale) : 1;
  const x = renderState.x - cameraX;
  const y = renderState.y;
  return Object.freeze({
    id: actor.actorId,
    left: x + local.x * scale,
    right: x + (local.x + local.width) * scale,
    top: y + local.y * scale,
    bottom: y + (local.y + local.height) * scale,
  });
}

function normalizeLocalLayoutBounds(bounds) {
  if (!bounds || !Number.isFinite(bounds.width) || bounds.width <= 0) return null;
  if ([bounds.x, bounds.y, bounds.height].every(Number.isFinite) && bounds.height > 0) {
    return bounds;
  }
  if (Number.isFinite(bounds.height) && bounds.height > 0 && Number.isFinite(bounds.ground)) {
    return {
      x: -bounds.width / 2,
      y: -bounds.height,
      width: bounds.width,
      height: bounds.height + bounds.ground,
    };
  }
  return null;
}

function portraitAppearanceState(renderState) {
  if (!renderState) return Object.freeze({});
  const {
    x: _x,
    y: _y,
    scale: _scale,
    facing: _facing,
    pose: _pose,
    action: _action,
    actionProgress: _actionProgress,
    actionTime: _actionTime,
    layoutBounds: _layoutBounds,
    ...appearanceState
  } = renderState;
  return Object.freeze({ ...appearanceState });
}

function visibleObjectiveSceneryBounds(state, cameraX) {
  const bounds = (state?.targets ?? [])
    .filter((target) => target?.salience?.tier === 'thread' && target.hitArea)
    .map((target) => hitAreaLayoutBounds(target, cameraX))
    .filter(Boolean);
  return Object.freeze(bounds);
}

function hitAreaLayoutBounds(target, cameraX) {
  const hitArea = target.hitArea;
  if (hitArea.shape === 'rect') {
    return Object.freeze({
      id: `scenery:${target.id}`,
      left: hitArea.x - cameraX,
      right: hitArea.x - cameraX + hitArea.width,
      top: hitArea.y,
      bottom: hitArea.y + hitArea.height,
    });
  }
  const radius = hitArea.radius ?? hitArea.r;
  if (!Number.isFinite(radius)) return null;
  return Object.freeze({
    id: `scenery:${target.id}`,
    left: hitArea.x - cameraX - radius,
    right: hitArea.x - cameraX + radius,
    top: hitArea.y - radius,
    bottom: hitArea.y + radius,
  });
}

function validLayoutBounds(bounds) {
  return bounds
    && [bounds.left, bounds.right, bounds.top, bounds.bottom].every(Number.isFinite)
    && bounds.right > bounds.left
    && bounds.bottom > bounds.top;
}

function uniqueLayoutBounds(bounds) {
  const seen = new Set();
  return bounds.filter((entry) => {
    const key = `${entry.id ?? ''}:${entry.left}:${entry.right}:${entry.top}:${entry.bottom}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function boundsOverlapVerticalBand(bounds, y, height) {
  return bounds.bottom > y && bounds.top < y + height;
}

function dialogueSidePlacements(y, bandBounds) {
  const minLeft = Math.min(...bandBounds.map((bounds) => bounds.left));
  const maxRight = Math.max(...bandBounds.map((bounds) => bounds.right));
  const placements = [];
  const rightX = Math.max(
    DIALOGUE_FRAME.margin,
    maxRight + DIALOGUE_FRAME.speakerGap + DIALOGUE_FRAME.portraitOverhang,
  );
  const rightWidth = Math.min(
    DIALOGUE_FRAME.maximumWidth,
    WORLD.width - DIALOGUE_FRAME.margin - rightX,
  );
  if (rightWidth >= DIALOGUE_FRAME.minimumWidth) {
    placements.push({
      side: 'right',
      portraitSide: 'left',
      frame: { x: rightX, y, width: rightWidth, height: DIALOGUE_FRAME.height },
    });
  }

  const leftEdge = Math.min(
    WORLD.width - DIALOGUE_FRAME.margin,
    minLeft - DIALOGUE_FRAME.speakerGap - DIALOGUE_FRAME.portraitOverhang,
  );
  const leftWidth = Math.min(
    DIALOGUE_FRAME.maximumWidth,
    leftEdge - DIALOGUE_FRAME.margin,
  );
  if (leftWidth >= DIALOGUE_FRAME.minimumWidth) {
    placements.push({
      side: 'left',
      portraitSide: 'right',
      frame: {
        x: leftEdge - leftWidth,
        y,
        width: leftWidth,
        height: DIALOGUE_FRAME.height,
      },
    });
  }
  return placements;
}

function centeredDialoguePlacement(y, speakerCenter) {
  return {
    side: 'center',
    portraitSide: speakerCenter !== null && speakerCenter > WORLD.width / 2 ? 'right' : 'left',
    frame: {
      x: (WORLD.width - DIALOGUE_FRAME.maximumWidth) / 2,
      y,
      width: DIALOGUE_FRAME.maximumWidth,
      height: DIALOGUE_FRAME.height,
    },
  };
}

export function robePickerLayout(selectedTrim = 'purple') {
  const selected = normalizeRobeTrim(selectedTrim);
  const preview = Object.freeze({ x: 96, y: 84, width: 438, height: 548 });
  const previewGlass = Object.freeze(dressingMirrorGlassRect(preview));
  const previewCharacter = Object.freeze({ x: 315, y: 528, scale: 1.6 });
  const previewFigure = Object.freeze({
    x: previewCharacter.x + ROBE_PREVIEW_VIOLET_LOCAL_BOUNDS.x * previewCharacter.scale,
    y: previewCharacter.y + ROBE_PREVIEW_VIOLET_LOCAL_BOUNDS.y * previewCharacter.scale,
    width: ROBE_PREVIEW_VIOLET_LOCAL_BOUNDS.width * previewCharacter.scale,
    height: ROBE_PREVIEW_VIOLET_LOCAL_BOUNDS.height * previewCharacter.scale,
  });
  const swatches = ROBE_TRIMS.map((trim, index) => {
    const column = index % 6;
    const row = Math.floor(index / 6);
    return Object.freeze({
      ...trim,
      selected: trim.id === selected,
      rect: Object.freeze({
        x: 602 + column * 100,
        y: 190 + row * 148,
        width: 88,
        height: 116,
      }),
    });
  });
  return Object.freeze({
    selectedTrim: selected,
    preview,
    previewGlass,
    previewCharacter,
    previewFigure,
    swatches: Object.freeze(swatches),
    confirm: UI_RECTS.robeConfirm,
  });
}

export function titleForegroundLayout(presentation) {
  const masthead = presentation?.safeAreas?.masthead;
  const envelope = presentation?.safeAreas?.envelope;
  if (!masthead || !envelope) {
    throw new TypeError('titleForegroundLayout requires the storybook title safe areas.');
  }
  return Object.freeze({
    masthead,
    action: Object.freeze({ ...envelope }),
  });
}

export function objectiveOverlayLayout() {
  return Object.freeze({
    panel: Object.freeze({ x: 160, y: 8, width: 960, height: 300 }),
    compass: Object.freeze({ x: 220, y: 48, width: 200, height: 200 }),
    caption: Object.freeze({ x: 470, y: 68, width: 500, height: 145 }),
  });
}

export function chapterCardLayout() {
  return Object.freeze({
    panel: Object.freeze({ x: 156, y: 82, width: 968, height: 550 }),
    ticket: Object.freeze({ x: 218, y: 136, width: 844, height: 320 }),
    illustration: Object.freeze({ x: 246, y: 168, width: 260, height: 250 }),
    title: Object.freeze({ x: 520, y: 184, width: 492, height: 224 }),
    action: Object.freeze({ x: 425, y: 506, width: 430, height: 91 }),
  });
}

export function dialogueChoiceLayout(count) {
  const safeCount = Math.max(1, Math.min(4, Number.isInteger(count) ? count : 1));
  const gap = 30;
  const width = Math.min(286, (980 - (safeCount - 1) * gap) / safeCount);
  const height = 262;
  const total = safeCount * width + (safeCount - 1) * gap;
  const startX = (WORLD.width - total) / 2;
  return Object.freeze(Array.from({ length: safeCount }, (_, index) => Object.freeze({
    x: startX + index * (width + gap),
    y: 202,
    width,
    height,
  })));
}

export function albumCardLayout(entry) {
  const rect = entry?.__rect;
  if (!rect) throw new TypeError('albumCardLayout requires an album entry with a card rectangle.');
  const sidePadding = Math.max(22, rect.width * 0.09);
  const portraitTop = Math.max(24, rect.height * 0.07);
  const nameplateHeight = Math.min(58, rect.height * 0.15);
  const nameplateBottom = Math.max(22, rect.height * 0.065);
  const nameplateSide = Math.max(28, rect.width * 0.13);
  return Object.freeze({
    card: Object.freeze({ ...rect }),
    portrait: Object.freeze({
      x: rect.x + sidePadding,
      y: rect.y + portraitTop,
      width: rect.width - sidePadding * 2,
      height: Math.min(226, rect.height - portraitTop - nameplateHeight - nameplateBottom - 34),
    }),
    nameplate: Object.freeze({
      x: rect.x + nameplateSide,
      y: rect.y + rect.height - nameplateBottom - nameplateHeight,
      width: rect.width - nameplateSide * 2,
      height: nameplateHeight,
    }),
  });
}

export function yearbookLayout(count, index = 0) {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 0;
  const safeIndex = safeCount > 0
    ? Math.max(0, Math.min(safeCount - 1, Number.isInteger(index) ? index : 0))
    : 0;
  return Object.freeze({
    safeIndex,
    spread: Object.freeze({ x: 72, y: 32, width: 1136, height: 652 }),
    close: Object.freeze({ ...UI_RECTS.close }),
    photoMount: Object.freeze({ x: 286, y: 140, width: 708, height: 410 }),
    photo: Object.freeze({ x: 304, y: 158, width: 672, height: 378 }),
    caption: Object.freeze({ x: 405, y: 542, width: 470, height: 54 }),
    pageMarks: Object.freeze({ x: 430, y: 607, width: 420, height: 40 }),
    empty: Object.freeze({ x: 360, y: 176, width: 560, height: 344 }),
    previous: Object.freeze({ ...UI_RECTS.yearbookPrevious }),
    next: Object.freeze({ ...UI_RECTS.yearbookNext }),
  });
}

function requireCharacterRenderer(characterRenderer) {
  if (!characterRenderer || typeof characterRenderer.draw !== 'function') {
    throw new TypeError('UIRenderer requires an injected character renderer with draw().');
  }
  return characterRenderer;
}

function requirePortraitCharacterId(characterId) {
  if (typeof characterId !== 'string' || !characterId.startsWith('character.')) {
    throw new TypeError('Dialogue lines require an exact portraitCharacterId.');
  }
  return characterId;
}

function normalizePortraitPose(pose) {
  if (pose === undefined || pose === 'talk') return 'speaking';
  return pose;
}

export class UIRenderer {
  constructor({
    resolveAsset = () => null,
    characterRenderer,
    mapRenderer = new IllustratedMapRenderer(),
    titleRenderer = null,
  } = {}) {
    this.resolveAsset = resolveAsset;
    this.characterRenderer = requireCharacterRenderer(characterRenderer);
    this.mapRenderer = mapRenderer;
    this.titleRenderer = titleRenderer ?? new StorybookTitleRenderer({
      characterRenderer: this.characterRenderer,
    });
    this.images = new Map();
    this.failedImages = new Set();
    this.yearbookImages = new Map();
  }

  drawReviewScene(context, scene, time = 0, { reducedMotion = false } = {}) {
    if (!UI_REVIEW_SCENES.includes(scene)) return false;
    context.fillStyle = scene === 'ui-dialogue-night-review'
      ? nightDialogueGradient(context)
      : storyGradient(context);
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    if (scene === 'ui-letter-reading-review') {
      this.drawLetterReading(context);
    } else if (scene === 'ui-dialogue-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.guide', speakerLabel: 'Hagrid',
        portraitCharacterId: 'character.hagrid', portraitPose: 'talk',
        caption: 'This way!', text: 'Come along, Violet. Diagon Alley is waiting for you.',
      };
      const guide = {
        actorId: 'npc.guide',
        characterId: 'character.hagrid',
        depth: 665,
        renderState: { x: 220, y: 665, facing: 'right', pose: 'speaking' },
      };
      this.characterRenderer.draw(context, {
        characterId: guide.characterId,
        surface: 'world',
        ...guide.renderState,
      }, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, actors: [guide], cameraX: 0, roomVariant: 'base' }),
      );
    } else if (scene === 'ui-dialogue-night-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.wandmaker', speakerLabel: 'Wandmaker',
        portraitCharacterId: 'character.wandmaker', portraitPose: 'speaking',
        caption: 'Your wand!', text: 'Curious… this wand has been waiting for you.',
      };
      const wandmaker = {
        actorId: 'npc.wandmaker',
        characterId: 'character.wandmaker',
        depth: 665,
        renderState: { x: 1040, y: 665, facing: 'left', pose: 'speaking' },
      };
      this.characterRenderer.draw(context, {
        characterId: wandmaker.characterId,
        surface: 'world',
        ...wandmaker.renderState,
      }, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, actors: [wandmaker], cameraX: 0, roomVariant: 'dusk' }),
      );
    } else if (scene === 'ui-dialogue-center-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.narrator', speakerLabel: 'Narrator',
        portraitCharacterId: 'character.narrator', portraitPose: 'speaking',
        caption: 'Spells come later!', text: 'Violet will learn spells when the time is right.',
      };
      const player = {
        actorId: 'npc.violet',
        characterId: 'character.violet',
        depth: 665,
        renderState: {
          x: 640, y: 665, facing: 'right', pose: 'curious', appearance: 'casual', wand: true,
        },
      };
      this.characterRenderer.draw(context, {
        characterId: player.characterId,
        surface: 'world',
        ...player.renderState,
      }, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, actors: [player], cameraX: 0, roomVariant: 'base' }),
      );
    } else if (scene === 'ui-robe-picker-review') {
      this.drawRobePicker(context, {
        overlay: { surface: 'robe-picker', selectedTrim: 'gold' },
      }, time, reducedMotion);
    } else if (scene === 'ui-satchel-map-early-review') {
      this.drawSatchel(context, {
        overlay: { surface: 'satchel', tab: 'map' },
        roomId: chapter1Map.locations[0].to.room,
        unlockedRooms: chapter1Map.locations.slice(1, 2).map(({ to }) => to.room),
        objective: {
          mapStar: {
            room: chapter1Map.locations[0].to.room,
            hotspot: 'street.ollivandersDoor',
          },
        },
        affordances: {
          quiet: false,
          worldSuppressed: true,
          thread: {
            targetId: 'street.ollivandersDoor',
            worldTargetId: 'street.ollivandersDoor',
            mapTargetId: 'street.ollivandersDoor',
            channel: 'world',
            intensity: 'normal',
          },
        },
        cards: [],
      }, [], { time, reducedMotion });
    } else if (scene === 'ui-satchel-map-review') {
      this.drawSatchel(context, {
        overlay: { surface: 'satchel', tab: 'map' },
        roomId: chapter1Map.locations[0].to.room,
        unlockedRooms: chapter1Map.locations.slice(1).map(({ to }) => to.room),
        objective: {
          mapStar: {
            room: chapter1Map.locations[0].to.room,
            hotspot: 'street.menagerieDoor',
          },
        },
        affordances: {
          quiet: false,
          worldSuppressed: true,
          thread: {
            targetId: 'street.menagerieDoor',
            worldTargetId: 'street.menagerieDoor',
            mapTargetId: 'street.menagerieDoor',
            channel: 'world',
            intensity: 'normal',
          },
        },
        cards: [],
      }, [], { time, reducedMotion });
    } else if (
      scene === 'ui-satchel-cards-review'
      || scene === 'ui-satchel-ch2-cards-review'
      || scene === 'ui-satchel-ch3-cards-review'
    ) {
      const cardsByScene = {
        'ui-satchel-cards-review': ['morgana', 'dumbledore'],
        'ui-satchel-ch2-cards-review': ['morgana', 'dumbledore', 'merlin'],
        'ui-satchel-ch3-cards-review': ['morgana', 'dumbledore', 'merlin', 'jocunda-sykes'],
      };
      this.drawSatchel(context, {
        overlay: { surface: 'satchel', tab: 'cards' },
        cards: cardsByScene[scene],
      }, [
        { id: 'morgana', name: 'Morgana', portraitAsset: 'cards/morgana/portrait' },
        { id: 'dumbledore', name: 'Dumbledore', portraitAsset: 'cards/dumbledore/portrait' },
        { id: 'merlin', name: 'Merlin', portraitAsset: 'cards/merlin/portrait' },
        { id: 'jocunda-sykes', name: 'Jocunda Sykes', portraitAsset: 'cards/jocunda-sykes/portrait' },
      ], {
        map: scene === 'ui-satchel-cards-review' ? chapter1Map : null,
      });
    } else {
      this.drawChapterCard(context, {
        title: 'Platform Nine and Three-Quarters',
        buttonLabel: 'Continue',
      }, time, { reducedMotion });
    }
    return true;
  }

  drawHud(context, state, time, reducedMotion = false) {
    if (state.overlay || state.dialogue || state.selection || state.screen !== 'playing') return;
    const animationTime = reducedMotion ? 0 : time;
    drawQuestButton(
      context,
      UI_RECTS.quest,
      animationTime,
      Boolean(state.newObjective) && !reducedMotion,
      {
        baseImage: this.imageFor('ui/hud/quest-compass-base'),
        needleImage: this.imageFor('ui/hud/quest-compass-needle'),
      },
    );
    if (state.hasSatchel) {
      drawSatchelButton(
        context,
        UI_RECTS.satchel,
        this.imageFor('ui/hud/satchel-closed'),
      );
      drawAffordancePresentation(
        context,
        hudGoldenThreadPresentation(state, time, { reducedMotion }),
      );
    }
    if (state.hasWand) {
      drawWandButton(context, UI_RECTS.wand, true, animationTime, {
        holsterImage: this.imageFor('ui/hud/wand-holster'),
        wandImage: this.imageFor('ui/hud/wands/violet-first-wand'),
      });
    }
    return Object.freeze({
      quest: true,
      satchel: Boolean(state.hasSatchel),
      wand: Boolean(state.hasWand),
    });
  }

  drawDialogue(context, dialogue, time, muted = false, reducedMotion = false, scene = {}) {
    if (!dialogue) return;
    const isChoice = dialogue.type === 'choice' && dialogue.choices?.length;
    context.fillStyle = isChoice
      ? 'rgba(20,17,38,0.56)'
      : scene.night
        ? 'rgba(13,10,24,0.1)'
        : 'rgba(20,17,38,0.14)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    if (isChoice) {
      this.drawChoices(context, dialogue.choices, time, reducedMotion);
      return null;
    }
    const portraitCharacterId = requirePortraitCharacterId(dialogue.portraitCharacterId);
    const layout = dialogueScrollLayout(scene);
    const { frame, portrait, captionRect, replayRect, advanceRect } = layout;
    const animationTime = reducedMotion ? 0 : time;
    context.save();
    drawDialogueScroll(context, frame, {
      night: Boolean(scene.night),
      portraitSide: layout.portraitSide,
    });

    this.characterRenderer.draw(context, {
      ...scene.portraitRenderState,
      characterId: portraitCharacterId,
      surface: 'portrait',
      pose: normalizePortraitPose(dialogue.portraitPose),
      x: portrait.x,
      y: portrait.y,
      scale: portrait.scale,
      lightSide: scene.lightSide,
      reducedMotion,
    }, animationTime);

    drawDialogueCaption(
      context,
      captionRect,
      childFacingUiText(dialogue.caption, 'caption'),
      Boolean(scene.night),
    );

    const pulse = reducedMotion ? 1 : 1 + Math.sin(animationTime * 4) * 0.08;
    drawDialogueReplayControl(context, replayRect, Boolean(scene.night));
    drawDialogueAdvanceControl(context, advanceRect, pulse, Boolean(scene.night));
    context.restore();

    if (dialogue.choices?.length) this.drawChoices(context, dialogue.choices);
    return layout;
  }

  drawLetterReading(context) {
    const layout = letterReadingLayout();
    context.fillStyle = 'rgba(20,17,38,0.66)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawReadableInvitation(context, layout.invitationPose);
    drawParchmentAction(context, layout.hear, {
      label: childFacingUiText('Hear the letter', 'action'),
      icon: vectorControlIcon('speaker'),
      selected: true,
    });
    drawParchmentAction(context, layout.continue, {
      label: childFacingUiText('Let’s go!', 'action'),
      icon: vectorControlIcon('check'),
      selected: true,
    });
    return layout;
  }

  drawRobePicker(context, state, time = 0, reducedMotion = false) {
    const layout = robePickerLayout(state?.overlay?.selectedTrim);
    const animationTime = reducedMotion ? 0 : time;
    context.fillStyle = 'rgba(20,17,38,0.78)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawDeckledParchment(context, { x: 48, y: 28, width: 1184, height: 664 }, {
      fill: '#e5d0a6',
      edge: '#7b5536',
      ornament: false,
    });
    drawDressingMirror(context, layout.preview, animationTime, reducedMotion);
    this.characterRenderer.draw(context, {
      characterId: 'character.violet',
      surface: 'world',
      ...layout.previewCharacter,
      facing: 'right',
      pose: 'wonder',
      appearance: 'robes',
      wand: false,
      robeTrim: robeTrimColor(layout.selectedTrim),
    }, animationTime);

    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.font = '700 38px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(childFacingUiText('Choose a colour', 'caption'), 888, 124);

    for (let index = 0; index < layout.swatches.length; index += 1) {
      drawFabricSwatch(context, layout.swatches[index], index);
    }
    drawParchmentAction(context, layout.confirm, {
      label: childFacingUiText('That one!', 'action'),
      icon: vectorControlIcon('check'),
      selected: true,
    });
    return layout;
  }

  drawResumeRecap(context, recap, time, muted = false, reducedMotion = false, scene = {}) {
    return this.drawDialogue(context, {
      portraitCharacterId: 'character.narrator',
      speakerLabel: 'Story so far',
      caption: recap.caption,
      text: recap.text,
    }, time, muted, reducedMotion, scene);
  }

  drawChoices(context, choices, time = 0, reducedMotion = false) {
    const layout = dialogueChoiceLayout(choices.length);
    const animationTime = reducedMotion ? 0 : time;
    const choiceTagImage = this.imageFor(CHOICE_IMAGE_KEYS[0]);
    choices.forEach((choice, index) => {
      const rect = layout[index];
      choice.__rect = rect;
      drawIllustratedChoiceTag(context, rect, index, choice.icon, choiceTagImage);
      if (typeof choice.characterId === 'string' && choice.characterId.length > 0) {
        this.characterRenderer.draw(context, {
          characterId: choice.characterId,
          surface: 'world',
          x: rect.x + rect.width / 2,
          y: rect.y + 178,
          scale: Number.isFinite(choice.characterScale) ? choice.characterScale : 0.82,
          ...(choice.characterAppearance ? { appearance: choice.characterAppearance } : {}),
          pose: choice.characterPose ?? 'idle',
          facing: 'right',
          reducedMotion,
        }, animationTime);
      } else {
        drawChoiceEmblem(context, rect, choice.icon, choiceAccent(choice.icon, index));
      }
      context.fillStyle = '#382a24';
      context.textAlign = 'center';
      context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
      fitText(
        context,
        childFacingUiText(choice.caption, 'caption'),
        rect.x + rect.width / 2,
        rect.y + rect.height - 24,
        rect.width - 34,
      );
    });
    return layout;
  }

  drawSatchel(context, state, cardDefinitions = [], {
    map = chapter1Map,
    parentGateProgress = 0,
    time = 0,
    reducedMotion = false,
  } = {}) {
    const activeTab = state.overlay?.tab === 'cards' || !map ? 'cards' : 'map';
    const spreadImage = this.imageFor('ui/satchel/spread-v2');
    const paintedSpread = Boolean(spreadImage?.complete && spreadImage.naturalWidth > 0);
    if (paintedSpread) context.drawImage(spreadImage, 0, 0, WORLD.width, WORLD.height);
    else {
      drawStorybookSpread(context, { x: 72, y: 32, width: 1136, height: 652 }, {
        title: '',
        cornerFlourishes: false,
      });
    }
    drawSatchelOwnerMark(context);

    const content = activeTab === 'cards'
      ? this.drawCardAlbumContent(context, state, cardDefinitions)
      : this.drawMapContent(context, state, time, { map, reducedMotion, paintedSpread });

    drawSatchelPageHeading(
      context,
      activeTab === 'map'
        ? childFacingUiText('Choose a place', 'caption')
        : childFacingUiText('Magic cards', 'caption'),
    );

    // Navigation stays together at the top. Lower-frequency utilities sit on
    // the book's bottom edge, outside the travel and keepsake content.
    if (map) {
      drawSatchelTab(
        context,
        UI_RECTS.satchelMapTab,
        this.imageFor('ui/satchel/map-tab'),
        childFacingUiText('Map', 'caption'),
        activeTab === 'map',
      );
    }
    drawSatchelTab(
      context,
      map ? UI_RECTS.satchelCardsTab : UI_RECTS.satchelCardsOnlyTab,
      this.imageFor('ui/satchel/cards-tab'),
      childFacingUiText('Cards', 'caption'),
      activeTab === 'cards',
    );
    drawSatchelGrownUpsControl(
      context,
      UI_RECTS.satchelKeyhole,
      this.imageFor('ui/satchel/grown-ups'),
      parentGateProgress,
    );
    drawSatchelStartFreshControl(
      context,
      UI_RECTS.satchelStartOver,
      this.imageFor('ui/satchel/start-fresh'),
    );
    drawSatchelClose(
      context,
      UI_RECTS.satchelClose,
      this.imageFor('ui/satchel/close-seal'),
    );
    return content;
  }

  drawMap(context, state) {
    return this.drawSatchel(context, state, []);
  }

  drawMapContent(context, state, time = 0, {
    map = chapter1Map,
    reducedMotion = false,
    paintedSpread = false,
  } = {}) {
    const mapState = buildMapState(map, state);
    return this.mapRenderer.draw(context, mapState, state, time, {
      reducedMotion,
      imageFor: (key) => this.imageFor(key),
      showParchmentField: !paintedSpread,
    });
  }

  mapPresentation(state, time = 0, {
    map = chapter1Map,
    reducedMotion = false,
  } = {}) {
    return createIllustratedMapPresentation(
      buildMapState(map, state),
      state,
      time,
      { reducedMotion },
    );
  }

  drawCardAlbumContent(context, state, cardDefinitions) {
    const entries = buildCardAlbumEntries(cardDefinitions, state.cards ?? []);
    if (entries.length === 0) drawEmptyAlbumPocket(context);
    else for (const entry of entries) this.drawAlbumCard(context, entry);
    state.__cardSlots = entries;
    return entries;
  }

  drawAlbumCard(context, entry) {
    const layout = albumCardLayout(entry);
    const phase = keepsakePhase(entry.id);
    const frameImage = this.imageFor('ui/satchel/card-frame-v2');
    const pocketImage = this.imageFor('ui/satchel/card-pocket-v2');
    const paintedFrame = Boolean(frameImage?.complete && frameImage.naturalWidth > 0);
    const paintedPocket = Boolean(pocketImage?.complete && pocketImage.naturalWidth > 0);
    context.save();
    if (entry.earned && paintedFrame) {
      const image = this.imageFor(entry.portraitAsset);
      if (image?.complete && image.naturalWidth > 0) {
        drawOrganicCoverImage(context, image, layout.portrait, phase);
      } else drawDevelopingPhoto(context, layout.portrait, phase);
      context.drawImage(
        frameImage,
        layout.card.x,
        layout.card.y,
        layout.card.width,
        layout.card.height,
      );
      drawPaintedKeepsakeName(
        context,
        layout.nameplate,
        childFacingUiText(entry.name, 'proper-name'),
      );
      context.restore();
      return layout;
    }
    if (!entry.earned && paintedPocket) {
      context.drawImage(
        pocketImage,
        layout.card.x,
        layout.card.y,
        layout.card.width,
        layout.card.height,
      );
      context.restore();
      return layout;
    }
    drawKeepsakeCard(context, layout.card, entry.earned, phase);
    if (entry.earned) {
      drawKeepsakePhotoMount(context, layout.portrait, phase);
      const image = this.imageFor(entry.portraitAsset);
      if (image?.complete && image.naturalWidth > 0) {
        drawOrganicCoverImage(context, image, layout.portrait, phase);
      } else drawDevelopingPhoto(context, layout.portrait, phase);
      drawKeepsakePhotoCorners(context, layout.portrait, phase);
      drawKeepsakeNameplate(
        context,
        layout.nameplate,
        childFacingUiText(entry.name, 'proper-name'),
        phase,
      );
    } else drawClosedKeepsakePocket(context, layout, phase);
    drawKeepsakeStitches(context, layout.card, entry.earned, phase);
    context.restore();
    return layout;
  }

  imageFor(key) {
    if (!key || this.failedImages.has(key) || typeof Image === 'undefined') return null;
    if (this.images.has(key)) return this.images.get(key);
    const path = this.resolveAsset(key);
    if (!path) {
      this.failedImages.add(key);
      return null;
    }
    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => {
      this.images.delete(key);
      this.failedImages.add(key);
    };
    this.images.set(key, image);
    image.src = path;
    return image;
  }

  async preloadUiImages({
    title = true,
    hud = true,
    satchel = true,
    choices = satchel,
  } = {}) {
    const keys = new Set([
      ...(title ? TITLE_IMAGE_KEYS : []),
      ...(hud ? HUD_IMAGE_KEYS : []),
      ...(satchel ? SATCHEL_IMAGE_KEYS : []),
      ...(choices ? CHOICE_IMAGE_KEYS : []),
    ]);
    await Promise.all([...keys].map(async (key) => {
      const image = this.imageFor(key);
      if (!image) return;
      if (typeof image.decode === 'function') {
        try {
          await image.decode();
        } catch {
          // The renderer retains its vector fallback when a UI image cannot decode.
        }
        return;
      }
      if (image.complete) return;
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  drawSelection(context, selection) {
    drawStorybookSpread(context, { x: 72, y: 32, width: 1136, height: 652 }, {
      title: childFacingUiText(selection.title, 'caption'),
    });
    const count = selection.options.length;
    const width = Math.min(248, (940 - (count - 1) * 26) / count);
    const total = count * width + (count - 1) * 26;
    const x = (WORLD.width - total) / 2;
    selection.options.forEach((option, index) => {
      const rect = { x: x + index * (width + 26), y: 273, width, height: 244 };
      option.__rect = rect;
      drawIllustratedChoiceTag(context, rect, index, option.icon);
      drawChoiceEmblem(context, rect, option.icon, option.color ?? '#6e4b68');
      context.textAlign = 'center';
      context.fillStyle = '#382a24';
      context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
      fitText(
        context,
        childFacingUiText(option.label, 'caption'),
        rect.x + width / 2,
        rect.y + 189,
        width - 28,
      );
    });
    drawClose(context);
    return selection.options.map(({ __rect }) => __rect);
  }

  drawObjective(context, objective, time = 0, { reducedMotion = false } = {}) {
    const layout = objectiveOverlayLayout();
    context.fillStyle = 'rgba(20,17,38,0.28)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    const reminderImage = this.imageFor('ui/objective/reminder-v2');
    if (
      reminderImage?.complete
      && reminderImage.naturalWidth > 0
      && reminderImage.naturalHeight > 0
    ) {
      context.drawImage(
        reminderImage,
        layout.panel.x,
        layout.panel.y,
        layout.panel.width,
        layout.panel.height,
      );
    } else {
      drawDeckledParchment(context, layout.panel, { ornament: false });
    }
    drawCompassQuest(context, layout.compass, reducedMotion ? 0 : time, {
      pulse: !reducedMotion,
      baseImage: this.imageFor('ui/hud/quest-compass-base'),
      needleImage: this.imageFor('ui/hud/quest-compass-needle'),
    });
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 48px "Andika", "Trebuchet MS", sans-serif';
    fitText(
      context,
      childFacingUiText(objective?.caption ?? 'Explore!', 'caption'),
      layout.caption.x + layout.caption.width / 2,
      layout.caption.y + layout.caption.height * 0.62,
      layout.caption.width,
    );
    drawSatchelClose(
      context,
      UI_RECTS.close,
      this.imageFor('ui/satchel/close-seal'),
    );
    return layout;
  }

  drawChapterCard(context, card, time, { paintedBackground = false, reducedMotion = false } = {}) {
    if (!paintedBackground) {
      context.fillStyle = storyGradient(context);
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    } else {
      context.fillStyle = 'rgba(20,17,38,0.36)';
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    const layout = chapterCardLayout();
    const animationTime = reducedMotion ? 0 : time;
    drawDeckledParchment(context, layout.panel, { fill: '#efe0bd', ornament: false });
    drawPlatformTicket(context, layout.ticket, layout.illustration, animationTime, { reducedMotion });
    context.fillStyle = '#382a24';
    context.font = '700 56px "Andika", "Trebuchet MS", sans-serif';
    wrapText(
      context,
      childFacingUiText(card?.title ?? 'Platform Nine and Three-Quarters', 'proper-name'),
      layout.title.x,
      layout.title.y + 68,
      layout.title.width,
      64,
      3,
      'center',
    );
    if (card?.buttonLabel !== null) {
      drawChapterAction(
        context,
        childFacingUiText(card?.buttonLabel ?? 'Continue', 'action'),
        layout.action,
      );
    }
    return layout;
  }

  drawTitle(context, time, hasSave, reducedMotion = false) {
    const animationTime = reducedMotion ? 0 : time;
    const presentation = this.titleRenderer.draw(context, animationTime, {
      backgroundImage: this.imageFor('ui/title/backdrop-v2'),
      reducedMotion,
    });
    const layout = titleForegroundLayout(presentation);
    drawTitleMasthead(context, layout.masthead);
    drawInvitationButton(context, childFacingUiText(
      hasSave ? 'Return to Hogwarts' : 'Open Violet’s letter',
      'action',
    ), layout.action, {
      largeSeal: true,
      time: animationTime,
      image: this.imageFor('ui/title/return-envelope-v2'),
    });
    return presentation;
  }

  drawDebugReset(context) {
    const rect = UI_RECTS.debugReset;
    context.save();
    context.globalAlpha = 0.94;
    context.fillStyle = '#4d2430';
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 24);
    context.fill();
    context.strokeStyle = '#f0d58d';
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = '#fff8e8';
    context.textAlign = 'center';
    context.font = '700 26px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(
      childFacingUiText('Start fresh', 'action'),
      rect.x + rect.width / 2,
      rect.y + rect.height / 2 + 9,
    );
    context.restore();
  }

  drawReplayExit(context) {
    drawReplayRibbon(
      context,
      UI_RECTS.replayExit,
      childFacingUiText('Return', 'action'),
    );
  }

  drawParentPanel(context, model) {
    const page = model.overlay?.page ?? 'play';
    if (page === 'confirm-start-over' || page === 'confirm-restore') {
      this.drawParentConfirmation(context, model, page);
      return;
    }

    drawStorybookSpread(context, { x: 72, y: 32, width: 1136, height: 652 }, {
      title: 'The Grown-up Book',
      subtitle: model.replayMode ? 'Chapter replay — Violet’s saved adventure is safe.' : 'Settings and keepsakes for Violet’s adventure.',
    });
    drawRibbonTab(context, UI_RECTS.parentPlayTab, 'Play', { icon: vectorControlIcon('owl'), active: page === 'play' });
    drawRibbonTab(context, UI_RECTS.parentSettingsTab, 'Sound & feel', { icon: vectorControlIcon('speaker'), active: page === 'settings' });
    drawRibbonTab(context, UI_RECTS.parentSaveTab, 'Save', { icon: vectorControlIcon('cards'), active: page === 'save' });

    if (page === 'settings') this.drawParentSettings(context, model);
    else if (page === 'save') this.drawParentSave(context, model);
    else this.drawParentPlay(context, model);
    drawPanelNotice(context, model.overlay?.notice);
    drawClose(context);
  }

  drawParentPlay(context, model) {
    drawParchmentAction(context, UI_RECTS.parentReplay, {
      label: model.replayMode
        ? 'Return to saved game'
        : model.replayChapterLabel ? `Replay ${model.replayChapterLabel}` : 'Replay a chapter',
      detail: model.replayMode
        ? 'Leave this practice adventure'
        : model.replayChapterDetail ?? 'Unlocks after a chapter is finished',
      icon: vectorControlIcon('replay'),
      disabled: !model.replayMode && !model.replayChapterId,
    });
    drawParchmentAction(context, UI_RECTS.parentYearbook, {
      label: 'Violet’s Yearbook',
      detail: model.yearbookCount === 1 ? '1 magical memory' : `${model.yearbookCount} magical memories`,
      icon: vectorControlIcon('cards'),
    });

    context.fillStyle = '#685240';
    context.textAlign = 'center';
    context.font = '23px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(
      model.replayMode
        ? 'Nothing Violet does in replay changes her real save.'
        : 'Finished chapters can be enjoyed again without changing Violet’s progress.',
      WORLD.width / 2,
      456,
    );
  }

  drawParentSettings(context, model) {
    const volumes = model.settings.volumes;
    drawStepper(context, {
      label: 'Everything', valueLabel: `${Math.round(volumes.master * 100)}%`,
      minusRect: UI_RECTS.parentMasterMinus, plusRect: UI_RECTS.parentMasterPlus,
    });
    drawStepper(context, {
      label: 'Voices', valueLabel: `${Math.round(volumes.voice * 100)}%`,
      minusRect: UI_RECTS.parentVoiceMinus, plusRect: UI_RECTS.parentVoicePlus,
    });
    drawStepper(context, {
      label: 'Music', valueLabel: `${Math.round(volumes.music * 100)}%`,
      minusRect: UI_RECTS.parentMusicMinus, plusRect: UI_RECTS.parentMusicPlus,
    });
    drawStepper(context, {
      label: 'Effects', valueLabel: `${Math.round(volumes.sfx * 100)}%`,
      minusRect: UI_RECTS.parentSfxMinus, plusRect: UI_RECTS.parentSfxPlus,
    });
    drawParchmentAction(context, UI_RECTS.parentMute, {
      label: model.settings.muted ? 'Sound is off' : 'Sound is on',
      icon: vectorControlIcon(model.settings.muted ? 'close' : 'speaker'),
      selected: model.settings.muted,
      compact: true,
    });
    drawParchmentAction(context, UI_RECTS.parentReducedMotion, {
      label: model.systemReducedMotion && !model.settings.reducedMotion
        ? 'Gentler (device)'
        : model.effectiveReducedMotion ? 'Gentler movement' : 'Full movement',
      icon: vectorControlIcon(model.effectiveReducedMotion ? 'owl' : 'star'),
      selected: model.effectiveReducedMotion,
      compact: true,
    });

    context.fillStyle = '#574337';
    context.textAlign = 'left';
    context.font = '700 23px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Learning magic', 148, 620);
    for (const [level, label, rect] of [
      ['off', 'Off', UI_RECTS.parentLearningOff],
      ['gentle', 'Gentle', UI_RECTS.parentLearningGentle],
      ['stretchy', 'Stretchy', UI_RECTS.parentLearningStretchy],
    ]) {
      drawParchmentAction(context, rect, {
        label,
        icon: vectorControlIcon(level === 'off' ? 'close' : level === 'gentle' ? 'owl' : 'star'),
        selected: model.settings.learning === level,
        compact: true,
      });
    }
  }

  drawParentSave(context, model) {
    drawParchmentAction(context, UI_RECTS.parentExport, {
      label: 'Export Violet’s save', detail: 'Copy it to another device', icon: vectorControlIcon('quill'),
    });
    drawParchmentAction(context, UI_RECTS.parentImport, {
      label: 'Import a save', detail: 'Bring Violet’s adventure here', icon: vectorControlIcon('satchel'),
    });
    drawParchmentAction(context, UI_RECTS.parentRestore, {
      label: 'Recover backup', detail: 'Use the safety copy on this device', icon: vectorControlIcon('replay'),
    });
    drawParchmentAction(context, UI_RECTS.parentStartOver, {
      label: 'Start over', detail: 'Keeps sound and learning settings', icon: vectorControlIcon('close'), danger: true,
    });
  }

  drawParentConfirmation(context, model, page) {
    const startOver = page === 'confirm-start-over';
    drawStorybookSpread(context, { x: 150, y: 82, width: 980, height: 555 }, {
      title: startOver ? 'Start Violet’s story over?' : 'Recover the backup?',
      subtitle: startOver
        ? 'Her current story progress and yearbook will be cleared.'
        : 'The current adventure will be replaced by the safety copy.',
    });

    drawWaxMedallion(context, WORLD.width / 2, 335, 62, vectorControlIcon(startOver ? 'close' : 'replay'), { danger: startOver });
    context.fillStyle = '#5e4939';
    context.textAlign = 'center';
    context.font = '25px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(
      startOver ? 'Sound, movement, and learning choices will stay the same.' : 'You can cancel and keep the current adventure.',
      WORLD.width / 2,
      420,
    );
    drawParchmentAction(context, UI_RECTS.parentCancelConfirm, {
      label: 'No, go back', icon: vectorControlIcon('replay'),
    });
    drawParchmentAction(context, UI_RECTS.parentAcceptConfirm, {
      label: startOver ? 'Yes, start over' : 'Use the backup',
      icon: vectorControlIcon(startOver ? 'close' : 'replay'),
      danger: startOver,
    });
    drawPanelNotice(context, model.overlay?.notice);
  }

  drawYearbook(context, entries, index = 0) {
    const layout = yearbookLayout(entries.length, index);
    drawStorybookSpread(context, layout.spread, {
      title: childFacingUiText('Violet’s Yearbook', 'proper-name'),
    });
    drawClose(context);

    if (entries.length === 0) {
      drawEmptyYearbookPage(context, layout.empty);
      return layout;
    }

    const entry = entries[layout.safeIndex];
    const phase = keepsakePhase(entry.id);
    context.save();
    drawYearbookPhotoMount(context, layout.photoMount, phase);
    const image = this.yearbookImageFor(entry);
    if (image?.complete && image.naturalWidth > 0) {
      drawOrganicCoverImage(context, image, layout.photo, phase);
    } else drawDevelopingPhoto(context, layout.photo, phase);
    drawYearbookPhotoCorners(context, layout.photo, phase);
    drawYearbookCaption(
      context,
      layout.caption,
      childFacingUiText(entry.caption, 'caption'),
      phase,
    );
    if (entries.length > 1) {
      drawYearbookPageDots(context, entries.length, layout.safeIndex, layout.pageMarks);
      drawYearbookTurnControl(
        context,
        layout.previous,
        'previous',
        childFacingUiText('Back', 'action'),
      );
      drawYearbookTurnControl(
        context,
        layout.next,
        'next',
        childFacingUiText('Next', 'action'),
      );
    }
    context.restore();
    return layout;
  }

  yearbookImageFor(entry) {
    if (!entry?.id || !entry.dataUrl || typeof Image === 'undefined') return null;
    const cached = this.yearbookImages.get(entry.id);
    if (cached?.src === entry.dataUrl) return cached;
    const image = new Image();
    image.decoding = 'async';
    image.src = entry.dataUrl;
    this.yearbookImages.set(entry.id, image);
    return image;
  }
}

export function drawYearbookPageDots(
  context,
  count,
  activeIndex,
  area = yearbookLayout(count, activeIndex).pageMarks,
) {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 0;
  if (safeCount === 0) return;
  const safeIndex = Math.max(0, Math.min(safeCount - 1, Number.isInteger(activeIndex) ? activeIndex : 0));
  const spacing = safeCount > 1 ? Math.min(34, area.width / (safeCount - 1)) : 0;
  const startX = area.x + area.width / 2 - ((safeCount - 1) * spacing) / 2;
  const centerY = area.y + area.height / 2;
  context.save();
  context.lineCap = 'round';
  for (let index = 0; index < safeCount; index += 1) {
    const active = index === safeIndex;
    const x = startX + index * spacing;
    const size = active ? 12 : 8.5;
    context.fillStyle = active ? '#b7793b' : '#9b8769';
    traceYearbookLeaf(context, x, centerY, size, index);
    context.fill();
    context.strokeStyle = active ? '#5b3828' : '#756249';
    context.lineWidth = active ? 2.2 : 1.5;
    context.stroke();
    context.fillStyle = active ? 'rgba(255,231,163,0.48)' : 'rgba(242,214,151,0.22)';
    traceYearbookLeafLight(context, x, centerY, size, index);
    context.fill();
    context.strokeStyle = active ? '#f0c96d' : '#c1a579';
    context.lineWidth = active ? 1.8 : 1.2;
    traceYearbookLeafVein(context, x, centerY, size, index);
    context.stroke();
  }
  context.restore();
}

function traceYearbookLeaf(context, x, y, size, index) {
  const lean = [-0.13, 0.08, -0.03, 0.15][index % 4];
  context.beginPath();
  context.moveTo(x - size * 0.82, y + size * (0.21 + lean * 0.18));
  context.bezierCurveTo(
    x - size * 0.58,
    y - size * (0.62 - lean),
    x + size * 0.16,
    y - size * (0.84 + lean * 0.4),
    x + size * 0.88,
    y - size * (0.13 - lean),
  );
  context.bezierCurveTo(
    x + size * 0.28,
    y + size * (0.77 + lean * 0.2),
    x - size * 0.43,
    y + size * (0.72 - lean * 0.3),
    x - size * 0.82,
    y + size * (0.21 + lean * 0.18),
  );
  context.closePath();
}

function traceYearbookLeafLight(context, x, y, size, index) {
  const lean = [-0.13, 0.08, -0.03, 0.15][index % 4];
  context.beginPath();
  context.moveTo(x - size * 0.55, y + size * 0.05);
  context.bezierCurveTo(
    x - size * 0.34,
    y - size * (0.43 - lean),
    x + size * 0.12,
    y - size * (0.56 + lean * 0.4),
    x + size * 0.55,
    y - size * (0.14 - lean),
  );
  context.bezierCurveTo(
    x + size * 0.08,
    y - size * 0.13,
    x - size * 0.2,
    y + size * 0.08,
    x - size * 0.55,
    y + size * 0.05,
  );
  context.closePath();
}

function traceYearbookLeafVein(context, x, y, size, index) {
  const lean = [-0.13, 0.08, -0.03, 0.15][index % 4];
  context.beginPath();
  context.moveTo(x - size * 0.62, y + size * 0.2);
  context.quadraticCurveTo(
    x - size * 0.04,
    y + size * (0.01 + lean * 0.16),
    x + size * 0.63,
    y - size * (0.12 - lean),
  );
}

export function buildCardAlbumEntries(cardDefinitions, earnedCardIds) {
  const earned = new Set(earnedCardIds);
  const compact = cardDefinitions.length > 2;
  const slotWidth = compact ? 250 : 330;
  const slotHeight = compact ? 276 : 292;
  const gap = compact ? 26 : 50;
  const columns = Math.max(1, Math.min(4, cardDefinitions.length));
  const startX = (WORLD.width - (columns * slotWidth + (columns - 1) * gap)) / 2;
  return cardDefinitions.map((card, index) => ({
    ...card,
    earned: earned.has(card.id),
    __rect: {
      x: startX + (index % columns) * (slotWidth + gap),
      y: 282 + Math.floor(index / columns) * (slotHeight + 24),
      width: slotWidth,
      height: slotHeight,
    },
  }));
}

const KEEPSAKE_GRAIN = Object.freeze([
  [0.09, 0.18, 0.2, -0.018], [0.16, 0.48, 0.27, 0.016], [0.1, 0.78, 0.24, -0.012],
  [0.38, 0.12, 0.18, 0.014], [0.44, 0.36, 0.31, -0.019], [0.39, 0.7, 0.25, 0.017],
  [0.68, 0.2, 0.21, -0.015], [0.72, 0.55, 0.2, 0.013], [0.67, 0.84, 0.25, -0.01],
]);

function keepsakePhase(id) {
  const value = String(id ?? 'keepsake');
  let hash = 17;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return hash / 997;
}

function drawKeepsakeCard(context, rect, earned, phase) {
  drawHandmadeMaterial(context, rect, phase, earned
    ? {
        shadow: 'rgba(42,25,26,0.4)',
        base: '#704a31',
        light: 'rgba(255,229,159,0.24)',
        shade: 'rgba(40,25,34,0.3)',
        edge: '#c99a4e',
        grain: 'rgba(244,205,126,0.13)',
      }
    : {
        shadow: 'rgba(30,24,38,0.42)',
        base: '#50445b',
        light: 'rgba(244,213,141,0.15)',
        shade: 'rgba(25,20,34,0.34)',
        edge: '#9b876d',
        grain: 'rgba(220,194,151,0.11)',
      });
}

function drawKeepsakePhotoMount(context, rect, phase) {
  const mat = {
    x: rect.x - 9,
    y: rect.y - 8,
    width: rect.width + 18,
    height: rect.height + 16,
  };
  drawHandmadeMaterial(context, mat, phase + 0.13, {
    shadow: 'rgba(27,18,24,0.34)',
    base: '#d2b77f',
    light: 'rgba(255,242,202,0.46)',
    shade: 'rgba(103,67,39,0.2)',
    edge: '#6f4a31',
    grain: 'rgba(105,72,43,0.14)',
  }, 4);
}

function drawKeepsakePhotoCorners(context, rect, phase) {
  const size = Math.min(30, rect.width * 0.12);
  drawPhotoCorner(context, rect.x + 2, rect.y + 2, 1, 1, size, phase);
  drawPhotoCorner(context, rect.x + rect.width - 2, rect.y + 2, -1, 1, size, phase + 0.17);
  drawPhotoCorner(context, rect.x + 2, rect.y + rect.height - 2, 1, -1, size, phase + 0.31);
  drawPhotoCorner(
    context,
    rect.x + rect.width - 2,
    rect.y + rect.height - 2,
    -1,
    -1,
    size,
    phase + 0.47,
  );
}

function drawKeepsakeNameplate(context, rect, label, phase) {
  context.save();
  context.fillStyle = 'rgba(39,25,29,0.28)';
  traceKeepsakePanel(context, { ...rect, x: rect.x + 4, y: rect.y + 6 }, phase + 0.21);
  context.fill();
  context.fillStyle = '#e6d2aa';
  traceKeepsakePanel(context, rect, phase);
  context.fill();
  context.save();
  traceKeepsakePanel(context, rect, phase);
  context.clip();
  context.fillStyle = 'rgba(255,244,210,0.4)';
  traceUpperLeftLight(context, rect, phase);
  context.fill();
  context.fillStyle = 'rgba(102,64,39,0.16)';
  traceLowerRightShade(context, rect, phase);
  context.fill();
  drawMaterialMarks(context, rect, phase, 'rgba(105,72,43,0.13)');
  context.restore();
  context.strokeStyle = '#8c6239';
  context.lineWidth = 3.5;
  traceKeepsakePanel(context, rect, phase);
  context.stroke();
  context.textAlign = 'center';
  context.fillStyle = '#3a2d22';
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, label, rect.x + rect.width / 2, rect.y + rect.height / 2 + 10, rect.width - 34);
  context.restore();
}

function drawPaintedKeepsakeName(context, rect, label) {
  context.save();
  context.fillStyle = '#4b3026';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
  fitText(
    context,
    label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width - 18,
  );
  context.restore();
}

function drawClosedKeepsakePocket(context, layout, phase) {
  const pocket = {
    x: layout.portrait.x - 7,
    y: layout.portrait.y - 6,
    width: layout.portrait.width + 14,
    height: layout.portrait.height + 84,
  };
  drawHandmadeMaterial(context, pocket, phase + 0.09, {
    shadow: 'rgba(25,20,34,0.38)',
    base: '#3f354a',
    light: 'rgba(226,197,148,0.14)',
    shade: 'rgba(17,14,25,0.35)',
    edge: '#7e6a73',
    grain: 'rgba(216,187,147,0.1)',
  }, 4);

  const flap = {
    x: pocket.x + 8,
    y: pocket.y + 9,
    width: pocket.width - 16,
    height: 112,
  };
  context.fillStyle = '#62546c';
  tracePocketFlap(context, flap, phase);
  context.fill();
  context.fillStyle = 'rgba(244,213,141,0.16)';
  tracePocketFlapLight(context, flap, phase);
  context.fill();
  context.strokeStyle = '#9a846f';
  context.lineWidth = 3.2;
  tracePocketFlap(context, flap, phase);
  context.stroke();

  const ribbon = {
    x: pocket.x + pocket.width * 0.44,
    y: pocket.y + 12,
    width: pocket.width * 0.13,
    height: pocket.height - 24,
  };
  context.fillStyle = '#6f3f59';
  traceKeepsakePanel(context, ribbon, phase + 0.51);
  context.fill();
  context.fillStyle = 'rgba(239,194,167,0.18)';
  traceUpperLeftLight(context, ribbon, phase + 0.51);
  context.fill();
  context.strokeStyle = '#392938';
  context.lineWidth = 2.4;
  traceKeepsakePanel(context, ribbon, phase + 0.51);
  context.stroke();

  const claspX = pocket.x + pocket.width / 2;
  const claspY = pocket.y + 126;
  context.fillStyle = '#8b632e';
  traceBrassLeaf(context, claspX + 3, claspY + 4, 28, phase + 0.18);
  context.fill();
  context.fillStyle = '#c99d4c';
  traceBrassLeaf(context, claspX, claspY, 26, phase);
  context.fill();
  context.strokeStyle = '#573b27';
  context.lineWidth = 2.5;
  context.stroke();
  context.fillStyle = 'rgba(255,236,174,0.47)';
  traceBrassLeafLight(context, claspX, claspY, 26, phase);
  context.fill();

  context.strokeStyle = 'rgba(220,194,151,0.25)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(pocket.x + 24, pocket.y + pocket.height - 46);
  context.bezierCurveTo(
    pocket.x + pocket.width * 0.34,
    pocket.y + pocket.height - 56,
    pocket.x + pocket.width * 0.67,
    pocket.y + pocket.height - 34,
    pocket.x + pocket.width - 24,
    pocket.y + pocket.height - 48,
  );
  context.stroke();
}

function drawKeepsakeStitches(context, rect, earned, phase) {
  context.save();
  context.strokeStyle = earned ? '#e0bc77' : '#a99786';
  context.lineWidth = 2;
  context.lineCap = 'round';
  for (const progress of [0.16, 0.35, 0.58, 0.79]) {
    const drift = Math.sin((phase + progress) * 17) * 1.5;
    for (const y of [rect.y + 14, rect.y + rect.height - 14]) {
      context.beginPath();
      context.moveTo(rect.x + rect.width * progress - 6, y + drift);
      context.quadraticCurveTo(
        rect.x + rect.width * progress,
        y - drift * 0.35,
        rect.x + rect.width * progress + 6,
        y + drift * 0.2,
      );
      context.stroke();
    }
  }
  for (const progress of [0.3, 0.58, 0.78]) {
    const drift = Math.cos((phase + progress) * 19) * 1.4;
    for (const x of [rect.x + 14, rect.x + rect.width - 14]) {
      context.beginPath();
      context.moveTo(x + drift, rect.y + rect.height * progress - 6);
      context.quadraticCurveTo(
        x - drift * 0.3,
        rect.y + rect.height * progress,
        x + drift * 0.2,
        rect.y + rect.height * progress + 6,
      );
      context.stroke();
    }
  }
  context.restore();
}

function drawEmptyAlbumPocket(context) {
  const pocket = { x: 430, y: 298, width: 420, height: 286 };
  drawHandmadeMaterial(context, pocket, 0.37, {
    shadow: 'rgba(31,23,34,0.38)',
    base: '#5a4b61',
    light: 'rgba(244,213,141,0.16)',
    shade: 'rgba(25,19,33,0.31)',
    edge: '#9a826b',
    grain: 'rgba(224,199,154,0.11)',
  });
  const paper = { x: 478, y: 340, width: 324, height: 188 };
  drawHandmadeMaterial(context, paper, 0.61, {
    shadow: 'rgba(30,22,27,0.25)',
    base: '#ddc99f',
    light: 'rgba(255,244,210,0.42)',
    shade: 'rgba(101,64,39,0.16)',
    edge: '#86613d',
    grain: 'rgba(104,72,43,0.13)',
  }, 4);
  drawPressedSprig(context, 640, 434, 72, 0.2);
}

function drawYearbookPhotoMount(context, rect, phase) {
  drawHandmadeMaterial(context, rect, phase + 0.07, {
    shadow: 'rgba(37,23,27,0.42)',
    base: '#63432e',
    light: 'rgba(255,226,153,0.24)',
    shade: 'rgba(39,24,31,0.31)',
    edge: '#c79a4a',
    grain: 'rgba(237,197,119,0.13)',
  }, 5);
  const innerMat = {
    x: rect.x + 10,
    y: rect.y + 10,
    width: rect.width - 20,
    height: rect.height - 20,
  };
  context.fillStyle = '#d6bc89';
  traceKeepsakePanel(context, innerMat, phase + 0.29);
  context.fill();
  context.fillStyle = 'rgba(255,242,202,0.38)';
  traceUpperLeftLight(context, innerMat, phase + 0.29);
  context.fill();
  context.strokeStyle = '#84603a';
  context.lineWidth = 3;
  traceKeepsakePanel(context, innerMat, phase + 0.29);
  context.stroke();
}

function drawYearbookPhotoCorners(context, rect, phase) {
  const size = 38;
  drawPhotoCorner(context, rect.x + 1, rect.y + 1, 1, 1, size, phase);
  drawPhotoCorner(context, rect.x + rect.width - 1, rect.y + 1, -1, 1, size, phase + 0.2);
  drawPhotoCorner(context, rect.x + 1, rect.y + rect.height - 1, 1, -1, size, phase + 0.34);
  drawPhotoCorner(
    context,
    rect.x + rect.width - 1,
    rect.y + rect.height - 1,
    -1,
    -1,
    size,
    phase + 0.49,
  );
}

function drawYearbookCaption(context, rect, caption, phase) {
  context.save();
  context.fillStyle = 'rgba(40,25,28,0.3)';
  traceKeepsakePanel(context, { ...rect, x: rect.x + 5, y: rect.y + 7 }, phase + 0.23);
  context.fill();
  context.fillStyle = '#ead7ae';
  traceKeepsakePanel(context, rect, phase);
  context.fill();
  context.fillStyle = 'rgba(255,244,210,0.4)';
  traceUpperLeftLight(context, rect, phase);
  context.fill();
  context.fillStyle = 'rgba(102,64,39,0.16)';
  traceLowerRightShade(context, rect, phase);
  context.fill();
  context.strokeStyle = '#8c6138';
  context.lineWidth = 3.5;
  traceKeepsakePanel(context, rect, phase);
  context.stroke();
  drawMaterialMarks(context, rect, phase, 'rgba(105,72,43,0.12)');
  context.textAlign = 'center';
  context.fillStyle = '#382a24';
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, caption, rect.x + rect.width / 2, rect.y + rect.height / 2 + 10, rect.width - 42);
  context.restore();
}

function drawYearbookTurnControl(context, rect, direction, label) {
  const phase = direction === 'previous' ? 0.23 : 0.71;
  context.save();
  context.fillStyle = 'rgba(39,24,29,0.34)';
  tracePageTurnControl(context, { ...rect, x: rect.x + 5, y: rect.y + 7 }, direction, phase);
  context.fill();
  context.fillStyle = '#67442f';
  tracePageTurnControl(context, rect, direction, phase);
  context.fill();
  context.save();
  tracePageTurnControl(context, rect, direction, phase);
  context.clip();
  context.fillStyle = 'rgba(255,226,153,0.24)';
  traceUpperLeftLight(context, rect, phase);
  context.fill();
  context.fillStyle = 'rgba(35,23,31,0.3)';
  traceLowerRightShade(context, rect, phase);
  context.fill();
  drawMaterialMarks(context, rect, phase, 'rgba(239,199,122,0.13)');
  context.restore();
  context.strokeStyle = '#d0a24f';
  context.lineWidth = 4;
  tracePageTurnControl(context, rect, direction, phase);
  context.stroke();
  drawPageTurnArrow(context, rect.x + 49, rect.y + rect.height / 2, direction);
  context.fillStyle = '#fff1c9';
  context.textAlign = 'center';
  context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, rect.x + 145, rect.y + rect.height / 2 + 9);
  context.restore();
}

function drawEmptyYearbookPage(context, rect) {
  context.save();
  drawHandmadeMaterial(context, rect, 0.42, {
    shadow: 'rgba(35,24,34,0.34)',
    base: '#5c5068',
    light: 'rgba(244,213,141,0.17)',
    shade: 'rgba(25,20,34,0.31)',
    edge: '#9b8268',
    grain: 'rgba(221,196,151,0.11)',
  }, 5);
  const blankPhoto = {
    x: rect.x + 54,
    y: rect.y + 38,
    width: rect.width - 108,
    height: rect.height - 92,
  };
  drawHandmadeMaterial(context, blankPhoto, 0.63, {
    shadow: 'rgba(31,22,28,0.24)',
    base: '#d9c59b',
    light: 'rgba(255,244,210,0.44)',
    shade: 'rgba(103,67,39,0.17)',
    edge: '#82603d',
    grain: 'rgba(104,72,43,0.13)',
  }, 4);
  drawPressedSprig(
    context,
    blankPhoto.x + blankPhoto.width * 0.72,
    blankPhoto.y + blankPhoto.height * 0.58,
    88,
    0.37,
  );
  context.fillStyle = '#714158';
  traceLooseRibbon(context, blankPhoto.x + 36, blankPhoto.y + blankPhoto.height - 34, 170, 28, 0.51);
  context.fill();
  context.fillStyle = 'rgba(244,205,181,0.2)';
  traceLooseRibbonLight(context, blankPhoto.x + 36, blankPhoto.y + blankPhoto.height - 34, 170, 28, 0.51);
  context.fill();
  context.restore();
}

function drawHandmadeMaterial(context, rect, phase, colors, edgeDepth = 7) {
  context.save();
  context.fillStyle = colors.shadow;
  traceKeepsakePanel(context, { ...rect, x: rect.x + 7, y: rect.y + 9 }, phase + 0.19, edgeDepth);
  context.fill();
  context.fillStyle = colors.base;
  traceKeepsakePanel(context, rect, phase, edgeDepth);
  context.fill();
  context.save();
  traceKeepsakePanel(context, rect, phase, edgeDepth);
  context.clip();
  context.fillStyle = colors.light;
  traceUpperLeftLight(context, rect, phase);
  context.fill();
  context.fillStyle = colors.shade;
  traceLowerRightShade(context, rect, phase);
  context.fill();
  drawMaterialMarks(context, rect, phase, colors.grain);
  context.restore();
  context.strokeStyle = colors.edge;
  context.lineWidth = 4;
  traceKeepsakePanel(context, rect, phase, edgeDepth);
  context.stroke();
  context.restore();
}

function traceKeepsakePanel(context, rect, phase = 0, edgeDepth = 7) {
  const { x, y, width, height } = rect;
  const wobble = (index) => Math.sin((phase + index * 0.173) * 19) * edgeDepth * 0.34;
  context.beginPath();
  context.moveTo(x + 19, y + 1 + wobble(0));
  context.bezierCurveTo(
    x + width * 0.28,
    y + wobble(1),
    x + width * 0.68,
    y + wobble(2),
    x + width - 18,
    y + 1 + wobble(3),
  );
  context.bezierCurveTo(
    x + width - 5 + wobble(4) * 0.3,
    y + 5,
    x + width + wobble(5) * 0.25,
    y + height * 0.3,
    x + width - 1 + wobble(6) * 0.22,
    y + height * 0.53,
  );
  context.bezierCurveTo(
    x + width + wobble(7) * 0.22,
    y + height * 0.74,
    x + width - 3 + wobble(8) * 0.25,
    y + height - 7,
    x + width - 20,
    y + height - 1 + wobble(9),
  );
  context.bezierCurveTo(
    x + width * 0.69,
    y + height + wobble(10),
    x + width * 0.29,
    y + height + wobble(11),
    x + 18,
    y + height - 1 + wobble(12),
  );
  context.bezierCurveTo(
    x + 5 - wobble(13) * 0.3,
    y + height - 7,
    x - wobble(14) * 0.25,
    y + height * 0.71,
    x + 1 - wobble(15) * 0.2,
    y + height * 0.47,
  );
  context.bezierCurveTo(
    x - wobble(16) * 0.2,
    y + height * 0.27,
    x + 3 - wobble(17) * 0.28,
    y + 7,
    x + 19,
    y + 1 + wobble(0),
  );
  context.closePath();
}

function traceUpperLeftLight(context, rect, phase) {
  const drift = Math.sin(phase * 23) * rect.height * 0.012;
  context.beginPath();
  context.moveTo(rect.x - 4, rect.y - 3);
  context.bezierCurveTo(
    rect.x + rect.width * 0.24,
    rect.y + 1 + drift,
    rect.x + rect.width * 0.52,
    rect.y - 2 - drift,
    rect.x + rect.width * 0.67,
    rect.y + rect.height * 0.14,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.52,
    rect.y + rect.height * 0.24,
    rect.x + rect.width * 0.22,
    rect.y + rect.height * 0.31,
    rect.x - 4,
    rect.y + rect.height * 0.4,
  );
  context.bezierCurveTo(
    rect.x - 2,
    rect.y + rect.height * 0.2,
    rect.x - 3,
    rect.y + rect.height * 0.07,
    rect.x - 4,
    rect.y - 3,
  );
  context.closePath();
}

function traceLowerRightShade(context, rect, phase) {
  const drift = Math.cos(phase * 17) * rect.height * 0.012;
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.37, rect.y + rect.height * 0.73 + drift);
  context.bezierCurveTo(
    rect.x + rect.width * 0.62,
    rect.y + rect.height * 0.68,
    rect.x + rect.width * 0.87,
    rect.y + rect.height * 0.64 + drift,
    rect.x + rect.width + 4,
    rect.y + rect.height * 0.55,
  );
  context.bezierCurveTo(
    rect.x + rect.width + 3,
    rect.y + rect.height * 0.82,
    rect.x + rect.width - 10,
    rect.y + rect.height + 4,
    rect.x + rect.width * 0.66,
    rect.y + rect.height + 4,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.55,
    rect.y + rect.height * 0.93,
    rect.x + rect.width * 0.46,
    rect.y + rect.height * 0.83,
    rect.x + rect.width * 0.37,
    rect.y + rect.height * 0.73 + drift,
  );
  context.closePath();
}

function drawMaterialMarks(context, rect, phase, color) {
  context.strokeStyle = color;
  context.lineWidth = 1.4;
  context.lineCap = 'round';
  for (let index = 0; index < KEEPSAKE_GRAIN.length; index += 1) {
    const [grainX, grainY, grainLength, grainBend] = KEEPSAKE_GRAIN[index];
    const startX = rect.x + rect.width * grainX;
    const startY = rect.y + rect.height * grainY;
    const length = rect.width * grainLength;
    const drift = Math.sin((phase + index) * 13) * rect.height * 0.004;
    context.beginPath();
    context.moveTo(startX, startY + drift);
    context.bezierCurveTo(
      startX + length * 0.3,
      startY + rect.height * grainBend,
      startX + length * 0.7,
      startY - rect.height * grainBend * 0.5,
      startX + length,
      startY + drift * 0.4,
    );
    context.stroke();
  }
}

function tracePocketFlap(context, rect, phase) {
  const drift = Math.sin(phase * 29) * 4;
  context.beginPath();
  context.moveTo(rect.x + 12, rect.y + 2);
  context.bezierCurveTo(
    rect.x + rect.width * 0.3,
    rect.y - 2 + drift,
    rect.x + rect.width * 0.7,
    rect.y + 3 - drift,
    rect.x + rect.width - 12,
    rect.y + 1,
  );
  context.bezierCurveTo(
    rect.x + rect.width + 1,
    rect.y + rect.height * 0.21,
    rect.x + rect.width * 0.72,
    rect.y + rect.height * 0.75,
    rect.x + rect.width / 2,
    rect.y + rect.height,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.28,
    rect.y + rect.height * 0.72,
    rect.x - 1,
    rect.y + rect.height * 0.22,
    rect.x + 12,
    rect.y + 2,
  );
  context.closePath();
}

function tracePocketFlapLight(context, rect, phase) {
  const drift = Math.cos(phase * 23) * 3;
  context.beginPath();
  context.moveTo(rect.x + 16, rect.y + 8);
  context.bezierCurveTo(
    rect.x + rect.width * 0.31,
    rect.y + 2 + drift,
    rect.x + rect.width * 0.55,
    rect.y + 8 - drift,
    rect.x + rect.width * 0.67,
    rect.y + rect.height * 0.2,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.47,
    rect.y + rect.height * 0.33,
    rect.x + rect.width * 0.24,
    rect.y + rect.height * 0.35,
    rect.x + 16,
    rect.y + 8,
  );
  context.closePath();
}

function traceBrassLeaf(context, x, y, size, phase) {
  const lean = Math.sin(phase * 17) * size * 0.08;
  context.beginPath();
  context.moveTo(x - size * 0.72, y + size * 0.08);
  context.bezierCurveTo(
    x - size * 0.42,
    y - size * 0.72 + lean,
    x + size * 0.3,
    y - size * 0.67 - lean,
    x + size * 0.72,
    y - size * 0.03,
  );
  context.bezierCurveTo(
    x + size * 0.33,
    y + size * 0.65 - lean,
    x - size * 0.37,
    y + size * 0.62 + lean,
    x - size * 0.72,
    y + size * 0.08,
  );
  context.closePath();
}

function traceBrassLeafLight(context, x, y, size, phase) {
  const lean = Math.sin(phase * 17) * size * 0.05;
  context.beginPath();
  context.moveTo(x - size * 0.46, y - size * 0.02);
  context.bezierCurveTo(
    x - size * 0.25,
    y - size * 0.48 + lean,
    x + size * 0.14,
    y - size * 0.48 - lean,
    x + size * 0.43,
    y - size * 0.13,
  );
  context.bezierCurveTo(
    x + size * 0.05,
    y - size * 0.15,
    x - size * 0.18,
    y + size * 0.01,
    x - size * 0.46,
    y - size * 0.02,
  );
  context.closePath();
}

function drawPhotoCorner(context, x, y, horizontal, vertical, size, phase) {
  context.fillStyle = 'rgba(43,27,29,0.25)';
  tracePhotoCorner(context, x + horizontal * 2, y + vertical * 3, horizontal, vertical, size, phase);
  context.fill();
  context.fillStyle = '#b58a43';
  tracePhotoCorner(context, x, y, horizontal, vertical, size, phase);
  context.fill();
  context.strokeStyle = '#65452d';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = 'rgba(255,235,174,0.42)';
  tracePhotoCornerLight(context, x, y, horizontal, vertical, size, phase);
  context.fill();
}

function tracePhotoCorner(context, x, y, horizontal, vertical, size, phase) {
  const drift = Math.sin(phase * 31) * size * 0.05;
  context.beginPath();
  context.moveTo(x, y + vertical * size * 0.08);
  context.quadraticCurveTo(
    x + horizontal * size * 0.57,
    y + vertical * drift,
    x + horizontal * size,
    y + vertical * size * 0.19,
  );
  context.quadraticCurveTo(
    x + horizontal * size * 0.48,
    y + vertical * size * 0.5,
    x + horizontal * size * 0.18,
    y + vertical * size,
  );
  context.quadraticCurveTo(
    x + horizontal * drift,
    y + vertical * size * 0.57,
    x,
    y + vertical * size * 0.08,
  );
  context.closePath();
}

function tracePhotoCornerLight(context, x, y, horizontal, vertical, size, phase) {
  const drift = Math.cos(phase * 19) * size * 0.03;
  context.beginPath();
  context.moveTo(x + horizontal * size * 0.08, y + vertical * size * 0.11);
  context.quadraticCurveTo(
    x + horizontal * size * 0.48,
    y + vertical * drift,
    x + horizontal * size * 0.68,
    y + vertical * size * 0.17,
  );
  context.quadraticCurveTo(
    x + horizontal * size * 0.36,
    y + vertical * size * 0.25,
    x + horizontal * size * 0.08,
    y + vertical * size * 0.11,
  );
  context.closePath();
}

function tracePageTurnControl(context, rect, direction, phase) {
  const notchSide = direction === 'previous' ? -1 : 1;
  const drift = Math.sin(phase * 27) * 3;
  context.beginPath();
  context.moveTo(rect.x + 17, rect.y + 1 + drift);
  context.bezierCurveTo(
    rect.x + rect.width * 0.34,
    rect.y - 2,
    rect.x + rect.width * 0.69,
    rect.y + 3,
    rect.x + rect.width - 17,
    rect.y + 1 - drift,
  );
  context.bezierCurveTo(
    rect.x + rect.width + 1,
    rect.y + rect.height * 0.22,
    rect.x + rect.width - 3,
    rect.y + rect.height * 0.7,
    rect.x + rect.width - 15,
    rect.y + rect.height - 1,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.71,
    rect.y + rect.height + 2,
    rect.x + rect.width * 0.62,
    rect.y + rect.height - notchSide * 8,
    rect.x + rect.width / 2,
    rect.y + rect.height - notchSide * 3,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.37,
    rect.y + rect.height + notchSide * 7,
    rect.x + rect.width * 0.27,
    rect.y + rect.height - 2,
    rect.x + 15,
    rect.y + rect.height - 1,
  );
  context.bezierCurveTo(
    rect.x - 1,
    rect.y + rect.height * 0.75,
    rect.x + 2,
    rect.y + rect.height * 0.24,
    rect.x + 17,
    rect.y + 1 + drift,
  );
  context.closePath();
}

function drawPageTurnArrow(context, x, y, direction) {
  const horizontal = direction === 'previous' ? -1 : 1;
  context.strokeStyle = '#fff1c9';
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x - horizontal * 14, y + 1);
  context.bezierCurveTo(
    x - horizontal * 3,
    y - 10,
    x + horizontal * 8,
    y - 7,
    x + horizontal * 17,
    y,
  );
  context.stroke();
  context.fillStyle = '#e4b65a';
  context.beginPath();
  context.moveTo(x + horizontal * 18, y);
  context.quadraticCurveTo(x + horizontal * 7, y - 14, x + horizontal * 3, y - 20);
  context.quadraticCurveTo(x + horizontal * 10, y - 1, x + horizontal * 18, y);
  context.quadraticCurveTo(x + horizontal * 9, y + 5, x + horizontal * 2, y + 18);
  context.quadraticCurveTo(x + horizontal * 9, y + 9, x + horizontal * 18, y);
  context.closePath();
  context.fill();
  context.strokeStyle = '#573b27';
  context.lineWidth = 2;
  context.stroke();
}

function drawPressedSprig(context, x, y, size, phase) {
  context.save();
  context.strokeStyle = '#6f5b3c';
  context.lineWidth = Math.max(2, size * 0.035);
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x - size * 0.42, y + size * 0.35);
  context.bezierCurveTo(
    x - size * 0.16,
    y + size * 0.13,
    x + size * 0.05,
    y - size * 0.18,
    x + size * 0.33,
    y - size * 0.42,
  );
  context.stroke();
  for (let index = 0; index < 4; index += 1) {
    const progress = 0.16 + index * 0.2;
    const centerX = x - size * 0.38 + size * progress * 0.9;
    const centerY = y + size * 0.31 - size * progress * 0.68;
    const leafSize = size * (0.14 - index * 0.008);
    context.fillStyle = index % 2 === 0 ? '#8b794d' : '#776844';
    traceYearbookLeaf(context, centerX, centerY, leafSize, index + Math.round(phase * 10));
    context.fill();
    context.fillStyle = 'rgba(244,219,155,0.22)';
    traceYearbookLeafLight(context, centerX, centerY, leafSize, index + Math.round(phase * 10));
    context.fill();
  }
  context.restore();
}

function traceLooseRibbon(context, x, y, width, height, phase) {
  const drift = Math.sin(phase * 29) * height * 0.14;
  context.beginPath();
  context.moveTo(x, y + height * 0.2);
  context.bezierCurveTo(
    x + width * 0.27,
    y - drift,
    x + width * 0.53,
    y + height * 0.36 + drift,
    x + width,
    y + height * 0.08,
  );
  context.bezierCurveTo(
    x + width * 0.74,
    y + height * 0.78,
    x + width * 0.37,
    y + height * 0.51 - drift,
    x,
    y + height * 0.92,
  );
  context.bezierCurveTo(x + 8, y + height * 0.64, x + 6, y + height * 0.39, x, y + height * 0.2);
  context.closePath();
}

function traceLooseRibbonLight(context, x, y, width, height, phase) {
  const drift = Math.cos(phase * 23) * height * 0.1;
  context.beginPath();
  context.moveTo(x + width * 0.05, y + height * 0.25);
  context.bezierCurveTo(
    x + width * 0.27,
    y + drift,
    x + width * 0.43,
    y + height * 0.3 - drift,
    x + width * 0.62,
    y + height * 0.28,
  );
  context.bezierCurveTo(
    x + width * 0.39,
    y + height * 0.39,
    x + width * 0.2,
    y + height * 0.24,
    x + width * 0.05,
    y + height * 0.25,
  );
  context.closePath();
}

function drawSatchelTab(context, rect, image, label, active) {
  context.save();
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  } else {
    drawLeatherBookmark(context, rect, { active });
  }
  drawCenteredSatchelText(context, label, satchelControlLabelRect(rect, 'tab'), {
    color: '#fff4d5',
    font: '700 30px "Andika", "Trebuchet MS", sans-serif',
  });
  if (active) drawSatchelSelectedTabMarker(context, rect);
  context.restore();
}

function drawSatchelSelectedTabMarker(context, rect) {
  const y = rect.y + rect.height - 3;
  context.strokeStyle = '#efc86e';
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.43, y);
  context.bezierCurveTo(
    rect.x + rect.width * 0.55,
    y + 5,
    rect.x + rect.width * 0.7,
    y - 4,
    rect.x + rect.width * 0.84,
    y + 1,
  );
  context.stroke();
  context.fillStyle = '#f7dc91';
  for (const x of [rect.x + rect.width * 0.48, rect.x + rect.width * 0.8]) {
    context.beginPath();
    context.moveTo(x, y - 5);
    context.lineTo(x + 4, y);
    context.lineTo(x, y + 5);
    context.lineTo(x - 3, y);
    context.closePath();
    context.fill();
  }
}

function drawSatchelOwnerMark(context) {
  context.save();
  context.fillStyle = '#4b3328';
  context.textAlign = 'center';
  context.font = '700 32px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(
    childFacingUiText('Violet’s Satchel', 'proper-name'),
    332,
    84,
  );
  context.strokeStyle = 'rgba(141, 94, 51, 0.45)';
  context.lineWidth = 2.2;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(205, 98);
  context.bezierCurveTo(278, 91, 374, 104, 452, 96);
  context.stroke();
  context.restore();
}

function drawSatchelPageHeading(context, label) {
  context.save();
  context.fillStyle = '#5a3b2b';
  context.textAlign = 'center';
  context.font = '700 24px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, WORLD.width / 2, 242);
  context.strokeStyle = 'rgba(128, 87, 49, 0.42)';
  context.lineWidth = 2;
  context.lineCap = 'round';
  for (const direction of [-1, 1]) {
    context.beginPath();
    context.moveTo(WORLD.width / 2 + direction * 90, 235);
    context.quadraticCurveTo(
      WORLD.width / 2 + direction * 126,
      229 + direction * 2,
      WORLD.width / 2 + direction * 156,
      237,
    );
    context.stroke();
  }
  context.restore();
}

function drawSatchelGrownUpsControl(context, rect, image, progress) {
  context.save();
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  } else {
    drawBrassKeyhole(context, { x: rect.x, y: rect.y, width: 88, height: 88 }, { progress });
  }
  drawCenteredSatchelText(
    context,
    childFacingUiText('Grown-ups', 'caption'),
    satchelControlLabelRect(rect, 'grown-ups'),
    {
      color: '#3c2a23',
      font: '700 19px "Andika", "Trebuchet MS", sans-serif',
    },
  );
  if (progress > 0) drawSatchelHoldProgress(context, rect, progress);
  context.restore();
}

function drawSatchelHoldProgress(context, rect, progress) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  context.strokeStyle = '#fff0b8';
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(rect.x + 42, rect.y + rect.height - 7);
  context.quadraticCurveTo(
    rect.x + rect.width * 0.5,
    rect.y + rect.height - 1,
    rect.x + 42 + (rect.width - 76) * safeProgress,
    rect.y + rect.height - 7,
  );
  context.stroke();
}

function drawSatchelStartFreshControl(context, rect, image) {
  context.save();
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  } else {
    drawParchmentAction(context, rect, {
      label: childFacingUiText('Start fresh', 'action'),
      icon: vectorControlIcon('replay'),
      danger: true,
      compact: true,
    });
    context.restore();
    return;
  }
  drawCenteredSatchelText(
    context,
    childFacingUiText('Start fresh', 'action'),
    satchelControlLabelRect(rect, 'start-fresh'),
    {
      color: '#fff0d1',
      font: '700 19px "Andika", "Trebuchet MS", sans-serif',
    },
  );
  context.restore();
}

export function satchelControlLabelRect(rect, kind) {
  const geometry = kind === 'tab'
    ? { x: 0.39, y: 0.18, width: 0.56, height: 0.62 }
    : { x: 0.38, y: 0.18, width: 0.57, height: 0.62 };
  return Object.freeze({
    x: rect.x + rect.width * geometry.x,
    y: rect.y + rect.height * geometry.y,
    width: rect.width * geometry.width,
    height: rect.height * geometry.height,
  });
}

function drawCenteredSatchelText(context, text, labelRect, { color, font }) {
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = font;
  context.fillText(
    text,
    labelRect.x + labelRect.width / 2,
    labelRect.y + labelRect.height / 2,
  );
}

function drawSatchelClose(context, rect, image) {
  context.save();
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  } else {
    drawWaxIcon(context, rect.x + rect.width / 2, rect.y + rect.height / 2, 45, 'close');
    context.restore();
    return;
  }
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  context.strokeStyle = '#fff0c5';
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(centerX - 17, centerY - 17);
  context.lineTo(centerX + 17, centerY + 17);
  context.moveTo(centerX + 17, centerY - 17);
  context.lineTo(centerX - 17, centerY + 17);
  context.stroke();
  context.restore();
}

function drawOrganicCoverImage(context, image, rect, phase) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const rectRatio = rect.width / rect.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (imageRatio > rectRatio) {
    sourceWidth = image.naturalHeight * rectRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / rectRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  context.save();
  traceKeepsakePanel(context, rect, phase, 4);
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, rect.x, rect.y, rect.width, rect.height);
  context.fillStyle = 'rgba(255,235,178,0.16)';
  traceUpperLeftLight(context, rect, phase);
  context.fill();
  context.fillStyle = 'rgba(35,23,31,0.18)';
  traceLowerRightShade(context, rect, phase);
  context.fill();
  context.restore();
  context.strokeStyle = '#493328';
  context.lineWidth = 3;
  traceKeepsakePanel(context, rect, phase, 4);
  context.stroke();
}

function drawDevelopingPhoto(context, rect, phase) {
  context.save();
  context.fillStyle = '#746774';
  traceKeepsakePanel(context, rect, phase, 4);
  context.fill();
  context.save();
  traceKeepsakePanel(context, rect, phase, 4);
  context.clip();
  context.fillStyle = 'rgba(255,235,178,0.26)';
  traceUpperLeftLight(context, rect, phase);
  context.fill();
  context.fillStyle = 'rgba(36,27,42,0.32)';
  traceLowerRightShade(context, rect, phase);
  context.fill();
  context.strokeStyle = 'rgba(239,207,143,0.2)';
  context.lineWidth = Math.max(2, rect.height * 0.008);
  context.lineCap = 'round';
  for (const progress of [0.26, 0.48, 0.71]) {
    context.beginPath();
    context.moveTo(rect.x + rect.width * 0.14, rect.y + rect.height * progress);
    context.bezierCurveTo(
      rect.x + rect.width * 0.34,
      rect.y + rect.height * (progress - 0.08),
      rect.x + rect.width * 0.67,
      rect.y + rect.height * (progress + 0.06),
      rect.x + rect.width * 0.86,
      rect.y + rect.height * (progress - 0.02),
    );
    context.stroke();
  }
  context.restore();
  context.strokeStyle = '#4b3947';
  context.lineWidth = 3;
  traceKeepsakePanel(context, rect, phase, 4);
  context.stroke();
  context.restore();
}

function drawQuestButton(context, rect, time, pulse, { baseImage, needleImage } = {}) {
  drawCompassQuest(context, rect, time, { pulse, baseImage, needleImage });
}

function drawSatchelButton(context, rect, image = null) {
  drawLeatherSatchel(context, rect, { image });
}

export function hudGoldenThreadPresentation(state, time, { reducedMotion = false } = {}) {
  const thread = state?.affordances?.thread;
  if (
    state?.affordances?.quiet
    || state?.affordances?.worldSuppressed
    || thread?.channel !== 'hud'
    || thread.targetId !== 'hud.satchel'
  ) return null;
  return worldAffordanceState({
    id: 'hud.satchel',
    kind: 'hud',
    hitArea: { shape: 'rect', ...UI_RECTS.satchel },
    presentation: { icon: 'satchel', glow: 'objective' },
    salience: {
      tier: 'thread',
      visible: 'thread',
      intensity: thread.intensity,
      glint: null,
    },
  }, time, { reducedMotion });
}

function drawWandButton(
  context,
  rect,
  enabled,
  time = 0,
  { holsterImage, wandImage } = {},
) {
  drawBrassWandHolster(context, rect, {
    enabled,
    time,
    holsterImage,
    wandImage,
  });
}

function drawClose(context) {
  drawWaxIcon(context, 1090, 120, 45, 'close');
}

function drawIllustratedChoiceTag(context, rect, index, icon, image = null) {
  const phase = (index + 1) * 0.37 + String(icon ?? '').length * 0.041;
  const paper = ['#ead8b4', '#e4cfaa', '#f0dfbd', '#dcc39e'][index % 4];
  context.save();
  drawChoiceTagShadow(context, rect, phase);
  if (
    rect.width === 286
    && rect.height === 262
    && image?.complete
    && image.naturalWidth > 0
    && image.naturalHeight > 0
  ) {
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    context.restore();
    return;
  }
  context.fillStyle = paper;
  traceChoiceTag(context, rect, phase);
  context.fill();
  context.strokeStyle = '#76522c';
  context.lineWidth = 4.2;
  context.stroke();

  context.save();
  traceChoiceTag(context, rect, phase);
  context.clip();
  context.fillStyle = 'rgba(255,245,213,0.33)';
  context.beginPath();
  context.moveTo(rect.x - 3, rect.y + 2);
  context.bezierCurveTo(
    rect.x + rect.width * 0.28,
    rect.y - 4,
    rect.x + rect.width * 0.57,
    rect.y + 3,
    rect.x + rect.width * 0.76,
    rect.y + rect.height * 0.16,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.52,
    rect.y + rect.height * 0.25,
    rect.x + rect.width * 0.2,
    rect.y + rect.height * 0.28,
    rect.x - 3,
    rect.y + rect.height * 0.36,
  );
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(92,57,39,0.14)';
  context.beginPath();
  context.moveTo(rect.x - 4, rect.y + rect.height * 0.76);
  context.bezierCurveTo(
    rect.x + rect.width * 0.34,
    rect.y + rect.height * 0.69,
    rect.x + rect.width * 0.68,
    rect.y + rect.height * 0.82,
    rect.x + rect.width + 4,
    rect.y + rect.height * 0.68,
  );
  context.bezierCurveTo(
    rect.x + rect.width + 3,
    rect.y + rect.height * 0.9,
    rect.x + rect.width * 0.7,
    rect.y + rect.height + 4,
    rect.x - 4,
    rect.y + rect.height + 3,
  );
  context.closePath();
  context.fill();
  context.restore();

  context.strokeStyle = 'rgba(111,75,43,0.18)';
  context.lineWidth = 1.15;
  context.beginPath();
  for (let mark = 0; mark < 5; mark += 1) {
    const y = rect.y + 35 + mark * 43;
    context.moveTo(rect.x + 18 + (mark % 2) * 3, y);
    context.quadraticCurveTo(
      rect.x + rect.width * 0.48,
      y + (mark % 2 ? 2 : -2),
      rect.x + rect.width - 19,
      y + (mark % 2 ? -1 : 1),
    );
  }
  context.stroke();
  context.restore();
}

function drawChoiceTagShadow(context, rect, phase) {
  context.fillStyle = 'rgba(48,31,29,0.26)';
  traceChoiceTag(context, { ...rect, x: rect.x + 7, y: rect.y + 9 }, phase + 0.2);
  context.fill();
}

function traceChoiceTag(context, rect, phase) {
  const wobble = 3 + Math.sin(phase * 7) * 1.1;
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + 24 + wobble, y + 1);
  context.bezierCurveTo(
    x + width * 0.32,
    y - wobble * 0.35,
    x + width * 0.68,
    y + wobble * 0.42,
    x + width - 22,
    y + 1,
  );
  context.bezierCurveTo(
    x + width + wobble * 0.24,
    y + height * 0.28,
    x + width - wobble * 0.38,
    y + height * 0.7,
    x + width - 17,
    y + height - 3,
  );
  context.bezierCurveTo(
    x + width * 0.72,
    y + height + wobble * 0.32,
    x + width * 0.29,
    y + height - wobble * 0.46,
    x + 18,
    y + height - 2,
  );
  context.bezierCurveTo(
    x - wobble * 0.28,
    y + height * 0.72,
    x + wobble * 0.4,
    y + height * 0.27,
    x + 24 + wobble,
    y + 1,
  );
  context.closePath();
}

function drawChoiceEmblem(context, rect, icon, accent) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + 92;
  context.fillStyle = 'rgba(55,35,31,0.24)';
  traceOrganicSpot(context, centerX + 5, centerY + 7, 66, 57, 0.13);
  context.fill();
  context.fillStyle = accent;
  traceOrganicSpot(context, centerX, centerY, 64, 55, -0.11);
  context.fill();
  context.strokeStyle = '#5f402b';
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = 'rgba(255,239,191,0.27)';
  traceOrganicSpot(context, centerX - 17, centerY - 17, 28, 18, 0.18);
  context.fill();
  drawVectorIcon(context, icon, centerX, centerY, 84, {
    color: '#fff4d8',
    secondary: '#f4d58d',
  });
}

function choiceAccent(_icon, index) {
  return ['#6e4b68', '#4f6c75', '#89663f', '#5d6750'][index % 4];
}

function drawPlatformTicket(context, rect, illustration, time, { reducedMotion = false } = {}) {
  const shimmer = reducedMotion ? 0 : Math.sin(time * 0.8) * 2.4;
  context.fillStyle = 'rgba(50,32,29,0.22)';
  traceRoundedRect(context, rect.x + 7, rect.y + 9, rect.width, rect.height, 26);
  context.fill();
  context.fillStyle = '#dfc894';
  traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, 26);
  context.fill();
  context.strokeStyle = '#8a6238';
  context.lineWidth = 4.5;
  context.stroke();

  context.fillStyle = 'rgba(255,244,210,0.3)';
  context.beginPath();
  context.moveTo(rect.x + 24, rect.y + 14);
  context.bezierCurveTo(
    rect.x + rect.width * 0.33,
    rect.y - 1,
    rect.x + rect.width * 0.59,
    rect.y + 10,
    rect.x + rect.width * 0.72,
    rect.y + rect.height * 0.19,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.45,
    rect.y + rect.height * 0.25,
    rect.x + rect.width * 0.17,
    rect.y + rect.height * 0.3,
    rect.x + 16,
    rect.y + rect.height * 0.38,
  );
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(91,56,39,0.17)';
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.25, rect.y + rect.height * 0.83);
  context.bezierCurveTo(
    rect.x + rect.width * 0.55,
    rect.y + rect.height * 0.76,
    rect.x + rect.width * 0.86,
    rect.y + rect.height * 0.7,
    rect.x + rect.width - 9,
    rect.y + rect.height * 0.62,
  );
  context.bezierCurveTo(
    rect.x + rect.width - 8,
    rect.y + rect.height * 0.86,
    rect.x + rect.width * 0.72,
    rect.y + rect.height + 4,
    rect.x + rect.width * 0.25,
    rect.y + rect.height * 0.83,
  );
  context.closePath();
  context.fill();

  const perforationX = illustration.x + illustration.width + 10;
  context.strokeStyle = 'rgba(103,70,43,0.42)';
  context.lineWidth = 2.2;
  context.lineCap = 'round';
  for (let index = 0; index < 9; index += 1) {
    const y = rect.y + 28 + index * 33;
    context.beginPath();
    context.moveTo(perforationX - 2, y);
    context.quadraticCurveTo(perforationX + 1 + (index % 2), y + 4, perforationX - 1, y + 8);
    context.stroke();
  }
  drawPlatformArch(context, illustration, shimmer);
}

function drawPlatformArch(context, rect, shimmer) {
  const centerX = rect.x + rect.width / 2;
  const baseY = rect.y + rect.height - 16;
  context.fillStyle = '#53464d';
  context.beginPath();
  context.moveTo(rect.x + 20, baseY);
  context.bezierCurveTo(rect.x + 17, baseY - 58, rect.x + 23, rect.y + 138, rect.x + 20, rect.y + 94);
  context.bezierCurveTo(rect.x + 28, rect.y + 25, rect.x + 78, rect.y + 10, centerX, rect.y + 9);
  context.bezierCurveTo(rect.x + rect.width - 76, rect.y + 13, rect.x + rect.width - 27, rect.y + 35, rect.x + rect.width - 20, rect.y + 96);
  context.bezierCurveTo(
    rect.x + rect.width - 17,
    rect.y + 138,
    rect.x + rect.width - 23,
    baseY - 58,
    rect.x + rect.width - 20,
    baseY,
  );
  context.closePath();
  context.fill();
  context.strokeStyle = '#3a2d22';
  context.lineWidth = 4.2;
  context.stroke();
  context.fillStyle = '#25263b';
  context.beginPath();
  context.moveTo(rect.x + 49, baseY);
  context.bezierCurveTo(rect.x + 47, baseY - 47, rect.x + 52, rect.y + 137, rect.x + 49, rect.y + 104);
  context.bezierCurveTo(rect.x + 58, rect.y + 58, rect.x + 91, rect.y + 43, centerX, rect.y + 43);
  context.bezierCurveTo(rect.x + rect.width - 91, rect.y + 43, rect.x + rect.width - 58, rect.y + 61, rect.x + rect.width - 49, rect.y + 105);
  context.bezierCurveTo(
    rect.x + rect.width - 47,
    rect.y + 137,
    rect.x + rect.width - 52,
    baseY - 47,
    rect.x + rect.width - 49,
    baseY,
  );
  context.closePath();
  context.fill();

  context.fillStyle = '#76522c';
  traceRoundedRect(context, centerX - 55, baseY - 88, 110, 78, 18);
  context.fill();
  context.strokeStyle = '#3a2d22';
  context.lineWidth = 3.5;
  context.stroke();
  context.fillStyle = '#9b7040';
  traceRoundedRect(context, centerX - 45, baseY - 80, 43, 35, 10);
  context.fill();
  context.fillStyle = '#d4a944';
  traceRoundedRect(context, centerX + 8, baseY - 79, 37, 34, 10);
  context.fill();
  context.fillStyle = 'rgba(255,225,145,0.38)';
  traceOrganicSpot(context, centerX + 23 + shimmer, baseY - 64, 11, 9, 0.17);
  context.fill();

  for (const wheelX of [centerX - 34, centerX + 35]) {
    context.fillStyle = '#332a2b';
    traceOrganicSpot(context, wheelX, baseY - 8, 18, 15, wheelX < centerX ? -0.13 : 0.11);
    context.fill();
    context.fillStyle = '#b48745';
    traceOrganicSpot(context, wheelX - 2, baseY - 10, 7, 6, wheelX < centerX ? 0.16 : -0.12);
    context.fill();
  }
  context.strokeStyle = '#8d6537';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(rect.x + 25, baseY + 7);
  context.bezierCurveTo(centerX - 55, baseY + 2, centerX + 58, baseY + 4, rect.x + rect.width - 24, baseY + 8);
  context.moveTo(rect.x + 30, baseY + 18);
  context.bezierCurveTo(centerX - 52, baseY + 14, centerX + 55, baseY + 15, rect.x + rect.width - 31, baseY + 18);
  context.stroke();
}

function drawChapterAction(context, label, rect) {
  context.save();
  context.fillStyle = 'rgba(50,32,29,0.26)';
  traceRoundedRect(context, rect.x + 6, rect.y + 8, rect.width, rect.height, 22);
  context.fill();
  context.fillStyle = '#ead7ae';
  traceRoundedRect(context, rect.x, rect.y, rect.width, rect.height, 22);
  context.fill();
  context.strokeStyle = PALETTE.interactive;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = 'rgba(255,246,219,0.5)';
  context.beginPath();
  context.moveTo(rect.x + 20, rect.y + 13);
  context.bezierCurveTo(
    rect.x + rect.width * 0.34,
    rect.y + 3,
    rect.x + rect.width * 0.62,
    rect.y + 8,
    rect.x + rect.width - 18,
    rect.y + 25,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.62,
    rect.y + 31,
    rect.x + rect.width * 0.31,
    rect.y + 32,
    rect.x + 20,
    rect.y + 13,
  );
  context.closePath();
  context.fill();
  drawChapterQuill(context, rect.x + 58, rect.y + rect.height / 2);
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, label, rect.x + rect.width / 2 + 30, rect.y + rect.height / 2 + 10, rect.width - 125);
  context.restore();
}

function drawChapterQuill(context, x, y) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.68);
  context.fillStyle = '#d4a944';
  context.beginPath();
  context.moveTo(-3, 23);
  context.bezierCurveTo(-16, 5, -14, -22, 5, -32);
  context.bezierCurveTo(22, -18, 19, 8, -3, 23);
  context.closePath();
  context.fill();
  context.strokeStyle = '#6d452d';
  context.lineWidth = 2.5;
  context.stroke();
  context.beginPath();
  context.moveTo(-10, 31);
  context.bezierCurveTo(-2, 14, 6, -5, 12, -26);
  context.moveTo(2, 11);
  context.quadraticCurveTo(-4, 7, -10, 4);
  context.moveTo(7, 0);
  context.quadraticCurveTo(14, -5, 18, -10);
  context.moveTo(10, -11);
  context.quadraticCurveTo(3, -15, -2, -17);
  context.stroke();
  context.restore();
}

function traceOrganicSpot(context, x, y, radiusX, radiusY, wobble = 0) {
  context.beginPath();
  context.moveTo(x - radiusX * (0.96 + wobble), y - radiusY * 0.07);
  context.bezierCurveTo(
    x - radiusX * 0.62,
    y - radiusY * (1.02 - wobble),
    x + radiusX * 0.4,
    y - radiusY * (0.88 + wobble),
    x + radiusX * (1.01 - wobble),
    y + radiusY * 0.05,
  );
  context.bezierCurveTo(
    x + radiusX * 0.56,
    y + radiusY * (0.93 - wobble),
    x - radiusX * 0.43,
    y + radiusY * (1.04 + wobble),
    x - radiusX * (0.96 + wobble),
    y - radiusY * 0.07,
  );
  context.closePath();
}

function drawInvitationButton(
  context,
  label,
  rect,
  { largeSeal = false, time = 0, image = null } = {},
) {
  const { x, y, width, height } = rect;
  if (largeSeal) {
    drawTitleLetter(context, label, rect, { time, image });
    return;
  }
  const sealRadius = largeSeal ? 47 : 34;
  const sealX = x + (largeSeal ? 72 : 58);
  const sealY = y + height / 2;
  context.save();
  context.fillStyle = 'rgba(20,17,38,0.45)';
  traceRoundedRect(context, x + 8, y + 11, width, height, 18);
  context.fill();
  context.fillStyle = '#ead7ae';
  traceRoundedRect(context, x, y, width, height, 18);
  context.fill();
  context.strokeStyle = PALETTE.interactive;
  context.lineWidth = 6;
  context.stroke();
  context.strokeStyle = 'rgba(126,86,45,0.55)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x + 10, y + 11);
  context.lineTo(x + width / 2, y + height * 0.58);
  context.lineTo(x + width - 10, y + 11);
  context.moveTo(x + 12, y + height - 12);
  context.lineTo(x + width * 0.4, y + height * 0.49);
  context.moveTo(x + width - 12, y + height - 12);
  context.lineTo(x + width * 0.6, y + height * 0.49);
  context.stroke();
  const sealPulse = largeSeal ? 1 + Math.sin(time * 2.4) * 0.035 : 1;
  context.save();
  context.translate(sealX, sealY);
  context.scale(sealPulse, sealPulse);
  drawWaxIcon(context, 0, 0, sealRadius, 'owl', { selected: true });
  context.restore();
  context.fillStyle = 'rgba(255,246,219,0.9)';
  traceRoundedRect(
    context,
    x + (largeSeal ? 133 : 105),
    y + height * 0.27,
    width - (largeSeal ? 155 : 124),
    height * 0.46,
    height * 0.2,
  );
  context.fill();
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = `700 ${largeSeal ? 31 : 28}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(context, label, x + width / 2 + (largeSeal ? 43 : 35), y + height / 2 + 10, width - (largeSeal ? 150 : 120));
  context.restore();
}

function drawTitleMasthead(context, safeArea) {
  const scale = Math.min(safeArea.width / 650, safeArea.height / 244);
  const centerX = safeArea.x + safeArea.width / 2;
  drawDisplayTitle(
    context,
    childFacingUiText('Violet', 'proper-name'),
    centerX,
    safeArea.y + safeArea.height * (131 / 244),
    101 * scale,
  );
  drawDisplayTitle(
    context,
    childFacingUiText('at Hogwarts', 'proper-name'),
    centerX,
    safeArea.y + safeArea.height * (206 / 244),
    67 * scale,
  );
}

function drawDisplayTitle(context, text, x, y, size) {
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.lineJoin = 'round';
  context.miterLimit = 2;
  context.font = `700 ${size}px "Almendra", Georgia, serif`;
  context.strokeStyle = 'rgba(23,15,31,0.82)';
  context.lineWidth = Math.max(7, size * 0.095);
  context.strokeText(text, x + 2, y + 4);
  context.strokeStyle = '#9e7838';
  context.lineWidth = Math.max(2, size * 0.026);
  context.strokeText(text, x, y);
  context.fillStyle = '#f6e6ba';
  context.fillText(text, x, y);
  context.fillStyle = 'rgba(255,250,218,0.34)';
  context.fillText(text, x - 0.8, y - 1.2);
  context.restore();
}

function drawTitleLetter(context, label, rect, { time = 0, image = null } = {}) {
  if (image?.complete && image.naturalWidth > 0) {
    drawPaintedTitleEnvelope(context, label, rect, image, time);
    return;
  }
  const { x, y, width, height } = rect;
  const scale = Math.min(width / 384, height / 126);
  const pulse = 1 + Math.sin(time * 1.8) * 0.012;
  const tilt = -0.024 + Math.sin(time * 0.72 + 0.8) * 0.0035;
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(tilt);
  context.scale(pulse, pulse);
  context.translate(-(x + width / 2), -(y + height / 2));

  for (const [spread, fill] of [
    [15, 'rgba(232,185,83,0.035)'],
    [9, 'rgba(232,185,83,0.06)'],
    [4, 'rgba(244,213,141,0.11)'],
  ]) {
    const inset = spread * scale;
    context.fillStyle = fill;
    traceTitleInvitation(context, x - inset, y - inset, width + inset * 2, height + inset * 2);
    context.fill();
  }

  context.fillStyle = 'rgba(13,10,24,0.43)';
  traceTitleInvitation(context, x + 7 * scale, y + 10 * scale, width, height);
  context.fill();
  context.fillStyle = '#d3b77d';
  traceTitleInvitation(context, x, y, width, height);
  context.fill();
  context.strokeStyle = '#4d352a';
  context.lineWidth = 3.2 * scale;
  context.stroke();

  context.save();
  traceTitleInvitation(context, x, y, width, height);
  context.clip();
  context.fillStyle = 'rgba(255,243,204,0.34)';
  traceTitleInvitationLight(context, x, y, width, height);
  context.fill();
  context.fillStyle = 'rgba(92,57,39,0.18)';
  traceTitleInvitationShade(context, x, y, width, height);
  context.fill();
  drawTitlePaperGrain(context, x, y, width, height, scale);
  context.restore();

  context.strokeStyle = 'rgba(255,244,207,0.54)';
  context.lineWidth = 1.25 * scale;
  traceTitleInvitation(
    context,
    x + 7 * scale,
    y + 6 * scale,
    width - 14 * scale,
    height - 12 * scale,
  );
  context.stroke();

  context.strokeStyle = 'rgba(83,55,39,0.47)';
  context.lineWidth = 1.8 * scale;
  context.beginPath();
  context.moveTo(x + 12 * scale, y + 14 * scale);
  context.bezierCurveTo(
    x + width * 0.2,
    y + height * 0.23,
    x + width * 0.38,
    y + height * 0.43,
    x + width / 2,
    y + height * 0.53,
  );
  context.bezierCurveTo(
    x + width * 0.63,
    y + height * 0.42,
    x + width * 0.8,
    y + height * 0.22,
    x + width - 12 * scale,
    y + 14 * scale,
  );
  context.moveTo(x + 12 * scale, y + height - 12 * scale);
  context.bezierCurveTo(
    x + width * 0.23,
    y + height * 0.83,
    x + width * 0.36,
    y + height * 0.61,
    x + width * 0.46,
    y + height * 0.54,
  );
  context.moveTo(x + width - 12 * scale, y + height - 12 * scale);
  context.bezierCurveTo(
    x + width * 0.78,
    y + height * 0.82,
    x + width * 0.65,
    y + height * 0.61,
    x + width * 0.54,
    y + height * 0.54,
  );
  context.stroke();

  const labelRect = {
    x: x + 91 * scale,
    y: y + 27 * scale,
    width: width - 111 * scale,
    height: 72 * scale,
  };
  drawTitleAddressSlip(context, labelRect, scale);
  drawTitleWaxSeal(context, x + 55 * scale, y + height * 0.52, 29 * scale);

  context.fillStyle = '#3a2923';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `700 ${25 * scale}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(
    context,
    label,
    labelRect.x + labelRect.width / 2,
    labelRect.y + labelRect.height / 2 + 1.5 * scale,
    labelRect.width - 28 * scale,
  );
  drawTitleInvitationMotes(context, x, y, width, height, time, scale);
  context.restore();
}

function drawPaintedTitleEnvelope(context, label, rect, image, time) {
  const { x, y, width, height } = rect;
  const pulse = 1 + Math.sin(time * 1.8) * 0.012;
  const tilt = -0.018 + Math.sin(time * 0.72 + 0.8) * 0.003;
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(tilt);
  context.scale(pulse, pulse);
  context.translate(-(x + width / 2), -(y + height / 2));
  context.drawImage(image, x, y, width, height);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  let size = 29;
  while (size > 20 && context.measureText(label).width > width * 0.72) {
    size -= 1;
    context.font = `700 ${size}px "Andika", "Trebuchet MS", sans-serif`;
  }
  context.strokeStyle = 'rgba(255,240,194,0.78)';
  context.lineWidth = 4.6;
  context.strokeText(label, x + width / 2, y + height * 0.37);
  context.fillStyle = '#4a3027';
  context.fillText(label, x + width / 2, y + height * 0.37);
  drawTitleInvitationMotes(context, x, y, width, height, time, Math.min(width / 440, height / 244));
  context.restore();
}

function traceTitleInvitation(context, x, y, width, height) {
  context.beginPath();
  context.moveTo(x + 17, y + 2);
  context.bezierCurveTo(
    x + width * 0.27,
    y - 1,
    x + width * 0.7,
    y + 4,
    x + width - 15,
    y + 2,
  );
  context.bezierCurveTo(
    x + width - 1,
    y + 6,
    x + width - 4,
    y + height * 0.66,
    x + width - 8,
    y + height - 15,
  );
  context.bezierCurveTo(
    x + width - 10,
    y + height,
    x + width * 0.29,
    y + height - 3,
    x + 15,
    y + height - 2,
  );
  context.bezierCurveTo(
    x + 1,
    y + height - 4,
    x + 5,
    y + height * 0.31,
    x + 3,
    y + 17,
  );
  context.bezierCurveTo(x + 4, y + 5, x + 8, y + 1, x + 17, y + 2);
  context.closePath();
}

function traceTitleInvitationLight(context, x, y, width, height) {
  context.beginPath();
  context.moveTo(x + 10, y + 8);
  context.bezierCurveTo(x + width * 0.28, y + 2, x + width * 0.57, y + 8, x + width * 0.76, y + 5);
  context.bezierCurveTo(x + width * 0.54, y + height * 0.34, x + width * 0.25, y + height * 0.46, x + 8, y + height * 0.57);
  context.bezierCurveTo(x + 5, y + height * 0.37, x + 7, y + height * 0.18, x + 10, y + 8);
  context.closePath();
}

function traceTitleInvitationShade(context, x, y, width, height) {
  context.beginPath();
  context.moveTo(x + width * 0.58, y + height * 0.56);
  context.bezierCurveTo(x + width * 0.76, y + height * 0.43, x + width * 0.92, y + height * 0.3, x + width - 3, y + height * 0.24);
  context.bezierCurveTo(x + width - 4, y + height * 0.55, x + width - 7, y + height * 0.84, x + width - 13, y + height - 4);
  context.bezierCurveTo(x + width * 0.82, y + height - 1, x + width * 0.68, y + height * 0.78, x + width * 0.58, y + height * 0.56);
  context.closePath();
}

function drawTitlePaperGrain(context, x, y, width, height, scale) {
  context.strokeStyle = 'rgba(97,62,42,0.14)';
  context.lineWidth = Math.max(0.7, scale * 0.85);
  context.beginPath();
  for (const [startX, startY, length, bend] of [
    [0.06, 0.24, 0.09, -0.018],
    [0.24, 0.16, 0.12, 0.014],
    [0.31, 0.84, 0.11, -0.013],
    [0.56, 0.18, 0.08, 0.018],
    [0.72, 0.79, 0.12, 0.014],
    [0.86, 0.27, 0.08, -0.017],
  ]) {
    const grainX = x + width * startX;
    const grainY = y + height * startY;
    context.moveTo(grainX, grainY);
    context.bezierCurveTo(
      grainX + width * length * 0.3,
      grainY + height * bend,
      grainX + width * length * 0.72,
      grainY - height * bend * 0.6,
      grainX + width * length,
      grainY + height * bend * 0.15,
    );
  }
  context.stroke();
}

function drawTitleAddressSlip(context, rect, scale) {
  context.fillStyle = 'rgba(49,30,27,0.23)';
  traceTitleAddressSlip(context, { ...rect, x: rect.x + 3 * scale, y: rect.y + 4 * scale });
  context.fill();
  context.fillStyle = '#f0dfb9';
  traceTitleAddressSlip(context, rect);
  context.fill();
  context.fillStyle = 'rgba(255,248,220,0.44)';
  traceTitleAddressSlipLight(context, rect);
  context.fill();
  context.strokeStyle = '#7b583d';
  context.lineWidth = 1.7 * scale;
  traceTitleAddressSlip(context, rect);
  context.stroke();
  context.strokeStyle = 'rgba(123,88,61,0.13)';
  context.lineWidth = Math.max(0.7, 0.8 * scale);
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.09, rect.y + rect.height * 0.25);
  context.bezierCurveTo(
    rect.x + rect.width * 0.19,
    rect.y + rect.height * 0.2,
    rect.x + rect.width * 0.23,
    rect.y + rect.height * 0.28,
    rect.x + rect.width * 0.31,
    rect.y + rect.height * 0.22,
  );
  context.moveTo(rect.x + rect.width * 0.72, rect.y + rect.height * 0.79);
  context.bezierCurveTo(
    rect.x + rect.width * 0.79,
    rect.y + rect.height * 0.73,
    rect.x + rect.width * 0.84,
    rect.y + rect.height * 0.82,
    rect.x + rect.width * 0.91,
    rect.y + rect.height * 0.76,
  );
  context.stroke();
}

function traceTitleAddressSlip(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + 9, y + 2);
  context.bezierCurveTo(x + width * 0.31, y - 1, x + width * 0.69, y + 3, x + width - 8, y + 1);
  context.bezierCurveTo(x + width + 1, y + 5, x + width - 3, y + height * 0.69, x + width - 6, y + height - 5);
  context.bezierCurveTo(x + width * 0.72, y + height + 1, x + width * 0.29, y + height - 2, x + 7, y + height);
  context.bezierCurveTo(x, y + height - 5, x + 4, y + height * 0.31, x + 9, y + 2);
  context.closePath();
}

function traceTitleAddressSlipLight(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + 7, y + 5);
  context.bezierCurveTo(x + width * 0.26, y + 1, x + width * 0.53, y + 5, x + width * 0.71, y + 4);
  context.bezierCurveTo(x + width * 0.55, y + height * 0.29, x + width * 0.29, y + height * 0.38, x + 5, y + height * 0.5);
  context.bezierCurveTo(x + 3, y + height * 0.29, x + 5, y + height * 0.14, x + 7, y + 5);
  context.closePath();
}

function drawTitleWaxSeal(context, x, y, radius) {
  context.save();
  context.translate(x, y);
  context.fillStyle = 'rgba(38,22,30,0.31)';
  traceTitleWaxBlob(context, 3, 4, radius * 1.04);
  context.fill();
  context.fillStyle = '#7c2f47';
  traceTitleWaxBlob(context, 0, 0, radius);
  context.fill();
  context.strokeStyle = '#482333';
  context.lineWidth = Math.max(1.6, radius * 0.09);
  context.stroke();
  context.fillStyle = 'rgba(224,139,139,0.3)';
  traceTitleWaxHighlight(context, radius);
  context.fill();
  drawPressedOwlMark(context, radius);
  context.restore();
}

function traceTitleWaxBlob(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x - radius * 0.94, y - radius * 0.12);
  context.bezierCurveTo(x - radius * 1.02, y - radius * 0.65, x - radius * 0.5, y - radius * 1.02, x - radius * 0.08, y - radius * 0.92);
  context.bezierCurveTo(x + radius * 0.43, y - radius * 1.05, x + radius * 0.98, y - radius * 0.6, x + radius * 0.91, y - radius * 0.04);
  context.bezierCurveTo(x + radius * 1.03, y + radius * 0.43, x + radius * 0.44, y + radius, x - radius * 0.05, y + radius * 0.9);
  context.bezierCurveTo(x - radius * 0.56, y + radius * 1.02, x - radius * 1.04, y + radius * 0.47, x - radius * 0.94, y - radius * 0.12);
  context.closePath();
}

function traceTitleWaxHighlight(context, radius) {
  context.beginPath();
  context.moveTo(-radius * 0.62, -radius * 0.3);
  context.bezierCurveTo(-radius * 0.4, -radius * 0.78, radius * 0.22, -radius * 0.82, radius * 0.52, -radius * 0.39);
  context.bezierCurveTo(radius * 0.15, -radius * 0.51, -radius * 0.23, -radius * 0.42, -radius * 0.62, -radius * 0.3);
  context.closePath();
}

function drawPressedOwlMark(context, radius) {
  context.strokeStyle = '#4d2635';
  context.lineWidth = Math.max(1.2, radius * 0.075);
  context.beginPath();
  context.moveTo(-radius * 0.48, -radius * 0.25);
  context.bezierCurveTo(-radius * 0.31, -radius * 0.54, -radius * 0.12, -radius * 0.53, 0, -radius * 0.31);
  context.bezierCurveTo(radius * 0.15, -radius * 0.54, radius * 0.34, -radius * 0.5, radius * 0.5, -radius * 0.22);
  context.moveTo(-radius * 0.44, -radius * 0.18);
  context.bezierCurveTo(-radius * 0.42, radius * 0.23, -radius * 0.23, radius * 0.52, 0, radius * 0.61);
  context.bezierCurveTo(radius * 0.27, radius * 0.5, radius * 0.43, radius * 0.22, radius * 0.48, -radius * 0.16);
  context.stroke();
  for (const eyeX of [-radius * 0.21, radius * 0.21]) {
    traceOrganicSpot(context, eyeX, -radius * 0.13, radius * 0.16, radius * 0.19, eyeX < 0 ? -0.025 : 0.025);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(-radius * 0.28, radius * 0.27);
  context.bezierCurveTo(-radius * 0.21, radius * 0.39, -radius * 0.14, radius * 0.41, -radius * 0.08, radius * 0.31);
  context.moveTo(radius * 0.08, radius * 0.31);
  context.bezierCurveTo(radius * 0.14, radius * 0.41, radius * 0.21, radius * 0.39, radius * 0.28, radius * 0.27);
  context.stroke();

  context.fillStyle = '#4d2635';
  for (const eyeX of [-radius * 0.21, radius * 0.21]) {
    traceOrganicSpot(context, eyeX, -radius * 0.13, radius * 0.075, radius * 0.095, eyeX < 0 ? -0.04 : 0.04);
    context.fill();
  }
  context.beginPath();
  context.moveTo(-radius * 0.11, radius * 0.02);
  context.bezierCurveTo(-radius * 0.04, -radius * 0.02, radius * 0.05, -radius * 0.01, radius * 0.11, radius * 0.03);
  context.bezierCurveTo(radius * 0.06, radius * 0.13, radius * 0.01, radius * 0.21, -radius * 0.02, radius * 0.24);
  context.bezierCurveTo(-radius * 0.04, radius * 0.17, -radius * 0.08, radius * 0.09, -radius * 0.11, radius * 0.02);
  context.closePath();
  context.fill();
  context.fillStyle = 'rgba(229,150,143,0.32)';
  traceOrganicSpot(context, -radius * 0.04, -radius * 0.38, radius * 0.26, radius * 0.1, 0.03);
  context.fill();
}

function drawTitleInvitationMotes(context, x, y, width, height, time, scale) {
  const positions = [
    [0.05, -0.06, 0.2],
    [0.94, 0.09, 1.8],
    [0.12, 1.05, 3.2],
    [0.87, 1.01, 4.6],
  ];
  for (const [px, py, phase] of positions) {
    const shimmer = 0.45 + (Math.sin(time * 1.25 + phase) + 1) * 0.18;
    context.globalAlpha = shimmer;
    context.fillStyle = '#ffd76a';
    const moteX = x + width * px;
    const moteY = y + height * py;
    traceOrganicSpot(context, moteX, moteY, 2.4 * scale, 3.1 * scale, Math.sin(phase) * 0.08);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawDressingMirror(context, rect, time, reducedMotion) {
  context.save();
  context.fillStyle = 'rgba(40,27,31,0.44)';
  traceDressingMirror(context, { ...rect, x: rect.x + 10, y: rect.y + 13 }, 0.71);
  context.fill();

  context.fillStyle = '#6a4935';
  traceDressingMirror(context, rect, 0.35);
  context.fill();
  context.strokeStyle = '#3a2d22';
  context.lineWidth = 6;
  context.stroke();

  const glass = dressingMirrorGlassRect(rect);
  context.fillStyle = '#34445d';
  traceDressingMirror(context, glass, 1.27);
  context.fill();
  context.strokeStyle = '#c49a4c';
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = 'rgba(28,31,50,0.42)';
  traceMirrorShade(context, glass);
  context.fill();
  context.fillStyle = 'rgba(218,222,207,0.19)';
  traceMirrorLight(context, glass, reducedMotion ? 0 : Math.sin(time * 0.38) * 3);
  context.fill();

  context.fillStyle = '#4c392f';
  traceMirrorPedestal(context, rect.x + 78, rect.y + rect.height - 21, rect.width - 156, 42, 2.1);
  context.fill();
  context.strokeStyle = '#3a2d22';
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = 'rgba(229,182,102,0.28)';
  traceMirrorPedestal(context, rect.x + 92, rect.y + rect.height - 25, rect.width - 190, 15, 3.4);
  context.fill();
  context.restore();
}

function dressingMirrorGlassRect(rect) {
  return {
    x: rect.x + 25,
    y: rect.y + 27,
    width: rect.width - 50,
    height: rect.height - 59,
  };
}

function drawFabricSwatch(context, swatch, index) {
  const { rect } = swatch;
  const fabric = { x: rect.x + 4, y: rect.y + 2, width: rect.width - 8, height: 76 };
  const phase = index * 0.73 + 0.41;
  context.save();

  context.fillStyle = 'rgba(55,37,39,0.34)';
  traceFabricSwatch(context, { ...fabric, x: fabric.x + 4, y: fabric.y + 6 }, phase + 0.3);
  context.fill();

  context.fillStyle = swatch.color;
  traceFabricSwatch(context, fabric, phase);
  context.fill();
  if (swatch.selected) {
    context.strokeStyle = '#382a24';
    context.lineWidth = 10;
    context.stroke();
    context.strokeStyle = PALETTE.interactive;
    context.lineWidth = 4.5;
    context.stroke();
  } else {
    context.strokeStyle = '#513b31';
    context.lineWidth = 3.5;
    context.stroke();
  }

  context.fillStyle = 'rgba(37,27,38,0.24)';
  traceFabricFold(context, fabric, phase);
  context.fill();
  context.fillStyle = 'rgba(255,231,177,0.24)';
  traceFabricHighlight(context, fabric, phase);
  context.fill();

  context.strokeStyle = 'rgba(245,226,183,0.36)';
  context.lineWidth = 1.6;
  context.beginPath();
  context.moveTo(fabric.x + 12, fabric.y + fabric.height * 0.55);
  context.bezierCurveTo(
    fabric.x + fabric.width * 0.33,
    fabric.y + fabric.height * (0.48 + Math.sin(phase) * 0.04),
    fabric.x + fabric.width * 0.67,
    fabric.y + fabric.height * (0.61 + Math.cos(phase) * 0.04),
    fabric.x + fabric.width - 11,
    fabric.y + fabric.height * 0.52,
  );
  context.stroke();

  if (swatch.selected) {
    drawVectorIcon(context, 'check', fabric.x + fabric.width - 14, fabric.y + 16, 29, {
      color: '#f8e8ba',
      secondary: '#5b422d',
    });
  }
  context.fillStyle = '#382a24';
  context.textAlign = 'center';
  context.font = '700 18px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(childFacingUiText(swatch.label, 'caption'), rect.x + rect.width / 2, rect.y + 104);
  context.restore();
}

function traceDressingMirror(context, rect, phase) {
  const wobble = Math.sin(phase * 5.3) * 3;
  context.beginPath();
  context.moveTo(rect.x + 31, rect.y + rect.height - 3);
  context.bezierCurveTo(
    rect.x + 13 + wobble,
    rect.y + rect.height * 0.77,
    rect.x + 17 - wobble,
    rect.y + rect.height * 0.27,
    rect.x + rect.width * 0.27,
    rect.y + 24,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.43,
    rect.y - 7 + wobble,
    rect.x + rect.width * 0.65,
    rect.y - 1 - wobble,
    rect.x + rect.width * 0.77,
    rect.y + 25,
  );
  context.bezierCurveTo(
    rect.x + rect.width - 13,
    rect.y + rect.height * 0.29,
    rect.x + rect.width - 19 + wobble,
    rect.y + rect.height * 0.76,
    rect.x + rect.width - 29,
    rect.y + rect.height - 2,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.72,
    rect.y + rect.height + 5,
    rect.x + rect.width * 0.29,
    rect.y + rect.height - 5,
    rect.x + 31,
    rect.y + rect.height - 3,
  );
  context.closePath();
}

function traceMirrorShade(context, rect) {
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.58, rect.y + 8);
  context.bezierCurveTo(
    rect.x + rect.width * 0.88,
    rect.y + rect.height * 0.18,
    rect.x + rect.width * 0.93,
    rect.y + rect.height * 0.72,
    rect.x + rect.width * 0.76,
    rect.y + rect.height - 7,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.64,
    rect.y + rect.height * 0.72,
    rect.x + rect.width * 0.51,
    rect.y + rect.height * 0.25,
    rect.x + rect.width * 0.58,
    rect.y + 8,
  );
  context.closePath();
}

function traceMirrorLight(context, rect, drift) {
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.18 + drift, rect.y + rect.height * 0.13);
  context.bezierCurveTo(
    rect.x + rect.width * 0.31 + drift,
    rect.y + rect.height * 0.04,
    rect.x + rect.width * 0.45 + drift,
    rect.y + rect.height * 0.11,
    rect.x + rect.width * 0.4 + drift,
    rect.y + rect.height * 0.23,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.31 + drift,
    rect.y + rect.height * 0.41,
    rect.x + rect.width * 0.2 + drift,
    rect.y + rect.height * 0.3,
    rect.x + rect.width * 0.18 + drift,
    rect.y + rect.height * 0.13,
  );
  context.closePath();
}

function traceMirrorPedestal(context, x, y, width, height, phase) {
  context.beginPath();
  context.moveTo(x + 8, y + Math.sin(phase) * 2);
  context.bezierCurveTo(x + width * 0.31, y - 4, x + width * 0.72, y + 5, x + width - 7, y + 1);
  context.bezierCurveTo(x + width + 4, y + height * 0.38, x + width - 2, y + height * 0.75, x + width - 14, y + height);
  context.bezierCurveTo(x + width * 0.7, y + height - 3, x + width * 0.28, y + height + 4, x + 11, y + height - 1);
  context.bezierCurveTo(x - 2, y + height * 0.72, x + 1, y + height * 0.31, x + 8, y + Math.sin(phase) * 2);
  context.closePath();
}

function traceFabricSwatch(context, rect, phase) {
  const wobble = Math.sin(phase * 2.7) * 2.2;
  context.beginPath();
  context.moveTo(rect.x + 9, rect.y + 1);
  context.bezierCurveTo(rect.x + rect.width * 0.31, rect.y - 3 + wobble, rect.x + rect.width * 0.73, rect.y + 4 - wobble, rect.x + rect.width - 7, rect.y + 2);
  context.bezierCurveTo(rect.x + rect.width + 3, rect.y + rect.height * 0.3, rect.x + rect.width - 4, rect.y + rect.height * 0.71, rect.x + rect.width - 9, rect.y + rect.height - 2);
  context.bezierCurveTo(rect.x + rect.width * 0.7, rect.y + rect.height + 4 - wobble, rect.x + rect.width * 0.27, rect.y + rect.height - 3 + wobble, rect.x + 8, rect.y + rect.height);
  context.bezierCurveTo(rect.x - 3, rect.y + rect.height * 0.74, rect.x + 4, rect.y + rect.height * 0.28, rect.x + 9, rect.y + 1);
  context.closePath();
}

function traceFabricFold(context, rect, phase) {
  context.beginPath();
  context.moveTo(rect.x + rect.width * 0.47, rect.y + 3);
  context.bezierCurveTo(
    rect.x + rect.width * (0.63 + Math.sin(phase) * 0.04),
    rect.y + rect.height * 0.24,
    rect.x + rect.width * 0.58,
    rect.y + rect.height * 0.71,
    rect.x + rect.width * 0.83,
    rect.y + rect.height - 3,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.67,
    rect.y + rect.height * 0.83,
    rect.x + rect.width * 0.42,
    rect.y + rect.height * 0.35,
    rect.x + rect.width * 0.47,
    rect.y + 3,
  );
  context.closePath();
}

function traceFabricHighlight(context, rect, phase) {
  context.beginPath();
  context.moveTo(rect.x + 9, rect.y + rect.height * 0.17);
  context.bezierCurveTo(
    rect.x + rect.width * 0.22,
    rect.y + Math.sin(phase) * 2,
    rect.x + rect.width * 0.47,
    rect.y + rect.height * 0.06,
    rect.x + rect.width * 0.53,
    rect.y + rect.height * 0.19,
  );
  context.bezierCurveTo(
    rect.x + rect.width * 0.39,
    rect.y + rect.height * 0.24,
    rect.x + rect.width * 0.22,
    rect.y + rect.height * 0.31,
    rect.x + 9,
    rect.y + rect.height * 0.17,
  );
  context.closePath();
}

function drawPanelNotice(context, notice) {
  if (!notice) return;
  context.save();
  context.fillStyle = notice.kind === 'error' ? '#6b2d3b' : '#3d5b46';
  traceRoundedRect(context, 340, 604, 600, 58, 22);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = '#fff8e8';
  context.textAlign = 'center';
  context.font = '700 20px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, notice.text, WORLD.width / 2, 641, 550);
  context.restore();
}

function vectorControlIcon(icon) {
  return (context, x, y, size) => drawVectorIcon(context, icon, x, y, size, {
    color: '#fff8e8',
    secondary: '#f4d58d',
  });
}

function drawDialogueCaption(context, rect, caption, night) {
  const words = String(caption).trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return;
  const text = words.join(' ');
  context.fillStyle = night ? '#f8e6ba' : '#382a24';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.font = '700 42px "Andika", "Trebuchet MS", sans-serif';
  const lines = balancedCaptionLines(context, words, rect.width - 28);
  let size = lines.length === 1 ? 42 : 40;
  context.font = `700 ${size}px "Andika", "Trebuchet MS", sans-serif`;
  while (size > 27 && lines.some((line) => context.measureText(line).width > rect.width - 28)) {
    size -= 1;
    context.font = `700 ${size}px "Andika", "Trebuchet MS", sans-serif`;
  }
  if (lines.length === 1) context.fillText(lines[0] ?? text, rect.x + rect.width / 2, rect.y + 62);
  else {
    const lineHeight = size + 4;
    const textBlockHeight = size + lineHeight * (lines.length - 1);
    const firstBaseline = rect.y + (rect.height - textBlockHeight) / 2 + size * 0.82;
    lines.forEach((line, index) => context.fillText(line, rect.x + rect.width / 2, firstBaseline + index * lineHeight));
  }
}

function drawDialogueReplayControl(context, rect, night) {
  context.save();
  context.fillStyle = night ? 'rgba(37,27,34,0.72)' : 'rgba(198,166,111,0.54)';
  traceDialogueControl(context, rect, 0.42);
  context.fill();
  context.strokeStyle = night ? '#d2a95b' : '#805632';
  context.lineWidth = 2.6;
  context.stroke();
  drawWaxIcon(context, rect.x + rect.width / 2, rect.y + 31, 23, 'speaker', {
    iconColor: night ? '#f8e4b4' : '#fff8e8',
  });
  context.fillStyle = night ? '#f2d89f' : '#513b2f';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.font = '700 18px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(
    childFacingUiText('Again', 'action'),
    rect.x + rect.width / 2,
    rect.y + rect.height - 8,
  );
  context.restore();
}

function drawDialogueAdvanceControl(context, rect, pulse, night) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.39;
  context.save();
  context.fillStyle = 'rgba(42,29,31,0.36)';
  traceDialogueMedallion(context, centerX + 4, centerY + 5, radius, 0.61);
  context.fill();
  context.fillStyle = night ? '#8f6633' : '#a97935';
  traceDialogueMedallion(context, centerX, centerY, radius, 0.23);
  context.fill();
  context.strokeStyle = '#3a2d22';
  context.lineWidth = 3.5;
  context.stroke();
  context.fillStyle = night ? '#d8ae58' : '#d4a84e';
  traceDialogueMedallion(context, centerX - 1, centerY - 2, radius * 0.79, 1.4);
  context.fill();
  context.strokeStyle = night ? '#f3d68b' : '#f4d58d';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = 'rgba(255,237,183,0.36)';
  traceDialogueMedallionHighlight(context, centerX, centerY, radius);
  context.fill();
  drawDialogueNextArrow(context, centerX, centerY, pulse, night);
  context.restore();
}

function balancedCaptionLines(context, words, maxWidth) {
  if (words.length < 2) return [words.join(' ') || 'Listen'];
  const oneLine = words.join(' ');
  if (context.measureText(oneLine).width <= maxWidth) return [oneLine];
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
    const widest = Math.max(...lines.map((line) => context.measureText(line).width));
    if (!best || widest < best.widest) best = { lines, widest };
  }
  return best?.lines ?? [oneLine];
}

function traceDialogueControl(context, rect, phase) {
  const { x, y, width, height } = rect;
  const wobble = Math.sin(phase * 7) * 1.7;
  context.beginPath();
  context.moveTo(x + 13, y + 2);
  context.bezierCurveTo(x + width * 0.34, y - 2 + wobble, x + width * 0.71, y + 3 - wobble, x + width - 10, y + 2);
  context.bezierCurveTo(x + width + 1, y + height * 0.29, x + width - 3, y + height * 0.74, x + width - 12, y + height - 1);
  context.bezierCurveTo(x + width * 0.7, y + height + 3 + wobble, x + width * 0.29, y + height - 2 - wobble, x + 10, y + height);
  context.bezierCurveTo(x - 2, y + height * 0.7, x + 3, y + height * 0.3, x + 13, y + 2);
  context.closePath();
}

function traceDialogueMedallion(context, centerX, centerY, radius, phase) {
  const points = [];
  for (let index = 0; index < 14; index += 1) {
    const angle = index * Math.PI * 2 / 14;
    const variance = 1 + Math.sin(phase + index * 1.73) * 0.055;
    points.push([
      centerX + Math.cos(angle) * radius * variance,
      centerY + Math.sin(angle) * radius * variance,
    ]);
  }
  context.beginPath();
  context.moveTo((points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2);
  for (let index = 1; index <= points.length; index += 1) {
    const point = points[index % points.length];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(
      point[0],
      point[1],
      (point[0] + next[0]) / 2,
      (point[1] + next[1]) / 2,
    );
  }
  context.closePath();
}

function traceDialogueMedallionHighlight(context, centerX, centerY, radius) {
  context.beginPath();
  context.moveTo(centerX - radius * 0.62, centerY - radius * 0.18);
  context.bezierCurveTo(
    centerX - radius * 0.45,
    centerY - radius * 0.72,
    centerX + radius * 0.23,
    centerY - radius * 0.8,
    centerX + radius * 0.53,
    centerY - radius * 0.36,
  );
  context.bezierCurveTo(
    centerX + radius * 0.08,
    centerY - radius * 0.48,
    centerX - radius * 0.27,
    centerY - radius * 0.21,
    centerX - radius * 0.62,
    centerY - radius * 0.18,
  );
  context.closePath();
}

function drawDialogueNextArrow(context, x, y, pulse, night) {
  context.save();
  context.translate(x, y);
  context.scale(pulse, pulse);
  context.fillStyle = 'rgba(42,29,31,0.34)';
  traceDialogueArrow(context, 3, 4);
  context.fill();
  context.fillStyle = night ? '#e4bc63' : '#704777';
  context.strokeStyle = night ? '#3b2c27' : '#3a2d22';
  context.lineWidth = 2.4;
  traceDialogueArrow(context, 0, 0);
  context.fill();
  context.stroke();
  context.strokeStyle = night ? 'rgba(255,239,190,0.62)' : 'rgba(229,193,226,0.52)';
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(-10, -8);
  context.quadraticCurveTo(2, -5, 12, 0);
  context.stroke();
  context.restore();
}

function traceDialogueArrow(context, offsetX, offsetY) {
  context.beginPath();
  context.moveTo(-15 + offsetX, -11 + offsetY);
  context.quadraticCurveTo(-2 + offsetX, -7 + offsetY, 15 + offsetX, -1 + offsetY);
  context.quadraticCurveTo(3 + offsetX, 6 + offsetY, -14 + offsetX, 12 + offsetY);
  context.quadraticCurveTo(-7 + offsetX, 1 + offsetY, -15 + offsetX, -11 + offsetY);
  context.closePath();
}

function fitText(context, text, x, y, maxWidth) {
  let size = Number.parseInt(context.font, 10) || 28;
  while (size > 18 && context.measureText(text).width > maxWidth) {
    size -= 1;
    context.font = context.font.replace(/\d+px/, `${size}px`);
  }
  context.fillText(text, x, y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3, align = 'left') {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && context.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  context.textAlign = align;
  const drawX = align === 'center' ? x + maxWidth / 2 : x;
  lines.slice(0, maxLines).forEach((entry, index) => context.fillText(entry, drawX, y + index * lineHeight));
}

function roundRect(context, x, y, width, height, radius) {
  traceRoundedRect(context, x, y, width, height, radius);
}

function storyGradient(context) {
  if (STORY_GRADIENTS.has(context)) return STORY_GRADIENTS.get(context);
  const gradient = context.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, PALETTE.night);
  gradient.addColorStop(0.68, PALETTE.twilight);
  gradient.addColorStop(1, PALETTE.ink);
  STORY_GRADIENTS.set(context, gradient);
  return gradient;
}

function nightDialogueGradient(context) {
  if (NIGHT_DIALOGUE_GRADIENTS.has(context)) return NIGHT_DIALOGUE_GRADIENTS.get(context);
  const gradient = context.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  gradient.addColorStop(0, '#28304d');
  gradient.addColorStop(0.58, '#34283c');
  gradient.addColorStop(1, '#17131f');
  NIGHT_DIALOGUE_GRADIENTS.set(context, gradient);
  return gradient;
}

export function pointInUiRect(point, rect) {
  const padding = Math.max(0, (INPUT.minimumTarget - Math.min(rect.width, rect.height)) / 2);
  return point.x >= rect.x - padding && point.x <= rect.x + rect.width + padding && point.y >= rect.y - padding && point.y <= rect.y + rect.height + padding;
}
