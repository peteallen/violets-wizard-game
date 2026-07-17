import { describe, expect, it } from 'vitest';
import { chapter1Map } from '../src/game/content/chapters/ch1.js';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';

const NOW = '2026-07-15T06:00:00.000Z';
const IGNORED_HOUSEKEEPING_EVENTS = new Set(['save.dirty', 'save.flushRequested']);

const EXPECTED_WALKTHROUGH_TRACE = [
  {
    milestone: 'chapter-one-start',
    state: {
      chapter: 'ch1',
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      objective: 'Tap the owl!',
      thread: 'bedroom.owl',
    },
    progress: {},
    events: [
      'quest.objectiveChanged:ch1.shoppingTrip:openLetter',
    ],
  },
  {
    milestone: 'letter-delivered',
    state: {
      chapter: 'ch1',
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      objective: 'Tap the owl!',
      thread: 'bedroom.letter',
    },
    progress: { flags: ['ch1.owlTapped'] },
    events: [
      'feedback.command:approach',
      'audio.command:sfx:sfx/ch1/owlTap',
      'state.changed:flag:progress.questFlags.ch1.owlTapped',
      'setPiece.started:sp.letter',
      'audio.command:sfx:sfx/ch1/owlFlap',
      'audio.command:sfx:sfx/ch1/paperSlide',
      'setPiece.completed:sp.letter',
    ],
  },
  {
    milestone: 'letter-read',
    state: {
      chapter: 'ch1',
      scene: 'ch1.guideArrival',
      room: 'ch1.bedroom',
      objective: 'Follow Hagrid!',
      thread: 'bedroom.guide',
    },
    progress: { flags: ['ch1.letterOpened', 'ch1.letterRead'] },
    events: [
      'feedback.command:approach',
      'state.changed:flag:progress.questFlags.ch1.letterOpened',
      'setPiece.started:sp.letterOpen',
      'audio.command:sfx:sfx/ch1/sealCrack',
      'audio.command:sfx:sfx/ch1/paperSlide',
      'setPiece.completed:sp.letterOpen',
      'ui.openRequested:letter-reading:-',
      'dialogue.opened:ch1.letter.read:invitation',
      'dialogue.lineChanged:ch1.letter.read:invitation',
      'dialogue.lineChanged:ch1.letter.read:waiting',
      'state.changed:flag:progress.questFlags.ch1.letterRead',
      'dialogue.closed:ch1.letter.read:completed',
    ],
  },
  {
    milestone: 'hagrid-met',
    state: {
      chapter: 'ch1',
      scene: 'ch1.guideArrival',
      room: 'ch1.bedroom',
      objective: 'Follow Hagrid!',
      thread: 'bedroom.exit',
    },
    progress: { flags: ['ch1.guideMet'] },
    events: [
      'feedback.command:approach',
      'quest.objectiveChanged:ch1.shoppingTrip:followGuide',
      'dialogue.opened:ch1.guide.arrival:hello',
      'dialogue.lineChanged:ch1.guide.arrival:hello',
      'state.changed:flag:progress.questFlags.ch1.guideMet',
      'dialogue.closed:ch1.guide.arrival:completed',
    ],
  },
  {
    milestone: 'leaky-cauldron',
    state: {
      chapter: 'ch1',
      scene: 'ch1.leakyArrival',
      room: 'ch1.leaky',
      objective: 'Follow Hagrid!',
      thread: 'leaky.courtyardDoor',
    },
    progress: { flags: ['ch1.leakyReached'] },
    events: [
      'room.transitionRequested:ch1.bedroom->ch1.leaky:entry:ink',
      'room.entered:ch1.leaky:entry',
      'dialogue.opened:ch1.guide.leaky:thisWay',
      'dialogue.lineChanged:ch1.guide.leaky:thisWay',
      'state.changed:flag:progress.questFlags.ch1.leakyReached',
      'dialogue.closed:ch1.guide.leaky:completed',
    ],
  },
  {
    milestone: 'courtyard-wall',
    state: {
      chapter: 'ch1',
      scene: 'ch1.wallOpening',
      room: 'ch1.courtyard',
      objective: 'Follow Hagrid!',
      thread: 'courtyard.brickWall',
    },
    progress: { flags: ['ch1.courtyardReached'] },
    events: [
      'feedback.command:approach',
      'room.transitionRequested:ch1.leaky->ch1.courtyard:entry:ink',
      'room.entered:ch1.courtyard:entry',
      'state.changed:flag:progress.questFlags.ch1.courtyardReached',
      'dialogue.opened:ch1.guide.wall:prompt',
      'dialogue.lineChanged:ch1.guide.wall:prompt',
      'dialogue.closed:ch1.guide.wall:completed',
    ],
  },
  {
    milestone: 'diagon-map-received',
    state: {
      chapter: 'ch1',
      scene: 'ch1.diagonArrival',
      room: 'ch1.diagonStreet',
      objective: 'Find your wand!',
      thread: 'hud.satchel',
    },
    progress: {
      flags: ['ch1.diagonReached', 'ch1.satchelReceived', 'ch1.wallOpened'],
    },
    events: [
      'feedback.command:approach',
      'setPiece.started:sp.brickWall',
      'audio.command:sfx:sfx/ch1/wallRumble',
      'audio.command:sfx:sfx/ch1/brickClack',
      'setPiece.completed:sp.brickWall',
      'state.changed:flag:progress.questFlags.ch1.wallOpened',
      'room.transitionRequested:ch1.courtyard->ch1.diagonStreet:west:none',
      'room.entered:ch1.diagonStreet:west',
      'state.changed:flag:progress.questFlags.ch1.diagonReached',
      'dialogue.opened:ch1.guide.map:map',
      'dialogue.lineChanged:ch1.guide.map:map',
      'quest.objectiveChanged:ch1.shoppingTrip:useMap',
      'state.changed:flag:progress.questFlags.ch1.satchelReceived',
      'dialogue.closed:ch1.guide.map:completed',
    ],
  },
  {
    milestone: 'ollivanders-entered',
    state: {
      chapter: 'ch1',
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      objective: 'Find your wand!',
      thread: 'ollivanders.wand1',
    },
    progress: { flags: ['ch1.mapUsed'] },
    events: [
      'state.changed:flag:progress.questFlags.ch1.mapUsed',
      'room.transitionRequested:ch1.diagonStreet->ch1.ollivanders:entry:ink',
      'room.entered:ch1.ollivanders:entry',
      'dialogue.opened:ch1.wandmaker.welcome:welcome',
      'dialogue.lineChanged:ch1.wandmaker.welcome:welcome',
      'dialogue.closed:ch1.wandmaker.welcome:completed',
    ],
  },
  {
    milestone: 'wand-chosen',
    state: {
      chapter: 'ch1',
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      objective: 'Choose your robes!',
      thread: 'ollivanders.exit',
    },
    progress: {
      flags: ['ch1.wandChosen', 'ch1.wandTry1', 'ch1.wandTry2'],
      wand: 'violet-first-wand',
    },
    events: [
      'feedback.command:approach',
      'quest.objectiveChanged:ch1.shoppingTrip:chooseWand',
      'state.changed:flag:progress.questFlags.ch1.wandTry1',
      'setPiece.started:sp.wandChaos1',
      'actor.animationRequested:npc.violet:wrong-wand-one',
      'audio.command:sfx:sfx/ch1/wandPaperWhirl',
      'setPiece.completed:sp.wandChaos1',
      'dialogue.opened:ch1.wandmaker.wrong1:oops',
      'dialogue.lineChanged:ch1.wandmaker.wrong1:oops',
      'dialogue.closed:ch1.wandmaker.wrong1:completed',
      'feedback.command:approach',
      'state.changed:flag:progress.questFlags.ch1.wandTry2',
      'setPiece.started:sp.wandChaos2',
      'actor.animationRequested:npc.violet:wrong-wand-two',
      'audio.command:sfx:sfx/ch1/wandPaperWhirl',
      'audio.command:sfx:sfx/ch1/vaseShatter',
      'setPiece.completed:sp.wandChaos2',
      'dialogue.opened:ch1.wandmaker.wrong2:again',
      'dialogue.lineChanged:ch1.wandmaker.wrong2:again',
      'dialogue.closed:ch1.wandmaker.wrong2:completed',
      'feedback.command:approach',
      'state.changed:flag:progress.questFlags.ch1.wandChosen',
      'setPiece.started:sp.wandChosen',
      'actor.animationRequested:npc.violet:chosen-wand',
      'audio.command:sfx:sfx/ch1/wandChosen',
      'quest.objectiveChanged:ch1.shoppingTrip:chooseRobes',
      'setPiece.completed:sp.wandChosen',
      'yearbook.captureRequested:ch1.wandChosen',
      'dialogue.opened:ch1.wandmaker.chosen:chosen',
      'dialogue.lineChanged:ch1.wandmaker.chosen:chosen',
      'dialogue.closed:ch1.wandmaker.chosen:completed',
    ],
  },
  {
    milestone: 'robes-chosen',
    state: {
      chapter: 'ch1',
      scene: 'ch1.robeShopping',
      room: 'ch1.malkins',
      objective: 'Choose a pet!',
      thread: 'malkins.exit',
    },
    progress: {
      flags: ['ch1.trimChosen'],
      robeTrim: 'purple',
    },
    events: [
      'feedback.command:approach',
      'room.transitionRequested:ch1.ollivanders->ch1.diagonStreet:west:ink',
      'room.entered:ch1.diagonStreet:west',
      'feedback.command:approach',
      'room.transitionRequested:ch1.diagonStreet->ch1.malkins:entry:ink',
      'room.entered:ch1.malkins:entry',
      'feedback.command:approach',
      'dialogue.opened:ch1.tailor.fitting:welcome',
      'dialogue.lineChanged:ch1.tailor.fitting:welcome',
      'ui.openRequested:robe-picker:-',
      'dialogue.closed:ch1.tailor.fitting:completed',
      'state.changed:flag:progress.questFlags.ch1.trimChosen',
      'dialogue.opened:ch1.tailor.done:done',
      'dialogue.lineChanged:ch1.tailor.done:done',
      'dialogue.closed:ch1.tailor.done:completed',
    ],
  },
  {
    milestone: 'pet-named',
    state: {
      chapter: 'ch1',
      scene: 'ch1.petShopping',
      room: 'ch1.menagerie',
      objective: 'Find Hagrid!',
      thread: 'menagerie.exit',
    },
    progress: {
      flags: ['ch1.petChosen', 'ch1.petNamed', 'ch1.shoppingComplete'],
      pet: 'cat:Biscuit',
    },
    events: [
      'feedback.command:approach',
      'quest.objectiveChanged:ch1.shoppingTrip:choosePet',
      'room.transitionRequested:ch1.malkins->ch1.diagonStreet:west:ink',
      'room.entered:ch1.diagonStreet:west',
      'feedback.command:approach',
      'room.transitionRequested:ch1.diagonStreet->ch1.menagerie:entry:ink',
      'room.entered:ch1.menagerie:entry',
      'feedback.command:approach',
      'dialogue.opened:ch1.keeper.petAndName:welcome',
      'dialogue.lineChanged:ch1.keeper.petAndName:welcome',
      'dialogue.choicesChanged:ch1.keeper.petAndName:pet',
      'state.changed:pending-choice:character.pet.type',
      'audio.command:sfx:sfx/ch1/petCat',
      'dialogue.lineChanged:ch1.keeper.petAndName:confirm',
      'dialogue.choicesChanged:ch1.keeper.petAndName:confirmChoice',
      'state.changed:flag:progress.questFlags.ch1.petChosen',
      'dialogue.lineChanged:ch1.keeper.petAndName:askName',
      'dialogue.choicesChanged:ch1.keeper.petAndName:name',
      'state.changed:flag:progress.questFlags.ch1.petNamed',
      'state.changed:flag:progress.questFlags.ch1.shoppingComplete',
      'dialogue.lineChanged:ch1.keeper.petAndName:done',
      'dialogue.closed:ch1.keeper.petAndName:completed',
    ],
  },
  {
    milestone: 'ticket-received',
    state: {
      chapter: 'ch1',
      scene: 'ch1.chapterCard',
      room: 'ch1.chapterCardRoom',
      objective: null,
      setPiece: 'sp.chapterCard',
    },
    progress: { flags: ['ch1.ticketReceived'] },
    events: [
      'feedback.command:approach',
      'quest.objectiveChanged:ch1.shoppingTrip:returnToGuide',
      'room.transitionRequested:ch1.menagerie->ch1.diagonStreet:east:ink',
      'room.entered:ch1.diagonStreet:east',
      'feedback.command:approach',
      'audio.command:sfx:sfx/ch1/ticket',
      'dialogue.opened:ch1.guide.ticket:ticket',
      'dialogue.lineChanged:ch1.guide.ticket:ticket',
      'dialogue.lineChanged:ch1.guide.ticket:platform',
      'state.changed:flag:progress.questFlags.ch1.ticketReceived',
      'room.transitionRequested:ch1.diagonStreet->ch1.chapterCardRoom:start:ink',
      'room.entered:ch1.chapterCardRoom:start',
      'setPiece.started:sp.chapterCard',
      'audio.command:sfx:sfx/ch1/chapterTurn',
      'dialogue.closed:ch1.guide.ticket:completed',
    ],
  },
  {
    milestone: 'chapter-two-arrival',
    state: {
      chapter: 'ch2',
      scene: 'ch2.scene.kingsCross',
      room: 'ch2.kingsCross',
      objective: 'Find the barrier!',
      thread: 'ch2.kingsCross.barrier',
    },
    progress: {
      flags: ['ch1.chapterCardSeen', 'ch1.complete'],
      completedChapters: ['ch1'],
    },
    events: [
      'audio.command:music:music/ch1/chapterTriumph',
      'setPiece.completed:sp.chapterCard',
      'dialogue.opened:ch1.narrator.chapterEnd:nextTime',
      'dialogue.lineChanged:ch1.narrator.chapterEnd:nextTime',
      'state.changed:flag:progress.questFlags.ch1.chapterCardSeen',
      'state.changed:flag:progress.questFlags.ch1.complete',
      'chapter.completed:ch1->ch2',
      'room.transitionRequested:ch1.chapterCardRoom->ch2.kingsCross:start:ink',
      'room.entered:ch2.kingsCross:start',
      'dialogue.closed:ch1.narrator.chapterEnd:completed',
    ],
  },
];

