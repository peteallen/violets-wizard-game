import {
  dialogueStart,
  setPiecePlay,
  uiOpen,
  when,
} from './authoring.js';

function objective(voice, text, caption, {
  speaker = 'ch3.npc.narrator',
  mapStar = null,
} = {}) {
  return { speaker, voice, text, caption, mapStar };
}

function hints({ lookTarget = null, repeatVoice, trailTarget = null, assistActions = [] }) {
  return { lookTarget, repeatVoice, trailTarget, assistActions };
}

const mainSteps = [
  {
    id: 'openSpellbook',
    objective: objective(
      'voice/ch3/objective/open-spellbook',
      'Tap the post owl and open the parcel from home.',
      'Open the parcel!',
      { mapStar: { room: 'ch3.commonRoom', hotspot: 'ch3.commonRoom.postOwl' } },
    ),
    doneWhen: when({ allFlags: ['ch3.spellbookOpened'] }),
    hints: hints({
      lookTarget: 'ch3.commonRoom.postOwl',
      repeatVoice: 'voice/ch3/objective/open-spellbook',
      trailTarget: 'ch3.commonRoom.postOwl',
      assistActions: [dialogueStart('ch3.dialogue.homeLetter')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'learnLumos',
  },
  {
    id: 'learnLumos',
    objective: objective(
      'voice/ch3/objective/learn-lumos',
      'Visit Charms class and learn Lumos from Professor Flitwick.',
      'Learn Lumos!',
      { mapStar: { room: 'ch3.charmsClassroom', hotspot: 'ch3.charms.flitwickLumos' } },
    ),
    doneWhen: when({ allFlags: ['ch3.lumosProved'] }),
    hints: hints({
      lookTarget: 'ch3.charms.flitwickLumos',
      repeatVoice: 'voice/ch3/objective/learn-lumos',
      trailTarget: 'ch3.charms.flitwickLumos',
      assistActions: [uiOpen('satchel', 'map')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'learnLeviosa',
  },
  {
    id: 'learnLeviosa',
    objective: objective(
      'voice/ch3/objective/learn-leviosa',
      'Return to Professor Flitwick and lift the feather with Leviosa.',
      'Learn Leviosa!',
      { mapStar: { room: 'ch3.charmsClassroom', hotspot: 'ch3.charms.flitwickLeviosa' } },
    ),
    doneWhen: when({ allFlags: ['ch3.leviosaLearned'] }),
    hints: hints({
      lookTarget: 'ch3.charms.flitwickLeviosa',
      repeatVoice: 'voice/ch3/objective/learn-leviosa',
      trailTarget: 'ch3.charms.flitwickLeviosa',
      assistActions: [dialogueStart('ch3.dialogue.leviosaLesson')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'helpNeville',
  },
  {
    id: 'helpNeville',
    objective: objective(
      'voice/ch3/objective/help-neville',
      'Talk to Neville after class.',
      'Talk to Neville!',
      { mapStar: { room: 'ch3.charmsClassroom', hotspot: 'ch3.charms.neville' } },
    ),
    doneWhen: when({ allFlags: ['ch3.toadQuestAccepted'] }),
    hints: hints({
      lookTarget: 'ch3.charms.neville',
      repeatVoice: 'voice/ch3/objective/help-neville',
      trailTarget: 'ch3.charms.neville',
      assistActions: [dialogueStart('ch3.dialogue.trevorMissing')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'followTrail',
  },
  {
    id: 'followTrail',
    objective: objective(
      'voice/ch3/objective/follow-trail',
      'Use Lumos in the first night corridor and follow the wet footprints.',
      'Follow the trail!',
      { mapStar: { room: 'ch3.corridorOne', hotspot: 'ch3.corridorOne.alcove' } },
    ),
    doneWhen: when({ allFlags: ['ch3.trailFound'] }),
    hints: hints({
      lookTarget: 'ch3.corridorOne.alcove',
      repeatVoice: 'voice/ch3/objective/follow-trail',
      trailTarget: 'ch3.corridorOne.alcove',
      assistActions: [uiOpen('satchel', 'map')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'findClue',
  },
  {
    id: 'findClue',
    objective: objective(
      'voice/ch3/objective/find-clue',
      'Use Lumos in the second corridor to find Trevor’s trail.',
      'Find a clue!',
      { mapStar: { room: 'ch3.corridorTwo', hotspot: 'ch3.corridorTwo.cardAlcove' } },
    ),
    doneWhen: when({ allFlags: ['ch3.corridorClueFound'] }),
    hints: hints({
      lookTarget: 'ch3.corridorTwo.cardAlcove',
      repeatVoice: 'voice/ch3/objective/find-clue',
      trailTarget: 'ch3.corridorTwo.cardAlcove',
      assistActions: [uiOpen('satchel', 'map')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'revealTrevor',
  },
  {
    id: 'revealTrevor',
    objective: objective(
      'voice/ch3/objective/find-trevor',
      'Use Lumos in the third corridor and find Trevor.',
      'Find Trevor!',
      { mapStar: { room: 'ch3.corridorThree', hotspot: 'ch3.corridorThree.alcove' } },
    ),
    doneWhen: when({ allFlags: ['ch3.toadRevealed'] }),
    hints: hints({
      lookTarget: 'ch3.corridorThree.alcove',
      repeatVoice: 'voice/ch3/objective/find-trevor',
      trailTarget: 'ch3.corridorThree.alcove',
      assistActions: [uiOpen('satchel', 'map')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'findTrevor',
  },
  {
    id: 'findTrevor',
    objective: objective(
      'voice/ch3/objective/find-trevor',
      'Use Lumos in the third corridor and find Trevor.',
      'Find Trevor!',
      { mapStar: { room: 'ch3.corridorThree', hotspot: 'ch3.corridorThree.trevor' } },
    ),
    doneWhen: when({ allFlags: ['ch3.toadFound'] }),
    hints: hints({
      lookTarget: 'ch3.corridorThree.trevor',
      repeatVoice: 'voice/ch3/objective/find-trevor',
      trailTarget: 'ch3.corridorThree.trevor',
      assistActions: [setPiecePlay('ch3.setPiece.trevorFound')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'returnTrevor',
  },
  {
    id: 'returnTrevor',
    objective: objective(
      'voice/ch3/objective/return-trevor',
      'Take Trevor back to Neville in the first corridor.',
      'Return Trevor!',
      { mapStar: { room: 'ch3.corridorOne', hotspot: 'ch3.corridorOne.neville' } },
    ),
    doneWhen: when({ allFlags: ['ch3.toadReturned'] }),
    hints: hints({
      lookTarget: 'ch3.corridorOne.neville',
      repeatVoice: 'voice/ch3/objective/return-trevor',
      trailTarget: 'ch3.corridorOne.neville',
      assistActions: [uiOpen('satchel', 'map')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'turnPage',
  },
  {
    id: 'turnPage',
    objective: objective(
      'voice/ch3/objective/turn-page',
      'Return to the common room and open Violet’s spellbook.',
      'Open the spellbook!',
      { mapStar: { room: 'ch3.commonRoom', hotspot: 'ch3.commonRoom.spellbook' } },
    ),
    doneWhen: when({ allFlags: ['ch3.chapterCardSeen'] }),
    hints: hints({
      lookTarget: 'ch3.commonRoom.spellbook',
      repeatVoice: 'voice/ch3/objective/turn-page',
      trailTarget: 'ch3.commonRoom.spellbook',
      assistActions: [uiOpen('satchel', 'map')],
    }),
    onEnter: [],
    onComplete: [],
    next: null,
  },
];

export const chapter3MainQuestDefinition = Object.freeze({
  id: 'ch3.quest.firstSpells',
  kind: 'main',
  offerScript: null,
  startWhen: when({ allFlags: ['ch2.complete'] }),
  startStep: 'openSpellbook',
  steps: Object.fromEntries(mainSteps.map((step) => [step.id, step])),
  onComplete: [],
});

export const chapter3GhostBookQuestDefinition = Object.freeze({
  id: 'ch3.quest.fixBook',
  kind: 'side',
  offerScript: null,
  startWhen: when({ allFlags: ['ch3.ghostBookAccepted'] }),
  startStep: 'rememberBook',
  steps: {
    rememberBook: {
      id: 'rememberBook',
      objective: objective(
        'voice/ch3/objective/fix-book',
        'Remember the friendly ghost’s torn book when you learn Reparo.',
        'Fix the book',
        { speaker: 'ch3.npc.friendlyGhost' },
      ),
      doneWhen: when({
        allFlags: ['ch3.ghostBookMended'],
        knownSpells: ['reparo'],
      }),
      hints: hints({ repeatVoice: null }),
      onEnter: [],
      onComplete: [],
      next: null,
    },
  },
  onComplete: [],
});

export const chapter3QuestDefinitions = Object.freeze([
  chapter3MainQuestDefinition,
  chapter3GhostBookQuestDefinition,
]);
