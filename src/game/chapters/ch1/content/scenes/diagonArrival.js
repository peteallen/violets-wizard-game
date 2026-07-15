import { defineScene } from '../../../../content/chapterAuthoring.js';
import { dialogueStart, flagSet, when } from '../authoring.js';

export const diagonMapIntroScene = defineScene({
  id: 'ch1.diagonMapIntro',
  room: 'ch1.diagonStreet',
  spawn: 'west',
  order: 4,
  quest: 'ch1.useMap',
  when: when({ allFlags: ['ch1.wallOpened'], noFlags: ['ch1.satchelReceived'] }),
  roomVariant: 'day',
  onEnter: [flagSet('ch1.diagonReached'), dialogueStart('ch1.guide.map')],
});

export const diagonArrivalScene = defineScene({
  id: 'ch1.diagonArrival',
  room: 'ch1.diagonStreet',
  spawn: 'west',
  order: 5,
  quest: 'ch1.useMap',
  when: when({
    allFlags: ['ch1.wallOpened', 'ch1.satchelReceived'],
    noFlags: ['ch1.shoppingComplete'],
  }),
  roomVariant: 'day',
  onEnter: [flagSet('ch1.diagonReached')],
});
