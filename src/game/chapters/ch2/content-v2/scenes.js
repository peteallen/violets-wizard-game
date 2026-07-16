import { defineScene } from '../../../content/chapterAuthoring.js';
import {
  actionHotspot,
  circle,
  dialogueStart,
  flagSet,
  noCondition,
  occupant,
  rect,
  setPiecePlay,
  storyLayer,
  travel,
  when,
} from './authoring.js';

const quest = 'ch2.quest.belonging';

export const kingsCrossScene = defineScene({
  id: 'ch2.scene.kingsCross',
  order: 10,
  room: 'ch2.kingsCross',
  spawn: 'start',
  when: when({ allFlags: ['ch1.complete'], noFlags: ['ch2.barrierCrossed'] }),
  onEnter: [],
  quest,
  resumeAt: { room: 'ch2.kingsCross', spawn: 'start' },
  layer: storyLayer({
    hotspots: [
      actionHotspot({
        id: 'ch2.kingsCross.barrier',
        hitArea: rect(820, 250, 230, 390),
        approach: { x: 760, y: 620, facing: 'right' },
        icon: 'barrier-spark',
        onInteract: [setPiecePlay('ch2.setPiece.barrierRun')],
      }),
    ],
  }),
});

export const barrierPlatformScene = defineScene({
  id: 'ch2.scene.barrierPlatform',
  order: 20,
  room: 'ch2.kingsCross',
  spawn: 'platform',
  when: when({ allFlags: ['ch2.barrierCrossed'], noFlags: ['ch2.boardedTrain'] }),
  onEnter: [],
  quest,
  roomVariant: 'platform',
  resumeAt: { room: 'ch2.kingsCross', spawn: 'platform' },
  layer: storyLayer({
    occupants: [occupant('ch2.npc.conductor', 900, 620, 'left')],
    hotspots: [
      actionHotspot({
        id: 'ch2.platform.conductor',
        hitArea: circle(900, 500, 112),
        approach: { x: 780, y: 620, facing: 'right' },
        icon: 'talk',
        onInteract: [dialogueStart('ch2.dialogue.platformWelcome')],
      }),
    ],
  }),
});

export const trainFriendsScene = defineScene({
  id: 'ch2.scene.trainFriends',
  order: 30,
  room: 'ch2.trainCompartment',
  spawn: 'door',
  when: when({ allFlags: ['ch2.boardedTrain'], noFlags: ['ch2.friendsMet'] }),
  onEnter: [],
  quest,
  resumeAt: { room: 'ch2.trainCompartment', spawn: 'door' },
  layer: storyLayer({
    occupants: [
      occupant('ch2.npc.harry', 660, 600, 'left', 'seated'),
      occupant('ch2.npc.ron', 820, 600, 'left', 'seated'),
      occupant('ch2.npc.hermione', 980, 600, 'left', 'seated'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch2.train.harry',
        hitArea: circle(660, 490, 104),
        approach: { x: 520, y: 620, facing: 'right' },
        icon: 'talk',
        onInteract: [dialogueStart('ch2.dialogue.trainFriends')],
      }),
    ],
  }),
});

export const trolleySweetsScene = defineScene({
  id: 'ch2.scene.trolleySweets',
  order: 40,
  room: 'ch2.trainCompartment',
  spawn: 'window',
  when: when({ allFlags: ['ch2.friendsMet'], noFlags: ['ch2.trainComplete'] }),
  onEnter: [],
  quest,
  resumeAt: { room: 'ch2.trainCompartment', spawn: 'window' },
  layer: storyLayer({
    occupants: [
      occupant('ch2.npc.harry', 660, 600, 'left', 'seated'),
      occupant('ch2.npc.ron', 820, 600, 'left', 'seated'),
      occupant('ch2.npc.hermione', 980, 600, 'left', 'seated'),
      occupant('ch2.npc.trolleyWitch', 280, 620, 'right'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch2.train.trolley',
        hitArea: circle(280, 500, 112),
        approach: { x: 410, y: 620, facing: 'left' },
        when: when({ noFlags: ['ch2.sweetChosen'] }),
        icon: 'sweet-trolley',
        onInteract: [dialogueStart('ch2.dialogue.trolleySweets')],
      }),
      actionHotspot({
        id: 'ch2.train.window',
        hitArea: rect(500, 170, 330, 250),
        approach: { x: 620, y: 620, facing: 'right' },
        when: when({ allFlags: ['ch2.sweetReactionSeen'], noFlags: ['ch2.trainComplete'] }),
        icon: 'castle-window',
        onInteract: [
          flagSet('ch2.trainComplete'),
          travel('ch2.lakeVista', 'vista'),
        ],
      }),
    ],
  }),
});

export const lakeVistaScene = defineScene({
  id: 'ch2.scene.lakeVista',
  order: 50,
  room: 'ch2.lakeVista',
  spawn: 'vista',
  when: when({ allFlags: ['ch2.trainComplete'], noFlags: ['ch2.lakeSeen'] }),
  onEnter: [setPiecePlay('ch2.setPiece.lakeVista')],
  quest,
  resumeAt: { room: 'ch2.lakeVista', spawn: 'vista' },
  layer: storyLayer(),
});

