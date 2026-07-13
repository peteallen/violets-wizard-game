import { chapter1LetterNarration } from './ch1-letter.js';

const noCondition = Object.freeze({});

function when({ allFlags = [], noFlags = [], profileEquals } = {}) {
  return {
    ...(allFlags.length ? { allFlags } : {}),
    ...(noFlags.length ? { noFlags } : {}),
    ...(profileEquals ? { profileEquals } : {}),
  };
}

function circle(x, y, radius) {
  return { shape: 'circle', x, y, radius: Math.max(88, radius) };
}

function rect(x, y, width, height) {
  return { shape: 'rect', x, y, width, height };
}

function flagSet(flag, value = true) {
  return { type: 'flag.set', flag, value };
}

function dialogueStart(script) {
  return { type: 'dialogue.start', script };
}

function setPiecePlay(id) {
  return { type: 'setPiece.play', id };
}

function uiOpen(surface, tab = null) {
  return { type: 'ui.open', surface, ...(tab ? { tab } : {}) };
}

function audioSfx(key) {
  return { type: 'audio.command', command: 'sfx', key };
}

function sfxCue(at, key) {
  return { type: 'cue', at, event: 'audio.command', payload: { command: 'sfx', key } };
}

function musicCue(at, key) {
  return { type: 'cue', at, event: 'audio.command', payload: { command: 'music', key, mode: 'crossfade', fadeSeconds: 0.8 } };
}

function travel(room, spawn) {
  return { type: 'travel.request', room, spawn: spawn.split('.').at(-1) };
}

function mapLocation({ beforeTravel = [], to, ...location }) {
  const destination = { room: to.room, spawn: to.spawn.split('.').at(-1) };
  return {
    ...location,
    alwaysUnlocked: location.alwaysUnlocked ?? false,
    to: destination,
    onSelect: [...beforeTravel, { type: 'travel.request', ...destination }],
  };
}

function voiceLine({ speaker, voice, text, caption, next, portraitPose = 'talk' }) {
  return {
    type: 'line',
    speaker,
    voice,
    text,
    caption,
    phoneticText: null,
    portraitPose,
    next,
  };
}

const roomSize = Object.freeze({ width: 1280, height: 720 });
const streetSize = roomSize;
const walkBand = Object.freeze({ top: 560, bottom: 640 });

