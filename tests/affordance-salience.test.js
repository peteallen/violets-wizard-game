import { describe, expect, it } from 'vitest';
import { chapter1Map } from '../src/game/content/chapters/ch1.js';
import { contentRegistry } from '../src/game/content/index.js';
import { createSaveV1 } from '../src/game/systems/Save.js';
import { World } from '../src/game/world/World.js';
import { GLINT_SCHEDULE, PET_HINT_SCHEDULE } from '../src/game/world/AffordanceSalience.js';

const progression = Object.freeze({
  owl: { 'ch1.owlTapped': true },
  letter: { 'ch1.owlTapped': true, 'ch1.letterOpened': true, 'ch1.letterRead': true },
  guide: {
    'ch1.owlTapped': true,
    'ch1.letterOpened': true,
    'ch1.letterRead': true,
    'ch1.guideMet': true,
  },
  courtyard: {
    'ch1.owlTapped': true,
    'ch1.letterOpened': true,
    'ch1.letterRead': true,
    'ch1.guideMet': true,
    'ch1.leakyReached': true,
    'ch1.courtyardReached': true,
  },
  street: {
    'ch1.owlTapped': true,
    'ch1.letterOpened': true,
    'ch1.letterRead': true,
    'ch1.guideMet': true,
    'ch1.leakyReached': true,
    'ch1.courtyardReached': true,
    'ch1.wallOpened': true,
    'ch1.diagonReached': true,
    'ch1.satchelReceived': true,
  },
});

function createWorld({
  flags = {},
  room = 'ch1.bedroom',
  spawn = 'start',
  cards = [],
  pet = null,
  reducedMotion = false,
} = {}) {
  const save = createSaveV1({
    now: '2026-07-13T12:00:00.000Z',
    appVersion: 'affordance-test',
    worldSeed: 42,
  });
  save.resume = { chapter: 'ch1', scene: 'ch1.affordanceTest', room, spawn };
  Object.assign(save.progress.questFlags, flags);
  save.collections.cards = [...cards];
  if (pet) save.character.pet = { ...pet };
  save.settings.reducedMotion = reducedMotion;
  const world = new World({ chapters: contentRegistry, save, seed: 42 });
  if (world.dialogue.active) world.dialogue.close('test-stage');
  world.overlay = null;
  world.drainEvents();
  return world;
}

function threadTarget(world) {
  return world.snapshot().affordances.thread;
}

function assertGlobalGlintBudget(snapshot) {
  const activations = snapshot.affordances.glintActivations;
  expect(snapshot.affordances.glintActivationTimestamps)
    .toEqual(activations.map(({ startedAt }) => startedAt));
  for (const activation of activations) {
    const startsInInclusiveWindow = activations.filter(
      ({ startedAt }) => startedAt >= activation.startedAt
        && startedAt <= activation.startedAt + GLINT_SCHEDULE.slotSeconds,
    );
    expect(startsInInclusiveWindow.length).toBeLessThanOrEqual(2);
  }
}

function settleUntil(world, predicate, maximumSeconds = 12) {
  for (let elapsed = 0; elapsed < maximumSeconds; elapsed += 1 / 60) {
    if (predicate()) return;
    world.update(1 / 60);
  }
  expect(predicate()).toBe(true);
}

function finishDialogueLines(world) {
  while (world.dialogue.active) {
    expect(world.dialogue.node.type).not.toBe('choice');
    world.advanceDialogue();
  }
}

