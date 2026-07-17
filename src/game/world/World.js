import { HINTS, OBJECTIVE, WORLD } from '../config.js';
import { createCoreActionRegistry } from '../actions/index.js';
import { SPELLS, masteryTierForCasts } from '../content/spells.js';
import { conditionMatches, writePath } from '../core/conditions.js';
import { clamp } from '../core/math.js';
import { normalizeRobeTrim, robeTrimColor, robeTrimOption } from '../core/RobeTrims.js';
import { SeededRandom } from '../core/rng.js';
import { Dialogue } from '../systems/Dialogue.js';
import { Learning } from '../systems/Learning.js';
import { Quests } from '../systems/Quests.js';
import { SetPieces } from '../systems/SetPieces.js';
import { Spellbook } from '../systems/Spellbook.js';
import {
  GlintActivationLedger,
  affordanceSeenReceipt,
  createAffordancePlan,
  createAffordanceSnapshot,
  targetIsSpent,
} from './AffordanceSalience.js';
import {
  applyGuideWalkCueToOccupants,
  createGuideWalkCueSnapshot,
  resolveGuideWalkCue,
} from './GuideWalkCue.js';
import { resolveChapterSceneState } from './chapterSceneRuntime.js';
import { resolveRoomVariant } from './roomVariant.js';

const PET_HOME_DISTANCE = 65;
const PET_LEADING_DISTANCE = 85;
const PET_EDGE_CLEARANCE = 110;
const PET_HINT_CORRIDOR_CLEARANCE = 70;
const PET_HINT_CORRIDOR_MARGIN = 35;
const PET_HINT_CORRIDOR_END = 0.16;
const INTERACTION_ACTIVATION_DISTANCE = 45;
const EXIT_ACTIVATION_DISTANCE = 2;
const DOORWAY_SCALE = 0.82;
const SPELL_CAST_AUTHORIZATION = Symbol('spell-cast-authorization');
const PLAYER_CHARACTER_ID = 'character.violet';
const PET_CHARACTER_IDS = Object.freeze({
  cat: 'character.cat',
  owl: 'character.pet-owl',
  toad: 'character.toad',
});

export class World {
  constructor({
    chapters,
    save,
    seed,
    clock = () => '2000-01-01T00:00:00.000Z',
    onDirty = ({ save: nextSave }) => ({ ok: true, status: 'memory-only', save: nextSave }),
    actionRegistry = createCoreActionRegistry(),
    selectSetPieceFallback = () => null,
  }) {
    this.chapters = chapters;
    this.save = save;
    this.clock = clock;
    this.onDirty = onDirty;
    this.random = new SeededRandom(seed ?? save.worldSeed ?? 12072026);
    this.time = 0;
    this.seq = 0;
    this.events = [];
    this.idleTime = 0;
    this.failedAttempts = 0;
    this.hintObjective = null;
    this.hintLookShown = false;
    this.hintVoiceRepeated = false;
    this.hintTrailShown = false;
    this.hintAssistTriggered = false;
    this.pendingInteraction = null;
    this.walkSpeed = 310;
    this.cameraX = 0;
    this.overlay = null;
    this.selection = null;
    this.pendingPetType = null;
    this.objectiveEmphasisUntil = 0;
    this.glintActivations = new GlintActivationLedger();
    this.dialogueSourceTarget = null;
    this.guideWalkCue = null;
    this.actorAnimations = new Map();
    this.persistenceSuppression = 0;
    this.deferredDialogueReceipts = new Map();
    this.actionBatchTransaction = null;
    this.sceneEntryPending = false;
    this.pendingDialogueCursor = null;
    this.revealedSpellTargets = new Map();
    this.actionRegistry = actionRegistry;
    this.selectSetPieceFallback = selectSetPieceFallback;
    this.actionHandlers = createWorldActionHandlers(this);

    const savedDialogueCursor = save.schemaVersion >= 3 && save.resume?.dialogue
      ? structuredClone(save.resume.dialogue)
      : null;
    const chapterId = save.resume?.chapter ?? 'ch1';
    this.chapter = chapters[chapterId] ?? chapters.ch1;
    const roomId = save.resume?.room ?? this.chapter.start.room;
    const spawnId = save.resume?.spawn ?? this.chapter.start.spawn;
    this.roomId = this.chapter.rooms[roomId] ? roomId : this.chapter.start.room;
    const spawn = resolveSpawn(this.room, spawnId) ?? { x: 180, y: 610, facing: 'right' };
    this.player = {
      kind: 'violet',
      x: spawn.x,
      y: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      scale: 1,
      targetScale: 1,
      facing: spawn.facing ?? 'right',
      walking: false,
      wand: Boolean(save.character?.wandId),
      outfit: save.character?.appearance?.robeTrim ? 'robes' : 'casual',
      robeTrim: robeTrimColor(save.character?.appearance?.robeTrim),
      house: save.character?.house ?? null,
    };

    this.currentSceneId = save.resume?.scene ?? this.chapter.start.scene;
    this.bindSystems();
    this.pendingDialogueCursor = savedDialogueCursor;
    if (this.settleQuestLifecycle()) this.enterPendingScene();
    else this.sceneEntryPending = true;
    this.startGuideWalkCue();
    this.updateAffordanceActivations();
  }

  get room() {
    return this.sceneState.room ?? this.chapter.rooms[this.roomId];
  }

  get sceneState() {
    const baseRoom = this.chapter.rooms[this.roomId];
    return resolveChapterSceneState({
      chapter: this.chapter,
      roomId: this.roomId,
      savedSceneId: this.currentSceneId,
      save: this.save,
      legacyRoomVariant: resolveRoomVariant(
        baseRoom,
        this.flags['ch1.petNamed'] ? 'dusk' : 'base',
      ),
    });
  }

  get playerActorId() {
    return requireActorIdByCharacter(this.chapter, PLAYER_CHARACTER_ID);
  }

  get petActorId() {
    const characterId = PET_CHARACTER_IDS[this.save.character.pet?.type];
    return characterId ? requireActorIdByCharacter(this.chapter, characterId) : null;
  }

  get flags() {
    return this.save.progress.questFlags;
  }

  get dialoguePresentation() {
    const presentation = this.dialogue.presentation();
    if (!presentation) return presentation;
    const namedPetCaption = presentation.scriptId === 'ch1.keeper.petAndName'
      && presentation.nodeId === 'done'
      && this.save.character.pet?.name
      ? `${this.save.character.pet.name}!`
      : null;
    if (!presentation.speaker) {
      return {
        ...presentation,
        ...(namedPetCaption ? { caption: namedPetCaption } : {}),
        portraitCharacterId: null,
      };
    }
    const speaker = requireNpcDefinition(this.chapter, presentation.speaker);
    return {
      ...presentation,
      ...(namedPetCaption ? { caption: namedPetCaption } : {}),
      speakerLabel: speaker.displayName ?? presentation.speakerLabel ?? 'Friend',
      portraitCharacterId: speaker.characterId,
    };
  }

  get objective() {
    return this.activeQuest()?.step.objective ?? null;
  }

  activeQuest({ includeSleeping = false } = {}) {
    const active = this.quests?.active() ?? null;
    if (!includeSleeping && active && questIsSleeping(active, this.save)) return null;
    return active;
  }

  get blocked() {
    return this.dialogue.active
      || this.setPieces.blocked
      || this.learning.isActive
      || this.spellbook.blocksWorldInput
      || Boolean(this.overlay)
      || Boolean(this.selection);
  }

  get affordanceRenderQuiet() {
    return this.dialogue.active
      || this.setPieces.blocked
      || this.player.walking
      || Boolean(this.pendingInteraction);
  }

  get worldAffordancesSuppressed() {
    return this.affordanceRenderQuiet
      || this.learning.isActive
      || this.spellbook.blocksWorldInput
      || Boolean(this.overlay)
      || Boolean(this.selection);
  }

  emit(type, payload = {}) {
    this.events.push({ seq: ++this.seq, at: this.time, type, payload });
  }

  drainEvents() {
    const drained = this.events;
    this.events = [];
    return drained;
  }

  update(dt) {
    this.time += dt;
    this.learning.update(dt);
    this.spellbook.update(dt);
    this.setPieces.update(dt);
    this.expireActorAnimations();

    let pendingTarget = this.resolvePendingInteraction();
    if (this.pendingInteraction && (!pendingTarget || this.blocked)) {
      this.cancelPendingInteraction();
      pendingTarget = null;
    }

    const deltaX = this.player.targetX - this.player.x;
    const deltaY = this.player.targetY - this.player.y;
    const remainingDistance = Math.hypot(deltaX, deltaY);
    if (remainingDistance > 2) {
      const step = Math.min(remainingDistance, this.walkSpeed * dt);
      const progress = step / remainingDistance;
      this.player.x += deltaX * progress;
      this.player.y += deltaY * progress;
      this.player.scale += (this.player.targetScale - this.player.scale) * progress;
      if (Math.abs(deltaX) > 0.01) this.player.facing = deltaX < 0 ? 'left' : 'right';
      this.player.walking = true;
    } else {
      this.player.x = this.player.targetX;
      this.player.y = this.player.targetY;
      this.player.scale = this.player.targetScale;
      this.player.walking = false;
    }

    if (
      pendingTarget
      && distanceToApproach(this.player, pendingTarget) <= activationDistance(pendingTarget)
    ) {
      this.activatePendingInteraction(pendingTarget);
    }

    const roomWidth = this.room.size?.width ?? WORLD.width;
    const desiredCamera = Math.max(0, Math.min(roomWidth - WORLD.width, this.player.x - WORLD.width / 2));
    this.cameraX += (desiredCamera - this.cameraX) * Math.min(1, dt * 6);
    if (this.settleQuestLifecycle()) {
      if (this.sceneEntryPending) this.enterPendingScene();
      else this.syncScene();
    }
    this.updateHintLadder(dt);
    this.updateAffordanceActivations();
  }

  tap(point) {
    if (this.setPieces.blocked) return { kind: 'blocked', reason: 'set-piece' };
    if (this.dialogue.active) return { kind: 'dialogue' };
    if (this.learning.isActive) return { kind: 'blocked', reason: 'learning' };
    if (this.spellbook.blocksWorldInput) return { kind: 'blocked', reason: 'spellbook' };
    const worldPoint = { x: point.x + this.cameraX, y: point.y };
    const target = this.targetAt(point);
    if (this.spellbook.state === 'targeting') {
      if (target?.kind === 'spellTarget') {
        this.interactTarget(target);
        return target;
      }
      this.cancelSpellbook();
      return { kind: 'spellbook', reason: 'cancelled-targeting' };
    }
    if (target) {
      this.interactTarget(target);
      return target;
    }
    const band = this.room.walkBand ?? { top: 560, bottom: 640 };
    this.player.targetX = Math.max(55, Math.min((this.room.size?.width ?? WORLD.width) - 55, worldPoint.x));
    this.player.y = Math.max(band.top, Math.min(band.bottom, worldPoint.y));
    this.player.targetY = this.player.y;
    this.cancelPendingInteraction({ stopWalking: false });
    this.idleTime = 0;
    this.emit('feedback.command', { kind: 'emptyTap', x: point.x, y: point.y });
    return { kind: 'walk', x: this.player.targetX };
  }

