import { contentRegistry } from './content/index.js';
import { chapter1Map } from './content/chapters/ch1.js';
import { PALETTE, WORLD } from './config.js';
import { resolveAsset } from './core/assetManifest.js';
import { SoundEngine } from './core/SoundEngine.js';
import { clamp, distance } from './core/math.js';
import { SeededRandom } from './core/rng.js';
import { CharacterRenderer } from './render/CharacterRenderer.js';
import { Particles } from './render/Particles.js';
import { RoomRenderer } from './render/RoomRenderer.js';
import { SetPieceRenderer } from './render/SetPieceRenderer.js';
import { UIRenderer, UI_RECTS, pointInUiRect } from './render/UIRenderer.js';
import { Save, YEARBOOK_MAX_BYTES, createSaveV1 } from './systems/Save.js';
import { World } from './world/World.js';

const FIXED_HARNESS_TIME = '2000-01-01T00:00:00.000Z';

export class Game {
  constructor(canvas, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Game requires a canvas element.');
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    if (!this.context) throw new Error('Canvas 2D is unavailable.');

    this.harness = Boolean(options.harness);
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
    this.lastRenderState = null;
    this.replayMode = false;
    this.canonicalSave = null;
    this.reducedMotion = options.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;

    const storage = options.storage ?? safeStorage();
    this.saveManager = options.saveManager ?? new Save({ storage, clock: this.clock });
    const loaded = options.saveData
      ? { ok: true, status: 'provided', save: structuredClone(options.saveData) }
      : this.saveManager.load();
    this.loadStatus = loaded;
    this.hasStoredSave = Boolean(loaded.ok && loaded.save);
    this.saveData = loaded.ok && loaded.save
      ? loaded.save
      : createSaveV1({ now: this.clock(), appVersion: import.meta.env.VITE_BUILD_SHA ?? 'development', worldSeed: 12072026 });

    this.sound = new SoundEngine({
      resolveAsset,
      muted: this.saveData.settings.muted,
      volumes: this.saveData.settings.volumes,
    });
    this.roomRenderer = new RoomRenderer({ resolveAsset });
    this.characterRenderer = new CharacterRenderer();
    this.uiRenderer = new UIRenderer();
    this.setPieceRenderer = new SetPieceRenderer();
    this.particles = new Particles(new SeededRandom(this.saveData.worldSeed).fork('particles'), { reducedMotion: this.reducedMotion });
    this.world = null;
    this.screen = options.startImmediately ? 'playing' : 'title';

    this.boundResize = () => this.resize();
    this.boundFrame = (time) => this.frame(time);
    this.boundPointerDown = (event) => this.onPointerDown(event);
    this.boundPointerUp = (event) => this.onPointerUp(event);
    this.boundVisibility = () => this.onVisibilityChanged();
    this.boundMotionChanged = (event) => {
      this.reducedMotion = event.matches || Boolean(this.saveData.settings.reducedMotion);
      this.particles.reducedMotion = this.reducedMotion;
    };
    this.motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibility);
    this.motionQuery.addEventListener?.('change', this.boundMotionChanged);
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    canvas.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('pointercancel', this.boundPointerUp);
    this.resize(options.width, options.height, options.dpr);

