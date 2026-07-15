import { defineRoom } from '../../../../content/chapterAuthoring.js';
import { roomSize, walkBand } from '../authoring.js';

export const chapterCardRoom = defineRoom({
  id: 'ch1.chapterCardRoom',
  size: roomSize,
  background: { layers: ['chapterCards/ch1/platform'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
  walkBand,
  spawns: { start: { x: 640, y: 610, facing: 'right' } },
  exits: [],
  occupants: [],
  hotspots: [],
  ambientSetPieces: [],
});
