import { defineRoom } from '../../../content/chapterAuthoring.js';

const size = Object.freeze({ width: 1280, height: 720 });
const walkBand = Object.freeze({ top: 560, bottom: 640 });

function room({ id, layer, spawns, lighting = null }) {
  return defineRoom({
    id,
    size,
    background: {
      layers: [layer],
      fit: 'cover',
      focalPoint: { x: 0.5, y: 0.5 },
      variants: {},
    },
    walkBand,
    spawns,
    exits: [],
    occupants: [],
    hotspots: [],
    ambientSetPieces: [],
    ...(lighting ? { lighting } : {}),
  });
}

export const commonRoom = room({
  id: 'ch3.commonRoom',
  layer: 'rooms/ch3/common-room-autumn',
  spawns: {
    parcel: { x: 360, y: 620, facing: 'right' },
    map: { x: 180, y: 620, facing: 'right' },
    close: { x: 640, y: 620, facing: 'right' },
  },
});

export const charmsClassroom = room({
  id: 'ch3.charmsClassroom',
  layer: 'rooms/ch3/charms-classroom',
  spawns: {
    door: { x: 180, y: 620, facing: 'right' },
    lesson: { x: 430, y: 620, facing: 'right' },
    map: { x: 180, y: 620, facing: 'right' },
  },
});

export const corridorOne = room({
  id: 'ch3.corridorOne',
  layer: 'rooms/ch3/corridor-one',
  spawns: {
    entry: { x: 160, y: 620, facing: 'right' },
    map: { x: 180, y: 620, facing: 'right' },
    return: { x: 1040, y: 620, facing: 'left' },
  },
  lighting: { darkness: 0.78 },
});

export const corridorTwo = room({
  id: 'ch3.corridorTwo',
  layer: 'rooms/ch3/corridor-two',
  spawns: {
    entry: { x: 160, y: 620, facing: 'right' },
    map: { x: 180, y: 620, facing: 'right' },
  },
  lighting: { darkness: 0.76 },
});

export const corridorThree = room({
  id: 'ch3.corridorThree',
  layer: 'rooms/ch3/corridor-three',
  spawns: {
    entry: { x: 160, y: 620, facing: 'right' },
    map: { x: 180, y: 620, facing: 'right' },
  },
  lighting: { darkness: 0.8 },
});

export const chapter3RoomDefinitions = Object.freeze([
  commonRoom,
  charmsClassroom,
  corridorOne,
  corridorTwo,
  corridorThree,
]);
