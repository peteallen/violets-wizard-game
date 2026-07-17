import { defineRoom } from '../../../content/chapterAuthoring.js';
import {
  actionHotspot,
  circle,
  noCondition,
  rewardGrant,
} from './authoring.js';

const size = Object.freeze({ width: 1280, height: 720 });
const standardWalkBand = Object.freeze({ top: 560, bottom: 640 });
const quietWalkBand = Object.freeze({ top: 600, bottom: 640 });

function room({ id, layers, variants = {}, spawns, walkBand = standardWalkBand, hotspots = [] }) {
  return defineRoom({
    id,
    size,
    background: {
      layers,
      fit: 'cover',
      focalPoint: { x: 0.5, y: 0.5 },
      variants,
    },
    walkBand,
    spawns,
    exits: [],
    occupants: [],
    hotspots,
    ambientSetPieces: [],
  });
}

export const kingsCrossRoom = room({
  id: 'ch2.kingsCross',
  layers: ['rooms/ch2/kings-cross'],
  variants: { platform: ['rooms/ch2/platform'] },
  spawns: {
    start: { x: 180, y: 620, facing: 'right' },
    barrier: { x: 820, y: 620, facing: 'right' },
    platform: { x: 220, y: 620, facing: 'right' },
  },
});

export const trainCompartmentRoom = room({
  id: 'ch2.trainCompartment',
  layers: ['rooms/ch2/train-compartment'],
  spawns: {
    door: { x: 180, y: 620, facing: 'right' },
    window: { x: 620, y: 620, facing: 'left' },
  },
  hotspots: [
    actionHotspot({
      id: 'ch2.train.card',
      hitArea: circle(1080, 430, 92),
      when: noCondition,
      icon: 'frog-card',
      kind: 'collectible',
      glow: 'hidden',
      repeat: 'once',
      onInteract: [rewardGrant('ch2.reward.card.train', { cards: ['merlin'] })],
    }),
  ],
});

export const lakeVistaRoom = room({
  id: 'ch2.lakeVista',
  layers: ['rooms/ch2/lake-vista'],
  walkBand: quietWalkBand,
  // The foreground skiff is part of the painted composition. Staging Violet
  // here lets the animated hull pass in front of her feet, so the crossing
  // reads as a boat trip instead of characters standing on the lake.
  spawns: { vista: { x: 230, y: 620, facing: 'right' } },
});

export const greatHallRoom = room({
  id: 'ch2.greatHall',
  layers: ['rooms/ch2/great-hall'],
  variants: {
    gryffindor: ['rooms/ch2/great-hall'],
  },
  spawns: {
    doors: { x: 180, y: 620, facing: 'right' },
    sorting: { x: 560, y: 620, facing: 'right' },
    table: { x: 420, y: 620, facing: 'right' },
  },
  hotspots: [
    actionHotspot({
      id: 'ch2.greatHall.card',
      hitArea: circle(400, 475, 92),
      when: noCondition,
      icon: 'frog-card',
      kind: 'collectible',
      glow: 'hidden',
      repeat: 'once',
      onInteract: [rewardGrant('ch2.reward.card.greatHall', { cards: ['jocunda-sykes'] })],
    }),
  ],
});

export const gryffindorCommonRoom = room({
  id: 'ch2.gryffindorCommonRoom',
  layers: ['rooms/ch2/gryffindor-common-room'],
  spawns: { portraitDoor: { x: 180, y: 620, facing: 'right' } },
});

export const chapterCardRoom = room({
  id: 'ch2.chapterCardRoom',
  layers: ['chapterCards/ch2/gryffindor-home'],
  walkBand: quietWalkBand,
  spawns: { start: { x: 640, y: 620, facing: 'right' } },
});

export const chapter2RoomDefinitions = Object.freeze([
  kingsCrossRoom,
  trainCompartmentRoom,
  lakeVistaRoom,
  greatHallRoom,
  gryffindorCommonRoom,
  chapterCardRoom,
]);
