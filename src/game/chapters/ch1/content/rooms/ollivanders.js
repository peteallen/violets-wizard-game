import { freezePureData } from '../../../../content/chapterAuthoring.js';
import {
  circle,
  dialogueStart,
  flagSet,
  noCondition,
  rect,
  roomSize,
  setPiecePlay,
  standardSpeakerLayoutBounds,
  walkBand,
  when,
} from '../authoring.js';

export const ollivandersRoom = freezePureData({
  id: 'ch1.ollivanders',
  size: roomSize,
  background: { layers: ['rooms/ch1/ollivanders/base'], fit: 'cover', focalPoint: { x: 0.5, y: 0.5 }, variants: {} },
  walkBand,
  spawns: {
    'ollivanders.entry': { x: 120, y: 610, facing: 'right' },
    'ollivanders.wandmaker': { x: 285, y: 610, facing: 'right' },
  },
  exits: [
    {
      id: 'ollivanders.exit',
      hitArea: rect(0, 150, 150, 430),
      to: { room: 'ch1.diagonStreet', spawn: 'street.west' },
      icon: 'door',
      transition: 'ink',
      when: noCondition,
    },
  ],
  occupants: [
    { npc: 'npc.violet', x: 120, y: 610, facing: 'right', pose: 'idle', when: noCondition },
    { npc: 'npc.wandmaker', x: 285, y: 610, facing: 'right', pose: 'idle', when: noCondition, render: { layoutBounds: standardSpeakerLayoutBounds } },
  ],
  hotspots: [
    {
      id: 'ollivanders.wand1',
      kind: 'action',
      // The generous touch target is centered on the painted blue wand
      // case. The approach remains farther right so Violet has clear
      // floor space for the authored wrong-wand performance.
      hitArea: circle(535, 382, 90),
      approach: { x: 690, y: 610, facing: 'right' },
      when: when({ noFlags: ['ch1.wandTry1'] }),
      presentation: { icon: 'wand', glow: 'objective' },
      repeat: 'once',
      requiredSpell: null,
      onInteract: [flagSet('ch1.wandTry1'), setPiecePlay('sp.wandChaos1'), dialogueStart('ch1.wandmaker.wrong1')],
    },
    {
      id: 'ollivanders.wand2',
      kind: 'action',
      hitArea: circle(782, 382, 90),
      approach: { x: 910, y: 610, facing: 'right' },
      when: when({ allFlags: ['ch1.wandTry1'], noFlags: ['ch1.wandTry2'] }),
      presentation: { icon: 'wand', glow: 'objective' },
      repeat: 'once',
      requiredSpell: null,
      onInteract: [flagSet('ch1.wandTry2'), setPiecePlay('sp.wandChaos2'), dialogueStart('ch1.wandmaker.wrong2')],
    },
    {
      id: 'ollivanders.wand3',
      kind: 'action',
      hitArea: circle(1054, 382, 100),
      approach: { x: 1080, y: 610, facing: 'right' },
      when: when({ allFlags: ['ch1.wandTry2'], noFlags: ['ch1.wandChosen'] }),
      presentation: { icon: 'wand', glow: 'objective' },
      repeat: 'once',
      requiredSpell: null,
      onInteract: [
        { type: 'character.set', field: 'wandId', value: 'violet-first-wand' },
        flagSet('ch1.wandChosen'),
        setPiecePlay('sp.wandChosen'),
        { type: 'yearbook.capture', moment: 'ch1.wandChosen' },
        dialogueStart('ch1.wandmaker.chosen'),
      ],
    },
    {
      id: 'ollivanders.cardMorgana',
      kind: 'collectible',
      hitArea: circle(1060, 170, 60),
      approach: { x: 1030, y: 610, facing: 'right' },
      when: noCondition,
      presentation: { icon: 'frog-card', glow: 'hidden' },
      repeat: 'once',
      requiredSpell: null,
      onInteract: [{ type: 'collection.add', collection: 'cards', id: 'morgana' }],
    },
  ],
  ambientSetPieces: ['am.inkTransitions'],
}, 'Chapter One Ollivanders room draft');