  interactSemantic(id) {
    const target = this.targets().find((candidate) => candidate.id === id || candidate.semanticId === id);
    if (!target) throw new Error(`No active interaction target named ${id} in ${this.roomId}.`);
    return this.interactTarget(target);
  }

  targetAt(point) {
    const worldPoint = { x: point.x + this.cameraX, y: point.y };
    return this.targets().find((candidate) => hitTest(worldPoint, candidate.hitArea)) ?? null;
  }

  interactTarget(target) {
    this.noteMeaningfulInput();
    if (target.kind === 'spellTarget') {
      if (this.spellbook.state === 'targeting') return this.castSpellAt(target.id);
      const center = hitAreaCenter(target.hitArea);
      this.emit('feedback.command', {
        kind: 'spellTargetNeedsSpell',
        x: center.x - this.cameraX,
        y: center.y,
      });
      return false;
    }
    const approach = target.approach;
    if (approach && distanceToApproach(this.player, target) > activationDistance(target)) {
      this.player.targetX = approach.x;
      if (target.kind === 'exit') {
        this.player.targetY = approach.y;
        this.player.targetScale = DOORWAY_SCALE;
      }
      this.pendingInteraction = {
        chapterId: this.chapter.id,
        roomId: this.roomId,
        targetId: target.id,
        kind: target.kind,
        approach: { ...approach },
      };
      const center = hitAreaCenter(target.hitArea);
      this.emit('feedback.command', {
        kind: 'approach',
        target: target.id,
        x: center.x - this.cameraX,
        y: center.y,
      });
      return;
    }
    this.cancelPendingInteraction();
    if (approach?.facing) this.player.facing = approach.facing;
    this.runTargetActions(target);
  }

  resolvePendingInteraction() {
    const pending = this.pendingInteraction;
    if (!pending || pending.chapterId !== this.chapter.id || pending.roomId !== this.roomId) return null;
    const target = this.targets().find((candidate) => candidate.id === pending.targetId);
    if (!target?.approach) return null;
    if (target.approach.x !== pending.approach.x || target.approach.y !== pending.approach.y) return null;
    return target;
  }

  activatePendingInteraction(target) {
    if (!this.pendingInteraction || target.id !== this.pendingInteraction.targetId) return false;
    const approach = target.approach;
    this.pendingInteraction = null;
    this.player.x = approach.x;
    this.player.targetX = approach.x;
    this.player.y = approach.y;
    this.player.targetY = approach.y;
    this.player.scale = target.kind === 'exit' ? DOORWAY_SCALE : 1;
    this.player.targetScale = this.player.scale;
    this.player.facing = approach.facing;
    this.player.walking = false;
    this.runTargetActions(target);
    return true;
  }

  cancelPendingInteraction({ stopWalking = true } = {}) {
    if (!this.pendingInteraction) return false;
    this.pendingInteraction = null;
    this.player.scale = 1;
    this.player.targetScale = 1;
    this.player.targetY = this.player.y;
    if (stopWalking) {
      this.player.targetX = this.player.x;
      this.player.walking = false;
    }
    return true;
  }

  targets() {
    const targets = [];
    for (const hotspot of this.room.hotspots ?? []) {
      if (!conditionMatches(hotspot.when, this.save)) continue;
      const target = {
        id: hotspot.id,
        semanticId: hotspot.semanticId,
        kind: hotspot.kind,
        source: 'hotspot',
        repeat: hotspot.repeat,
        advertisementReceipt: affordanceSeenReceipt(this.chapter.id, hotspot.id),
        hitArea: hotspot.hitArea,
        approach: hotspot.approach,
        presentation: hotspot.presentation,
        requiredSpell: hotspot.requiredSpell,
        spellEffect: hotspot.spellEffect ?? null,
        actions: hotspot.onInteract ?? [],
      };
      if (hotspot.repeat === 'once' && targetIsSpent(target, this.save)) continue;
      targets.push(target);
    }
    for (const exit of this.room.exits ?? []) {
      if (!conditionMatches(exit.when, this.save)) continue;
      targets.push({
        id: exit.id,
        kind: 'exit',
        source: 'exit',
        repeat: 'always',
        hitArea: exit.hitArea,
        approach: doorwayApproach(exit, this.room, this.player),
        presentation: { icon: exit.icon ?? 'arrow', glow: 'interactionGold' },
        actions: [{ type: 'travel.request', room: exit.to.room, spawn: exit.to.spawn, transition: exit.transition }],
      });
    }
    for (const occupant of this.room.occupants ?? []) {
      if (!conditionMatches(occupant.when, this.save)) continue;
      const npc = this.chapter.npcs[occupant.npc];
      if (npc?.characterId === PLAYER_CHARACTER_ID || Object.values(PET_CHARACTER_IDS).includes(npc?.characterId)) continue;
      if (!npc?.defaultTalk) continue;
      targets.push({
        id: `${this.roomId}.${occupant.npc}`,
        kind: 'talk',
        source: 'occupant',
        repeat: 'always',
        advertisementReceipt: affordanceSeenReceipt(this.chapter.id, `${this.roomId}.${occupant.npc}`),
        hitArea: { shape: 'circle', x: occupant.x, y: occupant.y - 85, radius: npc.hitRadius ?? 88 },
        approach: { x: occupant.x + (occupant.facing === 'left' ? -105 : 105), y: occupant.y, facing: occupant.facing === 'left' ? 'right' : 'left' },
        presentation: { icon: 'talk', glow: 'interactionGold' },
        actions: [{ type: 'dialogue.start', script: npc.defaultTalk }],
      });
    }
    return targets;
  }

  runTargetActions(target, { castSpellId = null, authorization = null } = {}) {
    if (
      target.kind === 'spellTarget'
      && (
        authorization !== SPELL_CAST_AUTHORIZATION
        || target.requiredSpell !== castSpellId
      )
    ) return false;
    return this.runActionTransaction(() => {
      const dialogueAction = target.actions?.find((action) => action.type === 'dialogue.start');
      if (dialogueAction) {
        this.dialogueSourceTarget = {
          targetId: target.id,
          script: dialogueAction.script,
          repeat: target.repeat,
          advertisementReceipt: target.advertisementReceipt,
        };
      }
      return this.runActions(target.actions);
    });
  }

  runActions(actions = []) {
    return this.runActionTransaction(() => {
      for (let index = 0; index < actions.length; index += 1) {
        const action = actions[index];
        const result = this.runAction(action);
        if (actionResultFailed(result)) return false;
        if (this.actionRegistry.isTerminal(action.type)) {
          return 'terminal';
        }
        if (action.type === 'setPiece.play') {
          if (result === 'terminal') return result;
          if (this.setPieces.active) {
            this.setPieces.bindActionTail(actions.slice(index + 1));
            return true;
          }
        }
      }
      return true;
    });
  }

  runActionTransaction(callback) {
    const ownsTransaction = this.actionBatchTransaction === null;
    if (ownsTransaction) {
      this.actionBatchTransaction = createActionBatchTransaction(this);
    }

    try {
      const result = callback();
      if (ownsTransaction && actionResultFailed(result)) {
        this.rollbackActionBatch(this.actionBatchTransaction);
      }
      return result;
    } catch (error) {
      if (ownsTransaction) this.rollbackActionBatch(this.actionBatchTransaction);
      throw error;
    } finally {
      if (ownsTransaction) this.actionBatchTransaction = null;
    }
  }

  rollbackActionBatch(transaction) {
    if (!transaction) return false;
    replaceObjectContents(this.save, transaction.save);
    restoreActionBatchRuntime(this, transaction);

    const reason = 'action-batch-rollback';
    if (this.persistenceSuppression > 0) {
      this.emit('save.persistenceSuppressed', { reason });
    } else {
      this.onDirty({
        reason,
        flush: true,
        save: this.save,
        rollbackSave: transaction.save,
      });
      this.emit('save.flushRequested', { reason });
    }
    this.emit('state.changed', { paths: ['save'], reason });
    return true;
  }

  runAction(action) {
    return this.actionRegistry.execute(action, {
      handlers: this.actionHandlers,
      world: this,
    });
  }

  chooseSelection(optionId) {
    if (!this.selection) return false;
    const option = this.selection.options.find((candidate) => candidate.id === optionId);
    if (!option) return false;
    return this.runActionTransaction(() => {
      this.noteMeaningfulInput();
      this.selection = null;
      return this.runActions(option.actions ?? []);
    });
  }