const dialogueGraphs = [
  {
    id: 'ch1.letter.read',
    start: 'invitation',
    resumePolicy: 'restart-current-node',
    replayable: true,
    nodes: {
      invitation: voiceLine({
        speaker: 'npc.narrator',
        voice: 'voice/ch1/narrator/letterInvitation',
        text: chapter1LetterNarration[0],
        caption: 'HOGWARTS!',
        next: 'waiting',
      }),
      waiting: voiceLine({
        speaker: 'npc.narrator',
        voice: 'voice/ch1/narrator/letterWaiting',
        text: chapter1LetterNarration[1],
        caption: 'For Violet',
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
        actions: [flagSet('ch1.satchelReceived'), { type: 'ui.open', surface: 'satchel', tab: 'map' }],
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
        next: 'wow',
      }),
      wow: voiceLine({
        speaker: 'npc.violet',
        voice: 'voice/ch1/violet/wow',
        text: 'Wow!',
        caption: 'WOW!',
        next: 'finish',
        portraitPose: 'wonder',
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
        type: 'choice',
        choices: [
          {
            id: 'trimPurple',
            icon: 'trim-purple',
            caption: 'Purple',
            actions: [{ type: 'character.set', field: 'appearance.robeTrim', value: 'purple' }],
            next: 'record',
          },
          {
            id: 'trimTeal',
            icon: 'trim-teal',
            caption: 'Teal',
            actions: [{ type: 'character.set', field: 'appearance.robeTrim', value: 'teal' }],
            next: 'record',
          },
          {
            id: 'trimGold',
            icon: 'trim-gold',
            caption: 'Gold',
            actions: [{ type: 'character.set', field: 'appearance.robeTrim', value: 'gold' }],
            next: 'record',
          },
        ],
      },
      record: {
        type: 'action',
        actions: [flagSet('ch1.trimChosen')],
        next: 'done',
      },
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
    id: 'ch1.tailor.mirror',
    start: 'look',
    resumePolicy: 'restart-script',
    replayable: true,
    nodes: {
      look: voiceLine({
        speaker: 'npc.violet',
        voice: 'voice/ch1/violet/mirror',
        text: 'I look magical!',
        caption: 'A witch!',
        next: 'finish',
        portraitPose: 'proud',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.keeper.petAndName',
    start: 'welcome',
    resumePolicy: 'restart-current-node',
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
            actions: [{ type: 'character.set', field: 'pet.type', value: 'cat' }, audioSfx('sfx/ch1/petCat')],
            next: 'confirm',
          },
          {
            id: 'petOwl',
            icon: 'pet-owl',
            caption: 'Owl',
            actions: [{ type: 'character.set', field: 'pet.type', value: 'owl' }, audioSfx('sfx/ch1/petOwl')],
            next: 'confirm',
          },
          {
            id: 'petToad',
            icon: 'pet-toad',
            caption: 'Toad',
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
          flagSet('ch1.chapterCardSeen'),
          flagSet('ch1.complete'),
          { type: 'chapter.complete', chapter: 'ch1' },
          travel('ch2.previewRoom', 'start'),
        ],
      },
    },
  },
  {
    id: 'ch1.violet.broom',
    start: 'fast',
    resumePolicy: 'restart-script',
    replayable: true,
    nodes: {
      fast: voiceLine({
        speaker: 'npc.violet',
        voice: 'voice/ch1/violet/broom',
        text: 'That broom looks fast!',
        caption: 'Flying broom!',
        next: 'finish',
        portraitPose: 'wonder',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
  {
    id: 'ch1.violet.noSpells',
    start: 'later',
    resumePolicy: 'restart-script',
    replayable: true,
    nodes: {
      later: voiceLine({
        speaker: 'npc.violet',
        voice: 'voice/ch1/violet/noSpells',
        text: 'I need a spell!',
        caption: 'Spells come later!',
        next: 'finish',
      }),
      finish: { type: 'end', actions: [] },
    },
  },
];

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
        voice: 'voice/ch1/objective/useMap',
        text: 'Open your satchel and tap the golden star.',
        caption: 'Open your map!',
        mapStar: { room: 'ch1.diagonStreet', hotspot: 'street.ollivandersDoor' },
      },
      doneWhen: when({ allFlags: ['ch1.mapUsed'] }),
      hints: { lookTarget: 'hud.satchel', repeatVoice: 'voice/ch1/objective/useMap', trailTarget: 'hud.satchel', assistActions: [{ type: 'ui.open', surface: 'satchel', tab: 'map' }] },
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

function idMap(entries) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry]));
}

function roomMap(entries) {
  return Object.fromEntries(entries.map((room) => [room.id, {
    ...room,
    spawns: Object.fromEntries(Object.entries(room.spawns).map(([name, spawn]) => [name.split('.').at(-1), spawn])),
    exits: room.exits.map((exit) => ({
      ...exit,
      to: { ...exit.to, spawn: exit.to.spawn.split('.').at(-1) },
    })),
  }]));
}

const sceneDoneWhen = {
  'ch1.letter': when({ allFlags: ['ch1.letterRead'] }),
  'ch1.guideArrival': when({ allFlags: ['ch1.guideMet'] }),
  'ch1.leakyArrival': when({ allFlags: ['ch1.leakyReached'] }),
  'ch1.wallOpening': when({ allFlags: ['ch1.wallOpened'] }),
  'ch1.diagonMapIntro': when({ allFlags: ['ch1.satchelReceived'] }),
  'ch1.diagonArrival': when({ allFlags: ['ch1.mapUsed'] }),
  'ch1.wandShopping': when({ allFlags: ['ch1.wandChosen'] }),
  'ch1.robeShopping': when({ allFlags: ['ch1.trimChosen'] }),
  'ch1.petShopping': when({ allFlags: ['ch1.petNamed'] }),
  'ch1.ticket': when({ allFlags: ['ch1.ticketReceived'] }),
  'ch1.chapterCard': when({ allFlags: ['ch1.complete'] }),
  'ch1.freeRoam': noCondition,
};

function sceneMap(drafts) {
  return Object.fromEntries(drafts.map((draft, index) => {
    const room = draft.room ?? 'ch1.chapterCardRoom';
    const spawn = draft.spawn?.split('.').at(-1) ?? 'start';
    return [draft.id, {
      id: draft.id,
      room,
      spawn,
      when: draft.when,
      onEnter: draft.onEnter,
      doneWhen: sceneDoneWhen[draft.id],
      next: drafts[index + 1]?.id ?? null,
      resumeAt: { room, spawn },
    }];
  }));
}

export const chapter1 = {
  contractVersion: 1,
  id: 'ch1',
  number: 1,
  title: 'The Letter & Diagon Alley',
  season: 'late-summer',
  start: { scene: 'ch1.letter', room: 'ch1.bedroom', spawn: 'start' },
  scenes: sceneMap([
    { id: 'ch1.letter', room: 'ch1.bedroom', spawn: 'bedroom.start', quest: 'ch1.openLetter', when: when({ noFlags: ['ch1.letterRead'] }), onEnter: [] },
    { id: 'ch1.guideArrival', room: 'ch1.bedroom', spawn: 'bedroom.letter', quest: 'ch1.followGuide', when: when({ allFlags: ['ch1.letterRead'], noFlags: ['ch1.guideMet'] }), onEnter: [] },
    { id: 'ch1.leakyArrival', room: 'ch1.leaky', spawn: 'leaky.entry', quest: 'ch1.followGuide', when: when({ allFlags: ['ch1.guideMet'], noFlags: ['ch1.leakyReached'] }), onEnter: [dialogueStart('ch1.guide.leaky')] },
    { id: 'ch1.wallOpening', room: 'ch1.courtyard', spawn: 'courtyard.entry', quest: 'ch1.followGuide', when: when({ allFlags: ['ch1.leakyReached'], noFlags: ['ch1.wallOpened'] }), onEnter: [flagSet('ch1.courtyardReached'), dialogueStart('ch1.guide.wall')] },
    { id: 'ch1.diagonMapIntro', room: 'ch1.diagonStreet', spawn: 'street.west', quest: 'ch1.useMap', when: when({ allFlags: ['ch1.wallOpened'], noFlags: ['ch1.satchelReceived'] }), backgroundVariant: 'day', onEnter: [flagSet('ch1.diagonReached'), dialogueStart('ch1.guide.map')] },
    { id: 'ch1.diagonArrival', room: 'ch1.diagonStreet', spawn: 'street.west', quest: 'ch1.useMap', when: when({ allFlags: ['ch1.wallOpened', 'ch1.satchelReceived'], noFlags: ['ch1.shoppingComplete'] }), backgroundVariant: 'day', onEnter: [flagSet('ch1.diagonReached')] },
    { id: 'ch1.wandShopping', room: 'ch1.ollivanders', spawn: 'ollivanders.entry', quest: 'ch1.chooseWand', when: when({ allFlags: ['ch1.mapUsed'], noFlags: ['ch1.wandChosen'] }), onEnter: [dialogueStart('ch1.wandmaker.welcome')] },
    { id: 'ch1.robeShopping', room: 'ch1.malkins', spawn: 'malkins.entry', quest: 'ch1.chooseRobes', when: when({ allFlags: ['ch1.wandChosen'], noFlags: ['ch1.trimChosen'] }), onEnter: [] },
    { id: 'ch1.petShopping', room: 'ch1.menagerie', spawn: 'menagerie.entry', quest: 'ch1.choosePet', when: when({ allFlags: ['ch1.trimChosen'], noFlags: ['ch1.petNamed'] }), onEnter: [] },
    { id: 'ch1.ticket', room: 'ch1.diagonStreet', spawn: 'street.east', quest: 'ch1.returnToGuide', when: when({ allFlags: ['ch1.petNamed'], noFlags: ['ch1.ticketReceived'] }), backgroundVariant: 'dusk', onEnter: [] },
    { id: 'ch1.chapterCard', room: null, spawn: null, quest: null, when: when({ allFlags: ['ch1.ticketReceived'], noFlags: ['ch1.chapterCardSeen'] }), onEnter: [setPiecePlay('sp.chapterCard')] },
    { id: 'ch1.freeRoam', room: 'ch1.diagonStreet', spawn: 'street.west', quest: null, when: when({ allFlags: ['ch1.complete'] }), backgroundVariant: 'dusk', onEnter: [] },
  ]),
  rooms: roomMap([
    {
      id: 'ch1.bedroom',
      size: roomSize,
      background: {
        layers: ['rooms/ch1/bedroom/sky', 'rooms/ch1/bedroom/base'],
        fit: 'cover',
        focalPoint: { x: 0.5, y: 0.5 },
        variants: {},
      },
      walkBand,
      spawns: {
        'bedroom.start': { x: 500, y: 610, facing: 'right' },
        'bedroom.letter': { x: 760, y: 610, facing: 'left' },
      },
      exits: [],
      occupants: [
        { npc: 'npc.violet', x: 500, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.owlPost', x: 1060, y: 210, facing: 'left', pose: 'perch', when: when({ noFlags: ['ch1.owlTapped'] }) },
        { npc: 'npc.guide', x: 250, y: 610, facing: 'right', pose: 'idle', when: when({ allFlags: ['ch1.letterRead'] }) },
      ],
      hotspots: [
        {
          id: 'bedroom.owl',
          kind: 'action',
          hitArea: circle(1060, 210, 70),
          approach: { x: 950, y: 605, facing: 'right' },
          when: when({ noFlags: ['ch1.owlTapped'] }),
          presentation: { icon: 'owl', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [audioSfx('sfx/ch1/owlTap'), flagSet('ch1.owlTapped'), setPiecePlay('sp.letter')],
        },
        {
          id: 'bedroom.letter',
          kind: 'inspect',
          hitArea: circle(650, 350, 160),
          approach: { x: 760, y: 610, facing: 'left' },
          when: when({ allFlags: ['ch1.owlTapped'], noFlags: ['ch1.letterRead'] }),
          presentation: { icon: 'letter', glow: 'objective' },
          repeat: 'until-condition',
          requiredSpell: null,
          onInteract: [flagSet('ch1.letterOpened'), setPiecePlay('sp.letterOpen'), uiOpen('letter-reading')],
        },
        {
          id: 'bedroom.guide',
          kind: 'talk',
          hitArea: circle(250, 455, 95),
          approach: { x: 360, y: 610, facing: 'left' },
          when: when({ allFlags: ['ch1.letterRead'], noFlags: ['ch1.guideMet'] }),
          presentation: { icon: 'talk', glow: 'objective' },
          repeat: 'until-condition',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.guide.arrival')],
        },
        {
          id: 'bedroom.exit',
          kind: 'action',
          hitArea: circle(250, 455, 150),
          approach: null,
          when: when({ allFlags: ['ch1.guideMet'] }),
          presentation: { icon: 'door', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [travel('ch1.leaky', 'leaky.entry')],
        },
      ],
      ambientSetPieces: [],
    },
    {
      id: 'ch1.leaky',
      size: roomSize,
      background: { layers: ['rooms/ch1/leaky/base'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
      walkBand,
      spawns: {
        'leaky.entry': { x: 160, y: 610, facing: 'right' },
        'leaky.guide': { x: 760, y: 610, facing: 'right' },
      },
      exits: [
        {
          id: 'leaky.courtyardDoor',
          hitArea: rect(1090, 360, 150, 220),
          to: { room: 'ch1.courtyard', spawn: 'courtyard.entry' },
          icon: 'door',
          transition: 'ink',
          when: when({ allFlags: ['ch1.leakyReached'] }),
        },
      ],
      occupants: [
        { npc: 'npc.violet', x: 160, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.guide', x: 760, y: 610, facing: 'right', pose: 'idle', when: noCondition },
      ],
      hotspots: [],
      ambientSetPieces: ['am.inkTransitions'],
    },
    {
      id: 'ch1.courtyard',
      size: roomSize,
      background: { layers: ['rooms/ch1/courtyard/base'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
      walkBand,
      spawns: {
        'courtyard.entry': { x: 145, y: 610, facing: 'right' },
        'courtyard.guide': { x: 330, y: 610, facing: 'right' },
      },
      exits: [],
      occupants: [
        { npc: 'npc.violet', x: 145, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.guide', x: 330, y: 610, facing: 'right', pose: 'idle', when: noCondition },
      ],
      hotspots: [
        {
          id: 'courtyard.brickWall',
          kind: 'action',
          hitArea: circle(760, 330, 180),
          approach: { x: 650, y: 610, facing: 'right' },
          when: when({ noFlags: ['ch1.wallOpened'] }),
          presentation: { icon: 'sparkle', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [setPiecePlay('sp.brickWall')],
        },
      ],
      ambientSetPieces: [],
    },
    {
      id: 'ch1.diagonStreet',
      size: streetSize,
      background: {
        layers: ['rooms/ch1/diagon/day'],
        fit: 'cover',
        focalPoint: { x: 0.5, y: 0.5 },
        variants: { dusk: ['rooms/ch1/diagon/dusk'] },
      },
      walkBand,
      spawns: {
        'street.west': { x: 180, y: 610, facing: 'right' },
        'street.east': { x: 1100, y: 610, facing: 'left' },
        'street.guide': { x: 260, y: 610, facing: 'right' },
      },
      exits: [
        {
          id: 'street.ollivandersDoor',
          hitArea: circle(390, 405, 100),
          to: { room: 'ch1.ollivanders', spawn: 'ollivanders.entry' },
          icon: 'door',
          transition: 'ink',
          when: when({ allFlags: ['ch1.mapUsed'] }),
        },
        {
          id: 'street.malkinsDoor',
          hitArea: circle(690, 405, 100),
          to: { room: 'ch1.malkins', spawn: 'malkins.entry' },
          icon: 'door',
          transition: 'ink',
          when: when({ allFlags: ['ch1.wandChosen'] }),
        },
        {
          id: 'street.menagerieDoor',
          hitArea: circle(1010, 405, 100),
          to: { room: 'ch1.menagerie', spawn: 'menagerie.entry' },
          icon: 'door',
          transition: 'ink',
          when: when({ allFlags: ['ch1.trimChosen'] }),
        },
      ],
      occupants: [
        { npc: 'npc.violet', x: 180, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.guide', x: 260, y: 610, facing: 'right', pose: 'idle', when: noCondition },
      ],
      hotspots: [
        {
          id: 'street.guide',
          kind: 'talk',
          hitArea: circle(260, 465, 95),
          approach: { x: 370, y: 610, facing: 'left' },
          when: when({ allFlags: ['ch1.wallOpened'], noFlags: ['ch1.mapUsed'] }),
          presentation: { icon: 'talk', glow: 'objective' },
          repeat: 'until-condition',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.guide.map')],
        },
        {
          id: 'street.guideTicket',
          kind: 'talk',
          hitArea: circle(260, 465, 95),
          approach: { x: 370, y: 610, facing: 'left' },
          when: when({ allFlags: ['ch1.petNamed'], noFlags: ['ch1.ticketReceived'] }),
          presentation: { icon: 'ticket', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.guide.ticket')],
        },
        {
          id: 'street.broomDisplay',
          kind: 'inspect',
          hitArea: circle(900, 300, 75),
          approach: { x: 900, y: 610, facing: 'right' },
          when: noCondition,
          presentation: { icon: 'look', glow: 'soft' },
          repeat: 'always',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.violet.broom')],
        },
      ],
      ambientSetPieces: ['am.inkTransitions'],
    },
    {
      id: 'ch1.ollivanders',
      size: roomSize,
      background: { layers: ['rooms/ch1/ollivanders/base'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
      walkBand,
      spawns: {
        'ollivanders.entry': { x: 120, y: 610, facing: 'right' },
        'ollivanders.wandmaker': { x: 285, y: 610, facing: 'right' },
      },
      exits: [
        {
          id: 'ollivanders.exit',
          hitArea: rect(10, 370, 130, 210),
          to: { room: 'ch1.diagonStreet', spawn: 'street.west' },
          icon: 'door',
          transition: 'ink',
          when: noCondition,
        },
      ],
      occupants: [
        { npc: 'npc.violet', x: 120, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.wandmaker', x: 285, y: 610, facing: 'right', pose: 'idle', when: noCondition },
      ],
      hotspots: [
        {
          id: 'ollivanders.wand1',
          kind: 'action',
          hitArea: circle(690, 345, 75),
          approach: { x: 690, y: 610, facing: 'right' },
          when: when({ noFlags: ['ch1.wandTry1'] }),
          presentation: { icon: 'wand', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [flagSet('ch1.wandTry1'), setPiecePlay('sp.wandChaos1'), dialogueStart('ch1.wandmaker.wrong1')],
        },
        {
          id: 'ollivanders.wand2',
          kind: 'action',
          hitArea: circle(910, 330, 75),
          approach: { x: 910, y: 610, facing: 'right' },
          when: when({ allFlags: ['ch1.wandTry1'], noFlags: ['ch1.wandTry2'] }),
          presentation: { icon: 'wand', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [flagSet('ch1.wandTry2'), setPiecePlay('sp.wandChaos2'), dialogueStart('ch1.wandmaker.wrong2')],
        },
        {
          id: 'ollivanders.wand3',
          kind: 'action',
          hitArea: circle(1110, 305, 75),
          approach: { x: 1080, y: 610, facing: 'right' },
          when: when({ allFlags: ['ch1.wandTry2'], noFlags: ['ch1.wandChosen'] }),
          presentation: { icon: 'wand', glow: 'objective' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [
            { type: 'character.set', field: 'wandId', value: 'violet-first-wand' },
            flagSet('ch1.wandChosen'),
            setPiecePlay('sp.wandChosen'),
            { type: 'yearbook.capture', moment: 'ch1.wandChosen' },
            dialogueStart('ch1.wandmaker.chosen'),
          ],
        },
        {
          id: 'ollivanders.cardMorgana',
          kind: 'collectible',
          hitArea: circle(1060, 170, 60),
          approach: { x: 1030, y: 610, facing: 'right' },
          when: noCondition,
          presentation: { icon: 'frog-card', glow: 'hidden' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [{ type: 'collection.add', collection: 'cards', id: 'morgana' }],
        },
      ],
      ambientSetPieces: ['am.inkTransitions'],
    },
    {
      id: 'ch1.malkins',
      size: roomSize,
      background: { layers: ['rooms/ch1/malkins/base'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
      walkBand,
      spawns: {
        'malkins.entry': { x: 120, y: 610, facing: 'right' },
        'malkins.tailor': { x: 310, y: 610, facing: 'right' },
      },
      exits: [
        {
          id: 'malkins.exit',
          hitArea: rect(10, 370, 130, 210),
          to: { room: 'ch1.diagonStreet', spawn: 'street.west' },
          icon: 'door',
          transition: 'ink',
          when: noCondition,
        },
      ],
      occupants: [
        { npc: 'npc.violet', x: 120, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.tailor', x: 310, y: 610, facing: 'right', pose: 'idle', when: noCondition },
      ],
      hotspots: [
        {
          id: 'malkins.stool',
          kind: 'action',
          hitArea: circle(690, 500, 85),
          approach: { x: 670, y: 610, facing: 'right' },
          when: when({ noFlags: ['ch1.trimChosen'] }),
          presentation: { icon: 'robes', glow: 'objective' },
          repeat: 'until-condition',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.tailor.fitting')],
        },
        {
          id: 'malkins.mirror',
          kind: 'inspect',
          hitArea: circle(1030, 350, 90),
          approach: { x: 1000, y: 610, facing: 'right' },
          when: when({ allFlags: ['ch1.trimChosen'] }),
          presentation: { icon: 'look', glow: 'soft' },
          repeat: 'always',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.tailor.mirror')],
        },
      ],
      ambientSetPieces: ['am.inkTransitions'],
    },
    {
      id: 'ch1.menagerie',
      size: roomSize,
      background: { layers: ['rooms/ch1/menagerie/base'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
      walkBand,
      spawns: {
        'menagerie.entry': { x: 120, y: 610, facing: 'right' },
        'menagerie.keeper': { x: 270, y: 610, facing: 'right' },
      },
      exits: [
        {
          id: 'menagerie.exit',
          hitArea: rect(10, 370, 130, 210),
          to: { room: 'ch1.diagonStreet', spawn: 'street.east' },
          icon: 'door',
          transition: 'ink',
          when: noCondition,
        },
      ],
      occupants: [
        { npc: 'npc.violet', x: 120, y: 610, facing: 'right', pose: 'idle', when: noCondition },
        { npc: 'npc.menagerieKeeper', x: 270, y: 610, facing: 'right', pose: 'idle', when: noCondition },
      ],
      hotspots: [
        {
          id: 'menagerie.keeper',
          kind: 'talk',
          hitArea: circle(270, 455, 95),
          approach: { x: 390, y: 610, facing: 'left' },
          when: when({ noFlags: ['ch1.petNamed'] }),
          presentation: { icon: 'talk', glow: 'objective' },
          repeat: 'until-condition',
          requiredSpell: null,
          onInteract: [dialogueStart('ch1.keeper.petAndName')],
        },
        {
          id: 'menagerie.cardDumbledore',
          kind: 'collectible',
          hitArea: circle(1130, 170, 60),
          approach: { x: 1100, y: 610, facing: 'right' },
          when: noCondition,
          presentation: { icon: 'frog-card', glow: 'hidden' },
          repeat: 'once',
          requiredSpell: null,
          onInteract: [{ type: 'collection.add', collection: 'cards', id: 'dumbledore' }],
        },
      ],
      ambientSetPieces: ['am.inkTransitions'],
    },
    {
      id: 'ch1.chapterCardRoom',
      size: roomSize,
      background: { layers: ['chapterCards/ch1/platform'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
      walkBand,
      spawns: { start: { x: 640, y: 610, facing: 'right' } },
      exits: [],
      occupants: [],
      hotspots: [],
      ambientSetPieces: [],
    },
  ]),
  npcs: idMap([
    { id: 'npc.violet', displayName: 'Violet', puppet: 'puppet.violet', portrait: 'portrait.violet', voiceRole: 'violet', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: 'ch1.violet.noSpells' },
    { id: 'npc.narrator', displayName: 'Narrator', puppet: 'puppet.none', portrait: 'portrait.none', voiceRole: 'narrator', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
    { id: 'npc.guide', displayName: 'Hagrid', puppet: 'puppet.guide', portrait: 'portrait.guide', voiceRole: 'guide', scale: 2, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'scripted' }, defaultTalk: null },
    { id: 'npc.wandmaker', displayName: 'Wandmaker', puppet: 'puppet.wandmaker', portrait: 'portrait.wandmaker', voiceRole: 'wandmaker', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
    { id: 'npc.tailor', displayName: 'Tailor', puppet: 'puppet.tailor', portrait: 'portrait.tailor', voiceRole: 'tailor', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
    { id: 'npc.menagerieKeeper', displayName: 'Keeper', puppet: 'puppet.menagerieKeeper', portrait: 'portrait.menagerieKeeper', voiceRole: 'keeper', scale: 1, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'static' }, defaultTalk: null },
    { id: 'npc.owlPost', displayName: 'Owl', puppet: 'puppet.owlPost', portrait: 'portrait.none', voiceRole: 'creature', scale: 0.75, hitRadius: 88, defaultPose: 'perch', controller: { kind: 'scripted' }, defaultTalk: null },
    { id: 'npc.pet.cat', displayName: 'Cat', puppet: 'puppet.pet.cat', portrait: 'portrait.pet.cat', voiceRole: 'creature', scale: 0.55, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'follow', target: 'npc.violet', minimumDistance: 70, maxDistance: 190 }, defaultTalk: null },
    { id: 'npc.pet.owl', displayName: 'Owl', puppet: 'puppet.pet.owl', portrait: 'portrait.pet.owl', voiceRole: 'creature', scale: 0.55, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'follow', target: 'npc.violet', minimumDistance: 90, maxDistance: 220 }, defaultTalk: null },
    { id: 'npc.pet.toad', displayName: 'Toad', puppet: 'puppet.pet.toad', portrait: 'portrait.pet.toad', voiceRole: 'creature', scale: 0.42, hitRadius: 88, defaultPose: 'idle', controller: { kind: 'follow', target: 'npc.violet', minimumDistance: 55, maxDistance: 150 }, defaultTalk: null },
  ]),
  dialogues: idMap(dialogueGraphs),
  quests: { [questGraph.id]: questGraph },
  learningBeats: {},
  setPieces: {
    'sp.letter': {
      id: 'sp.letter',
      tier: 'T2',
      duration: 4.8,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['rooms/ch1/bedroom/base', 'rooms/ch1/bedroom/sky', 'sfx/ch1/owlTap', 'sfx/ch1/owlFlap', 'sfx/ch1/paperSlide', 'sfx/ch1/sealCrack'],
      fallback: 'fallback.letterCrossfade',
      reducedMotion: 'reduced.letterDeliveryFade',
      params: { specification: 'SP-01' },
      timeline: { tracks: [sfxCue(0.25, 'sfx/ch1/owlFlap'), sfxCue(0.95, 'sfx/ch1/paperSlide')] },
      verification: { keyframes: [0, 2, 3.2, 4.8], checklist: ['Violet is legible on the envelope.', 'The letter folds do not intersect.', 'No painting edge is exposed.'] },
      onComplete: [],
    },
    'sp.letterOpen': {
      id: 'sp.letterOpen',
      tier: 'T2',
      duration: 4.6,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['sfx/ch1/sealCrack', 'sfx/ch1/paperSlide'],
      fallback: 'fallback.letterCrossfade',
      reducedMotion: 'reduced.letterOpenFade',
      params: { specification: 'SP-01', variant: 'open-invitation' },
      timeline: { tracks: [sfxCue(0.2, 'sfx/ch1/sealCrack'), sfxCue(1.05, 'sfx/ch1/paperSlide')] },
      verification: {
        keyframes: [0, 0.35, 0.9, 1.55, 2.25, 3.1, 4.6],
        checklist: ['The owl seal visibly cracks before it parts.', 'The flap, paper rise, and two folds each have a distinct readable beat.', 'No intermediate frame becomes a large blank rectangle.', 'The invitation settles into the exact reading-surface position.'],
      },
      onComplete: [],
    },
    'reduced.letterDeliveryFade': {
      id: 'reduced.letterDeliveryFade',
      tier: 'T1',
      duration: 1.9,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'reduced',
      assets: ['sfx/ch1/owlFlap', 'sfx/ch1/paperSlide'],
      fallback: null,
      reducedMotion: null,
      params: { specification: 'SP-01', variant: 'reduced-delivery' },
      timeline: { tracks: [sfxCue(0.15, 'sfx/ch1/owlFlap'), sfxCue(0.4, 'sfx/ch1/paperSlide')] },
      verification: { keyframes: [0, 0.5, 1.9], checklist: ['The owl and envelope crossfade without rapid travel.', 'The delivered letter reaches its normal resting place.'] },
      onComplete: [],
    },
    'reduced.letterOpenFade': {
      id: 'reduced.letterOpenFade',
      tier: 'T1',
      duration: 1.35,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'reduced',
      assets: ['sfx/ch1/sealCrack', 'sfx/ch1/paperSlide'],
      fallback: null,
      reducedMotion: null,
      params: { specification: 'SP-01', variant: 'reduced-open' },
      timeline: { tracks: [sfxCue(0.2, 'sfx/ch1/sealCrack'), sfxCue(0.45, 'sfx/ch1/paperSlide')] },
      verification: { keyframes: [0, 0.5, 1.3], checklist: ['The sealed envelope crossfades to the fully readable invitation without unfolding motion.', 'The reading action appears without a static input lock.'] },
      onComplete: [],
    },
    'sp.brickWall': {
      id: 'sp.brickWall',
      tier: 'T3',
      duration: 3.6,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['rooms/ch1/courtyard/base', 'rooms/ch1/diagon/day', 'sfx/ch1/wallRumble', 'sfx/ch1/brickClack'],
      fallback: 'fallback.doubleHingedWall',
      reducedMotion: 'reduced.wallCrossfade',
      params: { specification: 'SP-02', columns: 10, rows: 8 },
      timeline: { tracks: [sfxCue(0, 'sfx/ch1/wallRumble'), sfxCue(0.45, 'sfx/ch1/brickClack')] },
      verification: { keyframes: [0, 0.6, 1, 1.4, 1.8, 2.2, 2.6, 3.2], checklist: ['The intact wall has no visible seams.', 'The opening reads from the center outward.', 'The street horizon remains aligned.'] },
      onComplete: [flagSet('ch1.wallOpened'), travel('ch1.diagonStreet', 'street.west')],
    },
    'sp.wandChaos1': {
      id: 'sp.wandChaos1',
      tier: 'T2',
      duration: 2.2,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['sfx/ch1/wandPaperWhirl'],
      fallback: 'fallback.papersOnly',
      reducedMotion: 'reduced.papersShort',
      params: { specification: 'SP-03', variant: 'papers' },
      timeline: { tracks: [sfxCue(0, 'sfx/ch1/wandPaperWhirl')] },
      verification: { keyframes: [0, 0.8, 1.5, 2.2], checklist: ['Every paper settles before control returns.'] },
      onComplete: [],
    },
    'sp.wandChaos2': {
      id: 'sp.wandChaos2',
      tier: 'T2',
      duration: 2.6,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['sfx/ch1/wandPaperWhirl', 'sfx/ch1/vaseShatter'],
      fallback: 'fallback.papersAndWobble',
      reducedMotion: 'reduced.vaseSwap',
      params: { specification: 'SP-03', variant: 'vase' },
      timeline: { tracks: [sfxCue(0, 'sfx/ch1/wandPaperWhirl'), sfxCue(1.05, 'sfx/ch1/vaseShatter')] },
      verification: { keyframes: [0, 0.8, 1.6, 2.6], checklist: ['Vase shards stay inside the room.', 'Every prop settles before control returns.'] },
      onComplete: [],
    },
    'sp.wandChosen': {
      id: 'sp.wandChosen',
      tier: 'T2',
      duration: 3,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['sfx/ch1/wandChosen'],
      fallback: 'fallback.goldenWash',
      reducedMotion: 'reduced.goldenFade',
      params: { specification: 'SP-03', variant: 'golden-choice', crescendoAt: 1.65 },
      timeline: { tracks: [sfxCue(0, 'sfx/ch1/wandChosen')] },
      verification: { keyframes: [0, 1, 2, 3], checklist: ['The golden wash does not clip to white.', 'The chosen wand remains visible.'] },
      onComplete: [],
    },
    'sp.chapterCard': {
      id: 'sp.chapterCard',
      tier: 'T1',
      duration: 4,
      clock: 'world',
      blocksInput: true,
      particleBudget: 'standard',
      assets: ['chapterCards/ch1/platform', 'sfx/ch1/chapterTurn'],
      fallback: 'fallback.staticPage',
      reducedMotion: 'reduced.staticPage',
      params: { specification: 'chapter-card' },
      timeline: { tracks: [sfxCue(0, 'sfx/ch1/chapterTurn'), musicCue(0.2, 'music/ch1/chapterTriumph')] },
      verification: { keyframes: [0, 1, 4], checklist: ['The chapter title is legible.', 'The page transition reveals no blank frame.'] },
      onComplete: [dialogueStart('ch1.narrator.chapterEnd')],
    },
  },
  encounters: {},
  minigames: {},
  chapterCard: {
    art: 'chapterCards/ch1/platform',
    voice: 'voice/ch1/narrator/chapterEnd',
    title: 'Platform Nine and Three-Quarters',
  },
  yearbookMoments: ['ch1.wandChosen'],
};

export const chapter1Map = {
  contractVersion: 1,
  id: 'map.ch1.diagon',
  asset: 'maps/ch1/diagon',
  locations: [
    mapLocation({
      id: 'map.ch1.diagonStreet',
      icon: 'street',
      caption: 'Explore',
      alwaysUnlocked: true,
      to: { room: 'ch1.diagonStreet', spawn: 'west' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.guideTicket' },
      vignette: { x: 114, y: 374, width: 212, height: 184 },
    }),
    mapLocation({
      id: 'map.ch1.ollivanders',
      icon: 'wand-shop',
      caption: 'Wand',
      to: { room: 'ch1.ollivanders', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.ollivandersDoor' },
      vignette: { x: 324, y: 282, width: 212, height: 184 },
      beforeTravel: [flagSet('ch1.mapUsed')],
    }),
    mapLocation({
      id: 'map.ch1.malkins',
      icon: 'robes-shop',
      caption: 'Robes',
      to: { room: 'ch1.malkins', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.malkinsDoor' },
      vignette: { x: 588, y: 236, width: 212, height: 184 },
    }),
    mapLocation({
      id: 'map.ch1.menagerie',
      icon: 'pet-shop',
      caption: 'Pet',
      to: { room: 'ch1.menagerie', spawn: 'entry' },
      objectiveTarget: { room: 'ch1.diagonStreet', hotspot: 'street.menagerieDoor' },
      vignette: { x: 894, y: 350, width: 212, height: 184 },
    }),
  ],
  routes: [
    {
      id: 'route.ch1.streetToOllivanders',
      from: 'map.ch1.diagonStreet',
      to: 'map.ch1.ollivanders',
      points: [{ x: 220, y: 466 }, { x: 315, y: 344 }, { x: 430, y: 374 }],
    },
    {
      id: 'route.ch1.ollivandersToMalkins',
      from: 'map.ch1.ollivanders',
      to: 'map.ch1.malkins',
      points: [{ x: 430, y: 374 }, { x: 565, y: 286 }, { x: 694, y: 328 }],
    },
    {
      id: 'route.ch1.malkinsToMenagerie',
      from: 'map.ch1.malkins',
      to: 'map.ch1.menagerie',
      points: [{ x: 694, y: 328 }, { x: 848, y: 402 }, { x: 1000, y: 442 }],
    },
  ],
};

export const chapter1ResumeRecaps = [
  { step: 'openLetter', voice: 'voice/ch1/recap/openLetter', text: 'An owl brought a letter for Violet.', caption: 'A letter!' },
  { step: 'followGuide', voice: 'voice/ch1/recap/followGuide', text: 'Hagrid is waiting to show you the magical street.', caption: 'Follow Hagrid!' },
  { step: 'useMap', voice: 'voice/ch1/recap/useMap', text: 'The magical street is open. Your wand is waiting.', caption: 'Find your wand!' },
  { step: 'chooseRobes', voice: 'voice/ch1/recap/chooseRobes', text: 'Your wand chose you. Now choose your robes.', caption: 'Choose your robes!' },
  { step: 'choosePet', voice: 'voice/ch1/recap/choosePet', text: 'You found your wand and robes. Now choose a friend.', caption: 'Choose a pet!' },
  { step: 'returnToGuide', voice: 'voice/ch1/recap/returnToGuide', text: 'Your new friend is ready. Hagrid has your ticket.', caption: 'Find Hagrid!' },
];

export const chapter1Flags = [
    'ch1.owlTapped',
    'ch1.letterOpened',
    'ch1.letterRead',
    'ch1.guideMet',
    'ch1.leakyReached',
    'ch1.courtyardReached',
    'ch1.wallOpened',
    'ch1.diagonReached',
    'ch1.satchelReceived',
    'ch1.mapUsed',
    'ch1.wandTry1',
    'ch1.wandTry2',
    'ch1.wandChosen',
    'ch1.trimChosen',
    'ch1.petChosen',
    'ch1.petNamed',
    'ch1.shoppingComplete',
    'ch1.ticketReceived',
    'ch1.chapterCardSeen',
    'ch1.complete',
    'ch1.previewSeen',
];

export const chapter1AssetKeys = [
    'rooms/ch1/bedroom/base',
    'rooms/ch1/bedroom/sky',
    'rooms/ch1/leaky/base',
    'rooms/ch1/courtyard/base',
    'rooms/ch1/diagon/day',
    'rooms/ch1/diagon/dusk',
    'rooms/ch1/ollivanders/base',
    'rooms/ch1/malkins/base',
    'rooms/ch1/menagerie/base',
    'maps/ch1/diagon',
    'chapterCards/ch1/platform',
    'cards/morgana/portrait',
    'cards/dumbledore/portrait',
    'music/ch1/violetTheme',
    'music/ch1/diagonAlley',
    'music/ch1/chapterTriumph',
    'ambience/ch1/bedroom',
    'ambience/ch1/leaky',
    'ambience/ch1/diagon',
    'ambience/ch1/shop',
    'sfx/ch1/owlTap',
    'sfx/ch1/owlFlap',
    'sfx/ch1/paperSlide',
    'sfx/ch1/sealCrack',
    'sfx/ch1/wallRumble',
    'sfx/ch1/brickClack',
    'sfx/ch1/wandPaperWhirl',
    'sfx/ch1/vaseShatter',
    'sfx/ch1/wandChosen',
    'sfx/ch1/coin',
    'sfx/ch1/ticket',
    'sfx/ch1/chapterTurn',
    'sfx/ch1/petCat',
    'sfx/ch1/petOwl',
    'sfx/ch1/petToad',
    'voice/ch1/card/morgana',
    'voice/ch1/card/dumbledore',
    ...dialogueGraphs.flatMap((dialogue) =>
      Object.values(dialogue.nodes)
        .filter((node) => node.type === 'line')
        .map((node) => node.voice),
    ),
    ...Object.values(questGraph.steps).map((step) => step.objective.voice),
    'voice/ch1/recap/openLetter',
    'voice/ch1/recap/followGuide',
    'voice/ch1/recap/useMap',
    'voice/ch1/recap/chooseRobes',
    'voice/ch1/recap/choosePet',
    'voice/ch1/recap/returnToGuide',
];

export const chapter1CodeResourceKeys = [
    'puppet.violet',
    'puppet.guide',
    'puppet.wandmaker',
    'puppet.tailor',
    'puppet.menagerieKeeper',
    'puppet.owlPost',
    'puppet.pet.cat',
    'puppet.pet.owl',
    'puppet.pet.toad',
    'prop.ch1.letter',
    'prop.ch1.seal',
    'prop.ch1.ticket',
    'prop.ch1.wand1',
    'prop.ch1.wand2',
    'prop.ch1.wandChosen',
    'prop.ch1.vaseShards',
];

export default chapter1;
