import {
  dialogueStart,
  flagSet,
  noCondition,
  setPiecePlay,
  uiOpen,
  when,
} from './authoring.js';

const questGraph = {
  id: 'ch1.shoppingTrip',
  kind: 'main',
  offerScript: null,
  startWhen: noCondition,
  startStep: 'ch1.openLetter',
  steps: [
    {
      id: 'ch1.openLetter',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/objective/openLetter',
        text: 'Tap the owl at the window.',
        caption: 'Tap the owl!',
        mapStar: null,
      },
      doneWhen: when({ allFlags: ['ch1.letterRead'] }),
      hints: {
        lookTarget: 'bedroom.owl',
        repeatVoice: 'voice/ch1/objective/openLetter',
        trailTarget: 'bedroom.owl',
        assistActions: [
          flagSet('ch1.owlTapped'),
          flagSet('ch1.letterOpened'),
          uiOpen('letter-reading'),
        ],
      },
      onEnter: [],
      onComplete: [],
      next: 'ch1.followGuide',
    },
    {
      id: 'ch1.followGuide',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/objective/followGuide',
        text: 'Follow Hagrid to the magical street.',
        caption: 'Follow Hagrid!',
        mapStar: null,
      },
      doneWhen: when({ allFlags: ['ch1.wallOpened'] }),
      hints: { lookTarget: null, repeatVoice: 'voice/ch1/objective/followGuide', trailTarget: null, assistActions: [] },
      onEnter: [],
      onComplete: [],
      next: 'ch1.useMap',
    },
    {
      id: 'ch1.useMap',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/recap/useMap',
        text: 'The magical street is open. Your wand is waiting.',
        caption: 'Find your wand!',
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.ollivandersDoor' },
      },
      doneWhen: when({ allFlags: ['ch1.mapUsed'] }),
      hints: {
        lookTarget: 'street.ollivandersDoor',
        repeatVoice: 'voice/ch1/recap/useMap',
        trailTarget: 'street.ollivandersDoor',
        assistActions: [{ type: 'ui.open', surface: 'satchel', tab: 'map' }],
      },
      onEnter: [],
      onComplete: [],
      next: 'ch1.chooseWand',
    },
    {
      id: 'ch1.chooseWand',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/objective/chooseWand',
        text: 'Go to Ollivanders and choose your wand.',
        caption: 'Find your wand!',
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.ollivandersDoor' },
      },
      doneWhen: when({ allFlags: ['ch1.wandChosen'] }),
      hints: { lookTarget: 'ollivanders.wand1', repeatVoice: 'voice/ch1/objective/chooseWand', trailTarget: 'ollivanders.wand1', assistActions: [] },
      onEnter: [],
      onComplete: [],
      next: 'ch1.chooseRobes',
    },
    {
      id: 'ch1.chooseRobes',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/objective/chooseRobes',
        text: "Go to Madam Malkin's and choose your robes.",
        caption: 'Choose your robes!',
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.malkinsDoor' },
      },
      doneWhen: when({ allFlags: ['ch1.trimChosen'] }),
      hints: { lookTarget: 'malkins.stool', repeatVoice: 'voice/ch1/objective/chooseRobes', trailTarget: 'malkins.stool', assistActions: [dialogueStart('ch1.tailor.fitting')] },
      onEnter: [],
      onComplete: [],
      next: 'ch1.choosePet',
    },
    {
      id: 'ch1.choosePet',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/objective/choosePet',
        text: 'Go to the Menagerie and choose a pet.',
        caption: 'Choose a pet!',
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' },
      },
      doneWhen: when({ allFlags: ['ch1.petNamed'] }),
      hints: { lookTarget: 'menagerie.keeper', repeatVoice: 'voice/ch1/objective/choosePet', trailTarget: 'menagerie.keeper', assistActions: [dialogueStart('ch1.keeper.petAndName')] },
      onEnter: [],
      onComplete: [flagSet('ch1.shoppingComplete')],
      next: 'ch1.returnToGuide',
    },
    {
      id: 'ch1.returnToGuide',
      objective: {
        speaker: 'npc.narrator',
        voice: 'voice/ch1/objective/returnToGuide',
        text: 'Go back to Hagrid on the street.',
        caption: 'Find Hagrid!',
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.guideTicket' },
      },
      doneWhen: when({ allFlags: ['ch1.ticketReceived'] }),
      hints: { lookTarget: 'street.guideTicket', repeatVoice: 'voice/ch1/objective/returnToGuide', trailTarget: 'street.guideTicket', assistActions: [dialogueStart('ch1.guide.ticket')] },
      onEnter: [],
      onComplete: [setPiecePlay('sp.chapterCard')],
      next: null,
    },
  ],
  onComplete: [],
};

questGraph.startStep = questGraph.startStep.replace(/^ch1\./u, '');
questGraph.steps = Object.fromEntries(questGraph.steps.map((step) => {
  const id = step.id.replace(/^ch1\./u, '');
  return [id, {
    ...step,
    id,
    objective: { ...step.objective },
    hints: {
      ...step.hints,
      repeatVoice: step.hints.repeatVoice ?? null,
    },
    next: step.next?.replace(/^ch1\./u, '') ?? null,
  }];
}));

export const chapter1QuestDefinition = questGraph;
