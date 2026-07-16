import { freezePureData } from '../../../../content/chapterAuthoring.js';
import {
  circle,
  hagridLayoutBounds,
  noCondition,
  roomSize,
  setPiecePlay,
  walkBand,
  when,
} from '../authoring.js';

export const courtyardRoom = freezePureData({
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
    { npc: 'npc.guide', x: 330, y: 610, facing: 'right', pose: 'idle', when: noCondition, render: { layoutBounds: hagridLayoutBounds } },
  ],
  hotspots: [
    {
      id: 'courtyard.brickWall',
      kind: 'action',
      hitArea: circle(700, 330, 180),
      approach: { x: 650, y: 610, facing: 'right' },
      when: when({ noFlags: ['ch1.wallOpened'] }),
      presentation: { icon: 'sparkle', glow: 'objective' },
      repeat: 'once',
      requiredSpell: null,
      onInteract: [setPiecePlay('sp.brickWall')],
    },
  ],
  ambientSetPieces: [],
}, 'Chapter One courtyard room draft');