describe('D31 golden-thread lifecycle', () => {
  it('moves one thread through the complete Chapter One route and exposes the map channel', () => {
    const cases = [
      [{}, 'ch1.bedroom', 'bedroom.owl'],
      [progression.owl, 'ch1.bedroom', 'bedroom.letter'],
      [progression.letter, 'ch1.bedroom', 'bedroom.guide'],
      [progression.guide, 'ch1.bedroom', 'bedroom.exit'],
      [{ ...progression.guide, 'ch1.leakyReached': true }, 'ch1.leaky', 'leaky.courtyardDoor'],
      [progression.courtyard, 'ch1.courtyard', 'courtyard.brickWall'],
      [{ ...progression.street, 'ch1.mapUsed': true }, 'ch1.diagonStreet', 'street.ollivandersDoor'],
      [{ ...progression.street, 'ch1.mapUsed': true }, 'ch1.ollivanders', 'ollivanders.wand1'],
      [{ ...progression.street, 'ch1.mapUsed': true, 'ch1.wandTry1': true }, 'ch1.ollivanders', 'ollivanders.wand2'],
      [{ ...progression.street, 'ch1.mapUsed': true, 'ch1.wandTry1': true, 'ch1.wandTry2': true }, 'ch1.ollivanders', 'ollivanders.wand3'],
      [{ ...progression.street, 'ch1.mapUsed': true, 'ch1.wandChosen': true }, 'ch1.diagonStreet', 'street.malkinsDoor'],
      [{ ...progression.street, 'ch1.mapUsed': true, 'ch1.wandChosen': true }, 'ch1.malkins', 'malkins.stool'],
      [{ ...progression.street, 'ch1.mapUsed': true, 'ch1.wandChosen': true, 'ch1.trimChosen': true }, 'ch1.diagonStreet', 'street.menagerieDoor'],
      [{ ...progression.street, 'ch1.mapUsed': true, 'ch1.wandChosen': true, 'ch1.trimChosen': true }, 'ch1.menagerie', 'menagerie.keeper'],
      [{
        ...progression.street,
        'ch1.mapUsed': true,
        'ch1.wandChosen': true,
        'ch1.trimChosen': true,
        'ch1.petChosen': true,
        'ch1.petNamed': true,
      }, 'ch1.diagonStreet', 'street.guideTicket'],
    ];

    for (const [flags, room, expectedTarget] of cases) {
      const world = createWorld({ flags, room });
      settleUntil(world, () => world.targets().some(({ id }) => id === expectedTarget));
      const snapshot = world.snapshot();
      expect(snapshot.affordances.thread?.worldTargetId, room).toBe(expectedTarget);
      expect(snapshot.targets.filter((target) => target.salience.tier === 'thread'), room).toHaveLength(1);
      expect(snapshot.targets.filter((target) => target.salience.visible === 'thread'), room).toHaveLength(1);
    }

    const mapTeaching = createWorld({ flags: progression.street, room: 'ch1.diagonStreet' });
    expect(threadTarget(mapTeaching)).toMatchObject({
      targetId: 'hud.satchel',
      worldTargetId: null,
      mapTargetId: 'street.ollivandersDoor',
      channel: 'hud',
    });
    expect(mapTeaching.snapshot().targets.find(({ id }) => id === 'street.ollivandersDoor')?.salience)
      .toMatchObject({ tier: 'discoverable' });

    const shopping = createWorld({
      flags: { ...progression.street, 'ch1.mapUsed': true },
      room: 'ch1.diagonStreet',
    });
    expect(threadTarget(shopping)).toMatchObject({
      worldTargetId: 'street.ollivandersDoor',
      mapTargetId: 'street.ollivandersDoor',
    });
  });

  it('keeps the hard global budget and mechanically silences spent interactions', () => {
    const busyFlags = {
      ...progression.street,
      'ch1.mapUsed': true,
      'ch1.wandChosen': true,
      'ch1.trimChosen': true,
    };
    const busyWorld = createWorld({ flags: busyFlags, room: 'ch1.diagonStreet' });
    for (let elapsed = 0; elapsed <= 36; elapsed += 0.05) {
      busyWorld.update(0.05);
      const snapshot = busyWorld.snapshot();
      expect(snapshot.targets.filter((target) => target.salience.visible === 'thread')).toHaveLength(1);
      expect(snapshot.affordances.glints.length).toBeLessThanOrEqual(1);
      assertGlobalGlintBudget(snapshot);
    }

    const flags = { ...progression.street, 'ch1.mapUsed': true };
    const world = createWorld({ flags, room: 'ch1.ollivanders' });
    world.addCollection('cards', 'morgana');
    const card = world.snapshot().targets.find((target) => target.id === 'ollivanders.cardMorgana');
    expect(card.salience).toMatchObject({ tier: 'none', visible: 'none' });

    world.setFlag('ch1.wandTry1', true);
    expect(threadTarget(world).worldTargetId).toBe('ollivanders.wand2');
  });

  it('enforces one global inclusive-window budget while real exits change rooms', () => {
    const world = createWorld({
      flags: {
        ...progression.street,
        'ch1.mapUsed': true,
        'ch1.wandChosen': true,
      },
      room: 'ch1.diagonStreet',
      spawn: 'street.west',
    });

    world.update(6);
    expect(world.snapshot().affordances.glintActivations.at(-1).roomId).toBe('ch1.diagonStreet');

    world.interactSemantic('street.malkinsDoor');
    settleUntil(world, () => world.roomId === 'ch1.malkins');
    expect(world.roomId).toBe('ch1.malkins');
    world.interactSemantic('malkins.exit');
    settleUntil(world, () => world.roomId === 'ch1.diagonStreet');
    expect(world.roomId).toBe('ch1.diagonStreet');
    world.interactSemantic('street.ollivandersDoor');
    settleUntil(world, () => world.roomId === 'ch1.ollivanders');
    expect(world.roomId).toBe('ch1.ollivanders');

    const snapshot = world.snapshot();
    expect(snapshot.affordances.glintActivations.some(
      ({ roomId }) => roomId === 'ch1.diagonStreet',
    )).toBe(true);
    assertGlobalGlintBudget(snapshot);
  });

  it('quiets every affordance during dialogue, set pieces, and approach walking', () => {
    const flags = { ...progression.street, 'ch1.mapUsed': true };
    const dialogueWorld = createWorld({ flags, room: 'ch1.ollivanders' });
    dialogueWorld.dialogue.open('ch1.wandmaker.welcome');
    const dialogueSnapshot = dialogueWorld.snapshot();
    expect(dialogueSnapshot.affordances).toMatchObject({ quiet: true, worldSuppressed: true });
    expect(dialogueSnapshot.targets.every((target) => target.salience.visible === 'none')).toBe(true);

    const setPieceWorld = createWorld({ flags, room: 'ch1.ollivanders' });
    setPieceWorld.setPieces.start('sp.wandChaos1');
    const setPieceSnapshot = setPieceWorld.snapshot();
    expect(setPieceSnapshot.affordances).toMatchObject({ quiet: true, worldSuppressed: true });
    expect(setPieceSnapshot.targets.every((target) => target.salience.visible === 'none')).toBe(true);

    const walkingWorld = createWorld({ flags, room: 'ch1.ollivanders' });
    walkingWorld.interactSemantic('ollivanders.wand1');
    walkingWorld.update(1 / 60);
    expect(walkingWorld.player.walking).toBe(true);
    const walkingSnapshot = walkingWorld.snapshot();
    expect(walkingSnapshot.affordances).toMatchObject({ quiet: true, worldSuppressed: true });
    expect(walkingSnapshot.targets.every((target) => target.salience.visible === 'none')).toBe(true);
  });

  it('keeps the active map thread truthful while suppressing the covered room', () => {
    const world = createWorld({ flags: progression.street, room: 'ch1.diagonStreet' });
    world.runAction({ type: 'ui.open', surface: 'satchel', tab: 'map' });

    const snapshot = world.snapshot();
    expect(snapshot.overlay).toEqual({ surface: 'satchel', tab: 'map' });
    expect(snapshot.affordances).toMatchObject({
      quiet: false,
      worldSuppressed: true,
      thread: {
        targetId: 'hud.satchel',
        worldTargetId: null,
        mapTargetId: 'street.ollivandersDoor',
        channel: 'hud',
      },
    });
    expect(snapshot.targets.every((target) => target.salience.visible === 'none')).toBe(true);
    expect(snapshot.affordances.glints).toEqual([]);
    expect(snapshot.affordances.petHint).toBeNull();
  });

  it('strengthens only the existing thread when the hint ladder escalates', () => {
    const world = createWorld();
    expect(threadTarget(world).intensity).toBe('normal');
    world.update(20);
    expect(threadTarget(world).intensity).toBe('hint');
    expect(world.snapshot().targets.filter((target) => target.salience.tier === 'thread')).toHaveLength(1);
  });

  it('walks the real Chapter One interactions while preserving one thread and the global history', () => {
    const world = createWorld();
    const seenRooms = new Set();
    const checkpoint = () => {
      const snapshot = world.snapshot();
      if (snapshot.objective) {
        expect(snapshot.affordances.thread?.targetId).toBeTruthy();
        expect(snapshot.targets.filter((target) => target.salience.tier === 'thread').length)
          .toBeLessThanOrEqual(1);
        if (!snapshot.affordances.quiet && snapshot.affordances.thread.channel === 'world') {
          expect(snapshot.targets.filter((target) => target.salience.visible === 'thread')).toHaveLength(1);
        }
      }
      assertGlobalGlintBudget(snapshot);
      return snapshot;
    };
    const interact = (id) => {
      world.interactSemantic(id);
      settleUntil(world, () => !world.pendingInteraction && !world.setPieces.active);
      checkpoint();
    };
    const waitForRoomGlint = (roomId) => {
      const priorCount = world.snapshot().affordances.glintActivations.length;
      settleUntil(world, () => world.snapshot().affordances.glintActivations
        .slice(priorCount).some((activation) => activation.roomId === roomId), 12);
      seenRooms.add(roomId);
      checkpoint();
    };

    interact('bedroom.owl');
    interact('bedroom.letter');
    world.closeOverlay();
    world.runAction({ type: 'dialogue.start', script: 'ch1.letter.read' });
    finishDialogueLines(world);
    checkpoint();
    interact('bedroom.guide');
    finishDialogueLines(world);
    settleUntil(world, () => world.targets().some(({ id }) => id === 'bedroom.exit'));
    interact('bedroom.exit');
    finishDialogueLines(world);
    settleUntil(world, () => world.targets().some(({ id }) => id === 'leaky.courtyardDoor'));
    interact('leaky.courtyardDoor');
    finishDialogueLines(world);
    interact('courtyard.brickWall');
    finishDialogueLines(world);
    world.closeOverlay();
    checkpoint();
    // Violet's old spoken broom reaction was the only discoverable glint in
    // this progression state. Removing her speech leaves the street focused
    // on its single objective thread until a shop is entered.
    checkpoint();

    world.runActions(chapter1Map.locations.find(
      (location) => location.id === 'map.ch1.ollivanders',
    ).onSelect);
    finishDialogueLines(world);
    for (const wand of ['ollivanders.wand1', 'ollivanders.wand2', 'ollivanders.wand3']) {
      interact(wand);
      finishDialogueLines(world);
    }
    waitForRoomGlint('ch1.ollivanders');

    interact('ollivanders.exit');
    interact('street.malkinsDoor');
    interact('malkins.stool');
    world.advanceDialogue();
    world.selectRobeTrim('purple');
    world.confirmRobeTrim();
    finishDialogueLines(world);
    // The removed spoken mirror reaction was Malkins' only optional glint.
    // Once robes are chosen, the room correctly quiets around its exit.
    checkpoint();

    interact('malkins.exit');
    interact('street.menagerieDoor');
    interact('menagerie.keeper');
    world.advanceDialogue();
    world.advanceDialogue('petCat');
    world.advanceDialogue();
    world.advanceDialogue('petConfirm');
    world.advanceDialogue();
    world.advanceDialogue('nameBiscuit');
    finishDialogueLines(world);
    waitForRoomGlint('ch1.menagerie');

    interact('menagerie.exit');
    interact('street.guideTicket');
    finishDialogueLines(world);
    settleUntil(world, () => !world.setPieces.active);
    finishDialogueLines(world);
    settleUntil(world, () => world.chapter.id === 'ch2');

    const finalSnapshot = checkpoint();
    expect(seenRooms).toEqual(new Set([
      'ch1.ollivanders',
      'ch1.menagerie',
    ]));
    for (const roomId of seenRooms) {
      expect(finalSnapshot.affordances.glintActivations.some((activation) => activation.roomId === roomId)).toBe(true);
    }
  });
});