  setPetName(name) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 80) return false;
    if (!this.pendingPetType && !this.save.character.pet?.type) return false;
    return this.runActionTransaction(() => {
      this.noteMeaningfulInput();
      return this.runActions([{ type: 'character.set', field: 'pet.name', value: name.trim() }]);
    });
  }

  advanceDialogue(choiceId = null) {
    if (!this.dialogue.active) return null;
    if (this.dialogue.node?.type === 'choice' && !this.dialogue.node.choices.some((choice) => choice.id === choiceId)) {
      return this.dialogue.presentation();
    }
    const result = this.runActionTransaction(() => {
      this.noteMeaningfulInput();
      return this.dialogue.advance(choiceId);
    });
    return result === false ? this.dialogue.presentation() : result;
  }

  closeOverlay() {
    if (!this.overlay) return;
    this.noteMeaningfulInput();
    this.overlay = null;
    this.updateAffordanceActivations();
  }

  openSpellbook() {
    if (this.setPieces.blocked || this.overlay || this.selection) return false;
    this.noteMeaningfulInput();
    const opened = this.spellbook.open();
    if (opened) this.updateAffordanceActivations();
    return opened;
  }

  selectSpell(spellId) {
    this.noteMeaningfulInput();
    const selected = this.spellbook.select(spellId);
    if (selected) this.updateAffordanceActivations();
    return selected;
  }

  cancelSpellbook() {
    this.noteMeaningfulInput();
    const cancelled = this.spellbook.cancel();
    if (cancelled) this.updateAffordanceActivations();
    return cancelled;
  }

  castSpellAt(targetId) {
    const target = this.targets().find((candidate) => (
      candidate.id === targetId || candidate.semanticId === targetId
    ));
    if (!target) return false;
    this.noteMeaningfulInput();
    const result = this.spellbook.castAt(target);
    if (!actionResultFailed(result)) this.updateAffordanceActivations();
    return result;
  }

  startLearning(beatId) {
    const result = this.learning.start(beatId);
    if (result === false) return false;
    this.updateAffordanceActivations();
    return result;
  }

  chooseLearningUnit(unitId) {
    return this.runActionTransaction(() => {
      this.noteMeaningfulInput();
      return this.learning.chooseUnit(unitId);
    });
  }

  completeLearningBeat(beat) {
    if (this.save.learning.completedBeats.includes(beat.id)) return true;
    this.save.learning.completedBeats.push(beat.id);
    const skillField = learningSkillField(beat.skill);
    this.save.learning[skillField] = Math.min(10, this.save.learning[skillField] + 1);

    const actionResult = this.runActions(beat.onComplete);
    if (actionResultFailed(actionResult)) return false;
    const persisted = this.markDirty('checkpoint', true);
    if (actionResultFailed(persisted)) return false;
    this.noteProgress();
    this.emit('state.changed', {
      paths: ['learning.completedBeats', `learning.${skillField}`],
      reason: 'learning-completed',
    });
    return true;
  }

  performSpellCast(spell, target) {
    return this.runActionTransaction(() => {
      const actionResult = this.runTargetActions(target, {
        castSpellId: spell.id,
        authorization: SPELL_CAST_AUTHORIZATION,
      });
      if (actionResultFailed(actionResult)) return false;

      const stats = this.save.spellbook.stats[spell.id];
      if (!stats || !this.save.spellbook.known.includes(spell.id)) return false;
      stats.casts += 1;
      stats.masteryTier = masteryTierForCasts(spell.id, stats.casts);
      const persisted = this.markDirty('mutation');
      if (actionResultFailed(persisted)) return false;
      this.noteProgress();
      this.revealSpellTarget(spell, target);
      this.emit('state.changed', {
        paths: [`spellbook.stats.${spell.id}`],
        reason: 'spell-cast',
      });
      this.emit('spell.cast', {
        spell: spell.id,
        target: target.id,
        masteryTier: stats.masteryTier,
      });
      return { ok: true, masteryTier: stats.masteryTier };
    });
  }

  revealSpellTarget(spell, target) {
    const effect = target.spellEffect
      ?? (spell.effect.kind === 'light'
        ? { kind: 'light', radius: 240, intensity: 1 }
        : null);
    if (!effect) return;
    const center = hitAreaCenter(target.hitArea);
    this.revealedSpellTargets.set(target.id, {
      roomId: this.roomId,
      targetId: target.id,
      x: center.x,
      y: center.y,
      ...effect,
    });
  }

  selectRobeTrim(trimId) {
    const option = robeTrimOption(trimId);
    if (this.overlay?.surface !== 'robe-picker' || !option) return false;
    this.noteMeaningfulInput();
    this.overlay = { ...this.overlay, selectedTrim: option.id };
    return true;
  }

  confirmRobeTrim() {
    if (this.overlay?.surface !== 'robe-picker') return false;
    const selectedTrim = normalizeRobeTrim(this.overlay.selectedTrim);
    return this.runActionTransaction(() => {
      if (actionResultFailed(this.runAction({
        type: 'character.set', field: 'appearance.robeTrim', value: selectedTrim,
      }))) return false;
      this.closeOverlay();
      if (!this.setFlag('ch1.trimChosen', true)) return false;
      return !actionResultFailed(this.runAction({ type: 'dialogue.start', script: 'ch1.tailor.done' }));
    });
  }

  settleQuestLifecycle(options = {}) {
    if (!this.quests) return true;
    this.quests.update(options);
    return !['failed', 'blocked'].includes(this.quests.lastSettlementStatus);
  }

  setFlag(flag, value = true) {
    if (this.flags[flag] === value) return true;
    this.noteProgress();
    this.flags[flag] = value;
    if (actionResultFailed(this.markDirty('flag'))) return false;
    this.emit('state.changed', { paths: [`progress.questFlags.${flag}`], reason: 'flag' });
    if (this.settleQuestLifecycle()) return this.syncScene();
    return this.quests.lastSettlementStatus === 'blocked';
  }

  addCollection(collection, id) {
    const target = this.save.collections[collection];
    if (!Array.isArray(target) || target.includes(id)) return true;
    this.noteProgress();
    target.push(id);
    if (actionResultFailed(this.markDirty('collection'))) return false;
    this.emit('reward.granted', { collection, id });
    return true;
  }

  grantReward(action) {
    if (this.save.progress.rewardReceipts.includes(action.receipt)) return true;
    this.noteProgress();
    this.save.progress.rewardReceipts.push(action.receipt);
    for (const card of action.cards ?? []) {
      if (!this.addCollection('cards', card)) return false;
    }
    for (const treasure of action.treasures ?? []) {
      if (!this.addCollection('treasures', treasure)) return false;
    }
    this.save.collections.housePoints += action.points ?? 0;
    if (actionResultFailed(this.markDirty('reward'))) return false;
    this.emit('reward.granted', { receipt: action.receipt });
    return true;
  }

  travel(roomId, spawnId, transition = 'ink') {
    return this.runActionTransaction(() => {
      if (!this.settleQuestLifecycle({ ignoreBlock: true })) {
        return { ok: false, status: 'quest-transition-failed' };
      }
      this.noteProgress();
      this.cancelPendingInteraction();
      this.guideWalkCue = null;
      this.clearActorAnimations();
      this.revealedSpellTargets.clear();
      const completingSetPieceId = this.setPieces.completingId;
      const deferredReceipts = this.addDeferredDialogueReceiptsForSetPiece(
        completingSetPieceId,
      );
      const requestedChapter = roomId.split('.')[0];
      if (requestedChapter !== this.chapter.id && this.chapters[requestedChapter]) {
        const changed = this.changeChapter(requestedChapter, roomId, spawnId);
        if (!actionResultFailed(changed) && deferredReceipts.length > 0) {
          this.emit('state.changed', {
            paths: ['progress.storyReceipts'],
            reason: 'dialogue-completion',
          });
        }
        return changed;
      }
      const room = this.chapter.rooms[roomId];
      if (!room) throw new Error(`Unknown room ${roomId} in chapter ${this.chapter.id}.`);
      const from = this.roomId;
      const spawn = resolveSpawn(room, spawnId);
      this.roomId = roomId;
      this.player.x = spawn?.x ?? 160;
      this.player.y = spawn?.y ?? 610;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      this.player.scale = 1;
      this.player.targetScale = 1;
      this.player.facing = spawn?.facing ?? 'right';
      this.cameraX = 0;
      this.save.resume = resumeForSave(this.save, {
        chapter: this.chapter.id,
        scene: room.scene ?? roomId,
        room: roomId,
        spawn: spawnId,
      });
      if (actionResultFailed(this.markDirty('scene-change', true))) return false;
      this.emit('room.transitionRequested', { from, to: roomId, spawn: spawnId, effect: transition });
      this.emit('room.entered', { room: roomId, spawn: spawnId });
      if (!this.syncScene(true)) return false;
      if (deferredReceipts.length > 0) {
        this.emit('state.changed', {
          paths: ['progress.storyReceipts'],
          reason: 'dialogue-completion',
        });
      }
      this.updateAffordanceActivations();
      return true;
    });
  }

  changeChapter(chapterId, roomId = null, spawnId = null, {
    persist = true,
    sceneId = null,
  } = {}) {
    return this.runActionTransaction(() => {
      const chapter = this.chapters[chapterId];
      if (!chapter) throw new Error(`Unknown chapter ${chapterId}.`);
      this.noteProgress();
      this.cancelPendingInteraction();
      this.guideWalkCue = null;
      this.clearActorAnimations();
      this.revealedSpellTargets.clear();
      const from = this.roomId;
      this.chapter = chapter;
      this.bindSystems();
      this.quests.initialize({ historical: false });
      this.roomId = roomId && chapter.rooms[roomId] ? roomId : chapter.start.room;
      const room = chapter.rooms[this.roomId];
      const selectedSpawn = spawnId ?? chapter.start.spawn;
      const spawn = resolveSpawn(room, selectedSpawn);
      this.player.x = spawn?.x ?? 160;
      this.player.y = spawn?.y ?? 610;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      this.player.scale = 1;
      this.player.targetScale = 1;
      this.player.facing = spawn?.facing ?? 'right';
      this.cameraX = 0;
      this.currentSceneId = sceneId ?? chapter.start.scene;
      this.sceneEntryPending = false;
      this.pendingDialogueCursor = null;
      this.save.resume = resumeForSave(this.save, {
        chapter: chapter.id,
        scene: this.currentSceneId,
        room: this.roomId,
        spawn: selectedSpawn,
      });
      if (persist && actionResultFailed(this.markDirty('chapter-change', true))) return false;
      this.emit('room.transitionRequested', { from, to: this.roomId, spawn: selectedSpawn, effect: 'ink' });
      this.emit('room.entered', { room: this.roomId, spawn: selectedSpawn });
      let sceneEntered;
      if (persist) sceneEntered = this.syncScene(true, { persist: true });
      else {
        this.persistenceSuppression += 1;
        try {
          sceneEntered = this.syncScene(true, { persist: false });
        } finally {
          this.persistenceSuppression -= 1;
        }
      }
      if (!sceneEntered) {
        if (persist) return false;
        this.sceneEntryPending = true;
      }
      this.updateAffordanceActivations();
      return true;
    });
  }

  adoptPersistedResume(chapterId) {
    const resume = this.save.resume;
    if (resume?.chapter !== chapterId) {
      throw new Error(`Persisted resume belongs to ${resume?.chapter ?? 'no chapter'}, not ${chapterId}.`);
    }
    this.changeChapter(chapterId, resume.room, resume.spawn, {
      persist: false,
      sceneId: resume.scene,
    });
  }

  completeChapter(chapterId, nextChapter) {
    if (chapterId !== this.chapter.id) {
      throw new Error(`Cannot complete ${chapterId} while ${this.chapter.id} is active.`);
    }
    if (nextChapter === chapterId) throw new Error('The next chapter must differ from the completed chapter.');
    const destination = this.chapters[nextChapter];
    if (!destination) throw new Error(`Unknown next chapter ${nextChapter}.`);
    const destinationRoom = destination.rooms?.[destination.start?.room];
    if (!destinationRoom || !resolveSpawn(destinationRoom, destination.start.spawn)) {
      throw new Error(`Next chapter ${nextChapter} has no valid start resume point.`);
    }
    if (!Number.isSafeInteger(destination.number) || destination.number < 1) {
      throw new Error(`Next chapter ${nextChapter} has no valid chapter number.`);
    }

    const previous = structuredClone(this.save);
    const candidate = structuredClone(this.save);
    if (!candidate.progress.completedChapters.includes(chapterId)) {
      candidate.progress.completedChapters.push(chapterId);
    }
    candidate.progress.highestUnlockedChapter = Math.max(
      candidate.progress.highestUnlockedChapter,
      destination.number,
    );
    candidate.progress.questFlags[`${chapterId}.chapterCardSeen`] = true;
    candidate.progress.questFlags[`${chapterId}.complete`] = true;
    candidate.resume = resumeForSave(candidate, {
      chapter: destination.id,
      scene: destination.start.scene,
      room: destination.start.room,
      spawn: destination.start.spawn,
    });
    const terminalDialogueReceipts = this.terminalDialogueReceiptsForCompletion(candidate);
    const lifecycleActions = settleQuestLifecycleCandidate(this.chapter, candidate);
    candidate.updatedAt = this.clock();

    const persisted = this.onDirty({
      reason: 'chapter-complete',
      flush: true,
      save: candidate,
      rollbackSave: previous,
    });
    this.emit('save.flushRequested', { reason: 'chapter-complete' });
    if (persisted?.ok === false) {
      this.emit('chapter.completionFailed', { chapter: chapterId, nextChapter });
      return persisted;
    }

    replaceObjectContents(this.save, persisted?.save ?? candidate);
    for (const receipt of terminalDialogueReceipts) this.deferredDialogueReceipts.delete(receipt);
    this.noteProgress();
    this.emit('state.changed', {
      paths: [...new Set([
        'progress.completedChapters',
        'progress.highestUnlockedChapter',
        `progress.questFlags.${chapterId}.chapterCardSeen`,
        `progress.questFlags.${chapterId}.complete`,
        ...(Array.isArray(this.save.progress.questReceipts) ? ['progress.questReceipts'] : []),
        ...(terminalDialogueReceipts.length > 0 ? ['progress.storyReceipts'] : []),
        ...lifecycleActions.flatMap(questLifecycleActionPaths),
        'resume',
      ])],
      reason: 'chapter-complete',
    });
    this.emitLifecycleRewards(lifecycleActions);
    this.emit('chapter.completed', { chapter: chapterId, nextChapter });
    this.adoptPersistedResume(nextChapter);
    return { ok: true, status: persisted?.status ?? 'memory-only', save: this.save };
  }

  markDirty(reason, flush = false, { rollbackSave = null } = {}) {
    if (this.persistenceSuppression > 0) {
      this.emit('save.persistenceSuppressed', { reason });
      return { ok: true, status: 'suppressed', save: this.save };
    }
    this.save.updatedAt = this.clock();
    const result = this.onDirty({ reason, flush, save: this.save, rollbackSave });
    this.emit(flush ? 'save.flushRequested' : 'save.dirty', { reason });
    return result;
  }

  noteMeaningfulInput() {
    this.resetHintLadder('input');
  }

  noteProgress() {
    this.resetHintLadder('progress');
  }

  // Puzzle controllers call this only after an interaction has been evaluated
  // against the active puzzle. Ordinary room movement never routes through it.
  recordPuzzleFailure() {
    const active = this.syncHintObjective();
    if (!active || this.blocked) return false;

    this.idleTime = 0;
    this.failedAttempts += 1;

    const { quest, step, stepId } = active;
    const hints = step.hints;
    if (!this.hintTrailShown && this.failedAttempts >= HINTS.sparkleFailures && hints.trailTarget) {
      this.hintTrailShown = true;
      this.emit('hint.trailRequested', { quest: quest.id, step: stepId, target: hints.trailTarget });
    }

    const assistTarget = hints.trailTarget ?? hints.lookTarget;
    if (
      !this.hintAssistTriggered
      && this.failedAttempts >= HINTS.autoCompleteFailures
      && hints.assistActions.length > 0
      && assistTarget
      && this.hintTargetAvailable(assistTarget)
    ) {
      this.hintAssistTriggered = true;
      this.emit('hint.assistTriggered', { quest: quest.id, step: stepId, target: assistTarget });
      this.runActions(hints.assistActions);
    }

    return true;
  }

  updateHintLadder(dt) {
    const active = this.syncHintObjective();
    if (!active || this.blocked || this.player.walking || this.pendingInteraction) return;

    this.idleTime += dt;
    const { quest, step, stepId } = active;
    if (!this.hintLookShown && this.idleTime >= HINTS.petLookSeconds) {
      this.hintLookShown = true;
      if (step.hints.lookTarget) {
        this.emit('hint.lookRequested', { quest: quest.id, step: stepId, target: step.hints.lookTarget });
      }
    }
    if (!this.hintVoiceRepeated && this.idleTime >= HINTS.repeatSeconds) {
      this.hintVoiceRepeated = true;
      if (step.hints.repeatVoice) {
        this.emit('hint.voiceRequested', {
          quest: quest.id,
          step: stepId,
          voice: step.hints.repeatVoice,
          text: step.objective.text,
        });
      }
    }
  }

  syncHintObjective() {
    const active = this.activeQuest();
    const next = active ? { quest: active.quest.id, step: active.stepId } : null;
    const currentKey = this.hintObjective ? `${this.hintObjective.quest}:${this.hintObjective.step}` : null;
    const nextKey = next ? `${next.quest}:${next.step}` : null;
    if (currentKey !== nextKey) {
      this.resetHintLadder('objective');
      this.hintObjective = next;
    }
    return active;
  }

  resetHintLadder(reason) {
    if (this.hintObjective && (this.hintLookShown || this.hintTrailShown)) {
      this.emit('hint.cleared', { ...this.hintObjective, reason });
    }
    this.idleTime = 0;
    this.failedAttempts = 0;
    this.hintLookShown = false;
    this.hintVoiceRepeated = false;
    this.hintTrailShown = false;
    this.hintAssistTriggered = false;
  }

  hintTargetAvailable(target) {
    if (target.startsWith('hud.')) return true;
    return this.targets().some((candidate) => candidate.id === target || candidate.semanticId === target);
  }

  syncPlayerProfile() {
    this.player.wand = Boolean(this.save.character.wandId);
    this.player.outfit = this.save.character.appearance?.robeTrim ? 'robes' : 'casual';
    this.player.robeTrim = robeTrimColor(this.save.character.appearance?.robeTrim);
    this.player.house = this.save.character.house ?? null;
  }

  startActorAnimation(payload) {
    const setPiece = this.setPieces?.active;
    if (!setPiece) throw new Error('Actor animation cues require an active set piece.');
    if (!this.chapter.npcs[payload.actor]) {
      throw new Error(`Unknown actor ${payload.actor} in chapter ${this.chapter.id}.`);
    }
    const animation = {
      actor: payload.actor,
      action: payload.action,
      ...(payload.expression ? { expression: payload.expression } : {}),
      ...(payload.temporaryProp ? { temporaryProp: payload.temporaryProp } : {}),
      setPiece: setPiece.requestedId,
      startedAt: this.time,
      duration: setPiece.descriptor.duration,
    };
    this.actorAnimations.set(payload.actor, animation);
    return animation;
  }

  clearActorAnimations(setPieceId = null) {
    if (setPieceId === null) {
      this.actorAnimations.clear();
      return;
    }
    for (const [actor, animation] of this.actorAnimations) {
      if (animation.setPiece === setPieceId) this.actorAnimations.delete(actor);
    }
  }

  expireActorAnimations() {
    for (const [actor, animation] of this.actorAnimations) {
      if (this.time - animation.startedAt >= animation.duration) this.actorAnimations.delete(actor);
    }
  }

  actorAnimationSnapshot() {
    return Object.fromEntries([...this.actorAnimations].map(([actor, animation]) => {
      const localTime = Math.max(0, Math.min(
        animation.duration,
        this.time - animation.startedAt,
      ));
      return [actor, {
        ...animation,
        localTime,
        progress: animation.duration === 0 ? 1 : localTime / animation.duration,
      }];
    }));
  }

  bindSystems() {
    const dialogue = new Dialogue({
      scripts: this.chapter.dialogues,
      save: this.save,
      emit: (type, payload) => {
        if (type === 'dialogue.closed') {
          this.emit(type, payload);
          this.handleDialogueClosed(payload, dialogue);
          return true;
        }
        if (type === 'dialogue.lineChanged' || type === 'dialogue.choicesChanged') {
          if (!this.persistDialogueCursor(dialogue)) return false;
        }
        this.emit(type, payload);
        return true;
      },
      runActions: (actions) => this.runActions(actions),
    });
    this.dialogue = dialogue;
    this.learning = new Learning({
      beats: this.chapter.learningBeats,
      save: this.save,
      emit: (type, payload) => this.emit(type, payload),
      onComplete: (beat) => this.completeLearningBeat(beat),
    });
    this.spellbook = new Spellbook({
      spells: SPELLS,
      save: this.save,
      emit: (type, payload) => this.emit(type, payload),
      onCast: ({ spell, target }) => this.performSpellCast(spell, target),
      now: () => this.time,
    });
    this.quests = new Quests({
      quests: mainFirstQuests(this.chapter.quests),
      save: this.save,
      emit: (type, payload) => {
        if (type === 'quest.objectiveChanged') {
          this.objectiveEmphasisUntil = this.time + OBJECTIVE.emphasisSeconds;
        }
        this.emit(type, payload);
      },
      claimReceipt: (receipt) => this.claimQuestReceipt(receipt),
      runActions: (actions) => this.runActions(actions),
      lifecycleBlocked: () => this.blocked,
      commitTransition: (receipt, actions) => this.commitQuestTransition(receipt, actions),
      durableLifecycle: this.chapter.contractVersion === 2,
    });
    const chapterId = this.chapter.id;
    this.setPieces = new SetPieces({
      descriptors: this.chapter.setPieces,
      emit: (type, payload) => {
        if (type === 'actor.animationRequested') this.startActorAnimation(payload);
        if (type === 'setPiece.completed') this.clearActorAnimations(payload.id);
        this.emit(type, payload);
      },
      runActions: (actions) => this.runActions(actions),
      reducedMotion: Boolean(this.save.settings?.reducedMotion),
      hasReceipt: (id) => this.hasStoryReceipt(setPieceReceiptId(chapterId, id)),
      recordReceipt: (id) => (
        Array.isArray(this.save.progress?.storyReceipts)
          ? this.claimStoryReceipt(setPieceReceiptId(chapterId, id), 'set-piece-receipt')
          : true
      ),
      selectFallback: this.selectSetPieceFallback,
    });
  }

  updateAffordanceActivations() {
    const targets = this.targets();
    const { states } = createAffordancePlan({
      targets,
      objective: this.objective,
      activeQuest: this.activeQuest(),
      roomId: this.roomId,
      save: this.save,
      hintEscalated: this.hintLookShown || this.hintTrailShown,
    });
    this.glintActivations.advance(states, this.time, this.roomId, {
      quiet: this.worldAffordancesSuppressed,
    });
  }

  restoreDialogueCursor(cursor) {
    if (!cursor || this.sceneState.scene?.id !== this.currentSceneId) return false;
    if (!this.dialogue.isCursorRestorable(cursor)) return false;

    // The saved page is already the result of every automatic action which
    // preceded it. Re-entering the scene would replay those hidden actions or
    // start a second set piece alongside the restored page.
    this.restoreDialogueSourceTarget(cursor.script);
    if (this.dialogue.openAtCursor(cursor) === false) return 'retry';
    return this.dialogue.active;
  }

  enterPendingScene() {
    const cursor = this.pendingDialogueCursor;
    const restored = cursor ? this.restoreDialogueCursor(cursor) : false;
    if (restored === 'retry') {
      this.sceneEntryPending = true;
      return false;
    }
    const entered = restored || this.syncScene(true);
    if (!entered) {
      this.sceneEntryPending = true;
      return false;
    }
    this.pendingDialogueCursor = null;
    this.sceneEntryPending = false;
    return true;
  }

  restoreDialogueSourceTarget(script) {
    const sources = this.targets().filter((target) => target.actions?.some(
      (action) => action.type === 'dialogue.start' && action.script === script,
    ));
    if (sources.length !== 1) return;
    const [source] = sources;
    this.dialogueSourceTarget = {
      targetId: source.id,
      script,
      repeat: source.repeat,
      advertisementReceipt: source.advertisementReceipt,
    };
  }

  persistDialogueCursor(dialogue = this.dialogue) {
    const cursor = dialogue.cursor;
    if (this.save.schemaVersion < 3 || !cursor) return true;
    if (
      this.save.resume.dialogue?.script === cursor.script
      && this.save.resume.dialogue?.node === cursor.node
    ) return true;

    const previous = structuredClone(this.save);
    const candidate = structuredClone(this.save);
    candidate.resume.dialogue = { ...cursor };
    const previousQuestReceipts = candidate.progress?.questReceipts?.length ?? 0;
    const lifecycleActions = settleQuestLifecycleCandidate(this.chapter, candidate);
    const paths = ['resume.dialogue'];
    if ((candidate.progress?.questReceipts?.length ?? 0) !== previousQuestReceipts) {
      paths.push('progress.questReceipts');
    }
    paths.push(...lifecycleActions.flatMap(questLifecycleActionPaths));
    candidate.updatedAt = this.clock();
    let persisted;
    if (this.persistenceSuppression > 0) {
      persisted = { ok: true, status: 'suppressed', save: candidate };
      this.emit('save.persistenceSuppressed', { reason: 'dialogue-cursor' });
    } else {
      persisted = this.onDirty({
        reason: 'dialogue-cursor',
        flush: true,
        save: candidate,
        rollbackSave: previous,
      });
      this.emit('save.flushRequested', { reason: 'dialogue-cursor' });
    }
    if (persisted?.ok === false) return false;

    replaceObjectContents(this.save, persisted?.save ?? candidate);
    this.emit('state.changed', {
      paths: [...new Set(paths)],
      reason: 'dialogue-cursor',
    });
    this.emitLifecycleRewards(lifecycleActions);
    return true;
  }

  hasStoryReceipt(receipt) {
    return Array.isArray(this.save.progress?.storyReceipts)
      && this.save.progress.storyReceipts.includes(receipt);
  }

  claimStoryReceipt(receipt, reason = 'story-receipt') {
    if (!Array.isArray(this.save.progress?.storyReceipts) || this.hasStoryReceipt(receipt)) {
      return false;
    }
    const rollbackSave = structuredClone(this.save);
    this.save.progress.storyReceipts.push(receipt);
    const persisted = this.markDirty(reason, true, { rollbackSave });
    if (persisted?.ok === false) {
      replaceObjectContents(this.save, rollbackSave);
      return false;
    }
    this.emit('state.changed', { paths: ['progress.storyReceipts'], reason });
    return true;
  }

  claimQuestReceipt(receipt) {
    const receipts = this.save.progress?.questReceipts;
    if (!Array.isArray(receipts) || receipts.includes(receipt)) return false;
    const rollbackSave = structuredClone(this.save);
    receipts.push(receipt);
    const persisted = this.markDirty('quest-receipt', true, { rollbackSave });
    if (persisted?.ok === false) {
      receipts.pop();
      return false;
    }
    this.emit('state.changed', { paths: ['progress.questReceipts'], reason: 'quest-receipt' });
    return true;
  }

  commitQuestTransition(receipt, actions) {
    const receipts = this.save.progress?.questReceipts;
    if (!Array.isArray(receipts) || receipts.includes(receipt)) return false;

    const previous = structuredClone(this.save);
    const candidate = structuredClone(this.save);
    candidate.progress.questReceipts.push(receipt);
    for (const action of actions) applyCandidateLifecycleAction(candidate, action);
    candidate.updatedAt = this.clock();

    let persisted;
    if (this.persistenceSuppression > 0) {
      persisted = { ok: true, status: 'suppressed', save: candidate };
      this.emit('save.persistenceSuppressed', { reason: 'quest-transition' });
    } else {
      persisted = this.onDirty({
        reason: 'quest-transition',
        flush: true,
        save: candidate,
        rollbackSave: previous,
      });
      this.emit('save.flushRequested', { reason: 'quest-transition' });
    }
    if (persisted?.ok === false) return false;

    replaceObjectContents(this.save, persisted?.save ?? candidate);
    this.noteProgress();
    const paths = [...new Set([
      'progress.questReceipts',
      ...actions.flatMap(questLifecycleActionPaths),
    ])];
    this.emit('state.changed', { paths, reason: 'quest-transition' });
    this.emitLifecycleRewards(actions);
    return true;
  }

  terminalDialogueReceiptsForCompletion(candidate) {
    if (!Array.isArray(candidate.progress?.storyReceipts)) return [];
    const receipts = new Set();
    if (this.dialogue.active && this.dialogue.script?.replayable === false) {
      receipts.add(this.dialogue.scriptId);
    }
    for (const [script, requestedSetPieceId] of this.deferredDialogueReceipts) {
      const setPieceReceipt = setPieceReceiptId(this.chapter.id, requestedSetPieceId);
      if (candidate.progress.storyReceipts.includes(setPieceReceipt)) receipts.add(script);
    }
    for (const receipt of receipts) {
      if (!candidate.progress.storyReceipts.includes(receipt)) {
        candidate.progress.storyReceipts.push(receipt);
      }
    }
    return [...receipts];
  }

  addDeferredDialogueReceiptsForSetPiece(setPieceId) {
    if (!setPieceId || !Array.isArray(this.save.progress?.storyReceipts)) return [];
    const added = [];
    for (const [script, deferredSetPieceId] of this.deferredDialogueReceipts) {
      if (deferredSetPieceId !== setPieceId || this.hasStoryReceipt(script)) continue;
      this.save.progress.storyReceipts.push(script);
      added.push(script);
    }
    return added;
  }

  emitLifecycleRewards(actions) {
    for (const action of actions) {
      if (action.type === 'collection.add') {
        this.emit('reward.granted', { collection: action.collection, id: action.id });
      } else if (action.type === 'reward.grant') {
        this.emit('reward.granted', { receipt: action.receipt });
      }
    }
  }

  commitDialogueCompletion(script, sourceDialogue, {
    consume = false,
    reopenOnFailure = true,
  } = {}) {
    const previous = structuredClone(this.save);
    const candidate = structuredClone(this.save);
    const paths = [];
    if (candidate.schemaVersion >= 3 && candidate.resume.dialogue?.script === script) {
      candidate.resume.dialogue = null;
      paths.push('resume.dialogue');
    }
    if (
      consume
      && Array.isArray(candidate.progress?.storyReceipts)
      && !candidate.progress.storyReceipts.includes(script)
    ) {
      candidate.progress.storyReceipts.push(script);
      paths.push('progress.storyReceipts');
    }
    if (
      consume
      && candidate.progress?.storyReceipts?.includes(script)
      && candidate.resume?.dialogue?.script !== script
      && paths.length === 0
    ) {
      this.deferredDialogueReceipts.delete(script);
      return true;
    }
    const previousQuestReceipts = candidate.progress?.questReceipts?.length ?? 0;
    const lifecycleActions = settleQuestLifecycleCandidate(this.chapter, candidate);
    if ((candidate.progress?.questReceipts?.length ?? 0) !== previousQuestReceipts) {
      paths.push('progress.questReceipts');
    }
    paths.push(...lifecycleActions.flatMap(questLifecycleActionPaths));
    if (paths.length === 0) {
      if (this.hasStoryReceipt(script)) this.deferredDialogueReceipts.delete(script);
      return true;
    }

    candidate.updatedAt = this.clock();
    let persisted;
    if (this.persistenceSuppression > 0) {
      persisted = { ok: true, status: 'suppressed', save: candidate };
      this.emit('save.persistenceSuppressed', { reason: 'dialogue-completion' });
    } else {
      persisted = this.onDirty({
        reason: 'dialogue-completion',
        flush: true,
        save: candidate,
        rollbackSave: previous,
      });
      this.emit('save.flushRequested', { reason: 'dialogue-completion' });
    }
    if (persisted?.ok === false) {
      if (reopenOnFailure) this.reopenDialogueCursor(sourceDialogue, previous.resume?.dialogue);
      return false;
    }

    replaceObjectContents(this.save, persisted?.save ?? candidate);
    this.deferredDialogueReceipts.delete(script);
    this.emit('state.changed', {
      paths: [...new Set(paths)],
      reason: 'dialogue-completion',
    });
    this.emitLifecycleRewards(lifecycleActions);
    return true;
  }

  reopenDialogueCursor(dialogue, cursor) {
    if (!cursor || dialogue.active || !dialogue.isCursorRestorable(cursor)) return false;
    dialogue.openAtCursor(cursor);
    return dialogue.active;
  }

  handleDialogueClosed({ script, reason } = {}, sourceDialogue = this.dialogue) {
    const source = this.dialogueSourceTarget;
    this.dialogueSourceTarget = null;
    const consume = reason === 'completed'
      && sourceDialogue.scripts[script]?.replayable === false;
    if (consume) {
      const finalize = () => this.commitDialogueCompletion(
        script,
        sourceDialogue,
        { consume: true, reopenOnFailure: false },
      );
      const requestedSetPieceId = this.setPieces.active?.requestedId;
      if (requestedSetPieceId && this.setPieces.deferCompletion(finalize)) {
        this.deferredDialogueReceipts.set(script, requestedSetPieceId);
      } else {
        this.commitDialogueCompletion(script, sourceDialogue, { consume: true });
      }
    } else {
      this.commitDialogueCompletion(script, sourceDialogue);
    }
    if (
      reason === 'completed'
      && source?.script === script
      && source.repeat === 'always'
      && source.advertisementReceipt
      && this.save.progress.storyChoices[source.advertisementReceipt] !== true
    ) {
      this.save.progress.storyChoices[source.advertisementReceipt] = true;
      this.markDirty('affordance-spent');
      this.emit('state.changed', {
        paths: [`progress.storyChoices.${source.advertisementReceipt}`],
        reason: 'affordance-spent',
      });
    }
    if (
      reason === 'completed'
      && ['ch1.guide.arrival', 'ch1.guide.leaky'].includes(script)
    ) this.startGuideWalkCue();
    this.updateAffordanceActivations();
  }

  startGuideWalkCue({ restart = false } = {}) {
    const cue = resolveGuideWalkCue({
      chapterId: this.chapter.id,
      roomId: this.roomId,
      flags: this.flags,
    });
    if (!cue) {
      this.guideWalkCue = null;
      return false;
    }
    if (this.guideWalkCue?.cueId === cue.id && !restart) return false;
    this.guideWalkCue = {
      cueId: cue.id,
      startedAt: this.time,
      playerStart: { x: this.player.x, y: this.player.y },
    };
    return true;
  }

  guideWalkCueSnapshot() {
    const cue = resolveGuideWalkCue({
      chapterId: this.chapter.id,
      roomId: this.roomId,
      flags: this.flags,
    });
    if (!this.guideWalkCue || !cue || this.guideWalkCue.cueId !== cue.id) return null;
    return createGuideWalkCueSnapshot({
      time: this.time,
      startedAt: this.guideWalkCue.startedAt,
      playerStart: this.guideWalkCue.playerStart,
      reducedMotion: Boolean(this.save.settings?.reducedMotion),
      cue,
    });
  }

  syncScene(force = false, { persist = true, runOnEnter = true } = {}) {
    return this.runActionTransaction(() => {
      const candidate = this.sceneState.scene;
      if (!candidate || (!force && candidate.id === this.currentSceneId)) return true;
      this.currentSceneId = candidate.id;
      this.save.resume = resumeForSave(this.save, {
        chapter: this.chapter.id,
        scene: candidate.id,
        room: this.roomId,
        spawn: candidate.resumeAt?.spawn ?? candidate.spawn,
      });
      if (runOnEnter && actionResultFailed(this.runActions(candidate.onEnter ?? []))) return false;
      if (persist && actionResultFailed(this.markDirty('scene', true))) return false;
      return true;
    });
  }

  roomEffectsSnapshot(learning = this.learning.snapshot()) {
    const darkness = this.room.lighting?.darkness;
    const persistedLights = (this.room.hotspots ?? [])
      .filter((hotspot) => (
        hotspot.spellEffect?.kind === 'light'
        && (hotspot.when?.noFlags ?? []).some((flag) => Boolean(this.flags[flag]))
      ))
      .map((hotspot) => {
        const center = hitAreaCenter(hotspot.hitArea);
        return {
          roomId: this.roomId,
          targetId: hotspot.id,
          x: center.x,
          y: center.y,
          ...hotspot.spellEffect,
        };
      });
    const runtimeLights = [...this.revealedSpellTargets.values()]
      .filter((light) => light.roomId === this.roomId && light.kind === 'light');
    const lightsByTarget = new Map(
      [...persistedLights, ...runtimeLights].map((light) => [light.targetId, light]),
    );
    const lights = [...lightsByTarget.values()]
      .map((light) => Object.freeze({
        targetId: light.targetId,
        x: light.x,
        y: light.y,
        radius: light.radius,
        intensity: light.intensity,
      }));
    const lightMask = Number.isFinite(darkness) && darkness > 0
      ? Object.freeze({
        darkness: clamp(darkness, 0, 1),
        lights: Object.freeze(lights),
        revealedTargetIds: Object.freeze(lights.map((light) => light.targetId)),
      })
      : null;
    const feather = learning?.kind === 'sequence'
      ? Object.freeze({
        lift: learning.featherLift,
        stage: featherStage(learning.featherLift),
      })
      : null;
    return Object.freeze({ lightMask, feather });
  }

  questJournalSnapshot() {
    return createQuestJournalSnapshot(this.chapter.quests, this.save);
  }

  conditionStateSnapshot() {
    return {
      progress: { questFlags: structuredClone(this.save.progress.questFlags) },
      character: structuredClone(this.save.character),
      spellbook: { known: [...this.save.spellbook.known] },
      settings: { learning: this.save.settings.learning },
    };
  }

  snapshot() {
    const tapToWalkCue = this.guideWalkCueSnapshot();
    const baseOccupants = (this.room.occupants ?? [])
      .filter((occupant) => conditionMatches(occupant.when, this.save));
    const occupants = applyGuideWalkCueToOccupants(baseOccupants, tapToWalkCue);
    const baseTargets = this.targets();
    const playerActorId = this.playerActorId;
    const petActorId = this.petActorId;
    const petDefinition = petActorId ? requireNpcDefinition(this.chapter, petActorId) : null;
    const petController = petDefinition ? requireFollowController(petDefinition, petActorId) : null;
    const basePet = petDefinition ? {
      ...this.save.character.pet,
      ...petHomePosition(this.player, this.room),
      facing: this.player.facing,
      pose: this.player.walking ? petController.poseMap.moving : petDefinition.defaultPose,
    } : null;
    const activationState = this.glintActivations.snapshot(this.time);
    const affordances = createAffordanceSnapshot({
      targets: baseTargets,
      objective: this.objective,
      activeQuest: this.activeQuest(),
      roomId: this.roomId,
      save: this.save,
      time: this.time,
      quiet: this.affordanceRenderQuiet,
      worldSuppressed: this.worldAffordancesSuppressed,
      hintEscalated: this.hintLookShown || this.hintTrailShown,
      hasPet: Boolean(basePet),
      reducedMotion: Boolean(this.save.settings?.reducedMotion),
      scheduledGlint: activationState.active,
      glintActivationHistory: activationState.history,
    });
    const hintedPet = applyPetHint(
      basePet,
      affordances.petHint,
      this.room,
      petController?.poseMap,
    );
    const pet = applyFacingLook(hintedPet, petController?.facingLookMagnitude);
    const actorAnimations = this.actorAnimationSnapshot();
    const actors = createActorSnapshots({
      chapter: this.chapter,
      player: this.player,
      occupants,
      pet,
      actorAnimations,
      playerActorId,
      petActorId,
    });
    const learning = this.learning.snapshot();
    const spellbook = this.spellbook.snapshot(baseTargets);
    const journal = this.questJournalSnapshot();
    const roomEffects = this.roomEffectsSnapshot(learning);
    return {
      time: this.time,
      chapterId: this.chapter.id,
      sceneId: this.currentSceneId,
      roomId: this.roomId,
      keyLight: this.room.background?.keyLight ?? 'left',
      roomVariant: this.sceneState.roomVariant,
      cameraX: this.cameraX,
      player: { ...this.player },
      actorAnimations,
      actors,
      pet,
      occupants,
      tapToWalkCue,
      targets: affordances.targets,
      affordances,
      pendingInteraction: this.pendingInteraction ? {
        targetId: this.pendingInteraction.targetId,
        kind: this.pendingInteraction.kind,
        approach: { ...this.pendingInteraction.approach },
      } : null,
      objective: this.objective,
      dialogue: this.dialoguePresentation,
      setPiece: this.setPieces.active,
      overlay: this.overlay,
      selection: this.selection,
      spellbook,
      learning,
      journal,
      roomEffects,
      hasSatchel: Boolean(this.flags['ch1.satchelReceived']),
      hasWand: Boolean(this.save.character.wandId),
      hasSpellbook: spellbook.known.length > 0 || spellbook.state !== 'closed',
      cards: [...this.save.collections.cards],
      storyChoices: structuredClone(this.save.progress.storyChoices),
      questFlags: structuredClone(this.save.progress.questFlags),
      knownSpells: [...this.save.spellbook.known],
      learningMode: this.save.settings.learning,
      conditionState: this.conditionStateSnapshot(),
      house: this.save.character.house,
      unlockedRooms: this.unlockedRooms(),
      objectiveRoom: this.objective?.mapStar?.room ?? null,
      newObjective: Boolean(this.objective) && this.time < this.objectiveEmphasisUntil,
      screen: 'playing',
    };
  }

  unlockedRooms() {
    const unlocked = [];
    if (this.flags['ch1.mapUsed'] || this.flags['ch1.satchelReceived']) unlocked.push('ch1.ollivanders');
    if (this.flags['ch1.wandChosen']) unlocked.push('ch1.malkins');
    if (this.flags['ch1.trimChosen']) unlocked.push('ch1.menagerie');
    return unlocked;
  }
}

