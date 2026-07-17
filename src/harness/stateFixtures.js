import { createSaveV1, validateSaveV1 } from '../game/systems/Save.js';
import { assertCharacterId } from '../game/characters/CharacterDefinition.js';
import { productionCharacterReviewCatalog } from './productionCharacterReviewCatalog.js';
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
  assertExactKeys(
    fixture,
    ['fixtureVersion', 'description', 'entry', 'characterDependencies', 'save'],
    path,
  );
  if (fixture.fixtureVersion !== 1) throw new TypeError(`${path}.fixtureVersion must be 1.`);
  if (typeof fixture.description !== 'string' || fixture.description.trim() === '') {
    throw new TypeError(`${path}.description must be a non-empty string.`);
  }
  assertExactKeys(fixture.entry, ['chapter', 'scene'], `${path}.entry`);
  assertIntegerInRange(fixture.entry.chapter, 0, 8, `${path}.entry.chapter`);
  assertContentId(fixture.entry.scene, `${path}.entry.scene`);
  if (!Array.isArray(fixture.characterDependencies)) {
    throw new TypeError(`${path}.characterDependencies must be an array.`);
  }
  const dependencies = new Set();
  fixture.characterDependencies.forEach((characterId, index) => {
    assertCharacterId(characterId, `${path}.characterDependencies[${index}]`);
    if (dependencies.has(characterId)) {
      throw new TypeError(`${path}.characterDependencies[${index}] duplicates ${characterId}.`);
    }
    dependencies.add(characterId);
  });
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
  house = null,
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
  save.character.house = house;
  save.character.wandId = wandId;
  save.character.appearance.robeTrim = robeTrim;
  if (pet) save.character.pet = { ...pet };
  save.collections.cards = [...cards];
  save.collections.treasures = [...treasures];
  save.collections.housePoints = housePoints;
  validateSaveV1(save);
  return save;
}

function createFixture(description, entry, save, characterDependencies = []) {
  return {
    fixtureVersion: 1,
    description,
    entry,
    characterDependencies: [...characterDependencies],
    save,
  };
}

const TITLE_CHARACTERS = Object.freeze(['character.violet', 'character.post-owl']);
const PET_CHARACTERS = Object.freeze([
  'character.cat',
  'character.pet-owl',
  'character.toad',
]);

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

