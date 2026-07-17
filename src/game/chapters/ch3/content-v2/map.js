import {
  noCondition,
  travel,
  when,
} from './authoring.js';

function location({
  id,
  asset,
  caption,
  to,
  objectiveTarget,
  vignette,
  alwaysUnlocked = false,
  unlockWhen = noCondition,
  completeWhen = noCondition,
}) {
  return {
    id,
    icon: asset,
    art: asset,
    caption,
    alwaysUnlocked,
    unlockWhen,
    completeWhen,
    to,
    objectiveTarget,
    vignette,
    onSelect: [travel(to.room, to.spawn, 'sparkle')],
  };
}

export const chapter3CastleMap = Object.freeze({
  id: 'ch3.map.castle',
  asset: 'maps/ch3/castle',
  locations: [
    location({
      id: 'ch3.map.commonRoom',
      asset: 'maps/ch3/destination-common-room',
      caption: 'Common room',
      alwaysUnlocked: true,
      completeWhen: when({ allFlags: ['ch3.spellbookOpened'] }),
      to: { room: 'ch3.commonRoom', spawn: 'map' },
      objectiveTarget: { room: 'ch3.commonRoom', hotspot: 'ch3.commonRoom.postOwl' },
      vignette: { x: 70, y: 300, width: 180, height: 230 },
    }),
    location({
      id: 'ch3.map.charmsClassroom',
      asset: 'maps/ch3/destination-charms-classroom',
      caption: 'Charms class',
      unlockWhen: when({ allFlags: ['ch3.spellbookOpened'] }),
      completeWhen: when({ allFlags: ['ch3.toadQuestAccepted'] }),
      to: { room: 'ch3.charmsClassroom', spawn: 'map' },
      objectiveTarget: { room: 'ch3.charmsClassroom', hotspot: 'ch3.charms.flitwickLumos' },
      vignette: { x: 310, y: 265, width: 180, height: 230 },
    }),
    location({
      id: 'ch3.map.corridorOne',
      asset: 'maps/ch3/destination-corridor-one',
      caption: 'First corridor',
      unlockWhen: when({ allFlags: ['ch3.toadQuestAccepted'] }),
      completeWhen: when({ allFlags: ['ch3.trailFound'] }),
      to: { room: 'ch3.corridorOne', spawn: 'map' },
      objectiveTarget: { room: 'ch3.corridorOne', hotspot: 'ch3.corridorOne.alcove' },
      vignette: { x: 550, y: 315, width: 180, height: 230 },
    }),
    location({
      id: 'ch3.map.corridorTwo',
      asset: 'maps/ch3/destination-corridor-two',
      caption: 'Second corridor',
      unlockWhen: when({ allFlags: ['ch3.trailFound'] }),
      completeWhen: when({ allFlags: ['ch3.corridorClueFound'] }),
      to: { room: 'ch3.corridorTwo', spawn: 'map' },
      objectiveTarget: { room: 'ch3.corridorTwo', hotspot: 'ch3.corridorTwo.cardAlcove' },
      vignette: { x: 790, y: 270, width: 180, height: 230 },
    }),
    location({
      id: 'ch3.map.corridorThree',
      asset: 'maps/ch3/destination-corridor-three',
      caption: 'Third corridor',
      unlockWhen: when({ allFlags: ['ch3.corridorClueFound'] }),
      completeWhen: when({ allFlags: ['ch3.toadFound'] }),
      to: { room: 'ch3.corridorThree', spawn: 'map' },
      objectiveTarget: { room: 'ch3.corridorThree', hotspot: 'ch3.corridorThree.alcove' },
      vignette: { x: 1030, y: 305, width: 180, height: 230 },
    }),
  ],
  routes: [
    {
      id: 'ch3.route.commonToCharms',
      from: 'ch3.map.commonRoom',
      to: 'ch3.map.charmsClassroom',
      points: [{ x: 250, y: 410 }, { x: 280, y: 368 }, { x: 310, y: 380 }],
    },
    {
      id: 'ch3.route.charmsToCorridorOne',
      from: 'ch3.map.charmsClassroom',
      to: 'ch3.map.corridorOne',
      points: [{ x: 490, y: 380 }, { x: 520, y: 420 }, { x: 550, y: 430 }],
    },
    {
      id: 'ch3.route.corridorOneToTwo',
      from: 'ch3.map.corridorOne',
      to: 'ch3.map.corridorTwo',
      points: [{ x: 730, y: 430 }, { x: 760, y: 382 }, { x: 790, y: 385 }],
    },
    {
      id: 'ch3.route.corridorTwoToThree',
      from: 'ch3.map.corridorTwo',
      to: 'ch3.map.corridorThree',
      points: [{ x: 970, y: 385 }, { x: 1000, y: 420 }, { x: 1030, y: 420 }],
    },
  ],
});

export const chapter3MapDefinitions = Object.freeze([chapter3CastleMap]);
