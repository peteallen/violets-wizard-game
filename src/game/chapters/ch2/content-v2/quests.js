import {
  dialogueStart,
  noCondition,
  setPiecePlay,
  when,
} from './authoring.js';

function objective(voice, text, caption, speaker = 'ch2.npc.narrator') {
  return { speaker, voice, text, caption, mapStar: null };
}

function hints({ lookTarget = null, repeatVoice, trailTarget = null, assistActions = [] }) {
  return { lookTarget, repeatVoice, trailTarget, assistActions };
}

const steps = [
  {
    id: 'crossBarrier',
    objective: objective(
      'voice/ch2/objective/crossBarrier',
      'Find the bright barrier and run straight through it.',
      'Find the barrier!',
    ),
    doneWhen: when({ allFlags: ['ch2.barrierCrossed'] }),
    hints: hints({
      lookTarget: 'ch2.kingsCross.barrier',
      repeatVoice: 'voice/ch2/objective/crossBarrier',
      trailTarget: 'ch2.kingsCross.barrier',
      assistActions: [setPiecePlay('ch2.setPiece.barrierRun')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'boardTrain',
  },
  {
    id: 'boardTrain',
    objective: objective(
      'voice/ch2/objective/boardTrain',
      'Ask the conductor where to board the Hogwarts Express.',
      'Board the train!',
    ),
    doneWhen: when({ allFlags: ['ch2.boardedTrain'] }),
    hints: hints({
      lookTarget: 'ch2.platform.conductor',
      repeatVoice: 'voice/ch2/objective/boardTrain',
      trailTarget: 'ch2.platform.conductor',
      assistActions: [dialogueStart('ch2.dialogue.platformWelcome')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'meetFriends',
  },
  {
    id: 'meetFriends',
    objective: objective(
      'voice/ch2/objective/meetFriends',
      'Meet the friendly classmates in your train compartment.',
      'Meet your friends!',
    ),
    doneWhen: when({ allFlags: ['ch2.friendsMet'] }),
    hints: hints({
      lookTarget: 'ch2.train.harry',
      repeatVoice: 'voice/ch2/objective/meetFriends',
      trailTarget: 'ch2.train.harry',
      assistActions: [dialogueStart('ch2.dialogue.trainFriends')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'chooseSweet',
  },
  {
    id: 'chooseSweet',
    objective: objective(
      'voice/ch2/objective/chooseSweet',
      'Choose one magical sweet from the trolley.',
      'Choose a sweet!',
    ),
    doneWhen: when({ allFlags: ['ch2.sweetReactionSeen'] }),
    hints: hints({
      lookTarget: 'ch2.train.trolley',
      repeatVoice: 'voice/ch2/objective/chooseSweet',
      trailTarget: 'ch2.train.trolley',
      assistActions: [dialogueStart('ch2.dialogue.trolleySweets')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'lookOutside',
  },
  {
    id: 'lookOutside',
    objective: objective(
      'voice/ch2/objective/lookOutside',
      'Look through the train window as the castle draws near.',
      'Look outside!',
    ),
    doneWhen: when({ allFlags: ['ch2.trainComplete'] }),
    hints: hints({
      lookTarget: 'ch2.train.window',
      repeatVoice: 'voice/ch2/objective/lookOutside',
      trailTarget: 'ch2.train.window',
    }),
    onEnter: [],
    onComplete: [],
    next: 'seeCastle',
  },
  {
    id: 'seeCastle',
    objective: objective(
      'voice/ch2/objective/seeCastle',
      'Watch Hogwarts appear across the dark lake.',
      'See the castle!',
    ),
    doneWhen: when({ allFlags: ['ch2.lakeSeen'] }),
    hints: hints({
      repeatVoice: 'voice/ch2/objective/seeCastle',
      assistActions: [setPiecePlay('ch2.setPiece.lakeVista')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'enterGreatHall',
  },
  {
    id: 'enterGreatHall',
    objective: objective(
      'voice/ch2/objective/enterGreatHall',
      'Meet the deputy head at the doors of the Great Hall.',
      'Enter the hall!',
    ),
    doneWhen: when({ allFlags: ['ch2.greatHallEntered'] }),
    hints: hints({
      lookTarget: 'ch2.greatHall.deputyHead',
      repeatVoice: 'voice/ch2/objective/enterGreatHall',
      trailTarget: 'ch2.greatHall.deputyHead',
      assistActions: [dialogueStart('ch2.dialogue.greatHallWelcome')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'beSorted',
  },
  {
    id: 'beSorted',
    objective: objective(
      'voice/ch2/objective/beSorted',
      'Sit beneath the Sorting Hat and show it what matters to you.',
      'Try the Hat!',
    ),
    doneWhen: when({ allFlags: ['ch2.sortedGryffindor'] }),
    hints: hints({
      lookTarget: 'ch2.greatHall.sortingHat',
      repeatVoice: 'voice/ch2/objective/beSorted',
      trailTarget: 'ch2.greatHall.sortingHat',
      assistActions: [dialogueStart('ch2.dialogue.sorting')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'enjoyFeast',
  },
  {
    id: 'enjoyFeast',
    objective: objective(
      'voice/ch2/objective/enjoyFeast',
      'Join your first Gryffindor feast and hear the headmaster.',
      'Enjoy the feast!',
    ),
    doneWhen: when({ allFlags: ['ch2.feastAwarded'] }),
    hints: hints({
      lookTarget: 'ch2.greatHall.headmaster',
      repeatVoice: 'voice/ch2/objective/enjoyFeast',
      trailTarget: 'ch2.greatHall.headmaster',
      assistActions: [dialogueStart('ch2.dialogue.feast')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'findCommonRoom',
  },
  {
    id: 'findCommonRoom',
    objective: objective(
      'voice/ch2/objective/findCommonRoom',
      'Follow the Gryffindor lion toward your new common room.',
      'Find Gryffindor!',
    ),
    doneWhen: when({ allFlags: ['ch2.feastComplete'] }),
    hints: hints({
      lookTarget: 'ch2.greatHall.toCommonRoom',
      repeatVoice: 'voice/ch2/objective/findCommonRoom',
      trailTarget: 'ch2.greatHall.toCommonRoom',
    }),
    onEnter: [],
    onComplete: [],
    next: 'arriveHome',
  },
  {
    id: 'arriveHome',
    objective: objective(
      'voice/ch2/objective/arriveHome',
      'Let your friends welcome you into the Gryffindor common room.',
      'Come inside!',
    ),
    doneWhen: when({ allFlags: ['ch2.commonRoomArrived'] }),
    hints: hints({
      lookTarget: 'ch2.commonRoom.harry',
      repeatVoice: 'voice/ch2/objective/arriveHome',
      trailTarget: 'ch2.commonRoom.harry',
      assistActions: [dialogueStart('ch2.dialogue.commonRoomWelcome')],
    }),
    onEnter: [],
    onComplete: [],
    next: 'turnPage',
  },
  {
    id: 'turnPage',
    objective: objective(
      'voice/ch2/objective/turnPage',
      'Turn the chapter page and look ahead to your first classes.',
      'Turn the page!',
    ),
    doneWhen: when({ allFlags: ['ch2.chapterCardSeen'] }),
    hints: hints({
      repeatVoice: 'voice/ch2/objective/turnPage',
      assistActions: [setPiecePlay('ch2.setPiece.chapterCard')],
    }),
    onEnter: [],
    onComplete: [],
    next: null,
  },
];

export const chapter2QuestDefinition = Object.freeze({
  id: 'ch2.quest.belonging',
  kind: 'main',
  offerScript: null,
  startWhen: when({ allFlags: ['ch1.complete'] }),
  startStep: 'crossBarrier',
  steps: Object.fromEntries(steps.map((step) => [step.id, step])),
  onComplete: [],
});

export { noCondition };