export const greatHallScene = defineScene({
  id: 'ch2.scene.greatHall',
  order: 60,
  room: 'ch2.greatHall',
  spawn: 'doors',
  when: when({ allFlags: ['ch2.lakeSeen'], noFlags: ['ch2.greatHallEntered'] }),
  onEnter: [],
  quest,
  resumeAt: { room: 'ch2.greatHall', spawn: 'doors' },
  layer: storyLayer({
    occupants: [
      occupant('ch2.npc.deputyHead', 860, 620, 'left'),
      occupant('ch2.npc.headmaster', 1080, 560, 'left', 'seated'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch2.greatHall.deputyHead',
        hitArea: circle(860, 500, 112),
        approach: { x: 740, y: 620, facing: 'right' },
        icon: 'talk',
        onInteract: [dialogueStart('ch2.dialogue.greatHallWelcome')],
      }),
    ],
  }),
});

export const sortingScene = defineScene({
  id: 'ch2.scene.sorting',
  order: 70,
  room: 'ch2.greatHall',
  spawn: 'sorting',
  when: when({ allFlags: ['ch2.greatHallEntered'], noFlags: ['ch2.sortedGryffindor'] }),
  onEnter: [],
  quest,
  resumeAt: { room: 'ch2.greatHall', spawn: 'sorting' },
  layer: storyLayer({
    occupants: [
      occupant('ch2.npc.deputyHead', 820, 620, 'left'),
      occupant('ch2.npc.sortingHat', 640, 500, 'left', 'waiting'),
      occupant('ch2.npc.headmaster', 1080, 560, 'left', 'seated'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch2.greatHall.sortingHat',
        hitArea: circle(640, 430, 112),
        approach: { x: 640, y: 620, facing: 'right' },
        icon: 'sorting-hat',
        onInteract: [dialogueStart('ch2.dialogue.sorting')],
      }),
    ],
  }),
});

export const feastScene = defineScene({
  id: 'ch2.scene.feast',
  order: 80,
  room: 'ch2.greatHall',
  spawn: 'table',
  when: when({ allFlags: ['ch2.sortedGryffindor'], noFlags: ['ch2.feastComplete'] }),
  onEnter: [],
  quest,
  roomVariant: 'gryffindor',
  resumeAt: { room: 'ch2.greatHall', spawn: 'table' },
  layer: storyLayer({
    occupants: [
      occupant('ch2.npc.headmaster', 1080, 560, 'left', 'seated'),
      occupant('ch2.npc.harry', 650, 600, 'right', 'seated'),
      occupant('ch2.npc.ron', 790, 600, 'left', 'seated'),
      occupant('ch2.npc.hermione', 920, 600, 'left', 'seated'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch2.greatHall.headmaster',
        hitArea: circle(1080, 450, 112),
        when: when({ noFlags: ['ch2.feastAwarded'] }),
        icon: 'talk',
        onInteract: [dialogueStart('ch2.dialogue.feast')],
      }),
      actionHotspot({
        id: 'ch2.greatHall.toCommonRoom',
        hitArea: rect(80, 290, 160, 350),
        approach: { x: 170, y: 620, facing: 'left' },
        when: when({ allFlags: ['ch2.feastAwarded'] }),
        icon: 'gryffindor-lion',
        onInteract: [
          flagSet('ch2.feastComplete'),
          travel('ch2.gryffindorCommonRoom', 'portraitDoor'),
        ],
      }),
    ],
  }),
});

export const commonRoomArrivalScene = defineScene({
  id: 'ch2.scene.commonRoomArrival',
  order: 90,
  room: 'ch2.gryffindorCommonRoom',
  spawn: 'portraitDoor',
  when: when({ allFlags: ['ch2.feastComplete'], noFlags: ['ch2.commonRoomArrived'] }),
  onEnter: [],
  quest,
  resumeAt: { room: 'ch2.gryffindorCommonRoom', spawn: 'portraitDoor' },
  layer: storyLayer({
    occupants: [
      occupant('ch2.npc.harry', 710, 620, 'left'),
      occupant('ch2.npc.ron', 870, 620, 'left'),
      occupant('ch2.npc.hermione', 1020, 620, 'left'),
    ],
    hotspots: [
      actionHotspot({
        id: 'ch2.commonRoom.harry',
        hitArea: circle(710, 500, 112),
        approach: { x: 590, y: 620, facing: 'right' },
        icon: 'talk',
        onInteract: [dialogueStart('ch2.dialogue.commonRoomWelcome')],
      }),
    ],
  }),
});

export const chapterCardScene = defineScene({
  id: 'ch2.scene.chapterCard',
  order: 100,
  room: 'ch2.chapterCardRoom',
  spawn: 'start',
  when: when({ allFlags: ['ch2.commonRoomArrived'], noFlags: ['ch2.complete'] }),
  onEnter: [setPiecePlay('ch2.setPiece.chapterCard')],
  quest,
  resumeAt: { room: 'ch2.chapterCardRoom', spawn: 'start' },
  layer: storyLayer(),
});

export const chapter2SceneDefinitions = Object.freeze([
  kingsCrossScene,
  barrierPlatformScene,
  trainFriendsScene,
  trolleySweetsScene,
  lakeVistaScene,
  greatHallScene,
  sortingScene,
  feastScene,
  commonRoomArrivalScene,
  chapterCardScene,
]);

export const chapter2SceneOrder = Object.freeze(chapter2SceneDefinitions.map(({ id }) => id));

export { noCondition };
