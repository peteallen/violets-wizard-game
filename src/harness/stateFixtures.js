import { ImmutableRegistry, assertExactKeys, assertPlainObject } from './registry.js';

const ISO_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CONTENT_ID_PATTERN = /^[a-z][A-Za-z0-9]*(?:[.-][A-Za-z0-9]+)*$/;
const FLAG_ID_PATTERN = /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+$/;
const LEARNING_SETTINGS = new Set(['off', 'gentle', 'stretchy']);
const HOUSES = new Set(['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin']);
const PET_TYPES = new Set(['owl', 'cat', 'toad']);
const FIXED_INSTANT = '2000-01-01T00:00:00.000Z';

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

function assertUniqueContentIds(values, path) {
  if (!Array.isArray(values)) throw new TypeError(`${path} must be an array.`);
  const seen = new Set();
  values.forEach((value, index) => {
    assertContentId(value, `${path}[${index}]`);
    if (seen.has(value)) throw new TypeError(`${path} contains duplicate id "${value}".`);
    seen.add(value);
  });
}

function validateQuestFlags(flags, path) {
  assertPlainObject(flags, path);
  for (const [id, value] of Object.entries(flags)) {
    if (!FLAG_ID_PATTERN.test(id)) throw new TypeError(`${path} has invalid namespaced flag "${id}".`);
    if (typeof value !== 'boolean') throw new TypeError(`${path}.${id} must be boolean.`);
  }
}

function validatePet(pet, path) {
  if (pet === null) return;
  assertExactKeys(pet, ['type', 'name'], path);
  if (!PET_TYPES.has(pet.type)) throw new TypeError(`${path}.type must be owl, cat, or toad.`);
  if (typeof pet.name !== 'string' || pet.name.trim() === '') throw new TypeError(`${path}.name must be a non-empty string.`);
}

function validateSave(save, path) {
  assertExactKeys(save, [
    'schemaVersion',
    'createdAt',
    'updatedAt',
    'chapter',
    'scene',
    'questFlags',
    'spells',
    'house',
    'pet',
    'cards',
    'housePoints',
    'learning',
    'settings',
  ], path);
  if (save.schemaVersion !== 1) throw new TypeError(`${path}.schemaVersion must be 1.`);
  if (!ISO_INSTANT_PATTERN.test(save.createdAt)) throw new TypeError(`${path}.createdAt must be a fixed ISO instant.`);
  if (!ISO_INSTANT_PATTERN.test(save.updatedAt)) throw new TypeError(`${path}.updatedAt must be a fixed ISO instant.`);
  if (save.updatedAt < save.createdAt) throw new TypeError(`${path}.updatedAt cannot precede createdAt.`);
  assertIntegerInRange(save.chapter, 1, 8, `${path}.chapter`);
  assertContentId(save.scene, `${path}.scene`);
  validateQuestFlags(save.questFlags, `${path}.questFlags`);
  assertUniqueContentIds(save.spells, `${path}.spells`);
  if (save.house !== null && !HOUSES.has(save.house)) throw new TypeError(`${path}.house must be null or a known house id.`);
  validatePet(save.pet, `${path}.pet`);
  assertUniqueContentIds(save.cards, `${path}.cards`);
  if (!Number.isInteger(save.housePoints) || save.housePoints < 0) throw new TypeError(`${path}.housePoints must be a non-negative integer.`);
  assertExactKeys(save.learning, ['letterSkill'], `${path}.learning`);
  if (!Number.isInteger(save.learning.letterSkill) || save.learning.letterSkill < 0) {
    throw new TypeError(`${path}.learning.letterSkill must be a non-negative integer.`);
  }
  assertExactKeys(save.settings, ['muted', 'reducedMotion', 'learning'], `${path}.settings`);
  if (typeof save.settings.muted !== 'boolean') throw new TypeError(`${path}.settings.muted must be boolean.`);
  if (typeof save.settings.reducedMotion !== 'boolean') throw new TypeError(`${path}.settings.reducedMotion must be boolean.`);
  if (!LEARNING_SETTINGS.has(save.settings.learning)) {
    throw new TypeError(`${path}.settings.learning must be off, gentle, or stretchy.`);
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
  validateSave(fixture.save, `${path}.save`);
  return fixture;
}

function createSave({ chapter = 1, scene, questFlags = {}, pet = null }) {
  return {
    schemaVersion: 1,
    createdAt: FIXED_INSTANT,
    updatedAt: FIXED_INSTANT,
    chapter,
    scene,
    questFlags,
    spells: [],
    house: null,
    pet,
    cards: [],
    housePoints: 0,
    learning: { letterSkill: 0 },
    settings: { muted: false, reducedMotion: false, learning: 'gentle' },
  };
}

function createFixture(description, entry, save) {
  return { fixtureVersion: 1, description, entry, save };
}

const registry = new ImmutableRegistry('state', validateStateFixture);

registry
  .register('foundation', createFixture(
    'The deterministic foundation screen before story content exists.',
    { chapter: 0, scene: 'foundation' },
    createSave({ scene: 'foundation' }),
  ))
  .register('ch1-start', createFixture(
    'Chapter 1 at the bedroom letter scene before Violet has acted.',
    { chapter: 1, scene: 'bedroomMorning' },
    createSave({ scene: 'bedroomMorning' }),
  ))
  .register('ch1-wand-chosen', createFixture(
    'Chapter 1 in Ollivanders immediately after the third wand chooses Violet.',
    { chapter: 1, scene: 'ollivanders' },
    createSave({
      scene: 'ollivanders',
      questFlags: {
        'ch1.letterOpened': true,
        'ch1.enteredDiagonAlley': true,
        'ch1.wandChosen': true,
      },
    }),
  ))
  .register('ch1-complete', createFixture(
    'The completed Chapter 1 state with Chapter 2 unlocked.',
    { chapter: 1, scene: 'diagonStreetDusk' },
    createSave({
      chapter: 2,
      scene: 'kingsCross',
      pet: { type: 'owl', name: 'Owl' },
      questFlags: {
        'ch1.letterOpened': true,
        'ch1.enteredDiagonAlley': true,
        'ch1.wandChosen': true,
        'ch1.robesChosen': true,
        'ch1.petChosen': true,
        'ch1.complete': true,
      },
    }),
  ))
  .register('ch2-placeholder', createFixture(
    'The placeholder Chapter 2 entry state after Chapter 1 completion.',
    { chapter: 2, scene: 'kingsCross' },
    createSave({
      chapter: 2,
      scene: 'kingsCross',
      pet: { type: 'owl', name: 'Owl' },
      questFlags: {
        'ch1.letterOpened': true,
        'ch1.enteredDiagonAlley': true,
        'ch1.wandChosen': true,
        'ch1.robesChosen': true,
        'ch1.petChosen': true,
        'ch1.complete': true,
      },
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