function createWorldActionHandlers(world) {
  return Object.freeze({
    'flag.set': (action) => world.setFlag(action.flag, action.value),
    'choice.record': (action) => {
      world.noteProgress();
      world.save.progress.storyChoices[action.id] = action.value;
      return world.markDirty('choice');
    },
    'character.set': (action) => {
      world.noteProgress();
      if (action.field === 'pet.type') {
        world.pendingPetType = action.value;
        world.emit('state.changed', { paths: ['character.pet.type'], reason: 'pending-choice' });
        return true;
      }
      if (action.field === 'pet.name') {
        world.save.character.pet = {
          type: world.pendingPetType ?? world.save.character.pet?.type,
          name: action.value,
        };
        world.pendingPetType = null;
      } else {
        writePath(world.save.character, action.field, action.value);
      }
      world.syncPlayerProfile();
      return world.markDirty('character');
    },
    'dialogue.start': (action) => {
      if (world.dialogueSourceTarget?.script !== action.script) world.dialogueSourceTarget = null;
      const presentation = world.dialogue.open(action.script);
      if (!presentation && !world.dialogue.active) world.dialogueSourceTarget = null;
      return presentation;
    },
    'setPiece.play': (action) => world.setPieces.start(action.id),
    'travel.request': (action) => world.travel(action.room, action.spawn, action.transition),
    'learning.start': (action) => world.startLearning(action.id),
    'spell.learn': (action) => {
      if (world.save.spellbook.known.includes(action.spell)) return true;
      world.noteProgress();
      world.save.spellbook.known.push(action.spell);
      world.save.spellbook.stats[action.spell] = { casts: 0, masteryTier: 0 };
      const persisted = world.markDirty('spell-learned', true);
      if (actionResultFailed(persisted)) return false;
      world.emit('state.changed', { paths: ['spellbook.known', `spellbook.stats.${action.spell}`], reason: 'spell-learned' });
      return true;
    },
    'collection.add': (action) => world.addCollection(action.collection, action.id),
    'reward.grant': (action) => world.grantReward(action),
    'ui.open': (action) => {
      world.overlay = { surface: action.surface, tab: action.tab ?? null };
      if (action.surface === 'robe-picker') {
        world.overlay.selectedTrim = normalizeRobeTrim(world.save.character.appearance?.robeTrim);
      }
      world.emit('ui.openRequested', world.overlay);
      return true;
    },
    'yearbook.capture': (action) => {
      world.emit('yearbook.captureRequested', { moment: action.moment, caption: 'Magic!' });
    },
    'chapter.complete': (action) => world.completeChapter(action.chapter, action.nextChapter),
    'audio.command': (action) => {
      const { type, ...payload } = action;
      world.emit(type, payload);
      return true;
    },
  });
}