function summarizeEvent({ type, payload = {} }) {
  switch (type) {
    case 'state.changed':
      return `${type}:${payload.reason}:${(payload.paths ?? []).join(',')}`;
    case 'dialogue.opened':
    case 'dialogue.lineChanged':
    case 'dialogue.choicesChanged':
      return `${type}:${payload.script}:${payload.node}`;
    case 'dialogue.closed':
      return `${type}:${payload.script}:${payload.reason}`;
    case 'setPiece.started':
    case 'setPiece.completed':
      return `${type}:${payload.id}`;
    case 'audio.command':
      return `${type}:${payload.command}:${payload.key}`;
    case 'actor.animationRequested':
      return `${type}:${payload.actor}:${payload.action}`;
    case 'particles.emit':
      return `${type}:${payload.kind ?? payload.preset ?? payload.id ?? 'effect'}`;
    case 'camera.command':
    case 'feedback.command':
      return `${type}:${payload.command ?? payload.kind ?? 'effect'}`;
    case 'ui.openRequested':
      return `${type}:${payload.surface}:${payload.tab ?? '-'}`;
    case 'ui.closeRequested':
      return `${type}:${payload.surface}`;
    case 'quest.objectiveChanged':
      return `${type}:${payload.quest}:${payload.step}`;
    case 'reward.granted':
      return `${type}:${payload.receipt ?? `${payload.collection}:${payload.id}`}`;
    case 'room.transitionRequested':
      return `${type}:${payload.from}->${payload.to}:${payload.spawn}:${payload.effect}`;
    case 'room.entered':
      return `${type}:${payload.room}:${payload.spawn}`;
    case 'chapter.completed':
      return `${type}:${payload.chapter}->${payload.nextChapter}`;
    case 'yearbook.captureRequested':
      return `${type}:${payload.moment}`;
    default:
      return type;
  }
}

