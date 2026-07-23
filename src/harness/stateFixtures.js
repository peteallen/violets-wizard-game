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

const chapter3BaseFlags = Object.freeze({
  ...chapter2ThroughFeastFlags,
  'ch2.commonRoomArrived': true,
  'ch2.chapterCardSeen': true,
  'ch2.complete': true,
});

const chapter3SpellbookFlags = Object.freeze({
  ...chapter3BaseFlags,
  'ch3.spellbookOpened': true,
});

const chapter3LumosFlags = Object.freeze({
  ...chapter3SpellbookFlags,
  'ch3.lumosLearned': true,
});

const chapter3LumosProvedFlags = Object.freeze({
  ...chapter3LumosFlags,
  'ch3.lumosProved': true,
});

const chapter3LeviosaFlags = Object.freeze({
  ...chapter3LumosProvedFlags,
  'ch3.leviosaLearned': true,
});

const chapter3QuestFlags = Object.freeze({
  ...chapter3LeviosaFlags,
  'ch3.toadQuestAccepted': true,
});

const chapter3TrailFlags = Object.freeze({
  ...chapter3QuestFlags,
  'ch3.trailFound': true,
});

const chapter3ClueFlags = Object.freeze({
  ...chapter3TrailFlags,
  'ch3.corridorRibbonFound': true,
  'ch3.corridorClueFound': true,
});

const chapter3TrevorRevealedFlags = Object.freeze({
  ...chapter3ClueFlags,
  'ch3.toadRevealed': true,
});

const chapter3TrevorFoundFlags = Object.freeze({
  ...chapter3TrevorRevealedFlags,
  'ch3.toadFound': true,
});

const chapter3TrevorReturnedFlags = Object.freeze({
  ...chapter3TrevorFoundFlags,
  'ch3.toadReturned': true,
});

const chapter3GhostFlags = Object.freeze({
  ...chapter3TrevorReturnedFlags,
  'ch3.ghostBookAccepted': true,
});

const CHAPTER_THREE_PLAYER = Object.freeze(['character.violet', 'character.cat']);
const CHAPTER_THREE_BASE_CARDS = Object.freeze([
  'morgana',
  'dumbledore',
  'merlin',
  'jocunda-sykes',
]);
const CHAPTER_THREE_SPELLS = Object.freeze(['lumos', 'leviosa']);
const CHAPTER_THREE_LEARNING_BEATS = Object.freeze([
  'ch3.learning.lumos',
  'ch3.learning.leviosa',
]);

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

