import { defineScene } from '../../../../content/chapterAuthoring.js';
import { when } from '../authoring.js';

export const freeRoamScene = defineScene({
  id: 'ch1.freeRoam',
  room: 'ch1.diagonStreet',
  spawn: 'west',
  order: 11,
  quest: null,
  when: when({ allFlags: ['ch1.complete'] }),
  roomVariant: 'dusk',
  onEnter: [],
});
