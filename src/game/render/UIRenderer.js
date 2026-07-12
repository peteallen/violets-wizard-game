import { INPUT, PALETTE, WORLD } from '../config.js';
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

const STORY_GRADIENTS = new WeakMap();

export const UI_RECTS = Object.freeze({
  quest: { x: 28, y: 28, width: 104, height: 104 },
  satchel: { x: 28, y: 584, width: 108, height: 108 },
  wand: { x: 1144, y: 584, width: 108, height: 108 },
  debugReset: { x: 510, y: 18, width: 260, height: 88 },
  satchelMapTab: { x: 205, y: 86, width: 210, height: 88 },
  satchelCardsTab: { x: 435, y: 86, width: 210, height: 88 },
  satchelGear: { x: 690, y: 82, width: 96, height: 96 },
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
  constructor({ resolveAsset = () => null } = {}) {
    this.resolveAsset = resolveAsset;
    this.images = new Map();
    this.failedImages = new Set();
    this.yearbookImages = new Map();
  }

  drawHud(context, state, time) {
    if (state.overlay || state.dialogue || state.screen !== 'playing') return;
    drawQuestButton(context, UI_RECTS.quest, time, Boolean(state.newObjective));
    drawSatchelButton(context, UI_RECTS.satchel);
    drawWandButton(context, UI_RECTS.wand, Boolean(state.hasWand));
  }

  drawDialogue(context, dialogue, time, muted = false) {
    if (!dialogue) return;
    context.fillStyle = 'rgba(20,17,38,0.34)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    const frame = { x: 150, y: 480, width: 980, height: 205 };
    parchmentPanel(context, frame.x, frame.y, frame.width, frame.height, 34);

    context.fillStyle = PALETTE.oak;
    context.beginPath();
    context.arc(244, 570, 68, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 6;
    context.stroke();
    context.fillStyle = PALETTE.parchment;
    context.textAlign = 'center';
    context.font = '700 25px "Andika", "Trebuchet MS", sans-serif';
    fitText(context, dialogue.speakerLabel ?? 'Friend', 244, 578, 110);

    context.textAlign = 'left';
    context.fillStyle = '#382a24';
    context.font = '700 28px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(dialogue.caption ?? '', 335, 535);
    context.font = '25px "Andika", "Trebuchet MS", sans-serif';
    const shownText = muted ? dialogue.text : dialogue.text;
    wrapText(context, shownText ?? '', 335, 580, 690, 32, 2);

    const pulse = 1 + Math.sin(time * 4) * 0.08;
    context.save();
    context.translate(1065, 630);
    context.scale(pulse, pulse);
    context.fillStyle = PALETTE.violet;
    context.beginPath();
    context.moveTo(-18, -12);
    context.lineTo(18, 0);
    context.lineTo(-18, 12);
    context.closePath();
    context.fill();
    context.restore();

    if (dialogue.choices?.length) this.drawChoices(context, dialogue.choices);
  }

  drawResumeRecap(context, recap, time, muted = false) {
    this.drawDialogue(context, {
      speakerLabel: 'Story so far',
      caption: recap.caption,
      text: recap.text,
    }, time, muted);
  }

  drawChoices(context, choices) {
    const width = 250;
    const gap = 28;
    const total = choices.length * width + (choices.length - 1) * gap;
    const startX = (WORLD.width - total) / 2;
    choices.forEach((choice, index) => {
      const rect = { x: startX + index * (width + gap), y: 245, width, height: 150 };
      choice.__rect = rect;
      parchmentPanel(context, rect.x, rect.y, rect.width, rect.height, 28);
      context.fillStyle = PALETTE.violet;
      context.textAlign = 'center';
      context.font = '50px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(iconGlyph(choice.icon), rect.x + width / 2, rect.y + 67);
      context.fillStyle = '#382a24';
      context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(choice.caption, rect.x + width / 2, rect.y + 118);
    });
  }

  drawSatchel(context, state, cardDefinitions = [], { parentGateProgress = 0 } = {}) {
    context.fillStyle = 'rgba(20,17,38,0.78)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    parchmentPanel(context, 130, 65, 1020, 590, 42);
    const activeTab = state.overlay?.tab === 'cards' ? 'cards' : 'map';
    drawSatchelTab(context, UI_RECTS.satchelMapTab, '⌁', 'Map', activeTab === 'map');
    drawSatchelTab(context, UI_RECTS.satchelCardsTab, '▣', 'Cards', activeTab === 'cards');
    drawHoldGear(context, UI_RECTS.satchelGear, parentGateProgress);
    context.fillStyle = '#5d4b3d';
    context.textAlign = 'center';
    context.font = '700 17px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(parentGateProgress > 0 ? 'Keep holding…' : 'Grown-ups', 738, 188);

    if (activeTab === 'cards') this.drawCardAlbumContent(context, state, cardDefinitions);
    else this.drawMapContent(context, state);
    drawClose(context);
  }

  drawMap(context, state) {
    this.drawSatchel(context, state, []);
  }

  drawMapContent(context, state) {
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 34px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Diagon Alley', 900, 139);

    const locations = [
      { id: 'ch1.ollivanders', label: 'Wands', icon: '✦', x: 330, y: 375 },
      { id: 'ch1.malkins', label: 'Robes', icon: '♢', x: 640, y: 300 },
      { id: 'ch1.menagerie', label: 'Pets', icon: '♥', x: 950, y: 415 },
    ];
    for (const location of locations) {
      const unlocked = state.unlockedRooms?.includes(location.id);
      const current = state.objectiveRoom === location.id;
      const rect = { x: location.x - 105, y: location.y - 90, width: 210, height: 180 };
      location.__rect = rect;
      context.globalAlpha = unlocked ? 1 : 0.42;
      context.fillStyle = current ? PALETTE.interactive : PALETTE.oak;
      roundRect(context, rect.x, rect.y, rect.width, rect.height, 28);
      context.fill();
      context.strokeStyle = PALETTE.candle;
      context.lineWidth = current ? 8 : 4;
      context.stroke();
      context.fillStyle = PALETTE.parchment;
      context.font = '54px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(location.icon, location.x, location.y - 10);
      context.font = '700 28px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(location.label, location.x, location.y + 48);
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
    context.font = '700 30px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(`${found} of ${entries.length} cards found`, 900, 139);

    if (found === 0) {
      context.fillStyle = '#6b5744';
      context.font = '700 28px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('No cards yet', WORLD.width / 2, 207);
      context.font = '24px "Andika", "Trebuchet MS", sans-serif';
      context.fillText('Look for sparkles!', WORLD.width / 2, 240);
    }

    for (const entry of entries) this.drawAlbumCard(context, entry);
    state.__cardSlots = entries;
    state.__mapLocations = [];
  }

  drawAlbumCard(context, entry) {
    const rect = entry.__rect;
    context.save();
    context.fillStyle = entry.earned ? '#5e4634' : '#665c6e';
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 30);
    context.fill();
    context.strokeStyle = entry.earned ? PALETTE.candle : '#9a8fa2';
    context.lineWidth = 7;
    context.stroke();

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
    context.fillStyle = entry.earned ? PALETTE.interactive : '#b9aebe';
    context.font = '27px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(entry.earned ? 'Tap to listen' : '?', rect.x + rect.width / 2, rect.y + 365);
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
    context.fillStyle = 'rgba(20,17,38,0.74)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    parchmentPanel(context, 150, 85, 980, 550, 42);
    context.textAlign = 'center';
    context.fillStyle = '#382a24';
    context.font = '700 48px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(selection.title, WORLD.width / 2, 170);
    if (selection.subtitle) {
      context.font = '26px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(selection.subtitle, WORLD.width / 2, 212);
    }
    const count = selection.options.length;
    const width = Math.min(230, (860 - (count - 1) * 24) / count);
    const total = count * width + (count - 1) * 24;
    const x = (WORLD.width - total) / 2;
    selection.options.forEach((option, index) => {
      const rect = { x: x + index * (width + 24), y: 285, width, height: 210 };
      option.__rect = rect;
      context.fillStyle = option.color ?? PALETTE.oak;
      roundRect(context, rect.x, rect.y, rect.width, rect.height, 28);
      context.fill();
      context.strokeStyle = PALETTE.candle;
      context.lineWidth = 5;
      context.stroke();
      context.fillStyle = PALETTE.parchment;
      context.font = '64px "Andika", "Trebuchet MS", sans-serif';
      context.fillText(iconGlyph(option.icon), rect.x + width / 2, rect.y + 92);
      context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
      fitText(context, option.label, rect.x + width / 2, rect.y + 159, width - 22);
    });
    drawClose(context);
  }

  drawObjective(context, objective) {
    context.fillStyle = 'rgba(20,17,38,0.74)';
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    parchmentPanel(context, 250, 190, 780, 340, 45);
    context.textAlign = 'center';
    context.fillStyle = PALETTE.candle;
    context.font = '70px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('★', WORLD.width / 2, 300);
    context.fillStyle = '#382a24';
    context.font = '700 42px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(objective?.caption ?? 'Explore!', WORLD.width / 2, 380);
    context.font = '28px "Andika", "Trebuchet MS", sans-serif';
    wrapText(context, objective?.text ?? '', 360, 432, 560, 34, 2, 'center');
    drawClose(context);
  }

  drawChapterCard(context, card, time, { paintedBackground = false } = {}) {
    if (!paintedBackground) {
      context.fillStyle = storyGradient(context);
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    } else {
      context.fillStyle = 'rgba(20,17,38,0.36)';
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
    const drift = Math.sin(time * 0.7) * 8;
    context.fillStyle = 'rgba(244,213,141,0.22)';
    context.beginPath();
    context.arc(980 + drift, 190, 90, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.candle;
    context.lineWidth = 12;
    context.strokeRect(170, 105, 940, 510);
    context.textAlign = 'center';
    context.fillStyle = PALETTE.parchment;
    context.font = '700 36px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(card?.eyebrow ?? 'Chapter One Complete', WORLD.width / 2, 190);
    context.font = '700 64px "Andika", "Trebuchet MS", sans-serif';
    wrapText(context, card?.title ?? 'Platform Nine and Three-Quarters', 250, 300, 780, 76, 2, 'center');
    context.fillStyle = PALETTE.honey;
    context.font = '31px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(card?.subtitle ?? 'Next time: the Hogwarts Express!', WORLD.width / 2, 475);
    drawBigButton(context, card?.buttonLabel ?? 'See what is next', 440, 525, 400, 90);
  }

  drawTitle(context, time, hasSave) {
    context.fillStyle = storyGradient(context);
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    context.fillStyle = PALETTE.interactive;
    for (let index = 0; index < 28; index += 1) {
      const x = ((index * 197) % WORLD.width) + Math.sin(time * 0.6 + index) * 7;
      const y = 60 + ((index * 83) % 410);
      const alpha = 0.22 + (Math.sin(time * 2 + index) + 1) * 0.18;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, 2 + (index % 3), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.textAlign = 'center';
    context.fillStyle = PALETTE.parchment;
    context.font = '700 76px "Andika", "Trebuchet MS", sans-serif';
    context.fillText("Violet's Wizard Game", WORLD.width / 2, 255);
    context.fillStyle = PALETTE.honey;
    context.font = '34px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Your letter is waiting.', WORLD.width / 2, 320);
    drawBigButton(context, hasSave ? 'Continue' : 'Open the letter', 420, 405, 440, 105);
    context.fillStyle = 'rgba(240,227,200,0.78)';
    context.font = '24px "Andika", "Trebuchet MS", sans-serif';
    context.fillText('Best with sound on', WORLD.width / 2, 565);
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
    drawRibbonTab(context, UI_RECTS.parentPlayTab, 'Play', { icon: '◆', active: page === 'play' });
    drawRibbonTab(context, UI_RECTS.parentSettingsTab, 'Sound & feel', { icon: '♫', active: page === 'settings' });
    drawRibbonTab(context, UI_RECTS.parentSaveTab, 'Save', { icon: '▣', active: page === 'save' });

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
      icon: model.replayMode ? '↩' : '↻',
      disabled: !model.replayMode && !model.chapter1Completed,
    });
    drawParchmentAction(context, UI_RECTS.parentYearbook, {
      label: 'Violet’s Yearbook',
      detail: model.yearbookCount === 1 ? '1 magical memory' : `${model.yearbookCount} magical memories`,
      icon: '★',
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
      icon: model.settings.muted ? '×' : '♫',
      selected: model.settings.muted,
      compact: true,
    });
    drawParchmentAction(context, UI_RECTS.parentReducedMotion, {
      label: model.systemReducedMotion && !model.settings.reducedMotion
        ? 'Gentler (device)'
        : model.effectiveReducedMotion ? 'Gentler movement' : 'Full movement',
      icon: model.effectiveReducedMotion ? '≈' : '✦',
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
        icon: level === 'off' ? '○' : level === 'gentle' ? '◇' : '✦',
        selected: model.settings.learning === level,
        compact: true,
      });
    }
  }

  drawParentSave(context, model) {
    drawParchmentAction(context, UI_RECTS.parentExport, {
      label: 'Export Violet’s save', detail: 'Copy it to another device', icon: '↑',
    });
    drawParchmentAction(context, UI_RECTS.parentImport, {
      label: 'Import a save', detail: 'Bring Violet’s adventure here', icon: '↓',
    });
    drawParchmentAction(context, UI_RECTS.parentRestore, {
      label: 'Recover backup', detail: 'Use the safety copy on this device', icon: '↶',
    });
    drawParchmentAction(context, UI_RECTS.parentStartOver, {
      label: 'Start over', detail: 'Keeps sound and learning settings', icon: '×', danger: true,
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

    drawWaxMedallion(context, WORLD.width / 2, 335, 62, startOver ? '!' : '↶', { danger: startOver });
    context.fillStyle = '#5e4939';
    context.textAlign = 'center';
    context.font = '25px "Andika", "Trebuchet MS", sans-serif';
    context.fillText(
      startOver ? 'Sound, movement, and learning choices will stay the same.' : 'You can cancel and keep the current adventure.',
      WORLD.width / 2,
      420,
    );
    drawParchmentAction(context, UI_RECTS.parentCancelConfirm, {
      label: 'No, go back', icon: '↩',
    });
    drawParchmentAction(context, UI_RECTS.parentAcceptConfirm, {
      label: startOver ? 'Yes, start over' : 'Use the backup',
      icon: startOver ? '×' : '↶',
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
      drawWaxMedallion(context, WORLD.width / 2, 340, 76, '★');
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
      y: 250 + Math.floor(index / columns) * (slotHeight + 28),
      width: slotWidth,
      height: slotHeight,
    },
  }));
}

function drawSatchelTab(context, rect, icon, label, active) {
  context.fillStyle = active ? PALETTE.oak : '#a38b69';
  roundRect(context, rect.x, rect.y, rect.width, rect.height, 24);
  context.fill();
  context.strokeStyle = active ? PALETTE.interactive : '#7b684d';
  context.lineWidth = active ? 6 : 4;
  context.stroke();
  context.fillStyle = active ? PALETTE.parchment : '#3f3328';
  context.textAlign = 'center';
  context.font = '36px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(icon, rect.x + 45, rect.y + 57);
  context.font = '700 29px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, rect.x + 130, rect.y + 56);
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
  context.fillStyle = PALETTE.candle;
  context.textAlign = 'center';
  context.font = '64px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('✦', rect.x + rect.width / 2, rect.y + rect.height / 2 + 22);
}

function drawLockedPortrait(context, rect) {
  context.fillStyle = '#403949';
  roundRect(context, rect.x, rect.y, rect.width, rect.height, 20);
  context.fill();
  context.strokeStyle = '#82768c';
  context.lineWidth = 5;
  roundRect(context, rect.x + 15, rect.y + 15, rect.width - 30, rect.height - 30, 14);
  context.stroke();
  context.fillStyle = '#a99daf';
  context.textAlign = 'center';
  context.font = '700 88px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('?', rect.x + rect.width / 2, rect.y + rect.height / 2 + 30);
}

function drawQuestButton(context, rect, time, pulse) {
  const scale = pulse ? 1 + Math.sin(time * 4) * 0.08 : 1;
  context.save();
  context.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
  context.scale(scale, scale);
  context.fillStyle = PALETTE.oak;
  context.beginPath();
  context.arc(0, 0, 48, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = PALETTE.interactive;
  context.textAlign = 'center';
  context.font = '54px "Andika", "Trebuchet MS", sans-serif';
  context.fillText('★', 0, 19);
  context.restore();
}

function drawSatchelButton(context, rect) {
  context.fillStyle = '#6e4b32';
  roundRect(context, rect.x + 8, rect.y + 19, rect.width - 16, rect.height - 27, 21);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();
  context.beginPath();
  context.arc(rect.x + rect.width / 2, rect.y + 32, 32, Math.PI, 0);
  context.stroke();
  context.fillStyle = PALETTE.candle;
  context.fillRect(rect.x + rect.width / 2 - 7, rect.y + 55, 14, 18);
}

function drawWandButton(context, rect, enabled) {
  context.fillStyle = enabled ? '#59402d' : '#3d3743';
  context.beginPath();
  context.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, 49, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = enabled ? PALETTE.candle : '#77717f';
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = enabled ? '#aa7655' : '#716b73';
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(rect.x + 34, rect.y + 77);
  context.lineTo(rect.x + 79, rect.y + 30);
  context.stroke();
  if (enabled) {
    context.fillStyle = PALETTE.interactive;
    context.beginPath();
    context.arc(rect.x + 81, rect.y + 28, 7, 0, Math.PI * 2);
    context.fill();
  }
}

function parchmentPanel(context, x, y, width, height, radius) {
  context.fillStyle = PALETTE.parchment;
  roundRect(context, x, y, width, height, radius);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 7;
  context.stroke();
  context.strokeStyle = '#8a6b44';
  context.lineWidth = 2;
  roundRect(context, x + 13, y + 13, width - 26, height - 26, Math.max(8, radius - 10));
  context.stroke();
}

function drawClose(context) {
  context.fillStyle = PALETTE.violet;
  context.beginPath();
  context.arc(1090, 120, 45, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = PALETTE.candle;
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = PALETTE.parchment;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(1075, 105);
  context.lineTo(1105, 135);
  context.moveTo(1105, 105);
  context.lineTo(1075, 135);
  context.stroke();
}

function drawBigButton(context, label, x, y, width, height) {
  context.fillStyle = PALETTE.oak;
  roundRect(context, x, y, width, height, height / 2);
  context.fill();
  context.strokeStyle = PALETTE.interactive;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = PALETTE.parchment;
  context.textAlign = 'center';
  context.font = '700 34px "Andika", "Trebuchet MS", sans-serif';
  context.fillText(label, x + width / 2, y + height / 2 + 12);
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

function iconGlyph(icon) {
  return ({
    wand: '✦', eyes: '◉', cat: '♛', owl: '◉', toad: '●', replay: '↻', explore: '⌁',
    purple: '◆', rose: '♥', teal: '●', gold: '★', 'pet-cat': '♛', 'pet-owl': '◉',
    'pet-toad': '●', 'name-biscuit': '●', 'name-pip': '✦', 'name-star': '★',
    'name-custom': '✎', 'wax-check': '✓',
  })[icon] ?? '✦';
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