const throughFirstWandFlags = Object.freeze({
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

const chapter2ThroughFriendsFlags = Object.freeze({
  ...completeChapterFlags,
  'ch2.barrierCrossed': true,
  'ch2.boardedTrain': true,
  'ch2.friendsMet': true,
});

const chapter2ThroughTrainFlags = Object.freeze({
  ...chapter2ThroughFriendsFlags,
  'ch2.sweetChosen': true,
  'ch2.sweetReactionSeen': true,
  'ch2.trainComplete': true,
});

const chapter2ThroughSortingQuestionsFlags = Object.freeze({
  ...chapter2ThroughTrainFlags,
  'ch2.lakeSeen': true,
  'ch2.greatHallEntered': true,
  'ch2.sorting.cares.protect': true,
  'ch2.sorting.courage.truth': true,
});

const chapter2ThroughFeastFlags = Object.freeze({
  ...chapter2ThroughSortingQuestionsFlags,
  'ch2.sortedGryffindor': true,
  'ch2.feastAwarded': true,
  'ch2.feastComplete': true,
});

const chapter2StoryChoices = Object.freeze({
  'ch2.choice.sweet': 'every-flavor-beans',
  'ch2.choice.sortingCare': 'protect-friends',
  'ch2.choice.sortingCourage': 'tell-truth',
});

const CHAPTER_TWO_PLAYER = Object.freeze(['character.violet', 'character.cat']);

function chapter2SetPieceFixture({
  id,
  description,
  scene,
  room,
  spawn,
  questFlags,
  storyChoices = chapter2StoryChoices,
  house = null,
  housePoints = 0,
  characterDependencies = CHAPTER_TWO_PLAYER,
}) {
  return createFixture(
    description,
    { chapter: 2, scene: id },
    createSave({
      ...completedProfile,
      chapter: 'ch2',
      scene,
      room,
      spawn,
      questFlags,
      storyChoices,
      house,
      housePoints,
    }),
    characterDependencies,
  );
}

const registry = new ImmutableRegistry('state', validateStateFixture);

function completedSurfaceFixture(id, description) {
  return createFixture(
    description,
    { chapter: 1, scene: id },
    createSave({
      ...completedProfile,
      scene: 'ch1.freeRoam',
      room: 'ch1.diagonStreet',
      spawn: 'west',
    }),
  );
}

function characterReviewFixture(id, description, characterDependencies = []) {
  const registeredDependencies = productionCharacterReviewCatalog.get(id)?.characterDependencies;
  return createFixture(
    description,
    { chapter: 0, scene: id },
    createSave(),
    registeredDependencies ?? characterDependencies,
  );
}

registry
  .register('foundation', createFixture(
    'The integrated code-only storybook title before Violet begins, with the castle and lake illustration, Violet and her owl, and the new-player envelope.',
    { chapter: 0, scene: 'foundation' },
    createSave(),
    TITLE_CHARACTERS,
  ))
  .register('foundation-saved-review', createFixture(
    'The integrated code-only storybook title with meaningful progress, showing the returning-player envelope over the castle and lake illustration.',
    { chapter: 0, scene: 'foundation-saved-review' },
    createSave({ questFlags: { 'ch1.owlTapped': true } }),
    TITLE_CHARACTERS,
  ))
  .register('ch1-start', createFixture(
    'Chapter 1 at the bedroom letter scene before Violet has acted.',
    { chapter: 1, scene: 'ch1.letter' },
    createSave(),
  ))
  .register('ch1-follow-hagrid-review', createFixture(
    'Hagrid leaving through Violet’s bedroom door after his introduction, with a sparkle-footprint path left behind for her to follow.',
    { chapter: 1, scene: 'ch1-follow-hagrid-review' },
    createSave({
      scene: 'ch1.followHagridReview',
      room: 'ch1.bedroom',
      spawn: 'bedroom.letter',
      questFlags: {
        'ch1.owlTapped': true,
        'ch1.letterOpened': true,
        'ch1.letterRead': true,
        'ch1.guideMet': true,
      },
    }),
  ))
  .register('ch1-follow-hagrid-leaky-review', createFixture(
    'Hagrid preemptively leaving the Leaky Cauldron through the courtyard door after “This way!”, while Violet remains behind to follow his sparkle footprints.',
    { chapter: 1, scene: 'ch1-follow-hagrid-leaky-review' },
    createSave({
      scene: 'ch1.followHagridLeakyReview',
      room: 'ch1.leaky',
      spawn: 'leaky.entry',
      questFlags: {
        'ch1.owlTapped': true,
        'ch1.letterOpened': true,
        'ch1.letterRead': true,
        'ch1.guideMet': true,
        'ch1.leakyReached': true,
      },
    }),
  ))
  .register('world-shimmer-review', createFixture(
    'Ollivanders with one golden thread on the current wand, a staggered exit glint, and a rare hidden Frog-card glint.',
    { chapter: 1, scene: 'world-shimmer-review' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'ollivanders.entry',
      questFlags: {
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
      },
    }),
  ))
  .register('world-shimmer-hint-review', createFixture(
    'The same Ollivanders moment with only the existing golden thread strengthened by the hint ladder.',
    { chapter: 1, scene: 'world-shimmer-hint-review' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'ollivanders.entry',
      questFlags: {
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
      },
    }),
  ))
  .register('world-secret-pet-review', createFixture(
    'Ollivanders with Violet’s cat present to wander toward and paw at the still-hidden Frog card.',
    { chapter: 1, scene: 'world-secret-pet-review' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'ollivanders.entry',
      pet: { type: 'cat', name: 'Biscuit' },
      questFlags: {
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
      },
    }),
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
  .register('sp-letter-open-review', createFixture(
    'The delivered letter at the start of its seal-crack, unfold, and readable invitation sequence.',
    { chapter: 1, scene: 'sp-letter-open-review' },
    createSave({
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      spawn: 'bedroom.letter',
      questFlags: { 'ch1.owlTapped': true },
    }),
  ))
  .register('transition-ink-review', createFixture(
    'Violet walking through Ollivanders’ open doorway before the shop gives way to Diagon Alley in the organic ink reveal.',
    { chapter: 1, scene: 'transition-ink-review' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'wandmaker',
      questFlags: {
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
        'ch1.wandChosen': true,
      },
    }),
  ))
  .register('transition-sparkle-review', createFixture(
    'Map travel from Diagon Alley to Ollivanders, staged for the sparkle-cover ink reveal.',
    { chapter: 1, scene: 'transition-sparkle-review' },
    createSave({
      scene: 'ch1.diagonArrival',
      room: 'ch1.diagonStreet',
      spawn: 'west',
      questFlags: {
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
    }),
  ))
  .register('sp-brick-wall-review', createFixture(
    'The courtyard wall staged for its ten-by-eight, individual-brick center-out reveal.',
    { chapter: 1, scene: 'sp-brick-wall-review' },
    createSave({
      scene: 'ch1.wallOpening',
      room: 'ch1.courtyard',
      spawn: 'courtyard.guide',
      questFlags: {
        'ch1.owlTapped': true,
        'ch1.letterOpened': true,
        'ch1.letterRead': true,
        'ch1.guideMet': true,
        'ch1.leakyReached': true,
        'ch1.courtyardReached': true,
      },
    }),
  ))
  .register('sp-wand-vase-review', createFixture(
    'The second wrong wand staged with its authored vase wobble, shatter, bounce, and settle.',
    { chapter: 1, scene: 'sp-wand-vase-review' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'ollivanders.wandmaker',
      questFlags: throughFirstWandFlags,
    }),
  ))
  .register('sp-wand-chosen-review', createFixture(
    'The chosen wand staged for its complete golden visual and audio-friendly crescendo.',
    { chapter: 1, scene: 'sp-wand-chosen-review' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'ollivanders.wandmaker',
      questFlags: { ...throughFirstWandFlags, 'ch1.wandTry2': true },
      wandId: 'violet-first-wand',
    }),
  ))
  .register('sp-ch2-barrier-run-review', chapter2SetPieceFixture({
    id: 'sp-ch2-barrier-run-review',
    description: 'Violet at the ordinary King’s Cross barrier immediately before her comic run and the opaque platform reveal.',
    scene: 'ch2.scene.kingsCross',
    room: 'ch2.kingsCross',
    spawn: 'barrier',
    questFlags: completeChapterFlags,
    storyChoices: {},
    characterDependencies: [
      ...CHAPTER_TWO_PLAYER,
      'character.conductor',
    ],
  }))
  .register('sp-ch2-sweet-reaction-review', chapter2SetPieceFixture({
    id: 'sp-ch2-sweet-reaction-review',
    description: 'Violet beside the sweets trolley immediately after choosing an Every-Flavour Bean and before her playful silent reaction.',
    scene: 'ch2.scene.trolleySweets',
    room: 'ch2.trainCompartment',
    spawn: 'window',
    questFlags: {
      ...chapter2ThroughFriendsFlags,
      'ch2.sweetChosen': true,
    },
    characterDependencies: [
      ...CHAPTER_TWO_PLAYER,
      'character.harry-potter',
      'character.ron-weasley',
      'character.hermione-granger',
      'character.trolley-witch',
    ],
  }))
  .register('sp-ch2-lake-vista-review', chapter2SetPieceFixture({
    id: 'sp-ch2-lake-vista-review',
    description: 'Violet arriving at the dark lake before the castle vista receives its quiet storybook hold.',
    scene: 'ch2.scene.lakeVista',
    room: 'ch2.lakeVista',
    spawn: 'vista',
    questFlags: chapter2ThroughTrainFlags,
  }))
  .register('sp-ch2-sorting-reveal-review', chapter2SetPieceFixture({
    id: 'sp-ch2-sorting-reveal-review',
    description: 'Violet beneath the Sorting Hat after her canonical courage answers and immediately before the Gryffindor reveal.',
    scene: 'ch2.scene.sorting',
    room: 'ch2.greatHall',
    spawn: 'sorting',
    questFlags: chapter2ThroughSortingQuestionsFlags,
    characterDependencies: [
      ...CHAPTER_TWO_PLAYER,
      'character.deputy-head',
      'character.sorting-hat',
      'character.headmaster',
    ],
  }))
  .register('sp-ch2-common-room-arrival-review', chapter2SetPieceFixture({
    id: 'sp-ch2-common-room-arrival-review',
    description: 'Gryffindor Violet at the portrait entrance immediately before her friends welcome her into the common room.',
    scene: 'ch2.scene.commonRoomArrival',
    room: 'ch2.gryffindorCommonRoom',
    spawn: 'portraitDoor',
    questFlags: chapter2ThroughFeastFlags,
    house: 'gryffindor',
    housePoints: 10,
    characterDependencies: [
      ...CHAPTER_TWO_PLAYER,
      'character.harry-potter',
      'character.ron-weasley',
      'character.hermione-granger',
    ],
  }))
  .register('sp-ch2-chapter-card-review', chapter2SetPieceFixture({
    id: 'sp-ch2-chapter-card-review',
    description: 'Violet’s completed Gryffindor arrival staged immediately before the Chapter Two page turns toward first classes.',
    scene: 'ch2.scene.chapterCard',
    room: 'ch2.chapterCardRoom',
    spawn: 'start',
    questFlags: {
      ...chapter2ThroughFeastFlags,
      'ch2.commonRoomArrived': true,
    },
    house: 'gryffindor',
    housePoints: 10,
    characterDependencies: [
      ...CHAPTER_TWO_PLAYER,
      'character.narrator',
    ],
  }))
  .register('parent-panel', completedSurfaceFixture(
    'parent-panel',
    'The grown-up book on its safe chapter replay and yearbook page.',
  ))
  .register('parent-settings', completedSurfaceFixture(
    'parent-settings',
    'The grown-up sound, movement, and learning controls.',
  ))
  .register('parent-save', completedSurfaceFixture(
    'parent-save',
    'The grown-up save transfer, recovery, and Start Over controls.',
  ))
  .register('parent-confirm', completedSurfaceFixture(
    'parent-confirm',
    'The deliberate second confirmation guarding Start Over.',
  ))
  .register('parent-yearbook', completedSurfaceFixture(
    'parent-yearbook',
    'Violet’s yearbook before its first captured golden moment.',
  ))
  .register('save-transfer', completedSurfaceFixture(
    'save-transfer',
    'The accessible save export transfer dialog over the game.',
  ))
  .register('pet-name-dialog', completedSurfaceFixture(
    'pet-name-dialog',
    'The parent-assisted custom pet naming dialog over Violet’s current adventure.',
  ))
  .register('character-cast-review', characterReviewFixture(
    'character-cast-review',
    'The full Chapter One cast together at their real in-world rendering scale.',
  ))
  .register('character-pets-review', characterReviewFixture(
    'character-pets-review',
    'All three companion choices enlarged enough to review follow motion and material detail.',
  ))
  .register('character-portraits-review', characterReviewFixture(
    'character-portraits-review',
    'Every dialogue cameo produced from the same illustrated puppet family.',
  ))
  .register('owl-motion-review', characterReviewFixture(
    'owl-motion-review',
    'The hero owl shown across every shipped pose at gameplay scale.',
  ))
  .register('hagrid-sprite-review', characterReviewFixture(
    'hagrid-sprite-review',
    'Hagrid’s production full-frame neutral, blink, speaking, and two walking directions.',
  ))
  .register('wandmaker-sprite-review', characterReviewFixture(
    'wandmaker-sprite-review',
    'The Wandmaker’s production full-frame neutral, blink, and two speaking mouth shapes.',
  ))
  .register('wandmaker-live-review', createFixture(
    'The generated Wandmaker welcoming Violet in normal Ollivanders gameplay.',
    { chapter: 1, scene: 'ch1.wandShopping' },
    createSave({
      scene: 'ch1.wandShopping',
      room: 'ch1.ollivanders',
      spawn: 'ollivanders.entry',
      questFlags: {
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
      },
    }),
  ))
  .register('madam-malkin-sprite-review', characterReviewFixture(
    'madam-malkin-sprite-review',
    'Madam Malkin’s production full-frame neutral, blink, and two speaking mouth shapes.',
  ))
  .register('madam-malkin-live-review', createFixture(
    'The generated Madam Malkin welcoming Violet in normal robe-shop gameplay.',
    { chapter: 1, scene: 'ch1.robeShopping' },
    createSave({
      scene: 'ch1.robeShopping',
      room: 'ch1.malkins',
      spawn: 'malkins.entry',
      questFlags: {
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
        'ch1.wandChosen': true,
      },
    }),
  ))
  .register('menagerie-keeper-sprite-review', characterReviewFixture(
    'menagerie-keeper-sprite-review',
    'The Menagerie Keeper’s production full-frame neutral, blink, and two speaking mouth shapes.',
  ))
  .register('menagerie-keeper-live-review', createFixture(
    'The generated Menagerie Keeper welcoming Violet in normal animal-shop gameplay.',
    { chapter: 1, scene: 'ch1.petShopping' },
    createSave({
      scene: 'ch1.petShopping',
      room: 'ch1.menagerie',
      spawn: 'menagerie.entry',
      questFlags: {
        ...throughWandFlags,
        'ch1.trimChosen': true,
      },
      wandId: 'violet-first-wand',
      robeTrim: 'purple',
    }),
  ))
  .register('violet-expression-review', characterReviewFixture(
    'violet-expression-review',
    'The owner-approved aligned Violet shown in every accepted neutral and facial-expression state, as both portraits and grounded full figures.',
  ))
  .register('ui-dialogue-review', characterReviewFixture(
    'ui-dialogue-review',
    'The illustrated dialogue parchment, animated Hagrid cameo, short caption, and replay control.',
    ['character.hagrid'],
  ))
  .register('ui-dialogue-night-review', characterReviewFixture(
    'ui-dialogue-night-review',
    'The warm-dark dialogue scroll opposite its active speaker in a night-painted room.',
    ['character.wandmaker'],
  ))
  .register('ui-dialogue-center-review', characterReviewFixture(
    'ui-dialogue-center-review',
    'The narrowed narrated scroll beside a centered, silent Violet with the longest shipped caption.',
    ['character.violet', 'character.narrator'],
  ))
  .register('ui-dialogue-live-review', createFixture(
    'The adaptive dialogue scroll opposite Hagrid in Violet’s painted bedroom.',
    { chapter: 1, scene: 'ui-dialogue-live-review' },
    createSave({
      scene: 'ch1.guideArrival',
      room: 'ch1.bedroom',
      spawn: 'letter',
      questFlags: {
        'ch1.owlTapped': true,
        'ch1.letterOpened': true,
        'ch1.letterRead': true,
      },
    }),
  ))
  .register('ui-dialogue-night-live-review', createFixture(
    'The warm-dark dialogue scroll opposite Hagrid in the painted dusk street.',
    { chapter: 1, scene: 'ui-dialogue-night-live-review' },
    createSave({
      scene: 'ch1.ticket',
      room: 'ch1.diagonStreet',
      // Normal Chapter One returns Violet from the Menagerie on the east.
      // Keeping the live review on that real route lets her approach Hagrid
      // without the artificial west-to-east crossing through his footprint.
      spawn: 'east',
      questFlags: {
        ...throughWandFlags,
        'ch1.trimChosen': true,
        'ch1.petChosen': true,
        'ch1.petNamed': true,
        'ch1.shoppingComplete': true,
      },
      wandId: 'violet-first-wand',
      robeTrim: 'purple',
      pet: { type: 'cat', name: 'Biscuit' },
    }),
  ))
  .register('ui-letter-reading-review', characterReviewFixture(
    'ui-letter-reading-review',
    'The fully opened Hogwarts invitation held until Violet chooses to hear it read aloud.',
  ))
  .register('ui-robe-picker-review', createFixture(
    'The real dressing-mirror robe picker with a full-body Violet preview, all twelve trims, and Gold selected but not yet committed.',
    { chapter: 1, scene: 'ui-robe-picker-review' },
    createSave({
      scene: 'ch1.robeShopping',
      room: 'ch1.malkins',
      spawn: 'malkins.entry',
      questFlags: throughWandFlags,
      wandId: 'violet-first-wand',
    }),
    ['character.violet'],
  ))
  .register('ui-choices-review', characterReviewFixture(
    'ui-choices-review',
    'Three authored companion choice cards without font-glyph stand-ins.',
    PET_CHARACTERS,
  ))
  .register('ui-satchel-map-review', characterReviewFixture(
    'ui-satchel-map-review',
    'The open storybook satchel with the code-only illustrated Diagon Alley map, soft locked-place fog, and its D31 objective shimmer.',
  ))
  .register('ui-satchel-cards-review', characterReviewFixture(
    'ui-satchel-cards-review',
    'The satchel card album with its grown-up brass keyhole above the keepsakes.',
  ))
  .register('ui-objective-review', characterReviewFixture(
    'ui-objective-review',
    'The enchanted-compass objective page with owl ornament.',
  ))
  .register('ui-chapter-card-review', characterReviewFixture(
    'ui-chapter-card-review',
    'The illustrated Chapter One completion page and invitation action.',
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
