import { invitationLetterNarration } from '../../../content/invitationLetter.js';
import {
  audioSfx,
  flagSet,
  travel,
  uiOpen,
  voiceLine,
} from './authoring.js';

export const chapter1DialogueDefinitions = [
  {
    id: 'ch1.letter.read',
    start: 'invitation',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      invitation: voiceLine({
        speaker: 'npc.narrator',
        voice: 'voice/ch1/narrator/letterInvitation',
        text: invitationLetterNarration[0],
        caption: 'Dear Violet',
        next: 'waiting',
      }),
      waiting: voiceLine({
        speaker: 'npc.narrator',
        voice: 'voice/ch1/narrator/letterWaiting',
        text: invitationLetterNarration[1],
        caption: 'Your place',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [flagSet('ch1.letterRead')],
      },
    },
  },
  {
    id: 'ch1.guide.arrival',
    start: 'hello',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      hello: voiceLine({
        speaker: 'npc.guide',
        voice: 'voice/ch1/guide/arrival',
        text: "Morning, Violet! I'm Hagrid. Your wizarding year starts today.",
        caption: 'Come with me!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [flagSet('ch1.guideMet')] },
    },
  },
  {
    id: 'ch1.guide.leaky',
    start: 'thisWay',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      thisWay: voiceLine({
        speaker: 'npc.guide',
        voice: 'voice/ch1/guide/leaky',
        text: 'Nearly there. The magical street is through the courtyard.',
        caption: 'This way!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [flagSet('ch1.leakyReached')] },
    },
  },
  {
    id: 'ch1.guide.wall',
    start: 'prompt',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      prompt: voiceLine({
        speaker: 'npc.guide',
        voice: 'voice/ch1/guide/wall',
        text: 'The magical street is behind this wall. Give those bricks a tap.',
        caption: 'Tap the bricks!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.guide.map',
    start: 'map',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      map: voiceLine({
        speaker: 'npc.guide',
        voice: 'voice/ch1/guide/map',
        text: 'This map always knows where to go. Open your satchel and tap the golden star.',
        caption: 'Open your map!',
        next: 'open',
      }),
      open: {
        type: 'action',
        actions: [flagSet('ch1.satchelReceived')],
        next: 'finish',
      },
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.wandmaker.welcome',
    start: 'welcome',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      welcome: voiceLine({
        speaker: 'npc.wandmaker',
        voice: 'voice/ch1/wandmaker/welcome',
        text: 'Ah, Violet. Let us see which wand has been waiting for you.',
        caption: 'Try a wand!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.wandmaker.wrong1',
    start: 'oops',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      oops: voiceLine({
        speaker: 'npc.wandmaker',
        voice: 'voice/ch1/wandmaker/wrong1',
        text: 'Oh! That one has too many ideas.',
        caption: 'Oops!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.wandmaker.wrong2',
    start: 'again',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      again: voiceLine({
        speaker: 'npc.wandmaker',
        voice: 'voice/ch1/wandmaker/wrong2',
        text: 'A lively wand, but not your wand.',
        caption: 'Try again!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.wandmaker.chosen',
    start: 'chosen',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      chosen: voiceLine({
        speaker: 'npc.wandmaker',
        voice: 'voice/ch1/wandmaker/chosen',
        text: 'Curious…',
        caption: 'Your wand!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.tailor.fitting',
    start: 'welcome',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      welcome: voiceLine({
        speaker: 'npc.tailor',
        voice: 'voice/ch1/tailor/welcome',
        text: 'Welcome, Violet. Which little edge of colour feels most like you?',
        caption: 'Choose a color!',
        next: 'trim',
      }),
      trim: {
        type: 'end',
        actions: [uiOpen('robe-picker')],
      },
    },
  },
  {
    id: 'ch1.tailor.done',
    start: 'done',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      done: voiceLine({
        speaker: 'npc.tailor',
        voice: 'voice/ch1/tailor/done',
        text: 'That suits you beautifully.',
        caption: 'Lovely!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.keeper.petAndName',
    start: 'welcome',
    resumePolicy: 'restart-script',
    replayable: true,
    nodes: {
      welcome: voiceLine({
        speaker: 'npc.menagerieKeeper',
        voice: 'voice/ch1/keeper/welcome',
        text: 'Every witch needs a small friend. Who would you like beside you?',
        caption: 'Choose a pet!',
        next: 'pet',
      }),
      pet: {
        type: 'choice',
        choices: [
          {
            id: 'petCat',
            icon: 'pet-cat',
            caption: 'Cat',
            characterId: 'character.cat',
            characterScale: 0.82,
            actions: [{ type: 'character.set', field: 'pet.type', value: 'cat' }, audioSfx('sfx/ch1/petCat')],
            next: 'confirm',
          },
          {
            id: 'petOwl',
            icon: 'pet-owl',
            caption: 'Owl',
            characterId: 'character.pet-owl',
            characterScale: 0.72,
            actions: [{ type: 'character.set', field: 'pet.type', value: 'owl' }, audioSfx('sfx/ch1/petOwl')],
            next: 'confirm',
          },
          {
            id: 'petToad',
            icon: 'pet-toad',
            caption: 'Toad',
            characterId: 'character.toad',
            characterScale: 1.18,
            actions: [{ type: 'character.set', field: 'pet.type', value: 'toad' }, audioSfx('sfx/ch1/petToad')],
            next: 'confirm',
          },
        ],
      },
      confirm: voiceLine({
        speaker: 'npc.menagerieKeeper',
        voice: 'voice/ch1/keeper/confirm',
        text: 'Is this the friend for you?',
        caption: 'This one?',
        next: 'confirmChoice',
      }),
      confirmChoice: {
        type: 'choice',
        choices: [
          {
            id: 'petConfirm',
            icon: 'wax-check',
            caption: 'Yes!',
            actions: [flagSet('ch1.petChosen')],
            next: 'askName',
          },
          {
            id: 'petLookAgain',
            icon: 'eyes',
            caption: 'Look again',
            actions: [],
            next: 'pet',
          },
        ],
      },
      askName: voiceLine({
        speaker: 'npc.menagerieKeeper',
        voice: 'voice/ch1/keeper/name',
        text: 'Wonderful. What shall we call your new friend?',
        caption: 'Pick a name!',
        next: 'name',
      }),
      name: {
        type: 'choice',
        choices: [
          {
            id: 'nameBiscuit',
            icon: 'name-biscuit',
            caption: 'Biscuit',
            actions: [{ type: 'character.set', field: 'pet.name', value: 'Biscuit' }],
            next: 'recordName',
          },
          {
            id: 'namePip',
            icon: 'name-pip',
            caption: 'Pip',
            actions: [{ type: 'character.set', field: 'pet.name', value: 'Pip' }],
            next: 'recordName',
          },
          {
            id: 'nameCustom',
            icon: 'name-custom',
            caption: 'My own',
            actions: [{ type: 'choice.record', id: 'ch1.petNameMode', value: 'custom' }],
            next: 'recordName',
          },
        ],
      },
      recordName: {
        type: 'action',
        actions: [flagSet('ch1.petNamed'), flagSet('ch1.shoppingComplete')],
        next: 'done',
      },
      done: voiceLine({
        speaker: 'npc.menagerieKeeper',
        voice: 'voice/ch1/keeper/done',
        text: "A fine name. I think you've made a friend.",
        caption: 'New friend!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.guide.ticket',
    start: 'present',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      present: { type: 'action', actions: [audioSfx('sfx/ch1/ticket')], next: 'ticket' },
      ticket: voiceLine({
        speaker: 'npc.guide',
        voice: 'voice/ch1/guide/ticket',
        text: 'All set, Violet? A wand, robes, and a friend. Here is your train ticket.',
        caption: 'Your ticket!',
        next: 'platform',
      }),
      platform: voiceLine({
        speaker: 'npc.guide',
        voice: 'voice/ch1/guide/platform',
        text: 'The train leaves from Platform Nine and Three-Quarters.',
        caption: 'Next: the train!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [flagSet('ch1.ticketReceived'), travel('ch1.chapterCardRoom', 'start')],
      },
    },
  },
  {
    id: 'ch1.narrator.chapterEnd',
    start: 'nextTime',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      nextTime: voiceLine({
        speaker: 'npc.narrator',
        voice: 'voice/ch1/narrator/chapterEnd',
        text: 'Next time, Violet takes the train to Hogwarts.',
        caption: 'To Hogwarts!',
        next: 'finish',
      }),
      finish: {
        type: 'end',
        actions: [
          { type: 'chapter.complete', chapter: 'ch1', nextChapter: 'ch2' },
        ],
      },
    },
  },
];