    if (options.startImmediately) this.createWorld(this.saveData);
  }

  start() {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.render();
    if (!this.harness) requestAnimationFrame(this.boundFrame);
  }

  createWorld(save = this.saveData) {
    this.saveData = save;
    this.world = new World({
      chapters: contentRegistry,
      save,
      seed: save.worldSeed,
      clock: this.clock,
      onDirty: ({ flush, save: nextSave }) => this.persistSave(nextSave, flush),
    });
    this.screen = 'playing';
    this.processWorldEvents();
    this.updateMusic();
  }

  async startAdventure() {
    await this.sound.unlock();
    this.createWorld(this.saveData);
    this.sound.playSfx('sfx/ch1/sealCrack', 'flourish');
    this.particles.emit('sparkle', WORLD.width / 2, WORLD.height / 2, 28);
    this.updateStatus('Violet’s letter is waiting by the window.');
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
    this.particles.update(dt);
    this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 2.8);
    if (this.screen === 'playing' && this.world) {
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
    const cssWidth = forcedWidth ?? this.canvas.clientWidth ?? window.innerWidth;
    const cssHeight = forcedHeight ?? this.canvas.clientHeight ?? window.innerHeight;
    this.dpr = clamp(forcedDpr ?? window.devicePixelRatio ?? 1, 1, WORLD.maxDpr);
    this.canvas.width = Math.max(1, Math.round(cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * this.dpr));
    const fit = Math.min(cssWidth / WORLD.width, cssHeight / WORLD.height);
    this.scale = fit;
    this.offsetX = (cssWidth - WORLD.width * fit) / 2;
    this.offsetY = (cssHeight - WORLD.height * fit) / 2;
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
    if (this.pointer !== null) return;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.pointer = { id: event.pointerId, point: this.toWorld(event) };
  }

  onPointerUp(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    const start = this.pointer.point;
    const point = this.toWorld(event);
    this.pointer = null;
    if (distance(start, point) <= 24) this.handleTap(point);
  }

  handleTap(point) {
    this.sound.unlock().catch(() => {});
    if (this.screen === 'title') {
      this.startAdventure();
      return;
    }
    if (!this.world) return;
    const state = this.lastRenderState ?? this.world.snapshot();

    if (state.setPiece) {
      this.sound.playSfx('sfx/ui/tap', 'tap');
      return;
    }

    if (state.dialogue) {
      if (state.dialogue.type === 'choice') {
        const choice = state.dialogue.choices.find((candidate) => candidate.__rect && pointInUiRect(point, candidate.__rect));
        if (!choice) return;
        this.sound.playSfx('sfx/ui/choice', 'chime');
        this.world.advanceDialogue(choice.id);
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

    if (pointInUiRect(point, UI_RECTS.quest)) {
      this.world.overlay = { surface: 'objective' };
      const objective = this.world.objective;
      if (objective) this.sound.speak(objective.voice, objective.text);
      return;
    }
    if (pointInUiRect(point, UI_RECTS.satchel)) {
      if (this.world.flags['ch1.satchelReceived']) {
        this.world.overlay = { surface: 'satchel', tab: 'map' };
        this.sound.playSfx('sfx/ui/parchment', 'chime');
      } else this.sound.playSfx('sfx/ui/locked', 'fizzle');
      return;
    }
    if (pointInUiRect(point, UI_RECTS.wand)) {
      const script = this.world.chapter.dialogues['ch1.violet.noSpells'];
      if (script) this.world.dialogue.open('ch1.violet.noSpells');
      this.processWorldEvents();
      return;
    }

    this.world.tap(point);
    this.processWorldEvents();
  }

  handleOverlayTap(point, state) {
    if (Math.hypot(point.x - 1090, point.y - 120) <= 62) {
      this.world.closeOverlay();
      this.sound.playSfx('sfx/ui/close', 'tap');
      return;
    }
    if (state.overlay.surface === 'objective') {
      this.world.closeOverlay();
      return;
    }
    if (state.overlay.surface === 'satchel') {
      const location = state.__mapLocations?.find((candidate) => candidate.__rect && pointInUiRect(point, candidate.__rect));
      if (!location) return;
      if (!state.unlockedRooms.includes(location.id)) {
        this.sound.playSfx('sfx/ui/locked', 'fizzle');
        return;
      }
      const contentLocation = chapter1Map.locations.find((candidate) => candidate.id.endsWith(location.id.split('.').at(-1)));
      if (!contentLocation) return;
      this.world.closeOverlay();
      this.world.runActions(contentLocation.onSelect);
      this.sound.playSfx('sfx/ui/travel', 'flourish');
      this.processWorldEvents();
    }
  }

  processWorldEvents() {
    if (!this.world) return;
    for (const event of this.world.drainEvents()) this.handleWorldEvent(event);
  }

  handleWorldEvent(event) {
    switch (event.type) {
      case 'dialogue.lineChanged': {
        const line = this.world.dialoguePresentation;
        if (line?.voice) this.sound.speak(line.voice, line.text);
        this.updateStatus(line?.text ?? '');
        break;
      }
      case 'dialogue.closed':
        this.sound.stopVoice();
        break;
      case 'setPiece.started':
        this.playSetPieceSound(event.payload.id);
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
      case 'room.entered':
        this.particles.clear();
        this.transitionAlpha = this.reducedMotion ? 0.35 : 1;
        this.updateMusic();
        break;
      case 'ui.openRequested':
        if (event.payload.surface === 'chapter-replay') this.beginReplay();
        break;
      case 'chapter.completed':
        this.world.changeChapter(event.payload.nextChapter ?? 'ch2');
        this.processWorldEvents();
        break;
      default:
        break;
    }
  }

  playSetPieceSound(id) {
    if (id.includes('letter')) this.sound.playSfx('sfx/ch1/owlFlap', 'sparkle');
    else if (id.includes('brick')) this.sound.playSfx('sfx/ch1/wallRumble', 'rumble');
    else if (id.includes('wandChaos')) this.sound.playSfx('sfx/ch1/wandPaperWhirl', 'fizzle');
    else if (id.includes('wandChosen')) this.sound.playSfx('sfx/ch1/wandChosen', 'flourish');
    else if (id.includes('chapterCard')) this.sound.playSfx('sfx/ch1/chapterTurn', 'flourish');
    else if (id.includes('previewTicket')) this.sound.playSfx('sfx/ch2/trainWhistle', 'flourish');
  }

  updateMusic() {
    if (!this.world) return;
    const key = this.world.roomId === 'ch1.diagonStreet'
      ? 'music/ch1/diagonAlley'
      : 'music/ch1/violetTheme';
    this.sound.playMusic(key);
  }

  persistSave(save, flush = false) {
    if (this.replayMode) return { ok: true, status: 'replay-not-saved', save };
    const result = flush ? this.saveManager.write(save) : this.saveManager.queue(save);
    if (!result.ok) this.updateStatus('Your adventure is safe for now, but this device could not save the latest moment.');
    return result;
  }

  captureYearbook(moment, caption = 'My wand') {
    if (this.saveData.yearbook.entries.some((entry) => entry.id === moment)) return;
    const thumbnail = document.createElement('canvas');
    thumbnail.width = 480;
    thumbnail.height = 270;
    const context = thumbnail.getContext('2d');
    if (!context) return;
    context.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, 480, 270);
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
      chapter: 'ch1',
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

  beginReplay() {
    if (!this.replayMode) this.canonicalSave = structuredClone(this.saveData);
    const replay = createSaveV1({ now: this.clock(), appVersion: this.saveData.appVersion, worldSeed: this.saveData.worldSeed });
    replay.character = structuredClone(this.saveData.character);
    replay.settings = structuredClone(this.saveData.settings);
    this.replayMode = true;
    this.createWorld(replay);
  }

  render() {
    if (this.destroyed || !this.context) return;
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.ink;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.withWorldTransform((ctx) => {
      if (this.screen === 'title' || !this.world) {
        this.uiRenderer.drawTitle(ctx, this.simTime, this.hasStoredSave);
        return;
      }
      this.renderWorld(ctx);
    });
  }

  renderWorld(context) {
    const state = this.world.snapshot();
    this.lastRenderState = state;
    const room = this.world.room;

    if (this.world.chapter.id === 'ch2' || state.roomId === 'ch1.chapterCardRoom') {
      const card = this.world.chapter.id === 'ch2'
        ? { eyebrow: 'Chapter Two', title: 'Platform Nine and Three-Quarters', subtitle: 'Coming next: the Hogwarts Express!', buttonLabel: 'Choose below' }
        : { eyebrow: 'Chapter One Complete', title: 'Platform Nine and Three-Quarters', subtitle: 'Next time: the Hogwarts Express!' };
      this.uiRenderer.drawChapterCard(context, card, this.simTime);
    } else {
      this.roomRenderer.draw(context, room, state, this.simTime, { x: state.cameraX });
      this.drawWorldTargets(context, state);
      this.drawCharacters(context, state);
      this.particles.draw(context);
    }

    this.setPieceRenderer.draw(context, state.setPiece, state);
    this.uiRenderer.drawHud(context, state, this.simTime);
    if (state.dialogue) this.uiRenderer.drawDialogue(context, state.dialogue, this.simTime, this.saveData.settings.muted);
    if (state.overlay?.surface === 'satchel') this.uiRenderer.drawMap(context, state);
    if (state.overlay?.surface === 'objective') this.uiRenderer.drawObjective(context, state.objective);

    if (this.transitionAlpha > 0) {
      context.fillStyle = `rgba(20,17,38,${this.transitionAlpha})`;
      context.fillRect(0, 0, WORLD.width, WORLD.height);
    }
  }

  drawWorldTargets(context, state) {
    for (const target of state.targets) {
      const area = target.hitArea;
      if (!area || target.presentation?.glow === 'hidden') continue;
      const x = area.x - state.cameraX + (area.shape === 'rect' ? area.width / 2 : 0);
      const y = area.y + (area.shape === 'rect' ? area.height / 2 : 0);
      const radius = area.shape === 'rect' ? Math.max(area.width, area.height) * 0.42 : area.radius;
      const pulse = 1 + Math.sin(this.simTime * 3.2 + x * 0.01) * 0.08;
      context.save();
      context.globalAlpha = target.presentation?.glow === 'objective' ? 0.82 : 0.45;
      context.strokeStyle = PALETTE.interactive;
      context.lineWidth = target.presentation?.glow === 'objective' ? 8 : 5;
      context.setLineDash([13, 11]);
      context.beginPath();
      context.arc(x, y, radius * pulse, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = PALETTE.parchment;
      context.beginPath();
      context.arc(x, y - radius - 24, 19, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.violet;
      context.textAlign = 'center';
      context.font = '700 24px "Trebuchet MS", sans-serif';
      context.fillText(target.kind === 'exit' ? '→' : '✦', x, y - radius - 16);
      context.restore();
    }
  }

  drawCharacters(context, state) {
    const actors = [];
    for (const occupant of state.occupants) {
      if (occupant.npc === 'npc.violet' || occupant.npc.startsWith('npc.pet.')) continue;
      actors.push({ type: 'npc', occupant, y: occupant.y });
    }
    actors.push({ type: 'violet', y: state.player.y });
    if (state.pet) actors.push({ type: 'pet', y: state.pet.y + 1 });
    actors.sort((a, b) => a.y - b.y);

    for (const actor of actors) {
      if (actor.type === 'violet') {
        this.characterRenderer.draw(context, { ...state.player, x: state.player.x - state.cameraX }, this.simTime);
      } else if (actor.type === 'pet') {
        this.characterRenderer.drawPet(context, { ...state.pet, x: state.pet.x - state.cameraX }, this.simTime);
      } else {
        const { occupant } = actor;
        if (occupant.npc === 'npc.owlPost') {
          this.characterRenderer.drawPet(context, { type: 'owl', x: occupant.x - state.cameraX, y: occupant.y + 80 }, this.simTime);
          continue;
        }
        const kind = occupant.npc === 'npc.guide'
          ? 'guide'
          : occupant.npc === 'npc.wandmaker'
            ? 'wandmaker'
            : occupant.npc === 'npc.tailor'
              ? 'tailor'
              : 'keeper';
        this.characterRenderer.draw(context, { ...occupant, kind, x: occupant.x - state.cameraX }, this.simTime);
      }
    }

    if (state.roomId === 'ch1.menagerie' && !this.world.flags['ch1.petNamed']) {
      this.characterRenderer.drawPet(context, { type: 'cat', x: 650 - state.cameraX, y: 585 }, this.simTime);
      this.characterRenderer.drawPet(context, { type: 'owl', x: 900 - state.cameraX, y: 520 }, this.simTime + 0.7);
      this.characterRenderer.drawPet(context, { type: 'toad', x: 1110 - state.cameraX, y: 595 }, this.simTime + 1.3);
    }
  }

  withWorldTransform(draw) {
    const context = this.context;
    context.save();
    context.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, this.dpr * this.offsetX, this.dpr * this.offsetY);
    draw(context);
    context.restore();
  }

  semanticTargets() {
    if (this.screen === 'title') return [{ id: 'foundation.start', x: 640, y: 460 }];
    if (!this.world) return [];
    const state = this.lastRenderState ?? this.world.snapshot();
    const targets = state.targets.map((target) => ({
      id: target.id,
      x: (target.hitArea.x ?? 0) - state.cameraX + (target.hitArea.shape === 'rect' ? target.hitArea.width / 2 : 0),
      y: (target.hitArea.y ?? 0) + (target.hitArea.shape === 'rect' ? target.hitArea.height / 2 : 0),
    }));
    targets.push(
      { id: 'hud.quest', x: 80, y: 80 },
      { id: 'hud.satchel', x: 82, y: 638 },
      { id: 'hud.wand', x: 1198, y: 638 },
    );
    for (const choice of state.dialogue?.choices ?? []) {
      if (choice.__rect) targets.push({ id: `dialogue.${choice.id}`, x: choice.__rect.x + choice.__rect.width / 2, y: choice.__rect.y + choice.__rect.height / 2 });
    }
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

  updateStatus(text) {
    const status = document.querySelector('#game-status');
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
    this.saveManager.destroy();
    this.sound.destroy();
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.motionQuery.removeEventListener?.('change', this.boundMotionChanged);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundPointerUp);
  }
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
