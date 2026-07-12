import { HINTS, WORLD } from '../config.js';
import { conditionMatches, writePath } from '../core/conditions.js';
import { SeededRandom } from '../core/rng.js';
import { Dialogue } from '../systems/Dialogue.js';
import { Quests } from '../systems/Quests.js';
import { SetPieces } from '../systems/SetPieces.js';

export class World {
  constructor({ chapters, save, seed, clock = () => '2000-01-01T00:00:00.000Z', onDirty = () => {} }) {
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
    this.afterSetPieceActions = [];
    this.walkSpeed = 310;
    this.cameraX = 0;
    this.overlay = null;
    this.selection = null;
    this.pendingPetType = null;
    this.newObjective = true;

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
      facing: spawn.facing ?? 'right',
      walking: false,
      wand: Boolean(save.character?.wandId),
      robeTrim: trimColor(save.character?.appearance?.robeTrim),
    };

    this.currentSceneId = save.resume?.scene ?? this.chapter.start.scene;
    this.bindSystems();
    this.quests.update();
    this.syncScene(true);
  }

  get room() {
    return this.chapter.rooms[this.roomId];
  }

  get flags() {
    return this.save.progress.questFlags;
  }

  get dialoguePresentation() {
    const presentation = this.dialogue.presentation();
    if (!presentation?.speaker) return presentation;
    return {
      ...presentation,
      speakerLabel: this.chapter.npcs[presentation.speaker]?.displayName ?? presentation.speakerLabel ?? 'Friend',
    };
  }

  get objective() {
    return this.quests.objective();
  }

  get blocked() {
    return this.dialogue.active || Boolean(this.setPieces.active) || Boolean(this.overlay) || Boolean(this.selection);
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
    const hadSetPiece = Boolean(this.setPieces.active);
    this.setPieces.update(dt);
    if (hadSetPiece && !this.setPieces.active && this.afterSetPieceActions.length) {
      const deferred = this.afterSetPieceActions;
      this.afterSetPieceActions = [];
      this.runActions(deferred);
    }

    let pendingTarget = this.resolvePendingInteraction();
    if (this.pendingInteraction && (!pendingTarget || this.blocked)) {
      this.cancelPendingInteraction();
      pendingTarget = null;
    }

    const delta = this.player.targetX - this.player.x;
    if (Math.abs(delta) > 2) {
      const step = Math.sign(delta) * Math.min(Math.abs(delta), this.walkSpeed * dt);
      this.player.x += step;
      this.player.facing = step < 0 ? 'left' : 'right';
      this.player.walking = true;
    } else {
      this.player.x = this.player.targetX;
      this.player.walking = false;
    }

    if (
      pendingTarget
      && Math.abs(this.player.x - pendingTarget.approach.x) <= 45
    ) {
      this.activatePendingInteraction(pendingTarget);
    }

    const roomWidth = this.room.size?.width ?? WORLD.width;
    const desiredCamera = Math.max(0, Math.min(roomWidth - WORLD.width, this.player.x - WORLD.width / 2));
    this.cameraX += (desiredCamera - this.cameraX) * Math.min(1, dt * 6);
    this.quests.update();
    this.syncScene();
    this.updateHintLadder(dt);
  }

  tap(point) {
    if (this.setPieces.active) return { kind: 'blocked', reason: 'set-piece' };
    if (this.dialogue.active) return { kind: 'dialogue' };
    const worldPoint = { x: point.x + this.cameraX, y: point.y };
    const target = this.targets().find((candidate) => hitTest(worldPoint, candidate.hitArea));
    if (target) {
      this.interactTarget(target);
      return target;
    }
    const band = this.room.walkBand ?? { top: 560, bottom: 640 };
    this.player.targetX = Math.max(55, Math.min((this.room.size?.width ?? WORLD.width) - 55, worldPoint.x));
    this.player.y = Math.max(band.top, Math.min(band.bottom, worldPoint.y));
    this.cancelPendingInteraction({ stopWalking: false });
    this.recordFailedAttempt();
    this.emit('feedback.command', { kind: 'emptyTap', x: point.x, y: point.y });
    return { kind: 'walk', x: this.player.targetX };
  }

  interactSemantic(id) {
    const target = this.targets().find((candidate) => candidate.id === id || candidate.semanticId === id);
    if (!target) throw new Error(`No active interaction target named ${id} in ${this.roomId}.`);
    this.interactTarget(target);
  }

  interactTarget(target) {
    this.noteMeaningfulInput();
    const approach = target.approach;
    if (approach && Math.abs(this.player.x - approach.x) > 45) {
      this.player.targetX = approach.x;
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
    this.runActions(target.actions);
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
    this.player.facing = approach.facing;
    this.player.walking = false;
    this.runActions(target.actions);
    return true;
  }

  cancelPendingInteraction({ stopWalking = true } = {}) {
    if (!this.pendingInteraction) return false;
    this.pendingInteraction = null;
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
      targets.push({
        id: hotspot.id,
        semanticId: hotspot.semanticId,
        kind: hotspot.kind,
        hitArea: hotspot.hitArea,
        approach: hotspot.approach,
        presentation: hotspot.presentation,
        actions: hotspot.onInteract ?? [],
      });
    }
    for (const exit of this.room.exits ?? []) {
      if (!conditionMatches(exit.when, this.save)) continue;
      targets.push({
        id: exit.id,
        kind: 'exit',
        hitArea: exit.hitArea,
        approach: exit.approach,
        presentation: { icon: exit.icon ?? 'arrow', glow: 'interactionGold' },
        actions: [{ type: 'travel.request', room: exit.to.room, spawn: exit.to.spawn, transition: exit.transition }],
      });
    }
    for (const occupant of this.room.occupants ?? []) {
      if (!conditionMatches(occupant.when, this.save)) continue;
      if (occupant.npc === 'npc.violet' || occupant.npc.startsWith('npc.pet.')) continue;
      const npc = this.chapter.npcs[occupant.npc];
      if (!npc?.defaultTalk) continue;
      targets.push({
        id: `${this.roomId}.${occupant.npc}`,
        kind: 'talk',
        hitArea: { shape: 'circle', x: occupant.x, y: occupant.y - 85, radius: npc.hitRadius ?? 88 },
        approach: { x: occupant.x + (occupant.facing === 'left' ? -105 : 105), y: occupant.y, facing: occupant.facing === 'left' ? 'right' : 'left' },
        presentation: { icon: 'talk', glow: 'interactionGold' },
        actions: [{ type: 'dialogue.start', script: npc.defaultTalk }],
      });
    }
    return targets;
  }

  runActions(actions = []) {
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      this.runAction(action);
      if (action.type === 'setPiece.play' && this.setPieces.active) {
        this.afterSetPieceActions.push(...actions.slice(index + 1));
        return;
      }
    }
  }

  runAction(action) {
    switch (action.type) {
      case 'flag.set':
        this.setFlag(action.flag, action.value ?? true);
        break;
      case 'choice.record':
        this.noteProgress();
        this.save.progress.storyChoices[action.id] = action.value;
        this.markDirty('choice');
        break;
      case 'character.set':
        this.noteProgress();
        if (action.field === 'pet.type') {
          this.pendingPetType = action.value;
          this.emit('state.changed', { paths: ['character.pet.type'], reason: 'pending-choice' });
          break;
        }
        if (action.field === 'pet.name') {
          this.save.character.pet = {
            type: this.pendingPetType ?? this.save.character.pet?.type,
            name: action.value,
          };
          this.pendingPetType = null;
        } else {
          writePath(this.save.character, action.field, action.value);
        }
        this.syncPlayerProfile();
        this.markDirty('character');
        break;
      case 'pet.choose':
        this.noteProgress();
        this.save.character.pet = { type: action.pet, name: this.save.character.pet?.name ?? null };
        this.markDirty('pet');
        this.emit('selection.completed', { id: 'pet', value: action.pet });
        break;
      case 'pet.name':
        this.save.character.pet = { type: this.save.character.pet?.type, name: action.name };
        this.setFlag('ch1.petNamed', true);
        break;
      case 'dialogue.start':
        this.dialogue.open(action.script);
        break;
      case 'setPiece.play':
        this.setPieces.start(action.id, action.params);
        break;
      case 'travel.request':
        this.travel(action.room, action.spawn, action.transition);
        break;
      case 'collection.add':
        this.addCollection(action.collection, action.id);
        break;
      case 'reward.grant':
        this.grantReward(action);
        break;
      case 'ui.open':
        this.overlay = { surface: action.surface, tab: action.tab ?? null };
        this.emit('ui.openRequested', this.overlay);
        break;
      case 'ui.close':
        this.overlay = null;
        this.emit('ui.closeRequested', { surface: action.surface });
        break;
      case 'selection.open':
        this.selection = { id: action.id, title: action.title, subtitle: action.subtitle, options: action.options };
        this.emit('selection.opened', { id: action.id });
        break;
      case 'yearbook.capture':
        this.emit('yearbook.captureRequested', { moment: action.moment, caption: action.caption ?? 'Magic!' });
        break;
      case 'chapter.complete':
        this.completeChapter(action.chapter, action.nextChapter ?? 'ch2');
        break;
      case 'audio.command':
      case 'particles.emit':
      case 'camera.command':
      case 'feedback.command':
        this.emit(action.type, { ...action, type: undefined });
        break;
      default:
        this.emit('action.unhandled', { action });
        break;
    }
  }

  chooseSelection(optionId) {
    if (!this.selection) return false;
    const option = this.selection.options.find((candidate) => candidate.id === optionId);
    if (!option) return false;
    this.noteMeaningfulInput();
    this.selection = null;
    this.runActions(option.actions ?? []);
    return true;
  }

  setPetName(name) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 80) return false;
    if (!this.pendingPetType && !this.save.character.pet?.type) return false;
    this.noteMeaningfulInput();
    this.runAction({ type: 'character.set', field: 'pet.name', value: name.trim() });
    return true;
  }

  advanceDialogue(choiceId = null) {
    if (!this.dialogue.active) return null;
    if (this.dialogue.node?.type === 'choice' && !this.dialogue.node.choices.some((choice) => choice.id === choiceId)) {
      return this.dialogue.presentation();
    }
    this.noteMeaningfulInput();
    return this.dialogue.advance(choiceId);
  }

  closeOverlay() {
    if (!this.overlay) return;
    this.noteMeaningfulInput();
    this.overlay = null;
  }

  setFlag(flag, value = true) {
    if (this.flags[flag] === value) return;
    this.noteProgress();
    this.flags[flag] = value;
    this.markDirty('flag');
    this.emit('state.changed', { paths: [`progress.questFlags.${flag}`], reason: 'flag' });
    this.syncScene();
  }

  addCollection(collection, id) {
    const target = this.save.collections[collection];
    if (!Array.isArray(target) || target.includes(id)) return;
    this.noteProgress();
    target.push(id);
    this.markDirty('collection');
    this.emit('reward.granted', { collection, id });
  }

  grantReward(action) {
    if (this.save.progress.rewardReceipts.includes(action.receipt)) return;
    this.noteProgress();
    this.save.progress.rewardReceipts.push(action.receipt);
    for (const card of action.cards ?? []) this.addCollection('cards', card);
    for (const treasure of action.treasures ?? []) this.addCollection('treasures', treasure);
    this.save.collections.housePoints += action.points ?? 0;
    this.markDirty('reward');
    this.emit('reward.granted', { receipt: action.receipt });
  }

  travel(roomId, spawnId, transition = 'ink') {
    this.noteProgress();
    this.cancelPendingInteraction();
    const requestedChapter = roomId.split('.')[0];
    if (requestedChapter !== this.chapter.id && this.chapters[requestedChapter]) {
      this.changeChapter(requestedChapter, roomId, spawnId);
      return;
    }
    const room = this.chapter.rooms[roomId];
    if (!room) throw new Error(`Unknown room ${roomId} in chapter ${this.chapter.id}.`);
    const from = this.roomId;
    const spawn = resolveSpawn(room, spawnId);
    this.roomId = roomId;
    this.player.x = spawn?.x ?? 160;
    this.player.y = spawn?.y ?? 610;
    this.player.targetX = this.player.x;
    this.player.facing = spawn?.facing ?? 'right';
    this.cameraX = 0;
    this.save.resume = { chapter: this.chapter.id, scene: room.scene ?? roomId, room: roomId, spawn: spawnId };
    this.markDirty('scene-change', true);
    this.emit('room.transitionRequested', { from, to: roomId, spawn: spawnId, effect: transition });
    this.emit('room.entered', { room: roomId, spawn: spawnId });
    this.syncScene(true);
  }

  changeChapter(chapterId, roomId = null, spawnId = null) {
    const chapter = this.chapters[chapterId];
    if (!chapter) throw new Error(`Unknown chapter ${chapterId}.`);
    this.noteProgress();
    this.cancelPendingInteraction();
    const from = this.roomId;
    this.chapter = chapter;
    this.bindSystems();
    this.roomId = roomId && chapter.rooms[roomId] ? roomId : chapter.start.room;
    const room = chapter.rooms[this.roomId];
    const selectedSpawn = spawnId ?? chapter.start.spawn;
    const spawn = resolveSpawn(room, selectedSpawn);
    this.player.x = spawn?.x ?? 160;
    this.player.y = spawn?.y ?? 610;
    this.player.targetX = this.player.x;
    this.player.facing = spawn?.facing ?? 'right';
    this.cameraX = 0;
    this.currentSceneId = chapter.start.scene;
    this.save.resume = { chapter: chapter.id, scene: this.currentSceneId, room: this.roomId, spawn: selectedSpawn };
    this.markDirty('chapter-change', true);
    this.emit('room.transitionRequested', { from, to: this.roomId, spawn: selectedSpawn, effect: 'ink' });
    this.emit('room.entered', { room: this.roomId, spawn: selectedSpawn });
    this.syncScene(true);
  }

  completeChapter(chapterId, nextChapter) {
    this.noteProgress();
    if (!this.save.progress.completedChapters.includes(chapterId)) this.save.progress.completedChapters.push(chapterId);
    this.save.progress.highestUnlockedChapter = Math.max(this.save.progress.highestUnlockedChapter, Number(nextChapter.replace('ch', '')) || 2);
    this.setFlag(`${chapterId}.complete`, true);
    this.markDirty('chapter-complete', true);
    this.emit('chapter.completed', { chapter: chapterId, nextChapter });
  }

  markDirty(reason, flush = false) {
    this.save.updatedAt = this.clock();
    this.onDirty({ reason, flush, save: this.save });
    this.emit(flush ? 'save.flushRequested' : 'save.dirty', { reason });
  }

  noteMeaningfulInput() {
    this.resetHintLadder('input');
  }

  noteProgress() {
    this.resetHintLadder('progress');
  }

  recordFailedAttempt() {
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
    const active = this.quests.active();
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
    this.player.robeTrim = trimColor(this.save.character.appearance?.robeTrim);
  }

  bindSystems() {
    this.dialogue = new Dialogue({
      scripts: this.chapter.dialogues,
      save: this.save,
      emit: (type, payload) => this.emit(type, payload),
      runActions: (actions) => this.runActions(actions),
    });
    this.quests = new Quests({
      quests: this.chapter.quests,
      save: this.save,
      emit: (type, payload) => this.emit(type, payload),
    });
    this.setPieces = new SetPieces({
      descriptors: this.chapter.setPieces,
      emit: (type, payload) => this.emit(type, payload),
      runActions: (actions) => this.runActions(actions),
      reducedMotion: Boolean(this.save.settings?.reducedMotion),
    });
  }

  syncScene(force = false) {
    const scenes = Object.values(this.chapter.scenes ?? {});
    const candidate = scenes.find((scene) => scene.room === this.roomId && conditionMatches(scene.when, this.save));
    if (!candidate || (!force && candidate.id === this.currentSceneId)) return;
    this.currentSceneId = candidate.id;
    this.save.resume = {
      chapter: this.chapter.id,
      scene: candidate.id,
      room: this.roomId,
      spawn: candidate.resumeAt?.spawn ?? candidate.spawn,
    };
    this.runActions(candidate.onEnter ?? []);
    this.markDirty('scene', true);
  }

  snapshot() {
    return {
      time: this.time,
      chapterId: this.chapter.id,
      sceneId: this.currentSceneId,
      roomId: this.roomId,
      roomVariant: this.flags['ch1.petNamed'] ? 'dusk' : 'base',
      cameraX: this.cameraX,
      player: { ...this.player },
      pet: this.save.character.pet?.type ? {
        ...this.save.character.pet,
        x: this.player.x + (this.player.facing === 'right' ? -65 : 65),
        y: this.player.y,
      } : null,
      occupants: (this.room.occupants ?? []).filter((occupant) => conditionMatches(occupant.when, this.save)),
      targets: this.targets(),
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
      hasWand: Boolean(this.save.character.wandId),
      cards: [...this.save.collections.cards],
      unlockedRooms: this.unlockedRooms(),
      objectiveRoom: this.objective?.mapStar?.room ?? null,
      newObjective: this.newObjective,
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

function trimColor(trim) {
  return ({ purple: '#7a4fc9', rose: '#b95873', teal: '#3f8c88', gold: '#d4a944' })[trim] ?? '#7a4fc9';
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