describe('D31 secret pet hints', () => {
  it('walks Violet’s pet toward an uncollected secret, pauses to paw, and returns', () => {
    const world = createWorld({
      flags: { ...progression.street, 'ch1.mapUsed': true },
      room: 'ch1.ollivanders',
      pet: { type: 'cat', name: 'Biscuit' },
    });
    const stages = new Set();
    let pawSnapshot = null;
    const actorCrossings = [];
    const returningFacings = new Set();
    for (let time = 0; time < PET_HINT_SCHEDULE.periodSeconds; time += 0.1) {
      world.time = time;
      const snapshot = world.snapshot();
      if (snapshot.affordances.petHint) stages.add(snapshot.affordances.petHint.stage);
      if (snapshot.affordances.petHint?.stage === 'paw') pawSnapshot = snapshot;
      if (
        ['wander', 'return'].includes(snapshot.affordances.petHint?.stage)
        && snapshot.pet.x > 210
        && snapshot.pet.x < 360
      ) actorCrossings.push(snapshot.pet.y);
      if (
        snapshot.affordances.petHint?.stage === 'return'
        && snapshot.pet.x > 360
        && snapshot.pet.x < 1000
      ) returningFacings.add(snapshot.pet.facing);
    }

    expect(stages).toEqual(new Set(['wander', 'paw', 'return']));
    expect(pawSnapshot.pet.pose).toBe('paw');
    expect(pawSnapshot.pet.secretHint.targetId).toBe('ollivanders.cardMorgana');
    expect(Math.abs(pawSnapshot.pet.x - 1060)).toBeLessThan(1);
    expect(actorCrossings.length).toBeGreaterThan(0);
    expect(Math.min(...actorCrossings)).toBeGreaterThanOrEqual(675);
    expect(returningFacings).toEqual(new Set(['left']));

    world.addCollection('cards', 'morgana');
    expect(world.snapshot().affordances.petHint).toBeNull();
  });

  it.each(['cat', 'owl', 'toad'])('gives the %s companion the same hidden-card paw cue', (type) => {
    const world = createWorld({
      flags: { ...progression.street, 'ch1.mapUsed': true },
      room: 'ch1.ollivanders',
      pet: { type, name: 'Friend' },
    });
    settleUntil(
      world,
      () => world.snapshot().affordances.petHint?.stage === 'paw',
      PET_HINT_SCHEDULE.periodSeconds,
    );

    const snapshot = world.snapshot();
    expect(snapshot.affordances.petHint).toMatchObject({
      targetId: 'ollivanders.cardMorgana',
      stage: 'paw',
      approach: 1,
    });
    expect(snapshot.pet.type).toBe(type);
    expect(snapshot.pet.secretHint).toEqual(snapshot.affordances.petHint);
    expect(Math.abs(snapshot.pet.x - 1060)).toBeLessThan(1);
  });

  it('turns the pet cue into a stationary look under reduced motion', () => {
    const world = createWorld({
      flags: { ...progression.street, 'ch1.mapUsed': true },
      room: 'ch1.ollivanders',
      pet: { type: 'cat', name: 'Biscuit' },
      reducedMotion: true,
    });
    let snapshot = null;
    for (let time = 0; time < PET_HINT_SCHEDULE.periodSeconds; time += 0.1) {
      world.time = time;
      const candidate = world.snapshot();
      if (candidate.affordances.petHint) {
        snapshot = candidate;
        break;
      }
    }
    expect(snapshot.affordances.petHint).toMatchObject({ stage: 'look', approach: 0 });
    // The old renderer treated its undeclared "curious" token as the idle
    // drawing. Emit the supported identity pose directly so registry-backed
    // rendering preserves that same stationary look without a fallback.
    expect(snapshot.pet.pose).toBe('idle');
    expect(snapshot.pet.x).toBe(world.player.x + 85);
    expect(snapshot.pet.y).toBe(world.player.y);
  });

  it('keeps the secret cue deterministic, rare, faint, and inside the shared glint budget', () => {
    const options = {
      flags: { ...progression.street, 'ch1.mapUsed': true },
      room: 'ch1.ollivanders',
      pet: { type: 'cat', name: 'Biscuit' },
    };
    const world = createWorld(options);
    const replay = createWorld(options);
    const playerAtRest = {
      x: world.player.x,
      y: world.player.y,
      targetX: world.player.targetX,
      facing: world.player.facing,
    };
    let strongestSecretGlint = 0;
    let sawPetAndSecretGlintTogether = false;

    for (let elapsed = 0; elapsed < 27; elapsed += 0.1) {
      world.update(0.1);
      replay.update(0.1);
      const snapshot = world.snapshot();
      const replayed = replay.snapshot();
      expect(snapshot.affordances.petHint).toEqual(replayed.affordances.petHint);
      expect(snapshot.pet).toEqual(replayed.pet);
      expect(snapshot.affordances.glints).toEqual(replayed.affordances.glints);
      assertGlobalGlintBudget(snapshot);

      const secretGlint = snapshot.affordances.glints.find(({ tier }) => tier === 'secret');
      if (secretGlint) strongestSecretGlint = Math.max(strongestSecretGlint, secretGlint.alpha);
      if (secretGlint && snapshot.affordances.petHint) sawPetAndSecretGlintTogether = true;
    }

    const snapshot = world.snapshot();
    const secretStarts = snapshot.affordances.glintActivations
      .filter(({ tier }) => tier === 'secret');
    expect(secretStarts.length).toBeGreaterThanOrEqual(3);
    expect(secretStarts.every(({ duration }) => duration === GLINT_SCHEDULE.secretSeconds)).toBe(true);
    for (let index = 1; index < secretStarts.length; index += 1) {
      expect(secretStarts[index].startedAt - secretStarts[index - 1].startedAt)
        .toBeGreaterThanOrEqual(
          GLINT_SCHEDULE.slotSeconds * GLINT_SCHEDULE.secretEverySlots - 0.2,
        );
    }
    expect(strongestSecretGlint).toBeGreaterThan(0.3);
    expect(strongestSecretGlint).toBeLessThanOrEqual(0.34);
    expect(sawPetAndSecretGlintTogether).toBe(true);
    expect({
      x: world.player.x,
      y: world.player.y,
      targetX: world.player.targetX,
      facing: world.player.facing,
    }).toEqual(playerAtRest);
  });

  it('yields immediately to dialogue, set pieces, and Violet’s own walking command', () => {
    const options = {
      flags: { ...progression.street, 'ch1.mapUsed': true },
      room: 'ch1.ollivanders',
      pet: { type: 'cat', name: 'Biscuit' },
    };
    const activePetWorld = () => {
      const world = createWorld(options);
      settleUntil(world, () => Boolean(world.snapshot().affordances.petHint), PET_HINT_SCHEDULE.periodSeconds);
      return world;
    };

    const dialogueWorld = activePetWorld();
    dialogueWorld.dialogue.open('ch1.wandmaker.welcome');
    const dialogueSnapshot = dialogueWorld.snapshot();
    expect(dialogueSnapshot.affordances).toMatchObject({ quiet: true, worldSuppressed: true });
    expect(dialogueSnapshot.affordances.petHint).toBeNull();
    expect(dialogueSnapshot.affordances.glints).toEqual([]);
    expect(dialogueSnapshot.pet.secretHint).toBeUndefined();

    const setPieceWorld = activePetWorld();
    setPieceWorld.setPieces.start('sp.wandChaos1');
    const setPieceSnapshot = setPieceWorld.snapshot();
    expect(setPieceSnapshot.affordances).toMatchObject({ quiet: true, worldSuppressed: true });
    expect(setPieceSnapshot.affordances.petHint).toBeNull();
    expect(setPieceSnapshot.affordances.glints).toEqual([]);
    expect(setPieceSnapshot.pet.secretHint).toBeUndefined();

    const walkingWorld = activePetWorld();
    const beforeWalk = walkingWorld.snapshot();
    expect(walkingWorld.tap({ x: 500, y: 610 })).toMatchObject({ kind: 'walk', x: 500 });
    walkingWorld.update(0.1);
    const walkingSnapshot = walkingWorld.snapshot();
    expect(walkingSnapshot.player.walking).toBe(true);
    expect(walkingSnapshot.player.targetX).toBe(500);
    expect(walkingSnapshot.player.x).toBeGreaterThan(beforeWalk.player.x);
    expect(walkingSnapshot.affordances).toMatchObject({ quiet: true, worldSuppressed: true });
    expect(walkingSnapshot.affordances.petHint).toBeNull();
    expect(walkingSnapshot.affordances.glints).toEqual([]);
    expect(walkingSnapshot.pet.secretHint).toBeUndefined();
    assertGlobalGlintBudget(walkingSnapshot);
  });
});
