import { INPUT, PALETTE, WORLD } from '../config.js';
import { chapter1Map } from '../content/chapters/ch1.js';
import { buildMapState } from '../core/MapState.js';
import { ROBE_TRIMS, normalizeRobeTrim, robeTrimColor } from '../core/RobeTrims.js';
import { CharacterRenderer } from './CharacterRenderer.js';
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
  drawBrassCameoFrame,
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

const STORY_GRADIENTS = new WeakMap();
const NIGHT_DIALOGUE_GRADIENTS = new WeakMap();

export const UI_REVIEW_SCENES = Object.freeze([
  'ui-dialogue-review',
  'ui-dialogue-night-review',
  'ui-dialogue-center-review',
  'ui-broom-caption-review',
  'ui-letter-reading-review',
  'ui-choices-review',
  'ui-satchel-map-review',
  'ui-satchel-cards-review',
  'ui-objective-review',
  'ui-chapter-card-review',
]);

export const UI_RECTS = Object.freeze({
  quest: { x: 28, y: 28, width: 104, height: 104 },
  satchel: { x: 28, y: 584, width: 108, height: 108 },
  wand: { x: 1144, y: 584, width: 108, height: 108 },
  dialogueReplay: { x: 998, y: 522, width: 88, height: 88 },
  letterHear: { x: 238, y: 594, width: 374, height: 96 },
  letterContinue: { x: 668, y: 594, width: 374, height: 96 },
  robeConfirm: { x: 742, y: 548, width: 338, height: 102 },
  debugReset: { x: 510, y: 18, width: 260, height: 88 },
  satchelMapTab: { x: 205, y: 145, width: 210, height: 88 },
  satchelCardsTab: { x: 435, y: 145, width: 210, height: 88 },
  satchelKeyhole: { x: 698, y: 141, width: 96, height: 96 },
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
  height: 182,
  maximumWidth: 900,
  margin: 32,
  speakerGap: 30,
  portraitOverhang: 62,
});
const VISIBLE_UI_WORD = /[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu;

export function isAllowedChildFacingUiText(text, role) {
  const value = String(text ?? '').trim();
  if (!value) return false;
  if (role === 'parent' || role === 'story-object' || role === 'proper-name') return true;

  const wordCount = value.match(VISIBLE_UI_WORD)?.length ?? 0;
  if (role === 'symbol') return wordCount === 0;
  return (role === 'caption' || role === 'action') && wordCount <= 3;
}

function childFacingUiText(text, role) {
  const value = String(text ?? '').trim();
  return isAllowedChildFacingUiText(value, role) ? value : '';
}

export function dialogueSceneContext(state, dialogue = state?.dialogue) {
  const night = state?.roomVariant === 'dusk' || state?.roomVariant === 'night';
  const violetOutfit = state?.player?.outfit ?? 'robes';
  const violetRobeTrim = state?.player?.robeTrim ?? PALETTE.violet;
  const speaker = dialogue?.speaker;
  if (!speaker || speaker === 'npc.narrator') {
    return { night, speakerPosition: null, speakerBounds: null, violetOutfit, violetRobeTrim };
  }

  const cameraX = state?.cameraX ?? 0;
  let actor = null;
  if (speaker === 'npc.violet' && state?.player) actor = state.player;
  else if (speaker.startsWith('npc.pet.') && state?.pet) actor = state.pet;
  else actor = state?.occupants?.find((occupant) => occupant.npc === speaker) ?? null;
  if (!actor) return { night, speakerPosition: null, speakerBounds: null, violetOutfit, violetRobeTrim };

  const position = { x: actor.x - cameraX, y: actor.y };
  const dimensions = speakerDimensions(speaker);
  return {
    night,
    violetOutfit,
    violetRobeTrim,
    speakerPosition: position,
    speakerBounds: {
      left: position.x - dimensions.width / 2,
      right: position.x + dimensions.width / 2,
      top: position.y - dimensions.height,
      bottom: position.y + dimensions.ground,
    },
  };
}

export function dialogueScrollLayout({ speakerBounds = null } = {}) {
  const frame = {
    x: (WORLD.width - DIALOGUE_FRAME.maximumWidth) / 2,
    y: DIALOGUE_FRAME.y,
    width: DIALOGUE_FRAME.maximumWidth,
    height: DIALOGUE_FRAME.height,
  };
  let side = 'center';
  const overlapsDialogueBand = speakerBounds
    && speakerBounds.bottom >= frame.y - 8
    && speakerBounds.top <= frame.y + frame.height + 8;

  if (overlapsDialogueBand) {
    const leftEdge = speakerBounds.left - DIALOGUE_FRAME.speakerGap - DIALOGUE_FRAME.portraitOverhang;
    const leftSpace = Math.max(0, leftEdge - DIALOGUE_FRAME.margin);
    const rightEdge = speakerBounds.right + DIALOGUE_FRAME.speakerGap + DIALOGUE_FRAME.portraitOverhang;
    const rightSpace = Math.max(0, WORLD.width - DIALOGUE_FRAME.margin - rightEdge);
    if (rightSpace >= leftSpace) {
      side = 'right';
      frame.x = rightEdge;
      frame.width = Math.min(DIALOGUE_FRAME.maximumWidth, rightSpace);
    } else {
      side = 'left';
      frame.width = Math.min(DIALOGUE_FRAME.maximumWidth, leftSpace);
      frame.x = leftEdge - frame.width;
    }
  }

  const portraitSide = side === 'left' ? 'right' : 'left';
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
    captionRect: {
      x: captionLeft,
      y: frame.y + 18,
      width: Math.max(1, captionRight - captionLeft),
      height: frame.height - 36,
    },
    controlX,
    replayRect,
    advanceRect,
    rotation: 0,
  };
}