function createTraceRecorder(world, save) {
  const trace = [];
  const previousFlags = new Set();
  let previousWand = save.character.wandId;
  let previousRobeTrim = save.character.appearance.robeTrim;
  let previousPet = `${save.character.pet.type ?? ''}:${save.character.pet.name ?? ''}`;
  let previousCompletedChapters = save.progress.completedChapters.join(',');

  return {
    trace,
    record(milestone) {
      const snapshot = world.snapshot();
      const currentFlags = Object.entries(save.progress.questFlags)
        .filter(([, value]) => value === true)
        .map(([flag]) => flag)
        .sort();
      const newFlags = currentFlags.filter((flag) => !previousFlags.has(flag));
      currentFlags.forEach((flag) => previousFlags.add(flag));

      const state = {
        chapter: snapshot.chapterId,
        scene: snapshot.sceneId,
        room: snapshot.roomId,
        objective: snapshot.objective?.caption ?? null,
        ...(snapshot.affordances.thread?.worldTargetId ?? snapshot.affordances.thread?.targetId
          ? { thread: snapshot.affordances.thread.worldTargetId ?? snapshot.affordances.thread.targetId }
          : {}),
        ...(snapshot.dialogue
          ? { dialogue: `${snapshot.dialogue.scriptId}:${snapshot.dialogue.nodeId}:${snapshot.dialogue.type}` }
          : {}),
        ...(snapshot.dialogue?.choices
          ? { choices: snapshot.dialogue.choices.map(({ id }) => id) }
          : {}),
        ...(snapshot.setPiece ? { setPiece: snapshot.setPiece.requestedId } : {}),
        ...(snapshot.overlay
          ? { overlay: `${snapshot.overlay.surface}:${snapshot.overlay.tab ?? '-'}` }
          : {}),
      };
      const progress = {};
      if (newFlags.length > 0) progress.flags = newFlags;
      if (save.character.wandId !== previousWand) {
        progress.wand = save.character.wandId;
        previousWand = save.character.wandId;
      }
      if (save.character.appearance.robeTrim !== previousRobeTrim) {
        progress.robeTrim = save.character.appearance.robeTrim;
        previousRobeTrim = save.character.appearance.robeTrim;
      }
      const pet = `${save.character.pet.type ?? ''}:${save.character.pet.name ?? ''}`;
      if (pet !== previousPet) {
        progress.pet = `${save.character.pet.type}:${save.character.pet.name}`;
        previousPet = pet;
      }
      const completedChapters = save.progress.completedChapters.join(',');
      if (completedChapters !== previousCompletedChapters) {
        progress.completedChapters = [...save.progress.completedChapters];
        previousCompletedChapters = completedChapters;
      }

      const events = world.drainEvents()
        .filter(({ type }) => !IGNORED_HOUSEKEEPING_EVENTS.has(type))
        .map(summarizeEvent);
      trace.push({ milestone, state, progress, events });
    },
  };
}

