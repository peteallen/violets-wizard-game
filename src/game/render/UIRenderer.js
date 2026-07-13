import { INPUT, PALETTE, WORLD } from '../config.js';
import { chapter1Map } from '../content/chapters/ch1.js';
import { buildMapState } from '../core/MapState.js';
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
import { drawVectorOwl } from './OwlRenderer.js';
import { drawReadableInvitation } from './SetPieceRenderer.js';
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
const TITLE_STARS = Object.freeze([
  [76, 82, 2.2], [166, 137, 3.2], [286, 91, 1.8], [372, 338, 2.4],
  [468, 67, 2], [598, 112, 3.1], [728, 74, 1.8], [848, 330, 2.3],
  [916, 68, 2.7], [1194, 96, 2.1], [1168, 360, 1.8], [104, 402, 2.4],
]);

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
  dialogueReplay: { x: 985, y: 557, width: 88, height: 96 },
  letterContinue: { x: 420, y: 594, width: 440, height: 96 },
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
  dialogueAdvance: { x: 986, y: 656, width: 86, height: 43 },
});

const DIALOGUE_FRAME = Object.freeze({ y: 548, height: 155, maximumWidth: 900, margin: 32, speakerGap: 38 });
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
  const speaker = dialogue?.speaker;
  if (!speaker || speaker === 'npc.narrator') return { night, speakerPosition: null, speakerBounds: null };

  const cameraX = state?.cameraX ?? 0;
  let actor = null;
  if (speaker === 'npc.violet' && state?.player) actor = state.player;
  else if (speaker.startsWith('npc.pet.') && state?.pet) actor = state.pet;
  else actor = state?.occupants?.find((occupant) => occupant.npc === speaker) ?? null;
  if (!actor) return { night, speakerPosition: null, speakerBounds: null };

  const position = { x: actor.x - cameraX, y: actor.y };
  const dimensions = speakerDimensions(speaker);
  return {
    night,
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
    const leftSpace = Math.max(0, speakerBounds.left - DIALOGUE_FRAME.speakerGap - DIALOGUE_FRAME.margin);
    const rightEdge = speakerBounds.right + DIALOGUE_FRAME.speakerGap;
    const rightSpace = Math.max(0, WORLD.width - DIALOGUE_FRAME.margin - rightEdge);
    if (rightSpace >= leftSpace) {
      side = 'right';
      frame.x = rightEdge;
      frame.width = Math.min(DIALOGUE_FRAME.maximumWidth, rightSpace);
    } else {
      side = 'left';
      frame.x = DIALOGUE_FRAME.margin;
      frame.width = Math.min(DIALOGUE_FRAME.maximumWidth, leftSpace);
    }
  }

  const portraitOnLeft = side !== 'left';
  const portrait = {
    x: portraitOnLeft ? frame.x + 76 : frame.x + frame.width - 76,
    y: frame.y + 77,
    scale: 0.9,
  };
  const controlX = portraitOnLeft ? frame.x + frame.width - 61 : frame.x + 61;
  const captionLeft = portraitOnLeft ? frame.x + 143 : frame.x + 111;
  const captionRight = portraitOnLeft ? frame.x + frame.width - 111 : frame.x + frame.width - 143;
  const replayRect = { x: controlX - 44, y: frame.y + 9, width: 88, height: 96 };
  const advanceRect = { x: controlX - 43, y: frame.y + 108, width: 86, height: 43 };

  return {
    side,
    frame,
    portrait,
    captionRect: {
      x: captionLeft,
      y: frame.y + 27,
      width: Math.max(1, captionRight - captionLeft),
      height: 93,
    },
    controlX,
    replayRect,
    advanceRect,
    rotation: side === 'left' ? 0.006 : side === 'right' ? -0.006 : -0.004,
  };
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
  } = {}) {
    this.resolveAsset = resolveAsset;
    this.characterRenderer = characterRenderer;
    this.mapRenderer = mapRenderer;
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
    const { frame, portrait, captionRect, controlX } = layout;
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(layout.rotation);
    context.translate(-centerX, -centerY);
    drawDialogueScroll(context, frame, { night: Boolean(scene.night) });

    const portraitDrawn = typeof this.characterRenderer?.drawPortrait === 'function';
    if (portraitDrawn) {
      this.characterRenderer.drawPortrait(context, {
        speaker: dialogue.speaker,
        pose: dialogue.portraitPose ?? 'talk',
        x: portrait.x,
        y: portrait.y,
        scale: portrait.scale,
      }, time);
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

    drawWaxIcon(context, controlX, frame.y + 47, 31, 'speaker', {
      iconColor: scene.night ? '#f8e4b4' : '#fff8e8',
    });
    context.fillStyle = scene.night ? '#f2d89f' : '#513b2f';
    context.textAlign = 'center';
    context.font = '700 18px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(childFacingUiText('Again', 'action'), controlX, frame.y + 95);

    const animationTime = reducedMotion ? 0 : time;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(animationTime * 4) * 0.08;
    drawDialogueNextArrow(context, controlX, frame.y + 129, pulse, Boolean(scene.night));
    context.restore();

    if (dialogue.choices?.length) this.drawChoices(context, dialogue.choices);
    return layout;
  }

  drawLetterReading(context) {
    context.fillStyle = 'rgba(20,17,38,0.66)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawReadableInvitation(context);
    drawParchmentAction(context, UI_RECTS.letterContinue, {
      label: childFacingUiText('Hear the letter', 'action'),
      icon: vectorControlIcon('speaker'),
      selected: true,
    });
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
    context.fillStyle = 'rgba(20,17,38,0.74)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawDeckledParchment(context, { x: 235, y: 170, width: 810, height: 382 });
    drawCompassQuest(
      context,
      { x: 574, y: 205, width: 132, height: 132 },
      reducedMotion ? 0 : time,
      { pulse: !reducedMotion },
    );
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 42px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(
      childFacingUiText(objective?.caption ?? 'Explore!', 'caption'),
      WORLD.width / 2,
      400,
    );
    drawVectorIcon(context, 'owl', 297, 492, 62, { color: '#805d3d', secondary: '#d4b174' });
    drawVectorIcon(context, 'owl', 983, 492, 62, { color: '#805d3d', secondary: '#d4b174' });
    drawClose(context);
  }

  drawChapterCard(context, card, time, { paintedBackground = false, reducedMotion = false } = {}) {
    if (!paintedBackground) {
      context.fillStyle = storyGradient(context);
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    } else {
      context.fillStyle = 'rgba(20,17,38,0.36)';
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    const animationTime = reducedMotion ? 0 : time;
    const drift = reducedMotion ? 0 : Math.sin(animationTime * 0.7) * 8;
    drawDeckledParchment(context, { x: 156, y: 82, width: 968, height: 550 }, { fill: '#efe0bd' });
    context.fillStyle = 'rgba(244,213,141,0.24)';
    context.beginPath();
    context.arc(977 + drift, 184, 83, 0, Math.PI * 2);
    context.fill();
    drawVectorIcon(context, 'owl', 975 + drift, 183, 104, { color: '#69472f', secondary: '#d9b876' });
    drawVectorIcon(context, 'owl', 292 - drift * 0.35, 180, 68, { color: '#815d3b', secondary: '#d9b876' });
    context.fillStyle = '#382a24';
    context.font = '700 64px "Andika", "Trebuchet MS", sans-serif';
    wrapText(
      context,
      childFacingUiText(card?.title ?? 'Platform Nine and Three-Quarters', 'proper-name'),
      250,
      276,
      780,
      73,
      2,
      'center',
    );
    if (card?.buttonLabel !== null) {
      drawInvitationButton(
        context,
        childFacingUiText(card?.buttonLabel ?? 'Continue', 'action'),
        { x: 425, y: 506, width: 430, height: 91 },
      );
    }
  }

  drawTitle(context, time, hasSave, reducedMotion = false) {
    const animationTime = reducedMotion ? 0 : time;
    context.fillStyle = storyGradient(context);
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawTitleNight(context, animationTime, reducedMotion);
    const moonX = 1082 + Math.sin(animationTime * 0.22) * (reducedMotion ? 0 : 2.5);
    context.fillStyle = 'rgba(244,213,141,0.1)';
    context.beginPath();
    context.arc(moonX, 137, 105, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ecd59c';
    context.beginPath();
    context.arc(moonX, 137, 78, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(110,82,58,0.15)';
    for (const [dx, dy, radius] of [[-25, -17, 10], [18, 13, 14], [8, -33, 7]]) {
      context.beginPath();
      context.arc(moonX + dx, 137 + dy, radius, 0, Math.PI * 2);
      context.fill();
    }
    const titleOwlX = moonX - 2 + Math.sin(animationTime * 0.45) * (reducedMotion ? 0 : 3);
    const titleOwlLookX = -0.58 + Math.sin(animationTime * 0.55) * (reducedMotion ? 0 : 0.1);
    const titleOwlLookY = 0.18 + Math.sin(animationTime * 0.4 + 0.7) * (reducedMotion ? 0 : 0.07);
    context.strokeStyle = '#8f673e';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(moonX - 66, 200);
    context.quadraticCurveTo(moonX - 5, 210, moonX + 69, 197);
    context.stroke();
    context.strokeStyle = 'rgba(255,240,194,0.42)';
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(moonX - 57, 198);
    context.quadraticCurveTo(moonX - 4, 204, moonX + 58, 195);
    context.stroke();
    drawVectorOwl(context, {
      variant: 'post',
      pose: 'perch',
      x: titleOwlX,
      y: 202,
      scale: 0.94,
      phase: 4.9,
      lookX: titleOwlLookX,
      lookY: titleOwlLookY,
      reducedMotion,
    }, animationTime);

    drawTitleMasthead(context);
    drawInvitationButton(context, childFacingUiText(
      hasSave ? 'Return to Hogwarts' : 'Open Violet’s letter',
      'action',
    ), {
      x: 394, y: 379, width: 492, height: 142,
    }, {
      largeSeal: true,
      time: animationTime,
      reducedMotion,
    });
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

function drawTitleNight(context, time, reducedMotion) {
  context.save();
  context.fillStyle = '#d8b965';
  for (let index = 0; index < TITLE_STARS.length; index += 1) {
    const [x, y, radius] = TITLE_STARS[index];
    const shimmer = reducedMotion ? 0.48 : 0.38 + (Math.sin(time * 1.35 + index * 1.71) + 1) * 0.14;
    context.globalAlpha = shimmer;
    drawTitleStar(context, x, y, radius);
  }
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(15,12,32,0.18)';
  context.beginPath();
  context.moveTo(0, 625);
  context.bezierCurveTo(180, 570, 335, 608, 510, 584);
  context.bezierCurveTo(720, 552, 880, 606, 1280, 548);
  context.lineTo(1280, 720);
  context.lineTo(0, 720);
  context.closePath();
  context.fill();

  drawTitleCastle(context);
  context.restore();
}

function drawTitleCastle(context) {
  context.save();
  context.fillStyle = 'rgba(15,12,29,0.48)';
  context.beginPath();
  context.moveTo(0, 720);
  context.lineTo(0, 660);
  context.lineTo(85, 660);
  context.lineTo(85, 626);
  context.lineTo(112, 626);
  context.lineTo(126, 574);
  context.lineTo(140, 626);
  context.lineTo(168, 626);
  context.lineTo(168, 650);
  context.lineTo(236, 650);
  context.lineTo(236, 618);
  context.lineTo(265, 618);
  context.lineTo(279, 555);
  context.lineTo(294, 618);
  context.lineTo(326, 618);
  context.lineTo(326, 671);
  context.lineTo(913, 671);
  context.lineTo(913, 634);
  context.lineTo(944, 634);
  context.lineTo(960, 577);
  context.lineTo(976, 634);
  context.lineTo(1009, 634);
  context.lineTo(1009, 656);
  context.lineTo(1094, 656);
  context.lineTo(1094, 610);
  context.lineTo(1124, 610);
  context.lineTo(1141, 536);
  context.lineTo(1157, 610);
  context.lineTo(1188, 610);
  context.lineTo(1188, 660);
  context.lineTo(1280, 660);
  context.lineTo(1280, 720);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(236,197,104,0.34)';
  for (const [x, y] of [[111, 641], [137, 642], [257, 637], [284, 639], [936, 652], [963, 651], [1117, 633], [1147, 632], [1170, 642]]) {
    context.fillRect(x, y, 6, 10);
  }
  context.restore();
}

function drawTitleMasthead(context) {
  drawDisplayTitle(context, childFacingUiText('Violet', 'proper-name'), 485, 183, 101);
  drawDisplayTitle(context, childFacingUiText('at Hogwarts', 'proper-name'), 505, 258, 67);
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
  const pulse = 1 + Math.sin(time * 2.1) * 0.018;
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.scale(pulse, pulse);
  context.translate(-(x + width / 2), -(y + height / 2));

  context.fillStyle = 'rgba(13,10,24,0.48)';
  traceTitleLetter(context, x + 9, y + 12, width, height);
  context.fill();
  context.fillStyle = '#ead7ad';
  traceTitleLetter(context, x, y, width, height);
  context.fill();
  context.strokeStyle = '#c89a43';
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = 'rgba(255,244,207,0.64)';
  context.lineWidth = 1.5;
  traceTitleLetter(context, x + 8, y + 7, width - 16, height - 14);
  context.stroke();

  context.strokeStyle = 'rgba(112,78,48,0.56)';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(x + 12, y + 12);
  context.lineTo(x + width / 2, y + height * 0.58);
  context.lineTo(x + width - 12, y + 12);
  context.moveTo(x + 14, y + height - 13);
  context.lineTo(x + width * 0.4, y + height * 0.5);
  context.moveTo(x + width - 14, y + height - 13);
  context.lineTo(x + width * 0.6, y + height * 0.5);
  context.stroke();

  drawWaxMedallion(context, x + 73, y + height / 2, 44, (sealContext, sealX, sealY) => {
    sealContext.fillStyle = '#fff1c6';
    sealContext.textAlign = 'center';
    sealContext.font = '700 49px "Almendra", Georgia, serif';
    sealContext.fillText('V', sealX, sealY + 16);
  });

  context.fillStyle = '#33241f';
  context.textAlign = 'center';
  context.font = '700 31px "Andika", "Trebuchet MS", sans-serif';
  fitText(context, label, x + 306, y + height / 2 + 10, width - 160);
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

function drawTitleStar(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.lineTo(x + radius * 0.28, y - radius * 0.28);
  context.lineTo(x + radius, y);
  context.lineTo(x + radius * 0.28, y + radius * 0.28);
  context.lineTo(x, y + radius);
  context.lineTo(x - radius * 0.28, y + radius * 0.28);
  context.lineTo(x - radius, y);
  context.lineTo(x - radius * 0.28, y - radius * 0.28);
  context.closePath();
  context.fill();
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
  const colors = night
    ? { base: '#372a31', light: '#48343a', shadow: '#261f29' }
    : { base: '#f0d8aa', light: '#fff0c9', shadow: '#d8b982' };
  context.fillStyle = colors.base;
  traceDialogueCaption(context, rect);
  context.fill();
  context.save();
  traceDialogueCaption(context, rect);
  context.clip();
  context.fillStyle = colors.light;
  context.beginPath();
  context.moveTo(rect.x, rect.y);
  context.lineTo(rect.x + rect.width, rect.y);
  context.lineTo(rect.x + rect.width, rect.y + rect.height * 0.38);
  context.bezierCurveTo(
    rect.x + rect.width * 0.7,
    rect.y + rect.height * 0.46,
    rect.x + rect.width * 0.28,
    rect.y + rect.height * 0.3,
    rect.x,
    rect.y + rect.height * 0.42,
  );
  context.closePath();
  context.fill();
  context.fillStyle = colors.shadow;
  context.beginPath();
  context.moveTo(rect.x, rect.y + rect.height * 0.77);
  context.bezierCurveTo(
    rect.x + rect.width * 0.32,
    rect.y + rect.height * 0.68,
    rect.x + rect.width * 0.71,
    rect.y + rect.height * 0.86,
    rect.x + rect.width,
    rect.y + rect.height * 0.73,
  );
  context.lineTo(rect.x + rect.width, rect.y + rect.height);
  context.lineTo(rect.x, rect.y + rect.height);
  context.closePath();
  context.fill();
  context.restore();
  context.strokeStyle = night ? '#d2a95b' : '#91633b';
  context.lineWidth = 3.4;
  traceDialogueCaption(context, rect);
  context.stroke();
  context.strokeStyle = night ? 'rgba(249,223,162,0.34)' : 'rgba(255,248,219,0.72)';
  context.lineWidth = 1.4;
  traceDialogueCaption(context, {
    x: rect.x + 7,
    y: rect.y + 6,
    width: rect.width - 14,
    height: rect.height - 13,
  });
  context.stroke();

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

function traceDialogueCaption(context, rect) {
  const { x, y, width, height } = rect;
  context.beginPath();
  context.moveTo(x + 19, y + 1);
  context.bezierCurveTo(x + width * 0.3, y - 2, x + width * 0.69, y + 3, x + width - 17, y + 1);
  context.quadraticCurveTo(x + width + 2, y + 8, x + width - 1, y + 23);
  context.lineTo(x + width - 4, y + height - 19);
  context.quadraticCurveTo(x + width - 2, y + height - 2, x + width - 21, y + height);
  context.bezierCurveTo(x + width * 0.68, y + height + 2, x + width * 0.31, y + height - 3, x + 17, y + height);
  context.quadraticCurveTo(x + 1, y + height - 5, x + 3, y + height - 23);
  context.lineTo(x, y + 20);
  context.quadraticCurveTo(x + 2, y + 4, x + 19, y + 1);
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
