import { defineScene } from '../../../../content/chapterAuthoring.js';
import { when } from '../authoring.js';

export const ticketScene = defineScene({
  id: 'ch1.ticket',
  room: 'ch1.diagonStreet',
  spawn: 'east',
  order: 9,
  quest: 'ch1.returnToGuide',
  when: when({ allFlags: ['ch1.petNamed'], noFlags: ['ch1.ticketReceived'] }),
  roomVariant: 'dusk',
  onEnter: [],
});