export function robePickerLayout(selectedTrim = 'purple') {
  const selected = normalizeRobeTrim(selectedTrim);
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
    preview: Object.freeze({ x: 96, y: 84, width: 438, height: 548 }),
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
    action: Object.freeze({
      x: envelope.x + envelope.width * (24 / 550),
      y: envelope.y + envelope.height * (29 / 196),
      width: envelope.width * (492 / 550),
      height: envelope.height * (142 / 196),
    }),
  });
}

export function objectiveOverlayLayout() {
  return Object.freeze({
    panel: Object.freeze({ x: 250, y: 150, width: 780, height: 420 }),
    compass: Object.freeze({ x: 520, y: 188, width: 240, height: 184 }),
    caption: Object.freeze({ x: 350, y: 390, width: 580, height: 92 }),
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

function speakerDimensions(speaker) {
  if (speaker === 'npc.guide') return { width: 244, height: 340, ground: 35 };
  if (speaker === 'npc.violet') return { width: 148, height: 228, ground: 32 };
  if (speaker === 'npc.owlPost' || speaker.includes('.owl')) return { width: 154, height: 188, ground: 25 };
  if (speaker.startsWith('npc.pet.')) return { width: 132, height: 142, ground: 28 };
  return { width: 148, height: 236, ground: 32 };
}

export class UIRenderer {
  constructor({
    resolveAsset = () => null,
    characterRenderer = new CharacterRenderer(),
    mapRenderer = new IllustratedMapRenderer(),
    titleRenderer = null,
  } = {}) {
    this.resolveAsset = resolveAsset;
    this.characterRenderer = characterRenderer;
    this.mapRenderer = mapRenderer;
    this.titleRenderer = titleRenderer ?? new StorybookTitleRenderer({ characterRenderer });
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
    } else if (scene === 'ui-broom-caption-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.violet', speakerLabel: 'Violet', portraitPose: 'wonder',
        caption: 'Flying broom!', text: 'That broom looks fast!',
      };
      const player = { kind: 'violet', x: 1060, y: 665, facing: 'left', pose: 'wonder', wand: true };
      this.characterRenderer.draw(context, player, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, player, cameraX: 0, roomVariant: 'base' }),
      );
    } else if (scene === 'ui-dialogue-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.guide', speakerLabel: 'Hagrid', portraitPose: 'talk',
        caption: 'This way!', text: 'Come along, Violet. Diagon Alley is waiting for you.',
      };
      const guide = { npc: 'npc.guide', kind: 'guide', x: 220, y: 665, facing: 'right', pose: 'speaking' };
      this.characterRenderer.draw(context, guide, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, occupants: [guide], cameraX: 0, roomVariant: 'base' }),
      );
    } else if (scene === 'ui-dialogue-night-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.wandmaker', speakerLabel: 'Wandmaker', portraitPose: 'curious',
        caption: 'Your wand!', text: 'Curious… this wand has been waiting for you.',
      };
      const wandmaker = {
        npc: 'npc.wandmaker', kind: 'wandmaker', x: 1040, y: 665, facing: 'left', pose: 'curious',
      };
      this.characterRenderer.draw(context, wandmaker, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, occupants: [wandmaker], cameraX: 0, roomVariant: 'dusk' }),
      );
    } else if (scene === 'ui-dialogue-center-review') {
      const dialogue = {
        type: 'line', speaker: 'npc.violet', speakerLabel: 'Violet', portraitPose: 'talk',
        caption: 'Spells come later!', text: 'I need a spell!',
      };
      const player = { kind: 'violet', x: 640, y: 665, facing: 'right', pose: 'speaking', wand: true };
      this.characterRenderer.draw(context, player, time);
      this.drawDialogue(
        context,
        dialogue,
        time,
        false,
        reducedMotion,
        dialogueSceneContext({ dialogue, player, cameraX: 0, roomVariant: 'base' }),
      );
    } else if (scene === 'ui-choices-review') {
      this.drawDialogue(context, {
        type: 'choice',
        choices: [
          { id: 'owl', icon: 'pet-owl', caption: 'Owl' },
          { id: 'cat', icon: 'pet-cat', caption: 'Cat' },
          { id: 'toad', icon: 'pet-toad', caption: 'Toad' },
        ],
      }, time, false, reducedMotion);
    } else if (scene === 'ui-satchel-map-review') {
      this.drawSatchel(context, {
        overlay: { surface: 'satchel', tab: 'map' },
        roomId: 'ch1.diagonStreet',
        unlockedRooms: ['ch1.ollivanders', 'ch1.malkins', 'ch1.menagerie'],
        objective: { mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' } },
        affordances: {
          quiet: true,
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
    } else if (scene === 'ui-satchel-cards-review') {
      this.drawSatchel(context, {
        overlay: { surface: 'satchel', tab: 'cards' },
        unlockedRooms: ['ch1.ollivanders', 'ch1.malkins', 'ch1.menagerie'],
        objective: { mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' } },
        cards: ['morgana'],
      }, [
        { id: 'morgana', name: 'Morgana', portraitAsset: null },
        { id: 'dumbledore', name: 'Dumbledore', portraitAsset: null },
      ]);
    } else if (scene === 'ui-objective-review') {
      this.drawObjective(
        context,
        { caption: 'Choose a pet', text: 'Visit the Magical Menagerie with Hagrid.' },
        time,
        { reducedMotion },
      );
    } else {
      this.drawChapterCard(context, {
        title: 'Platform Nine and Three-Quarters',
        buttonLabel: 'Continue',
      }, time, { reducedMotion });
    }
    return true;
  }

  drawHud(context, state, time, reducedMotion = false) {
    if (state.overlay || state.dialogue || state.screen !== 'playing') return;
    const animationTime = reducedMotion ? 0 : time;
    drawQuestButton(context, UI_RECTS.quest, animationTime, Boolean(state.newObjective) && !reducedMotion);
    drawSatchelButton(context, UI_RECTS.satchel);
    drawAffordancePresentation(
      context,
      hudGoldenThreadPresentation(state, time, { reducedMotion }),
    );
    drawWandButton(context, UI_RECTS.wand, Boolean(state.hasWand), animationTime);
  }

  drawDialogue(context, dialogue, time, muted = false, reducedMotion = false, scene = {}) {
    if (!dialogue) return;
    context.fillStyle = scene.night ? 'rgba(13,10,24,0.1)' : 'rgba(20,17,38,0.14)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    if (dialogue.type === 'choice' && dialogue.choices?.length) {
      this.drawChoices(context, dialogue.choices);
      return null;
    }
    const layout = dialogueScrollLayout(scene);
    const { frame, portrait, captionRect, replayRect, advanceRect } = layout;
    const animationTime = reducedMotion ? 0 : time;
    context.save();
    drawDialogueScroll(context, frame, {
      night: Boolean(scene.night),
      portraitSide: layout.portraitSide,
    });

    const portraitDrawn = typeof this.characterRenderer?.drawPortrait === 'function';
    if (portraitDrawn) {
      this.characterRenderer.drawPortrait(context, {
        speaker: dialogue.speaker,
        pose: dialogue.portraitPose ?? 'talk',
        x: portrait.x,
        y: portrait.y,
        scale: portrait.scale,
        outfit: dialogue.speaker === 'npc.violet' ? scene.violetOutfit : undefined,
        robeTrim: dialogue.speaker === 'npc.violet' ? scene.violetRobeTrim : undefined,
      }, animationTime);
    } else {
      const radius = 49;
      drawBrassCameoFrame(context, portrait.x, portrait.y, radius);
      context.save();
      context.beginPath();
      context.ellipse(portrait.x, portrait.y, 43, 47, 0, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = '#3a3046';
      context.fillRect(portrait.x - 48, portrait.y - 51, 96, 102);
      drawVectorIcon(context, dialogue.speaker === 'npc.narrator' ? 'quill' : 'owl', portrait.x, portrait.y, 59, {
        color: PALETTE.parchment,
        secondary: PALETTE.candle,
      });
      context.restore();
    }

    drawDialogueCaption(
      context,
      captionRect,
      childFacingUiText(dialogue.caption ?? 'Listen', 'caption'),
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
    context.fillStyle = 'rgba(20,17,38,0.66)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawReadableInvitation(context);
    drawParchmentAction(context, UI_RECTS.letterHear, {
      label: childFacingUiText('Hear the letter', 'action'),
      icon: vectorControlIcon('speaker'),
      selected: true,
    });
    drawParchmentAction(context, UI_RECTS.letterContinue, {
      label: childFacingUiText('Let’s go!', 'action'),
      icon: vectorControlIcon('check'),
      selected: true,
    });
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
      kind: 'violet',
      x: 315,
      y: 650,
      scale: 1.68,
      facing: 'right',
      pose: 'wonder',
      outfit: 'robes',
      walking: false,
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
      speakerLabel: 'Story so far',
      caption: recap.caption,
      text: recap.text,
    }, time, muted, reducedMotion, scene);
  }

  drawChoices(context, choices) {
    const width = 262;
    const gap = 28;
    const total = choices.length * width + (choices.length - 1) * gap;
    const startX = (WORLD.width - total) / 2;
    choices.forEach((choice, index) => {
      const rect = { x: startX + index * (width + gap), y: 244, width, height: 166 };
      choice.__rect = rect;
      drawDeckledParchment(context, rect, { ornament: false });
      drawWaxIcon(context, rect.x + width / 2, rect.y + 62, 43, choice.icon, { selected: true });
      context.fillStyle = '#382a24';
      context.textAlign = 'center';
      context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
      fitText(
        context,
        childFacingUiText(choice.caption, 'caption'),
        rect.x + width / 2,
        rect.y + 134,
        width - 34,
      );
    });
  }

  drawSatchel(context, state, cardDefinitions = [], {
    parentGateProgress = 0,
    time = 0,
    reducedMotion = false,
  } = {}) {
    const activeTab = state.overlay?.tab === 'cards' ? 'cards' : 'map';
    drawStorybookSpread(context, { x: 72, y: 32, width: 1136, height: 652 }, {
      title: childFacingUiText('Violet’s Satchel', 'proper-name'),
    });

    const content = activeTab === 'cards'
      ? this.drawCardAlbumContent(context, state, cardDefinitions)
      : this.drawMapContent(context, state, time, { reducedMotion });

    // Leather tabs, the grown-up keyhole, and the close seal belong to the
    // satchel itself, so they stay above the illustrated page content.
    drawSatchelTab(
      context,
      UI_RECTS.satchelMapTab,
      'map',
      childFacingUiText('Map', 'caption'),
      activeTab === 'map',
    );
    drawSatchelTab(
      context,
      UI_RECTS.satchelCardsTab,
      'cards',
      childFacingUiText('Cards', 'caption'),
      activeTab === 'cards',
    );
    drawBrassKeyhole(context, UI_RECTS.satchelKeyhole, { progress: parentGateProgress });
    drawClose(context);
    return content;
  }

  drawMap(context, state) {
    return this.drawSatchel(context, state, []);
  }

  drawMapContent(context, state, time = 0, { reducedMotion = false } = {}) {
    const mapState = buildMapState(chapter1Map, state);
    return this.mapRenderer.draw(context, mapState, state, time, { reducedMotion });
  }

  mapPresentation(state, time = 0, { reducedMotion = false } = {}) {
    return createIllustratedMapPresentation(
      buildMapState(chapter1Map, state),
      state,
      time,
      { reducedMotion },
    );
  }

  drawCardAlbumContent(context, state, cardDefinitions) {
    const entries = buildCardAlbumEntries(cardDefinitions, state.cards ?? []);
    for (const entry of entries) this.drawAlbumCard(context, entry);
    state.__cardSlots = entries;
    return entries;
  }

  drawAlbumCard(context, entry) {
    const rect = entry.__rect;
    context.save();
    drawDeckledParchment(context, rect, {
      fill: entry.earned ? '#6a4c35' : '#5a5264',
      edge: entry.earned ? PALETTE.candle : '#9a8fa2',
      ornament: false,
      lighting: 'dark',
    });

    const portrait = { x: rect.x + 38, y: rect.y + 28, width: rect.width - 76, height: 250 };
    if (entry.earned) {
      const image = this.imageFor(entry.portraitAsset);
      if (image?.complete && image.naturalWidth > 0) drawCoverImage(context, image, portrait, 20);
      else drawPortraitLoading(context, portrait);
    } else drawLockedPortrait(context, portrait);

    if (entry.earned) {
      context.textAlign = 'center';
      context.fillStyle = PALETTE.parchment;
      context.font = '700 31px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(
        childFacingUiText(entry.name, 'proper-name'),
        rect.x + rect.width / 2,
        rect.y + 327,
      );
    }
    context.restore();
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
      drawDeckledParchment(context, rect, { ornament: false });
      context.fillStyle = option.color ?? '#6e4b68';
      context.beginPath();
      context.arc(rect.x + width / 2, rect.y + 91, 60, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = PALETTE.candle;
      context.lineWidth = 5;
      context.stroke();
      drawVectorIcon(context, option.icon, rect.x + width / 2, rect.y + 91, 88, {
        color: '#fff8e8',
        secondary: '#f4d58d',
      });
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
  }

  drawObjective(context, objective, time = 0, { reducedMotion = false } = {}) {
    const layout = objectiveOverlayLayout();
    context.fillStyle = 'rgba(20,17,38,0.74)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawDeckledParchment(context, layout.panel, { ornament: false });
    drawObjectiveCompass(context, layout.compass, reducedMotion ? 0 : time, { reducedMotion });
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 42px "Andika", "Trebuchet MS", sans-serif';
    fitText(
      context,
      childFacingUiText(objective?.caption ?? 'Explore!', 'caption'),
      layout.caption.x + layout.caption.width / 2,
      layout.caption.y + layout.caption.height * 0.66,
      layout.caption.width,
    );
    drawClose(context);
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
    const presentation = this.titleRenderer.draw(context, animationTime, { reducedMotion });
    const layout = titleForegroundLayout(presentation);
    drawTitleMasthead(context, layout.masthead);
    drawInvitationButton(context, childFacingUiText(
      hasSave ? 'Return to Hogwarts' : 'Open Violet’s letter',
      'action',
    ), layout.action, {
      largeSeal: true,
      time: animationTime,
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
    context.fillText('DEV: Reset game', rect.x + rect.width / 2, rect.y + rect.height / 2 + 9);
    context.restore();
  }

  drawReplayExit(context) {
    drawReplayRibbon(context, UI_RECTS.replayExit);
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
      label: model.replayMode ? 'Return to saved game' : 'Replay Chapter One',
      detail: model.replayMode
        ? 'Leave this practice adventure'
        : model.chapter1Completed ? 'Play from the letter again' : 'Unlocks after Chapter One',
      icon: vectorControlIcon('replay'),
      disabled: !model.replayMode && !model.chapter1Completed,
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
    drawStorybookSpread(context, { x: 72, y: 32, width: 1136, height: 652 }, {
      title: childFacingUiText('Violet’s Yearbook', 'proper-name'),
    });
    drawClose(context);

    if (entries.length === 0) {
      drawWaxMedallion(context, WORLD.width / 2, 340, 76, vectorControlIcon('cards'));
      return;
    }

    const safeIndex = Math.max(0, Math.min(entries.length - 1, index));
    const entry = entries[safeIndex];
    const photo = { x: 300, y: 155, width: 680, height: 382 };
    context.fillStyle = '#5b4231';
    traceRoundedRect(context, photo.x - 13, photo.y - 13, photo.width + 26, photo.height + 26, 28);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 6;
    context.stroke();
    const image = this.yearbookImageFor(entry);
    if (image?.complete && image.naturalWidth > 0) drawCoverImage(context, image, photo, 18);
    else drawPortraitLoading(context, photo);

    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(childFacingUiText(entry.caption, 'caption'), WORLD.width / 2, 585);
    if (entries.length > 1) {
      drawYearbookPageDots(context, entries.length, safeIndex);
      drawParchmentAction(context, UI_RECTS.yearbookPrevious, {
        icon: childFacingUiText('‹', 'symbol'),
        compact: true,
      });
      drawParchmentAction(context, UI_RECTS.yearbookNext, {
        label: childFacingUiText('Next', 'action'),
        icon: childFacingUiText('›', 'symbol'),
        compact: true,
      });
    }
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

export function drawYearbookPageDots(context, count, activeIndex) {
  const spacing = 22;
  const startX = WORLD.width / 2 - ((count - 1) * spacing) / 2;
  context.save();
  for (let index = 0; index < count; index += 1) {
    context.fillStyle = index === activeIndex ? '#66405f' : '#b9a17d';
    traceYearbookPageDot(
      context,
      startX + index * spacing,
      624,
      index === activeIndex ? 7 : 5,
      index,
    );
    context.fill();
  }
  context.restore();
}

function traceYearbookPageDot(context, x, y, radius, index) {
  const wobble = [-0.09, 0.04, 0.11][index % 3];
  context.beginPath();
  context.moveTo(x - radius * (0.92 + wobble), y - radius * 0.14);
  context.bezierCurveTo(
    x - radius * (0.82 - wobble),
    y - radius * (0.72 + wobble),
    x - radius * (0.22 + wobble),
    y - radius * (1.04 - wobble),
    x + radius * (0.38 - wobble),
    y - radius * (0.88 + wobble),
  );
  context.bezierCurveTo(
    x + radius * (0.92 + wobble),
    y - radius * (0.58 - wobble),
    x + radius * (1.02 - wobble),
    y + radius * (0.06 + wobble),
    x + radius * (0.78 + wobble),
    y + radius * (0.54 - wobble),
  );
  context.bezierCurveTo(
    x + radius * (0.45 - wobble),
    y + radius * (1.02 + wobble),
    x - radius * (0.17 - wobble),
    y + radius * (0.96 - wobble),
    x - radius * (0.66 + wobble),
    y + radius * (0.68 + wobble),
  );
  context.bezierCurveTo(
    x - radius * (1.02 - wobble),
    y + radius * (0.38 - wobble),
    x - radius * (1.04 + wobble),
    y + radius * (0.06 - wobble),
    x - radius * (0.92 + wobble),
    y - radius * 0.14,
  );
  context.closePath();
}

export function buildCardAlbumEntries(cardDefinitions, earnedCardIds) {
  const earned = new Set(earnedCardIds);
  const slotWidth = 330;
  const slotHeight = 375;
  const gap = 50;
  const columns = Math.max(1, Math.min(2, cardDefinitions.length));
  const startX = (WORLD.width - (columns * slotWidth + (columns - 1) * gap)) / 2;
  return cardDefinitions.map((card, index) => ({
    ...card,
    earned: earned.has(card.id),
    __rect: {
      x: startX + (index % columns) * (slotWidth + gap),
      y: 286 + Math.floor(index / columns) * (slotHeight + 28),
      width: slotWidth,
      height: slotHeight,
    },
  }));
}

function drawSatchelTab(context, rect, icon, label, active) {
  context.save();
  drawLeatherBookmark(context, rect, { active });
  drawVectorIcon(context, icon, rect.x + 47, rect.y + rect.height / 2, 51, {
    color: active ? '#fff8e8' : '#30261f',
    secondary: active ? '#f4d58d' : '#c8a876',
  });
  context.fillStyle = active ? '#fff8e8' : '#30261f';
  context.textAlign = 'center';
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, rect.x + 130, rect.y + 56);
  context.restore();
}

function drawCoverImage(context, image, rect, radius) {
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
  roundRect(context, rect.x, rect.y, rect.width, rect.height, radius);
  context.clip();
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, rect.x, rect.y, rect.width, rect.height);
  context.restore();
}

function drawPortraitLoading(context, rect) {
  context.fillStyle = '#3d3347';
  roundRect(context, rect.x, rect.y, rect.width, rect.height, 20);
  context.fill();
  drawVectorIcon(context, 'owl', rect.x + rect.width / 2, rect.y + rect.height / 2, 98, {
    color: PALETTE.candle,
    secondary: '#6f5d78',
  });
}

function drawLockedPortrait(context, rect) {
  context.fillStyle = '#403949';
  roundRect(context, rect.x, rect.y, rect.width, rect.height, 20);
  context.fill();
  context.strokeStyle = '#82768c';
  context.lineWidth = 5;
  roundRect(context, rect.x + 15, rect.y + 15, rect.width - 30, rect.height - 30, 14);
  context.stroke();
  drawVectorIcon(context, 'owl', rect.x + rect.width / 2, rect.y + rect.height / 2 - 9, 104, {
    color: '#a99daf',
    secondary: '#51495a',
  });
  drawWaxIcon(context, rect.x + rect.width / 2, rect.y + rect.height - 43, 28, 'close');
}

function drawQuestButton(context, rect, time, pulse) {
  drawCompassQuest(context, rect, time, { pulse });
}

function drawSatchelButton(context, rect) {
  drawLeatherSatchel(context, rect);
}

export function hudGoldenThreadPresentation(state, time, { reducedMotion = false } = {}) {
  const thread = state?.affordances?.thread;
  if (
    state?.affordances?.quiet
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

function drawWandButton(context, rect, enabled, time = 0) {
  drawBrassWandHolster(context, rect, { enabled, time });
}

function drawClose(context) {
  drawWaxIcon(context, 1090, 120, 45, 'close');
}

function drawObjectiveCompass(context, rect, time, { reducedMotion = false } = {}) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 1.7) * 0.018;
  context.save();
  context.translate(centerX, centerY);
  context.scale(pulse, pulse);
  context.translate(-centerX, -centerY);

  context.fillStyle = 'rgba(54,35,29,0.28)';
  traceCompassBody(context, centerX + 7, centerY + 9, 94, 76);
  context.fill();
  context.fillStyle = '#b48545';
  traceCompassBody(context, centerX, centerY, 94, 76);
  context.fill();
  context.strokeStyle = '#5f402b';
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = '#e6d3a5';
  traceCompassBody(context, centerX - 2, centerY - 1, 75, 60);
  context.fill();
  context.strokeStyle = '#8d6537';
  context.lineWidth = 2.4;
  context.stroke();
  context.fillStyle = 'rgba(255,244,210,0.35)';
  traceCompassLight(context, centerX, centerY, 72, 57);
  context.fill();
  context.fillStyle = 'rgba(93,58,39,0.16)';
  traceCompassShade(context, centerX, centerY, 73, 58);
  context.fill();

  context.strokeStyle = 'rgba(105,72,43,0.58)';
  context.lineWidth = 2.5;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(centerX - 52, centerY + 2);
  context.quadraticCurveTo(centerX - 61, centerY, centerX - 67, centerY - 2);
  context.moveTo(centerX + 52, centerY - 1);
  context.quadraticCurveTo(centerX + 60, centerY + 2, centerX + 66, centerY + 1);
  context.moveTo(centerX - 1, centerY - 44);
  context.quadraticCurveTo(centerX + 1, centerY - 52, centerX + 3, centerY - 58);
  context.moveTo(centerX + 2, centerY + 44);
  context.quadraticCurveTo(centerX - 1, centerY + 51, centerX - 2, centerY + 57);
  context.stroke();

  drawCompassNeedle(context, centerX, centerY, -7, -55, '#d7a942', '#f4d58d');
  drawCompassNeedle(context, centerX, centerY, 8, 52, '#66405f', '#9d6f98');
  context.fillStyle = '#6d452d';
  traceOrganicSpot(context, centerX, centerY, 10, 9, 0.13);
  context.fill();
  context.fillStyle = '#f0cb70';
  traceOrganicSpot(context, centerX - 2, centerY - 2, 4.2, 3.5, -0.18);
  context.fill();
  context.restore();
}

function traceCompassBody(context, x, y, radiusX, radiusY) {
  context.beginPath();
  context.moveTo(x - radiusX * 0.96, y - radiusY * 0.08);
  context.bezierCurveTo(
    x - radiusX * 0.78,
    y - radiusY * 0.79,
    x - radiusX * 0.24,
    y - radiusY * 1.04,
    x + radiusX * 0.09,
    y - radiusY * 0.96,
  );
  context.bezierCurveTo(
    x + radiusX * 0.68,
    y - radiusY * 0.91,
    x + radiusX * 1.02,
    y - radiusY * 0.38,
    x + radiusX * 0.95,
    y + radiusY * 0.08,
  );
  context.bezierCurveTo(
    x + radiusX * 0.86,
    y + radiusY * 0.69,
    x + radiusX * 0.26,
    y + radiusY * 1.02,
    x - radiusX * 0.12,
    y + radiusY * 0.94,
  );
  context.bezierCurveTo(
    x - radiusX * 0.7,
    y + radiusY * 0.88,
    x - radiusX * 1.03,
    y + radiusY * 0.4,
    x - radiusX * 0.96,
    y - radiusY * 0.08,
  );
  context.closePath();
}

function traceCompassLight(context, x, y, radiusX, radiusY) {
  context.beginPath();
  context.moveTo(x - radiusX * 0.78, y - radiusY * 0.2);
  context.bezierCurveTo(
    x - radiusX * 0.58,
    y - radiusY * 0.83,
    x - radiusX * 0.08,
    y - radiusY * 0.88,
    x + radiusX * 0.24,
    y - radiusY * 0.7,
  );
  context.bezierCurveTo(
    x - radiusX * 0.02,
    y - radiusY * 0.42,
    x - radiusX * 0.34,
    y - radiusY * 0.2,
    x - radiusX * 0.78,
    y - radiusY * 0.2,
  );
  context.closePath();
}

function traceCompassShade(context, x, y, radiusX, radiusY) {
  context.beginPath();
  context.moveTo(x - radiusX * 0.18, y + radiusY * 0.76);
  context.bezierCurveTo(
    x + radiusX * 0.34,
    y + radiusY * 0.94,
    x + radiusX * 0.82,
    y + radiusY * 0.57,
    x + radiusX * 0.84,
    y + radiusY * 0.06,
  );
  context.bezierCurveTo(
    x + radiusX * 0.55,
    y + radiusY * 0.36,
    x + radiusX * 0.2,
    y + radiusY * 0.57,
    x - radiusX * 0.18,
    y + radiusY * 0.76,
  );
  context.closePath();
}

function drawCompassNeedle(context, x, y, tipX, tipY, fill, highlight) {
  context.fillStyle = fill;
  context.beginPath();
  context.moveTo(x - 5, y + 4);
  context.bezierCurveTo(x - 8, y - 8, x + tipX * 0.46, y + tipY * 0.55, x + tipX, y + tipY);
  context.bezierCurveTo(x + tipX * 0.3, y + tipY * 0.68, x + 8, y + 8, x - 5, y + 4);
  context.closePath();
  context.fill();
  context.strokeStyle = '#5f402b';
  context.lineWidth = 1.8;
  context.stroke();
  context.strokeStyle = highlight;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(x - 1, y);
  context.quadraticCurveTo(x + tipX * 0.43, y + tipY * 0.48, x + tipX * 0.82, y + tipY * 0.82);
  context.stroke();
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

function drawInvitationButton(context, label, rect, { largeSeal = false, time = 0 } = {}) {
  const { x, y, width, height } = rect;
  if (largeSeal) {
    drawTitleLetter(context, label, rect, { time });
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

function drawTitleLetter(context, label, rect, { time = 0 } = {}) {
  const { x, y, width, height } = rect;
  const scale = Math.min(width / 492, height / 142);
  const pulse = 1 + Math.sin(time * 2.1) * 0.018;
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.scale(pulse, pulse);
  context.translate(-(x + width / 2), -(y + height / 2));

  context.save();
  for (const [spread, fill] of [
    [18, 'rgba(232,185,83,0.045)'],
    [11, 'rgba(232,185,83,0.075)'],
    [5, 'rgba(244,213,141,0.14)'],
  ]) {
    const inset = spread * scale;
    context.fillStyle = fill;
    traceTitleLetter(context, x - inset, y - inset, width + inset * 2, height + inset * 2);
    context.fill();
  }
  context.restore();

  context.fillStyle = 'rgba(13,10,24,0.48)';
  traceTitleLetter(context, x + 9 * scale, y + 12 * scale, width, height);
  context.fill();
  context.fillStyle = '#ead7ad';
  traceTitleLetter(context, x, y, width, height);
  context.fill();
  context.strokeStyle = '#c89a43';
  context.lineWidth = 5 * scale;
  context.stroke();
  context.strokeStyle = 'rgba(255,244,207,0.64)';
  context.lineWidth = 1.5 * scale;
  traceTitleLetter(
    context,
    x + 8 * scale,
    y + 7 * scale,
    width - 16 * scale,
    height - 14 * scale,
  );
  context.stroke();

  context.strokeStyle = 'rgba(112,78,48,0.56)';
  context.lineWidth = 2.4 * scale;
  context.beginPath();
  context.moveTo(x + 12 * scale, y + 12 * scale);
  context.lineTo(x + width / 2, y + height * 0.58);
  context.lineTo(x + width - 12 * scale, y + 12 * scale);
  context.moveTo(x + 14 * scale, y + height - 13 * scale);
  context.lineTo(x + width * 0.4, y + height * 0.5);
  context.moveTo(x + width - 14 * scale, y + height - 13 * scale);
  context.lineTo(x + width * 0.6, y + height * 0.5);
  context.stroke();

  drawWaxMedallion(
    context,
    x + width * (73 / 492),
    y + height / 2,
    44 * scale,
    (sealContext, sealX, sealY, sealSize) => drawVectorIcon(
      sealContext,
      'owl',
      sealX,
      sealY,
      sealSize * 0.88,
      { color: '#fff1c6', secondary: '#e5be6a' },
    ),
  );

  context.fillStyle = '#33241f';
  context.textAlign = 'center';
  context.font = `700 ${31 * scale}px "Andika", "Trebuchet MS", sans-serif`;
  fitText(
    context,
    label,
    x + width * (306 / 492),
    y + height / 2 + 10 * scale,
    width * (332 / 492),
  );
  context.restore();
}

function traceTitleLetter(context, x, y, width, height) {
  context.beginPath();
  context.moveTo(x + 18, y);
  context.lineTo(x + width - 14, y + 3);
  context.quadraticCurveTo(x + width, y + 5, x + width - 2, y + 21);
  context.lineTo(x + width - 5, y + height - 17);
  context.quadraticCurveTo(x + width - 7, y + height, x + width - 24, y + height - 1);
  context.lineTo(x + 15, y + height - 4);
  context.quadraticCurveTo(x, y + height - 7, x + 3, y + height - 23);
  context.lineTo(x + 1, y + 18);
  context.quadraticCurveTo(x + 3, y + 3, x + 18, y);
  context.closePath();
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

  const glass = {
    x: rect.x + 25,
    y: rect.y + 27,
    width: rect.width - 50,
    height: rect.height - 59,
  };
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
  context.strokeStyle = swatch.selected ? PALETTE.interactive : '#513b31';
  context.lineWidth = swatch.selected ? 6 : 3.5;
  context.stroke();

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
  const words = String(caption).trim().split(/\s+/u).filter(Boolean).slice(0, 3);
  const text = words.join(' ') || 'Listen';
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
