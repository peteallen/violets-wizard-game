import { INPUT, PALETTE, WORLD } from '../config.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import {
  drawHoldGear,
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
  drawBrassWandHolster,
  drawCompassQuest,
  drawDeckledParchment,
  drawLeatherSatchel,
  drawVectorIcon,
  drawWaxIcon,
} from './uiIllustrations.js';
import { drawReadableInvitation } from './SetPieceRenderer.js';

const STORY_GRADIENTS = new WeakMap();

export const UI_REVIEW_SCENES = Object.freeze([
  'ui-dialogue-review',
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
  dialogueReplay: { x: 1008, y: 493, width: 108, height: 140 },
  letterContinue: { x: 420, y: 594, width: 440, height: 96 },
  debugReset: { x: 510, y: 18, width: 260, height: 88 },
  satchelMapTab: { x: 205, y: 145, width: 210, height: 88 },
  satchelCardsTab: { x: 435, y: 145, width: 210, height: 88 },
  satchelGear: { x: 698, y: 141, width: 96, height: 96 },
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
  dialogueAdvance: { x: 0, y: 0, width: WORLD.width, height: WORLD.height },
});

export class UIRenderer {
  constructor({ resolveAsset = () => null, characterRenderer = new CharacterRenderer() } = {}) {
    this.resolveAsset = resolveAsset;
    this.characterRenderer = characterRenderer;
    this.images = new Map();
    this.failedImages = new Set();
    this.yearbookImages = new Map();
  }

