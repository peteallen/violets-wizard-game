import { freezePureData } from '../../../../content/chapterAuthoring.js';
import {
  circle,
  dialogueStart,
  hagridLayoutBounds,
  noCondition,
  streetSize,
  walkBand,
  when,
} from '../authoring.js';

export const diagonStreetRoom = freezePureData({
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
      hitArea: circle(295, 455, 100),
      to: { room: 'ch1.ollivanders', spawn: 'ollivanders.entry' },
      icon: 'door',
      transition: 'ink',
      when: when({ allFlags: ['ch1.satchelReceived'] }),
    },
    {
      id: 'street.malkinsDoor',
      hitArea: circle(710, 455, 100),
      to: { room: 'ch1.malkins', spawn: 'malkins.entry' },
      icon: 'door',
      transition: 'ink',
      when: when({ allFlags: ['ch1.wandChosen'] }),
    },
    {
      id: 'street.menagerieDoor',
      hitArea: circle(1140, 455, 100),
      to: { room: 'ch1.menagerie', spawn: 'menagerie.entry' },
      icon: 'door',
      transition: 'ink',
      when: when({ allFlags: ['ch1.trimChosen'] }),
    },
  ],
  occupants: [
    { npc: 'npc.violet', x: 180, y: 610, facing: 'right', pose: 'idle', when: noCondition },
    { npc: 'npc.guide', x: 260, y: 610, facing: 'right', pose: 'idle', when: when({ noFlags: ['ch1.satchelReceived'] }), render: { layoutBounds: hagridLayoutBounds } },
    { npc: 'npc.guide', x: 490, y: 610, facing: 'right', pose: 'idle', when: when({ allFlags: ['ch1.satchelReceived'], noFlags: ['ch1.petNamed'] }), render: { layoutBounds: hagridLayoutBounds } },
    { npc: 'npc.guide', x: 490, y: 610, facing: 'right', pose: 'idle', when: when({ allFlags: ['ch1.petNamed'] }), render: { layoutBounds: hagridLayoutBounds } },
  ],
  hotspots: [
    {
      id: 'street.guide',
      kind: 'talk',
      hitArea: circle(260, 465, 95),
      approach: { x: 370, y: 610, facing: 'left' },
      when: when({ allFlags: ['ch1.wallOpened'], noFlags: ['ch1.satchelReceived'] }),
      presentation: { icon: 'talk', glow: 'objective' },
      repeat: 'until-condition',
      requiredSpell: null,
      onInteract: [dialogueStart('ch1.guide.map')],
    },
    {
      id: 'street.guideTicket',
      kind: 'talk',
      hitArea: circle(490, 465, 95),
      approach: { x: 600, y: 610, facing: 'left' },
      when: when({ allFlags: ['ch1.petNamed'], noFlags: ['ch1.ticketReceived'] }),
      presentation: { icon: 'ticket', glow: 'objective' },
      repeat: 'once',
      requiredSpell: null,
      onInteract: [dialogueStart('ch1.guide.ticket')],
    },
  ],
  ambientSetPieces: ['am.inkTransitions'],
}, 'Chapter One Diagon Alley street room draft');
