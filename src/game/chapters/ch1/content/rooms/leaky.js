import { freezePureData } from '../../../../content/chapterAuthoring.js';
import {
  hagridLayoutBounds,
  noCondition,
  rect,
  roomSize,
  walkBand,
  when,
} from '../authoring.js';

export const leakyRoom = freezePureData({
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
    { npc: 'npc.guide', x: 760, y: 610, facing: 'right', pose: 'idle', when: noCondition, render: { layoutBounds: hagridLayoutBounds } },
  ],
  hotspots: [],
  ambientSetPieces: ['am.inkTransitions'],
}, 'Chapter One Leaky Cauldron room draft');