function actionResultFailed(result) {
  return result === false || result?.ok === false;
}

function createActionBatchTransaction(world) {
  return {
    save: structuredClone(world.save),
    eventLength: world.events.length,
    seq: world.seq,
    chapter: world.chapter,
    roomId: world.roomId,
    currentSceneId: world.currentSceneId,
    player: structuredClone(world.player),
    cameraX: world.cameraX,
    overlay: structuredClone(world.overlay),
    selection: structuredClone(world.selection),
    pendingInteraction: structuredClone(world.pendingInteraction),
    pendingPetType: world.pendingPetType,
    objectiveEmphasisUntil: world.objectiveEmphasisUntil,
    idleTime: world.idleTime,
    failedAttempts: world.failedAttempts,
    hintObjective: structuredClone(world.hintObjective),
    hintLookShown: world.hintLookShown,
    hintVoiceRepeated: world.hintVoiceRepeated,
    hintTrailShown: world.hintTrailShown,
    hintAssistTriggered: world.hintAssistTriggered,
    dialogueSourceTarget: structuredClone(world.dialogueSourceTarget),
    guideWalkCue: structuredClone(world.guideWalkCue),
    actorAnimations: structuredClone(world.actorAnimations),
    deferredDialogueReceipts: structuredClone(world.deferredDialogueReceipts),
    persistenceSuppression: world.persistenceSuppression,
    sceneEntryPending: world.sceneEntryPending,
    pendingDialogueCursor: structuredClone(world.pendingDialogueCursor),
    revealedSpellTargets: structuredClone(world.revealedSpellTargets),
    dialogue: captureDialogueController(world.dialogue),
    learning: { ref: world.learning, state: world.learning?.capture() ?? null },
    spellbook: { ref: world.spellbook, state: world.spellbook?.capture() ?? null },
    quests: captureQuestController(world.quests),
    setPieces: captureSetPieceController(world.setPieces),
    glints: captureGlintLedger(world.glintActivations),
  };
}

