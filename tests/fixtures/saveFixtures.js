const FIXED_INSTANT = '2026-07-14T18:00:00.000Z';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function legacySave({
  resume,
  highestUnlockedChapter = 1,
  completedChapters = [],
  questFlags = {},
  storyChoices = {},
  wandId = null,
  robeTrim = null,
  pet = { type: null, name: null },
  cards = [],
} = {}) {
  return deepFreeze({
    schemaVersion: 1,
    createdAt: FIXED_INSTANT,
    updatedAt: FIXED_INSTANT,
    appVersion: 'refactor-baseline-v1',
    worldSeed: 42,
    resume,
    progress: {
      highestUnlockedChapter,
      completedChapters,
      questFlags,
      storyChoices,
      rewardReceipts: [],
      encounterCheckpoints: {},
      minigameCheckpoints: {},
      openedOwlPost: [],
    },
    character: {
      name: 'Violet',
      house: null,
      wandId,
      appearance: { robeTrim },
      pet,
      commonRoomPassword: [],
    },
    spellbook: { known: [], stats: {} },
    collections: { cards, treasures: [], housePoints: 0 },
    learning: {
      letterSkill: 0,
      phonicsSkill: 0,
      countingSkill: 0,
      completedBeats: [],
    },
    yearbook: { entries: [] },
    settings: {
      muted: false,
      volumes: { master: 1, voice: 1, music: 1, sfx: 1 },
      reducedMotion: false,
      learning: 'gentle',
    },
  });
}

const THROUGH_WAND_FLAGS = {
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
};

const COMPLETED_CHAPTER_FLAGS = {
  ...THROUGH_WAND_FLAGS,
  'ch1.trimChosen': true,
  'ch1.petChosen': true,
  'ch1.petNamed': true,
  'ch1.shoppingComplete': true,
  'ch1.ticketReceived': true,
  'ch1.chapterCardSeen': true,
  'ch1.complete': true,
};

const COMPLETED_PROFILE = {
  highestUnlockedChapter: 2,
  completedChapters: ['ch1'],
  questFlags: COMPLETED_CHAPTER_FLAGS,
  wandId: 'violet-first-wand',
  robeTrim: 'purple',
  pet: { type: 'cat', name: 'Biscuit' },
  cards: ['morgana', 'dumbledore'],
};

export const LEGACY_SAVE_FIXTURES = deepFreeze({
  freshChapterOne: legacySave({
    resume: {
      chapter: 'ch1',
      scene: 'ch1.letterScene',
      room: 'ch1.bedroom',
      spawn: 'start',
    },
  }),
  midChapterOne: legacySave({
    resume: {
      chapter: 'ch1',
      scene: 'ch1.robeShopping',
      room: 'ch1.malkins',
      spawn: 'entry',
    },
    questFlags: THROUGH_WAND_FLAGS,
    wandId: 'violet-first-wand',
  }),
  completedChapterOne: legacySave({
    ...COMPLETED_PROFILE,
    resume: {
      chapter: 'ch1',
      scene: 'ch1.freeRoam',
      room: 'ch1.diagonStreet',
      spawn: 'west',
    },
  }),
  chapterTwoPreview: legacySave({
    ...COMPLETED_PROFILE,
    resume: {
      chapter: 'ch2',
      scene: 'ch2.placeholder',
      room: 'ch2.previewRoom',
      spawn: 'start',
    },
  }),
});

export function cloneLegacySaveFixture(id) {
  const fixture = LEGACY_SAVE_FIXTURES[id];
  if (!fixture) throw new Error(`Unknown legacy save fixture ${id}.`);
  return structuredClone(fixture);
}
