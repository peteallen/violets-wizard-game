import { freezePureData } from '../../../../content/chapterAuthoring.js';
import {
  circle,
  dialogueStart,
  noCondition,
  rect,
  roomSize,
  standardSpeakerLayoutBounds,
  walkBand,
  when,
} from '../authoring.js';

export const malkinsRoom = freezePureData({
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
      hitArea: rect(260, 160, 180, 420),
      to: { room: 'ch1.diagonStreet', spawn: 'street.west' },
      icon: 'door',
      transition: 'ink',
      when: noCondition,
    },
  ],
  occupants: [
    { npc: 'npc.violet', x: 120, y: 610, facing: 'right', pose: 'idle', when: noCondition },
    { npc: 'npc.tailor', x: 310, y: 610, facing: 'right', pose: 'idle', when: noCondition, render: { layoutBounds: standardSpeakerLayoutBounds } },
  ],
  hotspots: [
    {
      id: 'malkins.stool',
      kind: 'action',
      hitArea: circle(670, 555, 90),
      approach: { x: 670, y: 610, facing: 'right' },
      when: when({ noFlags: ['ch1.trimChosen'] }),
      presentation: { icon: 'robes', glow: 'objective' },
      repeat: 'until-condition',
      requiredSpell: null,
      onInteract: [dialogueStart('ch1.tailor.fitting')],
    },
  ],
  ambientSetPieces: ['am.inkTransitions'],
}, 'Chapter One Madam Malkin room draft');