  drawReviewScene(context, scene, time = 0, { reducedMotion = false } = {}) {
    if (!UI_REVIEW_SCENES.includes(scene)) return false;
    context.fillStyle = storyGradient(context);
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    if (scene === 'ui-letter-reading-review') {
      this.drawLetterReading(context);
    } else if (scene === 'ui-dialogue-review') {
      this.drawDialogue(context, {
        type: 'line', speaker: 'npc.guide', speakerLabel: 'Hagrid', portraitPose: 'talk',
        caption: 'This way!', text: 'Come along, Violet. Diagon Alley is waiting for you.',
      }, time, false, reducedMotion);
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
        unlockedRooms: ['ch1.ollivanders', 'ch1.malkins', 'ch1.menagerie'],
        objective: { mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' } },
        cards: [],
      });
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
        eyebrow: 'Chapter One Complete',
        title: 'Platform Nine and Three-Quarters',
        subtitle: 'Next time: the Hogwarts Express!',
        buttonLabel: 'See what is next',
      }, time, { reducedMotion });
    }
    return true;
  }

  drawHud(context, state, time, reducedMotion = false) {
    if (state.overlay || state.dialogue || state.screen !== 'playing') return;
    const animationTime = reducedMotion ? 0 : time;
    drawQuestButton(context, UI_RECTS.quest, animationTime, Boolean(state.newObjective) && !reducedMotion);
    drawSatchelButton(context, UI_RECTS.satchel);
    drawWandButton(context, UI_RECTS.wand, Boolean(state.hasWand), animationTime);
  }

  drawDialogue(context, dialogue, time, muted = false, reducedMotion = false) {
    if (!dialogue) return;
    context.fillStyle = 'rgba(20,17,38,0.28)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    if (dialogue.type === 'choice' && dialogue.choices?.length) {
      this.drawChoices(context, dialogue.choices);
      return;
    }
    const frame = { x: 128, y: 462, width: 1024, height: 230 };
    drawDeckledParchment(context, frame);

    const portrait = { x: 232, y: 562, radius: 79 };
    const portraitDrawn = typeof this.characterRenderer?.drawPortrait === 'function';
    if (portraitDrawn) {
      this.characterRenderer.drawPortrait(context, {
        speaker: dialogue.speaker,
        pose: dialogue.portraitPose ?? 'talk',
        x: portrait.x,
        y: portrait.y,
        scale: 1.2,
      }, time);
    } else {
      drawBrassCameoFrame(context, portrait.x, portrait.y, portrait.radius);
      context.save();
      context.beginPath();
      context.ellipse(portrait.x, portrait.y, 67, 71, 0, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = '#3a3046';
      context.fillRect(portrait.x - 70, portrait.y - 74, 140, 148);
      drawVectorIcon(context, dialogue.speaker === 'npc.narrator' ? 'quill' : 'owl', portrait.x, portrait.y, 78, {
        color: PALETTE.parchment,
        secondary: PALETTE.candle,
      });
      context.restore();
    }

    context.fillStyle = '#4d2430';
    traceRoundedRect(context, 165, 635, 134, 39, 16);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#fff8e8';
    context.textAlign = 'center';
    context.font = '700 20px "Andika", "Trebuchet MS", sans-serif';
    fitText(context, dialogue.speakerLabel ?? 'Friend', 232, 661, 112);

    context.fillStyle = '#fff1cf';
    traceRoundedRect(context, 338, 488, 624, 82, 34);
    context.fill();
    context.strokeStyle = '#bd8e45';
    context.lineWidth = 4;
    context.stroke();
    drawVectorIcon(context, 'owl', 375, 529, 44, { color: '#6b4a31', secondary: '#d8b56f' });
    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.font = '700 43px "Andika", "Trebuchet MS", sans-serif';
    fitText(context, dialogue.caption ?? 'Listen', 665, 544, 530);

    if (muted) {
      context.fillStyle = '#5c4738';
      context.font = '23px "Andika", "Trebuchet MS", sans-serif';
      wrapText(context, dialogue.text ?? '', 350, 603, 610, 29, 2, 'center');
    } else {
      context.fillStyle = '#6b5744';
      context.font = '21px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('Tap the page to continue', 655, 620);
    }

    drawWaxIcon(context, 1062, 549, 43, 'speaker');
    context.fillStyle = '#5c4738';
    context.font = '700 18px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Again', 1062, 613);

    const animationTime = reducedMotion ? 0 : time;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(animationTime * 4) * 0.08;
    context.save();
    context.translate(1060, 654);
    context.scale(pulse, pulse);
    context.fillStyle = PALETTE.violet;
    context.beginPath();
    context.moveTo(-13, -10);
    context.lineTo(14, 0);
    context.lineTo(-13, 10);
    context.closePath();
    context.fill();
    context.restore();

    if (dialogue.choices?.length) this.drawChoices(context, dialogue.choices);
  }

  drawLetterReading(context) {
    context.fillStyle = 'rgba(20,17,38,0.66)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    drawReadableInvitation(context);
    drawParchmentAction(context, UI_RECTS.letterContinue, {
      label: 'Hear the letter',
      detail: 'Read it aloud',
      icon: vectorControlIcon('speaker'),
      selected: true,
    });
  }

  drawResumeRecap(context, recap, time, muted = false, reducedMotion = false) {
    this.drawDialogue(context, {
      speakerLabel: 'Story so far',
      caption: recap.caption,
      text: recap.text,
    }, time, muted, reducedMotion);
  }

  drawChoices(context, choices) {
    drawDeckledParchment(context, { x: 335, y: 122, width: 610, height: 88 }, { ornament: false });
    drawVectorIcon(context, 'owl', 390, 166, 56, { color: '#6b4a31', secondary: '#d8b56f' });
    context.fillStyle = '#382a24';
    context.textAlign = 'center';
    context.font = '700 34px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('What should Violet choose?', 665, 178);
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
      fitText(context, choice.caption, rect.x + width / 2, rect.y + 134, width - 34);
    });
  }

  drawSatchel(context, state, cardDefinitions = [], { parentGateProgress = 0 } = {}) {
    const activeTab = state.overlay?.tab === 'cards' ? 'cards' : 'map';
    drawStorybookSpread(context, { x: 72, y: 32, width: 1136, height: 652 }, {
      title: 'Violet’s Satchel',
      subtitle: activeTab === 'cards' ? 'Chocolate Frog cards and magical keepsakes.' : 'A map that remembers where Violet needs to go.',
    });
    drawSatchelTab(context, UI_RECTS.satchelMapTab, 'map', 'Map', activeTab === 'map');
    drawSatchelTab(context, UI_RECTS.satchelCardsTab, 'cards', 'Cards', activeTab === 'cards');
    drawHoldGear(context, UI_RECTS.satchelGear, parentGateProgress, vectorControlIcon('gear'));
    context.fillStyle = '#5d4b3d';
    context.textAlign = 'center';
    context.font = '700 17px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(parentGateProgress > 0 ? 'Keep holding…' : 'Hold for grown-ups', 902, 198);

    if (activeTab === 'cards') this.drawCardAlbumContent(context, state, cardDefinitions);
    else this.drawMapContent(context, state);
    drawClose(context);
  }

  drawMap(context, state) {
    this.drawSatchel(context, state, []);
  }

  drawMapContent(context, state) {
    const locations = [
      { id: 'ch1.ollivanders', hotspot: 'street.ollivandersDoor', label: 'Wands', icon: 'wand', x: 300, y: 427 },
      { id: 'ch1.malkins', hotspot: 'street.malkinsDoor', label: 'Robes', icon: 'rose', x: 640, y: 350 },
      { id: 'ch1.menagerie', hotspot: 'street.menagerieDoor', label: 'Pets', icon: 'owl', x: 980, y: 447 },
    ];
    context.save();
    context.strokeStyle = '#8b6845';
    context.lineWidth = 9;
    context.setLineDash([2, 18]);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(295, 437);
    context.bezierCurveTo(420, 240, 535, 262, 640, 350);
    context.bezierCurveTo(770, 456, 850, 528, 980, 447);
    context.stroke();
    context.setLineDash([]);
    context.restore();

    context.textAlign = 'center';
    for (const location of locations) {
      const unlocked = state.unlockedRooms?.includes(location.id);
      const current = state.objective?.mapStar?.hotspot === location.hotspot || state.objectiveRoom === location.id;
      const rect = { x: location.x - 106, y: location.y - 92, width: 212, height: 184 };
      location.__rect = rect;
      context.globalAlpha = unlocked ? 1 : 0.42;
      drawDeckledParchment(context, rect, {
        fill: current ? '#fff0ba' : '#ead9b7',
        edge: current ? PALETTE.interactive : '#8a6b44',
        ornament: false,
      });
      drawWaxIcon(context, location.x, location.y - 28, 39, unlocked ? location.icon : 'close', { selected: current });
      context.fillStyle = '#382a24';
      context.font = '700 27px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(location.label, location.x, location.y + 49);
      context.fillStyle = current ? '#6b385b' : '#765d48';
      context.font = '700 17px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(current ? 'Violet goes here' : unlocked ? 'Tap to travel' : 'Still hidden', location.x, location.y + 78);
      context.globalAlpha = 1;
    }
    state.__mapLocations = locations;
    state.__cardSlots = [];
  }

  drawCardAlbumContent(context, state, cardDefinitions) {
    const entries = buildCardAlbumEntries(cardDefinitions, state.cards ?? []);
    const found = entries.filter((entry) => entry.earned).length;
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(`${found} of ${entries.length} cards found`, WORLD.width / 2, 270);

    for (const entry of entries) this.drawAlbumCard(context, entry);
    state.__cardSlots = entries;
    state.__mapLocations = [];
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

    context.textAlign = 'center';
    context.fillStyle = PALETTE.parchment;
    context.font = '700 31px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(entry.earned ? entry.name : 'Not found', rect.x + rect.width / 2, rect.y + 327);
    context.fillStyle = entry.earned ? PALETTE.interactive : '#d2c5d7';
    context.font = '22px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(entry.earned ? 'Tap to listen' : 'A secret still waiting', rect.x + rect.width / 2, rect.y + 361);
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
      title: selection.title,
      subtitle: selection.subtitle,
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
      fitText(context, option.label, rect.x + width / 2, rect.y + 189, width - 28);
      context.fillStyle = '#765d48';
      context.font = '19px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('Tap to choose', rect.x + width / 2, rect.y + 220);
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
    context.fillText(objective?.caption ?? 'Explore!', WORLD.width / 2, 400);
    context.font = '28px "Andika", "Trebuchet MS", sans-serif';
    wrapText(context, objective?.text ?? '', 355, 452, 570, 36, 2, 'center');
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
    context.textAlign = 'center';
    context.fillStyle = '#66405f';
    traceRoundedRect(context, 425, 126, 430, 58, 24);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = '#fff8e8';
    context.font = '700 31px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(card?.eyebrow ?? 'Chapter One Complete', WORLD.width / 2, 165);
    context.fillStyle = '#382a24';
    context.font = '700 64px "Andika", "Trebuchet MS", sans-serif';
    wrapText(context, card?.title ?? 'Platform Nine and Three-Quarters', 250, 276, 780, 73, 2, 'center');
    context.fillStyle = '#6b4f38';
    context.font = '31px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(card?.subtitle ?? 'Next time: the Hogwarts Express!', WORLD.width / 2, 465);
    if (card?.buttonLabel !== null) {
      drawInvitationButton(context, card?.buttonLabel ?? 'See what is next', { x: 425, y: 506, width: 430, height: 91 });
    }
  }

  drawTitle(context, time, hasSave, reducedMotion = false) {
    const animationTime = reducedMotion ? 0 : time;
    context.fillStyle = storyGradient(context);
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.fillStyle = PALETTE.interactive;
    for (let index = 0; index < 28; index += 1) {
      const x = ((index * 197) % WORLD.width) + Math.sin(animationTime * 0.6 + index) * (reducedMotion ? 0 : 7);
      const y = 60 + ((index * 83) % 410);
      const alpha = reducedMotion ? 0.32 : 0.22 + (Math.sin(animationTime * 2 + index) + 1) * 0.18;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, 2 + (index % 3), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    const moonX = 1010 + Math.sin(animationTime * 0.22) * (reducedMotion ? 0 : 4);
    context.fillStyle = 'rgba(244,213,141,0.16)';
    context.beginPath();
    context.arc(moonX, 142, 104, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f5dfaa';
    context.beginPath();
    context.arc(moonX, 142, 73, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(130,102,69,0.2)';
    for (const [dx, dy, radius] of [[-24, -16, 10], [17, 12, 13], [7, -31, 7]]) {
      context.beginPath();
      context.arc(moonX + dx, 142 + dy, radius, 0, Math.PI * 2);
      context.fill();
    }
    const owlFlight = Math.sin(animationTime * 1.7) * (reducedMotion ? 0 : 0.08);
    context.save();
    context.translate(
      1003 + Math.sin(animationTime * 0.45) * (reducedMotion ? 0 : 18),
      130 + Math.sin(animationTime * 1.2) * (reducedMotion ? 0 : 7),
    );
    context.rotate(owlFlight);
    drawVectorIcon(context, 'owl', 0, 0, 118, { color: '#352a35', secondary: '#6f5c62' });
    context.restore();

    drawTitleFlourish(context, WORLD.width / 2, 172);
    context.textAlign = 'center';
    context.fillStyle = PALETTE.parchment;
    context.font = '700 73px "Andika", "Trebuchet MS", sans-serif';
    context.fillText("Violet’s Wizard Game", WORLD.width / 2, 254);
    context.fillStyle = PALETTE.honey;
    context.font = '34px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(hasSave ? 'Your adventure remembers you.' : 'Your letter is waiting.', WORLD.width / 2, 316);
    drawInvitationButton(context, hasSave ? 'Continue Violet’s story' : 'Open Violet’s letter', {
      x: 394, y: 379, width: 492, height: 142,
    }, { largeSeal: true, time: animationTime, reducedMotion });
    context.fillStyle = 'rgba(240,227,200,0.78)';
    context.font = '24px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Best with sound on', WORLD.width / 2, 568);
    drawVectorIcon(context, 'owl', 520, 561, 38, { color: '#d7bd82', secondary: '#6b536d' });
    drawVectorIcon(context, 'speaker', 760, 561, 35, { color: '#d7bd82', secondary: '#6b536d' });
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
      title: 'Violet’s Yearbook',
      subtitle: entries.length === 1 ? 'One magical memory so far.' : `${entries.length} magical memories so far.`,
    });
    drawClose(context);

    if (entries.length === 0) {
      drawWaxMedallion(context, WORLD.width / 2, 340, 76, vectorControlIcon('cards'));
      context.fillStyle = '#49382e';
      context.textAlign = 'center';
      context.font = '700 34px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('The first picture is still ahead', WORLD.width / 2, 465);
      context.fillStyle = '#6b5744';
      context.font = '24px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('Golden moments will appear here as Violet explores.', WORLD.width / 2, 510);
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
    context.fillText(entry.caption, WORLD.width / 2, 585);
    context.fillStyle = '#6b5744';
    context.font = '21px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(`${safeIndex + 1} of ${entries.length}`, WORLD.width / 2, 620);
    if (entries.length > 1) {
      drawParchmentAction(context, UI_RECTS.yearbookPrevious, { label: 'Previous', icon: '‹', compact: true });
      drawParchmentAction(context, UI_RECTS.yearbookNext, { label: 'Next', icon: '›', compact: true });
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
  context.fillStyle = active ? '#66405f' : '#8f765a';
  context.beginPath();
  context.moveTo(rect.x + 15, rect.y);
  context.lineTo(rect.x + rect.width - 15, rect.y);
  context.lineTo(rect.x + rect.width, rect.y + rect.height / 2);
  context.lineTo(rect.x + rect.width - 15, rect.y + rect.height);
  context.lineTo(rect.x + 15, rect.y + rect.height);
  context.lineTo(rect.x, rect.y + rect.height / 2);
  context.closePath();
  context.fill();
  context.strokeStyle = active ? PALETTE.interactive : '#5f4d3e';
  context.lineWidth = active ? 5 : 3;
  context.stroke();
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

function drawWandButton(context, rect, enabled, time = 0) {
  drawBrassWandHolster(context, rect, { enabled, time });
}

function drawClose(context) {
  drawWaxIcon(context, 1090, 120, 45, 'close');
}

function drawInvitationButton(context, label, rect, { largeSeal = false, time = 0 } = {}) {
  const { x, y, width, height } = rect;
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

function drawTitleFlourish(context, x, y) {
  context.save();
  context.strokeStyle = 'rgba(244,213,141,0.72)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x - 250, y);
  context.bezierCurveTo(x - 185, y - 28, x - 126, y + 27, x - 61, y);
  context.bezierCurveTo(x - 34, y - 13, x - 20, y - 12, x, y);
  context.bezierCurveTo(x + 20, y - 12, x + 34, y - 13, x + 61, y);
  context.bezierCurveTo(x + 126, y + 27, x + 185, y - 28, x + 250, y);
  context.stroke();
  drawVectorIcon(context, 'owl', x, y, 52, { color: '#f4d58d', secondary: '#604566' });
  context.restore();
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

export function pointInUiRect(point, rect) {
  const padding = Math.max(0, (INPUT.minimumTarget - Math.min(rect.width, rect.height)) / 2);
  return point.x >= rect.x - padding && point.x <= rect.x + rect.width + padding && point.y >= rect.y - padding && point.y <= rect.y + rect.height + padding;
}
