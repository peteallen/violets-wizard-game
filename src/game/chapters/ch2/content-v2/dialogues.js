import {
  chapterComplete,
  choiceRecord,
  flagSet,
  line,
  rewardGrant,
  setPiecePlay,
  travel,
} from './authoring.js';

const dialogueDefaults = Object.freeze({
  resumePolicy: 'restart-current-node',
  replayable: false,
});

const SORTING_CARE_FLAGS = Object.freeze([
  'ch2.sorting.cares.protect',
  'ch2.sorting.cares.explore',
  'ch2.sorting.cares.help',
]);
const SORTING_COURAGE_FLAGS = Object.freeze([
  'ch2.sorting.courage.forward',
  'ch2.sorting.courage.truth',
  'ch2.sorting.courage.together',
]);

function exclusiveFlagActions(selected, flags) {
  return flags.map((flag) => flagSet(flag, flag === selected));
}

export const chapter2DialogueDefinitions = Object.freeze([
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.platformWelcome',
    start: 'welcome',
    nodes: {
      welcome: line({
        speaker: 'ch2.npc.conductor',
        voice: 'voice/ch2/conductor/platformWelcome',
        text: 'You found it, Violet. Your train is waiting just beyond the steam.',
        caption: 'The magical platform!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [
          flagSet('ch2.boardedTrain'),
          travel('ch2.trainCompartment', 'door'),
        ],
      },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.trainFriends',
    start: 'harry',
    nodes: {
      harry: line({
        speaker: 'ch2.npc.harry',
        voice: 'voice/ch2/harry/trainHello',
        text: 'Hi, Violet. There is a seat by the window if you would like it.',
        caption: 'Come sit here!',
        next: 'ron',
      }),
      ron: line({
        speaker: 'ch2.npc.ron',
        voice: 'voice/ch2/ron/trainHello',
        text: 'And plenty of room for sweets. That is the important bit.',
        caption: 'Plenty of room!',
        next: 'hermione',
      }),
      hermione: line({
        speaker: 'ch2.npc.hermione',
        voice: 'voice/ch2/hermione/trainHello',
        text: 'We were just comparing what we know about Hogwarts. Welcome aboard, Violet.',
        caption: 'Welcome aboard, Violet!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [flagSet('ch2.friendsMet')] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.trolleySweets',
    start: 'offer',
    nodes: {
      offer: line({
        speaker: 'ch2.npc.trolleyWitch',
        voice: 'voice/ch2/trolley-witch/offer',
        text: 'Something sweet for the journey? Pick whichever one looks most magical.',
        caption: 'Choose a sweet!',
        next: 'choose',
      }),
      choose: {
        type: 'choice',
        choices: [
          {
            id: 'everyFlavorBeans',
            icon: 'icons/ch2/every-flavor-beans',
            caption: 'Magic beans',
            actions: [
              choiceRecord('ch2.choice.sweet', 'every-flavor-beans'),
              flagSet('ch2.sweetChosen'),
            ],
            next: 'roulette',
          },
          {
            id: 'chocolateFrog',
            icon: 'icons/ch2/chocolate-frog',
            caption: 'Chocolate frog',
            actions: [
              choiceRecord('ch2.choice.sweet', 'chocolate-frog'),
              flagSet('ch2.sweetChosen'),
            ],
            next: 'roulette',
          },
          {
            id: 'cauldronCake',
            icon: 'icons/ch2/cauldron-cake',
            caption: 'Cauldron cake',
            actions: [
              choiceRecord('ch2.choice.sweet', 'cauldron-cake'),
              flagSet('ch2.sweetChosen'),
            ],
            next: 'roulette',
          },
        ],
      },
      roulette: {
        type: 'action',
        actions: [setPiecePlay('ch2.setPiece.sweetReaction')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.greatHallWelcome',
    start: 'welcome',
    nodes: {
      welcome: line({
        speaker: 'ch2.npc.deputyHead',
        voice: 'voice/ch2/deputy-head/greatHallWelcome',
        text: 'Welcome to Hogwarts, Violet. The Great Hall is ready, and so is the Sorting Hat.',
        caption: 'Welcome to Hogwarts!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [flagSet('ch2.greatHallEntered')] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.sorting',
    start: 'listen',
    nodes: {
      listen: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/listen',
        text: 'Hmm. Violet. I can already tell that you care deeply. Show me what matters most.',
        caption: 'What matters most?',
        next: 'careChoice',
      }),
      careChoice: {
        type: 'choice',
        choices: [
          {
            id: 'protectFriends',
            icon: 'icons/ch2/protect-friends',
            caption: 'Protect friends',
            actions: [
              choiceRecord('ch2.choice.sortingCare', 'protect-friends'),
              ...exclusiveFlagActions('ch2.sorting.cares.protect', SORTING_CARE_FLAGS),
            ],
            next: 'courageQuestion',
          },
          {
            id: 'exploreMysteries',
            icon: 'icons/ch2/explore-mysteries',
            caption: 'Explore mysteries',
            actions: [
              choiceRecord('ch2.choice.sortingCare', 'explore-mysteries'),
              ...exclusiveFlagActions('ch2.sorting.cares.explore', SORTING_CARE_FLAGS),
            ],
            next: 'courageQuestion',
          },
          {
            id: 'helpSomeone',
            icon: 'icons/ch2/help-someone',
            caption: 'Help someone',
            actions: [
              choiceRecord('ch2.choice.sortingCare', 'help-someone'),
              ...exclusiveFlagActions('ch2.sorting.cares.help', SORTING_CARE_FLAGS),
            ],
            next: 'courageQuestion',
          },
        ],
      },
      courageQuestion: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/courageQuestion',
        text: 'Good. And when something feels difficult, how do you find your courage?',
        caption: 'Find your courage!',
        next: 'courageChoice',
      }),
      courageChoice: {
        type: 'choice',
        choices: [
          {
            id: 'stepForward',
            icon: 'icons/ch2/step-forward',
            caption: 'Step forward',
            actions: [
              choiceRecord('ch2.choice.sortingCourage', 'step-forward'),
              ...exclusiveFlagActions('ch2.sorting.courage.forward', SORTING_COURAGE_FLAGS),
            ],
            next: 'reason',
          },
          {
            id: 'tellTruth',
            icon: 'icons/ch2/tell-truth',
            caption: 'Tell truth',
            actions: [
              choiceRecord('ch2.choice.sortingCourage', 'tell-truth'),
              ...exclusiveFlagActions('ch2.sorting.courage.truth', SORTING_COURAGE_FLAGS),
            ],
            next: 'reason',
          },
          {
            id: 'stayClose',
            icon: 'icons/ch2/stay-close',
            caption: 'Stay close',
            actions: [
              choiceRecord('ch2.choice.sortingCourage', 'stay-close'),
              ...exclusiveFlagActions('ch2.sorting.courage.together', SORTING_COURAGE_FLAGS),
            ],
            next: 'reason',
          },
        ],
      },
      reason: {
        type: 'branch',
        cases: [
          { when: { allFlags: ['ch2.sorting.cares.protect'] }, next: 'protectReason' },
          { when: { allFlags: ['ch2.sorting.cares.explore'] }, next: 'exploreReason' },
          { when: { allFlags: ['ch2.sorting.cares.help'] }, next: 'helpReason' },
        ],
        fallback: 'braveReason',
      },
      protectReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/protectReason',
        text: 'You put yourself between trouble and the people you love. That is a bright kind of courage.',
        caption: 'A loyal courage!',
        next: 'courageReason',
      }),
      exploreReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/exploreReason',
        text: 'You step toward mysteries even before you know what waits there. That takes courage.',
        caption: 'A curious courage!',
        next: 'courageReason',
      }),
      helpReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/helpReason',
        text: 'You notice who needs you, then choose to help. Kind courage can change a whole room.',
        caption: 'A kind courage!',
        next: 'courageReason',
      }),
      braveReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/braveReason',
        text: 'Every answer points toward a brave heart that moves even when the path is new.',
        caption: 'A brave heart!',
        next: 'courageReason',
      }),
      courageReason: {
        type: 'branch',
        cases: [
          { when: { allFlags: ['ch2.sorting.courage.forward'] }, next: 'forwardReason' },
          { when: { allFlags: ['ch2.sorting.courage.truth'] }, next: 'truthReason' },
          { when: { allFlags: ['ch2.sorting.courage.together'] }, next: 'togetherReason' },
        ],
        fallback: 'gryffindor',
      },
      forwardReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/forwardReason',
        text: 'And you find that courage by taking the next step, even while your knees are still wobbling.',
        caption: 'Step forward!',
        next: 'gryffindor',
      }),
      truthReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/truthReason',
        text: 'And you choose the truth when it would be easier to hide. That is courage with a clear voice.',
        caption: 'Tell the truth!',
        next: 'gryffindor',
      }),
      togetherReason: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/togetherReason',
        text: 'And you stay close to the people beside you. Shared courage can carry everyone forward.',
        caption: 'Stay close!',
        next: 'gryffindor',
      }),
      gryffindor: line({
        speaker: 'ch2.npc.sortingHat',
        voice: 'voice/ch2/sorting-hat/gryffindor',
        text: 'There is only one place for that heart. Better be... Gryffindor!',
        caption: 'Gryffindor!',
        next: 'reveal',
      }),
      reveal: {
        type: 'action',
        actions: [setPiecePlay('ch2.setPiece.sortingReveal')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.feast',
    start: 'points',
    nodes: {
      points: line({
        speaker: 'ch2.npc.headmaster',
        voice: 'voice/ch2/headmaster/firstPoints',
        text: 'A new Gryffindor crossed an unfamiliar threshold with courage tonight. Ten points to Gryffindor!',
        caption: 'Ten points!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [
          rewardGrant('ch2.reward.firstHousePoints', { points: 10 }),
          flagSet('ch2.feastAwarded'),
        ],
      },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch2.dialogue.commonRoomWelcome',
    start: 'welcome',
    nodes: {
      welcome: line({
        speaker: 'ch2.npc.harry',
        voice: 'voice/ch2/harry/commonRoomWelcome',
        text: 'Here we are, Violet. The Gryffindor common room. It feels like you belong here already.',
        caption: 'You are home!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [setPiecePlay('ch2.setPiece.commonRoomArrival')],
      },
    },
  },
  {
    ...dialogueDefaults,
    replayable: true,
    id: 'ch2.dialogue.chapterEnd',
    start: 'nextTime',
    nodes: {
      nextTime: line({
        speaker: 'ch2.npc.narrator',
        voice: 'voice/ch2/narrator/chapterEnd',
        text: 'Violet found friends, crossed the lake, and came home to Gryffindor. Next time: her first classes.',
        caption: 'Next: first classes!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [chapterComplete('ch2', 'ch3')],
      },
    },
  },
]);