function restoreActionBatchRuntime(world, transaction) {
  world.chapter = transaction.chapter;
  world.roomId = transaction.roomId;
  world.currentSceneId = transaction.currentSceneId;
  world.player = structuredClone(transaction.player);
  world.cameraX = transaction.cameraX;
  world.overlay = structuredClone(transaction.overlay);
  world.selection = structuredClone(transaction.selection);
  world.pendingInteraction = structuredClone(transaction.pendingInteraction);
  world.pendingPetType = transaction.pendingPetType;
  world.objectiveEmphasisUntil = transaction.objectiveEmphasisUntil;
  world.idleTime = transaction.idleTime;
  world.failedAttempts = transaction.failedAttempts;
  world.hintObjective = structuredClone(transaction.hintObjective);
  world.hintLookShown = transaction.hintLookShown;
  world.hintVoiceRepeated = transaction.hintVoiceRepeated;
  world.hintTrailShown = transaction.hintTrailShown;
  world.hintAssistTriggered = transaction.hintAssistTriggered;
  world.dialogueSourceTarget = structuredClone(transaction.dialogueSourceTarget);
  world.guideWalkCue = structuredClone(transaction.guideWalkCue);
  world.actorAnimations = structuredClone(transaction.actorAnimations);
  world.deferredDialogueReceipts = structuredClone(transaction.deferredDialogueReceipts);
  world.persistenceSuppression = transaction.persistenceSuppression;
  world.sceneEntryPending = transaction.sceneEntryPending;
  world.pendingDialogueCursor = structuredClone(transaction.pendingDialogueCursor);
  world.revealedSpellTargets = structuredClone(transaction.revealedSpellTargets);
  restoreDialogueController(world, transaction.dialogue);
  world.learning = transaction.learning.ref;
  world.learning?.restore(transaction.learning.state);
  world.spellbook = transaction.spellbook.ref;
  world.spellbook?.restore(transaction.spellbook.state);
  restoreQuestController(world, transaction.quests);
  restoreSetPieceController(world, transaction.setPieces);
  restoreGlintLedger(world, transaction.glints);
  world.events.length = transaction.eventLength;
  world.seq = transaction.seq;
}

