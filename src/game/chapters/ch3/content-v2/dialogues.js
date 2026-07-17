import {
  chapterComplete,
  dialogueStart,
  flagSet,
  learningStart,
  line,
  rewardGrant,
  setPiecePlay,
} from './authoring.js';

const dialogueDefaults = Object.freeze({
  resumePolicy: 'restart-current-node',
  replayable: false,
});

export const chapter3DialogueDefinitions = Object.freeze([
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.homeLetter',
    start: 'letter',
    nodes: {
      letter: line({
        speaker: 'ch3.npc.narrator',
        voice: 'voice/ch3/home/letter',
        text: 'Dear Violet, we are so proud of your first days at Hogwarts. Open the parcel and show us what you learn. Love, Mum and Dad.',
        caption: 'A letter home!',
        next: 'open',
      }),
      open: {
        type: 'action',
        actions: [setPiecePlay('ch3.setPiece.spellbookReveal')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.lumosLesson',
    start: 'light',
    nodes: {
      light: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/every-witch-needs-light',
        text: 'Every witch needs a light, Violet. This little lantern has forgotten how to shine.',
        caption: 'A light!',
        next: 'listen',
      }),
      listen: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/letters-into-magic',
        text: 'Letters into magic. Listen: Lumos.',
        caption: 'Lumos',
        next: 'begin',
      }),
      begin: {
        type: 'action',
        actions: [learningStart('ch3.learning.lumos')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.lumosSuccess',
    start: 'success',
    nodes: {
      success: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/splendid-light',
        text: 'Splendid! You woke the light.',
        caption: 'It shines!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.leviosaLesson',
    start: 'pieces',
    nodes: {
      pieces: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/long-spells-little-pieces',
        text: 'Long spells come in little pieces. Listen closely as they lift the feather.',
        caption: 'Listen close',
        next: 'swish',
      }),
      swish: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/swish-and-flick',
        text: 'Swish and flick!',
        caption: 'Swish! Flick!',
        next: 'begin',
      }),
      begin: {
        type: 'action',
        actions: [learningStart('ch3.learning.leviosa')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.leviosaSuccess',
    start: 'success',
    nodes: {
      success: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/up-she-goes',
        text: 'Up she goes! That feather could not be happier.',
        caption: 'You did it!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.trevorMissing',
    start: 'missing',
    nodes: {
      missing: line({
        speaker: 'ch3.npc.neville',
        voice: 'voice/ch3/neville/trevor-missing',
        text: 'Violet, have you seen Trevor? He slipped away into the night corridors.',
        caption: 'Trevor is missing!',
        next: 'help',
      }),
      help: line({
        speaker: 'ch3.npc.neville',
        voice: 'voice/ch3/neville/please-help',
        text: 'Please help me find Trevor. He likes hiding in dark places.',
        caption: 'Find Trevor!',
        next: 'reminder',
      }),
      reminder: line({
        speaker: 'ch3.npc.flitwick',
        voice: 'voice/ch3/flitwick/use-lumos',
        text: 'A little light may help you see where Trevor has been.',
        caption: 'Use Lumos!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [
          flagSet('ch3.toadQuestAccepted'),
          { type: 'ui.open', surface: 'satchel', tab: 'map' },
        ],
      },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.armorReaction',
    start: 'reaction',
    nodes: {
      reaction: line({
        speaker: 'ch3.npc.narrator',
        voice: 'voice/ch3/narrator/armor-reaction',
        text: 'The armor squeaks indignantly. No toad in there.',
        caption: 'Just armor!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.curtainReaction',
    start: 'reaction',
    nodes: {
      reaction: line({
        speaker: 'ch3.npc.narrator',
        voice: 'voice/ch3/narrator/curtain-reaction',
        text: 'The curtain sneezes out one enormous puff of dust.',
        caption: 'Just dust!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.trevorFound',
    start: 'found',
    nodes: {
      found: line({
        speaker: 'ch3.npc.narrator',
        voice: 'voice/ch3/narrator/trevor-found',
        text: 'Violet scoops Trevor up as he gives one indignant croak.',
        caption: 'Found Trevor!',
        next: 'celebrate',
      }),
      celebrate: {
        type: 'action',
        actions: [setPiecePlay('ch3.setPiece.trevorFound')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.trevorReturned',
    start: 'safe',
    nodes: {
      safe: line({
        speaker: 'ch3.npc.neville',
        voice: 'voice/ch3/neville/trevor-safe',
        text: 'Trevor! You found him. Thank you, Violet. I was so worried.',
        caption: 'Trevor is safe!',
        next: 'reunion',
      }),
      reunion: {
        type: 'action',
        actions: [setPiecePlay('ch3.setPiece.trevorReunion')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.ghostBook',
    start: 'request',
    nodes: {
      request: line({
        speaker: 'ch3.npc.friendlyGhost',
        voice: 'voice/ch3/ghost/book-request',
        text: 'Oh! A helpful young witch. My favorite book has torn pages. Please remember it when you learn a mending spell.',
        caption: 'Fix the book',
        next: 'reward',
      }),
      reward: line({
        speaker: 'ch3.npc.friendlyGhost',
        voice: 'voice/ch3/ghost/card-reward',
        text: 'Keep this Bertie Bott card for listening. A promise can still begin with a present.',
        caption: 'A frog card!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [
          flagSet('ch3.ghostBookAccepted'),
          rewardGrant('ch3.reward.ghostCard', { cards: ['bertie-bott'] }),
        ],
      },
    },
  },
  {
    ...dialogueDefaults,
    id: 'ch3.dialogue.chapterClose',
    start: 'firstSpells',
    nodes: {
      firstSpells: line({
        speaker: 'ch3.npc.narrator',
        voice: 'voice/ch3/narrator/chapter-close',
        text: 'Lumos and Leviosa now rest together in Violet’s spellbook. Her first spells are ready whenever she needs them.',
        caption: 'Violet’s First Spells',
        next: 'preview',
      }),
      preview: line({
        speaker: 'ch3.npc.narrator',
        voice: 'voice/ch3/narrator/flying-preview',
        text: 'Next time, flying lessons begin, with bright star rings waiting above the lawn.',
        caption: 'Flying lessons later!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [chapterComplete('ch3', 'ch4')],
      },
    },
  },
]);

export const chapter3DialogueIds = Object.freeze(
  chapter3DialogueDefinitions.map(({ id }) => id),
);

export { dialogueStart };