function settleUntil(world, predicate, maximumSeconds = 12) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += 1 / 60) {
    if (predicate()) return;
    world.update(1 / 60);
  }
  if (!predicate()) throw new Error(`World did not settle after ${maximumSeconds} seconds.`);
}

function interactAndSettle(world, targetId) {
  world.interactSemantic(targetId);
  settleUntil(world, () => !world.pendingInteraction && !world.setPieces.active);
}

function finishDialogueLines(world) {
  while (world.dialogue.active) {
    if (world.dialogue.node.type === 'choice') {
      throw new Error(`Walkthrough reached unexpected choice in ${world.dialogue.scriptId}.`);
    }
    world.advanceDialogue();
  }
}

function runChapterOneWalkthrough() {
  const save = createSaveV1({
    now: NOW,
    appVersion: 'walkthrough-trace-test',
    worldSeed: 42,
  });
  const world = new World({
    chapters: contentRegistry,
    save,
    seed: 42,
    clock: () => NOW,
  });
  const recorder = createTraceRecorder(world, save);

  recorder.record('chapter-one-start');
  interactAndSettle(world, 'bedroom.owl');
  recorder.record('letter-delivered');

  interactAndSettle(world, 'bedroom.letter');
  world.closeOverlay();
  world.runAction({ type: 'dialogue.start', script: 'ch1.letter.read' });
  finishDialogueLines(world);
  recorder.record('letter-read');

  interactAndSettle(world, 'bedroom.guide');
  finishDialogueLines(world);
  settleUntil(world, () => world.targets().some(({ id }) => id === 'bedroom.exit'));
  recorder.record('hagrid-met');

  interactAndSettle(world, 'bedroom.exit');
  finishDialogueLines(world);
  settleUntil(world, () => world.targets().some(({ id }) => id === 'leaky.courtyardDoor'));
  recorder.record('leaky-cauldron');

  interactAndSettle(world, 'leaky.courtyardDoor');
  finishDialogueLines(world);
  recorder.record('courtyard-wall');

  interactAndSettle(world, 'courtyard.brickWall');
  finishDialogueLines(world);
  recorder.record('diagon-map-received');

  const ollivanders = chapter1Map.locations.find(({ id }) => id === 'map.ch1.ollivanders');
  world.runActions(ollivanders.onSelect);
  finishDialogueLines(world);
  recorder.record('ollivanders-entered');

  for (const wand of ['ollivanders.wand1', 'ollivanders.wand2', 'ollivanders.wand3']) {
    interactAndSettle(world, wand);
    finishDialogueLines(world);
  }
  recorder.record('wand-chosen');

  interactAndSettle(world, 'ollivanders.exit');
  interactAndSettle(world, 'street.malkinsDoor');
  interactAndSettle(world, 'malkins.stool');
  world.advanceDialogue();
  world.selectRobeTrim('purple');
  world.confirmRobeTrim();
  finishDialogueLines(world);
  recorder.record('robes-chosen');

  interactAndSettle(world, 'malkins.exit');
  interactAndSettle(world, 'street.menagerieDoor');
  interactAndSettle(world, 'menagerie.keeper');
  world.advanceDialogue();
  world.advanceDialogue('petCat');
  world.advanceDialogue();
  world.advanceDialogue('petConfirm');
  world.advanceDialogue();
  world.advanceDialogue('nameBiscuit');
  finishDialogueLines(world);
  recorder.record('pet-named');

  interactAndSettle(world, 'menagerie.exit');
  interactAndSettle(world, 'street.guideTicket');
  finishDialogueLines(world);
  recorder.record('ticket-received');

  settleUntil(world, () => !world.setPieces.active);
  finishDialogueLines(world);
  settleUntil(world, () => world.chapter.id === 'ch2');
  recorder.record('chapter-two-arrival');

  return recorder.trace;
}

describe('deterministic Chapter One walkthrough baseline', () => {
  it('preserves milestone state and semantic event order through the playable Chapter Two opening', () => {
    expect(runChapterOneWalkthrough()).toEqual(EXPECTED_WALKTHROUGH_TRACE);
  });
});