function captureDialogueController(dialogue) {
  return {
    ref: dialogue,
    scriptId: dialogue?.scriptId ?? null,
    nodeId: dialogue?.nodeId ?? null,
    history: [...(dialogue?.history ?? [])],
  };
}

function restoreDialogueController(world, snapshot) {
  world.dialogue = snapshot.ref;
  if (!snapshot.ref) return;
  snapshot.ref.scriptId = snapshot.scriptId;
  snapshot.ref.nodeId = snapshot.nodeId;
  snapshot.ref.history = [...snapshot.history];
}

function captureQuestController(quests) {
  return {
    ref: quests,
    lastObjectiveKey: quests?.lastObjectiveKey ?? null,
    silentAdoptions: quests?.silentAdoptions === null
      ? null
      : new Set(quests?.silentAdoptions ?? []),
    settling: quests?.settling ?? false,
    lastSettlementStatus: quests?.lastSettlementStatus ?? 'idle',
  };
}

function restoreQuestController(world, snapshot) {
  world.quests = snapshot.ref;
  if (!snapshot.ref) return;
  snapshot.ref.lastObjectiveKey = snapshot.lastObjectiveKey;
  snapshot.ref.silentAdoptions = snapshot.silentAdoptions === null
    ? null
    : new Set(snapshot.silentAdoptions);
  snapshot.ref.settling = snapshot.settling;
  snapshot.ref.lastSettlementStatus = snapshot.lastSettlementStatus;
}

function captureSetPieceController(setPieces) {
  return {
    ref: setPieces,
    active: setPieces?.active ?? null,
    pendingCompletion: setPieces?.pendingCompletion ?? null,
    completingId: setPieces?.completingId ?? null,
  };
}

function restoreSetPieceController(world, snapshot) {
  world.setPieces = snapshot.ref;
  if (!snapshot.ref) return;
  snapshot.ref.active = snapshot.active;
  snapshot.ref.pendingCompletion = snapshot.pendingCompletion;
  snapshot.ref.completingId = snapshot.completingId;
}

function captureGlintLedger(ledger) {
  return {
    ref: ledger,
    limit: ledger.limit,
    windowSeconds: ledger.windowSeconds,
    history: structuredClone(ledger.history),
    seenScheduleKeys: new Set(ledger.seenScheduleKeys),
    active: structuredClone(ledger.active),
    lastTime: ledger.lastTime,
  };
}

function restoreGlintLedger(world, snapshot) {
  world.glintActivations = snapshot.ref;
  snapshot.ref.limit = snapshot.limit;
  snapshot.ref.windowSeconds = snapshot.windowSeconds;
  snapshot.ref.history = structuredClone(snapshot.history);
  snapshot.ref.seenScheduleKeys = new Set(snapshot.seenScheduleKeys);
  snapshot.ref.active = structuredClone(snapshot.active);
  snapshot.ref.lastTime = snapshot.lastTime;
}

function requireNpcDefinition(chapter, actorId) {
  const definition = chapter?.npcs?.[actorId];
  if (!definition) {
    throw new Error(`Unknown actor ${actorId} in chapter ${chapter?.id ?? 'unknown'}.`);
  }
  if (typeof definition.characterId !== 'string') {
    throw new Error(`Actor ${actorId} in chapter ${chapter?.id ?? 'unknown'} has no canonical characterId.`);
  }
  return definition;
}

function requireActorIdByCharacter(chapter, characterId) {
  const matches = Object.values(chapter?.npcs ?? {}).filter((npc) => npc.characterId === characterId);
  if (matches.length !== 1) {
    throw new Error(
      `Chapter ${chapter?.id ?? 'unknown'} requires exactly one actor for ${characterId}; found ${matches.length}.`,
    );
  }
  return matches[0].id;
}

function requireFollowController(definition, actorId) {
  if (definition.controller?.kind !== 'follow' || !definition.controller.poseMap) {
    throw new Error(`Companion actor ${actorId} requires a follow controller with an explicit pose map.`);
  }
  return definition.controller;
}

function createActorSnapshot(chapter, actorId, renderState, depth = renderState.y) {
  const definition = requireNpcDefinition(chapter, actorId);
  return {
    actorId,
    characterId: definition.characterId,
    depth,
    renderState: {
      ...renderState,
      pose: renderState.pose ?? definition.defaultPose,
    },
  };
}

function actorPositionMap(player, occupants, pet, playerActorId, petActorId) {
  const positions = new Map(occupants.map((occupant) => [occupant.npc, occupant]));
  positions.set(playerActorId, player);
  if (pet && petActorId) positions.set(petActorId, pet);
  return positions;
}

function resolveActorLookAt(occupant, lookAt, positions) {
  if (!lookAt) return {};
  const target = positions.get(lookAt.target);
  if (!target) return {};
  return {
    lookX: clamp(
      (target.x - occupant.x + (lookAt.offsetX ?? 0)) / lookAt.rangeX,
      -1,
      1,
    ),
    lookY: clamp(
      (target.y - occupant.y + (lookAt.offsetY ?? 0)) / lookAt.rangeY,
      -1,
      1,
    ),
  };
}

function occupantRenderState(occupant, positions) {
  const render = occupant.render ?? {};
  return {
    x: occupant.x + (render.offsetX ?? 0),
    y: occupant.y + (render.offsetY ?? 0),
    facing: occupant.facing,
    pose: occupant.pose,
    ...(render.scale !== undefined ? { scale: render.scale } : {}),
    ...(render.timeOffset !== undefined ? { timeOffset: render.timeOffset } : {}),
    ...(render.lookX !== undefined ? { lookX: render.lookX } : {}),
    ...(render.lookY !== undefined ? { lookY: render.lookY } : {}),
    ...(render.layoutBounds ? { layoutBounds: { ...render.layoutBounds } } : {}),
    ...resolveActorLookAt(occupant, render.lookAt, positions),
  };
}

function actorActionRenderState(animation) {
  if (!animation) return { action: null };
  return {
    action: animation.action,
    actionProgress: animation.progress,
    actionTime: animation.localTime,
  };
}

function createActorSnapshots({
  chapter,
  player,
  occupants,
  pet,
  actorAnimations,
  playerActorId,
  petActorId,
}) {
  const positions = actorPositionMap(player, occupants, pet, playerActorId, petActorId);
  const playerAnimation = actorAnimations[playerActorId] ?? null;
  const actors = occupants
    .filter((occupant) => occupant.npc !== playerActorId && occupant.npc !== petActorId)
    .map((occupant) => {
      const animation = actorAnimations[occupant.npc] ?? null;
      return createActorSnapshot(chapter, occupant.npc, {
        ...occupantRenderState(occupant, positions),
        ...actorActionRenderState(animation),
      }, occupant.y);
    });

  actors.push(createActorSnapshot(chapter, playerActorId, {
    x: player.x,
    y: player.y,
    scale: player.scale,
    facing: player.facing,
    wand: player.wand,
    robeTrim: player.robeTrim,
    appearance: player.outfit,
    ...(player.house ? { house: player.house } : {}),
    pose: player.walking ? 'walking' : 'idle',
    ...actorActionRenderState(playerAnimation),
  }));

  if (pet) {
    actors.push(createActorSnapshot(chapter, petActorId, {
      x: pet.x,
      y: pet.y,
      facing: pet.facing,
      pose: pet.pose,
      ...(pet.lookX !== undefined ? { lookX: pet.lookX } : {}),
      ...(pet.lookY !== undefined ? { lookY: pet.lookY } : {}),
      action: null,
    }, pet.y + 1));
  }

  actors.sort((left, right) => left.depth - right.depth);
  return actors;
}

