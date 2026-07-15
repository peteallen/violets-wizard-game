import { chapter1AssetKeys } from './assets.js';
import { noCondition, when } from './authoring.js';
import { chapter1NpcDefinitions } from './cast.js';
import { chapter1CharacterIds } from './characters.js';
import { chapter1DialogueDefinitions } from './dialogues.js';
import { chapter1Map } from './map.js';
import { chapter1QuestDefinition } from './quests.js';
import { chapter1ResumeRecaps } from './recaps.js';
import {
  chapter1CodeResourceKeys,
  chapter1Flags,
} from './resources.js';
import { chapter1RoomDefinitions } from './rooms/index.js';
import { chapter1SceneDefinitions } from './scenes/index.js';
import { chapter1SetPieceDefinitions } from './setPieces.js';

export {
  chapter1AssetKeys,
  chapter1CharacterIds,
  chapter1CodeResourceKeys,
  chapter1Flags,
  chapter1Map,
  chapter1ResumeRecaps,
};

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
  const ordered = [...drafts].sort((left, right) => left.order - right.order);
  return Object.fromEntries(ordered.map((draft, index) => {
    const room = draft.room ?? 'ch1.chapterCardRoom';
    const spawn = draft.spawn?.split('.').at(-1) ?? 'start';
    return [draft.id, {
      id: draft.id,
      room,
      spawn,
      when: draft.when,
      onEnter: draft.onEnter,
      doneWhen: sceneDoneWhen[draft.id],
      next: ordered[index + 1]?.id ?? null,
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
  scenes: sceneMap(chapter1SceneDefinitions),
  rooms: roomMap(chapter1RoomDefinitions),
  npcs: idMap(chapter1NpcDefinitions),
  dialogues: idMap(chapter1DialogueDefinitions),
  quests: { [chapter1QuestDefinition.id]: chapter1QuestDefinition },
  learningBeats: {},
  setPieces: chapter1SetPieceDefinitions,
  encounters: {},
  minigames: {},
  chapterCard: {
    art: 'chapterCards/ch1/platform',
    voice: 'voice/ch1/narrator/chapterEnd',
    title: 'Platform Nine and Three-Quarters',
  },
  yearbookMoments: ['ch1.wandChosen'],
};

export default chapter1;
