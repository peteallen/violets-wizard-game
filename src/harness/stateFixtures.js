import { createSaveV1, validateSaveV1 } from '../game/systems/Save.js';
import { ImmutableRegistry, assertExactKeys } from './registry.js';

const CONTENT_ID_PATTERN = /^[a-z][A-Za-z0-9]*(?:[.-][A-Za-z0-9]+)*$/;
const FIXED_INSTANT = '2000-01-01T00:00:00.000Z';
const FIXED_SEED = 42;

function assertIntegerInRange(value, min, max, path) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`${path} must be an integer from ${min} through ${max}.`);
  }
}

function assertContentId(value, path) {
  if (typeof value !== 'string' || !CONTENT_ID_PATTERN.test(value)) {
    throw new TypeError(`${path} must be a content identifier.`);
  }
}

export function validateStateFixture(fixture, path = 'state fixture') {
  assertExactKeys(fixture, ['fixtureVersion', 'description', 'entry', 'save'], path);
  if (fixture.fixtureVersion !== 1) throw new TypeError(`${path}.fixtureVersion must be 1.`);
  if (typeof fixture.description !== 'string' || fixture.description.trim() === '') {
    throw new TypeError(`${path}.description must be a non-empty string.`);
  }
  assertExactKeys(fixture.entry, ['chapter', 'scene'], `${path}.entry`);
  assertIntegerInRange(fixture.entry.chapter, 0, 8, `${path}.entry.chapter`);
  assertContentId(fixture.entry.scene, `${path}.entry.scene`);
  validateSaveV1(fixture.save, `${path}.save`);
  return fixture;
}

function createSave({
  chapter = 'ch1',
  scene = 'ch1.letter',
  room = 'ch1.bedroom',
  spawn = 'start',
  highestUnlockedChapter = 1,
  completedChapters = [],
  questFlags = {},
  storyChoices = {},
  wandId = null,
  robeTrim = null,
  pet = null,
  cards = [],
  treasures = [],
  housePoints = 0,
} = {}) {
  const save = createSaveV1({
    now: FIXED_INSTANT,
    appVersion: 'harness-fixture-v1',
    worldSeed: FIXED_SEED,
  });
  save.resume = { chapter, scene, room, spawn };
  save.progress.highestUnlockedChapter = highestUnlockedChapter;
  save.progress.completedChapters = [...completedChapters];
  save.progress.questFlags = { ...questFlags };
  save.progress.storyChoices = structuredClone(storyChoices);
  save.character.wandId = wandId;
  save.character.appearance.robeTrim = robeTrim;
  if (pet) save.character.pet = { ...pet };
  save.collections.cards = [...cards];
  save.collections.treasures = [...treasures];
  save.collections.housePoints = housePoints;
  validateSaveV1(save);
  return save;
}

function createFixture(description, entry, save) {
  return { fixtureVersion: 1, description, entry, save };
}

const throughWandFlags = Object.freeze({
  'ch1.owlTapped': true,
  'ch1.letterOpened': true,
  'ch1.letterRead': true,
  'ch1.guideMet': true,
  'ch1.leakyReached': true,
  'ch1.courtyardReached': true,
  'ch1.wallOpened': true,
  'ch1.diagonReached': true,
  'ch1.satchelReceived': true,
  'ch1.mapUsed': true,
  'ch1.wandTry1': true,
  'ch1.wandTry2': true,
  'ch1.wandChosen': true,
});

const completeChapterFlags = Object.freeze({
  ...throughWandFlags,
  'ch1.trimChosen': true,
  'ch1.petChosen': true,
  'ch1.petNamed': true,
  'ch1.shoppingComplete': true,
  'ch1.ticketReceived': true,
  'ch1.chapterCardSeen': true,
  'ch1.complete': true,
});

const completedProfile = Object.freeze({
  highestUnlockedChapter: 2,
  completedChapters: ['ch1'],
  questFlags: completeChapterFlags,
  storyChoices: {},
  wandId: 'violet-first-wand',
  robeTrim: 'purple',
  pet: { type: 'cat', name: 'Biscuit' },
  cards: ['morgana', 'dumbledore'],
  treasures: [],
  housePoints: 0,
});

const registry = new ImmutableRegistry('state', validateStateFixture);

registry
  .register('foundation', createFixture(
    'The title screen before Violet begins the story.',
    { chapter: 0, scene: 'foundation' },
    createSave(),
  ))
  .register('ch1-start', createFixture(
    'Chapter 1 at the bedroom letter scene before Violet has acted.',
    { chapter: 1, scene: 'ch1.letter' },
    createSave(),
  ))
  .register('ch1-wand-chosen', createFixture(
    'Chapter 1 in Ollivanders immediately after the third wand chooses Violet.',
    { chapter: 1, scene: 'ch1.wandShopping' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'entry',
      questFlags: throughWandFlags,
      wandId: 'violet-first-wand',
    }),
  ))
  .register('ch1-complete', createFixture(
    'The completed Chapter 1 free-roam state with Chapter 2 unlocked.',
    { chapter: 1, scene: 'ch1.freeRoam' },
    createSave({
      ...completedProfile,
      scene: 'ch1.freeRoam',
      room: 'ch1.diagonStreet',
      spawn: 'west',
    }),
  ))
  .register('ch2-placeholder', createFixture(
    'The intentional Chapter 2 preview after Chapter 1 completion.',
    { chapter: 2, scene: 'ch2.placeholder' },
    createSave({
      ...completedProfile,
      chapter: 'ch2',
      scene: 'ch2.placeholder',
      room: 'ch2.previewRoom',
      spawn: 'start',
    }),
  ))
  .seal();

export const STATE_FIXTURE_IDS = registry.ids();

export function getStateFixture(id) {
  return registry.get(id);
}

export function cloneStateFixture(id) {
  return registry.clone(id);
}

export function listStateFixtures() {
  return registry.entries();
}