function chapter3ReviewFixture({
  id,
  description,
  scene,
  room,
  spawn,
  questFlags = chapter3BaseFlags,
  knownSpells = [],
  completedBeats = [],
  phonicsSkill = completedBeats.length,
  spellStats = {},
  cards = CHAPTER_THREE_BASE_CARDS,
  treasures = [],
  housePoints = 10,
  pet = completedProfile.pet,
  characterDependencies = CHAPTER_THREE_PLAYER,
}) {
  const save = createSave({
    ...completedProfile,
    chapter: 'ch3',
    scene,
    room,
    spawn,
    highestUnlockedChapter: 3,
    completedChapters: ['ch1', 'ch2'],
    questFlags,
    storyChoices: chapter2StoryChoices,
    house: 'gryffindor',
    pet,
    cards,
    treasures,
    housePoints,
  });
  save.spellbook.known = [...knownSpells];
  save.spellbook.stats = Object.fromEntries(knownSpells.map((spellId) => [
    spellId,
    structuredClone(spellStats[spellId] ?? { casts: 0, masteryTier: 0 }),
  ]));
  save.learning.completedBeats = [...completedBeats];
  save.learning.phonicsSkill = phonicsSkill;
  return createFixture(
    description,
    { chapter: 3, scene: id },
    save,
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

function petChoiceReviewFixture(description) {
  return createFixture(
    description,
    { chapter: 1, scene: 'ch1.petShopping' },
    createSave({
      scene: 'ch1.petShopping',
      room: 'ch1.menagerie',
      spawn: 'keeper',
      questFlags: {
        ...throughWandFlags,
        'ch1.trimChosen': true,
      },
      wandId: 'violet-first-wand',
      robeTrim: 'purple',
    }),
    PET_CHARACTERS,
  );
}

registry
  .register('boot-loading-review', createFixture(
    'The dependency-free storybook surface while the production presentation is still loading.',
    { chapter: 0, scene: 'boot-loading-review' },
    createSave(),
  ))
  .register('boot-failure-review', createFixture(
    'The dependency-free storybook failure surface with its explicit retry action.',
    { chapter: 0, scene: 'boot-failure-review' },
    createSave(),
  ))
  .register('composition-loading-review', createFixture(
    'The production in-game composition overlay while a newly visible picture is preparing.',
    { chapter: 1, scene: 'composition-loading-review' },
    createSave(),
    TITLE_CHARACTERS,
  ))
  .register('composition-failure-review', createFixture(
    'The production in-game composition overlay after a visible picture fails, with its retry instruction.',
    { chapter: 1, scene: 'composition-failure-review' },
    createSave(),
    TITLE_CHARACTERS,
  ))
  .register('foundation', createFixture(
    'The painted storybook castle-and-lake title before Violet begins, with live Violet, owl, and new-player envelope layers.',
    { chapter: 0, scene: 'foundation' },
    createSave(),
    TITLE_CHARACTERS,
  ))
  .register('foundation-saved-review', createFixture(
    'The painted storybook castle-and-lake title with meaningful progress, showing live Violet, owl, and returning-player envelope layers.',
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
    'The courtyard stays intact while its ten-by-eight wall opens onto Diagon Alley, before the revealed street expands to replace the room.',
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
  .register('sp-ch3-spellbook-reveal-review', chapter3ReviewFixture({
    id: 'sp-ch3-spellbook-reveal-review',
    description: 'The autumn common-room owl post staged immediately before Violet’s wrapped spellbook opens into its empty illustrated spread.',
    scene: 'ch3.scene.spellbookParcel',
    room: 'ch3.commonRoom',
    spawn: 'parcel',
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.post-owl',
    ],
  }))
  .register('learning-ch3-lumos-review', chapter3ReviewFixture({
    id: 'learning-ch3-lumos-review',
    description: 'The real Charms lesson after the first Lumos rune lands, with five recessed slots, one guided match, a charging wand, and Professor Flitwick in the painted classroom.',
    scene: 'ch3.scene.lumosClass',
    room: 'ch3.charmsClassroom',
    spawn: 'map',
    questFlags: chapter3SpellbookFlags,
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.flitwick',
    ],
  }))
  .register('ui-ch3-spellbook-review', chapter3ReviewFixture({
    id: 'ui-ch3-spellbook-review',
    description: 'The real Lumos learning reward opened to its permanent illustrated spell detail after all five runes land.',
    scene: 'ch3.scene.lumosClass',
    room: 'ch3.charmsClassroom',
    spawn: 'map',
    questFlags: chapter3SpellbookFlags,
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.flitwick',
    ],
  }))
  .register('sp-ch3-lumos-bloom-review', chapter3ReviewFixture({
    id: 'sp-ch3-lumos-bloom-review',
    description: 'The Charms classroom staged for Violet’s first free Lumos cast, with the lantern answering her warm-white wand light.',
    scene: 'ch3.scene.lumosClass',
    room: 'ch3.charmsClassroom',
    spawn: 'map',
    questFlags: chapter3LumosFlags,
    knownSpells: ['lumos'],
    completedBeats: ['ch3.learning.lumos'],
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.flitwick',
    ],
  }))
  .register('learning-ch3-leviosa-review', chapter3ReviewFixture({
    id: 'learning-ch3-leviosa-review',
    description: 'The real Charms chant midway through Wingardium Leviosa, with landed syllables, the remaining spoken tiles, and a visibly rising feather.',
    scene: 'ch3.scene.leviosaClass',
    room: 'ch3.charmsClassroom',
    spawn: 'lesson',
    questFlags: chapter3LumosProvedFlags,
    knownSpells: ['lumos'],
    completedBeats: ['ch3.learning.lumos'],
    spellStats: { lumos: { casts: 1, masteryTier: 1 } },
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.flitwick',
    ],
  }))
  .register('sp-ch3-leviosa-feather-review', chapter3ReviewFixture({
    id: 'sp-ch3-leviosa-feather-review',
    description: 'The live post-learning Charms state staged for the completed Leviosa feather sail, with Flitwick’s celebration and worried Neville already present as in normal play.',
    scene: 'ch3.scene.trevorMissing',
    room: 'ch3.charmsClassroom',
    spawn: 'lesson',
    questFlags: chapter3LeviosaFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 1, masteryTier: 1 } },
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.flitwick',
      'character.neville',
    ],
  }))
  .register('ui-ch3-map-review', chapter3ReviewFixture({
    id: 'ui-ch3-map-review',
    description: 'The live five-destination castle map after the first corridor trail is found, with completed rooms, the second corridor marked Next, and later rooms still misted.',
    scene: 'ch3.scene.corridorTwo',
    room: 'ch3.corridorTwo',
    spawn: 'map',
    questFlags: chapter3TrailFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 2, masteryTier: 1 } },
  }))
  .register('sp-ch3-corridor-one-reveal-review', chapter3ReviewFixture({
    id: 'sp-ch3-corridor-one-reveal-review',
    description: 'The first velvet-blue corridor staged for Lumos to reveal a small wet footprint trail inside one soft pool of light.',
    scene: 'ch3.scene.corridorOne',
    room: 'ch3.corridorOne',
    spawn: 'map',
    questFlags: chapter3QuestFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 1, masteryTier: 1 } },
  }))
  .register('ui-ch3-corridor-two-lumos-review', chapter3ReviewFixture({
    id: 'ui-ch3-corridor-two-lumos-review',
    description: 'The second night corridor with Violet’s two-spell wand fan in Lumos targeting mode, keeping both worthwhile alcoves and the ribbon clue readable.',
    scene: 'ch3.scene.corridorTwo',
    room: 'ch3.corridorTwo',
    spawn: 'map',
    questFlags: chapter3TrailFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 2, masteryTier: 1 } },
  }))
  .register('ui-ch3-corridor-three-lumos-review', chapter3ReviewFixture({
    id: 'ui-ch3-corridor-three-lumos-review',
    description: 'The third night corridor in Lumos targeting mode, with armor, curtain, and reflected eyes remaining three distinct cozy hiding shapes.',
    scene: 'ch3.scene.corridorThree',
    room: 'ch3.corridorThree',
    spawn: 'map',
    questFlags: chapter3ClueFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 3, masteryTier: 1 } },
  }))
  .register('sp-ch3-trevor-reveal-review', chapter3ReviewFixture({
    id: 'sp-ch3-trevor-reveal-review',
    description: 'The third corridor staged for reflected eyes to resolve into the distinct Trevor identity after a valid Lumos cast.',
    scene: 'ch3.scene.corridorThree',
    room: 'ch3.corridorThree',
    spawn: 'map',
    questFlags: chapter3ClueFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 3, masteryTier: 1 } },
    pet: { type: 'toad', name: 'Pebble' },
    characterDependencies: [
      'character.violet',
      'character.toad',
      'character.trevor',
    ],
  }))
  .register('sp-ch3-trevor-found-review', chapter3ReviewFixture({
    id: 'sp-ch3-trevor-found-review',
    description: 'Revealed Trevor staged for his short hop, one indignant croak, and live Found Trevor celebration beside silent Violet.',
    scene: 'ch3.scene.corridorThree',
    room: 'ch3.corridorThree',
    spawn: 'map',
    questFlags: chapter3TrevorRevealedFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 4, masteryTier: 1 } },
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.trevor',
    ],
  }))
  .register('sp-ch3-trevor-reunion-review', chapter3ReviewFixture({
    id: 'sp-ch3-trevor-reunion-review',
    description: 'Neville and Trevor staged for their relieved reunion, exactly ten new house points, and one restrained toad-token reward beat.',
    scene: 'ch3.scene.returnTrevor',
    room: 'ch3.corridorOne',
    spawn: 'return',
    questFlags: chapter3TrevorFoundFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 4, masteryTier: 1 } },
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.neville',
      'character.trevor',
    ],
  }))
  .register('room-ch3-friendly-ghost-review', chapter3ReviewFixture({
    id: 'room-ch3-friendly-ghost-review',
    description: 'The friendly unnamed ghost emerging beside his torn book in the first corridor after Trevor is safely returned.',
    scene: 'ch3.scene.returnTrevor',
    room: 'ch3.corridorOne',
    spawn: 'return',
    questFlags: chapter3TrevorReturnedFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 4, masteryTier: 1 } },
    treasures: ['treasure.ch3.toad-token'],
    housePoints: 20,
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.neville',
      'character.friendly-ghost',
    ],
  }))
  .register('ui-ch3-quest-journal-review', chapter3ReviewFixture({
    id: 'ui-ch3-quest-journal-review',
    description: 'The live quest journal after the ghost’s request, with the gold main chapter thread and sleeping silver Fix the book promise visibly separate.',
    scene: 'ch3.scene.returnTrevor',
    room: 'ch3.corridorOne',
    spawn: 'return',
    questFlags: chapter3GhostFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 4, masteryTier: 1 } },
    cards: [...CHAPTER_THREE_BASE_CARDS, 'bertie-bott'],
    treasures: ['treasure.ch3.toad-token'],
    housePoints: 20,
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
      'character.neville',
      'character.friendly-ghost',
    ],
  }))
  .register('ui-ch3-cards-review', chapter3ReviewFixture({
    id: 'ui-ch3-cards-review',
    description: 'The live second card-album page showing the earned Circe and Bertie Bott paintings from Chapter Three.',
    scene: 'ch3.scene.returnTrevor',
    room: 'ch3.corridorOne',
    spawn: 'return',
    questFlags: {
      ...chapter3GhostFlags,
      'ch3.corridorCardFound': true,
    },
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 4, masteryTier: 1 } },
    cards: [...CHAPTER_THREE_BASE_CARDS, 'circe', 'bertie-bott'],
    treasures: ['treasure.ch3.toad-token'],
    housePoints: 20,
  }))
  .register('sp-ch3-chapter-close-review', chapter3ReviewFixture({
    id: 'sp-ch3-chapter-close-review',
    description: 'The autumn common room staged for Lumos and Leviosa to appear together beneath Violet’s First Spells before the flying preview.',
    scene: 'ch3.scene.chapterClose',
    room: 'ch3.commonRoom',
    spawn: 'close',
    questFlags: chapter3GhostFlags,
    knownSpells: CHAPTER_THREE_SPELLS,
    completedBeats: CHAPTER_THREE_LEARNING_BEATS,
    spellStats: { lumos: { casts: 4, masteryTier: 1 } },
    cards: [...CHAPTER_THREE_BASE_CARDS, 'circe', 'bertie-bott'],
    treasures: ['treasure.ch3.toad-token'],
    housePoints: 20,
    characterDependencies: [
      ...CHAPTER_THREE_PLAYER,
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
  .register('flitwick-sprite-review', characterReviewFixture(
    'flitwick-sprite-review',
    'Professor Flitwick’s production dialogue portraits and full-body teaching, casting, and celebration actions.',
  ))
  .register('neville-sprite-review', characterReviewFixture(
    'neville-sprite-review',
    'Neville’s production dialogue portraits and full-body worried, relieved, and Trevor-reunion states.',
  ))
  .register('trevor-sprite-review', characterReviewFixture(
    'trevor-sprite-review',
    'Trevor’s production portrait, reflected-eye reveal, croak, hop, held, and reunion states.',
  ))
  .register('friendly-ghost-sprite-review', characterReviewFixture(
    'friendly-ghost-sprite-review',
    'The unnamed friendly ghost’s production portrait, emergence, dialogue, listening-reward, and delighted states.',
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
      pet: { type: 'owl', name: 'Moonbeam' },
    }),
  ))
  .register('ui-letter-reading-review', createFixture(
    'The real Chapter One bedroom with Violet beside the opened invitation and both painted reading actions.',
    { chapter: 1, scene: 'ch1.letter' },
    createSave({
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      spawn: 'bedroom.letter',
      questFlags: { 'ch1.owlTapped': true },
    }),
  ))
  .register('ui-letter-reading-playing-review', createFixture(
    'The real Chapter One bedroom with the optional letter narration visibly active while the invitation and continuation stay available.',
    { chapter: 1, scene: 'ch1.letter' },
    createSave({
      scene: 'ch1.letter',
      room: 'ch1.bedroom',
      spawn: 'bedroom.letter',
      questFlags: { 'ch1.owlTapped': true },
    }),
  ))
  .register('ui-pet-name-welcome-review', createFixture(
    'The Menagerie Keeper’s post-name welcome for Juniper beside Violet and her newly named owl.',
    { chapter: 1, scene: 'ch1.petShopping' },
    createSave({
      scene: 'ch1.petShopping',
      room: 'ch1.menagerie',
      spawn: 'keeper',
      questFlags: {
        ...throughWandFlags,
        'ch1.trimChosen': true,
      },
      wandId: 'violet-first-wand',
      robeTrim: 'lavender',
    }),
    ['character.violet', 'character.menagerie-keeper', 'character.pet-owl'],
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
  .register('ui-choices-review', petChoiceReviewFixture(
    'The real Chapter One companion choice with three live pet puppets on painted cards.',
  ))
  .register('ui-choice-icons-review', petChoiceReviewFixture(
    'The real Chapter One companion confirmation with two code-drawn icon choices on painted cards.',
  ))
  .register('ui-satchel-map-early-review', characterReviewFixture(
    'ui-satchel-map-early-review',
    'The early Chapter One travel journal with painted destinations, two softly fogged shops, and Ollivanders marked Next.',
  ))
  .register('ui-satchel-map-review', characterReviewFixture(
    'ui-satchel-map-review',
    'The late Chapter One travel journal with four painted destinations, completed stops, and Menagerie marked Next.',
  ))
  .register('ui-satchel-cards-review', characterReviewFixture(
    'ui-satchel-cards-review',
    'The Chapter One card album with Map navigation and its grown-up brass keyhole beside the keepsakes.',
  ))
  .register('ui-satchel-ch2-cards-review', characterReviewFixture(
    'ui-satchel-ch2-cards-review',
    'The Chapter Two cards-only satchel with three earned keepsakes and no misleading Map bookmark.',
  ))
  .register('ui-satchel-ch3-cards-review', characterReviewFixture(
    'ui-satchel-ch3-cards-review',
    'The Chapter Three cards-only satchel with the complete four-card collection and no misleading Map bookmark.',
  ))
  .register('ui-objective-review', createFixture(
    'The compact objective reminder opened over the live Chapter One street after Violet receives her satchel.',
    { chapter: 1, scene: 'ch1.diagonArrival' },
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
    ['character.violet', 'character.hagrid'],
  ))
  .register('ui-chapter-card-review', createFixture(
    'The real Chapter One platform painting with its compact railway plaque and separate Continue note.',
    { chapter: 1, scene: 'ch1.chapterCard' },
    createSave({
      scene: 'ch1.chapterCard',
      room: 'ch1.chapterCardRoom',
      spawn: 'start',
      questFlags: {
        ...throughWandFlags,
        'ch1.trimChosen': true,
        'ch1.petChosen': true,
        'ch1.petNamed': true,
        'ch1.shoppingComplete': true,
        'ch1.ticketReceived': true,
      },
      wandId: 'violet-first-wand',
      robeTrim: 'purple',
      pet: { type: 'owl', name: 'Moonbeam' },
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