function hitTest(point, hitArea) {
  if (!hitArea) return false;
  if (hitArea.shape === 'rect') {
    return point.x >= hitArea.x && point.x <= hitArea.x + hitArea.width && point.y >= hitArea.y && point.y <= hitArea.y + hitArea.height;
  }
  const radius = hitArea.radius ?? hitArea.r ?? 44;
  return Math.hypot(point.x - hitArea.x, point.y - hitArea.y) <= radius;
}

function hitAreaCenter(hitArea) {
  if (!hitArea) return { x: 0, y: 0 };
  if (hitArea.shape === 'rect') {
    return { x: hitArea.x + hitArea.width / 2, y: hitArea.y + hitArea.height / 2 };
  }
  return { x: hitArea.x, y: hitArea.y };
}

function activationDistance(target) {
  return target?.kind === 'exit' ? EXIT_ACTIVATION_DISTANCE : INTERACTION_ACTIVATION_DISTANCE;
}

function distanceToApproach(player, target) {
  const deltaX = player.x - target.approach.x;
  if (target?.kind !== 'exit') return Math.abs(deltaX);
  return Math.hypot(deltaX, player.y - target.approach.y);
}

function doorwayApproach(exit, room, player) {
  const center = hitAreaCenter(exit.hitArea);
  const band = room?.walkBand ?? { top: 560, bottom: 640 };
  const thresholdY = exit.hitArea.shape === 'rect'
    ? exit.hitArea.y + exit.hitArea.height
    : center.y + exit.hitArea.radius;
  const y = Math.max(band.top, Math.min(band.bottom, thresholdY));
  return {
    x: center.x,
    y,
    facing: center.x < player.x ? 'left' : 'right',
  };
}

function applyPetHint(pet, hint, room, poseMap) {
  if (!pet || !hint) return pet;
  const roomWidth = room?.size?.width ?? WORLD.width;
  const destinationX = Math.max(55, Math.min(roomWidth - 55, hint.x));
  const path = petHintPath(pet, destinationX, hint.approach, room);
  const outwardFacing = destinationX < pet.x ? 'left' : destinationX > pet.x ? 'right' : pet.facing;
  const facing = hint.stage === 'return'
    ? outwardFacing === 'left' ? 'right' : 'left'
    : outwardFacing;
  return {
    ...pet,
    ...path,
    facing,
    pose: hint.stage === 'wander' || hint.stage === 'return'
      ? poseMap.moving
      : hint.stage === 'paw'
        ? poseMap.hintAttention
        : poseMap.hintLook,
    secretHint: { ...hint },
  };
}

function applyFacingLook(pet, magnitude) {
  if (!pet || magnitude === undefined) return pet;
  return {
    ...pet,
    lookX: pet.facing === 'right' ? magnitude : -magnitude,
  };
}

function petHomePosition(player, room) {
  const roomWidth = room?.size?.width ?? WORLD.width;
  const trailingDirection = player.facing === 'right' ? -1 : 1;
  const trailingX = player.x + trailingDirection * PET_HOME_DISTANCE;
  const tooCloseToRoomEdge = trailingX < PET_EDGE_CLEARANCE || trailingX > roomWidth - PET_EDGE_CLEARANCE;
  const x = tooCloseToRoomEdge
    ? player.x - trailingDirection * PET_LEADING_DISTANCE
    : trailingX;
  return { x, y: player.y };
}

function petHintPath(pet, destinationX, approach, room) {
  const coordinate = Math.max(0, Math.min(1, approach));
  const horizontalProgress = smoothstepRange(
    coordinate,
    PET_HINT_CORRIDOR_END,
    1 - PET_HINT_CORRIDOR_END,
  );
  const enterCorridor = smoothstepRange(coordinate, 0, PET_HINT_CORRIDOR_END);
  const leaveCorridor = smoothstepRange(1 - coordinate, 0, PET_HINT_CORRIDOR_END);
  const roomHeight = room?.size?.height ?? WORLD.height;
  const corridorY = Math.min(
    roomHeight - PET_HINT_CORRIDOR_MARGIN,
    pet.y + PET_HINT_CORRIDOR_CLEARANCE,
  );
  return {
    x: pet.x + (destinationX - pet.x) * horizontalProgress,
    y: pet.y + (corridorY - pet.y) * enterCorridor * leaveCorridor,
  };
}

function learningSkillField(skill) {
  if (skill === 'letters' || skill === 'matching') return 'letterSkill';
  if (skill === 'counting') return 'countingSkill';
  return 'phonicsSkill';
}

function mainFirstQuests(quests = {}) {
  return Object.fromEntries(Object.entries(quests).sort(([, left], [, right]) => {
    if (left.kind === right.kind) return 0;
    return left.kind === 'main' ? -1 : 1;
  }));
}

function questIsSleeping(active, save) {
  if (!active || active.quest.kind !== 'side') return false;
  return (active.step.doneWhen?.knownSpells ?? []).some(
    (spellId) => !save.spellbook.known.includes(spellId),
  );
}

function questJournalEntry(quest, save) {
  if (!conditionMatches(quest.startWhen, save)) return null;
  const receipts = save.progress.questReceipts;
  const durable = Array.isArray(receipts);
  if (durable && receipts.includes(`${quest.id}.quest.v1.completed`)) {
    return Object.freeze({
      id: quest.id,
      kind: quest.kind,
      status: 'complete',
      caption: null,
      mapStar: null,
    });
  }

  let stepId = quest.startStep;
  const visited = new Set();
  while (stepId && !visited.has(stepId)) {
    visited.add(stepId);
    const step = quest.steps[stepId];
    if (!step) break;
    const complete = durable
      ? receipts.includes(`${quest.id}.quest.v1.step.${stepId}.completed`)
      : conditionMatches(step.doneWhen, save);
    if (!complete) {
      const active = { quest, step, stepId };
      return Object.freeze({
        id: quest.id,
        kind: quest.kind,
        status: questIsSleeping(active, save) ? 'sleeping' : 'active',
        caption: step.objective.caption,
        mapStar: step.objective.mapStar ? Object.freeze({ ...step.objective.mapStar }) : null,
      });
    }
    stepId = step.next;
  }
  return Object.freeze({
    id: quest.id,
    kind: quest.kind,
    status: 'complete',
    caption: null,
    mapStar: null,
  });
}

function createQuestJournalSnapshot(quests, save) {
  const entries = Object.values(mainFirstQuests(quests))
    .map((quest) => questJournalEntry(quest, save))
    .filter(Boolean);
  return Object.freeze({
    main: entries.find((entry) => entry.kind === 'main' && entry.status !== 'complete') ?? null,
    side: Object.freeze(entries.filter((entry) => entry.kind === 'side')),
  });
}

function featherStage(lift) {
  if (lift >= 1) return 'sail';
  if (lift >= 2 / 3) return 'rise';
  if (lift >= 1 / 3) return 'roll';
  if (lift > 0) return 'twitch';
  return 'rest';
}

function smoothstepRange(value, start, end) {
  if (end <= start) return value >= end ? 1 : 0;
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

function resolveSpawn(room, spawnId) {
  const spawns = room?.spawns ?? {};
  if (spawnId && spawns[spawnId]) return spawns[spawnId];
  if (spawnId) {
    const match = Object.entries(spawns).find(([key]) => key.endsWith(`.${spawnId}`));
    if (match) return match[1];
  }
  return Object.values(spawns)[0] ?? null;
}

function resumeForSave(save, resume) {
  return save?.schemaVersion >= 3
    ? { ...resume, dialogue: null }
    : { ...resume };
}

function setPieceReceiptId(chapterId, requestedId) {
  return requestedId.startsWith(`${chapterId}.`)
    ? requestedId
    : `${chapterId}.${requestedId}`;
}

function settleQuestLifecycleCandidate(chapter, save) {
  if (chapter.contractVersion !== 2 || !Array.isArray(save.progress?.questReceipts)) return [];
  const lifecycleActions = [];
  const lifecycle = new Quests({
    quests: mainFirstQuests(chapter.quests),
    save,
    claimReceipt: (receipt) => {
      if (save.progress.questReceipts.includes(receipt)) return false;
      save.progress.questReceipts.push(receipt);
      return true;
    },
    runActions: (actions) => {
      for (const action of actions) {
        applyCandidateLifecycleAction(save, action);
        lifecycleActions.push(action);
      }
      return true;
    },
    durableLifecycle: true,
  });
  lifecycle.initialize({ historical: false });
  lifecycle.update({ ignoreBlock: true });
  return lifecycleActions;
}

function applyCandidateLifecycleAction(save, action) {
  if (action.type === 'flag.set') {
    save.progress.questFlags[action.flag] = action.value;
    return;
  }
  if (action.type === 'choice.record') {
    save.progress.storyChoices[action.id] = structuredClone(action.value);
    return;
  }
  if (action.type === 'spell.learn') {
    if (!save.spellbook.known.includes(action.spell)) save.spellbook.known.push(action.spell);
    save.spellbook.stats[action.spell] ??= { casts: 0, masteryTier: 0 };
    return;
  }
  if (action.type === 'collection.add') {
    const collection = save.collections[action.collection];
    if (!collection.includes(action.id)) collection.push(action.id);
    return;
  }
  if (action.type === 'reward.grant') {
    if (save.progress.rewardReceipts.includes(action.receipt)) return;
    save.progress.rewardReceipts.push(action.receipt);
    for (const card of action.cards) {
      if (!save.collections.cards.includes(card)) save.collections.cards.push(card);
    }
    for (const treasure of action.treasures) {
      if (!save.collections.treasures.includes(treasure)) save.collections.treasures.push(treasure);
    }
    save.collections.housePoints += action.points;
    return;
  }
  throw new Error(`Unsupported quest lifecycle action in completion candidate: ${action.type}`);
}

function questLifecycleActionPaths(action) {
  if (action.type === 'flag.set') return [`progress.questFlags.${action.flag}`];
  if (action.type === 'choice.record') return [`progress.storyChoices.${action.id}`];
  if (action.type === 'spell.learn') {
    return ['spellbook.known', `spellbook.stats.${action.spell}`];
  }
  if (action.type === 'collection.add') return [`collections.${action.collection}`];
  if (action.type === 'reward.grant') {
    return [
      'progress.rewardReceipts',
      'collections.cards',
      'collections.treasures',
      'collections.housePoints',
    ];
  }
  return [];
}

function replaceObjectContents(target, source) {
  const replacement = structuredClone(source);
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, replacement);
  return target;
}
